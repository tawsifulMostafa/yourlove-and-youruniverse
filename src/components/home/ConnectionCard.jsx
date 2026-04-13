"use client";

import Link from "next/link";
import { Clock, HeartHandshake, Link2, Send } from "lucide-react";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import toast from "react-hot-toast";

function getInitials(name, email) {
    const source = name?.trim() || email?.trim() || "Love";
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export default function ConnectionCard({ isConnected, hasSharedSpace, couple, partnerProfile, onCancelDisconnect }) {
    const disconnectPending = isDisconnectPending(couple);
    const StatusIcon = disconnectPending ? Clock : isConnected ? HeartHandshake : hasSharedSpace ? Send : Link2;
    const handleCopyInviteCode = async () => {
        if (!couple?.invite_code) return;

        try {
            await navigator.clipboard.writeText(couple.invite_code);
            toast.success("Invite code copied");
        } catch {
            toast.error("Could not copy invite code");
        }
    };

    return (
        <section className="relative -mt-16 px-6 z-10">
            <div className="mx-auto max-w-3xl rounded-3xl bg-[var(--surface)] p-6 shadow-[var(--shadow)] border border-[var(--border)]">

                <div className="flex items-start gap-4">

                    {/* icon */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent)]">
                        <StatusIcon size={24} />
                    </div>

                    {/* text */}
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold text-[var(--accent)]">
                            {disconnectPending
                                ? "Disconnect scheduled"
                                : isConnected
                                    ? "Partner connected"
                                    : hasSharedSpace
                                        ? "Waiting for partner"
                                        : "Connect with your partner"}
                        </h2>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                            {disconnectPending
                                ? `Your shared world is paused. You can cancel within ${formatDisconnectCountdown(couple?.disconnect_delete_after)}.`
                                : isConnected
                                    ? "Your private world is active"
                                    : hasSharedSpace
                                        ? "Share your invite code so your partner can join this private world."
                                        : "Enter your invite code to start your shared space"}
                        </p>

                        {hasSharedSpace && !isConnected && !disconnectPending && couple?.invite_code && (
                            <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
                                Invite code:
                                <span className="font-mono text-[var(--accent)]">{couple.invite_code}</span>
                                <button
                                    type="button"
                                    onClick={handleCopyInviteCode}
                                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
                                >
                                    Copy
                                </button>
                            </div>
                        )}

                        {isConnected && partnerProfile && !disconnectPending && (
                            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-accent)] text-sm font-semibold text-[var(--accent)]">
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
                                    <p className="truncate text-sm font-semibold text-[var(--text)]">
                                        {partnerProfile.name || "Your partner"}
                                    </p>
                                    <p className="line-clamp-2 text-sm text-[var(--muted)]">
                                        {partnerProfile.about || "Your private world is active."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isConnected && !hasSharedSpace && (
                            <Link
                                href="/connect"
                                className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                            >
                                Connect now
                            </Link>
                        )}

                        {disconnectPending && (
                            <button
                                type="button"
                                onClick={onCancelDisconnect}
                                className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                            >
                                Cancel disconnect
                            </button>
                        )}
                    </div>

                </div>

            </div>
        </section>
    );
}
