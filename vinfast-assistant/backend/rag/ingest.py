"""
RAG Ingestion Pipeline
Step 1: Clean markdown articles
Step 2: Chunk into SQLite DB with TF-IDF embeddings
Run: python -m backend.ingest
"""
import re
import json
import sqlite3
import math
import hashlib
import logging
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
import pickle

logger = logging.getLogger("vinfast.ingest")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")

ARTICLES_DIR = Path(__file__).parent.parent.parent.parent / "articles"
DB_PATH = Path(__file__).parent.parent / "rag.db"
CHUNK_SIZE = 400       # target words per chunk
CHUNK_OVERLAP = 80     # word overlap between chunks


# ── Step 1: Clean ─────────────────────────────────────────────

def clean_markdown(text: str) -> str:
    """Remove noise from crawled markdown."""
    # Remove image tags
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    # Remove HTML-like table separators
    text = re.sub(r'\|[-:| ]+\|', '', text)
    # Remove markdown table pipes but keep content
    text = re.sub(r'^\|', '', text, flags=re.MULTILINE)
    text = re.sub(r'\|$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\|', ' ', text)
    # Remove LaTeX-style math
    text = re.sub(r'\$\\[^$]+\$', '', text)
    text = re.sub(r'\$[^$]+\$', '', text)
    # Remove URLs in parentheses
    text = re.sub(r'\(https?://[^\)]+\)', '', text)
    # Remove markdown links but keep text
    text = re.sub(r'\[([^\]]+)\]\([^\)]*\)', r'\1', text)
    # Remove horizontal rules
    text = re.sub(r'^\s*\*\s*\*\s*\*\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^---+$', '', text, flags=re.MULTILINE)
    # Remove repeated blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove lines that are just numbers or symbols
    text = re.sub(r'^\s*[\d\W]+\s*$', '', text, flags=re.MULTILINE)
    # Strip leading/trailing whitespace per line
    lines = [l.strip() for l in text.splitlines()]
    # Remove very short lines (likely noise)
    lines = [l for l in lines if len(l) > 3 or l == '']
    return '\n'.join(lines).strip()


def extract_metadata(filepath: Path) -> dict:
    """Extract car model and language from filename/content."""
    name = filepath.stem.lower()
    car_model = "VF8"
    if "vf9" in name:
        car_model = "VF9"
    elif "vf7" in name:
        car_model = "VF7"
    elif "vf8" in name:
        car_model = "VF8"

    lang = "en"
    if "-vi-" in name or "huong-dan" in name or "frg-vi" in name:
        lang = "vi"

    return {"car_model": car_model, "lang": lang, "source": filepath.name}


def extract_sections(text: str) -> list[tuple[str, str]]:
    """Split text into (heading, body) sections by markdown headings."""
    sections = []
    current_heading = "General"
    current_body = []

    for line in text.splitlines():
        if re.match(r'^#{1,3}\s+', line):
            if current_body:
                body = '\n'.join(current_body).strip()
                if len(body) > 50:
                    sections.append((current_heading, body))
            current_heading = re.sub(r'^#+\s+', '', line).strip()
            current_body = []
        else:
            current_body.append(line)

    if current_body:
        body = '\n'.join(current_body).strip()
        if len(body) > 50:
            sections.append((current_heading, body))

    return sections


# ── Step 2: Chunk ─────────────────────────────────────────────

def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping word-based chunks."""
    words = text.split()
    if len(words) <= size:
        return [text]
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + size, len(words))
        chunks.append(' '.join(words[start:end]))
        if end == len(words):
            break
        start += size - overlap
    return chunks


# ── Step 3: DB ────────────────────────────────────────────────

def init_db(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            source TEXT,
            car_model TEXT,
            lang TEXT,
            section TEXT,
            content TEXT,
            content_hash TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_car_model ON chunks(car_model)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tfidf_model (
            id INTEGER PRIMARY KEY,
            vectorizer BLOB,
            matrix BLOB,
            chunk_ids TEXT
        )
    """)
    conn.commit()
    return conn


def chunk_id(source: str, section: str, idx: int) -> str:
    raw = f"{source}::{section}::{idx}"
    return hashlib.md5(raw.encode()).hexdigest()[:12]


# ── Main pipeline ─────────────────────────────────────────────

def run_ingest():
    logger.info(f"Articles dir: {ARTICLES_DIR}")
    logger.info(f"DB path: {DB_PATH}")

    files = list(ARTICLES_DIR.glob("*.md"))
    if not files:
        logger.error(f"No .md files found in {ARTICLES_DIR}")
        return

    logger.info(f"Found {len(files)} article files")

    conn = init_db(DB_PATH)
    all_chunks = []  # (id, source, car_model, lang, section, content)

    for filepath in files:
        meta = extract_metadata(filepath)
        logger.info(f"Processing: {filepath.name} → model={meta['car_model']} lang={meta['lang']}")

        raw = filepath.read_text(encoding="utf-8", errors="ignore")

        # Skip header metadata lines (URL, Published date, Fetched at)
        lines = raw.splitlines()
        content_start = 0
        for i, line in enumerate(lines):
            if line.strip() == "## Content":
                content_start = i + 1
                break
        raw = '\n'.join(lines[content_start:])

        cleaned = clean_markdown(raw)
        sections = extract_sections(cleaned)

        if not sections:
            # Fallback: treat whole file as one section
            sections = [("General", cleaned)]

        file_chunks = 0
        for heading, body in sections:
            sub_chunks = chunk_text(body)
            for i, chunk_content in enumerate(sub_chunks):
                cid = chunk_id(meta["source"], heading, i)
                content_hash = hashlib.md5(chunk_content.encode()).hexdigest()
                all_chunks.append((cid, meta["source"], meta["car_model"], meta["lang"], heading, chunk_content, content_hash))
                file_chunks += 1

        logger.info(f"  → {len(sections)} sections, {file_chunks} chunks")

    # Deduplicate by content hash
    seen_hashes = set()
    unique_chunks = []
    for c in all_chunks:
        if c[6] not in seen_hashes:
            seen_hashes.add(c[6])
            unique_chunks.append(c)

    logger.info(f"Total chunks: {len(all_chunks)} → {len(unique_chunks)} after dedup")

    # Insert into DB
    conn.execute("DELETE FROM chunks")
    conn.executemany(
        "INSERT OR REPLACE INTO chunks (id, source, car_model, lang, section, content, content_hash) VALUES (?,?,?,?,?,?,?)",
        unique_chunks
    )
    conn.commit()

    # Build TF-IDF model over all chunks
    logger.info("Building TF-IDF model...")
    texts = [c[5] for c in unique_chunks]
    ids = [c[0] for c in unique_chunks]

    vectorizer = TfidfVectorizer(max_features=3000, stop_words=None, ngram_range=(1, 2), sublinear_tf=True)
    matrix = vectorizer.fit_transform(texts)

    vec_blob = pickle.dumps(vectorizer)
    mat_blob = pickle.dumps(matrix)
    ids_json = json.dumps(ids)

    conn.execute("DELETE FROM tfidf_model")
    conn.execute(
        "INSERT INTO tfidf_model (vectorizer, matrix, chunk_ids) VALUES (?,?,?)",
        (vec_blob, mat_blob, ids_json)
    )
    conn.commit()
    conn.close()

    logger.info(f"Done. DB saved to {DB_PATH}")
    logger.info(f"  {len(unique_chunks)} chunks indexed")


if __name__ == "__main__":
    run_ingest()
