import type { Metadata } from 'next'

import { GaestemappeContent } from './GaestemappeContent'

export const metadata: Metadata = {
  title: 'Gästemappe – Haus im Grünen',
  robots: { index: false, follow: false },
}

export default function GaestemappePage() {
  return <GaestemappeContent />
}
