"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Clock, Heart, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Modal from "@/components/shared/Modal";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { hasEmailLoginPassword, trustCurrentDevice } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
    formatDisconnectCountdown,
    generateDisconnectPhrase,
    isDisconnectPending,
} from "@/lib/disconnect";

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

function DefaultProfilePhoto({ initials, large = false }) {
    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--surface-soft)]">
            <div className="absolute top-[18%] h-[30%] w-[30%] rounded-full bg-[var(--muted)]/45" />
            <div className="absolute bottom-[-10%] h-[48%] w-[66%] rounded-t-full bg-[var(--muted)]/35" />
            <span className={`relative z-10 mt-10 font-semibold text-[var(--accent)] ${large ? "text-2xl" : "text-sm"}`}>
                {initials}
            </span>
        </div>
    );
}

async function addAvatarSignedUrl(profile) {
    if (!profile?.avatar_path) return { ...profile, avatarUrl: "" };

    const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_path, 60 * 60);

    if (error) {
        console.error("Partner avatar signed URL error:", error.message);
        return { ...profile, avatarUrl: "" };
    }

    return { ...profile, avatarUrl: data.signedUrl };
}

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    const previewUrlRef = useRef(null);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [couple, setCouple] = useState(null);
    const [hasPartner, setHasPartner] = useState(false);
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);
    const [disconnectPhrase, setDisconnectPhrase] = useState("");
    const [disconnectInput, setDisconnectInput] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        about: "",
    });
    const [passwordForm, setPasswordForm] = useState({
        password: "",
        confirmPassword: "",
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

        if (!hasEmailLoginPassword(user)) {
            router.replace("/auth/setup-password");
            return;
        }

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
            setCouple(null);
            setHasPartner(false);
            setPartnerProfile(null);
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
        setCouple(null);
        setHasPartner(false);
        setPartnerProfile(null);
        setForm({
            name: profileData.name || user.user_metadata?.name || "",
            email: profileData.email || user.email || "",
            about: profileData.about || "",
        });

        if (profileData.couple_id) {
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

            const { data: partnerData, error: partnerError } = await supabase
                .from("profiles")
                .select("id, name, email, about, avatar_path")
                .eq("couple_id", profileData.couple_id)
                .neq("id", user.id)
                .maybeSingle();

            if (partnerError) {
                console.error("Partner load error:", partnerError.message);
            } else {
                setHasPartner(Boolean(partnerData));
                setPartnerProfile(partnerData ? await addAvatarSignedUrl(partnerData) : null);
            }
        }

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
                        contentType: selectedFile.type,
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

    const handlePasswordSave = async () => {
        const password = passwordForm.password.trim();
        const confirmPassword = passwordForm.confirmPassword.trim();

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setPasswordSaving(true);

        const { error } = await supabase.auth.updateUser({
            password,
            data: {
                ...(user?.user_metadata || {}),
                password_set: true,
            },
        });

        setPasswordSaving(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        setPasswordForm({ password: "", confirmPassword: "" });
        if (user?.id) trustCurrentDevice(user.id);
        toast.success("Password saved");
        setShowPasswordModal(false);
        await loadProfile();
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordForm({ password: "", confirmPassword: "" });
    };

    const openDisconnectModal = () => {
        setDisconnectPhrase(generateDisconnectPhrase());
        setDisconnectInput("");
        setShowDisconnectModal(true);
    };

    const closeDisconnectModal = () => {
        setShowDisconnectModal(false);
        setDisconnectInput("");
    };

    const handleRequestDisconnect = async () => {
        if (disconnectInput !== disconnectPhrase) return;

        setDisconnecting(true);

        const { error } = await supabase.rpc("request_partner_disconnect", {});

        if (error) {
            toast.error(getFriendlyErrorMessage(error));
            setDisconnecting(false);
            return;
        }

        toast.success("Disconnect scheduled. You can cancel within 24 hours.");
        closeDisconnectModal();
        await loadProfile();
        setDisconnecting(false);
    };

    const handleCancelDisconnect = async () => {
        setDisconnecting(true);

        const { error } = await supabase.rpc("cancel_partner_disconnect", {});

        if (error) {
            toast.error(getFriendlyErrorMessage(error));
            setDisconnecting(false);
            return;
        }

        toast.success("Disconnect canceled");
        await loadProfile();
        setDisconnecting(false);
    };

    const handleResetInviteSpace = async () => {
        if (!profile?.couple_id || hasPartner || disconnectPending) return;

        setDisconnecting(true);

        const { error } = await supabase.rpc("reset_empty_invite_space");

        if (error) {
            toast.error(getFriendlyErrorMessage(error));
            setDisconnecting(false);
            return;
        }

        toast.success("Invite space reset");
        await loadProfile();
        setDisconnecting(false);
    };

    const initials = getInitials(form.name, form.email);
    const displayName = form.name.trim() || "Your name";
    const displayEmail = form.email || "your@email.com";
    const disconnectPending = isDisconnectPending(couple);
    const disconnectCountdown = formatDisconnectCountdown(couple?.disconnect_delete_after);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg-soft)] px-4">
                <p className="text-sm font-medium text-[var(--muted)]">Loading...</p>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--app-bg-soft)]">
            <Navbar />

            <main className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
                <div className="text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
                        Account
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
                        {displayName}
                    </h1>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                        This is the profile your partner will see.
                    </p>
                </div>

                <section className="mx-auto mt-9 max-w-xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                    <div className="bg-[var(--surface-accent)] px-6 pb-20 pt-8 text-center sm:px-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                            Your profile
                        </p>
                        <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--muted)]">
                            Add a photo, name, and a small note for your shared world.
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
                                    <DefaultProfilePhoto initials={initials} large />
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
                            <p className="mt-1 max-w-xs truncate text-sm text-[var(--muted)]">
                                {displayEmail}
                            </p>
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
                                {disconnectPending ? <Clock size={18} /> : <Heart size={18} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--text)]">
                                    {disconnectPending
                                        ? "Disconnect scheduled"
                                        : profile?.couple_id
                                            ? hasPartner
                                                ? "Connected to partner"
                                                : "Waiting for partner"
                                            : "Not connected yet"}
                                </p>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                    {disconnectPending
                                        ? `Your shared world is paused. You can cancel within ${disconnectCountdown}.`
                                        : profile?.couple_id
                                            ? hasPartner
                                                ? "Your private world is active."
                                                : `Share your invite code${couple?.invite_code ? `: ${couple.invite_code}` : ""}.`
                                            : "Start your shared space with an invite code."}
                                </p>
                                {hasPartner && partnerProfile && !disconnectPending && (
                                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-accent)] text-sm font-semibold text-[var(--accent)]">
                                            {partnerProfile.avatarUrl ? (
                                                <div
                                                    className="h-full w-full bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${partnerProfile.avatarUrl})` }}
                                                    aria-label="Partner profile photo"
                                                />
                                            ) : (
                                                getInitials(partnerProfile.name, partnerProfile.email)
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-[var(--text)]">
                                                {partnerProfile.name || "Your partner"}
                                            </p>
                                            <p className="line-clamp-2 text-sm text-[var(--muted)]">
                                                {partnerProfile.about || "Sharing this private world with you."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {!profile?.couple_id && (
                                    <Link
                                        href="/connect"
                                        className="mt-3 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                    >
                                        Connect now
                                    </Link>
                                )}
                                {profile?.couple_id && (
                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        {disconnectPending ? (
                                            <button
                                                type="button"
                                                onClick={handleCancelDisconnect}
                                                disabled={disconnecting}
                                                className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                                            >
                                                {disconnecting ? "Canceling..." : "Cancel disconnect"}
                                            </button>
                                        ) : hasPartner ? (
                                            <button
                                                type="button"
                                                onClick={openDisconnectModal}
                                                disabled={disconnecting}
                                                className="inline-flex items-center gap-2 rounded-lg border border-[var(--danger-border)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
                                            >
                                                <Trash2 size={16} />
                                                Disconnect partner
                                            </button>
                                        ) : (
                                            <>
                                                <Link
                                                    href="/connect"
                                                    className="inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
                                                >
                                                    View invite code
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={handleResetInviteSpace}
                                                    disabled={disconnecting}
                                                    className="inline-flex rounded-lg border border-[var(--danger-border)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
                                                >
                                                    {disconnecting ? "Resetting..." : "Reset invite space"}
                                                </button>
                                            </>
                                        )}
                                    </div>
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

                        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                            <p className="text-sm font-semibold text-[var(--text)]">
                                Email login password
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                                New devices will still need an email code.
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(true)}
                                className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Change Password
                            </button>
                        </div>

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
                                        <DefaultProfilePhoto initials={initials} />
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

            <Modal isOpen={showPasswordModal} onClose={closePasswordModal} maxWidth="max-w-lg">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--text)]">
                        Change Password
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Set a new password for email login. New devices will still ask for an email code.
                    </p>
                </div>

                <div className="mt-5 space-y-3">
                    <input
                        type="password"
                        className={fieldClass}
                        placeholder="New password"
                        value={passwordForm.password}
                        onChange={(event) =>
                            setPasswordForm((current) => ({
                                ...current,
                                password: event.target.value,
                            }))
                        }
                        autoComplete="new-password"
                    />
                    <input
                        type="password"
                        className={fieldClass}
                        placeholder="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                            setPasswordForm((current) => ({
                                ...current,
                                confirmPassword: event.target.value,
                            }))
                        }
                        autoComplete="new-password"
                    />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={closePasswordModal}
                        disabled={passwordSaving}
                        className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)] disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handlePasswordSave}
                        disabled={passwordSaving}
                        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {passwordSaving ? "Saving..." : "Save Password"}
                    </button>
                </div>
            </Modal>

            <Modal isOpen={showDisconnectModal} onClose={closeDisconnectModal} maxWidth="max-w-lg">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)]">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--text)]">
                            Disconnect partner?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            Your shared world will pause now. You can cancel within 24 hours. After that, letters, memories, and the couple connection will be deleted.
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                    Type this phrase to confirm:
                    <span className="mt-2 block select-none rounded-lg bg-[var(--surface)] px-3 py-2 font-mono font-semibold text-[var(--danger)]">
                        {disconnectPhrase}
                    </span>
                </div>

                <label className="mt-5 block text-sm font-medium text-[var(--text)]">
                    Type this phrase to confirm
                    <input
                        value={disconnectInput}
                        onChange={(event) => setDisconnectInput(event.target.value)}
                        onPaste={(event) => event.preventDefault()}
                        onDrop={(event) => event.preventDefault()}
                        onContextMenu={(event) => event.preventDefault()}
                        autoComplete="off"
                        spellCheck={false}
                        className={fieldClass}
                        placeholder={disconnectPhrase}
                    />
                </label>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={closeDisconnectModal}
                        className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]"
                    >
                        Keep connected
                    </button>
                    <button
                        type="button"
                        onClick={handleRequestDisconnect}
                        disabled={disconnecting || disconnectInput !== disconnectPhrase}
                        className="rounded-xl bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {disconnecting ? "Scheduling..." : "Start disconnect"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
