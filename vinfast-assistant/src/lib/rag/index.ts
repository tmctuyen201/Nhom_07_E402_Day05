import type { RAGConfig, RetrievedContext, SynthesisResult } from './types';
import { KNOWLEDGE_BASE } from './knowledge-base';
import { computeEmbedding, cosineSimilarity, buildChunkEmbeddings, retrieveRelevantChunks } from './embeddings';
import { synthesizeAnswer } from './synthesizer';

const DEFAULT_CONFIG: RAGConfig = {
  embeddingModel: 'tfidf-local',
  chatModel: 'gpt-4o-mini',
  topK: 5,
  similarityThreshold: 0.1,
  maxTokens: 800,
};

let embeddingsReady = false;

async function ensureEmbeddingsReady(): Promise<void> {
  if (embeddingsReady) return;
  await buildChunkEmbeddings(KNOWLEDGE_BASE);
  embeddingsReady = true;
}

export async function runRAGPipeline(
  query: string,
  carModel: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  openaiApiKey: string,
  config?: Partial<RAGConfig>
): Promise<SynthesisResult> {
  if (!openaiApiKey?.trim()) {
    throw new Error('OpenAI API key is required. Please provide a valid key.');
  }

  const cfg: RAGConfig = { ...DEFAULT_CONFIG, ...config };
  await ensureEmbeddingsReady();

  const chunks = carModel.toLowerCase() === 'vf9'
    ? KNOWLEDGE_BASE.filter((c) => c.carModel === 'VF9')
    : KNOWLEDGE_BASE;

  const retrieved = retrieveRelevantChunks(query, chunks, cfg.topK, cfg.similarityThreshold);

  return synthesizeAnswer(query, retrieved, carModel, conversationHistory, openaiApiKey);
}

export { KNOWLEDGE_BASE, computeEmbedding, cosineSimilarity, retrieveRelevantChunks };
export type { RetrievedContext, SynthesisResult, RAGConfig } from './types';
