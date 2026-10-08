export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // En dev, un service worker installé par un build précédent sur le même port servirait
  // des modules Vite périmés depuis son cache : on le désinstalle et on vide ses caches.
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .then(() => caches.keys())
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {});
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
