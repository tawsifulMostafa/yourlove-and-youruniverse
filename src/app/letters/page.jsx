"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/shared/Navbar";
import Modal from "@/components/shared/Modal";
import toast from "react-hot-toast";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import { hasEmailLoginPassword } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { getFriendlyErrorMessage } from "@/lib/errors";

export default function LettersPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [couple, setCouple] = useState(null);
    const [letters, setLetters] = useState([]);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [editingLetter, setEditingLetter] = useState(null);

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

        if (!user) {
            router.push("/login");
            return;
        }

        if (!hasEmailLoginPassword(user)) {
            router.push("/auth/setup-password");
            return;
        }

        setUser(user);

        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        setProfile(profileData);
        setCouple(null);

        if (!profileData?.couple_id) return;

        const { data: coupleData, error: coupleError } = await supabase
            .from("couples")
            .select("*")
            .eq("id", profileData.couple_id)
            .maybeSingle();

        if (coupleError) {
            console.error("Couple load error:", coupleError.message);
        } else {
            setCouple(coupleData);
        }

        const { data: lettersData } = await supabase
            .from("letters")
            .select("*")
            .eq("couple_id", profileData.couple_id)
            .order("created_at", { ascending: false });

        setLetters(lettersData || []);
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const handleCreate = async () => {
        if (isDisconnectPending(couple)) {
            toast.error("Your shared world is paused while disconnect is scheduled.");
            return;
        }

        if (!profile?.couple_id || !user?.id) {
            toast.error("Connect with your partner first");
            return;
        }

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
            toast.error(getFriendlyErrorMessage(error));
            return;
        }

        toast.success("Letter saved");

        setForm({ title: "", condition: "", message: "" });
        loadData();
    };

    const disconnectPending = isDisconnectPending(couple);

    const handleOpen = async (letter) => {
        if (!letter.is_opened) {
            await supabase
                .from("letters")
                .update({ is_opened: true })
                .eq("id", letter.id);
        }

        setSelectedLetter({ ...letter, is_opened: true });
        setLetters((current) =>
            current.map((item) =>
                item.id === letter.id ? { ...item, is_opened: true } : item
            )
        );
    };

    const handleStartEdit = (letter) => {
        setEditingLetter(letter);
        setForm({
            title: letter.title || "",
            condition: letter.open_condition || "",
            message: letter.message || "",
        });
    };

    const handleUpdate = async () => {
        if (!editingLetter || disconnectPending) return;

        if (!form.title || !form.message) {
            toast.error("Fill title and message");
            return;
        }

        const { error } = await supabase
            .from("letters")
            .update({
                title: form.title,
                open_condition: form.condition,
                message: form.message,
            })
            .eq("id", editingLetter.id)
            .eq("couple_id", profile.couple_id);

        if (error) {
            toast.error(getFriendlyErrorMessage(error));
            return;
        }

        toast.success("Letter updated");
        setEditingLetter(null);
        setForm({ title: "", condition: "", message: "" });
        await loadData();
    };

    const handleDelete = async (letter) => {
        if (!profile?.couple_id) return;

        const { error } = await supabase
            .from("letters")
            .delete()
            .eq("id", letter.id)
            .eq("couple_id", profile.couple_id);

        if (error) {
            toast.error(getFriendlyErrorMessage(error));
            return;
        }

        toast.success("Letter deleted");
        if (selectedLetter?.id === letter.id) setSelectedLetter(null);
        await loadData();
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
                        {editingLetter ? "Edit Letter" : "Write a Letter"}
                    </h2>

                    {disconnectPending && (
                        <div className="mt-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                            Your shared world is paused. You can cancel disconnect within {formatDisconnectCountdown(couple?.disconnect_delete_after)} from Profile.
                        </div>
                    )}

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
                        onClick={editingLetter ? handleUpdate : handleCreate}
                        disabled={disconnectPending}
                        className="mt-4 w-full rounded-xl bg-[var(--accent)] py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {disconnectPending
                            ? "Paused during disconnect"
                            : editingLetter
                                ? "Update Letter"
                                : "Save Letter"}
                    </button>
                    {editingLetter && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingLetter(null);
                                setForm({ title: "", condition: "", message: "" });
                            }}
                            className="mt-3 w-full rounded-xl border border-[var(--border)] py-3 text-[var(--muted)] transition hover:text-[var(--text)]"
                        >
                            Cancel edit
                        </button>
                    )}
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

                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleOpen(letter)}
                                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white"
                                >
                                    {letter.is_opened ? "Read Again" : "Open"}
                                </button>
                                <button
                                    onClick={() => handleStartEdit(letter)}
                                    disabled={disconnectPending}
                                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--surface-accent)] disabled:opacity-60"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(letter)}
                                    disabled={disconnectPending}
                                    className="rounded-lg border border-[var(--danger-border)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal
                isOpen={!!selectedLetter}
                onClose={() => setSelectedLetter(null)}
                maxWidth="max-w-2xl"
            >
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                        Open when {selectedLetter?.open_condition || "anytime"}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                        {selectedLetter?.title}
                    </h2>
                    <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
                        {selectedLetter?.message}
                    </p>
                    <button
                        type="button"
                        onClick={() => setSelectedLetter(null)}
                        className="mt-6 w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
}
