'use client'

import { BookOpen, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useSite } from '@/i18n/site'

const NAV = [
  ['/', 'home'],
  ['/ferienhaus', 'ferienhaus'],
  ['/urlaub', 'urlaub'],
  ['/firmen', 'firmen'],
  ['/preise', 'preise'],
  ['/bewertungen', 'bewertungen'],
  ['/kontakt', 'kontakt'],
] as const

export function SiteHeader() {
  const s = useSite()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = NAV.map(([href, key]) => {
    const active = pathname === href
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={() => setOpen(false)}
          aria-current={active ? 'page' : undefined}
          className={`block rounded-md px-3 py-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-moss ${
            active ? 'text-ink underline decoration-wood decoration-2 underline-offset-8' : 'text-ink-soft'
          }`}
        >
          {s.nav[key]}
        </Link>
      </li>
    )
  })

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-xl text-ink sm:text-2xl" onClick={() => setOpen(false)}>
          Haus im Grünen
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/gaestemappe"
            title={s.nav.guestbookHint}
            className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-sm text-ink-soft hover:text-ink sm:flex"
          >
            <BookOpen className="size-4" aria-hidden />
            {s.nav.guestbook}
          </Link>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? s.nav.menuClose : s.nav.menuOpen}
            className="rounded-md p-2 text-ink hover:bg-cream-deep lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <nav aria-label={s.nav.mainNav} className="hidden border-t border-line/70 lg:block">
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center px-4 text-sm sm:px-6">{links}</ul>
      </nav>

      {open && (
        <nav id="mobile-nav" aria-label={s.nav.mainNav} className="border-t border-line bg-paper lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-2 py-2 text-base">
            {links}
            <li className="mt-2 border-t border-line pt-2">
              <Link
                href="/gaestemappe"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-ink-soft hover:text-ink"
              >
                <BookOpen className="size-4" aria-hidden />
                {s.nav.guestbook}
                <span className="text-sm">· {s.nav.guestbookHint}</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
