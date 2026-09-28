"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
      {shop && user && profile ? (
        <AddBakiForm shop={shop} customerId={user.id} customerName={profile.full_name || "কাস্টমার"} />
      ) : (
        <p>লোড হচ্ছে...</p>
      )}
    </Guard>
  );
}
