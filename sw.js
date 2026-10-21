// 벨키퍼 서비스 워커 — 인터넷이 끊겨도 화면과 기본 종소리가 뜨도록 앱 파일을 저장해 둡니다.
const CACHE = 'bellkeeper-v1.0.0';
const SHELL = [
  './', './index.html', './play.html', './css/style.css',
  './js/admin.js', './js/player.js', './js/core.js', './js/sounds.js', './js/templates.js',
  './js/fb.js', './js/firebase-config.js',
  './manifest.json', './manifest-play.json',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 우리 앱 파일: 인터넷 먼저, 안 되면 저장본
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // Firebase 라이브러리·글꼴: 저장본 먼저
  if (url.hostname === 'www.gstatic.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
