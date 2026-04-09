export interface UserFeedback {
  messageId: string;
  query: string;
  aiAnswer: string;
  correction?: string;
  thumbsUp: boolean;
  thumbsDown: boolean;
  timestamp: number;
  carModel: string;
  category?: string;
}

const STORAGE_KEY = 'vf_feedback_logs';
const MAX_LOGS = 100;

/** Check if running in browser (localStorage is browser-only) */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function logFeedback(feedback: UserFeedback): void {
  if (!isBrowser()) return;
  try {
    const logs: UserFeedback[] = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    logs.push(feedback);
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }
}

export function getFeedbackLogs(): UserFeedback[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function computePrecisionAtK(logs: UserFeedback[], _k = 3): number {
  if (logs.length === 0) return 0;
  const thumbsUp = logs.filter((l) => l.thumbsUp).length;
  return thumbsUp / logs.length;
}

export function getCategoryHeatmap(logs: UserFeedback[]): Record<string, number> {
  const heat: Record<string, number> = {};
  for (const log of logs) {
    const cat = log.category ?? 'general';
    heat[cat] = (heat[cat] ?? 0) + 1;
  }
  return heat;
}

export function exportFeedbackLogs(): string {
  const logs = getFeedbackLogs();
  return JSON.stringify(logs, null, 2);
}