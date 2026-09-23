import type { Locale } from "@/i18n/types";
import type { Widen } from "../blocks";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";

/**
 * The pricing page, in five languages.
 *
 * `Widen<typeof en>` preserves tuple arity, which matters more here than
 * anywhere else in this tree: the three plan cards and the twelve comparison
 * rows have to line up with each other, and a translation that dropped a row
 * would put every tick in the column below it against the wrong feature.
 */
export type PricingContent = Widen<typeof en>;

export const PRICING: Record<Locale, PricingContent> = { en, de, es, fr, tr };
