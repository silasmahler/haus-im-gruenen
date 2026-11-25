import type { Metadata } from 'next'

import { PreiseContent } from './PreiseContent'

export const metadata: Metadata = {
  alternates: { canonical: '/preise' },
  title: 'Preise & Verfügbarkeit – Haus im Grünen',
  description:
    'Übernachtungspreise nach Saison, Aufenthaltsdauer und Personenzahl, Mindestaufenthalt und Zusatzleistungen für das Ferienhaus Haus im Grünen. Buchungsanfrage und gesonderte Firmenanfrage.',
}

export default function PreisePage() {
  return <PreiseContent />
}
