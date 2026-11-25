'use client'

import { Check, X } from 'lucide-react'
import { useState } from 'react'

import { BrandMark, Wordmark } from '@/components/Brand'
import { Hosts } from '@/components/Hosts'

// POSTs { type: 'feedback', host, host_note, prices, cleaning, reviews, imprint, travel, other, website }
// to the inquiry Lambda, which mails it to Silas (see infra/inquiry.yaml). All fields optional, `website` is a honeypot.
// Own variable so the preview can collect feedback while its booking form stays inactive.
const INQUIRY_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL || process.env.NEXT_PUBLIC_INQUIRY_URL

type Status = 'idle' | 'sending' | 'success' | 'error'

const input =
  'site-field mt-1 block w-full rounded-md border border-[#847c6a] bg-white px-3 py-2.5 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss'

const TEXTS = [
  ['prices', 'Preise 2027 und Mindestaufenthalt', 'Gern einfach die Preisliste 2027 hier hineinkopieren.'],
  ['cleaning', 'Endreinigung und Nebenkosten', 'Was kommt zum Übernachtungspreis dazu, und was ist schon enthalten?'],
  ['reviews', 'Zwei bis drei echte Gästebewertungen', 'Bitte mit Quelle und Datum. Der Text wird nicht verändert.'],
  ['imprint', 'Impressum: Name, Anschrift, Telefon', 'Wer ist für die Website verantwortlich?'],
  ['travel', 'Fahrzeiten und Einkaufsmöglichkeiten', 'Ungefähre Fahrzeiten zu den wichtigsten Zielen und die nächsten Einkaufsmöglichkeiten.'],
] as const

export function AbstimmungContent() {
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!INQUIRY_URL) return setStatus('error')
    const d = new FormData(e.currentTarget)
    const body: Record<string, string> = { type: 'feedback' }
    for (const [k, v] of d.entries()) body[k] = String(v).trim()
    setStatus('sending')
    try {
      const res = await fetch(INQUIRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      setStatus(res.ok && json?.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3 text-xl sm:px-6 sm:text-2xl">
          <BrandMark className="h-9 sm:h-10" />
          <Wordmark />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6">
        {status === 'success' ? (
          <div role="status" className="rounded-lg border border-sage bg-sage-light px-5 py-8">
            <p className="font-display text-3xl text-ink">Vielen Dank!</p>
            <p className="mt-3 text-lg text-ink">
              Eure Antworten sind angekommen. Ich kümmere mich darum und melde mich, sobald alles eingebaut ist.
            </p>
            <p className="mt-4 font-hand text-3xl text-wood">Silas</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl sm:text-5xl">Abstimmung zur neuen Website</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Hier seht ihr die offenen Punkte auf einen Blick. Alles ist freiwillig: Beantwortet nur, was ihr schon
              wisst, und schickt den Rest gern später. Die Antworten gehen an Silas.
            </p>

            <form onSubmit={onSubmit} className="mt-10 space-y-14">
              <Question n={1} title="Gastgeber: Passt der Abschnitt mit Susanne so?">
                <p className="text-ink-soft">So steht er zurzeit auf der Startseite:</p>
                <Frame>
                  <Hosts />
                </Frame>
                <YesNo name="host" />
                <Note name="host_note" />
              </Question>

              <Question n={2} title="Was noch fehlt">
                <p className="text-ink-soft">Diese Angaben brauchen wir für den Start. Ich übernehme sie so, wie ihr sie schreibt.</p>
                {TEXTS.map(([name, title, hint]) => (
                  <label key={name} className="block">
                    <span className="font-medium">{title}</span>
                    <span className="mt-0.5 block text-sm text-ink-soft">{hint}</span>
                    <textarea name={name} rows={4} maxLength={4000} className={input} />
                  </label>
                ))}
              </Question>

              <Question n={3} title="Sonst noch etwas?">
                <label className="block">
                  <span className="sr-only">Sonst noch etwas</span>
                  <textarea name="other" rows={5} maxLength={4000} className={input} />
                </label>
              </Question>

              {/* Honeypot: hidden from people, bots tend to fill it */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div>
                {status === 'error' && (
                  <p role="alert" className="mb-4 rounded-md border border-wood/40 bg-cream-deep px-4 py-3 text-wood">
                    Das hat leider nicht geklappt. Bitte versucht es gleich noch einmal oder schreibt mir an
                    info@silas-mahler.de.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="rounded-md bg-moss px-6 py-3 font-medium text-paper transition-colors hover:bg-moss-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:opacity-60"
                >
                  {status === 'sending' ? 'Wird gesendet …' : 'Antworten absenden'}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

function Question({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 border-t border-line pt-8">
      <legend className="float-left w-full font-display text-2xl text-ink">
        <span className="mr-2 text-wood">{n}.</span>
        {title}
      </legend>
      <div className="clear-both" />
      {children}
    </fieldset>
  )
}

function Frame({ children, flush = false }: { children: React.ReactNode; flush?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-line bg-white shadow-sm ${flush ? '' : 'p-5 sm:p-6'}`}>
      {children}
    </div>
  )
}

function YesNo({ name }: { name: string }) {
  const opt = (value: string, text: string, Icon: typeof Check) => (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[#847c6a] bg-white px-5 py-3 font-medium has-[:checked]:border-moss has-[:checked]:bg-moss has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-moss">
      <input type="radio" name={name} value={value} className="sr-only" />
      <Icon className="size-5" aria-hidden />
      {text}
    </label>
  )
  return (
    <div role="radiogroup" aria-label="Antwort" className="flex gap-3">
      {opt('ja', 'Ja, passt', Check)}
      {opt('nein', 'Nein', X)}
    </div>
  )
}

function Note({ name }: { name: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">Anmerkung (freiwillig)</span>
      <textarea name={name} rows={3} maxLength={2000} className={input} />
    </label>
  )
}
