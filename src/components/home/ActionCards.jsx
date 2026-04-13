import Link from "next/link";
import { Camera, Gift, Mail, Target } from "lucide-react";

const actions = [
  {
    title: "Write Letter",
    href: "/letters",
    icon: Mail,
    className: "bg-[#ffd9cf] text-[#6d3c43]",
  },
  {
    title: "Add Memory",
    href: "/memories",
    icon: Camera,
    className: "bg-[#cfe9ff] text-[#24445f]",
  },
  {
    title: "Plan Surprise",
    href: "#",
    icon: Gift,
    className: "bg-[#eed3ff] text-[#553363]",
  },
  {
    title: "Set Goal",
    href: "#",
    icon: Target,
    className: "bg-[#d8f2d2] text-[#365b32]",
  },
];

export default function ActionCards() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
              Quick actions
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
              Small things, easy to send
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {actions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`min-h-32 rounded-[1.5rem] p-5 shadow-[var(--shadow)] transition duration-200 hover:-translate-y-1 ${item.className}`}
              >
                <Icon size={25} />
                <p className="mt-6 text-lg font-semibold leading-tight">{item.title}</p>
                <p className="mt-1 text-sm opacity-75">13 px</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
