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

-- Insert or update initial version record for v1.3.0 (Build 4)
delete from public.app_version where version_code = 4;

insert into public.app_version (version_code, version_name, min_supported_version, download_url, release_notes, is_critical)
values (
  4,
  '1.3.0',
  1,
  'https://github.com/ahh-git/BakiKhata/releases/download/v1.3.0/BakiKhata-v1.3.apk',
  '• প্রোফাইল ছবি আপডেট ও গ্যালারি থেকে ছবি আপলোড
• Google / Gmail একাউন্টের ছবি অটো-ডিটেকশন
• নির্ভুল WhatsApp ডিরেক্ট মেসেজিং (বাংলাদেশ কান্ট্রি কোড সহ ফিক্স)
• কাস্টমারদের জন্য স্মার্ট তাগাদা অপশন (নম্র, জরুরি ও হিসাবের বিবরণ)
• অ্যাপ লক ও ৪ সংখ্যার গোপন PIN নিরাপত্তা
• ডিজিটাল খাতা স্টেটমেন্ট শেয়ার',
  false
);
