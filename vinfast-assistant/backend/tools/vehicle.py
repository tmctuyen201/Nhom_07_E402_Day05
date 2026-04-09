"""Vehicle knowledge tools: warning lights, ADAS, charging guide, battery range, maintenance."""

# ── Battery specs per model ───────────────────────────────────
BATTERY_SPECS = {
    "VF7":  {"capacity_kwh": 75.3,  "range_km": 431, "consumption_kwh_per_100km": 17.5},
    "VF8":  {"capacity_kwh": 87.7,  "range_km": 460, "consumption_kwh_per_100km": 19.0},
    "VF9":  {"capacity_kwh": 123.0, "range_km": 594, "consumption_kwh_per_100km": 20.7},
}

# ── Maintenance schedule ──────────────────────────────────────
MAINTENANCE_SCHEDULE = [
    {"id": "tong-quat",        "name": "Kiểm tra tổng quát",           "interval_km": 15000},
    {"id": "xoay-lop",         "name": "Xoay lốp",                     "interval_km": 10000},
    {"id": "ma-phanh",         "name": "Kiểm tra má phanh",            "interval_km": 20000},
    {"id": "dau-phanh",        "name": "Thay dầu phanh",               "interval_km": 30000},
    {"id": "loc-cabin",        "name": "Thay bộ lọc cabin",            "interval_km": 20000},
    {"id": "nuoc-lam-mat-pin", "name": "Thay nước làm mát pin HV",     "interval_km": 60000},
    {"id": "nuoc-lam-mat-dm",  "name": "Thay nước làm mát động cơ",    "interval_km": 60000},
    {"id": "acquy-12v",        "name": "Thay ắc quy 12V",              "interval_km": 50000},
    {"id": "adas-check",       "name": "Kiểm tra hệ thống ADAS",       "interval_km": 15000},
    {"id": "dien-cao-ap",      "name": "Kiểm tra hệ thống điện cao áp","interval_km": 30000},
    {"id": "thay-lop",         "name": "Thay lốp (gai < 1.6mm)",       "interval_km": 50000},
]


def get_warning_light_info(name: str) -> str:
    n = name.lower()
    if "check engine" in n or "động cơ" in n:
        return "⚠️ Check Engine: Lỗi hệ thống động cơ. Đưa xe đến trung tâm dịch vụ VinFast sớm nhất."
    if "brake" in n or "phanh" in n:
        return "🛑 Brake Warning: Phanh tay chưa nhả hoặc dầu phanh thấp. Nếu đèn vẫn sáng sau khi nhả phanh tay → DỪNG XE NGAY, gọi 1900 232 389."
    if "tire" in n or "áp suất" in n or "lốp" in n:
        return "🔴 TPMS: Áp suất lốp thấp. Bơm lốp theo tem cửa xe: 38 PSI / 260 kPa trước, 36 PSI / 250 kPa sau."
    if "battery" in n or "pin" in n or "sạc" in n:
        return "🔋 Battery Warning: Lỗi hệ thống pin cao áp. DỪNG XE NGAY. Gọi cứu hộ VinFast 1900 232 389."
    if "abs" in n:
        return "⚠️ ABS Warning: Hệ thống chống bó cứng phanh có lỗi. Phanh thường vẫn hoạt động nhưng ABS bị vô hiệu. Đến trung tâm dịch vụ kiểm tra."
    if "nhiệt" in n or "coolant" in n or "nước làm mát" in n:
        return "🌡️ Coolant Warning: Động cơ quá nhiệt. Dừng xe an toàn, tắt điều hòa, để xe nguội. Không mở nắp két nước khi còn nóng."
    return f"Không tìm thấy thông tin cho đèn '{name}'. Liên hệ hotline VinFast 1900 232 389."


def get_adas_feature_info(feature: str) -> str:
    f = feature.lower()
    if "lka" in f or "lane keep" in f or "giữ làn" in f:
        return "LKA (Lane Keeping Assist): Hỗ trợ giữ làn đường. Camera phía trước nhận diện vạch kẻ đường. Khi xe lệch làn mà không bật xi-nhan, LKA tự điều chỉnh vô lăng nhẹ. Hoạt động trên 60 km/h."
    if "acc" in f or "cruise" in f or "ga tự động" in f:
        return "ACC (Adaptive Cruise Control): Ga tự động thích ứng. Duy trì khoảng cách an toàn với xe phía trước, có thể phanh đến dừng hoàn toàn trong kẹt xe."
    if "aeb" in f or "emergency" in f or "phanh khẩn" in f:
        return "AEB (Auto Emergency Braking): Phanh khẩn cấp tự động. Phát hiện nguy cơ va chạm (xe, người đi bộ, xe đạp) và phanh tự động. Hoạt động 5–150 km/h."
    if "bsm" in f or "blind" in f or "điểm mù" in f:
        return "BSM (Blind Spot Monitoring): Giám sát điểm mù. Radar phía sau phát hiện xe trong điểm mù, đèn báo sáng trên gương. Nếu bật xi-nhan khi có xe → đèn nháy + cảnh báo âm thanh."
    if "ldw" in f or "lane departure" in f or "lệch làn" in f:
        return "LDW (Lane Departure Warning): Cảnh báo lệch làn. Rung vô lăng + đèn báo khi xe vượt vạch kẻ mà không bật xi-nhan. Hoạt động trên 60 km/h."
    if "rcta" in f or "rear cross" in f or "phía sau" in f:
        return "RCTA (Rear Cross Traffic Alert): Cảnh báo phương tiện cắt ngang phía sau khi lùi. Hiển thị trên màn hình + tiếng bíp tăng dần khi vật thể tiến gần."
    if "fcw" in f or "forward collision" in f or "va chạm phía trước" in f:
        return "FCW (Forward Collision Warning): Cảnh báo va chạm phía trước. Biểu tượng đỏ + âm thanh khi khoảng cách với xe phía trước quá gần. Hoạt động kể cả khi tắt ACC."
    return f"Không tìm thấy thông tin cho tính năng '{feature}'. Liên hệ hotline VinFast 1900 232 389."


def get_charging_guide(battery_level: float) -> str:
    if battery_level < 10:
        return f"🚨 Pin còn {battery_level:.0f}% — KHẨN CẤP! Tìm trạm sạc ngay qua app VinFast hoặc hỏi tôi 'tìm trạm sạc gần tôi'."
    if battery_level < 20:
        return f"⚠️ Pin còn {battery_level:.0f}% — mức thấp. Nên sạc sớm. Khuyến nghị sạc AC qua đêm hoặc DC fast charge tại trạm VinFast."
    if battery_level < 50:
        return f"🔋 Pin còn {battery_level:.0f}% — mức trung bình. Sạc AC qua đêm là tối ưu. Giữ mức 20–80% để bảo vệ pin dài hạn."
    if battery_level <= 80:
        return f"✅ Pin còn {battery_level:.0f}% — mức tốt. Tiếp tục sử dụng bình thường. Không cần sạc ngay."
    return f"✅ Pin còn {battery_level:.0f}% — đầy. Không nên sạc thêm để bảo vệ tuổi thọ pin. Giới hạn sạc hàng ngày ở 80%."


def calculate_battery_range(battery_level: float, car_model: str, driving_mode: str = "normal") -> dict:
    """Calculate remaining range and charging advice based on battery %."""
    model_key = car_model.upper().replace(" ", "")
    spec = BATTERY_SPECS.get(model_key, BATTERY_SPECS["VF8"])

    # Adjust consumption by driving mode
    mode_factor = {"eco": 0.85, "normal": 1.0, "sport": 1.25, "highway": 1.20}.get(driving_mode.lower(), 1.0)
    consumption = spec["consumption_kwh_per_100km"] * mode_factor

    available_kwh = spec["capacity_kwh"] * (battery_level / 100) * 0.95  # 5% buffer
    range_km = round((available_kwh / consumption) * 100)

    # Charging advice
    if battery_level < 10:
        advice = "🚨 KHẨN CẤP: Tìm trạm sạc ngay lập tức!"
        urgency = "critical"
    elif battery_level < 20:
        advice = "⚠️ Nên sạc sớm. Tìm trạm sạc trong vòng 30 km tới."
        urgency = "warning"
    elif battery_level < 40:
        advice = "💡 Nên lên kế hoạch sạc trong hành trình."
        urgency = "info"
    else:
        advice = "✅ Pin đủ cho hành trình bình thường."
        urgency = "ok"

    return {
        "battery_level": battery_level,
        "range_km": range_km,
        "car_model": car_model,
        "driving_mode": driving_mode,
        "advice": advice,
        "urgency": urgency,
        "spec": {
            "capacity_kwh": spec["capacity_kwh"],
            "max_range_km": spec["range_km"],
        },
    }


def get_maintenance_schedule(current_km: float, car_model: str) -> dict:
    """Return maintenance checklist with status for each item."""
    items = []
    for item in MAINTENANCE_SCHEDULE:
        interval = item["interval_km"]
        cycles = int(current_km // interval)
        next_due = (cycles + 1) * interval
        km_remaining = next_due - current_km

        if km_remaining <= 0:
            status = "overdue"
        elif km_remaining <= 2000:
            status = "due_soon"
        elif km_remaining <= 5000:
            status = "upcoming"
        else:
            status = "ok"

        items.append({
            "id": item["id"],
            "name": item["name"],
            "interval_km": interval,
            "next_due_km": next_due,
            "km_remaining": km_remaining,
            "status": status,
        })

    # Sort: overdue first
    order = {"overdue": 0, "due_soon": 1, "upcoming": 2, "ok": 3}
    items.sort(key=lambda x: order[x["status"]])

    overdue = [i for i in items if i["status"] == "overdue"]
    due_soon = [i for i in items if i["status"] == "due_soon"]

    summary = ""
    if overdue:
        summary = f"⚠️ {len(overdue)} hạng mục quá hạn bảo dưỡng!"
    elif due_soon:
        summary = f"💡 {len(due_soon)} hạng mục sắp đến hạn bảo dưỡng."
    else:
        summary = "✅ Xe đang trong tình trạng bảo dưỡng tốt."

    return {
        "current_km": current_km,
        "car_model": car_model,
        "summary": summary,
        "items": items,
        "overdue_count": len(overdue),
        "due_soon_count": len(due_soon),
    }

