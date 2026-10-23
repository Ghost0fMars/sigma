// Corpus narratologique stocké localement (remplace la table Supabase narratology_chunks).
//   data/corpus/chunks.json      métadonnées + texte, dans le même ordre que les vecteurs
//   data/corpus/embeddings.f32   vecteurs Float32 concaténés (EMBED_DIM valeurs par chunk), normalisés
// Un second dossier frère, corpus-private/ (même format, hors git : ouvrages sous droits), est
// chargé à la suite s'il existe.

import fs from 'fs';
import path from 'path';

export const EMBED_DIM = 1024; // bge-m3 (Albert)

// SIGMA_CORPUS_DIR : défini par l'app Electron (corpus livré dans les ressources).
const corpusDir      = () => process.env.SIGMA_CORPUS_DIR || path.join(process.cwd(), 'data', 'corpus');
const privateDir     = () => path.join(path.dirname(corpusDir()), 'corpus-private');
const chunksFile     = (dir: string) => path.join(dir, 'chunks.json');
const embeddingsFile = (dir: string) => path.join(dir, 'embeddings.f32');

export interface CorpusChunk {
  source: string;
  author: string;
  title: string;
  chunk_index: number;
  content: string;
}

interface LoadedCorpus {
  chunks: CorpusChunk[];
  vectors: Float32Array;
}

let cache: LoadedCorpus | null | undefined;

function normalize(vector: ArrayLike<number>): Float32Array {
  const out = Float32Array.from(vector);
  let norm = 0;
  for (let i = 0; i < out.length; i++) norm += out[i] * out[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

function loadDir(dir: string): LoadedCorpus | null {
  if (!fs.existsSync(chunksFile(dir))) return null;
  const chunks = JSON.parse(fs.readFileSync(chunksFile(dir), 'utf-8')) as CorpusChunk[];
  const buffer = fs.readFileSync(embeddingsFile(dir));
  const vectors = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  if (vectors.length !== chunks.length * EMBED_DIM) throw new Error('Corpus local incohérent');
  return { chunks, vectors };
}

export function loadCorpus(): LoadedCorpus | null {
  if (cache !== undefined) return cache;
  try {
    const parts = [loadDir(corpusDir()), loadDir(privateDir())].filter((p): p is LoadedCorpus => p !== null);
    if (parts.length === 0) throw new Error('Aucun corpus');
    const vectors = new Float32Array(parts.reduce((n, p) => n + p.vectors.length, 0));
    let offset = 0;
    for (const p of parts) { vectors.set(p.vectors, offset); offset += p.vectors.length; }
    cache = { chunks: parts.flatMap((p) => p.chunks), vectors };
  } catch {
    cache = null;
  }
  return cache;
}

// `isPrivate` écrit dans corpus-private/ au lieu de corpus/.
export function writeCorpus(chunks: CorpusChunk[], embeddings: number[][], isPrivate = false): void {
  const dir = isPrivate ? privateDir() : corpusDir();
  const vectors = new Float32Array(chunks.length * EMBED_DIM);
  embeddings.forEach((embedding, i) => vectors.set(normalize(embedding), i * EMBED_DIM));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(chunksFile(dir), JSON.stringify(chunks));
  fs.writeFileSync(embeddingsFile(dir), Buffer.from(vectors.buffer));
  cache = undefined;
}

// Équivalent local de la fonction SQL search_narratology (similarité cosinus).
export function searchCorpus(
  queryEmbedding: number[],
  matchCount = 5,
  minSimilarity = 0.5,
): (CorpusChunk & { similarity: number })[] {
  const corpus = loadCorpus();
  if (!corpus) return [];

  const query = normalize(queryEmbedding);
  const scored: { index: number; similarity: number }[] = [];
  for (let i = 0; i < corpus.chunks.length; i++) {
    const offset = i * EMBED_DIM;
    let dot = 0;
    for (let d = 0; d < EMBED_DIM; d++) dot += corpus.vectors[offset + d] * query[d];
    if (dot > minSimilarity) scored.push({ index: i, similarity: dot });
  }

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount)
    .map(({ index, similarity }) => ({ ...corpus.chunks[index], similarity }));
}
