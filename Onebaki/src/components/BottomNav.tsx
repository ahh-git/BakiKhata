"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/context/SessionProvider";

const customer = [
  { href: "/home", label: "হোম" },
  { href: "/history", label: "হিস্টোরি" },
  { href: "/join", label: "দোকান" },
  { href: "/profile", label: "প্রোফাইল" },
];

const shop = [
  { href: "/home", label: "ড্যাশবোর্ড" },
  { href: "/shop-book", label: "খাতা" },
  { href: "/alerts", label: "অ্যালার্ট" },
  { href: "/profile", label: "প্রোফাইল" },
];

export function BottomNav() {
  const path = usePathname();
  const { profile } = useSession();
  const items = profile?.role === "shopkeeper" ? shop : customer;

  return (
    <nav className="glass-nav">
      {items.map((item) => {
        const active = path === item.href || path.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className={active ? "nav-item active" : "nav-item"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
