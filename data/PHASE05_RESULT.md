# Phase 0.5 Result — gap metric validation

Labeled questions: **16** (1 gap / 15 not)

Rule under test: **gap ⇔ number of results clearing the threshold ≤ k**

A false positive (claiming a gap that is not one) damages trust directly;
a false negative is only a missed opportunity. Ranking is by **precision**.

## Best rules (by precision)

| Rule | Precision | Recall | F1 | Accuracy | TP | FP | FN | TN |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| words · pages with overlap>=0.6 is <= 0 | **0.17** | 1.00 | 0.29 | 0.69 | 1 | 5 | 0 | 10 |
| words · highest overlap < 0.6 | **0.17** | 1.00 | 0.29 | 0.69 | 1 | 5 | 0 | 10 |
| words · pages with overlap>=0.7 is <= 0 | **0.14** | 1.00 | 0.25 | 0.62 | 1 | 6 | 0 | 9 |
| words · highest overlap < 0.7 | **0.14** | 1.00 | 0.25 | 0.62 | 1 | 6 | 0 | 9 |
| words · pages with overlap>=0.6 is <= 1 | **0.11** | 1.00 | 0.20 | 0.50 | 1 | 8 | 0 | 7 |
| words · pages with overlap>=0.7 is <= 1 | **0.10** | 1.00 | 0.18 | 0.44 | 1 | 9 | 0 | 6 |
| stems · pages with overlap>=0.8 is <= 0 | **0.10** | 1.00 | 0.18 | 0.44 | 1 | 9 | 0 | 6 |
| stems · highest overlap < 0.8 | **0.10** | 1.00 | 0.18 | 0.44 | 1 | 9 | 0 | 6 |

**Highest F1:** words · pages with overlap>=0.6 is <= 0 (F1 0.29, precision 0.17)

## Strategy comparison

Best achievable F1 per matching strategy — this is what tells you whether
synonym handling actually earns its keep.

| Strategy | Best F1 | Its precision | Rule |
|---|---:|---:|---|
| `words` | 0.29 | 0.17 | words · pages with overlap>=0.6 is <= 0 |
| `stems` | 0.18 | 0.10 | stems · pages with overlap>=0.8 is <= 0 |
| `synonyms` | 0.18 | 0.10 | synonyms · pages with overlap>=0.8 is <= 0 |

## Page count vs highest overlap

Phase 0 observed that highest overlap is the wrong metric. Measured:

- Page-count family — best F1: **0.29** (words · pages with overlap>=0.6 is <= 0)
- Highest-overlap family — best F1: **0.29** (words · highest overlap < 0.6)

> Tied; this sample cannot separate them.

## Per-question detail

Using the top rule (`words · pages with overlap>=0.6 is <= 0`).

| Question | Lang | You | Rule | Verdict | ≥thr | Highest |
|---|---|---|---|---|---:|---:|
| Will yellow teeth ever become white? | en | N | N | ok | 6 | 0.80 |
| Do teeth turn yellow again after whitening? | en | N | N | ok | 5 | 1.00 |
| Is it worth getting teeth whitened at the dentist? | en | N | N | ok | 1 | 0.60 |
| Can yellow teeth become white again? | en | N | N | ok | 6 | 1.00 |
| What is the best treatment to whiten teeth? | en | N | G | **FP** | 0 | 0.50 |
| Can very yellow teeth become white again? | en | N | N | ok | 5 | 0.83 |
| Do dentists recommend teeth whitening? | en | G | G | ok | 0 | 0.50 |
| How bad does getting your teeth whitened hurt? | en | N | G | **FP** | 0 | 0.40 |
| Can 60 year old teeth be whitened? | en | N | G | **FP** | 0 | 0.50 |
| Can yellow teeth actually be whitened? | en | N | G | **FP** | 0 | 0.50 |
| Do dentists judge you for yellow teeth? | en | N | N | ok | 4 | 1.00 |
| What is the healthiest way to whiten teeth? | en | N | N | ok | 2 | 0.75 |
| Is there a downside to teeth whitening? | en | N | N | ok | 1 | 0.75 |
| How to get insanely white teeth? | en | N | N | ok | 2 | 0.75 |
| Is there a knight game available on PC? | en | N | G | **FP** | 0 | 0.25 |
| What is the story behind Knight Online? | en | N | N | ok | 1 | 0.75 |

FP = false positive (called a gap that is not) · FN = missed a real gap

### Where the metric was wrong

Reading these one by one tells you what to add to the synonym classes.

**What is the best treatment to whiten teeth?** — you said `N`

- `0.50` www.forbes.com — Best Teeth Whitening Kits 2026: 9 Dentist-Approved Picks
- `0.50` www.northeastdentalarts.com — Safest Ways to Whiten Your Teeth Without Damage
- `0.50` www.healthline.com — How to Naturally Whiten Your Teeth at Home
- `0.50` www.sandiegoartofdentistry.com — What is The Best Teeth Whitening Method

**How bad does getting your teeth whitened hurt?** — you said `N`

- `0.40` www.modernagedentistry.com — Does Professional Teeth Whitening Hurt?
- `0.40` narrewarrendentalcare.com.au — Does It Hurt to Whiten Teeth
- `0.40` www.grandviewdentistry.com — Is Teeth Whitening Painful? - Expert Advice from Edina ...
- `0.20` www.reddit.com — Teeth whitening pain is NOT talked about enough “mild ...

**Can 60 year old teeth be whitened?** — you said `N`

- `0.50` sunlakesdentistry.com — Can Senior Teeth be Whitened?
- `0.25` www.colgate.com — Anti-Aging: How To Whiten Aging Yellow Teeth
- `0.25` www.aarp.org — 6 Top Teeth Whitening Tips
- `0.25` www.templedentalwellness.com — Can Seniors Whiten Their Teeth?

**Can yellow teeth actually be whitened?** — you said `N`

- `0.50` www.estrellamountaindentistry.com — Can Yellow Teeth Go White Again? Dentists Reveal the Truth
- `0.50` www.reddit.com — My teeth are stained yellow from not brushing as a child. ...
- `0.50` stephencambredds.com — Can Yellow Teeth Become White Again In Slidell?
- `0.50` meadowsfamilydentistry.com — Can Yellow Teeth Become White Again?

**Is there a knight game available on PC?** — you said `N`

- `0.25` www.reddit.com — Games where you are a knight? : r/gamingsuggestions
- `0.25` store.steampowered.com — Knight's Path on Steam
- `0.25` www.g2a.com — 5 Must-Play Games Featuring Knights
- `0.25` www.youtube.com — Knight's Path - Gameplay & RPG Systems Breakdown

## Next

1. Read the "where the metric was wrong" list above.
2. If a miss is a synonym problem, add the word to the right language
   pack in `answergap/languages.py` and re-run this script (**no API cost** — the data is on disk).
3. If precision stays under 0.85, lexical matching is not enough and
   embedding-based similarity should be tried.
4. Once settled, write the rule into `CLAUDE.md` and set `tree.THRESHOLD`, then flip `threshold_validated` to true.

