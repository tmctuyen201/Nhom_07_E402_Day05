# VinFast Car Assistant — SPEC

**Team 07 · E402 · VinFast Track**

| Member              | MSSV           |
|---------------------|----------------|
| Trịnh Đắc Phú       | 2A202600322    |
| Nguyễn Thị Cẩm Nhung| 2A202600208    |
| Trịnh Minh Công Tuyền | 2A202600324  |

---

## 1. Problem Statement

Sách hướng dẫn sử dụng (Manual) của VinFast dài hàng trăm trang. Khi đang lái xe hoặc gặp sự cố, chủ xe không thể lật sách để tra cứu. Việc không hiểu tính năng (ADAS, sạc pin, đèn cảnh báo) dẫn đến trải nghiệm kém hoặc gây mất an toàn.

---

## 2. AI Product Canvas (from `canvas-template.md`)

|               | Value                                                                                                                                                                                                                                                                                                                                                       | Trust                                                                                                                                                                                                                                                                                                                                                      | Feasibility                                                                                                                                                                                                                                                                                                                     |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Câu hỏi guide** | User nào? Pain gì? AI giải quyết gì mà cách hiện tại không giải được?                                                                                                                                                                                                                                                                                          | Khi AI sai thì user bị ảnh hưởng thế nào? User biết AI sai bằng cách nào? User sửa bằng cách nào?                                                                                                                                                                                                                                                         | Cost bao nhiêu/request? Latency bao lâu? Risk chính là gì?                                                                                                                                                                                                                                                                         |
| **Trả lời**   | Chủ xe VinFast mới (đặc biệt dòng VF8/VF9), chưa quen các tính năng ADAS, sạc pin, cảnh báo taplo. Pain: đang lái hoặc gặp sự cố không thể lật Manual dài hàng trăm trang. Giải pháp hiện tại: gọi tổng đài chờ 5-10 phút hoặc tra cứu thủ công. AI hỏi-đáp bằng giọng nói hoặc chụp ảnh đèn cảnh báo, trả lời ngay lập tức dựa trên Manual chính hãng. | Khi AI trả lời sai → chủ xe thực hiện thao tác sai, có thể gây nguy hiểm hoặc mất bảo hành. User phát hiện sai qua: (1) câu trả lời không hợp lý, (2) nút "Không đúng ý tôi", (3) so sánh Manual được trích dẫn. User sửa bằng: liên hệ showroom hoặc tổng đài VinFast. | Cost: ~$0.005/request (OpenAI API), ~0.1-0.3s latency text, ~1-2s vision RAG. Risk: (1) triệu chứng mơ hồ → gợi ý không chính xác, (2) RAG trả đoạn sai từ Manual, (3) chủ xe dựa hoàn toàn vào AI — cần cảnh báo: "Thông tin chỉ mang tính tham khảo." |

**Automation hay Augmentation?** ☑ Augmentation — AI gợi ý, user quyết định cuối cùng.

---

## 3. Architecture

```
User Input (text / image)
    │
    ▼
┌──────────────────────────────────────┐
│  Orchestrator Agent                   │
│  ┌────────────────────────────────┐  │
│  │ 1. Safety Check (query)         │  │
│  └────────────────────────────────┘  │
│           │                           │
│    ┌──────┴──────┐                    │
│    ▼             ▼                    │
│ Vision Agent  Retrieval Agent         │
│  (image)       (RAG)                 │
│    │             │                   │
│    └──────┬──────┘                    │
│           ▼                           │
│  ┌────────────────────────────────┐   │
│  │ 2. Safety Check (response)     │   │
│  └────────────────────────────────┘   │
│           │                           │
│           ▼                           │
│  ┌────────────────────────────────┐   │
│  │ 3. RAG Synthesizer             │   │
│  │ (gpt-4o-mini + function calls)│   │
│  └────────────────────────────────┘   │
└──────────────────────────────────────┘
    │
    ▼
  UI Response (answer + citations)
```

### 3.1 Agents

| Agent          | Role                                              | Model          |
|---------------|---------------------------------------------------|----------------|
| **Orchestrator** | Coordinates all agents, main conversation loop     | gpt-4o-mini   |
| **Retrieval**   | Analyzes query, manages RAG retrieval              | gpt-4o-mini   |
| **Vision**      | Analyzes dashboard warning light images            | gpt-4o-mini (vision) |
| **Safety**      | Validates queries and responses for safety risks   | gpt-4o-mini   |

### 3.2 Tech Stack

| Layer        | Technology                |
|--------------|---------------------------|
| UI           | React 18 + TypeScript     |
| Build        | Vite 6                    |
| LLM          | OpenAI gpt-4o-mini        |
| RAG          | Custom embedding + retrieval (no external vector DB) |
| Function Calls | OpenAI function calling  |
| Styling      | CSS (custom, no Tailwind)  |

---

## 4. Touchpoints

| Touchpoint | Interaction                           | Description                                          |
|------------|--------------------------------------|------------------------------------------------------|
| **Chat UI** | Text input + send                    | Main interface, multi-turn conversation              |
| **Image Upload** | Camera icon + file picker        | Upload dashboard warning light images                |
| **Quick Actions** | Category button row             | Pre-filled queries for common categories            |
| **Car Selector** | VF8 / VF9 toggle                | Switch knowledge base context                       |
| **Feedback** | 👍 👎 buttons on each message       | Learning signal collection                          |

---

## 5. User Stories (4 Paths)

| Path              | Scenario                                          | AI Response                                           |
|-------------------|---------------------------------------------------|-------------------------------------------------------|
| **Happy Path**    | "Cách mở cốp bằng đá chân?"                        | 3-step guide with page citation                       |
| **Low-confidence**| Query about after-market parts                    | "Tính năng này không có trong tài liệu chính hãng. Liên hệ showroom." |
| **Failure**       | AI misinterprets "Lốp" as "Loa"                   | Show "Không đúng ý tôi" button → category picker      |
| **Correction**    | User corrects: "Ý tôi là áp suất lốp"             | Acknowledge + provide correct tire pressure info     |

---

## 6. Edge Cases

| Edge Case                  | Handling                                                |
|----------------------------|---------------------------------------------------------|
| Off-topic query            | Polite redirect: "Tôi chỉ hỗ trợ về xe VinFast..."     |
| No relevant context found  | Low-confidence response + showroom contact suggestion   |
| Image with no match        | Vision agent returns uncertainty + safety tip           |
| Ambiguous query            | Ask clarifying question via follow-up                  |
| Rate limit exceeded        | Show countdown + suggest retry                         |
| API error                  | Retry up to 3x, then show error with retry button       |
| Empty knowledge base       | Graceful degradation with offline mode message          |
| Low similarity scores      | Skip context, warn user about limited info             |
| Safety risk detected       | Block response + safety warning + escalation guidance   |
| Very long query            | Truncate to 500 chars + notify user                     |
| Unsupported image format   | Accept PNG/JPEG/WEBP only, show format error           |

---

## 7. Learning Signals

| Signal            | Collection Method                      | Use Case                          |
|-------------------|----------------------------------------|-----------------------------------|
| User correction   | "Không đúng ý tôi" button → text field  | Precision evaluation, retrieval improvement |
| Thumbs up/down    | Feedback buttons on each message        | Precision@K, model quality tracking |
| Category heatmap  | Track query categories over time       | Feedback to VinFast for UI/UX optimization |
| Source citations clicked | Track which sources user expands | RAG quality assessment |

**Marginal value:** GPT-4o-mini knows VinFast at a general level. Marginal value = internal Manual data (pages, chapters, illustrations) not in public model.

---

## 8. RAG Pipeline

```
Query → Embedding (TF-IDF, 300-dim) → Top-K Retrieval
  → Context Assembly → gpt-4o-mini (function calls)
  → Synthesized Answer + Citations
```

- **Embedding:** Custom TF-IDF vectorizer (300 dimensions) — no external API needed
- **Retrieval:** Cosine similarity, top-K=5, threshold=0.3
- **Synthesis:** gpt-4o-mini, temperature=0.3, max_tokens=800
- **Function calls:** `get_warning_light_info`, `get_adas_feature_info`, `get_charging_guide`
- **Knowledge base:** ~30 pre-loaded chunks covering VF8/VF9 across 6 categories

---

## 9. Function Calling Schema

```typescript
// Tool: get_warning_light_info
get_warning_light_info({ name: string }) → { description, urgency, actions }

// Tool: get_adas_feature_info
get_adas_feature_info({ feature: string }) → { description, how_to_use, precautions }

// Tool: get_charging_guide
get_charging_guide({ batteryLevel: number }) → { recommendation, estimated_time, tips }
```

---

## 10. Acceptance Criteria

- [ ] User can type a question and receive an AI answer with Manual citations
- [ ] User can upload an image of a dashboard warning light
- [ ] User can switch between VF8 and VF9 knowledge bases
- [ ] "Không đúng ý tôi" button logs feedback and clears conversation
- [ ] All AI responses include disclaimer: "Thông tin chỉ mang tính tham khảo"
- [ ] Off-topic queries receive polite redirection
- [ ] Safety-relevant queries trigger safety agent check
- [ ] Source citations show page numbers and chapter titles
- [ ] Quick action buttons pre-fill relevant queries
- [ ] Typing indicator shows during AI processing
- [ ] API key can be entered via Settings panel
- [ ] Project runs with `npm install && npm run dev`
