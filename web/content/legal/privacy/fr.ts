import type { PrivacyContent } from "./index";

/** Politique de confidentialité - traduction de la version anglaise, qui fait foi. */
export const fr: PrivacyContent = {
  title: "Politique de confidentialité",
  description:
    "Ce qu'AnswerGap collecte, qui d'autre le reçoit, ce qui reste invisible aux autres clients et ce qui subsiste après la suppression de votre compte.",
  lead: "Voici ce que nous collectons et pourquoi, avec la clarté que nous attendrions nous-mêmes. L'article 5 traite de ce que les autres peuvent voir ou non ; l'article 7, de ce que la suppression de votre compte efface et de ce qu'elle laisse.",
  effective: "2026-09-20",

  sections: {
    scope: {
      heading: "1. Qui est concerné",
      body: [
        {
          p: "Cette politique couvre AnswerGap sur {site}, exploité par {company} aux États-Unis. {company} décide comment et pourquoi les données décrites ici sont traitées.",
        },
        {
          p: "Cette politique est publiée en plusieurs langues. La version qui fait foi est l'anglaise ; si une traduction s'en écarte, le texte anglais prévaut.",
        },
      ],
    },

    collect: {
      heading: "2. Ce que nous collectons",
      body: [
        { p: "Si vous créez un compte :" },
        {
          ul: [
            "Votre adresse e-mail — saisie à l'inscription, ou fournie par Google si vous vous connectez avec Google.",
            "Votre nom, si vous en indiquez un, ou celui de votre profil Google. C'est facultatif.",
            "Un lien vers votre photo de profil Google, si vous vous connectez avec Google. Nous conservons le lien, pas une copie de l'image.",
            "Une empreinte de votre mot de passe, si vous vous êtes inscrit par e-mail. Nous ne conservons jamais le mot de passe lui-même.",
            "L'état de votre compte et les dates de création, de dernière visite et de confirmation.",
          ],
        },
        { p: "Au fil de votre utilisation :" },
        {
          ul: [
            "Les mots-clés et questions que vous recherchez. Ils sont conservés rattachés à votre compte ou, si vous êtes déconnecté, à un identifiant aléatoire gardé dans votre navigateur.",
            "Les questions que vous nous avez demandé de vérifier et les résultats de recherche que nous avons récupérés pour elles.",
            "Un registre de chaque crédit ajouté ou dépensé sur votre compte, et de son motif.",
            "Des relevés d'usage : ce qui a été fait, si cela a réussi ou été refusé, combien de crédits cela a consommé et ce que cela nous a coûté.",
          ],
        },
        {
          p: "Nous ne conservons pas votre adresse IP. Nous en dérivons une empreinte cryptographique salée et tronquée, et ne conservons que celle-ci, afin de compter la recherche quotidienne gratuite et d'empêcher les abus. L'adresse elle-même n'existe que le temps du traitement de la requête et n'est consignée nulle part ; l'empreinte étant salée avec un secret que nous pouvons changer, les valeurs conservées peuvent être rendues inexploitables à volonté. Notre hébergeur tient ses propres journaux de connexion, hors de notre contrôle.",
        },
      ],
    },

    storage: {
      heading: "3. Cookies et ce que garde votre navigateur",
      body: [
        {
          p: "Le site AnswerGap ne dépose aucun cookie. Il n'y a ni outil de mesure d'audience, ni gestionnaire de balises, ni script tiers d'aucune sorte. Les polices sont servies depuis notre propre domaine plutôt que demandées ailleurs.",
        },
        {
          p: "Votre navigateur conserve localement, sur votre appareil, quelques valeurs que nous ne pouvons pas lire à distance :",
        },
        {
          ul: [
            "Votre session, pendant quatorze jours. La déconnexion l'efface.",
            "Un identifiant aléatoire qui compte la recherche quotidienne gratuite pour les visiteurs non connectés.",
            "Votre préférence de thème clair ou sombre.",
            "La langue de l'interface.",
            "Votre préférence de pays et de langue pour les recherches.",
            "L'adresse de votre propre site, si vous en avez saisi une pour vérifier si elle est citée. Celle-ci ne nous parvient jamais — la comparaison se fait dans votre navigateur.",
          ],
        },
        {
          p: "Notre outil d'administration interne utilise un cookie de session. La clientèle ne le rencontre jamais.",
        },
      ],
    },

    processors: {
      heading: "4. Qui d'autre reçoit des données",
      body: [
        { p: "Nous recourons à peu de prestataires et n'envoyons à chacun que le nécessaire :" },
        {
          ul: [
            "Notre fournisseur de données de recherche reçoit le mot-clé ou le texte de la question. Il ne reçoit ni votre e-mail, ni votre adresse IP, ni aucun identifiant de compte.",
            "Notre fournisseur de correspondance sémantique, lorsque cette fonction est active, reçoit le texte des questions ainsi que les titres et adresses des résultats. Il ne reçoit aucun identifiant.",
            "Notre fournisseur d'e-mail reçoit votre adresse et le message, afin que les courriers de vérification et de réinitialisation puissent être remis.",
            "Notre prestataire de paiement reçoit ce que vous saisissez sur sa propre page de paiement.",
            "Google ne reçoit rien au-delà de l'échange de connexion, et seulement si vous choisissez de vous connecter avec Google.",
            "Notre hébergeur fait tourner le service ; notre fournisseur de messagerie conserve ce que vous écrivez au support.",
          ],
        },
        {
          p: "Les numéros de carte ne nous parviennent jamais. La page de paiement est hébergée par le prestataire de paiement, et nous ne gardons que l'enregistrement du paiement qu'il nous renvoie.",
        },
        {
          p: "Nous ne vendons pas vos données et ne les partageons pas à des fins publicitaires.",
        },
      ],
    },

    sharing: {
      heading: "5. Ce qui reste invisible aux autres — et ce qui ne l'est pas",
      body: [
        {
          p: "Cela mérite une réponse franche plutôt que rassurante, car la conception est délibérée.",
        },
        {
          ul: [
            "Votre liste de recherches est privée. Personne d'autre ne peut voir quels mots vous avez recherchés ni ouvrir vos analyses enregistrées. Demander une analyse qui n'est pas la vôtre renvoie « introuvable » et non « interdit », car l'existence même d'une recherche est déjà une information.",
            "Les données de questions sont communes. Les questions, leurs scores, les résultats en cache et les verdicts de lacune vivent dans un corpus partagé par tous, et non dans une copie privée par compte. Si une autre personne et vous recherchez le même mot, vous voyez le même arbre, et la seconde recherche ne coûte rien puisque la première l'a déjà payée. C'est ce qui garde le service abordable.",
            "Les verdicts donnés via les boutons « est-ce vraiment une lacune ? » sont enregistrés sans lien avec votre compte et servent à améliorer le fonctionnement du score.",
            "Si vous êtes déconnecté, l'accès à vos propres analyses repose sur l'identifiant aléatoire du navigateur. Cela les tient à l'écart des inconnus, mais ce n'est pas une protection cryptographique : videz le stockage du navigateur et vous en perdez l'accès.",
          ],
        },
      ],
    },

    why: {
      heading: "6. Sur quoi nous nous fondons",
      body: [
        {
          p: "Pour fournir le service que vous avez demandé, gérer les comptes et la facturation, empêcher l'abus d'un service qui nous coûte de l'argent à chaque requête, et améliorer l'exactitude de notre score.",
        },
        {
          p: "Lorsque nous nous fondons sur votre consentement, vous pouvez le retirer en fermant votre compte.",
        },
      ],
    },

    deletion: {
      heading: "7. Supprimer votre compte — et ce que nous gardons",
      body: [
        {
          p: "Vous pouvez supprimer votre compte vous-même depuis ses paramètres, ou nous le demander à {email}. La suppression efface votre nom, votre photo de profil, votre mot de passe, vos préférences enregistrées et le lien entre vous et les recherches que vous avez lancées.",
        },
        {
          p: "Deux choses sont délibérément conservées, et nous préférons vous le dire plutôt que vous laisser le supposer :",
        },
        {
          ul: [
            "Votre adresse e-mail, afin que si vous revenez nous puissions reconnaître le compte et vous restituer un solde de crédits que vous auriez payé.",
            "Vos justificatifs de paiement — montants, dates et devise —, que les règles fiscales et comptables nous imposent de conserver.",
          ],
        },
        {
          p: "Si vous souhaitez que votre adresse e-mail soit également supprimée, écrivez à {email} et dites-le, nous la supprimerons. Nous n'aurons alors plus aucun moyen de vous reconnaître, et un solde antérieur ne pourra pas être restitué.",
        },
        {
          p: "Les questions que vous avez recherchées restent dans le corpus partagé décrit à l'article 5, car après la suppression elles ne sont plus rattachées à vous.",
        },
      ],
    },

    rights: {
      heading: "8. Vos possibilités",
      body: [
        {
          p: "Écrivez à {email} pour obtenir une copie des données que nous détenons sur vous, les faire corriger ou vous opposer à leur usage. Nous répondons sous 30 jours.",
        },
        {
          p: "Selon votre lieu de résidence, vous pouvez aussi avoir le droit de saisir une autorité de protection des données. Nous préférerions que vous veniez d'abord nous voir, mais la voie vous appartient.",
        },
      ],
    },

    children: {
      heading: "9. Enfants",
      body: [
        {
          p: "AnswerGap ne s'adresse pas aux moins de 16 ans et nous ne collectons pas sciemment leurs données. Si vous pensez qu'un enfant a créé un compte, écrivez à {email} et nous le supprimerons.",
        },
      ],
    },

    transfers: {
      heading: "10. Où les données sont conservées",
      body: [
        {
          p: "Nous opérons depuis les États-Unis, et nos prestataires fonctionnent aux États-Unis et dans l'Union européenne. Utiliser le service implique que vos données puissent être traitées dans l'un comme dans l'autre.",
        },
      ],
    },

    changes: {
      heading: "11. Modifications de cette politique",
      body: [
        {
          p: "Nous publierons les modifications sur cette page et mettrons à jour la date en haut. Si une modification vous affecte de manière substantielle, nous préviendrons les titulaires de compte par e-mail plutôt que de compter sur le fait que vous le remarquiez.",
        },
        { p: "Questions à ce sujet :" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
      ],
    },
  },
};
