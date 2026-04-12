"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/shared/Navbar";
import toast from "react-hot-toast";

export default function LettersPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [letters, setLetters] = useState([]);

    const [form, setForm] = useState({
        title: "",
        condition: "",
        message: "",
    });

    const fieldClass =
        "mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25";

    const loadData = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;
        setUser(user);

        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        setProfile(profileData);

        if (!profileData?.couple_id) return;

        const { data: lettersData } = await supabase
            .from("letters")
            .select("*")
            .eq("couple_id", profileData.couple_id)
            .order("created_at", { ascending: false });

        setLetters(lettersData || []);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const handleCreate = async () => {
        if (!form.title || !form.message) {
            toast.error("Fill all fields");
            return;
        }

        const { error } = await supabase.from("letters").insert({
            couple_id: profile.couple_id,
            sender_id: user.id,
            title: form.title,
            open_condition: form.condition,
            message: form.message,
        });

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Letter saved");

        setForm({ title: "", condition: "", message: "" });
        loadData();
    };

    const handleOpen = async (letter) => {
        if (!letter.is_opened) {
            await supabase
                .from("letters")
                .update({ is_opened: true })
                .eq("id", letter.id);
        }

        toast(letter.message);
    };

    return (
        <div className="min-h-screen bg-[var(--app-bg-soft)]">
            <Navbar />

            <div className="mx-auto max-w-3xl px-6 py-10">
                <h1 className="text-center text-3xl font-semibold text-[var(--accent)]">
                    Open When Letters
                </h1>

                {/* Create Card */}
                <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                    <h2 className="text-xl font-semibold text-[var(--accent)]">
                        Write a Letter
                    </h2>

                    <input
                        placeholder="Title"
                        className={fieldClass}
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />

                    <input
                        placeholder="Open when... (optional)"
                        className={fieldClass}
                        value={form.condition}
                        onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    />

                    <textarea
                        placeholder="Write your message..."
                        className={fieldClass}
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />

                    <button
                        onClick={handleCreate}
                        className="mt-4 w-full rounded-xl bg-[var(--accent)] py-3 text-white"
                    >
                        Save Letter
                    </button>
                </div>

                {/* Letters List */}
                <div className="mt-10 space-y-4">
                    {letters.map((letter) => (
                        <div
                            key={letter.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
                        >
                            <h3 className="text-lg font-semibold text-[var(--text)]">
                                {letter.title}
                            </h3>

                            <p className="mt-1 text-sm text-[var(--muted)]">
                                Open when: {letter.open_condition || "Anytime"}
                            </p>

                            <button
                                onClick={() => handleOpen(letter)}
                                className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-white"
                            >
                                {letter.is_opened ? "Read Again" : "Open"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
