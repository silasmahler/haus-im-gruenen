import type { Metadata } from 'next'

import { UrlaubContent } from './UrlaubContent'

export const metadata: Metadata = {
  alternates: { canonical: '/urlaub' },
  title: 'Urlaub & Erholung – Haus im Grünen',
  description:
    'Eine Auszeit im Grünen: Ferienhaus in Rendswühren bei Neumünster mit großem Garten, Kamin und viel Privatsphäre – das gesamte Haus zur alleinigen Nutzung.',
}

export default function UrlaubPage() {
  return <UrlaubContent />
}
