// ক্যাশের নাম (ভার্সন বদলালে পুরনো ক্যাশ অটো-ড্রপ হবে)
const CACHE = 'benote-v3';

// আগে থেকে ক্যাশে রাখা ফাইলের লিস্ট (রিলেটিভ পাথ)
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './libs/html2pdf.bundle.min.js'
];

// Install: ASSETS প্রি-ক্যাশ
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate: পুরনো ক্যাশ ডিলিট
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: HTML হলে নেটওয়ার্ক-ফার্স্ট; অন্য রিসোর্সে ক্যাশ-ফার্স্ট
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const sameOrigin = new URL(req.url).origin === self.location.origin;

  if (req.mode === 'navigate') {
    // পেজ লোড: আগে নেটওয়ার্ক, অফলাইনে index.html
    e.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // অন্যান্য রিসোর্স
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((res) => {
        // কেবল same-origin হলে ক্যাশে রাখি
        if (sameOrigin && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
