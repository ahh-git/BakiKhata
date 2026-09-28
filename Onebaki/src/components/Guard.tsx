"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/context/SessionProvider";
import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { InstallPWA } from "./InstallPWA";

export function Guard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useSession();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!profile?.role && path !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [user, profile, loading, path, router]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="glass-card px-8 py-6 text-sm text-slate-600">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand">Onebaki</p>
          <p className="muted">
            {profile?.role === "shopkeeper"
              ? `${profile.shop_name || "দোকান"} · আইডি ${profile.shop_code || "—"}`
              : profile?.full_name || "কাস্টমার"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/alerts" className="glass-chip">
            অ্যালার্ট
          </Link>
          <InstallPWA />
        </div>
      </header>
      <main className="page-pad">{children}</main>
      {profile?.role ? <BottomNav /> : null}
    </div>
  );
}
