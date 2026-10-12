"""Which DataForSEO failures are retried, and which are final."""

import pytest

from answergap.dataforseo import Client, DataForSEOError, TransientError

PATH = "/v3/serp/google/organic/live/advanced"


def test_a_top_level_server_error_is_retried() -> None:
    # Seen on 2026-10-08: the whole response was `50000 Internal Server
    # Error`, and the search failed without the retry a task-level one gets.
    with pytest.raises(TransientError):
        Client._check_status(
            {"status_code": 50000, "status_message": "Internal Server Error."}, PATH
        )


def test_a_task_level_server_error_is_retried() -> None:
    with pytest.raises(TransientError):
        Client._check_status(
            {"status_code": 20000, "tasks": [{"status_code": 40101}]}, PATH
        )


def test_an_auth_failure_is_final() -> None:
    with pytest.raises(DataForSEOError) as err:
        Client._check_status({"status_code": 40100, "status_message": "x"}, PATH)
    assert not isinstance(err.value, TransientError)


# ------------------------------------------- account refusals and the breaker
#
# 2026-10-12: a `40201 unusual activity` pause reached customers as
# DataForSEO's own sentence, and a `HTTP 500 / 50000` failed a search with no
# retry because only a 200's status codes were ever read.

import io  # noqa: E402
import json  # noqa: E402
import urllib.error  # noqa: E402

from answergap import dataforseo  # noqa: E402
from answergap.dataforseo import AccountBlocked  # noqa: E402


@pytest.fixture(autouse=True)
def _no_pause():
    dataforseo.clear_pause()
    yield
    dataforseo.clear_pause()


def _client(tmp_path) -> Client:
    return Client("login", "password", tmp_path)


def _http_error(status: int, body: dict):
    def raise_it(request, timeout=None):
        raise urllib.error.HTTPError(
            request.full_url, status, "error", {}, io.BytesIO(json.dumps(body).encode())
        )
    return raise_it


def test_a_paused_account_is_an_account_refusal() -> None:
    with pytest.raises(AccountBlocked) as err:
        Client._check_status(
            {"status_code": 20000, "tasks": [{"status_code": 40201,
                                              "status_message": "unusual activity"}]},
            PATH,
        )
    assert err.value.code == 40201


def test_an_http_500_carrying_50000_is_retried(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(dataforseo.urllib.request, "urlopen",
                        _http_error(500, {"status_code": 50000}))
    with pytest.raises(TransientError):
        _client(tmp_path)._http("POST", PATH, [{}])


def test_an_http_refusal_naming_the_account_is_an_account_refusal(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(dataforseo.urllib.request, "urlopen",
                        _http_error(403, {"status_code": 40201}))
    with pytest.raises(AccountBlocked):
        _client(tmp_path)._http("POST", PATH, [{}])


def test_once_refused_nothing_more_is_sent_for_a_while(monkeypatch, tmp_path) -> None:
    """Hammering a paused account is the "unusual activity" it is paused for."""
    calls = []

    def refuse(request, timeout=None):
        calls.append(request.full_url)
        raise urllib.error.HTTPError(request.full_url, 403, "x", {},
                                     io.BytesIO(b'{"status_code": 40201}'))

    monkeypatch.setattr(dataforseo.urllib.request, "urlopen", refuse)
    client = _client(tmp_path)
    for _ in range(3):
        with pytest.raises(AccountBlocked):
            client._http("POST", PATH, [{}])
    assert len(calls) == 1
    assert dataforseo.provider_pause()["code"] == 40201

    dataforseo.clear_pause()
    with pytest.raises(AccountBlocked):
        client._http("POST", PATH, [{}])
    assert len(calls) == 2
