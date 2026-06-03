-- ================================================
-- NutriTrack AI — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- ── Extensions ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  name         text,
  phone        text,
  age          integer,
  gender       text check (gender in ('male','female','other')),
  height       numeric,   -- cm
  weight       numeric,   -- kg
  goal         text check (goal in ('weight_loss','maintenance','muscle_gain')),
  activity_level text check (activity_level in ('sedentary','lightly_active','moderately_active','very_active')),
  onboarding_complete boolean default false,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

-- No INSERT policy needed — profile is created by trigger on auth.users
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ── Trigger: auto-create profile on signup ─────────
-- Runs as postgres (SECURITY DEFINER) so it bypasses RLS.
-- metadata passed from frontend via supabase.auth.signUp options.data
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, name, phone, onboarding_complete)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop and recreate to avoid duplicate trigger errors
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Trigger: auto-confirm email on signup ──────────
-- Bypasses Supabase email confirmation by auto-confirming email address on insert.
create or replace function public.auto_confirm_email()
returns trigger
language plpgsql
security definer
as $$
begin
  new.email_confirmed_at = coalesce(new.email_confirmed_at, now());
  new.confirmed_at = coalesce(new.confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_confirm on auth.users;

create trigger on_auth_user_created_confirm
  before insert on auth.users
  for each row
  execute procedure public.auto_confirm_email();


-- ── nutrition_goals ────────────────────────────────
create table if not exists public.nutrition_goals (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  calories     integer not null default 2000,
  protein      integer not null default 150,
  carbs        integer not null default 250,
  fat          integer not null default 65,
  water_target integer not null default 2500, -- ml
  updated_at   timestamptz default now(),
  unique(user_id)
);

alter table public.nutrition_goals enable row level security;

create policy "Users can manage own goals"
  on public.nutrition_goals for all using (auth.uid() = user_id);

-- ── meals ──────────────────────────────────────────
create table if not exists public.meals (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  meal_type    text check (meal_type in ('breakfast','lunch','dinner','snacks')),
  raw_input    text,
  calories     integer default 0,
  protein      numeric default 0,
  carbs        numeric default 0,
  fat          numeric default 0,
  confidence   integer default 0,
  timestamp    timestamptz default now()
);

alter table public.meals enable row level security;

create policy "Users can manage own meals"
  on public.meals for all using (auth.uid() = user_id);

-- ── meal_items ─────────────────────────────────────
create table if not exists public.meal_items (
  id           uuid primary key default uuid_generate_v4(),
  meal_id      uuid references public.meals(id) on delete cascade,
  food_name    text not null,
  quantity     numeric default 1,
  calories     integer default 0,
  protein      numeric default 0,
  carbs        numeric default 0,
  fat          numeric default 0
);

alter table public.meal_items enable row level security;

create policy "Users can manage own meal items"
  on public.meal_items for all
  using (
    meal_id in (
      select id from public.meals where user_id = auth.uid()
    )
  );

-- ── water_logs ─────────────────────────────────────
create table if not exists public.water_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  amount_ml    integer not null,
  timestamp    timestamptz default now()
);

alter table public.water_logs enable row level security;

create policy "Users can manage own water logs"
  on public.water_logs for all using (auth.uid() = user_id);

-- ── daily_insights ─────────────────────────────────
create table if not exists public.daily_insights (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade,
  insight_date      date not null,
  summary           text,
  protein_analysis  text,
  water_analysis    text,
  recommendations   text,
  created_at        timestamptz default now(),
  unique(user_id, insight_date)
);

alter table public.daily_insights enable row level security;

create policy "Users can manage own insights"
  on public.daily_insights for all using (auth.uid() = user_id);

-- ── Helper: get phone for username (for forgot-password) ──
-- This function is accessible to anon so the forgot-password
-- flow can verify a phone without requiring auth.
create or replace function public.get_phone_by_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select phone from public.profiles where username = p_username limit 1;
$$;

-- Allow anon to call this function
grant execute on function public.get_phone_by_username(text) to anon, authenticated;

-- ── Helper: get user_id by username (for forgot-password) ──
create or replace function public.get_userid_by_username(p_username text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.profiles where username = p_username limit 1;
$$;

grant execute on function public.get_userid_by_username(text) to anon, authenticated;


-- ── Helper: reset password using phone verification ──
create or replace function public.reset_password_by_username_and_phone(
  p_username text,
  p_phone text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_hash text;
  v_stored_phone text;
begin
  -- 1. Normalize input phone (strip space, dash, plus)
  p_phone := regexp_replace(p_phone, '[\s\-+]', '', 'g');

  -- 2. Fetch user ID and phone from profiles
  select id, phone into v_user_id, v_stored_phone 
  from public.profiles 
  where username = p_username;

  if v_user_id is null or v_stored_phone is null then
    return false;
  end if;

  -- 3. Normalize stored phone and compare
  v_stored_phone := regexp_replace(v_stored_phone, '[\s\-+]', '', 'g');
  if v_stored_phone != p_phone then
    return false;
  end if;

  -- 4. Generate bcrypt hash
  begin
    v_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));
  exception when others then
    begin
      v_hash := crypt(p_new_password, gen_salt('bf', 10));
    exception when others then
      v_hash := public.crypt(p_new_password, public.gen_salt('bf', 10));
    end;
  end;

  -- 5. Update auth.users password
  update auth.users
  set encrypted_password = v_hash,
      updated_at = now()
  where id = v_user_id;

  return true;
end;
$$;

grant execute on function public.reset_password_by_username_and_phone(text, text, text) to anon, authenticated;
