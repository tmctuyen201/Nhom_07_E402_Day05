"""
Production Readiness Checker

Tự động kiểm tra project có đủ điều kiện deploy chưa.
Chạy: python check_production_ready.py

Output: checklist với ✅ / ❌ cho từng item.
"""

import os
import sys
import json
import subprocess


def check(name: str, passed: bool, detail: str = "") -> dict:
    icon = "[OK]" if passed else "[FAIL]"
    print(f"  {icon} {name}" + (f" — {detail}" if detail else ""))
    return {"name": name, "passed": passed}


def run_checks():
    results = []
    base = os.path.dirname(__file__)

    print("\n" + "=" * 55)
    print("  Production Readiness Check — VinFast Assistant")
    print("=" * 55)

    # ── Files ──────────────────────────────────────
    print("\n[FILES] Required Files")
    results.append(
        check("Dockerfile exists", os.path.exists(os.path.join(base, "Dockerfile")))
    )
    results.append(
        check(
            "docker-compose.yml exists",
            os.path.exists(os.path.join(base, "docker-compose.yml")),
        )
    )
    results.append(
        check(
            ".dockerignore exists", os.path.exists(os.path.join(base, ".dockerignore"))
        )
    )
    results.append(
        check(
            "requirements.txt exists",
            os.path.exists(os.path.join(base, "backend", "requirements.txt")),
        )
    )
    results.append(
        check("railway.toml exists", os.path.exists(os.path.join(base, "railway.toml")))
    )
    results.append(
        check("render.yaml exists", os.path.exists(os.path.join(base, "render.yaml")))
    )
    results.append(
        check(
            "cloudbuild.yaml exists",
            os.path.exists(os.path.join(base, "cloudbuild.yaml")),
        )
    )
    results.append(
        check("service.yaml exists", os.path.exists(os.path.join(base, "service.yaml")))
    )

    # ── Security ───────────────────────────────────
    print("\n[SECURITY] Security")

    # Check .env not tracked
    env_file = os.path.join(base, ".env")
    gitignore = os.path.join(base, ".gitignore")

    env_ignored = False
    if os.path.exists(gitignore):
        with open(gitignore, "r", encoding="utf-8") as file:
            content = file.read()
        if ".env" in content:
            env_ignored = True
    results.append(
        check(
            ".env in .gitignore",
            env_ignored,
            "Add .env to .gitignore!" if not env_ignored else "",
        )
    )

    # Check no hardcoded secrets in code
    secrets_found = []
    for f in ["backend/main.py", "backend/config.py"]:
        fpath = os.path.join(base, f)
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as file:
                    content = file.read()
                for bad in ["sk-", "password123", "hardcoded", "dev-key-change-me"]:
                    if bad in content:
                        secrets_found.append(f"{f}:{bad}")
            except UnicodeDecodeError:
                secrets_found.append(f"{f}:unicode_error")
    results.append(
        check(
            "No hardcoded secrets in code",
            len(secrets_found) == 0,
            str(secrets_found) if secrets_found else "",
        )
    )

    # ── API Endpoints ──────────────────────────────
    print("\n[API] API Endpoints (code check)")
    main_py = os.path.join(base, "backend", "main.py")
    if os.path.exists(main_py):
        with open(main_py, "r", encoding="utf-8") as file:
            content = file.read()
        results.append(
            check("/api/health endpoint defined", '"/api/health"' in content)
        )
        results.append(check("/api/ready endpoint defined", '"/api/ready"' in content))
        results.append(
            check(
                "Authentication implemented",
                "verify_api_key" in content or "APIKeyHeader" in content,
            )
        )
        results.append(check("JWT auth endpoint", '"/auth/token"' in content))
        results.append(
            check("Rate limiting implemented", "check_rate_limit" in content)
        )
        results.append(
            check("Cost guard implemented", "check_and_record_cost" in content)
        )
        results.append(check("Graceful shutdown (SIGTERM)", "SIGTERM" in content))
        results.append(
            check(
                "Redis integration",
                "redis_client" in content and "REDIS_URL" in content,
            )
        )
    else:
        results.append(
            check("backend/main.py exists", False, "Create backend/main.py!")
        )

    # ── Docker ─────────────────────────────────────
    print("\n[DOCKER] Docker")
    dockerfile = os.path.join(base, "Dockerfile")
    if os.path.exists(dockerfile):
        with open(dockerfile, "r", encoding="utf-8") as file:
            content = file.read()
        results.append(
            check(
                "Multi-stage build", "AS builder" in content and "AS runtime" in content
            )
        )
        results.append(
            check("Non-root user", "useradd" in content or "USER " in content)
        )
        results.append(check("HEALTHCHECK instruction", "HEALTHCHECK" in content))

    dockerignore = os.path.join(base, ".dockerignore")
    if os.path.exists(dockerignore):
        with open(dockerignore, "r", encoding="utf-8") as file:
            content = file.read()
        results.append(check(".dockerignore covers .env", ".env" in content))
        results.append(
            check(".dockerignore covers __pycache__", "__pycache__" in content)
        )

    # ── Config ─────────────────────────────────────
    print("\n[CONFIG] Configuration")
    config_py = os.path.join(base, "backend", "config.py")
    if os.path.exists(config_py):
        with open(config_py, "r", encoding="utf-8") as file:
            content = file.read()
        results.append(
            check("Config from environment variables", "os.getenv" in content)
        )
        results.append(check("Redis URL configured", "REDIS_URL" in content))

    # ── Summary ────────────────────────────────────
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    pct = round(passed / total * 100)

    print("\n" + "=" * 55)
    print(f"  Result: {passed}/{total} checks passed ({pct}%)")

    if pct == 100:
        print("  [SUCCESS] PRODUCTION READY! Deploy nao!")
    elif pct >= 80:
        print("  [ALMOST] Almost there! Fix the [FAIL] items above.")
    elif pct >= 60:
        print("  [WARNING] Good progress. Several items need attention.")
    else:
        print("  [ERROR] Not ready. Review the checklist carefully.")

    print("=" * 55 + "\n")
    return pct == 100


if __name__ == "__main__":
    ready = run_checks()
    sys.exit(0 if ready else 1)
