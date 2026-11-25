import type { Metadata } from 'next'
import { Caveat, Fraunces, Inter } from 'next/font/google'
import Script from 'next/script'

import { LanguageProvider } from '@/i18n/LanguageContext'
import { IS_PREVIEW, SITE_URL } from '@/lib/seo'
import '@/styles/tailwind.css'

const fontSans = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const fontDisplay = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK'],
})

// Handwritten accent only (claim, sign-offs) – never for body text.
const fontHand = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Ferienhaus in Rendswühren bei Neumünster | Haus im Grünen',
  description:
    'Ferienhaus mit großem Garten in Rendswühren bei Neumünster: drei Schlafzimmer, Kaminofen, voll ausgestattete Küche und Glasfaserinternet. Für Urlaubsgäste und Firmen mit Langzeitaufenthalten.',
  ...(IS_PREVIEW && { robots: { index: false, follow: false } }),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Haus im Grünen',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Haus im Grünen – Gartenlounge in Rendswühren bei Neumünster' }],
  },
}

const gcCode = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${fontSans.variable} ${fontDisplay.variable} ${fontHand.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
      {gcCode && (
        <Script
          data-goatcounter={`https://${gcCode}.goatcounter.com/count`}
          src="//gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      )}
    </html>
  )
}
