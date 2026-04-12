export default function MemoryCard({ memory, onClick, formatTime }) {
    return (
        <div
            onClick={() => onClick(memory)}
            className="cursor-pointer overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition duration-200 ease-out hover:-translate-y-1"
        >
            {memory.signedUrl ? (
                <img
                    src={memory.signedUrl}
                    alt={memory.title}
                    className="h-56 w-full object-cover"
                />
            ) : (
                <div className="flex h-56 items-center justify-center bg-gray-100 text-gray-400">
                    No image
                </div>
            )}

            <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">
                    {memory.title}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    {formatTime(memory.created_at)}
                </p>

                {memory.note && (
                    <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                        {memory.note}
                    </p>
                )}
            </div>
        </div>
    );
}