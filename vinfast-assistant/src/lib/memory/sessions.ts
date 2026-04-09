/**
 * Multi-session storage manager
 * Stores separate chat histories per car model (VF7/VF8/VF9)
 * Key: vf_sessions_history
 * Max 20 sessions, oldest pruned automatically
 */
import type { AgentMessage } from '../agents/types';

const SESSIONS_KEY = 'vf_sessions_history';
const MAX_SESSIONS = 20;

export interface ChatSession {
  id: string;
  carModel: string;
  createdAt: number;
  lastAt: number;
  messages: AgentMessage[];
  title: string; // first user message truncated
}

// ── Helpers ──────────────────────────────────────────────────

function deriveTitle(messages: AgentMessage[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'Cuộc trò chuyện mới';
  return first.content.slice(0, 60).trim() || 'Cuộc trò chuyện mới';
}

function loadRaw(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

function saveRaw(sessions: ChatSession[]): void {
  try {
    // Strip imageData to save space
    const safe = sessions.map(s => ({
      ...s,
      messages: s.messages.map(m => ({ ...m, imageData: undefined })),
    }));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(safe));
  } catch {
    // If quota exceeded, drop oldest half and retry
    const half = sessions.slice(Math.floor(sessions.length / 2));
    try {
      const safe = half.map(s => ({
        ...s,
        messages: s.messages.map(m => ({ ...m, imageData: undefined })),
      }));
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(safe));
    } catch {
      // Give up silently
    }
  }
}

// ── Public API ───────────────────────────────────────────────

export function saveSession(session: Omit<ChatSession, 'title'> & { title?: string }): void {
  if (!session.id || session.messages.length === 0) return;

  const sessions = loadRaw();
  const idx = sessions.findIndex(s => s.id === session.id);

  const entry: ChatSession = {
    ...session,
    title: session.title ?? deriveTitle(session.messages),
    lastAt: Date.now(),
  };

  if (idx >= 0) {
    sessions[idx] = entry;
  } else {
    sessions.unshift(entry);
  }

  // Prune to MAX_SESSIONS (keep most recent by lastAt)
  const pruned = sessions
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, MAX_SESSIONS);

  saveRaw(pruned);
}

export function loadAllSessions(): ChatSession[] {
  return loadRaw().sort((a, b) => b.lastAt - a.lastAt);
}

export function loadSession(id: string): ChatSession | null {
  return loadRaw().find(s => s.id === id) ?? null;
}

export function deleteSession(id: string): void {
  const sessions = loadRaw().filter(s => s.id !== id);
  saveRaw(sessions);
}

export function getSessionsByModel(model: string): ChatSession[] {
  return loadRaw()
    .filter(s => s.carModel === model)
    .sort((a, b) => b.lastAt - a.lastAt);
}
