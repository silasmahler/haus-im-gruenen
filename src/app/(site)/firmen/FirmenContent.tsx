'use client'

import { ArrowDown, BedDouble, CarFront, CookingPot, Shirt, Sofa, Wifi } from 'lucide-react'

import { InquiryForm } from '@/components/InquiryForm'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { photo } from '@/lib/photos'

const HERO = photo('33')
const STRIP = ['19', '02', '06'].map(photo)
// Same order as site.firmen.comfort
const COMFORT_ICONS = [BedDouble, CookingPot, Wifi, Sofa, Shirt, CarFront]

export function FirmenContent() {
  const { locale } = useLanguage()
  const f = useSite().firmen

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-14 sm:px-6 sm:pt-20 md:grid-cols-2 md:gap-14">
        <div>
          <p className="text-sm font-medium text-moss">{f.title}</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{f.heading}</h1>
          <p className="mt-4 font-display text-2xl text-moss italic">{f.claim}</p>
          {f.paragraphs.map((t) => (
            <p key={t} className="mt-5 text-lg leading-relaxed text-ink-soft">
              {t}
            </p>
          ))}
          <a href="#anfrage" className="site-btn mt-8">
            {f.ctaTop}
            <ArrowDown className="size-4" aria-hidden />
          </a>
        </div>
        <img src={HERO.src} alt={HERO.alt[locale]} className="aspect-[4/3] w-full rounded-lg object-cover" />
      </section>

      <section className="mt-20 bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{f.comfortTitle}</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {f.comfort.map((c, i) => {
              const Icon = COMFORT_ICONS[i]
              return (
                <li key={c.title} className="rounded-lg border border-line bg-paper p-6">
                  <span className="flex size-11 items-center justify-center rounded-full bg-sage-light text-moss">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-xl text-ink">{c.title}</h3>
                  <p className="mt-2 text-ink-soft">{c.text}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <ul className="mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-2 px-4 sm:gap-3 sm:px-6">
        {STRIP.map((p) => (
          <li key={p.id}>
            <img src={p.thumb} alt={p.alt[locale]} loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover" />
          </li>
        ))}
      </ul>

      <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">{f.conditionsTitle}</h2>
        {f.conditions.map((t) => (
          <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">
            {t}
          </p>
        ))}
        <p className="mt-8 border-l-2 border-wood pl-5 font-display text-2xl text-ink italic">{f.conditionsHighlight}</p>
      </section>

      <section id="anfrage" className="mx-auto max-w-3xl scroll-mt-28 px-4 pt-16 sm:px-6">
        <div className="rounded-lg border border-line bg-cream p-5 sm:p-8">
          <h2 className="mb-6 font-display text-3xl text-ink">{f.formTitle}</h2>
          <InquiryForm variant="firma" />
        </div>
      </section>
    </>
  )
}
