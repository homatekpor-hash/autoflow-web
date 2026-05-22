"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then(reg => {
      console.log("[ShopLink] Service worker registered:", reg.scope);

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "TRIGGER_SYNC") {
          // Trigger sync from IndexedDB queue
          import("@/lib/offline/sync").then(({ syncNow }) => syncNow());
        }
      });
    }).catch(err => {
      console.warn("[ShopLink] Service worker registration failed:", err);
    });
  }, []);
}
