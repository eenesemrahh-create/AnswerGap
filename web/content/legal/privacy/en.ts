/**
 * Privacy Policy - the CONTROLLING version.
 *
 * Written from the code rather than from a template. Every claim below was
 * checked against the schema and the outbound calls: the IP hashing in
 * `answergap/gate.py`, the browser keys in `web/lib/`, the five external
 * services in `answergap/` and `api/`, and the sharing boundary enforced by
 * `db.can_access`. A generic policy that misdescribes the system is worse than
 * none, because it is a promise about behaviour nobody verified.
 *
 * Section 7 is the one to re-read whenever erasure changes: it states plainly
 * that the email address and the payment record survive deletion. That is a
 * deliberate choice, and a policy that quietly omitted it would be the kind of
 * thing this file exists to prevent.
 */

export const en = {
  title: "Privacy Policy",
  description:
    "What AnswerGap collects, who else receives it, what stays private from other customers, and what survives deleting your account.",
  lead: "This explains what we collect and why, in the plain terms we would want from somebody else. Section 5 covers what other customers can and cannot see; section 7 covers what deleting your account does and does not remove.",
  effective: "2026-09-20",

  sections: {
    scope: {
      heading: "1. Who this covers",
      body: [
        {
          p: "This policy covers AnswerGap at {site}, operated by {company} in the United States. {company} decides how and why the data described here is handled.",
        },
        {
          p: "This policy is published in several languages. The English version is the controlling one; if a translation disagrees with it, the English text applies.",
        },
      ],
    },

    collect: {
      heading: "2. What we collect",
      body: [
        { p: "If you create an account:" },
        {
          ul: [
            "Your email address — typed at signup, or provided by Google if you sign in with Google.",
            "Your name, if you give one, or the name on your Google profile. This is optional.",
            "A link to your Google profile picture, if you sign in with Google. We store the link, not a copy of the image.",
            "A hash of your password, if you signed up with email. We never store the password itself.",
            "Your account status and the dates it was created, last seen and confirmed.",
          ],
        },
        { p: "As you use the service:" },
        {
          ul: [
            "The keywords and questions you search. These are stored against your account, or — if you are signed out — against a random identifier held in your browser.",
            "Which questions you asked us to check, and the search results we retrieved for them.",
            "A ledger of every credit added to or spent from your account, and why.",
            "Usage records: what was done, whether it succeeded or was refused, how many credits it used and what it cost us.",
          ],
        },
        {
          p: "We do not store your IP address. We derive a salted, truncated cryptographic hash of it and store only that, so we can count the free daily search and stop abuse. The address itself exists only for the moment the request is handled and is never written down; because the hash is salted with a secret we can rotate, the stored values can be made meaningless at will. Our hosting provider keeps its own connection logs, which are outside our control.",
        },
      ],
    },

    storage: {
      heading: "3. Cookies and what your browser keeps",
      body: [
        {
          p: "The AnswerGap website sets no cookies. There is no analytics, no tag manager, and no third-party script of any kind. Fonts are served from our own domain rather than fetched from anyone else.",
        },
        {
          p: "Your browser keeps a few values locally, on your device, which we cannot read remotely:",
        },
        {
          ul: [
            "Your session, for fourteen days. Signing out removes it.",
            "A random identifier that counts the free daily search for signed-out visitors.",
            "Your light or dark theme preference.",
            "Your interface language.",
            "Your country and language search preference.",
            "Your own website address, if you typed one to check whether it is cited. This one never reaches us at all — the comparison happens inside your browser.",
          ],
        },
        {
          p: "Our internal staff tool uses one session cookie. Customers never encounter it.",
        },
      ],
    },

    processors: {
      heading: "4. Who else receives data",
      body: [
        { p: "We use a small number of providers, and send each of them only what it needs:" },
        {
          ul: [
            "Our search data provider receives the keyword or question text you searched. It does not receive your email address, your IP address or any account identifier.",
            "Our semantic matching provider, when that feature is enabled, receives question text and the titles and addresses of search results. It receives no identifiers.",
            "Our email provider receives your address and the message, so that verification and password-reset mail can be delivered.",
            "Our payment provider receives what you enter on its own hosted checkout page.",
            "Google receives nothing beyond the sign-in exchange, and only if you choose to sign in with Google.",
            "Our hosting provider runs the service; our mailbox provider holds any mail you send to support.",
          ],
        },
        {
          p: "Card numbers never reach us. Checkout is hosted by the payment provider, and we keep only the record of the payment it sends back.",
        },
        {
          p: "We do not sell your data, and we do not share it for advertising.",
        },
      ],
    },

    sharing: {
      heading: "5. What is private from other customers — and what is not",
      body: [
        {
          p: "This deserves a straight answer rather than a reassuring one, because the design is deliberate.",
        },
        {
          ul: [
            "Your list of searches is private. Another customer cannot see which keywords you searched or open your saved analyses. Asking for an analysis that is not yours returns “not found” rather than “not allowed”, because the mere existence of a search is itself information.",
            "The question data is shared. Questions, their scores, cached search results and gap verdicts live in one corpus shared by everyone, not in a private copy per account. If you and another customer search the same keyword you see the same tree, and the second search costs nothing because the first already paid for it. This is what keeps the service affordable.",
            "Verdicts you give with the “is this really a gap?” buttons are stored without your account attached, and are used to improve how the scoring works.",
            "If you are signed out, access to your own analyses rests on the random identifier in your browser. That keeps them away from strangers, but it is not cryptographic protection — clear your browser storage and you lose access to them.",
          ],
        },
      ],
    },

    why: {
      heading: "6. Why we are allowed to hold it",
      body: [
        {
          p: "To provide the service you asked for, to operate accounts and billing, to prevent abuse of a service that costs us money per request, and to improve the accuracy of our scoring.",
        },
        {
          p: "Where we rely on your consent, you can withdraw it by closing your account.",
        },
      ],
    },

    deletion: {
      heading: "7. Deleting your account — and what we keep",
      body: [
        {
          p: "You can delete your account yourself from your account settings, or ask us to do it at {email}. Deletion removes your name, your profile picture, your password, your saved preferences, and the link between you and the searches you ran.",
        },
        {
          p: "Two things are deliberately kept, and we would rather tell you than let you assume otherwise:",
        },
        {
          ul: [
            "Your email address, so that if you come back we can recognise the account and restore any credit balance you had paid for.",
            "Your payment records — the amounts, dates and currency — which tax and accounting rules require us to retain.",
          ],
        },
        {
          p: "If you would like your email address removed as well, write to {email} and say so, and we will remove it. After that we will have no way to recognise you, so a past credit balance cannot be restored.",
        },
        {
          p: "The questions you searched remain in the shared corpus described in section 5, because after deletion they are no longer stored against you.",
        },
      ],
    },

    rights: {
      heading: "8. Your choices",
      body: [
        {
          p: "Write to {email} to get a copy of the data we hold about you, to correct it, or to object to how we use it. We answer within 30 days.",
        },
        {
          p: "Depending on where you live you may also have the right to complain to a data protection authority. We would rather you came to us first, but the route is yours.",
        },
      ],
    },

    children: {
      heading: "9. Children",
      body: [
        {
          p: "AnswerGap is not intended for anyone under 16, and we do not knowingly collect their data. If you believe a child has created an account, write to {email} and we will remove it.",
        },
      ],
    },

    transfers: {
      heading: "10. Where the data is held",
      body: [
        {
          p: "We operate from the United States, and our providers run in the United States and the European Union. Using the service means your data may be handled in either.",
        },
      ],
    },

    changes: {
      heading: "11. Changes to this policy",
      body: [
        {
          p: "We will post changes on this page and update the date at the top. If a change materially affects you, we will tell account holders by email rather than relying on you to notice.",
        },
        { p: "Questions about any of this:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
      ],
    },
  },
} as const;
