"use client";

import { useState, useTransition } from "react";
import { eraseUser } from "../actions";

/**
 * Erase an account, in two deliberate acts.
 *
 * A client component rather than one more `<form action={…}>` like its three
 * neighbours, because those are all reversible - a suspension can be lifted, a
 * credit grant can be reversed by granting the other way - and this one is
 * not. The two-step is copied from the Stripe panel, which asks twice before
 * charging a real card: the first click only opens a warning, and the warning
 * names the address so the last click is never a bare "Yes".
 *
 * It sits apart from the Account block on purpose. A control that both
 * suspends and erases is a control somebody eventually misreads.
 */
export function EraseAccount({
  userId,
  email,
  erased,
}: {
  userId: number;
  email: string;
  erased: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (erased) {
    return (
      <p className="sub">
        This account is already erased. Nothing further to do here — it comes
        back only when the person proves the mailbox again, by signing up or
        signing in with the same address.
      </p>
    );
  }

  const run = () => {
    setAsking(false);
    setMessage(null);
    startTransition(async () => {
      try {
        const out = await eraseUser(userId, reason);
        setMessage(
          out.already_erased
            ? "Already erased — nothing was written."
            : `Erased. ${out.crawls} searches unlinked, ${out.usage_events} usage rows ` +
              `unattributed, ${out.payments_redacted} payment payloads redacted, ` +
              `${out.credentials_deleted} live credentials deleted.`
        );
      } catch {
        setMessage("The API refused. Check the api service log.");
      }
    });
  };

  return (
    <>
      <div className="row">
        <button
          className="act warn"
          disabled={pending}
          onClick={() => setAsking(true)}
        >
          Erase this account
        </button>
        <span className="sub" style={{ margin: 0 }}>
          Blanks the profile, deletes every live credential and unlinks every
          search. Keeps the address and the payment amounts — the Privacy
          Policy says so in section 7.
        </span>
      </div>

      {asking && (
        <div className="notice">
          <p>
            <b>This cannot be undone from here.</b> It erases{" "}
            <b>{email}</b>: name, picture, password and Google link blanked,
            every session killed, every reset link deleted, and every search
            unlinked from the person.
          </p>
          <p>
            The address and the payment amounts are kept deliberately. If this
            person signs up again with the same address, the account revives
            and any credit balance they paid for comes back.
          </p>
          <p>
            Payments are matched by email address only — there is no other link
            — so a checkout completed under a different address will not be
            redacted. The count below will say so.
          </p>
          <label className="row" style={{ marginTop: 8 }}>
            <input
              placeholder="Reason for the audit log (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </label>
          <p className="sub" style={{ margin: 0 }}>
            Do not type anything about the person here. Nothing redacts the
            audit log, so a name written in this box outlives the erasure.
          </p>
          <div className="ci-buttons">
            <button className="act warn" disabled={pending} onClick={run}>
              Yes, erase {email}
            </button>
            <button className="act" onClick={() => setAsking(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && <div className="ci-message">{message}</div>}
    </>
  );
}
