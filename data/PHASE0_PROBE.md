# Phase 0 Probe — can we get PAA source data at all?

Baseline run returned 32/32 PAA elements as
`people_also_ask_ai_overview_expanded_element` with `references: null`
and `asynchronous_ai_overview: true`. Source URL coverage: **0%**.
This probe tests whether DataForSEO's paid parameters unlock it.

Seed: **diş beyazlatma** · `location_code=2792` · `language_code=tr`
Billable requests: **0** · from cache: 3

## Summary

| Combination | PAA | With source | Rate | Raw file |
|---|---:|---:|---:|---|
| A · click depth only | 15 | 0 | **0%** | `data/raw/probe-A-click4.json` |
| B · async AI Overview only | 4 | 0 | **0%** | `data/raw/probe-B-async.json` |
| C · both | 15 | 0 | **0%** | `data/raw/probe-C-both.json` |

> **NO SOURCE DATA AVAILABLE.** No parameter combination returned a
> source domain or URL. The "no dedicated page" definition cannot be
> implemented from the PAA block. The workable alternative — adopted —
> is to query each question on its own and read its organic results.

## Per-combination detail

### A · click depth only

Parameters: `{"people_also_ask_click_depth": 4}`
Estimated cost: $0.00258/request · PAA items get clicked open; classic source snippet may appear

Returned `expanded_element` types:

- `people_also_ask_ai_overview_expanded_element` x 15

Carrying `asynchronous_ai_overview: true`: 15/15

**No PAA element carried a source URL or domain.**

### B · async AI Overview only

Parameters: `{"load_async_ai_overview": true}`
Estimated cost: $0.00398/request · AI Overview content plus its reference list may appear

Returned `expanded_element` types:

- `people_also_ask_ai_overview_expanded_element` x 4

Carrying `asynchronous_ai_overview: true`: 4/4

**No PAA element carried a source URL or domain.**

### C · both

Parameters: `{"people_also_ask_click_depth": 4, "load_async_ai_overview": true}`
Estimated cost: $0.00458/request · Union of A and B

Returned `expanded_element` types:

- `people_also_ask_ai_overview_expanded_element` x 15

Carrying `asynchronous_ai_overview: true`: 15/15

**No PAA element carried a source URL or domain.**

