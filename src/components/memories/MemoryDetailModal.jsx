"use client";

import Image from "next/image";
import Modal from "@/components/shared/Modal";

export default function MemoryDetailModal({
    memory,
    onClose,
    formatTime,
}) {
    return (
        <Modal isOpen={!!memory} onClose={onClose} maxWidth="max-w-3xl">
            <div className="relative">
                <button
                    onClick={onClose}
                    className="absolute right-0 top-0 text-2xl text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                    x
                </button>

                {memory?.signedUrl ? (
                    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl">
                        <Image
                            src={memory.signedUrl}
                            alt={memory.title}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="flex h-[420px] items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--muted)]">
                        No image
                    </div>
                )}

                <div className="pt-4">
                    <h3 className="text-2xl font-semibold text-[var(--text)]">
                        {memory?.title}
                    </h3>

                    <p className="mt-2 text-sm text-[var(--muted)]">
                        {memory ? formatTime(memory.created_at) : ""}
                    </p>

                    {memory?.note && (
                        <p className="mt-4 text-[var(--muted)]">{memory.note}</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}
