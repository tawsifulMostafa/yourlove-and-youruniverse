"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Mail, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Modal from "@/components/shared/Modal";
import PageSkeleton from "@/components/shared/PageSkeleton";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import { hasEmailLoginPassword } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";

const CATEGORY_OPTIONS = [
    "Miss me",
    "Feeling sad",
    "Need courage",
    "Can't sleep",
    "Anytime",
    "Custom",
];

const emptyForm = {
    title: "",
    condition: "Anytime",
    customCondition: "",
    message: "",
};

const fieldClass =
    "mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25";

function getConditionFromForm(form) {
    if (form.condition === "Custom") return form.customCondition.trim();
    return form.condition;
}

function getFormFromLetter(letter) {
    const condition = letter.open_condition || "Anytime";
    const isKnownCondition = CATEGORY_OPTIONS.includes(condition);

    return {
        title: letter.title || "",
        condition: isKnownCondition ? condition : "Custom",
        customCondition: isKnownCondition ? "" : condition,
        message: letter.message || "",
    };
}

function LetterCard({ letter, disconnectPending, onOpen, onEdit, onDelete }) {
    return (
        <article className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition duration-200 hover:-translate-y-1">
            <div className="absolute inset-x-0 top-0 h-12 bg-[var(--surface-accent)] opacity-70" />
            <div className="relative">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent)]">
                        <Mail size={22} />
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${letter.is_opened
                        ? "bg-[var(--surface-soft)] text-[var(--muted)]"
                        : "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        }`}>
                        {letter.is_opened ? "Opened" : "Sealed"}
                    </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-[var(--text)]">
                    {letter.title}
                </h3>
                <p className="mt-2 w-fit rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                    Open when {letter.open_condition || "Anytime"}
                </p>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {letter.is_opened ? letter.message : "A sealed note waiting for the right moment."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onOpen(letter)}
                        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
                    >
                        {letter.is_opened ? "Read Again" : "Open"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(letter)}
                        disabled={disconnectPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)] disabled:opacity-60"
                    >
                        <Edit3 size={15} />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(letter)}
                        disabled={disconnectPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--danger-border)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
                    >
                        <Trash2 size={15} />
                        Delete
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function LettersPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [couple, setCouple] = useState(null);
    const [letters, setLetters] = useState([]);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [editingLetter, setEditingLetter] = useState(null);
    const [showLetterModal, setShowLetterModal] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [form, setForm] = useState(emptyForm);

    const loadData = useCallback(async () => {
        setPageLoading(true);

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
        setLetters([]);

        if (!profileData?.couple_id) {
            setPageLoading(false);
            return;
        }

        const [{ data: coupleData, error: coupleError }, { data: lettersData }] =
            await Promise.all([
                supabase
                    .from("couples")
                    .select("*")
                    .eq("id", profileData.couple_id)
                    .maybeSingle(),
                supabase
                    .from("letters")
                    .select("*")
                    .eq("couple_id", profileData.couple_id)
                    .order("created_at", { ascending: false }),
            ]);

        if (coupleError) console.error("Couple load error:", coupleError.message);
        else setCouple(coupleData);

        setLetters(lettersData || []);
        setPageLoading(false);
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const disconnectPending = isDisconnectPending(couple);

    if (pageLoading) {
        return <PageSkeleton />;
    }

    const resetLetterForm = () => {
        setForm(emptyForm);
        setEditingLetter(null);
        setShowLetterModal(false);
    };

    const handleNewLetter = () => {
        if (!profile?.couple_id) {
            toast.error("Connect with your partner first");
            router.push("/connect");
            return;
        }

        setForm(emptyForm);
        setEditingLetter(null);
        setShowLetterModal(true);
    };

    const handleStartEdit = (letter) => {
        setEditingLetter(letter);
        setForm(getFormFromLetter(letter));
        setShowLetterModal(true);
    };

    const handleSaveLetter = async () => {
        if (disconnectPending) {
            toast.error("Your shared world is paused while disconnect is scheduled.");
            return;
        }

        if (!profile?.couple_id || !user?.id) {
            toast.error("Connect with your partner first");
            return;
        }

        const condition = getConditionFromForm(form);
        const trimmedTitle = form.title.trim();
        const trimmedMessage = form.message.trim();

        if (!trimmedTitle || !trimmedMessage) {
            toast.error("Title and message are required");
            return;
        }

        if (!condition) {
            toast.error("Choose when this letter should be opened");
            return;
        }

        const payload = {
            title: trimmedTitle,
            open_condition: condition,
            message: trimmedMessage,
        };

        const { error } = editingLetter
            ? await supabase
                .from("letters")
                .update(payload)
                .eq("id", editingLetter.id)
                .eq("couple_id", profile.couple_id)
            : await supabase.from("letters").insert({
                ...payload,
                couple_id: profile.couple_id,
                sender_id: user.id,
            });

        if (error) {
            toast.error(getFriendlyErrorMessage(error));
            return;
        }

        toast.success(editingLetter ? "Letter updated" : "Letter saved");
        resetLetterForm();
        await loadData();
    };

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

    const handleDelete = async (letter) => {
        if (!profile?.couple_id || disconnectPending) return;

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

            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                    <div className="bg-[linear-gradient(135deg,#d68d86_0%,#bd6f78_55%,#9d5c63_100%)] p-7 text-white sm:p-10">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                            Letter box
                        </p>
                        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-4xl font-semibold tracking-tight">
                                    Open When Letters
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                                    Keep words ready for the moments they need them.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleNewLetter}
                                disabled={disconnectPending}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:opacity-90 disabled:opacity-60"
                            >
                                <Plus size={18} />
                                {profile?.couple_id ? "New Letter" : "Connect first"}
                            </button>
                        </div>
                    </div>
                </section>

                {disconnectPending && (
                    <div className="mt-6 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                        Your shared world is paused. You can cancel disconnect within {formatDisconnectCountdown(couple?.disconnect_delete_after)} from Profile.
                    </div>
                )}

                <section className="mt-8">
                    {letters.length === 0 ? (
                        <div className="rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow)]">
                            <p className="text-lg font-semibold text-[var(--text)]">
                                No letters yet
                            </p>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                                Start with one note for a future moment.
                            </p>
                            <button
                                type="button"
                                onClick={handleNewLetter}
                                disabled={disconnectPending}
                                className="mt-6 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-60"
                            >
                                {profile?.couple_id ? "Write the first letter" : "Connect first"}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {letters.map((letter) => (
                                <LetterCard
                                    key={letter.id}
                                    letter={letter}
                                    disconnectPending={disconnectPending}
                                    onOpen={handleOpen}
                                    onEdit={handleStartEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Modal
                isOpen={showLetterModal}
                onClose={resetLetterForm}
                maxWidth="max-w-2xl"
            >
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                        {editingLetter ? "Edit letter" : "New letter"}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                        {editingLetter ? "Make this note feel right" : "Write something for later"}
                    </h2>

                    <input
                        placeholder="Letter title"
                        className={fieldClass}
                        value={form.title}
                        onChange={(event) => setForm({ ...form, title: event.target.value })}
                    />

                    <div className="mt-5">
                        <p className="text-sm font-semibold text-[var(--text)]">
                            Open when
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {CATEGORY_OPTIONS.map((condition) => (
                                <button
                                    key={condition}
                                    type="button"
                                    onClick={() => setForm({ ...form, condition })}
                                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${form.condition === condition
                                        ? "border-[var(--accent)] bg-[var(--surface-accent)] text-[var(--accent)]"
                                        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)]"
                                        }`}
                                >
                                    {condition}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.condition === "Custom" && (
                        <input
                            placeholder="Custom open when..."
                            className={fieldClass}
                            value={form.customCondition}
                            onChange={(event) => setForm({ ...form, customCondition: event.target.value })}
                        />
                    )}

                    <textarea
                        placeholder="Write your message..."
                        className={fieldClass}
                        rows={7}
                        value={form.message}
                        onChange={(event) => setForm({ ...form, message: event.target.value })}
                    />

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={resetLetterForm}
                            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--text)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveLetter}
                            disabled={disconnectPending}
                            className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-60"
                        >
                            {editingLetter ? "Update Letter" : "Save Letter"}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!selectedLetter}
                onClose={() => setSelectedLetter(null)}
                maxWidth="max-w-2xl"
            >
                <div className="rounded-[1.5rem] bg-[var(--surface-soft)] p-5">
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                        Open when {selectedLetter?.open_condition || "anytime"}
                    </p>
                    <div className="mt-4 rounded-[1.25rem] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                        <h2 className="text-2xl font-semibold text-[var(--text)]">
                            {selectedLetter?.title}
                        </h2>
                        <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-[var(--muted)]">
                            {selectedLetter?.message}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedLetter(null)}
                        className="mt-5 w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--accent-contrast)]"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
}
