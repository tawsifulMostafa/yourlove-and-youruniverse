import { UserRound } from "lucide-react";

function getInitials(name, email, fallback) {
    const source = name?.trim() || email?.trim() || fallback;
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function AvatarBubble({ profile, fallbackLabel }) {
    const label = profile?.name || fallbackLabel;
    const initials = getInitials(profile?.name, profile?.email, fallbackLabel);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] p-1 shadow-[0_12px_28px_rgba(157,92,99,0.22)]">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
                    {profile?.avatarUrl ? (
                        <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${profile.avatarUrl})` }}
                            aria-label={`${label} profile photo`}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--surface-accent)] text-[var(--accent)]">
                            {profile ? (
                                <span className="text-lg font-semibold">{initials}</span>
                            ) : (
                                <>
                                    <UserRound size={22} />
                                    <span className="mt-1 text-sm font-semibold">{fallbackLabel}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <span className="max-w-28 truncate text-sm font-medium text-[var(--accent)]">
                {label}
            </span>
        </div>
    );
}

export default function HeroSection({ userProfile, partnerProfile, isConnected }) {
    return (
        <section className="bg-linear-to-b from-[var(--surface-soft)] to-[var(--app-bg-soft)] py-24">
            <div className="mx-auto max-w-4xl px-6 text-center">

                {/* Avatar */}
                <div className="mb-10 flex items-center justify-center gap-6">
                    <AvatarBubble profile={userProfile} fallbackLabel="You" />

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] text-lg font-semibold text-[var(--accent)] shadow-sm">
                        +
                    </div>

                    <AvatarBubble
                        profile={isConnected ? partnerProfile : null}
                        fallbackLabel={isConnected ? "Partner" : "Love"}
                    />
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] leading-tight">
                    Your private world, just for two
                </h1>

                {/* Subtitle */}
                <p className="mt-5 text-lg text-[var(--muted)]">
                    A calm space to share memories, write letters, and stay close, no matter the distance.
                </p>

            </div>
        </section>
    );
}
