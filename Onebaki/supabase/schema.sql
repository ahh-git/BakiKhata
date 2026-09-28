-- Onebaki schema. Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text check (role in ('shopkeeper', 'customer')),
  full_name text,
  phone text,
  shop_code text unique,
  shop_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create sequence if not exists public.shop_code_seq start with 1 increment by 1;

create or replace function public.next_shop_code()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.shop_code_seq');
  return lpad(n::text, 4, '0');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.shop_links (
  id uuid primary key default gen_random_uuid(),
  shopkeeper_id uuid not null references public.profiles (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shopkeeper_id, customer_id)
);

create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  shopkeeper_id uuid not null references public.profiles (id),
  customer_id uuid not null references public.profiles (id),
  kind text not null check (kind in ('credit', 'payment')),
  item_name text,
  quantity numeric,
  amount numeric not null check (amount >= 0),
  expression text,
  weekday text,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  kind text,
  related_ledger_id uuid references public.ledger (id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ledger_shop_customer_idx on public.ledger (shopkeeper_id, customer_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists shop_links_customer_idx on public.shop_links (customer_id);

alter table public.profiles enable row level security;
alter table public.shop_links enable row level security;
alter table public.ledger enable row level security;
alter table public.notifications enable row level security;

-- Profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select using (
  auth.uid() = id
  or exists (
    select 1 from public.shop_links sl
    where (sl.shopkeeper_id = auth.uid() and sl.customer_id = profiles.id)
       or (sl.customer_id = auth.uid() and sl.shopkeeper_id = profiles.id)
  )
  or (role = 'shopkeeper' and shop_code is not null)
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
for insert with check (auth.uid() = id);

-- Shop links
drop policy if exists "links_select" on public.shop_links;
create policy "links_select" on public.shop_links
for select using (shopkeeper_id = auth.uid() or customer_id = auth.uid());

drop policy if exists "links_insert_customer" on public.shop_links;
create policy "links_insert_customer" on public.shop_links
for insert with check (customer_id = auth.uid());

-- Ledger: no delete ever
drop policy if exists "ledger_select" on public.ledger;
create policy "ledger_select" on public.ledger
for select using (shopkeeper_id = auth.uid() or customer_id = auth.uid());

drop policy if exists "ledger_insert_credit" on public.ledger;
create policy "ledger_insert_credit" on public.ledger
for insert with check (
  (kind = 'credit' and customer_id = auth.uid() and status = 'confirmed'
    and exists (select 1 from public.shop_links sl where sl.shopkeeper_id = ledger.shopkeeper_id and sl.customer_id = auth.uid()))
  or
  (kind = 'payment' and customer_id = auth.uid() and status = 'pending'
    and exists (select 1 from public.shop_links sl where sl.shopkeeper_id = ledger.shopkeeper_id and sl.customer_id = auth.uid()))
);

revoke update, delete on public.ledger from anon, authenticated;

-- Notifications
drop policy if exists "notif_select" on public.notifications;
create policy "notif_select" on public.notifications
for select using (user_id = auth.uid());

drop policy if exists "notif_update" on public.notifications;
create policy "notif_update" on public.notifications
for update using (user_id = auth.uid());

create or replace function public.on_ledger_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.kind = 'payment' and new.status = 'pending' then
    insert into public.notifications (user_id, title, body, kind, related_ledger_id)
    values (
      new.shopkeeper_id,
      'নতুন পরিশোধের অনুরোধ',
      'একজন কাস্টমার বাকি পরিশোধ করতে চান। কনফার্ম করলে টাকা বিয়োগ হবে।',
      'payment_request',
      new.id
    );
  elsif tg_op = 'INSERT' and new.kind = 'credit' then
    insert into public.notifications (user_id, title, body, kind, related_ledger_id)
    values (
      new.shopkeeper_id,
      'নতুন বাকি যোগ হয়েছে',
      coalesce(new.item_name, 'আইটেম') || ' — ৳' || new.amount::text,
      'credit',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists ledger_notify on public.ledger;
create trigger ledger_notify
after insert on public.ledger
for each row execute function public.on_ledger_change();

create or replace function public.decide_payment(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.ledger;
begin
  select * into rec from public.ledger where id = p_id;
  if rec.id is null then
    raise exception 'not found';
  end if;
  if rec.shopkeeper_id <> auth.uid() then
    raise exception 'not allowed';
  end if;
  if rec.kind <> 'payment' or rec.status <> 'pending' then
    raise exception 'invalid payment';
  end if;
  update public.ledger
    set status = case when p_accept then 'confirmed' else 'rejected' end,
        decided_at = now()
    where id = p_id;

  insert into public.notifications (user_id, title, body, kind, related_ledger_id)
  values (
    rec.customer_id,
    case when p_accept then 'পরিশোধ কনফার্ম হয়েছে' else 'পরিশোধ বাতিল হয়েছে' end,
    case when p_accept then 'দোকানদার আপনার পরিশোধ গ্রহণ করেছেন।' else 'দোকানদার এই পরিশোধ গ্রহণ করেননি। বাকি আগের মতোই আছে।' end,
    case when p_accept then 'payment_ok' else 'payment_no' end,
    rec.id
  );
end;
$$;

create or replace function public.claim_shop_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select shop_code into code from public.profiles where id = auth.uid();
  if code is not null then
    return code;
  end if;
  code := public.next_shop_code();
  update public.profiles
    set shop_code = code, role = 'shopkeeper'
    where id = auth.uid() and shop_code is null;
  select shop_code into code from public.profiles where id = auth.uid();
  return code;
end;
$$;

create or replace function public.balance_for(p_shop uuid, p_customer uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
    case
      when kind = 'credit' and status = 'confirmed' then amount
      when kind = 'payment' and status = 'confirmed' then -amount
      else 0
    end
  ), 0)
  from public.ledger
  where shopkeeper_id = p_shop and customer_id = p_customer;
$$;

grant usage, select on sequence public.shop_code_seq to authenticated;
revoke delete on public.profiles from anon, authenticated;
revoke delete on public.shop_links from anon, authenticated;
revoke delete on public.ledger from anon, authenticated;
revoke delete on public.notifications from anon, authenticated;
grant execute on function public.decide_payment(uuid, boolean) to authenticated;
grant execute on function public.balance_for(uuid, uuid) to authenticated;
grant execute on function public.next_shop_code() to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.ledger;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.shop_links;
  exception when duplicate_object then null;
  end;
end $$;

-- ==============================================================
-- In-App Version Control System
-- ==============================================================
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

alter table public.app_version enable row level security;

drop policy if exists "Allow public read access to app_version" on public.app_version;
create policy "Allow public read access to app_version"
  on public.app_version
  for select
  using (true);
