"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { supabase } from "@/lib/supabase";

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
      <form onSubmit={join} className="glass-card rounded-[28px] p-6">
        <h1 className="text-2xl font-bold">দোকানে জয়েন</h1>
        <p className="muted mt-1">দোকানদারের আইডি লিখুন। শুধু সেই দোকান আপনার বাকি দেখতে পাবে।</p>
        <input className="field mt-5" placeholder="0001" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="primary mt-4">জয়েন করুন</button>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {ok ? <p className="mt-3 text-sm text-emerald-700">{ok}</p> : null}
      </form>
    </Guard>
  );
}
