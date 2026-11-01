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
  description: "Comment fondateurs, agences et équipes SEO et contenu utilisent GetTopQuestions pour découvrir les questions posées et planifier un contenu utile.",
  hero: {
    eyebrow: "Pour tous ceux qui décident de ce qu'il faut écrire ensuite",
    head: "Un terme. Plusieurs équipes.",
    headTinted: "De meilleures questions.",
    headTail: "",
    lead: "GetTopQuestions aide les équipes à découvrir les questions posées autour d'un terme, puis à en faire un contenu utile pour la recherche classique, les Google AI Overviews et la recherche conversationnelle."
  },
  heroPrimary: "Commencer gratuitement",
  heroSecondary: "Voir les tarifs",
  teams: {
    eyebrow: "Solutions par équipe",
    heading: "Conçu pour votre façon de travailler.",
    lead: "Chaque carte montre un terme illustratif, une question qu'il pourrait faire ressortir et le type de contenu qu'une équipe pourrait en tirer. Ces exemples sont rédigés par nous, ce ne sont pas des résultats de l'application.",
    questionLabel: "Exemple de question",
    ideaLabel: "Idée de contenu",
    cards: [
      {
        title: "Fondateurs SaaS",
        desc: "Découvrez les questions que se posent les acheteurs avant de s'inscrire et répondez-y sur votre site avec leurs mots.",
        term: "logiciel d'intégration des employés",
        question: "Que doit contenir une checklist d'intégration pour les recrues à distance ?",
        idea: "Une page de checklist pratique qui ne mentionne votre produit que là où il aide vraiment."
      },
      {
        title: "Startups",
        desc: "Couvrez tôt votre catégorie de façon utile, pour que de nouveaux publics trouvent chez vous des réponses claires.",
        term: "comptabilité carbone",
        question: "Les petites entreprises doivent-elles déclarer leurs émissions ?",
        idea: "Un article explicatif en langage simple, avec une section claire « ça dépend » selon la situation."
      },
      {
        title: "Agences marketing",
        desc: "Intégrez la recherche de questions aux lancements clients et transformez-la en propositions de contenu ancrées dans une vraie curiosité.",
        term: "panneaux solaires résidentiels",
        question: "En combien de temps des panneaux solaires sont-ils rentabilisés ?",
        idea: "Un brief prêt pour le client : un guide, trois réponses FAQ, un court script vidéo."
      },
      {
        title: "Équipes SEO",
        desc: "Ajoutez la recherche de questions au travail sur les mots-clés et planifiez des pages qui couvrent un sujet en profondeur pour la recherche et les réponses IA.",
        term: "renégociation de prêt immobilier",
        question: "Faut-il renégocier pour une petite baisse de taux ?",
        idea: "Restructurez une page existante avec des sous-titres sous forme de questions et des réponses directes."
      },
      {
        title: "Équipes contenu",
        desc: "Nourrissez votre planning éditorial avec les questions que vos lecteurs posent vraiment, et décidez lesquelles méritent un contenu.",
        term: "entretien des plantes d'intérieur",
        question: "Pourquoi les feuilles de ma monstera jaunissent-elles ?",
        idea: "Un guide de dépannage, plus une série de réponses courtes pour les réseaux sociaux."
      },
      {
        title: "E-commerce",
        desc: "Répondez aux questions d'avant-achat sur les pages produit, catégorie et guide pour aider les clients à se décider.",
        term: "poêle en fonte",
        question: "Peut-on utiliser du savon sur une poêle en fonte ?",
        idea: "Une section entretien sur la page produit et un guide de culottage plus long."
      },
      {
        title: "Marketing interne",
        desc: "Donnez à vos collègues marque, contenu et recherche une liste commune de questions clients.",
        term: "assurance voyage d'affaires",
        question: "L'assurance voyage couvre-t-elle les conférences annulées ?",
        idea: "Une bibliothèque de FAQ partagée par le blog, le centre d'aide et l'équipe commerciale."
      },
      {
        title: "Grandes marques",
        desc: "Explorez les sujets par région et par langue pour voir comment les questions changent d'un marché à l'autre.",
        term: "pompe à chaleur",
        question: "Les pompes à chaleur fonctionnent-elles par grand froid ?",
        idea: "Des réponses localisées par marché, relues par des experts régionaux."
      },
      {
        title: "Éditeurs et médias",
        desc: "Trouvez les questions que les lecteurs continuent de se poser autour d'un sujet et construisez une couverture utile et explicative.",
        term: "semaine de quatre jours",
        question: "La semaine de quatre jours réduit-elle le salaire ?",
        idea: "Un article explicatif qui répond aux questions qu'une actualité laisse ouvertes."
      }
    ]
  },
  advantage: {
    eyebrow: "Un avantage commun",
    heading: "Passez des questions au contenu utile.",
    cards: [
      {
        title: "Découvrez de vraies questions",
        desc: "Transformez un terme en questions associées les plus posées par les gens qui apprennent, comparent et décident.",
        bullets: [
          "Lisez les questions par intention",
          "Repérez les sous-sujets négligés",
          "Explorez plusieurs régions et langues"
        ]
      },
      {
        title: "Trouvez les manques de contenu",
        desc: "Comparez les questions avec ce que vous avez déjà publié et voyez où votre expertise peut aider.",
        bullets: [
          "Sélectionnez les questions auxquelles vous répondez bien",
          "Repérez les pages sans FAQ",
          "Choisissez ce qui mérite son propre contenu"
        ]
      },
      {
        title: "Créez en confiance",
        desc: "Donnez aux rédacteurs un point de départ fondé sur des questions pour chaque page, vidéo ou publication.",
        bullets: [
          "Planifiez à la main un contenu connecté",
          "Exportez les questions avec les formules compatibles",
          "Gardez votre propre voix"
        ]
      }
    ]
  },
  workflow: {
    heading: "Un processus simple pour un paysage de recherche en mutation.",
    lead: "Donnez à tous, des créateurs indépendants aux grandes équipes de recherche, le même point de départ simple : que demandent les gens ?",
    steps: [
      {
        title: "Saisissez un sujet",
        desc: "Partez d'un produit, d'une catégorie, d'un problème client ou d'un mot-clé stratégique."
      },
      {
        title: "Cartographiez les questions",
        desc: "GetTopQuestions fait ressortir les questions associées les plus posées autour de votre terme."
      },
      {
        title: "Saisissez l'opportunité",
        desc: "Choisissez les questions auxquelles vous répondez le mieux et créez un contenu utile avec votre propre voix."
      }
    ]
  },
  cta: {
    head: "Trouvez les questions que votre audience pose déjà.",
    lead: "Partez d'un terme et repartez avec une idée claire de ce qu'il faut écrire ensuite.",
    primary: "Commencer gratuitement",
    secondary: "Parlez-nous"
  }
};
