import type { Metadata } from 'next'

import { KontaktContent } from './KontaktContent'

export const metadata: Metadata = { title: 'Kontakt & Buchungsanfrage – Haus im Grünen' }

export default function KontaktPage() {
  return <KontaktContent />
}
