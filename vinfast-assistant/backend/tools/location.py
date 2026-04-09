"""
Location tools: find charging stations + service centers via SerpAPI.
Called by the frontend tool_call flow (POST /api/nearby-stations).
"""
import logging
import httpx
from typing import Literal

logger = logging.getLogger("vinfast")

StationType = Literal["charging", "service"]

# ── Static fallbacks ──────────────────────────────────────────

_STATIC_CHARGING = [
    {"name": "VinFast Charging — Vinhomes Grand Park",   "address": "Quận 9, TP.HCM",          "lat": 10.8411, "lng": 106.8127},
    {"name": "VinFast Charging — Vinhomes Central Park", "address": "Bình Thạnh, TP.HCM",       "lat": 10.7958, "lng": 106.7218},
    {"name": "VinFast Charging — Vinhomes Ocean Park",   "address": "Gia Lâm, Hà Nội",          "lat": 20.9876, "lng": 105.9312},
    {"name": "VinFast Charging — Royal City",            "address": "Thanh Xuân, Hà Nội",        "lat": 21.0027, "lng": 105.8142},
    {"name": "VinFast Charging — Times City",            "address": "Hai Bà Trưng, Hà Nội",      "lat": 20.9955, "lng": 105.8687},
    {"name": "VinFast Charging — Vincom Đà Nẵng",        "address": "Hải Châu, Đà Nẵng",         "lat": 16.0544, "lng": 108.2022},
]

_STATIC_SERVICE = [
    {"name": "VinFast Service Center — Quận 7",          "address": "Quận 7, TP.HCM",            "lat": 10.7285, "lng": 106.7218},
    {"name": "VinFast Service Center — Thủ Đức",         "address": "Thủ Đức, TP.HCM",           "lat": 10.8700, "lng": 106.7900},
    {"name": "VinFast Service Center — Cầu Giấy",        "address": "Cầu Giấy, Hà Nội",          "lat": 21.0285, "lng": 105.7900},
    {"name": "VinFast Service Center — Long Biên",       "address": "Long Biên, Hà Nội",          "lat": 21.0450, "lng": 105.8900},
    {"name": "VinFast Service Center — Đà Nẵng",         "address": "Ngũ Hành Sơn, Đà Nẵng",     "lat": 16.0100, "lng": 108.2400},
    {"name": "VinFast Service Center — Cần Thơ",         "address": "Ninh Kiều, Cần Thơ",         "lat": 10.0341, "lng": 105.7852},
]


def _add_maps_url(station: dict) -> dict:
    lat, lng = station.get("lat"), station.get("lng")
    if lat and lng:
        station["maps_url"] = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
    else:
        name = station.get("name", "")
        station["maps_url"] = f"https://www.google.com/maps/search/{name.replace(' ', '+')}"
    return station


async def find_nearby_stations(
    lat: float,
    lng: float,
    station_type: StationType = "charging",
    radius_km: int = 15,
    serpapi_key: str = "",
) -> dict:
    """Search nearby VinFast stations via SerpAPI, fallback to static list."""

    query_map = {
        "charging": "trạm sạc VinFast",
        "service":  "trung tâm bảo dưỡng dịch vụ VinFast",
    }
    query = query_map[station_type]
    label = "trạm sạc" if station_type == "charging" else "trạm bảo dưỡng"

    if not serpapi_key:
        logger.warning(f"No SERPAPI_KEY — static fallback for {station_type}")
        return _static_response(lat, lng, station_type)

    params = {
        "engine": "google_maps",
        "q": query,
        "ll": f"@{lat},{lng},13z",
        "type": "search",
        "api_key": serpapi_key,
        "hl": "vi",
        "gl": "vn",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://serpapi.com/search", params=params)
            resp.raise_for_status()
            data = resp.json()

        stations = []
        for r in data.get("local_results", [])[:10]:
            gps = r.get("gps_coordinates", {})
            s_lat = gps.get("latitude")
            s_lng = gps.get("longitude")
            stations.append({
                "name":     r.get("title", label),
                "address":  r.get("address", ""),
                "rating":   r.get("rating"),
                "reviews":  r.get("reviews"),
                "open_now": r.get("open_state", ""),
                "phone":    r.get("phone", ""),
                "lat":      s_lat,
                "lng":      s_lng,
                "maps_url": (
                    f"https://www.google.com/maps/dir/?api=1&destination={s_lat},{s_lng}"
                    if s_lat and s_lng else
                    r.get("links", {}).get("directions", "")
                ),
                "thumbnail": r.get("thumbnail", ""),
            })

        logger.info(f"SerpAPI → {len(stations)} {label}")
        return {
            "stations": stations,
            "station_type": station_type,
            "source": "serpapi",
            "query_location": {"lat": lat, "lng": lng},
        }

    except Exception as e:
        logger.error(f"SerpAPI error ({station_type}): {e} — fallback")
        return _static_response(lat, lng, station_type)


def _static_response(lat: float, lng: float, station_type: StationType) -> dict:
    base = _STATIC_CHARGING if station_type == "charging" else _STATIC_SERVICE
    stations = [_add_maps_url(dict(s)) for s in base]
    return {
        "stations": stations,
        "station_type": station_type,
        "source": "static_fallback",
        "query_location": {"lat": lat, "lng": lng},
    }
