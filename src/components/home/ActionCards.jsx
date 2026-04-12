import Link from "next/link";

const actions = [
  {
    title: "Open When Letters 💌",
    desc: "Write, save, and revisit your most heartfelt messages.",
    btn: "Write a Letter",
    href: "/letters",
  },
  {
    title: "Shared Memories 📸",
    desc: "Keep your favorite moments safe in one private space.",
    btn: "Add Memory",
    href: "/memories",
  },
  {
    title: "Thoughtful Surprises 🎁",
    desc: "Plan little surprises and meaningful gestures.",
    btn: "Coming Soon",
    href: "#",
  },
];

export default function ActionCards() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl text-center">

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
          Everything you share, in one place
        </h2>

        <p className="mt-3 text-gray-600">
          A calm space for your memories, letters, and little moments.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {actions.map((item, i) => (
            <div  
              key={i}
              className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-black/5 transition duration-200 ease-out hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-3 text-sm text-gray-600">
                {item.desc}
              </p>

              <Link
                href={item.href}
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#9d5c63] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {item.btn}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}