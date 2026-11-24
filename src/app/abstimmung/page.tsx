import type { Metadata } from 'next'

import { AbstimmungContent } from './AbstimmungContent'

// Internal vote page for the owners: not linked anywhere, not in the sitemap.
export const metadata: Metadata = {
  title: 'Abstimmung Website – Haus im Grünen',
  robots: { index: false, follow: false },
}

export default function AbstimmungPage() {
  return <AbstimmungContent />
}
