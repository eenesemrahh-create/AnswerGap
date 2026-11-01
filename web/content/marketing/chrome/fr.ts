import type { ChromeContent } from "./index";

/**
 * Navigation et pied de page des pages marketing - traduction de `en.ts`.
 *
 * Ce fichier doit correspondre à l'anglais clé pour clé ; le type transforme
 * tout écart en erreur de compilation. Seuls des liens réels y figurent :
 * `nav.aiSeo` et `nav.blog` n'ont pas encore de page et s'affichent en texte
 * simple tant qu'il n'y a nulle part où aller.
 */
export const fr: ChromeContent = {
  nav: {
    pricing: "Tarifs",
    solutions: "Solutions",
    aiSeo: "SEO pour l'IA",
    blog: "Blog",
    contact: "Contact",
    signIn: "Se connecter",
    signUp: "S'inscrire",
  },
  footer: {
    tagline:
      "Découvrez les questions posées sur votre sujet, puis créez un contenu utile qui y répond.",
    product: "Produit",
    resources: "Ressources",
    company: "Entreprise",
    rights: "Tous droits réservés.",
    links: {
      features: "Fonctionnalités",
      solutions: "Solutions",
      pricing: "Tarifs",
      api: "API",
      changelog: "Journal des modifications",
      blog: "Blog",
      seoGuides: "Guides SEO",
      helpCenter: "Centre d'aide",
      community: "Communauté",
      about: "À propos",
      contact: "Contact",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
    },
  },
};
