"use client";

import Modal from "@/components/shared/Modal";

export default function AddMemoryModal({
    isOpen,
    onClose,
    form,
    setForm,
    file,
    setFile,
    onSave,
    loading,
    onReset,
}) {
    const handleClose = () => {
        onClose();
        onReset();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-2xl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#9d5c63]">Add Memory</h2>

                <button
                    onClick={handleClose}
                    className="text-2xl text-gray-500 transition hover:text-black"
                >
                    x
                </button>
            </div>

            <input
                type="text"
                placeholder="Memory title"
                className="mt-3 w-full rounded-xl border border-black/10 p-3 outline-none transition focus:border-[#9d5c63]"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
                placeholder="Write a short note..."
                rows={4}
                className="mt-3 w-full rounded-xl border border-black/10 p-3 outline-none transition focus:border-[#9d5c63]"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <input
                id="memory-image-input"
                type="file"
                accept="image/*"
                className="mt-3 w-full rounded-xl border border-black/10 p-3"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button
                onClick={onSave}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-[#9d5c63] py-3 text-white transition disabled:opacity-60"
            >
                {loading ? "Saving..." : "Save Memory"}
            </button>
        </Modal>
    );
}
