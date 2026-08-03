"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA/offline support. No-ops in development
 * (to avoid interfering with HMR) and when service workers are unsupported.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
