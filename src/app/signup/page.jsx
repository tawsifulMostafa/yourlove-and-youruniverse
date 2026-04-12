"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
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

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { name, email, password } = formData;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        });

        if (error) {
            setLoading(false);
            alert(error.message);
            return;
        }

        const user = data?.user;

        if (user) {
            const { error: profileError } = await supabase.from("profiles").upsert({
                id: user.id,
                name,
                email,
            });

            if (profileError) {
                setLoading(false);
                alert(profileError.message);
                return;
            }
        }

        setLoading(false);
        alert("Account created successfully");
        router.push("/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)] px-4">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                <h1 className="mb-2 text-center text-2xl font-bold text-[var(--accent)]">
                    Create Account
                </h1>
                <p className="mb-4 text-center text-sm text-[var(--muted)]">
                    Start your private love world
                </p>

                <form onSubmit={handleSignup} className="space-y-3">
                    <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                        value={formData.name}
                        onChange={handleChange}
                    />

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
                        placeholder="Create password"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[var(--accent)] py-3 text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Sign Up"}
                    </button>
                </form>

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
