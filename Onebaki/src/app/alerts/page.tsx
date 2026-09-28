"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { banglaParts } from "@/lib/format";
import { supabase, type NotificationRow } from "@/lib/supabase";

export default function AlertsPage() {
  const { user } = useSession();
  const [rows, setRows] = useState<NotificationRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as NotificationRow[]) || []);
    };
    load();
    const ch = supabase
      .channel("notif")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  return (
    <Guard>
      <h1 className="text-2xl font-bold">নোটিফিকেশন</h1>
      <div className="mt-4 grid gap-3">
        {rows.map((n) => {
          const t = banglaParts(n.created_at);
          return (
            <article key={n.id} className="glass-card rounded-3xl p-4">
              <p className="font-bold">{n.title}</p>
              <p className="mt-1 text-sm text-slate-600">{n.body}</p>
              <p className="muted mt-2">
                {t.date} · {t.weekday} · {t.clock}
              </p>
            </article>
          );
        })}
        {!rows.length ? <p className="muted">এখনো কোনো অ্যালার্ট নেই।</p> : null}
      </div>
    </Guard>
  );
}
