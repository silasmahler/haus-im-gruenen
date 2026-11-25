'use client'

import { ArrowDown, BedDouble, Briefcase, CarFront, CookingPot, House, Moon, Receipt, Shirt, Wifi } from 'lucide-react'

import { InquiryForm } from '@/components/InquiryForm'
import { Picture } from '@/components/Picture'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { photo } from '@/lib/photos'

const HERO = photo('33')
const STRIP = ['19', '02', '06'].map(photo)
// Same order as site.firmen.advantages
const ADVANTAGE_ICONS = [House, BedDouble, Wifi, CookingPot, CarFront, Moon, Briefcase, Shirt, Receipt]

export function FirmenContent() {
  const { locale } = useLanguage()
  const f = useSite().firmen

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-14 sm:px-6 sm:pt-20 md:grid-cols-2 md:gap-14">
        <div>
          <p className="text-sm font-medium text-wood">{f.title}</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{f.heading}</h1>
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
        <Picture photo={HERO} alt={HERO.alt[locale]} priority sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-lg object-cover" />
      </section>

      <ul className="mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-2 px-4 sm:gap-3 sm:px-6">
        {STRIP.map((p) => (
          <li key={p.id}>
            <Picture photo={p} alt={p.alt[locale]} sizes="33vw" className="aspect-[4/3] w-full rounded-lg object-cover ring-1 ring-ink/5" />
          </li>
        ))}
      </ul>

      <section className="mt-16 bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{f.advantagesTitle}</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {f.advantages.map((item, i) => {
              const Icon = ADVANTAGE_ICONS[i]
              return (
                <li key={item} className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-light text-moss">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="pt-1.5 text-ink">{item}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
        <p className="text-lg leading-relaxed text-ink-soft">{f.closing}</p>
        <p className="mt-8 border-l-2 border-wood pl-5 font-display text-2xl text-ink italic">{f.highlight}</p>
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
