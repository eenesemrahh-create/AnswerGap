import type { ChromeShape } from "../blocks";

/**
 * The nav and footer wrapped around every marketing page.
 *
 * THE FOOTER LISTS THE DESIGN'S FULL SET since 2026-11-01 (operator). An entry
 * with no page yet (API, Changelog, Blog, SEO Guides, Help Center, Community,
 * About) renders as plain text rather than as a link to nowhere, the rule the
 * nav already follows for Blog.
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
      "Discover the questions people ask about your topic, then create helpful content that answers them.",
    product: "Product",
    resources: "Resources",
    company: "Company",
    rights: "All rights reserved.",
    links: {
      features: "Features",
      solutions: "Solutions",
      pricing: "Pricing",
      api: "API",
      changelog: "Changelog",
      blog: "Blog",
      seoGuides: "SEO Guides",
      helpCenter: "Help Center",
      community: "Community",
      about: "About",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  },
} as const satisfies ChromeShape;
