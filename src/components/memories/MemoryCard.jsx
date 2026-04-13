import Image from "next/image";

export default function MemoryCard({ memory, onClick, onEdit, onDelete, formatTime, disabledActions = false }) {
    return (
        <div
            onClick={() => onClick(memory)}
            className="cursor-pointer overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] transition duration-200 ease-out hover:-translate-y-1"
        >
            {memory.signedUrl ? (
                <div className="relative h-56 w-full">
                    <Image
                        src={memory.signedUrl}
                        alt={memory.title}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>
            ) : (
                <div className="flex h-56 items-center justify-center bg-[var(--surface-soft)] text-[var(--muted)]">
                    No image
                </div>
            )}

            <div className="p-5">
                <h3 className="text-lg font-semibold text-[var(--text)]">
                    {memory.title}
                </h3>

                <p className="mt-1 text-sm text-[var(--muted)]">
                    {memory.memory_date || formatTime(memory.created_at)}
                </p>

                {memory.note && (
                    <p className="mt-3 line-clamp-3 text-sm text-[var(--muted)]">
                        {memory.note}
                    </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(memory);
                        }}
                        disabled={disabledActions}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--surface-accent)] disabled:opacity-60"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(memory);
                        }}
                        disabled={disabledActions}
                        className="rounded-lg border border-[var(--danger-border)] px-3 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
