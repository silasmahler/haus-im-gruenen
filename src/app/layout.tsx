import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import Script from 'next/script'

import { LanguageProvider } from '@/i18n/LanguageContext'
import '@/styles/tailwind.css'

const fontSans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const fontDisplay = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Haus im Grünen – Ferienhaus in Schleswig-Holstein',
  description:
    'Ferienhaus mit großem Garten im Raum Neumünster: drei Schlafzimmer, Kaminofen, voll ausgestattete Küche und Glasfaserinternet. Für Urlaubsgäste und Firmen mit Langzeitaufenthalten.',
  keywords: ['Ferienhaus', 'Neumünster', 'Schleswig-Holstein', 'Urlaub', 'Firmenunterkunft', 'Langzeitaufenthalt'],
}

const gcCode = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full scroll-smooth antialiased">
      <body className={`${fontSans.variable} ${fontDisplay.variable} flex min-h-full flex-col font-[var(--font-sans)]`}>
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
