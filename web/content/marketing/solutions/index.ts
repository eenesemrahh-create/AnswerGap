import type { Locale } from "@/i18n/types";
import type { Widen } from "../blocks";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";

/**
 * The solutions page, in five languages.
 *
 * The nine team cards are a 3x3 grid, so `Widen<typeof en>` keeping the tuple
 * length is also keeping the layout: eight cards would leave a hole in it.
 */
export type SolutionsContent = Widen<typeof en>;

export const SOLUTIONS: Record<Locale, SolutionsContent> = { en, de, es, fr, tr };
