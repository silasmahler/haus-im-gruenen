'use client'

import { Placeholder } from '@/components/Placeholder'
import { useSite } from '@/i18n/site'

// TODO(owner): replace the placeholder with photo, first names and the owner's own sentence. Never invent these.
export function Hosts({ className = '' }: { className?: string }) {
  const h = useSite().hosts
  return (
    <section aria-labelledby="hosts-title" className={`flex items-start gap-5 ${className}`}>
      <div
        role="img"
        aria-label={h.photoAlt}
        className="grid size-20 shrink-0 place-items-center rounded-full border border-dashed border-wood bg-cream-deep/60 text-wood"
      >
        <svg viewBox="0 0 24 24" className="size-8" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="9" r="3.5" />
          <path d="M5 20c1-4 4-6 7-6s6 2 7 6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <h2 id="hosts-title" className="font-display text-2xl text-ink">{h.title}</h2>
        <div className="mt-3">
          <Placeholder>{h.request}</Placeholder>
        </div>
      </div>
    </section>
  )
}
