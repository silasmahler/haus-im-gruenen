'use client'

import { Baby, Bath, BedDouble, CarFront, CookingPot, Flame, Shirt, Toilet, Trees, Wifi } from 'lucide-react'
import Link from 'next/link'

import { Gallery } from '@/components/Gallery'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { PHOTOS, photo } from '@/lib/photos'

// One photo per text section, same order as site.ferienhaus.sections
const SECTION_PHOTOS = ['09', '19', '10', '33'].map(photo)
// Same order as site.ferienhaus.amenities
const AMENITY_ICONS = [BedDouble, Flame, CookingPot, Bath, Toilet, Wifi, Trees, CarFront, Shirt, Baby]

export function FerienhausContent() {
  const { locale } = useLanguage()
  const f = useSite().ferienhaus

  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">{f.title}</h1>
      </header>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-12 sm:px-6 md:space-y-24">
        {f.sections.map((sec, i) => {
          const img = SECTION_PHOTOS[i]
          return (
            <section key={sec.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <img
                src={img.src}
                alt={img.alt[locale]}
                loading={i === 0 ? undefined : 'lazy'}
                className={`aspect-[4/3] w-full rounded-lg object-cover ${i % 2 ? 'md:order-2' : ''}`}
              />
              <div>
                <h2 className="font-display text-3xl text-ink sm:text-4xl">{sec.title}</h2>
                {sec.paragraphs.map((t) => (
                  <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">
                    {t}
                  </p>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="mt-24 bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{f.amenitiesTitle}</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {f.amenities.map((item, i) => {
              const Icon = AMENITY_ICONS[i]
              return (
                <li key={item} className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-moss">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="pt-2 text-ink">{item}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section id="galerie" className="mx-auto max-w-6xl scroll-mt-28 px-4 pt-20 sm:px-6">
        <h2 className="mb-8 font-display text-3xl text-ink sm:text-4xl">{f.galleryTitle}</h2>
        <Gallery photos={PHOTOS} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-lg border border-line px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="font-display text-2xl text-ink">{f.ctaText}</p>
          <Link href="/kontakt" className="site-btn shrink-0">
            {f.ctaButton}
          </Link>
        </div>
      </section>
    </>
  )
}
