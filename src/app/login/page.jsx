"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { email, password } = formData;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
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

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            name="email"
            placeholder="Your email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Your password"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            value={formData.password}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-3 text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)]">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
