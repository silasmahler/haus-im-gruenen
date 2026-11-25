'use client'

import {
  Bath,
  BedDouble,
  CarFront,
  ChefHat,
  CircleParking,
  CookingPot,
  Droplets,
  Flame,
  Heater,
  Microwave,
  Refrigerator,
  Toilet,
  Trees,
  Tv,
  Wifi,
  Warehouse,
} from 'lucide-react'
import Link from 'next/link'

import { Gallery } from '@/components/Gallery'
import { Picture } from '@/components/Picture'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { PHOTOS, photo } from '@/lib/photos'

// Same order as site.ferienhaus.groups and their items
const GROUP_PHOTOS = ['05', '16', '06'].map(photo)
const GROUP_ICONS = [
  [BedDouble, Tv, Flame, Wifi, Bath, Toilet],
  [ChefHat, Droplets, CookingPot, Heater, Microwave, Refrigerator],
  [Trees, Warehouse, CircleParking],
]

export function FerienhausContent() {
  const { locale } = useLanguage()
  const f = useSite().ferienhaus

  return (
    <>
      <header className="mx-auto max-w-3xl px-4 pt-14 sm:px-6 sm:pt-20">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">{f.title}</h1>
        <p className="mt-6 font-display text-2xl text-moss sm:text-3xl">{f.heading}</p>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{f.intro}</p>
      </header>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-14 sm:px-6 md:space-y-20">
        {f.groups.map((g, i) => {
          const img = GROUP_PHOTOS[i]
          return (
            <section key={g.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <Picture
                photo={img}
                alt={img.alt[locale]}
                priority={i === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                className={`aspect-[4/3] w-full rounded-lg object-cover ${i % 2 ? 'md:order-2' : ''}`}
              />
              <div>
                <h2 className="font-display text-3xl text-ink sm:text-4xl">{g.title}</h2>
                <ul className="mt-6 space-y-4">
                  {g.items.map((item, j) => {
                    const Icon = GROUP_ICONS[i][j] ?? CarFront
                    return (
                      <li key={item} className="flex items-start gap-4">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-light text-moss">
                          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                        </span>
                        <span className="pt-1.5 text-lg text-ink">{item}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )
        })}
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg bg-cream px-6 py-5 text-ink">
          {f.rulesNote}
          <Link href="/hausregeln" className="text-moss underline underline-offset-4 hover:text-moss-dark">
            {f.rulesLink}
          </Link>
        </p>
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
