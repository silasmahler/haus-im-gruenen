'use client'

import { ExternalLink, MapPin } from 'lucide-react'
import { useState } from 'react'

import { Placeholder } from '@/components/Placeholder'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { photo } from '@/lib/photos'

// One photo per text section, same order as site.urlaub.sections
const SECTION_PHOTOS = ['03', '38'].map(photo)
const LAGE_PHOTOS = ['39', '35'].map(photo)
// Village level only (Rendswühren), no exact address
const OSM_EMBED = 'https://www.openstreetmap.org/export/embed.html?bbox=10.09%2C54.045%2C10.27%2C54.10&layer=mapnik'

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function UrlaubContent() {
  const { locale, t } = useLanguage()
  const u = useSite().urlaub
  const [mapLoaded, setMapLoaded] = useState(false)

  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">{u.title}</h1>
      </header>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-12 sm:px-6 md:space-y-24">
        {u.sections.map((sec, i) => {
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
                {sec.paragraphs.map((p) => (
                  <p key={p} className="mt-4 text-lg leading-relaxed text-ink-soft">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="mt-24 bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-medium text-moss">{u.lageTitle}</p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{u.lageHeading}</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
            <div>
              {u.lageParagraphs.map((p) => (
                <p key={p} className="mt-4 text-lg leading-relaxed text-ink-soft first:mt-0">
                  {p}
                </p>
              ))}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {LAGE_PHOTOS.map((img) => (
                  <img key={img.id} src={img.thumb} alt={img.alt[locale]} loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover" />
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
    </>
  )
}
