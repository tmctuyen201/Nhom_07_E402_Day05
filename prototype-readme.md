# Prototype — VinFast Car Assistant

## Mô tả

Web chatbot hỗ trợ chủ xe VinFast VF8/VF9 tra cứu Manual, tính phạm vi di chuyển theo % pin, kiểm tra lịch bảo dưỡng, tìm trạm sạc/dịch vụ gần nhất qua GPS, và chỉ đường. Hỗ trợ voice input với wake word "Hey VinFast".

## Level: Working prototype

- RAG pipeline chạy thật: 1,487 chunks từ Manual VF8/VF9 (EN+VI), TF-IDF + SQLite
- LLM chạy thật: OpenAI gpt-4o-mini cho intent classification + synthesis + tool calls
- Location tools chạy thật: SerpAPI Google Maps + Nominatim geocoding
- Voice input chạy thật: Web Speech API (Chrome/Edge)

## Links

- **GitHub repo nhóm:** https://github.com/tmctuyen201/Nhom_07_E402_Day05
- **Source code:** `vinfast-assistant/` trong repo
- **Demo video (backup):**

## Tools

- UI: React 18, TypeScript, Vite
- Backend: FastAPI, Python 3.11
- AI: OpenAI gpt-4o-mini
- RAG: TF-IDF (scikit-learn) + SQLite
- Location: SerpAPI Google Maps + Nominatim (free)
- Voice STT: Web Speech API (browser native)
- Wake word: Web Speech API polling bursts

## Phân công

| Thành viên            | MSSV        | Phần                                                          | Output                                                                                                        |
| --------------------- | ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Trịnh Đắc Phú         | 2A202600322 | System prompt, RAG pipeline, backend architecture, tool calls | `backend/core/`, `backend/tools/vehicle.py`, `backend/llm/`                                                   |
| Trần Hữu Gia Huy      | 2A202600426 | Intent classifier, location tools, voice (STT/wake word)      | `backend/core/intent.py`, `backend/tools/places.py`, `src/hooks/useVoiceInput.ts`, `src/hooks/useWakeWord.ts` |
| Nguyễn Thị Cẩm Nhung  | 2A202600208 | Data crawling + cleaning, ingest pipeline, knowledge base     | `articles/`, `backend/rag/ingest.py`, `backend/rag/db.py`                                                     |
| Trịnh Minh Công Tuyền | 2A202600324 | Frontend UI, inline tool cards, session history, user profile | `src/components/`, `src/hooks/useAgent.ts`, `src/lib/memory/`                                                 |

## Cách chạy

```bash
# Backend
cd vinfast-assistant
pip install -r requirements.txt
python -m backend.rag.ingest
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Frontend (terminal khác)
npm install
npm run dev
```

Cần: OpenAI API key trong `.env` (`OPENAI_API_KEY=sk-...`). SerpAPI key tùy chọn (`SERPAPI_KEY=...`).
