"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@/components/GoogleLogin";
import { InstallPWA } from "@/components/InstallPWA";
import { useSession } from "@/context/SessionProvider";

export default function LoginPage() {
  const { user, profile, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && !profile?.role) router.replace("/onboarding");
    if (user && profile?.role) router.replace("/home");
  }, [user, profile, loading, router]);

  return (
    <div className="center-screen relative overflow-hidden bg-slate-50 min-h-screen">
      <div className="hero-orb bg-indigo-300" style={{ top: -40, left: -40 }} />
      <div className="hero-orb bg-sky-300" style={{ bottom: -50, right: -30 }} />
      <div className="glass-card relative w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-white/80 bg-white/70 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <p className="badge bg-indigo-50 text-indigo-700 border border-indigo-200">স্বচ্ছ বাকি · নিরাপদ খাতা</p>
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            ← হোম পেজে ফিরুন
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <img src="/app-icon.png" alt="BakiKhata" className="w-12 h-12 rounded-2xl shadow-md" />
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">BakiKhata</h1>
            <p className="text-xs text-slate-500">Onebaki Web Portal</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          দোকানের বাকি হিসাব রাখুন শতভাগ স্বচ্ছ ও নিরাপদে। দোকানদার শুধু নিজের কাস্টমার দেখবেন, আপনি শুধু নিজের খাতা দেখবেন। কোনো ডাটা মুছে যায় না।
        </p>
        <div className="mt-8">
          <GoogleLogin />
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-500">
          সুরক্ষিত Google ওয়ান-ট্যাপ লগইন। ক্লাউড সিঙ্ক সমৃদ্ধ ও মোবাইল ফ্রেন্ডলি।
        </p>
        <div className="mt-5 flex justify-center">
          <InstallPWA />
        </div>
        <div className="mt-6 pt-5 border-t border-slate-200/60 text-center">
          <p className="text-xs text-slate-600 mb-2">মোবাইল অ্যাপ ব্যবহার করতে চান?</p>
          <a
            href="https://github.com/ahh-git/BakiKhata/releases/download/v1.2.0/BakiKhata-v1.6.apk"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/80 transition-all hover:shadow-xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Android APK (v1.6.0) ডাউনলোড করুন</span>
          </a>
        </div>
      </div>
    </div>
  );
}
