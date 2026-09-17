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

## 2026-09-17 session — read this first

Last worked: **2026-09-17**, across TWO sessions. Four feature commits, all
pushed to `origin/main` (`8d9b255`, `0d9e199`, `2f250c2`, `13e4d00`). Web
build clean, 249 backend tests + 8 web tests green.

**Where it stopped, in one line:** the AI Overview surface is complete -
table column, summary, per-domain check, and a marker on tree nodes; next is
CI.

What happened, in order:

1. **Production search failed with HTTP 403 and an unreadable body.**
   `dataforseo._http` gunzipped success bodies but decoded HTTPError bodies
   raw, so the refusal reason rendered as binary. Fixed in `8d9b255`. The
   first guess (Railway egress IP blocked, as with Zurich) was WRONG - once
   readable the body said `40104 Please verify your account`.
2. **The operator opened a NEW DataForSEO account** (`eenesemrahh@gmail.com`,
   $1 trial) and set it on Railway + local `.env`. After verification it
   worked from production, then a local request got **`40201` "unusual
   activity ... temporarily paused"**. Status at end of session: UNKNOWN
   whether support has lifted it. **Check before any paid work:** the free
   `GET /v3/appendix/user_data` does NOT reveal either block (it answered 200
   for both 40104 and 40201) - only a real SERP call shows it, and a refused
   call costs $0. The old account still had ~$0.71.
3. **"samsung" returned a tree of one node.** Not a bug: Google shows no PAA
   block for brand / single-word navigational queries; the response still
   carried 8 related searches. `0d9e199` replaces the lone node with an
   explanation plus those related searches as next seeds, and hides "Check
   top N" (it offered to pay to score the seed itself). Detected as
   `source === "live"` and every node at depth 0.
4. **AI Overview surface, first half** (`2f250c2`). `ai_sources` was already
   stored on every scored node and only visible one question at a time.
   New: `AI Overview` column in `GapTable` (distinct cited domains; `—` when
   unchecked, sorting below "none") and `AiSummary` above the table
   (N of M checked questions cite sources, top 5 domains). All counts are
   over CHECKED questions only - unknown is not uncited. Five locales.
   Demo data: teeth-whitening 13/16, diş beyazlatma 7/24, kredi notu 4/9.
   Visually confirmed by the operator on production in session 2.
5. **Per-domain check** (`13e4d00`, session 2). A "Your site" field at the
   bottom of `AiSummary`: "{site} is cited in N of M questions checked", a
   clickable list of those questions, a "you ·" marker in the AI Overview
   column (cited questions sort first), and the matching tag bolded in the
   question detail panel. The domain lives in `TreeScreen` state and in
   `localStorage` (`answergap.site`) - per-browser convenience, never sent to
   the API. Neutral text tokens only: being cited is neither a gap status
   nor decoration, so neither palette applies.
   Matching is `web/lib/domains.ts`, pure: URL / `www.` / port reduce to a
   hostname, a site owns its subdomains (`clevelandclinic.org` -> 5 of 16 on
   teeth-whitening; `health.clevelandclinic.org` -> 2), and a lookalike
   (`notcolgate.com`, `colgate.com.evil.io`) never matches.
   **The web app has tests now:** `cd web && npm test` runs
   `web/tests/*.test.mjs` through node's built-in runner, which strips the
   TypeScript types itself - no framework, no dependency. Keep `lib/` helpers
   free of `@/` imports or node cannot load them.
6. **Fixed a crash that had been live since 2026-08-28.** Selecting ANY
   question in an archive (demo) tree threw: archive nodes omit `reach`
   entirely and `QuestionDetail` guarded only `!== null`, so
   `undefined.toFixed()` took the page down. Now `!= null`. Found only by
   driving a real browser - the build and types were happy, because
   `types.ts` declares `reach: number | null` and the API does not honour it.

**Verification without the Chrome extension.** It failed to connect in both
sessions. Headless Chrome driven over the DevTools protocol from a small
node script (Node 24 has a global `WebSocket`: launch chrome with
`--remote-debugging-port`, `Runtime.evaluate` to click and type, listen for
`Runtime.exceptionThrown`, `Page.captureScreenshot`) did the job and is what
caught the crash above. Setting an input from script needs the native value
setter plus an `input` event, or React ignores it.

**A GitHub deployment "success" does not mean the web service rebuilt.**
Railway writes one GitHub deployment record per pushed commit - even for a
CLAUDE.md-only commit that matches no service's `watchPatterns` - and the
record does not say which service built. Check the service's own
Deployments tab in Railway. The production web URL is not recorded anywhere
in the repo or `.env`.

Known lint debt: `react-hooks/set-state-in-effect` fires on the localStorage
read in `TreeScreen` and on the identical pre-existing one in `ThemeToggle`.
`next build` does not run lint, so it does not block; fixing both means
`useSyncExternalStore` over storage.

Spend: ~$0 (one refused SERP call at $0; the samsung crawl on production was
~$0.0026 under the new account).

**Next, proposed and agreed in direction:**
- ~~Per-domain check~~ **DONE** `13e4d00`.
- ~~Tree-view marker~~ **DONE**: a pill on the node's bottom border, "AI 8"
  (distinct cited domains), bold "AI 8 · you" when it cites the entered
  site. Unchecked nodes get no pill - unknown, not zero. The site field
  itself lives only in the Table view; the tree reads the same state.
- CI with a Postgres service container (item 9 of the Next list) - the web
  tests now give it a second suite to run.
- Wider list discussed with the operator (Google APIs), in suggested order:
  labels to ~200 ($0.30) -> AI Overview surface (in progress) -> Privacy/ToS
  pages -> Search Console API (own-site impressions per question; needs the
  `webmasters.readonly` scope and likely Google app verification) -> search
  volume (Ads API, or DataForSEO Keywords Data as a stopgap) -> Claude-based
  intent classification + content brief. Custom Search JSON API and Trends
  were ruled out.

The 2026-09-15 state below is still accurate for everything it covers,
including the unexecuted email-verification click.

## 2026-09-15 state

Last worked: **2026-09-15**, across TWO sessions. Eleven commits, all pushed
to `origin/main`. `git clone` on another machine gets everything; only `.env`
(DataForSEO + Voyage credentials) has to be recreated. `.env.example` names
every variable it holds.

**Where it stopped, in one line:** email + password sign-in is built and live,
Google sign-in was broken by it and is fixed, and the ONE step never executed
is clicking a verification link — see "Pick up here" below, which is the
shortest path back in.

Session 1 was embeddings / privacy / rate-limit / landing / pricing (items
1-7 below). Session 2 was email sign-in and the bug it shipped with (items
8-11).

## Today's arc, in order

1. `caf4b02` — **Voyage embeddings, gated behind a flag.** Client, batching,
   in-process cache, `gap_score.embedding_model`, 29 tests. Measured all
   three Voyage tiers (voyage-4-lite / voyage-4 / voyage-4-large) on the 14
   Phase 0.5 labels and every one landed BELOW lexical (F1 0.33 vs 0.18 at
   best); the four collision rows the SETTLED block called out stayed
   inseparable across every tier. Kept the plumbing, kept lexical as the
   default: `matching.active_strategy()` returns `embeddings` only when
   BOTH `VOYAGE_API_KEY` and `ANSWERGAP_USE_EMBEDDINGS` are set. Full
   reasoning in "Embeddings: built and measured 2026-09-14".

2. `77fc0e7` — **Detail-level privacy.** The 2026-09-08 work gated the LIST
   endpoint; the eight `/api/tree/{slug}/...` endpoints were still open.
   Closed. Migration `0006_crawl_anon_owner` adds `crawl.anon_id` so a
   signed-out visitor gets back into their own tree by cookie. 404 not 403 —
   existence is the metadata leak the gate exists to stop. Verified on
   production: seven live-tree endpoints all 404 to a stranger.

3. `410eb50` — **`/jobs` sweep cooldown.** Per-slug, 30 seconds, in-memory.
   Closes the 3-to-1 amplification (one HTTP GET, up to three DataForSEO
   `task_get` calls) that item 8 of the Next list called out.

4. `17f3e04` — **Marketing landing rebuilt.** Replit prototype was the
   reference: Plus Jakarta Sans, cream background, purple-to-magenta
   gradient headline, nav + hero + how-it-works + built-for-ai-search +
   pricing + CTA + footer. Search box, sign-in, saved analyses stay wired
   to the real API; marketing copy static per CLAUDE.md's rule. Five
   locales; en/tr full quality, de/es/fr a decent first pass a reviewer
   will want to sharpen.

5. `9a734b6` — **Pricing plans dynamic.** New `app_setting.pricing_plans`
   key holding a JSON array. Public `GET /api/pricing` NEVER breaks the
   landing (bad JSON, no setting, DB down, exception - all answered
   `{plans: []}`); admin `POST /api/admin/pricing` writes with Pydantic
   validation. Fallback to the i18n copy on the landing when nothing is
   saved. First shape: form-based editor.

6. `b4ef71e` — **Pricing v2, WYSIWYG.** Rebuilt after the ask changed:
   four ready-made template cards on screen at all times, edit text in
   place (not a separate form), tick which cards ship. Per-card `enabled`
   is the publish switch. Admin IS the landing - the editor renders the
   same `.mkt-plan` DOM inside a scoped `.pricing-preview` container that
   mirrors the landing tokens (Plus Jakarta Sans loaded via `next/font`,
   cream `--bg`, purple `--brand`, magenta `--accent`).

7. `a0afbf6` — **Colourful cards.** Four themes (light / violet / pink /
   dark) each changing background + border + checks + CTA + badge while
   padding and typography stay constant. Admin picks a theme per card
   from a swatch row above the badge line. `featured` replaced; a
   `_from_legacy_featured` Pydantic validator maps old `featured: true` to
   `theme: dark`, so rows saved before this commit still parse.

8. `f1ae414` — **Email + password sign-in, verification and reset.** A
   second door beside Google, zero new dependencies (`hashlib.scrypt`,
   `secrets`, `urllib`). Migration `0007_password_accounts`, two new
   modules (`passwords.py`, `mailer.py`), six endpoints, 66 tests. The
   design decision that matters: **signup credits are granted at
   VERIFICATION, not at signup** — 10 free searches per throwaway mailbox
   is a free-search farm, and every search costs $0.0026 of real money.
   Full reasoning in the 2026-09-15 email sign-in section.

9. `dc3dbc2` — **Fixed the Google sign-in this broke.** `user_upsert` had
   been rewritten as one statement of chained data-modifying CTEs to save
   a round trip; it failed, and `google_callback` turned that into a
   characterless `?auth=failed` for every user. Rewritten as four small
   statements in one transaction. Also: all three of the callback's
   failure branches now LOG their reason, which is why the cause had to be
   guessed the first time.

10. `fe56b56` — **Retired the stale 150 ms figure.** Railway's own
    `upstreamRqDuration` now reads `/api/me` at **4 ms**, and that
    endpoint runs a real query. Postgres is same-region; the performance
    section's transatlantic claim is marked RESOLVED. It had been quoted
    the same day to justify the CTE that broke sign-in.

11. `c170bfe` — **Narrowed the resume point** to the single step that has
    never run.

**Tests: 116 -> 180 -> 248.** Full backend suite clean, admin build clean,
web build clean. The 68 added on 2026-09-15 are all pure — no database, no
network, no clock — because the hashing, the mail templates, the gate branch
and the identity derivation are all pure.

**One of them is a mutation-checked security test.**
`test_an_unverified_admin_address_is_NOT_an_admin` was verified by removing
the guard and watching it go red. `ADMIN_EMAILS` matches on the address and a
password signup may type any address it likes, so without
`is_admin = verified and ...`, signing up as the operator's address and never
opening the inbox would have been an admin session.

**Today's spend: ~$0.005**, all of it in session 1 — one paid search for
privacy verification ($0.0026), a handful of Voyage requests across three
model tiers on the 14-row archive (~$0.002). **Session 2 spent $0.00**:
email sign-in touches no paid API at all, and the production debugging was
done by reading `/api/meta` and the Railway log.

## Pick up here

- **Email sign-in: everything up to the verification CLICK is confirmed.
  The click itself is not.** Stopped here deliberately on 2026-09-15, waiting
  on a domain mailbox.

  What production has already demonstrated: `0007` applied cleanly; Google
  sign-in works (`dc3dbc2`); an email signup CREATES the account and mints a
  verification token; and `POST /api/auth/login` answers **403** for it. That
  403 is the whole design working - the password was checked and accepted,
  and the refusal is `emailUnverified` rather than `noCredits`, because the
  signup grant waits for the address to be proven. An unverified account
  cannot hold a session at all.

  What is NOT yet exercised: `GET /api/auth/verify`. That means
  `db.user_verify_email` - the grant, and the `signup_granted_at` guard that
  makes a SECOND click a no-op - has never run. It is the same function shape
  that broke sign-in, rewritten but unexecuted, so treat it as unproven.

  **No DNS is needed to finish this.** `mail_backend` is `console`, so the
  link is already being printed to the api service's DEPLOY log (search
  `[mail:console]` - not the HTTP request log, which is where it is not).
  Paste the link, confirm it signs you in and grants the credits, then click
  it a SECOND time and confirm the balance does not move. That last step is
  the real test.

  Only after that does mail delivery matter: `RESEND_API_KEY` + `MAIL_FROM`
  on the api service, with the From domain verified at the provider.
  `onboarding@resend.dev` works with no DNS at all but delivers only to the
  Resend account's own address. Full checklist at the end of the email
  sign-in section.
- **Product screens still on the old visual language.** Landing / sign-in
  dialog / theme + locale pickers got the new look on 2026-09-08 and
  2026-09-14; `tree/[slug]` (canvas, gap table, related searches,
  question detail) still on the old skin. Half of the interface migration
  from 2026-09-08 remains.
- **The admin pricing editor is untested against production.** Log in as
  admin, open `/settings/pricing`, edit the four ready-made cards, tick
  Publish on one or two, and compare against the landing. Try each theme
  in light and dark modes.
- **Next open items on the "Next" list below:** tenancy + Stripe (item 6),
  R2 for raw payloads (item 3), a job runner (item 5), and rerank-2
  integration when the label pool reaches ~100 (see the embeddings
  2026-09-14 section for the follow-ups).

## Repo pickup checklist for a fresh machine

- `git clone git@github.com:eenesemrahh-create/AnswerGap.git`.
- Copy `.env.example` -> `.env` and fill DataForSEO + optionally Voyage.
  `.env` is gitignored - do not put a real value in `.env.example`.
- `pip install -r requirements.txt` at the repo root for the API.
- `cd web && npm install`, `cd admin && npm install` for the two Next apps.
- `data/raw/locations-*.json` are NOT in the repo (~15 MB per country, free
  endpoint, reproducible). Run `python scripts/fetch_countries.py` if you
  want the country selector populated locally.
- Everything else - migrations, demo trees, tests - comes with the clone.
- **Mail needs nothing locally.** With no `RESEND_API_KEY` / `MAIL_FROM`,
  `mailer` uses the console backend and prints verification and reset links
  to the terminal running uvicorn. That is the intended development mode,
  not a degraded one - `/api/meta` reports which backend is live in
  `mail_backend`.
- **Accounts need `DATABASE_URL` + `SESSION_SECRET` + `PUBLIC_BASE_URL`.**
  Without them `accounts_enabled()` is false and the product behaves exactly
  as it did before accounts existed, which is what keeps a laptop with no
  Postgres a working environment. Google additionally needs its client pair;
  `google_enabled()` is a separate check so email sign-in works without it.

**First commit history reference: `cdd581a`** — "Initial commit: validated
prototype, US-first, five languages". 113 files. Railway auto-deploys from
`origin/main`.

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

## Deployment — Railway, THREE services from one repo

Added 2026-08-31. Config-as-code, so the platform is described in the repository
rather than in a dashboard nobody can diff.

| Service | Root dir | Config-as-code path | Build |
|---|---|---|---|
| api | `/` | `/railway.json` | Railpack → Python (`requirements.txt`, `.python-version` = 3.13) |
| web | `/web` | `/web/railway.json` | Railpack → Node (`package.json`, `.nvmrc` = 22) |
| admin | `/admin` | `/admin/railway.json` | Railpack → Node. Added 2026-09-08; see the accounts section |

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

`tests/`, **116** of them, run with `pytest -q`. (24 at first; the accounts
work added 92, and 76 of those reach `answergap/gate.py` — the whole spending
decision — without a database, a clock or a network.) `requirements-dev.txt` keeps the
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

## Phase 3, 2026-08-31: the diff surface

*"Three questions appeared under your keyword this week"* is only answerable by
someone who kept last week's answer. Google publishes no PAA history and no
competitor stores it — this is what CLAUDE.md meant by *"our most defensible
asset"*, and **edge rows made it a `SELECT` rather than a project.**

**What it deliberately does not show is the design:**

- **Reordering never appears.** PAA ordering moves for an identical query, so an
  alert on it fires every run and the surface is ignored inside a week.
  `compare_questions` is pure and compares SETS, which makes that structurally
  impossible rather than merely intended — and there is a test for exactly it,
  which a sequence-based implementation would fail while passing every other one.
- **Harvested questions never appear.** They arrive when *we* pay to score
  something. Showing our own spending back as a market signal would be
  indistinguishable from the real thing.
- **A single crawl reads "nothing to compare yet", never "no changes."** A
  measurement never made must not be reported as a result — the same rule the
  badges follow between `Not checked` and `Unanswered`.

**The design proved itself on the first real comparison.** Crawl #1 held 16
questions and crawl #2 held 36; the diff correctly reported **zero changes**,
because the extra 20 were harvest. Comparing all edges would have announced
*"20 new questions"* — pure noise, and indistinguishable from a real change.

### The ledger bug it exposed

Crawl #2 recorded **$0.002 spend for a crawl served entirely from cache**, which
this file says must be $0. `_spend` was right; `db.save_tree` was not — it wrote
the tree's current `estimated_spend` over the crawl row on every save, and
`score()` saves after every question. So a crawl that cost $0.0026 to discover
ended up recording whatever the **last score** happened to cost.

Spend now **accumulates**: `spend = spend + delta`, delta passed explicitly, a
cache hit passing zero. The developer panel counts **requests**, not crawls,
because that total covers single question checks too.

### Already built, not rebuilt

Related searches were already clickable end to end (chip → `/?seed=` → landing
prefills), and AI Overview sources already render in the question detail. Real
data is flowing: **4 of 8 scored questions carry 7–12 citations each.** The open
question — *should AI Overview become a product surface?* — now has data behind
it whenever it is answered.

## Performance, 2026-09-01: measure before optimising

`/api/meta` took **8.9 s to return 612 bytes**. The obvious suspect — a US
server answering a user in Türkiye — was **innocent**, and only measuring said
so: connect time was 0.19 s and TTFB was 8.94 s, so essentially all of it was
our own compute. `/api/countries`, answered from memory, came back in 0.33 s.
**That is what the network actually costs.**

| endpoint | before | after |
|---|---:|---:|
| `/api/meta` | 8.94 s | **1.51 s** |
| `/api/trees` | 6.06 s | **1.49 s** |
| `/api/tree/{slug}` | 2.25 s | **1.33 s** |
| `/diff` | 4.83 s | **1.42 s** |
| `/jobs` | 4.55 s | **2.13 s** |

**Four causes, all ours:**

1. **No connection pooling.** Every `db.*` call opened a fresh TCP + TLS + auth
   round trip, and this codebase calls `connect()` once per operation.
2. **`/api/meta` answered "how many trees?" by building all of them.**
   `len(load_trees())` — seven trees, twenty-odd queries — for one number.
3. **`load_trees` was N+1**: three queries per crawl. Now four queries total
   regardless of tree count, which is only possible because `gap_score` is keyed
   by question and market rather than by tree. The storage shape paying off again.
4. **`labels.counts()` fetched the log twice.** `current()` and `rows()` are the
   same read. Invisible against a file, 500 ms of waste against a database — and
   `/api/meta` calls it on every page load.

Also removed: the pool's per-checkout `check_connection`, which issues its own
`SELECT 1` before handing over the connection — a full extra round trip on
*every* database call. `max_idle` gives the same protection for free.

### The finding no code change can fix

`/api/dev/timing` runs one query in one checkout, then five queries in one
checkout. The difference isolates the round trip:

```
checkout + 1 query    : 430 ms
1 checkout + 5 queries: 1006-1152 ms
  -> raw round trip   : ~150 ms per query
  -> checkout overhead: ~260 ms
```

**150 ms per query is a transatlantic round trip.** A same-region Postgres is
1–5 ms. The `api` service was moved to California — because DataForSEO blocked
the Zurich egress IP — and **Postgres stayed in the region it was created in.**
Every query crosses the Atlantic.

The api cannot move back: the US egress is what unblocked DataForSEO. So the
database has to move to the api, and until it does, ~150 ms per query is the
floor under every endpoint here.

> **RESOLVED, observed 2026-09-15.** The database is no longer transatlantic.
> Railway's own HTTP log reports `upstreamRqDuration` — server time, with the
> client's network excluded — and it now reads **`/api/me` 4 ms**, `/api/trees`
> 2–3 ms, `/api/meta` 3–4 ms. `/api/me` is the decisive one: it runs
> `db.user_for_gate`, a real query, and returned real user data in those 4 ms.
> That is a same-region Postgres, so the ~150 ms floor above is **history, not
> current state**.
>
> Everything in this section still stands as the *method* — the four causes
> were ours and the fixes are still in the code — and `/api/dev/timing` is
> still worth keeping for the reason given below. But **do not quote the
> 150 ms figure as a live constraint**, and do not use it to justify a design.
> It was used exactly that way on 2026-09-15 to argue for the chained
> data-modifying CTE in `user_upsert`, and that argument was wrong twice over:
> the number was stale, and sign-in is a cold path where it would not have
> mattered anyway. See the sign-in bug recorded below.

**Keep `/api/dev/timing`.** A client-side stopwatch cannot tell *"the database
is far away"* from *"we are doing something stupid"*, and those have opposite
fixes. Both rounds of this work were aimed correctly only because the server-side
numbers said which one it was.

## Embeddings: researched 2026-09-01, DEFERRED

Not built. The research is recorded so it does not have to be repeated.

**Anthropic has no embeddings endpoint.** The official doc is explicit: *"Anthropic
does not offer its own embedding model."* Its recommendation is **Voyage AI** —
`voyage-4-lite` $0.02/1M, `voyage-4` $0.06/1M, `voyage-4-large` $0.12/1M, all
1024-dim and explicitly multilingual. OpenAI `text-embedding-3-small` is the same
$0.02/1M but sits behind Voyage on multilingual retrieval benchmarks, which
matters here because the tr/de/es/fr trees are real.

**Cost is a non-issue.** One scoring = 1 question + ~9 titles ≈ 200 tokens. A
thousand scorings is **$0.012 of embeddings against $0.60 of SERP** — 2% of the
bill it rides along with.

### A measurement that corrected an assumption

Turkish was expected to be the weak case — agglutinative, suffix-heavy. **It is
not.** The language pack stems correctly and `beyazlatma` / `beyazlatmanın` /
`beyazlatılır` all score **1.00**.

The failure is **paraphrase**, in both languages, and Turkish is the *worse* of
the two for it:

```
0.50  MISSED   Can 60 year old teeth be whitened?  <-  Can Senior Teeth be Whitened?
0.25  MISSED   Kredi notu nasıl yükseltilir?       <-  Kredi puanını artırmanın yolları
```

`kredi notu` ↔ `kredi puanı`, `yükseltilir` ↔ `artırmanın`: same meaning, no
shared words, 0.25. Both pages answer their question; the metric says they do
not, and the product reports a gap that is not there.

**Concrete consequence, in the archive:** `kredi-notu-nasil-yukseltilir` scores
**gap=5 of 9 scored**. With a metric that cannot match `kredi notu` to `kredi
puanı`, that ratio is not credible. How many of those five are real is currently
unknown — and it is exactly the number the product sells.

### What it will and will not settle

It will **not** settle the threshold. That still needs ~200 labels; there is 1.

What it *can* settle, and cheaply, is the claim in the SETTLED block: the 14
Phase 0.5 labels and all 58 archive responses survive, so the four rows lexical
could not separate — one real gap and three false, all scoring identically — can
be re-scored under embeddings and checked. Precision is unmeasurable at n=14
with one positive; **whether the collision breaks is not.**

Ships behind the same seam as everything else: no key -> falls back to lexical,
exactly as no `DATABASE_URL` falls back to files.

## Embeddings: built and measured 2026-09-14, gated behind a flag

Built exactly as the 2026-09-01 section predicted. `answergap/embeddings.py` is
the Voyage client (stdlib-only, `available()` seam matching `db.available()`),
`matching.py` carries `embeddings` as a fourth strategy with a batched scoring
path — one HTTP call per direction rather than one per page — and `live.crawl`
+ `live.score` both resolve the strategy at call time so `gap_score.strategy`
and `gap_score.embedding_model` travel with the row. 29 tests.

**Then measured. All three Voyage tiers came in below lexical, and none
resolved the 4 collision rows the SETTLED block called out.** Rerun of
`scripts/phase05_evaluate.py`:

| Strategy | Best F1 | Its precision |
|---|---:|---:|
| `words` | **0.33** | 0.20 |
| `stems` | 0.22 | 0.12 |
| `synonyms` | 0.22 | 0.12 |
| `embeddings` (voyage-4-lite) | 0.18 | 0.10 |

The 4 collision rows across the three Voyage tiers — one real gap (G) plus
three false positives that all scored identically under lexical:

| | G · dentists recommend | N · best treatment | N · 60 year old | N · yellow teeth |
|---|---:|---:|---:|---:|
| `words` max | 0.50 | 0.50 | 0.50 | 0.50 |
| `voyage-4-lite` max | 0.65 | **0.71** | 0.63 | 0.68 |
| `voyage-4` max | 0.62 | **0.66** | 0.63 | **0.66** |
| `voyage-4-large` max | 0.60 | **0.60** | 0.59 | 0.56 |

**Ordering is wrong in every tier.** The real gap sits in the middle of the
false positives, sometimes below one of them, never clearly above. No
page-count-with-threshold rule separates 1G from 3N when 2 of the 3 N pages
land above G. `voyage-4-large` collapses everything to ~0.60 — the tightest
band and the least separable. Bigger model, less signal.

**Why the failure is structural, not tunable.** These aren't paraphrase
failures. All four questions live under the same seed ("teeth whitening"), and
every SERP page IS about teeth whitening — retrieval embeddings are trained to
score topic proximity and they say so, correctly. The gap metric needs a
different question: *does this page ANSWER what was asked*. That is entailment
/ QA / reranking, not general-purpose embedding. Voyage's `rerank-2` is trained
on exactly this task and would be the right thing to try next — but not on
n=14, or the same measurement fog swallows it.

**Same honest caveat as before.** n=14, 1 positive. This CAN diagnose a
structural failure (ordering wrong across every tier, visible in all 4 cases
rather than statistical) and it does. It CANNOT measure precision or set a
threshold. The plumbing verdict is settled; the "should embeddings be default"
verdict has to wait for ~200 labels, same as lexical.

**Consequence in code: two gates, not one.** `matching.active_strategy()` now
returns `embeddings` only when BOTH `VOYAGE_API_KEY` is present AND
`ANSWERGAP_USE_EMBEDDINGS` is truthy. The KEY says "the layer is configured
enough for tests, batching and one-off scripts"; the FLAG says "we've decided
to use it as the default scoring strategy". Splitting them means:

- Local dev with a real `.env` doesn't silently ship a metric that lost the
  measurement.
- Rescoring the archive under embeddings for the next round of measurement is
  still a one-env-var flip.
- The `2026-09-14` decision is reversible without a code change - drop the
  flag, restart, back to `synonyms`.

The 2026-09-01 section's line - *"no key -> falls back to lexical, exactly as
no `DATABASE_URL` falls back to files"* - now reads: *"no key OR no flag -> falls
back to lexical."* Same shape, one more gate.

**Spend on this measurement.** About **$0.002** in Voyage tokens for three
model tiers on the 14 rows. Re-running is $0 - the archive labels + SERP
responses are on disk and the model swap is one env var. `phase05_evaluate.py`
already reports which tier is being used.

**What is NOT next.**
- Snippet-enriched documents. Would give the embedding more text but not
  change what it measures. Unlikely to fix topic-vs-answer.
- Larger embedding models. `voyage-4-large` is Voyage's top general embedding
  and it was the worst tier here.

**What IS next, when labels arrive.**
- `rerank-2` integration. About 2-3 hours behind the existing seam; same auth,
  different endpoint. Do NOT try it on n=14.
- Re-run `phase05_evaluate.py` with `embeddings` as more labels accumulate
  from the UI feedback buttons. Look for the collision rows to *split*, not
  the numbers to move a bit.

## Privacy: extended to tree detail, 2026-09-14

The 2026-09-08 privacy section left this unclosed: `/api/trees` was gated but
`/api/tree/{slug}` and its children were open, on the reading that "a slug
reveals the seed and the seed is the sensitive half". That reading missed what
the shared corpus ACCUMULATES on top of the SERP once you have used it -
labels you gave, questions you paid to harvest, gap scores measured under
your credit. All private judgements a stranger with only the slug should not
see. **Extended today: every endpoint under `/api/tree/{slug}/...` requires
ownership.**

**Rule.** `_authorize_tree(slug, who)` sits in front of the eight tree-detail
endpoints. Archive trees are public (they are Phase 0 evidence, not user
data); live trees are gated by `db.can_access`, which returns True when ANY
crawl row on the slug matches either `user_id` (signed-in caller) or
`anon_id` (signed-out cookie). Same rule as `load_trees`'s list filter, one
scale up.

**404, not 403.** Existence itself is metadata - a 403 would say "someone
did search this slug", which is exactly what the gate exists to hide. The
list endpoint returns [] for a signed-out caller for the same reason.

**Anonymous visitors keep access to their OWN tree.** The `anon_id` header
already existed for rate limiting; the crawl row now writes it on INSERT
too (see migration `0006_crawl_anon_owner`). A signed-out visitor who just
finished a search hits `/api/tree/{slug}` on the follow-up render and gets
back in by the same cookie the crawl was written under. Lose the cookie,
lose access. That is the honest strength of the guarantee - not
cryptographic, just "not visible to strangers".

**Shared corpus intact.** Two people searching the same seed both get a
crawl row (`INSERT` on every `live.crawl`, even on a cache hit - see the
2026-08-31 storage section). The second person's SERP call is $0, and their
crawl row is what lets them see the same tree. Splitting the cache per
user would have doubled the bill for no privacy benefit; splitting the
VIEW by crawl-row-ownership does the same job for free.

**Where the gate does NOT run.**
- Filesystem backend (no `DATABASE_URL`). Local dev has no ownership
  concept and a gate that refused everything without Postgres would put
  the laptop in the "broken" column. `_authorize_tree` returns early
  before calling `can_access`.
- Archive trees (`source != "live"`). Public by design.
- `POST /api/search`. This is where crawl rows are CREATED; there is
  nothing to gate against yet.
- `POST /api/callback/dataforseo` (Standard queue postback). Its gate is
  the shared token, not user identity - DataForSEO does not have one.

**Eight endpoints threaded through the gate.**
`GET /api/tree/{slug}` · `GET /api/tree/{slug}/question/{qslug}` ·
`POST /api/tree/{slug}/question/{qslug}/score` ·
`GET /api/tree/{slug}/labels` ·
`POST /api/tree/{slug}/question/{qslug}/label` ·
`POST /api/tree/{slug}/score-batch` · `GET /api/tree/{slug}/jobs` ·
`GET /api/tree/{slug}/diff`. The batch endpoint's ownership check is
stronger than the reads: even if a tree were public evidence, spending
someone else's next ten credits on it would be a different kind of leak.

**Tests.** `tests/test_privacy.py`, seven tests. Archive stays public,
filesystem stays open, owner gets in, stranger gets 404, anon cookie
travels to SQL, missing slug is 404 before the gate, and `can_access` with
no identity returns False without opening a connection. Signature and
branching, not the SQL - the far end has `test_storage.py` and its
fixtures.

**Two bugs the code review caught before ship.**
- The score endpoint had `who = auth.identity(...)` in two places. Not a
  correctness bug (both returned the same identity) but a readability
  smell; ran once, up front.
- The batch dry-run reasoning was preserved verbatim: **the dry run is
  still ungated** because the confirm dialog is built from one, and gating
  it would mean a user with three credits could never see the price of a
  batch of ten. Ownership DOES apply to the dry run's tree lookup, which
  is the right layer for the check anyway.

**Backfill.** None. Crawls written before this migration have
`anon_id = NULL, user_id = NULL` and become inaccessible via anon match.
They were world-readable before the gate; blank memory is more honest
than a guess about which anon cookie once wrote them.

## Rate limit: sweep cooldown on /jobs, 2026-09-14

The "Next" list said this outright: *"`GET /api/tree/{slug}/jobs` is still an
unauthenticated GET that triggers up to three outbound DataForSEO calls via
`sweep_pending`. Those calls are free, so it is not a credit problem — it is
request amplification, and it is the obvious next hardening target."* Half of
it closed today with the ownership gate (strangers no longer reach the sweep
at all). The other half - a legitimate owner polling hard, or a compromised
token, or runaway client-side polling - would still fire the 3-to-1 ratio
between one inbound GET and three outbound `task_get` calls. **Fixed with a
per-slug cooldown on the sweep, not the endpoint.**

`api/main.SWEEP_COOLDOWN_SECONDS = 30`, `_should_sweep(slug)` is an in-memory
mark-first, return-second helper. If the same slug has been swept in the
last 30 seconds, the endpoint STILL SERVES - it just reads `tasks_for_tree`
and `task_spend` from Postgres and returns `swept: null`. The UI already
handles that shape (the no-db path has been returning it since day one).

**Why the cap is per-slug, not per-caller.** Amplification is about outbound
calls to DataForSEO, and DataForSEO's rate limit is applied to us (the
account), not to the visitor whose request triggered it. So the natural
axis is the tree, which is the granularity of the outbound work. Per-caller
would let one user with five stuck trees still generate 5x the calls; per-
slug caps the worst case regardless.

**Why in-memory.** A DB round trip per poll to answer "when did we last
sweep this slug" would add ~150ms to a call whose whole job is to be
cheap. Process-local state resets on redeploy - one burst of catch-up
sweeps right after restart is much less than the alternative of persisting
state that already exists implicitly.

**One subtle bug the tests caught.** The first draft defaulted "never
swept" to `0.0`, which collided with a real `now=0.0` in the test's
injected clock: first call on a slug at time 0 looked like "swept at 0,
now 0, difference 0, INSIDE cooldown, skip". Under real `time.time()` the
same collision would appear on an epoch-zero broken clock - unlikely in
production but not impossible. `None` is now the sentinel for "never
swept", and the branch checks `last is not None` before the arithmetic.

**Boundary semantics, pinned.** `< threshold` blocks and `>= threshold`
allows. At exactly 30 seconds the sweep resumes; at 29.9 it stays
blocked. Two tests protect this against a `<=` refactor that would
silently shift the whole ratio.

**Tests.** `tests/test_rate_limit.py`, 7 tests. First call sweeps,
back-to-back is skipped, cooldown expires, boundary allows, independent
slugs are independent, and mark-first order is pinned. Pure timing logic
- no clock, no DB, no HTTP - because that is what `_should_sweep`
actually is.

**What is NOT rate-limited yet.** The endpoint itself. A caller polling
`/jobs` 100 times per second would still hit Postgres 100 times for the
task/spend reads, which the ownership gate lets through. That is a
different tier of hardening (throttle per identity, not per slug) and
would want a DB-backed counter shared across replicas. Not open unless
someone actually does it.

## Pricing plans, dynamic from the admin panel — 2026-09-15

The marketing landing shipped 2026-09-14 with two hardcoded plans in the
i18n catalogue. Every price change was a code change, a locale sweep and a
deploy. **Fixed by moving the plans behind an app_setting the admin panel
edits.**

**Storage.** One `app_setting` key — `pricing_plans` — carrying a JSON array.
No dedicated `plan` table: plans are a small ordered list of maybe-four items,
and the append-only history the `app_setting` table already gives us is more
useful here than a proper row-per-plan model would be. "What did the pricing
look like six weeks ago" is an audit question, not a query the product runs.

**Fallback matters more than the data.** `GET /api/pricing` NEVER breaks the
landing - bad JSON, missing setting, database down, `settings_all` throws,
all answered `{"plans": []}`. The landing reads empty as "use the hardcoded
i18n plans in the current locale" and renders normally. The seven pricing
tests each pin one of those failure modes, because a marketing endpoint that
500s during an outage takes the marketing site down over the section it
decorates.

**Multi-language becomes single-language on first save. Deliberately.**
Before any admin edit, the landing shows the fallback plans in the reader's
locale. The moment an admin saves, ALL locales render the admin-typed text
verbatim - because the DB holds one canonical version. This is a real
tradeoff: multi-language plan copy would need a `Record<Locale, Plan>`
shape in the admin editor (five inputs per field per plan) and a
locale-aware fallback ladder in the API. Both are worth doing when the
localisation matters more than the operator's editing speed, and neither
does yet.

**Admin editor is a client component that owns local state.** Add plan,
remove plan, add feature, remove feature, reorder - each is a state
operation. A server-round-trip per keystroke would be absurd. The token
still never reaches the browser: the client calls a server action
(`savePricing`) that goes through `lib/api.ts` with `import "server-only"`,
same seam the rest of the admin uses. Two-level validation - editor blocks
the obvious errors (empty required fields, duplicate ids) so save is not
clicked into a 400, and `PricingRequest` in `api/admin.py` re-validates
because the client is not the security boundary.

**0-4 plans, chosen not measured.** Between 0 and 4 plans fit the layouts
the CSS grid supports; more than four cards makes the section read as a
comparison chart rather than a pricing pitch. The bound is written in one
place (`PRICING_MAX_PLANS`) and enforced in three: the Pydantic model, the
editor's Add button, and the frontend's `.plans-N` CSS class that selects
the right grid template.

**Featured and badge decouple.** Replit's reference coupled "dark card" with
"Most Popular label". Here they are separate fields. A plan can be featured
without a badge (visual emphasis) or carry a badge without the highlight (a
New tag on a Starter, say). That is one extra checkbox on the form and one
extra render branch on the landing; both are cheap enough to not conflate
what the operator meant.

**What was not built.**
- **Checkout.** Prices are strings ("$49") because we do not process them
  yet. When Stripe lands, `price` becomes a number in a currency the plan
  already carries, and the string becomes a computed rendering.
- **Enterprise "Contact us" flow.** A plan with no button target - the
  landing scrolls to top on click today, which for now is fine.
- **Feature bullet ordering across plans.** The reader compares columns
  vertically, so the same feature should live at the same index in every
  plan. Not enforced; a UI hint could show mismatches later.

### Second pass, same day: WYSIWYG + draft/publish

The first shape said "start empty, add cards, save". The operator's ask was
different: **four ready-made cards on screen at all times, edit any of them
in place, tick which ones ship**. Shipped that afternoon.

**Four card slots, always.** The editor renders exactly `PRICING_MAX_PLANS`
slots. Ones the admin has saved fill in first; empty slots are backfilled
from `PRICING_TEMPLATES` in `admin/lib/types.ts` — Starter, Pro, Business,
Enterprise, following the product's AI Search Visibility positioning. The
templates ARE the empty state, not a blank slate. That is what "hazır güzel
görünüşlü 4 kartlık" resolves to: the admin never faces four blank
rectangles, only material to react to.

**Publish is per-card, not per-save.** A new `enabled: bool` on `Plan`. Only
cards with `enabled=true` reach the landing; the rest are drafts. The whole
save button now writes ALL FOUR slots to the DB, and the landing filters
`plans.filter(p => p.enabled)`. If nothing is enabled, the landing renders
the localised i18n fallback exactly as before — so "nothing published" and
"nothing saved" look identical to the visitor, which was the whole
requirement.

**Validation is enabled-aware.** A draft may hold half-written content; an
enabled card may not. `min_length` on the Pydantic fields is `0`, and the
`_enabled_requires_content` model_validator refuses `enabled=True` with a
blank required field. Both directions have their tests
(`test_disabled_plan_can_have_blank_content`,
`test_enabled_plan_rejects_missing_name`). The editor's client-side check
does the same in the browser so save is not clicked into a 400.

**Admin IS the landing.** The editor renders the same DOM the landing does —
`.mkt-plan`, `.mkt-plan-badge`, `.mkt-plan-features` — inside a scoped
`.pricing-preview` container that re-declares the landing tokens (cream
`--bg`, purple `--brand`, magenta `--accent`, 24px `--r-xl`) and loads Plus
Jakarta Sans via `next/font/google`. The text fields ARE the card headings
and bullets; no separate form. This is the "Dynamik halde ekranda nasıl
gözükücekse admin panelinde de o şekilde görebileyim" ask - what an admin
sees while editing IS what a landing visitor will see.

**The lift, not the import.** The card CSS is copied from
`web/app/globals.css` to `admin/app/globals.css` rather than shared. The
two projects deploy separately; a shared source would need a build step
neither has today. If either file drifts, the pricing preview drifts —
which is a real risk on a design change, and the reason the copy note
lives at the top of the block in `admin/app/globals.css`.

**Draft cards visually muted.** `opacity: .78; filter: saturate(.6)` on
`.is-draft` in the preview. Cards that will not ship look secondary, so
the operator at a glance sees which slots are going out and which are not
without reading the toggle label.

**What was NOT rebuilt.** Reorder, remove-plan, add-plan — gone. There
are always four slots. If the admin wants a plan gone from production,
they untick `enabled`; the slot stays, holding the template content in
case they want it back. The ability to shuffle order is a follow-up if
someone actually needs it; a fixed layout with a fixed order is simpler
and hasn't been asked for beyond this iteration.

Test count moves from `159 -> 166 -> 172` on the same day: `+7 from
pricing plumbing`, `+6 from draft/publish semantics`.

## Email + password sign-in and verification, 2026-09-15

A second door beside Google, an enforced verification mail, and password
reset. **Still zero new runtime dependencies**: `hashlib.scrypt`, `secrets`,
`hmac` and `urllib` are stdlib, so `answergap/` stays stdlib-only and
`requirements.txt` did not move. `pydantic.EmailStr` was the one thing that
would have added a fourth — see the address note below for why it was not
worth it.

### The whole design is one sentence: both doors produce the same token

`_issue()` is the only place a session is minted, and a password sign-in and a
Google sign-in are **indistinguishable downstream**. `gate`, `identity`, the
ownership checks, `/api/me` and the admin panel were not taught that a second
door exists, and none of them can tell which one was used. That is what kept
this feature from touching the spending path at all.

### Three schema facts, and the one that changed an old decision

`0007_password_accounts` adds `password_hash`, `email_verified_at`,
`signup_granted_at`, the `email_token` table, and makes `google_sub` nullable.

- **The address is now UNIQUE** (`app_user_email_key` on `lower(email)`,
  replacing 0005's non-unique index). This is the constraint that makes account
  LINKING safe rather than a race: without it the same person could hold two
  rows and two balances, and "which account did my credits go to" would have no
  answer. 0005's reasoning is **not** reversed — `google_sub` is still looked up
  FIRST and the address is only ever the fallback, so a Google account that
  changes its primary address is still recognised as the same person.
- **`google_sub` is nullable, not removed.** Postgres treats NULLs as distinct
  in a UNIQUE index, so every password account coexists under the old
  constraint without colliding.
- **`signup_granted_at` replaces the `xmax = 0` trick.** 0005 fired the signup
  grant from the same statement that created the row and told an INSERT from an
  ON CONFLICT UPDATE with `xmax = 0`. That stops working the moment the grant
  moves to a LATER statement — which is exactly what verification does. A
  column recording that the grant has been paid is the only version that
  survives, and `did_grant` is read from the **pre-update** row carried in a
  CTE, because `RETURNING` hands back the new value and would always say
  "already granted".

**The migration names its own failure.** Each migration runs in one
transaction, so a duplicate address would roll back all of 0007 —
`email_token` included — and surface as a bare "could not create unique index".
A `DO $$` block checks first and raises with the offending address in the
message. Merging two balances is not a decision a migration gets to make.

### Credits are granted at VERIFICATION, not at signup

The security decision of the whole feature. `user_create_password` grants
**nothing**; `user_verify_email` pays the signup grant, once, in the same
statement that marks the address proven. A crash between the two would
otherwise leave either a verified account with no credits or a grant with
nothing to show for it, and the ledger is append-only — there is no "fix it
later" for money.

Without this, 10 free searches × every throwaway mailbox is a free-search farm,
and **every one of those searches costs $0.0026 of real money**.

Consequence: a new `emailUnverified` refusal (403), and it is checked **before
the balance**. An unverified account has a balance of zero by construction, so
a balance check running first would refuse all of them with "you are out of
credits" — true, and useless. The action they need is in their inbox, not in a
shop. `tests/test_email_auth.py::test_unverified_is_checked_BEFORE_the_balance`
pins the order.

### The privilege-escalation trap this introduced, and the line that closes it

`ADMIN_EMAILS` matches on the **address**, and a password signup may type any
address it likes — the operator's included — and receives a session. So:

```python
is_admin=verified and gate.is_admin(email, ADMIN_EMAILS)
```

Without `and verified`, *"sign up as the admin address and never open the
inbox"* would have been an admin session. No mail, no proof, full panel.

Two properties make this workable. The claim (`ev`) rides inside a token **we
signed**, so reading it costs **no query** — which is what `/api/meta` requires,
being Railway's healthcheck. And `require_admin` re-checks it against the row,
so the token claim is a fast path rather than the authority.

`ev` **absent** means a token signed before this feature. Those were all Google
sign-ins, where Google had asserted a verified address, so the default is
`True` — `False` would have signed out every live session on deploy.
`test_an_unverified_admin_address_is_NOT_an_admin` was mutation-checked: remove
the guard and it goes red.

### Resend over SMTP, and the reason is the failure mode

Raw SMTP from a container host is wrong twice: outbound mail ports are commonly
blocked or throttled, and mail from a shared cloud IP with no SPF/DKIM
alignment lands in spam. For a **verification** mail that is the worst failure
available — the signup does not error, it silently never completes, and the
user blames the product rather than their junk folder. A provider API is one
HTTPS POST from `urllib`, with the domain authenticated by the provider.

`mailer.available()` is the same seam as `db.available()` and
`embeddings.available()`: **no key → the console backend**, which prints the
message and its link to the server log and reports success. Reporting success
there is correct rather than convenient — on a machine with no provider the log
IS the outbox, and anything else would make every local signup look broken.
`/api/meta` carries `mail_backend` so "no mail arrived" reads as configuration
rather than as a bug.

**`send()` returns a bool and never raises into a signup.** An account whose
creation was rolled back because a third party had an outage is worse than an
account that needs the resend button — and the resend button has to exist
anyway.

**Mail copy is in five locales**, like every other string a reader sees.
Nothing can enforce that the way `en.ts` enforces the web catalogue, so the
copy is kept deliberately small (subject, heading, one line, button, expiry,
fallback) and a test asserts all five subjects differ.

### Enumeration: no endpoint says whether an address has an account

Signup, resend and forgot-password all answer identically whatever they find.
An endpoint that says "already registered" is a membership oracle — point it at
a list and it returns your customer list.

- **Login has ONE refusal code** for no-such-account, no-password-on-it and
  wrong-password alike. Three codes would be three answers to the same
  question.
- **Failure is slow on purpose.** A missing account still pays for one scrypt
  derivation against `_DUMMY_HASH`, because returning early would make "no such
  user" measurably faster and hand back the oracle by timing.
- **Signup on a VERIFIED address mails the OWNER a reset link** rather than
  setting the password. Either they forgot and that is what they needed, or it
  is not them and the link goes to the right person. The reply to the caller is
  unchanged either way.
- **Signup on an UNVERIFIED address takes the new password.** Nobody has proven
  control yet, so there is no account there to protect — the mail decides who
  owns it.
- The one honest answer is the password policy: "too short" is a fact about
  what the caller just typed, not about who else has an account.

### scrypt, and why the cost is inside the string

`hashlib.scrypt` rather than pbkdf2: both are stdlib, but PBKDF2 is CPU-hard
only and a GPU attacks it thousands of times faster than the server that made
it. scrypt's cost is **memory**, which is what custom hardware cannot cheaply
multiply — and a stolen hash table is exactly the asset cracked offline at
leisure.

The encoded form is `scrypt$n$r$p$salt$hash`. **The parameters travel with the
hash**, which is what makes raising the cost later survivable: old hashes keep
verifying under the numbers they were made with, and `needs_rehash` upgrades
them at the only moment the plaintext exists — a successful sign-in. A verifier
reading today's constant would reject every existing hash on the deploy that
raised the cost, i.e. lock out every user.

Policy is NIST SP 800-63B: **length, no composition rules**. 10 characters
minimum, a 200 maximum that is a security control rather than a storage one
(scrypt hashes whatever it is given, so an unbounded password is unbounded
memory-hard work per attempt chosen by the attacker), and a short breach list.
NFKC normalisation at **both** ends, or a Turkish or German passphrase set on
one keyboard fails to verify on another with nothing on screen to explain why.

### The address check is deliberately loose

`gate.looks_like_email` rather than `pydantic.EmailStr`, which drags in
`email-validator` for a product whose whole requirements file is three lines.
It buys almost nothing here because **the verification mail IS the validation**:
an address that does not exist never receives its link, never verifies and
never gets credits. A check that accepts a superset is therefore free, while
one that is too strict silently rejects real addresses — RFC 5321 permits far
stranger local parts than most regexes allow.

It refuses in the HANDLER, not in a `field_validator`, and that is the
"codes, not prose" rule: a validator that raised would make FastAPI answer 422
carrying Pydantic's own English sentence, which a five-language UI renders to a
customer as *"422 Unprocessable Entity"*.

### Rate limiting, in two places that close different halves

Per caller in memory (`_rate_ok`, a sliding window, mark-first like
`_should_sweep`) and per account in Postgres (`email_token_recent`). Not the
same control counted twice: the first stops one attacker hitting many accounts,
the second stops many attackers hitting one account — and the second holds
across replicas and restarts, which is what makes the in-memory half
acceptable.

These endpoints **must** be open — "I forgot my password" cannot require the
password — so without a cap anyone could aim our sending reputation at an
address as a weapon and burn the provider quota doing it.

`email_token_put` also **deletes any unused token of the same purpose** before
inserting. Pressing resend three times must not leave three live links in a
mailbox with nothing to invalidate them.

### Reset revokes; verify does not

`user_set_password(revoke=True)` on a reset bumps `token_epoch`, killing every
session ever issued. A reset exists **because** control of the account may have
been lost; leaving the attacker's session alive would make the reset cosmetic.
A successful login passes `revoke=False` — signing someone out of their other
devices as a reward for typing the right password would be a strange thing to
ship.

`email_token_redeem` takes `purpose` in the **WHERE clause**, not as a check
afterwards. Without it a verification token — the weaker of the two, 24-hour
TTL, mailed to an address nobody has proven — would be redeemable at the reset
endpoint, which is the whole account. It also compares the token's stored
address against the row's **current** one, so a link mailed to an address that
has since changed is dead.

### Where the links point, and why they differ

- **Verify → the API** (`/api/auth/verify`), which redeems, grants, and
  redirects to the app with the session in a **fragment** — same reason as the
  Google callback: fragments never reach a server, so the token stays out of
  access logs and out of `Referer`. One step instead of two.
- **Reset → the web app** (`/?reset=…`), because the next step needs a form.

`WEB_BASE_URL` is new and falls back to the first `AUTH_RETURN_ORIGINS` entry —
`PUBLIC_BASE_URL` is the api, and a person clicking a link in their inbox needs
the app.

`AccountMenu` owns every return path (`#token=`, `?verified=1`, `?reset=`,
`?auth=…`) because they all end in the same two actions — take a token out of
the URL, refetch `/api/me` — and spread across pages, `/tree/[slug]` would
quietly lack a copy. All four are **scrubbed from the address bar**: a reset
token left in the URL survives in history and in anything the reader copies.

### `accounts_enabled()` split from `google_enabled()`

The two questions became genuinely different. A deployment with no Google
client still runs email accounts perfectly well, and the old combined check
would have switched the whole account system off to report the absence of one
of its two doors. `/api/meta` reports both, and the dialog hides a Google
button that could only ever answer 503 — a door that is visibly there and does
not open is worse than one that was never drawn.

### Interface

One dialog, **five modes** — sign in, sign up, "check your inbox", "I forgot",
"choose a new password". They are five steps of one errand, and a reader who
lands on any of them may need another; splitting them across routes would mean
a full navigation and a lost password field every time somebody guessed wrong.

**Email first, Google second**, and that ordering is a decision: Google will
stay the most-used door, but on top it makes the email form read as the
fallback for people who could not manage the easy option.

The unverified state is a **strip in the account row**, not a disabled button
somewhere. Every paid action refuses until the link is clicked, so the reason
has to be visible before the reader tries — and the fix has to be one click
from the explanation.

**A new `--danger` token, and it fixes an existing palette violation.**
`.account-failed` was `color: var(--gap)` — a status token used for decoration,
which the rule at the top of `globals.css` explicitly forbids, and amber there
reads as "opportunity", the opposite of what a refused password means. Errors
are a third role, declared once.

### What is NOT built

- **The admin panel still signs in with Google only.** The API would serve a
  password login for it unchanged; the admin sign-in screen was not touched.
- **No "change my password while signed in", no "unlink Google".** `/api/me`
  now reports `has_password` / `has_google` so an account screen can be built
  without another schema change, but there is no account screen yet.
- **No email change.** `email_token` already keys on the address it was sent
  to, which is the hard half.

### Tests: 180 → 246

`tests/test_passwords.py` (33) and `tests/test_email_auth.py` (33). All pure —
no database, no network, no clock — which is possible because the hashing,
the templates, the gate branch and the identity derivation are all pure.

**Verified locally:** full suite green, `web` and `admin` builds clean (the
five-locale i18n gate passed, which is what proves no locale is missing a key),
API boots, `/api/meta` reports the new fields, and every new endpoint
fails closed with a coded refusal when accounts are off.

**NOT verified: the SQL** — and this is where it went wrong. There is no
Postgres on this machine, so `0007_password_accounts` and the five new queries
were reasoned about and structurally checked but never executed. The migration
applied cleanly in production. **The two data-modifying-CTE statements did
not**, and they took Google sign-in down with them; see the bug section below.
The caveat was stated honestly and was not enough — the fix for untestable code
is to write testable code, not to label it.

**Spend: $0.00.** Nothing here touches DataForSEO.

### The sign-in bug this shipped with, and what it cost — 2026-09-15

`f1ae414` broke **Google sign-in in production**. Users got *"Sign-in did not
finish. Try again."* on every attempt, existing accounts included. Fixed by
`dc3dbc2`; confirmed working from the Railway log (`/api/auth/google/callback`
302, immediately followed by `GET /api/me` 200 with a real body — `AccountMenu`
calls `/api/me` only when a token exists, so that line IS the proof a session
was issued).

**The cause.** `user_upsert` had been rewritten as ONE statement of chained
data-modifying CTEs — `candidate → updated / inserted → both → ledger` — to
save a round trip. `google_callback` turns a falsy return into `?auth=failed`,
and a `try/except` around the statement swallowed the exception, so the failure
reached users as a characterless "try again".

**Three separate mistakes, and the interesting one is not the SQL.**

1. **An optimisation applied to the wrong path.** The one-round-trip rule in
   this file was measured on the SPENDING path, which runs on every search.
   Sign-in runs ONCE PER SESSION, inside an OAuth redirect that has already
   crossed the network to Google and back. Nobody notices 300 ms there. The
   rule was followed without checking whether its reason applied.

2. **The number behind the rule was stale.** ~150 ms per query was true when it
   was measured; it is not true now (see the RESOLVED note in the performance
   section). So the optimisation was bought at a price that no longer existed.

3. **Untestable code was shipped as "structurally checked".** There is no
   Postgres on the development machine. The summary said plainly that the SQL
   had never been executed — which was honest and *not sufficient*. The right
   response to "I cannot test this" is not a louder caveat, it is **writing the
   version that does not need testing**: four small statements in one
   transaction, each verifiable by reading.

**What the fix also removed.** Statements in one transaction see each other's
writes, so the closing `SELECT` reads the ledger row it just inserted. The CTE
version could not — every data-modifying CTE shares the main query's snapshot —
and had to add the delta back on by hand, which is the same trap recorded
against `admin_credit` and `user_upsert` on 2026-09-08. **That is three bugs
against this one construct.** Keep chained data-modifying CTEs for hot paths
where a measurement justifies them, and nowhere else.

`user_verify_email` had the identical shape and was rewritten the same way
before it could fail the same way. It also takes `FOR UPDATE` on the row, so
two concurrent redemptions of one verification link cannot both pay the signup
grant.

### The reason it took a deploy to diagnose: the errors were never logged

This is the part worth remembering, because it is not about SQL.

`oauth.exchange_code` builds an error message naming Google's OWN reason —
`redirect_uri_mismatch`, `invalid_client`, a bad PKCE verifier — and its
docstring says that reason *"must not reach the user, but it has to reach the
log"*. **The caller caught the exception and discarded it.** The intent was
written down and the code did the opposite, three lines away.

`claims_from_id_token` returning `None` logged nothing either, and it covers
four distinct problems: bad issuer, wrong audience, expired token,
`email_verified: false`.

So six different causes — three in the exchange, two in the claims, one in SQL
— all arrived at the same `?auth=failed`, and the only way to tell them apart
was to guess. The first guess (from a 153 ms callback timing, reasoned against
the stale 150 ms figure) pointed at the exchange. It was wrong; the primary
hypothesis was right for a different reason.

**All three paths now print their reason.** None of it reaches the user — it
names our client id and our redirect configuration — but it reaches us. This is
the same fix `return_allowed` was given after IT cost a debugging round trip,
and the lesson repeats: on a redirect-based flow, an unlogged failure branch is
a failure you cannot diagnose at all, because there is no response body to
inspect and the user sees only a generic message.

### Before this goes live

1. Apply `0007` against a copy of production first. `/api/meta` reports
   `storage.applied` and `storage.error`, so the result is visible without
   handling the database password.
2. Set `RESEND_API_KEY` and `MAIL_FROM` on the **api** service, with the From
   domain verified at the provider. Until both are set, `mail_backend` stays
   `console` and no verification mail leaves the building.
3. Set `WEB_BASE_URL` if `AUTH_RETURN_ORIGINS` does not already sort the web
   origin first.
4. Sign up with a real address end to end: mail arrives → link signs you in →
   `/api/me` shows `email_verified: true` and the signup credits → a second
   click on the same link does not grant them twice.
5. Check the privacy claim still holds: an unverified account with an
   `ADMIN_EMAILS` address must get `role: "user"` from `/api/meta`.

## Accounts, credits and the admin panel, 2026-09-08

Google sign-in, an enforced credit balance, a free daily allowance for
signed-out visitors, and a **third Railway service** for the operator. Zero new
dependencies: `hmac`, `hashlib`, `secrets` and `urllib` are stdlib, so
`answergap/` stays stdlib-only and `requirements.txt` did not move.

### The admin role is not in the database, and that is the whole design

`ADMIN_EMAILS` is a comma-separated environment variable on the **api** service.
There is no role column and no endpoint that writes one, so **no SQL statement
in this schema can grant admin** — only a deploy can. That is the same kind of
guarantee as "there is no statement that overwrites a tree": structural, not a
rule somebody has to remember. An empty list refuses everyone.

`gate.is_admin` is the single function the whole panel rests on, and its first
line is `if not admin_emails: return False`.

### The shape, and why each half differs

|  | Customer web | Admin service |
|---|---|---|
| Session | `localStorage` + `Authorization: Bearer` | first-party `httpOnly` cookie, server-side only |
| Hand-off | token in a URL **fragment** | one-time **code**, redeemed server-to-server |
| Reads the API | from the visitor's browser (CORS) | from its own server (no CORS at all) |

Both halves are forced by one fact: `up.railway.app` is on the Public Suffix
List, so `answergap-api` and `answergap-web` are **different sites** and a
cookie set by the api would never come back. The customer app therefore takes
the `localStorage` trade and its cost is written down in `web/lib/auth.ts` — an
XSS becomes a stolen session, and the real fix is a custom domain, at which
point that file collapses into an httpOnly cookie.

The admin does not take that trade. A server route handler cannot read a
fragment and a query parameter would land in Railway's access log, so the api
issues a one-time code instead (`auth_code`, 60 seconds, single-use by
construction: `UPDATE ... WHERE used_at IS NULL RETURNING`, so two concurrent
redemptions cannot both win). `import "server-only"` in `admin/lib/api.ts` turns
"somebody imported the API client into a client component" into a **build
error** — verified by deliberately doing it and watching the build fail.

Google needs **one** redirect URI, on the api service only:
`${PUBLIC_BASE_URL}/api/auth/google/callback`. Both apps return through it and
bounce to their own `return_to`, so **the admin service never sees the Google
secret**. `return_allowed` demands an exact origin match — `startswith` would
wave through `admin.up.railway.app.evil.com`, and what is being redirected is
the session.

**ID token signatures are not verified**, deliberately. The token arrives in the
response body of a direct TLS connection to Google's token endpoint, which OIDC
Core section 3.1.3.7 explicitly permits skipping validation for — and it is why
no crypto dependency is needed. It stops being safe the moment an ID token is
accepted from anywhere else. Do not add such a path. `iss`, `aud`, `exp` and
**`email_verified`** are still checked; that last one is one line and it is the
difference between "admin is an allowlist" and "admin is a claim".

### `/api/meta` must never query

It is Railway's healthcheck path. A per-request `SELECT` there costs ~150 ms on
every page load in the good case and a **restart loop** in the bad one. So
`role` is derived from the token's own email claim with no query, and the
balance lives on `GET /api/me`, called only when a token exists. A test makes
any query from `identity()` an immediate failure.

That boundary is safe and deliberate: a revoked admin token still *reports*
`admin` to the UI until it expires, but can DO nothing — every admin endpoint
reloads the row and re-checks the epoch, the status and the address.

The old hard-coded `"role": "developer"` predicted this in August: *"when
sign-in arrives the ONLY change is where the value comes from."* **It held.**
`DevPanel.tsx:35` was the only line in that component that moved.

### What the schema learned

`0005_accounts` adds `app_user`, `auth_code`, `credit_ledger`, `usage_event`,
`app_setting` and `admin_action`, plus a nullable `user_id` on `crawl` and
`serp_task`.

- **`app_user`, not `user`** — `USER` is reserved in Postgres. Same lesson as
  `label.overlaps` becoming `overlap_vector`. `AUTHORIZATION` is reserved too.
- **Keyed on `google_sub`, not email.** A Google account can change its primary
  address; keying on the address would silently split one person into two
  accounts and two balances.
- **Three columns, three different questions.** `crawl.user_id` is
  **ownership** and is set on INSERT only — `live.score` updates an *existing*
  crawl row, so an owner written there would let user B's score rewrite whose
  search it was. `usage_event.spend_usd` is **attribution** ("who caused this
  $0.0026"). `credit_ledger` is **what they owe**.
- **`credit_ledger` is append-only and the balance is `SUM(delta)`**, never
  stored. The debit is unconditional and balances may go negative: the money is
  already spent upstream by then, and clamping at zero would erase the record of
  an overspend — precisely the mistake this file records against `crawl.spend`.
- **`status` is an UPDATEd column**, the one exception to the append-only
  discipline, because it is read on every spending request and a `DISTINCT ON`
  there would be a second query on a path that is 150 ms away. No history is
  lost: every change writes an `admin_action` row in the same statement.
- **`token_epoch`** is the only revocation there is, since there is no session
  table. Bumping it invalidates every token already issued — the "sign out
  everywhere" button.
- `decompose`/`recompose` stay **pure**: `user_id` travels as a keyword
  argument, and the 24 storage tests were untouched.

### Three bugs this work uncovered, none of which a test would have caught

**1. `refresh` was a no-op in production.** `Client._cached` reads Postgres
first whenever `db.available()` and returns without ever consulting the
filesystem — but `live.crawl`/`live.score` implemented refresh by unlinking a
FILE. On a container that file does not exist, so the snapshot came back,
`billable_calls` stayed 0, and the user was handed the old answer as a fresh
one. This is not just a correctness bug: after a seed's first crawl almost
everything is a cache hit, and *"refresh now costs 1 credit"* was the one
billable action left. **A credit model on top of a refresh that cannot spend
has almost nothing to charge for.** `db.snapshot_delete` + `live._invalidate`
now clear both backends.

**2. Data-modifying CTEs share the main query's snapshot.** `admin_credit`
returned the balance from BEFORE the grant — off by exactly the amount granted,
on the one number the endpoint exists to change — and `user_upsert` reported 0
for a brand-new account in the very response that created its credits. Both now
add the delta back out of the CTE's own `RETURNING`. The audit row is
unaffected: an unreferenced data-modifying CTE still executes exactly once and
to completion.

**3. The anonymous counters were counting signed-in usage.** Every request
carries an ip_hash and a browser id whether or not there is a session, and the
counter query lacked `user_id IS NULL`. One person signing in and searching at
an office would have spent the free allowance of every signed-out visitor
behind that address — and signing out would have locked out even themselves,
since their own browser id had already been counted. Wrong in principle too: a
signed-in user already paid for that search with a credit.

### Verified end to end against production, 2026-09-08 — cost $0.0026

The whole verification cost **one paid search**. Everything else — dry runs,
refusals, cache hits — is free, which is itself the point.

| Rule | Evidence |
|---|---|
| A dry run is free and burns nothing | two in a row, both returned a price |
| Anonymous scoring and batch are closed | **401** `signedOut` |
| A batch **dry run** is open | price visible without spending — load-bearing, see below |
| **A cache hit is free** | four searches, all `spend=0.0, calls=0, cache=True` |
| **A cache hit does not burn the allowance** | those same four left `by_ip` at 1 |
| **A paid search does burn it** | one search, `spend=0.0026, calls=1`, `by_ip` 1 to 2 |
| Reported is not estimated | estimate `0.00258`, reported **`0.0026`** |
| Either counter refuses alone | refused on `by_ip=1` while `by_browser=0` |
| A re-crawl inserts, never overwrites | `knight-online`: crawl 3 (31 Aug) **and** crawl 17 (8 Sep) |
| The diff stays quiet | zero added / zero removed across that re-crawl |
| **`X-Forwarded-For` is not spoofable** | two forged headers, both still refused — Railway writes its own |

With `ADMIN_EMAILS` empty, every admin, dev and auth endpoint fails closed.
With no `DATABASE_URL` at all the product behaves exactly as it did before
accounts existed — which is what keeps a laptop with no Postgres working.

**The batch dry run is deliberately ungated, and that is load-bearing**: the
confirm dialog is built from one, so gating it would mean a user with three
credits could never see the price of a batch of ten.

**A short balance TRIMS a batch rather than refusing it.** The exact billable
count is only known after `queue_scores` filters out questions already scored
or in flight, so a pre-check can only work from an upper bound — and refusing on
an upper bound refuses batches that would have fitted. The remainder is reported
through the `skipped` list the UI already renders.

### Known limitation: the gate runs before the cache

*"Cached results are free"* holds for the **charge** but not for the **gate**.
An anonymous visitor who has used their allowance is refused even for a search
that would have been served from cache, because the gate cannot know that in
advance without an extra query on every anonymous request. Measured, not
theorised: a repeat of an already-cached seed returned 429.

Softened by the fact that their result does not disappear — `/api/tree/{slug}`
stays public, and it returned 200 for exactly that tree after the refusal. Left
unfixed on purpose; revisit if it ever confuses a real user.

The allowance is also **best-effort in both directions**, and the UI must never
claim otherwise: a VPN or cleared site data defeats it, and an office behind one
NAT shares a single counter. It stops accidents and cheap abuse, not a
determined person. The real backstop is that a search costs $0.0026.

### Refusals carry their own numbers

`anonLimit` returns `used`, `limit`, `by_browser` and `by_ip`; `noCredits`
returns `balance` and `needed`. These are facts about the caller's **own**
requests, so they reveal nothing an attacker could not have counted by making
the same requests — and without them a 429 is a support ticket. Chasing one
refusal without the numbers cost an afternoon of probing production.

**402 `noCredits`, 429 `anonLimit`, 403 `suspended`, 401 `signedOut`**, each
with a machine-readable `code` in the body. The code matters because **429 was
already taken** by the DataForSEO ceiling, and telling someone out of credits to
wait for a budget window is advice for a different problem. A 429 *without* a
code still maps to `budget`, exactly as before.

`web/lib/api.ts` carries the invariant nothing else enforces: every member of
`ErrorKind` needs an `error.<kind>` key in **all five locales**, because errors
render through a dotted lookup and i18n falls back to the raw key — a missing
translation would show a customer the literal text `error.noCredits` at the
worst possible moment.

### The admin service

`admin/`, six screens (overview, users, user detail, settings, audit, sign-in)
plus `/no-access` and `/api-error`. **English only** — one operator, and putting
it through the five-locale build gate would cost four broken builds per label
change and buy nothing. Its own ~200-line stylesheet rather than a copy of the
customer app's 1092; same token names, no dead rules to drift.

**One screen = one API call = one SQL statement.** Three hops separate the
admin's browser from Postgres and only the last is the 150 ms one, but a page
issuing four calls pays 600 ms before rendering. `admin_users` pages FIRST and
then joins laterally — writing the laterals straight against `app_user` runs
both subqueries for every user before the `LIMIT`, which is the same trap that
made `/api/meta` take 8.9 seconds.

**Never let an admin page answer "a server error occurred".** Next strips error
messages in production, so an uncaught throw loses the status, the path and the
body — a 403 spent an afternoon looking like a crash. `call()` now redirects:
403 to `/no-access` (which names the address that is actually signed in, since
`ADMIN_EMAILS` matches on exactly that), 401 to sign-in, anything else to
`/api-error` naming the status, with the body going to the server log.

The audit log is empty until an admin actually does something — granting
credits, suspending, revoking tokens, changing a setting. Signing in and
browsing write nothing, deliberately: a log of every click loses the three rows
that matter in the noise.

### Environment variables

On **api**: `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`ADMIN_EMAILS`, `AUTH_RETURN_ORIGINS`, and `ANON_IP_SALT` (optional, derived
from the secret if unset — a missing salt must not disable rate limiting).
`PUBLIC_BASE_URL` now also builds the OAuth `redirect_uri`, **which widens what
an unset value costs**: it used to only degrade batch scoring to polling.

On **admin**: `API_URL` and `PUBLIC_ADMIN_URL`. `API_URL` is deliberately NOT
`NEXT_PUBLIC_` — it is read server-side only, which is the entire point.

Missing any of the first four means **accounts are switched off** and the
product behaves exactly as it did before this feature. That is not a weaker rule
than failing closed: local development has no Postgres, and a gate that refused
everything without a database would make the laptop the one place the product is
broken. `ADMIN_EMAILS` alone fails closed, because there an empty value has a
meaning.

`anonymous_daily_searches` (default 1) and `signup_credits` (default 10) are
**not** environment variables — they are `app_setting` rows, changed from the
panel, append-only so "what was the limit last Tuesday" stays answerable.

**Both URLs must carry a scheme.** Railway's Networking panel shows domains
WITHOUT `https://`, a copy-paste drops it, and the failure then surfaces three
redirects later as someone else's 400. Cost one debugging round trip; the admin
service now refuses to start a sign-in and names the variable. Checked, not
silently repaired — prepending `https://` would hide the same typo in
`AUTH_RETURN_ORIGINS`, where nothing in the admin app can reach it.

### Deployment note — a THIRD service

| Service | Root dir | Config-as-code path |
|---|---|---|
| admin | `/admin` | `/admin/railway.json` |

**The config path does not follow the root directory** — third service, third
time this trap applies. Left at the default, the root config applies and Railway
runs `python -m uvicorn` inside a Next service; the symptom is a Next service
failing with a Python error, which looks like nothing to do with configuration.

`admin/.gitignore` had to be added: without it `git add admin/` sweeps 344
packages and `.next` into the commit. The **root `.gitignore` does not cover
`node_modules`** — `web/` is only safe because it carries its own.

## Privacy and the interface, 2026-09-08 (second half)

**Two commits from this section are COMMITTED BUT NOT PUSHED**, on purpose —
they were left for review. Production is still running the code from
`f2f4b4c`, so anyone comparing the deployed site against this file will not see
the interface work. Push when the review is done; Railway deploys from `main`.

### Searches are private now — and the scope is the decision

`/api/trees` was unfiltered: every signed-in user's searches were visible to
everyone. This was on the "never actually decided" list and it is now decided.

**List-level.** A slug appears in your list only if you have a crawl row for it.
The tree itself stays ONE SHARED CORPUS and ONE SHARED CACHE, so two people
searching the same seed still get the same tree and the second one still gets it
free. Splitting the cache per user would multiply the bill for nothing.

**`/api/tree/{slug}` stays open, deliberately.** A slug is built from the seed,
so anyone able to guess it already knows the keyword — the sensitive half — and
what the tree adds is Google's own public results, obtainable by anyone for
$0.0026. Gating it would also strand the anonymous visitor who has just spent
their one free search, because an anonymous crawl has no owner to match on.

Note the subquery rather than a `WHERE` on the outer `DISTINCT ON`: the tree
shown is still the LATEST crawl of that slug whoever ran it, because the edges
are one corpus. Filtering the outer query would have shown a returning user
their own stale copy of a tree somebody else had since refreshed.

Consequence worth keeping: **`/api/meta` is now query-free for the first time.**
`tree_count` was its last query and was removed rather than made per-user —
nothing in `web/` ever read it, and under privacy it would have been a count of
other people's searches riding along in every page load.

### The interface: first half done, second half not

Done: design tokens, light/dark/system, the sign-in dialog, the landing page.
Still wearing the old skin: the tree canvas, the gap table, related searches and
the question detail panel.

**TWO PALETTES, AND THEY MUST NOT MIX.** Colour here is not decoration — it is
the entire claim, since `gap/weak/covered/no_data` have nothing but hue to tell
them apart. The brand therefore sits on violet, chosen because it is nowhere
near the amber/teal axis the statuses use. The rule is written at the top of
`globals.css`: never style a node, a badge or a row with a brand token, and
never use a status token for decoration.

It caught its first violation immediately, and the violation was ours: the
wordmark was painted with `--gap`, the colour that means *"no page answers
this"*, in the most prominent position on the page.

**One definition per token, via `light-dark()`.** The old file defined dark
ONLY inside `@media (prefers-color-scheme: dark)` and nowhere else, so a manual
"dark" choice did nothing on a machine set to light — the toggle would have
appeared broken in exactly the case where somebody bothers to use it. Verified
that lightningcss downlevels `light-dark()` into its own custom-property
polyfill and that both themes render correctly through it.

**The theme is applied by a blocking inline script in `<head>`, before first
paint.** Without it every load flashes white for a dark-mode reader while React
hydrates. Three states, not two: "system" is a destination, and a two-state
switch can never offer the way back to following the machine.

**Sign-in is a native `<dialog>`** — focus trap, Esc, inert background and
top-layer stacking come free, and a div-with-a-backdrop reimplements all four
badly. It exists because a lone "Sign in with Google" button never says what you
get, and it is where a refusal can land, so the explanation and the button that
resolves it sit in one place.

An empty search list is now an explicit empty state that says the list is
private. That matters as of today: a new account legitimately starts with
nothing, and a blank gap reads as breakage.

### Two mistakes that only a screenshot caught

Both passed `npm run build`. Neither would have been found by reading.

1. **`--brand-*/--grad` inside a CSS comment terminates the comment** at the
   `*/`, and the rest parses as CSS. The whole stylesheet fails.
2. **`light-dark()` resolves a COLOR, not a whole `box-shadow` list.** Shadow
   colours are now separate tokens and the geometry is written once.

A third was a specificity trap rather than a syntax one: a `.landing h1` reset
appended below `.hero h1` matches the SAME element at the SAME specificity and
silently flattened the display headline. Removed rather than fought.

**Screenshot the result.** The project has headless Chrome already (it renders
the architecture PDF) and it is the only thing that found any of the above:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
  --disable-gpu --hide-scrollbars --virtual-time-budget=9000 \
  --window-size=1280,700 --blink-settings=preferredColorScheme=1 \
  --screenshot=out.png "http://127.0.0.1:3000/"
```

`preferredColorScheme=1` is light, `0` is dark. Kill the old `next start` first
— a stale server on the same port serves the previous build and produces a
screenshot that looks like a catastrophic CSS failure when nothing is wrong.

## Codebase review, 2026-09-15 — open findings not yet acted on

A full read of the repo, the tests and both builds. Recorded here because none
of it is derivable from the code: every item below is something that is
MISSING, and absence leaves no trace to trip over later. Ordered by
return-on-effort, not severity.

Health at the time of the review: **248 tests green, `web` and `admin` builds
clean, three routes, 49 labelable archive questions.**

### P0 — cheap, and the effect is large

**1. There is no CI, and Railway auto-deploys `main`.**
`.github/` does not exist. The 248-test suite is the project's best asset and
nothing runs it automatically, so a broken commit deploys straight to
production. This is not theoretical — it is exactly what happened later the
same day: `f1ae414` shipped SQL that took Google sign-in down, and nothing
between `git push` and real users would have caught it. A workflow running
`pytest -q` plus the two `npm run build`s is about 25 lines.

Note that CI would NOT have caught that particular bug (the SQL needs a
Postgres, and there is none in the suite). Which is the second half of the
lesson: **a CI worth having for this repo needs a Postgres service container**,
so `tests/test_storage.py` and the account queries can run against a real
database instead of being reasoned about.

**2. ~~Postgres is in the wrong region.~~ RETRACTED, same day.** The review
listed this as the biggest zero-code win, quoting the performance section's
~150 ms per query. That figure is stale — measured at 4 ms in production later
the same day. See the RESOLVED note in the performance section. Left here
rather than deleted, because the mistake is instructive: a measurement written
down without a date gets quoted as current state forever.

### P1 — product credibility

**3. Eleven dead links on the landing, two of which are load-bearing.**
`web/app/page.tsx` — the nav's Solutions/AI SEO and the whole footer are
`href="#"`. Two of them block work that is already on the Next list:

- **Privacy Policy** — Google OAuth verification requires a published privacy
  policy URL. The app is in "testing" mode today, which caps it at 100 users
  and shows an unverified-app warning at the one moment trust matters most.
- **Terms of Service** — Stripe onboarding requires ToS, a refund policy and a
  contact route.

**4. The landing promises features that do not exist.** In `en.ts`:
*"Search intent classification"*, *"Opportunity export"*, *"API access"*,
*"Priority support"*. None are built. This is the same family as the accuracy
rules this file already enforces ("never claim live data", "must be labelled
estimated") — applied to marketing copy rather than to data.

Worse in kind: **"Unlimited topic searches"** on the Pro plan. Every search is
$0.0026 of real money and the product's own implemented model is credit-based.
That line has no ceiling and contradicts the gate.

**5. The AI-search-visibility product has no SEO of its own.**
`layout.tsx` carries `title` and `description` and nothing else. Missing:
`metadataBase`, OpenGraph/Twitter cards, canonical, `sitemap.ts`, `robots.ts`,
an OG image (`web/public/` still holds Next's scaffold `vercel.svg` etc).

The sharper problem: `<html lang="en">` is hard-coded and the locale is applied
client-side only, so **Google sees exactly one of the five languages**. The
translation work currently has zero search value. The marketing copy IS in the
prerendered HTML (verified in `.next/server/app/index.html`), so this is a
metadata fix rather than a rendering rewrite.

### P2 — architectural debt, in dependency order

**6. `live.py` is effectively untested.** 1203 lines, the heart of the product,
and the suite imports exactly one function from it (`scoring_candidates`). Not
covered: `_carry_previous`, the reach gate (`EXPANSION_FLOOR`), the harvest,
spend accumulation — i.e. every place this file warns that money or data was
lost before. The 248 tests are weighted toward `gate`/`auth`, which is the
layer least likely to lose anything.

**7. A real job runner.** The fallback sweep still piggybacks on a polled GET,
and **scheduled crawls do not exist** — which is the Agency plan's ($99-199)
main selling point.

**8. Stripe and tenancy.** No `plan` / `subscription` / `stripe_customer_id`
anywhere in the schema and no recurring credit grant, so "100 topic searches
per month" is granted by hand. `credit_ledger` is append-only and correctly
shaped for this; what is missing is the renewal, not the ledger.

### P3 — small

- `BatchScoreRequest.questions` has no `max_length` and no per-item bound,
  while `top_n` is correctly capped at 50. The dry run is deliberately
  ungated, so an anonymous visitor who has spent their free search can still
  post an unbounded body.
- ~14 dead CSS classes left from the pre-marketing landing (`.landing-head`,
  `.market-row`, `.tree-card*`, `.searchbar`, `.form-row`, `.section-head`,
  `.w3`, `.org`).
- Two tracked leftovers in the repo: `karsılastırma.jpg` and `test/test.txt`.
- The root `.gitignore` does not cover `.pytest_cache/`.
- `web/public/` still ships Next's scaffold SVGs.

### The finding that matters most: the label deadlock

The product's one selling number — "gap" — rests on a metric measured at
**precision 0.20** on 14 rows with one positive. The plan is for users to
label through the UI. But there are no users, because the metric is not
validated. **That loop does not break on its own.**

The numbers say breaking it is cheap:

| | |
|---|---:|
| Labelable in the archive TODAY, at $0 | **49 questions** (14 already done → 35 free) |
| To reach ~200 labels | ~150 × $0.0020 = **$0.30** |

Thirty cents removes the only genuine blocker in the project — and it is also
the precondition for the `rerank-2` experiment the embeddings section
correctly refuses to run at n=14. Total spend to date is ~$0.13, so this does
not even double it.

`scripts/phase05_collect.py` / `phase05_evaluate.py` already exist and the
archive responses are cached, so iterating costs nothing.


## Spend to date

**~$0.126** total ($0.107 before Phase B, $0.0112 of live crawling on
2026-08-27). **2026-08-28 spent $0.00** — labelling, evaluation and the
feedback layer all run against data already on disk. **2026-09-08 spent
$0.0026** — the entire end-to-end credit verification cost one paid search;
everything else was dry runs, refusals and cache hits, all free. **2026-09-14
to 2026-09-15 spent ~$0.005** — the whole seven-commit session across
embeddings / privacy / rate-limit / landing rebuild / pricing feature was
one paid privacy-verification search ($0.0026) plus a handful of Voyage
embedding requests across three model tiers on the 14-row archive (~$0.002);
everything else was dry runs, cache hits and local builds. Cache files mean
re-running anything costs nothing — a repeated search returns in 20 ms and
bills $0. Always run `--dry-run` first; the search endpoint accepts
`"dry_run": true` and returns the request plan and its price without touching
the network.

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
6. ~~**Auth, credits.**~~ **DONE 2026-09-08** — Google sign-in, an enforced
   credit balance, an anonymous daily allowance and the admin panel that runs
   them. **Email + password and verification added 2026-09-15**, so the signup
   funnel no longer depends on one external provider — see the section above.
   **Still open: tenancy and Stripe.** There is no per-user data isolation and
   no checkout; credits are granted by hand.
7. ~~**Decide whether searches are private.**~~ **DONE 2026-09-08 — private,
   at list level.** See the section above for what that does and does not
   cover. Still open, and smaller: the tree, table, related-searches and
   question-detail screens have not been moved to the new visual language yet.
8. ~~**Rate limiting on `/jobs`.**~~ **DONE 2026-09-14** — ownership gate
   plus a per-slug sweep cooldown; see the "Rate limit: sweep cooldown on
   /jobs" section. Broader per-identity rate limiting on other endpoints
   stays open, but not open unless it becomes a real concern.
9. **CI, with a Postgres service container.** Nothing runs the 248 tests
   automatically and Railway deploys `main` on push. Proven necessary the
   same day it was noticed: `f1ae414` took Google sign-in down in
   production. The Postgres container is the point rather than a detail -
   the bug that got through was SQL, which the current suite cannot reach.
10. **Legal pages, then Stripe.** Privacy Policy and Terms of Service are
    `href="#"` on the landing today, and they gate two things already on
    this list: Google OAuth verification (the app is capped at 100 users in
    "testing" mode until a privacy URL is published) and Stripe onboarding.
11. **Own SEO.** Five locales are invisible to crawlers - `<html lang>` is
    hard-coded `en` and the locale is client-side only - plus no OG image,
    canonical, sitemap or robots. For a product that sells AI-search
    visibility this is both a credibility problem and a free channel.
12. **Break the label deadlock: 35 labels free today, ~200 for $0.30.**
    The one number this product sells sits at precision 0.20 on 14 rows,
    and the plan to collect labels FROM users cannot start until the metric
    is credible enough to have users. See the review section for the
    arithmetic.

Items 9-12 come from the 2026-09-15 review; the reasoning for each is in
"Codebase review, 2026-09-15 — open findings not yet acted on".

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
