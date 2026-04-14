"use client";

import { Image as ImageIcon, Mail, Sparkles } from "lucide-react";
import { formatMemoryTime } from "@/lib/utils";

function JourneyItem({ item }) {
  const isMemory = item.type === "memory";
  const Icon = isMemory ? ImageIcon : Mail;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-accent)] text-[var(--accent)]">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text)]">{item.title}</p>
        <p className="truncate text-xs text-[var(--muted)]">
          {isMemory ? "Memory" : "Letter"} - {formatMemoryTime(item.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function JourneyPreview({ isConnected, recentItems }) {
  const visibleItems = recentItems.slice(0, 3);

  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Recent journey
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text)]">
              Latest moments
            </h2>
          </div>
          <Sparkles className="text-[var(--accent)]" size={22} />
        </div>

        {visibleItems.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {visibleItems.map((item) => <JourneyItem key={`${item.type}-${item.id}`} item={item} />)}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
            {isConnected
              ? "No shared moments yet."
              : "Connect first, then your latest moments will appear here."}
          </p>
        )}
      </div>
    </section>
  );
}
