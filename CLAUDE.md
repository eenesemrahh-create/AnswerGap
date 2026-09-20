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

**This file is split in two.** It holds the rules and the current state.
Dated session logs and reference sections live in
[`docs/HISTORY.md`](docs/HISTORY.md), which is NOT loaded automatically -
grep it when a section below says "see the X section" and X is not here.
It covers: storage/Postgres, Phases 1-3, tests, developer mode, performance,
embeddings (researched + measured), privacy, rate limit, pricing plans, email
sign-in and the bug it shipped with, accounts/credits/admin, the interface
work, the 2026-09-15 codebase review, AI Overview citations, CI, deployment
on Railway, restarting locally, the fresh-machine checklist, spend to date,
the architecture verdict. Append new dated logs THERE, not here.

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

**Where it stopped, in one line (2026-09-18, late):** verification mail now
ARRIVES - the whole email sign-in flow is finally live - and the next thing is
the page the verification link lands on, which is unfinished. Everything else
from this session (AI Overview citations, CI, Stripe) is done and recorded
below.

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
- ~~CI with a Postgres service container~~ **DONE** `35b2a13` + `5bb6748`,
  with a live admin page. See "CI, 2026-09-17".
- Wider list discussed with the operator (Google APIs), in suggested order:
  labels to ~200 ($0.30) -> AI Overview surface (in progress) -> Privacy/ToS
  pages -> Search Console API (own-site impressions per question; needs the
  `webmasters.readonly` scope and likely Google app verification) -> search
  volume (Ads API, or DataForSEO Keywords Data as a stopgap) -> Claude-based
  intent classification + content brief. Custom Search JSON API and Trends
  were ruled out.

## Email finally leaves the building, 2026-09-18

**The operator bought `gettopquestions.com` (GoDaddy, mailbox on Microsoft
365) and verification mail now arrives.** This closes the item that has sat in
"Pick up here" since 2026-09-15.

**Sending is on a SUBDOMAIN, `send.gettopquestions.com`.** The root domain's
MX and SPF belong to the Microsoft mailbox (`support@gettopquestions.com`) and
must not be touched; a subdomain keeps the provider's records beside them
instead of on top of them. Resend now asks for DKIM (TXT) plus TWO CNAMEs for
sending - not the classic `v=spf1` TXT, which is what this file would have
told you. The MX it also lists is for RECEIVING and is not needed; leaving
"Enable Receiving" on just keeps the domain unverified.

On the api service: `RESEND_API_KEY`, `MAIL_FROM`
(`AnswerGap <noreply@send.gettopquestions.com>` - the address MUST be on the
verified subdomain) and `MAIL_REPLY_TO` (`support@gettopquestions.com`, so
replies reach a real mailbox).

### The bug: Cloudflare refused us, and the failure was invisible

`[mail] HTTP 403 sending to e**@gmail.com: error code: 1010`. **1010 is
Cloudflare, not Resend** - it blocks the default `Python-urllib/3.x`
signature, so the mail never reached the provider at all. Meanwhile the signup
returned 200 and the dialog said "check your inbox", because `send()` never
raises into a signup. An empty inbox with nothing on screen to explain it.

Fixed in `4a06337` by sending `User-Agent: answergap/1.0`, which `api/ci.py`
and `api/stripe.py` already did - the mailer was the one module that did not,
and the only one of the three whose failure a customer feels. A test pins the
header.

**Diagnosis needed two things this repo now has:** `/api/meta.mail_from_domain`
(`02f2942`), which ruled out the obvious cause - sending from the unverified
root domain - without reading a log; and the api's deploy log line, which
named the real one. Keep both habits: publish the non-secret half of a
configuration, and log the provider's own reason.

### Where a dead verification link lands, 2026-09-20

**A refused link has TWO causes and only one of them is a problem.** Both used
to end on `?auth=verifyExpired` showing the *password-reset* sentence, "ask for
a new one", with nothing on the page to ask with: the only resend button lives
in the signed-in strip, and the person holding a dead link has no session.

- **Genuinely expired or never real** → `?auth=verifyExpired` opens the dialog
  on a new `resend` step. It needs its own email field; the existing `sent`
  step could not serve, because its resend button is disabled without an
  address and that reader never typed one.
- **Already spent** → `?auth=alreadyVerified`, a sentence, no dialog.
  `db.email_token_settled` answers this: `email_token_redeem` sets `used_at`
  rather than deleting, so the row still names its owner. **This is the common
  case, not an edge one** — a mail scanner that prefetches the link to preview
  it verifies the account before the human clicks. Sending that person to the
  resend step would strand them, because `resend_verification` will not mail a
  verified account yet still answers "verificationSent".

Covered both ways: `tests/test_sql.py` (real Postgres, CI only) for the SQL,
and `tests/test_email_auth.py` for the routing with the two db calls stubbed,
so the branch stays covered on a laptop with no Postgres.

### What is NOT done

- **The second click has still not been tested against a live link.** The
  logic is now pinned by tests, but nobody has clicked a real mailed link
  twice and watched the balance stay put.
- **Password reset has not been run end to end** either.
- `WEB_BASE_URL` is **unset** on the api service. It does not stop mail going
  out, but reset links and the Stripe return page read it; set it to the web
  service URL, and to the custom domain when the app moves there.

## Stripe: the pipe is proven, 2026-09-18

`f372f84`, `d39ec39`, `f857ce1`, `a805e2e`. **A real payment was made and
arrived.** Nothing is wired to plans or credits yet: a payment is recorded and
nothing else happens.

- `api/stripe.py` - stdlib client. Keys (`STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`) live on the api service and no endpoint returns
  them. The publishable key is not used anywhere: Checkout is hosted by
  Stripe, so no card detail reaches us.
- **Mode comes from the key prefix**, because Stripe's Account object does not
  say; anything unrecognised counts as not-test.
- **`POST /api/stripe/webhook` fails closed** like the DataForSEO callback.
  Signature over the RAW body, `hmac.compare_digest`, 5-minute window, several
  `v1` values accepted for rotation. Migration `0009` adds `payment_event`
  with a UNIQUE `event_id`, because Stripe retries until it gets a 2xx.
  `livemode` is stored: mixing a test payment into a revenue figure is how the
  figure becomes a lie.
- **Admin `/stripe`**: key mode, whether the key works, charges enabled,
  webhook secret present, and the payments received. A live payment takes TWO
  deliberate acts - the first click only opens a warning naming the amount,
  the fee (~$0.33 on $1.00) and where the money lands.
- **`/pay?k=<token>`** (`web/app/pay/`) is a TEMPORARY link-gated page so
  somebody without admin access can pay a chosen amount. Not open to the
  internet on purpose: an unauthenticated endpoint minting Checkout sessions
  for an arbitrary amount is what CARD-TESTING abuse looks for, and Stripe
  freezes the account it happens on. Amount bounded $0.50-$50, 10 attempts per
  IP per hour, 404 when `PAY_PROBE_TOKEN` is unset. **Delete the page, the two
  `/api/pay/*` endpoints and the variable once plans are wired.**
- **`PAY_PROBE_TOKEN` was typed into a chat during testing and must be
  rotated.**

**Next on payments, in order:** legal pages (ToS, privacy, refund policy -
Stripe wants them and taking money without them is not defensible), then
credit PACKS rather than subscriptions: a pack maps onto the append-only
ledger with no renewal, proration or dunning to get wrong. The webhook already
records the payment; granting credits is the piece to add, keyed on the
session's metadata.

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
9. ~~**CI, with a Postgres service container.**~~ **DONE 2026-09-17** -
   see "CI, 2026-09-17". Original note: Nothing runs the 248 tests
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
