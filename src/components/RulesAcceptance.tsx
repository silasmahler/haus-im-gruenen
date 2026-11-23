'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Clock,
  Users,
  PawPrint,
  PartyPopper,
  CigaretteOff,
  Trash2,
  Utensils,
  Key,
  Zap,
} from 'lucide-react'

import { BrandMark } from '@/components/Brand'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/i18n/LanguageContext'

export const STORAGE_KEY = 'hig-rules-v1'

const SECTION_ICONS: React.ReactNode[][] = [
  [<Clock key="ci" />, <Clock key="co" />],
  [
    <Users key="guests" />,
    <PawPrint key="pets" />,
    <PartyPopper key="party" />,
    <CigaretteOff key="smoke1" />,
    <CigaretteOff key="smoke2" />,
    <Trash2 key="waste" />,
    <Utensils key="dishes" />,
  ],
  [<Trash2 key="waste2" />, <Zap key="power" />, <Key key="key" />, <Utensils key="dishes2" />],
]

export function RulesAcceptance() {
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  // Unlock immediately when content fits without scrolling
  useEffect(() => {
    const el = scrollRef.current
    if (visible && el && el.scrollHeight <= el.clientHeight) {
      setScrolled(true)
    }
  }, [visible])

  function accept() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    window.dispatchEvent(new CustomEvent('hig-rules-accepted'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t.rules.title}
    >
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-lg border border-line bg-paper text-ink shadow-xl sm:rounded-lg">
        {/* Header */}
        <div className="shrink-0 border-b border-line px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm tracking-wide text-moss">
              <BrandMark className="size-7" />
              {t.hero.pill}
            </p>
            <LanguageSwitcher />
          </div>
          <h2 className="font-display text-2xl text-ink">{t.rules.title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t.rules.subtitle}</p>
        </div>

        {/* Scrollable rules */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4"
          onScroll={(e) => {
            const el = e.currentTarget
            setScrolled(el.scrollTop + el.clientHeight >= el.scrollHeight - 40)
          }}
        >
          <div className="space-y-6">
            {t.rules.sections.map((section, sectionIndex) => (
              <RuleSection key={section.title} title={section.title}>
                {section.items.map((item, itemIndex) => (
                  <Rule
                    key={item.label}
                    icon={SECTION_ICONS[sectionIndex]?.[itemIndex]}
                    text={item.label}
                  />
                ))}
              </RuleSection>
            ))}

            <p className="rounded-md bg-cream p-3 text-sm text-ink-soft">
              {t.rules.note}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 border-t border-line px-5 py-4">
          {!scrolled && (
            <p className="mb-2 text-center text-sm text-ink-soft">
              {t.rules.scrollHint}
            </p>
          )}
          <button
            onClick={accept}
            disabled={!scrolled}
            type="button"
            className="site-btn w-full justify-center disabled:cursor-not-allowed disabled:bg-moss disabled:opacity-45"
          >
            {t.rules.accept}
          </button>
        </div>
      </div>
    </div>
  )
}

function RuleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-3 font-display text-lg text-ink">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function Rule({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-moss [&>svg]:size-4 [&>svg]:stroke-[1.75]" aria-hidden="true">
        {icon}
      </span>
      <span className="text-ink">{text}</span>
    </div>
  )
}
