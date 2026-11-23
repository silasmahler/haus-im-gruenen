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
  ArrowLeft,
  ExternalLink,
  Bike,
  Waves,
  Baby,
  Box,
} from 'lucide-react'

import Link from 'next/link'

import { BrandMark, HedgeDivider, Wordmark } from '@/components/Brand'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { RulesAcceptance } from '@/components/RulesAcceptance'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteQrCode } from '@/components/SiteQrCode'
import { WifiCard } from '@/components/WifiCard'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'

const AIRBNB_URL = 'https://www.airbnb.de/rooms/1697314718712995655'
const SITE_URL = 'https://haus-im-gruenen.com/gaestemappe'

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

const AUSFLUGSZIELE_ICONS = [<Utensils key="food" />, <Baby key="kids" />, <Waves key="water" />, <Bike key="bike" />]

const HAUSREGELN_ICONS: React.ReactNode[][] = [
  [<Clock key="ci" />, <Clock key="co" />],
  [
    <Users key="guests" />,
    <PawPrint key="pets" />,
    <PartyPopper key="party" />,
    <Camera key="photo" />,
    <CigaretteOff key="smoke" />,
  ],
  [
    <Trash2 key="waste" />,
    <Utensils key="dishes" />,
    <Car key="park" />,
    <CigaretteOff key="smoke2" />,
  ],
  [
    <Trash2 key="waste2" />,
    <Zap key="power" />,
    <Key key="key" />,
    <Utensils key="dishes2" />,
  ],
  [<AlarmCheck key="co2" />, <Flame key="smoke3" />],
]

// Start downloading the (three.js) tour chunk as soon as the teaser is touched/hovered; three stays out of the home bundle.
// 3D tour is built but not published yet; set to true (and move src/_tour-hidden back to src/app/tour) to release it
const SHOW_TOUR = false
const warmTour = () => void import('@/tour/buildScene')

export function GaestemappeContent() {
  const { t } = useLanguage()
  const s = useSite()
  const h2 = 'font-display text-3xl text-ink'
  const textLink = 'underline underline-offset-4 hover:text-moss-dark focus-visible:outline-2 focus-visible:outline-moss'

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <RulesAcceptance />

      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Link
            href="/"
            className="brand-link flex min-w-0 items-center gap-2.5 rounded-md text-xl text-ink focus-visible:outline-2 focus-visible:outline-moss"
          >
            <BrandMark className="size-9" />
            <span className="min-w-0">
              <Wordmark className="block leading-tight" />
              <span className="block text-xs text-ink-soft">{t.header.subtitle}</span>
            </span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <a
              href={AIRBNB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="site-btn !px-3 !py-2 text-sm whitespace-nowrap"
            >
              {t.header.bookNow}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-4 pt-4 pb-4 sm:space-y-14 sm:pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-moss"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {s.nav.home}
        </Link>

        {/* Hero */}
        <section className="!mt-6 text-center">
          <p className="text-sm tracking-wide text-moss">{t.hero.pill}</p>
          <h1 className="mt-2 font-display text-[2.125rem] leading-tight text-ink sm:text-5xl">
            {t.hero.title1}
            <br />
            <span className="text-moss italic">{t.hero.title2}</span>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-soft sm:mt-4 sm:text-lg">{t.hero.subtitle}</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {t.hero.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-sage-light px-3 py-1 text-sm text-moss-dark">
                {tag}
              </li>
            ))}
          </ul>
          <HedgeDivider className="mt-8 !px-0 sm:mt-10" width="max-w-md" />
        </section>

        {/* 3D-Rundgang Teaser */}
        {SHOW_TOUR && (
          <section aria-labelledby="tour-teaser-heading">
            <Link
              href="/tour?autostart=1"
              onPointerEnter={warmTour}
              onFocus={warmTour}
              onTouchStart={warmTour}
              className="group flex items-center gap-4 overflow-hidden rounded-lg border border-line bg-cream p-3 transition-colors hover:bg-cream-deep sm:gap-5 sm:p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/tour/grundriss.webp"
                alt={t.tour.teaser.imageAlt}
                width={1000}
                height={911}
                loading="lazy"
                className="size-24 shrink-0 rounded-md bg-paper object-contain sm:size-28"
              />
              <div className="min-w-0">
                <p className="mb-1 inline-flex items-center gap-1.5 text-sm text-moss">
                  <Box className="size-4" aria-hidden /> {t.tour.teaser.pill}
                </p>
                <h2 id="tour-teaser-heading" className="font-display text-2xl text-ink">
                  {t.tour.teaser.heading}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">{t.tour.teaser.text}</p>
                <span className="mt-2 inline-block text-sm font-medium text-moss group-hover:underline">
                  {t.tour.teaser.button} →
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* Fotogalerie */}
        <section id="galerie">
          <div className="grid grid-cols-2 gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS[0].src}
              alt={PHOTOS[0].alt}
              className="col-span-2 h-56 w-full rounded-lg object-cover sm:h-72"
            />
            {PHOTOS.slice(1).map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="h-36 w-full rounded-lg object-cover sm:h-44"
              />
            ))}
          </div>
          <p className="mt-3 text-right text-sm text-moss">
            <a href={AIRBNB_URL} target="_blank" rel="noopener noreferrer" className={textLink}>
              {t.gallery.viewAll}
            </a>
          </p>
        </section>

        {/* WLAN */}
        <section id="wlan">
          <h2 className={`${h2} mb-5 flex items-center gap-3`}>
            <IconBadge>
              <Wifi />
            </IconBadge>
            {t.wlan.heading}
          </h2>
          <WifiCard />
        </section>

        {/* Hausregeln */}
        <section id="hausregeln">
          <h2 className={`${h2} mb-5`}>{t.hausregeln.heading}</h2>
          <div className="divide-y divide-line rounded-lg border border-line bg-cream">
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
          <h2 className={`${h2} mb-5`}>{t.preise.heading}</h2>
          <div className="overflow-hidden rounded-lg border border-line bg-cream">
            <div className="bg-moss px-5 py-5 text-paper">
              <p className="text-sm">{t.preise.cleaningFee}</p>
              <p className="font-display text-4xl">45 €</p>
              <p className="mt-1 text-sm text-paper/85">{t.preise.cleaningIncludes}</p>
            </div>
            <div className="divide-y divide-line px-5">
              <PriceItem label={t.preise.bedding} price={t.preise.beddingPrice} detail={t.preise.beddingDetail} />
              <PriceItem label={t.preise.extraBedding} price={t.preise.extraBeddingPrice} />
              <PriceItem label={t.preise.firewood} price={t.preise.firewoodPrice} detail={t.preise.firewoodDetail} />
              <PriceItem label={t.preise.grillPackage} price={t.preise.grillPrice} detail={t.preise.grillDetail} />
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{t.preise.note}</p>
        </section>

        {/* Ausstattung */}
        <section id="ausstattung">
          <h2 className={`${h2} mb-6`}>{t.ausstattung.heading}</h2>
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              <Wifi key="wifi" />,
              <Utensils key="kitchen" />,
              <Flame key="stove" />,
              <ShowerHead key="tub" />,
              <Car key="carport" />,
              <Users key="highchair" />,
            ].map((icon, index) => (
              <li key={t.ausstattung.items[index]} className="flex items-center gap-4">
                <IconBadge>{icon}</IconBadge>
                <span className="text-ink">{t.ausstattung.items[index]}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Ausflugsziele & persönliche Empfehlungen */}
        <section id="ausflugsziele">
          <h2 className={h2}>{t.ausflugsziele.heading}</h2>
          <p className="mt-3 mb-6 text-base leading-relaxed text-ink-soft sm:mb-8 sm:text-lg">{t.ausflugsziele.intro}</p>
          <div className="space-y-8 sm:space-y-10">
            {t.ausflugsziele.groups.map((group, index) => (
              <ActivityGroup key={group.title} icon={AUSFLUGSZIELE_ICONS[index]} title={group.title} items={group.items} />
            ))}
          </div>
        </section>

        {/* QR + Gastgeber */}
        <section className="flex flex-col items-center gap-4 rounded-lg border border-line bg-cream px-6 py-8 text-center text-sm text-ink-soft">
          <SiteQrCode url={SITE_URL} />
          <p className="text-base">
            {t.footer.hostPrefix}
            <strong className="font-medium text-ink">{t.footer.hostName}</strong>
            {t.footer.hostSuffix}
          </p>
          <p className="text-moss">
            <a href={AIRBNB_URL} target="_blank" rel="noopener noreferrer" className={textLink}>
              {t.footer.listing}
            </a>
            <span className="text-ink-soft">{' · '}</span>
            <Link href="/datenschutz" className={textLink}>
              {t.footer.privacy}
            </Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

// Same round sage badge as the amenity icons on /ferienhaus.
function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-moss [&>svg]:size-5 [&>svg]:stroke-[1.75]"
      aria-hidden
    >
      {children}
    </span>
  )
}

function RuleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-5">
      <h3 className="mb-4 font-display text-xl text-ink">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function RuleItem({ icon, label, detail }: { icon: React.ReactNode; label: string; detail?: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-moss [&>svg]:size-5 [&>svg]:stroke-[1.75]" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="font-medium text-ink">{label}</p>
        {detail && <p className="mt-0.5 text-sm text-ink-soft">{detail}</p>}
      </div>
    </div>
  )
}

function PriceItem({ label, price, detail }: { label: string; price: string; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="font-medium text-ink">{label}</p>
        {detail && <p className="mt-0.5 text-sm text-ink-soft">{detail}</p>}
      </div>
      <span className="shrink-0 font-display text-lg text-moss-dark">{price}</span>
    </div>
  )
}

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function ActivityGroup({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode
  title: string
  items: { name: string; distance: string; detail: string; mapsQuery?: string; website?: string }[]
}) {
  const link = 'underline underline-offset-4 hover:text-moss-dark focus-visible:outline-2 focus-visible:outline-moss'
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-3 font-display text-2xl text-ink">
        <IconBadge>{icon}</IconBadge>
        {title}
      </h3>
      <ul className="space-y-4 border-l-2 border-sage pl-5 sm:ml-5">
        {items.map((item) => (
          <li key={item.name}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              {item.mapsQuery ? (
                <a
                  href={mapsSearchUrl(item.mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium text-ink ${link}`}
                >
                  {item.name}
                </a>
              ) : (
                <span className="font-medium text-ink">{item.name}</span>
              )}
              <span className="text-sm text-ink-soft">{item.distance}</span>
              {item.website && (
                <a href={item.website} target="_blank" rel="noopener noreferrer" className={`text-sm text-moss ${link}`}>
                  Website
                </a>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
