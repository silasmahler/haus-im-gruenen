'use client'

import { useSite } from '@/i18n/site'

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === '1'
// Analytics may only be described while it actually runs (see src/app/layout.tsx)
const ANALYTICS = Boolean(process.env.NEXT_PUBLIC_GOATCOUNTER_CODE)

export function DatenschutzContent() {
  const d = useSite().datenschutz
  const sections = d.sections.filter((s) => s.id !== 'analytics' || ANALYTICS)

  return (
    <div className="mx-auto max-w-2xl px-4 pt-14 sm:px-6 sm:pt-20">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{d.title}</h1>
      {sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-display text-2xl text-ink">{s.heading}</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">{PREVIEW && s.id === 'hosting' ? d.hostingPreview : s.text}</p>
        </section>
      ))}
    </div>
  )
}
