"use client";

import Link from "next/link";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

export default function SignupPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                <h1 className="mb-2 text-center text-2xl font-bold text-[var(--accent)]">
                    Create Account
                </h1>
                <p className="mb-5 text-center text-sm text-[var(--muted)]">
                    Start with Google, then set your password from Profile.
                </p>

                <GoogleAuthButton label="Continue with Google" />

                <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
                    New accounts start with Google verification. After your profile opens, set a password so you can use email login later.
                </div>

                <p className="mt-4 text-center text-sm text-[var(--muted)]">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-[var(--accent)]">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
