-- ALL1 Salon Queue — starting schema (run in Supabase SQL editor)
create extension if not exists "pgcrypto";

create table settings (
  id int primary key default 1 check (id = 1),
  salon_name text default 'ALL1',
  open_time time default '10:00',
  close_time time default '21:00',
  online_tokens_on boolean default true,
  last_token int default 0,
  token_date date default current_date
);
insert into settings default values;

create table services (
  id uuid primary key default gen_random_uuid(),
  name_en text not null, name_gu text not null,
  minutes int not null check (minutes > 0),
  price int not null check (price >= 0),
  icon text default 'scissors',
  active boolean default true
);

create table barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, photo_url text, email text unique,
  working_today boolean default true, on_break boolean default false
);

create table staff (
  email text primary key,
  role text not null check (role in ('owner','receptionist','barber'))
);

create type token_status as enum ('waiting','called','in_chair','done','cancelled','no_show');

create table queue_entries (
  id uuid primary key default gen_random_uuid(),
  token_number int not null,
  token_prefix char(1) not null default 'O',       -- O = online, W = walk-in
  token_date date not null default current_date,
  customer_name text not null,
  phone text not null check (phone ~ '^[0-9]{10}$'),
  service_ids uuid[] not null check (array_length(service_ids,1) between 1 and 4),
  total_minutes int not null, total_price int not null,
  preferred_barber_id uuid references barbers(id),  -- null = any available
  assigned_barber_id uuid references barbers(id),
  status token_status not null default 'waiting',
  late_extension_used boolean default false,
  user_id uuid references auth.users(id),
  joined_at timestamptz default now(),
  called_at timestamptz, started_at timestamptz, finished_at timestamptz,
  unique (token_date, token_number)
);
create unique index one_active_token_per_phone on queue_entries(phone)
  where status in ('waiting','called','in_chair');

alter table settings enable row level security;
alter table services enable row level security;
alter table barbers enable row level security;
alter table staff enable row level security;
alter table queue_entries enable row level security;

create policy "public read settings" on settings for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read barbers" on barbers for select using (true);
-- TODO (agent): staff policies via auth.jwt()->>'email' in (select email from staff),
-- public queue view without phone, and the RPC functions listed in docs/05-data-and-auth.md.

alter publication supabase_realtime add table queue_entries, barbers, settings;

insert into services (name_en,name_gu,minutes,price,icon) values
 ('Haircut','હેરકટ',60,300,'scissors'),
 ('Beard trimming','દાઢી ટ્રીમિંગ',40,400,'scissors'),
 ('Facial','ફેશિયલ',45,750,'sparkles'),
 ('Hair wash','હેર વોશ',20,150,'droplets'),
 ('Massage','મસાજ',20,200,'hand');
insert into barbers (name) values ('Mahesh'),('Suresh'),('Ashlesh');
