import type { KnowledgeChunk, RetrievedContext } from './types';
import { KNOWLEDGE_BASE } from './knowledge-base';

const VOCAB_SIZE = 500;

/** Minimal TF-IDF vectorizer — no external dependencies needed */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function termFreq(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return freq;
}

function idfMap(chunks: readonly { content: string }[]): Map<string, number> {
  const docCount = chunks.length;
  const df = new Map<string, number>();
  for (const chunk of chunks) {
    const uniqueTerms = new Set(tokenize(chunk.content));
    for (const t of uniqueTerms) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, dfVal] of df) {
    idf.set(term, Math.log((docCount + 1) / (dfVal + 1)) + 1);
  }
  return idf;
}

/** Cache for pre-computed document frequency */
let globalIdf: Map<string, number> | null = null;

function getIdf(): Map<string, number> {
  if (!globalIdf) {
    globalIdf = idfMap(KNOWLEDGE_BASE);
  }
  return globalIdf;
}

/** Build a sparse TF-IDF vector as a Map<term, score> */
function tfidfVector(tokens: string[]): Map<string, number> {
  const tf = termFreq(tokens);
  const idf = getIdf();
  const vec = new Map<string, number>();
  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) ?? Math.log(KNOWLEDGE_BASE.length + 1);
    vec.set(term, tfVal * idfVal);
  }
  return vec;
}

export function computeEmbedding(text: string): number[] {
  const vec = tfidfVector(tokenize(text));
  const terms = [...vec.keys()];
  const size = Math.min(terms.length, VOCAB_SIZE);
  const dense = new Array<number>(size).fill(0);
  const norm = Math.sqrt([...vec.values()].reduce((s, v) => s + v * v, 0));
  for (let i = 0; i < size; i++) {
    dense[i] = (vec.get(terms[i]) ?? 0) / (norm || 1);
  }
  return dense;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
}

/** Pre-compute embeddings for all chunks */
export async function buildChunkEmbeddings(chunks: KnowledgeChunk[]): Promise<void> {
  getIdf(); // initialise IDF from full corpus
  for (const chunk of chunks) {
    if (!chunk.embedding) {
      chunk.embedding = computeEmbedding(chunk.content);
    }
  }
}

/** Retrieve top-K chunks above similarity threshold */
export function retrieveRelevantChunks(
  query: string,
  chunks: KnowledgeChunk[],
  topK: number,
  threshold: number
): RetrievedContext[] {
  const queryVec = computeEmbedding(query);
  const scored: RetrievedContext[] = [];
  for (const chunk of chunks) {
    if (!chunk.embedding) continue;
    const score = cosineSimilarity(queryVec, chunk.embedding);
    if (score >= threshold) {
      scored.push({ chunk, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}