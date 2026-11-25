import type { Metadata } from 'next'

import { FerienhausContent } from './FerienhausContent'

export const metadata: Metadata = {
  alternates: { canonical: '/ferienhaus' },
  title: 'Das Ferienhaus – Haus im Grünen',
  description:
    'Ferienhaus in Rendswühren für bis zu fünf Personen: drei separate Schlafzimmer, Kaminofen, vollständig ausgestattete Küche, großer Garten und Glasfaserinternet.',
}

export default function FerienhausPage() {
  return <FerienhausContent />
}
