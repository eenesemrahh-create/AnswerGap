/**
 * The shape of a legal document, and nothing else.
 *
 * STRUCTURED DATA, NEVER HTML. Every string below is rendered as a React text
 * child, so React escapes it and there is no sink to sanitise. That is the
 * whole reason this is a type rather than a markdown file: a markdown document
 * needs a renderer, a renderer needs a sanitiser, and a sanitiser on a page
 * nobody edits at runtime is two dependencies bought for nothing.
 *
 * TWO HEADING LEVELS, DELIBERATELY. A contract with `h3` subsections stops
 * being readable, so `Block` has no heading member at all - a section's
 * `heading` is the only one, and the renderer emits it as `h2`.
 *
 * NOT IN `web/i18n`. That catalogue is statically imported by a provider in the
 * root layout, so all five locales ship to every visitor on every page. Two
 * long documents there would be a permanent bundle tax on people who never open
 * them. These modules are imported only by the legal routes, which are server
 * components, so the prose never reaches the browser at all.
 */

/** A paragraph, a bullet list, or a standalone line carrying one link. */
export type Block =
  | { readonly p: string }
  | { readonly ul: readonly string[] }
  | { readonly link: { readonly text: string; readonly href: string } };

/**
 * Widen an `as const` document to its translatable shape: literal strings
 * become `string`, everything else keeps its structure - including tuple
 * length, which is the whole point.
 *
 * `i18n/types.ts` strips `readonly` instead, and gets away with it because the
 * message catalogue holds no arrays: a readonly PROPERTY is assignable to a
 * mutable one, so nothing complains. A readonly ARRAY is not, and these
 * documents are mostly arrays. Keeping `readonly` on the target makes both
 * sides fit - the `as const` English file, and the plain object literals the
 * translations are written as.
 *
 * Because the mapped type is homomorphic it preserves tuple arity, so a
 * translation is checked clause for clause and bullet for bullet against
 * English rather than merely "has an array here".
 */
export type Widen<T> = T extends string
  ? string
  : { readonly [K in keyof T]: Widen<T[K]> };

/**
 * What every legal document exports, before English pins the section list.
 *
 * Each document derives its own exact type from its English file, so adding a
 * section to the English terms breaks the four terms translations and leaves
 * the privacy files alone.
 */
export interface LegalDocumentShape {
  /** The `h1`, and the `<title>`. */
  readonly title: string;
  /** The meta description. One sentence. */
  readonly description: string;
  /** The sentence under the title. */
  readonly lead: string;
  /** Shown as "Last updated". ISO `YYYY-MM-DD`; the renderer formats it. */
  readonly effective: string;
  readonly sections: {
    readonly [key: string]: {
      readonly heading: string;
      readonly body: readonly Block[];
    };
  };
}

/**
 * Values that must read the same in all five documents, held in ONE place.
 *
 * The company details are not known yet. They are placeholders on purpose and
 * they are loud on purpose: a legal page that ships saying «COMPANY» is
 * embarrassing, but a legal page that ships saying nothing at all - because the
 * blank was quietly filled with something plausible - is worse. Filling these
 * in is a one-line edit here, not a sweep through ten translated documents.
 *
 * `assertLegalVarsFilled()` in `lib/legal.ts` is what stops them reaching
 * production unnoticed.
 */
export const LEGAL_VARS = {
  company: "«COMPANY NAME»",
  entity: "«ENTITY TYPE, e.g. limited liability company»",
  state: "«STATE»",
  email: "support@gettopquestions.com",
  site: "gettopquestions.com",
} as const;

export type LegalVarName = keyof typeof LEGAL_VARS;

/** True while any company detail is still a placeholder. */
export const LEGAL_VARS_INCOMPLETE = Object.values(LEGAL_VARS).some((v) =>
  v.includes("«")
);

/**
 * Replace `{company}` and friends. Same `{name}` convention as `i18n`, so a
 * writer moving between the catalogue and a legal document does not have to
 * remember two syntaxes.
 *
 * An unknown name is left verbatim rather than blanked - a visible `{whatever}`
 * in a proof-read is a bug report; a silently empty sentence is not.
 */
export function fill(text: string): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in LEGAL_VARS ? LEGAL_VARS[name as LegalVarName] : whole
  );
}
