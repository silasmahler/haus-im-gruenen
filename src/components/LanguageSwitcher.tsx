'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import type { Locale } from '@/i18n/dictionaries'

const OPTIONS: { code: Locale; label: string }[] = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-[var(--color-brand-200)] text-xs font-semibold">
      {OPTIONS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`px-2.5 py-1 transition-colors ${
            locale === code
              ? 'bg-[var(--color-brand-500)] text-white'
              : 'bg-transparent text-[var(--brand-ink-soft)] hover:bg-[var(--color-brand-50)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
