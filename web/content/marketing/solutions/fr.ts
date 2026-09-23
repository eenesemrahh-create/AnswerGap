import type { SolutionsContent } from "./index";

/**
 * Solutions - traduction de la version anglaise `en.ts`.
 *
 * Ce fichier doit correspondre à l'anglais carte pour carte et puce pour
 * puce ; le type transforme tout écart en erreur de compilation. Les neuf
 * cartes décrivent à qui s'adresse le produit, pas des fonctionnalités
 * promises : les trois cartes de « l'avantage commun » restent formulées
 * autour de ce qui est réellement mesuré.
 */
export const fr: SolutionsContent = {
  title: "Solutions",
  description:
    "Comment les équipes SEO, les agences, les éditeurs et les marques " +
    "utilisent AnswerGap pour trouver les questions auxquelles la recherche " +
    "IA n'a pas encore répondu.",

  hero: {
    eyebrow: "Conçu pour toutes les équipes qui façonnent la découverte par l'IA",
    head: "Une seule plateforme. Plus de façons de gagner dans",
    headTinted: "la recherche IA.",
    headTail: "",
    lead:
      "AnswerGap aide les équipes à comprendre ce que les gens demandent, où " +
      "les réponses de l'IA sont insuffisantes, et ce qu'il faut créer pour " +
      "devenir la source que l'IA recommande.",
  },
  heroPrimary: "Commencer gratuitement",
  heroSecondary: "Voir les tarifs",

  teams: {
    eyebrow: "Solutions par équipe",
    heading: "Conçu autour de votre façon de travailler.",
    lead:
      "De la première recherche de catégorie à un programme de contenu " +
      "mondial, AnswerGap donne à chaque équipe une prochaine étape concrète.",
    cards: [
      {
        title: "Fondateurs de SaaS",
        desc:
          "Suivez la visibilité IA de votre SaaS et découvrez les questions " +
          "que les acheteurs posent avant de se décider.",
      },
      {
        title: "Startups",
        desc:
          "Faites-vous repérer tôt par l'IA et bâtissez votre autorité avant " +
          "que votre catégorie ne devienne saturée.",
      },
      {
        title: "Agences marketing",
        desc:
          "Rendez compte de la visibilité IA pour chaque client et " +
          "transformez les lacunes de citation en nouvelles opportunités de " +
          "campagne.",
      },
      {
        title: "Équipes SEO",
        desc:
          "Étendez le reporting SEO classique aux réponses de l'IA, aux " +
          "citations et à la demande de recherche conversationnelle.",
      },
      {
        title: "Équipes de contenu",
        desc:
          "Démontrez quels contenus génèrent de la visibilité IA et " +
          "priorisez les questions qui méritent le plus une réponse.",
      },
      {
        title: "E-commerce",
        desc:
          "Voyez quelles marques l'IA recommande et créez du contenu utile " +
          "pour les parcours de découverte produit.",
      },
      {
        title: "Marketing interne",
        desc:
          "Réunissez les équipes marque, contenu et recherche autour d'une " +
          "seule stratégie de visibilité IA mesurable.",
      },
      {
        title: "Grands comptes",
        desc:
          "Surveillez les sujets, les régions et les langues à grande " +
          "échelle tout en repérant les lacunes de votre portefeuille.",
      },
      {
        title: "Éditeurs et médias",
        desc:
          "Repérez les groupes de questions émergents et produisez une " +
          "couverture faisant autorité que les systèmes d'IA peuvent citer.",
      },
    ],
  },

  advantage: {
    eyebrow: "Un avantage commun",
    heading: "Passez des questions à une action mesurable.",
    cards: [
      {
        title: "Découvrez la demande réelle",
        desc:
          "Chaque question vient du bloc « Autres questions posées » de " +
          "Google lui-même, déployé en arbre plutôt qu'en liste : vous voyez " +
          "comment un sujet se ramifie vers le suivant.",
      },
      {
        title: "Repérez les lacunes de visibilité",
        desc:
          "Pour chaque question, nous récupérons les pages qui se " +
          "positionnent dessus et comptons combien y répondent réellement. " +
          "Peu de pages au-dessus du seuil, c'est l'ouverture — et c'est le " +
          "chiffre autour duquel ce produit est construit.",
      },
      {
        title: "Créez en toute confiance",
        desc:
          "Voyez quelles sources l'AI Overview de Google cite pour chaque " +
          "question, et si votre propre domaine en fait partie, avant de " +
          "décider quoi écrire.",
      },
    ],
  },
};
