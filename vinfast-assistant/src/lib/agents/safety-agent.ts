import type { RetrievedContext } from '../rag/types';

/**
 * Safety Agent: validates queries and responses for safety
 * Ensures all interactions are safe, relevant to VinFast car operations,
 * and do not contain potentially dangerous instructions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';
export type RecommendedAction = 'allow' | 'warn' | 'block' | 'escalate';

export interface SafetyCheck {
  isSafe: boolean;
  riskLevel: RiskLevel;
  concerns: string[];
  recommendedAction: RecommendedAction;
}

// ---------------------------------------------------------------------------
// Rate Limiting (in-memory, per-session)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;           // 10 requests per window

function checkRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(sessionId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(sessionId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ---------------------------------------------------------------------------
// Topic Classification
// ---------------------------------------------------------------------------

const OFF_TOPIC_PATTERNS = [
  /\b(medical|medicine|doctor|health|symptoms|treatment|prescription)\b/i,
  /\b(financial|investment|stock|crypto|bank|loan|credit\s*card)\b/i,
  /\b(personal\s*(data|information|address|phone|ssn|passport))\b/i,
  /\b(political|religious|ideological|extremist)\b/i,
  /\b(illegal|drugs|criminal|weapon\s*(manufacture|modification))\b/i,
  /\b(software\s*(crack|hack|exploit|pirate))\b/i,
  /\b(dating|relationship|psychological\s*advice)\b/i,
  /\b(construction|home\s*repair|electrical\s*wiring)\b/i,
];

const DANGEROUS_INSTRUCTION_PATTERNS = [
  /\b(disassemble|remove\s*(airbag|seatbelt|belt))\b/i,
  /\b(bypass\s*(sensor|alarm|limit\s*switch))\b/i,
  /\b(modify\s*(ECU|firmware|software))\b/i,
  /\b(use\s*(damaged|exposed|cracked)\s*(battery|cable))\b/i,
  /\b(drive\s*(underwater|on\s*rail|off\s*(road|cliff)))\b/i,
  /\b(remove\s*(catalytic\s*converter|emissions\s*system|exhaust))\b/i,
  /\b(tamper\s*with\s*(speedometer|odometer))\b/i,
  /\b(disable\s*(ABS|brake\s*assist|stability\s*control))\b/i,
];

const VINFAT_SCOPES = [
  'vinfast', 'vf 3', 'vf 5', 'vf 6', 'vf 7', 'vf 8', 'vf 9', 'vf 34', 'vf 35', 'vf 36',
  'ev', 'electric vehicle', 'charging', 'battery', 'range', 'adas', 'autonomous',
  'infotainment', 'navigation', 'climate control', ' seats', 'mirror', 'dashboard',
  'warning light', 'maintenance', 'service', 'repair', 'warranty', 'specification',
  'features', 'ota update', 'bluetooth', 'apple carplay', 'android auto', 'vf drive',
  'vf connect', 'vf smart', 'parking', 'reverse camera', 'lane keep', 'blind spot',
  'collision warning', 'airbag', 'abs', 'tire pressure', 'tpms', 'cruise control',
  'eco mode', 'sport mode', 'regenerative braking', 'ac charging', 'dc fast charging',
  'homologation', 'registration', 'license plate', 'vin', 'vehicle identification',
  'car', 'vehicle', 'automobile', 'automotive',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isQueryInScope(query: string): boolean {
  const lower = query.toLowerCase();
  return VINFAT_SCOPES.some((scope) => lower.includes(scope));
}

function detectOffTopicConcerns(query: string): string[] {
  const concerns: string[] = [];
  for (const pattern of OFF_TOPIC_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      concerns.push(`Query may relate to off-topic area: "${match[0]}"`);
    }
  }
  return concerns;
}

function detectDangerousInstructions(text: string): string[] {
  const concerns: string[] = [];
  for (const pattern of DANGEROUS_INSTRUCTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      concerns.push(`Potentially dangerous instruction detected: "${match[0]}"`);
    }
  }
  return concerns;
}

function deriveRiskLevel(concerns: string[]): RiskLevel {
  if (concerns.length === 0) return 'none';
  if (concerns.some((c) => c.includes('dangerous'))) return 'high';
  if (concerns.length >= 2) return 'medium';
  return 'low';
}

function deriveAction(riskLevel: RiskLevel, concerns: string[]): RecommendedAction {
  if (riskLevel === 'high') return 'block';
  if (riskLevel === 'medium' || concerns.length > 0) return 'warn';
  return 'allow';
}

// ---------------------------------------------------------------------------
// Main Safety Check
// ---------------------------------------------------------------------------

/**
 * Performs a safety check on a user query and the synthesized response.
 *
 * @param query           - The original user query
 * @param response        - The synthesized response text (empty string for pre-retrieval check)
 * @param retrievedContexts - Retrieved knowledge base contexts
 * @param sessionId       - Optional session identifier for rate limiting (defaults to 'default')
 */
export async function runSafetyAgent(
  query: string,
  response: string,
  retrievedContexts: RetrievedContext[] = [],
  sessionId: string = 'default'
): Promise<SafetyCheck> {
  const concerns: string[] = [];

  // ── 1. Rate Limiting ─────────────────────────────────────────────────────
  const { allowed, remaining } = checkRateLimit(sessionId);
  if (!allowed) {
    return {
      isSafe: false,
      riskLevel: 'high',
      concerns: [`Rate limit exceeded (${RATE_LIMIT_MAX}/min). Please wait a moment before submitting another query.`],
      recommendedAction: 'block',
    };
  }

  // ── 2. Off-Topic Detection ─────────────────────────────────────────────────
  const offTopicConcerns = detectOffTopicConcerns(query);
  concerns.push(...offTopicConcerns);

  // ── 3. Dangerous Instruction Detection ────────────────────────────────────
  const dangerousQuery = detectDangerousInstructions(query);
  concerns.push(...dangerousQuery);

  const dangerousResponse = detectDangerousInstructions(response);
  concerns.push(...dangerousResponse);

  // ── 4. Safety Warnings from Knowledge Base ────────────────────────────────
  const contextSafetyWarnings = retrievedContexts
    .filter((ctx) => ctx.metadata?.safetyWarning === true || ctx.metadata?.urgent === true)
    .map((ctx) => `Context "${ctx.chunkId}" contains a safety warning that should be addressed.`);

  concerns.push(...contextSafetyWarnings);

  // If response is empty (pre-generation check), warn if no safety context found
  if (!response && retrievedContexts.length === 0) {
    const inScope = isQueryInScope(query);
    if (!inScope && concerns.length === 0) {
      concerns.push(
        'Query does not appear to be related to VinFast vehicles or car operations.'
      );
    }
  }

  // ── 5. Determine Risk & Action ────────────────────────────────────────────
  const riskLevel = deriveRiskLevel(concerns);
  const recommendedAction = deriveAction(riskLevel, concerns);
  const isSafe = recommendedAction === 'allow' || recommendedAction === 'warn';

  return {
    isSafe,
    riskLevel,
    concerns,
    recommendedAction,
  };
}
