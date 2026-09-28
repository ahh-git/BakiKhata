"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
    <div className="center-screen relative overflow-hidden">
      <div className="hero-orb bg-indigo-300" style={{ top: -40, left: -40 }} />
      <div className="hero-orb bg-sky-300" style={{ bottom: -50, right: -30 }} />
      <div className="glass-card relative w-full max-w-md rounded-[32px] p-8">
        <p className="badge mb-4">স্বচ্ছ বাকি · নিরাপদ খাতা</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Onebaki</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          দোকানে বাকি খেয়েছেন? হিসাব রাখুন। দোকানদার শুধু নিজের কাস্টমার দেখবেন, আপনি শুধু নিজের খাতা দেখবেন। কিছুই ডিলিট হয় না।
        </p>
        <div className="mt-8">
          <GoogleLogin />
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-500">শুধু Google লগইন। ফোন ও পিসিতে অ্যাপ হিসেবে ইনস্টল করা যাবে।</p>
        <div className="mt-4 flex justify-center">
          <InstallPWA />
        </div>
      </div>
    </div>
  );
}
