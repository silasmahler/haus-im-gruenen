'use client'

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
  Baby,
} from 'lucide-react'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { RulesAcceptance } from '@/components/RulesAcceptance'
import { SiteQrCode } from '@/components/SiteQrCode'
import { WifiCard } from '@/components/WifiCard'
import { useLanguage } from '@/i18n/LanguageContext'

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

const AUSFLUGSZIELE_ICONS = [
  { icon: <Utensils />, color: 'rose' as const },
  { icon: <Baby />, color: 'amber' as const },
  { icon: <Waves />, color: 'blue' as const },
  { icon: <Bike />, color: 'green' as const },
]

const HAUSREGELN_ICONS: React.ReactNode[][] = [
  [<Clock key="ci" />, <Clock key="co" />],
  [
    <Users key="guests" />,
    <PawPrint key="pets" />,
    <PartyPopper key="party" />,
    <Camera key="photo" />,
    <CigaretteOff key="smoke" />,
  ],
  [<Trash2 key="waste" />, <Utensils key="dishes" />, <Car key="park" />, <CigaretteOff key="smoke2" />],
  [<Trash2 key="waste2" />, <Zap key="power" />, <Key key="key" />, <Utensils key="dishes2" />],
  [<AlarmCheck key="co2" />, <Flame key="smoke3" />],
]

export default function Page() {
  const { t } = useLanguage()

  return (
    <>
      <RulesAcceptance />

      <header className="sticky top-0 z-40 border-b border-[var(--color-brand-200)] bg-[var(--brand-foam)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white">
            <Home className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-none text-[var(--brand-ink)]">
              Haus im Grünen
            </p>
            <p className="truncate text-xs text-[var(--brand-ink-soft)]">{t.header.subtitle}</p>
          </div>
          <div className="ml-auto flex shrink-0 basis-full items-center justify-end gap-2 sm:basis-auto sm:justify-normal">
            <LanguageSwitcher />
            <a
              href={AIRBNB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--color-brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.header.bookNow}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-10 px-4 py-8">
        {/* Hero */}
        <section className="text-center">
          <span className="brand-pill mb-4 inline-flex">
            <span>🌿</span> {t.hero.pill}
          </span>
          <h1 className="text-3xl font-bold text-[var(--brand-ink)]">
            {t.hero.title1}
            <br />
            <span className="text-[var(--color-brand-600)]">{t.hero.title2}</span>
          </h1>
          <p className="mt-3 text-base text-[var(--brand-ink-soft)]">{t.hero.subtitle}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {t.hero.tags.map((tag) => (
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
              {t.gallery.viewAll}
            </a>
          </p>
        </section>

        {/* WLAN */}
        <section id="wlan">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">
            <Wifi className="mr-2 inline-block h-5 w-5 text-[var(--color-brand-500)]" />
            {t.wlan.heading}
          </h2>
          <WifiCard />
        </section>

        {/* Hausregeln */}
        <section id="hausregeln">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">
            {t.hausregeln.heading}
          </h2>
          <div className="brand-card divide-y divide-[var(--color-brand-100)]">
            {t.hausregeln.groups.map((group, groupIndex) => (
              <RuleGroup key={group.title} title={group.title}>
                {group.items.map((item, itemIndex) => (
                  <RuleItem
                    key={item.label}
                    icon={HAUSREGELN_ICONS[groupIndex]?.[itemIndex]}
                    label={item.label}
                    detail={item.detail}
                  />
                ))}
              </RuleGroup>
            ))}
          </div>
        </section>

        {/* Preise */}
        <section id="preise">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">{t.preise.heading}</h2>
          <div className="brand-card overflow-hidden">
            <div className="bg-[var(--color-brand-600)] px-5 py-4 text-white">
              <p className="text-sm font-medium opacity-80">{t.preise.cleaningFee}</p>
              <p className="text-3xl font-bold">45 €</p>
              <p className="mt-1 text-xs opacity-70">{t.preise.cleaningIncludes}</p>
            </div>
            <div className="divide-y divide-[var(--color-brand-100)] px-5">
              <PriceItem
                label={t.preise.bedding}
                price={t.preise.beddingPrice}
                detail={t.preise.beddingDetail}
              />
              <PriceItem label={t.preise.extraBedding} price={t.preise.extraBeddingPrice} />
              <PriceItem
                label={t.preise.firewood}
                price={t.preise.firewoodPrice}
                detail={t.preise.firewoodDetail}
              />
              <PriceItem
                label={t.preise.grillPackage}
                price={t.preise.grillPrice}
                detail={t.preise.grillDetail}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--brand-ink-soft)]">{t.preise.note}</p>
        </section>

        {/* Ausstattung */}
        <section id="ausstattung">
          <h2 className="mb-3 text-xl font-bold text-[var(--brand-ink)]">
            {t.ausstattung.heading}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              <Wifi key="wifi" />,
              <Utensils key="kitchen" />,
              <Flame key="stove" />,
              <ShowerHead key="tub" />,
              <Car key="carport" />,
              <Users key="highchair" />,
            ].map((icon, index) => (
              <div
                key={t.ausstattung.items[index]}
                className="brand-card-green flex items-center gap-2.5 px-3 py-2.5"
              >
                <span className="shrink-0 text-[var(--color-brand-600)]">{icon}</span>
                <span className="text-xs font-medium text-[var(--brand-ink)]">
                  {t.ausstattung.items[index]}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Ausflugsziele & persönliche Empfehlungen */}
        <section id="ausflugsziele">
          <h2 className="mb-1 text-xl font-bold text-[var(--brand-ink)]">
            {t.ausflugsziele.heading}
          </h2>
          <p className="mb-4 text-sm text-[var(--brand-ink-soft)]">{t.ausflugsziele.intro}</p>

          <div className="space-y-6">
            {t.ausflugsziele.groups.map((group, index) => (
              <ActivityGroup
                key={group.title}
                icon={AUSFLUGSZIELE_ICONS[index].icon}
                title={group.title}
                color={AUSFLUGSZIELE_ICONS[index].color}
                items={group.items}
              />
            ))}
          </div>
        </section>

        {/* Buchungs-CTA */}
        <section className="overflow-hidden rounded-2xl bg-[var(--color-brand-700)] px-6 py-7 text-white">
          <div className="flex items-start gap-4">
            <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 opacity-80" />
            <div>
              <h2 className="text-lg font-bold">{t.cta.heading}</h2>
              <p className="mt-1 text-sm opacity-80">{t.cta.text}</p>
              <a
                href={AIRBNB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-700)] transition-opacity hover:opacity-90"
              >
                {t.cta.button}
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
            {t.footer.hostPrefix}
            <strong>{t.footer.hostName}</strong>
            {t.footer.hostSuffix}
          </p>
          <p className="mt-1">
            <a
              href={AIRBNB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--color-brand-600)]"
            >
              {t.footer.listing}
            </a>
            {' · '}
            <a
              href="/datenschutz"
              className="underline underline-offset-2 hover:text-[var(--color-brand-600)]"
            >
              {t.footer.privacy}
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
