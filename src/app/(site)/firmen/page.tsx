import type { Metadata } from 'next'

import { JsonLd } from '@/components/JsonLd'
import { lodgingBusinessJsonLd } from '@/lib/seo'

import { FirmenContent } from './FirmenContent'

export const metadata: Metadata = {
  alternates: { canonical: '/firmen' },
  title: 'Firmenunterkunft & Monteurwohnung bei Neumünster – Haus im Grünen',
  description:
    'Komfortable Firmenunterkunft in Rendswühren bei Neumünster: ganzes Haus für bis zu drei Mitarbeiter, drei Schlafzimmer, Glasfaserinternet, Küche und Parkplatz. Auch für mehrere Wochen oder Monate.',
}

export default function FirmenPage() {
  return (
    <>
      <JsonLd data={lodgingBusinessJsonLd} />
      <FirmenContent />
    </>
  )
}
