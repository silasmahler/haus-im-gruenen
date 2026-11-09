import type { Metadata } from 'next'

import TourCanvas from '@/tour/TourCanvas'

// Static export: metadata is German-only; TourCanvas switches document.title with the selected language.
export const metadata: Metadata = {
  title: 'Rundgang – Haus im Grünen',
  description: '3D-Rundgang durch das Ferienhaus Haus im Grünen: Zimmer für Zimmer im Browser erkunden.',
  robots: { index: true, follow: true }, // site-wide default is noindex (layout.tsx); the tour is the one public page
}

export default function TourPage() {
  return (
    <main>
      <TourCanvas />
    </main>
  )
}
