-- MIGRATION 4: automatic M-Pesa payments. Run ONCE in Supabase SQL Editor, after migration-3.
create table public.mpesa_requests(
  id uuid primary key default gen_random_uuid(),
  checkout_request_id text not null unique,
  merchant_request_id text,
  student_id uuid not null references public.students on delete cascade,
  amount int not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','mismatch')),
  receipt text,
  result_desc text,
  created_at timestamptz default now());
alter table public.mpesa_requests enable row level security;
-- only the server functions write here; students see their own requests, admins see all
create policy mq_read on public.mpesa_requests for select to authenticated
  using (public.is_admin() or public.own_student(student_id));
-- the same M-Pesa receipt can never be recorded twice
create unique index payments_reference_uq on public.payments (upper(reference)) where reference is not null and reference <> '';
