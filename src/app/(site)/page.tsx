import type { Metadata } from 'next'

import { JsonLd } from '@/components/JsonLd'
import { vacationRentalJsonLd } from '@/lib/seo'

import { HomeContent } from './HomeContent'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={vacationRentalJsonLd} />
      <HomeContent />
    </>
  )
}
