import type { RetrievedContext, SynthesisResult } from './types';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `Bạn là trợ lý kỹ thuật xe VinFast chuyên nghiệp, lịch sự và chính xác.

QUY TẮC NGHIÊM NGẶT:
1. Chỉ trả lời về xe VinFast — nếu câu hỏi ngoài lề, hãy lịch sự từ chối
2. Luôn trích dẫn số trang từ Manual: ví dụ "Theo Manual VF8 trang 112..."
3. Nếu không chắc chắn, nói rõ và gợi ý liên hệ showroom VinFast
4. Cảnh báo an toàn: nếu câu hỏi liên quan đến an toàn (phanh, đèn cảnh báo), nhấn mạnh mức độ ưu tiên
5. Luôn nhắc nhở: "Thông tin chỉ mang tính tham khảo. Liên hệ hotline VinFast 1900 232 389 để được hỗ trợ chính xác nhất."

NGỮ CẢNH TỪ MANUAL (dùng để trả lời):
{context}

TRẢ LỜI BẰNG TIẾNG VIỆT.`;

const FUNCTION_TOOLS = [
  {
    type: 'function' as const,
    name: 'get_warning_light_info',
    description: 'Tra cứu thông tin về đèn cảnh báo trên taplo xe VinFast',
    parameters: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Tên đèn cảnh báo (ví dụ: check engine, brake, tire pressure, battery)' },
      },
      required: ['name'],
    },
  },
  {
    type: 'function' as const,
    name: 'get_adas_feature_info',
    description: 'Tra cứu thông tin về tính năng ADAS của xe VinFast',
    parameters: {
      type: 'object' as const,
      properties: {
        feature: { type: 'string', description: 'Tên tính năng ADAS (ví dụ: LKA, ACC, AEB, BSM, LDW)' },
      },
      required: ['feature'],
    },
  },
  {
    type: 'function' as const,
    name: 'get_charging_guide',
    description: 'Hướng dẫn sạc pin xe VinFast dựa trên mức pin hiện tại',
    parameters: {
      type: 'object' as const,
      properties: {
        batteryLevel: { type: 'number', description: 'Mức pin hiện tại (%) từ 0-100' },
      },
      required: ['batteryLevel'],
    },
  },
];

function buildContextBlock(contexts: RetrievedContext[]): string {
  if (contexts.length === 0) return 'Không có thông tin trong Manual.';
  return contexts
    .map(({ chunk, score }) =>
      `[Trang ${chunk.pageNumber} | ${chunk.chapter} > ${chunk.section}] (relevance: ${(score * 100).toFixed(0)}%)\n${chunk.content}`
    )
    .join('\n\n');
}

function estimateConfidence(contexts: RetrievedContext[]): number {
  if (contexts.length === 0) return 0;
  const topScore = contexts[0].score;
  return Math.min(1, topScore * 2);
}

async function callOpenAI(
  messages: Array<{ role: string; content: string; name?: string }>,
  apiKey: string,
  tools?: unknown[]
): Promise<{ text: string; functionCall?: { name: string; args: Record<string, unknown> } }> {
  const body: Record<string, unknown> = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 800,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices?: Array<{
      message?: { content?: string | null; tool_calls?: Array<{ function: { name: string; arguments: string } }> };
    }>;
  };

  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error('Empty response from OpenAI');

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const call = msg.tool_calls[0];
    const name = call.function.name;
    const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
    return { text: msg.content ?? '', functionCall: { name, args } };
  }

  return { text: msg.content ?? '' };
}

function resolveFunction(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'get_warning_light_info': {
      const n = String(args.name ?? '').toLowerCase();
      if (n.includes('check engine') || n.includes('động cơ')) {
        return 'Check Engine Warning: Đèn báo lỗi động cơ. Khuyến nghị: Đưa xe đến trung tâm dịch vụ VinFast sớm nhất. Kiểm tra nắp bình xăng đã đóng chặt chưa (nguyên nhân phổ biến). Tránh lái xe ở tốc độ cao nếu đèn nhấp nháy.';
      }
      if (n.includes('brake') || n.includes('phanh')) {
        return 'Brake Warning: Đèn phanh đỏ báo parking brake đang kích hoạt hoặc mức dầu phanh thấp. Hành động: Thả phanh tay; nếu đèn vẫn sáng sau khi thả, DỪNG LẠI NGAY và gọi cứu hộ VinFast.';
      }
      if (n.includes('tire') || n.includes('áp suất') || n.includes('lốp')) {
        return 'TPMS Warning: Áp suất lốp thấp. Hành động: Bơm lốp tại trạm xăng gần nhất (áp suất theo tem cửa: 38 PSI / 260 kPa trước, 36 PSI / 250 kPa sau). Đèn sẽ tắt sau vài phút lái xe.';
      }
      if (n.includes('battery') || n.includes('pin') || n.includes('sạc')) {
        return 'Battery Warning: Lỗi hệ thống quản lý pin cao áp. Hành động: DỪNG LẠI NGAY, không tắt máy nếu đang sạc. Gọi cứu hộ VinFast 1900 232 389. Không tự ý mở nắp capo.';
      }
      return `Không tìm thấy thông tin chi tiết cho "${args.name}". Liên hệ hotline VinFast để được hướng dẫn.`;
    }
    case 'get_adas_feature_info': {
      const f = String(args.feature ?? '').toLowerCase();
      if (f.includes('lka') || f.includes('lane keep')) {
        return 'Lane Keeping Assist (LKA): Hệ thống hỗ trợ giữ làn đường. Sử dụng camera phía trước để nhận diện vạch kẻ. Khi xe đi lệch làn mà không bật xi-nhan, LKA sẽ tự điều chỉnh nhẹ vô lăng để đưa xe trở lại. Tốc độ hoạt động: trên 60 km/h.';
      }
      if (f.includes('acc') || f.includes('cruise')) {
        return 'Adaptive Cruise Control (ACC): Hệ thống ga tự động thích ứng. Duy trì khoảng cách an toàn với xe phía trước bằng cách tự động điều chỉnh tốc độ. ACC có thể phanh xe đến dừng hoàn toàn trong kẹt xe và tự động bò theo xe phía trước.';
      }
      if (f.includes('aeb') || f.includes('emergency')) {
        return 'Automatic Emergency Braking (AEB): Phanh khẩn cấp tự động. Phát hiện nguy cơ va chạm phía trước (xe, người đi bộ, xe đạp) và cảnh báo trước khi phanh tự động nếu tài xế không phản ứng. Hoạt động từ 5–150 km/h.';
      }
      if (f.includes('bsm') || f.includes('blind')) {
        return 'Blind Spot Monitoring (BSM): Giám sát điểm mù. Radar phía sau phát hiện xe trong điểm mù. Khi có xe, đèn báo sáng trên gương. Nếu bật xi-nhan mà có xe trong điểm mù, đèn nháy và có tiếng cảnh báo.';
      }
      return `Không tìm thấy thông tin chi tiết cho tính năng "${args.feature}". Tham khảo Manual xe của bạn hoặc liên hệ VinFast.`;
    }
    case 'get_charging_guide': {
      const level = Number(args.batteryLevel ?? 0);
      if (level < 10) {
        return `Pin chỉ còn ${level}% — mức rất thấp. KHẨN CẤP: Tìm trạm sạc gần nhất qua app VinFast ngay. Sạc ngay khi có thể, tránh để pin xuống dưới 5% để bảo vệ tuổi thọ pin.`;
      }
      if (level < 20) {
        return `Pin còn ${level}% — mức thấp. Nên sạc sớm. Khuyến nghị sạc ở chế độ AC (sạc chậm) qua đêm tại nhà hoặc trạm sạc công cộng. Hạn chế sạc nhanh DC khi pin dưới 20%.`;
      }
      if (level < 50) {
        return `Pin còn ${level}% — mức trung bình. Phù hợp để sạc AC qua đêm. Sạc đến 80% cho sử dụng hàng ngày để kéo dài tuổi thọ pin.`;
      }
      return `Pin còn ${level}% — mức tốt. Tiếp tục sử dụng bình thường. Nhắc nhở: tránh sạc thường xuyên trên 80% để tối ưu tuổi thọ pin.`;
    }
    default:
      return `Không tìm thấy chức năng "${name}".`;
  }
}

export async function synthesizeAnswer(
  query: string,
  retrievedContexts: RetrievedContext[],
  carModel: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  openaiApiKey: string
): Promise<SynthesisResult> {
  const contextBlock = buildContextBlock(retrievedContexts);
  const system = SYSTEM_PROMPT.replace('{context}', contextBlock);

  const historyMessages = conversationHistory.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const firstResponse = await callOpenAI(
    [{ role: 'system', content: system }, ...historyMessages, { role: 'user', content: query }],
    openaiApiKey,
    FUNCTION_TOOLS
  );

  let finalText = firstResponse.text;

  if (firstResponse.functionCall) {
    const fnResult = resolveFunction(firstResponse.functionCall.name, firstResponse.functionCall.args);
    const secondResponse = await callOpenAI(
      [
        { role: 'system', content: system },
        ...historyMessages,
        { role: 'user', content: query },
        { role: 'assistant', content: firstResponse.text },
        { role: 'user', content: `[Function ${firstResponse.functionCall.name} result]\n${fnResult}` },
      ],
      openaiApiKey
    );
    finalText = secondResponse.text;
  }

  const confidence = estimateConfidence(retrievedContexts);
  const sources = retrievedContexts.map(({ chunk }) => ({
    pageNumber: chunk.pageNumber,
    chapter: chunk.chapter,
    section: chunk.section,
    excerpt: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '…' : ''),
  }));

  return {
    answer: finalText,
    sources,
    confidence,
    carModel,
    category: retrievedContexts[0]?.chunk.category,
  };
}