import type { Metadata } from 'next'

import { FerienhausContent } from './FerienhausContent'

export const metadata: Metadata = {
  alternates: { canonical: '/ferienhaus' },
  title: 'Das Ferienhaus – Haus im Grünen',
  description:
    'Drei separate Schlafzimmer, Wohnbereich mit Kaminofen, voll ausgestattete Küche, großer Garten und Glasfaserinternet.',
}

export default function FerienhausPage() {
  return <FerienhausContent />
}
