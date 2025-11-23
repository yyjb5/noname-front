// Service worker removed: no-op stub.
// This file intentionally keeps a minimal install/activate handler
// so that if /sw.js is still referenced by older clients it will
// not perform caching or background sync. For static Vite deployments
// we recommend removing any references to the service worker (done in
// source code) so this stub is never registered.

self.addEventListener('install', (e) => {
  // immediately take control
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});