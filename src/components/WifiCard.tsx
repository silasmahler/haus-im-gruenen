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
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-5 py-5">
        <Lock className="h-5 w-5 shrink-0 text-[var(--color-brand-400)]" />
        <p className="text-sm text-[var(--brand-ink-soft)]">{t.wlan.locked}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-brand-300)]/40 bg-[var(--color-brand-600)] text-white shadow-lg">
      <div className="flex items-start gap-4 px-5 py-5">
        <Wifi className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
        <div>
          <p className="text-sm font-semibold opacity-90">
            {t.wlan.passwordLabel} <span className="font-normal opacity-70">· {t.wlan.speedSuffix}</span>
          </p>
          <div className="mt-2 flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
            <p className="text-sm leading-relaxed">
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
