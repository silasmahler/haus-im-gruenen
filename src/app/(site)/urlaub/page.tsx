import type { Metadata } from 'next'

import { UrlaubContent } from './UrlaubContent'

export const metadata: Metadata = {
  title: 'Urlaub & Umgebung – Haus im Grünen',
  description:
    'Ruhiger Urlaub im Grünen bei Neumünster: Ausflugsziele, Seen, Radwege und Restaurants in Schleswig-Holstein rund um Rendswühren.',
}

export default function UrlaubPage() {
  return <UrlaubContent />
}
