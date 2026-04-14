import Link from "next/link";
import { Camera, Flame, Gamepad2, Mail } from "lucide-react";

const actions = [
  {
    title: "Letter",
    href: "/letters",
    caption: "Write",
    icon: Mail,
    className: "bg-[#ffd9cf] text-[#6d3c43]",
  },
  {
    title: "Memory",
    href: "/memories",
    caption: "Save",
    icon: Camera,
    className: "bg-[#cfe9ff] text-[#24445f]",
  },
  {
    title: "Dare",
    href: "/dares",
    caption: "Send",
    icon: Flame,
    className: "bg-[#eed3ff] text-[#553363]",
  },
  {
    title: "Play",
    href: "/play",
    caption: "Battle",
    icon: Gamepad2,
    className: "bg-[#d8f2d2] text-[#365b32]",
  },
];

export default function ActionCards() {
  return (
    <section className="px-4 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
              Quick actions
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {actions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex min-h-24 items-center gap-3 rounded-[1.25rem] p-4 shadow-[var(--shadow)] transition duration-200 hover:-translate-y-1 ${item.className}`}
              >
                <Icon size={22} />
                <div>
                  <p className="text-base font-semibold leading-tight">{item.title}</p>
                  <p className="mt-1 text-xs font-medium opacity-75">{item.caption}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
