// ক্যাশের নাম (ভার্সন বদলালে পুরনো ক্যাশ অটো-ডিলিট হবে)
const CACHE = 'benote-v4';

// আগে থেকে ক্যাশে রাখা ফাইলের লিস্ট (অ্যাবসলিউট পাথ)
const ASSETS = [
  '/benote/',
  '/benote/index.html',
  '/benote/manifest.webmanifest',
  '/benote/favicon.ico',
  '/benote/favicon.svg',
  '/benote/icon-192.png',
  '/benote/icon-512.png',
  '/benote/libs/html2pdf.bundle.min.js'
];

// Install: ASSETS প্রি-ক্যাশ
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate: পুরোনো ক্যাশ ডিলিট
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: HTML হলে নেটওয়ার্ক-ফার্স্ট + অফলাইনে index.html
self.addEventListener('fetch', e => {
  const req = e.request;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('/benote/index.html'))
    );
    return;
  }

  // অন্য সব রিসোর্সে: ক্যাশ-ফার্স্ট + ব্যাকগ্রাউন্ডে রিফ্রেশ
  e.respondWith(
    caches.match(req).then(res => {
      if (res) return res;
      return fetch(req).then(netRes => {
        const copy = netRes.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return netRes;
      });
    })
  );
});
