"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { formatMemoryTime } from "@/lib/utils";
import MemoryCard from "@/components/memories/MemoryCard";
import AddMemoryModal from "@/components/memories/AddMemoryModal";
import MemoryDetailModal from "@/components/memories/MemoryDetailModal";
import { useRouter } from "next/navigation";

export default function MemoriesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const [form, setForm] = useState({
        title: "",
        note: "",
    });

    const [file, setFile] = useState(null);

    const loadData = useCallback(async () => {
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
            console.error(profileError);
            toast.error("Profile load failed");
            return;
        }

        setProfile(profileData);

        if (!profileData.couple_id) {
            setMemories([]);
            return;
        }

        const { data: memoriesData, error: memoriesError } = await supabase
            .from("memories")
            .select("*")
            .eq("couple_id", profileData.couple_id)
            .order("created_at", { ascending: false });

        if (memoriesError) {
            console.error(memoriesError);
            toast.error("Failed to load memories");
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
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const resetForm = () => {
        setForm({
            title: "",
            note: "",
        });
        setFile(null);

        const fileInput = document.getElementById("memory-image-input");
        if (fileInput) fileInput.value = "";
    };

    const handleCreate = async () => {
        if (!form.title || !file) {
            toast.error("Title and image are required");
            return;
        }

        if (!profile?.couple_id || !user?.id) {
            toast.error("User or couple info missing");
            return;
        }

        setLoading(true);

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.${fileExt}`;

            const filePath = `${profile.couple_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("memories")
                .upload(filePath, file);

            if (uploadError) {
                toast.error(uploadError.message);
                setLoading(false);
                return;
            }

            const { error: insertError } = await supabase.from("memories").insert({
                couple_id: profile.couple_id,
                user_id: user.id,
                title: form.title,
                note: form.note,
                image_url: filePath,
            });

            if (insertError) {
                toast.error(insertError.message);
                setLoading(false);
                return;
            }

            toast.success("Memory added");
            resetForm();
            setShowAddModal(false);
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f6f1eb]">
            <Navbar />

            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-[#9d5c63]">
                            Shared Memories
                        </h1>
                        <p className="mt-2 text-gray-600">
                            A quiet collection of your most meaningful moments.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9d5c63] text-white shadow-[0_10px_20px_rgba(0,0,0,0.08)] transition hover:scale-105"
                        aria-label="Add memory"
                        title="Add memory"
                    >
                        <Plus size={22} />
                    </button>
                </div>

                <div className="mt-10">
                    {memories.length === 0 ? (
                        <div className="rounded-3xl bg-white p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                            <p className="text-lg font-medium text-gray-800">
                                No memories yet
                            </p>
                            <p className="mt-2 text-gray-500">
                                Start saving your beautiful moments together.
                            </p>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#9d5c63] px-5 py-3 text-white"
                            >
                                <Plus size={18} />
                                Add your first memory
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {memories.map((memory) => (
                                <MemoryCard
                                    key={memory.id}
                                    memory={memory}
                                    onClick={setSelectedMemory}
                                    formatTime={formatMemoryTime}
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
                setFile={setFile}
                onSave={handleCreate}
                loading={loading}
                onReset={resetForm}
            />

            <MemoryDetailModal
                memory={selectedMemory}
                onClose={() => setSelectedMemory(null)}
                formatTime={formatMemoryTime}
            />
        </div>
    );
}
