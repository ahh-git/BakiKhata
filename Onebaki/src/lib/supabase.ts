import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Role = "shopkeeper" | "customer";

export type Profile = {
  id: string;
  role: Role | null;
  full_name: string | null;
  phone: string | null;
  shop_code: string | null;
  shop_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type LedgerRow = {
  id: string;
  shopkeeper_id: string;
  customer_id: string;
  kind: "credit" | "payment";
  item_name: string | null;
  quantity: number | null;
  amount: number;
  expression: string | null;
  weekday: string | null;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
  decided_at: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  kind: string | null;
  related_ledger_id: string | null;
  read_at: string | null;
  created_at: string;
};
