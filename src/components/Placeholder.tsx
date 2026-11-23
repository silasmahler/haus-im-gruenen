'use client'

import { useSite } from '@/i18n/site'

// Build with NEXT_PUBLIC_SHOW_PLACEHOLDERS=false to hide owner notes from guests (e.g. at launch).
const SHOW = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS !== 'false'

// Visible marker for content the owner still has to deliver. Never replace with invented facts.
// `publicText` is what guests see instead when placeholders are hidden; without it nothing renders.
export function Placeholder({ children, publicText }: { children: React.ReactNode; publicText?: React.ReactNode }) {
  const s = useSite()
  if (!SHOW) return publicText ? <p className="text-ink-soft">{publicText}</p> : null
  return (
    <div className="rounded-lg border border-dashed border-wood bg-cream-deep/60 px-4 py-3 text-sm text-wood">
      <strong className="font-semibold">{s.placeholder}:</strong> {children}
    </div>
  )
}
