import type { Metadata } from 'next'

import { MovedNotice } from './MovedNotice'

// Old URL, kept so existing links keep working
export const metadata: Metadata = {
  alternates: { canonical: '/firmenkunden' },
  title: 'Firmenkunden – Haus im Grünen',
  robots: { index: false, follow: true },
}

export default function FirmenRedirectPage() {
  return <MovedNotice />
}
