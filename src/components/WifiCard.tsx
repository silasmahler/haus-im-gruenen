'use client'

import { useEffect, useState } from 'react'
import { Wifi, Lock, MapPin } from 'lucide-react'

import { useLanguage } from '@/i18n/LanguageContext'

const STORAGE_KEY = 'hig-rules-v1'

export function WifiCard() {
  const [accepted, setAccepted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setAccepted(!!localStorage.getItem(STORAGE_KEY))

    function onAccepted() {
      setAccepted(true)
    }
    window.addEventListener('hig-rules-accepted', onAccepted)
    return () => window.removeEventListener('hig-rules-accepted', onAccepted)
  }, [])

  if (!accepted) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line bg-cream px-5 py-5">
        <Lock className="size-5 shrink-0 text-moss" strokeWidth={1.75} aria-hidden />
        <p className="text-ink-soft">{t.wlan.locked}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg bg-moss text-paper">
      <div className="flex items-start gap-4 px-5 py-5">
        <Wifi className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <div>
          <p className="font-medium">
            {t.wlan.passwordLabel} <span className="font-normal text-paper/85">· {t.wlan.speedSuffix}</span>
          </p>
          <div className="mt-2 flex items-start gap-2">
            <MapPin className="mt-1 size-4 shrink-0 text-paper/85" aria-hidden />
            <p className="leading-relaxed">
              {t.wlan.passwordPrefix}
              <strong>{t.wlan.passwordBold}</strong>
              {t.wlan.passwordSuffix}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
