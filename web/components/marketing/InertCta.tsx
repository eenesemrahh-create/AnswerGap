"use client";

import { useI18n } from "@/i18n";

/**
 * A call to action that no longer applies to this reader.
 *
 * "Start free" is an invitation to create an account. Shown to somebody who
 * already has one it is not merely useless - it suggests the page does not
 * know who they are, on a product whose whole job is knowing things.
 *
 * GREYED, NOT REMOVED. A button that vanishes when you sign in reads as a page
 * that broke between two visits; one that stays and explains itself reads as a
 * page that noticed. `aria-disabled` and no `href`, so it is announced as
 * unavailable and cannot be followed by keyboard or by a screen reader.
 *
 * A `span`, not a `button[disabled]`: there is nothing to submit, and a
 * disabled button is skipped by the tab order entirely - which would take the
 * explanation with it.
 */
export function InertCta({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <span
      className={`${className} is-inert`}
      aria-disabled="true"
      title={t("auth.alreadySignedIn")}
    >
      {children}
    </span>
  );
}
