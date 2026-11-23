import type { Metadata } from 'next'

import { ImpressumContent } from './ImpressumContent'

export const metadata: Metadata = {
  alternates: { canonical: '/impressum' },
  title: 'Impressum – Haus im Grünen',
  description: 'Impressum der Website Haus im Grünen (Angaben gemäß § 5 DDG).',
}

export default function ImpressumPage() {
  return <ImpressumContent />
}
