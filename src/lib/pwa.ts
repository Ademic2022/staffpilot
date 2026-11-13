/**
 * The installable app (public/sw.js, app/manifest.ts): registering the service worker, the
 * browser's install prompt, and push subscriptions for this device.
 */

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallPrompt | null = null;
let version = 0; // moves on whenever the install prompt arrives or is used
const listeners = new Set<() => void>();
const changed = () => { version += 1; listeners.forEach((l) => l()); };

/** For useSyncExternalStore: re-render when the install prompt changes. */
export const pwaVersion = () => version;

/** Once, on load: register the service worker and keep the install prompt for an "Install app" button. */
export function setUpPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => { /* not fatal: the site still works */ });
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallPrompt; changed(); });
  window.addEventListener("appinstalled", () => { deferred = null; changed(); });
}

export function onPwaChange(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Opened from the home-screen icon rather than a browser tab. */
export function isInstalled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPhone and iPad Safari: no install prompt, so people are shown how to add it themselves. */
export function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function canPromptInstall() {
  return deferred !== null;
}

/** Show the browser's own install dialog. True when the person installed it. */
export async function promptInstall() {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  changed();
  return outcome === "accepted";
}

/* ------------------------------------------------------------------ Push */

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function currentPushSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Ask permission and subscribe this device. Returns the subscription's parts for the server, or a reason it failed. */
export async function subscribePush(publicKey: string): Promise<{ endpoint: string; p256dh: string; auth: string } | string> {
  if (!pushSupported()) return "This browser cannot show notifications.";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "Notifications are blocked for this site. Allow them in your browser settings, then try again.";
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "This browser did not give a usable subscription.";
  return { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth };
}
