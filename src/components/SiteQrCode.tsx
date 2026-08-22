'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

import { useLanguage } from '@/i18n/LanguageContext'

export function SiteQrCode({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    let cancelled = false
    QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: { dark: '#164e3d', light: '#ffffff' },
    }).then((result) => {
      if (!cancelled) setSvg(result)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-brand-200)] bg-white p-2">
        {/* eslint-disable-next-line react/no-danger */}
        {svg && <div dangerouslySetInnerHTML={{ __html: svg }} />}
      </div>
      <p className="text-xs text-[var(--brand-ink-soft)]">{t.footer.scanHint}</p>
    </div>
  )
}
