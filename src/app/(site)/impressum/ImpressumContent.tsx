'use client'

import { Placeholder } from '@/components/Placeholder'
import { useSite } from '@/i18n/site'

// Owner must deliver all details; nothing here may be invented.
export function ImpressumContent() {
  const i = useSite().impressum
  const rows = [
    [i.provider, i.providerPlaceholder],
    [i.address, i.addressPlaceholder],
    [i.contact, i.contactPlaceholder],
    [i.vat, i.vatPlaceholder],
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 pt-14 sm:px-6 sm:pt-20">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{i.title}</h1>
      <p className="mt-4 text-lg text-ink-soft">{i.heading}</p>
      <dl className="mt-8 space-y-6">
        {rows.map(([label, ph]) => (
          <div key={label}>
            <dt className="font-medium text-ink">{label}</dt>
            <dd className="mt-2">
              <Placeholder>{ph}</Placeholder>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
