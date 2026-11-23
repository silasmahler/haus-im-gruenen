'use client'

import { Quote } from 'lucide-react'

import { Placeholder } from '@/components/Placeholder'
import { useSite } from '@/i18n/site'

export function BewertungenContent() {
  const b = useSite().bewertungen

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-wood">{b.title}</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{b.heading}</h1>
        {b.paragraphs.map((t) => (
          <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">
            {t}
          </p>
        ))}
      </div>

      {/* Only real reviews with source, text unchanged. Never fill these with invented quotes. */}
      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex flex-col rounded-lg border border-line bg-cream p-6">
            <Quote className="size-6 text-wood-light" aria-hidden />
            <div className="mt-3 flex-1">
              <Placeholder>{b.reviewPlaceholder}</Placeholder>
            </div>
            <p className="mt-5 font-medium text-ink">{b.author}</p>
            <p className="text-sm text-ink-soft">
              {b.source} · {b.date}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
