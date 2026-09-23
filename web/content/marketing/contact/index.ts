import type { Locale } from "@/i18n/types";
import type { Widen } from "../blocks";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";

/**
 * The contact page, in five languages.
 *
 * Unlike the other two this one carries FORM strings, which the client island
 * receives as props. That is deliberate: the labels stay in the server-rendered
 * tree with the rest of the prose, and only the translated strings the form
 * actually needs cross into the browser.
 */
export type ContactContent = Widen<typeof en>;

export const CONTACT: Record<Locale, ContactContent> = { en, de, es, fr, tr };
