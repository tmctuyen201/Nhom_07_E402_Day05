import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentMessage, ToolCallResult } from '../types/agent';
import {
  getOrCreateSessionId, saveChatHistory, loadChatHistory,
  clearChatHistory, buildLLMHistory, saveSessionMeta,
} from '../lib/memory';
import { saveSession } from '../lib/memory/sessions';
import { loadUserProfile, profileToApiPayload } from '../lib/memory/userProfile';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

// ── LLM-based intent classification (replaces all regex) ──────
async function classifyIntent(query: string, apiKey: string): Promise<{ intent: string; params: Record<string, unknown> }> {
  try {
    const res = await fetch('/api/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return { intent: 'car_assistant', params: {} };
    return await res.json();
  } catch {
    return { intent: 'car_assistant', params: {} };
  }
}

// ── Greeting response — no API call needed ────────────────────
function buildGreetingReply(carModel: string): string {
  const profile = loadUserProfile();
  const name = profile?.name ? ` ${profile.name}` : '';
  const car = profile?.carVariant || carModel;
  return `Chào${name}! 👋 Mình là VinFast AI, trợ lý đồng hành cùng chiếc ${car} của bạn.

Mình có thể giúp bạn:
- 🔋 Tính phạm vi di chuyển theo % pin
- ⚠️ Giải thích đèn cảnh báo trên taplo
- 🤖 Hướng dẫn tính năng ADAS
- 🔧 Kiểm tra lịch bảo dưỡng theo số km
- 📍 Tìm trạm sạc / trung tâm dịch vụ gần nhất
- 🍜 Tìm quán ăn, cà phê, ATM gần đây
- 🧭 Chỉ đường đến bất kỳ địa điểm nào

Bạn cần mình giúp gì hôm nay?`;
}

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
  currentSessionId: string;
  sendMessage: (query: string, imageData?: string) => Promise<void>;
  clearChat: () => void;
  loadSession: (id: string, sessionMessages: AgentMessage[]) => void;
  runChargingStationTool: (toolMsgId: string, stationType?: 'charging' | 'service') => void;
  runPlaceSearchTool: (toolMsgId: string, keyword: string, limit: number) => void;
  runDirectionsTool: (toolMsgId: string, destination: string) => void;
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
      // Auto-save to multi-session store
      saveSession({
        id: sessionId,
        carModel,
        createdAt: Date.now(),
        lastAt: Date.now(),
        messages,
      });
    }
  }, [messages, carModel, sessionId]);

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

  const loadSession = useCallback((id: string, sessionMessages: AgentMessage[]) => {
    setMessages(sessionMessages);
    saveChatHistory(sessionMessages);
    setError(null);
    messageCountRef.current = sessionMessages.length;
  }, []);

  // ── Tool: find charging stations ──────────────────────────
  const runChargingStationTool = useCallback(async (toolMsgId: string, stationType: 'charging' | 'service' = 'charging') => {
    const updateTool = (patch: Partial<ToolCallResult>) =>
      setMessages(prev => prev.map(m =>
        m.id === toolMsgId ? { ...m, toolCall: { ...m.toolCall!, ...patch } } : m
      ));

    if (!navigator.geolocation) {
      updateTool({ status: 'error', error: 'Trình duyệt không hỗ trợ định vị GPS.' });
      return;
    }

    updateTool({ status: 'requesting_location', stationType });

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        updateTool({ status: 'searching', userLocation: { lat, lng }, stationType });
        try {
          const res = await fetch('/api/nearby-stations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, station_type: stationType, radius_km: 15 }),
          });
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          const data = await res.json();
          updateTool({ status: 'done', stations: data.stations ?? [], source: data.source, userLocation: { lat, lng }, stationType });
        } catch (e) {
          updateTool({ status: 'error', error: e instanceof Error ? e.message : 'Lỗi tìm trạm.', stationType });
        }
      },
      err => {
        const msgs: Record<number, string> = {
          1: 'Bạn đã từ chối quyền truy cập vị trí.',
          2: 'Không thể xác định vị trí. Kiểm tra kết nối mạng.',
          3: 'Hết thời gian chờ định vị. Thử lại.',
        };
        updateTool({ status: 'error', error: msgs[err.code] ?? 'Lỗi định vị.', stationType });
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }, []);

  // ── Tool: search nearby places ────────────────────────────
  const runPlaceSearchTool = useCallback((toolMsgId: string, keyword: string, limit: number) => {
    const updateTool = (patch: Partial<ToolCallResult>) =>
      setMessages(prev => prev.map(m =>
        m.id === toolMsgId ? { ...m, toolCall: { ...m.toolCall!, ...patch } } : m
      ));

    if (!navigator.geolocation) {
      updateTool({ status: 'error', error: 'Trình duyệt không hỗ trợ định vị GPS.' });
      return;
    }
    updateTool({ status: 'requesting_location' });

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        updateTool({ status: 'searching', userLocation: { lat, lng } });
        try {
          const res = await fetch('/api/search-places', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, keyword, limit }),
          });
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          const data = await res.json();
          updateTool({ status: 'done', places: data.places ?? [], source: data.source, userLocation: { lat, lng }, keyword, error: data.error });
        } catch (e) {
          updateTool({ status: 'error', error: e instanceof Error ? e.message : 'Lỗi tìm kiếm.' });
        }
      },
      err => {
        const msgs: Record<number, string> = { 1: 'Bạn đã từ chối quyền truy cập vị trí.', 2: 'Không thể xác định vị trí.', 3: 'Hết thời gian chờ.' };
        updateTool({ status: 'error', error: msgs[err.code] ?? 'Lỗi định vị.' });
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }, []);

  // ── Tool: get directions ──────────────────────────────────
  const runDirectionsTool = useCallback(async (toolMsgId: string, destination: string) => {
    const updateTool = (patch: Partial<ToolCallResult>) =>
      setMessages(prev => prev.map(m =>
        m.id === toolMsgId ? { ...m, toolCall: { ...m.toolCall!, ...patch } } : m
      ));

    updateTool({ status: 'geocoding', destination });
    try {
      const res = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      updateTool({
        status: 'done',
        destination,
        display_name: data.display_name,
        maps_url: data.maps_url,
        directions_found: data.found,
      });
    } catch (e) {
      updateTool({ status: 'error', error: e instanceof Error ? e.message : 'Lỗi geocoding.' });
    }
  }, []);

  const sendMessage = useCallback(async (query: string, imageData?: string) => {
    if (!query.trim()) return;

    // ── Classify intent via LLM (no regex) ──
    const { intent, params } = await classifyIntent(query, apiKey);

    if (intent === 'greeting') {
      const userMsg: AgentMessage = { id: `user-${Date.now()}`, role: 'user', content: query, timestamp: Date.now(), carModel };
      const replyMsg: AgentMessage = {
        id: `assistant-${Date.now()}`, role: 'assistant',
        content: buildGreetingReply(carModel),
        timestamp: Date.now(), carModel, agentType: 'orchestrator', confidence: 1.0,
      };
      setMessages(prev => [...prev, userMsg, replyMsg]);
      return;
    }

    if (intent === 'find_charging_stations' || intent === 'find_service_centers') {
      const stationType = intent === 'find_service_centers' ? 'service' : 'charging';
      const userMsg: AgentMessage = { id: `user-${Date.now()}`, role: 'user', content: query, timestamp: Date.now(), carModel };
      const toolMsgId = `tool-${Date.now()}`;
      setMessages(prev => [...prev, userMsg, {
        id: toolMsgId, role: 'assistant', content: '', timestamp: Date.now(), carModel, agentType: 'tool',
        toolCall: { tool: 'find_charging_stations', status: 'requesting_location', stationType },
      }]);
      runChargingStationTool(toolMsgId, stationType);
      return;
    }

    if (intent === 'search_places') {
      const keyword = String(params.keyword ?? query);
      const limit = Number(params.limit ?? 5);
      const userMsg: AgentMessage = { id: `user-${Date.now()}`, role: 'user', content: query, timestamp: Date.now(), carModel };
      const toolMsgId = `tool-${Date.now()}`;
      setMessages(prev => [...prev, userMsg, {
        id: toolMsgId, role: 'assistant', content: '', timestamp: Date.now(), carModel, agentType: 'tool',
        toolCall: { tool: 'search_nearby_places', status: 'requesting_location', keyword },
      }]);
      runPlaceSearchTool(toolMsgId, keyword, limit);
      return;
    }

    if (intent === 'get_directions') {
      const destination = String(params.destination ?? query);
      const userMsg: AgentMessage = { id: `user-${Date.now()}`, role: 'user', content: query, timestamp: Date.now(), carModel };
      const toolMsgId = `tool-${Date.now()}`;
      setMessages(prev => [...prev, userMsg, {
        id: toolMsgId, role: 'assistant', content: '', timestamp: Date.now(), carModel, agentType: 'tool',
        toolCall: { tool: 'get_directions', status: 'geocoding', destination },
      }]);
      runDirectionsTool(toolMsgId, destination);
      return;
    }

    // intent === 'car_assistant' → normal LLM flow

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
            user_profile: profileToApiPayload(loadUserProfile()),
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

        // If LLM triggered a tool_action, inject a tool message
        if (data.tool_action?.__tool_action__) {
          const action = data.tool_action;
          const toolType = action.tool;
          const toolMsgId = `tool-${Date.now()}`;

          if (toolType === 'find_nearby_stations') {
            const stationType: 'charging' | 'service' = action.station_type ?? 'charging';
            setMessages(prev => [...prev, {
              id: toolMsgId, role: 'assistant', content: '',
              timestamp: Date.now(), carModel, agentType: 'tool',
              toolCall: { tool: 'find_charging_stations', status: 'requesting_location', stationType },
            }]);
            runChargingStationTool(toolMsgId, stationType);
          } else if (toolType === 'battery_range') {
            // Render battery range widget directly — data already computed
            setMessages(prev => [...prev, {
              id: toolMsgId, role: 'assistant', content: '',
              timestamp: Date.now(), carModel, agentType: 'tool',
              toolCall: { tool: 'battery_range', status: 'done', ...action },
            }]);
          } else if (toolType === 'maintenance_schedule') {
            setMessages(prev => [...prev, {
              id: toolMsgId, role: 'assistant', content: '',
              timestamp: Date.now(), carModel, agentType: 'tool',
              toolCall: { tool: 'maintenance_schedule', status: 'done', ...action },
            }]);
          }
        }

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

  return { messages, isLoading, error, rateLimitCountdown, sessionId, currentSessionId: sessionId, sendMessage, clearChat, loadSession, runChargingStationTool, runPlaceSearchTool, runDirectionsTool };
}
