'use client'

import Link from 'next/link'

import { HandNote } from '@/components/Brand'
import { useSite } from '@/i18n/site'

export function NotFoundContent() {
  const n = useSite().notFound
  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-8 text-center sm:px-6 sm:pt-28">
      {/* A single sprout in a freshly dug bed */}
      <svg viewBox="0 0 120 70" className="mx-auto h-24 w-auto" aria-hidden fill="none" strokeLinecap="round">
        <path d="M10 60 C40 52 80 52 110 60" stroke="var(--color-wood)" strokeWidth="2" />
        <path d="M24 65 C48 60 72 60 96 65" stroke="var(--color-wood-light)" strokeWidth="2" />
        <path d="M60 56 V34" stroke="var(--color-moss)" strokeWidth="2" />
        <path d="M60 40 C50 40 44 33 44 25 C53 25 60 31 60 40 Z" fill="var(--color-sage)" stroke="var(--color-moss)" strokeWidth="1.6" />
        <path d="M60 36 C68 36 75 30 75 21 C66 21 60 27 60 36 Z" fill="var(--color-moss)" />
      </svg>
      <h1 className="mt-6 font-display text-4xl text-ink sm:text-5xl">
        <HandNote className="text-[1.15em]">{n.title}</HandNote>
      </h1>
      <p className="mt-6 text-lg text-ink-soft">{n.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="site-btn">{n.home}</Link>
        <Link href="/kontakt" className="inline-flex items-center rounded-md px-5 py-3 text-moss underline underline-offset-4 hover:text-moss-dark">
          {n.contact}
        </Link>
      </div>
    </div>
  )
}
