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
