# AnswerGap

Expands Google "People Also Ask" into a question tree and shows **which
questions no site actually answers**.

> *"Find the questions your competitors never answered."*

Product decisions and the reasoning behind them: [`CLAUDE.md`](CLAUDE.md)

---

## Status: prototype

Four working screens, fed by **real Google data** — but archived data from the
validation runs, not a live crawl.

| | Status |
|---|---|
| Question tree, table, detail, search screen | working |
| Interface in 5 languages (en/de/es/fr/tr) | working |
| Country + language selection | UI ready, not wired to a crawl |
| Gap scoring | working, **threshold unvalidated** |
| Live DataForSEO crawl | not built |
| Search volume (Google Ads) | not built |
| Database, auth, billing | not built |

Primary market is the United States (`location_code=2840`, `language_code=en`).

---

## Running it

Two processes.

```bash
# 1) Backend  (from the project root)
pip install fastapi uvicorn
python -m uvicorn api.main:app --reload --port 8000

# 2) Frontend (separate terminal)
cd web
npm install
npm run dev
```

Then open **http://localhost:3000**. If the backend is down the interface says
so and prints the command.

Optional, free: `python scripts/fetch_countries.py` populates the country
picker with all 213 Google-targetable countries.

---

## Layout

```
answergap/        Shared core — both scripts/ and api/ import from here
  languages.py      Per-language packs: stop words, synonyms, folding, stem length
  text.py           Normalization, tokens, dedup keys
  matching.py       Question-to-page matching (words / stems / synonyms)
  tree.py           Tree building + THE GAP RULE
  dataforseo.py     API client: caching, budget guard, retry on transient errors
api/main.py       FastAPI — serves archived trees, returns codes not prose
web/              Next.js interface
  i18n/             en.ts is the source of truth; the rest must match its shape
scripts/          One-off validation runs. Not product code.
data/raw/         Every API response ever paid for, kept as evidence
data/PHASE0_*.md  Validation reports
```

Two invariants hold this together:

- **The gap rule lives in exactly one place** (`answergap/tree.py`). If the
  validation scripts and the product computed it separately, the metric we
  measure and the metric we ship would drift apart silently.
- **`web/i18n/en.ts` defines the type every locale must satisfy.** Adding a
  string breaks the build until all five translations exist. Keeping
  translations in sync is a compiler error, not a discipline problem.

---

## How a gap is computed

Phase 0 measured that **PAA carries no usable source data**. Google answers
People Also Ask with an AI Overview and DataForSEO cannot resolve it — 32 of 32
elements returned `references: null`, and both paid parameters were tried.

So a gap is computed from the question's **own search results**:

1. Query the question on its own; take the organic results' titles and URLs.
2. Score word overlap against the question, using the `synonyms` strategy —
   stem truncation plus semantic classes, so `cost` matches `price` and
   `kaç TL` matches `fiyatları`.
3. Count how many results clear the threshold — **not** the highest single
   score. `0 → gap · 1-2 → weak · 3+ → covered`.

Questions whose results were never fetched are marked **`no_data`** and are
never counted as gaps. The UI draws them with a dashed outline.

### The known weakness

The threshold (`tree.THRESHOLD = 0.60`) is **not validated**. Matching is
lexical, so semantic pairs slip through. A live example from the English demo:

> *"Can 60 year old teeth be whitened?"* is reported as a gap, yet
> `sunlakesdentistry.com — "Can Senior Teeth be Whitened?"` answers it directly.
> `60 year old` ↔ `senior` is a meaning match no word overlap can see.

That is a false positive in the product's central claim. The harness to settle
it exists and runs against data already on disk:

```bash
python scripts/phase05_collect.py --language en   # builds a labelling form
# fill in data/PHASE05_labels.csv  (G / N / ?)
python scripts/phase05_evaluate.py                # tests 72 rules, ranks by precision
```

---

## Adding a market

1. Add a `Language(...)` entry to `answergap/languages.py` — stop words, synonym
   classes, folding rules, stem length.
2. Add the locale to `web/i18n/` (the build will tell you what is missing).
3. Re-run `scripts/phase0_validate.py` for that market: branching factor,
   dedup quality and PAA behaviour are all language-specific and must be
   re-measured, not assumed.

Search language is deliberately limited to languages with a pack. Scoring a
language with the wrong stop words produces confident nonsense.

---

## Cost

DataForSEO SERP API, Standard queue: $0.60/1000 requests. Validation to date has
spent **~$0.107** total.

Measured branching factor is **4** in both Turkish and English (the original
model assumed 8), so depth 3 is ~85 nodes rather than ~585.
`people_also_ask_click_depth=4` returns 15 questions in a single request —
roughly 3x cheaper than recursing for the same output.
