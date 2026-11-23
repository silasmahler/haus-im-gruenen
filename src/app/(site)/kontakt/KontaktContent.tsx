'use client'

import { useEffect, useState } from 'react'

import { Hosts } from '@/components/Hosts'
import { Placeholder } from '@/components/Placeholder'
import { InquiryForm } from '@/components/InquiryForm'
import { useSite } from '@/i18n/site'

// Texts from KONZEPT section 8; holiday form by default, company form via toggle.
export function KontaktContent() {
  const k = useSite().kontakt
  const [variant, setVariant] = useState<'urlaub' | 'firma'>('urlaub')
  const [notice, setNotice] = useState('')

  // /kontakt?typ=firma preselects the company form (links from /firmen and /preise).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('typ') === 'firma') setVariant('firma')
  }, [])

  function choose(v: 'urlaub' | 'firma') {
    setVariant(v)
    setNotice(k.switched(v === 'urlaub' ? k.chooseUrlaub : k.chooseFirma))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-14 sm:px-6 sm:pt-20">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{k.title}</h1>
      {k.paragraphs.map((t) => (
        <p key={t} className="mt-4 text-lg leading-relaxed text-ink-soft">
          {t}
        </p>
      ))}

      <Hosts className="mt-10 rounded-lg bg-sage-light/60 p-5 sm:p-6" />

      <fieldset className="mt-10">
        <legend className="text-sm font-medium text-ink">{k.chooseLabel}</legend>
        <div className="mt-2 inline-flex rounded-md border border-line p-1">
          {(['urlaub', 'firma'] as const).map((v) => (
            <label
              key={v}
              className={`cursor-pointer rounded px-4 py-2 text-sm has-focus-visible:outline-2 has-focus-visible:outline-moss ${
                variant === v ? 'bg-moss text-paper' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <input
                type="radio"
                name="variant"
                value={v}
                checked={variant === v}
                onChange={() => choose(v)}
                className="sr-only"
              />
              {v === 'urlaub' ? k.chooseUrlaub : k.chooseFirma}
            </label>
          ))}
        </div>
      </fieldset>

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>

      <div id="anfrage" className="mt-8 rounded-lg border border-line bg-cream p-5 sm:p-8">
        <InquiryForm variant={variant} />
      </div>

      {/* Direct e-mail/phone come from the same owner data as the Impressum, still missing */}
      <section className="mt-8 rounded-lg border border-line p-5 sm:p-6">
        <h2 className="font-display text-xl text-ink">{k.directTitle}</h2>
        <div className="mt-3">
          <Placeholder>{k.directPlaceholder}</Placeholder>
        </div>
      </section>

      <p className="mt-10 font-display text-xl text-ink italic">{k.closing}</p>
    </div>
  )
}
