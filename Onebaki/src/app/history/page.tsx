"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { banglaParts } from "@/lib/format";
import { supabase, type LedgerRow, type Profile } from "@/lib/supabase";
import { IconClock, IconShieldCheck, IconStore } from "@/components/Icons";

export default function HistoryPage() {
  const { user, profile } = useSession();
  const [rows, setRows] = useState<(LedgerRow & { customer?: Profile; shop?: Profile })[]>([]);
  const [filter, setFilter] = useState<"all" | "credit" | "payment">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      if (profile.role === "shopkeeper") {
        const { data: ledgerData } = await supabase
          .from("ledger")
          .select("*, customer:profiles!customer_id(*)")
          .eq("shopkeeper_id", profile.id)
          .order("created_at", { ascending: false });

        setRows((ledgerData as any) || []);
      } else {
        const { data: ledgerData } = await supabase
          .from("ledger")
          .select("*, shop:profiles!shopkeeper_id(*)")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        setRows((ledgerData as any) || []);
      }
      setLoading(false);
    })();
  }, [user, profile]);

  const filtered = rows.filter((r) => {
    if (filter === "credit") return r.kind === "credit";
    if (filter === "payment") return r.kind === "payment";
    return true;
  });

  return (
    <Guard>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">হিস্টোরি</h1>
            <p className="text-xs text-slate-500 mt-0.5">সকল লেনদেনের অপরিবর্তনীয় অডিট খতিয়ান</p>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
            অডিট ট্রেইল
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            সব লেনদেন ({rows.length})
          </button>
          <button
            onClick={() => setFilter("credit")}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filter === "credit"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            বাকি ({rows.filter((r) => r.kind === "credit").length})
          </button>
          <button
            onClick={() => setFilter("payment")}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              filter === "payment"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            জমা ({rows.filter((r) => r.kind === "payment").length})
          </button>
        </div>

        {/* History Ledger List */}
        <div className="space-y-2.5 pt-1">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">লোড হচ্ছে...</div>
          ) : !filtered.length ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2 shadow-xs">
              <IconClock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-sm text-slate-800">কোনো হিস্টোরি পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500">
                নতুন কোনো লেনদেন সম্পন্ন হলে তার বিবরণ এখানে দেখা যাবে।
              </p>
            </div>
          ) : (
            filtered.map((r) => {
              const t = banglaParts(r.created_at);
              const auditHash = `#BK-${r.id.substring(0, 5).toUpperCase()}`;
              const isCredit = r.kind === "credit";
              const targetName =
                profile?.role === "shopkeeper"
                  ? r.customer?.full_name || "কাস্টমার"
                  : r.shop?.shop_name || "দোকান";

              return (
                <article
                  key={r.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{targetName}</span>
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {auditHash}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {r.kind === "credit" ? r.item_name || "পণ্য বিক্রয়" : "নগদ পরিশোধ"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {t.date} • {t.hour}:{t.minute} {t.weekday}
                    </p>
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
            })
          )}
        </div>
      </div>
    </Guard>
  );
}
