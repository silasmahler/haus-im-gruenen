import type { Metadata } from 'next'

import { PreiseContent } from './PreiseContent'

export const metadata: Metadata = {
  title: 'Preise & Verfügbarkeit – Haus im Grünen',
  description:
    'Saisonpreise, Mindestaufenthalt und Verfügbarkeit für das Ferienhaus Haus im Grünen. Buchungsanfrage für Urlaubsgäste und gesonderte Firmenanfrage.',
}

export default function PreisePage() {
  return <PreiseContent />
}
