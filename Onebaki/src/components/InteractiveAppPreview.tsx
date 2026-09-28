"use client";

import React, { useState } from "react";
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
  IconSearch,
  IconPlus,
  IconCreditCard,
  IconBook,
  IconClock,
  IconUser,
  IconCheck,
  IconChevronRight,
  IconChevronDown,
  IconX,
  IconWifi,
  IconSignal,
  IconBattery,
  IconDashboard,
  IconStore,
  IconSparkles,
} from "@/components/Icons";

interface Transaction {
  id: string;
  date: string;
  type: "credit" | "payment";
  amount: number;
  note: string;
  hash: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  due: number;
  totalCredit: number;
  totalPaid: number;
  initials: string;
  color: string;
  transactions: Transaction[];
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Nazmus Shakib Shihan",
    phone: "01315912444",
    due: 800,
    totalCredit: 1200,
    totalPaid: 400,
    initials: "ন",
    color: "from-indigo-600 to-indigo-800",
    transactions: [
      {
        id: "tx-1",
        date: "২৭ সেপ্টেম্বর ২০২৬, রাত ৮:১০",
        type: "credit",
        amount: 500,
        note: "বিস্কুট কার্টন ও চা পাতা",
        hash: "#BK-6C44D",
      },
      {
        id: "tx-2",
        date: "২০ সেপ্টেম্বর ২০২৬, দুপুর ১২:৩০",
        type: "payment",
        amount: 400,
        note: "ক্যাশ পরিশোধ",
        hash: "#BK-4B11E",
      },
      {
        id: "tx-3",
        date: "১৮ সেপ্টেম্বর ২০২৬, সকাল ৯:১৫",
        type: "credit",
        amount: 700,
        note: "আটা ও ডাল",
        hash: "#BK-3A99F",
      },
    ],
  },
  {
    id: "cust-2",
    name: "Mostofa Abid",
    phone: "01712345678",
    due: 1450,
    totalCredit: 3200,
    totalPaid: 1750,
    initials: "ম",
    color: "from-sky-600 to-blue-800",
    transactions: [
      {
        id: "tx-4",
        date: "২৮ সেপ্টেম্বর ২০২৬, দুপুর ২:১৫",
        type: "credit",
        amount: 850,
        note: "মিনিকেট চাল ও সয়াবিন তেল",
        hash: "#BK-8F92A",
      },
      {
        id: "tx-5",
        date: "২৫ সেপ্টেম্বর ২০২৬, বিকাল ৫:৪০",
        type: "payment",
        amount: 1000,
        note: "বিকাশ মারফত নগদ পরিশোধ",
        hash: "#BK-7E31B",
      },
      {
        id: "tx-6",
        date: "২২ সেপ্টেম্বর ২০২৬, সকাল ১০:২০",
        type: "credit",
        amount: 600,
        note: "চিনি ও মসুর ডাল",
        hash: "#BK-5D12C",
      },
    ],
  },
  {
    id: "cust-3",
    name: "Tanvir Ahmed",
    phone: "01987654321",
    due: 0,
    totalCredit: 950,
    totalPaid: 950,
    initials: "ত",
    color: "from-emerald-600 to-teal-800",
    transactions: [
      {
        id: "tx-7",
        date: "২৬ সেপ্টেম্বর ২০২৬, বিকাল ৪:৫০",
        type: "payment",
        amount: 950,
        note: "সম্পূর্ণ বাকি পরিশোধ",
        hash: "#BK-2E88A",
      },
      {
        id: "tx-8",
        date: "২৪ সেপ্টেম্বর ২০২৬, সকাল ১১:১০",
        type: "credit",
        amount: 950,
        note: "ডিম ২ হালি ও সরিষার তেল",
        hash: "#BK-1D77C",
      },
    ],
  },
  {
    id: "cust-4",
    name: "মোঃ আরিফুল ইসলাম",
    phone: "01844556677",
    due: 2150,
    totalCredit: 4150,
    totalPaid: 2000,
    initials: "আ",
    color: "from-purple-600 to-indigo-900",
    transactions: [
      {
        id: "tx-9",
        date: "২৭ সেপ্টেম্বর ২০২৬, সন্ধ্যা ৭:২০",
        type: "credit",
        amount: 1150,
        note: "আটা ও ময়দা বস্তা",
        hash: "#BK-9B66F",
      },
      {
        id: "tx-10",
        date: "১৫ সেপ্টেম্বর ২০২৬, দুপুর ১:০০",
        type: "payment",
        amount: 2000,
        note: "নগদ জমা",
        hash: "#BK-8A55E",
      },
    ],
  },
];

export function InteractiveAppPreview() {
  const [role, setRole] = useState<"shop" | "customer">("shop");
  const [activeTab, setActiveTab] = useState<"dashboard" | "khata" | "history" | "profile">("dashboard");
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "due" | "clear">("all");

  // Interactive modal states inside phone
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<"credit" | "payment">("credit");
  const [addAmount, setAddAmount] = useState("200");
  const [addNote, setAddNote] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(addAmount);
    if (!num || num <= 0) return;

    const targetCustomer = selectedCustomer || customers[0];
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: "আজ, এইমাত্র",
      type: quickAddType,
      amount: num,
      note: addNote || (quickAddType === "credit" ? "পণ্য বিক্রয় (বাকি)" : "নগদ জমা"),
      hash: `#BK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === targetCustomer.id) {
          const newDue = quickAddType === "credit" ? c.due + num : Math.max(0, c.due - num);
          const newCredit = quickAddType === "credit" ? c.totalCredit + num : c.totalCredit;
          const newPaid = quickAddType === "payment" ? c.totalPaid + num : c.totalPaid;
          return {
            ...c,
            due: newDue,
            totalCredit: newCredit,
            totalPaid: newPaid,
            transactions: [newTx, ...c.transactions],
          };
        }
        return c;
      })
    );

    setShowQuickAdd(false);
    setAddNote("");
    showToast(
      quickAddType === "credit"
        ? `৳${num} বাকি যুক্ত হয়েছে (${targetCustomer.name})`
        : `৳${num} জমা গ্রহণ করা হয়েছে!`
    );
  };

  const totalShopDue = customers.reduce((acc, c) => acc + c.due, 0);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    if (!matchesSearch) return false;
    if (filterType === "due") return c.due > 0;
    if (filterType === "clear") return c.due === 0;
    return true;
  });

  return (
    <div className="w-full flex flex-col items-center">
      {/* Device Mode Switcher Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full bg-slate-900/5 backdrop-blur-md border border-slate-900/10 shadow-xs">
        <button
          onClick={() => {
            setRole("shop");
            setSelectedCustomerId(null);
          }}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
            role === "shop"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <IconStore className="w-3.5 h-3.5" />
          <span>দোকানদার ভিউ (Shopkeeper)</span>
        </button>

        <button
          onClick={() => {
            setRole("customer");
            setSelectedCustomerId(null);
          }}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
            role === "customer"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <IconUser className="w-3.5 h-3.5" />
          <span>কাস্টমার ভিউ (Customer)</span>
        </button>

        <button
          onClick={() => {
            setSelectedCustomerId("cust-1");
            setActiveTab("khata");
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/80 transition-all"
        >
          <IconSparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>লেজার খতিয়ান টেস্ট</span>
        </button>
      </div>

      {/* Realistic Smartphone Chassis */}
      <div className="phone-mockup-wrapper">
        {/* Floating Indicator */}
        <div className="absolute -top-3.5 -right-3 z-30 flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-emerald-400 animate-float">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>লাইভ ইন্টারঅ্যাক্টিভ</span>
        </div>

        <div className="phone-mockup-chassis">
          <div className="phone-mockup-screen">
            {/* Phone Top Status Bar (Zero Emojis, Pure SVGs) */}
            <div className="px-6 pt-3 pb-1.5 flex items-center justify-between text-slate-800 text-[11px] font-semibold select-none z-20 bg-slate-100/90 backdrop-blur-md border-b border-slate-200/50">
              <span className="font-display font-bold text-slate-900">18:25</span>

              {/* Dynamic Island / Camera Notch */}
              <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-1.5 px-2">
                <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-[10px] font-bold text-slate-800">5G</span>
                <IconSignal className="w-3.5 h-3.5" />
                <IconWifi className="w-3.5 h-3.5" />
                <IconBattery className="w-4 h-4" />
              </div>
            </div>

            {/* In-Phone Floating Toast Alert */}
            {toastMessage && (
              <div className="absolute top-12 left-4 right-4 z-40 bg-slate-950/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-emerald-400" />
                  <span>{toastMessage}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">LIVE</span>
              </div>
            )}

            {/* SCREEN BODY CONTENT */}
            <div className="phone-screen-content relative bg-[#f6f8fc]">
              {role === "customer" ? (
                /* ================= CUSTOMER PORTAL VIEW ================= */
                <div className="p-4 space-y-4">
                  {/* Customer Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        কাস্টমার পোর্টাল
                      </p>
                      <h2 className="text-base font-bold text-slate-900">Mostofa Abid</h2>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <IconShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>সুরক্ষিত কাস্টমার</span>
                    </span>
                  </div>

                  {/* Customer Total Due Card */}
                  <div className="rounded-3xl p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
                    <p className="text-xs text-indigo-200">আপনার মোট বকেয়া হিসাব</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-black font-display tracking-tight">৳১,৪৫০</span>
                      <span className="text-xs text-rose-300 font-medium">১টি দোকানে বাকি</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-100">
                      <span>মোট পরিশোধ: ৳১,৭৫০</span>
                      <button
                        onClick={() => setShowPdfModal(true)}
                        className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border border-white/20 flex items-center gap-1.5"
                      >
                        <IconFileText className="w-3 h-3" />
                        <span>স্টেটমেন্ট</span>
                      </button>
                    </div>
                  </div>

                  {/* Connected Shops */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 mb-2">সংযুক্ত দোকানসমূহ</h3>
                    <div
                      onClick={() => {
                        setSelectedCustomerId("cust-2");
                        setRole("shop");
                      }}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-100">
                            ভা
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">ভাই ভাই জেনারেল স্টোর</p>
                            <p className="text-[11px] text-slate-500">হাজী মো. রফিকুল ইসলাম</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-rose-600">৳১,৪৫০ বাকি</p>
                          <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 justify-end">
                            <span>খুলুন</span>
                            <IconChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transparency Notice */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                      <IconShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>উভয়পক্ষের সমান স্বচ্ছতা</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      দোকানদার যখনই কোনো বাকি বা জমা লিখবেন, সাথে সাথে আপনার ফোনে আপডেট চলে আসবে। কোনো ভুল হিসাব বা অতিরিক্ত টাকার দাবি করার সুযোগ নেই।
                    </p>
                  </div>
                </div>
              ) : selectedCustomer ? (
                /* ================= CUSTOMER LEDGER VIEW (SAME TO SAME: fragment_customer_ledger.xml) ================= */
                <div className="p-4 space-y-3">
                  {/* Top bar with back button */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCustomerId(null)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs transition-all"
                    >
                      <span>←</span>
                      <span>খাতায় ফিরুন</span>
                    </button>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                      লেজার খতিয়ান
                    </span>
                  </div>

                  {/* Customer Profile Glass Card */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedCustomer.color} text-white font-bold text-lg flex items-center justify-center shadow-xs`}
                      >
                        {selectedCustomer.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {selectedCustomer.name}
                          </h3>
                          <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-slate-500">{selectedCustomer.phone}</p>
                        <span className="inline-block mt-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          কাস্টমার হিসাব খাতা
                        </span>
                      </div>
                    </div>

                    {/* Quick Call & Reminder Actions */}
                    <div className="mt-3 grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => showToast(`${selectedCustomer.phone} নম্বরে কল ডায়াল করা হচ্ছে...`)}
                        className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 text-xs font-bold rounded-xl border border-slate-200/80 transition-all"
                      >
                        <IconPhone className="w-3.5 h-3.5" />
                        <span>কল করুন</span>
                      </button>
                      <button
                        onClick={() =>
                          showToast(`হোয়াটসঅ্যাপে ৳${selectedCustomer.due} তাগাদা মেসেজ পাঠানো হয়েছে!`)
                        }
                        className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all"
                      >
                        <IconWhatsApp className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>তাগাদা পাঠান</span>
                      </button>
                    </div>
                  </div>

                  {/* Due Balance Summary Card */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">বর্তমান হিসাবের অবস্থা</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedCustomer.due > 0
                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                      >
                        {selectedCustomer.due > 0 ? "মোট বাকি" : "পরিশোধিত"}
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-rose-600 font-display">
                        ৳{selectedCustomer.due.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">মোট বাকি নেওয়া</span>
                        <span className="font-bold text-slate-800">
                          ৳{selectedCustomer.totalCredit.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">মোট পরিশোধ</span>
                        <span className="font-bold text-emerald-600">
                          ৳{selectedCustomer.totalPaid.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mutual Security & Verification Badge */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-[11px]">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <IconLock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-[11px]">উভয়পক্ষের সুরক্ষিত হিসাব</p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        দোকানদার ও গ্রাহকের প্রতিটি লেনদেন ক্লাউডে এনক্রিপ্ট ও অপরিবর্তনীয়।
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">
                      সুরক্ষিত
                    </span>
                  </div>

                  {/* Interactive Quick Add / Payment Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setQuickAddType("credit");
                        setShowQuickAdd(true);
                      }}
                      className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <IconPlus className="w-3.5 h-3.5" />
                      <span>বাকি লিখুন</span>
                    </button>
                    <button
                      onClick={() => {
                        setQuickAddType("payment");
                        setShowQuickAdd(true);
                      }}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <IconCreditCard className="w-3.5 h-3.5" />
                      <span>জমা গ্রহণ</span>
                    </button>
                  </div>

                  {/* Export PDF Button */}
                  <button
                    onClick={() => setShowPdfModal(true)}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <IconBook className="w-3.5 h-3.5 text-indigo-600" />
                    <span>অফিসিয়াল PDF স্টেটমেন্ট ডাউনলোড / শেয়ার</span>
                  </button>

                  {/* Section Title: Transaction Ledger */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">লেনদেনের খতিয়ান</span>
                      <span className="text-[10px] text-slate-500">
                        {selectedCustomer.transactions.length}টি লেনদেন
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedCustomer.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">{tx.note}</p>
                            <p className="text-[10px] text-slate-400">{tx.date}</p>
                            <span className="inline-block text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 rounded">
                              {tx.hash}
                            </span>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-black font-display ${
                                tx.type === "credit" ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {tx.type === "credit" ? `+৳${tx.amount}` : `-৳${tx.amount}`}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                tx.type === "credit"
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              }`}
                            >
                              {tx.type === "credit" ? "বাকি" : "জমা"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeTab === "dashboard" ? (
                /* ================= SHOPKEEPER DASHBOARD (SAME TO SAME: fragment_shop_home.xml) ================= */
                <div className="p-4 space-y-3.5">
                  {/* Header: Title + Live Sync Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 leading-tight">
                        দোকানের ড্যাশবোর্ড
                      </h2>
                      <p className="text-[11px] text-slate-500">দৈনিক বাকি ও কালেকশন হিসাব</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>লাইভ সিন্ক</span>
                    </span>
                  </div>

                  {/* Gradient Stats Card */}
                  <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
                    <p className="text-xs text-slate-300 font-medium">মোট কাস্টমার পাওনা</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-black font-display tracking-tight text-white">
                        ৳{totalShopDue.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">আজকের কালেকশন</span>
                        <span className="font-bold text-emerald-400">৳৩,২০০</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">বাকি কাস্টমার</span>
                        <span className="font-bold text-indigo-300">
                          {customers.filter((c) => c.due > 0).length} জন
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Quick Action Matrix */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <button
                      onClick={() => {
                        setQuickAddType("credit");
                        setShowQuickAdd(true);
                      }}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
                    >
                      <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <IconPlus className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">বাকি দিন</span>
                    </button>

                    <button
                      onClick={() => {
                        setQuickAddType("payment");
                        setShowQuickAdd(true);
                      }}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
                    >
                      <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <IconCreditCard className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">জমা নিন</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("khata")}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
                    >
                      <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <IconBook className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">খাতা</span>
                    </button>

                    <button
                      onClick={() => setShowPdfModal(true)}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
                    >
                      <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <IconQrCode className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">QR কোড</span>
                    </button>
                  </div>

                  {/* Recent Customer Cards (SAME TO SAME as item_shop_book_customer.xml) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800">সাম্প্রতিক কাস্টমার হিসাব</h3>
                      <button
                        onClick={() => setActiveTab("khata")}
                        className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>সব দেখুন</span>
                        <IconChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {customers.slice(0, 3).map((cust) => (
                      <div
                        key={cust.id}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs hover:border-indigo-200 transition-all"
                      >
                        {/* Top row: Avatar + Name/Phone + Due Badge */}
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className="flex items-center gap-3 cursor-pointer flex-1"
                          >
                            <div
                              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cust.color} text-white font-bold text-base flex items-center justify-center shadow-xs`}
                            >
                              {cust.initials}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                              <p className="text-[10px] text-slate-500">{cust.phone}</p>
                            </div>
                          </div>

                          <div className="bg-rose-50 border border-rose-100 text-center px-3 py-1.5 rounded-xl">
                            <span className="text-[9px] font-bold text-rose-500 block leading-tight">
                              মোট বাকি
                            </span>
                            <span className="text-xs font-extrabold text-rose-700 font-display">
                              {cust.due > 0 ? `৳${cust.due.toLocaleString()}` : "৳০"}
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-slate-100 my-2.5" />

                        {/* Action Strip */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                showToast(`হোয়াটসঅ্যাপে ৳${cust.due} তাগাদা বার্তা পাঠানো হয়েছে`)
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 transition-all"
                            >
                              <IconWhatsApp className="w-3 h-3 text-[#25D366]" />
                              <span>তাকিদা</span>
                            </button>
                            <button
                              onClick={() => showToast(`${cust.phone} নম্বরে কল ডায়াল করা হচ্ছে...`)}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-blue-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-all"
                            >
                              <IconPhone className="w-3 h-3" />
                              <span>কল</span>
                            </button>
                          </div>

                          <button
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                          >
                            <span>হিসাব দেখুন</span>
                            <IconChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === "khata" ? (
                /* ================= KHATA / CUSTOMER LIST (SAME TO SAME: fragment_shop_book.xml) ================= */
                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">খাতা</h2>
                    <p className="text-[11px] text-slate-500">
                      আপনার দোকানের সকল কাস্টমার ও বাকি হিসাব
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="কাস্টমারের নাম বা ফোন নম্বর খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                    <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      onClick={() => setFilterType("all")}
                      className={`px-3 py-1 rounded-full font-bold transition-all ${
                        filterType === "all"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      সবাই ({customers.length})
                    </button>
                    <button
                      onClick={() => setFilterType("due")}
                      className={`px-3 py-1 rounded-full font-bold transition-all ${
                        filterType === "due"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      বাকি আছে ({customers.filter((c) => c.due > 0).length})
                    </button>
                    <button
                      onClick={() => setFilterType("clear")}
                      className={`px-3 py-1 rounded-full font-bold transition-all ${
                        filterType === "clear"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      বাকি নেই ({customers.filter((c) => c.due === 0).length})
                    </button>
                  </div>

                  {/* Customer list */}
                  <div className="space-y-2 pt-1">
                    {filteredCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs hover:border-indigo-200 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className="flex items-center gap-3 cursor-pointer flex-1"
                          >
                            <div
                              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cust.color} text-white font-bold text-base flex items-center justify-center shadow-xs`}
                            >
                              {cust.initials}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                              <p className="text-[10px] text-slate-500">{cust.phone}</p>
                            </div>
                          </div>

                          <div
                            className={`border text-center px-3 py-1.5 rounded-xl ${
                              cust.due > 0
                                ? "bg-rose-50 border-rose-100 text-rose-700"
                                : "bg-emerald-50 border-emerald-100 text-emerald-700"
                            }`}
                          >
                            <span className="text-[9px] font-bold block leading-tight">
                              {cust.due > 0 ? "মোট বাকি" : "পরিশোধিত"}
                            </span>
                            <span className="text-xs font-extrabold font-display">
                              ৳{cust.due.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-px bg-slate-100 my-2.5" />

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                showToast(`হোয়াটসঅ্যাপে ৳${cust.due} তাগাদা বার্তা পাঠানো হয়েছে`)
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 transition-all"
                            >
                              <IconWhatsApp className="w-3 h-3 text-[#25D366]" />
                              <span>তাকিদা</span>
                            </button>
                            <button
                              onClick={() => showToast(`${cust.phone} নম্বরে কল ডায়াল করা হচ্ছে...`)}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-blue-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-all"
                            >
                              <IconPhone className="w-3 h-3" />
                              <span>কল</span>
                            </button>
                          </div>

                          <button
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                          >
                            <span>হিসাব দেখুন</span>
                            <IconChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === "history" ? (
                /* ================= TRANSACTION HISTORY (SAME TO SAME: fragment_history.xml) ================= */
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500 font-bold">হিস্টোরি</p>
                      <h2 className="text-base font-bold text-slate-900">লেনদেনের অডিট খতিয়ান</h2>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      অপরিবর্তনীয়
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    প্রতিটি লেনদেন ক্রিপ্টোগ্রাফিক হ্যাশ দ্বারা সিল করা এবং ক্লাউডে সংরক্ষিত।
                  </p>

                  <div className="space-y-2 pt-1">
                    {customers
                      .flatMap((c) =>
                        c.transactions.map((t) => ({
                          ...t,
                          customerName: c.name,
                          customerInitials: c.initials,
                        }))
                      )
                      .slice(0, 6)
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">
                                {tx.customerName}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                                {tx.hash}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{tx.note}</p>
                            <p className="text-[10px] text-slate-400">{tx.date}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-black font-display ${
                                tx.type === "credit" ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {tx.type === "credit" ? `+৳${tx.amount}` : `-৳${tx.amount}`}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                tx.type === "credit"
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              }`}
                            >
                              {tx.type === "credit" ? "বাকি" : "জমা"}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* ================= PROFILE / SETTINGS TAB ================= */
                <div className="p-4 space-y-3.5">
                  <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                      ভা
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">হাজী মো. রফিকুল ইসলাম</h3>
                      <p className="text-[11px] text-slate-500">দোকান: ভাই ভাই জেনারেল স্টোর</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <IconCheck className="w-3 h-3 text-emerald-600" />
                        <span>ভেরিফাইড দোকানদার</span>
                      </span>
                    </div>
                  </div>

                  {/* Security Status Card */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <IconLock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>নিরাপত্তা ও পিন লক</span>
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <span>৪-সংখ্যার পিন সুরক্ষা</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                        সক্রিয় আছে
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>গুগল ক্লাউড ব্যাকআপ</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                        স্বয়ংক্রিয়
                      </span>
                    </div>
                  </div>

                  {/* Version Info Card */}
                  <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <IconAndroid className="w-3.5 h-3.5 text-emerald-400" />
                        <span>BakiKhata Android App</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        v1.6.0 (Build 7)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      অ্যান্টি-ফ্রড ডিজিটাল QR ভাউচার, ক্লাউড সিঙ্ক এবং ইন-অ্যাপ অটো আপডেটার সক্রিয়।
                    </p>
                    <button
                      onClick={() => showToast("আপনার অ্যাপটি সর্বশেষ v1.6.0 সংস্করণে আপডেট আছে!")}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <IconRefresh className="w-3.5 h-3.5" />
                      <span>আপডেট চেক করুন (v1.6.0)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK ADD DRAWER MODAL (INSIDE PHONE) */}
            {showQuickAdd && (
              <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end p-3 animate-fadeIn">
                <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {quickAddType === "credit" ? (
                        <>
                          <IconPlus className="w-4 h-4 text-rose-600" />
                          <span>নতুন বাকি যোগ করুন</span>
                        </>
                      ) : (
                        <>
                          <IconCreditCard className="w-4 h-4 text-emerald-600" />
                          <span>নগদ জমা গ্রহণ</span>
                        </>
                      )}
                    </h4>
                    <button
                      onClick={() => setShowQuickAdd(false)}
                      className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center hover:bg-slate-200"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      টাকার পরিমাণ (৳)
                    </label>
                    <input
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="টাকার অংক"
                      className="w-full text-xl font-bold font-display px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                    {["100", "200", "500", "1000"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAddAmount(amt)}
                        className="py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-[11px] transition-all"
                      >
                        +৳{amt}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      বিবরণ / পণ্যের নাম
                    </label>
                    <input
                      type="text"
                      value={addNote}
                      onChange={(e) => setAddNote(e.target.value)}
                      placeholder="যেমন: চাল, চিনি, তেল ইত্যাদি"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    onClick={handleAddTransaction}
                    className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all ${
                      quickAddType === "credit"
                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    }`}
                  >
                    হিসাব সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            )}

            {/* ANTI-FRAUD PDF STATEMENT MODAL (INSIDE PHONE) */}
            {showPdfModal && (
              <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end p-2 animate-fadeIn">
                <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 max-h-[90%] overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <IconFileText className="w-3 h-3 text-emerald-600" />
                      <span>অফিসিয়াল স্টেটমেন্ট প্রিভিউ</span>
                    </span>
                    <button
                      onClick={() => setShowPdfModal(false)}
                      className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center hover:bg-slate-200"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Simulated A4 PDF Document */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs space-y-2">
                    <div className="text-center pb-2 border-b border-slate-200">
                      <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">
                        BAKIKHATA OFFICIAL STATEMENT
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        ভাই ভাই জেনারেল স্টোর (মোবাইল: 01712345678)
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        তারিখ: ২৮ সেপ্টেম্বর ২০২৬ • অডিট কোড: #BK-8F92A
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] py-1 bg-white p-2 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400">গ্রাহকের নাম:</p>
                        <p className="font-bold text-slate-900">
                          {selectedCustomer?.name || "Nazmus Shakib Shihan"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">বর্তমান বকেয়া:</p>
                        <p className="font-bold text-rose-600">৳{selectedCustomer?.due || 800}</p>
                      </div>
                    </div>

                    {/* QR Code and Tamper-Proof Seal */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-white p-1 rounded-lg border border-emerald-300 flex items-center justify-center">
                          <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https%3A%2F%2Fgithub.com%2Fahh-git%2FBakiKhata%2Freleases%2Fdownload%2Fv1.2.0%2FBakiKhata-v1.6.apk"
                            alt="Verification QR"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-900">
                            ডিজিটাল ভেরিফিকেশন QR
                          </p>
                          <p className="text-[8px] text-emerald-700">
                            স্ক্যান করে অরিজিনাল অডিট কপি যাচাই করুন
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs border border-emerald-200 flex items-center gap-1">
                        <IconCheck className="w-3 h-3 text-emerald-600" />
                        <span>VERIFIED</span>
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400 text-center italic">
                      এটি একটি কম্পিউটারাইজড নিরাপদ ভাউচার। কোনো কাটাকাটি বা অস্পষ্টতা গ্রহণযোগ্য নয়।
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setShowPdfModal(false);
                        showToast("PDF স্টেটমেন্ট ডাউনলোড সফল হয়েছে!");
                      }}
                      className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <IconDownload className="w-3.5 h-3.5" />
                      <span>ডাউনলোড করুন</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPdfModal(false);
                        showToast("কাস্টমারের হোয়াটসঅ্যাপে স্টেটমেন্ট শেয়ার করা হয়েছে!");
                      }}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <IconWhatsApp className="w-3.5 h-3.5 text-white" />
                      <span>হোয়াটসঅ্যাপ শেয়ার</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Phone Bottom Navigation Bar (SAME TO SAME as Android BottomNavigationView) */}
            <div className="px-3 py-2 bg-white/95 backdrop-blur-md border-t border-slate-200/80 grid grid-cols-4 gap-1 z-20">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setSelectedCustomerId(null);
                }}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                  activeTab === "dashboard" && !selectedCustomerId
                    ? "text-indigo-600 font-bold bg-indigo-50/70"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <IconDashboard className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">ড্যাশবোর্ড</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("khata");
                  setSelectedCustomerId(null);
                }}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                  activeTab === "khata" || selectedCustomerId
                    ? "text-indigo-600 font-bold bg-indigo-50/70"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <IconBook className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">খাতা</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("history");
                  setSelectedCustomerId(null);
                }}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                  activeTab === "history" && !selectedCustomerId
                    ? "text-indigo-600 font-bold bg-indigo-50/70"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <IconClock className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">হিস্টোরি</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setSelectedCustomerId(null);
                }}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                  activeTab === "profile" && !selectedCustomerId
                    ? "text-indigo-600 font-bold bg-indigo-50/70"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <IconUser className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">প্রোফাইল</span>
              </button>
            </div>

            {/* Phone Home Gesture Bar */}
            <div className="pb-1.5 pt-0.5 flex justify-center bg-white">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500 font-medium flex items-center gap-1.5">
        <IconSparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>
          <strong className="text-slate-700">লাইভ ইন্টারঅ্যাক্টিভ:</strong> ফোনে ক্লিক করে কাস্টমার লেজার খুলুন, নতুন হিসাব যোগ করুন বা PDF প্রিভিউ দেখুন!
        </span>
      </p>
    </div>
  );
}
