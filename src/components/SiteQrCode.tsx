'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

import { useLanguage } from '@/i18n/LanguageContext'

export function SiteQrCode({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    QRCode.toCanvas(
      canvas,
      url,
      {
        width: 128,
        margin: 1,
        color: { dark: '#164e3d', light: '#ffffff' },
      },
      (error) => {
        if (!error) setReady(true)
        else console.error('QR code generation failed', error)
      },
    )
  }, [url])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-brand-200)] bg-white p-2">
        <canvas ref={canvasRef} className={ready ? '' : 'hidden'} />
      </div>
      <p className="text-xs text-[var(--brand-ink-soft)]">{t.footer.scanHint}</p>
    </div>
  )
}
