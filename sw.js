/* IRONCLAD CRM service worker — caches the app shell for offline / Home Screen. */
var CACHE = "ironclad-crm-v46.2";
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
  "./js/job-tabs.js",
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
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === "basic") {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req);
    })
  );
});

try {
  importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");
  firebase.initializeApp({
    apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
    authDomain: "ironclad-127a5.firebaseapp.com",
    projectId: "ironclad-127a5",
    storageBucket: "ironclad-127a5.firebasestorage.app",
    messagingSenderId: "57257280088",
    appId: "1:57257280088:web:189e4db32d7ae28523402d",
  });
  firebase.messaging().onBackgroundMessage(function (payload) {
    var n = (payload && payload.notification) || {};
    return self.registration.showNotification(n.title || "IRONCLAD", {
      body: n.body || "",
      icon: "./brand/logo.png",
      badge: "./icon-192.png",
      data: (payload && payload.data) || {},
    });
  });
} catch (err) { /* FCM optional when offline / first install */ }

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var jobId = event.notification.data && event.notification.data.jobId;
  var url = jobId ? "./#/jobs/" + jobId : "./#/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length) {
        clientList[0].postMessage({ type: "ironclad-open", url: url });
        return clientList[0].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
