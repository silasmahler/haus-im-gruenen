import type { Metadata } from 'next'

import { FirmenContent } from './FirmenContent'

export const metadata: Metadata = {
  title: 'Firmen & Langzeitgäste – Haus im Grünen',
  description:
    'Komfortable Firmenunterkunft in Rendswühren bei Neumünster: ganzes Haus für bis zu drei Mitarbeiter, drei Schlafzimmer, Glasfaserinternet, Küche und Parkplatz. Auch für mehrere Wochen oder Monate.',
}

export default function FirmenPage() {
  return <FirmenContent />
}
