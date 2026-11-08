export interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface InstallPromptSnapshot {
  isStandalone: boolean;
  hasDeferredPrompt: boolean;
}

const subscribers = new Set<() => void>();
let deferredPrompt: DeferredInstallPrompt | null = null;
let installed = false;
let initialized = false;
let snapshot: InstallPromptSnapshot = { isStandalone: false, hasDeferredPrompt: false };

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean(navigator.standalone));
}

function publish() {
  const next = { isStandalone: installed || isStandalone(), hasDeferredPrompt: Boolean(deferredPrompt) };
  if (next.isStandalone === snapshot.isStandalone && next.hasDeferredPrompt === snapshot.hasDeferredPrompt) return;
  snapshot = next;
  subscribers.forEach((subscriber) => subscriber());
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  snapshot = { isStandalone: isStandalone(), hasDeferredPrompt: false };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as DeferredInstallPrompt;
    publish();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    publish();
  });
  window.matchMedia("(display-mode: standalone)").addEventListener("change", publish);
}

export function subscribeInstallPrompt(subscriber: () => void) {
  initialize();
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

export function getInstallPromptSnapshot() {
  initialize();
  return snapshot;
}

export async function attemptNavigatorInstall() {
  initialize();
  const install = (navigator as Navigator & { install?: () => Promise<void> }).install;
  if (typeof install !== "function") return false;
  await install.call(navigator);
  installed = true;
  deferredPrompt = null;
  publish();
  return true;
}

export async function promptInstallApp(): Promise<"accepted" | "dismissed" | null> {
  initialize();
  const event = deferredPrompt;
  if (!event) return null;
  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") installed = true;
    return choice.outcome;
  } finally {
    if (deferredPrompt === event) deferredPrompt = null;
    publish();
  }
}

initialize();
