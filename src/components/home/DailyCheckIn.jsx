"use client";

import { Heart, SmilePlus } from "lucide-react";

const CHECKIN_OPTIONS = [
  {
    mood: "thinking_of_you",
    label: "Thinking of you",
    partnerText: "is thinking of you today.",
  },
  {
    mood: "miss_you",
    label: "Miss you",
    partnerText: "misses you today.",
  },
  {
    mood: "need_a_hug",
    label: "Need a hug",
    partnerText: "could use a hug today.",
  },
  {
    mood: "proud_of_you",
    label: "Proud of you",
    partnerText: "is proud of you today.",
  },
];

export function getCheckInOption(mood) {
  return CHECKIN_OPTIONS.find((option) => option.mood === mood);
}

export default function DailyCheckIn({
  isConnected,
  disabled,
  userCheckIn,
  partnerCheckIn,
  partnerProfile,
  onCheckIn,
}) {
  if (!isConnected) return null;

  const partnerOption = getCheckInOption(partnerCheckIn?.mood);
  const userMood = userCheckIn?.mood;

  return (
    <section className="px-6 pt-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent)]">
            <SmilePlus size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
              Today&apos;s check-in
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
              Send one small signal
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              One tap is enough to let your partner feel you today.
            </p>
          </div>
        </div>

        {partnerOption && (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-accent)] text-[var(--accent)]">
                <Heart size={18} />
              </div>
              <p className="text-sm font-medium text-[var(--text)]">
                {partnerProfile?.name || "Your partner"} {partnerOption.partnerText}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {CHECKIN_OPTIONS.map((option) => {
            const isSelected = option.mood === userMood;

            return (
              <button
                key={option.mood}
                type="button"
                onClick={() => onCheckIn(option.mood)}
                disabled={disabled}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isSelected
                  ? "border-[var(--accent)] bg-[var(--surface-accent)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
              >
                {option.label}
                {isSelected && (
                  <span className="mt-1 block text-xs font-medium text-[var(--muted)]">
                    Sent for today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
