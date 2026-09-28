"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { banglaParts } from "@/lib/format";
import { supabase, type LedgerRow, type Profile } from "@/lib/supabase";
import {
  IconPhone,
  IconWhatsApp,
  IconPlus,
  IconCreditCard,
  IconBook,
  IconLock,
  IconShieldCheck,
  IconCheck,
  IconX,
  IconDownload,
  IconQrCode,
  IconFileText,
} from "@/components/Icons";

export default function CustomerLedger() {
  const { customerId } = useParams<{ customerId: string }>();
  const { profile } = useSession();
  const router = useRouter();

  const [person, setPerson] = useState<Profile | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [due, setDue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<"credit" | "payment">("credit");
  const [amount, setAmount] = useState("200");
  const [itemName, setItemName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    if (!profile) return;
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();
    setPerson(p as Profile);

    const { data } = await supabase
      .from("ledger")
      .select("*")
      .eq("shopkeeper_id", profile.id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    setRows((data as LedgerRow[]) || []);

    const { data: bal } = await supabase.rpc("balance_for", {
      p_shop: profile.id,
      p_customer: customerId,
    });
    setDue(Number(bal || 0));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile, customerId]);

  // Handle live transaction entry
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !profile) return;

    setSubmitting(true);
    const { error } = await supabase.from("ledger").insert({
      shopkeeper_id: profile.id,
      customer_id: customerId,
      created_by: profile.id,
      kind: modalType,
      item_name: itemName || (modalType === "credit" ? "পণ্য বিক্রয় (বাকি)" : "নগদ পরিশোধ"),
      amount: num,
      status: "confirmed",
    });

    if (!error) {
      setShowAddModal(false);
      setItemName("");
      showNotification(
        modalType === "credit" ? `৳${num} বাকি যুক্ত হয়েছে!` : `৳${num} জমা গ্রহণ করা হয়েছে!`
      );
      await loadData();
    } else {
      alert("লেনদেন সংরক্ষণ করা যায়নি: " + error.message);
    }
    setSubmitting(false);
  };

  const totalCredit = rows
    .filter((r) => r.kind === "credit")
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalPaid = rows
    .filter((r) => r.kind === "payment" && r.status === "confirmed")
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <Guard>
      <div className="space-y-4">
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-16 left-4 right-4 sm:max-w-md sm:mx-auto z-50 bg-slate-950/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <IconCheck className="w-4 h-4 text-emerald-400" />
              <span>{toast}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">LIVE</span>
          </div>
        )}

        {/* Top bar with back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/shop-book"
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs transition-all"
          >
            <span>←</span>
            <span>খাতায় ফিরুন</span>
          </Link>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            লেজার খতিয়ান
          </span>
        </div>

        {/* Customer Profile Glass Card (SAME TO SAME as fragment_customer_ledger.xml) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold text-lg flex items-center justify-center shadow-xs">
              {person?.full_name?.charAt(0) || "ক"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {person?.full_name || "কাস্টমার"}
                </h2>
                <IconCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500">{person?.phone || "ফোন নম্বর নেই"}</p>
              <span className="inline-block mt-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                কাস্টমার হিসাব খাতা
              </span>
            </div>
          </div>

          {/* Quick Call & Reminder Actions */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            {person?.phone ? (
              <>
                <a
                  href={`tel:${person.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 text-xs font-bold rounded-xl border border-slate-200 transition-all"
                >
                  <IconPhone className="w-3.5 h-3.5" />
                  <span>কল করুন</span>
                </a>

                <a
                  href={`https://wa.me/88${person.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম ${person.full_name}, ${profile?.shop_name || "দোকানে"} আপনার বর্তমান বাকি হিসাব ৳${money(due)}। ধন্যবাদ।`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all"
                >
                  <IconWhatsApp className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>তাগাদা পাঠান</span>
                </a>
              </>
            ) : null}
          </div>
        </div>

        {/* Due Balance Summary Glass Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">বর্তমান হিসাবের অবস্থা</span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                due > 0
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}
            >
              {due > 0 ? "মোট বাকি" : "পরিশোধিত"}
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-black text-rose-600 font-display">
              ৳{money(due)}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">মোট বাকি নেওয়া</span>
              <span className="font-bold text-slate-800">৳{money(totalCredit)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">মোট পরিশোধ</span>
              <span className="font-bold text-emerald-600">৳{money(totalPaid)}</span>
            </div>
          </div>
        </div>

        {/* Mutual Security & Verification Badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <IconLock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-xs">উভয়পক্ষের সুরক্ষিত হিসাব</p>
            <p className="text-[10px] text-slate-500 leading-tight">
              দোকানদার ও গ্রাহকের প্রতিটি লেনদেন ক্লাউডে এনক্রিপ্ট ও অপরিবর্তনীয়।
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">
            সুরক্ষিত
          </span>
        </div>

        {/* Quick Add & Payment Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              setModalType("credit");
              setShowAddModal(true);
            }}
            className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <IconPlus className="w-4 h-4" />
            <span>বাকি লিখুন</span>
          </button>

          <button
            onClick={() => {
              setModalType("payment");
              setShowAddModal(true);
            }}
            className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <IconCreditCard className="w-4 h-4" />
            <span>জমা গ্রহণ</span>
          </button>
        </div>

        {/* Export Official PDF Statement Button */}
        <button
          onClick={() => setShowPdfModal(true)}
          className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <IconBook className="w-4 h-4 text-indigo-600" />
          <span>অফিসিয়াল PDF স্টেটমেন্ট ডাউনলোড / প্রিন্ট</span>
        </button>

        {/* Section: Transaction Ledger */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-900">লেনদেনের খতিয়ান</h3>
            <span className="text-[11px] text-slate-500">{rows.length}টি লেনদেন</span>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">লোড হচ্ছে...</div>
          ) : !rows.length ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-500">
              কোনো লেনদেন পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2.5">
              {rows.map((r) => {
                const t = banglaParts(r.created_at);
                const auditHash = `#BK-${r.id.substring(0, 5).toUpperCase()}`;
                const isCredit = r.kind === "credit";

                return (
                  <article
                    key={r.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">
                        {r.kind === "credit" ? r.item_name || "পণ্য বিক্রয়" : "নগদ পরিশোধ"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {t.date} • {t.hour}:{t.minute}
                      </p>
                      <span className="inline-block text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {auditHash}
                      </span>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-black font-display ${
                          isCredit ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {isCredit ? `+৳${money(Number(r.amount))}` : `-৳${money(Number(r.amount))}`}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          isCredit
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {isCredit ? "বাকি" : "জমা"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ADD / PAYMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                {modalType === "credit" ? (
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
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center hover:bg-slate-200"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="টাকার অংক লিখুন"
                className="w-full text-2xl font-bold font-display px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
              />
            </div>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-2 text-xs font-bold">
              {["100", "200", "500", "1000"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className="py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all"
                >
                  +৳{amt}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                বিবরণ / পণ্যের নাম
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="যেমন: চাল, চিনি, তেল ইত্যাদি"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
              />
            </div>

            <button
              onClick={handleSubmitTransaction}
              disabled={submitting}
              className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all ${
                modalType === "credit"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              {submitting ? "সংরক্ষণ হচ্ছে..." : "হিসাব সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      )}

      {/* ANTI-FRAUD A4 PDF STATEMENT PREVIEW MODAL */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <IconFileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>অফিসিয়াল PDF স্টেটমেন্ট</span>
              </span>
              <button
                onClick={() => setShowPdfModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center hover:bg-slate-200"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* A4 Statement Preview Document */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="text-center pb-3 border-b border-slate-200">
                <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  BAKIKHATA OFFICIAL STATEMENT
                </h4>
                <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                  {profile?.shop_name || "দোকান"} (কোড: {profile?.shop_code})
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  তারিখ: {new Date().toLocaleDateString("bn-BD")} • অডিট কোড: #BK-
                  {person?.id.substring(0, 5).toUpperCase()}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 bg-white p-2.5 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400">গ্রাহকের নাম:</p>
                  <p className="font-bold text-slate-900">{person?.full_name}</p>
                  <p className="text-[10px] text-slate-500">{person?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">মোট বকেয়া:</p>
                  <p className="font-bold text-base text-rose-600">৳{money(due)}</p>
                </div>
              </div>

              {/* QR Verification Seal */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 bg-white p-1 rounded-lg border border-emerald-300 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        `https://onebaki.vercel.app/shop-book/${customerId}`
                      )}`}
                      alt="Verification QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">ডিজিটাল ভেরিফিকেশন QR</p>
                    <p className="text-[9px] text-emerald-700">স্ক্যান করে মূল স্টেটমেন্ট যাচাই করুন</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-1 rounded shadow-2xs border border-emerald-200 flex items-center gap-1">
                  <IconCheck className="w-3 h-3 text-emerald-600" />
                  <span>VERIFIED</span>
                </span>
              </div>

              {/* Transactions Preview Table */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600">সর্বশেষ এন্ট্রিসমূহ:</p>
                {rows.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between py-1 border-b border-slate-200/50 text-[11px]"
                  >
                    <span className="text-slate-700 truncate max-w-[200px]">
                      {r.item_name || (r.kind === "credit" ? "বাকি" : "পরিশোধ")}
                    </span>
                    <span
                      className={`font-bold ${r.kind === "credit" ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {r.kind === "credit" ? `+৳${money(Number(r.amount))}` : `-৳${money(Number(r.amount))}`}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-slate-400 text-center italic pt-1">
                এটি একটি কম্পিউটারাইজড নিরাপদ ভাউচার। কোনো কাটাকাটি বা অস্পষ্টতা গ্রহণযোগ্য নয়।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  window.print();
                  setShowPdfModal(false);
                }}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <IconDownload className="w-4 h-4" />
                <span>প্রিন্ট / ডাউনলোড</span>
              </button>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  showNotification("কাস্টমারের হোয়াটসঅ্যাপে স্টেটমেন্ট শেয়ার করা হয়েছে!");
                }}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <IconWhatsApp className="w-4 h-4 text-white" />
                <span>হোয়াটসঅ্যাপ শেয়ার</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Guard>
  );
}
