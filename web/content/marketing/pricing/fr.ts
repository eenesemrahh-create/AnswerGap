import type { PricingContent } from "./index";

/**
 * Tarifs - traduction de la version anglaise `en.ts`.
 *
 * Ce fichier doit correspondre à l'anglais formule pour formule et puce pour
 * puce ; le type transforme tout écart en erreur de compilation. Les prix, les
 * booléens et l'ordre des formules sont des données, pas du texte : ils sont
 * repris tels quels.
 *
 * Les réserves consignées dans `en.ts` s'appliquent aussi ici : cette page
 * décrit des fonctionnalités qui n'existent pas encore et ne doit pas être
 * annoncée comme active tant que ce n'est pas le cas.
 */
export const fr: PricingContent = {
  title: "Tarifs",
  description:
    "Des formules pour les équipes qui doivent savoir à quelles questions la " +
    "recherche IA répond, auxquelles elle ne répond pas, et qui elle cite.",

  hero: {
    eyebrow: null,
    head: "Des tarifs pour l'ère de",
    headTinted: "la recherche IA.",
    headTail: "",
    lead:
      "Ne devinez plus ce que les moteurs IA répondent. Découvrez les " +
      "questions exactes qu'il vous faut pour dominer la visibilité et " +
      "obtenir des citations.",
  },

  billing: {
    monthly: "Mensuel",
    annually: "Annuel",
    save: "Économisez 20 %",
    billedMonthly: "Facturé mensuellement",
    billedAnnually: "Facturé annuellement",
    plusTax: "+ taxes",
  },

  plans: [
    {
      name: "Starter",
      desc:
        "Pour les créateurs et les petites équipes qui construisent leur " +
        "visibilité dans la recherche IA.",
      priceMonthly: "$9.99",
      priceAnnual: "$7.99",
      per: "/mois",
      cta: "Démarrer l'essai de 7 jours",
      badge: null,
      featuresHeading: "Meilleure formule pour débuter",
      features: [
        "100 crédits par mois",
        "Utilisateurs illimités",
        "Toutes les régions",
        "Toutes les langues",
        "Export d'image PNG",
        "Historique de recherche de 24 heures",
      ],
    },
    {
      name: "Lite",
      desc:
        "Pour les professionnels du SEO qui développent leur autorité dans " +
        "la recherche IA.",
      priceMonthly: "$19.99",
      priceAnnual: "$15.99",
      per: "/mois",
      cta: "Passer à Lite",
      badge: "Le plus populaire",
      featuresHeading: "Le plus populaire",
      features: [
        "300 crédits par mois",
        "Utilisateurs illimités",
        "Toutes les régions",
        "Toutes les langues",
        "Export d'image PNG",
        "Historique de recherche d'un mois",
        "Recherche approfondie",
        "Export de données CSV",
      ],
    },
    {
      name: "Pro",
      desc:
        "Pour les équipes à fort volume et les agences qui ont besoin de " +
        "marque blanche.",
      priceMonthly: "$39.99",
      priceAnnual: "$31.99",
      per: "/mois",
      cta: "Passer à Pro",
      badge: null,
      featuresHeading: "Meilleur rapport qualité-prix",
      features: [
        "1 000 crédits par mois",
        "Utilisateurs illimités",
        "Toutes les régions",
        "Toutes les langues",
        "Export d'image PNG",
        "Historique de recherche d'un an",
        "Recherche approfondie",
        "Export de données CSV",
        "Recherches en lot",
        "Accès à l'API",
        "Crédits à la demande",
        "Serveur MCP",
      ],
    },
  ],

  compare: {
    heading: "Comparer les fonctionnalités des formules",
    featureColumn: "Fonctionnalités",
    groupHeading: "Fonctionnalités des formules",
    rows: [
      { label: "Crédits par mois", values: ["100", "300", "1 000"] },
      { label: "Utilisateurs illimités", values: [true, true, true] },
      { label: "Toutes les régions", values: [true, true, true] },
      { label: "Toutes les langues", values: [true, true, true] },
      { label: "Export d'image PNG", values: [true, true, true] },
      {
        label: "Historique de recherche",
        values: ["24 heures", "1 mois", "1 an"],
      },
      { label: "Recherche approfondie", values: [false, true, true] },
      { label: "Export de données CSV", values: [false, true, true] },
      { label: "Recherches en lot", values: [false, false, true] },
      { label: "Accès à l'API", values: [false, false, true] },
      { label: "Crédits à la demande", values: [false, false, true] },
      { label: "Serveur MCP", values: [false, false, true] },
    ],
  },

  faq: {
    heading: "Questions fréquentes",
    items: [
      {
        title: "Qu'est-ce qui compte comme une requête ?",
        desc:
          "Un crédit correspond à une recherche. Déployer un mot-clé en arbre " +
          "de questions coûte un seul crédit, quel que soit le nombre de " +
          "questions renvoyées. Vérifier qui répond réellement à une question " +
          "est facturé séparément, car chaque vérification est une requête à " +
          "part entière.",
      },
      {
        title: "Puis-je changer de formule plus tard ?",
        desc:
          "Oui, à tout moment. Une montée en gamme prend effet immédiatement ; " +
          "une baisse prend effet à la fin du cycle que vous avez déjà payé. " +
          "Les crédits que vous avez déjà achetés vous restent acquis.",
      },
      {
        title: "Comment fonctionne l'accès à l'API ?",
        desc:
          "La formule Pro inclut l'accès à l'API et un serveur MCP, afin que " +
          "vos propres outils et assistants puissent lancer des recherches et " +
          "lire les résultats directement, sans passer par cette interface.",
      },
      {
        title: "Proposez-vous des tarifs sur mesure pour les grands comptes ?",
        desc:
          "Oui. Si vous avez besoin d'un volume plus élevé, de rapports en " +
          "marque blanche ou de plusieurs espaces de travail, contactez-nous " +
          "et nous construirons une formule adaptée au volume que vous " +
          "utilisez réellement.",
      },
    ],
  },

  cta: {
    heading: "Prêt à découvrir les réponses ?",
    lead:
      "Rejoignez les grandes équipes de contenu qui utilisent AnswerGap pour " +
      "aligner leur stratégie sur l'intention de la recherche IA.",
    primary: "Démarrez votre essai gratuit de 7 jours",
    secondary: "Contacter le service commercial",
  },
};
