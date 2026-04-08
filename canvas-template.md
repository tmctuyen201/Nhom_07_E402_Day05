# AI Product Canvas — VinFast Car Assistant

Điền Canvas cho product AI của nhóm. Mỗi ô có câu hỏi guide — trả lời trực tiếp, xóa phần in nghiêng khi điền.

---

## Canvas

|                   | Value                                                                                                                                                                                                                                                                                                                                                                                                                              | Trust                                                                                                                                                                                                                                                                                               | Feasibility                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Câu hỏi guide** | User nào? Pain gì? AI giải quyết gì mà cách hiện tại không giải được?                                                                                                                                                                                                                                                                                                                                                              | Khi AI sai thì user bị ảnh hưởng thế nào? User biết AI sai bằng cách nào? User sửa bằng cách nào?                                                                                                                                                                                                   | Cost bao nhiêu/request? Latency bao lâu? Risk chính là gì?                                                                                                                                                                                                                                                                               |
| **Trả lời**       | Chủ xe VinFast mới (đặc biệt dòng VF8/VF9), chưa quen các tính năng ADAS, sạc pin, cảnh báo taplo. Pain: đang lái hoặc gặp sự cố không thể lật Manual dài hàng trăm trang. Giải pháp hiện tại: gọi tổng đài chờ 5-10 phút hoặc tra cứu thủ công — mất thời gian, có thể gây mất an toàn khi không hiểu tính năng đúng cách. AI hỏi-đáp bằng giọng nói hoặc chụp ảnh đèn cảnh báo, trả lời ngay lập tức dựa trên Manual chính hãng. | Khi AI trả lời sai hoặc hiểu nhầm → chủ xe thực hiện thao tác sai, có thể gây nguy hiểm hoặc mất bảo hành. User phát hiện sai qua: (1) câu trả lời không hợp lý, (2) nút "Không đúng ý tôi", (3) so sánh với số trang Manual được trích dẫn. User sửa bằng: liên hệ showroom hoặc tổng đài VinFast. | Cost: ~$0.005/request (OpenAI API), ~0.1-0.3s latency cho text, ~1-2s cho vision RAG. Risk chính: (1) triệu chứng mô tả mơ hồ → gợi ý không chính xác, (2) RAG trả về đoạn sai từ Manual do embedding chất lượng kém, (3) chủ xe dựa hoàn toàn vào AI mà không kiểm chứng Manual — cần cảnh báo rõ: "Thông tin chỉ mang tính tham khảo." |

---

## Automation hay augmentation?

☐ Automation — AI làm thay, user không can thiệp
☑ Augmentation — AI gợi ý, user quyết định cuối cùng

**Justify:** Chủ xe cần tự thao tác trên xe — AI chỉ hướng dẫn, không làm thay. Quan trọng hơn: nếu AI sai mà chủ xe không biết, hậu quả có thể ảnh hưởng đến an toàn (ví dụ: hiểu nhầm đèn cảnh báo phanh). Do đó luôn cần con người xác nhận trước khi hành động.

---

## Learning signal

| #   | Câu hỏi                                                                                                    | Trả lời                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | User correction đi vào đâu?                                                                                | Khi user bấm "Không đúng ý tôi" hoặc đính chính bằng tin nhắn → log lại (session, câu hỏi gốc, câu trả lời AI, correction của user). Dùng để đánh giá precision và cải thiện retrieval.                      |
| 2   | Product thu signal gì để biết tốt lên hay tệ đi?                                                           | (1) Precision@3 của top-3 suggestions — so sánh khoa AI gợi ý vs. khoa thực tế user chọn. (2) Tỷ lệ user bấm "Không đúng ý tôi". (3) Tần suất câu hỏi theo feature (heatmap) → feedback cho đội sản xuất xe. |
| 3   | Data thuộc loại nào? ☑ User-specific · ☑ Domain-specific · ☐ Real-time · ☐ Human-judgment · ☐ Khác: \_\_\_ | User-specific (mẫu xe, câu hỏi đã hỏi), Domain-specific (nội dung Manual VinFast), Human-judgment (đội kỹ thuật VinFast đánh giá câu trả lời đúng/sai).                                                      |

**Có marginal value không?** (Model đã biết cái này chưa? Ai khác cũng thu được data này không?)
Model GPT-4o đã biết về xe VinFast ở mức chung chung — marginal value nằm ở dữ liệu Manual nội bộ (trang, chương, hình ảnh minh họa) mà model public không có. Các hãng xe khác (Toyota, Honda) cũng thu được tương tự — đây là competitive advantage nếu VinFast làm trước với RAG đúng.

---

## Cách dùng

1. Điền Value trước — chưa rõ pain thì chưa điền Trust/Feasibility
2. Trust: trả lời 4 câu UX (đúng → sai → không chắc → user sửa)
3. Feasibility: ước lượng cost, không cần chính xác — order of magnitude đủ
4. Learning signal: nghĩ về vòng lặp dài hạn, không chỉ demo ngày mai
5. Đánh [?] cho chỗ chưa biết — Canvas là hypothesis, không phải đáp án

---
