/**
 * Réorganise et assainit le corpus (opération ponctuelle, idempotente).
 *
 *  - data/corpus-private/ (hors git) : ouvrages sous droits, nettoyés de l'OCR
 *    (césures, mise en page par espaces, légendes de figures, passages illisibles).
 *  - data/corpus/ (versionné) : synthèse de src/narratology-data.ts + notes de lecture
 *    (fichiers .txt « Auteur - Titre.txt » lus dans NOTES_DIR).
 *
 * Usage : NOTES_DIR=<dossier> npx tsx scripts/split-clean-corpus.ts
 * Requiert ALBERT_API_KEY (.env.local) pour encoder les passages modifiés ou nouveaux.
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { EMBED_DIM, writeCorpus, type CorpusChunk } from '../api/_corpus.js';
import { embed } from '../api/_albert.js';
import { NARRATOLOGY_THEORIES } from '../src/narratology-data.ts';

config({ path: '.env.local' });

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH = 50;
const MIN_ALPHA_RATIO = 0.75;
const MIN_LENGTH = 150;

const corpusDir = path.join(process.cwd(), 'data', 'corpus');
const privateDir = path.join(process.cwd(), 'data', 'corpus-private');

// ---------- Nettoyage OCR ----------
function cleanOcr(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/(\p{L})-\n\s*(\p{L})/gu, '$1$2')             // mots coupés en fin de ligne
    .replace(/^.*\bFIGURE\s+\d+\..*$/gimu, '')              // légendes de figures
    .replace(/^\s*PAGE\s+\d+\s*$/gimu, '')
    .replace(/^[ \t]+/gm, '')                               // indentation de mise en page
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function alphaRatio(text: string): number {
  const letters = (text.match(/[\p{L}]/gu) ?? []).length;
  const visible = text.replace(/\s/g, '').length;
  return visible === 0 ? 0 : letters / visible;
}

// ---------- Découpage (même logique que index-corpus.ts) ----------
function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = start + CHUNK_SIZE;
    if (end < clean.length) {
      const paragraphEnd = clean.lastIndexOf('\n\n', end);
      if (paragraphEnd > start + CHUNK_SIZE / 2) end = paragraphEnd;
      else {
        const sentenceEnd = clean.lastIndexOf('. ', end);
        if (sentenceEnd > start + CHUNK_SIZE / 2) end = sentenceEnd + 1;
      }
    }
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 100) chunks.push(chunk);
    if (end >= clean.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedAll(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    out.push(...await embed(texts.slice(i, i + EMBED_BATCH)));
    process.stdout.write(`  ${Math.min(i + EMBED_BATCH, texts.length)}/${texts.length} encodés\r`);
    await new Promise((r) => setTimeout(r, 200));
  }
  if (texts.length) process.stdout.write('\n');
  return out;
}

// ---------- Ouvrages (privé) ----------
async function buildPrivate() {
  const chunks = JSON.parse(fs.readFileSync(path.join(corpusDir, 'chunks.json'), 'utf-8')) as CorpusChunk[];
  const buffer = fs.readFileSync(path.join(corpusDir, 'embeddings.f32'));
  const vectors = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  if (vectors.length !== chunks.length * EMBED_DIM) throw new Error('Corpus existant incohérent (déjà scindé ?)');

  const kept: CorpusChunk[] = [];
  const reuse: (number[] | null)[] = [];
  let dropped = 0, changed = 0;

  chunks.forEach((c, i) => {
    const content = cleanOcr(c.content);
    if (content.length < MIN_LENGTH || alphaRatio(content) < MIN_ALPHA_RATIO) { dropped++; return; }
    kept.push({ ...c, content });
    if (content === c.content) reuse.push(Array.from(vectors.subarray(i * EMBED_DIM, (i + 1) * EMBED_DIM)));
    else { reuse.push(null); changed++; }
  });
  console.log(`Ouvrages : ${chunks.length} → ${kept.length} passages (${dropped} écartés, ${changed} à ré-encoder)`);

  const todo = kept.map((c, i) => (reuse[i] ? -1 : i)).filter((i) => i >= 0);
  const fresh = await embedAll(todo.map((i) => kept[i].content));
  todo.forEach((idx, k) => { reuse[idx] = fresh[k]; });

  kept.forEach((c, i) => { c.chunk_index = i; });
  return { chunks: kept, embeddings: reuse as number[][] };
}

// ---------- Synthèses et notes (public) ----------
async function buildPublic(notesDir: string) {
  const chunks: CorpusChunk[] = [];

  for (const t of NARRATOLOGY_THEORIES) {
    const text = [
      `${t.author} — ${t.work} (${t.year}), tradition : ${t.tradition}`,
      t.summary,
      ...t.concepts.map((c) => `${c.name} : ${c.definition}`),
      t.useInScreenwriting ? `Usage en écriture de scénario : ${t.useInScreenwriting}` : '',
    ].filter(Boolean).join('\n\n');
    chunkText(text).forEach((content, i) => chunks.push({
      source: 'narratology-data.ts', author: t.author, title: `${t.work} (synthèse Sigma)`, chunk_index: i, content,
    }));
  }

  for (const file of fs.readdirSync(notesDir).filter((f) => f.endsWith('.txt'))) {
    const base = file.replace(/\.txt$/, '');
    const sep = base.indexOf(' - ');
    const author = sep === -1 ? 'Etienne Lavallard' : base.slice(0, sep).trim();
    const title = `${sep === -1 ? base : base.slice(sep + 3).trim()} (notes de lecture)`.replace(/\(notes de lecture\) \(notes de lecture\)/, '(notes de lecture)');
    chunkText(fs.readFileSync(path.join(notesDir, file), 'utf-8')).forEach((content, i) =>
      chunks.push({ source: file, author, title, chunk_index: i, content }));
  }

  console.log(`Synthèses et notes : ${chunks.length} passages à encoder`);
  const embeddings = await embedAll(chunks.map((c) => c.content));
  return { chunks, embeddings };
}

async function main() {
  const notesDir = process.env.NOTES_DIR;
  if (!process.env.ALBERT_API_KEY) throw new Error('Variable manquante : ALBERT_API_KEY');
  if (!notesDir || !fs.existsSync(notesDir)) throw new Error('NOTES_DIR manquant ou introuvable');

  const priv = await buildPrivate();
  const pub = await buildPublic(notesDir);
  writeCorpus(priv.chunks, priv.embeddings, true);
  writeCorpus(pub.chunks, pub.embeddings, false);
  console.log(`Écrit : corpus-private (${priv.chunks.length}) et corpus (${pub.chunks.length}).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
