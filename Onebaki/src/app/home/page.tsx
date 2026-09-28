"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { supabase, type Profile } from "@/lib/supabase";

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

function CustomerHome({ userId }: { userId?: string }) {
  const [rows, setRows] = useState<ShopCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: links } = await supabase.from("shop_links").select("shopkeeper_id").eq("customer_id", userId);
      const ids = (links || []).map((l) => l.shopkeeper_id);
      if (!ids.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data: shops } = await supabase.from("profiles").select("*").in("id", ids);
      const cards: ShopCard[] = [];
      for (const shop of (shops || []) as Profile[]) {
        const { data: due } = await supabase.rpc("balance_for", { p_shop: shop.id, p_customer: userId });
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

  return (
    <Guard>
      <h1 className="text-2xl font-bold">আমার বাকি</h1>
      <p className="muted mt-1">শুধু যে দোকানে আপনি জয়েন করেছেন, সেই হিসাবই দেখাবে।</p>
      {loading ? <p className="mt-6 text-sm">লোড হচ্ছে...</p> : null}
      {!loading && !rows.length ? (
        <div className="glass-card mt-6 rounded-3xl p-6">
          <p className="font-semibold">এখনো কোনো দোকান নেই</p>
          <p className="mt-2 text-sm text-slate-600">দোকানদারের আইডি (যেমন 0001) দিয়ে জয়েন করুন।</p>
          <Link href="/join" className="primary mt-4 inline-block text-center">
            দোকানে জয়েন করুন
          </Link>
        </div>
      ) : null}
      <div className="grid-cards mt-5">
        {rows.map(({ shop, due, pending }) => (
          <div key={shop.id} className="glass-card rounded-3xl p-5">
            <p className="text-xs text-slate-500">আইডি {shop.shop_code}</p>
            <h2 className="text-lg font-bold">{shop.shop_name}</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight">৳{money(due)}</p>
            {pending > 0 ? <p className="mt-1 text-xs text-amber-700">কনফার্মের অপেক্ষায় ৳{money(pending)}</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link className="glass-btn rounded-2xl py-3 text-center text-sm font-semibold" href={`/history/${shop.id}`}>
                হিস্টোরি
              </Link>
              <Link className="primary !w-auto rounded-2xl py-3 text-center text-sm" href={`/add/${shop.id}`}>
                বাকি অ্যাড
              </Link>
            </div>
            <Link className="mt-2 block text-center text-xs text-slate-500" href={`/pay/${shop.id}`}>
              পরিশোধের অনুরোধ
            </Link>
          </div>
        ))}
      </div>
    </Guard>
  );
}

function ShopHome() {
  const { profile } = useSession();
  const [stats, setStats] = useState({ customers: 0, due: 0, pending: 0 });
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: links } = await supabase.from("shop_links").select("customer_id").eq("shopkeeper_id", profile.id);
      const customers = links?.length || 0;
      let due = 0;
      for (const l of links || []) {
        const { data } = await supabase.rpc("balance_for", { p_shop: profile.id, p_customer: l.customer_id });
        due += Number(data || 0);
      }
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

  return (
    <Guard>
      <h1 className="text-2xl font-bold">দোকানের ড্যাশবোর্ড</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-3xl p-5">
          <p className="muted">মোট পাওনা</p>
          <p className="mt-2 text-3xl font-bold">৳{money(stats.due)}</p>
        </div>
        <div className="glass-card rounded-3xl p-5">
          <p className="muted">কাস্টমার</p>
          <p className="mt-2 text-3xl font-bold">{stats.customers}</p>
        </div>
        <div className="glass-card rounded-3xl p-5">
          <p className="muted">অপেক্ষমাণ পরিশোধ</p>
          <p className="mt-2 text-3xl font-bold">৳{money(stats.pending)}</p>
        </div>
      </div>
      <div className="glass-card mt-5 rounded-3xl p-5">
        <p className="font-semibold">আপনার আইডি</p>
        <p className="mt-1 font-display text-4xl font-bold tracking-tight">{profile?.shop_code}</p>
        <p className="muted mt-2">কাস্টমারদের এই আইডি দিন। নম্বর: {profile?.phone}</p>
      </div>
      <h2 className="mt-6 text-lg font-bold">কনফার্মের অপেক্ষায়</h2>
      <div className="mt-3 grid gap-3">
        {pending.length === 0 ? <p className="muted">কোনো নতুন অনুরোধ নেই।</p> : null}
        {pending.map((p) => (
          <div key={p.id} className="glass-card rounded-3xl p-4">
            <p className="font-semibold">৳{money(Number(p.amount))}</p>
            <p className="muted">কনফার্ম করার আগে খাতা থেকে টাকা যাবে না</p>
            <div className="mt-3 flex gap-2">
              <button className="primary !w-auto rounded-2xl px-4 py-2 text-sm" onClick={() => decide(p.id, true)}>
                কনফার্ম
              </button>
              <button className="glass-btn rounded-2xl px-4 py-2 text-sm" onClick={() => decide(p.id, false)}>
                বাতিল
              </button>
            </div>
          </div>
        ))}
      </div>
    </Guard>
  );
}
