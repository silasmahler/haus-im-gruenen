'use client'

import { useSite } from '@/i18n/site'

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-moss px-4 py-2 font-medium text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      {useSite().nav.skip}
    </a>
  )
}
