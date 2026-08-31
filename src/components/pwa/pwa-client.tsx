"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "lf-install-dismissed";

/**
 * Registers the service worker (enables PWA install) and shows a small
 * "Install app" pill when the browser reports the app is installable.
 * iOS Safari doesn't fire beforeinstallprompt — those users install via
 * Share → Add to Home Screen, so the pill simply won't appear there.
 */
export function PwaClient() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    let dismissed = false;
    try { dismissed = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { /* ignore */ }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!dismissed) setVisible(true);
    };
    const onInstalled = () => { setVisible(false); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Linoscore Legal"
      style={{
        position: "fixed",
        left: "max(16px, env(safe-area-inset-left))",
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#1e293b",
        color: "#fff",
        borderRadius: 12,
        padding: "0.6rem 0.75rem 0.6rem 0.9rem",
        boxShadow: "0 8px 32px rgba(15,27,51,0.28)",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </svg>
      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Install Linoscore Legal</span>
      <button
        onClick={install}
        style={{ background: "#f59e0b", color: "#422006", border: "none", fontWeight: 700, fontSize: "0.82rem", padding: "0.35rem 0.75rem", borderRadius: 8, cursor: "pointer" }}
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0 0.25rem" }}
      >
        ×
      </button>
    </div>
  );
}
