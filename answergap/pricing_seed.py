"""The three pricing cards, as one Python value.

WHY THIS EXISTS. `/pricing` reads its cards from the admin panel, and the
admin panel reads them from `app_setting.pricing_plans`. On a fresh database
that setting is empty, so the page would fall back to its content file and the
operator would open the editor to find three blank cards waiting to be typed
in by hand. Migration 0011 writes these rows instead, which is the same thing
a careful operator would have done and is auditable in exactly the same way.

IT IS A SEED, NOT A DEFAULT. It runs once, on a database that has no
`pricing_plans` row. After that the stored value is authoritative and this
module is history: editing it changes nothing on a deployment that already
ran the migration, and it is NOT re-read at request time. That is the
difference from `gate.SETTING_*`, whose defaults are read on every request and
therefore live next to their readers.

THE SAME COPY EXISTS IN `web/content/marketing/pricing/en.ts`, which is the
fallback the page renders when the API is unreachable at build time. Two
copies in two languages can drift, so `tests/test_pricing_seed.py` reads that
file and fails when the ids, prices or feature counts stop matching. The
translations are deliberately NOT checked against it: they carry the same
plans in four other languages and only the numbers have to agree.

Everything a card says about what the product DOES is taken verbatim from the
approved design, and most of it is not built yet - deep search, exports, API
access, the MCP server, subscriptions, the trial. The header comment of
`web/content/marketing/pricing/en.ts` lists them, and CLAUDE.md item 16 is the
standing reminder that this page promises them.
"""

from __future__ import annotations

# `enabled: True` on all three: a seed nobody can see is a seed that looks
# like it failed. The operator can unpublish any of them in one click.
SEED_PLANS: list[dict] = [
    {
        "id": "starter",
        # Not purchasable until an operator pastes the Stripe price
        # ids; `credits` is what one paid period grants.
        "stripe_price_id": "",
        "stripe_price_id_annual": "",
        "credits": 100,
        "enabled": True,
        "theme": "light",
        "name": "Starter",
        "desc": "For creators and small teams building visibility in AI search.",
        "price": "$9.99",
        "price_annual": "$7.99",
        "per": "/month",
        "features_heading": "Best starter plan",
        "features": [
            "100 credits per month",
            "Unlimited users",
            "All regions",
            "All languages",
            "PNG image export",
            "24-hour search history",
        ],
        "cta": "Start 7-Day Trial",
        "badge": None,
    },
    {
        "id": "lite",
        # Not purchasable until an operator pastes the Stripe price
        # ids; `credits` is what one paid period grants.
        "stripe_price_id": "",
        "stripe_price_id_annual": "",
        "credits": 300,
        # `dark` is what the old `featured` boolean produced, and it is the
        # card the design darkens - the one it also badges Most Popular.
        "enabled": True,
        "theme": "dark",
        "name": "Lite",
        "desc": "For SEO professionals scaling AI search authority.",
        "price": "$19.99",
        "price_annual": "$15.99",
        "per": "/month",
        "features_heading": "Most popular",
        "features": [
            "300 credits per month",
            "Unlimited users",
            "All regions",
            "All languages",
            "PNG image export",
            "1-month search history",
            "Deep search",
            "CSV data export",
        ],
        "cta": "Go Lite",
        "badge": "Most Popular",
    },
    {
        "id": "pro",
        # Not purchasable until an operator pastes the Stripe price
        # ids; `credits` is what one paid period grants.
        "stripe_price_id": "",
        "stripe_price_id_annual": "",
        "credits": 1000,
        "enabled": True,
        "theme": "light",
        "name": "Pro",
        "desc": "For high-volume teams and agencies requiring white-labeling.",
        "price": "$39.99",
        "price_annual": "$31.99",
        "per": "/month",
        "features_heading": "Best value for money",
        "features": [
            "1,000 credits per month",
            "Unlimited users",
            "All regions",
            "All languages",
            "PNG image export",
            "1-year search history",
            "Deep search",
            "CSV data export",
            "Bulk searches",
            "API access",
            "Pay-as-you-go credits",
            "MCP server",
        ],
        "cta": "Go Pro",
        "badge": None,
    },
]
