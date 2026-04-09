/**
 * Retrieval Agent: manages the RAG retrieval process
 *
 * Responsibilities:
 *   - Analyzes incoming query to determine its category
 *   - Reformulates the query for better retrieval
 *   - Chooses the optimal retrieval strategy (keyword / semantic / hybrid)
 *   - Returns enhanced context with query analysis metadata
 */

import type { RetrievedContext } from '../rag/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RetrievalStrategy = 'keyword' | 'semantic' | 'hybrid';

export interface RetrievalResult {
  contexts: RetrievedContext[];
  queryAnalysis: {
    category: string;
    detectedEntities: string[];
    reformulatedQuery: string;
  };
  retrievalStrategy: RetrievalStrategy;
}

// ---------------------------------------------------------------------------
// Query Category Detection
// ---------------------------------------------------------------------------

interface CategoryMatch {
  category: string;
  keywords: string[];
}

const QUERY_CATEGORIES: CategoryMatch[] = [
  {
    category: 'ADAS',
    keywords: [
      'adas', 'lane keep', 'lane assist', 'lane departure', 'blind spot',
      'collision warning', 'forward collision', 'rear cross traffic', 'rcta',
      'adaptive cruise', 'cruise control', 'traffic jam assist', 'auto emergency',
      'aeb', 'ldw', 'lka', 'bsi', 'fcw',
    ],
  },
  {
    category: 'Charging',
    keywords: [
      'charging', 'charge', 'battery', 'range', 'dc fast', 'ac charging',
      'level 1', 'level 2', 'level 3', 'home charger', 'public charger',
      'charging station', 'charging time', 'battery degradation', 'battery health',
      'state of charge', 'soc', 'evse', 'charger', 'plug', 'charging cable',
    ],
  },
  {
    category: 'Warning Lights',
    keywords: [
      'warning light', 'warning', 'dashboard', 'indicator', 'check engine',
      'tire pressure', 'tpms', 'abs', 'airbag', 'brake', 'battery light',
      'temperature', 'overheating', 'oil pressure', 'engine light', 'malfunction',
      'service light', 'MIL', 'OBD',
    ],
  },
  {
    category: 'Infotainment',
    keywords: [
      'infotainment', 'screen', 'display', 'navigation', 'map', 'apple carplay',
      'android auto', 'bluetooth', 'wifi', 'hotspot', 'speaker', 'sound', 'audio',
      'voice assistant', 'OTA', 'update', 'software update', 'VF Connect',
      'VF Smart', 'app', 'mobile app', 'remote control', 'climate', 'AC', 'heater',
    ],
  },
  {
    category: 'Maintenance',
    keywords: [
      'maintenance', 'service', 'repair', 'oil', 'tire', 'brake pad', 'filter',
      'wiper', 'alignment', 'inspection', 'warranty', 'recalls', 'service center',
      'service schedule', 'periodic maintenance', 'parts', 'consumable',
    ],
  },
  {
    category: 'Vehicle Operation',
    keywords: [
      'start', 'stop', 'drive', 'park', 'reverse', 'gear', 'pedal', 'seat',
      'mirror', 'window', 'sunroof', 'door', 'trunk', 'hood', 'ignition',
      'keyless', 'smart key', 'push start', 'sport mode', 'eco mode', 'snow mode',
      'regenerative', 'braking', 'range mode',
    ],
  },
  {
    category: 'Specifications',
    keywords: [
      'spec', 'specification', 'dimension', 'weight', 'motor', 'engine', 'power',
      'torque', 'top speed', 'acceleration', '0-100', 'range', 'battery capacity',
      'charging time', 'cargo', 'seating', 'ground clearance', 'turning radius',
    ],
  },
  {
    category: 'Safety Systems',
    keywords: [
      'airbag', 'seatbelt', 'ABS', 'ESC', 'traction control', 'brake assist',
      'hill assist', 'hill start', 'downhill', 'child seat', 'ISOFIX', 'crash',
      'safety rating', 'NCAP', 'collision', 'emergency',
    ],
  },
];

function classifyQuery(query: string): { category: string; confidence: number } {
  const lower = query.toLowerCase();
  let bestCategory = 'General';
  let bestScore = 0;

  for (const { category, keywords } of QUERY_CATEGORIES) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return {
    category: bestScore > 0 ? bestCategory : 'General',
    confidence: bestScore > 0 ? Math.min(1, bestScore / 3) : 0,
  };
}

// ---------------------------------------------------------------------------
// Entity Extraction
// ---------------------------------------------------------------------------

const ENTITY_PATTERNS = [
  { pattern: /\b(VF[- ]?\d+)\b/gi,                                    label: 'carModel' },
  { pattern: /\b(VF\s*e\d+)\b/gi,                                     label: 'carModel' },
  { pattern: /\b(VinFast)\b/gi,                                        label: 'brand' },
  { pattern: /\b(\d+\s?(km|mi|l|cc|kW|hp|Nm|km\/h|mph|%)s?)\b/gi,      label: 'numericSpec' },
  { pattern: /\b(charging|battery|motor|engine|brake|tire|seat|screen|mirror|door)\b/gi, label: 'component' },
  { pattern: /\b(\d{4})\b/g,                                          label: 'year' },
];

function extractEntities(query: string): string[] {
  const entities: string[] = [];
  for (const { pattern } of ENTITY_PATTERNS) {
    const matches = query.match(pattern);
    if (matches) {
      entities.push(...matches.map((m) => m.trim()).filter(Boolean));
    }
  }
  return [...new Set(entities)];
}

// ---------------------------------------------------------------------------
// Query Reformulation
// ---------------------------------------------------------------------------

async function reformulateQuery(
  query: string,
  carModel: string,
  openaiApiKey: string
): Promise<string> {
  const systemPrompt = `You are a query enhancement assistant for a VinFast car RAG system.
Your task is to reformulate the user's query to improve retrieval from a VinFast knowledge base.

Rules:
- Expand abbreviations and acronyms
- Add VinFast-specific context where relevant
- Keep the reformulated query concise (under 50 words)
- Preserve the original intent
- Only include VinFast-relevant details

Respond with ONLY the reformulated query text, no explanations or markdown.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Original query: "${query}"\nVinFast car model: ${carModel}\nReformulated query:`,
          },
        ],
        max_tokens: 80,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      // Fallback: simple keyword augmentation
      return `[${carModel}] ${query}`;
    }

    const data = await response.json();
    const reformulated = data.choices?.[0]?.message?.content?.trim();

    return reformulated ?? `[${carModel}] ${query}`;
  } catch {
    // Network or parse error — use fallback
    return `[${carModel}] ${query}`;
  }
}

// ---------------------------------------------------------------------------
// Strategy Selection
// ---------------------------------------------------------------------------

function chooseRetrievalStrategy(
  query: string,
  category: string
): RetrievalStrategy {
  const lower = query.toLowerCase();

  // Charging, spec, and maintenance queries benefit from semantic similarity
  if (['Charging', 'Specifications', 'Maintenance'].includes(category)) {
    return 'semantic';
  }

  // Warning lights and infotainment — hybrid works best (exact match + semantic)
  if (['Warning Lights', 'Infotainment', 'ADAS'].includes(category)) {
    return 'hybrid';
  }

  // If the query has numeric values, use hybrid (exact + semantic)
  if (/\d+/.test(lower)) {
    return 'hybrid';
  }

  // Short, ambiguous queries → semantic
  if (query.split(' ').length <= 3) {
    return 'semantic';
  }

  return 'hybrid';
}

// ---------------------------------------------------------------------------
// Mock Retrieval (replace with actual vector/keyword search implementation)
// ---------------------------------------------------------------------------

async function executeRetrieval(
  reformulatedQuery: string,
  carModel: string,
  strategy: RetrievalStrategy,
  topK: number = 5
): Promise<RetrievedContext[]> {
  // -------------------------------------------------------------------------
  // TODO: Replace this stub with your actual retrieval implementation:
  //   - Vector store (Pinecone / Weaviate / ChromaDB / Qdrant)
  //   - Keyword search (Elasticsearch / BM25)
  //   - Hybrid search combining both
  //
  // For now, return an empty array so the orchestrator handles the no-context
  // case gracefully.
  // -------------------------------------------------------------------------
  void reformulatedQuery;
  void carModel;
  void strategy;
  void topK;

  return [];
}

// ---------------------------------------------------------------------------
// Main Retrieval Agent
// ---------------------------------------------------------------------------

/**
 * Analyzes the user's query, reformulates it, selects the optimal retrieval
 * strategy, and fetches relevant contexts from the knowledge base.
 *
 * @param query       - Original user query
 * @param carModel    - Selected VinFast car model
 * @param openaiApiKey - OpenAI API key (used for query reformulation)
 * @param topK        - Number of top contexts to retrieve (default: 5)
 */
export async function runRetrievalAgent(
  query: string,
  carModel: string,
  openaiApiKey: string,
  topK: number = 5
): Promise<RetrievalResult> {
  // ── 1. Classify query category ────────────────────────────────────────────
  const { category } = classifyQuery(query);

  // ── 2. Extract entities ───────────────────────────────────────────────────
  const detectedEntities = extractEntities(query);

  // ── 3. Reformulate query ─────────────────────────────────────────────────
  const reformulatedQuery = await reformulateQuery(query, carModel, openaiApiKey);

  // ── 4. Choose retrieval strategy ─────────────────────────────────────────
  const retrievalStrategy = chooseRetrievalStrategy(query, category);

  // ── 5. Execute retrieval ─────────────────────────────────────────────────
  const contexts = await executeRetrieval(reformulatedQuery, carModel, retrievalStrategy, topK);

  return {
    contexts,
    queryAnalysis: {
      category,
      detectedEntities,
      reformulatedQuery,
    },
    retrievalStrategy,
  };
}
