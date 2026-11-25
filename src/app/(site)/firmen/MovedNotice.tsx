'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useSite } from '@/i18n/site'

export function MovedNotice() {
  const router = useRouter()
  const f = useSite().firmen
  useEffect(() => {
    router.replace('/firmenkunden')
  }, [router])

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <p className="text-lg text-ink-soft">{f.movedText}</p>
      <Link href="/firmenkunden" className="site-btn mt-6">
        {f.movedLink}
      </Link>
    </section>
  )
}
