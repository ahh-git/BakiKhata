"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { supabase, type Profile } from "@/lib/supabase";
import {
  IconPlus,
  IconCreditCard,
  IconBook,
  IconQrCode,
  IconWhatsApp,
  IconPhone,
  IconChevronRight,
  IconShieldCheck,
  IconCheck,
  IconX,
  IconStore,
  IconClock,
} from "@/components/Icons";

type ShopCard = {
  shop: Profile;
  due: number;
  pending: number;
};

export default function HomePage() {
  const { profile, user } = useSession();
  if (profile?.role === "shopkeeper") return <ShopHome />;
  return <CustomerHome userId={user?.id} />;
}

/* =====================================================================
   CUSTOMER HOME VIEW
===================================================================== */
function CustomerHome({ userId }: { userId?: string }) {
  const [rows, setRows] = useState<ShopCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: links } = await supabase
        .from("shop_links")
        .select("shopkeeper_id")
        .eq("customer_id", userId);
      const ids = (links || []).map((l) => l.shopkeeper_id);
      if (!ids.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data: shops } = await supabase.from("profiles").select("*").in("id", ids);
      const cards: ShopCard[] = [];
      for (const shop of (shops || []) as Profile[]) {
        const { data: due } = await supabase.rpc("balance_for", {
          p_shop: shop.id,
          p_customer: userId,
        });
        const { data: pendingRows } = await supabase
          .from("ledger")
          .select("amount")
          .eq("shopkeeper_id", shop.id)
          .eq("customer_id", userId)
          .eq("kind", "payment")
          .eq("status", "pending");
        const pending = (pendingRows || []).reduce((s, r) => s + Number(r.amount), 0);
        cards.push({ shop, due: Number(due || 0), pending });
      }
      setRows(cards);
      setLoading(false);
    })();
  }, [userId]);

  const totalDue = rows.reduce((s, r) => s + r.due, 0);

  return (
    <Guard>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              কাস্টমার পোর্টাল
            </p>
            <h1 className="text-xl font-bold text-slate-900">আমার বাকি খাতা</h1>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <IconShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>সুরক্ষিত খাতা</span>
          </span>
        </div>

        {/* Customer Total Due Gradient Card */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
          <p className="text-xs text-indigo-200 font-medium">আপনার মোট বকেয়া হিসাব</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display tracking-tight">৳{money(totalDue)}</span>
            <span className="text-xs text-rose-300 font-medium">{rows.length}টি দোকানে যুক্ত</span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-100">
            <span>স্বচ্ছ ক্লাউড সিঙ্ক</span>
            <Link
              href="/join"
              className="bg-white/15 hover:bg-white/25 px-3 py-1 rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
            >
              <span>+ নতুন দোকান</span>
            </Link>
          </div>
        </div>

        {/* Connected Shops List */}
        <div>
          <h2 className="text-xs font-bold text-slate-800 mb-2">সংযুক্ত দোকানসমূহ</h2>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">দোকানের তথ্য লোড হচ্ছে...</div>
          ) : !rows.length ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <IconStore className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">এখনো কোনো দোকান নেই</p>
                <p className="text-xs text-slate-500 mt-1">
                  দোকানদারের ৪-সংখ্যার আইডি দিয়ে জয়েন করুন।
                </p>
              </div>
              <Link
                href="/join"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <span>দোকানে জয়েন করুন</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(({ shop, due, pending }) => (
                <div
                  key={shop.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-base flex items-center justify-center">
                        {shop.shop_name?.charAt(0) || "দো"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{shop.shop_name}</h3>
                          <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-slate-500">আইডি {shop.shop_code}</p>
                      </div>
                    </div>

                    <div
                      className={`text-center px-3 py-1.5 rounded-xl border ${
                        due > 0
                          ? "bg-rose-50 border-rose-100 text-rose-700"
                          : "bg-emerald-50 border-emerald-100 text-emerald-700"
                      }`}
                    >
                      <span className="text-[9px] font-bold block leading-tight">
                        {due > 0 ? "মোট বাকি" : "পরিশোধিত"}
                      </span>
                      <span className="text-sm font-black font-display">৳{money(due)}</span>
                    </div>
                  </div>

                  {pending > 0 ? (
                    <div className="mt-2.5 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                      <span>কনফার্মেশনের অপেক্ষায় পরিশোধ:</span>
                      <span className="font-bold">৳{money(pending)}</span>
                    </div>
                  ) : null}

                  <div className="w-full h-px bg-slate-100 my-3" />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Link
                      href={`/history/${shop.id}`}
                      className="py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1"
                    >
                      <IconClock className="w-3 h-3" />
                      <span>হিস্টোরি</span>
                    </Link>

                    <Link
                      href={`/add/${shop.id}`}
                      className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1"
                    >
                      <IconPlus className="w-3 h-3" />
                      <span>বাকি লিখুন</span>
                    </Link>

                    <Link
                      href={`/pay/${shop.id}`}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-1"
                    >
                      <IconCreditCard className="w-3 h-3" />
                      <span>পরিশোধ</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Transparency Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
            <IconShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>১০০% নিরাপদ ও অপরিবর্তনীয় হিসাব</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            দোকানদার যখনই কোনো এন্ট্রি করবেন, সাথে সাথে আপনার এখানে সিঙ্ক হবে। কোনো ভুল বা অতিরিক্ত টাকা দাবি করার সুযোগ নেই।
          </p>
        </div>
      </div>
    </Guard>
  );
}

/* =====================================================================
   SHOPKEEPER HOME VIEW (SAME TO SAME: fragment_shop_home.xml)
===================================================================== */
function ShopHome() {
  const { profile } = useSession();
  const [stats, setStats] = useState({ customers: 0, due: 0, pending: 0 });
  const [pending, setPending] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: links } = await supabase
        .from("shop_links")
        .select("customer_id")
        .eq("shopkeeper_id", profile.id);
      const customers = links?.length || 0;
      let due = 0;
      const custRows: any[] = [];

      for (const l of links || []) {
        const { data } = await supabase.rpc("balance_for", {
          p_shop: profile.id,
          p_customer: l.customer_id,
        });
        const currentBal = Number(data || 0);
        due += currentBal;

        const { data: custProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", l.customer_id)
          .maybeSingle();

        if (custProfile) {
          custRows.push({ ...custProfile, due: currentBal });
        }
      }

      setRecentCustomers(custRows.sort((a, b) => b.due - a.due).slice(0, 5));

      const { data: pays } = await supabase
        .from("ledger")
        .select("*")
        .eq("shopkeeper_id", profile.id)
        .eq("kind", "payment")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const pendingAmt = (pays || []).reduce((s, r) => s + Number(r.amount), 0);
      setStats({ customers, due, pending: pendingAmt });
      setPending(pays || []);
    })();
  }, [profile]);

  const decide = async (id: string, accept: boolean) => {
    await supabase.rpc("decide_payment", { p_id: id, p_accept: accept });
    setPending((p) => p.filter((x) => x.id !== id));
  };

  const copyShopCode = () => {
    if (!profile?.shop_code) return;
    navigator.clipboard.writeText(profile.shop_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Guard>
      <div className="space-y-4">
        {/* Header: Title + Live Sync Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">দোকানের ড্যাশবোর্ড</h1>
            <p className="text-[11px] text-slate-500">দৈনিক বাকি ও কালেকশন হিসাব</p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>লাইভ সিন্ক</span>
          </span>
        </div>

        {/* Gradient Stats Card */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
          <p className="text-xs text-slate-300 font-medium">মোট কাস্টমার পাওনা</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display tracking-tight text-white">
              ৳{money(stats.due)}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">মোট কাস্টমার</span>
              <span className="font-bold text-emerald-400">{stats.customers} জন</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">অপেক্ষমাণ জমা</span>
              <span className="font-bold text-indigo-300">৳{money(stats.pending)}</span>
            </div>
          </div>
        </div>

        {/* 4 Quick Action Matrix (SAME TO SAME as fragment_shop_home.xml) */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <Link
            href="/shop-book"
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <IconPlus className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-slate-700">বাকি দিন</span>
          </Link>

          <Link
            href="/shop-book"
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IconCreditCard className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-slate-700">জমা নিন</span>
          </Link>

          <Link
            href="/shop-book"
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IconBook className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-slate-700">খাতা</span>
          </Link>

          <button
            onClick={() => setShowQrModal(true)}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <IconQrCode className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-slate-700">QR কোড</span>
          </button>
        </div>

        {/* Shop ID Card with One-Tap Copy */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              আপনার দোকান আইডি
            </p>
            <p className="font-display text-2xl font-black text-indigo-700 tracking-wider">
              {profile?.shop_code}
            </p>
            <p className="text-[11px] text-slate-500">কাস্টমারকে জয়েন করতে এই আইডি বলুন</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyShopCode}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              {copied ? "কপি হয়েছে!" : "কপি করুন"}
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-all"
            >
              <IconQrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pending Approvals */}
        {pending.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-800">অনুমোদনের অপেক্ষায় পরিশোধ</h2>
            {pending.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">৳{money(Number(p.amount))}</span>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    অপেক্ষমাণ
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  কনফার্ম করার পূর্বে এই টাকা খাতা থেকে কর্তন হবে না।
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => decide(p.id, true)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>কনফার্ম</span>
                  </button>
                  <button
                    onClick={() => decide(p.id, false)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <IconX className="w-3.5 h-3.5" />
                    <span>বাতিল</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Customer Cards (SAME TO SAME as item_shop_book_customer.xml) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800">সাম্প্রতিক কাস্টমার হিসাব</h2>
            <Link
              href="/shop-book"
              className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              <span>সব দেখুন</span>
              <IconChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {!recentCustomers.length ? (
            <p className="text-xs text-slate-400 py-3 text-center">এখনো কোনো কাস্টমার যুক্ত নেই।</p>
          ) : (
            recentCustomers.map((cust) => (
              <div
                key={cust.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/shop-book/${cust.id}`}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-base flex items-center justify-center">
                      {cust.full_name?.charAt(0) || "ক"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{cust.full_name}</p>
                      <p className="text-[10px] text-slate-500">{cust.phone || "নম্বর নেই"}</p>
                    </div>
                  </Link>

                  <div
                    className={`text-center px-3 py-1.5 rounded-xl border ${
                      cust.due > 0
                        ? "bg-rose-50 border-rose-100 text-rose-700"
                        : "bg-emerald-50 border-emerald-100 text-emerald-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold block leading-tight">
                      {cust.due > 0 ? "মোট বাকি" : "পরিশোধিত"}
                    </span>
                    <span className="text-xs font-extrabold font-display">
                      ৳{money(cust.due)}
                    </span>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 my-2.5" />

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {cust.phone ? (
                      <>
                        <a
                          href={`https://wa.me/88${cust.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `আসসালামু আলাইকুম ${cust.full_name}, ${profile?.shop_name || "দোকানে"} আপনার বর্তমান বাকি হিসাব ৳${money(cust.due)}। ধন্যবাদ।`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 transition-all"
                        >
                          <IconWhatsApp className="w-3 h-3 text-[#25D366]" />
                          <span>তাকিদা</span>
                        </a>

                        <a
                          href={`tel:${cust.phone}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-blue-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-all"
                        >
                          <IconPhone className="w-3 h-3" />
                          <span>কল</span>
                        </a>
                      </>
                    ) : null}
                  </div>

                  <Link
                    href={`/shop-book/${cust.id}`}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    <span>হিসাব দেখুন</span>
                    <IconChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shop Join QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center"
            >
              <IconX className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <IconQrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">দোকানের কিউআর কোড</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                কাস্টমার এই কোড স্ক্যান করে সরাসরি আপনার দোকানে যুক্ত হতে পারবে।
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `https://onebaki.vercel.app/join?code=${profile?.shop_code}`
                )}`}
                alt="Shop QR"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                দোকান কোড
              </p>
              <p className="text-2xl font-black text-indigo-700 font-display">
                {profile?.shop_code}
              </p>
            </div>
          </div>
        </div>
      )}
    </Guard>
  );
}
