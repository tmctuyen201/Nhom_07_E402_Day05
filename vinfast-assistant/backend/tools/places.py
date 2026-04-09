"""
General place search via SerpAPI Google Maps.
Used for: food, coffee, store, ATM, hospital, etc.
"""
import logging
import re
import httpx

logger = logging.getLogger("vinfast")


async def search_places(
    lat: float,
    lng: float,
    keyword: str,
    limit: int = 5,
    serpapi_key: str = "",
) -> dict:
    """Search nearby places by keyword using SerpAPI."""
    limit = max(1, min(limit, 20))

    if not serpapi_key:
        logger.warning("No SERPAPI_KEY — cannot search places")
        return {
            "places": [],
            "keyword": keyword,
            "source": "no_api_key",
            "query_location": {"lat": lat, "lng": lng},
            "error": "Chưa cấu hình SERPAPI_KEY. Vui lòng thêm vào file .env.",
        }

    params = {
        "engine": "google_maps",
        "q": keyword,
        "ll": f"@{lat},{lng},14z",
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

        places = []
        for r in data.get("local_results", [])[:limit]:
            gps = r.get("gps_coordinates", {})
            p_lat = gps.get("latitude")
            p_lng = gps.get("longitude")
            places.append({
                "name":      r.get("title", keyword),
                "address":   r.get("address", ""),
                "rating":    r.get("rating"),
                "reviews":   r.get("reviews"),
                "open_now":  r.get("open_state", ""),
                "phone":     r.get("phone", ""),
                "type":      r.get("type", ""),
                "price":     r.get("price", ""),
                "lat":       p_lat,
                "lng":       p_lng,
                "maps_url":  (
                    f"https://www.google.com/maps/dir/?api=1&destination={p_lat},{p_lng}"
                    if p_lat and p_lng else
                    f"https://www.google.com/maps/search/{keyword.replace(' ', '+')}/@{lat},{lng},14z"
                ),
                "thumbnail": r.get("thumbnail", ""),
            })

        logger.info(f"SerpAPI places → {len(places)} results for '{keyword}'")
        return {
            "places": places,
            "keyword": keyword,
            "source": "serpapi",
            "query_location": {"lat": lat, "lng": lng},
        }

    except Exception as e:
        logger.error(f"SerpAPI places error: {e}")
        return {
            "places": [],
            "keyword": keyword,
            "source": "error",
            "query_location": {"lat": lat, "lng": lng},
            "error": str(e),
        }


async def geocode_destination(destination: str) -> dict:
    """
    Geocode a destination string using Nominatim (free, no key needed).
    Returns lat/lng + a Google Maps directions URL.
    """
    # Clean any leftover trigger words the frontend may have missed
    clean = re.sub(
        r'^(chỉ\s*đường|đường\s*đến|navigate\s*to|directions?\s*to|'
        r'đi\s*đến|dẫn\s*đường|làm\s*sao\s*đến|cách\s*đến|đến|tới)\s*',
        '', destination, flags=re.I | re.UNICODE,
    ).strip()
    query_str = clean or destination
    logger.info(f"  → Nominatim query: '{query_str}'")

    headers = {
        "User-Agent": "VinFastAssistant/2.0 (vinfast-ai-assistant; contact@vinfast.com)",
        "Accept-Language": "vi,en",
    }

    async def _search(q: str, country: str | None = "vn") -> list:
        params: dict = {"q": q, "format": "json", "limit": 3, "accept-language": "vi"}
        if country:
            params["countrycodes"] = country
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params=params, headers=headers,
            )
            resp.raise_for_status()
            return resp.json()

    try:
        # Try 1: Vietnam-biased search
        results = await _search(query_str, country="vn")

        # Try 2: global search if nothing found
        if not results:
            logger.info(f"  → Nominatim: no VN results, trying global")
            results = await _search(query_str, country=None)

        # Try 3: append "Việt Nam" hint
        if not results and "việt nam" not in query_str.lower() and "vietnam" not in query_str.lower():
            logger.info(f"  → Nominatim: appending 'Việt Nam'")
            results = await _search(query_str + ", Việt Nam", country=None)

        if results:
            r = results[0]
            lat = float(r["lat"])
            lng = float(r["lon"])
            display_name = r.get("display_name", query_str)
            maps_url = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
            logger.info(f"  → Found: {display_name[:60]} ({lat:.4f},{lng:.4f})")
            return {
                "found": True,
                "destination": query_str,
                "display_name": display_name,
                "lat": lat,
                "lng": lng,
                "maps_url": maps_url,
            }
        else:
            logger.warning(f"  → Nominatim: no results for '{query_str}'")
            encoded = query_str.replace(" ", "+")
            return {
                "found": False,
                "destination": query_str,
                "display_name": query_str,
                "lat": None,
                "lng": None,
                "maps_url": f"https://www.google.com/maps/search/{encoded}",
            }

    except Exception as e:
        logger.error(f"Nominatim error: {e}")
        encoded = query_str.replace(" ", "+")
        return {
            "found": False,
            "destination": query_str,
            "display_name": query_str,
            "lat": None,
            "lng": None,
            "maps_url": f"https://www.google.com/maps/search/{encoded}",
            "error": str(e),
        }


def extract_search_params(query: str) -> tuple[str, int]:
    """
    Parse user query to extract keyword and limit.
    e.g. "tìm 6 quán phở gần đây" → ("quán phở", 6)
         "tìm quán cà phê gần tôi" → ("quán cà phê", 5)
    """
    # Extract number if present
    num_match = re.search(r'\b(\d+)\b', query)
    limit = int(num_match.group(1)) if num_match else 5
    limit = max(1, min(limit, 20))

    # Remove trigger words and numbers to get keyword
    cleaned = re.sub(
        r'\b(tìm|kiếm|cho\s*tôi|gần\s*(đây|tôi|nhất)|xung\s*quanh|ở\s*đâu|nearby|find|search|\d+)\b',
        ' ', query, flags=re.I | re.UNICODE,
    ).strip()
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned or query, limit


def extract_destination(query: str) -> str:
    """
    Extract destination from a directions query.
    e.g. "chỉ đường đến Hồ Hoàn Kiếm" → "Hồ Hoàn Kiếm"
         "đường đến sân bay Nội Bài" → "sân bay Nội Bài"
    """
    cleaned = re.sub(
        r'^(chỉ\s*đường|đường\s*đến|navigate\s*to|directions?\s*to|đi\s*đến|dẫn\s*đường|'
        r'làm\s*sao\s*đến|cách\s*đến|tới|đến)\s*',
        '', query, flags=re.I | re.UNICODE,
    ).strip()
    return cleaned or query
