/**
 * Script d'indexation du corpus narratologique.
 * Usage : npx tsx scripts/index-corpus.ts
 *
 * Variables requises dans .env.local :
 *   OPENAI_API_KEY
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CORPUS_PATH  (optionnel, défaut ci-dessous)
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const OPENAI_API_KEY       = process.env.OPENAI_API_KEY!;
const SUPABASE_URL         = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CORPUS_PATH          = process.env.CORPUS_PATH
  || 'C:/Users/etien/Documents/SocrateCorpus/Narratologie';

const CHUNK_SIZE    = 1200; // caractères
const CHUNK_OVERLAP = 200;
const EMBED_BATCH   = 50;   // chunks par requête d'embedding
const EMBED_MODEL   = 'text-embedding-3-small';

// ---------- Métadonnées par fichier ----------
function parseMeta(filename: string): { author: string; title: string } {
  const base = filename.replace(/_raw\.txt$/, '').replace(/\.txt$/, '');
  const sep  = base.indexOf(' - ');
  if (sep === -1) return { author: 'Inconnu', title: base };
  return {
    author: base.slice(0, sep).trim(),
    title:  base.slice(sep + 3).trim(),
  };
}

// ---------- Chunking ----------
function chunkText(text: string): string[] {
  // Nettoyage basique
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + CHUNK_SIZE;

    if (end < clean.length) {
      // Cherche la fin du paragraphe la plus proche
      const paragraphEnd = clean.lastIndexOf('\n\n', end);
      if (paragraphEnd > start + CHUNK_SIZE / 2) {
        end = paragraphEnd;
      } else {
        // Sinon fin de phrase
        const sentenceEnd = clean.lastIndexOf('. ', end);
        if (sentenceEnd > start + CHUNK_SIZE / 2) {
          end = sentenceEnd + 1;
        }
      }
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 100) chunks.push(chunk);
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

// ---------- Embeddings OpenAI ----------
async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error: ${err}`);
  }

  const data = await res.json() as { data: { index: number; embedding: number[] }[] };
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}

// ---------- Upsert Supabase ----------
async function upsertChunks(rows: object[]): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/narratology_chunks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert error: ${err}`);
  }
}

// ---------- Suppression des chunks existants d'une source ----------
async function deleteSource(source: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/narratology_chunks?source=eq.${encodeURIComponent(source)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
    },
  });
}

// ---------- Main ----------
async function main() {
  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Variables manquantes : OPENAI_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const files = fs.readdirSync(CORPUS_PATH).filter(f => f.endsWith('.txt'));
  console.log(`\n${files.length} fichiers trouvés dans ${CORPUS_PATH}\n`);

  let totalChunks = 0;

  for (const filename of files) {
    const { author, title } = parseMeta(filename);
    const source = filename;
    const filepath = path.join(CORPUS_PATH, filename);
    const text = fs.readFileSync(filepath, 'utf-8');
    const chunks = chunkText(text);

    console.log(`→ ${author} — ${title}`);
    console.log(`  ${chunks.length} chunks | ${text.length.toLocaleString()} caractères`);

    // Supprime les chunks existants pour ce fichier
    await deleteSource(source);

    // Traite par batchs
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const embeddings = await embedBatch(batch);

      const rows = batch.map((content, j) => ({
        source,
        author,
        title,
        chunk_index: i + j,
        content,
        embedding: JSON.stringify(embeddings[j]),
      }));

      await upsertChunks(rows);

      const pct = Math.round(((i + batch.length) / chunks.length) * 100);
      process.stdout.write(`  [${pct}%] ${i + batch.length}/${chunks.length} chunks indexés\r`);

      // Pause pour respecter les rate limits
      if (i + EMBED_BATCH < chunks.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    totalChunks += chunks.length;
    console.log(`  ✓ indexé\n`);
  }

  console.log(`\nIndexation terminée : ${totalChunks} chunks au total.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
