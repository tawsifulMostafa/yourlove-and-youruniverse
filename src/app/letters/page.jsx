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
        <div className="min-h-screen bg-[#f6f1eb]">
            <Navbar />

            <div className="mx-auto max-w-3xl px-6 py-10">
                <h1 className="text-center text-3xl font-semibold text-[#9d5c63]">
                    Open When Letters
                </h1>

                {/* Create Card */}
                <div className="mt-8 rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                    <h2 className="text-xl font-semibold text-[#9d5c63]">
                        Write a Letter
                    </h2>

                    <input
                        placeholder="Title"
                        className="mt-3 w-full rounded-xl border border-black/10 p-3 outline-none focus:ring-2 focus:ring-[#9d5c63]/20"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />

                    <input
                        placeholder="Open when... (optional)"
                        className="mt-3 w-full rounded-xl border border-black/10 p-3 outline-none focus:ring-2 focus:ring-[#9d5c63]/20"
                        value={form.condition}
                        onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    />

                    <textarea
                        placeholder="Write your message..."
                        className="mt-3 w-full rounded-xl border border-black/10 p-3 outline-none focus:ring-2 focus:ring-[#9d5c63]/20"
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />

                    <button
                        onClick={handleCreate}
                        className="mt-4 w-full rounded-xl bg-[#9d5c63] py-3 text-white"
                    >
                        Save Letter
                    </button>
                </div>

                {/* Letters List */}
                <div className="mt-10 space-y-4">
                    {letters.map((letter) => (
                        <div
                            key={letter.id}
                            className="rounded-2xl bg-white p-5 shadow-[0_10px_20px_rgba(0,0,0,0.06)]"
                        >
                            <h3 className="text-lg font-semibold text-gray-900">
                                {letter.title}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Open when: {letter.open_condition || "Anytime"}
                            </p>

                            <button
                                onClick={() => handleOpen(letter)}
                                className="mt-3 rounded-lg bg-[#9d5c63] px-4 py-2 text-white"
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
