'use client'

import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/i18n/LanguageContext'

import type { BuildStep, TourApi, TourHandle } from './buildScene'
import { TourUI } from './TourUI'

type Phase = 'idle' | 'loading' | 'ready' | 'error' | 'nowebgl'
type Label = 'download' | BuildStep

/** Lets React paint the progress bar between synchronous build steps (also works in background tabs). */
const paint = () =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 60)
    requestAnimationFrame(() => {
      clearTimeout(t)
      setTimeout(resolve, 0)
    })
  })

// same attributes three.js r170 passes for our renderer options, so its getContext() returns the context made here
const GL_ATTRS: WebGLContextAttributes = { alpha: false, depth: true, stencil: false, antialias: true, powerPreference: 'high-performance' }

const warm = () => void import('./buildScene')

/** Client shell: lazy-loads three + the scene, shows loader / WebGL fallback, hosts the overlay UI. */
export default function TourCanvas() {
  const { t } = useLanguage()
  const p = t.tour.page
  const ref = useRef<HTMLCanvasElement>(null)
  const [api, setApi] = useState<TourApi | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  // The scene build is heavy (seconds of main-thread work): wait for the button unless ?autostart=1 (teaser link, QA harness).
  const [started, setStarted] = useState(false)
  const [progress, setProgress] = useState<{ label: Label; pct: number }>({ label: 'download', pct: 0.05 })
  const [attempt, setAttempt] = useState(0)

  // Next's static (German) metadata title can be re-applied after hydration: keep ours with a MutationObserver
  useEffect(() => {
    const set = () => {
      if (document.title !== p.title) document.title = p.title
    }
    set()
    const mo = new MutationObserver(set)
    mo.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => mo.disconnect()
  }, [p.title])

  // Arriving from the homepage teaser (?autostart=1) skips the gate; a direct visit keeps the button so the heavy build
  // does not fight the first paint (Lighthouse TBT).
  useEffect(() => {
    if (new URLSearchParams(location.search).has('autostart')) setStarted(true)
  }, [])

  useEffect(() => {
    if (!started) return
    let dead = false
    let handle: TourHandle | null = null
    const canvas = ref.current
    setPhase('loading')
    setProgress({ label: 'download', pct: 0.05 })

    const onLost = (e: Event) => {
      e.preventDefault() // ponytail: no auto-restore of a lost context, the retry button rebuilds everything
      if (!dead) setPhase('error')
    }
    canvas?.addEventListener('webglcontextlost', onLost)

    // Start the chunk download first, then create the WebGL context on the real canvas while it downloads: the first
    // context can block the main thread for a while (GPU process start), and this way that wait overlaps the network.
    // three.js later calls getContext('webgl2') on the same canvas and gets this very context (no throwaway canvas,
    // and the no-WebGL fallback shows without three.js console noise).
    const chunk = import('./buildScene')
    let lastYield = performance.now()
    paint()
      .then(() => {
        if (dead) throw new Error('cancelled')
        if (!canvas?.getContext('webgl2', GL_ATTRS)) throw new Error('webgl unavailable')
        performance.mark('tour:gl')
        return chunk
      })
      .then(async ({ createTour }) => {
        performance.mark('tour:chunk')
        if (dead || !canvas) return
        lastYield = performance.now()
        handle = await createTour(canvas, async (step, fraction, force) => {
          if (dead) throw new Error('cancelled')
          setProgress({ label: step, pct: fraction })
          // yield to the browser about every 16 ms of work so the bar animates and the page stays responsive
          if (force || performance.now() - lastYield > 16) {
            await paint()
            lastYield = performance.now()
            if (dead) throw new Error('cancelled')
          }
        })
        if (dead) return handle.dispose()
        performance.mark('tour:created')
        setApi(handle.api)
        setPhase('ready')
      })
      .catch((e: unknown) => {
        if (dead) return
        const noGl = /webgl/i.test(String((e as Error)?.message))
        if (!noGl) console.error('[tour]', e)
        setPhase(noGl ? 'nowebgl' : 'error')
      })

    return () => {
      dead = true
      canvas?.removeEventListener('webglcontextlost', onLost)
      handle?.dispose()
      handle = null
      setApi(null)
    }
  }, [attempt, started])

  const failed = phase === 'error' || phase === 'nowebgl'

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--color-brand-950)] text-white [--tour-chips-h:64px]">
      <h1 className="sr-only">{p.title}</h1>
      {/* overlay before the canvas in DOM order: Tab reaches Back / modes / rooms first, the canvas last */}
      {api && phase === 'ready' && (
        <>
          <TourUI api={api} />
          <div className="absolute right-3 top-3 z-20 rounded-full bg-white/90 shadow-sm [&_button]:min-h-11 [&_button]:min-w-11">
            <LanguageSwitcher />
          </div>
        </>
      )}

      {phase === 'idle' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[var(--color-brand-950)] px-6 text-center">
          <TopBar backLabel={p.back} />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-500)]">
            <Home className="h-7 w-7" aria-hidden />
          </div>
          <div className="max-w-sm">
            <p className="text-lg font-semibold">{p.title}</p>
            <p className="mt-1 text-sm text-white/80">{p.startHint}</p>
          </div>
          <button
            type="button"
            onClick={() => setStarted(true)}
            onPointerEnter={warm}
            onFocus={warm}
            onTouchStart={warm}
            className="min-h-11 rounded-full bg-[var(--color-brand-500)] px-6 py-2.5 text-base font-semibold text-white hover:opacity-90"
          >
            {p.start}
          </button>
        </div>
      )}

      <canvas
        key={attempt}
        ref={ref}
        role="application"
        aria-label={p.canvasLabel}
        tabIndex={0}
        className="absolute inset-x-0 top-0 block h-[calc(100%-var(--tour-chips-h))] w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
      />

      {phase === 'loading' && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[var(--color-brand-950)] px-6 text-center"
          role="status"
          aria-live="polite"
        >
          <TopBar backLabel={p.back} />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-500)]">
            <Home className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-semibold">{p.loading}</p>
            <p className="mt-1 text-sm text-white/80">{p.loadingSteps[progress.label]}</p>
          </div>
          <div
            role="progressbar"
            aria-label={p.loading}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress.pct * 100)}
            className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/20"
          >
            <div
              className="h-full rounded-full bg-[var(--color-brand-300)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.round(progress.pct * 100)}%` }}
            />
          </div>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-10 overflow-y-auto bg-[var(--color-brand-950)]">
          <TopBar backLabel={p.back} />
          <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-4 px-4 pb-8 pt-16 text-center">
            <h2 className="text-lg font-semibold">{phase === 'nowebgl' ? p.noWebglTitle : p.error}</h2>
            {phase === 'nowebgl' && <p className="text-sm text-white/80">{p.noWebglText}</p>}
            {phase === 'error' && (
              <button
                type="button"
                onClick={() => setAttempt((a) => a + 1)}
                className="rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                {p.retry}
              </button>
            )}
            <figure className="w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/tour/grundriss.webp"
                alt={p.planAlt}
                width={1000}
                height={911}
                className="w-full rounded-xl bg-white"
              />
              <figcaption className="mt-2 text-xs text-white/70">{p.planCaption}</figcaption>
            </figure>
          </div>
        </div>
      )}
    </div>
  )
}

/** Back link + language switcher, shown while the scene is not interactive. */
function TopBar({ backLabel }: { backLabel: string }) {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-medium text-white hover:bg-white/25"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Link>
      <div className="rounded-full bg-white/90 [&_button]:min-h-11 [&_button]:min-w-11">
        <LanguageSwitcher />
      </div>
    </div>
  )
}
