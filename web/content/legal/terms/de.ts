import type { TermsContent } from "./index";

/**
 * Nutzungsbedingungen - Übersetzung der englischen Fassung.
 *
 * Maßgeblich ist die englische Fassung (siehe Abschnitt 1). Diese Datei muss
 * `en.ts` Klausel für Klausel und Aufzählungspunkt für Aufzählungspunkt
 * entsprechen; der Typ macht daraus einen Compile-Fehler.
 */
export const de: TermsContent = {
  title: "Nutzungsbedingungen",
  description:
    "Die Vereinbarung zwischen Ihnen und AnswerGap zu Konten, Credits, Erstattungen und der Genauigkeit von Gap-Werten.",
  lead: "Diese Bedingungen regeln Ihre Nutzung von AnswerGap. Bitte lesen Sie Abschnitt 6, der erklärt, was unsere Gap-Werte sind und was nicht.",
  effective: "2026-09-20",

  sections: {
    parties: {
      heading: "1. Mit wem Sie den Vertrag schließen",
      body: [
        {
          p: "AnswerGap wird betrieben von {company}, einer {entity} nach dem Recht von {state}, USA. In diesen Bedingungen bedeuten „wir“ und „uns“ {company}; „Sie“ ist die Person oder Organisation, die den Dienst nutzt.",
        },
        {
          p: "Mit der Erstellung eines Kontos oder der Nutzung des Dienstes akzeptieren Sie diese Bedingungen. Wenn Sie sie nicht akzeptieren, nutzen Sie den Dienst nicht.",
        },
        {
          p: "Diese Bedingungen werden in mehreren Sprachen veröffentlicht. Maßgeblich ist die englische Fassung: Weicht eine Übersetzung davon ab, gilt der englische Text.",
        },
      ],
    },

    service: {
      heading: "2. Was der Dienst leistet",
      body: [
        {
          p: "AnswerGap entfaltet die Fragen, die Google unter „Ähnliche Fragen“ anzeigt, zu einem Fragenbaum, prüft die Suchergebnisse hinter einzelnen Fragen und schätzt, welche dieser Fragen von keiner Seite gut beantwortet werden.",
        },
        {
          p: "Der Dienst wird aktiv weiterentwickelt. Funktionen können sich ändern, und einige werden als Vorschau angeboten, bevor sie fertig sind.",
        },
      ],
    },

    accounts: {
      heading: "3. Konten",
      body: [
        {
          p: "Für das Speichern Ihrer Arbeit und das Ausgeben von Credits benötigen Sie ein Konto. Ein Konto pro Person.",
        },
        {
          ul: [
            "Geben Sie eine E-Mail-Adresse an, über die Sie verfügen. Sie müssen sie bestätigen, bevor Sie Credits ausgeben können.",
            "Behalten Sie Ihre Zugangsdaten für sich. Für alles, was unter Ihrem Konto geschieht, sind Sie verantwortlich.",
            "Sagen Sie uns umgehend Bescheid, wenn Sie vermuten, dass jemand anderes Ihr Konto genutzt hat.",
          ],
        },
        {
          p: "Wir können ein Konto sperren, das gegen diese Bedingungen verstößt, und wir können den Dienst verweigern.",
        },
      ],
    },

    credits: {
      heading: "4. Credits, Pakete und Abonnements",
      body: [
        {
          p: "Arbeit bei AnswerGap wird mit Credits bezahlt. Ein Credit wird verbraucht, wenn wir in Ihrem Auftrag eine kostenpflichtige Anfrage an einen Suchdatenanbieter stellen.",
        },
        {
          ul: [
            "Eine Suche kostet einen Credit. Bereits abgerufene und zwischengespeicherte Ergebnisse sind kostenlos — sie erneut zu öffnen kostet nichts.",
            "Die Prüfung einer einzelnen Frage wird getrennt von der Fragensuche berechnet, weil uns jede Prüfung eine eigene Suchanfrage kostet.",
            "Credits können als einmalige Pakete verkauft oder in ein wiederkehrendes Abonnement eingeschlossen werden. Preis, Anzahl der Credits und eine etwaige Abonnementlaufzeit werden vor der Zahlung angezeigt.",
            "Paket-Credits verfallen nicht, solange Ihr Konto aktiv ist.",
            "Eine Anfrage, die auf unserer Seite fehlschlägt, wird nicht berechnet.",
          ],
        },
        {
          p: "Solange der Dienst in der Vorschau ist, wird nichts verkauft: Credits werden manuell vergeben und sind nicht käuflich. Dieser Abschnitt beschreibt, was gilt, sobald der Verkauf startet.",
        },
      ],
    },

    refunds: {
      heading: "5. Erstattung und Kündigung",
      body: [
        {
          p: "Während der Vorschau wird nichts verkauft, also gibt es auch noch nichts zu erstatten. Sobald der Verkauf startet, gilt Folgendes.",
        },
        {
          ul: [
            "Nicht genutzte Paket-Credits können innerhalb von 14 Tagen nach dem Kauf erstattet werden. Bereits verbrauchte Credits werden nicht erstattet, weil die Kosten dieser Suchen bei unserem Datenanbieter angefallen und nicht rückholbar sind.",
            "Ein Abonnement kann jederzeit gekündigt werden. Es läuft bis zum Ende des bereits bezahlten Zeitraums; Teilzeiträume erstatten wir nicht.",
            "Wenn der Dienst nicht liefert, wofür Sie bezahlt haben — eine Suche, die auf unserer Seite fehlgeschlagen ist, oder eine doppelte Abbuchung —, sagen Sie uns Bescheid, und wir bringen es in Ordnung.",
          ],
        },
        {
          p: "Für eine Erstattung schreiben Sie an {email} mit der E-Mail-Adresse des Kontos und dem Datum der Zahlung. Wir antworten innerhalb von fünf Werktagen.",
        },
      ],
    },

    accuracy: {
      heading: "6. Genauigkeit — bitte diesen Abschnitt lesen",
      body: [
        {
          p: "Gap-Werte sind Schätzungen. Sie sind keine Tatsachen und keine Beratung.",
        },
        {
          p: "Ein Gap-Wert entsteht, indem eine Frage mit den Titeln und Adressen öffentlicher Suchergebnisse automatisiert verglichen wird. Dieses Verfahren wird aktiv weiterentwickelt, und es ist damit zu rechnen, dass es in einem erheblichen Teil der Fälle falsch liegt. Wir sagen das hier lieber, als eine Genauigkeit zu suggerieren, die wir derzeit nicht belegen können.",
        },
        {
          ul: [
            "Angezeigte Suchvolumen sind Schätzungen Dritter und werden als solche gekennzeichnet.",
            "Ergebnisse geben wieder, was die Suchmaschine zum Zeitpunkt des Abrufs zurückgegeben hat. Jedes Ergebnis trägt sein Abrufdatum, und wir stellen Daten nie als live dar.",
            "Eine nicht geprüfte Frage wird als unbekannt angezeigt, nicht als Lücke. Unbekannt ist nicht dasselbe wie unbeantwortet.",
            "Nichts an diesem Dienst garantiert ein Suchranking, ein Besucheraufkommen oder ein geschäftliches Ergebnis.",
          ],
        },
        {
          p: "Entscheidungen, die Sie auf Grundlage dieser Werte treffen, sind Ihre eigenen. Behandeln Sie die Ausgabe als Ausgangspunkt für eine Beurteilung, nicht als Ersatz dafür.",
        },
      ],
    },

    sources: {
      heading: "7. Woher die Daten stammen",
      body: [
        {
          p: "Ergebnisse werden aus öffentlich zugänglichen Suchergebnissen abgeleitet, die über Drittanbieter bezogen werden. Wir kontrollieren die Suchmaschinen, aus denen diese Ergebnisse stammen, nicht und können nicht garantieren, dass die Daten verfügbar, vollständig oder richtig sind.",
        },
        {
          p: "Ändert ein Anbieter, was er zurückgibt, oder stellt er dies ein, können Teile des Dienstes sich ändern oder nicht mehr funktionieren.",
        },
      ],
    },

    use: {
      heading: "8. Zulässige Nutzung",
      body: [
        { p: "Nicht zulässig ist:" },
        {
          ul: [
            "die Rohdaten der Ergebnisse weiterzuverkaufen oder zu verbreiten, als wären sie Ihr eigener Datensatz;",
            "über die von Ihnen gehaltenen Credits hinaus automatisiert auf den Dienst zuzugreifen;",
            "Credit-Grenzen, das kostenlose Tageskontingent oder andere Beschränkungen zu umgehen;",
            "den Dienst zu sondieren, zu scannen oder zu stören oder auf Daten zuzugreifen, die nicht Ihnen gehören;",
            "den Dienst rechtswidrig oder unter Verletzung von Rechten Dritter zu nutzen.",
          ],
        },
        {
          p: "Berichte und Analysen, die Sie für sich oder Ihre Kundschaft erstellen, gehören Ihnen. Die Beschränkung betrifft die Weiterverbreitung der zugrunde liegenden Daten als Produkt.",
        },
      ],
    },

    content: {
      heading: "9. Ihre Inhalte",
      body: [
        {
          p: "Die von Ihnen eingegebenen Suchbegriffe und Fragen bleiben Ihre. Sie räumen uns die Erlaubnis ein, damit Suchen durchzuführen, die Ergebnisse zu speichern und den in unserer Datenschutzerklärung beschriebenen gemeinsamen Fragenbestand zu betreiben.",
        },
        {
          p: "Bitte beachten Sie: Fragen und ihre Werte liegen in einem von allen Kundinnen und Kunden geteilten Bestand, nicht in einer privaten Kopie je Konto. Unsere Datenschutzerklärung erklärt genau, was das offenlegt und was nicht.",
        },
        {
          link: { text: "Datenschutzerklärung lesen", href: "/privacy" },
        },
      ],
    },

    availability: {
      heading: "10. Verfügbarkeit",
      body: [
        {
          p: "Der Dienst wird wie er ist als Vorschau angeboten, ohne Verfügbarkeitszusage. Wir können Teile davon ändern, aussetzen oder einstellen.",
        },
        {
          p: "Bevor wir etwas zurückziehen, wofür Sie bezahlt haben, kündigen wir dies angemessen an und erstatten Credits, die Sie dadurch nicht nutzen können.",
        },
      ],
    },

    liability: {
      heading: "11. Haftungsausschluss und Haftungsbegrenzung",
      body: [
        {
          p: "Soweit gesetzlich zulässig, wird der Dienst „wie besehen“ und „wie verfügbar“ bereitgestellt, ohne jegliche ausdrückliche oder stillschweigende Gewährleistung, einschließlich der Eignung für einen bestimmten Zweck und der Nichtverletzung von Rechten.",
        },
        {
          p: "Soweit gesetzlich zulässig, ist unsere Gesamthaftung aus oder im Zusammenhang mit dem Dienst auf den Betrag begrenzt, den Sie uns in den zwölf Monaten vor dem haftungsauslösenden Ereignis gezahlt haben. Für entgangenen Gewinn, Umsatzausfall, Datenverlust sowie mittelbare Schäden und Folgeschäden haften wir nicht.",
        },
        {
          p: "Nichts in diesen Bedingungen schließt eine Haftung aus oder begrenzt sie, die gesetzlich nicht ausgeschlossen oder begrenzt werden kann, einschließlich der Haftung für Arglist.",
        },
      ],
    },

    termination: {
      heading: "12. Beendigung",
      body: [
        {
          p: "Sie können Ihr Konto jederzeit in den Kontoeinstellungen oder per Nachricht an {email} schließen. Was gelöscht und was aufbewahrt wird, erklärt unsere Datenschutzerklärung.",
        },
        {
          p: "Wir können Ihren Zugang aussetzen oder beenden, wenn Sie gegen diese Bedingungen verstoßen. Endet der Zugang wegen eines Verstoßes, werden nicht genutzte Credits nicht erstattet.",
        },
      ],
    },

    changes: {
      heading: "13. Änderungen dieser Bedingungen",
      body: [
        {
          p: "Wir können diese Bedingungen aktualisieren. Das Datum oben auf dieser Seite zeigt die letzte Änderung, und wir informieren Kontoinhaberinnen und Kontoinhaber per E-Mail über Änderungen, die sie wesentlich betreffen.",
        },
        {
          p: "Wenn Sie den Dienst nach einer Änderung weiter nutzen, akzeptieren Sie die aktualisierten Bedingungen.",
        },
      ],
    },

    law: {
      heading: "14. Anwendbares Recht",
      body: [
        {
          p: "Diese Bedingungen unterliegen dem Recht des Staates {state}, USA, unter Ausschluss seiner Kollisionsnormen. Für Streitigkeiten sind ausschließlich die Gerichte von {state} zuständig; jede Partei kann jedoch bei jedem zuständigen Gericht einstweiligen Rechtsschutz beantragen.",
        },
      ],
    },

    contact: {
      heading: "15. Kontakt",
      body: [
        { p: "Fragen zu diesen Bedingungen:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
        { p: "{company}, {state}, Vereinigte Staaten." },
      ],
    },
  },
};
