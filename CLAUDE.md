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
- **`seed_question` gives the real parent — one request is a TREE, not a list.**
  Measured on `probe-A-click4.json`: with `click_depth=4` the 15 PAA elements
  carry a `seed_question` field. Elements 0-3 have it `null` (Google's original
  four); elements 4-14 name the question that was clicked to reveal them. So a
  single request yields two genuine levels, parents included — no recursion.
  **Wrinkle:** three of the four named parents were NOT among the original four,
  because Google reflows the block as it expands. Add any unseen `seed_question`
  as a level-1 node or its children are orphaned. See `answergap/live.py`.
- **Do NOT use `load_async_ai_overview`.** $0.002 extra for nothing — the
  top-level `ai_overview` element already arrives with `references` populated
  (`asynchronous_ai_overview: false`). Phase 0 wasted money proving this.
- **Read the cost from the response, never estimate it.** Each response carries
  its own `cost`. Measured: a click-depth request reports **$0.0026** while
  `LIVE_COST_PER_REQUEST` estimates $0.00198 — 31% low, because the flat
  estimate does not carry the per-click surcharge. A plain scoring request is
  **$0.0020**. `live._spend()` records the reported figure; a cache hit is $0
  whatever the stored response once cost.
- **Standard queue** (async + webhook) for product code. Priority is 2x and
  Live 3.3x, and our workflow is already asynchronous. Validation scripts use
  Live deliberately; see `answergap/dataforseo.py`.
  **Current deviation:** `answergap/live.py` uses Live too. Standard means post,
  poll `tasks_ready`, fetch — minutes, and a webhook cannot reach a laptop. That
  is the wrong trade behind an interactive search box for a tenth of a cent.
  Swapping it back is a one-module change and belongs in the move to a server.
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

**This rule was broken on 2026-08-27 and it cost real data.** The SERP cache was
keyed per node correctly, but the *built tree* was persisted as one JSON document
under `data/live/trees/`. Re-running the same search rebuilt that document from
the fresh PAA response and **destroyed a gap score that had already been paid
for** — the counts fell from `covered: 2` to `covered: 1`. `live._carry_previous()`
patches the symptom by carrying scored nodes across a re-crawl; the cause is
storing the tree as a document at all, and that is what the storage migration
fixes. A tree belongs in edge rows, where a re-crawl is an insert and cannot
overwrite anything.

**Harvesting widened that same hole.** Harvested nodes come out of scoring
responses, so a re-crawl rebuilding from the seed response alone cannot
rediscover them — without a carry it would delete them outright.
`_carry_previous` now carries three things: gap scores, harvested nodes
(parents first, orphans dropped) and related searches. Three carries patching
one document-shaped wound is the argument for the storage migration, not
against it.

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

## Scoring is also a discovery call — harvest it

Measured 2026-08-27 across the eleven `knight online` responses on disk: **every
SERP response carries its own PAA block (4 questions) and its own related
searches (8 phrases)**, alongside the organic results gap scoring reads. Reading
only `organic` discarded **27 unseen questions and 71 phrases already paid for**
— the tree was 14 nodes where the same money had bought 41.

Separating discovery from scoring stays right. Discarding the rest of the
response does not. `live.score` now folds both back in, so the tree widens as a
by-product of scoring at **no extra cost**.

Related searches are **not questions and must never become nodes.** "Knight
Online private server" is a query. They are the **next seeds**, and they are a
surface AlsoAsked does not have.

## The relevance gate — `relevance` and `reach`

Harvesting without a gate widens the tree with garbage. "knight online" is a
game; "knight" is a medieval soldier, and Google slides between the two.

`matching.seed_relevance` scores a question against the seed with the same
machinery as page matching, pointed the other way. Measured on 44 harvested
questions:

| Score | Count | Reading |
|---|---:|---|
| 1.00 | 9 | on topic |
| 0.50 | 23 | **undecidable** |
| 0.00 | 12 | drifted |

The extremes separate cleanly; the middle band cannot be split, and it holds
"Is there a free-to-play knight game available?" beside "Did any peasants become
knights?". **This is the same lexical wall already recorded against the gap
threshold** (`60 year old` ↔ `senior`). One embedding layer settles both open
questions — which is why the labelling round comes before the schema.

**Gate on `reach`, not `relevance`.** Judging each child alone let drift
*compound*: "Why did knights end?" scores 0.5, so does every medieval question
under it, and the whole branch walked in. `reach` = a node's own relevance times
its parent's reach. Drift accumulates along a path, so the score must too — and
that is literally the rule above, *stop expanding **nodes** that have drifted*.

`EXPANSION_FLOOR = 0.25`, measured not picked. A two-word seed makes the score
coarse, so reach only lands on 1.0 / 0.5 / 0.25 / 0.125 / 0:

| Floor | Kept | Cut | What the cut removes |
|---|---:|---:|---|
| 0.50 | 8 | 25 | the medieval branch **and** the knight-game alternatives |
| 0.25 | 14 | 19 | the medieval branch only |

0.5 also throws away "What is the best knight game?" — a competitor question,
exactly what this product exists to find. **Two hops of half-drift is adjacency;
three is a different subject.**

**The gate applies to the harvest only, never to the seed response.** Google's
answer to the seed is the primary data; filtering it would be second-guessing
the source and would shrink the very tree this is meant to widen.

Result on `knight online`: **14 → 28 nodes, depth 3, 79 related phrases, $0.00.**

Rejected while measuring: the free `knowledge_graph` element as an entity anchor
(`title: Knight Online / subtitle: Online game / Genres: MMORPG`). Its
distinctive tokens do not lexically match "MMORPG", and its generic ones —
"game", "online" — would wave through exactly the drift being stopped. Do not
re-propose it without embeddings.

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

Last worked: **2026-08-27**. Phase B (live crawl) shipped. Uncommitted.

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
  building, DataForSEO client, live crawl. Seven modules, all English.
- **API** (`api/main.py`) — FastAPI. Endpoints: `/api/meta`, `/api/trees`,
  `/api/tree/{slug}`, `/api/tree/{slug}/question/{qslug}`, `/api/countries`,
  `/api/languages`, plus **`POST /api/search`** and
  **`POST /api/tree/{slug}/question/{qslug}/score`**.
- **Live crawl** (`answergap/live.py`) — the search box works. One request with
  `click_depth=4` returns a 16-node, two-level tree; gap scoring is a separate
  per-question call that also **harvests** its own response, so the tree keeps
  widening for free and reaches depth 3 (see the two sections above). Live trees persist under `data/live/`, kept out of
  `data/raw/` so the Phase 0 evidence is never rewritten. Live tree slugs are
  market-qualified (`teeth-whitening-en-2840`) so they cannot shadow the demos.
- **Interface** (`web/`) — Next.js 16, five screens: search/landing, question
  tree (pan/zoom), gap table, related searches, question detail. Builds clean. The search box is
  wired; the detail panel offers "Check this question" on unscored live nodes.
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

**Architecture decision, 2026-08-27** — folder structure, the storage
recommendation, what is done and what is next, in Turkish:
`docs/mimari.html` (source, regenerate the PDF from it) and
`docs/AnswerGap-Mimari.pdf` (10 pages).
https://claude.ai/code/artifact/c5b1e0b3-55eb-4243-ab45-93f17054f990

Regenerate the PDF after editing the HTML:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
  --disable-gpu --virtual-time-budget=25000 --no-pdf-header-footer \
  --print-to-pdf="docs/AnswerGap-Mimari.pdf" "file:///<abs>/docs/mimari.html"
```

## Restarting after a reboot

```bash
# backend, from the project root
python -m uvicorn api.main:app --reload --port 8000

# frontend, separate terminal
cd web && npm run dev        # http://localhost:3000
```

`fastapi` and `uvicorn` are already installed but **`requirements.txt` does not
list them** — the project cannot be installed on a clean machine. `pydantic` is
now used too. Fill this in; it is a one-line job.

`.env` already holds working DataForSEO credentials and is gitignored.
`uvicorn.exe` is not on PATH — use `python -m uvicorn`.

**Windows/OneDrive operational notes, learned the hard way:**

- `--reload` is unreliable under OneDrive: it detected the change, then the
  worker never came back and the old code kept serving. Run without `--reload`
  and restart manually after editing.
- `pkill` does nothing. Kill by port — and kill **both** processes: the reloader
  parent and its child. Killing only the parent leaves the child holding port
  8000 and the next start dies with `[Errno 10048]`.

```bash
netstat -ano | grep ':8000' | grep LISTENING   # then taskkill //PID <pid> //F
```

## Spend to date

**~$0.118** total ($0.107 before Phase B, $0.0112 of live crawling on
2026-08-27). Cache files mean re-running anything costs nothing — a repeated
search returns in 20 ms and bills $0. Always run `--dry-run` first; the search
endpoint accepts `"dry_run": true` and returns the request plan and its price
without touching the network.

Real measured prices: a `click_depth=4` crawl is **$0.0026**, a plain scoring
request is **$0.0020**. Do not trust the flat estimate — read `cost` from the
response.

One unplanned charge: `phase05_collect.py` cost $0.030 when its sampling pool
changed and re-fetched 15 questions. Check the dry run before running collect.

## Architecture verdict, 2026-08-27: do NOT rewrite

The question was asked and settled. Keep the current architecture.

`answergap/` is 1,180 lines of pure, provider-agnostic domain logic with the
measured findings baked into it. A rewrite returns the code and loses the
knowledge. And what is missing is not *wrong*, it is *absent* — there is no bad
schema to unpick, no wrong ORM, no tangled auth. A prototype with no persistence
layer is the cheapest possible place to add the right one. The web layer talks
to the API over a typed contract, so a storage change does not reach it; adding
the live crawl today proved that in practice.

Four things do have to change, in this order: **storage**, **tests**,
**job runner**, **auth/tenancy/credits**.

## Next, in dependency order

1. **Label the 14 rows first — 20 minutes, $0.** The real question is not "what
   should the threshold be" but **"is a dictionary enough, or are embeddings
   required?"** 14 labels answer that, and the answer changes the schema: where
   vectors live is a storage decision. Do not write the schema before knowing.
2. **Tests.** `matching.py` and `tree.py` are pure functions and `data/raw/`
   is a ready fixture set. Moving untested code is moving it blind.
3. **Storage: Postgres + object storage.** Tables: `question`, `serp_snapshot`,
   `paa_edge`, `gap_score`, `crawl`, `label`, then `workspace`/`user`/
   `credit_ledger`. Raw SERP payloads go to a blob store (R2), gzipped, keyed by
   the same cache key — 30 KB each, they belong in no query. **The tree is edge
   rows, not a document** — that is the fix for the bug above, and it hands the
   diff engine and the "historical PAA is our asset" claim over for free.
   `gap_score` stores its own threshold and strategy, so a threshold change does
   not turn old scores into lies. Keep the filesystem backend for local dev.
   Do not add Redis yet.
4. **Feedback in the interface.** A *"is this really a gap?"* thumbs up/down on
   every scored question, writing to `label`. Labelling becomes a by-product of
   use rather than a chore — this is what finally settles the threshold, with
   thousands of labels instead of 14.
5. **Job runner + Standard queue.** Scheduled crawls, async crawling, and the
   ~3.3x unit-cost drop when the webhook deviation above can be closed.
6. **Auth, tenancy, credits, Stripe.** Last, because its schema sits on the
   storage layer and the thing to validate before revenue is the product.

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
