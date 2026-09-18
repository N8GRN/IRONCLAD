/* IRONCLAD CRM service worker — caches the app shell for offline / Home Screen. */
var CACHE = "ironclad-crm-v1";
var SHELL = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/config.js",
  "./js/util.js",
  "./js/catalog.js",
  "./js/estimate.js",
  "./js/seed.js",
  "./js/contract.js",
  "./js/store.js",
  "./js/firebase.js",
  "./js/ui.js",
  "./js/views.js",
  "./js/app.js",
  "./brand/logo.png",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(SHELL).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    caches.match(req).then(function (cached) {
      var fetched = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});
