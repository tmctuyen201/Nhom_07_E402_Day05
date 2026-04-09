"""
VinFast Manual Crawler
Fetches and parses content from VinFast official website.
Supports: PDF URLs, web pages, and manual page URLs.
"""
import re
import httpx
from typing import Any
from dataclasses import dataclass, field
from bs4 import BeautifulSoup
import pdfplumber
import io

@dataclass
class CrawledChunk:
    page_number: int
    chapter: str
    section: str
    content: str
    car_model: str
    category: str = "general"
    url: str = ""

@dataclass
class CrawlResult:
    chunks: list[CrawledChunk] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    total_pages: int = 0

def detect_category(text: str) -> str:
    text = text.lower()
    if any(w in text for w in ["đèn", "cảnh báo", "warning", "lamp", "indicator"]):
        return "warning"
    if any(w in text for w in ["sạc", "pin", "charging", "battery", "range"]):
        return "charging"
    if any(w in text for w in ["adas", "lane", "cruise", "aeb", "bsm", "blind"]):
        return "adas"
    if any(w in text for w in ["bảo dưỡng", "maintenance", "service", "lốp", "dầu"]):
        return "maintenance"
    if any(w in text for w in ["an toàn", "safety", "airbag", "thoát hiểm"]):
        return "safety"
    if any(w in text for w in ["vận hành", "operation", "khởi động", "lái"]):
        return "operation"
    return "specification"

def detect_car_model(text: str, url: str = "") -> str:
    text_lower = text.lower() + url.lower()
    if "vf 9" in text_lower or "vf9" in text_lower or "vf-9" in text_lower:
        return "VF9"
    if "vf 8" in text_lower or "vf8" in text_lower or "vf-8" in text_lower:
        return "VF8"
    if "vf 5" in text_lower or "vf5" in text_lower:
        return "VF5"
    return "VF8"  # default

async def crawl_url(url: str, car_model: str = "VF8") -> CrawlResult:
    """Fetch and parse a VinFast manual page URL."""
    result = CrawlResult()

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "")

            if "pdf" in content_type or url.endswith(".pdf"):
                return await crawl_pdf(resp.content, car_model)

            return await crawl_html(resp.text, url, car_model)

    except Exception as e:
        result.errors.append(f"Failed to crawl {url}: {str(e)}")

    return result

async def crawl_html(html: str, url: str, car_model: str) -> CrawlResult:
    """Parse HTML content from VinFast manual page."""
    result = CrawlResult()
    soup = BeautifulSoup(html, "lxml")

    # Remove scripts and styles
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    # Try to extract main content
    main = soup.find("main") or soup.find("article") or soup.find("div", class_=re.compile(r"content|article|manual")) or soup

    page_num = 1
    chapter = "General"
    section = ""

    for elem in main.find_all(["h1", "h2", "h3", "h4", "p", "li", "table"]):
        text = elem.get_text(strip=True)
        if not text or len(text) < 20:
            continue

        tag_name = elem.name

        if tag_name in ("h1", "h2"):
            chapter = text[:100]
            section = ""
            page_num += 1
        elif tag_name == "h3":
            section = text[:80]
        elif tag_name in ("p", "li"):
            category = detect_category(text)
            chunk = CrawledChunk(
                page_number=page_num,
                chapter=chapter,
                section=section or chapter,
                content=text,
                car_model=detect_car_model(text, url),
                category=category,
                url=url
            )
            result.chunks.append(chunk)
        elif tag_name == "table":
            table_text = elem.get_text(separator=" | ", strip=True)
            if len(table_text) > 20:
                result.chunks.append(CrawledChunk(
                    page_number=page_num,
                    chapter=chapter,
                    section=f"Table: {section}" if section else chapter,
                    content=table_text,
                    car_model=car_model,
                    category="specification",
                    url=url
                ))

    result.total_pages = page_num
    return result

async def crawl_pdf(pdf_bytes: bytes, car_model: str) -> CrawlResult:
    """Parse PDF content from VinFast manual."""
    result = CrawlResult()

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            result.total_pages = len(pdf.pages)
            chapter = "General"
            section = ""

            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                lines = text.split("\n")

                for line in lines:
                    line = line.strip()
                    if not line or len(line) < 20:
                        continue

                    # Simple header detection (all caps lines)
                    if line.isupper() and len(line) < 100:
                        chapter = line
                        section = ""
                    elif line[0].isupper() and len(line) < 80:
                        section = line
                    else:
                        result.chunks.append(CrawledChunk(
                            page_number=page_num,
                            chapter=chapter,
                            section=section or chapter,
                            content=line,
                            car_model=car_model,
                            category=detect_category(line)
                        ))
    except Exception as e:
        result.errors.append(f"PDF parse error: {str(e)}")

    return result

async def crawl_vinfast_manual(base_url: str, car_model: str = "VF9") -> CrawlResult:
    """
    Crawl all pages of a VinFast manual from the listing page.
    Try to find links to individual manual pages and crawl them.
    """
    result = CrawlResult()

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(base_url)
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "lxml")

            # Find all manual section links
            links: list[str] = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href and ("manual" in href or "huong-dan" in href or "/detail" in href):
                    if href.startswith("http"):
                        links.append(href)
                    else:
                        from urllib.parse import urljoin
                        links.append(urljoin(base_url, href))

            # Deduplicate
            links = list(dict.fromkeys(links))[:50]  # limit to 50 pages for demo

            # Crawl each page
            for link in links:
                try:
                    page_result = await crawl_url(link, car_model)
                    result.chunks.extend(page_result.chunks)
                    result.errors.extend(page_result.errors)
                except Exception as e:
                    result.errors.append(f"Error crawling {link}: {str(e)}")

    except Exception as e:
        result.errors.append(f"Failed to crawl listing page: {str(e)}")

    return result
