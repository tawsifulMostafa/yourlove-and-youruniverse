"use client";

import Link from "next/link";
import { Image as ImageIcon, Mail, Sparkles } from "lucide-react";
import { formatMemoryTime } from "@/lib/utils";

function getInitials(name, email) {
  const source = name?.trim() || email?.trim() || "Love";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function JourneyItem({ item }) {
  const isMemory = item.type === "memory";
  const Icon = isMemory ? ImageIcon : Mail;

  return (
    <div className="relative min-w-72 rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
      <div className="absolute -left-2 top-6 h-4 w-4 rounded-full border-4 border-[var(--app-bg)] bg-[var(--accent)]" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-accent)] text-[var(--accent)]">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.description}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
            {isMemory ? "Memory" : "Letter"} - {formatMemoryTime(item.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JourneyPreview({
  isConnected,
  hasSharedSpace,
  partnerProfile,
  recentItems,
  inviteCode,
}) {
  const hasRecentItems = recentItems.length > 0;

  return (
    <section className="px-4 pt-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-soft)] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
            Partner corner
          </p>

          {isConnected && partnerProfile ? (
            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-accent)] text-xl font-semibold text-[var(--accent)] ring-4 ring-[var(--surface-accent)]">
                {partnerProfile.avatarUrl ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${partnerProfile.avatarUrl})` }}
                    aria-label="Partner profile photo"
                  />
                ) : (
                  getInitials(partnerProfile.name, partnerProfile.email)
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
                  {partnerProfile.name || "Your partner"}
                </h2>
                <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--muted)]">
                  {partnerProfile.about || "Your shared world is open and ready for more moments together."}
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
                >
                  View profile
                </Link>
              </div>
            </div>
          ) : hasSharedSpace ? (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
              <h2 className="text-xl font-semibold text-[var(--text)]">Waiting for your partner</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Share the invite code and this space will turn into your private journey together.
              </p>
              {inviteCode && (
                <p className="mt-4 w-fit rounded-xl bg-[var(--surface)] px-4 py-2 font-mono text-sm font-semibold text-[var(--accent)]">
                  {inviteCode}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
              <h2 className="text-xl font-semibold text-[var(--text)]">Start your shared world</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Connect first, then your letters and memories will gather here.
              </p>
              <Link
                href="/connect"
                className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                Connect now
              </Link>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--app-bg-soft)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                Our journey
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
                Recent moments
              </h2>
            </div>
            <Sparkles className="text-[var(--accent)]" size={24} />
          </div>

          <div className="relative mt-6">
            <div className="absolute left-0 right-0 top-8 hidden border-t border-dashed border-[var(--border)] sm:block" />
            {hasRecentItems ? (
              <div className="flex gap-4 overflow-x-auto pb-3 pl-2">
                {recentItems.map((item) => <JourneyItem key={`${item.type}-${item.id}`} item={item} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {isConnected ? "No shared moments yet" : "Your timeline is waiting"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {isConnected
                    ? "Write a letter or save a memory, and the latest ones will appear here."
                    : "Once you connect, this space will collect your newest letters and memories."}
                </p>
              </div>
            )}
          </div>

          {isConnected && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/letters"
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
              >
                Write a letter
              </Link>
              <Link
                href="/memories"
                className="rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                Save a memory
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
