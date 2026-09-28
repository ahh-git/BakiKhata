"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/context/SessionProvider";
import {
  IconDashboard,
  IconBook,
  IconClock,
  IconUser,
  IconStore,
} from "@/components/Icons";

export function BottomNav() {
  const path = usePathname();
  const { profile } = useSession();

  const isShopkeeper = profile?.role === "shopkeeper";

  const items = isShopkeeper
    ? [
        { href: "/home", label: "ড্যাশবোর্ড", icon: IconDashboard },
        { href: "/shop-book", label: "খাতা", icon: IconBook },
        { href: "/history", label: "হিস্টোরি", icon: IconClock },
        { href: "/profile", label: "প্রোফাইল", icon: IconUser },
      ]
    : [
        { href: "/home", label: "ড্যাশবোর্ড", icon: IconDashboard },
        { href: "/join", label: "দোকান", icon: IconStore },
        { href: "/history", label: "হিস্টোরি", icon: IconClock },
        { href: "/profile", label: "প্রোফাইল", icon: IconUser },
      ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 sm:max-w-md sm:mx-auto z-40 bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl p-1.5 grid grid-cols-4 gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          path === item.href ||
          (item.href !== "/home" && path.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
              active
                ? "bg-indigo-50 text-indigo-700 shadow-xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
