/**
 * Session + Chat History Memory
 * Stores conversation history across page reloads using localStorage.
 * Provides conversation history for LLM context on every call.
 */
import type { AgentMessage } from '../agents/types';

// ── Storage keys ─────────────────────────────────────────────
const SESSION_KEY = 'vf_session_id';
const HISTORY_KEY  = 'vf_chat_history';

// ── Session ID ───────────────────────────────────────────────
export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `vf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ── History persistence ─────────────────────────────────────
export function saveChatHistory(history: AgentMessage[]): void {
  try {
    // Prune imageData to avoid localStorage quota issues
    const safe: AgentMessage[] = history.map(m => ({ ...m, imageData: undefined }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(safe));
  } catch {
    // localStorage full — try to halve and retry
    const half = history.slice(-Math.floor(history.length / 2));
    try {
      const safe: AgentMessage[] = half.map(m => ({ ...m, imageData: undefined }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(safe));
    } catch {
      // Give up — clear oldest half
      const safe: AgentMessage[] = half.map(m => ({ ...m, imageData: undefined }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(safe.slice(0, Math.floor(half.length / 2))));
    }
  }
}

export function loadChatHistory(): AgentMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AgentMessage[];
  } catch {
    return [];
  }
}

export function clearChatHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  resetSessionId();
}

// ── LLM context builder ─────────────────────────────────────
const MAX_HISTORY_MSGS = 20;

export function buildLLMHistory(history: AgentMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .filter(m => !m.isError)
    .slice(-MAX_HISTORY_MSGS)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}

// ── Session metadata store ──────────────────────────────────
interface SessionMeta {
  sessionId: string;
  carModel: string;
  createdAt: number;
  messageCount: number;
  lastMessageAt: number;
}

const META_KEY = 'vf_session_meta';

export function saveSessionMeta(meta: Partial<SessionMeta>): void {
  try {
    const existing = JSON.parse(localStorage.getItem(META_KEY) ?? '{}') as Partial<SessionMeta>;
    localStorage.setItem(META_KEY, JSON.stringify({ ...existing, ...meta }));
  } catch {
    // ignore
  }
}

export function loadSessionMeta(): SessionMeta {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? '{}') as SessionMeta;
  } catch {
    return { sessionId: '', carModel: 'VF8', createdAt: Date.now(), messageCount: 0, lastMessageAt: 0 };
  }
}
