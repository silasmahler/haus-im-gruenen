import type { Metadata } from 'next'

import { JsonLd } from '@/components/JsonLd'
import { lodgingBusinessJsonLd } from '@/lib/seo'

import { FirmenContent } from './FirmenContent'

export const metadata: Metadata = {
  alternates: { canonical: '/firmenkunden' },
  title: 'Firmenunterkunft & Monteurunterkunft bei Neumünster | Haus im Grünen',
  description:
    'Komfortable Firmenunterkunft in Rendswühren bei Neumünster: gesamtes Haus für bis zu fünf Gäste, drei separate Schlafzimmer, Glasfaserinternet, Küche und Parkplätze. Individuelle Angebote für längere Aufenthalte.',
}

export default function FirmenkundenPage() {
  return (
    <>
      <JsonLd data={lodgingBusinessJsonLd} />
      <FirmenContent />
    </>
  )
}
