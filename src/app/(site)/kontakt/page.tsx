import type { Metadata } from 'next'

import { KontaktContent } from './KontaktContent'

export const metadata: Metadata = {
  title: 'Kontakt & Buchungsanfrage – Haus im Grünen',
  description: 'Fragen Sie Ihren Urlaub oder eine Firmenunterkunft im Haus im Grünen unverbindlich an.',
}

export default function KontaktPage() {
  return <KontaktContent />
}
