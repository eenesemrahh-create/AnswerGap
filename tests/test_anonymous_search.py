"""Signed-out searching (operator, 2026-10-19).

- Off unless an admin sets searches per visitor above 0 AND Turnstile is
  configured.
- A signed-out search must pass Turnstile, then the per-visitor limit
  (browser id OR address, whichever is higher), then the daily total across
  every signed-out visitor - the ceiling that holds however many browsers
  somebody goes through.
- Only `search`; everything that analyses stays behind an account.
- The visitor gets a PREVIEW, cut on the server: the seed and the top-level
  questions; the rest never leaves, only how many there are.
- Signing in afterwards claims the search (`/api/account/claim-anon`).

SQL for the counters and the claim is in tests/test_sql.py (CI only).
"""

from __future__ import annotations

import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from answergap import db, gate
from answergap.gate import Identity, State
from api import auth, main, turnstile


def _anon() -> Identity:
    return Identity(anon_id="browser-1", ip_hash="ip-1")


def _on(**kw) -> State:
    base = dict(accounts_enabled=True, anon_per_visitor=1, anon_daily_total=50)
    base.update(kw)
    return State(**base)


# ------------------------------------------------------------------- the gate


def test_off_by_default_says_sign_in() -> None:
    decision = gate.decide(_anon(), State(True), action="search", units=1)
    assert (decision.http_status, decision.code) == (401, "signedOut")


def test_one_search_is_allowed_when_on() -> None:
    assert gate.decide(_anon(), _on(), action="search", units=1).allowed


def test_the_higher_of_browser_and_address_counts() -> None:
    for used in ({"anon_used_browser": 1}, {"anon_used_ip": 1}):
        decision = gate.decide(_anon(), _on(**used), action="search", units=1)
        assert (decision.http_status, decision.code) == (429, "anonLimit")
        assert decision.outcome == gate.REFUSED_ANON_LIMIT


def test_the_daily_total_holds_whatever_the_visitor_counters_say() -> None:
    """A new browser on a new address has counters of 0 - and still meets the
    ceiling."""
    decision = gate.decide(_anon(), _on(anon_used_total=50), action="search", units=1)
    assert (decision.http_status, decision.code) == (429, "anonDailyFull")
    assert decision.outcome == gate.REFUSED_ANON_DAILY_FULL
    assert decision.info is None, "nothing about the total is personal"


def test_only_search_is_open_to_a_signed_out_visitor() -> None:
    for action in ("score", "batch", "round1", "deep", "check"):
        decision = gate.decide(_anon(), _on(), action=action, units=1)
        assert (decision.http_status, decision.code) == (401, "signedOut"), action


def test_the_new_setting_key_is_not_the_retired_one() -> None:
    """A database from before 2026-09-23 may still hold the retired key set
    to 1; reusing it would switch the feature on by itself."""
    assert gate.SETTING_ANON_PER_VISITOR != "anonymous_daily_searches"


# ------------------------------------------------------------- the state read


@pytest.fixture
def counters(monkeypatch):
    found = {"per_visitor": "2", "daily_total": "40", "by_browser": 1, "by_ip": 0, "total": 7}
    monkeypatch.setattr(db, "anon_counters", lambda **kw: found)
    monkeypatch.setattr(turnstile, "configured", lambda: True)
    return found


def test_the_state_carries_settings_and_counters(counters) -> None:
    state = auth.anon_state(_anon())
    assert (state.anon_per_visitor, state.anon_daily_total) == (2, 40)
    assert (state.anon_used_browser, state.anon_used_ip, state.anon_used_total) == (1, 0, 7)


def test_without_turnstile_it_stays_off(counters, monkeypatch) -> None:
    monkeypatch.setattr(turnstile, "configured", lambda: False)
    assert auth.anon_state(_anon()).anon_per_visitor == 0


def test_settings_are_clamped(counters) -> None:
    counters.update(per_visitor="999", daily_total="-5")
    state = auth.anon_state(_anon())
    assert state.anon_per_visitor == gate.ANON_PER_VISITOR_MAX
    assert state.anon_daily_total == 0


# ---------------------------------------------------------------- turnstile


class _Resp:
    def __init__(self, body):
        self.body = body

    def read(self):
        return json.dumps(self.body).encode()

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


@pytest.fixture
def cloudflare(monkeypatch):
    sent = []
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "sec")
    monkeypatch.setenv("TURNSTILE_SITE_KEY", "site")

    def urlopen(request, timeout):
        sent.append(request)
        return _Resp(sent and getattr(urlopen, "answer", {"success": True}))

    monkeypatch.setattr(turnstile.urllib.request, "urlopen", urlopen)
    return SimpleNamespace(sent=sent, urlopen=urlopen)


def test_a_good_token_passes_and_carries_our_user_agent(cloudflare) -> None:
    assert turnstile.verify("tok", remote_ip="1.2.3.4")
    request = cloudflare.sent[0]
    assert request.get_header("User-agent") == "answergap/1.0"
    assert b"response=tok" in request.data and b"secret=sec" in request.data


def test_a_refused_or_reused_token_fails(cloudflare) -> None:
    cloudflare.urlopen.answer = {"success": False, "error-codes": ["timeout-or-duplicate"]}
    assert not turnstile.verify("tok")


def test_no_token_or_no_secret_fails_without_asking(cloudflare, monkeypatch) -> None:
    assert not turnstile.verify("")
    assert not turnstile.verify("x" * (turnstile.MAX_TOKEN + 1))
    monkeypatch.delenv("TURNSTILE_SECRET_KEY")
    assert not turnstile.verify("tok")
    assert cloudflare.sent == []


def test_cloudflare_unreachable_is_a_refusal(cloudflare, monkeypatch) -> None:
    def down(request, timeout):
        raise OSError("no route")
    monkeypatch.setattr(turnstile.urllib.request, "urlopen", down)
    assert not turnstile.verify("tok")


# ------------------------------------------------------------------ preview


def _tree() -> dict:
    nodes = [{"id": "seed", "slug": "seed", "question": "teeth whitening", "depth": 0,
              "results": [{"title": "x"}]}]
    nodes += [{"id": f"a{i}", "slug": f"a{i}", "question": f"top {i}", "depth": 1}
              for i in range(4)]
    nodes += [{"id": f"b{i}", "slug": f"b{i}", "question": f"SECRET deep {i}", "depth": 2 + i % 3}
              for i in range(11)]
    return {"slug": "t", "source": "live", "nodes": nodes, "question_count": 15,
            "related_searches": [f"r{i}" for i in range(8)]}


def test_the_preview_cuts_on_the_server() -> None:
    full = _tree()
    out = main._preview(full)
    assert out["preview"] is True
    assert [n["depth"] for n in out["nodes"]] == [0, 1, 1, 1, 1]
    assert out["hidden_questions"] == 11 and out["question_count"] == 15
    assert "SECRET" not in json.dumps(out), "a hidden question's text must never leave"
    assert out["related_searches"] == ["r0", "r1", "r2"] and out["hidden_related"] == 5
    assert len(full["nodes"]) == 16, "the cached tree is not ours to cut"


def test_a_signed_out_reader_gets_the_preview_on_every_read_path(monkeypatch) -> None:
    monkeypatch.setattr(main, "_lookup", lambda slug, who: _tree())
    monkeypatch.setattr(db, "available", lambda: True)
    monkeypatch.setattr(db, "can_access", lambda slug, **kw: True)
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    assert main._authorize_tree("t", _anon())["preview"] is True
    signed_in = Identity(user_id=7, anon_id="browser-1")
    assert "preview" not in main._authorize_tree("t", signed_in)


# ------------------------------------------------------------- the endpoint


@pytest.fixture
def endpoint(monkeypatch):
    state = {"records": [], "refused": [], "token_ok": True, "per_visitor": 1, "crawls": 0}
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(auth, "identity", lambda request: _anon())
    monkeypatch.setattr(db, "available", lambda: True)
    monkeypatch.setattr(auth, "anon_state",
                        lambda who: _on(anon_per_visitor=state["per_visitor"]))
    monkeypatch.setattr(turnstile, "verify", lambda token, remote_ip=None: state["token_ok"])
    monkeypatch.setattr(db, "record_usage", lambda **kw: state["records"].append(kw))

    def crawl(seed, location_code, language_code, **kw):
        state["crawls"] += 1
        return {**_tree(), "billable_calls": 1, "estimated_spend": 0.0026}

    monkeypatch.setattr(main.live, "crawl", crawl)
    return state


def _search() -> dict:
    request = SimpleNamespace(headers={"x-ag-turnstile": "tok", "x-forwarded-for": "1.2.3.4"})
    return main.search(main.SearchRequest(seed="teeth whitening"), request)


def test_a_signed_out_search_returns_a_preview_and_is_recorded(endpoint) -> None:
    out = _search()
    assert out["preview"] is True and "SECRET" not in json.dumps(out)
    allowed = [r for r in endpoint["records"] if r["outcome"] == "allowed"]
    assert allowed and allowed[0]["user_id"] is None and allowed[0]["anon_id"] == "browser-1"


def test_a_failed_challenge_spends_nothing(endpoint) -> None:
    endpoint["token_ok"] = False
    with pytest.raises(HTTPException) as e:
        _search()
    assert (e.value.status_code, e.value.detail["code"]) == (403, "captchaFailed")
    assert endpoint["crawls"] == 0
    assert endpoint["records"][-1]["outcome"] == "refused_captcha"


def test_switched_off_says_sign_in_without_asking_cloudflare(endpoint, monkeypatch) -> None:
    endpoint["per_visitor"] = 0
    monkeypatch.setattr(turnstile, "verify", lambda *a, **k: pytest.fail("must not verify"))
    with pytest.raises(HTTPException) as e:
        _search()
    assert e.value.detail["code"] == "signedOut" and endpoint["crawls"] == 0


def test_the_landing_learns_what_is_left(endpoint, monkeypatch) -> None:
    monkeypatch.setattr(auth, "anon_state",
                        lambda who: _on(anon_per_visitor=2, anon_used_ip=1))
    assert main.anon_search(SimpleNamespace(headers={})) == {
        "enabled": True, "remaining": 1, "daily_full": False}
    monkeypatch.setattr(auth, "anon_state", lambda who: _on(anon_used_total=50))
    assert main.anon_search(SimpleNamespace(headers={}))["remaining"] == 0


# ---------------------------------------------------------------- the claim


def test_signing_in_claims_this_browsers_searches(monkeypatch) -> None:
    calls = []
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(auth, "identity",
                        lambda request: Identity(user_id=7, anon_id="browser-1"))
    monkeypatch.setattr(db, "claim_anon_work", lambda **kw: calls.append(kw) or 1)
    assert auth.claim_anon(SimpleNamespace()) == {"claimed": 1}
    assert calls == [{"user_id": 7, "anon_id": "browser-1"}]


def test_a_signed_out_claim_is_refused(monkeypatch) -> None:
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(auth, "identity", lambda request: _anon())
    with pytest.raises(HTTPException) as e:
        auth.claim_anon(SimpleNamespace())
    assert e.value.status_code == 401
