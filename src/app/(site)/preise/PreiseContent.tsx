'use client'

import { ArrowRight, Briefcase, Sun } from 'lucide-react'
import Link from 'next/link'

import { Placeholder } from '@/components/Placeholder'
import { useSite } from '@/i18n/site'

export function PreiseContent() {
  const p = useSite().preise

  return (
    <div className="mx-auto max-w-4xl px-4 pt-14 sm:px-6 sm:pt-20">
      <p className="text-sm font-medium text-wood">{p.title}</p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{p.heading}</h1>
      {p.paragraphs.map((t) => (
        <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">
          {t}
        </p>
      ))}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/kontakt" className="group flex flex-col rounded-lg border border-line bg-cream p-6 hover:border-moss">
          <span className="flex items-center gap-2 text-sm font-medium text-moss">
            <Sun className="size-4" aria-hidden />
            {p.bookingLabel}
          </span>
          <span className="mt-3 flex items-center gap-2 font-display text-2xl text-ink">
            {p.bookingButton}
            <ArrowRight className="size-5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
        <Link href="/kontakt?typ=firma" className="group flex flex-col rounded-lg border border-line bg-paper p-6 hover:border-wood">
          <span className="flex items-center gap-2 text-sm font-medium text-wood">
            <Briefcase className="size-4" aria-hidden />
            {p.firmaLabel}
          </span>
          <span className="mt-3 flex items-center gap-2 font-display text-2xl text-ink">
            {p.firmaButton}
            <ArrowRight className="size-5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
          </span>
          <span className="mt-2 text-sm text-ink-soft">{p.firmaText}</span>
        </Link>
      </div>

      <section className="pt-16">
        <h2 className="font-display text-3xl text-ink">{p.stayTitle}</h2>
        <ul className="mt-4 space-y-2 text-lg leading-relaxed text-ink-soft">
          {p.stayRules.map((r) => (
            <li key={r} className="flex gap-3">
              <span className="mt-3 size-1.5 shrink-0 rounded-full bg-moss" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* Prices follow from the owner later; no price calendar yet */}
      <section className="pt-14">
        <h2 className="font-display text-3xl text-ink">{p.tableTitle}</h2>
        <div className="mt-4">
          <Placeholder>{p.tablePlaceholder}</Placeholder>
        </div>
      </section>

      <section className="pt-14">
        <h2 className="font-display text-3xl text-ink">{p.costsTitle}</h2>
        <div className="mt-4">
          <Placeholder publicText={p.costsPublic}>{p.costsPlaceholder}</Placeholder>
        </div>
      </section>
    </div>
  )
}
