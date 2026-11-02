"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

/* The way on from `noCredits`, under the message wherever a search or an
 * analysis was refused. */
export function PlansLink({ kind }: { kind: string }) {
  const { t } = useI18n();
  if (kind !== "noCredits") return null;
  return (
    <Link href="/account/subscription" className="plans-link">
      {t("error.seePlans")} →
    </Link>
  );
}
