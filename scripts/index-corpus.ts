/**
 * Script d'indexation du corpus narratologique.
 * Usage : npx tsx scripts/index-corpus.ts
 *
 * Écrit le résultat dans data/corpus/ (voir api/_corpus.ts).
 *
 * Variables requises dans .env.local :
 *   ALBERT_API_KEY
 *   CORPUS_PATH  (optionnel, défaut ci-dessous)
 *
 * Si CORPUS_PATH n'existe pas, les textes déjà présents dans data/corpus/chunks.json
 * sont ré-encodés (utile après un changement de modèle d'embedding).
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { writeCorpus, type CorpusChunk } from '../api/_corpus.js';
import { embed } from '../api/_albert.js';

config({ path: '.env.local' });

const ALBERT_API_KEY       = process.env.ALBERT_API_KEY!;
const CORPUS_PATH          = process.env.CORPUS_PATH
  || 'C:/Users/etien/Documents/SocrateCorpus/Narratologie';

const CHUNK_SIZE    = 1200; // caractères
const CHUNK_OVERLAP = 200;
const EMBED_BATCH   = 50;   // chunks par requête d'embedding

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

// ---------- Embeddings Albert ----------
async function embedBatch(texts: string[]): Promise<number[][]> {
  return embed(texts);
}

// ---------- Ré-encodage du corpus existant ----------
async function reembedExisting() {
  const chunksFile = path.join(process.cwd(), 'data', 'corpus', 'chunks.json');
  const chunks = JSON.parse(fs.readFileSync(chunksFile, 'utf-8')) as CorpusChunk[];
  console.log(`
${CORPUS_PATH} introuvable : ré-encodage des ${chunks.length} chunks existants
`);

  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH).map(c => c.content);
    embeddings.push(...await embedBatch(batch));
    process.stdout.write(`  ${i + batch.length}/${chunks.length} chunks encodés
`);
  }

  writeCorpus(chunks, embeddings);
  console.log(`
Ré-encodage terminé : ${chunks.length} chunks écrits dans data/corpus/.`);
}

// ---------- Main ----------
async function main() {
  if (!ALBERT_API_KEY) {
    console.error('Variable manquante : ALBERT_API_KEY');
    process.exit(1);
  }

  if (!fs.existsSync(CORPUS_PATH)) {
    await reembedExisting();
    return;
  }

  const files = fs.readdirSync(CORPUS_PATH).filter(f => f.endsWith('.txt'));
  console.log(`\n${files.length} fichiers trouvés dans ${CORPUS_PATH}\n`);

  // Le corpus est reconstruit entièrement à chaque exécution.
  const allChunks: CorpusChunk[] = [];
  const allEmbeddings: number[][] = [];
  let totalChunks = 0;

  for (const filename of files) {
    const { author, title } = parseMeta(filename);
    const source = filename;
    const filepath = path.join(CORPUS_PATH, filename);
    const text = fs.readFileSync(filepath, 'utf-8');
    const chunks = chunkText(text);

    console.log(`→ ${author} — ${title}`);
    console.log(`  ${chunks.length} chunks | ${text.length.toLocaleString()} caractères`);

    // Traite par batchs
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const embeddings = await embedBatch(batch);

      batch.forEach((content, j) => {
        allChunks.push({ source, author, title, chunk_index: i + j, content });
        allEmbeddings.push(embeddings[j]);
      });

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

  writeCorpus(allChunks, allEmbeddings);
  console.log(`\nIndexation terminée : ${totalChunks} chunks au total, écrits dans data/corpus/.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
