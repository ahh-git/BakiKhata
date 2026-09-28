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
create policy "Allow public read access to app_version"
  on public.app_version
  for select
  using (true);

-- Insert initial version record for v1.2.0 (Build 3)
insert into public.app_version (version_code, version_name, min_supported_version, download_url, release_notes, is_critical)
values (
  3,
  '1.2.0',
  1,
  'https://github.com/YOUR_USERNAME/BakiKhata/releases',
  '• প্রিমিয়াম ফ্লোটিং বটম নেভিগেশন বার\n• বাকি পরিশোধের অনুরোধকারীর নাম ও মোবাইল নম্বর প্রদর্শন\n• নতুন ব্র্যান্ড লোগো ও প্যাকেজ নেম com.bakikhata.app\n• ইন-অ্যাপ ভার্সন কন্ট্রোল ও অটো-আপডেট চেকার',
  false
);
