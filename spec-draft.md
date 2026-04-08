# SPEC draft — Nhom 07 E402 (VinFast Car Assistant)

- **Trịnh Đắc Phú (2A202600322)**
- **Nguyễn Thị Cẩm Nhung (2A202600208)**
- **Trịnh Minh Công Tuyền (2A202600324)**
- **Trần Hữu Gia Huy (2A202600426)**

## Track: A - VinFast

## Problem statement

Sách hướng dẫn sử dụng (Manual) của VinFast dài hàng trăm trang. Khi đang lái xe hoặc gặp sự cố, chủ xe không thể lật sách để tra cứu. Việc không hiểu tính năng (như ADAS, sạc pin tối ưu) dẫn đến trải nghiệm kém hoặc gây mất an toàn.

## Canvas draft

|         | Value                                                                                                        | Trust                                                                                                          | Feasibility                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Trả lời | Chủ xe (đặc biệt là người mới). Giải quyết ngay lập tức thắc mắc về tính năng mà không cần dừng xe lật sách. | AI phải trích dẫn đúng số trang/chương của Manual để đối chiếu. Tránh trả lời các vấn đề kỹ thuật sâu cần thợ. | Dữ liệu PDF có sẵn. Sử dụng RAG (Retrieval-Augmented Generation) để giới hạn câu trả lời trong Manual VinFast. |

**Auto hay aug?** Augmentation — AI hướng dẫn, chủ xe thực hiện thao tác.

**Learning signal:** Những tính năng nào khách hàng hỏi nhiều nhất? -> Gửi feedback cho đội sản xuất để tối ưu UI/UX của xe hoặc cập nhật phần mềm (OTA).

## Điểm chạm của Agent (Touchpoints)

Thay vì chỉ là một khung chat trên điện thoại, Agent này có thể xuất hiện ở:

- **Trực tiếp trên Màn hình trung tâm (Infotainment):** Người dùng hỏi bằng giọng nói (Voice-to-Text). Ví dụ: "Hey VinFast, làm sao để bật chế độ giữ làn?" -> AI trả lời và hiển thị hình ảnh minh họa từ Manual lên màn hình.
- **Mobile App (VinFast App):** Người dùng chụp ảnh một nút bấm lạ hoặc một đèn cảnh báo trên taplo -> AI nhận diện hình ảnh (Vision) và trích xuất đoạn Manual tương ứng để giải thích.
- **Proactive Alert (Chủ động):** Khi xe nhận thấy pin xuống dưới 20%, AI chủ động nhắc: "Tôi thấy pin bạn đang thấp, Manual trang 45 khuyên bạn nên sạc ở chế độ sạc chậm để bảo vệ tuổi thọ pin, bạn có muốn tìm trạm sạc không?"

## Hướng đi chính (4 Paths User Stories)

| Path           | Kịch bản (Scenario)                                         | Phản hồi của AI                                                                                                  |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Happy Path     | Khách hỏi: "Cách mở cốp bằng đá chân?"                      | Giải thích 3 bước: Vị trí đá, tốc độ đá, và điều kiện (chìa khóa trong túi).                                     |
| Low-confidence | Khách hỏi về một linh kiện độ thêm (không có trong manual). | "Tính năng này không có trong tài liệu chính hãng. Bạn nên liên hệ showroom để đảm bảo không mất bảo hành."      |
| Failure        | AI hiểu nhầm câu hỏi "Lốp" thành "Loa".                     | Cung cấp nút bấm nhanh: "Không đúng ý tôi" -> Chuyển sang danh mục các Icon đèn cảnh báo phổ biến để khách chọn. |
| Correction     | Khách đính chính: "Ý tôi là áp suất lốp."                   | Xin lỗi và cung cấp ngay thông số áp suất tiêu chuẩn cho dòng xe đó (trang 112).                                 |

## Cách "Dump Data" và làm Prototype cực nhanh

**Data:** Lên trang chủ VinFast, tải PDF Manual của dòng VF8/VF9.

**Công cụ:**

- Sử dụng các nền tảng No-code như Chatbase hoặc Dify.ai: Bạn chỉ cần kéo file PDF vào, nó sẽ tự tạo API Chatbot cho bạn trong 30 giây.
- Nếu muốn show code: Dùng LangChain + OpenAI API để làm RAG đơn giản.

**Demo Wow:**
Chuẩn bị một vài tấm ảnh đèn taplo (Check engine, phanh tay...).
Show cho giám khảo thấy: AI không nói nhảm, mọi câu trả lời đều có "Source: Manual VF8 - Page 42".

## Thành viên nhóm

| Họ tên                | MSSV        |
| --------------------- | ----------- |
| Trịnh Đắc Phú         | 2A202600322 |
| Nguyễn Thị Cẩm Nhung  | 2A202600208 |
| Trịnh Minh Công Tuyền | 2A202600324 |
| Trần Hữu Gia Huy      | 2A202600426 |

## Phân công

- **Trịnh Đắc Phú (2A202600322) + Trần Hữu Gia Huy (2A202600426):** Thiết kế "System Prompt" để AI luôn đóng vai chuyên gia kỹ thuật VinFast (lịch sự, chính xác), crawl data từ web để lấy hướng dẫn làm RAG.
- **Nguyễn Thị Cẩm Nhung (2A202600208):** Cắt ghép các đoạn PDF Manual quan trọng để làm "Knowledge base".
- **Trịnh Minh Công Tuyền (2A202600324):** Tạo giao diện demo (có thể dùng Streamlit hoặc Telegram Bot).
