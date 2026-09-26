"""A parameter inside `jsonb_build_object` needs a type, and Postgres will not
guess one.

WHY THIS FILE EXISTS. `jsonb_build_object` takes `"any"` arguments, so a
placeholder that appears ONLY inside it has no column to take its type from and
Postgres refuses the whole statement with

    could not determine data type of parameter $3

This has now cost the project twice: once in `user_erase`, which carries a
comment about it, and once in `subscription_assign`, which did not follow the
comment. Both times the only thing that caught it was CI - the failure needs a
real Postgres, there is none on a developer machine, and `pyflakes` cannot see
inside a SQL string. Ten tests went red several minutes after a push.

So the rule is checked STATICALLY, against the source. No database, no fixture,
no skip: this runs on a laptop in milliseconds and fails before the push.

THE RULE IS NOT "ALWAYS CAST". `setting_put` passes `%(key)s` bare and is
correct, because the same parameter is also written to `app_setting.setting_key`
in the same statement and takes its type from there. So a parameter is fine if
EITHER it is cast, OR it appears somewhere else in the same statement. A bare
positional `%s` cannot be matched up that way and must always be cast.
"""

from __future__ import annotations

import re
from pathlib import Path

DB_SOURCE = Path(__file__).resolve().parent.parent / "answergap" / "db.py"

# Triple-quoted strings, which is how every SQL statement in db.py is written.
_SQL_LITERAL = re.compile(r'"""(.*?)"""', re.DOTALL)
_NAMED = re.compile(r"%\((\w+)\)s(\s*::\s*\w+)?")
_POSITIONAL = re.compile(r"%s(\s*::\s*\w+)?")


def _spans(sql: str, start: int) -> tuple[int, int] | None:
    """The `jsonb_build_object( ... )` beginning at `start`, paren-balanced.

    A regex cannot do this: the argument lists nest (`jsonb_build_object` inside
    `COALESCE`, casts with their own parentheses), and a non-greedy match to the
    first `)` would cut the span short and miss exactly the parameters at the
    end that are most likely to be wrong.
    """
    open_paren = sql.index("(", start)
    depth = 0
    for i in range(open_paren, len(sql)):
        if sql[i] == "(":
            depth += 1
        elif sql[i] == ")":
            depth -= 1
            if depth == 0:
                return open_paren, i + 1
    return None


def _offenders(sql: str) -> list[str]:
    """Parameters inside a `jsonb_build_object` that nothing can type."""
    found: list[str] = []
    for call in re.finditer(r"jsonb_build_object", sql):
        span = _spans(sql, call.start())
        if span is None:
            continue
        inner = sql[span[0] : span[1]]
        # Everything in the statement that is NOT this call. A parameter that
        # also appears out here is written to a real column and is typed by it.
        outside = sql[: span[0]] + sql[span[1] :]

        for match in _NAMED.finditer(inner):
            name, cast = match.group(1), match.group(2)
            if cast:
                continue
            if f"%({name})s" in outside:
                continue
            found.append(f"%({name})s")

        for match in _POSITIONAL.finditer(inner):
            # `%(name)s` also contains `%s`; skip those, they are handled above.
            if inner[max(0, match.start() - 1)] == ")":
                continue
            if match.group(1):
                continue
            found.append("%s (positional)")
    return found


def test_every_jsonb_parameter_can_be_typed() -> None:
    """The check itself. A failure names the statement, because "parameter $3"
    is what Postgres says and it is not enough to find the line."""
    source = DB_SOURCE.read_text(encoding="utf-8")
    problems: list[str] = []
    for literal in _SQL_LITERAL.finditer(source):
        sql = literal.group(1)
        if "jsonb_build_object" not in sql:
            continue
        offenders = _offenders(sql)
        if offenders:
            line = source[: literal.start()].count("\n") + 1
            problems.append(
                f"db.py line {line}: {', '.join(offenders)} "
                f"inside jsonb_build_object with no cast and no typed column"
            )
    assert not problems, (
        "Postgres cannot determine the type of these parameters and will "
        "refuse the statement at runtime:\n  " + "\n  ".join(problems)
    )


def test_the_check_would_have_caught_the_bug_it_was_written_for() -> None:
    """A guard that cannot fail is not a guard.

    This is `subscription_assign`'s audit INSERT as it was first written - the
    shape that took ten SQL tests red in CI on 2026-09-26.
    """
    broken = """
        INSERT INTO admin_action (actor, action, target_user, detail)
        VALUES (%(actor)s, 'assign_plan', %(uid)s,
                jsonb_build_object('plan_id', %(plan)s,
                                   'credits', %(credits)s))
    """
    assert _offenders(broken) == ["%(plan)s", "%(credits)s"]


def test_a_parameter_written_to_a_real_column_is_left_alone() -> None:
    """`setting_put`'s shape. `key` and `value` are typed by the columns they
    are inserted into, so requiring a cast here would be noise."""
    fine = """
        WITH s AS (
            INSERT INTO app_setting (setting_key, setting_value, set_by)
            VALUES (%(key)s, %(value)s, %(actor)s)
            RETURNING setting_key
        )
        INSERT INTO admin_action (actor, action, detail)
        SELECT %(actor)s, 'set_setting',
               jsonb_build_object('key', %(key)s, 'value', %(value)s)
    """
    assert _offenders(fine) == []


def test_a_cast_parameter_is_accepted() -> None:
    assert _offenders("jsonb_build_object('a', %(a)s::text, 'b', %(b)s::int)") == []


def test_a_bare_positional_parameter_is_always_an_offender() -> None:
    """It cannot be matched to an appearance elsewhere by name, so there is no
    way to prove it is typed."""
    assert _offenders("jsonb_build_object('id', %s)") == ["%s (positional)"]
    assert _offenders("jsonb_build_object('id', %s::bigint)") == []


def test_a_nested_call_does_not_cut_the_span_short() -> None:
    """The reason the span is paren-balanced rather than a regex: a lazy match
    to the first `)` would stop inside the cast and miss what follows."""
    sql = "jsonb_build_object('a', COALESCE(%(a)s::text, ''), 'b', %(b)s)"
    assert _offenders(sql) == ["%(b)s"]
