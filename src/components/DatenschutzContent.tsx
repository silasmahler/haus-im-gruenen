'use client'

import { useLanguage } from '@/i18n/LanguageContext'

export function DatenschutzContent() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 text-sm leading-relaxed text-[var(--brand-ink-soft)]">
      <h1 className="font-display text-4xl text-[var(--brand-ink)]">{t.datenschutz.title}</h1>

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
    </div>
  )
}
