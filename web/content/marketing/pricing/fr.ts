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
      "Cessez de deviner ce que votre audience veut savoir. Découvrez les questions que les gens posent et planifiez du contenu pour la recherche, les AI Overviews et l'IA conversationnelle.",
  },

  billing: {
    monthly: "Mensuel",
    annually: "Annuel",
    save: "Économisez 20 %",
    billedMonthly: "Facturé mensuellement",
    billedAnnually: "Facturé annuellement",
    plusTax: "+ taxes",
    signUpNow: "S'inscrire maintenant",
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
        "Historique de recherche illimité",
        "Recherche approfondie",
        "Export de données CSV",
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
        "Historique de recherche illimité",
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
        "Historique de recherche illimité",
        "Recherche approfondie",
        "Export de données CSV",
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
      { label: "Historique de recherche illimité", values: [true, true, true] },
      { label: "Recherche approfondie", values: [true, true, true] },
      { label: "Export de données CSV", values: [true, true, true] },
    ],
  },

  guide: {
    eyebrow: "Choix de la formule",
    title: "Quelle formule correspond à votre façon de travailler ?",
    lead: "Chaque formule inclut des utilisateurs illimités, toutes les régions et toutes les langues. Les différences portent sur les crédits, la durée de conservation de l'historique et la façon de sortir les questions de GetTopQuestions.",
    cards: [
      {
        name: "Starter",
        choose: "Choisissez Starter si vous",
        points: [
          "recherchez quelques termes par semaine, jusqu'à 100 crédits par mois",
          "agissez sur les résultats le jour même, car l'historique est conservé 24 heures",
          "partagez vos résultats en images PNG plutôt qu'en tableurs"
        ],
        next: "Pensez à Lite lorsque vous aimeriez revoir les recherches de la semaine passée ou ouvrir les résultats dans un tableur."
      },
      {
        name: "Lite",
        choose: "Choisissez Lite si vous",
        points: [
          "planifiez du contenu régulièrement et avez besoin de 300 crédits par mois maximum",
          "revenez à vos recherches sur plusieurs semaines avec 1 mois d'historique",
          "voulez la recherche approfondie et l'export CSV pour classer les questions dans un plan"
        ],
        next: "Pensez à Pro lorsque vous recherchez de nombreux termes à la fois ou voulez les résultats dans vos propres outils."
      },
      {
        name: "Pro",
        choose: "Choisissez Pro si vous",
        points: [
          "menez des recherches pour plusieurs clients ou sites, jusqu'à 1 000 crédits par mois",
          "avez besoin de recherches en masse, de l'accès API ou du serveur MCP",
          "conservez un an d'historique de recherche ou voulez des crédits à l'usage"
        ],
        next: "L'accès API, les recherches en masse et le serveur MCP sont réservés à Pro."
      }
    ],
    estimateLabel: "Estimer vos crédits :",
    estimate: "les crédits sont utilisés lorsque vous lancez des recherches. Pour choisir simplement, listez les termes que vous prévoyez de rechercher au cours d'un mois type, sur tous vos sites ou clients, et comparez avec les crédits mensuels de chaque formule. En cas de doute, commencer petit et évoluer ensuite est une approche raisonnable."
  },

  faq: {
    heading: "Questions fréquentes",
    items: [
      {
        title: "À quoi servent les crédits ?",
        desc: "Les crédits servent à lancer des recherches. Chaque formule inclut un quota mensuel : 100 pour Starter, 300 pour Lite et 1 000 pour Pro. Pour savoir comment une recherche donnée utilise les crédits, contactez-nous."
      },
      {
        title: "Puis-je changer de formule plus tard ?",
        desc: "Oui, vous pouvez modifier ou résilier votre abonnement. Si vous avez des questions sur l'effet d'un changement sur votre facturation, contactez-nous avant de changer."
      },
      {
        title: "Quelle formule inclut l'accès API ?",
        desc: "L'accès API est disponible uniquement avec la formule Pro, avec les recherches en masse, les crédits à l'usage et le serveur MCP. Il vous permet d'intégrer la recherche de questions à vos propres outils et processus."
      },
      {
        title: "Et si mes besoins dépassent la formule Pro ?",
        desc: "Contactez-nous via la page de contact et décrivez ce dont vous avez besoin. Nous vous dirons honnêtement ce qui est possible."
      },
      {
        title: "Une formule suit-elle les positions ou les citations IA ?",
        desc: "Non. GetTopQuestions est un outil de recherche de questions. Il vous aide à découvrir les questions que les gens posent pour créer du contenu utile. Il ne suit pas les positions, ne surveille pas les marques et n'indique pas de volumes de recherche."
      }
    ],
  },

  cta: {
    heading: "Prêt à découvrir les réponses ?",
    lead:
      "Partez d'un terme, trouvez les questions que les gens posent et décidez de ce que vous allez écrire ensuite.",
    primary: "Démarrez votre essai gratuit de 7 jours",
    secondary: "Contacter le service commercial",
  },
};
