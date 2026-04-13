"use client";

import { useMemo, useState } from "react";
import { Heart, Search, SmilePlus } from "lucide-react";
import { CHECKIN_CATEGORIES, CHECKIN_PRESETS, getCheckInPreset } from "@/lib/checkInPresets";

export default function DailyCheckIn({
  isConnected,
  disabled,
  userCheckIn,
  partnerCheckIn,
  partnerProfile,
  onCheckIn,
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(CHECKIN_CATEGORIES[0].id);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const baseOptions = query
      ? CHECKIN_PRESETS
      : CHECKIN_PRESETS.filter((preset) => preset.categoryId === activeCategory);

    if (!query) return baseOptions;

    return baseOptions.filter((preset) =>
      `${preset.message} ${preset.categoryTitle}`.toLowerCase().includes(query)
    );
  }, [activeCategory, search]);

  if (!isConnected) return null;

  const partnerPreset = getCheckInPreset(partnerCheckIn?.mood);
  const userPreset = getCheckInPreset(userCheckIn?.mood);
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
              Pick a preset message and let your partner feel you today.
            </p>
          </div>
        </div>

        {partnerPreset && (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-accent)] text-[var(--accent)]">
                <Heart size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {partnerProfile?.name || "Your partner"} sent:
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  &quot;{partnerPreset.message}&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {userPreset && (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-sm text-[var(--muted)]">
              You sent today: <span className="font-semibold text-[var(--accent)]">&quot;{userPreset.message}&quot;</span>
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">
            Choose one message
          </p>
          <div className="relative w-full sm:max-w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search message"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-10 pr-4 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {!search.trim() && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {CHECKIN_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory === category.id
                  ? "border-[var(--accent)] bg-[var(--surface-accent)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--accent)]"
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredOptions.map((preset) => {
            const isSelected = preset.mood === userMood;

            return (
              <button
                key={preset.mood}
                type="button"
                onClick={() => onCheckIn(preset.mood)}
                disabled={disabled}
                className={`rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${isSelected
                  ? "border-[var(--accent)] bg-[var(--surface-accent)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
              >
                <span className="block text-sm font-semibold leading-6">{preset.message}</span>
                <span className="mt-1 block text-xs font-medium text-[var(--muted)]">
                  {isSelected ? "Sent for today" : preset.categoryTitle}
                </span>
              </button>
            );
          })}
        </div>

        {filteredOptions.length === 0 && (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-center text-sm text-[var(--muted)]">
            No preset message found.
          </p>
        )}
      </div>
    </section>
  );
}
