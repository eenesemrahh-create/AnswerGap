"""What a customer sees when the search provider fails: a code, never its words.

2026-10-12: a paused DataForSEO account reached customers as the provider's own
sentence, naming our supplier and telling them to email its support about our
account.
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from answergap.dataforseo import AccountBlocked, DataForSEOError, TransientError
from api import auth, main


@pytest.fixture
def mails(monkeypatch):
    sent = []
    monkeypatch.setattr(main.mailer, "send", lambda **kw: sent.append(kw) or True)
    monkeypatch.setattr(auth, "ADMIN_EMAILS", {"op@example.com"})
    main._alerted.clear()
    yield sent
    main._alerted.clear()


def _fail(error):
    def action():
        raise error
    return action


def test_an_account_refusal_is_a_code_and_an_alert(mails) -> None:
    secret = "unusual activity ... support@dataforseo.com"
    with pytest.raises(HTTPException) as exc:
        main._run(_fail(AccountBlocked(secret, 40201)))
    assert exc.value.status_code == 503
    assert exc.value.detail == {"code": "searchUnavailable"}
    assert secret not in str(exc.value.detail)
    assert mails and mails[0]["to"] == "op@example.com"
    assert "40201" in mails[0]["subject"]


def test_the_operators_are_told_once_not_on_every_search(mails) -> None:
    for _ in range(5):
        with pytest.raises(HTTPException):
            main._run(_fail(AccountBlocked("paused", 40201)))
    assert len(mails) == 1


@pytest.mark.parametrize("error", [
    TransientError("HTTP 500 — /v3/... {\"status_code\":50000}"),
    DataForSEOError("task status_code=40501: Invalid Field"),
])
def test_any_other_provider_failure_is_a_plain_code(mails, error) -> None:
    with pytest.raises(HTTPException) as exc:
        main._run(_fail(error))
    assert exc.value.status_code == 502
    assert exc.value.detail == {"code": "searchFailed"}
    assert mails == []
