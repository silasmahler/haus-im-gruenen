import type { Metadata } from 'next'

import { BuchungsbedingungenContent } from './BuchungsbedingungenContent'

export const metadata: Metadata = {
  alternates: { canonical: '/buchungsbedingungen' },
  title: 'Buchungsbedingungen – Haus im Grünen',
  description: 'Anfrage, Zahlung und Stornierung für Buchungen im Ferienhaus Haus im Grünen.',
}

export default function BuchungsbedingungenPage() {
  return <BuchungsbedingungenContent />
}
