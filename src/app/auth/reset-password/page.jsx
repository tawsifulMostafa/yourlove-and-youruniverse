"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { trustCurrentDevice } from "@/lib/auth";
import toast from "react-hot-toast";

function ResetPasswordCard({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        {children}
      </div>
    </main>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prepareResetSession = async () => {
      const code = searchParams.get("code");
      const errorDescription = searchParams.get("error_description");

      if (errorDescription) {
        toast.error(errorDescription);
        router.replace("/login");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          toast.error(error.message);
          router.replace("/login");
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Password reset link is invalid or expired");
        router.replace("/login");
        return;
      }

      setReady(true);
    };

    prepareResetSession();
  }, [router, searchParams]);

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        ...(user?.user_metadata || {}),
        password_set: true,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated");
    if (user?.id) trustCurrentDevice(user.id);
    router.replace("/login");
  };

  if (!ready) {
    return (
      <ResetPasswordCard>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
          YourLove
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">
          Opening reset link
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          We are verifying your password reset session.
        </p>
      </ResetPasswordCard>
    );
  }

  return (
    <ResetPasswordCard>
      <h1 className="text-center text-2xl font-bold text-[var(--accent)]">
        Reset Password
      </h1>
      <p className="mt-2 text-center text-sm text-[var(--muted)]">
        Choose a new password for email login.
      </p>

      <form onSubmit={handleResetPassword} className="mt-5 space-y-3">
        <input
          type="password"
          placeholder="New password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-3 text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </ResetPasswordCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordCard>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
            YourLove
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">
            Opening reset link
          </h1>
        </ResetPasswordCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
