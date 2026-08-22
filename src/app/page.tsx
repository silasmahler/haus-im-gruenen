import {
  Wifi,
  Clock,
  Users,
  PawPrint,
  PartyPopper,
  Camera,
  CigaretteOff,
  Trash2,
  Utensils,
  Key,
  Zap,
  Car,
  Flame,
  AlarmCheck,
  ShowerHead,
  Home,
  ExternalLink,
  CalendarDays,
  Bike,
  Waves,
  TreePine,
  Baby,
  MapPin,
} from 'lucide-react'

import { RulesAcceptance } from '@/components/RulesAcceptance'
import { SiteQrCode } from '@/components/SiteQrCode'
import { WifiCard } from '@/components/WifiCard'

const AIRBNB_URL = 'https://www.airbnb.de/rooms/1697314718712995655'
const SITE_URL = 'https://haus-im-gruenen.com'

const PHOTOS = [
  {
    src: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1697314718712995655/original/237d6c64-08e6-4608-b91e-055bf6a43f5d.jpeg?im_w=1200',
    alt: 'Außenansicht – Haus im Grünen',
  },
  {
    src: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1697314718712995655/original/9b7df396-39e2-4693-8178-7895d2a25698.jpeg?im_w=720',
    alt: 'Blick in den Garten und über die Felder',
  },
  {
    src: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1697314718712995655/original/57594a43-b44f-4a9e-a358-c34c91c32aae.jpeg?im_w=720',
    alt: 'Wohnbereich',
  },
  {
    src: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1697314718712995655/original/945ca46a-7ea9-4abf-a04b-90f76d3b3d10.jpeg?im_w=720',
    alt: 'Essbereich',
  },
  {
    src: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1697314718712995655/original/766e15ca-d100-4731-87b8-001fe05a1247.jpeg?im_w=720',
    alt: 'Schlafzimmer',
  },
  {
    src: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1697314718712995655/original/c1d901f8-a2f4-4bb5-8479-1055f2c2a81f.jpeg?im_w=720',
    alt: 'Schlafzimmer 2',
  },
  {
    src: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1697314718712995655/original/2e382c27-95d8-4798-84d2-3ef36badd379.jpeg?im_w=720',
    alt: 'Weiteres Zimmer',
  },
]

export default function Page() {
  return (
    <>
      <RulesAcceptance />

      <header className="sticky top-0 z-40 border-b border-[var(--color-brand-200)] bg-[var(--brand-foam)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-[var(--brand-ink)]">
              Haus im Grünen
            </p>
            <p className="text-xs text-[var(--brand-ink-soft)]">
              Rendswühren, Schleswig-Holstein
            </p>
          </div>
          <a
            href={AIRBNB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-full bg-[var(--color-brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Jetzt buchen
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-10 px-4 py-8">
        {/* Hero */}
        <section className="text-center">
          <span className="brand-pill mb-4 inline-flex">
            <span>🌿</span> Ferienhaus
          </span>
          <h1 className="text-3xl font-bold text-[var(--brand-ink)]">
            Willkommen im<br />
            <span className="text-[var(--color-brand-600)]">Haus im Grünen</span>
          </h1>
          <p className="mt-3 text-base text-[var(--brand-ink-soft)]">
            Genieße die Ruhe, frische Landluft und den Blick übers Feld in
            Rendswühren, Schleswig-Holstein.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              '104 m²',
              '5 Gäste',
              '3 Schlafzimmer',
              'Garten',
              'Kamin',
              'WLAN 200 Mbit/s',
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-3 py-1 text-xs font-medium text-[var(--color-brand-700)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Fotogalerie */}
        <section id="galerie">
          <div className="grid grid-cols-2 gap-2">
            {/* Erstes Bild groß über die volle Breite */}
            <div className="col-span-2 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PHOTOS[0].src}
                alt={PHOTOS[0].alt}
                className="h-56 w-full object-cover sm:h-72"
              />
            </div>
            {/* Restliche Bilder im 2er-Grid */}
            {PHOTOS.slice(1).map((photo) => (
              <div key={photo.src} className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-36 w-full object-cover sm:h-44"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-right text-xs text-[var(--brand-ink-soft)]">
            <a
              href={AIRBNB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--color-brand-600)]"
            >
              Alle Fotos auf Airbnb ansehen →
            </a>
          </p>
        </section>

        {/* WLAN */}
        <section id="wlan">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">
            <Wifi className="mr-2 inline-block h-5 w-5 text-[var(--color-brand-500)]" />
            WLAN
          </h2>
          <WifiCard />
        </section>

        {/* Hausregeln */}
        <section id="hausregeln">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">Hausregeln</h2>
          <div className="brand-card divide-y divide-[var(--color-brand-100)]">
            <RuleGroup title="Check-in & Check-out">
              <RuleItem icon={<Clock />} label="Check-in ab 15:00 Uhr" />
              <RuleItem icon={<Clock />} label="Check-out vor 10:00 Uhr" />
            </RuleGroup>

            <RuleGroup title="Während deines Aufenthalts">
              <RuleItem icon={<Users />} label="Höchstens 5 Gäste" />
              <RuleItem icon={<PawPrint />} label="Keine Haustiere" />
              <RuleItem icon={<PartyPopper />} label="Keine Partys oder Veranstaltungen" />
              <RuleItem icon={<Camera />} label="Kein kommerzielles Fotografieren" />
              <RuleItem icon={<CigaretteOff />} label="Rauchen verboten (nur auf den Terrassen)" />
            </RuleGroup>

            <RuleGroup title="Zusätzliche Regeln">
              <RuleItem
                icon={<Trash2 />}
                label="Mülltrennung"
                detail="Gekennzeichnete Behälter in der Unterkunft — bitte nach Aufenthalt in die Mülltonnen vor dem Haus entsorgen."
              />
              <RuleItem
                icon={<Utensils />}
                label="Geschirr vor Auszug abwaschen"
                detail="Bitte trocken und sauber zurück in die Schränke stellen. Geschirrspüler nicht erst bei Auszug anstellen."
              />
              <RuleItem
                icon={<Car />}
                label="Parken"
                detail="Kostenloses Doppelcarport vorhanden. Bitte rücksichtsvoll parken, damit die Auffahrt nicht blockiert wird."
              />
              <RuleItem
                icon={<CigaretteOff />}
                label="Rauchverbot drinnen — 500 € Ozonreinigung"
                detail="Im Außenbereich stehen auf den Terrassen Aschenbecher und Sitzgelegenheiten bereit."
              />
            </RuleGroup>

            <RuleGroup title="Vor der Abreise">
              <RuleItem icon={<Trash2 />} label="Müll entsorgen" />
              <RuleItem icon={<Zap />} label="Alle Geräte ausschalten" />
              <RuleItem icon={<Key />} label="Schlüssel zurückgeben" />
              <RuleItem
                icon={<Utensils />}
                label="Abwasch erledigen & Geschirrspüler ausräumen"
              />
            </RuleGroup>

            <RuleGroup title="Sicherheit">
              <RuleItem icon={<AlarmCheck />} label="Kohlenmonoxidmelder vorhanden" />
              <RuleItem icon={<Flame />} label="Rauchmelder vorhanden" />
            </RuleGroup>
          </div>
        </section>

        {/* Preise */}
        <section id="preise">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">Preise & Extras</h2>
          <div className="brand-card overflow-hidden">
            <div className="bg-[var(--color-brand-600)] px-5 py-4 text-white">
              <p className="text-sm font-medium opacity-80">Reinigungsgebühr (einmalig)</p>
              <p className="text-3xl font-bold">45 €</p>
              <p className="mt-1 text-xs opacity-70">
                Inkl. Reinigung und 2 Handtücher p. P.
              </p>
            </div>
            <div className="divide-y divide-[var(--color-brand-100)] px-5">
              <PriceItem
                label="Bettwäsche"
                price="einmalig kostenfrei"
                detail="Für alle Gäste bereits gestellt — du musst keine eigene mitbringen."
              />
              <PriceItem
                label="Ersatzbettwäsche"
                price="20 € / Person"
              />
              <PriceItem
                label="Kaminholz"
                price="15 €"
                detail="Erster Korb kostenlos, jeder weitere 15 €"
              />
              <PriceItem
                label="Grillpaket"
                price="20 €"
                detail="Grill, Grillkohle & Anzünder"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--brand-ink-soft)]">
            Alle Preise zzgl. der Airbnb-Nächtepreise. Zusätzliche Buchungen bitte über Airbnb
            anfragen.
          </p>
        </section>

        {/* Ausstattung */}
        <section id="ausstattung">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">Ausstattung</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { icon: <Wifi />, label: 'Schnelles WLAN (200 Mbit/s)' },
              { icon: <Utensils />, label: 'Voll ausgestattete Küche' },
              { icon: <Flame />, label: 'Kaminofen (Holz)' },
              { icon: <ShowerHead />, label: 'Badewanne' },
              { icon: <Car />, label: 'Kostenloses Carport' },
              { icon: <Users />, label: 'Hochstuhl & Reisebett' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="brand-card-green flex items-center gap-2.5 px-3 py-2.5"
              >
                <span className="shrink-0 text-[var(--color-brand-600)]">
                  {icon}
                </span>
                <span className="text-xs font-medium text-[var(--brand-ink)]">{label}</span>
              </div>
            ))}
          </div>
        </section>
        {/* Ausflugsziele & persönliche Empfehlungen */}
        <section id="ausflugsziele">
          <h2 className="mb-1 text-xl font-bold text-[var(--brand-ink)]">
            Ausflugsziele & persönliche Empfehlungen
          </h2>
          <p className="mb-4 text-sm text-[var(--brand-ink-soft)]">
            Ihr seid mitten in der{' '}
            <strong>Holsteinischen Schweiz</strong> — Seen, Wälder und die
            Ostseeküste liegen vor der Tür. Die Ortsnamen sind mit Google Maps
            verlinkt.
          </p>

          <div className="space-y-6">
            <ActivityGroup
              icon={<Utensils />}
              title="Restaurants — unsere Empfehlungen"
              color="rose"
              items={[
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
                  detail: 'Restaurant der gehobenen Klasse, kombiniert mit Antikmarkt-Ausstellung — auch ein schöner Spaziergang vor oder nach dem Essen.',
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
              ]}
            />

            <ActivityGroup
              icon={<Baby />}
              title="Mit Kindern"
              color="amber"
              items={[
                {
                  name: 'Tierpark Neumünster',
                  distance: '~30 km',
                  detail:
                    'Kleiner Zoo direkt in Neumünster — hier kommt Eisbär Knut ursprünglich her.',
                  mapsQuery: 'Tierpark Neumünster',
                  website: 'https://www.tierparkneumuenster.de/',
                },
                {
                  name: 'Tierpark Gettorf',
                  distance: '~35 km',
                  detail:
                    'Familienfreundlicher Zoo mit Streichelgehege, perfekt für kleine Kinder.',
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
                  detail:
                    'Erlebnispark an der Ostsee mit Achterbahnen, Wasserattraktionen und Kinderwelt.',
                  mapsQuery: 'Hansa-Park Sierksdorf',
                  website: 'https://www.hansapark.de/index',
                },
                {
                  name: 'Plöner See — Badestrand',
                  distance: '~15 km',
                  detail:
                    'Sauberer Badesee mit flachem Ufer, ideal für Familien. Bootsverleih vor Ort.',
                  mapsQuery: 'Plöner See Badestrand',
                  website: 'https://ploenersee.de/',
                },
              ]}
            />

            <ActivityGroup
              icon={<Waves />}
              title="Seen & Wasser"
              color="blue"
              items={[
                {
                  name: 'Plöner See',
                  distance: '~15 km',
                  detail:
                    'Einer der größten Seen Schleswig-Holsteins — Schwimmen, Paddeln, Segeln, Strandbad.',
                  mapsQuery: 'Plöner See',
                  website: 'https://ploenersee.de/',
                },
                {
                  name: 'Schwentine-Kanuweg',
                  distance: '~10 km',
                  detail:
                    'Mehrtägige Kanutour durch die Holsteinische Schweiz, von See zu See.',
                  mapsQuery: 'Schwentine Kanuweg',
                },
                {
                  name: 'Ostseeküste Eckernförde',
                  distance: '~40 km',
                  detail:
                    'Historische Hafenstadt, Raucheraal-Delikatessen und schöne Sandstrände.',
                  mapsQuery: 'Eckernförde',
                  website: 'https://www.ostseebad-eckernfoerde.de/',
                },
                {
                  name: 'Insel Fehmarn',
                  distance: '~90 km',
                  detail:
                    'Sonneninsel der Ostsee mit langen Stränden, Kitesurf-Spots und Rad-Rundweg.',
                  mapsQuery: 'Insel Fehmarn',
                  website: 'https://www.fehmarn.de/',
                },
              ]}
            />

            <ActivityGroup
              icon={<Bike />}
              title="Radfahren & Wandern"
              color="green"
              items={[
                {
                  name: 'Holsteinische Schweiz Rundweg',
                  distance: 'direkt vor der Tür',
                  detail:
                    'Ausgeschilderte Radwege durch Hügel und an Seen entlang — auch für E-Bikes geeignet.',
                  mapsQuery: 'Holsteinische Schweiz',
                  website: 'https://www.holsteinischeschweiz.de/',
                },
                {
                  name: 'Bungsberg',
                  distance: '~30 km',
                  detail:
                    'Mit 168 m höchster Berg Schleswig-Holsteins — Wanderpfade, Aussichtsturm, Loipe.',
                  mapsQuery: 'Bungsberg',
                  website: 'https://www.naturpark-holsteinische-schweiz.de/poi/elisabethturm-am-bungsberg',
                },
                {
                  name: 'Naturpark Westensee',
                  distance: '~15 km',
                  detail:
                    'Ruhige Radwege und Wanderpfade rund um den Westensee, kaum Autoverkehr.',
                  mapsQuery: 'Naturpark Westensee',
                  website: 'https://www.tourismus-naturpark-westensee.de/',
                },
              ]}
            />
          </div>
        </section>

        {/* Buchungs-CTA */}
        <section className="overflow-hidden rounded-2xl bg-[var(--color-brand-700)] px-6 py-7 text-white">
          <div className="flex items-start gap-4">
            <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 opacity-80" />
            <div>
              <h2 className="text-lg font-bold">Nächsten Urlaub planen?</h2>
              <p className="mt-1 text-sm opacity-80">
                Freie Termine und Preise findest du auf Airbnb — dort kannst du auch
                direkt buchen.
              </p>
              <a
                href={AIRBNB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-700)] transition-opacity hover:opacity-90"
              >
                Auf Airbnb buchen
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-8 border-t border-[var(--color-brand-200)] bg-[var(--color-brand-50)] py-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 text-center text-xs text-[var(--brand-ink-soft)]">
          <SiteQrCode url={SITE_URL} />
          <p>
            Gastgeberin: <strong>Susanne</strong> · Rendswühren, Schleswig-Holstein
          </p>
          <p className="mt-1">
            <a
              href={AIRBNB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--color-brand-600)]"
            >
              Inserat auf Airbnb ansehen
            </a>
            {' · '}
            <a
              href="/datenschutz"
              className="underline underline-offset-2 hover:text-[var(--color-brand-600)]"
            >
              Datenschutz
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}

function RuleGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-5 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-500)]">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function RuleItem({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode
  label: string
  detail?: string
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-[var(--color-brand-500)] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-[var(--brand-ink)]">{label}</p>
        {detail && (
          <p className="mt-0.5 text-xs text-[var(--brand-ink-soft)]">{detail}</p>
        )}
      </div>
    </div>
  )
}

function PriceItem({
  label,
  price,
  detail,
}: {
  label: string
  price: string
  detail?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--brand-ink)]">{label}</p>
        {detail && (
          <p className="mt-0.5 text-xs text-[var(--brand-ink-soft)]">{detail}</p>
        )}
      </div>
      <span className="shrink-0 text-sm font-bold text-[var(--color-brand-600)]">
        {price}
      </span>
    </div>
  )
}

const COLOR_MAP = {
  amber: {
    pill: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: 'text-amber-500',
    dot: 'bg-amber-400',
  },
  blue: {
    pill: 'bg-sky-50 border-sky-200 text-sky-700',
    icon: 'text-sky-500',
    dot: 'bg-sky-400',
  },
  green: {
    pill: 'bg-[var(--color-brand-50)] border-[var(--color-brand-200)] text-[var(--color-brand-700)]',
    icon: 'text-[var(--color-brand-500)]',
    dot: 'bg-[var(--color-brand-400)]',
  },
  purple: {
    pill: 'bg-violet-50 border-violet-200 text-violet-700',
    icon: 'text-violet-500',
    dot: 'bg-violet-400',
  },
  rose: {
    pill: 'bg-rose-50 border-rose-200 text-rose-700',
    icon: 'text-rose-500',
    dot: 'bg-rose-400',
  },
} as const

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function ActivityGroup({
  icon,
  title,
  color,
  items,
}: {
  icon: React.ReactNode
  title: string
  color: keyof typeof COLOR_MAP
  items: { name: string; distance: string; detail: string; mapsQuery?: string; website?: string }[]
}) {
  const c = COLOR_MAP[color]
  return (
    <div>
      <div
        className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.pill}`}
      >
        <span className={`[&>svg]:h-3.5 [&>svg]:w-3.5 ${c.icon}`}>{icon}</span>
        {title}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="flex gap-3">
            <div className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                {item.mapsQuery ? (
                  <a
                    href={mapsSearchUrl(item.mapsQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--brand-ink)] underline underline-offset-2 hover:text-[var(--color-brand-600)]"
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-[var(--brand-ink)]">
                    {item.name}
                  </span>
                )}
                <span className="text-xs text-[var(--brand-ink-soft)]">
                  {item.distance}
                </span>
                {item.website && (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--brand-ink-soft)] underline underline-offset-2 hover:text-[var(--color-brand-600)]"
                  >
                    Website
                  </a>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[var(--brand-ink-soft)]">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
