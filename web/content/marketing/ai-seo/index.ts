import type { Locale } from "@/i18n/types";
import type { Widen } from "../blocks";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";

/**
 * The AI SEO page, in five languages.
 *
 * `Widen<typeof en>` keeps every tuple's length, so a translation has to match
 * English card for card: the figure row is three, the tips grid three by two.
 */
export type AiSeoContent = Widen<typeof en>;

export const AI_SEO: Record<Locale, AiSeoContent> = { en, de, es, fr, tr };
