-- RAG — Corpus narratologique Sigma
-- Exécuter une seule fois dans le SQL Editor Supabase

-- 1. Extension pgvector
create extension if not exists vector;

-- 2. Table des chunks
create table if not exists public.narratology_chunks (
  id          uuid primary key default gen_random_uuid(),
  source      text not null,   -- nom du fichier source
  author      text not null,   -- ex: "Robert McKee"
  title       text not null,   -- ex: "Story"
  chunk_index integer not null,
  content     text not null,
  embedding   vector(1536),    -- text-embedding-3-small
  created_at  timestamptz default now()
);

-- 3. Index de recherche vectorielle
create index if not exists narratology_chunks_embedding_idx
on public.narratology_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. RLS — lecture publique (données non-sensibles)
alter table public.narratology_chunks enable row level security;

drop policy if exists "Public read narratology chunks" on public.narratology_chunks;
create policy "Public read narratology chunks"
on public.narratology_chunks for select
to anon, authenticated
using (true);

-- 5. Fonction de recherche par similarité
create or replace function search_narratology(
  query_embedding vector(1536),
  match_count     integer default 5,
  min_similarity  float   default 0.5
)
returns table (
  author     text,
  title      text,
  content    text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    nc.author,
    nc.title,
    nc.content,
    1 - (nc.embedding <=> query_embedding) as similarity
  from public.narratology_chunks nc
  where nc.embedding is not null
    and 1 - (nc.embedding <=> query_embedding) > min_similarity
  order by nc.embedding <=> query_embedding
  limit match_count;
end;
$$;
