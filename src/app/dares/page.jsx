"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, Send, ShieldAlert, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import PageSkeleton from "@/components/shared/PageSkeleton";
import { hasEmailLoginPassword } from "@/lib/auth";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const fieldClass =
  "mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25";

const statusCopy = {
  sent: {
    label: "Waiting",
    description: "Waiting for your partner to accept.",
    className: "bg-[var(--surface-accent)] text-[var(--accent)]",
  },
  accepted: {
    label: "Accepted",
    description: "Accepted. Sender can confirm when it is done.",
    className: "bg-[#d8f2d2] text-[#365b32]",
  },
  declined: {
    label: "Declined",
    description: "No pressure. This dare will disappear.",
    className: "bg-[var(--danger-soft)] text-[var(--danger)]",
  },
  done: {
    label: "Done",
    description: "Completed dares are counted, then removed.",
    className: "bg-[#fff2d9] text-[#7b5b22]",
  },
};

function formatDareDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function DareCard({ dare, userId, partnerName, disabled, onAccept, onDecline, onConfirmDone }) {
  const status = statusCopy[dare.status] || statusCopy.sent;
  const isSender = dare.sender_id === userId;
  const isReceiver = dare.receiver_id === userId;
  const fromLabel = isSender ? "You sent" : `${partnerName} sent`;
  const toLabel = isSender ? `For ${partnerName}` : "For you";

  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {fromLabel}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {toLabel} - {formatDareDate(dare.created_at)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <p className="mt-5 whitespace-pre-wrap text-lg font-semibold leading-8 text-[var(--text)]">
        {dare.dare_text}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {status.description}
      </p>

      {dare.status === "sent" && isReceiver && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onAccept(dare)}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-60"
          >
            <Check size={16} />
            Accept
          </button>
          <button
            type="button"
            onClick={() => onDecline(dare)}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--danger-border)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
          >
            <X size={16} />
            Decline
          </button>
        </div>
      )}

      {dare.status === "accepted" && isSender && (
        <button
          type="button"
          onClick={() => onConfirmDone(dare)}
          disabled={disabled}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-60"
        >
          <Sparkles size={16} />
          Confirm done
        </button>
      )}
    </article>
  );
}

export default function DaresPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  const [dares, setDares] = useState([]);
  const [dareText, setDareText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    if (!hasEmailLoginPassword(user)) {
      router.push("/auth/setup-password");
      return;
    }

    setUser(user);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, couple_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      toast.error("Profile load failed");
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setPartnerProfile(null);
    setCouple(null);
    setDares([]);

    if (!profileData.couple_id) {
      setLoading(false);
      return;
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from("couples")
      .select("*")
      .eq("id", profileData.couple_id)
      .maybeSingle();

    if (coupleError) {
      console.error("Dares couple load error:", coupleError.message);
    } else {
      setCouple(coupleData);
    }

    const { data: partnerData, error: partnerError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("couple_id", profileData.couple_id)
      .neq("id", user.id)
      .maybeSingle();

    if (partnerError) {
      console.error("Dares partner load error:", partnerError.message);
    } else {
      setPartnerProfile(partnerData || null);
    }

    const { data: daresData, error: daresError } = await supabase
      .from("couple_dares")
      .select("*")
      .eq("couple_id", profileData.couple_id)
      .in("status", ["sent", "accepted"])
      .order("created_at", { ascending: false });

    if (daresError) {
      toast.error(getFriendlyErrorMessage(daresError));
    } else {
      setDares(daresData || []);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const disconnectPending = isDisconnectPending(couple);
  const hasPartner = Boolean(partnerProfile);
  const partnerName = partnerProfile?.name || "Your partner";
  const canSendDare = Boolean(profile?.couple_id && hasPartner && !disconnectPending);
  const completedDareCount = couple?.dare_done_count || 0;

  const handleSendDare = async (event) => {
    event.preventDefault();

    const nextDareText = dareText.trim();

    if (!profile?.couple_id) {
      toast.error("Connect with your partner first");
      router.push("/connect");
      return;
    }

    if (!hasPartner) {
      toast.error("Your partner has not joined yet");
      return;
    }

    if (disconnectPending) {
      toast.error("Your shared world is paused while disconnect is scheduled.");
      return;
    }

    if (nextDareText.length < 3) {
      toast.error("Dare is too short");
      return;
    }

    if (nextDareText.length > 240) {
      toast.error("Dare must be 240 characters or less");
      return;
    }

    setSaving(true);

    const { error } = await supabase.rpc("send_partner_dare", {
      dare_text: nextDareText,
    });

    setSaving(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    setDareText("");
    toast.success("Dare sent");
    await loadData();
  };

  const handleRespondDare = async (dare, nextStatus) => {
    if (disconnectPending) {
      toast.error("Your shared world is paused while disconnect is scheduled.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.rpc("respond_partner_dare", {
      dare_id: dare.id,
      next_status: nextStatus,
    });

    setSaving(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    toast.success(nextStatus === "accepted" ? "Dare accepted" : "Dare declined");
    await loadData();
  };

  const handleConfirmDone = async (dare) => {
    if (disconnectPending) {
      toast.error("Your shared world is paused while disconnect is scheduled.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.rpc("confirm_partner_dare", {
      dare_id: dare.id,
    });

    setSaving(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    toast.success("Dare completed");
    await loadData();
  };

  if (loading) {
    return <PageSkeleton variant="cards" />;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg-soft)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="bg-[linear-gradient(135deg,#c96d75_0%,#9d5c63_52%,#70434e_100%)] p-7 text-white sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              Couple dares
            </p>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">
                  Send a fun dare
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  Keep it playful. Your partner accepts it, then you confirm when it is done.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/18 px-4 py-2 text-sm font-semibold text-white">
                <Sparkles size={17} />
                {completedDareCount} done together
              </div>
            </div>
          </div>
        </section>

        {disconnectPending && (
          <div className="mt-6 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
            Your shared world is paused. You can cancel disconnect within {formatDisconnectCountdown(couple?.disconnect_delete_after)} from Profile.
          </div>
        )}

        {!profile?.couple_id && (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent)]">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text)]">
                  Connect first
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Dares are only available inside a shared partner space.
                </p>
                <Link
                  href="/connect"
                  className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
                >
                  Go to connect
                </Link>
              </div>
            </div>
          </div>
        )}

        {profile?.couple_id && !hasPartner && (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold text-[var(--text)]">
              Waiting for your partner
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Share your invite first. Once your partner joins, dares will unlock here.
            </p>
            <Link
              href="/connect"
              className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
            >
              View invite
            </Link>
          </div>
        )}

        {profile?.couple_id && hasPartner && (
          <form
            onSubmit={handleSendDare}
            className="mt-6 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent)]">
                <Send size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-[var(--text)]">
                  Dare {partnerName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Write one small funny challenge. Done dares are counted, then the text disappears.
                </p>
                <textarea
                  value={dareText}
                  onChange={(event) => setDareText(event.target.value)}
                  disabled={!canSendDare || saving}
                  maxLength={240}
                  rows={4}
                  className={fieldClass}
                  placeholder="Example: Tell me one thing you like about me."
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    {dareText.trim().length}/240
                  </p>
                  <button
                    type="submit"
                    disabled={!canSendDare || saving}
                    className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Sending..." : "Send Dare"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                Dare board
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                Recent dares
              </h2>
            </div>
            <Clock className="text-[var(--accent)]" size={24} />
          </div>

          {dares.length === 0 ? (
            <div className="mt-5 rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow)]">
              <p className="text-lg font-semibold text-[var(--text)]">
                No dares yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Send one small dare and see if your partner accepts the challenge. Completed dares will only stay as a count.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {dares.map((dare) => (
                <DareCard
                  key={dare.id}
                  dare={dare}
                  userId={user?.id}
                  partnerName={partnerName}
                  disabled={saving || disconnectPending}
                  onAccept={(nextDare) => handleRespondDare(nextDare, "accepted")}
                  onDecline={(nextDare) => handleRespondDare(nextDare, "declined")}
                  onConfirmDone={handleConfirmDone}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
