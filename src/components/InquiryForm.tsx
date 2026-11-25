'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'

// POSTs JSON to NEXT_PUBLIC_INQUIRY_URL:
// { type: 'urlaub'|'firma', name, company, email, phone, arrival, departure, guests, message, website, lang }
// `website` is a honeypot (must stay empty). Expected response: 200 { ok: true }.
// Concept fields without their own backend field (children, extras, billing address,
// extension) are prepended to `message` as labelled lines.
const INQUIRY_URL = process.env.NEXT_PUBLIC_INQUIRY_URL

type Status = 'idle' | 'sending' | 'success' | 'error' | 'unavailable'

const input =
  'site-field mt-1 block w-full rounded-md border border-[#847c6a] bg-white px-3 py-2.5 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss'
const label = 'block text-sm font-medium text-ink'

const DAY = 24 * 60 * 60 * 1000
const MAX_GUESTS = 5
const MESSAGE_MAX = 2000

// Field order follows the guest's decision path: dates, party, contact, message.
// The form is not re-keyed when the variant changes, so typed values survive a switch.
export function InquiryForm({ variant }: { variant: 'urlaub' | 'firma' }) {
  const { locale } = useLanguage()
  const f = useSite().form
  const [status, setStatus] = useState<Status>('idle')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [sent, setSent] = useState<{ arrival: string; departure: string; guests: number } | null>(null)
  const firma = variant === 'firma'

  const nights =
    arrival && departure ? Math.round((Date.parse(departure) - Date.parse(arrival)) / DAY) : 0
  const dateFmt = new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'medium' })
  const fmt = (d: string) => dateFmt.format(new Date(`${d}T12:00:00`))

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!INQUIRY_URL) return setStatus('unavailable')
    const d = new FormData(e.currentTarget)
    const v = (k: string) => String(d.get(k) ?? '').trim()
    setStatus('sending')
    try {
      const res = await fetch(INQUIRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: variant,
          name: v('name'),
          company: v('company'),
          email: v('email'),
          phone: v('phone'),
          arrival: v('arrival'),
          departure: v('departure'),
          guests: Number(v('guests')),
          message: composeMessage(d, v, f, firma),
          website: v('website'),
          lang: locale,
        }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.ok) {
        setSent({ arrival: v('arrival'), departure: v('departure'), guests: Number(v('guests')) })
        setStatus('success')
      } else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-lg border border-sage bg-sage-light px-5 py-6">
        <p className="font-display text-xl text-ink">{f.successTitle}</p>
        {sent && (
          <p className="mt-2 text-ink">
            {fmt(sent.arrival)} – {fmt(sent.departure)} · {firma ? f.employees : f.guests}: {sent.guests}
          </p>
        )}
        <p className="mt-1 text-ink-soft">{f.successText}</p>
        <p className="mt-3 font-hand text-2xl text-wood">{f.successSignoff}</p>
        <Link
          href="/"
          className="mt-4 inline-block text-moss underline underline-offset-2 hover:text-moss-dark"
        >
          {f.homeLink}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      <p className="text-sm text-ink-soft sm:col-span-2">{f.requiredHint}</p>
      {firma && (
        <Field label={f.company} required className="sm:col-span-2">
          <input name="company" required autoComplete="organization" className={input} />
        </Field>
      )}
      <Field label={f.arrival} required>
        <input
          name="arrival"
          type="date"
          required
          value={arrival}
          onChange={(e) => setArrival(e.target.value)}
          className={input}
        />
      </Field>
      <Field label={f.departure} required>
        {/* min enforces departure >= arrival via native validation */}
        <input
          name="departure"
          type="date"
          required
          min={arrival || undefined}
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
          className={input}
        />
      </Field>
      <p aria-live="polite" className="-mt-3 text-sm text-ink-soft empty:hidden sm:col-span-2">
        {nights > 0 ? f.nights(nights) : ''}
      </p>
      <Field label={firma ? f.employees : f.guests} required>
        {firma ? (
          <select name="guests" required defaultValue="1" className={input}>
            {Array.from({ length: MAX_GUESTS }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        ) : (
          <input name="guests" type="number" min={1} max={MAX_GUESTS} required defaultValue={2} className={input} />
        )}
      </Field>
      {firma ? (
        <label className="flex items-center gap-3 self-end pb-3 text-sm text-ink">
          <input type="checkbox" name="extension" className="size-4 accent-moss" />
          {f.extension}
        </label>
      ) : (
        <Field label={`${f.children} (${f.optional})`}>
          <input name="children" maxLength={200} placeholder={f.childrenHint} className={input} />
        </Field>
      )}
      <Field label={firma ? f.contactPerson : f.name} required>
        <input name="name" required autoComplete="name" className={input} />
      </Field>
      <Field label={f.email} required>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </Field>
      <Field label={`${f.phone} (${f.optional})`}>
        <input name="phone" type="tel" autoComplete="tel" className={input} />
      </Field>
      {firma ? (
        <Field label={`${f.billing} (${f.optional})`} className="sm:col-span-2">
          <textarea name="billing" rows={3} maxLength={300} placeholder={f.billingHint} className={input} />
        </Field>
      ) : (
        <fieldset className="sm:col-span-2">
          <legend className={label}>{`${f.extras} (${f.optional})`}</legend>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {f.extrasOptions.map((o) => (
              <label key={o} className="flex items-center gap-2 text-ink">
                <input type="checkbox" name="extras" value={o} className="size-4 accent-moss" />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Field label={`${firma ? f.wishes : f.message} (${f.optional})`} className="sm:col-span-2">
        <textarea name="message" rows={5} className={input} />
      </Field>

      {/* Honeypot: hidden from people, bots tend to fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-soft sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-moss" />
        <span>
          {f.consentBefore}
          <Link href="/datenschutz" className="text-moss underline underline-offset-2 hover:text-moss-dark">
            {f.consentLink}
          </Link>
          {f.consentAfter}
          <span aria-hidden className="text-wood"> *</span>
        </span>
      </label>

      {(status === 'error' || status === 'unavailable') && (
        <p role="alert" className="rounded-md border border-wood/40 bg-cream-deep px-4 py-3 text-sm text-wood sm:col-span-2">
          {status === 'error' ? f.errorText : f.unavailableText}
        </p>
      )}

      <div className="sm:col-span-2">
        <p className="mb-3 text-sm text-ink-soft">{f.noObligation}</p>
        <p className="mb-3 text-sm text-ink-soft">
          {f.termsBefore}
          <Link href="/buchungsbedingungen" className="text-moss underline underline-offset-2 hover:text-moss-dark">
            {f.termsLink}
          </Link>
          {f.termsAfter}
        </p>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-md bg-moss px-6 py-3 font-medium text-paper transition-colors hover:bg-moss-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:opacity-60"
        >
          {status === 'sending' ? f.sending : f.submit}
        </button>
      </div>
    </form>
  )
}

function Field({
  label: text,
  required = false,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`${label} ${className}`}>
      {text}
      {required && (
        <span aria-hidden className="text-wood">
          {' '}
          *
        </span>
      )}
      {children}
    </label>
  )
}

function composeMessage(
  d: FormData,
  v: (k: string) => string,
  f: ReturnType<typeof useSite>['form'],
  firma: boolean,
) {
  const lines: string[] = []
  if (firma) {
    if (v('billing')) lines.push(`${f.billing}: ${v('billing').replace(/\s*\n\s*/g, ', ')}`)
    if (d.get('extension')) lines.push(f.extension)
  } else {
    if (v('children')) lines.push(`${f.children}: ${v('children')}`)
    const extras = d.getAll('extras').map(String)
    if (extras.length) lines.push(`${f.extras}: ${extras.join(', ')}`)
  }
  const text = [lines.join('\n'), v('message')].filter(Boolean).join('\n\n')
  return text.slice(0, MESSAGE_MAX)
}
