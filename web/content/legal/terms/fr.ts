import type { TermsContent } from "./index";

/**
 * Conditions d'utilisation - traduction de la version anglaise.
 *
 * La version qui fait foi est l'anglaise (voir l'article 1). Ce fichier doit
 * correspondre à `en.ts` clause par clause et puce par puce ; le type
 * transforme tout écart en erreur de compilation.
 */
export const fr: TermsContent = {
  title: "Conditions d'utilisation",
  description:
    "L'accord entre vous et AnswerGap concernant les comptes, les crédits, les remboursements et l'exactitude des scores de lacune.",
  lead: "Ces conditions régissent votre utilisation d'AnswerGap. Veuillez lire l'article 6, qui explique ce que sont et ne sont pas nos scores de lacune.",
  effective: "2026-09-20",

  sections: {
    parties: {
      heading: "1. Avec qui vous contractez",
      body: [
        {
          p: "AnswerGap est exploité par {company}, une {entity} de l'État de {state}, États-Unis. Dans ces conditions, « nous » désigne {company} ; « vous » désigne la personne ou l'organisation qui utilise le service.",
        },
        {
          p: "En créant un compte ou en utilisant le service, vous acceptez ces conditions. Si vous ne les acceptez pas, n'utilisez pas le service.",
        },
        {
          p: "Ces conditions sont publiées en plusieurs langues. La version qui fait foi est l'anglaise : si une traduction s'en écarte, le texte anglais prévaut.",
        },
      ],
    },

    service: {
      heading: "2. Ce que fait le service",
      body: [
        {
          p: "AnswerGap déploie les questions que Google affiche sous « Autres questions posées » en un arbre de questions, examine les résultats de recherche derrière chaque question et estime lesquelles ne sont bien traitées par aucune page.",
        },
        {
          p: "Le service est en développement actif. Les fonctionnalités peuvent changer, et certaines sont proposées en avant-première avant d'être achevées.",
        },
      ],
    },

    accounts: {
      heading: "3. Comptes",
      body: [
        {
          p: "Un compte est nécessaire pour enregistrer votre travail et dépenser des crédits. Un compte par personne.",
        },
        {
          ul: [
            "Indiquez une adresse e-mail dont vous disposez. Vous devez la confirmer avant de pouvoir dépenser des crédits.",
            "Gardez vos identifiants pour vous. Vous êtes responsable de ce qui se passe sous votre compte.",
            "Prévenez-nous sans délai si vous pensez qu'une autre personne a utilisé votre compte.",
          ],
        },
        {
          p: "Nous pouvons suspendre un compte qui enfreint ces conditions et refuser le service.",
        },
      ],
    },

    credits: {
      heading: "4. Crédits, packs et abonnements",
      body: [
        {
          p: "Le travail sur AnswerGap se paie en crédits. Un crédit est consommé lorsque nous adressons, pour votre compte, une requête payante à un fournisseur de données de recherche.",
        },
        {
          ul: [
            "Une recherche coûte un crédit. Les résultats déjà récupérés et mis en cache sont gratuits — les rouvrir ne coûte rien.",
            "Vérifier une question précise est facturé séparément de la découverte de questions, car chaque vérification nous coûte une requête de recherche distincte.",
            "Les crédits peuvent être vendus en packs ponctuels ou inclus dans un abonnement récurrent. Le prix, le nombre de crédits et la durée éventuelle de l'abonnement sont affichés avant le paiement.",
            "Les crédits d'un pack n'expirent pas tant que votre compte est actif.",
            "Une requête qui échoue de notre côté n'est pas facturée.",
          ],
        },
        {
          p: "Tant que le service est en avant-première, rien n'est vendu : les crédits sont attribués à la main et ne sont pas achetables. Cet article décrit ce qui s'appliquera à l'ouverture de la vente.",
        },
      ],
    },

    refunds: {
      heading: "5. Remboursement et résiliation",
      body: [
        {
          p: "Rien n'est vendu pendant l'avant-première, il n'y a donc encore rien à rembourser. À l'ouverture de la vente, ce qui suit s'appliquera.",
        },
        {
          ul: [
            "Les crédits de pack non utilisés peuvent être remboursés dans les 14 jours suivant l'achat. Les crédits déjà dépensés ne sont pas remboursés, car le coût de ces recherches a été engagé auprès de notre fournisseur de données et ne peut être récupéré.",
            "Un abonnement peut être résilié à tout moment. Il court jusqu'à la fin de la période déjà payée ; nous ne remboursons pas les périodes partielles.",
            "Si le service ne fournit pas ce que vous avez payé — une recherche en échec de notre côté, ou un débit en double —, dites-le-nous et nous corrigerons.",
          ],
        },
        {
          p: "Pour demander un remboursement, écrivez à {email} en indiquant l'adresse e-mail du compte et la date du paiement. Nous répondons sous cinq jours ouvrés.",
        },
      ],
    },

    accuracy: {
      heading: "6. Exactitude — merci de lire cet article",
      body: [
        {
          p: "Les scores de lacune sont des estimations. Ce ne sont ni des faits ni des conseils.",
        },
        {
          p: "Un score de lacune est obtenu en comparant une question aux titres et aux adresses de résultats de recherche publics au moyen d'une méthode automatique. Cette méthode est en développement actif et il faut s'attendre à ce qu'elle se trompe dans une proportion notable des cas. Nous préférons le dire ici plutôt que de laisser croire à une précision que nous ne pouvons pas démontrer aujourd'hui.",
        },
        {
          ul: [
            "Les volumes de recherche, lorsqu'ils sont affichés, sont des estimations de tiers et sont signalés comme telles.",
            "Les résultats reflètent ce que le moteur a renvoyé au moment où nous les avons récupérés. Chaque résultat porte sa date de récupération, et nous ne présentons jamais les données comme étant en direct.",
            "Une question que nous n'avons pas vérifiée est affichée comme inconnue, non comme une lacune. Inconnu n'est pas synonyme de sans réponse.",
            "Rien dans le service ne garantit un classement dans les moteurs, un volume de trafic ou un résultat commercial.",
          ],
        },
        {
          p: "Les décisions que vous prenez sur la base de ces scores sont les vôtres. Traitez le résultat comme un point de départ pour votre jugement, et non comme un substitut.",
        },
      ],
    },

    sources: {
      heading: "7. D'où viennent les données",
      body: [
        {
          p: "Les résultats sont dérivés de résultats de recherche accessibles au public, obtenus via des fournisseurs tiers. Nous ne contrôlons pas les moteurs dont ils proviennent et ne pouvons garantir que les données soient disponibles, complètes ou exactes.",
        },
        {
          p: "Si un fournisseur modifie ce qu'il renvoie, ou cesse de le renvoyer, des parties du service peuvent changer ou cesser de fonctionner.",
        },
      ],
    },

    use: {
      heading: "8. Usage acceptable",
      body: [
        { p: "Vous ne devez pas :" },
        {
          ul: [
            "revendre ou rediffuser les données brutes de résultats comme s'il s'agissait de votre propre jeu de données ;",
            "accéder au service par des moyens automatisés au-delà des crédits que vous détenez ;",
            "contourner les limites de crédits, la franchise quotidienne gratuite ou toute autre restriction ;",
            "sonder, scanner ou perturber le service, ni tenter d'atteindre des données qui ne sont pas les vôtres ;",
            "utiliser le service de manière illicite ou en portant atteinte aux droits d'autrui.",
          ],
        },
        {
          p: "Les rapports et analyses que vous produisez pour vous-même ou votre clientèle vous appartiennent. La restriction porte sur la rediffusion des données sous-jacentes en tant que produit.",
        },
      ],
    },

    content: {
      heading: "9. Vos contenus",
      body: [
        {
          p: "Les mots-clés et questions que vous saisissez restent les vôtres. Vous nous accordez l'autorisation nécessaire pour effectuer des recherches à partir d'eux, conserver les résultats et exploiter le corpus de questions partagé décrit dans notre Politique de confidentialité.",
        },
        {
          p: "Notez que les questions et leurs scores sont conservés dans un corpus partagé par l'ensemble de la clientèle, et non dans une copie privée par compte. Notre Politique de confidentialité explique précisément ce que cela expose et ce que cela n'expose pas.",
        },
        {
          link: {
            text: "Lire la Politique de confidentialité",
            href: "/privacy",
          },
        },
      ],
    },

    availability: {
      heading: "10. Disponibilité",
      body: [
        {
          p: "Le service est proposé en l'état, en avant-première, sans engagement de disponibilité. Nous pouvons modifier, suspendre ou arrêter toute partie de celui-ci.",
        },
        {
          p: "Nous préviendrons dans un délai raisonnable avant de retirer quelque chose que vous avez payé, et rembourserons les crédits que vous ne pourrez alors pas utiliser.",
        },
      ],
    },

    liability: {
      heading: "11. Exclusion et limitation de responsabilité",
      body: [
        {
          p: "Dans toute la mesure permise par la loi, le service est fourni « en l'état » et « selon disponibilité », sans garantie d'aucune sorte, expresse ou implicite, y compris d'adéquation à un usage particulier et d'absence de contrefaçon.",
        },
        {
          p: "Dans toute la mesure permise par la loi, notre responsabilité totale découlant du service ou s'y rapportant est limitée au montant que vous nous avez versé au cours des douze mois précédant le fait générateur. Nous ne répondons pas des pertes de bénéfices, de revenus ou de données, ni des dommages indirects ou consécutifs.",
        },
        {
          p: "Rien dans ces conditions n'exclut ni ne limite une responsabilité qui ne peut légalement l'être, y compris la responsabilité pour dol.",
        },
      ],
    },

    termination: {
      heading: "12. Fin de l'accord",
      body: [
        {
          p: "Vous pouvez fermer votre compte à tout moment depuis les paramètres du compte ou en écrivant à {email}. Notre Politique de confidentialité explique ce qui est supprimé et ce qui est conservé.",
        },
        {
          p: "Nous pouvons suspendre ou mettre fin à votre accès en cas de manquement à ces conditions. Lorsque l'accès prend fin pour un manquement, les crédits non utilisés ne sont pas remboursés.",
        },
      ],
    },

    changes: {
      heading: "13. Modifications de ces conditions",
      body: [
        {
          p: "Nous pouvons mettre à jour ces conditions. La date en haut de cette page indique leur dernière modification, et nous informerons par e-mail les titulaires de compte des changements qui les affectent de manière substantielle.",
        },
        {
          p: "Continuer à utiliser le service après une modification vaut acceptation des conditions mises à jour.",
        },
      ],
    },

    law: {
      heading: "14. Droit applicable",
      body: [
        {
          p: "Ces conditions sont régies par le droit de l'État de {state}, États-Unis, à l'exclusion de ses règles de conflit de lois. Les tribunaux de {state} ont compétence exclusive pour tout litige, étant entendu que chaque partie peut solliciter des mesures conservatoires devant toute juridiction compétente.",
        },
      ],
    },

    contact: {
      heading: "15. Contact",
      body: [
        { p: "Questions relatives à ces conditions :" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
        { p: "{company}, {state}, États-Unis." },
      ],
    },
  },
};
