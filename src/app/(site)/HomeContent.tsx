'use client'

import { ArrowRight, BookOpen, Briefcase, Car, Flame, Home, Sun, Trees, Users, Wifi } from 'lucide-react'
import Link from 'next/link'

import { HedgeDivider } from '@/components/Brand'
import { Hosts } from '@/components/Hosts'
import { Picture } from '@/components/Picture'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { photo } from '@/lib/photos'

// Owner's confirmed intro photo: green garden lounge, set table, wine bottle.
const HERO = photo('01')
const STRIP = ['05', '19', '02', '38'].map(photo)

export function HomeContent() {
  const { locale } = useLanguage()
  const s = useSite()
  const h = s.home

  // Same order as h.advantages
  const ADVANTAGE_ICONS = [Home, Users, Wifi, Trees, Flame, Car]

  return (
    <>
      {/* QR codes in the house still point to "/", so booked guests need a quick way through */}
      <div className="border-b border-line bg-sage-light">
        <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 px-4 py-2.5 text-sm text-ink sm:px-6">
          <BookOpen className="size-4 text-moss" aria-hidden />
          {h.guestbookNotice}
          <Link href="/gaestemappe" className="inline-flex items-center gap-1 font-medium text-moss underline underline-offset-4 hover:text-moss-dark">
            {h.guestbookLink}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </p>
      </div>

      {/* Whole photo in its natural 4:3, never wider than its 1440px source or taller than ~78vh;
          title and intro below it so the photo stays uncovered */}
      <div className="mx-auto w-full max-w-[min(64rem,104vh)] sm:px-6 sm:pt-6">
        <Picture
          photo={HERO}
          alt={HERO.alt[locale]}
          priority
          sizes="(min-width: 640px) min(64rem, 104vh), 100vw"
          className="block h-auto w-full sm:rounded-lg"
        />
      </div>

      <section className="mx-auto max-w-3xl px-4 pt-12 pb-4 sm:px-6 sm:pt-16">
        <p className="text-sm font-medium tracking-wide text-wood">{h.place}</p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl lg:text-7xl">{h.title}</h1>
        <p className="mt-4 font-display text-2xl text-moss italic lg:text-3xl">{h.claim}</p>
        <p className="mt-8 text-xl leading-relaxed text-ink">{h.lead}</p>
        {h.paragraphs.map((t) => (
          <p key={t} className="mt-5 text-lg leading-relaxed text-ink-soft">
            {t}
          </p>
        ))}

        {/* Concept §3: two equal entry points directly below the intro */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link
            href="/urlaub"
            className="flex items-center justify-center gap-3 rounded-lg bg-moss-dark px-6 py-4 text-lg font-medium text-white transition-colors hover:bg-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            <Sun className="size-6" aria-hidden />
            {h.urlaubButton}
          </Link>
          <Link
            href="/firmenkunden"
            className="flex items-center justify-center gap-3 rounded-lg bg-sage-light px-6 py-4 text-lg font-medium text-moss-dark ring-1 ring-moss/25 transition-colors hover:bg-sage/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            <Briefcase className="size-6" aria-hidden />
            {h.firmenButton}
          </Link>
        </div>
      </section>

      <section aria-label={h.advantagesLabel} className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {h.advantages.map((label, i) => {
            const Icon = ADVANTAGE_ICONS[i]
            return (
              <li key={label} className="flex flex-col items-center gap-2 rounded-lg border border-line bg-white px-3 py-5 text-center">
                <Icon className="size-7 text-moss" aria-hidden />
                <span className="text-sm font-medium text-ink">{label}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">{h.introTitle}</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{h.introText}</p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {(
            [
              ['/ferienhaus', h.links.ausstattung],
              ['/preise', h.links.verfuegbarkeit],
              ['/kontakt', h.links.kontakt],
            ] as const
          ).map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="inline-flex items-center gap-1 text-moss underline underline-offset-4 hover:text-moss-dark">
                {label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <HedgeDivider className="mt-20" width="max-w-3xl" />

      <Hosts className="mx-auto mt-10 max-w-3xl px-4 sm:px-6" />

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-3xl text-ink">{h.photosTitle}</h2>
          <Link href="/ferienhaus#galerie" className="inline-flex items-center gap-1 text-moss underline underline-offset-4 hover:text-moss-dark">
            {h.photosLink}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {STRIP.map((p) => (
            <li key={p.id}>
              <Picture
                photo={p}
                alt={p.alt[locale]}
                sizes="(min-width: 768px) 25vw, 50vw"
                className="aspect-[4/3] w-full rounded-lg object-cover ring-1 ring-ink/5"
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="rounded-lg bg-cream-deep/70 px-6 py-10 text-center sm:px-12 sm:py-14">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{h.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">{h.ctaText}</p>
          <Link href="/kontakt" className="site-btn mt-8">
            {h.ctaButton}
          </Link>
        </div>
      </section>
    </>
  )
}
