-- AZIEL SMART LEARNING backend. Run ONCE in Supabase: SQL Editor > New query > paste > Run.

create table public.profiles(
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  role text not null check (role in ('web_admin','school_admin','teacher')),
  created_at timestamptz default now());
create table public.staff_invites(
  email text primary key check (email = lower(email)),
  role text not null check (role in ('web_admin','school_admin','teacher')),
  created_at timestamptz default now());
create table public.site_settings(
  id int primary key default 1 check (id = 1),
  site_enabled boolean not null default true,
  message text default 'The website is temporarily unavailable. Please check back soon.');
insert into public.site_settings(id) values (1);
create table public.posts(
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('announcement','event','timetable','other')),
  title text not null, body text, file_url text,
  created_by uuid default auth.uid(), created_at timestamptz default now());
create table public.resources(
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('note','video','class')),
  subject text, level text, title text not null, when_text text, teacher text,
  url text not null check (url like 'https://%'),
  created_by uuid default auth.uid(), created_at timestamptz default now());

-- role helpers
create function public.my_role() returns text language sql stable security definer set search_path = public
  as $$ select role from public.profiles where id = auth.uid() $$;
create function public.is_staff() returns boolean language sql stable security definer set search_path = public
  as $$ select exists(select 1 from public.profiles where id = auth.uid()) $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce(public.my_role() in ('web_admin','school_admin'), false) $$;
create function public.is_web_admin() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce(public.my_role() = 'web_admin', false) $$;
create function public.site_on() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce((select site_enabled from public.site_settings where id = 1), true) $$;

-- a person who signs up with an invited email receives the invited role
create function public.claim_invite() returns void language plpgsql security definer set search_path = public as $$
declare r text; e text := lower(auth.jwt() ->> 'email');
begin
  if auth.uid() is null or exists(select 1 from public.profiles where id = auth.uid()) then return; end if;
  select role into r from public.staff_invites where email = e;
  if r is not null then
    insert into public.profiles(id, email, role) values (auth.uid(), e, r);
    delete from public.staff_invites where email = e;
  end if;
end $$;

-- there must always be at least one web administrator
create function public.keep_one_web_admin() returns trigger language plpgsql as $$
begin
  if old.role = 'web_admin' and (select count(*) from public.profiles where role = 'web_admin') <= 1 then
    raise exception 'There must be at least one web administrator';
  end if;
  return old;
end $$;
create trigger keep_one before delete on public.profiles for each row execute function public.keep_one_web_admin();

alter table public.profiles enable row level security;
alter table public.staff_invites enable row level security;
alter table public.site_settings enable row level security;
alter table public.posts enable row level security;
alter table public.resources enable row level security;

-- profiles: the school admin can only remove teachers; only the web administrator can remove admins
create policy p_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy p_del on public.profiles for delete to authenticated
  using (public.is_web_admin() or (public.my_role() = 'school_admin' and role = 'teacher'));

-- invites: the school admin can only invite teachers; the web administrator can invite any role
create policy i_read on public.staff_invites for select to authenticated using (public.is_admin());
create policy i_add on public.staff_invites for insert to authenticated
  with check (public.is_web_admin() or (public.my_role() = 'school_admin' and role = 'teacher'));
create policy i_del on public.staff_invites for delete to authenticated
  using (public.is_web_admin() or (public.my_role() = 'school_admin' and role = 'teacher'));

-- shutdown switch: only the web administrator can change it
create policy s_read on public.site_settings for select to anon, authenticated using (true);
create policy s_upd on public.site_settings for update to authenticated
  using (public.is_web_admin()) with check (public.is_web_admin());

-- content: public can read while the site is ON; staff can always read
create policy po_read on public.posts for select to anon, authenticated using (public.site_on() or public.is_staff());
create policy po_ins on public.posts for insert to authenticated with check (public.is_admin() and created_by = auth.uid());
create policy po_del on public.posts for delete to authenticated using (public.is_admin());
create policy r_read on public.resources for select to anon, authenticated using (public.site_on() or public.is_staff());
create policy r_ins on public.resources for insert to authenticated with check (public.is_staff() and created_by = auth.uid());
create policy r_del on public.resources for delete to authenticated using (public.is_admin() or created_by = auth.uid());

-- file storage for notes, videos and attachments
insert into storage.buckets (id, name, public, file_size_limit)
  values ('files', 'files', true, 1073741824)
  on conflict (id) do update set public = true, file_size_limit = 1073741824;
create policy f_read on storage.objects for select to anon, authenticated using (bucket_id = 'files');
create policy f_ins on storage.objects for insert to authenticated with check (bucket_id = 'files' and public.is_staff());
create policy f_del on storage.objects for delete to authenticated using (bucket_id = 'files' and public.is_admin());

-- FIRST WEB ADMINISTRATOR: replace the email, run this line, then open the website,
-- go to Staff > Create account using the same email and a password.
-- insert into public.staff_invites(email, role) values ('your-email@example.com', 'web_admin');
