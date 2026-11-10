-- MIGRATION 3: public registrations (Ksh 200 registration fee + chosen services).
-- Run ONCE in Supabase SQL Editor, after migration-2.

create table public.registrations(
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 20),
  email text check (email is null or char_length(email) <= 120),
  date_of_birth date,
  gender text check (gender is null or char_length(gender) <= 20),
  services text[] not null check (
    cardinality(services) between 1 and 8 and
    services <@ array['High school students','Adult learning','Reproductive health',
      'Mental health care and substance abuse','Goal setting','Self awareness and skills',
      'Academic motivation','Professional short courses']::text[]),
  level text check (level is null or char_length(level) <= 20),
  guardian text check (guardian is null or char_length(guardian) <= 120),
  notes text check (notes is null or char_length(notes) <= 500),
  fee_paid boolean not null default false,
  created_at timestamptz default now());

alter table public.registrations enable row level security;

-- anyone can register; only admins can read, update or remove registrations
create policy rg_add on public.registrations for insert to anon, authenticated with check (fee_paid = false);
create policy rg_read on public.registrations for select to authenticated using (public.is_admin());
create policy rg_upd on public.registrations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy rg_del on public.registrations for delete to authenticated using (public.is_admin());
