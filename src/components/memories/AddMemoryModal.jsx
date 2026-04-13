"use client";

import Modal from "@/components/shared/Modal";

const fieldClass =
    "mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

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
    previewUrl,
    mode = "add",
}) {
    const handleClose = () => {
        onClose();
        onReset();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-2xl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--accent)]">
                    {mode === "edit" ? "Edit Memory" : "Add Memory"}
                </h2>

                <button
                    onClick={handleClose}
                    className="text-2xl text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                    x
                </button>
            </div>

            <input
                type="text"
                placeholder="Memory title"
                className={fieldClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
                placeholder="Write a short note..."
                rows={4}
                className={fieldClass}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <label className="mt-3 block text-sm font-medium text-[var(--text)]">
                Memory date (optional)
                <input
                    type="date"
                    className={fieldClass}
                    value={form.memoryDate || ""}
                    onChange={(e) => setForm({ ...form, memoryDate: e.target.value })}
                />
            </label>

            <input
                id="memory-image-input"
                type="file"
                accept="image/*"
                className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-accent)] file:px-3 file:py-2 file:text-[var(--accent)]"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {previewUrl && (
                <div
                    className="mt-3 h-52 rounded-2xl border border-[var(--border)] bg-cover bg-center"
                    style={{ backgroundImage: `url(${previewUrl})` }}
                    aria-label="Memory image preview"
                />
            )}

            <button
                onClick={onSave}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-[var(--accent)] py-3 text-white transition disabled:opacity-60"
            >
                {loading ? "Saving..." : mode === "edit" ? "Update Memory" : "Save Memory"}
            </button>
        </Modal>
    );
}
