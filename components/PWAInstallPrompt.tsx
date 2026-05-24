"use client";
import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show,   setShow]   = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e: any) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setShow(true), 3000);
    });
  }, []);

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="rounded-2xl border border-orange-200 bg-white shadow-2xl p-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">🚗</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Install AutoFlow Ghana</p>
          <p className="text-xs text-gray-500">Add to your home screen for quick access</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShow(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Later</button>
          <button onClick={install} className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600">Install</button>
        </div>
      </div>
    </div>
  );
}
