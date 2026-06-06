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

export const STORAGE_KEY = 'hig-rules-v1'

export function RulesAcceptance() {
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Hausregeln bestätigen"
    >
      <div className="brand-card flex max-h-[90dvh] w-full max-w-lg flex-col rounded-b-none sm:rounded-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-[var(--color-brand-100)] px-5 py-4">
          <p className="brand-pill mb-2">🏡 Willkommen</p>
          <h2 className="text-xl font-bold text-[var(--brand-ink)]">
            Bitte lies die Hausregeln
          </h2>
          <p className="mt-1 text-xs text-[var(--brand-ink-soft)]">
            Bestätige einmalig, dass du die Regeln gelesen hast — dann siehst du das WLAN-Passwort.
          </p>
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
          <div className="space-y-5 text-sm">
            <RuleSection title="Check-in & Check-out">
              <Rule icon={<Clock />} text="Check-in ab 15:00 Uhr" />
              <Rule icon={<Clock />} text="Check-out vor 10:00 Uhr" />
            </RuleSection>

            <RuleSection title="Während des Aufenthalts">
              <Rule icon={<Users />} text="Höchstens 5 Gäste" />
              <Rule icon={<PawPrint />} text="Keine Haustiere" />
              <Rule icon={<PartyPopper />} text="Keine Partys oder Veranstaltungen" />
              <Rule icon={<CigaretteOff />} text="Rauchen nur auf den Terrassen (Aschenbecher vorhanden)" />
              <Rule
                icon={<CigaretteOff />}
                text="Rauchen im Haus → 500 € Ozonreinigung"
              />
              <Rule
                icon={<Trash2 />}
                text="Mülltrennung: Behälter sind im Haus gekennzeichnet, nach dem Aufenthalt in die Tonnen vor dem Haus entsorgen"
              />
              <Rule
                icon={<Utensils />}
                text="Geschirr abwaschen und trocken einräumen — Geschirrspüler nicht erst bei Abreise anstellen"
              />
            </RuleSection>

            <RuleSection title="Vor der Abreise">
              <Rule icon={<Trash2 />} text="Müll entsorgen" />
              <Rule icon={<Zap />} text="Alle Geräte ausschalten" />
              <Rule icon={<Key />} text="Schlüssel zurückgeben" />
              <Rule icon={<Utensils />} text="Abwasch erledigen & Geschirrspüler ausräumen" />
            </RuleSection>

            <p className="rounded-lg bg-[var(--color-brand-50)] p-3 text-xs text-[var(--brand-ink-soft)]">
              Bitte behandle das Haus und die Einrichtung mit Sorgfalt. Schäden bitte
              unverzüglich melden, damit für Ersatz gesorgt werden kann.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 border-t border-[var(--color-brand-100)] px-5 py-4">
          {!scrolled && (
            <p className="mb-2 text-center text-xs text-[var(--brand-ink-soft)]">
              ↓ Bitte bis zum Ende scrollen
            </p>
          )}
          <button
            onClick={accept}
            disabled={!scrolled}
            className="w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ich habe die Hausregeln gelesen und akzeptiere sie
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
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-500)]">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Rule({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-[var(--color-brand-500)] [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </span>
      <span className="text-[var(--brand-ink)]">{text}</span>
    </div>
  )
}
