/**
 * "Something needs a signed-in reader" — a one-line channel from wherever that
 * happens to the one component that owns the sign-in dialog.
 *
 * WHY A CHANNEL RATHER THAN A PROP. The dialog is mounted by `AccountMenu`,
 * which lives in the nav; the search box that now needs it lives in the page
 * body, and the tree screen has its own copies of both. Lifting the dialog
 * above them would mean threading `open`, `mode`, `reason` and a close handler
 * through every screen that has a nav, to move a component that is already in
 * the right place.
 *
 * A `CustomEvent` on `window` keeps the dialog where it is and costs both ends
 * one line. It is deliberately NOT a general event bus: one event, two
 * functions, and a typed payload, so the compiler still checks the only thing
 * worth checking — what the request says.
 *
 * Nothing here decides POLICY. The caller has already established that the
 * reader is signed out; this only carries the request. The API refuses
 * signed-out searches on its own (`gate.decide`), so losing this event costs a
 * nicer prompt, never the rule.
 */

const EVENT = "answergap:signin-request";

export interface SignInRequest {
  /** Which face of the dialog to open on. */
  mode: "signin" | "signup";
  /** One sentence saying why, shown above the buttons. Already translated. */
  reason?: string;
}

/** Ask for the sign-in dialog. Safe to call during SSR: it simply does nothing. */
export function requestSignIn(request: SignInRequest): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SignInRequest>(EVENT, { detail: request }));
}

/** Listen for the above. Returns the unsubscribe, for an effect's cleanup. */
export function onSignInRequest(handler: (request: SignInRequest) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<SignInRequest>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
