"""Minimal DataForSEO client.

WHY THE LIVE ENDPOINT
---------------------
CLAUDE.md mandates the Standard queue (async + webhook) for production, and that
is the right call: Standard costs $0.0006/request, Live is ~3.3x more. But the
validation scripts issue fewer than twenty requests in total, where the whole
difference is under two cents. Standing up a webhook receiver and queue polling
to save that would delay the answer by days for no benefit.

Product code should use the Standard queue. This module is what the validation
scripts and the prototype's archive loader share.

No third-party dependencies — stdlib `urllib.request` is sufficient.
"""

from __future__ import annotations

import base64
import json
import re
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

from . import db

BASE_URL = "https://api.dataforseo.com"

# CLAUDE.md: Standard is $0.60/1000 = $0.0006/request. Live is ~3.3x.
STANDARD_COST_PER_REQUEST = 0.0006
LIVE_COST_PER_REQUEST = STANDARD_COST_PER_REQUEST * 3.3

# DataForSEO's ceiling: more than this in one task_post is error 40006.
TASKS_PER_POST = 100

# Live Advanced responses can take 30-60 seconds.
TIMEOUT_SECONDS = 180


class DataForSEOError(RuntimeError):
    """The API returned a meaningful failure (auth, quota, bad parameter)."""


class TransientError(DataForSEOError):
    """Temporary server-side failure — safe to retry.

    Observed for real during Phase 0.5: one request in a sixteen-request run came
    back `40101 Internal SE Server Error` and killed the whole run. This will
    happen in production too, and a crawler that dies on it leaves the user
    staring at half a tree. Node-level fault tolerance is a requirement, not a
    nicety.
    """


RETRYABLE_TASK_CODES = {40101, 40102, 40103, 50000, 50100, 50200}


class BudgetExceeded(RuntimeError):
    """Hit the configured request ceiling. Guards against burning credit."""


def load_dotenv(path: Path) -> dict[str, str]:
    """Tiny .env reader. KEY=VALUE, # comments, quotes stripped."""
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


# Characters Unicode decomposition cannot reach.
_SLUG_FOLD = {"ı": "i", "İ": "i", "ß": "ss", "œ": "oe", "æ": "ae", "ø": "o", "đ": "d"}


def slugify(text: str, max_length: int = 60) -> str:
    """Build a filesystem- and URL-safe key from arbitrary text.

    Language-agnostic: accents are stripped via Unicode decomposition, and the
    handful of characters that do not decompose are mapped explicitly.
    """
    text = text.lower()
    for src, dst in _SLUG_FOLD.items():
        text = text.replace(src, dst)
    text = "".join(
        c
        for c in unicodedata.normalize("NFD", text)
        if not unicodedata.combining(c)
    )
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:max_length] or "query"


class Client:
    def __init__(
        self,
        login: str,
        password: str,
        cache_dir: Path,
        *,
        max_requests: int = 20,
        dry_run: bool = False,
    ) -> None:
        self.login = login
        self.password = password
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.max_requests = max_requests
        self.dry_run = dry_run

        self.billable_calls = 0
        self.cache_hits = 0
        self.planned: list[str] = []

    # ---------------------------------------------------------- internals

    def _auth_header(self) -> str:
        raw = f"{self.login}:{self.password}".encode("utf-8")
        return "Basic " + base64.b64encode(raw).decode("ascii")

    def _http(self, method: str, path: str, payload: object | None) -> dict:
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = urllib.request.Request(
            BASE_URL + path,
            data=body,
            method=method,
            headers={
                "Authorization": self._auth_header(),
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
                raw = response.read()
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:800]
            raise DataForSEOError(f"HTTP {e.code} — {path}\n{detail}") from e
        except urllib.error.URLError as e:
            raise DataForSEOError(f"Network error — {path}: {e.reason}") from e

        # urllib does not transparently gunzip.
        if raw[:2] == b"\x1f\x8b":
            import gzip

            raw = gzip.decompress(raw)

        data = json.loads(raw.decode("utf-8"))
        self._check_status(data, path)
        return data

    @staticmethod
    def _check_status(data: dict, path: str) -> None:
        """Anything other than 20000 is an error and is never swallowed."""
        top = data.get("status_code")
        if top != 20000:
            message = data.get("status_message", "?")
            hint = ""
            if top == 40100:
                hint = (
                    "\n  -> Authentication failed. Check DATAFORSEO_LOGIN and "
                    "DATAFORSEO_PASSWORD in .env.\n"
                    "  -> The password is the API password, not your account "
                    "password (app.dataforseo.com/api-access)."
                )
            elif top in (40200, 40202):
                hint = "\n  -> Insufficient balance. Add credit to the account."
            raise DataForSEOError(f"{path} -> status_code={top}: {message}{hint}")

        for task in data.get("tasks") or []:
            code = task.get("status_code")
            # 20000 = Ok. 20100 = "Task Created" (normal on the Standard queue).
            if code in (20000, 20100):
                continue
            message = f"{path} -> task status_code={code}: {task.get('status_message', '?')}"
            if code in RETRYABLE_TASK_CODES:
                raise TransientError(message)
            raise DataForSEOError(message)

    def _cached(self, key: str) -> dict | None:
        """A hit costs $0 whatever the stored response once cost.

        Postgres first when it is configured: on a container the filesystem is
        ephemeral, so a disk-only cache would re-buy every response after each
        redeploy. The cache key is identical in both, so a laptop and a
        deployment address the same responses by the same name.
        """
        if db.available():
            try:
                found = db.snapshot_get(key)
            except Exception:  # noqa: BLE001 - a cache is never load-bearing
                found = None
            if found is not None:
                self.cache_hits += 1
                return found
            return None
        path = self.cache_dir / f"{key}.json"
        if path.exists():
            self.cache_hits += 1
            return json.loads(path.read_text(encoding="utf-8"))
        return None

    def _store(self, key: str, data: dict) -> None:
        if db.available():
            db.snapshot_put(key, data)
            return
        (self.cache_dir / f"{key}.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # ------------------------------------------------------------- public

    def locations(self, country_iso: str | None = None) -> dict | None:
        """Google locations. FREE — does not touch the balance.

        Without `country_iso` this returns every location Google targets,
        cities included, which is tens of megabytes. Callers that only need
        countries should fetch once and filter.
        """
        path = (
            f"/v3/serp/google/locations/{country_iso}"
            if country_iso
            else "/v3/serp/google/locations"
        )
        key = f"locations-{country_iso or 'all'}"
        cached = self._cached(key)
        if cached is not None:
            return cached
        if self.dry_run:
            self.planned.append(f"GET {path}  (free)")
            return None
        data = self._http("GET", path, None)
        self._store(key, data)
        return data

    def serp(
        self,
        keyword: str,
        location_code: int,
        language_code: str,
        *,
        cache_key: str | None = None,
        depth: int = 10,
        extra_params: dict | None = None,
    ) -> dict | None:
        """Google organic SERP, advanced (includes People Also Ask). BILLABLE.

        CLAUDE.md rules enforced here:
          - advanced, because `regular` returns no PAA
          - depth=10 fixed; PAA sits at the top of page one, and asking deeper
            multiplies cost tenfold for nothing
          - location_code, never location_name (a spelling change breaks it)
        """
        key = cache_key or f"serp-{location_code}-{language_code}-{slugify(keyword)}"
        cached = self._cached(key)
        if cached is not None:
            return cached

        label = f'POST live/advanced  "{keyword}"  loc={location_code} lang={language_code}'
        if self.dry_run:
            self.planned.append(label)
            return None

        if self.billable_calls >= self.max_requests:
            raise BudgetExceeded(
                f"Reached --max-requests={self.max_requests}. "
                f"Not continuing without an explicit raise."
            )

        task: dict = {
            "keyword": keyword,
            "location_code": location_code,
            "language_code": language_code,
            "device": "desktop",
            "os": "windows",
            "depth": depth,
        }
        # Paid extras (people_also_ask_click_depth, load_async_ai_overview).
        # DataForSEO refunds the surcharge when the element is absent.
        if extra_params:
            task.update(extra_params)

        data = None
        for attempt in range(3):
            try:
                data = self._http(
                    "POST", "/v3/serp/google/organic/live/advanced", [task]
                )
                break
            except TransientError as e:
                if attempt == 2:
                    raise
                wait = 3 * (attempt + 1)
                print(
                    f"      transient error, retrying in {wait}s "
                    f"({attempt + 1}/2): {e}",
                    flush=True,
                )
                time.sleep(wait)

        self.billable_calls += 1
        self._store(key, data)
        time.sleep(1.0)  # be polite between requests
        return data

    # ------------------------------------------------- standard queue
    #
    # CLAUDE.md mandates the Standard queue for product code and records why it
    # was not used: "Standard means post, poll tasks_ready, fetch - minutes, and
    # a webhook CANNOT REACH A LAPTOP." That was true of a laptop. It is not
    # true of a deployed service, so the deviation closes here.
    #
    # The split that remains is deliberate rather than a compromise. The seed
    # search stays on Live because a person is sitting in front of it waiting,
    # and minutes of latency to save a tenth of a cent is the wrong trade -
    # exactly CLAUDE.md's own reasoning. Batch scoring goes Standard because
    # nobody watches a batch, and ten questions is where the 3.3x starts to be
    # real money.

    def serp_task_post(
        self,
        items: list[dict],
        *,
        postback_url: str | None = None,
    ) -> list[dict]:
        """Queue SERP tasks on the Standard queue. BILLABLE at POST time.

        `items` carry a `cache_key`, which rides along as the task's `tag` so a
        postback identifies itself without a second lookup. DataForSEO accepts
        at most 100 tasks per call; more than that is error 40006, so the caller
        must chunk rather than discover it in production.

        Returns one row per item with the assigned `task_id`, or the failure if
        that single task was rejected - one bad keyword must not sink the batch.
        """
        if len(items) > TASKS_PER_POST:
            raise ValueError(
                f"{len(items)} tasks in one post; DataForSEO allows "
                f"{TASKS_PER_POST}. Chunk before calling."
            )

        payload = []
        for item in items:
            task = {
                "keyword": item["keyword"],
                "location_code": item["location_code"],
                "language_code": item["language_code"],
                "device": "desktop",
                "os": "windows",
                "depth": item.get("depth", 10),
                "tag": item["cache_key"][:255],
                "priority": 1,  # normal. Priority 2 is 2x for speed we do not need.
            }
            if postback_url:
                task["postback_url"] = postback_url
                task["postback_data"] = "advanced"
            payload.append(task)

        if self.dry_run:
            for item in items:
                self.planned.append(
                    f'POST task_post  "{item["keyword"]}"  '
                    f'loc={item["location_code"]} lang={item["language_code"]}'
                )
            return []

        data = self._http("POST", "/v3/serp/google/organic/task_post", payload)

        out: list[dict] = []
        for item, task in zip(items, data.get("tasks") or []):
            ok = task.get("status_code") == 20100  # "Task Created."
            if ok:
                self.billable_calls += 1
            out.append(
                {
                    "cache_key": item["cache_key"],
                    "keyword": item["keyword"],
                    "task_id": task.get("id") if ok else None,
                    "status_code": task.get("status_code"),
                    "status_message": task.get("status_message"),
                    # CLAUDE.md: read the cost from the response, never estimate.
                    "cost": task.get("cost"),
                }
            )
        return out

    def serp_task_get(self, task_id: str) -> dict:
        """Fetch a completed task. FREE - the charge happened at post time.

        Results stay retrievable for 30 days, which is what makes the postback
        safe to lose: a missed callback is a re-fetch, not a re-purchase.
        """
        return self._http(
            "GET", f"/v3/serp/google/organic/task_get/advanced/{task_id}", None
        )

    def serp_tasks_ready(self) -> dict:
        """Which posted tasks have finished. FREE.

        The fallback for a postback that never arrived - a deploy mid-flight, a
        transient 500 on our side. Without it a lost callback would strand a
        task that has already been paid for.
        """
        return self._http("GET", "/v3/serp/google/organic/tasks_ready", None)

    @property
    def estimated_spend(self) -> float:
        return self.billable_calls * LIVE_COST_PER_REQUEST


# --------------------------------------------------------------- parsing


def walk(node: object):
    """Yield every dict in a response tree.

    PAA elements live under `items[] -> type=people_also_ask -> items[]`, but
    DataForSEO has moved things before. Recursive walking is more durable than
    hardcoding a path.
    """
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from walk(value)
    elif isinstance(node, list):
        for value in node:
            yield from walk(value)


def extract_paa(response: dict) -> list[dict]:
    """People Also Ask elements, in the order they appear."""
    if not response:
        return []
    found: list[dict] = []
    seen: set[int] = set()
    for node in walk(response.get("tasks")):
        if node.get("type") == "people_also_ask_element" and id(node) not in seen:
            seen.add(id(node))
            found.append(node)
    return found


def paa_source(element: dict) -> dict:
    """Source page behind a PAA answer, if DataForSEO could resolve one.

    Phase 0 result: for Turkish it never can. All 32 elements came back as
    `people_also_ask_ai_overview_expanded_element` with `references: null` and
    `asynchronous_ai_overview: true` — Google now answers PAA with an AI
    Overview that DataForSEO cannot expand. Both paid parameters were tried.
    That is why gap scoring reads the question's own organic results instead.

    Kept because the shape may differ by market, and because the emptiness of
    this field is itself a measurement worth repeating per language.
    """
    expanded = element.get("expanded_element") or []
    first = expanded[0] if expanded and isinstance(expanded[0], dict) else {}
    return {
        "url": first.get("url") or "",
        "domain": first.get("domain") or "",
        "title": first.get("title") or "",
        "featured_title": first.get("featured_title") or "",
        "description": first.get("description") or "",
        "expanded_count": len(expanded),
    }
