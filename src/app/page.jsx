"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ConnectionCard from "@/components/home/ConnectionCard";
import LoveLevelCard from "@/components/home/LoveLevelCard";
import JourneyPreview from "@/components/home/JourneyPreview";
import ActionCards from "@/components/home/ActionCards";
import { supabase } from "@/lib/supabase";
import { hasEmailLoginPassword } from "@/lib/auth";
import toast from "react-hot-toast";
import { getFriendlyErrorMessage } from "@/lib/errors";

async function addAvatarSignedUrl(profile) {
  if (!profile?.avatar_path) return { ...profile, avatarUrl: "" };

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(profile.avatar_path, 60 * 60);

  if (error) {
    console.error("Avatar signed URL error:", error.message);
    return { ...profile, avatarUrl: "" };
  }

  return { ...profile, avatarUrl: data.signedUrl };
}

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  const [hasSharedSpace, setHasSharedSpace] = useState(false);
  const [loveStats, setLoveStats] = useState({
    letterCount: 0,
    memoryCount: 0,
  });
  const [recentItems, setRecentItems] = useState([]);
  const router = useRouter();

  const getData = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!hasEmailLoginPassword(user)) {
      router.push("/auth/setup-password");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, about, avatar_path, couple_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(profileError);
      setUserProfile({
        id: user.id,
        name: user.user_metadata?.name || "You",
        email: user.email,
        avatarUrl: "",
      });
      setIsConnected(false);
      setPartnerProfile(null);
      setCouple(null);
      setHasSharedSpace(false);
      setLoveStats({ letterCount: 0, memoryCount: 0 });
      setRecentItems([]);
      return;
    }

    const currentProfile = await addAvatarSignedUrl(profile);
    setUserProfile(currentProfile);
    setIsConnected(false);
    setHasSharedSpace(!!profile.couple_id);

    if (!profile.couple_id) {
      setPartnerProfile(null);
      setCouple(null);
      setHasSharedSpace(false);
      setLoveStats({ letterCount: 0, memoryCount: 0 });
      setRecentItems([]);
      return;
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from("couples")
      .select("*")
      .eq("id", profile.couple_id)
      .maybeSingle();

    if (coupleError) {
      console.error("Couple load error:", coupleError.message);
      setCouple(null);
    } else {
      setCouple(coupleData);
    }

    const [
      { count: letterCount },
      { count: memoryCount },
      { data: recentLetters },
      { data: recentMemories },
    ] = await Promise.all([
      supabase
        .from("letters")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", profile.couple_id),
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", profile.couple_id),
      supabase
        .from("letters")
        .select("id, title, open_condition, created_at")
        .eq("couple_id", profile.couple_id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("memories")
        .select("id, title, note, created_at, memory_date")
        .eq("couple_id", profile.couple_id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    setLoveStats({
      letterCount: letterCount || 0,
      memoryCount: memoryCount || 0,
    });

    const nextRecentItems = [
      ...(recentLetters || []).map((letter) => ({
        id: letter.id,
        type: "letter",
        title: letter.title || "Untitled letter",
        description: letter.open_condition
          ? `Open when ${letter.open_condition}`
          : "A letter ready whenever you need it.",
        created_at: letter.created_at,
      })),
      ...(recentMemories || []).map((memory) => ({
        id: memory.id,
        type: "memory",
        title: memory.title || "Untitled memory",
        description: memory.note || (memory.memory_date ? `Saved for ${memory.memory_date}` : "A memory saved together."),
        created_at: memory.created_at,
      })),
    ]
      .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
      .slice(0, 3);

    setRecentItems(nextRecentItems);

    const { data: partner, error: partnerError } = await supabase
      .from("profiles")
      .select("id, name, email, about, avatar_path, couple_id")
      .eq("couple_id", profile.couple_id)
      .neq("id", user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      if (partnerError) console.error(partnerError);
      setPartnerProfile(null);
      setIsConnected(false);
      return;
    }

    const nextPartnerProfile = await addAvatarSignedUrl(partner);
    setPartnerProfile(nextPartnerProfile);
    setIsConnected(true);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getData();
  }, [getData]);

  const handleCancelDisconnect = async () => {
    const { error } = await supabase.rpc("cancel_partner_disconnect", {});

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    toast.success("Disconnect canceled");
    await getData();
  };

  return (
    <main className="min-h-screen bg-[var(--app-bg)]">
      <Navbar showLogout={true} />
      <HeroSection
        isConnected={isConnected}
        userProfile={userProfile}
        partnerProfile={partnerProfile}
      />
      <ConnectionCard
        isConnected={isConnected}
        hasSharedSpace={hasSharedSpace}
        couple={couple}
        partnerProfile={partnerProfile}
        onCancelDisconnect={handleCancelDisconnect}
      />
      <LoveLevelCard
        isConnected={isConnected}
        letterCount={loveStats.letterCount}
        memoryCount={loveStats.memoryCount}
      />
      <JourneyPreview
        isConnected={isConnected}
        hasSharedSpace={hasSharedSpace}
        partnerProfile={partnerProfile}
        recentItems={recentItems}
        inviteCode={couple?.invite_code}
      />
      <ActionCards />
    </main>
  );
}
