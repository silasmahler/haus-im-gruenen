'use client'

import { useSite } from '@/i18n/site'

export function DatenschutzContent() {
  const d = useSite().datenschutz

  return (
    <div className="mx-auto max-w-2xl px-4 pt-14 sm:px-6 sm:pt-20">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{d.title}</h1>
      {d.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-display text-2xl text-ink">{s.heading}</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
        </section>
      ))}
    </div>
  )
}
