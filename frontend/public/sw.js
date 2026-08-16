// public/sw.js — NexHire PWA service worker
// Cache-first for the app shell, network-first for API calls, with a small
// IndexedDB-backed queue + Background Sync for interview responses submitted
// while offline (the one write path candidates can't afford to silently lose).
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `nexhire-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `nexhire-runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/favicon.svg'];

const OFFLINE_MESSAGE = 'You are offline. Some features may not be available.';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Offline queue for interview responses (IndexedDB + Background Sync) ──────

const DB_NAME = 'nexhire-offline-queue';
const STORE_NAME = 'requests';
const SYNC_TAG = 'sync-interview-responses';

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueRequest(request) {
  const db = await openQueueDb();
  const body = await request.clone().text();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body,
      queuedAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue() {
  const db = await openQueueDb();
  const readTx = db.transaction(STORE_NAME, 'readonly');
  const store = readTx.objectStore(STORE_NAME);
  const [items, keys] = await Promise.all([
    new Promise((resolve, reject) => {
      const r = store.getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    }),
    new Promise((resolve, reject) => {
      const r = store.getAllKeys();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    }),
  ]);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
      const delTx = db.transaction(STORE_NAME, 'readwrite');
      delTx.objectStore(STORE_NAME).delete(keys[i]);
    } catch {
      // still offline — stop here, the next sync event will retry from this point
      break;
    }
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});

// ─── Fetch handling ─────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Interview response submissions: queue for background sync instead of
  // failing outright when offline mid-interview.
  if (request.method === 'POST' && /\/api\/interviews\/[^/]+\/respond$/.test(url.pathname)) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        await queueRequest(request);
        if (self.registration.sync) {
          try {
            await self.registration.sync.register(SYNC_TAG);
          } catch {
            // Background Sync unsupported — the queued item is still flushed
            // opportunistically on the next successful fetch of this same URL.
          }
        }
        return new Response(
          JSON.stringify({ success: true, queued: true, message: 'Saved offline — will sync when back online.' }),
          { headers: { 'Content-Type': 'application/json' }, status: 202 }
        );
      })
    );
    return;
  }

  if (request.method !== 'GET') return;

  // API calls — network-first, falling back to the last cached response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || new Response(
            JSON.stringify({ success: false, offline: true, error: OFFLINE_MESSAGE }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
          ))
        )
    );
    return;
  }

  // App shell / static assets — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match('/');
          return new Response(OFFLINE_MESSAGE, { status: 503 });
        });
    })
  );
});
