"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasEmailLoginPassword, trustCurrentDevice } from "@/lib/auth";
import toast from "react-hot-toast";

export default function SetupPasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      if (hasEmailLoginPassword(user)) {
        router.replace("/profile");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleSavePassword = async (event) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        ...(user?.user_metadata || {}),
        password_set: true,
      },
    });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (user?.id) trustCurrentDevice(user.id);
    toast.success("Password saved");
    router.replace("/profile");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Required setup
        </p>
        <h1 className="mt-3 text-center text-2xl font-bold text-[var(--text)]">
          Set your password
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Set this first. After that, your private world will open.
        </p>

        <form onSubmit={handleSavePassword} className="mt-5 space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            disabled={loading || saving}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:opacity-60"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            disabled={loading || saving}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || saving}
            className="w-full rounded-lg bg-[var(--accent)] py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving password..." : loading ? "Checking..." : "Save Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
