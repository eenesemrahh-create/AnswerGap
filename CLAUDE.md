# AnswerGap

Crawls Google "People Also Ask" recursively into a question tree, checks the
search results behind each question, and shows **which questions no site
actually answers**.

Positioning: *"Find the questions your competitors never answered."*

Primary market: **United States** (`location_code=2840`, `language_code=en`).
Other countries are selectable; gap scoring runs in any language that has a pack
in `answergap/languages.py` (currently en, tr, de, es, fr).

Competitor: AlsoAsked (alsoasked.com). They return a question list only. Our
difference is the gap analysis plus, potentially, AI Overview visibility.

## Terminology

Use these consistently; do not invent synonyms:

- **node** — one question in the tree. Each node costs one SERP API call.
- **seed** — the user's starting keyword, the tree's root.
- **credit** — the unit we sell. One search = one credit.
- **gap** — a question no page targets. The product's core concept.

## Data sources

| Layer | Source | Cost |
|---|---|---|
| PAA questions | DataForSEO SERP API | $0.60 / 1000 (Standard queue) |
| Search volume | Google Ads API (direct) | Free |

Google has **no official API** that returns PAA. The Custom Search JSON API does
not return it, is closed to new customers, and shuts down on 1 January 2027 —
do not propose it.

## DataForSEO rules

- Use `type=advanced`. `regular` returns no PAA.
- `depth=10`, fixed. PAA sits at the top of page one; asking deeper multiplies
  cost tenfold for nothing.
- **Use `people_also_ask_click_depth=4`.** Measured: PAA questions per request
  go from 4 to **15**. Extra cost $0.00015/click = $0.0006. Collecting those
  same 15 questions by recursion would cost 4 requests ($0.008).
  **Click depth is ~13x cheaper than recursion.** Build the first two tree
  levels with this parameter, not by recursing.
- **Do NOT use `load_async_ai_overview`.** $0.002 extra for nothing — the
  top-level `ai_overview` element already arrives with `references` populated
  (`asynchronous_ai_overview: false`). Phase 0 wasted money proving this.
- **Standard queue** (async + webhook) for product code. Priority is 2x and
  Live 3.3x, and our workflow is already asynchronous. Validation scripts use
  Live deliberately; see `answergap/dataforseo.py`.
- Use `location_code`, never `location_name` (a spelling change breaks it).
- `location_code` values are Google Geo Target IDs, so the same number works
  against the Ads API. Do not write a mapping table.
- **Node-level fault tolerance is mandatory.** A single `40101 Internal SE
  Server Error` killed a 16-request run during Phase 0.5. One transient error
  must not abandon a 70-node crawl — retry with backoff, and let a node fail
  without failing the tree.

## Cost model — the reason behind the architecture

**Measured in both Turkish and English: the branching factor is exactly 4**,
not the 8 originally assumed. Google shows 4 PAA questions by default in both
markets, so this looks like a Google constant rather than a language effect.

| Depth | Nodes | Original (wrong) assumption |
|---|---:|---:|
| 2 | ~21 | ~73 |
| 3 | ~85 | ~585 |
| 4 | ~341 | ~4681 |

Cost fear was overstated. Depth still stays plan-bound, but the reason is now
**relevance**, not money: deep nodes drift away from the seed and lose value.

Click depth is the first lever, recursion the second: **fill click depth before
recursing.**

## Cache architecture

The cache unit is the **node, not the tree**. Cache at tree level and one stale
node forces 70 calls to be repeated.

Key: `paa:{location_code}:{language_code}:{normalized_question}`

Adaptive TTL:

| Type | TTL |
|---|---|
| News / trending | 6-24 hours |
| Commercial / competitive | 7 days |
| Evergreen | 30-90 days |
| Level 2+ nodes | 2x the root TTL |

If a keyword has not changed across 3 crawls, extend its TTL automatically;
shorten it if it has.

**stale-while-revalidate**: when the TTL expires, serve the old data instantly,
refresh in the background, and tell the user if anything changed. Never make
them wait.

**Do not build city-level search.** Measured twice: Istanbul vs Türkiye and
New York vs United States both returned Jaccard 1.000 — an identical question
set. It would split the cache pool by the number of cities for zero gain.
(Caveat: the US city lookup matched "New York Mills, Minnesota", so that half of
the evidence is weak. The Turkish measurement is solid.)

## Crawler rules

- **Deduplication is mandatory** — hash the normalized question text. Language
  packs supply the per-language rules; see `answergap/text.py`.
- **Cycle breaking is mandatory** — an A→B→A loop burns money. Keep a visited set.
- **Expansion threshold** — stop expanding nodes whose semantic similarity to
  the seed has dropped.

## Scoring

Volume alone is not enough: most long-tail questions return `0` in Ads.
Combine three signals:

1. Search volume (Ads API)
2. **Repeat count in the tree** — how many distinct parents it appeared under.
   Zero extra cost, and the strongest fallback signal.
3. Depth in the tree — shallow nodes are more central.

When volume is missing, never render an empty cell: "Volume: no data ·
Interest: high (8 branches)".

## How a gap is computed — the most important Phase 0 finding

**A gap cannot be computed from the PAA block.** Measured: 32/32 PAA elements
came back as

```
"type": "people_also_ask_ai_overview_expanded_element"
"items": null, "references": null, "asynchronous_ai_overview": true
```

Google now answers PAA with an AI Overview and DataForSEO cannot resolve it.
Both paid parameters were tried; `references` stayed `null`. Source URL
coverage: **0%**. That data is not available and cannot be bought.

**What works:** query the question on its own and compare the **organic
results'** titles and URLs against it. That data does arrive, and the signal
separates:

| Question | Organic results | Reading |
|---|---|---|
| *How much does teeth whitening cost?* | all 8 around 0.67 | well covered |
| *What whitens teeth fastest?* | **1** at 1.00, the other 6 at **0.00** | **real gap** |

The correct metric is **not** "highest overlap" — the second question scores
higher at the top. It is **the number of pages clearing the threshold.**
Few pages = gap.

Consequences:

- Gap analysis costs **one extra SERP call per node**. Discovery is cheap
  (click depth), gap analysis is not. **Keep them separate:** discover the whole
  tree, score gaps only for questions the user cares about.
- That also shapes the credit model: discovery is 1 credit, gap analysis is
  priced separately.

**Known weakness — must be resolved before the threshold is fixed.** Matching is
lexical and misses synonyms. Language packs cover the common classes
(`cost`↔`price`, `TL`↔`fiyat`), but semantics still slip through. A live example
from the English demo tree:

> *"Can 60 year old teeth be whitened?"* is reported as a gap, yet
> `sunlakesdentistry.com — "Can Senior Teeth be Whitened?"` answers it directly.
> `60 year old` ↔ `senior` is a meaning match no word overlap can see.

That is a **false positive in the product's central claim**. Settle it with
embeddings or a broader synonym layer before fixing the threshold.

## Diff engine

After a refresh, compare old and new:

- **Added questions** → notify. The most valuable signal.
- **Disappeared questions** → a content-refresh signal.
- **Order changes** → noise, **DO NOT NOTIFY**. PAA ordering moves even for an
  identical query; notifying would drown users in false alarms.

Keep old versions. Historical PAA data exists nowhere else and becomes our most
defensible asset over time.

## Accuracy rules — watch this in UI copy

- **PAA ordering is NOT popularity ordering.** It is Google's relevance
  clustering. "Most popular" is only usable once volume data is attached.
- Collect ~70 questions to show 10, then cut from the top. Collecting 10 and
  showing 10 is not ranking.
- ChatGPT/Claude prompt volume **cannot be bought**. If such a feature ships it
  must be labelled "estimated" and never presented as real data.
- Show "Last updated: X" on every result. Never claim "live data".
- **Never show a question with no fetched results as a gap.** Unknown is
  unknown; the UI must render it distinctly (dashed outline, `no_data`).

## Pricing principles

- Cached results are free; "refresh now" costs 1 credit.
- Depth is plan-bound.
- Every plan can buy extra credits — gating that behind an upgrade drives churn.
- Do not restrict search history (AlsoAsked's 24-hour lock is bad practice).
- Agency plan ($99-199): white-label reports, multiple workspaces, scheduled crawls.

## Open questions

- [ ] What should the gap threshold be, and how is the synonym problem solved —
      dictionary or embeddings? `scripts/phase05_evaluate.py` is set up to
      settle this against labelled data.
- [ ] Should AI Overview become a product surface? The top-level `ai_overview`
      element arrives with references — *"does Google's AI answer this, and who
      does it cite?"* is a signal AlsoAsked does not have.
- [ ] Does PAA stability hold across the day? Both stability runs were
      back-to-back; re-measure at different hours.
- [ ] Payment stack for a US-first product (Stripe). The earlier TRY +
      iyzico/PayTR assumption no longer applies.

---

# Current state — resume here

Last worked: 2026-08-25. Working tree clean.

**First commit: `cdd581a`** — "Initial commit: validated prototype, US-first,
five languages". 113 files. No remote configured yet; nothing has been pushed.

Two things stayed out of it on purpose:

- `.env` — real DataForSEO credentials, gitignored. `.env.example` carries
  placeholders only. **Never put a real value in `.env.example`; it is tracked.**
- `data/raw/locations-*.json` — the US dump alone is ~15 MB. They come from a
  free endpoint and are reproducible, so they live on disk as cache but stay out
  of the repository. Everything else in `data/raw/` **is** committed: SERP
  responses are the archival evidence every number in the reports traces back to.

## What exists and works

- **Core** (`answergap/`) — language-aware normalization, matching, tree
  building, DataForSEO client. Six modules, all English.
- **API** (`api/main.py`) — FastAPI over the archived data. Endpoints:
  `/api/meta`, `/api/trees`, `/api/tree/{slug}`,
  `/api/tree/{slug}/question/{qslug}`, `/api/countries`, `/api/languages`.
- **Interface** (`web/`) — Next.js 16, four screens: search/landing, question
  tree (pan/zoom), gap table, question detail. Builds clean.
- **i18n** — English default plus de/es/fr/tr. `en.ts` defines the type; a
  missing key in any locale fails `npm run build`. Verified by deliberately
  adding a key and watching all four locales fail with TS2741.
- **Countries** — 213 entries in `data/locations/countries.json`.
- **Three demo trees** built from real Google data:

| Seed | Market | Nodes | gap / weak / covered / no_data |
|---|---|---:|---|
| teeth whitening | en / 2840 | 19 | 1 / 2 / 13 / 3 |
| diş beyazlatma | tr / 2792 | 51 | 2 / 5 / 17 / 27 |
| kredi notu nasıl yükseltilir | tr / 2792 | 21 | 5 / 1 / 3 / 12 |

Architecture walkthrough (diagrams, the evidence ledger, the known failure):
https://claude.ai/code/artifact/8728066b-da07-4931-9b8e-241db01fafde

## Restarting after a reboot

```bash
# backend, from the project root
python -m uvicorn api.main:app --reload --port 8000

# frontend, separate terminal
cd web && npm run dev        # http://localhost:3000
```

`fastapi` and `uvicorn` are already installed. `.env` already holds working
DataForSEO credentials and is gitignored. `uvicorn.exe` is not on PATH — use
`python -m uvicorn`. On Windows `pkill` does not stop it; kill by port instead.

## Spend to date

**~$0.107** total. Cache files under `data/raw/` mean re-running any script
costs nothing — every script prints `Billable: 0` when the data is on disk.
Always run `--dry-run` first; it prints the request plan and cost without
touching the network.

One unplanned charge: `phase05_collect.py` cost $0.030 when its sampling pool
changed and re-fetched 15 questions. Check the dry run before running collect.

## Next: Phase B — live crawl + in-UI feedback

Chosen before the interruption. Two parts, and they belong together:

1. **Live crawl.** Wire the search box to DataForSEO. The country/language
   picker is already built and remembers its selection; it just needs an
   endpoint behind it. Standard queue (not Live), `click_depth=4` first, recurse
   only for level 3+, node-level retry on transient errors.
2. **Feedback in the interface.** A *"is this really a gap?"* thumbs up/down on
   every scored question. This is what makes the unvalidated threshold solvable:
   labelling becomes a by-product of use rather than a chore. Feed the collected
   labels into `scripts/phase05_evaluate.py`.

## Immediately actionable, no new code needed

The threshold can be validated right now against data already on disk:

```bash
python scripts/phase05_collect.py --language en   # form is already generated
# fill data/PHASE05_labels.csv  -> G (gap) / N (not) / ? (skip)
python scripts/phase05_evaluate.py                # 72 rules, ranked by precision
```

Iterating costs **$0** — the SERP responses are cached. If a miss turns out to
be a synonym problem, add the word to the right pack in `answergap/languages.py`
and re-run.
