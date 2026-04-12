"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function ConnectPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
    };

    getUser();
  }, [router]);

  const handleCreateCouple = async () => {
    if (!user) return;

    setLoading(true);

    const newCode = generateInviteCode();

    const { data: coupleData, error: coupleError } = await supabase
      .from("couples")
      .insert({
        invite_code: newCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (coupleError) {
      setLoading(false);
      alert("Couple create failed: " + coupleError.message);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      couple_id: coupleData.id,
    });

    if (profileError) {
      setLoading(false);
      alert("Profile update failed: " + profileError.message);
      return;
    }

    setLoading(false);
    alert(`Couple created! Invite code: ${newCode}`);
    router.push("/home");
  };
  const handleJoinCouple = async () => {
    if (!user || !inviteCode) return;

    setLoading(true);

    const { data: coupleData, error: coupleError } = await supabase
      .from("couples")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (coupleError || !coupleData) {
      setLoading(false);
      alert("Invalid invite code");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      couple_id: coupleData.id,
    });

    if (profileError) {
      setLoading(false);
      alert("Join failed: " + profileError.message);
      return;
    }

    setLoading(false);
    alert("Joined successfully 💞");
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-pink-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-pink-600">
          Connect with Your Partner 💕
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Create a private couple space or join with an invite code
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-pink-200 p-5">
            <h2 className="text-xl font-semibold text-pink-600">
              Create Couple
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Start a new private world and share your invite code.
            </p>
            <button
              onClick={handleCreateCouple}
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-pink-500 py-3 text-white hover:bg-pink-600 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Couple"}
            </button>
          </div>

          <div className="rounded-2xl border border-pink-200 p-5">
            <h2 className="text-xl font-semibold text-pink-600">
              Join Couple
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter your partner&apos;s invite code to join.
            </p>

            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-pink-400"
            />

            <button
              onClick={handleJoinCouple}
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-gray-900 py-3 text-white disabled:opacity-60"
            >
              {loading ? "Joining..." : "Join with Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}