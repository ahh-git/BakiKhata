"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionProvider";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const { user, profile, refresh } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "shop" | "customer">("choose");
  const [shopName, setShopName] = useState("");
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/");
    else if (profile?.role) router.replace("/home");
  }, [user, profile, router]);

  const asShop = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    const { error: upErr } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: name, phone, shop_name: shopName, role: "shopkeeper" }, { onConflict: "id" });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }
    const { data, error: codeErr } = await supabase.rpc("claim_shop_code");
    if (codeErr) {
      setError(codeErr.message);
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
    router.replace("/home");
    return data;
  };

  const asCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    const { error: upErr } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: name, phone, role: "customer" }, { onConflict: "id" });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }
    await refresh();
    router.replace("/join");
  };

  return (
    <div className="center-screen">
      <div className="glass-card w-full max-w-lg rounded-[28px] p-6 sm:p-8">
        {mode === "choose" ? (
          <>
            <h1 className="text-2xl font-bold">কীভাবে জয়েন করবেন?</h1>
            <p className="mt-2 text-sm text-slate-600">সাইন আপের আগে এই দুটি অপশন থেকে একটি বেছে নিন। পরে আর রোল বদলানো যাবে না।</p>
            <div className="mt-6 grid gap-3">
              <button className="glass-btn rounded-2xl p-5 text-left" onClick={() => setMode("shop")}>
                <p className="text-lg font-bold">দোকানদার হিসেবে জয়েন করুন</p>
                <p className="mt-1 text-sm text-slate-600">আপনার আইডি ০০০১ থেকে শুরু হবে। কাস্টমারদের বাকি দেখুন, পরিশোধ কনফার্ম করুন।</p>
              </button>
              <button className="glass-btn rounded-2xl p-5 text-left" onClick={() => setMode("customer")}>
                <p className="text-lg font-bold">কাস্টমার হিসেবে জয়েন করুন</p>
                <p className="mt-1 text-sm text-slate-600">দোকানের আইডি দিয়ে জয়েন করুন, বাকি লিখুন, WhatsApp-এ পাঠান।</p>
              </button>
            </div>
          </>
        ) : mode === "shop" ? (
          <form onSubmit={asShop} className="grid gap-3">
            <h1 className="text-2xl font-bold">দোকানদার অ্যাকাউন্ট</h1>
            <input className="field" required placeholder="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="field" required placeholder="দোকানের নাম" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            <input className="field" required placeholder="মোবাইল নম্বর (WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="primary mt-2" disabled={busy}>
              {busy ? "খোলা হচ্ছে..." : "দোকান খুলুন"}
            </button>
            <button type="button" className="text-sm text-slate-500" onClick={() => setMode("choose")}>
              পেছনে
            </button>
          </form>
        ) : (
          <form onSubmit={asCustomer} className="grid gap-3">
            <h1 className="text-2xl font-bold">কাস্টমার অ্যাকাউন্ট</h1>
            <input className="field" required placeholder="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="field" required placeholder="মোবাইল নম্বর" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="primary mt-2" disabled={busy}>
              {busy ? "সেভ হচ্ছে..." : "কাস্টমার হিসেবে জয়েন"}
            </button>
            <button type="button" className="text-sm text-slate-500" onClick={() => setMode("choose")}>
              পেছনে
            </button>
          </form>
        )}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
