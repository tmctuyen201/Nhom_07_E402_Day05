"""
Tool registry: definitions sent to LLM + dispatcher.
Add new tools here — they auto-appear in LLM context.
"""
import json
from .vehicle import (
    get_warning_light_info, get_adas_feature_info,
    get_charging_guide, calculate_battery_range, get_maintenance_schedule,
)

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_warning_light_info",
            "description": "Tra cứu ý nghĩa và cách xử lý đèn cảnh báo trên taplo xe VinFast",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Tên đèn cảnh báo (vd: check engine, brake, TPMS, battery, ABS, coolant)"}
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_adas_feature_info",
            "description": "Tra cứu cách hoạt động của tính năng ADAS trên xe VinFast",
            "parameters": {
                "type": "object",
                "properties": {
                    "feature": {"type": "string", "description": "Tên tính năng (vd: LKA, ACC, AEB, BSM, LDW, RCTA, FCW)"}
                },
                "required": ["feature"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_charging_guide",
            "description": "Tư vấn sạc pin dựa trên mức pin hiện tại của xe VinFast",
            "parameters": {
                "type": "object",
                "properties": {
                    "battery_level": {"type": "number", "description": "Mức pin hiện tại (%) từ 0 đến 100"}
                },
                "required": ["battery_level"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_battery_range",
            "description": "Tính quãng đường còn lại dựa trên % pin hiện tại của xe VinFast",
            "parameters": {
                "type": "object",
                "properties": {
                    "battery_level": {"type": "number", "description": "Mức pin hiện tại (%) từ 0-100"},
                    "car_model": {"type": "string", "description": "Model xe: VF7, VF8, VF9"},
                    "driving_mode": {
                        "type": "string",
                        "enum": ["eco", "normal", "sport", "highway"],
                        "description": "Chế độ lái. Mặc định: normal",
                    },
                },
                "required": ["battery_level", "car_model"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_maintenance_schedule",
            "description": "Kiểm tra lịch bảo dưỡng xe VinFast dựa trên số km hiện tại",
            "parameters": {
                "type": "object",
                "properties": {
                    "current_km": {"type": "number", "description": "Số km hiện tại trên đồng hồ xe"},
                    "car_model": {"type": "string", "description": "Model xe: VF7, VF8, VF9"},
                },
                "required": ["current_km", "car_model"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_nearby_stations",
            "description": "Tìm trạm sạc hoặc trung tâm bảo dưỡng/dịch vụ VinFast gần người dùng",
            "parameters": {
                "type": "object",
                "properties": {
                    "station_type": {
                        "type": "string",
                        "enum": ["charging", "service"],
                        "description": "'charging' cho trạm sạc, 'service' cho trung tâm bảo dưỡng/dịch vụ",
                    },
                    "location_hint": {"type": "string", "description": "Địa điểm user đề cập. Để trống nếu dùng GPS."},
                },
                "required": ["station_type"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_nearby_places",
            "description": (
                "Tìm kiếm địa điểm gần người dùng: quán ăn, cà phê, cửa hàng, ATM, bệnh viện, v.v. "
                "Gọi khi user hỏi tìm bất kỳ địa điểm nào không phải trạm sạc/dịch vụ VinFast."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "Từ khóa tìm kiếm (vd: 'quán phở', 'cà phê', 'siêu thị', 'ATM')"},
                    "limit": {"type": "integer", "description": "Số lượng kết quả muốn hiển thị (mặc định 5, tối đa 20)"},
                },
                "required": ["keyword"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_directions",
            "description": (
                "Chỉ đường đến một địa điểm cụ thể. Dùng Nominatim để geocode điểm đến "
                "rồi mở Google Maps chỉ đường. Gọi khi user hỏi: chỉ đường đến X, "
                "đường đến X, navigate to X, làm sao đến X."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {"type": "string", "description": "Tên địa điểm hoặc địa chỉ cần đến (vd: 'Hồ Hoàn Kiếm', 'sân bay Nội Bài', '123 Nguyễn Huệ')"},
                },
                "required": ["destination"],
            },
        },
    },
]


def dispatch_tool(name: str, args: dict) -> str | dict:
    if name == "get_warning_light_info":
        return get_warning_light_info(args.get("name", ""))

    if name == "get_adas_feature_info":
        return get_adas_feature_info(args.get("feature", ""))

    if name == "get_charging_guide":
        return get_charging_guide(float(args.get("battery_level", 50)))

    if name == "calculate_battery_range":
        result = calculate_battery_range(
            battery_level=float(args.get("battery_level", 50)),
            car_model=args.get("car_model", "VF8"),
            driving_mode=args.get("driving_mode", "normal"),
        )
        return {"__tool_action__": True, "tool": "battery_range", **result}

    if name == "get_maintenance_schedule":
        result = get_maintenance_schedule(
            current_km=float(args.get("current_km", 0)),
            car_model=args.get("car_model", "VF8"),
        )
        return {"__tool_action__": True, "tool": "maintenance_schedule", **result}

    if name == "find_nearby_stations":
        return {
            "__tool_action__": True,
            "tool": "find_nearby_stations",
            "station_type": args.get("station_type", "charging"),
            "location_hint": args.get("location_hint", ""),
        }

    if name == "search_nearby_places":
        return {
            "__tool_action__": True,
            "tool": "search_nearby_places",
            "keyword": args.get("keyword", ""),
            "limit": int(args.get("limit", 5)),
        }

    if name == "get_directions":
        return {
            "__tool_action__": True,
            "tool": "get_directions",
            "destination": args.get("destination", ""),
        }

    return f"Tool '{name}' không tồn tại."


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_warning_light_info",
            "description": "Tra cứu ý nghĩa và cách xử lý đèn cảnh báo trên taplo xe VinFast",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Tên đèn cảnh báo (vd: check engine, brake, TPMS, battery, ABS, coolant)"}
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_adas_feature_info",
            "description": "Tra cứu cách hoạt động của tính năng ADAS trên xe VinFast",
            "parameters": {
                "type": "object",
                "properties": {
                    "feature": {"type": "string", "description": "Tên tính năng (vd: LKA, ACC, AEB, BSM, LDW, RCTA, FCW)"}
                },
                "required": ["feature"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_charging_guide",
            "description": "Tư vấn sạc pin dựa trên mức pin hiện tại của xe VinFast",
            "parameters": {
                "type": "object",
                "properties": {
                    "battery_level": {"type": "number", "description": "Mức pin hiện tại (%) từ 0 đến 100"}
                },
                "required": ["battery_level"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_battery_range",
            "description": (
                "Tính quãng đường còn lại dựa trên % pin hiện tại của xe VinFast. "
                "Gọi khi user hỏi: pin X% đi được bao nhiêu km, còn đủ pin không, "
                "phạm vi di chuyển, range calculator."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "battery_level": {"type": "number", "description": "Mức pin hiện tại (%) từ 0-100"},
                    "car_model": {"type": "string", "description": "Model xe: VF7, VF8, VF9"},
                    "driving_mode": {
                        "type": "string",
                        "enum": ["eco", "normal", "sport", "highway"],
                        "description": "Chế độ lái: eco/normal/sport/highway. Mặc định: normal",
                    },
                },
                "required": ["battery_level", "car_model"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_maintenance_schedule",
            "description": (
                "Kiểm tra lịch bảo dưỡng xe VinFast dựa trên số km hiện tại. "
                "Gọi khi user hỏi: bảo dưỡng gì, đến hạn chưa, xe X km cần làm gì, maintenance schedule."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "current_km": {"type": "number", "description": "Số km hiện tại trên đồng hồ xe"},
                    "car_model": {"type": "string", "description": "Model xe: VF7, VF8, VF9"},
                },
                "required": ["current_km", "car_model"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_nearby_stations",
            "description": (
                "Tìm trạm sạc hoặc trung tâm bảo dưỡng/dịch vụ VinFast gần người dùng. "
                "Gọi khi user hỏi: tìm trạm sạc, trạm bảo dưỡng, trung tâm dịch vụ, "
                "showroom, nơi sửa xe, garage VinFast gần đây."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "station_type": {
                        "type": "string",
                        "enum": ["charging", "service"],
                        "description": "'charging' cho trạm sạc, 'service' cho trung tâm bảo dưỡng/dịch vụ",
                    },
                    "location_hint": {
                        "type": "string",
                        "description": "Địa điểm user đề cập (vd: 'Hà Nội', 'quận 7'). Để trống nếu dùng GPS.",
                    },
                },
                "required": ["station_type"],
            },
        },
    },
]


def dispatch_tool(name: str, args: dict) -> str | dict:
    if name == "get_warning_light_info":
        return get_warning_light_info(args.get("name", ""))

    if name == "get_adas_feature_info":
        return get_adas_feature_info(args.get("feature", ""))

    if name == "get_charging_guide":
        return get_charging_guide(float(args.get("battery_level", 50)))

    if name == "calculate_battery_range":
        result = calculate_battery_range(
            battery_level=float(args.get("battery_level", 50)),
            car_model=args.get("car_model", "VF8"),
            driving_mode=args.get("driving_mode", "normal"),
        )
        # Signal frontend to render the battery range widget
        return {"__tool_action__": True, "tool": "battery_range", **result}

    if name == "get_maintenance_schedule":
        result = get_maintenance_schedule(
            current_km=float(args.get("current_km", 0)),
            car_model=args.get("car_model", "VF8"),
        )
        # Signal frontend to render the maintenance widget
        return {"__tool_action__": True, "tool": "maintenance_schedule", **result}

    if name == "find_nearby_stations":
        return {
            "__tool_action__": True,
            "tool": "find_nearby_stations",
            "station_type": args.get("station_type", "charging"),
            "location_hint": args.get("location_hint", ""),
        }

    return f"Tool '{name}' không tồn tại."
