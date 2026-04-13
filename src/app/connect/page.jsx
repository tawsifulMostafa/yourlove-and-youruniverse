"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import toast from "react-hot-toast";
import { hasEmailLoginPassword } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";

export default function ConnectPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const loadConnection = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (!hasEmailLoginPassword(user)) {
        router.push("/auth/setup-password");
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setCouple(null);
      setMemberCount(0);

      if (profileData?.couple_id) {
        const { data: coupleData } = await supabase
          .from("couples")
          .select("*")
          .eq("id", profileData.couple_id)
          .maybeSingle();

        setCouple(coupleData);

        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("couple_id", profileData.couple_id);

        setMemberCount(count || 0);
      }
    };

  useEffect(() => {
    loadConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleCreateCouple = async () => {
    if (!user) return;

    if (profile?.couple_id) {
      toast.error("Reset or disconnect first before creating another space.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.rpc("create_couple_invite");
    const invite = Array.isArray(data) ? data[0] : data;

    if (error) {
      setLoading(false);
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    setLoading(false);
    toast.success(`Invite created: ${invite?.invite_code || "ready"}`);
    router.push("/");
  };

  const handleJoinCouple = async () => {
    const normalizedInviteCode = inviteCode.trim().toUpperCase().replace(/\s+/g, "");

    if (!user || !normalizedInviteCode) return;

    if (profile?.couple_id) {
      toast.error("Reset or disconnect first before joining another space.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc("join_couple_invite", {
      join_code: normalizedInviteCode,
    });

    if (error) {
      setLoading(false);
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    setLoading(false);
    toast.success("Joined successfully");
    router.push("/");
  };

  const handleResetInviteSpace = async () => {
    if (!profile?.couple_id || hasPartner || isDisconnectPending(couple)) return;

    setLoading(true);

    const { error } = await supabase.rpc("reset_empty_invite_space");

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      setLoading(false);
      return;
    }

    toast.success("Invite space reset");
    setLoading(false);
    await loadConnection();
  };

  const handleCopyInviteCode = async () => {
    if (!couple?.invite_code) return;

    try {
      await navigator.clipboard.writeText(couple.invite_code);
      toast.success("Invite code copied");
    } catch {
      toast.error("Could not copy invite code");
    }
  };

  const hasPartner = memberCount > 1;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <h1 className="text-center text-3xl font-bold text-[var(--accent)]">
          Connect with Your Partner
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Create a private couple space or join with an invite code
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {profile?.couple_id && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 md:col-span-2">
              <h2 className="text-xl font-semibold text-[var(--accent)]">
                {isDisconnectPending(couple)
                  ? "Disconnect scheduled"
                  : hasPartner
                    ? "Already connected"
                    : "Shared space created"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {isDisconnectPending(couple)
                  ? `Your shared world is paused. You can cancel disconnect within ${formatDisconnectCountdown(couple?.disconnect_delete_after)} from Profile.`
                  : hasPartner
                    ? "You already have a partner connected. Disconnect first before creating or joining another one."
                    : "Share your invite code with your partner. You can create or join another space after resetting this one later."}
              </p>
              {!hasPartner && !isDisconnectPending(couple) && couple?.invite_code && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
                    Invite code:
                    <span className="font-mono text-[var(--accent)]">{couple.invite_code}</span>
                    <button
                      type="button"
                      onClick={handleCopyInviteCode}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)]"
                    >
                      Copy
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetInviteSpace}
                    disabled={loading}
                    className="w-fit rounded-lg border border-[var(--danger-border)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
                  >
                    {loading ? "Resetting..." : "Reset invite space"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <h2 className="text-xl font-semibold text-[var(--accent)]">
              Create Couple
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Start a new private world and share your invite code.
            </p>
            <button
              onClick={handleCreateCouple}
              disabled={loading || !!profile?.couple_id}
              className="mt-4 w-full rounded-lg bg-[var(--accent)] py-3 text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Couple"}
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <h2 className="text-xl font-semibold text-[var(--accent)]">
              Join Couple
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Enter your partner&apos;s invite code to join.
            </p>

            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-4 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />

            <button
              onClick={handleJoinCouple}
              disabled={loading || !!profile?.couple_id}
              className="mt-4 w-full rounded-lg bg-[var(--text)] py-3 text-[var(--surface)] disabled:opacity-60"
            >
              {loading ? "Joining..." : "Join with Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
