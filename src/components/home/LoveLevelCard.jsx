"use client";

import { useSyncExternalStore } from "react";
import { Heart, Image as ImageIcon, Mail } from "lucide-react";
import { ETERNAL_MODE_UNLOCK_LEVEL, getLoveLevel, getLoveLevelTier } from "@/lib/loveLevel";
import { getSavedTheme, setSavedTheme, THEME_CHANGE_EVENT } from "@/lib/theme";
import toast from "react-hot-toast";

const TIER_STYLES = {
  "first-spark": {
    icon: "bg-[#f3e7e9] text-[#9d5c63]",
    shell: "bg-[var(--surface)]",
    glow: "0 18px 42px rgba(157, 92, 99, 0.08)",
    progress: "linear-gradient(90deg, #d98a92, #9d5c63)",
    ring: "#9d5c63",
    accent: "First notes, first glow.",
  },
  "growing-bond": {
    icon: "bg-[#f7dfd0] text-[#b86f5d]",
    shell: "bg-[linear-gradient(135deg,var(--surface)_0%,rgba(248,223,208,0.55)_100%)]",
    glow: "0 20px 48px rgba(184, 111, 93, 0.16)",
    progress: "linear-gradient(90deg, #d98a92, #d79f72)",
    ring: "#d79f72",
    accent: "The bond is getting warmer.",
  },
  "deeply-connected": {
    icon: "bg-[#efe3f0] text-[#8b5a8c]",
    shell: "bg-[linear-gradient(135deg,var(--surface)_0%,rgba(239,227,240,0.7)_100%)]",
    glow: "0 22px 54px rgba(139, 90, 140, 0.18)",
    progress: "linear-gradient(90deg, #9d5c63, #8b5a8c)",
    ring: "#8b5a8c",
    accent: "Almost at the Eternal glow.",
  },
  "eternal-bond": {
    icon: "bg-[#fff2d9] text-[#bfa071]",
    shell: "bg-[linear-gradient(135deg,var(--surface)_0%,rgba(191,160,113,0.18)_55%,rgba(225,142,231,0.14)_100%)]",
    glow: "0 0 38px rgba(225, 142, 231, 0.18), 0 24px 60px rgba(191, 160, 113, 0.18)",
    progress: "linear-gradient(90deg, #bfa071, #e7b0a2, #e18ee7)",
    ring: "#bfa071",
    accent: "Eternal Mode is part of your story now.",
  },
};

function subscribeToThemeChange(callback) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export default function LoveLevelCard({ isConnected, letterCount, memoryCount }) {
  const hasActivity = letterCount + memoryCount > 0;
  const { level, progress } = getLoveLevel(letterCount, memoryCount);
  const tier = getLoveLevelTier(level);
  const tierStyle = TIER_STYLES[tier.key] ?? TIER_STYLES["first-spark"];
  const ringProgress = isConnected && hasActivity ? Math.max(2, progress) : 0;
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

  const milestoneMessage = !isConnected
    ? "Next milestone: connect with your partner."
    : letterCount <= memoryCount
      ? "Next milestone: write another letter to grow closer."
      : "Next milestone: save another memory from your shared world.";

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
    <section className="px-4 pt-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div
          className={`eternal-surface overflow-hidden rounded-[2rem] border border-[var(--border)] p-5 shadow-[var(--shadow)] sm:p-6 ${tierStyle.shell}`}
          style={{ boxShadow: tierStyle.glow }}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_14rem_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                Love Level
              </p>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <h2 className="text-4xl font-semibold tracking-tight text-[var(--text)]">
                  Level {level}
                </h2>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  {tier.name}
                </span>
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                {message}
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--accent)]">
                {tierStyle.accent}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
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

            <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[var(--surface-soft)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              <div
                className="flex h-full w-full items-center justify-center rounded-full p-3"
                style={{
                  background: `conic-gradient(${tierStyle.ring} ${ringProgress * 3.6}deg, color-mix(in srgb, var(--surface-accent) 82%, transparent) 0deg)`,
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[var(--surface)] text-center shadow-[var(--shadow)]">
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${tierStyle.icon}`}>
                    <Heart size={22} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {tier.name}
                  </p>
                  <p className="mt-1 text-4xl font-semibold text-[var(--text)]">
                    Level {level}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Growing together
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  Next milestone
                </span>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {milestoneMessage}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-accent)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ background: tierStyle.progress, width: isConnected ? `${progress}%` : "0%" }}
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--muted)]">
                  {progressMessage}
                </p>
              </div>

              <div className="eternal-reward-card flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                    Eternal reward
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                    {hasEternalMode ? "Eternal Mode unlocked" : `Eternal Mode unlocks at Level ${ETERNAL_MODE_UNLOCK_LEVEL}`}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {tier.rewardCopy}
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
                  {hasEternalMode ? (theme === "eternal" ? "Soft Mode" : "Eternal Mode") : "Unlocks at Level 10"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
