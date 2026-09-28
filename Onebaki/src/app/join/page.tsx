"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { supabase } from "@/lib/supabase";
import { IconStore } from "@/components/Icons";

export default function JoinPage() {
  const { user } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const join = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    const padded = code.trim().padStart(4, "0");
    const { data: shop } = await supabase
      .from("profiles")
      .select("*")
      .eq("shop_code", padded)
      .eq("role", "shopkeeper")
      .maybeSingle();
    if (!shop) {
      setError("এই আইডির কোনো দোকান পাওয়া যায়নি।");
      return;
    }
    const { error: err } = await supabase.from("shop_links").insert({
      shopkeeper_id: shop.id,
      customer_id: user.id,
    });
    if (err && !err.message.includes("duplicate")) {
      setError(err.message);
      return;
    }
    setOk(`${shop.shop_name} এ জয়েন হয়েছেন`);
    router.push(`/history/${shop.id}`);
  };

  return (
    <Guard>
      <div className="space-y-3">
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs transition-all"
        >
          <span>←</span>
          <span>ড্যাশবোর্ডে ফিরুন</span>
        </Link>
        <form onSubmit={join} className="glass-card rounded-[28px] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <IconStore className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">দোকানে জয়েন করুন</h1>
              <p className="text-xs text-slate-500">
                দোকানদারের ৪-সংখ্যার আইডি দিয়ে সরাসরি যুক্ত হোন।
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            দোকানদারের আইডি লিখুন। শুধুমাত্র সেই দোকানদার আপনার বাকি দেখতে পারবেন এবং আপনার হিসাবে
            এন্ট্রি করতে পারবেন।
          </p>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">দোকান আইডি</label>
            <input
              className="field font-display text-2xl font-bold tracking-widest text-center"
              placeholder="0001"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <button className="primary">জয়েন করুন</button>
          {error ? <p className="text-sm font-bold text-rose-600 text-center">{error}</p> : null}
          {ok ? <p className="text-sm font-bold text-emerald-700 text-center">{ok}</p> : null}
        </form>
      </div>
    </Guard>
  );
}
