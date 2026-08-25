"""Language-aware text normalization: dedup keys and token sets.

Replaces the Turkish-only `normalize_tr` module. Every function now takes a
language code, and the language-specific rules live in `languages.py`.

Deliberately no real stemming. Phase 0 measured whether Turkish needed one:
24 collected questions produced 3 exact duplicates, all caught by plain
normalization, and zero near-duplicates that a stemmer would have merged. The
finding was "not yet justified" — five language-specific stemmers to serve five
markets is a large dependency for an unvalidated benefit. Re-measure as the
corpus grows.
"""

from __future__ import annotations

import re
import unicodedata
from urllib.parse import unquote, urlsplit

from . import languages
from .languages import Language

# Keep letters (any alphabet), digits and spaces; everything else separates.
_KEEP = re.compile(r"[^\w\s]", re.UNICODE)
_WS = re.compile(r"\s+")


def _lang(code: str | Language | None) -> Language:
    return code if isinstance(code, Language) else languages.get(code)


def to_lower(text: str, language: str | Language | None = None) -> str:
    return languages.to_lower(text, _lang(language))


def normalize(text: str, language: str | Language | None = None) -> str:
    """Dedup key: lowercased, punctuation stripped, whitespace collapsed.

    This is the question half of the cache key described in CLAUDE.md
    (`paa:{location_code}:{language_code}:{normalized_question}`).
    """
    if not text:
        return ""
    lang = _lang(language)
    text = unicodedata.normalize("NFC", text)
    text = languages.to_lower(text, lang)
    text = _KEEP.sub(" ", text)
    text = text.replace("_", " ")
    return _WS.sub(" ", text).strip()


def tokens(text: str, language: str | Language | None = None) -> set[str]:
    """All words, stop words included."""
    normalized = normalize(text, language)
    return set(normalized.split()) if normalized else set()


def content_tokens(text: str, language: str | Language | None = None) -> set[str]:
    """Meaning-bearing words: stop words and very short tokens removed.

    Used when comparing a question against a page title. Words like "how" or
    "the" appear on every page, so their presence or absence says nothing about
    whether the page targets the question.

    Short tokens are dropped as noise EXCEPT when the language pack declares
    them meaningful. Turkish "TL" is two characters but carries the entire
    point of "Diş beyazlatma işlemi kaç TL?" — dropping it before the synonym
    table can map it to the price class loses the match the table exists to
    catch. Currency codes and units hit this repeatedly.
    """
    lang = _lang(language)
    kept = set()
    for t in tokens(text, lang):
        if t in lang.stopwords:
            continue
        if len(t) >= lang.min_token_length:
            kept.add(t)
        elif languages.synonym_class(languages.stem(t, lang), lang):
            kept.add(t)
    return kept


def url_tokens(url: str, language: str | Language | None = None) -> set[str]:
    """Meaningful words from a URL path.

    https://example.com/blog/teeth-whitening-cost/ ->
        {"blog", "teeth", "whitening", "cost"}

    Slugs are normally written without accents, so callers must fold both sides
    before comparing (see `fold_all`).
    """
    if not url:
        return set()
    try:
        path = urlsplit(url).path
    except ValueError:
        return set()
    lang = _lang(language)
    out: set[str] = set()
    for part in re.split(r"[^\w]+", unquote(path), flags=re.UNICODE):
        normalized = normalize(part, lang)
        if not normalized or normalized.isdigit():
            continue
        for word in normalized.split():
            if len(word) >= lang.min_token_length and not word.isdigit():
                out.add(word)
    return out


def fold(token: str, language: str | Language | None = None) -> str:
    return languages.fold(token, _lang(language))


def fold_all(items: set[str], language: str | Language | None = None) -> set[str]:
    lang = _lang(language)
    return {languages.fold(t, lang) for t in items}


def stem_all(items: set[str], language: str | Language | None = None) -> set[str]:
    lang = _lang(language)
    return {languages.stem(t, lang) for t in items}


def jaccard(a: set[str], b: set[str]) -> float:
    """Set similarity. Two empty sets are considered identical."""
    if not a and not b:
        return 1.0
    union = a | b
    return len(a & b) / len(union) if union else 1.0


def coverage(needle: set[str], haystack: set[str]) -> float:
    """How much of `needle` appears in `haystack`. Empty needle -> 0.0.

    Direction matters: we ask whether the question's words are present on the
    page, not the reverse. A long page title may cover a short question; a short
    title cannot cover a long question.
    """
    if not needle:
        return 0.0
    return len(needle & haystack) / len(needle)
