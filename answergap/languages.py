"""Per-language packs for text normalization and question/page matching.

WHY THIS EXISTS
---------------
Phase 0 was run against Turkish. Several things we measured turned out to be
language-specific, and a multi-country product cannot hardcode them:

  * Turkish has a dotted/dotless i problem. `"İstanbul".lower()` in Python
    produces a combining dot, and `"IŞIK".lower()` maps I to `i` instead of `ı`.
    Both silently corrupt deduplication. No other target language has this.
  * Synonym classes are language-bound. In Turkish "kaç TL" and "fiyatları" ask
    the same thing; in English it is "how much" and "price". Word overlap alone
    cannot see either.
  * Stop words obviously differ.
  * Stem truncation length differs. Turkish is agglutinative and needs a longer
    stem before the suffixes start; English words are shorter.

Nothing measured in Phase 0 is discarded here — the Turkish pack carries the
exact stop word and synonym data that was validated against real SERP output.
It is scoped to Turkish rather than applied to every language.

ADDING A LANGUAGE
-----------------
Add a `Language(...)` entry to `LANGUAGES`. Everything downstream (normalization,
matching, tree building) picks it up. Keep synonym classes SMALL and grounded in
observed misses — speculative entries create false matches, which in this product
means claiming a gap that is not there.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Language:
    code: str
    name: str
    """Characters remapped BEFORE `.lower()` is called."""
    pre_lower: dict[str, str] = field(default_factory=dict)
    """Extra folding applied after Unicode accent stripping (ß, œ, ı …)."""
    extra_fold: dict[str, str] = field(default_factory=dict)
    stopwords: frozenset[str] = frozenset()
    """word -> semantic class. Words in the same class count as a match."""
    synonyms: dict[str, str] = field(default_factory=dict)
    """How many characters of a folded token form its stem."""
    stem_length: int = 5
    """Tokens shorter than this are dropped from content comparison."""
    min_token_length: int = 3


def _fold_base(text: str) -> str:
    """Strip accents via Unicode decomposition.

    Handles most of what our target languages need: ç→c, ğ→g, ş→s, ö→o, ü→u,
    ñ→n, é→e. Characters that are NOT decomposable (Turkish dotless ı, German ß,
    French œ) are covered by each language's `extra_fold`.
    """
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c))


# --------------------------------------------------------------------- English

ENGLISH = Language(
    code="en",
    name="English",
    stopwords=frozenset(
        """
        the a an of to in for on at by with from is are was were be been being
        do does did can could should would will what how why when where which
        who whom this that these those it its and or but not no as if then than
        you your my me we our they their he she his her about into over
        """.split()
    ),
    synonyms={
        # Every entry below traces to a real miss pattern: the question and the
        # page that answers it share meaning but no words.
        # "how much does teeth whitening cost" vs "Teeth Whitening Prices 2026"
        "cost": "price", "costs": "price", "price": "price", "prices": "price",
        "pricing": "price", "fee": "price", "fees": "price", "expensive": "price",
        "cheap": "price", "afford": "price", "worth": "price",
        # "how to whiten teeth" vs "Teeth Whitening Methods"
        "how": "method", "method": "method", "methods": "method", "way": "method",
        "ways": "method", "technique": "method", "techniques": "method",
        "procedure": "method", "process": "method", "steps": "method",
        # "is teeth whitening bad" vs "Side Effects of Whitening"
        "risk": "risk", "risks": "risk", "side": "risk", "effect": "risk",
        "effects": "risk", "harmful": "risk", "harm": "risk", "damage": "risk",
        "dangerous": "risk", "danger": "risk", "safe": "risk", "safety": "risk",
        "bad": "risk",
        # "how long does it last" vs "Whitening Duration"
        "long": "duration", "last": "duration", "lasts": "duration",
        "permanent": "duration", "duration": "duration", "hours": "duration",
        "days": "duration", "weeks": "duration", "months": "duration",
        "years": "duration",
        # "whiten teeth at home" vs "Natural DIY Whitening"
        "home": "home", "diy": "home", "natural": "home", "naturally": "home",
        "yourself": "home",
    },
    # English words are short; 5 chars would split price/pricing.
    stem_length=4,
)


# --------------------------------------------------------------------- Turkish

TURKISH = Language(
    code="tr",
    name="Türkçe",
    # THE Turkish trap. Must run before .lower():
    #   "İstanbul".lower() -> "i̇stanbul" (i + U+0307 combining dot)
    #   "IŞIK".lower()     -> "işik"      (I should become ı, not i)
    pre_lower={"I": "ı", "İ": "i"},
    # ı is not decomposable, so NFD stripping cannot reach it.
    extra_fold={"ı": "i"},
    stopwords=frozenset(
        """
        ve ile için bir bu şu o da de ki ya mı mi mu mü mıdır midir mudur müdür
        ne kaç hangi kim kime kimi en çok daha var yok olur olan gibi ise ama veya
        """.split()
    ),
    synonyms={
        # Carried over verbatim from the Phase 0 matcher — these were checked
        # against real Turkish SERP titles.
        "fiyat": "price", "ücret": "price", "tl": "price", "lira": "price",
        "maliyet": "price", "para": "price", "kaça": "price",
        "yöntem": "method", "nasıl": "method", "yol": "method",
        "teknik": "method", "işlem": "method", "uygulama": "method",
        "zarar": "risk", "risk": "risk", "tehlike": "risk", "yan": "risk",
        "etki": "risk", "güvenli": "risk",
        "süre": "duration", "kalıcı": "duration", "yıl": "duration",
        "gün": "duration", "hafta": "duration", "ay": "duration",
        "sürer": "duration",
        "ev": "home", "evde": "home", "doğal": "home", "kendi": "home",
    },
    # Agglutinative: suffixes pile up, so the stem needs more characters.
    stem_length=5,
)


# ---------------------------------------------------------------------- German

GERMAN = Language(
    code="de",
    name="Deutsch",
    extra_fold={"ß": "ss"},
    stopwords=frozenset(
        """
        der die das ein eine einen einem einer und oder aber von zu in für auf
        mit bei aus nach ist sind war waren sein kann kann man wie was warum
        wann wo welche welcher wer nicht kein keine als wenn dann es sie er ich
        wir ihr mein dein
        """.split()
    ),
    synonyms={
        "kosten": "price", "preis": "price", "preise": "price",
        "gebühr": "price", "teuer": "price", "günstig": "price",
        "wie": "method", "methode": "method", "methoden": "method",
        "weg": "method", "verfahren": "method", "anwendung": "method",
        "risiko": "risk", "risiken": "risk", "nebenwirkung": "risk",
        "nebenwirkungen": "risk", "schädlich": "risk", "schaden": "risk",
        "gefährlich": "risk", "sicher": "risk",
        "dauer": "duration", "lange": "duration", "hält": "duration",
        "dauerhaft": "duration", "tage": "duration", "wochen": "duration",
        "monate": "duration", "jahre": "duration",
        "hause": "home", "zuhause": "home", "natürlich": "home",
        "selbst": "home",
    },
    # Compounding makes German words long; a short stem would over-merge.
    stem_length=5,
)


# --------------------------------------------------------------------- Spanish

SPANISH = Language(
    code="es",
    name="Español",
    stopwords=frozenset(
        """
        el la los las un una unos unas de del a al en para por con y o pero es
        son era eran ser que qué cómo por qué cuándo dónde cuál quién no se lo
        su sus mi tu este esta esto más muy
        """.split()
    ),
    synonyms={
        "costo": "price", "coste": "price", "precio": "price",
        "precios": "price", "cuánto": "price", "cuesta": "price",
        "tarifa": "price", "caro": "price", "barato": "price",
        "cómo": "method", "método": "method", "métodos": "method",
        "manera": "method", "forma": "method", "proceso": "method",
        "procedimiento": "method",
        "riesgo": "risk", "riesgos": "risk", "efecto": "risk",
        "efectos": "risk", "secundarios": "risk", "dañino": "risk",
        "daño": "risk", "peligroso": "risk", "seguro": "risk",
        "duración": "duration", "dura": "duration", "cuánto": "duration",
        "permanente": "duration", "días": "duration", "semanas": "duration",
        "meses": "duration", "años": "duration",
        "casa": "home", "caseros": "home", "casero": "home",
        "natural": "home", "naturales": "home",
    },
    stem_length=5,
)


# ---------------------------------------------------------------------- French

FRENCH = Language(
    code="fr",
    name="Français",
    extra_fold={"œ": "oe", "æ": "ae"},
    stopwords=frozenset(
        """
        le la les un une des du de a à au aux en pour par avec et ou mais est
        sont était étaient être que quoi comment pourquoi quand où quel quelle
        qui ne pas plus très ce cette ces son sa ses mon ma mes on il elle nous
        vous ils elles
        """.split()
    ),
    synonyms={
        "coût": "price", "cout": "price", "prix": "price", "tarif": "price",
        "combien": "price", "coûte": "price", "cher": "price",
        "comment": "method", "méthode": "method", "méthodes": "method",
        "façon": "method", "manière": "method", "procédure": "method",
        "processus": "method",
        "risque": "risk", "risques": "risk", "effet": "risk",
        "effets": "risk", "secondaires": "risk", "nocif": "risk",
        "dangereux": "risk", "danger": "risk", "sûr": "risk",
        "durée": "duration", "dure": "duration", "longtemps": "duration",
        "permanent": "duration", "jours": "duration", "semaines": "duration",
        "mois": "duration", "ans": "duration",
        "maison": "home", "naturel": "home", "naturelle": "home",
        "soi": "home",
    },
    stem_length=5,
)


LANGUAGES: dict[str, Language] = {
    lang.code: lang for lang in (ENGLISH, TURKISH, GERMAN, SPANISH, FRENCH)
}

DEFAULT_LANGUAGE = "en"

# United States. DataForSEO location codes are Google Geo Target IDs, so the
# same value works against the Google Ads API without a mapping table.
DEFAULT_LOCATION_CODE = 2840


def get(code: str | None) -> Language:
    """Look up a language pack, falling back to English.

    Falls back rather than raising: a tree built from archived data may carry a
    language we have no pack for, and refusing to render it would be worse than
    matching it with generic rules.
    """
    if not code:
        return LANGUAGES[DEFAULT_LANGUAGE]
    return LANGUAGES.get(code.lower(), LANGUAGES[DEFAULT_LANGUAGE])


def fold(text: str, language: Language) -> str:
    """Reduce text to a plain ASCII-ish form for cross-writing comparison.

    URL slugs are almost always written without accents ("diş" appears as "dis",
    "coût" as "cout"), so both sides of a comparison must be folded before they
    can match.
    """
    for src, dst in language.extra_fold.items():
        text = text.replace(src, dst)
    return _fold_base(text)


def to_lower(text: str, language: Language) -> str:
    for src, dst in language.pre_lower.items():
        text = text.replace(src, dst)
    return text.lower()


def stem(token: str, language: Language) -> str:
    """Crude stem: fold, then truncate.

    This is deliberately not a real stemmer. Phase 0 measured that a proper
    stemmer (zeyrek and friends) was not yet justified for Turkish, and adding
    five language-specific stemmers to serve five markets would be a large
    dependency for an unvalidated benefit. Truncation over-merges occasionally;
    that is an accepted, documented trade.
    """
    return fold(token, language)[: language.stem_length]


def synonym_class(token_stem: str, language: Language) -> str | None:
    """Semantic class for a stem, if the language pack declares one."""
    return _synonym_stems(language).get(token_stem)


_synonym_cache: dict[str, dict[str, str]] = {}


def _synonym_stems(language: Language) -> dict[str, str]:
    """Synonym table keyed by stem rather than by whole word.

    Built once per language: entries are authored as readable words, but lookups
    happen against stems, so "prices" and "pricing" both reach the price class.
    """
    cached = _synonym_cache.get(language.code)
    if cached is None:
        cached = {}
        for word, klass in language.synonyms.items():
            cached[stem(to_lower(word, language), language)] = klass
        _synonym_cache[language.code] = cached
    return cached


def stopword_stems(language: Language) -> frozenset[str]:
    return frozenset(
        stem(to_lower(w, language), language) for w in language.stopwords
    )
