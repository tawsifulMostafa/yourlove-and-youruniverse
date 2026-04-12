"use client";

import { useSyncExternalStore } from "react";
import { Heart, Image as ImageIcon, Mail } from "lucide-react";
import { ETERNAL_MODE_UNLOCK_LEVEL, getLoveLevel } from "@/lib/loveLevel";
import { getSavedTheme, setSavedTheme, THEME_CHANGE_EVENT } from "@/lib/theme";
import toast from "react-hot-toast";

function subscribeToThemeChange(callback) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export default function LoveLevelCard({ isConnected, letterCount, memoryCount }) {
  const hasActivity = letterCount + memoryCount > 0;
  const { level, progress } = getLoveLevel(letterCount, memoryCount);
  const hasEternalMode = level >= ETERNAL_MODE_UNLOCK_LEVEL;
  const theme = useSyncExternalStore(subscribeToThemeChange, getSavedTheme, () => "light");

  const message = !isConnected
    ? "Connect with your partner to start your Love Level."
    : hasActivity
      ? "Keep sharing letters and memories to grow together."
      : "Write your first letter or save your first memory to begin.";

  const progressMessage = !isConnected
    ? "Your journey starts after you connect."
    : hasActivity
      ? "You are getting closer to the next level."
      : "Your first shared moment will begin the progress.";

  const handleEternalModeClick = () => {
    if (!hasEternalMode) {
      toast("Eternal Mode unlocks at Love Level 10.");
      return;
    }

    const nextTheme = theme === "eternal" ? "light" : "eternal";
    setSavedTheme(nextTheme);
    toast.success(nextTheme === "eternal" ? "Eternal Mode on" : "Light mode on");
  };

  return (
    <section className="px-6 pt-10">
      <div className="eternal-surface mx-auto max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent)]">
              <Heart size={24} />
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                Love Level
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text)]">
                Level {level}
              </h2>
              <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
                {message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:w-56">
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <Mail size={17} />
                <span className="text-xs font-medium uppercase tracking-[0.12em]">
                  Letters
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {letterCount}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">shared</p>
            </div>

            <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <ImageIcon size={17} />
                <span className="text-xs font-medium uppercase tracking-[0.12em]">
                  Memories
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {memoryCount}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">saved</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-accent)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: isConnected ? `${progress}%` : "0%" }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--muted)]">
            {progressMessage}
          </p>
        </div>

        <div className="eternal-reward-card mt-5 flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Eternal reward
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">
              {hasEternalMode ? "Eternal Mode unlocked" : `Eternal Mode unlocks at Level ${ETERNAL_MODE_UNLOCK_LEVEL}`}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {hasEternalMode
                ? "A deeper glow for your shared world."
                : "Keep sharing together to unlock this warmer night theme."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleEternalModeClick}
            className={`relative z-10 rounded-xl px-5 py-3 text-sm font-semibold transition ${hasEternalMode
              ? "eternal-mode-button bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
              : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)]"
              }`}
          >
            {hasEternalMode ? (theme === "eternal" ? "Light Mode" : "Eternal Mode") : "Unlocks at Level 10"}
          </button>
        </div>
      </div>
    </section>
  );
}
