'use client'

import { ExternalLink, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Picture } from '@/components/Picture'
import { Placeholder } from '@/components/Placeholder'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { photo } from '@/lib/photos'

const LAGE_PHOTOS = ['39', '35'].map(photo)
// Village level only (Rendswühren), no exact address
const OSM_EMBED = 'https://www.openstreetmap.org/export/embed.html?bbox=10.09%2C54.045%2C10.27%2C54.10&layer=mapnik'

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function UmgebungContent() {
  const { locale, t } = useLanguage()
  const site = useSite()
  const u = site.umgebung
  const [mapLoaded, setMapLoaded] = useState(false)

  return (
    <>
      <header className="mx-auto max-w-3xl px-4 pt-14 sm:px-6 sm:pt-20">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">{u.title}</h1>
      </header>

      <section className="mt-12 bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{u.heading}</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
            <div>
              {u.paragraphs.map((p) => (
                <p key={p} className="mt-4 text-lg leading-relaxed text-ink-soft first:mt-0">
                  {p}
                </p>
              ))}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {LAGE_PHOTOS.map((img) => (
                  <Picture key={img.id} photo={img} alt={img.alt[locale]} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-[4/3] w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-2xl text-ink">{u.mapTitle}</h3>
              <div className="mt-4 overflow-hidden rounded-lg border border-line bg-sage-light">
                {mapLoaded ? (
                  <iframe src={OSM_EMBED} title={u.mapLabel} className="block aspect-[4/3] w-full" loading="lazy" />
                ) : (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 p-6 text-center">
                    <MapPin className="size-8 text-moss" aria-hidden />
                    <p className="max-w-sm text-sm text-ink-soft">{u.mapNote}</p>
                    <button type="button" onClick={() => setMapLoaded(true)} className="site-btn">
                      {u.mapButton}
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">{u.mapCaption}</p>

              <h3 className="mt-10 font-display text-2xl text-ink">{u.distancesTitle}</h3>
              <div className="mt-3">
                <Placeholder>{u.distancesPlaceholder}</Placeholder>
              </div>
              <h3 className="mt-8 font-display text-2xl text-ink">{u.shoppingTitle}</h3>
              <div className="mt-3">
                <Placeholder>{u.shoppingPlaceholder}</Placeholder>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations/restaurants come from the Gästemappe dictionary, single source of truth */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">{u.tipsTitle}</h2>
        <p className="mt-3 text-lg text-ink-soft">{u.tipsIntro}</p>
        <div className="mt-5">
          <Placeholder>{u.tipsPlaceholder}</Placeholder>
        </div>
        <div className="mt-10 space-y-12">
          {t.ausflugsziele.groups.map((group) => (
            <div key={group.title}>
              <h3 className="font-display text-2xl text-ink">{group.title}</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <li key={item.name} className="flex flex-col rounded-lg border border-line bg-paper p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="font-medium text-ink">{item.name}</p>
                      <span className="text-sm text-wood">{item.distance}</span>
                    </div>
                    <p className="mt-2 flex-1 text-sm text-ink-soft">{item.detail}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      {item.mapsQuery && (
                        <a href={mapsSearchUrl(item.mapsQuery)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-moss underline underline-offset-4 hover:text-moss-dark">
                          <MapPin className="size-4" aria-hidden />
                          {u.mapsLink}
                        </a>
                      )}
                      {item.website && (
                        <a href={item.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-moss underline underline-offset-4 hover:text-moss-dark">
                          <ExternalLink className="size-4" aria-hidden />
                          {u.websiteLink}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-lg border border-line px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="font-display text-2xl text-ink">{site.ferienhaus.ctaText}</p>
          <Link href="/kontakt" className="site-btn shrink-0">
            {site.ferienhaus.ctaButton}
          </Link>
        </div>
      </section>
    </>
  )
}
