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
