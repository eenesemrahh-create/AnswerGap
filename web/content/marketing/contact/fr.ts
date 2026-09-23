import type { ContactContent } from "./index";

/**
 * Contact - traduction de la version anglaise `en.ts`.
 *
 * Ce fichier doit correspondre à l'anglais champ pour champ ; le type
 * transforme tout écart en erreur de compilation. `form.privacy` est une
 * promesse : si le formulaire cesse un jour de se contenter d'envoyer un
 * e-mail sans rien conserver, cette phrase est la première à changer.
 */
export const fr: ContactContent = {
  title: "Contact",
  description:
    "Échangez avec l'équipe AnswerGap à propos des volumes grands comptes, " +
    "de l'accès à l'API ou de tout autre sujet lié à la visibilité dans la " +
    "recherche IA.",

  hero: {
    eyebrow: "Contactez-nous",
    head: "Façonnons votre",
    headTinted: "visibilité IA",
    headTail: "ensemble.",
    lead:
      "Que vous envisagiez un déploiement à l'échelle de l'entreprise, que " +
      "vous cherchiez un accompagnement technique sur notre API ou que vous " +
      "ayez simplement une question stratégique sur la recherche générative, " +
      "notre équipe est prête à vous aider.",
  },

  reasons: [
    {
      title: "Solutions grands comptes",
      desc:
        "Volume de données sur mesure, support prioritaire et stratégie " +
        "personnalisée pour les grandes marques.",
    },
    {
      title: "Support technique",
      desc:
        "Faites-vous aider pour intégrer nos analyses à vos tableaux de bord " +
        "SEO et à vos processus existants.",
    },
    {
      title: "Partenariats stratégiques",
      desc:
        "Rejoignez-nous pour dessiner l'avenir de la découverte des marques " +
        "dans les moteurs génératifs.",
    },
  ],

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
    privacy:
      "Nous utilisons ce que vous envoyez ici pour vous répondre, et rien " +
      "d'autre. C'est transmis par e-mail à notre boîte d'assistance et n'est " +
      "pas conservé sur ce site.",
  },
};
