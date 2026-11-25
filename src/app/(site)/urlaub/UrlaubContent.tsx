'use client'

import Link from 'next/link'

import { Picture } from '@/components/Picture'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import { photo } from '@/lib/photos'

const HERO = photo('03')
const STRIP = ['38', '10', '39'].map(photo)

export function UrlaubContent() {
  const { locale } = useLanguage()
  const u = useSite().urlaub

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-14 sm:px-6 sm:pt-20 md:grid-cols-2 md:gap-14">
        <div>
          <h1 className="font-display text-5xl text-ink sm:text-6xl">{u.title}</h1>
          <p className="mt-5 font-display text-2xl text-moss sm:text-3xl">{u.heading}</p>
        </div>
        <Picture photo={HERO} alt={HERO.alt[locale]} priority sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-lg object-cover" />
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-14 sm:px-6">
        {u.paragraphs.map((t) => (
          <p key={t} className="mt-5 text-lg leading-relaxed text-ink-soft first:mt-0">
            {t}
          </p>
        ))}
        <p className="mt-10 border-l-2 border-wood pl-5 font-display text-2xl text-ink italic">{u.highlight}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Link href="/kontakt" className="site-btn">
            {u.button}
          </Link>
          <Link href="/umgebung" className="text-moss underline underline-offset-4 hover:text-moss-dark">
            {u.umgebungLink}
          </Link>
        </div>
      </section>

      <ul className="mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-2 px-4 sm:gap-3 sm:px-6">
        {STRIP.map((p) => (
          <li key={p.id}>
            <Picture photo={p} alt={p.alt[locale]} sizes="33vw" className="aspect-[4/3] w-full rounded-lg object-cover ring-1 ring-ink/5" />
          </li>
        ))}
      </ul>
    </>
  )
}
