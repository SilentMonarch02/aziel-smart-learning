-- MIGRATION 2: student records, payments, attendance, 14-day payment lock, hidden web administrators.
-- Run ONCE in Supabase SQL Editor AFTER schema.sql (safe to run on your live project).

-- 1. students can have a login
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('web_admin','school_admin','teacher','student'));

-- 2. records
create table public.students(
  id uuid primary key default gen_random_uuid(),
  admission_no text not null unique,
  full_name text not null,
  level text not null,
  parent_phone text,
  email text unique check (email is null or email = lower(email)),
  user_id uuid unique references auth.users on delete set null,
  joined_on date not null default current_date,
  last_paid_on date,
  created_at timestamptz default now());
create table public.payments(
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students on delete cascade,
  amount int not null check (amount > 0),
  paid_on date not null default current_date,
  reference text,
  created_by uuid default auth.uid(), created_at timestamptz default now());
create table public.attendance(
  student_id uuid not null references public.students on delete cascade,
  class_date date not null,
  status text not null check (status in ('present','missed')),
  marked_by uuid default auth.uid(),
  primary key (student_id, class_date));

-- 3. helpers (is_staff now means teacher or admin only, never a student)
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce(public.my_role() in ('web_admin','school_admin','teacher'), false) $$;
-- a student may learn only if a payment (or the joining date) is within the last 14 days
create function public.student_ok() returns boolean language sql stable security definer set search_path = public
  as $$ select exists(select 1 from public.students s where s.user_id = auth.uid()
        and current_date <= coalesce(s.last_paid_on, s.joined_on) + 14) $$;
create function public.own_student(sid uuid) returns boolean language sql stable security definer set search_path = public
  as $$ select exists(select 1 from public.students where id = sid and user_id = auth.uid()) $$;

-- a recorded payment updates the student's last paid date
create function public.on_payment() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.students set last_paid_on = greatest(coalesce(last_paid_on, date '1900-01-01'), new.paid_on) where id = new.student_id;
  return new;
end $$;
create trigger payment_recorded after insert on public.payments for each row execute function public.on_payment();

-- claim_invite now also links students to their record
create or replace function public.claim_invite() returns void language plpgsql security definer set search_path = public as $$
declare r text; e text := lower(auth.jwt() ->> 'email');
begin
  if auth.uid() is null then return; end if;
  if not exists(select 1 from public.profiles where id = auth.uid()) then
    select role into r from public.staff_invites where email = e;
    if r is not null then
      insert into public.profiles(id, email, role) values (auth.uid(), e, r);
      delete from public.staff_invites where email = e;
      return;
    end if;
    if exists(select 1 from public.students where email = e and user_id is null) then
      insert into public.profiles(id, email, role) values (auth.uid(), e, 'student');
    end if;
  end if;
  update public.students set user_id = auth.uid()
    where email = e and user_id is null
      and exists(select 1 from public.profiles where id = auth.uid() and role = 'student');
end $$;

alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;

create policy st_read on public.students for select to authenticated using (public.is_staff() or user_id = auth.uid());
create policy st_add on public.students for insert to authenticated with check (public.is_admin());
create policy st_upd on public.students for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy st_del on public.students for delete to authenticated using (public.is_admin());
create policy pay_read on public.payments for select to authenticated using (public.is_admin() or public.own_student(student_id));
create policy pay_add on public.payments for insert to authenticated with check (public.is_admin() and created_by = auth.uid());
create policy pay_del on public.payments for delete to authenticated using (public.is_admin());
create policy at_read on public.attendance for select to authenticated using (public.is_staff() or public.own_student(student_id));
create policy at_add on public.attendance for insert to authenticated with check (public.is_staff());
create policy at_upd on public.attendance for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy at_del on public.attendance for delete to authenticated using (public.is_admin());

-- 4. lessons (class links, notes, videos) are only for staff and students who are paid up
drop policy r_read on public.resources;
create policy r_read on public.resources for select to anon, authenticated
  using (public.is_staff() or (public.site_on() and public.student_ok()));

-- 5. web administrators are invisible to everyone except web administrators
drop policy p_read on public.profiles;
create policy p_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_web_admin() or (public.is_admin() and role <> 'web_admin'));
drop policy p_del on public.profiles;
create policy p_del on public.profiles for delete to authenticated
  using (public.is_web_admin() or (public.my_role() = 'school_admin' and role in ('teacher','student')));
drop policy i_read on public.staff_invites;
create policy i_read on public.staff_invites for select to authenticated
  using (public.is_web_admin() or (public.is_admin() and role <> 'web_admin'));
