"use client";

import Link from "next/link";
import { Camera, CheckCircle2, Copy, MailPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function FirstUseOnboarding({
  isConnected,
  hasSharedSpace,
  inviteCode,
  hasProfilePhoto,
  hasActivity,
}) {
  if (isConnected && hasActivity) return null;

  const handleCopyInviteMessage = async () => {
    if (!inviteCode) return;

    const message = `I made us a private space on YourLove. Join me with this code: ${inviteCode}`;

    try {
      await navigator.clipboard.writeText(message);
      toast.success("Invite message copied");
    } catch {
      toast.error("Could not copy invite message");
    }
  };

  const title = isConnected
    ? "Begin your first shared moment"
    : hasSharedSpace
      ? "Invite your partner"
      : "Start your private love room";

  const description = isConnected
    ? "Your space is ready. Write the first letter or save the first memory to make it feel alive."
    : hasSharedSpace
      ? "Send this invite message so your partner can join without guessing what to do."
      : "Set the basics first, then invite your partner into one private space for both of you.";

  return (
    <section className="px-6 pt-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
          First steps
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <Camera className="text-[var(--accent)]" size={20} />
            <p className="mt-3 text-sm font-semibold text-[var(--text)]">Add your photo</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {hasProfilePhoto ? "Done" : "Make your profile feel real."}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <MailPlus className="text-[var(--accent)]" size={20} />
            <p className="mt-3 text-sm font-semibold text-[var(--text)]">Invite your partner</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {isConnected ? "Done" : hasSharedSpace ? "Send the code now." : "Create an invite first."}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <CheckCircle2 className="text-[var(--accent)]" size={20} />
            <p className="mt-3 text-sm font-semibold text-[var(--text)]">Share something</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {hasActivity ? "Done" : "Start with one letter."}
            </p>
          </div>
        </div>

        {hasSharedSpace && !isConnected && inviteCode ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">Ready-to-send invite</p>
            <p className="mt-2 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
              I made us a private space on YourLove. Join me with this code:{" "}
              <span className="font-mono font-semibold text-[var(--accent)]">{inviteCode}</span>
            </p>
            <button
              type="button"
              onClick={handleCopyInviteMessage}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
            >
              <Copy size={16} />
              Copy invite message
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {!hasProfilePhoto && (
              <Link
                href="/profile"
                className="inline-flex justify-center rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
              >
                Add profile photo
              </Link>
            )}
            {!hasSharedSpace && (
              <Link
                href="/connect"
                className="inline-flex justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                Create invite
              </Link>
            )}
            {isConnected && !hasActivity && (
              <Link
                href="/letters"
                className="inline-flex justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                Write first letter
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
