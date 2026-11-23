'use client'

import { ArrowRight, Briefcase, CalendarDays, Sun } from 'lucide-react'
import Link from 'next/link'

import { Placeholder } from '@/components/Placeholder'
import { useSite } from '@/i18n/site'

export function PreiseContent() {
  const p = useSite().preise

  return (
    <div className="mx-auto max-w-4xl px-4 pt-14 sm:px-6 sm:pt-20">
      <p className="text-sm font-medium text-moss">{p.title}</p>
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
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
        <Link href="/firmen#anfrage" className="group flex flex-col rounded-lg border border-wood/50 bg-cream-deep/60 p-6 hover:border-wood">
          <span className="flex items-center gap-2 text-sm font-medium text-wood">
            <Briefcase className="size-4" aria-hidden />
            {p.firmaLabel}
          </span>
          <span className="mt-3 flex items-center gap-2 font-display text-2xl text-ink">
            {p.firmaButton}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
          <span className="mt-2 text-sm text-ink-soft">{p.firmaText}</span>
        </Link>
      </div>

      <section className="pt-16">
        <h2 className="font-display text-3xl text-ink">{p.tableTitle}</h2>
        <div className="mt-4">
          <Placeholder>{p.tablePlaceholder}</Placeholder>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-cream text-ink">
              <tr>
                {p.columns.map((c) => (
                  <th key={c} scope="col" className="px-4 py-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {p.seasons.map((s) => (
                <tr key={s} className="border-t border-line">
                  <th scope="row" className="px-4 py-3 font-medium text-ink">
                    {s}
                  </th>
                  {p.columns.slice(1).map((c) => (
                    <td key={c} className="px-4 py-3">
                      …
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pt-14">
        <h2 className="font-display text-3xl text-ink">{p.costsTitle}</h2>
        <div className="mt-4">
          <Placeholder>{p.costsPlaceholder}</Placeholder>
        </div>
      </section>

      <section className="pt-14">
        <h2 className="flex items-center gap-3 font-display text-3xl text-ink">
          <CalendarDays className="size-7 text-moss" strokeWidth={1.75} aria-hidden />
          {p.calendarTitle}
        </h2>
        <p className="mt-4 text-lg text-ink-soft">{p.calendarNote}</p>
        <Link href="/kontakt" className="site-btn mt-6">
          {p.bookingButton}
        </Link>
      </section>
    </div>
  )
}
