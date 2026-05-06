-- Table de persistance des projets d'écriture.
-- Run this file once in Supabase SQL Editor.

create table if not exists public.projects (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Sans titre',
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'
);

alter table public.projects enable row level security;

drop policy if exists "Users can manage their own projects" on public.projects;
create policy "Users can manage their own projects"
on public.projects
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
