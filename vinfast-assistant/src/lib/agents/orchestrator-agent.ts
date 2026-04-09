import { runSafetyAgent } from './safety-agent';
import { runRetrievalAgent } from './retrieval-agent';
import { runVisionAgent } from './vision-agent';
import { runRAGPipeline } from '../rag';
import type { AgentContext, AgentResponse } from './types';

export interface OrchestratorConfig {
  openaiApiKey: string;
  enableVision: boolean;
  enableSafetyCheck: boolean;
  maxRetries: number;
}

const OFF_TOPIC_RESPONSE = `Xin lỗi, tôi chỉ có thể hỗ trợ về xe VinFast — như tính năng ADAS, sạc pin, đèn cảnh báo, vận hành, bảo dưỡng, và thông số kỹ thuật.

Nếu bạn có câu hỏi về xe VinFast, hãy hỏi tôi nhé! Ví dụ: "Cách sạc pin VF8?" hoặc "Đèn check engine là gì?"`;

const LOW_CONFIDENCE_RESPONSE = `Tôi không tìm thấy thông tin chính xác trong Manual VinFast cho câu hỏi của bạn. Để được hỗ trợ tốt nhất, bạn vui lòng:

1. Liên hệ **hotline VinFast**: 1900 232 389
2. Ghé **showroom VinFast** gần nhất
3. Tra cứu Manual điện tử tại [om.vinfastauto.com](https://om.vinfastauto.com)

Thông tin chỉ mang tính tham khảo.`;

export async function runOrchestrator(
  context: AgentContext,
  config: OrchestratorConfig
): Promise<AgentResponse> {
  const { query, carModel, imageData, conversationHistory } = context;
  const history = conversationHistory
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // ── 1. Safety Check (query) ─────────────────────────────────
  if (config.enableSafetyCheck) {
    const safety = await runSafetyAgent(query, '', [], 'default');
    if (!safety.isSafe) {
      return {
        text: safety.concerns[0] ?? OFF_TOPIC_RESPONSE,
        agent: 'safety',
        confidence: 0,
        isSafetyWarning: true,
        shouldReject: true,
        rejectionReason: safety.concerns[0],
      };
    }
  }

  // ── 2. Vision Agent (if image provided) ──────────────────────
  let visionFindings = '';
  if (imageData && config.enableVision && config.openaiApiKey) {
    try {
      const vision = await runVisionAgent(imageData, config.openaiApiKey);
      if (vision.detected !== 'none') {
        visionFindings = `\n\n[Từ ảnh bạn gửi] Tôi nhận diện được: **${vision.detected.toUpperCase()}** — ${vision.description}`;
        if (vision.urgency === 'critical' || vision.urgency === 'high') {
          visionFindings += `\n⚠️ **Mức độ khẩn cấp: ${vision.urgency}**`;
        }
        visionFindings += `\nHành động ngay: ${vision.immediateActions.join(' | ')}`;
      }
    } catch {
      // Vision failure is non-fatal — continue text-only
      visionFindings = '\n\n(Không thể phân tích ảnh — vui lòng mô tả đèn cảnh báo bằng lời)';
    }
  }

  const enrichedQuery = query + visionFindings;

  // ── 3. Retrieval Agent ──────────────────────────────────────
  const retrieval = await runRetrievalAgent(enrichedQuery, carModel, config.openaiApiKey);

  if (retrieval.queryAnalysis.category === 'off_topic') {
    return {
      text: OFF_TOPIC_RESPONSE,
      agent: 'retrieval',
      confidence: 0,
    };
  }

  if (retrieval.contexts.length === 0) {
    return {
      text: LOW_CONFIDENCE_RESPONSE,
      agent: 'retrieval',
      confidence: 0,
    };
  }

  // ── 4. RAG Synthesis ────────────────────────────────────────
  let finalText: string;
  let sources: AgentResponse['sources'];
  let confidence: number;

  try {
    const ragResult = await runRAGPipeline(
      enrichedQuery,
      carModel,
      history,
      config.openaiApiKey
    );
    finalText = ragResult.answer;
    sources = ragResult.sources;
    confidence = ragResult.confidence ?? 0.7;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
    if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
      return {
        text: `Lỗi xác thực API: "${msg}". Vui lòng kiểm tra lại OpenAI API key trong phần Cài đặt.`,
        agent: 'orchestrator',
        confidence: 0,
        isError: true,
      };
    }
    throw err; // Re-throw for the hook to handle retries
  }

  // ── 5. Safety Check (response) ───────────────────────────────
  if (config.enableSafetyCheck) {
    const responseSafety = await runSafetyAgent(query, finalText, retrieval.contexts, 'default');
    if (responseSafety.recommendedAction === 'block') {
      return {
        text: `⚠️ **Cảnh báo an toàn:** Câu trả lời này có thể không chính xác hoặc gây nguy hiểm. ${responseSafety.concerns[0] ?? ''}\n\nVui lòng liên hệ hotline VinFast **1900 232 389** để được hỗ trợ an toàn.`,
        agent: 'safety',
        confidence: 0,
        isSafetyWarning: true,
        shouldReject: true,
        rejectionReason: responseSafety.concerns[0],
      };
    }
  }

  return {
    text: finalText,
    agent: 'orchestrator',
    sources,
    confidence,
    category: retrieval.queryAnalysis.category,
  };
}
