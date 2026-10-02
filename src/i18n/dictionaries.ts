export type Locale = 'de' | 'en'

export const LOCALES: Locale[] = ['de', 'en']
export const DEFAULT_LOCALE: Locale = 'de'

interface ActivityItem {
  name: string
  distance: string
  detail: string
  mapsQuery?: string
  website?: string
}

interface RuleItemDict {
  label: string
  detail?: string
}

interface RuleGroupDict {
  title: string
  items: RuleItemDict[]
}

interface ActivityGroupDict {
  title: string
  items: ActivityItem[]
}

export interface TourUiDict {
  back: string
  modes: string
  modeWalk: string
  modeDollhouse: string
  modeTop: string
  modeChanged: { walk: string; dollhouse: string; top: string }
  rooms: string
  currentRoom: string
  map: string
  mapShow: string
  mapHide: string
  help: string
  helpTitle: string
  helpClose: string
  helpItems: { keys: string; text: string }[]
  helpTouch: string
  bob: string
  hintMouse: string
  lockMouse: string
  hintTouch: string
  stick: string
  /** graphics quality button label per level: high, medium, low */
  qualityNames: [string, string, string]
  canvasDescription: string
}

export interface Dictionary {
  meta: { title: string; description: string }
  header: { subtitle: string; bookNow: string }
  hero: {
    pill: string
    title1: string
    title2: string
    subtitle: string
    tags: string[]
  }
  gallery: { viewAll: string }
  wlan: {
    heading: string
    locked: string
    speedSuffix: string
    passwordLabel: string
    passwordPrefix: string
    passwordBold: string
    passwordSuffix: string
  }
  hausregeln: { heading: string; groups: RuleGroupDict[] }
  preise: {
    heading: string
    cleaningFee: string
    cleaningIncludes: string
    bedding: string
    beddingPrice: string
    beddingDetail: string
    extraBedding: string
    extraBeddingPrice: string
    firewood: string
    firewoodPrice: string
    firewoodDetail: string
    grillPackage: string
    grillPrice: string
    grillDetail: string
    note: string
  }
  ausstattung: { heading: string; items: string[] }
  ausflugsziele: {
    heading: string
    intro: string
    groups: ActivityGroupDict[]
  }
  cta: { heading: string; text: string; button: string }
  tour: {
    page: {
      title: string
      description: string
      back: string
      canvasLabel: string
      loading: string
      start: string
      startHint: string
      loadingSteps: { download: string; textures: string; geometry: string; furniture: string; lighting: string }
      noWebglTitle: string
      noWebglText: string
      planAlt: string
      planCaption: string
      retry: string
      error: string
    }
    teaser: { pill: string; heading: string; text: string; button: string; imageAlt: string }
    ui: TourUiDict
  }
  footer: {
    hostPrefix: string
    hostName: string
    hostSuffix: string
    listing: string
    privacy: string
    scanHint: string
  }
  rules: {
    title: string
    subtitle: string
    sections: RuleGroupDict[]
    note: string
    scrollHint: string
    accept: string
  }
  datenschutz: {
    title: string
    siteHeading: string
    siteText: string
    storageHeading: string
    storageText: string
    analyticsHeading: string
    analyticsText: string
    linksHeading: string
    linksText: string
  }
}

export const dictionaries: Record<Locale, Dictionary> = {
  de: {
    meta: {
      title: 'Haus im Grünen – Ferienhaus Rendswühren',
      description:
        'Idyllisches Ferienhaus mit großem Garten und Feldblick in Rendswühren, Schleswig-Holstein. 104 m², 3 Schlafzimmer, Kamin, WLAN.',
    },
    header: { subtitle: 'Rendswühren, Schleswig-Holstein', bookNow: 'Jetzt buchen' },
    hero: {
      pill: 'Ferienhaus',
      title1: 'Willkommen im',
      title2: 'Haus im Grünen',
      subtitle:
        'Genieße die Ruhe, frische Landluft und den Blick übers Feld in Rendswühren, Schleswig-Holstein.',
      tags: ['104 m²', '5 Gäste', '3 Schlafzimmer', 'Garten', 'Kamin', 'WLAN 200 Mbit/s'],
    },
    gallery: { viewAll: 'Alle Fotos auf Airbnb ansehen →' },
    wlan: {
      heading: 'WLAN',
      locked:
        'Bitte lies und akzeptiere zuerst die Hausregeln — dann erfährst du, wo das WLAN-Passwort zu finden ist.',
      speedSuffix: '200 Mbit/s',
      passwordLabel: 'WLAN-Passwort',
      passwordPrefix: 'Das WLAN-Passwort findest du auf einem ',
      passwordBold: 'Aufsteller in der Küche',
      passwordSuffix: '.',
    },
    hausregeln: {
      heading: 'Hausregeln',
      groups: [
        {
          title: 'Check-in & Check-out',
          items: [{ label: 'Check-in ab 15:00 Uhr' }, { label: 'Check-out vor 10:00 Uhr' }],
        },
        {
          title: 'Während deines Aufenthalts',
          items: [
            { label: 'Höchstens 5 Gäste' },
            { label: 'Keine Haustiere' },
            { label: 'Keine Partys oder Veranstaltungen' },
            { label: 'Kein kommerzielles Fotografieren' },
            { label: 'Rauchen verboten (nur auf den Terrassen)' },
          ],
        },
        {
          title: 'Zusätzliche Regeln',
          items: [
            {
              label: 'Mülltrennung',
              detail:
                'Gekennzeichnete Behälter in der Unterkunft — bitte nach Aufenthalt in die Mülltonnen vor dem Haus entsorgen.',
            },
            {
              label: 'Geschirr vor Auszug abwaschen',
              detail:
                'Bitte trocken und sauber zurück in die Schränke stellen. Geschirrspüler nicht erst bei Auszug anstellen.',
            },
            {
              label: 'Parken',
              detail:
                'Kostenloses Doppelcarport vorhanden. Bitte rücksichtsvoll parken, damit die Auffahrt nicht blockiert wird.',
            },
            {
              label: 'Rauchverbot drinnen — 500 € Ozonreinigung',
              detail: 'Im Außenbereich stehen auf den Terrassen Aschenbecher und Sitzgelegenheiten bereit.',
            },
          ],
        },
        {
          title: 'Vor der Abreise',
          items: [
            { label: 'Müll entsorgen' },
            { label: 'Alle Geräte ausschalten' },
            { label: 'Schlüssel zurückgeben' },
            { label: 'Abwasch erledigen & Geschirrspüler ausräumen' },
          ],
        },
        {
          title: 'Sicherheit',
          items: [
            { label: 'Kohlenmonoxidmelder vorhanden' },
            { label: 'Rauchmelder vorhanden' },
          ],
        },
      ],
    },
    preise: {
      heading: 'Preise & Extras',
      cleaningFee: 'Reinigungsgebühr (einmalig)',
      cleaningIncludes: 'Inkl. Reinigung und 2 Handtücher p. P.',
      bedding: 'Bettwäsche',
      beddingPrice: 'einmalig kostenfrei',
      beddingDetail: 'Für alle Gäste bereits gestellt — du musst keine eigene mitbringen.',
      extraBedding: 'Ersatzbettwäsche',
      extraBeddingPrice: '20 € / Person',
      firewood: 'Kaminholz',
      firewoodPrice: '15 €',
      firewoodDetail: 'Erster Korb kostenlos, jeder weitere 15 €',
      grillPackage: 'Grillpaket',
      grillPrice: '20 €',
      grillDetail: 'Grill, Grillkohle & Anzünder',
      note: 'Alle Preise zzgl. der Airbnb-Nächtepreise. Zusätzliche Buchungen bitte über Airbnb anfragen.',
    },
    ausstattung: {
      heading: 'Ausstattung',
      items: [
        'Schnelles WLAN (200 Mbit/s)',
        'Voll ausgestattete Küche',
        'Kaminofen (Holz)',
        'Badewanne',
        'Kostenloses Carport',
        'Hochstuhl & Reisebett',
      ],
    },
    ausflugsziele: {
      heading: 'Ausflugsziele & persönliche Empfehlungen',
      intro:
        'Ihr seid mitten in der Holsteinischen Schweiz — Seen, Wälder und die Ostseeküste liegen vor der Tür. Die Ortsnamen sind mit Google Maps verlinkt.',
      groups: [
        {
          title: 'Restaurants — unsere Empfehlungen',
          items: [
            {
              name: 'Stahlwerk Neumünster',
              distance: 'Buffet',
              detail: 'Großzügiges Buffet-Restaurant, ideal für Gruppen mit unterschiedlichen Vorlieben.',
              mapsQuery: 'Stahlwerk Neumünster',
              website: 'https://www.altes-stahlwerk.com/gastro',
            },
            {
              name: 'ICHI Kiel',
              distance: 'Japanisch',
              detail: 'Japanische Küche in Kiel — Sushi und mehr.',
              mapsQuery: 'ICHI Kiel Japanisches Restaurant',
              website: 'https://www.ichi-finedining.de/',
            },
            {
              name: 'Antikhof Bissee',
              distance: 'Gehoben',
              detail:
                'Restaurant der gehobenen Klasse, kombiniert mit Antikmarkt-Ausstellung — auch ein schöner Spaziergang vor oder nach dem Essen.',
              mapsQuery: 'Antikhof Bissee',
              website: 'https://hofbissee.de/restaurant/',
            },
            {
              name: 'Gasthof Voß, Schmalensee',
              distance: 'Gutbürgerlich',
              detail: 'Traditionelle, gutbürgerliche Küche am Schmalensee.',
              mapsQuery: 'Gasthof Voß Schmalensee',
            },
            {
              name: 'Hofmarkt & Restaurant Kirschenholz',
              distance: 'Sehr nah',
              detail: 'Lokale Spezialitäten direkt vom Hof — Hofmarkt und Restaurant nur wenige Minuten entfernt.',
              mapsQuery: 'Kirschenholz Hofmarkt Restaurant',
              website: 'https://kirschenholz.de/',
            },
            {
              name: 'Gasthof Schlüter',
              distance: 'Regional',
              detail: 'Regionale Küche in gemütlicher Gasthof-Atmosphäre.',
              mapsQuery: 'Gasthof Schlüter',
              website: 'https://schlueter-wankendorf.de/',
            },
          ],
        },
        {
          title: 'Mit Kindern',
          items: [
            {
              name: 'Tierpark Neumünster',
              distance: '~30 km',
              detail: 'Kleiner Zoo direkt in Neumünster — hier kommt Eisbär Knut ursprünglich her.',
              mapsQuery: 'Tierpark Neumünster',
              website: 'https://www.tierparkneumuenster.de/',
            },
            {
              name: 'Tierpark Gettorf',
              distance: '~35 km',
              detail: 'Familienfreundlicher Zoo mit Streichelgehege, perfekt für kleine Kinder.',
              mapsQuery: 'Tierpark Gettorf',
              website: 'https://tierparkgettorf.de/',
            },
            {
              name: 'Kartbahn Büsum',
              distance: '~90 km',
              detail:
                'Kartbahn direkt an der Nordseeküste — Fahrspaß für die ganze Familie, gut mit einem Ausflug nach Büsum kombinierbar.',
              mapsQuery: 'Kartbahn Büsum',
              website: 'https://www.nordseering.de/',
            },
            {
              name: 'Hansa-Park Sierksdorf',
              distance: '~85 km',
              detail: 'Erlebnispark an der Ostsee mit Achterbahnen, Wasserattraktionen und Kinderwelt.',
              mapsQuery: 'Hansa-Park Sierksdorf',
              website: 'https://www.hansapark.de/index',
            },
            {
              name: 'Plöner See — Badestrand',
              distance: '~15 km',
              detail: 'Sauberer Badesee mit flachem Ufer, ideal für Familien. Bootsverleih vor Ort.',
              mapsQuery: 'Plöner See Badestrand',
              website: 'https://ploenersee.de/',
            },
          ],
        },
        {
          title: 'Seen & Wasser',
          items: [
            {
              name: 'Plöner See',
              distance: '~15 km',
              detail: 'Einer der größten Seen Schleswig-Holsteins — Schwimmen, Paddeln, Segeln, Strandbad.',
              mapsQuery: 'Plöner See',
              website: 'https://ploenersee.de/',
            },
            {
              name: 'Schwentine-Kanuweg',
              distance: '~10 km',
              detail: 'Mehrtägige Kanutour durch die Holsteinische Schweiz, von See zu See.',
              mapsQuery: 'Schwentine Kanuweg',
            },
            {
              name: 'Ostseeküste Eckernförde',
              distance: '~40 km',
              detail: 'Historische Hafenstadt, Raucheraal-Delikatessen und schöne Sandstrände.',
              mapsQuery: 'Eckernförde',
              website: 'https://www.ostseebad-eckernfoerde.de/',
            },
            {
              name: 'Insel Fehmarn',
              distance: '~90 km',
              detail: 'Sonneninsel der Ostsee mit langen Stränden, Kitesurf-Spots und Rad-Rundweg.',
              mapsQuery: 'Insel Fehmarn',
              website: 'https://www.fehmarn.de/',
            },
          ],
        },
        {
          title: 'Radfahren & Wandern',
          items: [
            {
              name: 'Holsteinische Schweiz Rundweg',
              distance: 'direkt vor der Tür',
              detail: 'Ausgeschilderte Radwege durch Hügel und an Seen entlang — auch für E-Bikes geeignet.',
              mapsQuery: 'Holsteinische Schweiz',
              website: 'https://www.holsteinischeschweiz.de/',
            },
            {
              name: 'Bungsberg',
              distance: '~30 km',
              detail: 'Mit 168 m höchster Berg Schleswig-Holsteins — Wanderpfade, Aussichtsturm, Loipe.',
              mapsQuery: 'Bungsberg',
              website: 'https://www.naturpark-holsteinische-schweiz.de/poi/elisabethturm-am-bungsberg',
            },
            {
              name: 'Naturpark Westensee',
              distance: '~15 km',
              detail: 'Ruhige Radwege und Wanderpfade rund um den Westensee, kaum Autoverkehr.',
              mapsQuery: 'Naturpark Westensee',
              website: 'https://www.tourismus-naturpark-westensee.de/',
            },
          ],
        },
      ],
    },
    cta: {
      heading: 'Nächsten Urlaub planen?',
      text: 'Freie Termine und Preise findest du auf Airbnb — dort kannst du auch direkt buchen.',
      button: 'Auf Airbnb buchen',
    },
    tour: {
      page: {
        title: 'Rundgang – Haus im Grünen',
        description: '3D-Rundgang durch das Ferienhaus Haus im Grünen: Zimmer für Zimmer im Browser erkunden.',
        back: 'Zurück zur Übersicht',
        canvasLabel: '3D-Rundgang durch das Haus. Mit Pfeiltasten oder WASD bewegen, Maus oder Wischen zum Umsehen.',
        loading: 'Rundgang wird geladen',
        start: 'Rundgang starten',
        startHint: 'Ein 3D-Rundgang durch alle Zimmer, direkt im Browser. Der Aufbau dauert wenige Sekunden.',
        loadingSteps: {
          download: 'Lade 3D-Engine …',
          textures: 'Erzeuge Oberflächen …',
          geometry: 'Baue Wände und Böden …',
          furniture: 'Richte Möbel ein …',
          lighting: 'Setze Licht …',
        },
        noWebglTitle: '3D wird von diesem Browser nicht unterstützt',
        noWebglText:
          'Für den Rundgang braucht dein Browser WebGL. Hier siehst du stattdessen den Grundriss des Hauses.',
        planAlt:
          'Grundriss des Hauses: Wohnen, Küche, Schlafzimmer, zwei Kinderzimmer, Bad, WC, Abstellraum und Diele',
        planCaption: 'Grundriss (ca. 106 m²)',
        retry: 'Erneut versuchen',
        error: 'Der Rundgang konnte nicht geladen werden.',
      },
      teaser: {
        pill: 'Neu',
        heading: '3D-Rundgang',
        text: 'Erkunde das Haus vorab Zimmer für Zimmer im Browser – vom Wohnzimmer bis zum Kinderzimmer, am Handy oder am Rechner.',
        button: 'Rundgang starten',
        imageAlt: 'Grundriss des Hauses',
      },
      ui: {
        back: 'Zurück',
        modes: 'Ansicht',
        modeWalk: 'Rundgang',
        modeDollhouse: 'Puppenhaus',
        modeTop: 'Grundriss',
        modeChanged: {
          walk: 'Ansicht: Rundgang in Augenhöhe',
          dollhouse: 'Ansicht: Puppenhaus, Decke ausgeblendet',
          top: 'Ansicht: Grundriss von oben',
        },
        rooms: 'Zimmer',
        currentRoom: 'Aktueller Raum: {room}',
        map: 'Grundriss-Karte, Zimmer antippen zum Springen',
        mapShow: 'Karte',
        mapHide: 'Karte ausblenden',
        help: 'Hilfe zur Steuerung',
        helpTitle: 'Steuerung',
        helpClose: 'Schließen',
        helpItems: [
          { keys: 'W A S D / Pfeiltasten', text: 'Gehen bzw. mit links und rechts umsehen' },
          { keys: 'Q / E', text: 'Nach links / rechts drehen' },
          { keys: 'R / F', text: 'Nach oben / unten schauen' },
          { keys: 'Shift', text: 'Schneller gehen' },
          { keys: 'Maus', text: 'Ziehen zum Umsehen, Doppelklick fängt die Maus ein (Esc gibt sie frei)' },
          { keys: 'Bild auf/ab · P / N', text: 'Zum vorigen bzw. nächsten Zimmer springen' },
          { keys: 'Tab', text: 'Zimmer-Schaltflächen: Pfeiltasten wechseln das Zimmer, Enter oder Esc führt zurück zum Rundgang' },
          { keys: '1 2 3', text: 'Rundgang, Puppenhaus, Grundriss' },
          { keys: 'M', text: 'Karte ein- oder ausblenden' },
          { keys: 'H / ?', text: 'Diese Hilfe öffnen' },
          { keys: 'Esc', text: 'Hilfe schließen' },
        ],
        helpTouch: 'Am Handy: Kreis unten links zum Gehen, mit dem Finger über das Bild wischen zum Umsehen, im Puppenhaus zwei Finger zum Zoomen.',
        bob: 'Leichtes Wippen beim Gehen',
        hintMouse: 'Ziehen zum Umsehen · Maus-Symbol oder Doppelklick fängt die Maus ein (Esc gibt sie frei) · W A S D zum Gehen',
        lockMouse: 'Maus einfangen zum Umsehen (Esc gibt sie frei)',
        hintTouch: 'Kreis zum Gehen, wischen zum Umsehen',
        stick: 'Steuerkreis zum Gehen',
        qualityNames: ['Grafik: hoch', 'Grafik: mittel', 'Grafik: niedrig'],
        canvasDescription:
          'Interaktiver 3D-Rundgang durch das eingeschossige Ferienhaus: Diele, Küche mit Essplatz, Wohnzimmer mit Kaminanschluss, Schlafzimmer, zwei Kinderzimmer, Bad, WC und Abstellraum. Bedienung mit Pfeiltasten oder WASD, Zimmerwechsel über die Schaltflächen am unteren Rand oder mit den Tasten Bild auf und Bild ab.',
      },
    },
    footer: {
      hostPrefix: 'Gastgeberin: ',
      hostName: 'Susanne',
      hostSuffix: ' · Rendswühren, Schleswig-Holstein',
      listing: 'Inserat auf Airbnb ansehen',
      privacy: 'Datenschutz',
      scanHint: 'Seite scannen & teilen',
    },
    rules: {
      title: 'Bitte lies die Hausregeln',
      subtitle: 'Bestätige einmalig, dass du die Regeln gelesen hast.',
      sections: [
        {
          title: 'Check-in & Check-out',
          items: [{ label: 'Check-in ab 15:00 Uhr' }, { label: 'Check-out vor 10:00 Uhr' }],
        },
        {
          title: 'Während des Aufenthalts',
          items: [
            { label: 'Höchstens 5 Gäste' },
            { label: 'Keine Haustiere' },
            { label: 'Keine Partys oder Veranstaltungen' },
            { label: 'Rauchen nur auf den Terrassen (Aschenbecher vorhanden)' },
            { label: 'Rauchen im Haus → 500 € Ozonreinigung' },
            {
              label:
                'Mülltrennung: Behälter sind im Haus gekennzeichnet, nach dem Aufenthalt in die Tonnen vor dem Haus entsorgen',
            },
            {
              label:
                'Geschirr abwaschen und trocken einräumen — Geschirrspüler nicht erst bei Abreise anstellen',
            },
          ],
        },
        {
          title: 'Vor der Abreise',
          items: [
            { label: 'Müll entsorgen' },
            { label: 'Alle Geräte ausschalten' },
            { label: 'Schlüssel zurückgeben' },
            { label: 'Abwasch erledigen & Geschirrspüler ausräumen' },
          ],
        },
      ],
      note: 'Bitte behandle das Haus und die Einrichtung mit Sorgfalt. Schäden bitte unverzüglich melden, damit für Ersatz gesorgt werden kann.',
      scrollHint: '↓ Bitte bis zum Ende scrollen',
      accept: 'Ich habe die Hausregeln gelesen und akzeptiere sie',
    },
    datenschutz: {
      title: 'Datenschutzerklärung',
      siteHeading: 'Diese Webseite',
      siteText:
        'Diese Seite dient als Gästeinformation für das Ferienhaus "Haus im Grünen" in Rendswühren. Sie enthält keine Formulare und erhebt selbst keine personenbezogenen Daten.',
      storageHeading: 'Lokale Speicherung (Hausregeln)',
      storageText:
        'Beim Bestätigen der Hausregeln wird ein Zeitstempel im lokalen Speicher (localStorage) deines Browsers abgelegt, damit dir die Regeln nicht bei jedem Besuch erneut angezeigt werden. Diese Information verlässt dein Gerät nicht und wird nicht an uns oder Dritte übertragen. Ebenso wird deine Sprachwahl (Deutsch/Englisch) lokal gespeichert.',
      analyticsHeading: 'Reichweitenmessung',
      analyticsText:
        'Sofern aktiviert, verwenden wir GoatCounter zur anonymen, cookie-freien Reichweitenmessung. Es werden keine personenbezogenen Profile erstellt.',
      linksHeading: 'Externe Links',
      linksText:
        'Die Seite verlinkt auf externe Angebote, u. a. Airbnb, Google Maps (Google Ireland Limited) sowie auf die offiziellen Webseiten der empfohlenen Restaurants und Ausflugsziele. Beim Anklicken dieser Links wirst du zur jeweiligen externen Webseite weitergeleitet, für deren Datenschutz die Anbieter selbst verantwortlich sind. Es werden keine Kartendaten eingebettet oder im Hintergrund geladen — eine Datenübertragung an Google findet erst statt, wenn du einen solchen Link aktiv anklickst.',
    },
  },
  en: {
    meta: {
      title: 'Haus im Grünen – Holiday home in Rendswühren',
      description:
        'Idyllic holiday home with a large garden and views over the fields in Rendswühren, Schleswig-Holstein. 104 m², 3 bedrooms, fireplace, WiFi.',
    },
    header: { subtitle: 'Rendswühren, Schleswig-Holstein', bookNow: 'Book now' },
    hero: {
      pill: 'Holiday home',
      title1: 'Welcome to',
      title2: 'Haus im Grünen',
      subtitle:
        'Enjoy the peace and quiet, fresh country air and views across the fields in Rendswühren, Schleswig-Holstein.',
      tags: ['104 m²', '5 guests', '3 bedrooms', 'Garden', 'Fireplace', 'WiFi 200 Mbit/s'],
    },
    gallery: { viewAll: 'See all photos on Airbnb →' },
    wlan: {
      heading: 'WiFi',
      locked:
        'Please read and accept the house rules first — then you\u2019ll see where to find the WiFi password.',
      speedSuffix: '200 Mbit/s',
      passwordLabel: 'WiFi password',
      passwordPrefix: 'You\u2019ll find the WiFi password on a ',
      passwordBold: 'small stand in the kitchen',
      passwordSuffix: '.',
    },
    hausregeln: {
      heading: 'House rules',
      groups: [
        {
          title: 'Check-in & check-out',
          items: [{ label: 'Check-in from 3:00 pm' }, { label: 'Check-out before 10:00 am' }],
        },
        {
          title: 'During your stay',
          items: [
            { label: 'Maximum 5 guests' },
            { label: 'No pets' },
            { label: 'No parties or events' },
            { label: 'No commercial photography' },
            { label: 'No smoking (except on the terraces)' },
          ],
        },
        {
          title: 'Additional rules',
          items: [
            {
              label: 'Waste separation',
              detail:
                'Labelled bins are provided inside the house — please move the rubbish to the bins in front of the house after your stay.',
            },
            {
              label: 'Wash dishes before check-out',
              detail:
                'Please put everything back clean and dry into the cupboards. Don\u2019t just run the dishwasher right before you leave.',
            },
            {
              label: 'Parking',
              detail:
                'A free double carport is available. Please park considerately so the driveway isn\u2019t blocked.',
            },
            {
              label: 'No smoking indoors — €500 ozone cleaning fee',
              detail: 'Ashtrays and seating are provided on the terraces outside.',
            },
          ],
        },
        {
          title: 'Before departure',
          items: [
            { label: 'Take out the rubbish' },
            { label: 'Switch off all appliances' },
            { label: 'Return the keys' },
            { label: 'Wash up & empty the dishwasher' },
          ],
        },
        {
          title: 'Safety',
          items: [
            { label: 'Carbon monoxide detector installed' },
            { label: 'Smoke detector installed' },
          ],
        },
      ],
    },
    preise: {
      heading: 'Prices & extras',
      cleaningFee: 'Cleaning fee (one-time)',
      cleaningIncludes: 'Includes cleaning and 2 towels per person.',
      bedding: 'Bed linen',
      beddingPrice: 'included, free of charge',
      beddingDetail: 'Already provided for all guests — no need to bring your own.',
      extraBedding: 'Extra bed linen',
      extraBeddingPrice: '€20 / person',
      firewood: 'Firewood',
      firewoodPrice: '€15',
      firewoodDetail: 'First basket free, each additional one €15',
      grillPackage: 'BBQ package',
      grillPrice: '€20',
      grillDetail: 'Grill, charcoal & firelighters',
      note: 'All prices are in addition to the Airbnb nightly rate. Please request any extras directly via Airbnb.',
    },
    ausstattung: {
      heading: 'Amenities',
      items: [
        'Fast WiFi (200 Mbit/s)',
        'Fully equipped kitchen',
        'Wood-burning stove',
        'Bathtub',
        'Free carport',
        'High chair & travel cot',
      ],
    },
    ausflugsziele: {
      heading: 'Day trips & our personal recommendations',
      intro:
        'You\u2019re right in the middle of the Holsteinische Schweiz — lakes, forests and the Baltic coast are all nearby. Place names are linked to Google Maps.',
      groups: [
        {
          title: 'Restaurants — our recommendations',
          items: [
            {
              name: 'Stahlwerk Neumünster',
              distance: 'Buffet',
              detail: 'Generous buffet restaurant, great for groups with different tastes.',
              mapsQuery: 'Stahlwerk Neumünster',
              website: 'https://www.altes-stahlwerk.com/gastro',
            },
            {
              name: 'ICHI Kiel',
              distance: 'Japanese',
              detail: 'Japanese cuisine in Kiel — sushi and more.',
              mapsQuery: 'ICHI Kiel Japanisches Restaurant',
              website: 'https://www.ichi-finedining.de/',
            },
            {
              name: 'Antikhof Bissee',
              distance: 'Upscale',
              detail:
                'Upscale restaurant combined with an antiques market — also a lovely stroll before or after dinner.',
              mapsQuery: 'Antikhof Bissee',
              website: 'https://hofbissee.de/restaurant/',
            },
            {
              name: 'Gasthof Voß, Schmalensee',
              distance: 'Traditional',
              detail: 'Traditional, hearty German cuisine on the Schmalensee lake.',
              mapsQuery: 'Gasthof Voß Schmalensee',
            },
            {
              name: 'Hofmarkt & Restaurant Kirschenholz',
              distance: 'Very close',
              detail: 'Local farm specialities — farm shop and restaurant just a few minutes away.',
              mapsQuery: 'Kirschenholz Hofmarkt Restaurant',
              website: 'https://kirschenholz.de/',
            },
            {
              name: 'Gasthof Schlüter',
              distance: 'Regional',
              detail: 'Regional cuisine in a cosy country-inn atmosphere.',
              mapsQuery: 'Gasthof Schlüter',
              website: 'https://schlueter-wankendorf.de/',
            },
          ],
        },
        {
          title: 'With kids',
          items: [
            {
              name: 'Tierpark Neumünster',
              distance: '~30 km',
              detail: 'A small zoo right in Neumünster — this is where the famous polar bear Knut came from.',
              mapsQuery: 'Tierpark Neumünster',
              website: 'https://www.tierparkneumuenster.de/',
            },
            {
              name: 'Tierpark Gettorf',
              distance: '~35 km',
              detail: 'Family-friendly zoo with a petting area, perfect for young children.',
              mapsQuery: 'Tierpark Gettorf',
              website: 'https://tierparkgettorf.de/',
            },
            {
              name: 'Kartbahn Büsum',
              distance: '~90 km',
              detail:
                'Go-kart track right on the North Sea coast — fun for the whole family, easy to combine with a trip to Büsum.',
              mapsQuery: 'Kartbahn Büsum',
              website: 'https://www.nordseering.de/',
            },
            {
              name: 'Hansa-Park Sierksdorf',
              distance: '~85 km',
              detail: 'Theme park on the Baltic coast with roller coasters, water rides and a kids\u2019 area.',
              mapsQuery: 'Hansa-Park Sierksdorf',
              website: 'https://www.hansapark.de/index',
            },
            {
              name: 'Plöner See — beach',
              distance: '~15 km',
              detail: 'Clean lake with a shallow shore, ideal for families. Boat rental on site.',
              mapsQuery: 'Plöner See Badestrand',
              website: 'https://ploenersee.de/',
            },
          ],
        },
        {
          title: 'Lakes & water',
          items: [
            {
              name: 'Plöner See',
              distance: '~15 km',
              detail: 'One of the largest lakes in Schleswig-Holstein — swimming, paddling, sailing, lido.',
              mapsQuery: 'Plöner See',
              website: 'https://ploenersee.de/',
            },
            {
              name: 'Schwentine canoe trail',
              distance: '~10 km',
              detail: 'Multi-day canoe route through the Holsteinische Schweiz, from lake to lake.',
              mapsQuery: 'Schwentine Kanuweg',
            },
            {
              name: 'Baltic coast at Eckernförde',
              distance: '~40 km',
              detail: 'Historic harbour town, smoked-fish specialities and beautiful sandy beaches.',
              mapsQuery: 'Eckernförde',
              website: 'https://www.ostseebad-eckernfoerde.de/',
            },
            {
              name: 'Fehmarn Island',
              distance: '~90 km',
              detail: 'Sunny Baltic island with long beaches, kitesurfing spots and a round-island cycle route.',
              mapsQuery: 'Insel Fehmarn',
              website: 'https://www.fehmarn.de/',
            },
          ],
        },
        {
          title: 'Cycling & hiking',
          items: [
            {
              name: 'Holsteinische Schweiz loop',
              distance: 'right at the door',
              detail: 'Signposted cycling routes through hills and along lakes — also great for e-bikes.',
              mapsQuery: 'Holsteinische Schweiz',
              website: 'https://www.holsteinischeschweiz.de/',
            },
            {
              name: 'Bungsberg',
              distance: '~30 km',
              detail:
                'At 168 m, the highest hill in Schleswig-Holstein — hiking trails, lookout tower, ski trail.',
              mapsQuery: 'Bungsberg',
              website: 'https://www.naturpark-holsteinische-schweiz.de/poi/elisabethturm-am-bungsberg',
            },
            {
              name: 'Naturpark Westensee',
              distance: '~15 km',
              detail: 'Quiet cycling and hiking paths around Lake Westensee, hardly any traffic.',
              mapsQuery: 'Naturpark Westensee',
              website: 'https://www.tourismus-naturpark-westensee.de/',
            },
          ],
        },
      ],
    },
    cta: {
      heading: 'Planning your next getaway?',
      text: 'You can find availability and prices on Airbnb — and book directly there too.',
      button: 'Book on Airbnb',
    },
    tour: {
      page: {
        title: 'Virtual tour – Haus im Grünen',
        description: '3D walkthrough of the holiday home Haus im Grünen: explore it room by room in your browser.',
        back: 'Back to overview',
        canvasLabel: '3D walkthrough of the house. Move with arrow keys or WASD, look around with the mouse or by swiping.',
        loading: 'Loading the tour',
        start: 'Start tour',
        startHint: 'A 3D walkthrough of every room, right in your browser. Setting it up takes a few seconds.',
        loadingSteps: {
          download: 'Loading 3D engine …',
          textures: 'Creating surfaces …',
          geometry: 'Building walls and floors …',
          furniture: 'Furnishing rooms …',
          lighting: 'Setting up light …',
        },
        noWebglTitle: '3D is not supported by this browser',
        noWebglText: 'The tour needs WebGL. Here is the floor plan of the house instead.',
        planAlt:
          'Floor plan of the house: living room, kitchen, master bedroom, two children rooms, bathroom, WC, storage room and hallway',
        planCaption: 'Floor plan (approx. 106 m², room names in German)',
        retry: 'Try again',
        error: 'The tour could not be loaded.',
      },
      teaser: {
        pill: 'New',
        heading: '3D virtual tour',
        text: 'Explore the house room by room in your browser before you arrive – from the living room to the children rooms, on your phone or computer.',
        button: 'Start the tour',
        imageAlt: 'Floor plan of the house',
      },
      ui: {
        back: 'Back',
        modes: 'View',
        modeWalk: 'Walk',
        modeDollhouse: 'Dollhouse',
        modeTop: 'Floor plan',
        modeChanged: {
          walk: 'View: walking at eye level',
          dollhouse: 'View: dollhouse, ceiling hidden',
          top: 'View: floor plan from above',
        },
        rooms: 'Rooms',
        currentRoom: 'Current room: {room}',
        map: 'Floor plan map, tap a room to jump there',
        mapShow: 'Map',
        mapHide: 'Hide map',
        help: 'Controls help',
        helpTitle: 'Controls',
        helpClose: 'Close',
        helpItems: [
          { keys: 'W A S D / arrow keys', text: 'Walk, or look left and right with the side arrows' },
          { keys: 'Q / E', text: 'Turn left / right' },
          { keys: 'R / F', text: 'Look up / down' },
          { keys: 'Shift', text: 'Walk faster' },
          { keys: 'Mouse', text: 'Drag to look around, double-click captures the mouse (Esc releases it)' },
          { keys: 'Page up/down · P / N', text: 'Jump to the previous or next room' },
          { keys: 'Tab', text: 'Room buttons: arrow keys change the room, Enter or Esc returns to walking' },
          { keys: '1 2 3', text: 'Walk, dollhouse, floor plan' },
          { keys: 'M', text: 'Show or hide the map' },
          { keys: 'H / ?', text: 'Open this help' },
          { keys: 'Esc', text: 'Close help' },
        ],
        helpTouch: 'On a phone: circle at the bottom left to walk, swipe across the picture to look around, two fingers to zoom in dollhouse view.',
        bob: 'Slight head bob while walking',
        hintMouse: 'Drag to look around · Mouse icon or double-click captures the mouse (Esc releases it) · W A S D to walk',
        lockMouse: 'Capture the mouse to look around (Esc releases it)',
        hintTouch: 'Circle to walk, swipe to look',
        stick: 'Movement stick',
        qualityNames: ['Quality: high', 'Quality: medium', 'Quality: low'],
        canvasDescription:
          'Interactive 3D walkthrough of the single-storey holiday home: entrance hall, kitchen with dining area, living room with chimney recess, bedroom, two children rooms, bathroom, toilet and storage room. Move with the arrow keys or WASD, switch rooms with the buttons at the bottom or the Page up and Page down keys.',
      },
    },
    footer: {
      hostPrefix: 'Host: ',
      hostName: 'Susanne',
      hostSuffix: ' · Rendswühren, Schleswig-Holstein',
      listing: 'View listing on Airbnb',
      privacy: 'Privacy policy',
      scanHint: 'Scan & share this page',
    },
    rules: {
      title: 'Please read the house rules',
      subtitle: 'Confirm once that you\u2019ve read the rules.',
      sections: [
        {
          title: 'Check-in & check-out',
          items: [{ label: 'Check-in from 3:00 pm' }, { label: 'Check-out before 10:00 am' }],
        },
        {
          title: 'During your stay',
          items: [
            { label: 'Maximum 5 guests' },
            { label: 'No pets' },
            { label: 'No parties or events' },
            { label: 'Smoking only on the terraces (ashtrays provided)' },
            { label: 'Smoking indoors → €500 ozone cleaning fee' },
            {
              label:
                'Waste separation: bins are labelled inside the house, move them to the bins in front of the house after your stay',
            },
            {
              label: 'Wash dishes and put them away dry — don\u2019t just run the dishwasher right before you leave',
            },
          ],
        },
        {
          title: 'Before departure',
          items: [
            { label: 'Take out the rubbish' },
            { label: 'Switch off all appliances' },
            { label: 'Return the keys' },
            { label: 'Wash up & empty the dishwasher' },
          ],
        },
      ],
      note: 'Please treat the house and its furnishings with care. Report any damage immediately so it can be replaced.',
      scrollHint: '↓ Please scroll to the end',
      accept: 'I have read and accept the house rules',
    },
    datenschutz: {
      title: 'Privacy Policy',
      siteHeading: 'This website',
      siteText:
        'This page serves as guest information for the holiday home "Haus im Grünen" in Rendswühren. It contains no forms and does not itself collect any personal data.',
      storageHeading: 'Local storage (house rules)',
      storageText:
        'When you confirm the house rules, a timestamp is stored in your browser\u2019s local storage (localStorage) so the rules aren\u2019t shown again on every visit. This information never leaves your device and is not transmitted to us or any third party. Your language choice (German/English) is stored locally in the same way.',
      analyticsHeading: 'Analytics',
      analyticsText:
        'If enabled, we use GoatCounter for anonymous, cookie-free analytics. No personal profiles are created.',
      linksHeading: 'External links',
      linksText:
        'This site links to external services, including Airbnb, Google Maps (Google Ireland Limited) and the official websites of the recommended restaurants and destinations. Clicking these links takes you to the respective external website, which is responsible for its own privacy practices. No map data is embedded or loaded in the background — data is only transmitted to Google once you actively click such a link.',
    },
  },
}
