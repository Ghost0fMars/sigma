-- Manual approval layer for Sigma users.
-- Run this file once in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own approval status" on public.profiles;
create policy "Users can read their own approval status"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create their own pending profile" on public.profiles;
create policy "Users can create their own pending profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id and approved = false);

-- No update policy is created for normal authenticated users.
-- Approve users from the Supabase dashboard by setting approved = true.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, approved)
  values (new.id, coalesce(new.email, ''), false)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();
