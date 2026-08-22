'use client'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/i18n/LanguageContext'

export function DatenschutzContent() {
  const { t } = useLanguage()

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 text-sm leading-relaxed text-[var(--brand-ink-soft)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--brand-ink)]">{t.datenschutz.title}</h1>
        <LanguageSwitcher />
      </div>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          {t.datenschutz.siteHeading}
        </h2>
        <p>{t.datenschutz.siteText}</p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          {t.datenschutz.storageHeading}
        </h2>
        <p>{t.datenschutz.storageText}</p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          {t.datenschutz.analyticsHeading}
        </h2>
        <p>{t.datenschutz.analyticsText}</p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          {t.datenschutz.linksHeading}
        </h2>
        <p>{t.datenschutz.linksText}</p>
      </section>
    </main>
  )
}
