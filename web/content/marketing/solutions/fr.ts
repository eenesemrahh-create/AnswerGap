import type { SolutionsContent } from "./index";

/**
 * Solutions - traduction de la version anglaise `en.ts`.
 *
 * Ce fichier doit correspondre à l'anglais carte pour carte et puce pour
 * puce ; le type transforme tout écart en erreur de compilation. Les neuf
 * cartes décrivent à qui s'adresse le produit, pas des fonctionnalités
 * promises.
 *
 * LES PUCES DE « L'AVANTAGE COMMUN » NE SONT PAS TOUTES VRAIES AUJOURD'HUI.
 * Elles sont traduites de l'anglais, qui porte le même avertissement :
 * l'exploration par intention, l'export des données et le suivi dans le
 * temps restent à construire.
 *
 * Les étapes du flux de travail et la bannière de clôture décrivent ce que
 * le produit fait déjà.
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
          "Transformez un seul sujet en l'ensemble des questions liées que " +
          "les gens posent tout au long de leur parcours de décision.",
        bullets: [
          "Explorez les questions par intention",
          "Repérez les groupes de sujets négligés",
          "Étudiez chaque marché et chaque langue",
        ],
      },
      {
        title: "Repérez les lacunes de visibilité",
        desc:
          "Voyez où les réponses actuelles sont faibles, incomplètes ou " +
          "absentes — et où votre expertise peut aider.",
        bullets: [
          "Priorisez les questions à fort potentiel",
          "Comprenez la couverture des réponses",
          "Détectez les angles morts de vos concurrents",
        ],
      },
      {
        title: "Créez en toute confiance",
        desc:
          "Donnez aux équipes contenu et SEO un brief clair et étayé par des " +
          "données pour chaque page qu'elles produisent.",
        bullets: [
          "Construisez des plans de contenu reliés entre eux",
          "Exportez les données vers votre flux de travail",
          "Mesurez vos progrès dans le temps",
        ],
      },
    ],
  },

  workflow: {
    head: "Un flux de travail simple pour",
    headTinted: "un paysage de recherche en mutation",
    headTail: ".",
    lead:
      "Donnez à tous — des fondateurs aux équipes de recherche des grands " +
      "comptes — la même vision claire de la demande et des opportunités.",
    steps: [
      {
        title: "Saisissez un sujet",
        desc:
          "Partez d'un produit, d'une catégorie, d'un problème client ou " +
          "d'un mot-clé stratégique.",
      },
      {
        title: "Cartographiez les questions",
        desc:
          "AnswerGap révèle les recherches associées et les lacunes des " +
          "réponses IA existantes.",
      },
      {
        title: "Agissez sur l'opportunité",
        desc:
          "Priorisez, exportez et créez des contenus conçus pour devenir une " +
          "source de référence.",
      },
    ],
  },

  cta: {
    head: "Trouvez les lacunes dans lesquelles votre audience cherche déjà.",
    lead:
      "Partez d'un sujet et transformez la demande réelle de la recherche IA " +
      "en une stratégie de visibilité ciblée.",
    primary: "Commencer gratuitement",
    secondary: "Contactez-nous",
  },
};
