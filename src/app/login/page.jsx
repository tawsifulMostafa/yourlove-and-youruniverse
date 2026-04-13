"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import Modal from "@/components/shared/Modal";
import { ensureUserProfile, isTrustedDevice, trustCurrentDevice } from "@/lib/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const user = data?.user;
    if (!user) {
      setLoading(false);
      toast.error("Login could not be completed");
      return;
    }

    if (isTrustedDevice(user.id)) {
      const { isNewProfile, error: profileError } = await ensureUserProfile(supabase, user);
      setLoading(false);

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      router.push(isNewProfile ? "/profile" : "/");
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    await supabase.auth.signOut();
    setLoading(false);

    if (otpError) {
      toast.error(otpError.message);
      return;
    }

    setPendingUserId(user.id);
    setCodeSent(true);
    toast.success("New device detected. Check your email for the verification code.");
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    const email = formData.email.trim();
    const token = formData.otp.trim();

    if (!email || !token) {
      toast.error("Email and code are required");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const user = data?.user;
    if (!user) {
      setLoading(false);
      toast.error("Login could not be completed");
      return;
    }

    const { isNewProfile, error: profileError } = await ensureUserProfile(supabase, user);
    trustCurrentDevice(user.id || pendingUserId);

    setLoading(false);

    if (profileError) {
      toast.error(profileError.message);
      return;
    }

    router.push(isNewProfile ? "/profile" : "/");
  };

  const openForgotModal = () => {
    setResetEmail(formData.email.trim());
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetEmail("");
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    const email = resetEmail.trim();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    setResetLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      setResetLoading(false);
      toast.error(profileError.message);
      return;
    }

    if (!profile) {
      setResetLoading(false);
      toast.error("User not found");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset email sent");
    closeForgotModal();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <h1 className="mb-2 text-center text-2xl font-bold text-[var(--accent)]">
          Welcome Back
        </h1>
        <p className="mb-4 text-center text-sm text-[var(--muted)]">
          Login to your private world
        </p>

        <GoogleAuthButton label="Login with Google" />

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            or
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <form onSubmit={codeSent ? verifyCode : handlePasswordLogin} className="space-y-3">
          <input
            type="email"
            name="email"
            placeholder="Your email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            value={formData.email}
            onChange={handleChange}
            disabled={loading || codeSent}
          />

          {!codeSent && (
            <input
              type="password"
              name="password"
              placeholder="Your password"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          )}

          {codeSent && (
            <input
              type="text"
              inputMode="numeric"
              name="otp"
              placeholder="Verification code"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              value={formData.otp}
              onChange={handleChange}
              autoComplete="one-time-code"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-3 text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? codeSent
                ? "Verifying..."
                : "Logging in..."
              : codeSent
                ? "Verify code"
                : "Login"}
          </button>
        </form>

        {codeSent && (
          <button
            type="button"
            onClick={handlePasswordLogin}
            disabled={loading}
            className="mt-3 w-full text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-hover)] disabled:opacity-60"
          >
            Resend code
          </button>
        )}

        {!codeSent && (
          <button
            type="button"
            onClick={openForgotModal}
            disabled={loading || resetLoading}
            className="mt-3 w-full text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-hover)] disabled:opacity-60"
          >
            Forgot password?
          </button>
        )}

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)]">
            Create one
          </Link>
        </p>
      </div>

      <Modal isOpen={showForgotModal} onClose={closeForgotModal} maxWidth="max-w-md">
        <h2 className="text-xl font-semibold text-[var(--text)]">
          Reset password
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Enter your account email. If the user exists, we will send a reset link.
        </p>

        <form onSubmit={handleForgotPassword} className="mt-5 space-y-3">
          <input
            type="email"
            placeholder="Your email"
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
            disabled={resetLoading}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:opacity-60"
            autoFocus
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForgotModal}
              disabled={resetLoading}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {resetLoading ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
