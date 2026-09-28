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

-- Insert or update version record for v1.5.0 (Build 6)
delete from public.app_version where version_code = 6;

insert into public.app_version (version_code, version_name, min_supported_version, download_url, release_notes, is_critical)
values (
  6,
  '1.5.0',
  1,
  'https://github.com/ahh-git/BakiKhata/releases/download/v1.5.0/BakiKhata-v1.5.apk',
  '• কার্ড ও বাটনসমূহের বর্ডারে মসৃণ চলমান নিয়ন লেজার লাইট এফেক্ট
• খাতা ট্যাব থেকে কাস্টমারের ব্যক্তিগত খাতা ও বিস্তারিত লেনদেন খতিয়ান
• অ্যাপের ভেতর লাইভ প্রগ্রেস বার সহ সরাসরি APK ডাউনলোডার ও ইনস্টলার
• Google একাউন্টের আসল 4K ক্রিস্টাল ক্লিয়ার প্রোফাইল ছবি সিঙ্ক
• প্রফেশনাল A4 সাইজ ডিজিটাল PDF রসিদ ও লেজার স্টেটমেন্ট তৈরি ও শেয়ার',
  false
);

