import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

import '@/styles/tailwind.css'

const fontSans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Haus im Grünen – Ferienhaus Rendswühren',
  description:
    'Idyllisches Ferienhaus mit großem Garten und Feldblick in Rendswühren, Schleswig-Holstein. 104 m², 3 Schlafzimmer, Kamin, WLAN.',
  keywords: ['Ferienhaus', 'Rendswühren', 'Schleswig-Holstein', 'Urlaub', 'Airbnb'],
  robots: { index: false, follow: false },
}

const gcCode = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full scroll-smooth antialiased">
      <body className={`${fontSans.variable} flex min-h-full flex-col font-[var(--font-sans)]`}>
        {children}
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
