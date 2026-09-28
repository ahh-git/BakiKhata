"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { supabase, type Profile } from "@/lib/supabase";
import {
  IconSearch,
  IconWhatsApp,
  IconPhone,
  IconChevronRight,
  IconBook,
  IconPlus,
} from "@/components/Icons";

type Row = { customer: Profile; due: number };

export default function ShopBook() {
  const { profile } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "due" | "clear">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: links } = await supabase
        .from("shop_links")
        .select("customer_id")
        .eq("shopkeeper_id", profile.id);
      const ids = (links || []).map((l) => l.customer_id);
      if (!ids.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data: people } = await supabase.from("profiles").select("*").in("id", ids);
      const out: Row[] = [];
      for (const customer of (people || []) as Profile[]) {
        const { data } = await supabase.rpc("balance_for", {
          p_shop: profile.id,
          p_customer: customer.id,
        });
        out.push({ customer, due: Number(data || 0) });
      }
      setRows(out.sort((a, b) => b.due - a.due));
      setLoading(false);
    })();
  }, [profile]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const nameMatch = r.customer.full_name?.toLowerCase().includes(q) || false;
    const phoneMatch = r.customer.phone?.includes(q) || false;
    if (!nameMatch && !phoneMatch) return false;
    if (filter === "due") return r.due > 0;
    if (filter === "clear") return r.due === 0;
    return true;
  });

  return (
    <Guard>
      <div className="space-y-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">খাতা</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            আপনার দোকানের সকল কাস্টমার ও বাকি হিসাব
          </p>
        </div>

        {/* Search Field */}
        <div className="relative">
          <input
            type="text"
            placeholder="কাস্টমারের নাম বা ফোন নম্বর খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 outline-none focus:border-indigo-500 shadow-xs transition-all placeholder:text-slate-400"
          />
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Filter Chips Row */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            সবাই ({rows.length})
          </button>
          <button
            onClick={() => setFilter("due")}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filter === "due"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            বাকি আছে ({rows.filter((r) => r.due > 0).length})
          </button>
          <button
            onClick={() => setFilter("clear")}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filter === "clear"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            বাকি নেই ({rows.filter((r) => r.due === 0).length})
          </button>
        </div>

        {/* Customer Cards List */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">লোড হচ্ছে...</div>
          ) : !filtered.length ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2 shadow-xs">
              <IconBook className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-sm text-slate-800">কোনো কাস্টমার পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500">
                নতুন কাস্টমারকে আপনার দোকান কোড <strong>{profile?.shop_code}</strong> দিয়ে জয়েন
                করতে বলুন।
              </p>
            </div>
          ) : (
            filtered.map(({ customer, due }) => (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-indigo-200 transition-all"
              >
                {/* Top Row: Avatar + Name/Phone + Due Badge */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/shop-book/${customer.id}`}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-base flex items-center justify-center">
                      {customer.full_name?.charAt(0) || "ক"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{customer.full_name}</p>
                      <p className="text-xs text-slate-500">{customer.phone || "ফোন নম্বর নেই"}</p>
                    </div>
                  </Link>

                  <div
                    className={`text-center px-3.5 py-1.5 rounded-xl border ${
                      due > 0
                        ? "bg-rose-50 border-rose-100 text-rose-700"
                        : "bg-emerald-50 border-emerald-100 text-emerald-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold block leading-tight">
                      {due > 0 ? "মোট বাকি" : "পরিশোধিত"}
                    </span>
                    <span className="text-sm font-extrabold font-display">৳{money(due)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-slate-100 my-3" />

                {/* Action Strip: WhatsApp + Call + View Ledger Link */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {customer.phone ? (
                      <>
                        <a
                          href={`https://wa.me/88${customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `আসসালামু আলাইকুম ${customer.full_name}, ${profile?.shop_name || "দোকানে"} আপনার বর্তমান বাকি হিসাব ৳${money(due)}। ধন্যবাদ।`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-all"
                        >
                          <IconWhatsApp className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>তাকিদা</span>
                        </a>

                        <a
                          href={`tel:${customer.phone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-600 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all"
                        >
                          <IconPhone className="w-3.5 h-3.5" />
                          <span>কল</span>
                        </a>
                      </>
                    ) : null}
                  </div>

                  <Link
                    href={`/shop-book/${customer.id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    <span>হিসাব দেখুন</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Guard>
  );
}
