"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import Modal from "@/components/shared/Modal";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function getInstallGuide() {
  if (typeof navigator === "undefined") return "Open your browser menu and choose Add to Home Screen.";

  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "On iPhone, open this page in Safari, tap Share, then choose Add to Home Screen.";
  }

  if (/android/.test(userAgent)) {
    return "On Android, open the browser menu and choose Install app or Add to Home screen.";
  }

  return "Open your browser menu and choose Install app or Add to Home Screen.";
}

export default function InstallAppButton({ compact = false }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const guide = useMemo(() => getInstallGuide(), []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsInstalled(isStandaloneMode());
    });

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalled) return;

    if (!installPrompt) {
      setShowGuide(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice?.outcome === "accepted") {
      setIsInstalled(true);
    }

    setInstallPrompt(null);
  };

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={handleInstall}
          className="mt-4 text-center text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
        >
          {isInstalled ? "YourLove is installed" : "Install YourLove on this phone"}
        </button>
        <Modal isOpen={showGuide} onClose={() => setShowGuide(false)} maxWidth="max-w-md">
          <InstallGuide guide={guide} />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-accent)] text-[var(--accent)]">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text)]">
              Install YourLove
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Keep it on your home screen for faster access.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalled}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:cursor-default disabled:opacity-70"
        >
          <Download size={16} />
          {isInstalled ? "Installed" : "Install app"}
        </button>
      </div>

      <Modal isOpen={showGuide} onClose={() => setShowGuide(false)} maxWidth="max-w-md">
        <InstallGuide guide={guide} />
      </Modal>
    </>
  );
}

function InstallGuide({ guide }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--text)]">
        Install YourLove
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {guide}
      </p>
      <p className="mt-4 rounded-2xl bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted)]">
        After installing, YourLove will open from your home screen like a normal app.
      </p>
    </div>
  );
}
