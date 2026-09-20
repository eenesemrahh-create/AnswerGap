import type { Locale } from "@/i18n/types";
import type { Widen } from "../blocks";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";

/**
 * The shape every translation of the terms must satisfy, derived from English.
 *
 * Same device as `i18n/types.ts`, and for a stronger reason here: English is
 * the CONTROLLING version of this contract, so a clause that exists in English
 * and not in Turkish is not an untranslated string, it is a term the Turkish
 * reader was never shown. `Widen<typeof en>` preserves tuple arity, so a
 * translation must match the English clause for clause and bullet for bullet.
 * Adding a sentence to `en.ts` breaks the other four until they carry it too.
 */
export type TermsContent = Widen<typeof en>;

export const TERMS: Record<Locale, TermsContent> = { en, de, es, fr, tr };

/**
 * Server-only tripwire.
 *
 * The `server-only` package is not installed and adding it would break the
 * "no new dependency" rule these documents were built under, so this stands in
 * for it. If a client component ever imports the registry, dev fails loudly
 * instead of quietly shipping both documents in five languages to every
 * visitor of every page. `npm run build` plus the chunk grep is the check that
 * actually proves it; this one just makes the mistake obvious sooner.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "content/legal is server-only - importing it from a client component " +
      "ships every locale of every legal document to every visitor."
  );
}
