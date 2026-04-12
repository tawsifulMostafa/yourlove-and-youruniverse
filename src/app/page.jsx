"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ConnectionCard from "@/components/home/ConnectionCard";
import ActionCards from "@/components/home/ActionCards";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();

      if (profile?.couple_id) {
        setIsConnected(true);
      }
    };

    getData();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <Navbar showLogout={true} />
      <HeroSection />
      <ConnectionCard isConnected={isConnected} />
      <ActionCards />
    </main>
  );
}