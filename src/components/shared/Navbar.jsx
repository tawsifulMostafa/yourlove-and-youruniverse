"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isEternalModeUnlocked } from "@/lib/loveLevel";
import { applyTheme, getSavedTheme, resetTheme, setSavedTheme, THEME_CHANGE_EVENT } from "@/lib/theme";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Navbar({ showLogout = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [eternalModeUnlocked, setEternalModeUnlocked] = useState(false);
  const [theme, setTheme] = useState("light");

  const checkEternalModeUnlock = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setEternalModeUnlocked(false);
      applyTheme("light");
      setTheme("light");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", user.id)
      .single();

    if (!profile?.couple_id) {
      setEternalModeUnlocked(false);
      resetTheme();
      setTheme("light");
      return;
    }

    const [{ count: letterCount }, { count: memoryCount }] = await Promise.all([
      supabase
        .from("letters")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", profile.couple_id),
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", profile.couple_id),
    ]);

    const isUnlocked = isEternalModeUnlocked(letterCount || 0, memoryCount || 0);
    setEternalModeUnlocked(isUnlocked);

    if (!isUnlocked) {
      resetTheme();
      setTheme("light");
      return;
    }

    const nextTheme = getSavedTheme();
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkEternalModeUnlock();
  }, [checkEternalModeUnlock, pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleThemeChange = () => setTheme(getSavedTheme());

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push("/login");
  };

  const handleThemeToggle = () => {
    if (!eternalModeUnlocked) {
      toast("Eternal Mode unlocks at Love Level 10.");
      return;
    }

    const nextTheme = theme === "eternal" ? "light" : "eternal";
    setTheme(nextTheme);
    setSavedTheme(nextTheme);
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const linkClass = (href) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${isActive(href)
      ? "bg-[var(--surface-accent)] text-[var(--accent)]"
      : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
    }`;

  const mobileLinkClass = (href) =>
    `rounded-xl px-4 py-3 text-sm font-medium transition ${isActive(href)
      ? "bg-[var(--surface-accent)] text-[var(--accent)]"
      : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
    }`;

  const themeToggle = (
    <button
      type="button"
      onClick={handleThemeToggle}
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium transition ${eternalModeUnlocked
        ? "text-[var(--muted)] hover:text-[var(--accent)]"
        : "text-[var(--muted)] opacity-80 hover:text-[var(--accent)]"
        }`}
      aria-label={eternalModeUnlocked ? "Toggle Eternal Mode" : "Eternal Mode locked"}
    >
      {theme === "eternal" && eternalModeUnlocked ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden lg:inline">
        {theme === "eternal" && eternalModeUnlocked ? "Light" : "Eternal"}
      </span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-[var(--accent)]">
          YourLove
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          <Link href="/letters" className={linkClass("/letters")}>
            Letters
          </Link>

          <Link href="/memories" className={linkClass("/memories")}>
            Memories
          </Link>

          <Link href="/profile" className={linkClass("/profile")}>
            Profile
          </Link>

          {themeToggle}

          {showLogout && (
            <button
              onClick={handleLogout}
              className="ml-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Logout
            </button>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text)] md:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            <Link href="/" className={mobileLinkClass("/")}>
              Home
            </Link>

            <Link href="/letters" className={mobileLinkClass("/letters")}>
              Letters
            </Link>

            <Link href="/memories" className={mobileLinkClass("/memories")}>
              Memories
            </Link>

            <Link href="/profile" className={mobileLinkClass("/profile")}>
              Profile
            </Link>

            <button
              type="button"
              onClick={handleThemeToggle}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted)]"
            >
              <span>Eternal Mode</span>
              <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                {theme === "eternal" && eternalModeUnlocked ? <Sun size={16} /> : <Moon size={16} />}
                {eternalModeUnlocked ? (theme === "eternal" ? "On" : "Off") : "Level 10"}
              </span>
            </button>

            {showLogout && (
              <button
                onClick={handleLogout}
                className="rounded-xl bg-[var(--accent)] px-4 py-3 text-left text-sm font-medium text-white transition hover:opacity-90"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
