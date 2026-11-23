'use client'

import { useSite } from '@/i18n/site'

// Visible marker for content the owner still has to deliver. Never replace with invented facts.
export function Placeholder({ children }: { children: React.ReactNode }) {
  const s = useSite()
  return (
    <div className="rounded-lg border border-dashed border-wood bg-cream-deep/60 px-4 py-3 text-sm text-wood">
      <strong className="font-semibold">{s.placeholder}:</strong> {children}
    </div>
  )
}
