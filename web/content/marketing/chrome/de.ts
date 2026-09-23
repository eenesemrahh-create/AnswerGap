import type { ChromeContent } from "./index";

/**
 * Navigation und Fußzeile der Marketing-Seiten - Übersetzung von `en.ts`.
 *
 * Maßgeblich ist die englische Fassung. Diese Datei muss `en.ts` Eintrag für
 * Eintrag entsprechen; der Typ macht daraus einen Compile-Fehler.
 */
export const de: ChromeContent = {
  nav: {
    pricing: "Preise",
    solutions: "Lösungen",
    aiSeo: "AI SEO",
    blog: "Blog",
    contact: "Kontakt",
    signIn: "Anmelden",
    signUp: "Registrieren",
  },
  footer: {
    tagline:
      "Finden Sie die Fragen, auf die die KI-Suche eine Antwort braucht - und " +
      "machen Sie Ihre Marke zu der Quelle, die sie empfiehlt.",
    product: "Produkt",
    resources: "Ressourcen",
    company: "Unternehmen",
    links: {
      features: "Funktionen",
      solutions: "Lösungen",
      pricing: "Preise",
      blog: "Blog",
      about: "Über uns",
      contact: "Kontakt",
      privacy: "Datenschutzerklärung",
      terms: "Nutzungsbedingungen",
    },
  },
};
