"""Transactional email: transport plus the two templates we send. Stdlib only.

WHY AN HTTP API AND NOT SMTP. Raw SMTP out of a container host is the wrong
default twice over. Outbound mail ports are commonly blocked or throttled by
the platform, and mail from a shared cloud IP with no SPF/DKIM alignment lands
in spam. For a VERIFICATION email that failure mode is the worst one available:
the signup does not error, it silently never completes, and the user blames the
product rather than their junk folder. A provider API is one HTTPS POST -
reachable wherever `urllib` is, signed by a domain the provider authenticates -
so the delivery question is answered by configuration instead of by luck.

THE SEAM IS THE SAME ONE USED EVERYWHERE HERE. `available()` mirrors
`db.available()` and `embeddings.available()`: no key configured means the
console backend, which prints the message (link included) to the server log and
reports success. That is what keeps a laptop with no mail provider a working
development environment - the same reasoning that keeps the filesystem backend
alive without `DATABASE_URL`.

WHAT THIS MODULE MUST NEVER DO IS RAISE INTO A SIGNUP. `send()` returns a bool.
An account whose creation was rolled back because a third party had an outage
is a worse outcome than an account that needs the "resend" button, and the
resend button has to exist anyway - mail goes missing for a dozen reasons none
of which are ours.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

# --------------------------------------------------------------- configuration

RESEND_ENDPOINT = "https://api.resend.com/emails"

# Sent on every request. See the header block in `send()` for why it is not
# optional.
USER_AGENT = "answergap/1.0"

# Short. This runs inside a request that a person is waiting on, and a provider
# that has stopped answering must degrade to "we could not send it, press
# resend" rather than to a timed-out signup.
TIMEOUT_SECONDS = 10


def api_key() -> str:
    return os.environ.get("RESEND_API_KEY", "").strip()


def sender() -> str:
    """The From address. Must be on a domain verified with the provider.

    An unverified domain is accepted by the API and then quietly fails to
    deliver, which is why this is a required setting rather than a default -
    a default here would be a silently broken product.
    """
    return os.environ.get("MAIL_FROM", "").strip()


def reply_to() -> str:
    return os.environ.get("MAIL_REPLY_TO", "").strip()


def available() -> bool:
    """True when real mail can actually be sent.

    Both halves are required. A key with no verified From address sends
    nothing, and an address with no key has nothing to send it with.
    """
    return bool(api_key() and sender())


def backend() -> str:
    """Which path `send` will take. Reported by /api/meta for diagnosis."""
    return "resend" if available() else "console"


# ------------------------------------------------------------------- transport


def send(*, to: str, subject: str, text: str, html: str) -> bool:
    """Send one message. Never raises; returns whether it went out.

    Both a text and an HTML part are always supplied. A single-part HTML mail
    scores worse with spam filters and is unreadable in a client set to plain
    text; the text part also carries the raw URL, which is the fallback when a
    button does not render.
    """
    if not available():
        return _console(to=to, subject=subject, text=text)

    payload = {
        "from": sender(),
        "to": [to],
        "subject": subject,
        "text": text,
        "html": html,
    }
    if reply_to():
        payload["reply_to"] = reply_to()

    request = urllib.request.Request(
        RESEND_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
            # NAMED, because the default is `Python-urllib/3.x` and the
            # provider sits behind Cloudflare, which refuses that signature
            # with `HTTP 403 ... error code: 1010`. Measured in production on
            # 2026-09-18: every verification mail was refused before it
            # reached the provider, while the signup itself succeeded - so the
            # inbox stayed empty with nothing on screen to explain it.
            # `api/ci.py` and `api/stripe.py` already send a name; this module
            # was the one that did not.
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return 200 <= response.status < 300
    except urllib.error.HTTPError as exc:
        # The body carries the provider's reason - an unverified domain, a
        # revoked key, a rate limit. Logged and never returned to the caller:
        # it is an operator's problem, and echoing a provider error into an
        # HTTP response is how internal configuration leaks to a stranger.
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")[:400]
        except Exception:  # noqa: BLE001 - diagnostics must not raise
            pass
        print(f"[mail] HTTP {exc.code} sending to {_mask(to)}: {detail}", flush=True)
        return False
    except Exception as exc:  # noqa: BLE001 - a send failure is never fatal
        print(f"[mail] {type(exc).__name__} sending to {_mask(to)}: {exc}", flush=True)
        return False


def _console(*, to: str, subject: str, text: str) -> bool:
    """Development backend: print it, including the link, and report success.

    Reporting success is correct rather than convenient - the caller's question
    is "did this leave our hands", and on a machine with no provider the log IS
    the outbox. Anything else would make every local signup look broken.
    """
    print(
        "\n".join(
            [
                "",
                "=" * 68,
                f"[mail:console] To:      {to}",
                f"[mail:console] Subject: {subject}",
                "-" * 68,
                text,
                "=" * 68,
                "",
            ]
        ),
        flush=True,
    )
    return True


def _mask(address: str) -> str:
    """`ali@example.com` -> `a**@example.com`. Logs are not a mailing list."""
    name, _, domain = (address or "").partition("@")
    if not domain:
        return "***"
    head = name[:1] if name else ""
    return f"{head}**@{domain}"


# ------------------------------------------------------------------- templates
#
# FIVE LOCALES, LIKE EVERY OTHER STRING A USER READS. The web app has a build
# gate that fails when a locale is missing a key; nothing can enforce that here,
# so the copy is kept deliberately small - a subject, a heading, one line, a
# button and the fallback - and `_pick` falls back to English rather than to a
# blank. Sending a Turkish signup an English verification mail is a conversion
# loss at the exact moment the account is worth the most.

SUBJECTS = {
    "verify": {
        "en": "Confirm your email address",
        "tr": "E-posta adresini doğrula",
        "de": "Bestätige deine E-Mail-Adresse",
        "es": "Confirma tu dirección de correo",
        "fr": "Confirmez votre adresse e-mail",
    },
    "reset": {
        "en": "Reset your AnswerGap password",
        "tr": "AnswerGap parolanı sıfırla",
        "de": "AnswerGap-Passwort zurücksetzen",
        "es": "Restablece tu contraseña de AnswerGap",
        "fr": "Réinitialisez votre mot de passe AnswerGap",
    },
}

HEADINGS = {
    "verify": {
        "en": "Confirm your email",
        "tr": "E-postanı doğrula",
        "de": "E-Mail bestätigen",
        "es": "Confirma tu correo",
        "fr": "Confirmez votre e-mail",
    },
    "reset": {
        "en": "Reset your password",
        "tr": "Parolanı sıfırla",
        "de": "Passwort zurücksetzen",
        "es": "Restablece tu contraseña",
        "fr": "Réinitialisez votre mot de passe",
    },
}

BODIES = {
    "verify": {
        "en": "Confirm this address to activate your account and receive your "
              "free starting credits.",
        "tr": "Hesabını etkinleştirmek ve ücretsiz başlangıç kredilerini almak "
              "için bu adresi doğrula.",
        "de": "Bestätige diese Adresse, um dein Konto zu aktivieren und deine "
              "kostenlosen Startguthaben zu erhalten.",
        "es": "Confirma esta dirección para activar tu cuenta y recibir tus "
              "créditos iniciales gratuitos.",
        "fr": "Confirmez cette adresse pour activer votre compte et recevoir "
              "vos crédits de départ gratuits.",
    },
    "reset": {
        "en": "Choose a new password for your account. If you did not ask for "
              "this, you can ignore this message — nothing has changed.",
        "tr": "Hesabın için yeni bir parola belirle. Bunu sen istemediysen bu "
              "mesajı yok sayabilirsin — hiçbir şey değişmedi.",
        "de": "Wähle ein neues Passwort für dein Konto. Falls du das nicht "
              "angefordert hast, ignoriere diese Nachricht — es hat sich "
              "nichts geändert.",
        "es": "Elige una nueva contraseña para tu cuenta. Si no lo solicitaste, "
              "puedes ignorar este mensaje: no ha cambiado nada.",
        "fr": "Choisissez un nouveau mot de passe. Si vous n'êtes pas à "
              "l'origine de cette demande, ignorez ce message — rien n'a "
              "changé.",
    },
}

BUTTONS = {
    "verify": {
        "en": "Confirm email", "tr": "E-postayı doğrula",
        "de": "E-Mail bestätigen", "es": "Confirmar correo",
        "fr": "Confirmer l'e-mail",
    },
    "reset": {
        "en": "Set a new password", "tr": "Yeni parola belirle",
        "de": "Neues Passwort setzen", "es": "Establecer contraseña",
        "fr": "Définir un mot de passe",
    },
}

EXPIRY = {
    "verify": {
        "en": "This link works once and expires in 24 hours.",
        "tr": "Bu bağlantı tek kullanımlıktır ve 24 saat sonra geçersiz olur.",
        "de": "Dieser Link funktioniert einmal und läuft in 24 Stunden ab.",
        "es": "Este enlace funciona una vez y caduca en 24 horas.",
        "fr": "Ce lien fonctionne une fois et expire dans 24 heures.",
    },
    "reset": {
        "en": "This link works once and expires in 1 hour.",
        "tr": "Bu bağlantı tek kullanımlıktır ve 1 saat sonra geçersiz olur.",
        "de": "Dieser Link funktioniert einmal und läuft in 1 Stunde ab.",
        "es": "Este enlace funciona una vez y caduca en 1 hora.",
        "fr": "Ce lien fonctionne une fois et expire dans 1 heure.",
    },
}

FALLBACK = {
    "en": "If the button does not work, paste this link into your browser:",
    "tr": "Düğme çalışmazsa bu bağlantıyı tarayıcına yapıştır:",
    "de": "Falls die Schaltfläche nicht funktioniert, füge diesen Link in "
          "deinen Browser ein:",
    "es": "Si el botón no funciona, pega este enlace en tu navegador:",
    "fr": "Si le bouton ne fonctionne pas, collez ce lien dans votre "
          "navigateur :",
}


def _pick(table: dict[str, str], locale: str) -> str:
    return table.get(locale) or table["en"]


def render(purpose: str, *, link: str, locale: str = "en") -> tuple[str, str, str]:
    """Build one message. Returns `(subject, text, html)`.

    Pure - no network, no environment, no clock - so the copy and the link
    placement are testable without a provider account.
    """
    if purpose not in SUBJECTS:
        raise ValueError(f"unknown mail purpose: {purpose}")
    locale = locale if locale in FALLBACK else "en"

    subject = _pick(SUBJECTS[purpose], locale)
    heading = _pick(HEADINGS[purpose], locale)
    body = _pick(BODIES[purpose], locale)
    button = _pick(BUTTONS[purpose], locale)
    expiry = _pick(EXPIRY[purpose], locale)
    fallback = _pick(FALLBACK, locale)

    text = "\n\n".join([heading, body, link, expiry, f"{fallback}\n{link}"])
    return subject, text, _html(heading, body, button, link, expiry, fallback)


def _html(
    heading: str, body: str, button: str, link: str, expiry: str, fallback: str
) -> str:
    """Table-based, inline styles, no external assets.

    Email clients are not browsers: Outlook still renders through Word, Gmail
    strips <style> blocks, and a linked stylesheet or webfont never arrives.
    Everything below is the intersection that actually survives - which is why
    this does not reuse the design system, and must not be "modernised" into
    flexbox and CSS variables.
    """
    safe = _escape(link)
    return f"""\
<!doctype html>
<html><body style="margin:0;padding:0;background:#fbfaf8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:#fbfaf8;padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:520px;background:#ffffff;border:1px solid #e7e4ee;
                border-radius:16px;padding:32px;font-family:-apple-system,
                'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17151f;">
    <tr><td style="font-size:20px;font-weight:700;padding-bottom:8px;">
      AnswerGap
    </td></tr>
    <tr><td style="font-size:22px;font-weight:700;padding-bottom:12px;">
      {_escape(heading)}
    </td></tr>
    <tr><td style="font-size:15px;line-height:1.6;color:#5f5a70;
                   padding-bottom:24px;">
      {_escape(body)}
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <a href="{safe}" style="display:inline-block;background:#5b45e0;
         color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;
         padding:13px 26px;border-radius:10px;">{_escape(button)}</a>
    </td></tr>
    <tr><td style="font-size:13px;color:#8e8899;padding-bottom:16px;">
      {_escape(expiry)}
    </td></tr>
    <tr><td style="font-size:12px;color:#8e8899;line-height:1.5;
                   border-top:1px solid #e7e4ee;padding-top:16px;
                   word-break:break-all;">
      {_escape(fallback)}<br>
      <a href="{safe}" style="color:#5b45e0;">{safe}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>"""


def _escape(raw: str) -> str:
    return (
        (raw or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
