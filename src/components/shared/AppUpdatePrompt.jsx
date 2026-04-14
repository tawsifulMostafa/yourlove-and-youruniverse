"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "yourlove-seen-version";

export default function AppUpdatePrompt() {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;

        const { version } = await response.json();
        if (!version) return;

        const seenVersion = window.localStorage.getItem(STORAGE_KEY);

        if (!seenVersion) {
          window.localStorage.setItem(STORAGE_KEY, version);
          return;
        }

        if (seenVersion !== version && isMounted) {
          setHasUpdate(true);
        }
      } catch {
        // Update checks should never interrupt the app.
      }
    };

    checkVersion();
    const intervalId = window.setInterval(checkVersion, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleUpdate = async () => {
    try {
      const response = await fetch("/api/version", { cache: "no-store" });
      const { version } = await response.json();
      if (version) window.localStorage.setItem(STORAGE_KEY, version);
    } catch {
      // Reload anyway.
    }

    window.location.reload();
  };

  if (!hasUpdate) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
      <p className="text-sm font-semibold text-[var(--text)]">
        A new version is ready
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Update now to get the latest fixes.
      </p>
      <button
        type="button"
        onClick={handleUpdate}
        className="mt-3 w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
      >
        Update now
      </button>
    </div>
  );
}
