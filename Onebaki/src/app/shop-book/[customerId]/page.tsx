"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { money } from "@/lib/calc";
import { banglaParts } from "@/lib/format";
import { supabase, type LedgerRow, type Profile } from "@/lib/supabase";

export default function CustomerLedger() {
  const { customerId } = useParams<{ customerId: string }>();
  const { profile } = useSession();
  const [person, setPerson] = useState<Profile | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [due, setDue] = useState(0);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", customerId).maybeSingle();
      setPerson(p as Profile);
      const { data } = await supabase
        .from("ledger")
        .select("*")
        .eq("shopkeeper_id", profile.id)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      setRows((data as LedgerRow[]) || []);
      const { data: bal } = await supabase.rpc("balance_for", { p_shop: profile.id, p_customer: customerId });
      setDue(Number(bal || 0));
    })();
  }, [profile, customerId]);

  return (
    <Guard>
      <h1 className="text-2xl font-bold">{person?.full_name}</h1>
      <p className="muted">{person?.phone}</p>
      <div className="glass-card mt-4 rounded-3xl p-5">
        <p className="muted">মোট পাওনা</p>
        <p className="text-3xl font-bold">৳{money(due)}</p>
      </div>
      <div className="mt-4 grid gap-3">
        {rows.map((r) => {
          const t = banglaParts(r.created_at);
          return (
            <article key={r.id} className="glass-card rounded-3xl p-4">
              <div className="flex justify-between">
                <p className="font-bold">{r.kind === "credit" ? r.item_name : "পরিশোধ"}</p>
                <p className="font-bold">
                  {r.kind === "payment" ? "−" : "+"}৳{money(Number(r.amount))}
                </p>
              </div>
              <p className="muted">
                {r.quantity ? `${r.quantity}টি · ` : ""}
                {r.expression || ""}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {t.date} · {t.weekday} · {t.hour} ঘণ্টা {t.minute} মিনিট {t.second} সেকেন্ড
              </p>
              <p className="text-[11px] text-slate-400">{r.status}</p>
            </article>
          );
        })}
      </div>
    </Guard>
  );
}
