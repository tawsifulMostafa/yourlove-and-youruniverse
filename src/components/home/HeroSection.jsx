export default function HeroSection() {
    return (
        <section className="bg-linear-to-b from-[#f3ede3] to-[#f6f1eb] py-24">
            <div className="mx-auto max-w-4xl px-6 text-center">

                {/* Avatar */}
                <div className="mb-10 flex items-center justify-center gap-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm text-xl">
                        🧑
                    </div>

                    <div className="text-xl text-[#9d5c63]">♡</div>

                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm text-xl">
                        🧑
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 leading-tight">
                    Your private world, just for two
                </h1>

                {/* Subtitle */}
                <p className="mt-5 text-lg text-gray-600">
                    A calm space to share memories, write letters, and stay close — no matter the distance.
                </p>

            </div>
        </section>
    );
}