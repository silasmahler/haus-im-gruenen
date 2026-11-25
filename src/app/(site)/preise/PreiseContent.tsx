'use client'

import { ArrowRight, Briefcase, Sun } from 'lucide-react'
import Link from 'next/link'

import { Placeholder } from '@/components/Placeholder'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'

const dot = <span className="mt-3 size-1.5 shrink-0 rounded-full bg-moss" aria-hidden />

// Prices are shown as delivered in the owner's concept (§7), marked provisional.
// No price calendar or automatic calculation until the rules are confirmed.
export function PreiseContent() {
  const { locale } = useLanguage()
  const p = useSite().preise
  const eur = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })

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
        <Link href="/firmenkunden#anfrage" className="group flex flex-col rounded-lg border border-line bg-paper p-6 hover:border-wood">
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
        <h2 className="font-display text-3xl text-ink">{p.tableTitle}</h2>
        <div className="mt-4">
          <Placeholder>{p.provisional}</Placeholder>
        </div>
        <div className="mt-6 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[28rem] text-left">
            <caption className="sr-only">{p.tableTitle}</caption>
            <thead className="bg-cream text-sm text-ink-soft">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{p.colPeriod}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{p.colPrice}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{p.colMin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {p.rows.map((r) => (
                <tr key={r.period}>
                  <th scope="row" className="px-4 py-3 font-normal text-ink">{r.period}</th>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-ink tabular-nums">{eur.format(r.price)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                    {r.minNights === null ? (
                      <span className="rounded border border-dashed border-wood px-2 py-0.5 text-sm text-wood">{p.pending}</span>
                    ) : (
                      <span className="text-ink">{r.minNights}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink-soft">{p.tableNote}</p>
      </section>

      <section className="pt-14">
        <h2 className="font-display text-3xl text-ink">{p.holidayTitle}</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{p.holidayText}</p>
        <div className="mt-4">
          <Placeholder>{p.holidayPlaceholder}</Placeholder>
        </div>
      </section>

      <section className="pt-14">
        <h2 className="font-display text-3xl text-ink">{p.stayTitle}</h2>
        <ul className="mt-4 space-y-2 text-lg leading-relaxed text-ink-soft">
          {p.stayRules.map((r) => (
            <li key={r} className="flex gap-3">
              {dot}
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="pt-14">
        <h2 className="font-display text-3xl text-ink">{p.extrasTitle}</h2>
        <dl className="mt-4 divide-y divide-line rounded-lg border border-line">
          {p.extras.map((x) => (
            <div key={x.label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt className="text-ink">{x.label}</dt>
              <dd className="text-ink-soft sm:text-right">{x.price}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 space-y-3">
          {p.extrasPlaceholders.map((t) => (
            <Placeholder key={t}>{t}</Placeholder>
          ))}
        </div>
      </section>

      <section className="pt-14">
        <h2 className="font-display text-3xl text-ink">{p.discountsTitle}</h2>
        <div className="mt-4">
          <Placeholder>{p.discountsPlaceholder}</Placeholder>
        </div>
      </section>

      <section className="pt-14">
        <p className="text-lg leading-relaxed text-ink-soft">{p.totalNote}</p>
        <div className="mt-4">
          <Placeholder publicText={p.costsPublic}>{p.taxPlaceholder}</Placeholder>
        </div>
        <p className="mt-6">
          <Link href="/buchungsbedingungen" className="text-moss underline underline-offset-4 hover:text-moss-dark">
            {p.termsLink}
          </Link>
        </p>
      </section>
    </div>
  )
}
