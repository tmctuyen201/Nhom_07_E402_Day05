# VinFast Car Assistant

Assistant hỏi-đáp xe VinFast dựa trên sách Manual, dùng **RAG (Retrieval-Augmented Generation)** với **OpenAI gpt-4o-mini** và multi-agent system.

> Xem chi tiết kiến trúc, edge cases, và learning signals tại [SPEC.md](./SPEC.md).

---

## Quick Start

```bash
# 1. Cài đặt dependencies
npm install

# 2. Copy cấu hình
cp .env.example .env

# 3. Thêm OpenAI API key vào .env
# OPENAI_API_KEY=sk-...

# 4. Chạy cả frontend + backend cùng lúc (2 terminal)
# Terminal 1 — Backend API server (port 8000)
npm run server

# Terminal 2 — Frontend dev server (port 3000)
npm run dev

# Hoặc chạy cả hai cùng lúc (cần concurrently):
npm start
```

Mở [http://localhost:3000](http://localhost:3000) — nhập OpenAI API key trong giao diện hoặc file `.env`.

---

## Tính năng chính

| Tính năng | Mô tả |
|-----------|--------|
| **Hỏi-đáp Manual** | Hỏi về tính năng xe VinFast, nhận câu trả lời kèm trích dẫn trang Manual |
| **Chụp ảnh đèn cảnh báo** | Upload ảnh taplo/dashboard, AI nhận diện đèn cảnh báo |
| **Chọn dòng xe** | VF8 / VF9 — mỗi dòng có knowledge base riêng |
| **Quick Actions** | Nút nhanh cho các danh mục: đèn cảnh báo, sạc pin, ADAS, an toàn, bảo dưỡng |
| **Feedback** | Nút 👍👎 trên mỗi câu trả lời + nút "Không đúng ý tôi" |
| **Trích dẫn nguồn** | Mỗi câu trả lời kèm số trang và chương từ Manual |
| **Cảnh báo an toàn** | Safety Agent kiểm tra trước khi trả lời về các vấn đề an toàn |
| **Augmentation (không Automation)** | AI gợi ý, user quyết định — không làm thay user |

---

## Kiến trúc

```
src/
├── lib/
│   ├── agents/          # Multi-agent system
│   │   ├── orchestrator-agent.ts   # Điều phối chính
│   │   ├── retrieval-agent.ts       # RAG retrieval
│   │   ├── vision-agent.ts          # Xử lý ảnh đèn cảnh báo
│   │   ├── safety-agent.ts          # Kiểm tra an toàn
│   │   └── types.ts
│   ├── rag/             # RAG pipeline
│   │   ├── knowledge-base.ts        # Knowledge base VF8/VF9
│   │   ├── embeddings.ts            # Embedding + retrieval
│   │   ├── synthesizer.ts          # LLM synthesis
│   │   └── index.ts
│   └── utils.ts
├── components/          # React components
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── CarModelSelector.tsx
│   ├── QuickActions.tsx
│   └── SettingsPanel.tsx
├── hooks/
│   └── useAgent.ts
└── App.tsx
```

---

## Multi-Agent System

```
User Input
    │
    ▼
Orchestrator Agent
    ├── Safety Check (query)
    ├── Vision Agent (nếu có ảnh)
    ├── Retrieval Agent (RAG)
    ├── Safety Check (response)
    └── RAG Synthesizer ──► UI Response
```

1. **Safety Agent (query):** Kiểm tra query có liên quan đến VinFast không, có risk không
2. **Vision Agent:** Nếu có ảnh → nhận diện đèn cảnh báo → trả về mô tả + độ khẩn cấp
3. **Retrieval Agent:** Phân tích query → chọn retrieval strategy → lấy context từ knowledge base
4. **Safety Agent (response):** Kiểm tra câu trả lời có an toàn không
5. **RAG Synthesizer:** Gọi gpt-4o-mini với context + function calling → trả lời kèm citations

---

## Edge Cases

| Tình huống | Xử lý |
|-----------|--------|
| Câu hỏi ngoài lề | Redirect lịch sự: "Tôi chỉ hỗ trợ về xe VinFast..." |
| Không tìm thấy context | Low-confidence response + gợi ý liên hệ showroom |
| Ảnh không khớp | Vision Agent trả về uncertainty + safety tip |
| Ambiguous query | Hỏi lại user để làm rõ |
| Rate limit | Hiện countdown + nút retry |
| Safety risk | Block + cảnh báo an toàn + hướng dẫn liên hệ tổng đài |

---

## Cấu hình

| Biến môi trường | Mặc định | Mô tả |
|----------------|----------|--------|
| `OPENAI_API_KEY` | — | **Required.** OpenAI API key |
| `CHAT_MODEL` | `gpt-4o-mini` | Model cho synthesis |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Model cho embedding |
| `TOP_K` | `5` | Số chunks context tối đa |
| `SIMILARITY_THRESHOLD` | `0.3` | Ngưỡng similarity tối thiểu |
| `MAX_TOKENS` | `800` | Max tokens cho response |

---

## Learning Signals

Dữ liệu học được thu thập qua:

1. **Thumbs up/down** → Precision@K, đánh giá chất lượng model
2. **"Không đúng ý tôi"** → Correction logs → cải thiện retrieval
3. **Category heatmap** → Tính năng nào được hỏi nhiều → feedback cho VinFast

Xem logs: Settings → Export Feedback Logs

---

## Đội ngũ

| Họ tên | MSSV |
|--------|------|
| Trịnh Đắc Phú | 2A202600322 |
| Nguyễn Thị Cẩm Nhung | 2A202600208 |
| Trịnh Minh Công Tuyền | 2A202600324 |

---

## License

Educational project — VinAI Day 04, Team 07, E402.
