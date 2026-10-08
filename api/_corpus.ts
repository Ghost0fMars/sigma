// Corpus narratologique stocké localement (remplace la table Supabase narratology_chunks).
//   data/corpus/chunks.json      métadonnées + texte, dans le même ordre que les vecteurs
//   data/corpus/embeddings.f32   vecteurs Float32 concaténés (EMBED_DIM valeurs par chunk), normalisés

import fs from 'fs';
import path from 'path';

export const EMBED_DIM = 1024; // bge-m3 (Albert)

const CORPUS_DIR      = path.join(process.cwd(), 'data', 'corpus');
const CHUNKS_FILE     = path.join(CORPUS_DIR, 'chunks.json');
const EMBEDDINGS_FILE = path.join(CORPUS_DIR, 'embeddings.f32');

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

export function loadCorpus(): LoadedCorpus | null {
  if (cache !== undefined) return cache;
  try {
    const chunks = JSON.parse(fs.readFileSync(CHUNKS_FILE, 'utf-8')) as CorpusChunk[];
    const buffer = fs.readFileSync(EMBEDDINGS_FILE);
    const vectors = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
    if (vectors.length !== chunks.length * EMBED_DIM) throw new Error('Corpus local incohérent');
    cache = { chunks, vectors };
  } catch {
    cache = null;
  }
  return cache;
}

export function writeCorpus(chunks: CorpusChunk[], embeddings: number[][]): void {
  const vectors = new Float32Array(chunks.length * EMBED_DIM);
  embeddings.forEach((embedding, i) => vectors.set(normalize(embedding), i * EMBED_DIM));
  fs.mkdirSync(CORPUS_DIR, { recursive: true });
  fs.writeFileSync(CHUNKS_FILE, JSON.stringify(chunks));
  fs.writeFileSync(EMBEDDINGS_FILE, Buffer.from(vectors.buffer));
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
