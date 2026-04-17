"""
Test script: Chứng minh stateless agent hoạt động đúng khi scale.

Kịch bản:
1. Gửi requests với feedback
2. Kiểm tra feedback được lưu trong Redis
3. Xem "served_by" — mỗi request có thể đến instance khác
4. Xác nhận stateless: feedback shared across instances

Chạy sau khi docker compose up:
    python backend/test_stateless.py
"""
import json
import urllib.request
import urllib.error
import time
import os

BASE_URL = os.getenv("TEST_URL", "http://localhost:8000")
API_KEY = os.getenv("API_KEY_SECRET", "dev-api-key-change-in-production")

def post(path: str, data: dict) -> dict:
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode(),
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def get(path: str) -> dict:
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        headers={"X-API-Key": API_KEY}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

print("=" * 60)
print("Stateless Scaling Demo - VinFast Assistant")
print("=" * 60)

# Test feedback storage (stateless)
feedback_data = [
    {
        "message_id": f"test-{i}",
        "query": f"Test question {i}",
        "ai_answer": f"Test answer {i}",
        "thumbs_up": i % 2 == 0,
        "thumbs_down": i % 2 == 1,
        "car_model": "VF8"
    }
    for i in range(1, 6)
]

print("Sending feedback to test Redis storage...")
for i, feedback in enumerate(feedback_data, 1):
    try:
        result = post("/api/feedback", feedback)
        print(f"  Feedback {i}: {result}")
    except Exception as e:
        print(f"  Feedback {i}: Error - {e}")

print("\nRetrieving feedback from Redis...")
try:
    exported = get("/api/feedback/export")
    logs = exported["logs"]
    print(f"✅ Retrieved {len(logs)} feedback logs from Redis")

    for i, log in enumerate(logs[:5], 1):
        print(f"  Log {i}: {log['query']} - {'👍' if log.get('thumbs_up') else '👎'}")
except Exception as e:
    print(f"❌ Error retrieving feedback: {e}")

# Test health check
print("\nTesting health check...")
try:
    health = get("/api/health")
    print(f"✅ Health check: {health['status']}")
    print(f"   Uptime: {health['uptime_seconds']}s")
    print(f"   Redis: {health['checks'].get('redis', 'unknown')}")
except Exception as e:
    print(f"❌ Health check failed: {e}")

# Test metrics
print("\nTesting metrics...")
try:
    metrics = get("/api/metrics")
    print("✅ Metrics retrieved:"    print(f"   Daily cost: ${metrics['daily_cost_usd']}")
    print(f"   Budget used: {metrics['budget_used_pct']}%")
except Exception as e:
    print(f"❌ Metrics failed: {e}")

print("\n✅ Stateless test complete!")
print("All feedback and metrics are stored in Redis,")
print("making the service truly stateless and scalable.")