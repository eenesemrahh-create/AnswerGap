"""A server error the browser can actually read.

THE BUG THIS PINS, in production on 2026-09-24. A signed-in search failed and
the page said "Could not reach the API. Is the backend running?" - so the
operator, and then a whole debugging session, went looking at DNS, at CORS and
at the health of a service that was up the entire time and answering in under
half a second.

Nothing was unreachable. Something inside the request raised, and Starlette
answers an unhandled exception from `ServerErrorMiddleware`, which sits
OUTSIDE every middleware an app adds - CORS included. The 500 came back with
no `Access-Control-Allow-Origin`, the browser refused to let the page read it,
`fetch` rejected, and `lib/api.ts` reported the only thing left to report.

So every server-side bug in this product wore the costume of an outage. These
tests are about the costume; `_run` and the DataForSEO client are about the
bugs underneath it.
"""

from __future__ import annotations

import asyncio
import urllib.error

import pytest

from answergap.dataforseo import Client, DataForSEOError
from api import main


# ------------------------------------------------- the 500 stays readable


def _run_middleware(boom: Exception):
    """Call the middleware directly with a `call_next` that raises."""

    async def call_next(_request):
        raise boom

    request = type("R", (), {"method": "POST", "url": type("U", (), {"path": "/api/search"})()})()
    return asyncio.run(main.unhandled_to_json(request, call_next))


def test_an_unhandled_error_becomes_a_json_500() -> None:
    response = _run_middleware(RuntimeError("something broke"))
    assert response.status_code == 500
    assert b'"serverError"' in response.body


def test_the_body_does_not_leak_what_broke() -> None:
    """A stack trace belongs in the log, not in a stranger's browser."""
    response = _run_middleware(RuntimeError("DATABASE_URL=postgres://u:pw@host/db"))
    assert b"postgres" not in response.body
    assert b"pw" not in response.body


def test_nothing_escapes_it() -> None:
    """Including the exception types that are easy to forget: a bare
    TimeoutError from a socket, and a KeyError from a response shape nobody
    expected."""
    for boom in (TimeoutError("read timed out"), KeyError("items"), ValueError("x")):
        assert _run_middleware(boom).status_code == 500


def test_cors_is_outside_this_middleware() -> None:
    """THE ORDER IS THE WHOLE POINT, and it is invisible at the call site.

    `add_middleware` inserts at the FRONT, so the last one added is the
    outermost. CORS must be outside this handler, or the 500 it returns goes
    back undecorated and we are exactly where we started - a readable error the
    browser refuses to read.
    """
    names = [m.cls.__name__ for m in main.app.user_middleware]
    assert "CORSMiddleware" in names, names
    cors = names.index("CORSMiddleware")
    # BaseHTTPMiddleware is what `app.middleware("http")` registers.
    ours = names.index("BaseHTTPMiddleware")
    assert cors < ours, (
        "CORSMiddleware must be added AFTER the catch-all so it wraps it; "
        f"stack outside-in is {names}"
    )


# ------------------------------------- the error that was escaping in the first place


class _Boom:
    def __init__(self, exc):
        self.exc = exc

    def __call__(self, *args, **kwargs):
        raise self.exc


def _client_raising(exc, monkeypatch, tmp_path) -> Client:
    client = Client(login="u", password="p", cache_dir=tmp_path)
    monkeypatch.setattr("urllib.request.urlopen", _Boom(exc))
    return client


def test_a_read_timeout_is_a_dataforseo_error_not_a_crash(monkeypatch, tmp_path) -> None:
    """The specific escape. urllib wraps a failure to CONNECT in `URLError`,
    but once the socket is open a slow response raises `socket.timeout` -
    `TimeoutError` in Python 3 - straight out of `urlopen`.

    A Live Advanced request routinely runs for a minute, so it is exactly the
    call that reaches TIMEOUT_SECONDS. Uncaught it was an unhandled 500; caught
    it is a 502 with a reason, which `_run` already knows how to translate.
    """
    client = _client_raising(TimeoutError("timed out"), monkeypatch, tmp_path)
    with pytest.raises(DataForSEOError) as raised:
        client._http("POST", "/v3/anything", {})
    assert "Network error" in str(raised.value)


def test_a_connection_error_is_still_a_dataforseo_error(monkeypatch, tmp_path) -> None:
    client = _client_raising(urllib.error.URLError("no route"), monkeypatch, tmp_path)
    with pytest.raises(DataForSEOError):
        client._http("POST", "/v3/anything", {})


def test_an_os_error_is_too(monkeypatch, tmp_path) -> None:
    """A dropped connection mid-read is an OSError, and the provider being
    rude is not our 500 either."""
    client = _client_raising(ConnectionResetError("peer reset"), monkeypatch, tmp_path)
    with pytest.raises(DataForSEOError):
        client._http("POST", "/v3/anything", {})


def test_the_search_endpoint_translates_it_to_502(monkeypatch) -> None:
    """End of the chain: `_run` turns it into an honest upstream code, which
    the browser CAN read because it leaves through the normal response path."""
    from fastapi import HTTPException

    def boom():
        raise DataForSEOError("Network error — /v3/serp: timed out")

    with pytest.raises(HTTPException) as raised:
        main._run(boom)
    assert raised.value.status_code == 502
