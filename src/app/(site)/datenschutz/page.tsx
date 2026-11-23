import type { Metadata } from 'next'

import { DatenschutzContent } from '@/components/DatenschutzContent'

export const metadata: Metadata = {
  title: 'Datenschutz – Haus im Grünen',
  description: 'Datenschutzerklärung der Website Haus im Grünen: Hosting, Anfrageformular, Karte und Ihre Rechte.',
}

export default function DatenschutzPage() {
  return <DatenschutzContent />
}
