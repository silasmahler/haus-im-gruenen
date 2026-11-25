'use client'

import { Placeholder } from '@/components/Placeholder'
import { useSite } from '@/i18n/site'

export function BuchungsbedingungenContent() {
  const b = useSite().buchungsbedingungen

  return (
    <div className="mx-auto max-w-3xl px-4 pt-14 sm:px-6 sm:pt-20">
      <h1 className="font-display text-5xl text-ink sm:text-6xl">{b.title}</h1>
      <div className="mt-6">
        <Placeholder>{b.draft}</Placeholder>
      </div>

      {b.sections.map((sec) => (
        <section key={sec.title} className="pt-12">
          <h2 className="font-display text-3xl text-ink">{sec.title}</h2>
          <ul className="mt-4 space-y-2 text-lg leading-relaxed text-ink-soft">
            {sec.items.map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-3 size-1.5 shrink-0 rounded-full bg-moss" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          {sec.placeholder && (
            <div className="mt-4">
              <Placeholder>{sec.placeholder}</Placeholder>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
