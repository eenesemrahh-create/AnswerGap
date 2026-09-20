/**
 * Terms of Service - the CONTROLLING version.
 *
 * Every other locale is a translation of this file and says so in section 1.
 * When a clause here changes, the four translations stop compiling until they
 * are changed with it; see `./index.ts`.
 *
 * Section 5 exists because Stripe looks for a refund and cancellation policy
 * before it will onboard a business. Section 6 exists because the product's
 * central number is a heuristic that is currently wrong more often than it is
 * right, and the rest of this codebase takes accuracy seriously enough
 * (`CLAUDE.md` - never claim live data, never render unknown as a gap) that
 * the contract had better not overclaim where the interface does not.
 */

export const en = {
  title: "Terms of Service",
  description:
    "The agreement between you and AnswerGap covering accounts, credits, refunds and the accuracy of gap scores.",
  lead: "These terms govern your use of AnswerGap. Please read section 6, which explains what our gap scores are and are not.",
  effective: "2026-09-20",

  sections: {
    parties: {
      heading: "1. Who you are contracting with",
      body: [
        {
          p: "AnswerGap is operated by {company}, a {state} {entity} in the United States. In these terms, “we”, “us” and “our” mean {company}; “you” means the person or organisation using the service.",
        },
        {
          p: "By creating an account or using the service you accept these terms. If you do not accept them, do not use the service.",
        },
        {
          p: "These terms are published in several languages. The English version is the controlling one: if a translation disagrees with it, the English text applies.",
        },
      ],
    },

    service: {
      heading: "2. What the service does",
      body: [
        {
          p: "AnswerGap expands the questions Google shows under “People also ask” into a question tree, checks the search results behind individual questions, and estimates which of those questions no page answers well.",
        },
        {
          p: "The service is under active development. Features may change, and some are offered in preview before they are finished.",
        },
      ],
    },

    accounts: {
      heading: "3. Accounts",
      body: [
        {
          p: "You need an account to save your work and to spend credits. One account per person.",
        },
        {
          ul: [
            "Give us an email address you control. You must confirm it before you can spend credits.",
            "Keep your sign-in details to yourself. You are responsible for what happens under your account.",
            "Tell us promptly if you believe someone else has used your account.",
          ],
        },
        {
          p: "We may suspend an account that breaches these terms, and we may refuse service to anyone.",
        },
      ],
    },

    credits: {
      heading: "4. Credits, packs and subscriptions",
      body: [
        {
          p: "Work on AnswerGap is paid for in credits. A credit is consumed when we make a paid request to a search data provider on your behalf.",
        },
        {
          ul: [
            "A search costs one credit. Results we have already retrieved and cached are free — reopening them does not cost anything.",
            "Checking an individual question is priced separately from discovering questions, because each check costs us a separate search request.",
            "Credits may be sold as one-off packs, or included in a recurring subscription. The price, the number of credits and any subscription term are shown before you pay.",
            "Pack credits do not expire while your account is active.",
            "A request that fails on our side is not charged.",
          ],
        },
        {
          p: "While the service is in preview nothing is sold: credits are granted by hand and are not purchasable. This section describes what applies once purchasing opens.",
        },
      ],
    },

    refunds: {
      heading: "5. Refunds and cancellation",
      body: [
        {
          p: "Nothing is sold during preview, so there is nothing to refund yet. Once purchasing opens, the following applies.",
        },
        {
          ul: [
            "Unused pack credits can be refunded within 14 days of purchase. Credits already spent are not refunded, because the cost of those searches was incurred with our data provider and cannot be recovered.",
            "A subscription can be cancelled at any time. It continues to the end of the period you have already paid for; we do not refund part-periods.",
            "If the service fails to deliver what you paid for — a search that errored on our side, or a duplicate charge — tell us and we will put it right.",
          ],
        },
        {
          p: "To ask for a refund, write to {email} with the email address on the account and the date of the payment. We answer within five working days.",
        },
      ],
    },

    accuracy: {
      heading: "6. Accuracy — please read this one",
      body: [
        {
          p: "Gap scores are estimates. They are not facts, and they are not advice.",
        },
        {
          p: "A gap score is produced by comparing a question against the titles and addresses of public search results using an automated method. That method is under active development and is expected to be wrong in a meaningful share of cases. We would rather say this here than imply a precision we cannot currently demonstrate.",
        },
        {
          ul: [
            "Search volume figures, where shown, are a third party's estimates and are labelled as such.",
            "Results reflect what the search engine returned at the moment we retrieved them. Every result carries the date it was fetched, and we never present data as live.",
            "A question we have not checked is shown as unknown, not as a gap. Unknown is not the same as unanswered.",
            "Nothing in the service guarantees any search ranking, any amount of traffic, or any commercial outcome.",
          ],
        },
        {
          p: "Decisions you take on the basis of these scores are yours. Treat the output as a starting point for judgement, not as a substitute for it.",
        },
      ],
    },

    sources: {
      heading: "7. Where the data comes from",
      body: [
        {
          p: "Results are derived from publicly available search results obtained through third-party providers. We do not control the search engines those results come from, and we cannot guarantee that the data is available, complete or correct.",
        },
        {
          p: "If a provider changes what it returns, or stops returning it, parts of the service may change or stop working.",
        },
      ],
    },

    use: {
      heading: "8. Acceptable use",
      body: [
        { p: "Do not:" },
        {
          ul: [
            "resell or redistribute the raw result data as if it were your own dataset;",
            "access the service by automated means beyond the credits you hold;",
            "work around credit limits, the free daily allowance, or any other restriction;",
            "probe, scan or disrupt the service, or try to reach data that is not yours;",
            "use the service to break the law or to infringe anybody's rights.",
          ],
        },
        {
          p: "Reports and analyses you produce for yourself or your clients are yours to use. The restriction is on redistributing the underlying data as a product.",
        },
      ],
    },

    content: {
      heading: "9. Your content",
      body: [
        {
          p: "The keywords and questions you enter remain yours. You grant us the permission needed to run searches on them, to store the results, and to operate the shared question corpus described in our Privacy Policy.",
        },
        {
          p: "Please note that questions and their scores are held in one corpus shared by all customers rather than in a private copy per account. Our Privacy Policy explains exactly what this does and does not expose.",
        },
        {
          link: { text: "Read the Privacy Policy", href: "/privacy" },
        },
      ],
    },

    availability: {
      heading: "10. Availability",
      body: [
        {
          p: "The service is offered as it is, in preview, with no uptime commitment. We may change, suspend or discontinue any part of it.",
        },
        {
          p: "We will give reasonable notice before withdrawing something you have paid for, and will refund credits you cannot use as a result.",
        },
      ],
    },

    liability: {
      heading: "11. Disclaimer and limitation of liability",
      body: [
        {
          p: "To the fullest extent the law allows, the service is provided “as is” and “as available”, without warranties of any kind, express or implied, including fitness for a particular purpose and non-infringement.",
        },
        {
          p: "To the fullest extent the law allows, our total liability arising out of or relating to the service is limited to the amount you paid us in the twelve months before the event giving rise to the claim. We are not liable for lost profits, lost revenue, lost data, or indirect or consequential loss.",
        },
        {
          p: "Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including liability for fraud.",
        },
      ],
    },

    termination: {
      heading: "12. Ending the agreement",
      body: [
        {
          p: "You can close your account at any time from your account settings, or by writing to {email}. Our Privacy Policy explains what is deleted and what is kept.",
        },
        {
          p: "We may suspend or end your access if you breach these terms. Unused credits are not refunded where access ends because of a breach.",
        },
      ],
    },

    changes: {
      heading: "13. Changes to these terms",
      body: [
        {
          p: "We may update these terms. The date at the top of this page shows when they last changed, and we will tell account holders by email about changes that materially affect them.",
        },
        {
          p: "Continuing to use the service after a change means you accept the updated terms.",
        },
      ],
    },

    law: {
      heading: "14. Governing law",
      body: [
        {
          p: "These terms are governed by the laws of the State of {state}, United States, without regard to its conflict-of-laws rules. The courts of {state} have exclusive jurisdiction over any dispute, except that either party may seek injunctive relief in any court of competent jurisdiction.",
        },
      ],
    },

    contact: {
      heading: "15. Contact",
      body: [
        { p: "Questions about these terms:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
        { p: "{company}, {state}, United States." },
      ],
    },
  },
} as const;
