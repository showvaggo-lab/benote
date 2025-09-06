// ক্যাশের নাম (ভার্সন বদলালে নতুন ক্যাশ হবে)
const CACHE = 'benote-v2';

// যেসব ফাইল আগে থেকে ক্যাশে রাখা হবে
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './libs/html2pdf.bundle.min.js' // ← লোকাল html2pdf ফাইল যোগ করা হলো
];

// Install event (প্রথমবার ইনস্টল হলে ফাইল ক্যাশ হবে)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate event (পুরোনো ক্যাশ ডিলিট হবে)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch event (নেটওয়ার্ক ফার্স্ট + অফলাইন ফলোব্যাক)
self.addEventListener('fetch', e => {
  const req = e.request;

  // HTML নেভিগেশন হলে: নেটওয়ার্ক ফার্স্ট, অফলাইনে index.html
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
  } else {
    // অন্য সব রিসোর্সে: ক্যাশ ফার্স্ট
    e.respondWith(
      caches.match(req).then(res => {
        return (
          res ||
          fetch(req).then(netRes => {
            // নতুন ফাইল নেট থেকে আসলে ক্যাশে রেখে দেবে
            const copy = netRes.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
            return netRes;
          })
        );
      })
    );
  }
});
