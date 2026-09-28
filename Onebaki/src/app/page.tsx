"use client";

import React, { useState } from "react";
import Link from "next/link";
import { InteractiveAppPreview } from "@/components/InteractiveAppPreview";
import {
  IconAndroid,
  IconDownload,
  IconQrCode,
  IconShieldCheck,
  IconLock,
  IconRefresh,
  IconWhatsApp,
  IconPhone,
  IconZap,
  IconFileText,
  IconUsers,
  IconCheck,
  IconChevronDown,
  IconX,
  IconSparkles,
  IconStore,
} from "@/components/Icons";

const APK_DOWNLOAD_URL =
  "https://github.com/ahh-git/BakiKhata/releases/download/v1.2.0/BakiKhata-v1.6.apk";

const FAQS = [
  {
    q: "BakiKhata অ্যাপটি কি সম্পূর্ণ বিনামূল্যে ব্যবহার করা যাবে?",
    a: "হ্যাঁ! BakiKhata সম্পূর্ণ ফ্রি এবং কোনো প্রকার গোপন মাসিক ফি বা সাবস্ক্রিপশন চার্জ নেই। দোকানদার এবং কাস্টমার উভয়েই আজীবন বিনামূল্যে ব্যবহার করতে পারবেন।",
  },
  {
    q: "দোকানে ইন্টারনেট না থাকলে কি বাকি হিসাব লেখা যাবে?",
    a: "অবশ্যই! BakiKhata সম্পূর্ণ অফলাইন-ফার্স্ট প্রযুক্তিতে তৈরি। ইন্টারনেট সংযোগ না থাকলেও আপনি তাৎক্ষণিকভাবে বাকি বা জমা লিখে রাখতে পারবেন। ইন্টারনেট ফিরে আসার সাথে সাথে তা স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হয়ে যাবে।",
  },
  {
    q: "মোবাইল হারিয়ে গেলে বা নষ্ট হলে কি আমার আগের হিসাব ফিরে পাবো?",
    a: "১০০% নিরাপদ! আপনার সমস্ত হিসাব গুগল ক্লাউডে এনক্রিপ্ট হয়ে সংরক্ষিত থাকে। নতুন ফোনে অ্যাপ ডাউনলোড করে শুধু আপনার আগের Google অ্যাকাউন্ট দিয়ে লগইন করলেই এক সেকেন্ডে আপনার সম্পূর্ণ খাতা ফিরে পাবেন।",
  },
  {
    q: "কাস্টমার কি নিজে থেকে কোনো বাকি হিসাব মুছে বা পরিবর্তন করতে পারবে?",
    a: "না, কখনোই নয়। BakiKhata একটি টেম্পার-প্রুফ সিস্টেম। কাস্টমার শুধুমাত্র তার নিজের হিসাব দেখতে পারবে এবং ডিজিটাল স্টেটমেন্ট ডাউনলোড করতে পারবে। কোনো ডাটা পরিবর্তন বা মোছার অনুমতি কারো নেই।",
  },
  {
    q: "নতুন আপডেট আসলে কীভাবে অ্যাপ আপডেট করবো?",
    a: "প্লে-স্টোরে যাওয়ার কোনো প্রয়োজন নেই! v1.6.0 থেকে BakiKhata-তে রয়েছে ইন-অ্যাপ স্মার্ট আপডেটার। নতুন সংস্করণ আসার সাথে সাথে অ্যাপের ভেতরেই 'এখনই আপডেট করুন' নোটিফিকেশন আসবে এবং ১-ক্লিকেই ডাউনলোড হয়ে ইনস্টল হয়ে যাবে।",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Background ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/app-icon.png"
              alt="BakiKhata App Icon"
              className="w-10 h-10 rounded-2xl shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
                  BakiKhata
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  v1.6.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">স্বচ্ছ বাকি · নিরাপদ খাতা</p>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              সুবিধাসমূহ
            </a>
            <a href="#preview" className="hover:text-indigo-600 transition-colors">
              লাইভ প্রিভিউ
            </a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">
              নিরাপত্তা
            </a>
            <a href="#install" className="hover:text-indigo-600 transition-colors">
              ইনস্টলেশন
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              প্রশ্নাবলী
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-100/90 hover:bg-slate-200/80 rounded-full transition-all"
            >
              ওয়েব লগইন
            </Link>

            <a
              href={APK_DOWNLOAD_URL}
              download
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-full shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all active:scale-95"
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">অ্যাপ ডাউনলোড</span>
              <span className="sm:hidden">ডাউনলোড</span>
            </a>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Release Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 shadow-xs">
              <IconSparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-900">
                BakiKhata v1.6.0 (Build 7) অফিসিয়াল রিলিজ
              </span>
              <span className="text-[11px] text-indigo-600 font-medium hidden sm:inline">
                • অ্যান্টি-ফ্রড QR ও অটো-আপডেটার সহ
              </span>
            </div>
          </div>

          {/* Main Title & Value Prop */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              দোকানের ডিজিটাল বাকি খাতা{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                স্বচ্ছ, নিরাপদ ও স্মার্ট
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              কাগজের খাতা হারানোর ভয় নেই, হিসাব কাটার সুযোগ নেই। দোকানদার ও কাস্টমার উভয়ের জন্যই শতভাগ স্বচ্ছ ডিজিটাল লেজার — সাথে থাকছে অ্যান্টি-ফ্রড ভেরিফিকেশন QR কোড ও সরাসরি হোয়াটসঅ্যাপ রিমাইন্ডার।
            </p>

            {/* Primary & Secondary Download CTA Area */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {/* PRIMARY APK DOWNLOAD BUTTON */}
              <a
                href={APK_DOWNLOAD_URL}
                download
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-600/25 hover:shadow-2xl hover:shadow-emerald-600/35 transition-all active:scale-[0.98] border border-emerald-400/40"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <IconAndroid className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <span>Android APK ডাউনলোড করুন</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      v1.6.0
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-100 font-medium">
                    সরাসরি ডাউনলোড • ৮.৫ মেগাবাইট • অ্যান্ড্রয়েড ৭.০+
                  </div>
                </div>
              </a>

              {/* QR Code trigger button */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all"
              >
                <IconQrCode className="w-5 h-5 text-indigo-600" />
                <span>QR কোড স্ক্যান করে ফোনে ডাউনলোড</span>
              </button>
            </div>

            {/* Micro Highlights Row */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <IconCheck className="w-4 h-4 text-emerald-600" />
                <span>আজীবন ১০০% ফ্রি</span>
              </span>
              <span className="flex items-center gap-1.5">
                <IconZap className="w-4 h-4 text-emerald-600" />
                <span>সম্পূর্ণ অফলাইনে কাজ করে</span>
              </span>
              <span className="flex items-center gap-1.5">
                <IconShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ক্লাউডে সুরক্ষিত ও টেম্পার-প্রুফ</span>
              </span>
              <span className="flex items-center gap-1.5">
                <IconWhatsApp className="w-4 h-4 text-[#25D366]" />
                <span>হোয়াটসঅ্যাপ ভাউচার</span>
              </span>
            </div>
          </div>

          {/* ================= LIVE INTERACTIVE PREVIEW SHOWCASE ================= */}
          <div id="preview" className="pt-6 pb-12">
            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                হাতে-কলমে পরীক্ষা
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                অ্যাপের লাইভ ইন্টারঅ্যাক্টিভ প্রিভিউ
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                নিচের স্মার্টফোন স্ক্রিনে সরাসরি ক্লিক করে কাস্টমার কার্ড ওপেন করুন, নতুন বাকি হিসাব লিখে পরীক্ষা করুন বা ডিজিটাল PDF স্টেটমেন্ট দেখুন!
              </p>
            </div>

            <InteractiveAppPreview />
          </div>
        </div>
      </section>

      {/* ================= KEY FEATURES GRID ================= */}
      <section id="features" className="relative z-10 py-16 bg-white/80 backdrop-blur-md border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
              বিশ্বমানের সুবিধাসমূহ
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900">
              কেন আপনার ব্যবসার জন্য BakiKhata সেরা?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              ঐতিহ্যবাহী খাতার ঝামেলা দূর করে আধুনিক ডিজিটাল যুগের উপযোগী অত্যাধুনিক প্রযুক্তি দিয়ে তৈরি।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-[#f6f8fc] border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IconShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">অ্যান্টি-ফ্রড ও টেম্পার-প্রুফ</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                প্রতিটি লেনদেনের জন্য স্বয়ংক্রিয় ইউনিক অডিট হ্যাশ (#BK-xxxx) তৈরি হয়। কোনো হিসাব পেছনের তারিখে পরিবর্তন বা বিকৃত করার সুযোগ নেই।
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-[#f6f8fc] border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IconRefresh className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">ইন-অ্যাপ অটো আপডেটার</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                প্লে-স্টোরের অপেক্ষা ছাড়াই নতুন কোনো ফিচার বা সিকিউরিটি আপডেট আসার সাথে সাথে অ্যাপের ভেতরেই নোটিফিকেশন পাবেন এবং ১-ক্লিকে ইনস্টল করতে পারবেন।
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-[#f6f8fc] border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-sky-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IconWhatsApp className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">১-ক্লিক হোয়াটসঅ্যাপ রিমাইন্ডার</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                মুখে চেয়ে লজ্জা পাওয়ার দিন শেষ! এক ট্যাপেই কাস্টমারের হোয়াটসঅ্যাপে সুন্দর ফরম্যাট করা পেশাদার হিসাবের ভাউচারসহ তাগাদা মেসেজ পাঠিয়ে দিন।
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-[#f6f8fc] border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-amber-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IconZap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">অফলাইন-ফার্স্ট স্পিড</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ইন্টারনেট লোডিংয়ের কোনো বিরক্তি নেই। বিদ্যুৎ চমকানোর গতিতে হিসাব লিখুন। নেট কানেকশন পেলেই ব্যাকগ্রাউন্ডে স্বয়ংক্রিয় ক্লাউড ব্যাকআপ হবে।
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-[#f6f8fc] border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-purple-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IconFileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">A4 পিডিএফ ও QR ভেরিফিকেশন</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                যেকোনো কাস্টমারের সম্পূর্ণ হিসাবের স্টেটমেন্ট অফিসিয়াল A4 PDF ফরম্যাটে প্রিন্ট বা শেয়ার করুন, যার মধ্যে থাকবে স্ক্যানযোগ্য ডিজিটাল সত্যতা যাচাই সিল।
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-[#f6f8fc] border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-rose-300 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IconUsers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">উভয়পক্ষের যৌথ খাতা</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                হিসাব একতরফা নয়! কাস্টমার নিজের ফোনেই দেখতে পাবেন তিনি কোন দোকানে কত টাকা বাকি খেয়েছেন ও পরিশোধ করেছেন, ফলে ভুল বোঝাবুঝির অবসান ঘটে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= EASY 3-STEP INSTALLATION GUIDE ================= */}
      <section id="install" className="relative z-10 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
              সহজ ইনস্টলেশন
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900">
              কীভাবে ৩টি সহজ ধাপে অ্যাপটি চালু করবেন?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-center relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-600/30">
                ১
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">APK ডাউনলোড করুন</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                আমাদের অফিশিয়াল ওয়েবসাইট থেকে সরাসরি <strong>BakiKhata-v1.6.apk</strong> (৮.৫ মেগাবাইট) ডাউনলোড করুন।
              </p>
              <a
                href={APK_DOWNLOAD_URL}
                download
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span>এখনই ডাউনলোড</span>
              </a>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-600/30">
                ২
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">অনুমতি দিন ও ইনস্টল করুন</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ডাউনলোড শেষে ফাইলে ট্যাপ করুন। সিকিউরিটি প্রম্পট আসলে <strong>&ldquo;Allow from this source&rdquo;</strong> বা <strong>&ldquo;Install anyway&rdquo;</strong> নির্বাচন করে ইনস্টল সম্পন্ন করুন।
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-center">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4 shadow-md shadow-slate-900/30">
                ৩
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Google দিয়ে শুরু করুন</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                অ্যাপ ওপেন করে এক ক্লিকে আপনার <strong>Google অ্যাকাউন্ট</strong> নির্বাচন করুন। সাথে সাথেই আপনার দোকান বা কাস্টমার হিসাব খাতা লাইভ হয়ে যাবে!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECURITY & INTEGRITY SECTION ================= */}
      <section id="security" className="relative z-10 py-16 bg-slate-950 text-white border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                সর্বোচ্চ ডেটা নিরাপত্তা
              </span>
              <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight">
                আপনার ব্যবসার প্রতিটি পয়সার হিসাব ১০০% সুরক্ষিত
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                BakiKhata-তে প্রতিটি এন্ট্রি ক্রিপ্টোগ্রাফিক হ্যাশ দ্বারা সিল করা থাকে। ক্লাউড এন্টারপ্রাইজ লেভেল সিকিউরিটি ও Row-Level Security (RLS) পলিসির মাধ্যমে আপনার ডেটা শুধুমাত্র আপনি এবং আপনার নির্দিষ্ট কাস্টমার ছাড়া অন্য কেউ দেখতে বা এক্সেস করতে পারে না।
              </p>

              <div className="mt-6 space-y-3 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-2.5">
                  <IconLock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>অপরিবর্তনীয় অডিট ট্রেইল:</strong> কোনো ট্রানজ্যাকশন গোপনে মুছে ফেলার সুযোগ নেই।</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <IconShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>৪-সংখ্যার পিন সুরক্ষা:</strong> কর্মচারী বা অন্য কারো হাত থেকে খাতা সুরক্ষিত রাখতে নিজস্ব পিন লক।</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <IconRefresh className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>স্বয়ংক্রিয় ক্লাউড ব্যাকআপ:</strong> ফোন পরিবর্তন হলেও সম্পূর্ণ হিসাব অক্ষত থাকবে।</span>
                </div>
              </div>
            </div>

            {/* Simulated Security Badge Card */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-400">TAMPER_PROOF_ACTIVE</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">SHA-256 ENCRYPTED</span>
              </div>

              <div className="mt-6 space-y-4 font-mono text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-[10px]">LEDGER_HASH_SIGNATURE</p>
                  <p className="text-emerald-300 font-bold break-all">#BK-9F2D87B41A0E7321C94B</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-slate-400">STATUS</p>
                    <p className="text-white font-bold">VERIFIED VALID</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-slate-400">BACKUP</p>
                    <p className="text-white font-bold">GOOGLE CLOUD</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  ডিজিটালভাবে স্বাক্ষরিত রশিদ এবং স্টেটমেন্ট গ্রাহক ও বিক্রেতার মাঝে যেকোনো অস্পষ্টতা চিরতরে সমাধান করে।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
              সচরাচর প্রশ্নাবলী
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900">
              আপনার যা কিছু জানার আছে
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-400">
                      <IconChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-indigo-600" : ""
                        }`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= BOTTOM DOWNLOAD CTA BANNER ================= */}
      <section className="relative z-10 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-[36px] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center border border-indigo-800/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <img
              src="/app-icon.png"
              alt="BakiKhata App"
              className="w-16 h-16 rounded-2xl mx-auto shadow-lg border border-white/20"
            />

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              আজই আপনার দোকানের বাকি খাতা ডিজিটাল করুন!
            </h2>

            <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
              হাজারো সচেতন ব্যবসায়ী ও গ্রাহকের মতো আপনিও ব্যবহার করুন BakiKhata। ঝামেলামুক্ত হিসাব ও শতভাগ বিশ্বস্ত সম্পর্ক গড়ে তুলুন।
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={APK_DOWNLOAD_URL}
                download
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2.5"
              >
                <IconAndroid className="w-5 h-5 text-slate-950" />
                <span>BakiKhata v1.6.0 ডাউনলোড করুন (৮.৫ MB)</span>
              </a>

              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <IconStore className="w-4 h-4" />
                <span>ওয়েব ভার্সন লগইন</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 bg-white border-t border-slate-200/80 py-10 px-4 sm:px-6 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/app-icon.png" alt="BakiKhata" className="w-6 h-6 rounded-lg" />
            <span className="font-extrabold text-slate-900">BakiKhata (Onebaki)</span>
            <span>• ভার্সন ১.৬.০ (Build 7)</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              href="https://github.com/ahh-git/BakiKhata"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              GitHub রিপোজিটরি
            </a>
            <a
              href={APK_DOWNLOAD_URL}
              download
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>সরাসরি APK ডাউনলোড</span>
            </a>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">
              লগইন পোর্টাল
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            © ২০২৬ BakiKhata. বাংলাদেশের ব্যবসায়ীদের জন্য ভালোবাসায় নির্মিত।
          </p>
        </div>
      </footer>

      {/* ================= DESKTOP QR CODE MODAL ================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center"
            >
              <IconX className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mx-auto">
              <IconQrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">মোবাইল দিয়ে স্ক্যান করুন</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার ফোনের ক্যামেরা দিয়ে নিচের QR কোডটি স্ক্যান করলেই তাৎক্ষণিকভাবে <strong>BakiKhata-v1.6.apk</strong> ডাউনলোড শুরু হবে।
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  APK_DOWNLOAD_URL
                )}`}
                alt="Direct Download QR Code"
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>

            <div className="pt-2">
              <a
                href={APK_DOWNLOAD_URL}
                download
                className="w-full block py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                সরাসরি পিসিতে ডাউনলোড করুন
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE FLOATING DOWNLOAD DOCK ================= */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40">
        <a
          href={APK_DOWNLOAD_URL}
          download
          className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-800 active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <img src="/app-icon.png" alt="BakiKhata" className="w-8 h-8 rounded-xl" />
            <div className="text-left">
              <p className="text-xs font-bold leading-tight">BakiKhata v1.6.0</p>
              <p className="text-[10px] text-emerald-400 font-medium">অ্যান্ড্রয়েড অ্যাপ (৮.৫ MB)</p>
            </div>
          </div>
          <span className="text-xs font-extrabold bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1">
            <IconDownload className="w-3.5 h-3.5" />
            <span>ডাউনলোড</span>
          </span>
        </a>
      </div>
    </div>
  );
}
