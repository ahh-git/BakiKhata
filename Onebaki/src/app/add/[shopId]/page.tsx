"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AddBakiForm } from "@/components/AddBakiForm";
import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";
import { supabase, type Profile } from "@/lib/supabase";

export default function AddPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const { user, profile } = useSession();
  const [shop, setShop] = useState<Profile | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", shopId)
      .maybeSingle()
      .then(({ data }) => setShop(data as Profile));
  }, [shopId]);

  return (
    <Guard>
      <div className="space-y-3">
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs transition-all"
        >
          <span>←</span>
          <span>ড্যাশবোর্ডে ফিরুন</span>
        </Link>
        {shop && user && profile ? (
          <AddBakiForm
            shop={shop}
            customerId={user.id}
            customerName={profile.full_name || "কাস্টমার"}
          />
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">লোড হচ্ছে...</div>
        )}
      </div>
    </Guard>
  );
}
