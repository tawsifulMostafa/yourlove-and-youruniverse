"use client";

import Link from "next/link";
import { Clock, Copy, HeartHandshake, Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";

function getInitials(name, email, fallback) {
  const source = name?.trim() || email?.trim() || fallback;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MiniAvatar({ profile, fallbackLabel, displayLabel }) {
  const initials = getInitials(profile?.name, profile?.email, fallbackLabel);

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-accent)] text-sm font-semibold text-[var(--accent)] ring-2 ring-[var(--surface)]">
        {profile?.avatarUrl ? (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.avatarUrl})` }}
            aria-label={`${displayLabel || fallbackLabel} profile photo`}
          />
        ) : (
          initials
        )}
      </div>
      <span className="hidden max-w-24 truncate text-sm font-semibold text-[var(--text)] sm:block">
        {displayLabel || profile?.name || fallbackLabel}
      </span>
    </div>
  );
}

export default function HeroSection({
  userProfile,
  partnerProfile,
  isConnected,
  hasSharedSpace,
  couple,
  onCancelDisconnect,
}) {
  const disconnectPending = isDisconnectPending(couple);
  const statusText = disconnectPending
    ? "Paused"
    : isConnected
      ? "Connected"
      : hasSharedSpace
        ? "Waiting"
        : "Not connected";
  const StatusIcon = disconnectPending ? Clock : isConnected ? HeartHandshake : Link2;

  const handleCopyInvite = async () => {
    if (!couple?.invite_code) return;

    try {
      await navigator.clipboard.writeText(couple.invite_code);
      toast.success("Invite code copied");
    } catch {
      toast.error("Could not copy invite code");
    }
  };

  return (
    <section className="px-4 pb-4 pt-5 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex -space-x-3">
              <MiniAvatar profile={userProfile} fallbackLabel="You" displayLabel="You" />
              <MiniAvatar
                profile={isConnected ? partnerProfile : null}
                fallbackLabel="Love"
                displayLabel="YourLove"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text)]">
                You & YourLove
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {disconnectPending
                  ? `Disconnect scheduled for ${formatDisconnectCountdown(couple?.disconnect_delete_after)}.`
                  : isConnected
                    ? "Your private space is active."
                    : hasSharedSpace
                      ? "Share the invite code with your partner."
                      : "Create a shared space to begin."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
              <StatusIcon size={16} />
              {statusText}
            </span>

            {disconnectPending ? (
              <button
                type="button"
                onClick={onCancelDisconnect}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                Cancel
              </button>
            ) : hasSharedSpace && !isConnected && couple?.invite_code ? (
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 font-mono text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
              >
                {couple.invite_code}
                <Copy size={15} />
              </button>
            ) : !hasSharedSpace ? (
              <Link
                href="/connect"
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-center text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                Connect
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
