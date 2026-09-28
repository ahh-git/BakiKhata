-- ==============================================================
-- BakiKhata App Version Control System
-- ==============================================================
-- Run this in your Supabase SQL Editor to enable remote version control
-- and in-app update management for BakiKhata Android App.

create table if not exists public.app_version (
  id serial primary key,
  version_code int not null,
  version_name text not null,
  min_supported_version int not null default 1,
  download_url text not null,
  release_notes text,
  is_critical boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.app_version enable row level security;

-- Allow public read access so anyone (authenticated or guest) can check for app updates
drop policy if exists "Allow public read access to app_version" on public.app_version;
create policy "Allow public read access to app_version"
  on public.app_version
  for select
  using (true);

-- Insert or update version record for v1.6.0 (Build 7)
delete from public.app_version where version_code = 7;

insert into public.app_version (version_code, version_name, min_supported_version, download_url, release_notes, is_critical)
values (
  7,
  '1.6.0',
  1,
  'https://github.com/ahh-git/BakiKhata/releases/download/v1.6.0/BakiKhata-v1.6.apk',
  '• ক্লাসিক ফ্রস্টেড গ্লাস হোয়াইট থিম (অপ্রয়োজনীয় নিয়ন এফেক্ট অপসারিত)
• ডার্ক ব্লু স্প্ল্যাশ পেজ অপসারিত — অ্যাপ সাথে সাথে সরাসরি ওপেন হবে
• আপডেট ইনস্টল বাটনের হাই-কন্ট্রাস্ট উজ্জ্বল ভিজিবিলিটি ফিক্স
• কাস্টমার ও দোকানদারের মধ্যে দ্বি-পাক্ষিক এনক্রিপ্টেড ডিজিটাল খাতা সুরক্ষা
• অফিসিয়াল PDF স্টেটমেন্টে অ্যান্টি-ফ্রড ডিজিটাল ভেরিফিকেশন QR কোড ও অডিট সিল',
  false
);

