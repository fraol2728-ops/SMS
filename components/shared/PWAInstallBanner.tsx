"use client";

import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      iosTimer = setTimeout(() => {
        const iosDismissed = localStorage.getItem("pwa-ios-dismissed");
        if (!iosDismissed) setShowBanner(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "1");
    if (isIOS) localStorage.setItem("pwa-ios-dismissed", "1");
  }

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 duration-300 animate-in slide-in-from-bottom-4 sm:left-auto sm:max-w-sm">
      <div className="rounded-3xl border bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black text-white text-xl shadow-md">
            E
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm dark:text-white">
              Install Exceed App
            </p>
            {isIOS ? (
              <p className="mt-1 text-gray-500 text-xs leading-relaxed dark:text-gray-400">
                Tap <span className="font-bold">Share</span> then{" "}
                <span className="font-bold">Add to Home Screen</span> to
                install.
              </p>
            ) : (
              <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
                Install for faster access and offline support.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
            aria-label="Dismiss install banner"
          >
            <X size={16} />
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 font-bold text-sm text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700"
            type="button"
          >
            <Download size={15} />
            Install App
          </button>
        )}

        {isIOS && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-blue-50 p-3 dark:bg-blue-900/20">
            <Smartphone size={14} className="flex-shrink-0 text-blue-600" />
            <p className="text-blue-700 text-xs dark:text-blue-400">
              Tap ↑ Share → Add to Home Screen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
