"use client";

import { Guard } from "@/components/Guard";
import { useSession } from "@/context/SessionProvider";

export default function ProfilePage() {
  const { profile, signOut } = useSession();
  return (
    <Guard>
      <div className="glass-card rounded-[28px] p-6">
        <h1 className="text-2xl font-bold">প্রোফাইল</h1>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="muted">নাম</dt>
            <dd className="font-semibold">{profile?.full_name}</dd>
          </div>
          <div>
            <dt className="muted">রোল</dt>
            <dd className="font-semibold">{profile?.role === "shopkeeper" ? "দোকানদার" : "কাস্টমার"}</dd>
          </div>
          {profile?.shop_code ? (
            <div>
              <dt className="muted">দোকান আইডি</dt>
              <dd className="font-display text-3xl font-bold">{profile.shop_code}</dd>
            </div>
          ) : null}
          <div>
            <dt className="muted">নম্বর</dt>
            <dd className="font-semibold">{profile?.phone || "—"}</dd>
          </div>
        </dl>
        <p className="muted mt-5">ডেটা ডিলিট করা যায় না। খাতা স্থায়ীভাবে সংরক্ষিত থাকে।</p>
        <button className="glass-btn mt-6 w-full rounded-2xl py-3 font-semibold" onClick={signOut}>
          লগ আউট
        </button>
      </div>
    </Guard>
  );
}
