import type { Metadata } from 'next'

import { BewertungenContent } from './BewertungenContent'

export const metadata: Metadata = {
  title: 'Gästebewertungen – Haus im Grünen',
  description: 'Das sagen unsere Gäste über das Ferienhaus Haus im Grünen im Raum Neumünster.',
}

export default function BewertungenPage() {
  return <BewertungenContent />
}
