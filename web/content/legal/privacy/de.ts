import type { PrivacyContent } from "./index";

/** Datenschutzerklärung - Übersetzung der englischen Fassung. Maßgeblich ist Englisch. */
export const de: PrivacyContent = {
  title: "Datenschutzerklärung",
  description:
    "Was AnswerGap erhebt, wer es sonst noch bekommt, was vor anderen Kundinnen und Kunden verborgen bleibt und was das Löschen des Kontos übrig lässt.",
  lead: "Hier steht, was wir erheben und warum — so klar, wie wir es selbst von anderen erwarten würden. Abschnitt 5 erklärt, was andere sehen können und was nicht; Abschnitt 7, was das Löschen Ihres Kontos entfernt und was nicht.",
  effective: "2026-09-20",

  sections: {
    scope: {
      heading: "1. Wen das betrifft",
      body: [
        {
          p: "Diese Erklärung gilt für AnswerGap unter {site}, betrieben von {company} in den Vereinigten Staaten. {company} entscheidet, wie und warum die hier beschriebenen Daten verarbeitet werden.",
        },
        {
          p: "Diese Erklärung wird in mehreren Sprachen veröffentlicht. Maßgeblich ist die englische Fassung; weicht eine Übersetzung davon ab, gilt der englische Text.",
        },
      ],
    },

    collect: {
      heading: "2. Was wir erheben",
      body: [
        { p: "Wenn Sie ein Konto anlegen:" },
        {
          ul: [
            "Ihre E-Mail-Adresse — bei der Registrierung eingegeben oder von Google übermittelt, wenn Sie sich mit Google anmelden.",
            "Ihren Namen, sofern Sie einen angeben, oder den Namen aus Ihrem Google-Profil. Das ist freiwillig.",
            "Einen Link zu Ihrem Google-Profilbild, wenn Sie sich mit Google anmelden. Wir speichern den Link, keine Kopie des Bildes.",
            "Einen Hash Ihres Passworts, wenn Sie sich per E-Mail registriert haben. Das Passwort selbst speichern wir nie.",
            "Den Status Ihres Kontos sowie die Daten der Erstellung, des letzten Besuchs und der Bestätigung.",
          ],
        },
        { p: "Während Sie den Dienst nutzen:" },
        {
          ul: [
            "Die Suchbegriffe und Fragen, die Sie suchen. Sie werden Ihrem Konto zugeordnet gespeichert oder — wenn Sie abgemeldet sind — einer zufälligen Kennung in Ihrem Browser.",
            "Welche Fragen Sie prüfen ließen und welche Suchergebnisse wir dafür abgerufen haben.",
            "Ein Verzeichnis aller Credits, die Ihrem Konto gutgeschrieben oder von ihm abgebucht wurden, samt Grund.",
            "Nutzungsdaten: was getan wurde, ob es gelang oder abgelehnt wurde, wie viele Credits es verbrauchte und was es uns kostete.",
          ],
        },
        {
          p: "Ihre IP-Adresse speichern wir nicht. Wir bilden davon einen gesalzenen, gekürzten kryptografischen Hash und speichern nur diesen, um die kostenlose Tagessuche zu zählen und Missbrauch zu unterbinden. Die Adresse selbst existiert nur für die Dauer der Anfrage und wird nirgends festgehalten; da der Hash mit einem wechselbaren Geheimnis gesalzen ist, lassen sich die gespeicherten Werte jederzeit bedeutungslos machen. Unser Hosting-Anbieter führt eigene Verbindungsprotokolle, die außerhalb unserer Kontrolle liegen.",
        },
      ],
    },

    storage: {
      heading: "3. Cookies und was Ihr Browser behält",
      body: [
        {
          p: "Die AnswerGap-Website setzt keine Cookies. Es gibt keine Analyse-Software, keinen Tag-Manager und kein Skript von Dritten. Schriften werden von unserer eigenen Domain ausgeliefert, statt bei jemandem abgerufen zu werden.",
        },
        {
          p: "Ihr Browser behält einige Werte lokal auf Ihrem Gerät, die wir aus der Ferne nicht lesen können:",
        },
        {
          ul: [
            "Ihre Sitzung, für vierzehn Tage. Das Abmelden entfernt sie.",
            "Eine zufällige Kennung, die für abgemeldete Besucher die kostenlose Tagessuche zählt.",
            "Ihre Einstellung für helles oder dunkles Design.",
            "Ihre Oberflächensprache.",
            "Ihre Land- und Spracheinstellung für die Suche.",
            "Die Adresse Ihrer eigenen Website, falls Sie eine eingegeben haben, um zu prüfen, ob sie zitiert wird. Diese erreicht uns überhaupt nie — der Abgleich findet in Ihrem Browser statt.",
          ],
        },
        {
          p: "Unser internes Verwaltungswerkzeug nutzt ein Sitzungs-Cookie. Kundinnen und Kunden begegnen ihm nie.",
        },
      ],
    },

    processors: {
      heading: "4. Wer sonst noch Daten erhält",
      body: [
        { p: "Wir nutzen wenige Anbieter und senden jedem nur, was er braucht:" },
        {
          ul: [
            "Unser Anbieter für Suchdaten erhält den gesuchten Begriff oder Fragetext. Er erhält weder Ihre E-Mail-Adresse noch Ihre IP-Adresse noch irgendeine Kontokennung.",
            "Unser Anbieter für semantischen Abgleich erhält, wenn diese Funktion aktiv ist, Fragetexte sowie Titel und Adressen von Suchergebnissen. Kennungen erhält er keine.",
            "Unser E-Mail-Anbieter erhält Ihre Adresse und die Nachricht, damit Bestätigungs- und Passwortmails zugestellt werden können.",
            "Unser Zahlungsanbieter erhält, was Sie auf seiner eigenen Bezahlseite eingeben.",
            "Google erhält nichts über den Anmeldevorgang hinaus, und auch das nur, wenn Sie sich mit Google anmelden.",
            "Unser Hosting-Anbieter betreibt den Dienst; unser Postfachanbieter verwahrt, was Sie an den Support schreiben.",
          ],
        },
        {
          p: "Kartennummern erreichen uns nie. Die Bezahlseite betreibt der Zahlungsanbieter; wir behalten nur den Zahlungsbeleg, den er zurückmeldet.",
        },
        {
          p: "Wir verkaufen Ihre Daten nicht und geben sie nicht für Werbung weiter.",
        },
      ],
    },

    sharing: {
      heading: "5. Was vor anderen verborgen bleibt — und was nicht",
      body: [
        {
          p: "Das verdient eine gerade statt einer beruhigenden Antwort, denn die Gestaltung ist bewusst so gewählt.",
        },
        {
          ul: [
            "Ihre Liste von Suchanfragen ist privat. Andere können nicht sehen, wonach Sie gesucht haben, und Ihre gespeicherten Analysen nicht öffnen. Die Abfrage einer fremden Analyse antwortet „nicht gefunden“ statt „nicht erlaubt“, weil schon die Existenz einer Suche eine Information ist.",
            "Die Fragendaten sind gemeinsam. Fragen, ihre Werte, zwischengespeicherte Suchergebnisse und Gap-Bewertungen liegen in einem von allen geteilten Bestand, nicht in einer privaten Kopie je Konto. Suchen Sie und jemand anderes denselben Begriff, sehen Sie denselben Baum, und die zweite Suche kostet nichts, weil die erste bereits bezahlt wurde. Das hält den Dienst bezahlbar.",
            "Bewertungen, die Sie über die Schaltflächen „Ist das wirklich eine Lücke?“ abgeben, werden ohne Bezug zu Ihrem Konto gespeichert und dienen dazu, die Bewertung zu verbessern.",
            "Sind Sie abgemeldet, stützt sich der Zugang zu Ihren eigenen Analysen auf die zufällige Kennung im Browser. Das hält sie von Fremden fern, ist aber kein kryptografischer Schutz — löschen Sie den Browserspeicher, verlieren Sie den Zugang.",
          ],
        },
      ],
    },

    why: {
      heading: "6. Worauf wir uns stützen",
      body: [
        {
          p: "Um den von Ihnen gewünschten Dienst zu erbringen, Konten und Abrechnung zu führen, Missbrauch eines Dienstes zu verhindern, der uns pro Anfrage Geld kostet, und die Genauigkeit unserer Bewertung zu verbessern.",
        },
        {
          p: "Soweit wir uns auf Ihre Einwilligung stützen, können Sie diese durch Schließen Ihres Kontos widerrufen.",
        },
      ],
    },

    deletion: {
      heading: "7. Ihr Konto löschen — und was wir behalten",
      body: [
        {
          p: "Sie können Ihr Konto selbst in den Kontoeinstellungen löschen oder uns unter {email} darum bitten. Das Löschen entfernt Ihren Namen, Ihr Profilbild, Ihr Passwort, Ihre gespeicherten Einstellungen und die Verbindung zwischen Ihnen und Ihren Suchanfragen.",
        },
        {
          p: "Zwei Dinge behalten wir bewusst, und wir sagen es Ihnen lieber, als es Sie vermuten zu lassen:",
        },
        {
          ul: [
            "Ihre E-Mail-Adresse, damit wir das Konto wiedererkennen und ein von Ihnen bezahltes Credit-Guthaben zurückgeben können, falls Sie wiederkommen.",
            "Ihre Zahlungsbelege — Beträge, Daten und Währung —, die wir nach Steuer- und Buchhaltungsrecht aufbewahren müssen.",
          ],
        },
        {
          p: "Wenn Sie möchten, dass auch Ihre E-Mail-Adresse entfernt wird, schreiben Sie an {email} und sagen Sie es. Danach können wir Sie nicht mehr wiedererkennen, ein früheres Guthaben lässt sich dann nicht mehr zurückgeben.",
        },
        {
          p: "Die von Ihnen gesuchten Fragen bleiben in dem in Abschnitt 5 beschriebenen gemeinsamen Bestand, weil sie nach dem Löschen nicht mehr Ihnen zugeordnet sind.",
        },
      ],
    },

    rights: {
      heading: "8. Ihre Möglichkeiten",
      body: [
        {
          p: "Schreiben Sie an {email}, um eine Kopie der Daten zu erhalten, die wir über Sie führen, sie berichtigen zu lassen oder ihrer Verwendung zu widersprechen. Wir antworten binnen 30 Tagen.",
        },
        {
          p: "Je nach Wohnort haben Sie zudem das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren. Uns wäre lieber, Sie kämen zuerst zu uns, aber der Weg steht Ihnen offen.",
        },
      ],
    },

    children: {
      heading: "9. Kinder",
      body: [
        {
          p: "AnswerGap richtet sich nicht an Personen unter 16 Jahren, und wir erheben deren Daten nicht wissentlich. Wenn Sie glauben, ein Kind habe ein Konto angelegt, schreiben Sie an {email}, und wir entfernen es.",
        },
      ],
    },

    transfers: {
      heading: "10. Wo die Daten liegen",
      body: [
        {
          p: "Wir arbeiten aus den Vereinigten Staaten, und unsere Anbieter betreiben ihre Dienste in den Vereinigten Staaten und der Europäischen Union. Die Nutzung des Dienstes bedeutet, dass Ihre Daten in beiden verarbeitet werden können.",
        },
      ],
    },

    changes: {
      heading: "11. Änderungen dieser Erklärung",
      body: [
        {
          p: "Änderungen veröffentlichen wir auf dieser Seite und aktualisieren das Datum oben. Betrifft eine Änderung Sie wesentlich, informieren wir Kontoinhaberinnen und Kontoinhaber per E-Mail, statt darauf zu bauen, dass Sie es bemerken.",
        },
        { p: "Fragen dazu:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
      ],
    },
  },
};
