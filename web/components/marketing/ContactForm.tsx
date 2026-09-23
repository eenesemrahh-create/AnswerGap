"use client";

import { useState } from "react";
import { ApiError, sendContactMessage } from "@/lib/api";
import type { ContactContent } from "@/content/marketing/contact";

/**
 * The contact form.
 *
 * A client island inside a server page, and it takes its LABELS as props
 * rather than calling `t()`. Everything else on the page is rendered in the
 * language of the URL; a form that read the browser's stored locale instead
 * would put a German "Send" under a Turkish heading — the same mismatch the
 * server-rendered chrome exists to avoid.
 *
 * On success the form is REPLACED by the confirmation rather than cleared.
 * A cleared form invites a second send, and the commonest reason someone
 * sends twice is that nothing on screen told them the first one worked.
 */
export function ContactForm({ form }: { form: ContactContent["form"] }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "sending") return;

    const data = new FormData(event.currentTarget);
    setState("sending");
    setError(null);
    try {
      await sendContactMessage({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        company: String(data.get("company") ?? ""),
        subject: String(data.get("subject") ?? ""),
        message: String(data.get("message") ?? ""),
      });
      setState("sent");
    } catch (e) {
      /* Two outcomes worth telling apart. Everything else is "it did not
         send", because a stranger filling in a contact form cannot act on the
         difference between a 500 and a network drop. */
      const tooMany = e instanceof ApiError && e.kind === "tooManyAttempts";
      setError(tooMany ? form.tooMany : form.failed);
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div className="mkt-form mkt-form-sent" role="status">
        <p className="mkt-form-sent-title">{form.sent}</p>
        <p>{form.sentDetail}</p>
      </div>
    );
  }

  return (
    <form className="mkt-form" onSubmit={submit}>
      <div className="mkt-form-row">
        <label>
          {form.name}
          <input name="name" required placeholder={form.namePlaceholder} />
        </label>
        <label>
          {form.email}
          <input
            name="email"
            type="email"
            required
            placeholder={form.emailPlaceholder}
          />
        </label>
      </div>
      <label>
        {form.company}
        <input name="company" placeholder={form.companyPlaceholder} />
      </label>
      <label>
        {form.subject}
        <input name="subject" required placeholder={form.subjectPlaceholder} />
      </label>
      <label>
        {form.message}
        <textarea
          name="message"
          required
          rows={5}
          placeholder={form.messagePlaceholder}
        />
      </label>

      {error && (
        <p className="mkt-form-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mkt-cta-primary on-light mkt-form-submit"
        disabled={state === "sending"}
      >
        {state === "sending" ? form.sending : form.submit}
      </button>
      <p className="mkt-form-privacy">{form.privacy}</p>
    </form>
  );
}
