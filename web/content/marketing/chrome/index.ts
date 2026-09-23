import type { Locale } from "@/i18n/types";
import type { Widen } from "../blocks";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";

/**
 * The nav and footer strings, in five languages.
 *
 * Same device as `content/legal/terms/index.ts`: `Widen<typeof en>` derives
 * the shape from English and preserves tuple arity, so adding a nav link to
 * `en.ts` breaks the other four until they carry it too.
 */
export type ChromeContent = Widen<typeof en>;

export const CHROME: Record<Locale, ChromeContent> = { en, de, es, fr, tr };
