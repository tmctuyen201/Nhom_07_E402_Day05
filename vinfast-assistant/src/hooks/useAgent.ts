import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentMessage } from '../types/agent';
import {
  getOrCreateSessionId,
  saveChatHistory,
  loadChatHistory,
  clearChatHistory,
  buildLLMHistory,
  saveSessionMeta,
} from '../lib/memory';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

interface UseAgentOptions {
  apiKey: string;
  carModel: string;
}

interface UseAgentReturn {
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  rateLimitCountdown: number;
  sessionId: string;
  sendMessage: (query: string, imageData?: string) => Promise<void>;
  clearChat: () => void;
}

export function useAgent({ apiKey, carModel }: UseAgentOptions): UseAgentReturn {
  const sessionId = getOrCreateSessionId();

  // ── Load persisted history on mount ────────────────────────
  const [messages, setMessages] = useState<AgentMessage[]>(() => loadChatHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef<number>(0);
  const messageCountRef = useRef<number>(messages.length);

  // ── Persist history on every change ──────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
      saveSessionMeta({
        messageCount: messages.length,
        lastMessageAt: Date.now(),
        carModel,
      });
      messageCountRef.current = messages.length;
    }
  }, [messages, carModel]);

  // ── Init session metadata ────────────────────────────────
  useEffect(() => {
    saveSessionMeta({
      sessionId,
      carModel,
      createdAt: Date.now(),
    });
  }, [sessionId, carModel]);

  const clearChat = useCallback(() => {
    setMessages([]);
    clearChatHistory();
    setError(null);
    messageCountRef.current = 0;
  }, []);

  const sendMessage = useCallback(async (query: string, imageData?: string) => {
    if (!query.trim()) return;

    // Build LLM context from last 20 non-error messages
    const llmHistory = buildLLMHistory(messages);

    // ── Add user message immediately ──
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
      carModel,
      ...(imageData ? { imageData } : {}),
    };
    setMessages(prev => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);

    // ── Abort any in-flight request ──
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // ── Typing indicator placeholder ──
    const typingId = `typing-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: typingId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        carModel,
        agentType: 'orchestrator',
      },
    ]);

    // ── Attempt loop (max 3 retries) ──
    let lastError = '';
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        retryCountRef.current = attempt;
        const waitMs = RETRY_DELAY_MS * attempt;
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }

      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query,
            car_model: carModel,
            image_data: imageData,
            conversation_history: llmHistory,
          }),
          signal: controller.signal,
        });

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
          let countdown = retryAfter;
          const interval = setInterval(() => {
            countdown -= 1;
            setRateLimitCountdown(countdown);
            if (countdown <= 0) clearInterval(interval);
          }, 1000);
          setRateLimitCountdown(retryAfter);
          throw new Error(`Quá nhiều yêu cầu. Vui lòng chờ ${retryAfter}s.`);
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error ?? `Lỗi server (${response.status})`);
        }

        const data = await response.json();

        // ── Replace typing indicator with real response ──
        setMessages(prev => {
          const withoutTyping = prev.filter(m => m.id !== typingId);
          const assistantMessage: AgentMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.text ?? data.content ?? '',
            timestamp: Date.now(),
            carModel,
            agentType: data.agent ?? 'orchestrator',
            sources: data.sources,
            confidence: data.confidence ?? 0.8,
            isSafetyWarning: data.isSafetyWarning ?? false,
          };
          return [...withoutTyping, assistantMessage];
        });

        setIsLoading(false);
        retryCountRef.current = 0;
        return; // Success — exit

      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setIsLoading(false);
          return; // Intentionally cancelled
        }
        lastError = err instanceof Error ? err.message : 'Lỗi không xác định';

        if (err instanceof Error && (err.message.includes('API key') || err.message.includes('không hợp lệ'))) {
          break;
        }
      }
    }

    // ── All retries exhausted ──
    setMessages(prev => {
      const withoutTyping = prev.filter(m => m.id !== typingId);
      return [
        ...withoutTyping,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Xin lỗi, đã xảy ra lỗi sau ${MAX_RETRIES + 1} lần thử: ${lastError}`,
          timestamp: Date.now(),
          carModel,
          agentType: 'orchestrator',
          isError: true,
        },
      ];
    });
    setError(lastError);
    setIsLoading(false);
  }, [messages, carModel]); // eslint-disable-line react-hooks/exhaustive-deps

  return { messages, isLoading, error, rateLimitCountdown, sessionId, sendMessage, clearChat };
}
