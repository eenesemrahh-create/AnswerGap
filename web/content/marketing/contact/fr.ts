import type { ContactContent } from "./index";

/**
 * Page de contact - traduction de la version anglaise. Doit correspondre à
 * `en.ts` champ par champ ; le type en fait une erreur de compilation.
 */
export const fr: ContactContent = {
  title: "Contact",
  description:
    "Des questions sur les formules, la configuration ou la façon de transformer la recherche de questions en contenu ? Écrivez à l'équipe GetTopQuestions.",

  hero: {
    eyebrow: "Contact",
    head: "Des questions sur",
    headTinted: "GetTopQuestions",
    headTail: " ? Demandez-nous.",
    lead: "Que vous choisissiez une formule, connectiez l'API Pro ou cherchiez comment transformer la recherche de questions en contenu, écrivez-nous."
  },

  reasons: [
    {
      title: "Grandes équipes",
      desc: "Dites-nous combien de termes, de sites ou de clients vous recherchez et nous verrons ensemble ce qui convient."
    },
    {
      title: "Support technique",
      desc: "De l'aide pour votre compte, les exports et la configuration de l'API ou de MCP avec la formule Pro."
    },
    {
      title: "Partenariats et retours",
      desc: "Des idées, des propositions de partenariat ou des retours sur la place de la recherche de questions dans votre travail."
    }
  ],

  before: {
    heading: "Avant d'écrire",
    intro: "Quelques détails nous aident à donner une réponse utile dès la première fois :",
    items: [
      "Les termes ou sujets que vous recherchez",
      "La formule que vous utilisez ou envisagez",
      "Pour les questions sur l'API, les recherches en masse ou MCP : ce que vous voulez y connecter",
      "Pour les questions de facturation ou de compte : l'e-mail utilisé à l'inscription"
    ],
    pricingLead: "Vous comparez les formules ? La ",
    pricingLink: "page des tarifs",
    pricingTail: " liste chaque fonctionnalité par formule.",
    solutionsLead: " Vous vous demandez comment d'autres équipes utilisent la recherche de questions ? Consultez ",
    solutionsLink: "solutions",
    solutionsTail: "."
  },

  form: {
    name: "Nom complet",
    namePlaceholder: "Jeanne Dupont",
    email: "Adresse e-mail",
    emailPlaceholder: "jeanne@exemple.com",
    company: "Entreprise (facultatif)",
    companyPlaceholder: "Acme SARL",
    subject: "Objet",
    subjectPlaceholder: "Comment pouvons-nous vous aider ?",
    message: "Message",
    messagePlaceholder: "Parlez-nous un peu de vos besoins…",
    submit: "Envoyer le message",
    sending: "Envoi…",
    sent: "Merci — votre message est en route.",
    sentDetail:
      "Nous lisons chaque message et répondons généralement sous deux jours ouvrés.",
    failed: "L'envoi a échoué. Réessayez, ou écrivez-nous directement.",
    tooMany:
      "Cela fait beaucoup de messages depuis un même endroit. Réessayez plus tard.",
  },
};
