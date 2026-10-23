// Processus principal de l'app de bureau Sigma.
// Lance en interne le même serveur que server.ts (routes /api/* + build Vite) puis l'affiche dans une fenêtre.

import { app, BrowserWindow, session, shell } from 'electron';
import { config } from 'dotenv';
import express from 'express';
import path from 'path';
import type { AddressInfo } from 'net';

// Variables Albert injectées au build depuis .env.local (voir scripts/build-electron.mjs).
declare const __SIGMA_ENV__: Record<string, string>;

// Port fixe : le localStorage (où sont stockés les projets) dépend de l'origine http://127.0.0.1:<port>.
const PORT = 47321;

function loadEnv() {
  // Un fichier .env dans le dossier de données de l'app permet de changer de clé sans rebuild.
  config({ path: path.join(app.getPath('userData'), '.env') });
  for (const [key, value] of Object.entries(__SIGMA_ENV__)) {
    if (!process.env[key] && value) process.env[key] = value;
  }
  process.env.SIGMA_CORPUS_DIR = app.isPackaged
    ? path.join(process.resourcesPath, 'corpus')
    : path.join(app.getAppPath(), 'data', 'corpus');
}

async function startServer(): Promise<number> {
  const [{ default: chatHandler }, { default: generateHandler }, { default: importHandler }] = await Promise.all([
    import('../api/chat'),
    import('../api/generate'),
    import('../api/import'),
  ]);

  const distDir = path.join(app.getAppPath(), 'dist');
  const server = express();
  server.use(express.json({ limit: '10mb' }));
  server.post('/api/chat', chatHandler);
  server.post('/api/generate', generateHandler);
  server.post('/api/import', importHandler);
  server.use(express.static(distDir));
  server.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

  const listen = (port: number) => new Promise<number>((resolve, reject) => {
    const instance = server.listen(port, '127.0.0.1', () => resolve((instance.address() as AddressInfo).port));
    instance.once('error', reject);
  });

  try {
    return await listen(PORT);
  } catch {
    return listen(0);
  }
}

async function createWindow(port: number) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Sigma',
    autoHideMenuBar: true,
    backgroundColor: '#FFFFFF',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  await win.loadURL(`http://127.0.0.1:${port}/`);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    loadEnv();
    // Le service worker de la PWA servirait une version en cache après une mise à jour de l'app.
    await session.defaultSession.clearStorageData({ storages: ['serviceworkers', 'cachestorage'] });
    const port = await startServer();
    await createWindow(port);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
