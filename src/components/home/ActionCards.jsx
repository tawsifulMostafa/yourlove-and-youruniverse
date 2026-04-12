import Link from "next/link";

const actions = [
  {
    title: "Open When Letters",
    desc: "Write, save, and revisit your most heartfelt messages.",
    btn: "Write a Letter",
    href: "/letters",
  },
  {
    title: "Shared Memories",
    desc: "Keep your favorite moments safe in one private space.",
    btn: "Add Memory",
    href: "/memories",
  },
  {
    title: "Thoughtful Surprises",
    desc: "Plan little surprises and meaningful gestures.",
    btn: "Coming Soon",
    href: "#",
  },
];

export default function ActionCards() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl text-center">

        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text)]">
          Everything you share, in one place
        </h2>

        <p className="mt-3 text-[var(--muted)]">
          A calm space for your memories, letters, and little moments.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {actions.map((item, i) => (
            <div
              key={i}
              className="rounded-3xl bg-[var(--surface)] p-6 shadow-[var(--shadow)] border border-[var(--border)] transition duration-200 ease-out hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-[var(--text)]">
                {item.title}
              </h3>

              <p className="mt-3 text-sm text-[var(--muted)]">
                {item.desc}
              </p>

              <Link
                href={item.href}
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
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
