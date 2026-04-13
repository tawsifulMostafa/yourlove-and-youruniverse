"use client";

import Link from "next/link";
import { Clock, HeartHandshake, Link2 } from "lucide-react";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";

function getInitials(name, email, fallback) {
    const source = name?.trim() || email?.trim() || fallback;
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function AvatarBubble({ profile, fallbackLabel, displayLabel }) {
    const label = displayLabel || profile?.name || fallbackLabel;
    const initials = getInitials(profile?.name, profile?.email, fallbackLabel);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/40 p-1 shadow-[0_16px_34px_rgba(103,57,66,0.22)]">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
                    {profile?.avatarUrl ? (
                        <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${profile.avatarUrl})` }}
                            aria-label={`${label} profile photo`}
                        />
                    ) : (
                        <span className="text-lg font-semibold text-[var(--accent)]">
                            {initials}
                        </span>
                    )}
                </div>
            </div>
            <span className="max-w-28 truncate text-sm font-semibold text-white">
                {label}
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
        ? `Paused for ${formatDisconnectCountdown(couple?.disconnect_delete_after)}`
        : isConnected
            ? "Connected"
            : hasSharedSpace
                ? "Waiting for partner"
                : "Not connected yet";
    const StatusIcon = disconnectPending ? Clock : isConnected ? HeartHandshake : Link2;

    return (
        <section className="px-4 pb-10 pt-6 sm:px-6">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <div className="relative min-h-[26rem] bg-[linear-gradient(135deg,#d68d86_0%,#bd6f78_46%,#8f5360_100%)] p-6 text-white sm:p-8 lg:min-h-[24rem]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.35),transparent_15rem),radial-gradient(circle_at_12%_88%,rgba(255,237,224,0.22),transparent_18rem)]" />
                    <div className="relative grid min-h-[20rem] gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                                YourLove
                            </p>
                            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                                Love your moment. Love with you.
                            </h1>
                            <p className="mt-4 max-w-lg text-base leading-7 text-white/82">
                                A private space for check-ins, letters, memories, and all the small things that keep two people close.
                            </p>

                            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/18 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                                <StatusIcon size={17} />
                                {statusText}
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                {disconnectPending ? (
                                    <button
                                        type="button"
                                        onClick={onCancelDisconnect}
                                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:opacity-90"
                                    >
                                        Cancel disconnect
                                    </button>
                                ) : hasSharedSpace ? (
                                    <Link
                                        href="/letters"
                                        className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-[var(--accent)] transition hover:opacity-90"
                                    >
                                        Write a letter
                                    </Link>
                                ) : (
                                    <Link
                                        href="/connect"
                                        className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-[var(--accent)] transition hover:opacity-90"
                                    >
                                        Create invite
                                    </Link>
                                )}
                                <Link
                                    href={hasSharedSpace ? "/memories" : "/connect"}
                                    className="rounded-xl border border-white/45 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/12"
                                >
                                    {hasSharedSpace ? "Save a memory" : "Connect first"}
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] bg-white/16 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.26)] backdrop-blur">
                            <div className="flex items-center justify-center gap-4">
                                <AvatarBubble
                                    profile={userProfile}
                                    fallbackLabel="You"
                                    displayLabel="You"
                                />
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/22 text-lg font-semibold">
                                    +
                                </div>
                                <AvatarBubble
                                    profile={isConnected ? partnerProfile : null}
                                    fallbackLabel="Your Love"
                                    displayLabel="Your Love"
                                />
                            </div>
                            <p className="mt-6 text-lg font-semibold">
                                {isConnected && partnerProfile
                                    ? `${userProfile?.name || "You"} & ${partnerProfile.name || "Your Love"}`
                                    : "You & Your Love"}
                            </p>
                            <p className="mt-2 text-sm text-white/76">
                                {isConnected
                                    ? "Your private world is active."
                                    : hasSharedSpace
                                        ? "Your invite is ready to share."
                                        : "Create an invite to begin."}
                            </p>
                            {hasSharedSpace && !isConnected && couple?.invite_code && (
                                <p className="mx-auto mt-4 w-fit rounded-xl bg-white/20 px-4 py-2 font-mono text-sm font-semibold">
                                    {couple.invite_code}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
