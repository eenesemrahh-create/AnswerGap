"""AnswerGap — shared core.

Holds the code used by both the validation scripts under `scripts/` and the
FastAPI app under `api/`. They must share the same normalization, matching and
tree-building logic — if they diverged, the metric we measure during validation
and the metric we ship in the product would drift apart without anyone noticing.
"""
