"use client";

import { useMemo, useState } from "react";
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
  {
    mood: "good_morning_love",
    label: "Good morning, love",
    partnerText: "sent you a soft good morning.",
  },
  {
    mood: "good_night_love",
    label: "Good night, love",
    partnerText: "sent you a quiet good night.",
  },
  {
    mood: "drink_water",
    label: "Drink water",
    partnerText: "wants you to drink water today.",
  },
  {
    mood: "eat_on_time",
    label: "Eat on time",
    partnerText: "wants you to eat on time.",
  },
  {
    mood: "come_back_soon",
    label: "Come back soon",
    partnerText: "is waiting for you to come back soon.",
  },
  {
    mood: "i_am_here",
    label: "I am here",
    partnerText: "wants you to know they are here.",
  },
  {
    mood: "you_are_safe_with_me",
    label: "You are safe with me",
    partnerText: "wants you to feel safe with them.",
  },
  {
    mood: "i_believe_in_you",
    label: "I believe in you",
    partnerText: "believes in you today.",
  },
  {
    mood: "smile_for_me",
    label: "Smile for me",
    partnerText: "wants to see your smile today.",
  },
  {
    mood: "take_rest",
    label: "Take some rest",
    partnerText: "wants you to rest a little.",
  },
  {
    mood: "i_love_your_voice",
    label: "I love your voice",
    partnerText: "misses hearing your voice.",
  },
  {
    mood: "cant_wait_to_talk",
    label: "Can’t wait to talk",
    partnerText: "can’t wait to talk to you.",
  },
  {
    mood: "today_felt_empty",
    label: "Today felt empty",
    partnerText: "felt today was a little empty without you.",
  },
  {
    mood: "sending_a_virtual_hug",
    label: "Sending a virtual hug",
    partnerText: "sent you a virtual hug.",
  },
  {
    mood: "you_made_my_day",
    label: "You made my day",
    partnerText: "says you made their day.",
  },
  {
    mood: "stay_close",
    label: "Stay close",
    partnerText: "wants you to stay close today.",
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
  const [search, setSearch] = useState("");
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return CHECKIN_OPTIONS;

    return CHECKIN_OPTIONS.filter((option) =>
      `${option.label} ${option.partnerText}`.toLowerCase().includes(query)
    );
  }, [search]);

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

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">
            Choose one message
          </p>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search message"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] sm:max-w-64"
          />
        </div>

        <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredOptions.map((option) => {
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
        {filteredOptions.length === 0 && (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-center text-sm text-[var(--muted)]">
            No preset message found.
          </p>
        )}
      </div>
    </section>
  );
}
