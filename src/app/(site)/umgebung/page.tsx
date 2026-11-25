import type { Metadata } from 'next'

import { UmgebungContent } from './UmgebungContent'

export const metadata: Metadata = {
  alternates: { canonical: '/umgebung' },
  title: 'Umgebung – Haus im Grünen',
  description:
    'Ruhige, ländliche Lage im Raum Neumünster: Karte, Ausflugsziele und Restaurants rund um Rendswühren in Schleswig-Holstein.',
}

export default function UmgebungPage() {
  return <UmgebungContent />
}
