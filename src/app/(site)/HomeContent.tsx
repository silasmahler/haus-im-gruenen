'use client'

import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'

import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { photo } from '@/lib/photos'

// TODO(owner photo): 36 is a stand-in until the owner's dedicated intro photo arrives.
const HERO = photo('36')
const STRIP = ['05', '19', '02', '38'].map(photo)

export function HomeContent() {
  const { locale } = useLanguage()
  const s = useSite()
  const h = s.home

  const cards = [
    { ...h.urlaub, href: '/ferienhaus', img: photo('06') },
    { ...h.firmen, href: '/firmen', img: photo('33') },
  ]

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

      <img
        src={HERO.src}
        alt={HERO.alt[locale]}
        width={HERO.width}
        height={HERO.height}
        fetchPriority="high"
        className="block aspect-[4/3] w-full object-cover sm:aspect-[16/9] lg:aspect-auto lg:h-[76vh]"
      />

      <section className="mx-auto max-w-3xl px-4 pt-14 pb-4 sm:px-6 sm:pt-20">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">{h.title}</h1>
        <p className="mt-4 font-display text-2xl text-moss italic">{h.claim}</p>
        <p className="mt-8 text-xl leading-relaxed text-ink">{h.lead}</p>
        {h.paragraphs.map((t) => (
          <p key={t} className="mt-5 text-lg leading-relaxed text-ink-soft">
            {t}
          </p>
        ))}
        <p className="mt-10 border-l-2 border-wood pl-5 font-display text-2xl text-ink italic">{h.quote}</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pt-14 sm:px-6 md:grid-cols-2 md:gap-8">
        {cards.map((c) => (
          <article key={c.href} className="flex flex-col overflow-hidden rounded-lg border border-line bg-cream">
            <img src={c.img.thumb} alt={c.img.alt[locale]} loading="lazy" className="aspect-[3/2] w-full object-cover" />
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <h2 className="font-display text-3xl text-ink">{c.title}</h2>
              <p className="mt-3 flex-1 text-ink-soft">{c.text}</p>
              <Link href={c.href} className="site-btn mt-6 self-start">
                {c.button}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </section>

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
              <img src={p.thumb} alt={p.alt[locale]} loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover" />
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
