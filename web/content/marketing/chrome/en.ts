import type { ChromeShape } from "../blocks";

/**
 * The nav and footer wrapped around every marketing page.
 *
 * ONLY LIVE LINKS ARE LISTED HERE. The landing page's inlined footer still
 * carries ten `href="#"` placeholders — API, Changelog, Blog, SEO Guides,
 * Help Center, Community, About — and `LegalDocument` already refused to
 * reuse it for exactly that reason: a row of links that go nowhere is worse
 * than a shorter row. Every entry below resolves to a page that exists.
 *
 * `nav.blog` is the one the design asks for that has no page yet (`/ai-seo`
 * landed 2026-10-08). It is kept in the shape, because the translations should
 * be written once rather than in a second pass, and the nav renders it as
 * plain text rather than as a link until there is somewhere to go.
 */
export const en = {
  nav: {
    pricing: "Pricing",
    solutions: "Solutions",
    aiSeo: "AI SEO",
    blog: "Blog",
    contact: "Contact",
    signIn: "Sign In",
    signUp: "Sign Up",
  },
  footer: {
    tagline:
      "Find the questions AI search needs answered—and help your brand " +
      "become the trusted source it recommends.",
    product: "Product",
    resources: "Resources",
    company: "Company",
    links: {
      features: "Features",
      solutions: "Solutions",
      pricing: "Pricing",
      blog: "Blog",
      about: "About",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  },
} as const satisfies ChromeShape;
