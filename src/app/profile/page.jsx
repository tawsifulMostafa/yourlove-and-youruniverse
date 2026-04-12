"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Heart, UserRound } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const fieldClass =
    "mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 disabled:bg-[var(--surface-soft)] disabled:text-[var(--muted)]";

function getInitials(name, email) {
    const source = name?.trim() || email?.trim() || "You";
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function cleanFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, "-");
}

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    const previewUrlRef = useRef(null);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        about: "",
    });

    const loadProfile = useCallback(async () => {
        setLoading(true);

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            router.push("/login");
            return;
        }

        setUser(user);

        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError || !profileData) {
            const fallbackProfile = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || "",
                about: "",
                avatar_path: "",
                couple_id: null,
            };

            setProfile(fallbackProfile);
            setForm({
                name: fallbackProfile.name,
                email: fallbackProfile.email || "",
                about: "",
            });
            setAvatarPreview("");
            setLoading(false);
            return;
        }

        setProfile(profileData);
        setForm({
            name: profileData.name || user.user_metadata?.name || "",
            email: profileData.email || user.email || "",
            about: profileData.about || "",
        });

        if (profileData.avatar_path) {
            const { data: signedData, error: signedError } = await supabase.storage
                .from("avatars")
                .createSignedUrl(profileData.avatar_path, 60 * 60);

            if (signedError) {
                console.error("Avatar signed URL error:", signedError.message);
                setAvatarPreview("");
            } else {
                setAvatarPreview(signedData.signedUrl);
            }
        } else {
            setAvatarPreview("");
        }

        setLoading(false);
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProfile();

        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, [loadProfile]);

    const handlePhotoChange = (event) => {
        const nextFile = event.target.files?.[0];
        if (!nextFile) return;

        if (!nextFile.type.startsWith("image/")) {
            toast.error("Please choose an image file");
            return;
        }

        if (nextFile.size > 5 * 1024 * 1024) {
            toast.error("Profile photo must be under 5MB");
            return;
        }

        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }

        const nextPreviewUrl = URL.createObjectURL(nextFile);
        previewUrlRef.current = nextPreviewUrl;
        setSelectedFile(nextFile);
        setAvatarPreview(nextPreviewUrl);
    };

    const handleSave = async () => {
        if (!user) return;

        const trimmedName = form.name.trim();
        if (!trimmedName) {
            toast.error("Name is required");
            return;
        }

        setSaving(true);

        try {
            let avatarPath = profile?.avatar_path || null;

            if (selectedFile) {
                const filePath = `${user.id}/${Date.now()}-${cleanFileName(selectedFile.name)}`;
                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, selectedFile, {
                        upsert: true,
                    });

                if (uploadError) {
                    toast.error(uploadError.message);
                    setSaving(false);
                    return;
                }

                avatarPath = filePath;
            }

            const { error: profileError } = await supabase.from("profiles").upsert({
                id: user.id,
                email: form.email || user.email,
                name: trimmedName,
                about: form.about,
                avatar_path: avatarPath,
                couple_id: profile?.couple_id || null,
                updated_at: new Date().toISOString(),
            });

            if (profileError) {
                toast.error(profileError.message);
                setSaving(false);
                return;
            }

            toast.success("Profile saved");
            setSelectedFile(null);
            await loadProfile();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        }

        setSaving(false);
    };

    const initials = getInitials(form.name, form.email);
    const displayName = form.name.trim() || "Your name";
    const displayEmail = form.email || "your@email.com";

    return (
        <div className="min-h-screen bg-[var(--app-bg-soft)]">
            <Navbar />

            <main className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
                <div className="text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
                        Your little corner
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
                        My Profile
                    </h1>
                </div>

                <section className="mx-auto mt-9 max-w-xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                    <div className="bg-[var(--surface-accent)] px-6 pb-20 pt-8 text-center sm:px-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                            Your little corner
                        </p>
                        <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--muted)]">
                            Keep your shared world feeling personal.
                        </p>
                    </div>

                    <div className="-mt-16 px-6 pb-7 sm:px-8">
                        <div className="flex flex-col items-center">
                            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[var(--accent)] p-1 shadow-[0_14px_34px_rgba(157,92,99,0.24)]">
                            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
                                {avatarPreview ? (
                                    <div
                                        className="h-full w-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${avatarPreview})` }}
                                        aria-label="Profile photo preview"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--surface-accent)] text-[var(--accent)]">
                                        <UserRound size={30} />
                                        <span className="mt-1 text-xl font-semibold">
                                            {initials}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--surface)] bg-[var(--accent)] text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition hover:scale-105 hover:opacity-95"
                                aria-label="Change profile photo"
                                title="Change photo"
                            >
                                <Camera size={17} />
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />

                            <p className="mt-4 text-sm font-medium text-[var(--text)]">
                                {displayName}
                            </p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
                            >
                                Change photo
                            </button>
                            {selectedFile && (
                                <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                                    New photo selected. Save to keep it.
                                </p>
                            )}
                    </div>

                    <div className="mt-7 space-y-5">
                        <label className="block text-sm font-medium text-[var(--text)]">
                            Name
                            <span className="mt-1 block text-xs font-normal text-[var(--muted)]">
                                This is how your name appears in your shared space.
                            </span>
                            <input
                                className={fieldClass}
                                placeholder="Your name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="block text-sm font-medium text-[var(--text)]">
                            Email Address
                            <span className="mt-1 block text-xs font-normal text-[var(--muted)]">
                                Your login email stays private and read-only here.
                            </span>
                            <input
                                className={fieldClass}
                                value={form.email}
                                readOnly
                                disabled
                            />
                        </label>

                        <label className="block text-sm font-medium text-[var(--text)]">
                            About Me
                            <span className="mt-1 block text-xs font-normal text-[var(--muted)]">
                                Add a soft note your profile can carry.
                            </span>
                            <textarea
                                className={fieldClass}
                                rows={4}
                                placeholder="A little note about you..."
                                value={form.about}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        about: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>

                    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-accent)] text-[var(--accent)]">
                                <Heart size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--text)]">
                                    {profile?.couple_id ? "Connected to partner" : "Not connected yet"}
                                </p>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                    {profile?.couple_id
                                        ? "Your private world is active."
                                        : "Start your shared space with an invite code."}
                                </p>
                                {!profile?.couple_id && (
                                    <Link
                                        href="/connect"
                                        className="mt-3 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                    >
                                        Connect now
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="mt-6 w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(157,92,99,0.24)] transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Saving your profile..." : "Save Changes"}
                    </button>

                        <div className="mt-6 border-t border-[var(--border)] pt-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                                Profile preview
                            </p>
                            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-accent)] text-sm font-semibold text-[var(--accent)]">
                                    {avatarPreview ? (
                                        <div
                                            className="h-full w-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${avatarPreview})` }}
                                            aria-label="Profile preview photo"
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--text)]">
                                        {displayName}
                                    </p>
                                    <p className="truncate text-sm text-[var(--muted)]">
                                        {displayEmail}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
