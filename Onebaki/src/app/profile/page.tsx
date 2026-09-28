"use client";

import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import {
  IconCheck,
  IconLock,
  IconRefresh,
  IconAndroid,
  IconDownload,
  IconShieldCheck,
  IconStore,
  IconUser,
} from "@/components/Icons";

export default function ProfilePage() {
  const { profile, signOut } = useSession();

  return (
    <Guard>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">প্রোফাইল</h1>
          <p className="text-xs text-slate-500 mt-0.5">আপনার অ্যাকাউন্ট ও নিরাপত্তা সেটিংস</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {profile?.full_name?.charAt(0) || "প"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900">{profile?.full_name}</h2>
                <IconCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500">{profile?.phone || "ফোন নম্বর দেওয়া হয়নি"}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <IconShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>
                  {profile?.role === "shopkeeper" ? "ভেরিফাইড দোকানদার" : "ভেরিফাইড কাস্টমার"}
                </span>
              </span>
            </div>
          </div>

          {/* Shop Details (if shopkeeper) */}
          {profile?.role === "shopkeeper" ? (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                দোকানের তথ্য
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{profile.shop_name}</p>
                  <p className="text-xs text-slate-500">আইডি: {profile.shop_code}</p>
                </div>
                <span className="text-2xl font-mono font-black text-indigo-700">
                  {profile.shop_code}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Security Settings Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <IconLock className="w-4 h-4 text-indigo-600" />
            <span>নিরাপত্তা ও ক্লাউড ব্যাকআপ</span>
          </h3>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600">ক্লাউড ডেটাবেজ ব্যাকআপ</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                স্বয়ংক্রিয় সক্রিয়
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">এন্ড-টু-এন্ড অডিট হ্যাশ</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                সক্রিয় (#BK-SHA256)
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">ডেটা পরিবর্তন সুরক্ষা</span>
              <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px]">
                টেম্পার-প্রুফ
              </span>
            </div>
          </div>
        </div>

        {/* App Version Info Card */}
        <div className="bg-slate-950 text-white rounded-3xl p-5 space-y-3 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAndroid className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">BakiKhata App & Web Portal</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              v1.6.0 (Build 7)
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            মোবাইলে আরও দ্রুত ও সহজে ব্যবহার করতে অ্যান্ড্রয়েড অ্যাপটি ডাউনলোড করে রাখুন।
          </p>

          <a
            href="https://github.com/ahh-git/BakiKhata/releases/download/v1.2.0/BakiKhata-v1.6.apk"
            download
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <IconDownload className="w-4 h-4" />
            <span>Android APK ডাউনলোড করুন (৮.৫ MB)</span>
          </a>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full py-3 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-2xl border border-slate-200 hover:border-rose-200 shadow-xs transition-all"
        >
          লগ আউট করুন
        </button>
      </div>
    </Guard>
  );
}
