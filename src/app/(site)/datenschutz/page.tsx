import type { Metadata } from 'next'

import { DatenschutzContent } from '@/components/DatenschutzContent'

export const metadata: Metadata = {
  title: 'Datenschutz – Haus im Grünen',
  robots: { index: false, follow: false },
}

export default function DatenschutzPage() {
  return <DatenschutzContent />
}
