"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { banglaParts } from "@/lib/format";
import { supabase, type LedgerRow, type Profile } from "@/lib/supabase";

export default function ShopHistory() {
  const { shopId } = useParams<{ shopId: string }>();
  const { user, profile } = useSession();
  const [shop, setShop] = useState<Profile | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [due, setDue] = useState(0);

  useEffect(() => {
    if (!user || !shopId) return;
    const cid = profile?.role === "shopkeeper" ? null : user.id;
    (async () => {
      const { data: shopRow } = await supabase.from("profiles").select("*").eq("id", shopId).maybeSingle();
      setShop(shopRow as Profile);
      let query = supabase.from("ledger").select("*").eq("shopkeeper_id", shopId).order("created_at", { ascending: false });
      if (profile?.role !== "shopkeeper") query = query.eq("customer_id", user.id);
      const { data } = await query;
      setRows((data as LedgerRow[]) || []);
      if (cid) {
        const { data: bal } = await supabase.rpc("balance_for", { p_shop: shopId, p_customer: cid });
        setDue(Number(bal || 0));
      }
    })();
  }, [user, shopId, profile]);

  return (
    <Guard>
      <p className="muted">হিস্টোরি</p>
      <h1 className="text-2xl font-bold">{shop?.shop_name || "দোকান"}</h1>
      <p className="muted">আইডি {shop?.shop_code} · নম্বর {shop?.phone}</p>
      {profile?.role === "customer" ? (
        <div className="glass-card mt-4 rounded-3xl p-5">
          <p className="muted">মোট বাকি</p>
          <p className="text-3xl font-bold">৳{money(due)}</p>
          <Link href={`/add/${shopId}`} className="primary mt-4 inline-block text-center">
            আরও বাকি অ্যাড করুন
          </Link>
        </div>
      ) : null}
      <div className="mt-5 grid gap-3">
        {rows.map((r) => {
          const t = banglaParts(r.created_at);
          return (
            <article key={r.id} className="glass-card rounded-3xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {r.kind === "credit" ? r.item_name || "বাকি" : "পরিশোধ"}
                  </p>
                  <p className="muted">
                    {r.quantity ? `${r.quantity}টি · ` : null}
                    {r.expression ? `হিসাব: ${r.expression}` : null}
                  </p>
                </div>
                <p className={`text-lg font-bold ${r.kind === "payment" ? "text-emerald-700" : ""}`}>
                  {r.kind === "payment" ? "−" : "+"}৳{money(Number(r.amount))}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {t.date} · {t.weekday} · ঘণ্টা {t.hour} · মিনিট {t.minute} · সেকেন্ড {t.second}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {r.status === "pending" ? "দোকানদারের কনফার্মের অপেক্ষায়" : r.status === "rejected" ? "বাতিল" : "নিশ্চিত"}
              </p>
            </article>
          );
        })}
      </div>
    </Guard>
  );
}
