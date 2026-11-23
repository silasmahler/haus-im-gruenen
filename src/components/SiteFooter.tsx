'use client'

import Link from 'next/link'

import { BrandMark, HedgeDivider, Wordmark } from '@/components/Brand'
import { useSite } from '@/i18n/site'

export function SiteFooter() {
  const s = useSite()
  const link = 'underline-offset-4 hover:text-ink hover:underline focus-visible:underline'

  return (
    <footer className="mt-24">
      <HedgeDivider className="-mb-px" />
      <div className="border-t border-line bg-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-3 text-2xl text-ink">
              <BrandMark className="size-11" />
              <Wordmark />
            </p>
            <p className="mt-2 text-ink-soft">{s.footer.tagline}</p>
            <p className="mt-1 text-sm text-ink-soft">{s.footer.region}</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft md:items-end">
            <li>
              <Link href="/impressum" className={link}>{s.footer.imprint}</Link>
            </li>
            <li>
              <Link href="/datenschutz" className={link}>{s.footer.privacy}</Link>
            </li>
            <li>
              <Link href="/gaestemappe" className={link}>{s.footer.guestbook}</Link>
            </li>
          </ul>
        </div>
        <p className="border-t border-line px-4 py-4 text-center text-xs text-ink-soft">
          © {new Date().getFullYear()} Haus im Grünen · <span className="italic">{s.footer.madeWith}</span>
        </p>
      </div>
    </footer>
  )
}
