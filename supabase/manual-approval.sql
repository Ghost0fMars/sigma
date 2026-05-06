-- Manual approval layer for Sigma users.
-- Run this file once in Supabase SQL Editor.

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text
);

alter table public.user_access enable row level security;

drop policy if exists "Users can read their own access status" on public.user_access;
create policy "Users can read their own access status"
on public.user_access
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own pending access" on public.user_access;
create policy "Users can create their own pending access"
on public.user_access
for insert
to authenticated
with check (auth.uid() = user_id and status = 'pending');

-- No update policy for normal users.
-- Approve users from the Supabase dashboard by setting status = 'approved'.

create or replace function public.handle_new_user_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_access (user_id, email, status)
  values (new.id, coalesce(new.email, ''), 'pending')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_access on auth.users;
create trigger on_auth_user_created_create_access
after insert on auth.users
for each row execute function public.handle_new_user_access();

-- Backfill: insert pending rows for users who registered before this table existed.
insert into public.user_access (user_id, email, status)
select id, coalesce(email, ''), 'pending'
from auth.users
on conflict (user_id) do nothing;
