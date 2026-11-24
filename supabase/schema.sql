-- ==============================================================================
-- ALL1 Salon Queue — Complete Production Database Schema
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. ENUMS
do $$ begin
  create type token_status as enum ('waiting', 'called', 'in_chair', 'done', 'cancelled', 'no_show');
exception
  when duplicate_object then null;
end $$;

-- 3. TABLES

-- Settings Table (single row id=1)
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  salon_name text default 'ALL1',
  open_time time default '10:00',
  close_time time default '21:00',
  online_tokens_on boolean default true,
  last_token int default 0,
  token_date date default current_date
);

insert into settings (id, salon_name, open_time, close_time, online_tokens_on, last_token, token_date)
values (1, 'ALL1', '10:00', '21:00', true, 0, current_date)
on conflict (id) do nothing;

-- Services Table
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_gu text not null,
  minutes int not null check (minutes > 0),
  price int not null check (price >= 0),
  icon text default 'scissors',
  active boolean default true,
  created_at timestamptz default now()
);

-- Barbers Table
create table if not exists barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  photo_url text,
  email text unique,
  working_today boolean default true,
  on_break boolean default false,
  created_at timestamptz default now()
);

-- Staff Allowlist Table (Google email or demo email + role)
create table if not exists staff (
  email text primary key,
  role text not null check (role in ('owner', 'receptionist', 'barber')),
  created_at timestamptz default now()
);

-- Queue Entries Table
create table if not exists queue_entries (
  id uuid primary key default gen_random_uuid(),
  token_number int not null,
  token_prefix char(1) not null default 'O' check (token_prefix in ('O', 'W')), -- O = Online, W = Walk-in
  token_date date not null default current_date,
  customer_name text not null,
  phone text not null check (phone ~ '^[0-9]{10}$'),
  service_ids uuid[] not null check (array_length(service_ids, 1) between 1 and 4),
  total_minutes int not null check (total_minutes > 0),
  total_price int not null check (total_price >= 0),
  preferred_barber_id uuid references barbers(id),  -- null = any available
  assigned_barber_id uuid references barbers(id),
  status token_status not null default 'waiting',
  late_extension_used boolean not null default false,
  user_id uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  unique (token_date, token_number)
);

-- Unique index to enforce ONE active token per phone number
drop index if exists one_active_token_per_phone;
create unique index one_active_token_per_phone on queue_entries(phone)
  where status in ('waiting', 'called', 'in_chair');

-- Index on join time and status for fast FIFO queue processing
create index if not exists idx_queue_fifo on queue_entries (joined_at asc)
  where status = 'waiting';

-- 4. PUBLIC QUEUE VIEW (Phone numbers are strictly EXCLUDED for privacy)
create or replace view public_queue_entries as
select
  id,
  token_number,
  token_prefix,
  token_date,
  customer_name,
  service_ids,
  total_minutes,
  total_price,
  preferred_barber_id,
  assigned_barber_id,
  status,
  late_extension_used,
  joined_at,
  called_at,
  started_at,
  finished_at
from queue_entries;

-- 5. ROW LEVEL SECURITY (RLS)

alter table settings enable row level security;
alter table services enable row level security;
alter table barbers enable row level security;
alter table staff enable row level security;
alter table queue_entries enable row level security;

-- Helper function: get current authenticated user's staff role
create or replace function get_current_staff_role()
returns text
language sql
stable
security definer
as $$
  select role from staff where lower(email) = lower(coalesce(auth.jwt()->>'email', '')) limit 1;
$$;

-- Helper function: is current user in staff
create or replace function is_staff_member()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from staff where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

-- Policies for settings
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings
  for select using (true);

drop policy if exists "owner update settings" on settings;
create policy "owner update settings" on settings
  for update using (get_current_staff_role() = 'owner');

-- Policies for services
drop policy if exists "public read services" on services;
create policy "public read services" on services
  for select using (true);

drop policy if exists "owner manage services" on services;
create policy "owner manage services" on services
  for all using (get_current_staff_role() = 'owner');

-- Policies for barbers
drop policy if exists "public read barbers" on barbers;
create policy "public read barbers" on barbers
  for select using (true);

drop policy if exists "owner manage barbers" on barbers;
create policy "owner manage barbers" on barbers
  for all using (get_current_staff_role() = 'owner');

drop policy if exists "barber update own status" on barbers;
create policy "barber update own status" on barbers
  for update using (
    lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    or get_current_staff_role() in ('owner', 'receptionist')
  );

-- Policies for staff
drop policy if exists "staff read own record" on staff;
create policy "staff read own record" on staff
  for select using (
    lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    or get_current_staff_role() = 'owner'
  );

drop policy if exists "owner manage staff" on staff;
create policy "owner manage staff" on staff
  for all using (get_current_staff_role() = 'owner');

-- Policies for queue_entries
drop policy if exists "staff full access queue_entries" on queue_entries;
create policy "staff full access queue_entries" on queue_entries
  for all using (is_staff_member());

drop policy if exists "public read queue_entries" on queue_entries;
create policy "public read queue_entries" on queue_entries
  for select using (true);

-- 6. REALTIME REPLICATION
do $$ begin
  alter publication supabase_realtime add table queue_entries, barbers, settings;
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- 7. SECURE DATABASE FUNCTIONS (RPCs — all queue logic centralized here)

-- Helper: daily reset of token counter
create or replace function internal_check_daily_token_reset()
returns int
language plpgsql
security definer
as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_next_token int;
begin
  update settings
  set
    last_token = case when token_date < v_today then 1 else last_token + 1 end,
    token_date = v_today
  where id = 1
  returning last_token into v_next_token;

  return v_next_token;
end;
$$;

-- RPC: Take an Online Token (S2)
create or replace function take_token(
  p_customer_name text,
  p_phone text,
  p_service_ids uuid[],
  p_preferred_barber_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_settings record;
  v_now_time time := (now() at time zone 'Asia/Kolkata')::time;
  v_cutoff_time time;
  v_total_mins int := 0;
  v_total_price int := 0;
  v_next_token int;
  v_new_id uuid;
  v_clean_phone text;
  v_result json;
begin
  -- Clean and sanitize inputs
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  if length(v_clean_phone) != 10 then
    raise exception 'Phone number must be exactly 10 digits';
  end if;

  if trim(p_customer_name) = '' then
    raise exception 'Customer name is required';
  end if;

  -- Verify settings
  select * into v_settings from settings where id = 1;
  if not v_settings.online_tokens_on then
    raise exception 'Online tokens are currently paused. Walk-ins are welcome.';
  end if;

  -- Verify 20-minute online cut-off before closing
  v_cutoff_time := (v_settings.close_time - interval '20 minutes')::time;
  if v_now_time >= v_cutoff_time and v_now_time < v_settings.close_time then
    raise exception 'Online tokens stop 20 minutes before closing (closes at %)', v_settings.close_time;
  end if;

  -- Verify one active token per phone
  if exists (
    select 1 from queue_entries
    where phone = v_clean_phone and status in ('waiting', 'called', 'in_chair')
  ) then
    raise exception 'An active token already exists for this phone number.';
  end if;

  -- Validate service IDs count (1 to 4)
  if array_length(p_service_ids, 1) is null or array_length(p_service_ids, 1) < 1 or array_length(p_service_ids, 1) > 4 then
    raise exception 'You must select between 1 and 4 services.';
  end if;

  -- Validate all selected services exist and are active
  select coalesce(sum(minutes), 0), coalesce(sum(price), 0)
  into v_total_mins, v_total_price
  from services
  where id = any(p_service_ids) and active = true;

  if v_total_mins = 0 then
    raise exception 'Invalid or inactive services selected.';
  end if;

  -- Validate preferred barber if provided
  if p_preferred_barber_id is not null then
    if not exists (select 1 from barbers where id = p_preferred_barber_id and working_today = true) then
      raise exception 'Selected barber is not on duty today.';
    end if;
  end if;

  -- Increment daily counter
  v_next_token := internal_check_daily_token_reset();

  -- Insert token
  insert into queue_entries (
    token_number,
    token_prefix,
    token_date,
    customer_name,
    phone,
    service_ids,
    total_minutes,
    total_price,
    preferred_barber_id,
    status
  ) values (
    v_next_token,
    'O',
    (now() at time zone 'Asia/Kolkata')::date,
    trim(p_customer_name),
    v_clean_phone,
    p_service_ids,
    v_total_mins,
    v_total_price,
    p_preferred_barber_id,
    'waiting'
  )
  returning id into v_new_id;

  select row_to_json(q) into v_result
  from (
    select id, token_number, token_prefix, token_date, customer_name,
           service_ids, total_minutes, total_price, preferred_barber_id, status
    from queue_entries where id = v_new_id
  ) q;

  return v_result;
end;
$$;

-- RPC: Add a Walk-in Token (S4 Reception)
create or replace function add_walkin(
  p_customer_name text,
  p_phone text,
  p_service_ids uuid[],
  p_preferred_barber_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_clean_phone text;
  v_total_mins int := 0;
  v_total_price int := 0;
  v_next_token int;
  v_new_id uuid;
  v_result json;
begin
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  if length(v_clean_phone) != 10 then
    raise exception 'Phone number must be exactly 10 digits';
  end if;

  if trim(p_customer_name) = '' then
    raise exception 'Customer name is required';
  end if;

  -- One active token per phone check
  if exists (
    select 1 from queue_entries
    where phone = v_clean_phone and status in ('waiting', 'called', 'in_chair')
  ) then
    raise exception 'An active token already exists for this phone number.';
  end if;

  -- Service count 1-4
  if array_length(p_service_ids, 1) is null or array_length(p_service_ids, 1) < 1 or array_length(p_service_ids, 1) > 4 then
    raise exception 'You must select between 1 and 4 services.';
  end if;

  select coalesce(sum(minutes), 0), coalesce(sum(price), 0)
  into v_total_mins, v_total_price
  from services
  where id = any(p_service_ids) and active = true;

  if v_total_mins = 0 then
    raise exception 'Invalid or inactive services selected.';
  end if;

  v_next_token := internal_check_daily_token_reset();

  insert into queue_entries (
    token_number,
    token_prefix,
    token_date,
    customer_name,
    phone,
    service_ids,
    total_minutes,
    total_price,
    preferred_barber_id,
    status
  ) values (
    v_next_token,
    'W',
    (now() at time zone 'Asia/Kolkata')::date,
    trim(p_customer_name),
    v_clean_phone,
    p_service_ids,
    v_total_mins,
    v_total_price,
    p_preferred_barber_id,
    'waiting'
  )
  returning id into v_new_id;

  select row_to_json(q) into v_result
  from (
    select id, token_number, token_prefix, token_date, customer_name,
           service_ids, total_minutes, total_price, preferred_barber_id, status
    from queue_entries where id = v_new_id
  ) q;

  return v_result;
end;
$$;

-- RPC: Call Next customer for a specific barber
create or replace function call_next(p_barber_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_token_id uuid;
  v_result json;
begin
  -- Find earliest waiting customer matching this barber preference or 'Any available' (null)
  select id into v_token_id
  from queue_entries
  where status = 'waiting'
    and (preferred_barber_id = p_barber_id or preferred_barber_id is null)
  order by joined_at asc
  limit 1
  for update skip locked;

  if v_token_id is null then
    return null;
  end if;

  update queue_entries
  set
    status = 'called',
    assigned_barber_id = p_barber_id,
    called_at = now()
  where id = v_token_id;

  select row_to_json(q) into v_result
  from (
    select id, token_number, token_prefix, customer_name, assigned_barber_id, status, called_at
    from queue_entries where id = v_token_id
  ) q;

  return v_result;
end;
$$;

-- RPC: Barber Starts Service (S5)
create or replace function start_service(p_token_id uuid, p_barber_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  update queue_entries
  set
    status = 'in_chair',
    assigned_barber_id = p_barber_id,
    started_at = now()
  where id = p_token_id and status = 'called';

  return found;
end;
$$;

-- RPC: Barber Finishes Service (S5)
create or replace function finish_service(p_token_id uuid, p_barber_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  update queue_entries
  set
    status = 'done',
    finished_at = now()
  where id = p_token_id and status = 'in_chair';

  return found;
end;
$$;

-- RPC: Reception marks customer No-Show (S4)
create or replace function mark_no_show(p_token_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  update queue_entries
  set
    status = 'no_show',
    finished_at = now()
  where id = p_token_id and status = 'called';

  return found;
end;
$$;

-- RPC: Customer requests "I'm running late" (+5 min one-time extension) (S3)
create or replace function extend_late(p_token_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_used boolean;
begin
  select late_extension_used into v_used from queue_entries where id = p_token_id;
  if v_used = true then
    raise exception 'Running late extension has already been used for this token';
  end if;

  update queue_entries
  set late_extension_used = true
  where id = p_token_id and status = 'called';

  return found;
end;
$$;

-- RPC: Customer releases their token (S3)
create or replace function release_token(p_token_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  update queue_entries
  set
    status = 'cancelled',
    finished_at = now()
  where id = p_token_id and status = 'waiting';

  return found;
end;
$$;

-- RPC: Find active token by phone (S1 modal & S2 check)
create or replace function find_active_token(p_phone text)
returns json
language plpgsql
security definer
as $$
declare
  v_clean_phone text;
  v_result json;
begin
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  select row_to_json(q) into v_result
  from (
    select id, token_number, token_prefix, token_date, customer_name,
           service_ids, total_minutes, total_price, preferred_barber_id,
           assigned_barber_id, status, late_extension_used, joined_at, called_at
    from queue_entries
    where phone = v_clean_phone and status in ('waiting', 'called', 'in_chair')
    order by joined_at desc
    limit 1
  ) q;

  return v_result;
end;
$$;

-- RPC: Estimate wait minutes
create or replace function estimate_wait(p_barber_id uuid default null)
returns int
language plpgsql
security definer
as $$
declare
  v_working_barbers int;
  v_sum_ahead int := 0;
  v_time_on_chairs int := 0;
  v_estimate int;
begin
  -- Count active working barbers not on break
  select count(*) into v_working_barbers
  from barbers
  where working_today = true and on_break = false;

  if v_working_barbers = 0 then
    return 60;
  end if;

  -- Sum minutes of all waiting customers ahead
  select coalesce(sum(total_minutes), 0) into v_sum_ahead
  from queue_entries
  where status = 'waiting';

  -- Calculate approximate minutes left for customers in chair
  select coalesce(sum(
    greatest(5, total_minutes - extract(epoch from (now() - started_at))/60)::int
  ), 0) into v_time_on_chairs
  from queue_entries
  where status = 'in_chair' and started_at is not null;

  v_estimate := ceil((v_sum_ahead + v_time_on_chairs)::numeric / v_working_barbers);
  return greatest(5, v_estimate);
end;
$$;

-- 8. SEED DATA

-- Insert 5 services
insert into services (name_en, name_gu, minutes, price, icon, active) values
  ('Haircut', 'હેરકટ', 60, 300, 'scissors', true),
  ('Beard trimming', 'દાઢી ટ્રીમિંગ', 40, 400, 'scissors', true),
  ('Facial', 'ફેશિયલ', 45, 750, 'sparkles', true),
  ('Hair wash', 'હેર વોશ', 20, 150, 'droplets', true),
  ('Massage', 'મસાજ', 20, 200, 'hand', true)
on conflict do nothing;

-- Insert 3 barbers
insert into barbers (name, working_today, on_break) values
  ('Mahesh', true, false),
  ('Suresh', true, false),
  ('Ashlesh', true, false)
on conflict (name) do nothing;

-- Insert Demo Staff records (matches VITE_DEMO_* accounts)
insert into staff (email, role) values
  ('reception@all1salon.com', 'receptionist'),
  ('owner@all1salon.com', 'owner'),
  ('barber@all1salon.com', 'barber')
on conflict (email) do update set role = excluded.role;

-- Example Owner Google Email (Replace with your actual Gmail if provided)
-- insert into staff (email, role) values ('your-email@gmail.com', 'owner')
-- on conflict (email) do update set role = excluded.role;
