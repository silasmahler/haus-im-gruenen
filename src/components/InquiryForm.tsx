'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'

// POSTs JSON to NEXT_PUBLIC_INQUIRY_URL:
// { type: 'urlaub'|'firma', name, company, email, phone, arrival, departure, guests, message, website, lang }
// `website` is a honeypot (must stay empty). Expected response: 200 { ok: true }.
const INQUIRY_URL = process.env.NEXT_PUBLIC_INQUIRY_URL

type Status = 'idle' | 'sending' | 'success' | 'error' | 'unavailable'

const input =
  'mt-1 block w-full rounded-md border border-line bg-paper px-3 py-2.5 text-base text-ink focus:border-moss focus:outline-2 focus:outline-moss/40'
const label = 'block text-sm font-medium text-ink'

export function InquiryForm({ variant }: { variant: 'urlaub' | 'firma' }) {
  const { locale } = useLanguage()
  const f = useSite().form
  const [status, setStatus] = useState<Status>('idle')
  const [arrival, setArrival] = useState('')
  const firma = variant === 'firma'

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
          message: v('message'),
          website: v('website'),
          lang: locale,
        }),
      })
      const json = await res.json().catch(() => null)
      setStatus(res.ok && json?.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-lg border border-sage bg-sage-light px-5 py-6">
        <p className="font-display text-xl text-ink">{f.successTitle}</p>
        <p className="mt-1 text-ink-soft">{f.successText}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      {firma && (
        <Field label={f.company} className="sm:col-span-2">
          <input name="company" required autoComplete="organization" className={input} />
        </Field>
      )}
      <Field label={firma ? f.contactPerson : f.name}>
        <input name="name" required autoComplete="name" className={input} />
      </Field>
      <Field label={f.email}>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </Field>
      <Field label={firma ? f.phone : `${f.phone} (${f.optional})`}>
        <input name="phone" type="tel" required={firma} autoComplete="tel" className={input} />
      </Field>
      <Field label={firma ? f.employees : f.guests}>
        {firma ? (
          <select name="guests" required defaultValue="1" className={input}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        ) : (
          <input name="guests" type="number" min={1} required defaultValue={2} className={input} />
        )}
      </Field>
      <Field label={f.arrival}>
        <input
          name="arrival"
          type="date"
          required
          value={arrival}
          onChange={(e) => setArrival(e.target.value)}
          className={input}
        />
      </Field>
      <Field label={f.departure}>
        {/* min enforces departure >= arrival via native validation */}
        <input name="departure" type="date" required min={arrival || undefined} className={input} />
      </Field>
      <Field label={firma ? f.wishes : f.message} className="sm:col-span-2">
        <textarea name="message" rows={5} required={!firma} className={input} />
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
        </span>
      </label>

      {(status === 'error' || status === 'unavailable') && (
        <p role="alert" className="rounded-md border border-wood/40 bg-cream-deep px-4 py-3 text-sm text-wood sm:col-span-2">
          {status === 'error' ? f.errorText : f.unavailableText}
        </p>
      )}

      <div className="sm:col-span-2">
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

function Field({ label: text, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`${label} ${className}`}>
      {text}
      {children}
    </label>
  )
}
