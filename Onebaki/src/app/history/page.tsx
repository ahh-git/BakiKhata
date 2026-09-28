"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { supabase, type Profile } from "@/lib/supabase";

export default function HistoryIndex() {
  const { user, profile } = useSession();
  const [shops, setShops] = useState<Profile[]>([]);

  useEffect(() => {
    if (!user || profile?.role !== "customer") return;
    (async () => {
      const { data: links } = await supabase.from("shop_links").select("shopkeeper_id").eq("customer_id", user.id);
      const ids = (links || []).map((l) => l.shopkeeper_id);
      if (!ids.length) return;
      const { data } = await supabase.from("profiles").select("*").in("id", ids);
      setShops((data as Profile[]) || []);
    })();
  }, [user, profile]);

  return (
    <Guard>
      <h1 className="text-2xl font-bold">হিস্টোরি</h1>
      <p className="muted mt-1">একটি দোকানে টিপুন — সব এন্ট্রি, তারিখ, সময় ও আরও বাকি অ্যাড করার অপশন পাবেন।</p>
      <div className="mt-5 grid gap-3">
        {shops.map((s) => (
          <Link key={s.id} href={`/history/${s.id}`} className="glass-card rounded-3xl p-5">
            <p className="text-xs text-slate-500">আইডি {s.shop_code}</p>
            <p className="text-lg font-bold">{s.shop_name}</p>
          </Link>
        ))}
        {!shops.length ? <p className="muted mt-4">আগে একটি দোকানে জয়েন করুন।</p> : null}
      </div>
    </Guard>
  );
}

