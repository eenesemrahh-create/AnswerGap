/**
 * The shape of the marketing pages, and nothing else.
 *
 * Same discipline as `content/legal/blocks.ts`, for the same two reasons.
 *
 * STRUCTURED DATA, NEVER HTML. Every string here is rendered as a React text
 * child, so React escapes it and there is no sink to sanitise.
 *
 * NOT IN `web/i18n`. That catalogue is statically imported by a provider in
 * the root layout, so all five locales ship to every visitor on every page —
 * ~112 KB before these pages existed. Three long marketing pages there would
 * be a permanent bundle tax on the many people who only ever open the app.
 * These modules are imported by server components, so the prose is rendered
 * to HTML and the four locales nobody asked for never reach the browser.
 *
 * SERVER-RENDERED IS THE REQUIREMENT HERE TOO, and for a harder reason than
 * the legal pages had. Those needed to be readable by Stripe's and Google's
 * review fetchers. These are the pages the product wants RANKED — by search
 * engines and by the AI answer engines this product exists to sell visibility
 * in. A marketing page assembled on the client is a marketing page those
 * crawlers read as empty, which for this product would be embarrassing.
 */

/**
 * Literal strings widen to `string`; everything else keeps its structure,
 * tuple arity included. See the long explanation in `content/legal/blocks.ts`
 * — the type lives there, and both content trees are checked by it, so a
 * translation has to match English card for card and bullet for bullet.
 */
export type { Widen } from "@/content/legal/blocks";

/** A heading + body pair: the card shape shared by most sections below. */
export interface Card {
  readonly title: string;
  readonly desc: string;
}

/**
 * The chrome every marketing page carries.
 *
 * It lives in the content tree rather than in `web/i18n` because the pages
 * are server components: the nav around a Turkish pricing page has to be
 * Turkish, and `t()` reads a locale the client picked. That mismatch is
 * exactly what `LegalDocument` built its own thin header to avoid, and this
 * is the general version of that fix.
 */
export interface ChromeShape {
  readonly nav: {
    readonly pricing: string;
    readonly solutions: string;
    readonly aiSeo: string;
    readonly blog: string;
    readonly contact: string;
    readonly signIn: string;
    readonly signUp: string;
  };
  readonly footer: {
    readonly tagline: string;
    readonly product: string;
    readonly resources: string;
    readonly company: string;
    readonly links: {
      readonly features: string;
      readonly solutions: string;
      readonly pricing: string;
      readonly blog: string;
      readonly about: string;
      readonly contact: string;
      readonly privacy: string;
      readonly terms: string;
    };
  };
}

/**
 * A hero: an optional eyebrow pill, a headline in three parts so the middle
 * can carry the brand gradient, and a sentence under it.
 *
 * The headline is split into fields rather than marked up inside one string
 * because the tinted span lands somewhere different in every language —
 * German compounds and Turkish suffixes do not break where English does, and
 * a translator who cannot move the split will either mistranslate or leave
 * the gradient on the wrong words. `head` and `headTail` may be empty; the
 * renderer drops the space when they are.
 */
export interface Hero {
  /** The pill above the headline, or null for no pill. */
  readonly eyebrow: string | null;
  readonly head: string;
  readonly headTinted: string;
  readonly headTail: string;
  readonly lead: string;
}

export interface PricingShape {
  readonly title: string;
  readonly description: string;
  readonly hero: Hero;
  readonly billing: {
    readonly monthly: string;
    readonly annually: string;
    readonly save: string;
    /** Shown under each price when the monthly cycle is selected. */
    readonly billedMonthly: string;
    /** …and when the annual one is. */
    readonly billedAnnually: string;
    readonly plusTax: string;
  };
  /** Exactly three cards. A fourth would not fit the comparison table below. */
  readonly plans: readonly [PlanCard, PlanCard, PlanCard];
  readonly compare: {
    readonly heading: string;
    readonly featureColumn: string;
    readonly groupHeading: string;
    readonly rows: readonly CompareRow[];
  };
  readonly faq: {
    readonly heading: string;
    readonly items: readonly Card[];
  };
  readonly cta: {
    readonly heading: string;
    readonly lead: string;
    readonly primary: string;
    readonly secondary: string;
  };
}

export interface PlanCard {
  readonly name: string;
  readonly desc: string;
  /** Rendered verbatim, currency symbol included. */
  readonly priceMonthly: string;
  readonly priceAnnual: string;
  readonly per: string;
  readonly cta: string;
  /** The pill above the card, or null for no pill. */
  readonly badge: string | null;
  /** The small caps line above the feature list. */
  readonly featuresHeading: string;
  readonly features: readonly string[];
}

/**
 * One row of the comparison table.
 *
 * `values` is a three-tuple in plan order, and each cell is either a string to
 * print or a boolean. `false` renders as an en dash rather than a cross: the
 * table says what each plan includes, and a cross reads as a warning about
 * something withheld.
 */
export interface CompareRow {
  readonly label: string;
  readonly values: readonly [string | boolean, string | boolean, string | boolean];
}

export interface SolutionsShape {
  readonly title: string;
  readonly description: string;
  readonly hero: Hero;
  readonly heroPrimary: string;
  readonly heroSecondary: string;
  readonly teams: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lead: string;
    /** Nine, laid out three by three. */
    readonly cards: readonly Card[];
  };
  readonly advantage: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly cards: readonly [Card, Card, Card];
  };
}

export interface ContactShape {
  readonly title: string;
  readonly description: string;
  readonly hero: Hero;
  readonly reasons: readonly [Card, Card, Card];
  readonly form: {
    readonly name: string;
    readonly namePlaceholder: string;
    readonly email: string;
    readonly emailPlaceholder: string;
    readonly company: string;
    readonly companyPlaceholder: string;
    readonly subject: string;
    readonly subjectPlaceholder: string;
    readonly message: string;
    readonly messagePlaceholder: string;
    readonly submit: string;
    readonly sending: string;
    readonly sent: string;
    readonly sentDetail: string;
    readonly failed: string;
    readonly tooMany: string;
    /** Said out loud under the button, because it is a promise. */
    readonly privacy: string;
  };
}
