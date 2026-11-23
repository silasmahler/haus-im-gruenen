'use client'

import { useSite } from '@/i18n/site'

export function Hosts({ className = '' }: { className?: string }) {
  const h = useSite().hosts
  return (
    <section aria-labelledby="hosts-title" className={`flex items-start gap-5 ${className}`}>
      <img
        src="/fotos/gastgeber-susanne.webp"
        alt={h.photoAlt}
        width={320}
        height={320}
        loading="lazy"
        decoding="async"
        className="size-20 shrink-0 rounded-full object-cover ring-2 ring-cream-deep sm:size-24"
      />
      <div className="min-w-0 flex-1">
        <h2 id="hosts-title" className="font-display text-2xl text-ink">{h.title}</h2>
        <p className="mt-1 font-display text-lg text-moss">{h.name}</p>
        <blockquote className="mt-3 text-ink/85 leading-relaxed">
          <p>{h.about}</p>
        </blockquote>
        <p className="mt-2 text-sm text-ink/70">{h.passions}</p>
      </div>
    </section>
  )
}
