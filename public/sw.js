/*
 * StaffPilot's service worker. Three jobs, nothing more:
 *  1. Show push notifications, and open the right page when one is tapped.
 *  2. Show a friendly offline page when a page cannot load (no signal).
 *  3. Nothing else is cached: company data never sits on the device, and every page and API
 *     call always goes to the network.
 * Bump VERSION when this file or offline.html changes.
 */
const VERSION = "v2";
const OFFLINE = "/offline.html";
const OFFLINE_ASSETS = ["/icons/icon-192.png"]; // what the offline page itself needs

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll([OFFLINE, ...OFFLINE_ASSETS])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Page loads: if the network fails, show the offline page (and the icon it uses). API calls
// and everything else are never touched.
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
  } else if (OFFLINE_ASSETS.includes(new URL(event.request.url).pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || "StaffPilot", {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: data.tag,
    data: { url: data.url || "/home" },
  }));
});

// Tapping a notification: focus an open StaffPilot window on that page, or open one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || "/home";
  const url = new URL(path.startsWith("/") ? path : "/home", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && "focus" in client) {
        await client.focus();
        if ("navigate" in client) return client.navigate(url);
        return undefined;
      }
    }
    return self.clients.openWindow(url);
  })());
});
