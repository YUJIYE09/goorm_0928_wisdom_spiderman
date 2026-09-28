// 정적 자산만 캐시한다. 사용자 기록(IndexedDB)은 캐시와 무관하다.
// 배포할 때마다 VERSION을 올리면 새 서비스 워커가 설치되고, 앱이 「새로 고침」 안내를 띄운다.
const VERSION = '2.0.0';
const CACHE = `spider-quotes-static-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/spider-quotes.css',
  './styles/tokens.css',
  './src/spider-quotes.js',
  './data/quotes.json',
  './assets/city-1.svg',
  './assets/city-2.svg',
  './assets/city-3.svg',
  './assets/city-4.svg',
  './assets/icon.svg',
];
// 로컬 개발 중에는 네트워크를 먼저 사용해 수정 사항이 바로 보이게 한다.
const DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => (k.startsWith('one-line-static-') || k.startsWith('spider-quotes-static-')) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(request) {
  const hit = await caches.match(request, { ignoreSearch: true });
  return hit || fetch(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const shell = new URL('./index.html', self.registration.scope).href;
    event.respondWith(DEV
      ? fetch(request).catch(() => caches.match(shell))
      : caches.match(shell).then((hit) => hit || fetch(request)));
    return;
  }
  event.respondWith(DEV ? networkFirst(request) : cacheFirst(request));
});
