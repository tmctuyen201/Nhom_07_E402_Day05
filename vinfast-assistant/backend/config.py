import os
from dotenv import load_dotenv

load_dotenv()

# ── OpenAI / LLM config ──────────────────────────────────────
LLM_PROVIDER   = os.getenv("LLM_PROVIDER", "openai")       # "openai" | "anthropic" | "lmstudio"
LLM_MODEL      = os.getenv("LLM_MODEL", "gpt-4o-mini")       # model dùng cho synthesis
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")             # API key (bỏ trống → dùng key từ frontend request)
ANTHROPIC_KEY  = os.getenv("ANTHROPIC_API_KEY", "")

# ── RAG config ──────────────────────────────────────────────
EMBEDDING_MODEL     = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
TOP_K               = int(os.getenv("TOP_K", "3"))  # Return top-3 chunks to synthesize
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.3"))
MAX_TOKENS          = int(os.getenv("MAX_TOKENS", "800"))

# ── SerpAPI config ──────────────────────────────────────────
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

# ── Server config ───────────────────────────────────────────
PORT = int(os.getenv("PORT", "8000"))
