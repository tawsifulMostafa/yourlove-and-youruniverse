"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar({ showLogout = false }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const linkClass = (href) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${isActive(href)
      ? "bg-[#f3e7e9] text-[#9d5c63]"
      : "text-gray-700 hover:bg-black/5"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-[#9d5c63]">
          YourLove ❤️
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          <Link href="/letters" className={linkClass("/letters")}>
            Letters
          </Link>

          <Link href="/memories" className={linkClass("/memories")}>
            Memories
          </Link>

          {showLogout && (
            <button
              onClick={handleLogout}
              className="ml-2 rounded-full bg-[#9d5c63] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}