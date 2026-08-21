"""
Gemini integration — replaces Marketaux entirely.

Two call shapes:
  - Grounded (Google Search tool) + structured JSON output, for anything that
    needs real, current information: news articles, broad market sentiment,
    geopolitical hotspots. These cost a billable search query per call, so
    every grounded function here is wrapped in a module-level TTL cache.
  - Plain (no grounding), for the AI Take narrative — it only reasons over
    numbers the backend already computed, so it's cheap token generation
    with zero search cost and doesn't need caching for cost reasons (still
    cached briefly to avoid regenerating identical text on rapid repeat
    requests for the same symbol).
"""
import os
import time
from typing import List, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.6-flash"

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def is_configured() -> bool:
    return bool(GEMINI_API_KEY)


# ── tiny TTL cache, shared by all grounded calls below ──────────────────────

_cache: dict = {}


def _cache_get(key: str, ttl_s: float):
    entry = _cache.get(key)
    if entry and time.time() - entry["at"] < ttl_s:
        return entry["value"]
    return None


def _cache_set(key: str, value):
    _cache[key] = {"value": value, "at": time.time()}


# ── schemas ───────────────────────────────────────────────────────────────

class NewsArticle(BaseModel):
    title: str
    summary: str
    source: str
    url: str
    published: str
    impact: str          # Bullish | Bearish | Neutral
    sentiment_score: float  # -1..1


class SymbolNewsResult(BaseModel):
    articles: List[NewsArticle]
    overall_sentiment: float  # -1..1


class SentimentReading(BaseModel):
    sentiment: float  # -1..1


class Hotspot(BaseModel):
    region: str
    label: str
    level: str  # Low | Medium | High


class HotspotList(BaseModel):
    hotspots: List[Hotspot]


def _valid_url(u: str) -> bool:
    return isinstance(u, str) and u.startswith(("http://", "https://"))


# ── grounded + structured calls ──────────────────────────────────────────

async def fetch_symbol_news(symbol: str) -> dict:
    """Real, current news for *symbol* with per-article sentiment. Cached
    30 min per symbol — a grounded search query is the billable unit here,
    not the LLM tokens, so repeat views of a popular stock don't multiply
    cost."""
    cache_key = f"news:{symbol}"
    cached = _cache_get(cache_key, ttl_s=30 * 60)
    if cached is not None:
        return cached

    client = _get_client()
    prompt = (
        f"Find up to 6 recent, real news articles about the Indian stock {symbol} "
        f"(NSE/BSE listed company). Only include articles you actually found via "
        f"search — never invent one. For each: an accurate title, a 1-2 sentence "
        f"summary, the publication name, the exact article URL from your search "
        f"results, the publish date (YYYY-MM-DD), a sentiment_score from -1 "
        f"(very bearish) to 1 (very bullish), and an impact label of Bullish, "
        f"Bearish, or Neutral. Also give an overall_sentiment average across "
        f"all articles found."
    )
    response = await client.aio.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            response_mime_type="application/json",
            response_schema=SymbolNewsResult,
        ),
    )
    parsed: SymbolNewsResult = response.parsed
    articles = []
    for a in parsed.articles:
        d = a.model_dump()
        if not _valid_url(d.get("url", "")):
            d["url"] = ""  # frontend treats a missing url as non-clickable, not broken
        articles.append(d)
    result = {"articles": articles, "overall_sentiment": round(parsed.overall_sentiment, 3)}
    _cache_set(cache_key, result)
    return result


async def fetch_broad_sentiment(cache_key: str, query: str) -> Optional[float]:
    """Non-symbol-specific market mood (e.g. 'India equities', 'global
    markets'). Shared across all users — cached 60 min."""
    cached = _cache_get(f"sentiment:{cache_key}", ttl_s=60 * 60)
    if cached is not None:
        return cached

    client = _get_client()
    prompt = (
        f"Based on current, real news, what is the overall market sentiment "
        f"for: {query}? Answer with a single sentiment score from -1 (very "
        f"bearish) to 1 (very bullish), based on real recent news you find."
    )
    try:
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                response_schema=SentimentReading,
            ),
        )
        value = round(response.parsed.sentiment, 3)
    except Exception:
        value = _cache_get(f"sentiment:{cache_key}", ttl_s=float("inf"))  # serve stale over a hard failure

    _cache_set(f"sentiment:{cache_key}", value)
    return value


async def fetch_geopolitical_hotspots() -> List[dict]:
    """Shared across all users — cached 60 min, same reasoning as broad
    sentiment above."""
    cached = _cache_get("hotspots", ttl_s=60 * 60)
    if cached is not None:
        return cached

    client = _get_client()
    prompt = (
        "Based on current real news, identify the top 3 geopolitical or "
        "macro risk hotspots most relevant to Indian equity markets right "
        "now. For each: a short region/topic name, a one-sentence "
        "explanation of why it matters to Indian markets, and a risk level "
        "of Low, Medium, or High."
    )
    try:
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                response_schema=HotspotList,
            ),
        )
        result = [h.model_dump() for h in response.parsed.hotspots]
    except Exception:
        result = _cache_get("hotspots", ttl_s=float("inf")) or []

    _cache_set("hotspots", result)
    return result


# ── plain (ungrounded) call — AI Take narrative ──────────────────────────

def generate_ai_take(symbol: str, prediction: dict) -> Optional[str]:
    """Short plain-English read on a prediction, synthesized from data the
    backend already computed. No search grounding — no search-query cost,
    just cheap Flash token generation. Cached briefly per (symbol, signal,
    regime) so identical repeat predictions don't regenerate text."""
    cache_key = f"take:{symbol}:{prediction.get('signal')}:{prediction.get('regime')}"
    cached = _cache_get(cache_key, ttl_s=30 * 60)
    if cached is not None:
        return cached

    client = _get_client()
    ind = prediction.get("indicators", {})
    prompt = (
        f"You are a terse, expert quant trading assistant. Given this data for "
        f"{symbol}, write a 2-3 sentence plain-English read on the current "
        f"signal, referencing the concrete indicator values. Direct, no fluff, "
        f"end with one short risk caveat.\n\n"
        f"Signal: {prediction.get('signal')} (confidence {prediction.get('confidence')})\n"
        f"Regime: {prediction.get('regime')}\n"
        f"RSI: {ind.get('rsi')}, MACD hist: {ind.get('macd_hist')}, "
        f"ADX: {ind.get('adx')}, India VIX: {ind.get('india_vix')}, "
        f"20d momentum: {ind.get('momentum_20')}\n"
        f"Primary target: {prediction.get('primary_target')}, "
        f"stop: {prediction.get('primary_stop')}\n"
    )
    try:
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        text = (response.text or "").strip()
    except Exception:
        text = None

    _cache_set(cache_key, text)
    return text
