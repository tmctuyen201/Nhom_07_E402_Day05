# VinFast Car Assistant

Trợ lý AI đồng hành cùng xe VinFast VF7 / VF8 / VF9 — hỏi đáp Manual, tìm trạm sạc, theo dõi bảo dưỡng, và hơn thế nữa.

---

## 🏗️ Kiến trúc

```
Frontend (React 18 + TypeScript)          Backend (Python FastAPI)
──────────────────────────────            ─────────────────────────
http://localhost:3000          ──proxy──  http://127.0.0.1:8000
                                                 │
           ┌──────────────────────────────┐     │
           │     Multi-Agent Pipeline     │     │
           │  core/safety.py              │     │
           │  core/intent.py              │     │
           │  rag/db.py  (TF-IDF RAG)     │     │
           │  llm/openai.py               │     │
           │  tools/vehicle.py             │     │
           │  tools/location.py           │     │
           └──────────────────────────────┘     │
                                                 │
                        ┌────────────────────────┐
                        │ SQLite rag.db           │
                        │ (31 chunks hardcoded KB)│
                        └────────────────────────┘
```

**Frontend** chạy trên Vite (port 3000), proxy tất cả `/api/*` sang backend.
**Backend** chạy uvicorn (port 8000), xử lý intent classification, RAG retrieval, LLM synthesis, và tất cả tools.

---

## 🚀 Quick Start

```bash
# 1. Cài đặt
cd vinfast-assistant
npm install
cd backend && pip install -r requirements.txt

# 2. Cấu hình
cp .env.example .env
# Mở .env, điền OPENAI_API_KEY=sk-...  (User key từ platform.openai.com/api_keys)
# Tùy chọn: SERPAPI_KEY=... (cho tính năng tìm trạm sạc / quán ăn)

# 3. Chạy (2 terminal)
# Terminal 1 — Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
npm run dev

# Hoặc chạy cả hai cùng lúc
npm start
```

Mở **http://localhost:3000** — nhập API key và bắt đầu hỏi.

---

## 📁 Cấu trúc dự án

```
vinfast-assistant/
├── backend/
│   ├── main.py              ← FastAPI entry, 9 routes
│   ├── config.py            ← Env vars (LLM, RAG, SerpAPI, server)
│   ├── requirements.txt
│   ├── rag.db               ← SQLite RAG database (tạo bởi rag/ingest.py)
│   │
│   ├── core/                ← Agent pipeline
│   │   ├── orchestrator.py  ← Safety → RAG → LLM synthesis
│   │   ├── safety.py         ← Rate limit, off-topic, dangerous instruction
│   │   ├── intent.py         ← LLM-powered intent classifier (6 classes)
│   │   ├── prompts.py        ← Vietnamese system prompts
│   │   └── types.py          ← Shared dataclasses
│   │
│   ├── rag/                 ← Retrieval-Augmented Generation
│   │   ├── db.py             ← SQLite retrieval + lazy TF-IDF cache
│   │   ├── embeddings.py      ← sklearn TF-IDF (không cần API)
│   │   ├── knowledge_base.py ← 31 hardcoded chunks (VF8/VF9 manual)
│   │   └── ingest.py          ← Markdown → SQLite pipeline
│   │
│   ├── llm/                 ← LLM providers
│   │   ├── openai.py         ← Chat Completions + function calling
│   │   └── anthropic.py       ← Claude Messages API + function calling
│   │
│   └── tools/                ← Tool functions (no API required)
│       ├── vehicle.py         ← Warning lights, ADAS, charging, maintenance
│       ├── location.py        ← SerpAPI tìm trạm sạc + static fallback
│       ├── places.py          ← SerpAPI tìm quán ăn + Nominatim chỉ đường
│       └── registry.py        ← Tool definitions + dispatch
│
├── src/
│   ├── App.tsx               ← Root component, UI shell
│   ├── hooks/useAgent.ts     ← Core hook: intent → tool → LLM → history
│   │
│   ├── components/
│   │   ├── ChatMessage.tsx    ← Bubble, markdown, tool result cards
│   │   ├── ChatInput.tsx      ← Text, image upload, char counter
│   │   ├── CarModelSelector.tsx
│   │   ├── QuickActions.tsx    ← 5 category chips + warning lights modal
│   │   ├── SettingsPanel.tsx
│   │   ├── MaintenanceTracker.tsx
│   │   ├── ChargingStationFinder.tsx
│   │   ├── SessionHistory.tsx
│   │   └── UserProfileSetup.tsx
│   │
│   └── lib/
│       ├── memory/           ← localStorage persistence
│       │   ├── memory.ts      ← Session ID, history, LLM context builder
│       │   ├── sessions.ts    ← Multi-session storage (max 20)
│       │   └── userProfile.ts ← User profile (name, variant, km)
│       ├── agents/           ← Frontend agent system (stubs/wired)
│       │   ├── orchestrator-agent.ts  ← (frontend orchestrator, not in prod path)
│       │   ├── retrieval-agent.ts     ← (stub — ready to wire to vector DB)
│       │   ├── safety-agent.ts
│       │   └── vision-agent.ts
│       └── rag/               ← Frontend RAG (hardcoded, no external deps)
│           ├── embeddings.ts
│           ├── knowledge-base.ts
│           └── synthesizer.ts
```

---

## 🎯 Tính năng

| Tính năng | Mô tả |
|-----------|--------|
| **Hỏi đáp Manual** | Hỏi về tính năng, vận hành, bảo dưỡng — nhận câu trả lời kèm trích dẫn trang |
| **Intent Classification** | LLM phân loại intent → chọn tool phù hợp (greeting / car_assistant / tìm trạm sạc / tìm quán ăn / chỉ đường) |
| **Đèn cảnh báo** | Gửi ảnh taplo → Vision agent nhận diện đèn cảnh báo |
| **Tìm trạm sạc** | GPS + SerpAPI → trạm sạc VinFast gần nhất (fallback 6 điểm tĩnh) |
| **Tìm quán ăn / ATM** | SerpAPI Google Places tìm quán gần vị trí hiện tại |
| **Chỉ đường** | Nominatim geocoding → Google Maps URL |
| **Pin & tầm di chuyển** | Tính km còn lại theo % pin, theo dòng xe |
| **Bảo dưỡng** | Theo dõi 12 hạng mục theo km — cảnh báo quá hạn |
| **Multi-session** | Tối đa 20 phiên chat, lọc theo dòng xe |
| **User Profile** | Lưu tên, dòng xe, số km → context cho LLM |
| **Memory** | Chat history tồn tại qua page reload (localStorage) |

---

## 🔌 API Endpoints

| Method | Route | Mô tả |
|--------|-------|-------|
| `GET` | `/api/health` | Trạng thái server, model, số chunks |
| `POST` | `/api/intent` | Phân loại intent từ query (LLM, 80 tokens) |
| `POST` | `/api/agent` | Hỏi đáp chính — safety → RAG → LLM → tools |
| `POST` | `/api/nearby-stations` | Tìm trạm sạc / trung tâm dịch vụ gần GPS |
| `POST` | `/api/search-places` | Tìm quán ăn, cà phê, ATM gần GPS |
| `POST` | `/api/directions` | Geocode địa điểm → Google Maps URL |
| `POST` | `/api/feedback` | Gửi feedback (thumbs up/down) |
| `GET` | `/api/feedback/export` | Export log feedback (100 bản ghi gần nhất) |
| `GET` | `/api/knowledge/stats` | Thống kê knowledge base |
| `POST` | `/api/ingest` | Chạy lại ingest pipeline (tạo rag.db) |

---

## ⚙️ Cấu hình `.env`

```env
LLM_PROVIDER=openai          # "openai" | "anthropic"
LLM_MODEL=gpt-4o-mini        # Model cho synthesis
OPENAI_API_KEY=sk-...        # User key (từ platform.openai.com/api_keys)
# ANTHROPIC_API_KEY=sk-ant-...  # Dùng khi LLM_PROVIDER=anthropic

EMBEDDING_MODEL=text-embedding-3-small
TOP_K=5
SIMILARITY_THRESHOLD=0.3
MAX_TOKENS=800

SERPAPI_KEY=                  # Tùy chọn — cho tìm trạm sạc / quán ăn live
PORT=8000
```

---

## 🔑 Multi-Agent Pipeline (Backend)

```
User query
    │
    ▼
1. Intent Classifier (LLM)
   └── 6 classes: greeting | car_assistant | find_charging_stations |
       find_service_centers | search_places | get_directions
    │
    ▼ (if car_assistant)
2. Safety Agent
   ├── Rate limit (10 req/min)
   ├── Off-topic block (7 patterns)
   └── Dangerous instruction block
    │
    ▼ (if allowed)
3. RAG Retrieval
   ├── SQLite rag.db (TF-IDF cosine similarity)
   └── Fallback: 31 hardcoded chunks (VF8/VF9)
    │
    ▼
4. LLM Synthesis (OpenAI gpt-4o-mini hoặc Claude)
   ├── System prompt (Vietnamese, user context)
   ├── RAG context chunks
   ├── Conversation history (20 messages)
   └── Function tools → tool_call loop
    │
    ▼
Tool Action Signal → Frontend renders interactive widget
```

---

## 🛠️ Các công cụ (Tools)

| Tool | Input | Output |
|------|-------|--------|
| `get_warning_light_info` | Tên đèn (check engine, brake, TPMS...) | Mô tả + hành động |
| `get_adas_feature_info` | Tên tính năng (LKA, ACC, AEB, BSM...) | Mô tả + tốc độ hoạt động |
| `get_charging_guide` | % pin hiện tại | Hướng dẫn sạc theo mức pin |
| `calculate_battery_range` | % pin, dòng xe | km còn lại + `__tool_action__` |
| `get_maintenance_schedule` | dòng xe, km hiện tại | 12 hạng mục + status + `__tool_action__` |
| `find_nearby_stations` | lat, lng, loại (charging/service), bán kính | Danh sách trạm |
| `search_places` | lat, lng, keyword, limit | Danh sách địa điểm |
| `get_directions` | destination text | Google Maps URL |

---

## ⚠️ Edge Cases & Lưu ý

| Tình huống | Xử lý |
|-----------|--------|
| Câu hỏi ngoài lề | Lịch sự từ chối: "Tôi chỉ hỗ trợ về xe VinFast..." |
| Không tìm thấy context | Low-confidence response + gợi ý liên hệ showroom |
| SerpAPI key không có | Fallback: 6 trạm sạc tĩnh (HCM, HN, Đà Nẵng, Cần Thơ) |
| Rate limit (429) | Countdown 60s trên UI + auto-retry |
| Không có API key | Gửi qua `Authorization: Bearer <key>` header từ frontend |
| GPS bị từ chối | Thông báo lỗi rõ ràng theo từng mã lỗi Geolocation |

---

## 📊 Cấu hình mặc định

| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `LLM_PROVIDER` | `openai` | Provider: `openai` hoặc `anthropic` |
| `LLM_MODEL` | `gpt-4o-mini` | Model cho synthesis |
| `TOP_K` | `5` | Số chunks context tối đa |
| `SIMILARITY_THRESHOLD` | `0.3` | Ngưỡng similarity tối thiểu |
| `MAX_TOKENS` | `800` | Max tokens cho response |
| `PORT` | `8000` | Port backend |

---

## 👥 Đội ngũ

| Họ tên | MSSV |
|--------|------|
| Trịnh Đắc Phú | 2A202600322 |
| Nguyễn Thị Cẩm Nhung | 2A202600208 |
| Trịnh Minh Công Tuyền | 2A202600324 |

---

License: Educational project — VinAI Day 04, Team 07, E402.