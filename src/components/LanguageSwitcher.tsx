'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import type { Locale } from '@/i18n/dictionaries'

const OPTIONS: { code: Locale; label: string; name: string }[] = [
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'en', label: 'EN', name: 'English' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <div
      role="group"
      aria-label={locale === 'de' ? 'Sprache' : 'Language'}
      className="flex items-center rounded-md border border-line p-0.5 text-sm font-medium"
    >
      {OPTIONS.map(({ code, label, name }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-label={name}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
          className={`min-h-9 min-w-9 rounded px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
            locale === code ? 'bg-moss text-paper' : 'text-ink-soft hover:bg-cream-deep hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
