"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ConnectionCard from "@/components/home/ConnectionCard";
import LoveLevelCard from "@/components/home/LoveLevelCard";
import ActionCards from "@/components/home/ActionCards";
import { supabase } from "@/lib/supabase";

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
  const [loveStats, setLoveStats] = useState({
    letterCount: 0,
    memoryCount: 0,
  });
  const router = useRouter();

  const getData = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, avatar_path, couple_id")
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
      setLoveStats({ letterCount: 0, memoryCount: 0 });
      return;
    }

    const currentProfile = await addAvatarSignedUrl(profile);
    setUserProfile(currentProfile);
    setIsConnected(!!profile.couple_id);

    if (!profile.couple_id) {
      setPartnerProfile(null);
      setLoveStats({ letterCount: 0, memoryCount: 0 });
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

    setLoveStats({
      letterCount: letterCount || 0,
      memoryCount: memoryCount || 0,
    });

    const { data: partner, error: partnerError } = await supabase
      .from("profiles")
      .select("id, name, email, avatar_path, couple_id")
      .eq("couple_id", profile.couple_id)
      .neq("id", user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      if (partnerError) console.error(partnerError);
      setPartnerProfile(null);
      return;
    }

    const nextPartnerProfile = await addAvatarSignedUrl(partner);
    setPartnerProfile(nextPartnerProfile);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getData();
  }, [getData]);

  return (
    <main className="min-h-screen bg-[var(--app-bg)]">
      <Navbar showLogout={true} />
      <HeroSection
        isConnected={isConnected}
        userProfile={userProfile}
        partnerProfile={partnerProfile}
      />
      <ConnectionCard isConnected={isConnected} />
      <LoveLevelCard
        isConnected={isConnected}
        letterCount={loveStats.letterCount}
        memoryCount={loveStats.memoryCount}
      />
      <ActionCards />
    </main>
  );
}
