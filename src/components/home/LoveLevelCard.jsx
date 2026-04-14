"use client";

import { useSyncExternalStore } from "react";
import { Heart, Lock } from "lucide-react";
import { ETERNAL_MODE_UNLOCK_LEVEL, getLoveLevel, getLoveLevelTier } from "@/lib/loveLevel";
import { getSavedTheme, setSavedTheme, THEME_CHANGE_EVENT } from "@/lib/theme";
import toast from "react-hot-toast";

const TIER_PROGRESS = {
  "first-spark": "linear-gradient(90deg, #d98a92, #9d5c63)",
  "growing-bond": "linear-gradient(90deg, #d98a92, #d79f72)",
  "deeply-connected": "linear-gradient(90deg, #9d5c63, #8b5a8c)",
  "eternal-bond": "linear-gradient(90deg, #bfa071, #e7b0a2, #e18ee7)",
};

function subscribeToThemeChange(callback) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export default function LoveLevelCard({ isConnected, letterCount, memoryCount }) {
  const { level, progress } = getLoveLevel(letterCount, memoryCount);
  const tier = getLoveLevelTier(level);
  const hasEternalMode = level >= ETERNAL_MODE_UNLOCK_LEVEL;
  const theme = useSyncExternalStore(subscribeToThemeChange, getSavedTheme, () => "light");
  const progressWidth = isConnected ? `${progress}%` : "0%";

  const handleEternalModeClick = () => {
    if (!hasEternalMode) {
      toast("Eternal Mode unlocks at Love Level 10.");
      return;
    }

    const nextTheme = theme === "eternal" ? "light" : "eternal";
    setSavedTheme(nextTheme);
    toast.success(nextTheme === "eternal" ? "Eternal Mode on" : "Soft Mode on");
  };

  return (
    <section className="px-4 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent)]">
                <Heart size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  Love Level {level}
                </p>
                <h2 className="text-xl font-semibold text-[var(--text)]">
                  {tier.name}
                </h2>
              </div>
              <div className="ml-auto flex gap-2 text-xs font-semibold text-[var(--muted)]">
                <span>{letterCount} letters</span>
                <span>{memoryCount} memories</span>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-accent)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: progressWidth,
                  background: TIER_PROGRESS[tier.key] ?? TIER_PROGRESS["first-spark"],
                }}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {isConnected
                ? "Keep sharing small moments to grow together."
                : "Connect with your partner to start growing."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleEternalModeClick}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${hasEternalMode
              ? "eternal-mode-button bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
              : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)]"
              }`}
          >
            {!hasEternalMode && <Lock size={15} />}
            {hasEternalMode ? (theme === "eternal" ? "Soft Mode" : "Eternal Mode") : "Eternal at Level 10"}
          </button>
        </div>
      </div>
    </section>
  );
}
