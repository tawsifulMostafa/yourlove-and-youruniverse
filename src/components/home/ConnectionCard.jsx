export default function ConnectionCard({ isConnected }) {
    return (
        <section className="relative -mt-16 px-6 z-10">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-black/5">

                <div className="flex items-start gap-4">

                    {/* icon */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3e7e9] text-xl">
                        {isConnected ? "💞" : "🔗"}
                    </div>

                    {/* text */}
                    <div>
                        <h2 className="text-xl font-semibold text-[#9d5c63]">
                            {isConnected ? "Partner connected 💞" : "Connect with your partner"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            {isConnected
                                ? "Your private world is active"
                                : "Enter your invite code to start your shared space"}
                        </p>
                    </div>

                </div>

            </div>
        </section>
    );
}