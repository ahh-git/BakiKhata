"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { liveEval, money } from "@/lib/calc";
import { currentWeekday } from "@/lib/format";
import { supabase, type Profile } from "@/lib/supabase";

export default function PayPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const { user } = useSession();
  const [shop, setShop] = useState<Profile | null>(null);
  const [due, setDue] = useState(0);
  const [expr, setExpr] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const amount = useMemo(() => liveEval(expr), [expr]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", shopId).maybeSingle();
      setShop(data as Profile);
      const { data: bal } = await supabase.rpc("balance_for", { p_shop: shopId, p_customer: user.id });
      setDue(Number(bal || 0));
    })();
  }, [shopId, user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || amount == null || amount <= 0) {
      setError("সঠিক টাকা লিখুন");
      return;
    }
    const { error: err } = await supabase.from("ledger").insert({
      shopkeeper_id: shopId,
      customer_id: user.id,
      kind: "payment",
      item_name: "পরিশোধ",
      amount,
      expression: expr,
      weekday: currentWeekday(),
      status: "pending",
    });
    if (err) setError(err.message);
    else setMsg("অনুরোধ পাঠানো হয়েছে। দোকানদার কনফার্ম করার আগে বাকি কমবে না।");
  };

  return (
    <Guard>
      <form onSubmit={submit} className="glass-card rounded-[28px] p-6">
        <h1 className="text-2xl font-bold">বাকি পরিশোধ</h1>
        <p className="muted mt-1">
          {shop?.shop_name} · এখন বাকি ৳{money(due)}
        </p>
        <div className="mt-5 rounded-3xl bg-white/50 p-5 text-center">
          <p className="text-xs text-slate-500">পরিশোধের অঙ্ক</p>
          <p className="live-amount">৳{amount == null ? "—" : money(amount)}</p>
        </div>
        <input className="field mt-4" placeholder="যেমন 100 বা 50+50" value={expr} onChange={(e) => setExpr(e.target.value)} />
        <button className="primary mt-4">দোকানদারকে অনুরোধ পাঠান</button>
        {msg ? <p className="mt-3 text-sm text-emerald-700">{msg}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </form>
    </Guard>
  );
}
