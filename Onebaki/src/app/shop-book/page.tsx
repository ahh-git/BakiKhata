"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { supabase, type Profile } from "@/lib/supabase";

type Row = { customer: Profile; due: number };

export default function ShopBook() {
  const { profile } = useSession();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: links } = await supabase.from("shop_links").select("customer_id").eq("shopkeeper_id", profile.id);
      const ids = (links || []).map((l) => l.customer_id);
      if (!ids.length) return;
      const { data: people } = await supabase.from("profiles").select("*").in("id", ids);
      const out: Row[] = [];
      for (const customer of (people || []) as Profile[]) {
        const { data } = await supabase.rpc("balance_for", { p_shop: profile.id, p_customer: customer.id });
        out.push({ customer, due: Number(data || 0) });
      }
      setRows(out.sort((a, b) => b.due - a.due));
    })();
  }, [profile]);

  return (
    <Guard>
      <h1 className="text-2xl font-bold">খাতা</h1>
      <p className="muted">শুধু আপনার কাস্টমাররা। অন্য দোকানের হিসাব এখানে আসে না।</p>
      <div className="mt-4 grid gap-3">
        {rows.map(({ customer, due }) => (
          <Link key={customer.id} href={`/shop-book/${customer.id}`} className="glass-card rounded-3xl p-5">
            <p className="font-bold">{customer.full_name}</p>
            <p className="muted">{customer.phone}</p>
            <p className="mt-2 text-2xl font-bold">৳{money(due)}</p>
          </Link>
        ))}
        {!rows.length ? <p className="muted mt-4">এখনো কোনো কাস্টমার জয়েন করেননি।</p> : null}
      </div>
    </Guard>
  );
}
