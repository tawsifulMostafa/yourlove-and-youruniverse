import Link from "next/link";
import { HeartHandshake, Link2 } from "lucide-react";

export default function ConnectionCard({ isConnected }) {
    const StatusIcon = isConnected ? HeartHandshake : Link2;

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
                            {isConnected ? "Partner connected" : "Connect with your partner"}
                        </h2>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                            {isConnected
                                ? "Your private world is active"
                                : "Enter your invite code to start your shared space"}
                        </p>

                        {!isConnected && (
                            <Link
                                href="/connect"
                                className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                            >
                                Connect now
                            </Link>
                        )}
                    </div>

                </div>

            </div>
        </section>
    );
}
