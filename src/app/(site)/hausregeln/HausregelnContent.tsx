'use client'

import { Ban, CarFront, CigaretteOff, Clock, PawPrint, Recycle } from 'lucide-react'
import Link from 'next/link'

import { Placeholder } from '@/components/Placeholder'
import { useSite } from '@/i18n/site'

// Same order as site.hausregeln.rules
const RULE_ICONS = [CigaretteOff, PawPrint, Ban, Recycle, CarFront]

export function HausregelnContent() {
  const h = useSite().hausregeln

  return (
    <div className="mx-auto max-w-3xl px-4 pt-14 sm:px-6 sm:pt-20">
      <h1 className="font-display text-5xl text-ink sm:text-6xl">{h.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">{h.intro}</p>

      <ul className="mt-10 space-y-5">
        {h.rules.map((r, i) => {
          const Icon = RULE_ICONS[i]
          return (
            <li key={r} className="flex items-start gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-light text-moss">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="pt-1.5 text-lg text-ink">{r}</span>
            </li>
          )
        })}
      </ul>

      <section className="mt-14 rounded-lg bg-cream px-6 py-6">
        <h2 className="flex items-center gap-3 font-display text-2xl text-ink">
          <Clock className="size-6 text-moss" strokeWidth={1.75} aria-hidden />
          {h.timesTitle}
        </h2>
        <ul className="mt-4 space-y-1 text-lg text-ink">
          {h.times.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <Placeholder>{h.placeholder}</Placeholder>
      </div>

      <p className="mt-12 text-ink-soft">
        {h.guestbookHint}{' '}
        <Link href="/gaestemappe" className="text-moss underline underline-offset-4 hover:text-moss-dark">
          {h.guestbookLink}
        </Link>
      </p>
    </div>
  )
}
