# SPEC — Nhóm 07 · E402 · VinFast Car Assistant

**Nhóm:** Nhom07-E402
**Track:** ☑ VinFast
**Problem statement:** Chủ xe VinFast (VF8/VF9) không thể tra Manual 300+ trang khi đang lái hoặc gặp sự cố — AI trả lời tức thì bằng giọng nói hoặc text, dựa trên Manual chính hãng đã được index.

---

## 1. AI Product Canvas

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | **User:** Chủ xe VinFast VF8/VF9, đặc biệt người mới mua. **Pain:** Manual 300+ trang không thể tra khi đang lái. Tổng đài chờ 5–10 phút. Không hiểu đèn cảnh báo → nguy hiểm. **AI giải:** Hỏi-đáp tức thì bằng text hoặc giọng nói (wake word "Hey VinFast"), trả lời dựa trên Manual chính hãng (1,487 chunks đã index). Ngoài ra: tính phạm vi di chuyển theo % pin, kiểm tra lịch bảo dưỡng theo km, tìm trạm sạc/dịch vụ gần nhất qua GPS + SerpAPI, chỉ đường qua Nominatim + Google Maps. | **Khi AI sai:** Chủ xe thực hiện thao tác sai → hỏng xe hoặc mất an toàn (ví dụ: hiểu nhầm đèn phanh). **User phát hiện sai qua:** (1) Câu trả lời không hợp lý với thực tế xe. (2) Nút 👍/👎 feedback sau mỗi câu trả lời. (3) Nguồn trích dẫn hiển thị rõ (source file, section) — user đối chiếu Manual. (4) Confidence badge (Cao/Trung bình/Thấp). **User sửa bằng:** Nhắn đính chính ngay trong chat (AI nhớ 20 tin nhắn gần nhất). Hoặc liên hệ hotline VinFast 1900 232 389 (AI luôn nhắc cuối câu trả lời kỹ thuật). | **Cost thực tế:** ~$0.003–0.008/request (gpt-4o-mini, intent classify + RAG synthesis). **Latency:** Intent classify ~200ms, RAG retrieve ~50ms (TF-IDF local SQLite), LLM synthesis ~800ms–1.5s. Tổng ~1–2s. **Infrastructure:** SQLite RAG DB (1,487 chunks, VF8/VF9, EN+VI), TF-IDF local — không cần vector DB trả phí. **Risk chính:** (1) STT tiếng Việt nhận sai → query sai → RAG miss. (2) TF-IDF kém hơn embedding cho câu hỏi ngữ nghĩa phức tạp. (3) SerpAPI key hết quota → fallback static list. (4) Web Speech API chỉ hoạt động Chrome/Edge. |

**Automation hay augmentation?** ☑ Augmentation

**Justify:** Mọi hành động (sạc xe, xử lý đèn cảnh báo, đặt lịch bảo dưỡng) đều do chủ xe tự thực hiện. AI chỉ cung cấp thông tin và hướng dẫn. Với cảnh báo an toàn (phanh, pin cao áp), AI luôn kèm "DỪNG XE NGAY" và hotline — không để user tự phán đoán.

**Learning signal:**

1. **User correction đi vào đâu?** Thumbs up/down sau mỗi message → `POST /api/feedback` → lưu (message_id, query, ai_answer, vote, timestamp). Export qua `GET /api/feedback/export`. Dùng để đánh giá retrieval quality và cải thiện prompt.
2. **Product thu signal gì?** (1) Tỷ lệ 👎 / tổng request theo category (ADAS, charging, warning...). (2) Intent classification accuracy — so sánh intent được classify vs. tool thực sự được gọi. (3) Tần suất câu hỏi theo feature → heatmap → feedback cho đội sản xuất VinFast. (4) Fallback rate (bao nhiêu % query trả về LOW_CONTEXT_MSG).
3. **Data thuộc loại nào?** ☑ User-specific (hồ sơ: tên, dòng xe, số km — lưu localStorage) · ☑ Domain-specific (Manual VF8/VF9, EN+VI, 1,487 chunks) · ☑ Human-judgment (thumbs feedback)

**Có marginal value không?** GPT-4o biết VinFast ở mức chung chung. Marginal value nằm ở: (1) Manual nội bộ đã được chunk + index (trang, section, ngôn ngữ). (2) Tool calls chuyên biệt: battery range calculator với spec thực tế VF8/VF9, maintenance schedule theo km chuẩn VinFast. (3) User profile gắn với dòng xe cụ thể — context cá nhân hóa mà ChatGPT không có.

---

## 2. User Stories — 4 paths

### Feature 1: RAG Q&A — Hỏi đáp về xe từ Manual

**Trigger:** User nhập câu hỏi hoặc nói "Hey VinFast, [câu hỏi]" → Intent classifier → RAG retrieve → LLM synthesis → trả lời kèm source.

| Path | Câu hỏi thiết kế | Mô tả |
|------|------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | User hỏi "Đèn TPMS là gì?" → AI trả lời đúng: "Áp suất lốp thấp, bơm theo tem cửa 38 PSI" + source "Manual VF8 > Wheels and Tires" + confidence badge "Cao". User đọc, thực hiện. |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? | Confidence badge "Thấp" hiển thị. AI thêm "Thông tin chỉ mang tính tham khảo. Liên hệ hotline VinFast 1900 232 389 để được hỗ trợ chính xác nhất." |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | AI hiểu nhầm "lốp" thành "loa" → trả lời về âm thanh. User thấy không liên quan → nhấn 👎 → nhắn lại "ý tôi là áp suất lốp" → AI nhớ context, trả lời đúng. |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | User nhắn đính chính trong chat → AI dùng conversation history 20 tin nhắn để hiểu context mới. Correction log vào feedback endpoint. |

### Feature 2: Tool calls — Battery Range Calculator + Maintenance Schedule

**Trigger:** User hỏi "pin 45% đi được bao xa?" hoặc "xe 25000km cần bảo dưỡng gì?" → LLM gọi tool → render widget inline trong chat.

| Path | Câu hỏi thiết kế | Mô tả |
|------|------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? | "Pin VF8 45% normal mode → 312km còn lại" — Battery Range Card với bar chart, advice "Pin đủ cho hành trình bình thường". Maintenance Card: checklist 11 hạng mục, màu xanh/vàng/đỏ theo trạng thái. |
| Low-confidence — AI không chắc | System báo thế nào? | Driving mode không được chỉ định → AI dùng "normal" mặc định, ghi chú "Kết quả theo chế độ lái normal. Thực tế có thể khác tùy điều kiện đường." |
| Failure — AI sai | User biết sai bằng cách nào? | User nhập km sai (ví dụ 250000 thay vì 25000) → maintenance schedule hiện toàn bộ "Quá hạn" → user nhận ra, nhập lại. |
| Correction — user sửa | User sửa bằng cách nào? | User nhắn lại với km đúng → tool được gọi lại với params mới → widget cập nhật. |

### Feature 3: Location tools — Tìm trạm sạc / chỉ đường

**Trigger:** User hỏi "trạm sạc gần tôi" hoặc "chỉ đường đến Hồ Hoàn Kiếm" → Intent classifier → GPS + SerpAPI / Nominatim → render card.

| Path | Câu hỏi thiết kế | Mô tả |
|------|------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? | Station Card: 5–10 trạm sạc gần nhất, mỗi trạm có tên, địa chỉ, rating, open/closed badge, nút "🗺 Chỉ đường" mở Google Maps. Directions Card: tên địa điểm + nút "Mở Google Maps chỉ đường". |
| Low-confidence — AI không chắc | System báo thế nào? | SerpAPI không có key → badge "⚠ Static" thay vì "✓ Live". User biết đây là danh sách tĩnh, không real-time. |
| Failure — AI sai | User biết sai bằng cách nào? | GPS bị từ chối → error card "Bạn đã từ chối quyền truy cập vị trí" + nút "Thử lại". Nominatim không tìm thấy địa điểm → fallback Google Maps text search. |
| Correction — user sửa | User sửa bằng cách nào? | Nhấn "Thử lại" trên error card → chạy lại tool. Hoặc nhắn lại với địa điểm cụ thể hơn. |

---

## 3. Eval metrics + threshold

**Optimize precision hay recall?** ☑ Precision

**Tại sao?** Trả lời sai về kỹ thuật xe (đèn cảnh báo, quy trình sạc) → chủ xe thực hiện thao tác sai → hỏng xe hoặc mất an toàn. False positive (trả lời sai tự tin) nguy hiểm hơn false negative (nói "tôi không chắc, liên hệ showroom").

**Nếu sai ngược lại (chọn recall):** AI trả lời nhiều hơn nhưng sai nhiều hơn → chủ xe mất niềm tin, hoặc tệ hơn là làm theo hướng dẫn sai.

| Metric | Threshold | Red flag (dừng khi) |
|--------|-----------|---------------------|
| Precision câu trả lời kỹ thuật (đúng/tổng trả lời) | ≥85% | <70% trong 1 tuần → review lại RAG chunks |
| Thumbs down rate (👎 / tổng response) | <15% | >30% → prompt hoặc retrieval có vấn đề |
| Fallback rate (LOW_CONTEXT_MSG / tổng query) | <20% | >40% → knowledge base thiếu coverage |

---

## 4. Top 3 failure modes

| # | Trigger | Hậu quả | Mitigation |
|---|---------|---------|------------|
| 1 | **STT nhận sai tiếng Việt** — user nói "đèn phanh" nhưng STT nhận thành "đèn tranh" hoặc "đèn bành" | RAG query sai → không tìm được chunk liên quan → trả về LOW_CONTEXT_MSG hoặc câu trả lời không liên quan. **User không biết bị sai** nếu câu trả lời nghe có vẻ hợp lý. | (1) Hiển thị transcript STT trong input box để user xác nhận trước khi gửi. (2) Confidence badge "Thấp" khi RAG score thấp. (3) Luôn kèm "Liên hệ hotline 1900 232 389" cho câu hỏi an toàn. |
| 2 | **RAG trả về chunk sai model xe** — user hỏi về VF9 nhưng RAG retrieve chunk của VF8 do similarity cao | AI trả lời thông số sai (ví dụ: range 460km thay vì 594km, hoặc quy trình sạc khác). User có thể không biết sai nếu không đối chiếu Manual. | (1) Filter RAG theo car_model được chọn trong header (VF8/VF9). (2) Hiển thị source file rõ ràng — user thấy "Manual VF8" khi đang hỏi về VF9 → biết cần kiểm tra lại. (3) User profile lưu dòng xe → inject vào system prompt. |
| 3 | **Tool call battery range với driving mode sai** — user hỏi "pin 45% đi được bao xa" khi đang chạy highway nhưng AI dùng "normal" mode mặc định | Ước tính range cao hơn thực tế ~20% → user không sạc kịp, hết pin giữa đường. | (1) Khi không có driving mode → AI hỏi lại "Bạn đang chạy chế độ nào? (eco/normal/sport/highway)". (2) Hiển thị range cho cả 4 mode trong Battery Range Card để user tự chọn. (3) Thêm disclaimer "Kết quả ước tính, thực tế phụ thuộc điều kiện đường và thời tiết." |

---

## 5. ROI 3 kịch bản

|   | Conservative | Realistic | Optimistic |
|---|-------------|-----------|------------|
| **Assumption** | 50 user/ngày, 40% dùng thường xuyên, 3 query/session | 300 user/ngày, 65% dùng thường xuyên, 5 query/session | 1000 user/ngày, 80% dùng thường xuyên, 7 query/session |
| **Cost** | ~$3/ngày (API: 60 queries × $0.005) | ~$97/ngày (975 queries × $0.005 + SerpAPI) | ~$350/ngày (5600 queries × $0.005 + infra) |
| **Benefit** | Mỗi user tiết kiệm 8 phút/ngày (thay vì gọi tổng đài 10 phút) → 20 user × 8 phút = 160 phút/ngày tiết kiệm. Quy đổi: ~$27/ngày (160 phút × $10/giờ) | 195 user × 8 phút = 1,560 phút/ngày → ~$260/ngày | 800 user × 8 phút = 6,400 phút/ngày → ~$1,067/ngày |
| **Net** | +$24/ngày (marginal) | +$163/ngày | +$717/ngày |

**Kill criteria:** Thumbs down rate >30% trong 2 tuần liên tục (chất lượng quá kém), hoặc cost > benefit 3 tháng liên tục (không scale được). Ngoài ra: nếu VinFast ra app chính thức với tính năng tương tự → pivot sang tích hợp thay vì standalone.

**Lưu ý:** ROI thực tế của VinFast không chỉ là tiết kiệm thời gian user — còn là giảm tải tổng đài, tăng NPS, và data về tính năng nào user hỏi nhiều nhất để cải thiện xe/OTA.

---

## 6. Mini AI spec

**VinFast Car Assistant** là trợ lý lái xe thông minh cho chủ xe VinFast VF8/VF9. Product giải quyết một pain point cụ thể: Manual 300+ trang không thể tra khi đang lái hoặc gặp sự cố.

**Cho ai:** Chủ xe VinFast, đặc biệt người mới mua, chưa quen tính năng ADAS, sạc pin, đèn cảnh báo.

**AI làm gì (augmentation):** AI hướng dẫn, chủ xe tự thực hiện. Không có hành động tự động nào — mọi thao tác đều cần con người xác nhận. Với cảnh báo an toàn, AI luôn kèm hotline và khuyến nghị đến showroom.

**Cách hoạt động:** Intent classifier (gpt-4o-mini, ~200ms) phân loại query thành 6 loại: greeting, car_assistant, find_charging_stations, find_service_centers, search_places, get_directions. Car assistant queries đi qua RAG pipeline (TF-IDF + SQLite, 1,487 chunks, ~50ms) → LLM synthesis (~1s). Location queries đi qua GPS + SerpAPI. Directions qua Nominatim (free).

**Quality:** Precision-first. Khi không chắc → nói rõ, kèm hotline. Confidence badge hiển thị cho user. Source trích dẫn rõ ràng để đối chiếu Manual.

**Risk chính:** STT tiếng Việt không ổn định (Chrome-only), RAG TF-IDF kém hơn embedding cho câu hỏi ngữ nghĩa phức tạp, SerpAPI có quota limit.

**Data flywheel:** Thumbs feedback → cải thiện retrieval. Tần suất câu hỏi theo feature → feedback cho đội sản xuất VinFast. User profile (dòng xe, số km) → cá nhân hóa câu trả lời ngày càng tốt hơn.
