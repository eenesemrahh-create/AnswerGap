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

### SETTLED 2026-08-28: lexical matching cannot do this. Embeddings are required.

The 14 rows were labelled and `phase05_evaluate.py` run. Three measurements,
each on its own sufficient:

**1. The best of 72 candidate rules reaches precision 0.20.** 1 gap / 13 not.
Every rule that finds the one real gap also flags four questions that are not
gaps. The report's own bar is 0.85.

**2. Under the winning rule the real gap is numerically identical to three false
ones.** `words · pages with overlap ≥ 0.6 is ≤ 0` — all four score 0 pages
clearing the threshold and a top overlap of exactly 0.50:

| Question | Label | ≥0.6 | max |
|---|:--:|---:|---:|
| Do dentists recommend teeth whitening? | **G** | 0 | 0.50 |
| What is the best treatment to whiten teeth? | N | 0 | 0.50 |
| Can 60 year old teeth be whitened? | N | 0 | 0.50 |
| Can yellow teeth actually be whitened? | N | 0 | 0.50 |

**No threshold can separate identical numbers.** This was never a threshold
problem. Moving to `stems` relocates the collision (G and *"best treatment"*
both land on max 0.75, 4 pages ≥0.6) without removing it.

**3. The synonym dictionary is already doing nothing.** `synonyms` and `stems`
return the same score vector on 13 of the 14 questions — the dictionary changes
exactly one number. And `synonyms` best-F1 **0.22 is worse than plain `words`
at 0.33**: the layer currently costs accuracy.

**Why a bigger dictionary cannot fix it** — the four false positives are
*paraphrase*, not vocabulary:

| Question | Page that answers it | Class |
|---|---|---|
| Can yellow teeth actually be **whitened**? | Can Yellow Teeth **Become White Again**? | multi-word paraphrase — a word→word map cannot express it |
| **How bad does** getting your teeth whitened **hurt**? | **Does** Professional Teeth Whitening **Hurt**? | question form, not vocabulary |
| Can **60 year old** teeth be whitened? | Can **Senior** Teeth be Whitened? | open class: 60/70/80 year old, elderly, aging, older adults |
| What is the best **treatment** to whiten teeth? | What is The Best Teeth Whitening **Method** | the only one a dictionary could fix |

Three of four are structurally out of reach of a word-level dictionary. Adding
words buys the fourth.

**Consequence for the schema:** `question` carries a vector column (pgvector),
and `gap_score` records the **embedding model** alongside its threshold and
strategy — otherwise a model swap turns old scores into lies exactly the way a
threshold change would.

**Honest caveat.** One positive in fourteen. This sample cannot *measure*
precision — the confidence interval is meaningless. What it can do is answer the
binary question, and it does, because the failure is structural and visible in
all four cases rather than statistical. That is also why the feedback layer
below exists: the number that settles a *threshold* has to come from thousands
of labels, not fourteen.

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
threshold** (`60 year old` ↔ `senior`). The labelling round has since been run
and it settled both: **embeddings, not a dictionary** — see the SETTLED block
above. The 0.50 band here is the same undecidable middle, and it closes for the
same reason.

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

## The feedback layer — labelling as a by-product of use

Shipped 2026-08-28. `answergap/labels.py` + two endpoints + a two-button row in
the question detail panel.

The threshold cannot be settled on 14 hand-labelled rows, and nobody
hand-labels 200. So every **scored** question in the UI asks *"is this really a
gap?"* and the answer is stored. Free, never a billable request.

**Append-only, and that is the point.** CLAUDE.md already records what storing
mutable state as a document cost on 2026-08-27. Labels are the first place the
row discipline is actually applied: changing your mind writes a NEW line,
retracting writes the verdict `?`, nothing is ever rewritten in place.
`labels.current()` collapses the log by taking the last line per question.
`data/labels/labels.jsonl` is the filesystem backend; its fields are already the
`label` table's columns.

**Every row carries its own score.** `predicted`, `threshold`, `strategy`,
`matching_pages` and the full `overlaps` vector, as they stood when the verdict
was given. The tree they came from is mutable — a re-crawl or a threshold change
would otherwise rewrite the evidence the human was reacting to. Same rule as
`gap_score`.

**Keyed by question, not by tree.** `{language_code}:{normalized_question}`. The
same question appears under several parents and in several trees; the judgement
is about the question against its results, so a verdict given in one tree shows
up in all of them.

- **Refused on an unscored question** (409). With no fetched results there is no
  claim to agree or disagree with, and unknown must stay unknown.
- **Allowed on archived Phase 0 trees**, unlike scoring. Scoring is refused
  there because it spends money rewriting fixed evidence; labelling spends
  nothing, and the archive is the best-understood data on disk — refusing it
  would throw away the cheapest labels available.
- **Both buttons carry equal visual weight.** Nudging toward either answer
  biases the set this exists to collect, and a biased set is worse than a small
  one. The panel does say when a verdict *disagrees* with the metric — that is
  the only kind of label that can move anything.
- **The buttons sit BELOW the results list.** The question is "do these page
  titles answer it?", so it can only be asked once the titles have been read.
  Above the evidence it would be asking the user to rate a number.

`scripts/phase05_evaluate.py` reads the JSONL alongside the CSV, indexing
`data/live/serp/` as well as `data/raw/` so live-crawl verdicts can be rescored
under every strategy rather than merely replayed. A label whose response is not
cached is **dropped and reported**, never scored as all-zero — that would
manufacture a gap the metric never claimed.

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

- [x] **Dictionary or embeddings? — embeddings.** Settled 2026-08-28 on 14
      labels; see the SETTLED block above. The dictionary layer is measurably
      inert (it moves one number in fourteen) and three of the four false
      positives are paraphrase, which no word-level map can reach.
- [ ] What should the gap threshold be? Still open, and deliberately so: it
      cannot be fixed on 14 rows with one positive. The in-product feedback
      buttons now collect labels as a by-product of use; revisit at ~200.
- [ ] Should AI Overview become a product surface? The top-level `ai_overview`
      element arrives with references — *"does Google's AI answer this, and who
      does it cite?"* is a signal AlsoAsked does not have.
- [ ] Does PAA stability hold across the day? Both stability runs were
      back-to-back; re-measure at different hours.
- [ ] Payment stack for a US-first product (Stripe). The earlier TRY +
      iyzico/PayTR assumption no longer applies.

---

# Current state — resume here

Last worked: **2026-08-28**. The threshold question is settled (embeddings,
not a dictionary) and the in-product feedback layer that will settle the
threshold *number* is shipped. Phase B (live crawl) shipped 2026-08-27.

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
  building, DataForSEO client, live crawl, label store. Eight modules, all
  English.
- **API** (`api/main.py`) — FastAPI. Endpoints: `/api/meta`, `/api/trees`,
  `/api/tree/{slug}`, `/api/tree/{slug}/question/{qslug}`, `/api/countries`,
  `/api/languages`, plus **`POST /api/search`**,
  **`POST /api/tree/{slug}/question/{qslug}/score`**, and the free feedback
  pair **`GET /api/tree/{slug}/labels`** /
  **`POST /api/tree/{slug}/question/{qslug}/label`**.
- **Live crawl** (`answergap/live.py`) — the search box works. One request with
  `click_depth=4` returns a 16-node, two-level tree; gap scoring is a separate
  per-question call that also **harvests** its own response, so the tree keeps
  widening for free and reaches depth 3 (see the two sections above). Live trees persist under `data/live/`, kept out of
  `data/raw/` so the Phase 0 evidence is never rewritten. Live tree slugs are
  market-qualified (`teeth-whitening-en-2840`) so they cannot shadow the demos.
- **Interface** (`web/`) — Next.js 16, five screens: search/landing, question
  tree (pan/zoom), gap table, related searches, question detail. Builds clean. The search box is
  wired; the detail panel offers "Check this question" on unscored live nodes,
  and *"is this really a gap?"* on scored ones.
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

`requirements.txt` now lists the three runtime dependencies — `fastapi`,
`uvicorn`, `pydantic`, pinned to the versions developed against — so
`pip install -r requirements.txt` works on a clean machine. `answergap/` itself
stays stdlib-only; those three exist for `api/main.py` alone.

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

## Deployment — Railway, two services from one repo

Added 2026-08-31. Config-as-code, so the platform is described in the repository
rather than in a dashboard nobody can diff.

| Service | Root dir | Config-as-code path | Build |
|---|---|---|---|
| api | `/` | `/railway.json` | Railpack → Python (`requirements.txt`, `.python-version` = 3.13) |
| web | `/web` | `/web/railway.json` | Railpack → Node (`package.json`, `.nvmrc` = 22) |

Two Railway details that are easy to get wrong, both checked against the docs
rather than assumed:

- **The config file does not follow the root directory.** Railway looks for
  `railway.json` at an absolute repo path, so the web service needs its config
  path set to `/web/railway.json` by hand — leaving it at the default silently
  applies the *api's* config to the web service.
- **Do not pin `builder`.** `NIXPACKS` is no longer a documented value; new
  services default to Railpack, which detects Python from `requirements.txt`
  and Node from `package.json` on its own. Both files omit the key.

`watchPatterns` lives in each config, so one push does not rebuild both
services — a `web/**` change leaves the api deployment alone.

Three things had to change for the two halves to survive being separated:

- **CORS is no longer hardcoded.** Every screen in `web/` is a client component,
  so the fetch leaves the visitor's browser, not Next's server. The moment API
  and web stop sharing localhost, `ALLOWED_ORIGINS` becomes load-bearing.
  Comma-separated; the default is still localhost, so local dev needs no env.
- **`NEXT_PUBLIC_API_URL` is a BUILD-time variable.** `NEXT_PUBLIC_*` is baked
  into the bundle (verified: the URL appears inside `.next/static/chunks/`).
  Changing it in the dashboard does nothing until the web service is redeployed.
  This also forces the order: deploy api, take its domain, then build web.
- **`answergap/paths.py` — the writable state is relocatable.** Container
  filesystems are ephemeral, and `data/live/serp/` holds SERP responses that
  were **paid for** while `data/labels/labels.jsonl` is the append-only log
  CLAUDE.md insists is never rewritten. A redeploy would delete both. Point
  `ANSWERGAP_DATA_DIR` at a mounted volume and they move together — one switch
  for both, so a volume cannot be wired to one and forgotten for the other.
  `data/raw/` does **not** follow it: the archive ships in the repo, is
  read-only, and is resolved from the source tree.

  **Mount the volume at `/data`, never at `/app/data`.** Railway puts the
  checkout in `/app`, so a volume on `/app/data` would cover `data/raw/` and the
  three committed demo trees would vanish behind an empty disk. Railway's own
  guide suggests `/app/data` — that advice is for apps writing to a *relative*
  path, and the env var above exists precisely so this one does not have to.

**A volume is not optional if any live crawling happens in production.** Without
one, every deploy re-buys the same SERP responses. This is a stopgap for the
storage migration in the "Next" list, not a replacement for it — the
document-shaped-tree bug recorded above is still there, just now on a volume.

Verified locally before the first deploy: API boots and serves `/api/meta`; a
foreign origin is refused (400) and an allowed one gets its header; with a fresh
`ANSWERGAP_DATA_DIR` the tree count falls from 11 to 3 — the three committed
archive demos, live trees and labels correctly gone; `npm run build` is clean.

## Storage: Postgres, shipped 2026-08-31

The tree is edge rows. `crawl` + `paa_edge` + `question`, with `gap_score`,
`serp_snapshot`, `label` and `related_search` beside them. Eight tables, three
migrations, applied at API startup over Railway's private `DATABASE_URL` so the
schema is created and verified without the password leaving the platform.

**The 2026-08-27 bug is closed, and it was demonstrated rather than argued.**
Running the same search twice in production returned `crawl_id: 1` then
`crawl_id: 2`, `spend: 0.0`, `from_cache: true`. The second crawl did not touch
the first one's rows. There is no statement in the schema that overwrites a
tree, so the failure cannot recur.

What that changed in the code:

- **`repeat_count`, `parents` and `depth` are no longer stored.** They fall out
  of the edges: a node's parents are the edges pointing at it, its depth is the
  shallowest. Storing a derived count is how it drifts from what it counts.
- **`gap_score` is keyed by question and market, not by tree.** A score is
  *found*, not carried, and the same verdict surfaces under every tree the
  question appears in — already how the label log is keyed.
- **`_carry_previous` survives but its job shrank.** The previous crawl keeps
  its own edges, so nothing is at risk of destruction. The carry now preserves
  the current *view* of harvested nodes. Data loss → cosmetics.

`decompose` / `recompose` are **pure** — no connection, no SQL, no clock. That
split is why the riskiest half of the migration could be tested before anything
was deleted: all nine live trees on disk round-tripped identically, including
`knight-online-en-2840` at 28 nodes / 32 edges where harvested questions sit
under several parents. Keep them pure.

Derived fields are rebuilt on read by `live._hydrate`: slugs, `status_counts`,
`threshold`, `strategy`, `language_name`. None belong in a column. Note the
`threshold` there is the *current* setting for the UI badge — every `gap_score`
row still carries the threshold it was measured under, so old scores cannot be
retroactively reinterpreted.

**Two things bit, both worth remembering:**

- **`OVERLAPS` is a reserved word in Postgres.** The label column is
  `overlap_vector`; `db.label_rows()` maps it back and is the only place that
  knows. All 41 column names were then scanned; it was the only collision.
- **Fields missing on the read path do not fail loudly.** `status_counts` came
  back absent and the API happily returned a tree the UI could not summarise.
  Caught by fetching a crawl back out of production, not by reasoning.

`data/live/` and `data/labels/` are **deleted** — 9 trees, 26 cached responses,
6 verdicts, all recoverable from git history. `data/raw/` stays: read-only
Phase 0 evidence, and the three demo trees are still built from it at startup.

The filesystem backend is still there and still works with no `DATABASE_URL`,
which is what keeps local development running without Postgres installed.

Still open: **R2 for the raw payloads.** They are gzipped `bytea` today (~30 KB
→ ~5 KB) which was a deliberate call to stay on one system; CLAUDE.md's original
position — they belong in no query and therefore in object storage — has not
changed, only been deferred.

## Phase 1, 2026-08-31: name the conclusion, not the measurement

The badges read `Gap / Weak / Covered / No data`. They now read
**`Unanswered / Barely answered / Well answered / Not checked`**, with the count
beside them — `1 of 8 pages`.

This is not a copy tidy-up. Two problems were being fixed:

- **"Weak" never said weak *what*** — the question, the competition, the
  evidence? Four words that describe our *measurement* rather than the reader's
  *decision*.
- **"Gap" is a verdict, and the verdict is not settled.** The SETTLED block
  above puts the best lexical rule at **precision 0.20**. A badge asserting it in
  one confident word claims more than the data supports. That is the accuracy
  rule — the same one behind "never show a question with no fetched results as a
  gap" — not a matter of taste.

So the label names what was found and `status.evidence` carries the count
beside it. **The count is defensible on its own; the category is a threshold
judgement that is still open.** `Gap` survives as the product's *idea* — the
name, the promise on the landing page — and disappears as a per-row verdict.

The labelling buttons moved with it, to the phrasing CLAUDE.md had already
written for them: *"Do these pages answer the question?"* → *"No, none of them"*
/ *"Yes, at least one does"*. Asking "is this really a gap?" made the reader
translate our vocabulary before they could answer — a tax on the exact data the
threshold question depends on.

**Why this came before the metric work.** Labels are the input to embeddings,
and labels come from people using the interface. Nobody gives a verdict on a
badge they had to decode. The wording was the tap, not the paint.

`en.ts` gained one key (`status.evidence`), which broke the other four locales
until translated — the build gate working as designed.

## Tests, finally

`tests/`, 24 of them, run with `pytest -q`. `requirements-dev.txt` keeps the
runner out of the Railway image.

Fixtures are `data/raw/`. That is deliberate: the archive ships in the repo and
is read-only, so unlike the live trees these tests cannot be invalidated by a
crawl — or by a decision to clear the data, which is exactly what happened to
the earlier ad-hoc fixtures the same day.

Two of them deserve to be read before being "fixed":

**`test_open_class_paraphrase_is_missed`** asserts that `60 year old` ↔ `senior`
scores **0.5** and therefore *fails* the 0.60 threshold. The page answers the
question; the metric says it does not. That assertion is a **baseline, not an
aspiration** — when the embedding layer lands it should start failing, and the
number it fails at measures what embeddings bought.

**`test_multi_word_paraphrase_currently_clears_the_bar`** pins a case that works
by luck rather than design (0.75). A tokenizer change could silently drop it,
and the product would only notice as a wrong answer.

## Phase 2, 2026-08-31: the Standard-queue deviation closes

CLAUDE.md recorded the deviation honestly — *"a webhook cannot reach a laptop"*.
That was a fact about the laptop and it expired the day this moved onto a
server. What replaces it is a **split, not a compromise**:

| | Queue | Why |
|---|---|---|
| Seed search | **Live** | a person is waiting. Minutes of latency to save a tenth of a cent is the wrong trade — CLAUDE.md's own reasoning, unchanged |
| Batch scoring | **Standard** | nobody watches a batch. Ten questions is where 3.3x stops being a rounding error |

**Measured in production, first real run:** five questions, **$0.003** against
**$0.010** on Live. Each task reported exactly **$0.0006** — the Standard price,
matching the estimate to the cent. The tree went 19 → **34 nodes** and related
searches 8 → **44**, because scoring harvests the response it already bought:
18 of those nodes cost nothing.

**The money is spent at `task_post`, not at fetch.** Every design decision here
follows from that one fact:

- `serp_task` rows are written the instant a post succeeds. A task id that was
  not recorded is money with nothing attached to it.
- `task_get` is free and results live **30 days**, so a lost callback is a
  re-fetch, not a re-purchase — but only if someone goes and looks, which is
  what `sweep_pending` is for. It runs on `/jobs`, which the UI polls.
- Ingest is idempotent. A task already out of `posted` state is ignored, so a
  redelivered callback cannot double-count a harvest.

**The callback endpoint fails closed.** With no `CALLBACK_TOKEN`, every callback
is rejected. It is a public URL that writes gap scores; without the token anyone
could POST a fabricated SERP response and the product would present it as
measured evidence. With `PUBLIC_BASE_URL` unset the batch still works — tasks
post without a callback and the sweep collects them — so the degraded mode is
**slower, never wrong**.

`apply_response` is shared by both routes. A question scored in a batch and the
same one scored by clicking must produce the same row, or the two paths would
quietly disagree about the same page.

**Two faults the first real run exposed, neither visible by reading:**

- **`/jobs` returned a number where the task list belonged.** `task_spend`
  returned `{"tasks": n}` and the endpoint spread it alongside its own `tasks`
  list — the count silently replaced the list. It type-checks and it
  serialises. Renamed to `task_count`.
- **The sweep timed out the request it ran inside.** Ten tasks per poll, each a
  fetch plus scoring plus a tree write, blew a 60s timeout on the fourth poll.
  Lowered to three: the sweep only has to make *progress* per poll, not finish.

**Callback vs sweep, measured the same afternoon** — same queue, same
DataForSEO processing, only the delivery differs:

| Delivery | Posted → done |
|---|---|
| **Postback callback** | **28 s**, **55 s** |
| Fallback sweep | 2 m 26 s → 4 m 12 s |

The gap is not DataForSEO being slower; it is that the sweep only runs when
`/jobs` is polled, only for tasks older than 120 s, and only three at a time.
Push beats poll by an order of magnitude here, and the sweep's job is to be
*correct* when the callback is missed, not to be fast.

Proof the callback actually did it: `swept: {checked: 0, ingested: 0}` while both
tasks went `done`. The sweep never saw them.

`CALLBACK_TOKEN` and `PUBLIC_BASE_URL` live on the api service. Rotating the
token is a one-variable change; nothing else reads it.

## Developer mode, 2026-08-31

There is one role, `developer`, it is hard-coded in `/api/meta`, and `DevPanel`
checks it anyway. **That check is the whole point.** When sign-in arrives the
only change is where the value comes from — a session instead of a constant —
and nothing built now is thrown away. A screen that has never had to ask *"who
is looking?"* is far harder to retrofit than one that always asked and always
got the same answer.

**Dollars, not credits.** Customers will be priced in credits; a developer needs
the underlying cost, because the argument for the Standard queue is a *ratio*
and a ratio cannot be checked in a currency that hides one side of it. Live on
the deployed data:

| | | |
|---|---:|---|
| Live | $0.0178 | 8 searches |
| Standard | $0.0042 | 7 questions — **$0.0140 if they had gone through Live** |
| **Saved** | **$0.0098** | more than the Standard spend itself |

Every figure is **reported**: `crawl.spend` from the live response,
`serp_task.cost` from each queued task. A transparency panel filled with
plausible estimates would be worse than no panel — it looks like evidence.

**The batch button shows the price before spending it.** Clicking queues
nothing; it runs a dry run and puts the plan on screen, and confirming is a
second deliberate act. One click is ten charges, so the cost cannot be somewhere
the reader has to go looking for it. The Live figure sits *beside* the Standard
one, not in a tooltip.

## Never commit a dashboard screenshot

Two Railway screenshots arrived in the project root on 2026-08-31. They showed,
in plain text: the DataForSEO password, `DATABASE_URL` with its password inline,
and `CALLBACK_TOKEN`. Untracked — and the next `git add -A` would have swept
them into a commit. **A secret in git history outlives the file it arrived in;**
deleting the image later does not remove it from the objects.

`.gitignore` now blocks `Screenshot*` / `Ekran görüntüsü*` at the root.

Checked at the same time, and worth knowing the answer: the `web` service had
`DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` set, which it has no use for.
**They did not reach the browser** — Next.js only inlines `NEXT_PUBLIC_*` — but
they were removed anyway. The exposure was one rename away, and a secret that
does not exist cannot leak.

Still to do: the **interface** half is now done. Batch button, price confirm,
progress polling, developer panel, five locales.

## Spend to date

**~$0.118** total ($0.107 before Phase B, $0.0112 of live crawling on
2026-08-27). **2026-08-28 spent $0.00** — labelling, evaluation and the
feedback layer all run against data already on disk. Cache files mean re-running anything costs nothing — a repeated
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

1. ~~**Label the 14 rows first.**~~ **DONE 2026-08-28. Answer: embeddings.**
   See the SETTLED block above. The schema now knows what it needs: a vector
   column on `question`, and an embedding-model field on `gap_score`.
2. ~~**Tests.**~~ **DONE 2026-08-31** — 24 tests over the storage translation,
   the status rules and the metric's known failures. See the section above.
3. ~~**Storage: Postgres.**~~ **DONE 2026-08-31** — see the section above.
   Object storage (R2) for the raw payloads is the remaining half.
   Original plan, kept for the reasoning:
   **Storage: Postgres + object storage.** Tables: `question`, `serp_snapshot`,
   `paa_edge`, `gap_score`, `crawl`, `label`, then `workspace`/`user`/
   `credit_ledger`. Raw SERP payloads go to a blob store (R2), gzipped, keyed by
   the same cache key — 30 KB each, they belong in no query. **The tree is edge
   rows, not a document** — that is the fix for the bug above, and it hands the
   diff engine and the "historical PAA is our asset" claim over for free.
   `gap_score` stores its own threshold and strategy, so a threshold change does
   not turn old scores into lies. Keep the filesystem backend for local dev.
   Do not add Redis yet.
4. ~~**Feedback in the interface.**~~ **DONE 2026-08-28**, ahead of storage
   because the labelled set has to start filling now — it is the input to both
   the threshold and the embedding evaluation, and it is worthless if collection
   starts later. Writes to `data/labels/labels.jsonl`; the storage step moves it
   to the `label` table with no shape change.
5. ~~**Standard queue.**~~ **DONE 2026-08-31** for batch scoring — see above.
   Still open: a real **job runner**, for scheduled crawls and so the fallback
   sweep stops piggybacking on a polled GET.
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
