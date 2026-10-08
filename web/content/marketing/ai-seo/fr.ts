import type { AiSeoShape } from "../blocks";

/**
 * French AI SEO copy. Shape, sources of every figure and the reasoning are in
 * `en.ts`.
 */
export const fr = {
  title: "SEO IA : être cité dans l'AI Overview de Google",
  description:
    "Google répond désormais à de nombreuses questions avec un AI Overview " +
    "qui cite quelques sources. Voyez quelles questions les gens posent, " +
    "lesquelles n'ont aucune page de réponse, et quels sites l'IA cite, dont " +
    "le vôtre.",

  hero: {
    eyebrow: "SEO IA",
    head: "Devenez la source que",
    headTinted: "la recherche IA cite.",
    headTail: "",
    lead:
      "Google répond désormais à de nombreuses questions avec un AI Overview " +
      "et cite quelques sources à côté. AnswerGap montre ce que les gens " +
      "demandent, quelles questions n'ont aucune page qui y réponde vraiment, " +
      "et quels sites l'IA cite, dont le vôtre.",
  },
  heroPrimary: "Commencer gratuitement",
  heroSecondary: "Voir comment ça marche",

  shift: {
    eyebrow: "Ce qui a changé",
    heading: "La réponse passe désormais avant les liens.",
    lead:
      "La recherche, c'était dix liens bleus. Aujourd'hui, une réponse rédigée " +
      "par l'IA les surplombe, et c'est elle qui décide quels rares sites sont " +
      "cités.",
    cards: [
      {
        figure: "32 / 32",
        title: "Des réponses People Also Ask rédigées par l'IA",
        desc:
          "Dans un échantillon collecté pendant la conception du produit, les " +
          "32 réponses People Also Ask développées étaient toutes un AI " +
          "Overview, et non l'extrait d'une page.",
      },
      {
        figure: "13 / 16",
        title: "L'IA cite ses sources",
        desc:
          "Sur un sujet de blanchiment des dents, l'AI Overview de Google a " +
          "cité des sources pour 13 des 16 questions vérifiées. Ces quelques " +
          "liens sont la nouvelle première page.",
      },
      {
        figure: "Au-dessus du n° 1",
        title: "Le suivi de position ne le voit pas",
        desc:
          "Un outil de suivi de position indique votre rang dans la liste. Il " +
          "ne dit pas si la réponse placée au-dessus de la liste vous cite, " +
          "alors que c'est elle que l'on lit en premier.",
      },
    ],
  },

  product: {
    eyebrow: "Ce que mesure AnswerGap",
    heading: "D'un mot-clé à une liste d'occasions à saisir.",
    lead:
      "Trois éléments, lus dans les mêmes résultats Google, affichés côte à " +
      "côte pour chaque question de l'arbre.",
    points: [
      {
        title: "Ce que les gens demandent",
        desc:
          "Une recherche ouvre la chaîne People Also Ask de Google : environ " +
          "15 questions, sur cinq niveaux, dans le pays et la langue de votre " +
          "choix.",
      },
      {
        title: "Les questions auxquelles personne ne répond",
        desc:
          "Nous lisons les résultats de recherche d'une question et comptons " +
          "les pages qui la visent réellement. Peu ou aucune, c'est une " +
          "lacune : une question que vous pouvez faire vôtre. Chaque " +
          "verdict affiche ses preuves.",
      },
      {
        title: "Qui l'IA cite, et si c'est vous",
        desc:
          "Chaque question vérifiée liste les sites cités par l'AI Overview de " +
          "Google. Saisissez votre domaine pour voir où vous êtes cité, et où " +
          "c'est un concurrent à votre place.",
      },
    ],
    demo: {
      badge: "Exemple",
      seed: "blanchiment des dents",
      pagesLabel: "{matching} pages sur {checked} la visent",
      rows: [
        {
          question: "Les dentistes recommandent-ils le blanchiment des dents ?",
          status: "gap",
          label: "Sans réponse",
          matching: 0,
          checked: 8,
          ai: "AI 4",
          you: false,
        },
        {
          question: "Qu'est-ce qui blanchit les dents le plus vite ?",
          status: "weak",
          label: "À peine traitée",
          matching: 1,
          checked: 7,
          ai: "AI 6",
          you: false,
        },
        {
          question: "Combien coûte un blanchiment des dents ?",
          status: "covered",
          label: "Bien traitée",
          matching: 6,
          checked: 8,
          ai: "AI 5 · vous",
          you: true,
        },
      ],
      note:
        "À titre d'illustration. Un vrai résultat liste chaque page lue et " +
        "chaque site cité par l'IA.",
    },
  },

  playbook: {
    head: "Une méthode pour",
    headTinted: "la recherche IA",
    headTail: ".",
    lead:
      "Quatre étapes, à répéter. L'arbre indique par où commencer ; une " +
      "nouvelle recherche indique si cela a fonctionné.",
    steps: [
      {
        title: "Recherchez votre sujet",
        desc:
          "Partez des mots que vos clients emploient. Une recherche coûte un " +
          "crédit, et les sources de l'AI Overview sont incluses.",
      },
      {
        title: "Choisissez les lacunes",
        desc:
          "Triez le tableau par nombre de pages visant chaque question. Les " +
          "moins servies d'abord : c'est là que manque une réponse.",
      },
      {
        title: "Voyez qui l'IA cite",
        desc:
          "Saisissez votre domaine. Les questions où l'IA cite un concurrent " +
          "et pas vous forment votre deuxième liste.",
      },
      {
        title: "Rédigez la réponse, puis relancez la recherche",
        desc:
          "Publiez une page qui répond directement à la question, puis " +
          "relancez la recherche. Chaque résultat est daté, vous pouvez donc " +
          "comparer.",
      },
    ],
  },

  citable: {
    eyebrow: "Écrire pour les réponses de l'IA",
    heading: "Ce qui rend une page facile à citer.",
    lead:
      "Personne en dehors de Google ne sait exactement comment l'AI Overview " +
      "choisit ses sources. Ces habitudes rendent une réponse facile à " +
      "trouver, à citer et à croire, ce qui profite de toute façon aux " +
      "lecteurs.",
    cards: [
      {
        title: "Répondre dès la première phrase",
        desc:
          "Placez la réponse directe juste sous le titre, puis développez. " +
          "Une réponse enfouie au quatrième paragraphe est difficile à citer.",
      },
      {
        title: "Utiliser la question comme titre",
        desc:
          "Formulez les titres comme les gens posent la question. C'est ainsi " +
          "qu'elle apparaît déjà dans People Also Ask.",
      },
      {
        title: "Une question, une section",
        desc:
          "Donnez à chaque question sa propre section, bien délimitée, pour " +
          "qu'un passage garde son sens lorsqu'il est extrait seul.",
      },
      {
        title: "Couvrir les questions suivantes",
        desc:
          "L'arbre montre ce que les gens demandent ensuite. Répondre aux " +
          "questions qui en découlent fait de votre page la source complète, " +
          "et non l'une parmi d'autres.",
      },
      {
        title: "Montrer vos preuves",
        desc:
          "Des chiffres, des sources nommées et un auteur identifié. Une " +
          "affirmation précise inspire plus confiance qu'une affirmation " +
          "générale.",
      },
      {
        title: "Dater et tenir à jour",
        desc:
          "Indiquez la date de dernière mise à jour, et revoyez la page " +
          "lorsque les questions de votre arbre évoluent.",
      },
    ],
  },

  limits: {
    eyebrow: "En toute franchise",
    heading: "Ce que nous ne prétendons pas.",
    lead:
      "La recherche IA est récente, et beaucoup d'outils y vendent une " +
      "certitude que personne n'a. Voici exactement ce qu'AnswerGap mesure, " +
      "et ce qu'il ne mesure pas.",
    items: [
      {
        title: "Google uniquement, pour l'instant",
        desc:
          "Nous lisons l'AI Overview de Google. ChatGPT, Claude et Perplexity " +
          "ne sont pas mesurés, et personne ne peut vous vendre leurs vrais " +
          "volumes de requêtes.",
      },
      {
        title: "Un instantané, pas du direct",
        desc:
          "Chaque résultat porte l'heure à laquelle il a été récupéré. Les " +
          "résultats de Google évoluent ; relancez la recherche pour " +
          "actualiser.",
      },
      {
        title: "Le verdict de lacune est une estimation",
        desc:
          "Il est calculé à partir des pages lues et sera parfois erroné. Les " +
          "preuves sont toujours affichées, et vous pouvez marquer n'importe " +
          "quel verdict comme juste ou faux.",
      },
      {
        title: "Aucune citation garantie",
        desc:
          "Personne ne peut promettre qu'une IA vous citera. Nous montrons où " +
          "se trouve l'ouverture ; la réponse, c'est à vous de l'écrire.",
      },
    ],
  },

  faq: {
    heading: "Le SEO IA en bref",
    items: [
      {
        title: "Qu'est-ce que le SEO IA ?",
        desc:
          "Le SEO IA, aussi appelé GEO (generative engine optimization) ou " +
          "AEO (answer engine optimization), consiste à faire utiliser et " +
          "citer vos contenus dans les réponses rédigées par l'IA, comme l'AI " +
          "Overview de Google, et pas seulement à les classer dans les liens " +
          "situés dessous.",
      },
      {
        title: "Le SEO IA est-il différent du SEO classique ?",
        desc:
          "Il s'appuie dessus. Les réponses de l'IA puisent dans des pages que " +
          "les moteurs de recherche savent déjà trouver : l'exploration et " +
          "la qualité comptent donc toujours. Ce qui change, c'est la cible : " +
          "une réponse claire et citable à une question précise, plutôt " +
          "qu'une page positionnée sur un mot-clé.",
      },
      {
        title: "Quels moteurs d'IA AnswerGap suit-il ?",
        desc:
          "L'AI Overview de Google, lu dans les mêmes résultats de recherche " +
          "que ceux qui servent à trouver les lacunes. Les autres assistants " +
          "ne sont pas suivis aujourd'hui.",
      },
      {
        title: "Comment AnswerGap décide-t-il qu'une question est une lacune ?",
        desc:
          "Pour chaque question, nous récupérons les résultats de recherche et " +
          "comparons chaque page à la question, puis nous comptons les pages " +
          "qui la visent réellement. Peu ou aucune, c'est une lacune. C'est " +
          "une estimation, et les pages qui la fondent sont toujours " +
          "affichées.",
      },
      {
        title: "Combien ça coûte ?",
        desc:
          "Chaque recherche coûte un crédit, et les sources de l'AI Overview " +
          "sont incluses sans frais supplémentaires. Rouvrir un résultat que " +
          "vous avez déjà est gratuit.",
      },
    ],
  },

  cta: {
    head: "Trouvez les questions auxquelles l'IA répond sans vous.",
    lead:
      "Recherchez un sujet et voyez d'un seul coup d'œil les lacunes et les " +
      "sites que l'IA cite.",
    primary: "Commencer gratuitement",
    secondary: "Voir les tarifs",
  },
} as const satisfies AiSeoShape;
