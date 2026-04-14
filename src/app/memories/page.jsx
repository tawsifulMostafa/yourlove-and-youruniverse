"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageSkeleton from "@/components/shared/PageSkeleton";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { formatMemoryTime } from "@/lib/utils";
import MemoryCard from "@/components/memories/MemoryCard";
import AddMemoryModal from "@/components/memories/AddMemoryModal";
import MemoryDetailModal from "@/components/memories/MemoryDetailModal";
import { useRouter } from "next/navigation";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import { hasEmailLoginPassword } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";

export default function MemoriesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [couple, setCouple] = useState(null);
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMemory, setEditingMemory] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState("");
    const filePreviewUrlRef = useRef("");

    const [form, setForm] = useState({
        title: "",
        note: "",
        memoryDate: "",
    });

    const [file, setFile] = useState(null);

    const loadData = useCallback(async () => {
        setPageLoading(true);

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            router.push("/login");
            return;
        }

        if (!hasEmailLoginPassword(user)) {
            router.push("/auth/setup-password");
            return;
        }

        setUser(user);

        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError || !profileData) {
            console.error(profileError);
            toast.error("Profile load failed");
            setPageLoading(false);
            return;
        }

        setProfile(profileData);
        setCouple(null);

        if (!profileData.couple_id) {
            setMemories([]);
            setPageLoading(false);
            return;
        }

        const [{ data: coupleData, error: coupleError }, { data: memoriesData, error: memoriesError }] =
            await Promise.all([
                supabase
                    .from("couples")
                    .select("*")
                    .eq("id", profileData.couple_id)
                    .maybeSingle(),
                supabase
                    .from("memories")
                    .select("*")
                    .eq("couple_id", profileData.couple_id)
                    .order("created_at", { ascending: false }),
            ]);

        if (coupleError) console.error("Couple load error:", coupleError.message);
        else setCouple(coupleData);

        if (memoriesError) {
            console.error(memoriesError);
            toast.error("Failed to load memories");
            setPageLoading(false);
            return;
        }

        const memoriesWithSignedUrls = await Promise.all(
            (memoriesData || []).map(async (memory) => {
                if (!memory.image_url) {
                    return { ...memory, signedUrl: null };
                }

                const { data: signedData, error: signedError } = await supabase.storage
                    .from("memories")
                    .createSignedUrl(memory.image_url, 60 * 60);

                if (signedError) {
                    console.error("Signed URL error:", signedError.message);
                    return { ...memory, signedUrl: null };
                }

                return {
                    ...memory,
                    signedUrl: signedData.signedUrl,
                };
            })
        );

        setMemories(memoriesWithSignedUrls);
        setPageLoading(false);
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    useEffect(() => {
        return () => {
            if (filePreviewUrlRef.current) {
                URL.revokeObjectURL(filePreviewUrlRef.current);
            }
        };
    }, []);

    const handleSetFile = (nextFile) => {
        if (filePreviewUrlRef.current) {
            URL.revokeObjectURL(filePreviewUrlRef.current);
            filePreviewUrlRef.current = "";
        }

        setFile(nextFile);

        if (nextFile) {
            const nextPreviewUrl = URL.createObjectURL(nextFile);
            filePreviewUrlRef.current = nextPreviewUrl;
            setFilePreviewUrl(nextPreviewUrl);
        } else {
            setFilePreviewUrl("");
        }
    };

    const resetForm = () => {
        setForm({
            title: "",
            note: "",
            memoryDate: "",
        });
        handleSetFile(null);
        setEditingMemory(null);

        const fileInput = document.getElementById("memory-image-input");
        if (fileInput) fileInput.value = "";
    };

    const createMemoryFileName = (fileName) => {
        const fileExt = fileName.split(".").pop();
        const randomValues = new Uint32Array(2);
        crypto.getRandomValues(randomValues);
        const randomSuffix = Array.from(randomValues, (value) => value.toString(36)).join("-");

        return `${Date.now()}-${randomSuffix}.${fileExt}`;
    };

    const handleSaveMemory = async () => {
        if (isDisconnectPending(couple)) {
            toast.error("Your shared world is paused while disconnect is scheduled.");
            return;
        }

        if (!form.title || (!file && !editingMemory)) {
            toast.error("Title and image are required");
            return;
        }

        if (!profile?.couple_id || !user?.id) {
            toast.error("User or couple info missing");
            return;
        }

        setLoading(true);

        try {
            let filePath = editingMemory?.image_url || null;
            const previousImagePath = editingMemory?.image_url || null;

            if (file) {
                const fileName = createMemoryFileName(file.name);

                filePath = `${profile.couple_id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("memories")
                    .upload(filePath, file, {
                        contentType: file.type,
                    });

                if (uploadError) {
                    toast.error(getFriendlyErrorMessage(uploadError));
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                couple_id: profile.couple_id,
                user_id: user.id,
                title: form.title,
                note: form.note,
                memory_date: form.memoryDate || null,
                image_url: filePath,
            };

            const { error: saveError } = editingMemory
                ? await supabase
                    .from("memories")
                    .update(payload)
                    .eq("id", editingMemory.id)
                    .eq("couple_id", profile.couple_id)
                : await supabase.from("memories").insert(payload);

            if (saveError) {
                if (file && filePath) {
                    const { error: cleanupError } = await supabase.storage
                        .from("memories")
                        .remove([filePath]);

                    if (cleanupError) console.error("New memory image cleanup error:", cleanupError.message);
                }

                toast.error(getFriendlyErrorMessage(saveError));
                setLoading(false);
                return;
            }

            if (editingMemory && previousImagePath && previousImagePath !== filePath) {
                const { error: oldImageDeleteError } = await supabase.storage
                    .from("memories")
                    .remove([previousImagePath]);

                if (oldImageDeleteError) console.error("Old memory image cleanup error:", oldImageDeleteError.message);
            }

            toast.success(editingMemory ? "Memory updated" : "Memory added");
            resetForm();
            setShowAddModal(false);
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        }

        setLoading(false);
    };

    const handleStartEdit = (memory) => {
        setSelectedMemory(null);
        setEditingMemory(memory);
        setForm({
            title: memory.title || "",
            note: memory.note || "",
            memoryDate: memory.memory_date || "",
        });
        handleSetFile(null);
        setShowAddModal(true);
    };

    const handleDelete = async (memory) => {
        if (!profile?.couple_id || disconnectPending) return;

        const { error } = await supabase
            .from("memories")
            .delete()
            .eq("id", memory.id)
            .eq("couple_id", profile.couple_id);

        if (error) {
            toast.error(getFriendlyErrorMessage(error));
            return;
        }

        if (memory.image_url) {
            const { error: storageError } = await supabase.storage
                .from("memories")
                .remove([memory.image_url]);

            if (storageError) console.error("Memory image delete error:", storageError.message);
        }

        toast.success("Memory deleted");
        if (selectedMemory?.id === memory.id) setSelectedMemory(null);
        await loadData();
    };

    const disconnectPending = isDisconnectPending(couple);

    if (pageLoading) {
        return <PageSkeleton variant="cards" />;
    }

    const handleOpenAddMemory = () => {
        if (disconnectPending) {
            toast.error("Your shared world is paused while disconnect is scheduled.");
            return;
        }

        if (!profile?.couple_id) {
            toast.error("Connect with your partner first");
            router.push("/connect");
            return;
        }

        setShowAddModal(true);
    };

    return (
        <div className="min-h-screen bg-[var(--app-bg-soft)]">
            <Navbar />

            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-[var(--accent)]">
                            Shared Memories
                        </h1>
                        <p className="mt-2 text-[var(--muted)]">
                            A quiet collection of your most meaningful moments.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenAddMemory}
                        disabled={disconnectPending}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[var(--shadow)] transition hover:scale-105"
                        aria-label="Add memory"
                        title="Add memory"
                    >
                        <Plus size={22} />
                    </button>
                </div>

                <div className="mt-10">
                    {disconnectPending && (
                        <div className="mb-6 rounded-3xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)] shadow-[var(--shadow)]">
                            Your shared world is paused. You can cancel disconnect within {formatDisconnectCountdown(couple?.disconnect_delete_after)} from Profile.
                        </div>
                    )}

                    {memories.length === 0 ? (
                        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center shadow-[var(--shadow)]">
                            <p className="text-lg font-medium text-[var(--text)]">
                                No memories yet
                            </p>
                            <p className="mt-2 text-[var(--muted)]">
                                Start saving your beautiful moments together.
                            </p>

                            <button
                                onClick={handleOpenAddMemory}
                                disabled={disconnectPending}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Plus size={18} />
                                {disconnectPending
                                    ? "Paused during disconnect"
                                    : profile?.couple_id
                                        ? "Add your first memory"
                                        : "Connect first"}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {memories.map((memory) => (
                                <MemoryCard
                                    key={memory.id}
                                    memory={memory}
                                    onClick={setSelectedMemory}
                                    onEdit={handleStartEdit}
                                    onDelete={handleDelete}
                                    formatTime={formatMemoryTime}
                                    disabledActions={disconnectPending}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AddMemoryModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                form={form}
                setForm={setForm}
                file={file}
                setFile={handleSetFile}
                onSave={handleSaveMemory}
                loading={loading}
                onReset={resetForm}
                previewUrl={filePreviewUrl || editingMemory?.signedUrl || ""}
                mode={editingMemory ? "edit" : "add"}
            />

            <MemoryDetailModal
                memory={selectedMemory}
                onClose={() => setSelectedMemory(null)}
                formatTime={formatMemoryTime}
            />
        </div>
    );
}
