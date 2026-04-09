/**
 * RAG Pipeline Types
 *
 * Core TypeScript types for the VinFast Car Assistant RAG pipeline.
 * Shared between retrieval, synthesis, and agent systems.
 */

export type ChunkCategory =
  | 'operation'
  | 'warning'
  | 'specification'
  | 'maintenance'
  | 'adas'
  | 'charging'
  | 'safety';

/** A single chunk of knowledge extracted from VinFast documentation */
export interface KnowledgeChunk {
  id: string;
  pageNumber: number;
  chapter: string;
  section: string;
  content: string;
  carModel: string;
  category: ChunkCategory;
  /** Pre-computed embedding vector; populated at startup */
  embedding?: number[];
}

/** A retrieved chunk paired with its relevance score */
export interface RetrievedContext {
  chunk: KnowledgeChunk;
  score: number;
}

/** Configuration options for the RAG pipeline */
export interface RAGConfig {
  embeddingModel: string;
  chatModel: string;
  /** Number of top-K chunks to retrieve */
  topK: number;
  /** Minimum cosine similarity score to accept a chunk */
  similarityThreshold: number;
  /** Maximum tokens to send to the chat model */
  maxTokens: number;
}

/** Result of the answer synthesis step */
export interface SynthesisResult {
  /** Human-readable answer */
  answer: string;
  /** Citable source references */
  sources: Array<{
    pageNumber: number;
    chapter: string;
    section: string;
    excerpt: string;
  }>;
  /** 0-1 confidence score based on context relevance */
  confidence: number;
  carModel: string;
  /** Detected category of the query */
  category?: string;
}
