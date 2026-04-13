"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ensureUserProfile, hasEmailLoginPassword } from "@/lib/auth";
import toast from "react-hot-toast";

function CallbackStatus() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)]">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
          YourLove
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">
          Finishing Google login
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          We are creating your profile and opening your private world.
        </p>
      </div>
    </main>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const finishGoogleLogin = async () => {
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
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Google login could not be completed");
        router.replace("/login");
        return;
      }

      const { isNewProfile, error: profileError } = await ensureUserProfile(supabase, user);

      if (profileError) {
        toast.error(profileError.message);
        router.replace("/login");
        return;
      }

      if (isNewProfile || !hasEmailLoginPassword(user)) {
        router.replace("/auth/setup-password");
        return;
      }

      router.replace("/");
    };

    finishGoogleLogin();
  }, [router, searchParams]);

  return <CallbackStatus />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackStatus />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
