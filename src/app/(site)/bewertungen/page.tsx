import type { Metadata } from 'next'

import { BewertungenContent } from './BewertungenContent'

export const metadata: Metadata = {
  alternates: { canonical: '/bewertungen' },
  // Not in the concept's navigation (§2); kept reachable for old links, not indexed
  robots: { index: false, follow: true },
  title: 'Gästebewertungen – Haus im Grünen',
  description: 'Das sagen unsere Gäste über das Ferienhaus Haus im Grünen in Rendswühren bei Neumünster.',
}

export default function BewertungenPage() {
  return <BewertungenContent />
}
