"use client";

import Navbar from "@/components/shared/Navbar";

export default function PageSkeleton({ variant = "default" }) {
  const tall = variant === "cards";

  return (
    <div className="min-h-screen bg-[var(--app-bg-soft)]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="animate-pulse bg-[linear-gradient(135deg,var(--surface-accent)_0%,var(--surface-soft)_100%)] p-7 sm:p-10">
            <div className="h-4 w-28 rounded-full bg-[var(--surface)]/70" />
            <div className="mt-5 h-10 max-w-md rounded-2xl bg-[var(--surface)]/70" />
            <div className="mt-4 h-5 max-w-xl rounded-full bg-[var(--surface)]/60" />
          </div>
        </section>

        <section className="mt-8 grid animate-pulse gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className={`rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] ${tall ? "h-72" : "h-44"}`} />
          <div className={`rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] ${tall ? "h-72" : "h-44"}`} />
          <div className={`hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] xl:block ${tall ? "h-72" : "h-44"}`} />
        </section>
      </main>
    </div>
  );
}
