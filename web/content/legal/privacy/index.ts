import type { Locale } from "@/i18n/types";
import type { Widen } from "../blocks";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";

/**
 * The shape every translation of the privacy policy must satisfy.
 *
 * Derived separately from the terms, so changing one document does not break
 * the other's four translations. Same clause-for-clause gate: `Widen` keeps
 * tuple arity, and a statement present in English but missing in German is a
 * disclosure the German reader was never given, not a cosmetic gap.
 */
export type PrivacyContent = Widen<typeof en>;

export const PRIVACY: Record<Locale, PrivacyContent> = { en, de, es, fr, tr };

/** Server-only tripwire; see the note in `../terms/index.ts`. */
if (typeof window !== "undefined") {
  throw new Error(
    "content/legal is server-only - importing it from a client component " +
      "ships every locale of every legal document to every visitor."
  );
}
