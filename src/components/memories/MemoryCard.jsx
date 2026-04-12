import Image from "next/image";

export default function MemoryCard({ memory, onClick, formatTime }) {
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
                    {formatTime(memory.created_at)}
                </p>

                {memory.note && (
                    <p className="mt-3 line-clamp-3 text-sm text-[var(--muted)]">
                        {memory.note}
                    </p>
                )}
            </div>
        </div>
    );
}
