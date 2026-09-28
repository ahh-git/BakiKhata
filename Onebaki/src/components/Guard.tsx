"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/context/SessionProvider";
import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { InstallPWA } from "./InstallPWA";
import { IconCheck, IconShieldCheck } from "./Icons";

export function Guard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useSession();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile?.role && path !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [user, profile, loading, path, router]);

  if (loading) {
    return (
      <div className="center-screen bg-[#f6f8fc]">
        <div className="glass-card px-8 py-6 text-sm font-bold text-slate-700 rounded-3xl shadow-xl flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 pb-24">
      {/* Top sticky app header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="flex items-center gap-2 group">
              <img
                src="/app-icon.png"
                alt="BakiKhata"
                className="w-9 h-9 rounded-xl shadow-xs group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-display font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                    {profile?.role === "shopkeeper"
                      ? profile.shop_name || "BakiKhata"
                      : "BakiKhata"}
                  </p>
                  <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {profile?.role === "shopkeeper"
                    ? `আইডি ${profile.shop_code || "—"}`
                    : profile?.full_name || "কাস্টমার"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/alerts"
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
            >
              অ্যালার্ট
            </Link>
            <InstallPWA />
          </div>
        </div>
      </header>

      {/* Main page body */}
      <main className="max-w-2xl mx-auto px-4 pt-4">{children}</main>

      {/* Modern 4-tab bottom navigation */}
      {profile?.role ? <BottomNav /> : null}
    </div>
  );
}
