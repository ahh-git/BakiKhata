"use client";

import { FormEvent, useMemo, useState } from "react";
import { liveEval, money } from "@/lib/calc";
import { banglaParts, currentWeekday, waLink } from "@/lib/format";
import { supabase, type Profile } from "@/lib/supabase";

type Props = {
  shop: Profile;
  customerId: string;
  customerName: string;
};

export function AddBakiForm({ shop, customerId, customerName }: Props) {
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("1");
  const [expr, setExpr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { amount: number; at: string; total: number }>(null);

  const amount = useMemo(() => liveEval(expr), [expr]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (amount == null || amount <= 0) {
      setError("সঠিক টাকার হিসাব লিখুন, যেমন ১০+১০");
      return;
    }
    setBusy(true);
    setError("");
    const { error: insErr } = await supabase.from("ledger").insert({
      shopkeeper_id: shop.id,
      customer_id: customerId,
      kind: "credit",
      item_name: item + (note ? ` (${note})` : ""),
      quantity: liveEval(qty) ?? 1,
      amount,
      expression: expr,
      weekday: currentWeekday(),
      status: "confirmed",
    });
    if (insErr) {
      setError(insErr.message);
      setBusy(false);
      return;
    }
    const { data: total } = await supabase.rpc("balance_for", {
      p_shop: shop.id,
      p_customer: customerId,
    });
    setDone({ amount, at: new Date().toISOString(), total: Number(total || 0) });
    setBusy(false);
  };

  if (done) {
    const t = banglaParts(done.at);
    const text = [
      `আসসালামু আলাইকুম ${shop.shop_name || shop.full_name || "দোকানদার"},`,
      `আমি ${customerName}। এইমাত্র বাকি নিয়েছি।`,
      `কী কিনেছি: ${item || "আইটেম"}`,
      `পরিমাণ: ${qty}`,
      `এই মুহূর্তের বাকি: ৳${money(done.amount)}`,
      `আপনার কাছে আমার মোট বাকি: ৳${money(done.total)}`,
      `সময়: ${t.date}, ${t.weekday}, ${t.clock}`,
    ].join("\n");

    return (
      <div className="glass-card rounded-[28px] p-6">
        <p className="badge">কনফার্মেশন</p>
        <h2 className="mt-3 text-2xl font-bold">বাকি যোগ হয়েছে</h2>
        <p className="mt-2 text-sm text-slate-600">
          {item || "আইটেম"} · ৳{money(done.amount)} · {t.weekday} {t.clock}
        </p>
        <p className="mt-4 text-sm">
          এখন মোট বাকি: <b>৳{money(done.total)}</b>
        </p>
        {shop.phone ? (
          <a className="primary mt-6 inline-block text-center" href={waLink(shop.phone, text)} target="_blank" rel="noreferrer">
            WhatsApp-এ পাঠান
          </a>
        ) : (
          <p className="mt-4 text-sm text-amber-700">দোকানদারের নম্বর নেই, তাই WhatsApp খোলা যাচ্ছে না।</p>
        )}
        <button
          className="mt-3 w-full text-sm text-slate-500"
          onClick={() => {
            setDone(null);
            setItem("");
            setExpr("");
            setNote("");
            setQty("1");
          }}
        >
          আরও বাকি অ্যাড করুন
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-[28px] p-5 sm:p-6">
      <h2 className="text-xl font-bold">বাকি অ্যাড করুন</h2>
      <p className="muted mt-1">{shop.shop_name} · আইডি {shop.shop_code}</p>
      <div className="mt-5 rounded-3xl bg-white/50 p-5 text-center">
        <p className="text-xs text-slate-500">লাইভ টোটাল</p>
        <p className="live-amount">৳{amount == null ? "—" : money(amount)}</p>
      </div>
      <label className="mt-4 block text-xs font-semibold text-slate-500">কী খেয়েছেন / কিনেছেন</label>
      <input className="field mt-1" required value={item} onChange={(e) => setItem(e.target.value)} placeholder="যেমন: চা, বিস্কুট" />
      <label className="mt-4 block text-xs font-semibold text-slate-500">কতগুলো</label>
      <input className="field mt-1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="2 বা 1+1" />
      <label className="mt-4 block text-xs font-semibold text-slate-500">টাকা (১০+১০ লিখলে অটো যোগ হবে)</label>
      <input className="field mt-1" required value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="10+10 বা 50*2" />
      <label className="mt-4 block text-xs font-semibold text-slate-500">নোট (ঐচ্ছিক)</label>
      <input className="field mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="অতিরিক্ত কথা" />
      <button className="primary mt-5" disabled={busy}>
        {busy ? "সেভ হচ্ছে..." : "বাকি লিখুন"}
      </button>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}
