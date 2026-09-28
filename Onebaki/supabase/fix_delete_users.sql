-- ==============================================================
-- Run this in Supabase SQL Editor to allow deleting users from Auth / Database
-- ==============================================================

-- 1. Fix Foreign Keys in public.ledger to enable CASCADE DELETE
ALTER TABLE public.ledger 
  DROP CONSTRAINT IF EXISTS ledger_shopkeeper_id_fkey,
  DROP CONSTRAINT IF EXISTS ledger_customer_id_fkey;

ALTER TABLE public.ledger
  ADD CONSTRAINT ledger_shopkeeper_id_fkey 
    FOREIGN KEY (shopkeeper_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  ADD CONSTRAINT ledger_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- 2. Fix Foreign Key in public.notifications to enable CASCADE DELETE
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_related_ledger_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_related_ledger_id_fkey 
    FOREIGN KEY (related_ledger_id) REFERENCES public.ledger (id) ON DELETE CASCADE;

-- 3. (Optional) If you want to wipe all test ledger and profile data right now:
-- TRUNCATE TABLE public.notifications, public.ledger, public.shop_links, public.profiles CASCADE;
