'use client'

// Texts for the public website (marketing pages). The Gästemappe keeps using dictionaries.ts.
// German texts come verbatim from docs/KONZEPT.md (spelling fixes only). Add one top-level key per page;
// `en` is typed against `de`, so TypeScript flags missing translations.

import { useLanguage } from './LanguageContext'

const de = {
  nav: {
    home: 'Startseite',
    ferienhaus: 'Das Ferienhaus',
    urlaub: 'Urlaub & Umgebung',
    firmen: 'Firmen & Langzeitgäste',
    preise: 'Preise & Verfügbarkeit',
    bewertungen: 'Gästebewertungen',
    kontakt: 'Kontakt',
    menuOpen: 'Menü öffnen',
    menuClose: 'Menü schließen',
    mainNav: 'Hauptnavigation',
    guestbook: 'Gästemappe',
    guestbookHint: 'Für gebuchte Gäste',
  },
  footer: {
    tagline: 'Mehr als eine Unterkunft. Ein Zuhause auf Zeit.',
    region: 'Ferienhaus im Raum Neumünster, Schleswig-Holstein',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    guestbook: 'Gästemappe für gebuchte Gäste',
  },
  placeholder: 'Platzhalter',
  gallery: {
    open: 'Foto vergrößern',
    close: 'Schließen',
    prev: 'Vorheriges Foto',
    next: 'Nächstes Foto',
    counter: (i: number, n: number) => `Foto ${i} von ${n}`,
  },
  home: {
    guestbookNotice: 'Bereits gebucht?',
    guestbookLink: 'Zur Gästemappe',
    title: 'Haus im Grünen',
    claim: 'Ankommen. Wohlfühlen. Durchatmen.',
    lead: 'Ihr Ferienhaus für erholsame Urlaubstage und komfortable berufliche Aufenthalte in Schleswig-Holstein.',
    paragraphs: [
      'Genießen Sie die Ruhe der ländlichen Umgebung und den Komfort eines vollständig ausgestatteten Hauses, das Ihnen während Ihres Aufenthalts ganz allein zur Verfügung steht.',
      'Ob Familienurlaub, eine kleine Auszeit vom Alltag oder ein mehrwöchiger beruflicher Aufenthalt – unser Haus bietet Ihnen viel Platz, Privatsphäre und die Freiheit, Ihren Tag ganz nach Ihren Wünschen zu gestalten.',
    ],
    quote: 'Mehr als eine Unterkunft – ein Zuhause auf Zeit.',
    urlaub: {
      title: 'Urlaub & Erholung',
      text: 'Entdecken Sie unser gemütliches Ferienhaus, den großzügigen Garten und die Möglichkeiten für einen erholsamen Aufenthalt.',
      button: 'Ferienhaus entdecken',
    },
    firmen: {
      title: 'Firmen & Langzeitgäste',
      text: 'Komfortabel wohnen und ungestört arbeiten – mit drei separaten Schlafzimmern, Glasfaserinternet und attraktiven Konditionen für längere Aufenthalte.',
      button: 'Firmenunterkunft entdecken',
    },
    photosTitle: 'Einblicke',
    photosLink: 'Alle Fotos ansehen',
    ctaTitle: 'Wir freuen uns auf Ihren Besuch!',
    ctaText:
      'Sie möchten Ihren Urlaub bei uns verbringen oder suchen eine komfortable Unterkunft für Ihre Mitarbeiter?',
    ctaButton: 'Anfrage senden',
  },
  ferienhaus: {
    title: 'Das Ferienhaus',
    sections: [
      {
        title: 'Viel Platz zum Wohlfühlen',
        paragraphs: [
          'Unser liebevoll eingerichtetes Ferienhaus bietet Ihnen den Komfort und die Unabhängigkeit eines eigenen Zuhauses.',
          'Drei separate Schlafzimmer, ein gemütlicher Wohnbereich mit Kaminofen, eine umfangreich ausgestattete Küche und ein großzügiger Garten sorgen dafür, dass Sie sich vom ersten Tag an wohlfühlen können.',
          'Ob Sie gemeinsam Zeit verbringen oder sich zwischendurch zurückziehen möchten – hier finden Sie den passenden Platz.',
        ],
      },
      {
        title: 'Kochen wie zu Hause',
        paragraphs: [
          'Unsere Küche lässt kaum Wünsche offen.',
          'Neben Cerankochfeld, Backofen, Mikrowelle und Kühl-Gefrierkombination stehen Ihnen unter anderem eine Heißluftfritteuse, eine Kaffeemaschine und ein Mixer zur Verfügung.',
          'Ob ein gemütliches Frühstück, eine schnelle Mahlzeit zwischendurch oder ein gemeinsames Abendessen – Sie können sich ganz nach Ihren eigenen Wünschen versorgen.',
        ],
      },
      {
        title: 'Entspannen und genießen',
        paragraphs: [
          'Nach einem erlebnisreichen Urlaubstag oder einem langen Arbeitstag lädt der gemütliche Wohnbereich zum Entspannen ein.',
          'An kühleren Tagen sorgt der Kaminofen für eine besonders behagliche Atmosphäre.',
          'Der großzügige Garten bietet Platz zum Verweilen und Genießen.',
        ],
      },
      {
        title: 'Gut verbunden – auch im Grünen',
        paragraphs: [
          'Dank unseres schnellen Glasfaseranschlusses müssen Sie auch in ländlicher Umgebung nicht auf leistungsfähiges Internet verzichten.',
          'Ob Videokonferenz, mobiles Arbeiten oder ein gemütlicher Streamingabend – bei uns lassen sich Erholung und digitale Anforderungen gut miteinander verbinden.',
        ],
      },
    ],
    amenitiesTitle: 'Ausstattung auf einen Blick',
    // Order matches the icons in src/app/(site)/ferienhaus/FerienhausContent.tsx
    amenities: [
      'Drei separate Schlafzimmer',
      'Gemütlicher Wohnbereich mit Kaminofen und Smart-TV',
      'Voll ausgestattete Küche mit zahlreichen Elektrogeräten',
      'Badezimmer mit Dusche und Badewanne',
      'Zusätzliches Gäste-WC',
      'Schnelles Glasfaserinternet und WLAN',
      'Großer Garten',
      'Kostenfreie Parkmöglichkeiten einschließlich Doppelcarport',
      'Bügeleisen und Bügelbrett',
      'Kinderreisebett und Kinderhochstuhl',
    ],
    galleryTitle: 'Räume und Garten',
    ctaText: 'Lust bekommen? Fragen Sie Ihren Wunschzeitraum unverbindlich an.',
    ctaButton: 'Anfrage senden',
  },
  kontakt: {
    title: 'Wir freuen uns auf Ihren Besuch!',
    paragraphs: [
      'Sie möchten Ihren Urlaub bei uns verbringen oder suchen eine komfortable Unterkunft für Ihre Mitarbeiter?',
      'Schreiben Sie uns gerne und teilen Sie uns Ihren gewünschten Reisezeitraum sowie die Anzahl der Gäste mit.',
      'Wir freuen uns auf Ihre Anfrage und melden uns schnellstmöglich bei Ihnen.',
    ],
    closing: 'Haus im Grünen – Mehr als eine Unterkunft. Ein Zuhause auf Zeit.',
    chooseLabel: 'Worum geht es?',
    chooseUrlaub: 'Urlaub',
    chooseFirma: 'Firmenanfrage',
  },
  urlaub: {
    title: 'Urlaub & Umgebung',
    sections: [
      {
        title: 'Urlaub abseits von Hektik und Trubel',
        paragraphs: [
          'Manchmal braucht es gar nicht viel, um sich zu erholen: ein gemütliches Zuhause auf Zeit, viel Grün und die Freiheit, den Tag ganz nach den eigenen Vorstellungen zu gestalten.',
          'Unser Ferienhaus ist ein schöner Rückzugsort für alle, die Ruhe, Natur und Unabhängigkeit schätzen.',
          'Beginnen Sie den Morgen mit einem gemütlichen Frühstück, genießen Sie die ländliche Umgebung und lassen Sie den Abend ganz entspannt ausklingen.',
          'Hier müssen Sie sich nicht nach Hotelzeiten richten. Sie entscheiden selbst, wie Ihr Urlaubstag aussieht.',
        ],
      },
      {
        title: 'Zeit für gemeinsame Erlebnisse',
        paragraphs: [
          'Ob als Paar, mit der Familie oder mit Freunden – unser Haus bietet eine schöne Grundlage für einen abwechslungsreichen Aufenthalt in Schleswig-Holstein.',
          'Entdecken Sie die Region bei Ausflügen oder genießen Sie einfach die Ruhe und den Komfort Ihres Ferienhauses.',
        ],
      },
    ],
    lageTitle: 'Lage & Umgebung',
    lageHeading: 'Ruhe genießen und Schleswig-Holstein entdecken',
    lageParagraphs: [
      'Unser Haus liegt in ruhiger, ländlicher Umgebung im Raum Neumünster.',
      'Die grüne Umgebung lädt zum Entspannen ein und bietet einen angenehmen Ausgleich zum Alltag.',
      'Gleichzeitig ist das Ferienhaus ein Ausgangspunkt für Unternehmungen in der Region und für berufliche Einsätze im näheren und weiteren Umfeld.',
    ],
    mapTitle: 'Karte',
    mapNote:
      'Die Karte wird von OpenStreetMap geladen. Erst nach dem Klick werden Daten (u. a. Ihre IP-Adresse) an die OpenStreetMap Foundation übertragen.',
    mapButton: 'Karte laden',
    mapCaption: 'Ungefähre Lage: Rendswühren, Kreis Plön, Schleswig-Holstein',
    mapLabel: 'Karte der Umgebung von Rendswühren',
    distancesTitle: 'Entfernungen',
    distancesPlaceholder:
      'Fahrzeiten und Entfernungen (z. B. Neumünster, Kiel, Plön, Ostseeküste, Autobahn) – vor Veröffentlichung prüfen.',
    shoppingTitle: 'Einkaufen',
    shoppingPlaceholder: 'Einkaufsmöglichkeiten in der Nähe (Supermarkt, Bäcker, Hofladen) mit Entfernung.',
    tipsTitle: 'Ausflugsziele und Restaurants',
    tipsIntro: 'Unsere persönlichen Empfehlungen für die Region.',
    mapsLink: 'Karte',
    websiteLink: 'Website',
  },
  firmen: {
    title: 'Firmen & Langzeitgäste',
    heading: 'Wohnen und Arbeiten auf Zeit',
    claim: 'Die komfortable Alternative zum klassischen Monteurzimmer.',
    paragraphs: [
      'Sie suchen eine Unterkunft für Mitarbeiter, Außendienstmitarbeiter oder Projektteams im Raum Neumünster und Umgebung?',
      'Unser vollständig ausgestattetes Ferienhaus bietet ideale Voraussetzungen für berufliche Aufenthalte – auch über mehrere Wochen oder Monate.',
      'Ihre Mitarbeiter genießen die Vorzüge eines ganzen Hauses zur exklusiven Nutzung.',
    ],
    ctaTop: 'Firmenangebot anfragen',
    comfortTitle: 'Komfort für Ihre Mitarbeiter',
    // Order matches the icons in src/app/(site)/firmen/FirmenContent.tsx
    comfort: [
      {
        title: 'Drei separate Schlafzimmer',
        text: 'Bei einer Belegung mit bis zu drei Mitarbeitern steht jedem ein eigenes Schlafzimmer zur Verfügung. So bleibt auch bei gemeinsamen beruflichen Aufenthalten ausreichend Privatsphäre.',
      },
      {
        title: 'Vollständig ausgestattete Küche',
        text: 'Die Mitarbeiter können sich unabhängig von Restaurantöffnungszeiten selbst versorgen. Dafür stehen zahlreiche Küchengeräte zur Verfügung, darunter Backofen, Mikrowelle, Heißluftfritteuse, Cerankochfeld und Kaffeemaschine.',
      },
      {
        title: 'Glasfaserinternet für mobiles Arbeiten',
        text: 'Auch Arbeitstage am PC lassen sich bei uns gut verbringen. Der schnelle Glasfaseranschluss bietet die Voraussetzungen für berufliche Online-Tätigkeiten und Videokonferenzen.',
      },
      {
        title: 'Entspannung nach Feierabend',
        text: 'Statt eines einzelnen Zimmers steht den Mitarbeitern ein komplettes Haus mit gemütlichem Wohnbereich und Garten zur Verfügung.',
      },
      {
        title: 'Praktische Ausstattung',
        text: 'Bügeleisen und Bügelbrett stehen für die Pflege der Dienstkleidung bereit. Ein Wäscheservice kann nach Absprache gegen Aufpreis angeboten werden.',
      },
      { title: 'Parken direkt am Haus', text: 'Kostenfreie Parkmöglichkeiten stehen zur Verfügung.' },
    ],
    conditionsTitle: 'Attraktive Konditionen für längere Aufenthalte',
    conditions: [
      'Wir bieten Unternehmen gestaffelte Preise, abhängig von der Anzahl der Mitarbeiter und der Aufenthaltsdauer.',
      'Das gesamte Haus wird grundsätzlich exklusiv an eine Firma beziehungsweise eine zusammengehörige Mitarbeitergruppe vermietet.',
      'Auch längerfristige Buchungen über mehrere Wochen oder Monate sind möglich.',
    ],
    conditionsHighlight: 'Fragen Sie uns nach einem individuellen Firmenangebot.',
    formTitle: 'Firmenanfrage',
  },
  preise: {
    title: 'Preise & Verfügbarkeit',
    heading: 'Ihr Aufenthalt im Haus im Grünen',
    paragraphs: [
      'Unsere Übernachtungspreise richten sich nach Saison, Aufenthaltsdauer und Personenzahl.',
      'Für längere Aufenthalte und Firmenbuchungen bieten wir gesonderte Konditionen an.',
      'Gerne informieren wir Sie über die Verfügbarkeit und erstellen Ihnen ein passendes Angebot.',
    ],
    tableTitle: 'Saisonpreise 2027',
    tablePlaceholder: 'Saisonzeiträume, Preise und Mindestaufenthalte aus der Preisliste 2027.',
    columns: ['Saison', 'Zeitraum', 'Preis pro Nacht', 'Mindestaufenthalt'],
    seasons: ['Nebensaison', 'Zwischensaison', 'Hauptsaison'],
    costsTitle: 'Endreinigung und weitere Kosten',
    costsPlaceholder:
      'Endreinigung und alle weiteren Kosten (z. B. Bettwäsche und Handtücher, ggf. Kurabgabe, Kaution) mit Betrag – werden hier transparent ausgewiesen.',
    calendarTitle: 'Verfügbarkeit',
    calendarNote:
      'Ein Belegungskalender folgt. Bis dahin prüfen wir die Verfügbarkeit gern für Ihren Wunschzeitraum.',
    bookingLabel: 'Urlaub',
    bookingButton: 'Buchungsanfrage senden',
    firmaLabel: 'Für Firmen',
    firmaText: 'Gesonderte Konditionen für Firmenbuchungen und längere Aufenthalte',
    firmaButton: 'Firmenanfrage senden',
  },
  bewertungen: {
    title: 'Gästebewertungen',
    heading: 'Das sagen unsere Gäste',
    paragraphs: [
      'Wir freuen uns, wenn sich unsere Gäste bei uns wohlfühlen.',
      'Besonders schön ist es, wenn die ruhige Umgebung, die umfangreiche Ausstattung und die persönliche Betreuung in guter Erinnerung bleiben.',
    ],
    reviewPlaceholder: 'Echte Gästebewertung mit Quellenangabe folgt (Text unverändert, Nutzungsrechte geklärt).',
    author: 'Name des Gastes',
    source: 'Quelle, z. B. Airbnb',
    date: 'Monat/Jahr',
  },
  impressum: {
    title: 'Impressum',
    heading: 'Angaben gemäß § 5 DDG',
    provider: 'Anbieter',
    providerPlaceholder: 'Vor- und Nachname bzw. Firmenname des Anbieters',
    address: 'Anschrift',
    addressPlaceholder: 'Straße und Hausnummer, PLZ und Ort (ladungsfähige Anschrift)',
    contact: 'Kontakt',
    contactPlaceholder: 'E-Mail-Adresse und Telefonnummer',
    vat: 'Umsatzsteuer-ID',
    vatPlaceholder: 'Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG – nur falls vorhanden, sonst entfällt dieser Abschnitt',
  },
  datenschutz: {
    title: 'Datenschutzerklärung',
    sections: [
      {
        heading: 'Verantwortlicher',
        text: 'Verantwortlich für die Datenverarbeitung auf dieser Website ist der im Impressum genannte Anbieter.',
      },
      {
        heading: 'Hosting',
        text: 'Diese Website wird über GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA) ausgeliefert. Beim Aufruf der Seiten verarbeitet GitHub technisch notwendige Daten wie Ihre IP-Adresse, Datum und Uhrzeit sowie die aufgerufene Seite, um die Website bereitzustellen und ihre Sicherheit zu gewährleisten. Dabei können Daten in die USA übermittelt werden. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.',
      },
      {
        heading: 'Anfrageformular',
        text: 'Wenn Sie uns über das Anfrageformular schreiben, verarbeiten wir die von Ihnen eingegebenen Daten: Name, bei Firmenanfragen Firmenname und Ansprechpartner, E-Mail-Adresse, Telefonnummer, gewünschter Reisezeitraum, Anzahl der Gäste bzw. Mitarbeiter, Ihre Nachricht sowie die gewählte Sprache. Zweck ist ausschließlich die Beantwortung Ihrer Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung eines Mietvertrags) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung allgemeiner Anfragen). Die Übermittlung erfolgt über Amazon Web Services EMEA SARL (38 Avenue John F. Kennedy, L-1855 Luxemburg) als Auftragsverarbeiter: Eine Funktion in AWS Lambda nimmt die Anfrage in der Region Frankfurt (eu-central-1) entgegen und leitet sie über Amazon Simple Email Service (SES) per E-Mail an den Gastgeber weiter. Die Anfrage wird dabei nicht in einer Datenbank gespeichert; technische Protokolle ohne Kontaktdaten (Art der Anfrage, Reisezeitraum) werden nach 30 Tagen automatisch gelöscht. Wir löschen Ihre Anfrage, sobald sie erledigt ist, es sei denn, es kommt zu einer Buchung; dann gelten die gesetzlichen Aufbewahrungsfristen.',
      },
      {
        heading: 'Karte (OpenStreetMap)',
        text: 'Auf der Seite „Urlaub & Umgebung“ kann eine Karte von OpenStreetMap (OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Vereinigtes Königreich) angezeigt werden. Die Karte wird erst geladen, wenn Sie auf „Karte laden“ klicken. Erst dann werden Daten wie Ihre IP-Adresse an die OpenStreetMap Foundation übertragen. Rechtsgrundlage ist Ihre Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO). Für das Vereinigte Königreich besteht ein Angemessenheitsbeschluss der EU-Kommission.',
      },
      {
        heading: 'Schriftarten',
        text: 'Die verwendeten Schriftarten werden zusammen mit der Website von unserem eigenen Hosting ausgeliefert. Es besteht keine Verbindung zu Servern von Google oder anderen Schriftanbietern.',
      },
      {
        heading: 'Lokale Speicherung',
        text: 'Ihre Sprachwahl (Deutsch/Englisch) und, in der Gästemappe, die Bestätigung der Hausregeln werden im lokalen Speicher (localStorage) Ihres Browsers abgelegt. Diese Informationen verlassen Ihr Gerät nicht und werden nicht an uns oder Dritte übertragen.',
      },
      {
        heading: 'Reichweitenmessung',
        text: 'Sofern aktiviert, verwenden wir GoatCounter zur anonymen, cookie-freien Reichweitenmessung. Es werden keine personenbezogenen Profile erstellt.',
      },
      {
        heading: 'Externe Links',
        text: 'Die Website verlinkt auf externe Angebote, u. a. Airbnb, Google Maps (Google Ireland Limited) sowie die Webseiten empfohlener Restaurants und Ausflugsziele. Erst wenn Sie einen solchen Link anklicken, werden Sie zur jeweiligen Webseite weitergeleitet; für deren Datenschutz sind die Anbieter selbst verantwortlich.',
      },
      {
        heading: 'Ihre Rechte',
        text: 'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten, auf Datenübertragbarkeit sowie auf Widerspruch gegen eine Verarbeitung nach Art. 6 Abs. 1 lit. f DSGVO. Eine Einwilligung können Sie jederzeit für die Zukunft widerrufen. Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, in Schleswig-Holstein beim Unabhängigen Landeszentrum für Datenschutz (ULD).',
      },
    ],
  },
  form: {
    name: 'Name',
    company: 'Firmenname',
    contactPerson: 'Ansprechpartner',
    email: 'E-Mail',
    phone: 'Telefon',
    optional: 'optional',
    arrival: 'Anreise',
    departure: 'Abreise',
    guests: 'Anzahl Gäste',
    employees: 'Anzahl Mitarbeiter',
    message: 'Nachricht',
    wishes: 'Wünsche oder Fragen',
    consentBefore: 'Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden. Mehr dazu in der ',
    consentLink: 'Datenschutzerklärung',
    consentAfter: '.',
    submit: 'Anfrage senden',
    sending: 'Wird gesendet …',
    successTitle: 'Vielen Dank für Ihre Anfrage!',
    successText: 'Wir melden uns schnellstmöglich bei Ihnen.',
    errorText:
      'Ihre Anfrage konnte leider nicht gesendet werden. Bitte versuchen Sie es später noch einmal.',
    unavailableText:
      'Das Anfrageformular ist gerade noch nicht freigeschaltet. Bitte versuchen Sie es in Kürze noch einmal.',
  },
}

export type SiteDict = typeof de

const en: SiteDict = {
  nav: {
    home: 'Home',
    ferienhaus: 'The house',
    urlaub: 'Holidays & surroundings',
    firmen: 'Business & long stays',
    preise: 'Prices & availability',
    bewertungen: 'Guest reviews',
    kontakt: 'Contact',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    mainNav: 'Main navigation',
    guestbook: 'Guest folder',
    guestbookHint: 'For booked guests',
  },
  footer: {
    tagline: 'More than a place to stay. A home for a while.',
    region: 'Holiday house near Neumünster, Schleswig-Holstein',
    imprint: 'Legal notice',
    privacy: 'Privacy',
    guestbook: 'Guest folder for booked guests',
  },
  placeholder: 'Placeholder',
  gallery: {
    open: 'Enlarge photo',
    close: 'Close',
    prev: 'Previous photo',
    next: 'Next photo',
    counter: (i: number, n: number) => `Photo ${i} of ${n}`,
  },
  home: {
    guestbookNotice: 'Already booked?',
    guestbookLink: 'Go to the guest folder',
    title: 'Haus im Grünen',
    claim: 'Arrive. Feel at home. Breathe.',
    lead: 'Your holiday house for restful holidays and comfortable business stays in Schleswig-Holstein.',
    paragraphs: [
      'Enjoy the quiet of the countryside and the comfort of a fully equipped house that is yours alone for the whole of your stay.',
      'Whether it is a family holiday, a short break from everyday life or a business stay of several weeks – our house gives you plenty of space, privacy and the freedom to spend your day exactly as you like.',
    ],
    quote: 'More than a place to stay – a home for a while.',
    urlaub: {
      title: 'Holidays & relaxation',
      text: 'Discover our cosy holiday house, the spacious garden and everything you need for a restful stay.',
      button: 'Discover the house',
    },
    firmen: {
      title: 'Business & long stays',
      text: 'Live comfortably and work undisturbed – with three separate bedrooms, fibre internet and attractive terms for longer stays.',
      button: 'Discover business stays',
    },
    photosTitle: 'A look inside',
    photosLink: 'See all photos',
    ctaTitle: 'We look forward to welcoming you!',
    ctaText:
      'Would you like to spend your holiday with us, or are you looking for comfortable accommodation for your staff?',
    ctaButton: 'Send an enquiry',
  },
  ferienhaus: {
    title: 'The house',
    sections: [
      {
        title: 'Plenty of room to feel at home',
        paragraphs: [
          'Our lovingly furnished holiday house offers you the comfort and independence of a home of your own.',
          'Three separate bedrooms, a cosy living area with a wood-burning stove, a well-equipped kitchen and a spacious garden make sure you feel at home from the very first day.',
          'Whether you want to spend time together or retreat for a while – you will find the right spot here.',
        ],
      },
      {
        title: 'Cook just like at home',
        paragraphs: [
          'Our kitchen leaves little to be desired.',
          'Besides a ceramic hob, oven, microwave and fridge-freezer, you will find an air fryer, a coffee machine and a blender, among other things.',
          'Whether it is a leisurely breakfast, a quick bite in between or dinner together – you can cater for yourselves exactly as you like.',
        ],
      },
      {
        title: 'Relax and unwind',
        paragraphs: [
          'After an eventful day out or a long day at work, the cosy living area invites you to relax.',
          'On cooler days, the wood-burning stove creates a particularly snug atmosphere.',
          'The spacious garden offers room to linger and enjoy.',
        ],
      },
      {
        title: 'Well connected – even in the countryside',
        paragraphs: [
          'Thanks to our fast fibre connection, you do not have to do without powerful internet, even in the countryside.',
          'Video calls, remote work or a cosy streaming night – here, relaxation and digital needs go together well.',
        ],
      },
    ],
    amenitiesTitle: 'Amenities at a glance',
    amenities: [
      'Three separate bedrooms',
      'Cosy living area with wood-burning stove and smart TV',
      'Fully equipped kitchen with plenty of appliances',
      'Bathroom with shower and bathtub',
      'Additional guest toilet',
      'Fast fibre internet and Wi-Fi',
      'Large garden',
      'Free parking including a double carport',
      'Iron and ironing board',
      'Travel cot and high chair',
    ],
    galleryTitle: 'Rooms and garden',
    ctaText: 'Tempted? Ask about your preferred dates without obligation.',
    ctaButton: 'Send an enquiry',
  },
  kontakt: {
    title: 'We look forward to welcoming you!',
    paragraphs: [
      'Would you like to spend your holiday with us, or are you looking for comfortable accommodation for your staff?',
      'Just write to us and let us know your preferred dates and the number of guests.',
      'We look forward to your enquiry and will get back to you as soon as possible.',
    ],
    closing: 'Haus im Grünen – More than a place to stay. A home for a while.',
    chooseLabel: 'What is your enquiry about?',
    chooseUrlaub: 'Holiday',
    chooseFirma: 'Business enquiry',
  },
  urlaub: {
    title: 'Holidays & surroundings',
    sections: [
      {
        title: 'A holiday away from the hustle and bustle',
        paragraphs: [
          'Sometimes it takes very little to unwind: a cosy home for a while, plenty of green and the freedom to spend the day just as you like.',
          'Our holiday house is a lovely retreat for anyone who values peace, nature and independence.',
          'Start the morning with a leisurely breakfast, enjoy the countryside and let the evening wind down in a relaxed way.',
          'There are no hotel times to stick to here. You decide what your holiday day looks like.',
        ],
      },
      {
        title: 'Time for shared experiences',
        paragraphs: [
          'As a couple, with family or with friends – our house is a great base for a varied stay in Schleswig-Holstein.',
          'Explore the region on day trips or simply enjoy the peace and comfort of your holiday house.',
        ],
      },
    ],
    lageTitle: 'Location & surroundings',
    lageHeading: 'Enjoy the quiet and discover Schleswig-Holstein',
    lageParagraphs: [
      'Our house is located in quiet countryside near Neumünster.',
      'The green surroundings invite you to relax and offer a welcome change from everyday life.',
      'At the same time, the house is a base for trips around the region and for work assignments near and further afield.',
    ],
    mapTitle: 'Map',
    mapNote:
      'The map is loaded from OpenStreetMap. Only after you click is data (including your IP address) sent to the OpenStreetMap Foundation.',
    mapButton: 'Load map',
    mapCaption: 'Approximate location: Rendswühren, district of Plön, Schleswig-Holstein',
    mapLabel: 'Map of the area around Rendswühren',
    distancesTitle: 'Distances',
    distancesPlaceholder:
      'Driving times and distances (e.g. Neumünster, Kiel, Plön, Baltic coast, motorway) – to be checked before publishing.',
    shoppingTitle: 'Shopping',
    shoppingPlaceholder: 'Shops nearby (supermarket, bakery, farm shop) with distance.',
    tipsTitle: 'Day trips and restaurants',
    tipsIntro: 'Our personal recommendations for the region.',
    mapsLink: 'Map',
    websiteLink: 'Website',
  },
  firmen: {
    title: 'Business & long stays',
    heading: 'Living and working for a while',
    claim: 'The comfortable alternative to the classic workers’ room.',
    paragraphs: [
      'Are you looking for accommodation for employees, field staff or project teams in the Neumünster area?',
      'Our fully equipped holiday house is ideal for business stays – including stays of several weeks or months.',
      'Your employees enjoy the benefits of an entire house for their exclusive use.',
    ],
    ctaTop: 'Request a company offer',
    comfortTitle: 'Comfort for your employees',
    comfort: [
      {
        title: 'Three separate bedrooms',
        text: 'With up to three employees, everyone has a bedroom of their own. That way there is enough privacy even on a shared business stay.',
      },
      {
        title: 'Fully equipped kitchen',
        text: 'Your employees can cater for themselves regardless of restaurant opening hours. Plenty of kitchen appliances are available, including an oven, microwave, air fryer, ceramic hob and coffee machine.',
      },
      {
        title: 'Fibre internet for remote work',
        text: 'Working days at the computer are easy here too. The fast fibre connection is well suited to online work and video calls.',
      },
      {
        title: 'Relaxing after work',
        text: 'Instead of a single room, your employees have a whole house with a cosy living area and garden.',
      },
      {
        title: 'Practical extras',
        text: 'An iron and ironing board are ready for work clothes. A laundry service can be arranged for an extra charge.',
      },
      { title: 'Parking right by the house', text: 'Free parking is available.' },
    ],
    conditionsTitle: 'Attractive terms for longer stays',
    conditions: [
      'We offer companies tiered prices, depending on the number of employees and the length of stay.',
      'The whole house is generally let exclusively to one company or one group of employees travelling together.',
      'Longer bookings of several weeks or months are also possible.',
    ],
    conditionsHighlight: 'Ask us for an individual company offer.',
    formTitle: 'Company enquiry',
  },
  preise: {
    title: 'Prices & availability',
    heading: 'Your stay at Haus im Grünen',
    paragraphs: [
      'Our nightly rates depend on the season, the length of stay and the number of guests.',
      'We offer separate terms for longer stays and company bookings.',
      'We will gladly let you know about availability and put together a suitable offer.',
    ],
    tableTitle: 'Seasonal prices 2027',
    tablePlaceholder: 'Season periods, prices and minimum stays from the 2027 price list.',
    columns: ['Season', 'Period', 'Price per night', 'Minimum stay'],
    seasons: ['Low season', 'Mid season', 'High season'],
    costsTitle: 'Final cleaning and other costs',
    costsPlaceholder:
      'Final cleaning and all other costs (e.g. bed linen and towels, tourist tax if applicable, deposit) with amounts – shown here transparently.',
    calendarTitle: 'Availability',
    calendarNote: 'An availability calendar will follow. Until then, we are happy to check your preferred dates for you.',
    bookingLabel: 'Holiday',
    bookingButton: 'Send a booking enquiry',
    firmaLabel: 'For companies',
    firmaText: 'Separate terms for company bookings and longer stays',
    firmaButton: 'Send a company enquiry',
  },
  bewertungen: {
    title: 'Guest reviews',
    heading: 'What our guests say',
    paragraphs: [
      'We are delighted when our guests feel at home with us.',
      'It is especially lovely when the quiet surroundings, the extensive amenities and the personal care are fondly remembered.',
    ],
    reviewPlaceholder: 'Genuine guest review with source to follow (text unchanged, usage rights cleared).',
    author: 'Guest name',
    source: 'Source, e.g. Airbnb',
    date: 'Month/year',
  },
  impressum: {
    title: 'Legal notice',
    heading: 'Information pursuant to § 5 DDG (German Digital Services Act)',
    provider: 'Provider',
    providerPlaceholder: 'First and last name or company name of the provider',
    address: 'Address',
    addressPlaceholder: 'Street and number, postcode and town (address for service)',
    contact: 'Contact',
    contactPlaceholder: 'Email address and phone number',
    vat: 'VAT ID',
    vatPlaceholder: 'VAT identification number pursuant to § 27a UStG – only if available, otherwise this section is omitted',
  },
  datenschutz: {
    title: 'Privacy policy',
    sections: [
      {
        heading: 'Controller',
        text: 'The controller responsible for data processing on this website is the provider named in the legal notice.',
      },
      {
        heading: 'Hosting',
        text: 'This website is served via GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). When you visit, GitHub processes technically necessary data such as your IP address, date and time and the page requested, in order to deliver the website and keep it secure. Data may be transferred to the USA in the process. The legal basis is Art. 6(1)(f) GDPR.',
      },
      {
        heading: 'Enquiry form',
        text: 'If you write to us using the enquiry form, we process the data you enter: name, for company enquiries the company name and contact person, email address, phone number, preferred dates, number of guests or employees, your message and the language selected. The sole purpose is to answer your enquiry. The legal basis is Art. 6(1)(b) GDPR (steps prior to a rental contract) and Art. 6(1)(f) GDPR (legitimate interest in answering general enquiries). The enquiry is transmitted via Amazon Web Services EMEA SARL (38 Avenue John F. Kennedy, L-1855 Luxembourg) as processor: a function in AWS Lambda receives it in the Frankfurt region (eu-central-1) and forwards it by email to the host via Amazon Simple Email Service (SES). The enquiry is not stored in a database; technical logs without contact details (type of enquiry, dates) are deleted automatically after 30 days. We delete your enquiry once it has been dealt with, unless a booking follows; in that case statutory retention periods apply.',
      },
      {
        heading: 'Map (OpenStreetMap)',
        text: 'The “Holidays & surroundings” page can show a map from OpenStreetMap (OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, United Kingdom). The map is only loaded when you click “Load map”. Only then is data such as your IP address sent to the OpenStreetMap Foundation. The legal basis is your consent given by clicking (Art. 6(1)(a) GDPR). An EU adequacy decision exists for the United Kingdom.',
      },
      {
        heading: 'Fonts',
        text: 'The fonts used are delivered together with the website from our own hosting. There is no connection to Google or any other font provider.',
      },
      {
        heading: 'Local storage',
        text: 'Your language choice (German/English) and, in the guest folder, your confirmation of the house rules are stored in your browser’s local storage (localStorage). This information never leaves your device and is not transmitted to us or any third party.',
      },
      {
        heading: 'Analytics',
        text: 'If enabled, we use GoatCounter for anonymous, cookie-free analytics. No personal profiles are created.',
      },
      {
        heading: 'External links',
        text: 'This website links to external services, including Airbnb, Google Maps (Google Ireland Limited) and the websites of recommended restaurants and destinations. You are only taken to the respective website when you click such a link; the providers themselves are responsible for its privacy practices.',
      },
      {
        heading: 'Your rights',
        text: 'You have the right to access, rectification, erasure and restriction of processing of your data, to data portability and to object to processing based on Art. 6(1)(f) GDPR. You can withdraw consent at any time with effect for the future. You can also lodge a complaint with a data protection supervisory authority; in Schleswig-Holstein this is the Unabhängiges Landeszentrum für Datenschutz (ULD).',
      },
    ],
  },
  form: {
    name: 'Name',
    company: 'Company name',
    contactPerson: 'Contact person',
    email: 'Email',
    phone: 'Phone',
    optional: 'optional',
    arrival: 'Arrival',
    departure: 'Departure',
    guests: 'Number of guests',
    employees: 'Number of employees',
    message: 'Message',
    wishes: 'Requests or questions',
    consentBefore: 'I agree that my details may be used to process this enquiry. Find out more in the ',
    consentLink: 'privacy policy',
    consentAfter: '.',
    submit: 'Send enquiry',
    sending: 'Sending …',
    successTitle: 'Thank you for your enquiry!',
    successText: 'We will get back to you as soon as possible.',
    errorText: 'Unfortunately your enquiry could not be sent. Please try again later.',
    unavailableText: 'The enquiry form is not switched on yet. Please try again shortly.',
  },
}

export const site = { de, en }

export function useSite(): SiteDict {
  return site[useLanguage().locale]
}
