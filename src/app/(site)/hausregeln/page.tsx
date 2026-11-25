import type { Metadata } from 'next'

import { HausregelnContent } from './HausregelnContent'

export const metadata: Metadata = {
  alternates: { canonical: '/hausregeln' },
  title: 'Hausregeln – Haus im Grünen',
  description: 'Hausregeln sowie Check-in und Check-out für das Ferienhaus Haus im Grünen in Rendswühren.',
}

export default function HausregelnPage() {
  return <HausregelnContent />
}
