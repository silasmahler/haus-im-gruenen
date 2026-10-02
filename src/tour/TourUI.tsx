'use client'

import { ArrowLeft, CircleHelp, Map as MapIcon, Mouse, X } from 'lucide-react'
import Link from 'next/link'
import { memo, useEffect, useRef, useState } from 'react'

import { useLanguage } from '@/i18n/LanguageContext'

import type { TourApi } from './buildScene'
import type { Mode, TourControls } from './controls'
import { FOOTPRINT, openings, walls, type Pt, type Room, type RoomId } from './plan'

/** Overlay: mode switch, room chips (roving arrow keys), minimap, joystick, help dialog, aria-live room announcements. */

const glass = 'pointer-events-auto bg-brand-950/60 text-white backdrop-blur-md ring-1 ring-white/15'
const btn = 'inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
const idle = 'hover:bg-white/15'
const on = 'bg-white text-brand-900'

const PAD = 0.3
const VIEWBOX = `${-PAD} ${-PAD} ${FOOTPRINT.x1 + 2 * PAD} ${FOOTPRINT.z1 + 2 * PAD}`
// door / passage gaps as white ticks across the wall line (closed outside doors are not passable: skipped)
const ticks = openings.filter((o) => o.type !== 'window' && !(o.swing && o.swing.openDeg === 0)).map((o) => {
  const w = walls.find((q) => q.id === o.wall)!
  const h = o.width / 2
  return w.a.z === w.b.z ? { x1: o.at.x - h, z1: o.at.z, x2: o.at.x + h, z2: o.at.z } : { x1: o.at.x, z1: o.at.z - h, x2: o.at.x, z2: o.at.z + h }
})
const pts = (poly: Pt[]) => poly.map((q) => `${q.x},${q.z}`).join(' ')

const MiniMap = memo(function MiniMap({ rooms, current, label, onPick, marker }: {
  rooms: Room[]; current: RoomId; label: (r: Room) => string; onPick: (id: RoomId) => void
  marker: React.RefObject<SVGGElement | null>
}) {
  return (
    <svg viewBox={VIEWBOX} aria-hidden="true" className="block h-auto w-full">
      <rect x={-PAD / 2} y={-PAD / 2} width={FOOTPRINT.x1 + PAD} height={FOOTPRINT.z1 + PAD} rx={0.25} fill="rgba(255,255,255,0.14)" />
      {rooms.map((r) => (
        <polygon key={r.id} points={pts(r.polygon)} onClick={() => onPick(r.id)}
          className={`cursor-pointer transition-colors ${r.id === current ? 'fill-white' : 'fill-white/60 hover:fill-white/85'}`}>
          <title>{label(r)}</title>
        </polygon>
      ))}
      {ticks.map((k, i) => <line key={i} {...k} stroke="#fff" strokeWidth={0.2} strokeLinecap="butt" />)}
      <g ref={marker}>
        <path d="M0,0 L-1.53,-2.1 A2.6,2.6 0 0 1 1.53,-2.1 Z" fill="var(--color-brand-400)" fillOpacity={0.55} />
        <circle r={0.34} fill="var(--color-brand-500)" stroke="#fff" strokeWidth={0.12} />
      </g>
    </svg>
  )
})

function Joystick({ ctrl, label, onActive }: { ctrl: TourControls; label: string; onActive: (v: boolean) => void }) {
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const active = useRef(-1)
  const R = 36
  const [held, setHeld] = useState(false)
  useEffect(() => () => onActive(false), [onActive])
  const move = (e: React.PointerEvent) => {
    const b = base.current!.getBoundingClientRect()
    let dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2)
    const l = Math.hypot(dx, dy)
    if (l > R) { dx *= R / l; dy *= R / l }
    knob.current!.style.transform = `translate(${dx}px,${dy}px)`
    ctrl.setStick(l < 6 ? 0 : dx / R, l < 6 ? 0 : -dy / R)
  }
  const end = (e: React.PointerEvent) => {
    if (e.pointerId !== active.current) return
    active.current = -1
    setHeld(false); onActive(false)
    knob.current!.style.transform = ''
    ctrl.setStick(0, 0)
  }
  return (
    <div ref={base} aria-hidden="true" title={label}
      className={`pointer-events-auto absolute bottom-[84px] left-3 h-[108px] w-[108px] touch-none rounded-full bg-brand-950/35 ring-1 ring-white/25 backdrop-blur-sm transition-opacity duration-300 ${held ? 'opacity-100' : 'opacity-40'}`}
      onPointerDown={(e) => { active.current = e.pointerId; setHeld(true); onActive(true); try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* synthetic pointer */ } move(e) }}
      onPointerMove={(e) => { if (e.pointerId === active.current) move(e) }}
      onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <div ref={knob} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full bg-white/80 shadow-lg" />
    </div>
  )
}

function Help({ onClose, bob, onBob }: { onClose: () => void; bob: boolean; onBob: (v: boolean) => void }) {
  const { t } = useLanguage()
  const u = t.tour.ui
  const box = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => { document.exitPointerLock?.(); closeBtn.current?.focus() }, [])
  const trap = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return }
    if (e.key !== 'Tab') return
    const f = box.current!.querySelectorAll<HTMLElement>('button,input')
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 pt-20 sm:pt-4" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="tour-help-title" onKeyDown={trap} data-tour-nokeys
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-md flex-col rounded-2xl bg-brand-950/90 p-5 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="tour-help-title" className="text-lg font-semibold">{u.helpTitle}</h2>
          <button ref={closeBtn} className={`${btn} ${idle} px-0!`} onClick={onClose} aria-label={u.helpClose}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {u.helpItems.map((i) => (
            <div key={i.keys} className="contents">
              <dt><kbd className="whitespace-nowrap rounded bg-white/15 px-1.5 py-0.5 font-mono text-xs">{i.keys}</kbd></dt>
              <dd className="text-white/85">{i.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-white/85">{u.helpTouch}</p>
        </div>
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={bob} onChange={(e) => onBob(e.target.checked)} className="h-5 w-5 accent-[var(--color-brand-400)]" />
          {u.bob}
        </label>
        <button className={`${btn} mt-3 w-full bg-white text-brand-900`} onClick={onClose}>{u.helpClose}</button>
      </div>
    </div>
  )
}

export function TourUI({ api }: { api: TourApi }) {
  const { locale, t } = useLanguage()
  const u = t.tour.ui
  const ctrl = api.controls
  const [mode, setMode] = useState<Mode>(ctrl.mode)
  const [room, setRoom] = useState<RoomId>(() => ctrl.room ?? 'flur-links')
  const [helpOpen, setHelpOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(true)
  const [touch, setTouch] = useState(false)
  const [stickOn, setStickOn] = useState(false) // joystick held: the minimap steps aside so it never covers the view
  const [hint, setHint] = useState(true)
  const [bob, setBob] = useState(false)
  const [focused, setFocused] = useState(false)
  const [quality, setQuality] = useState(() => api.quality.index())
  const fadeEl = useRef<HTMLDivElement>(null)
  const marker = useRef<SVGGElement>(null)
  const chips = useRef<HTMLDivElement>(null)
  const helpBtn = useRef<HTMLButtonElement>(null)
  const label = (r: Room) => (locale === 'de' ? r.de : r.en)
  const cur = api.rooms.find((r) => r.id === room)!

  useEffect(() => {
    setTouch(matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)
    if (matchMedia('(max-width: 639px)').matches) setMapOpen(false) // phones: minimap collapsed until toggled
  }, [])

  // Sync of the imperative parts (fade, minimap marker) each frame; room + mode state also synchronously on every
  // jump / API call via ctrl.subscribe, so the chip and the aria-live text never lag behind a slow frame.
  useEffect(() => {
    let raf = 0, lx = NaN, lz = NaN, ly = NaN, lf = -1
    let lm: Mode = ctrl.mode, lr: RoomId | null = null, lmk: SVGGElement | null = null
    const sync = () => {
      const p = ctrl.live
      if (marker.current !== lmk) { lmk = marker.current; lx = NaN } // minimap (re)mounted
      if (p.x !== lx || p.z !== lz || p.yawDeg !== ly) {
        lx = p.x; lz = p.z; ly = p.yawDeg
        marker.current?.setAttribute('transform', `translate(${lx} ${lz}) rotate(${ly})`)
      }
      const r = ctrl.room
      if (r && r !== lr) { lr = r; setRoom(r) }
      if (ctrl.mode !== lm) { lm = ctrl.mode; setMode(lm) }
    }
    const tick = () => {
      sync()
      if (ctrl.fade !== lf) { lf = ctrl.fade; if (fadeEl.current) fadeEl.current.style.opacity = String(lf) }
      raf = requestAnimationFrame(tick)
    }
    const off = ctrl.subscribe(sync)
    raf = requestAnimationFrame(tick)
    return () => { off(); cancelAnimationFrame(raf) }
  }, [ctrl])

  // visible keyboard focus on the canvas (focus-visible only: no ring after a mouse click)
  useEffect(() => {
    const c = api.canvas
    const on = () => setFocused(c.matches(':focus-visible'))
    const off = () => setFocused(false)
    c.addEventListener('focus', on)
    c.addEventListener('blur', off)
    return () => { c.removeEventListener('focus', on); c.removeEventListener('blur', off) }
  }, [api])

  // canvas a11y: long description
  useEffect(() => {
    api.canvas.setAttribute('aria-describedby', 'tour-ui-desc')
    return () => api.canvas.removeAttribute('aria-describedby')
  }, [api])

  // hint disappears on first interaction or after 9 s
  useEffect(() => {
    const off = () => setHint(false)
    const id = setTimeout(off, 9000)
    api.canvas.addEventListener('pointerdown', off, { once: true })
    addEventListener('keydown', off, { once: true })
    return () => { clearTimeout(id); api.canvas.removeEventListener('pointerdown', off); removeEventListener('keydown', off) }
  }, [api])

  // global shortcuts owned by the UI
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest('textarea,select,input:not([type=checkbox])')) return
      if (e.key === 'Escape') setHelpOpen(false)
      else if (e.code === 'KeyH' || e.key === '?') setHelpOpen((o) => !o)
      else if (e.code === 'KeyM') setMapOpen((o) => !o)
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [])

  // return focus to the help button after closing
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !helpOpen) helpBtn.current?.focus()
    wasOpen.current = helpOpen
  }, [helpOpen])

  // keep the active chip in view
  useEffect(() => {
    const el = chips.current?.querySelector<HTMLElement>('[aria-current="true"]')
    el?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [room])

  const stepping = useRef(false) // true while arrow keys step through the chips: focus stays for the next step
  const pickRoom = (id: RoomId, e?: React.MouseEvent<HTMLElement>) => {
    ctrl.travel(id)
    // mouse click or Enter/Space: focus back to the canvas so WASD / arrows walk again
    if (e && !stepping.current) api.canvas.focus({ preventScroll: true })
  }
  const onChipKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); api.canvas.focus({ preventScroll: true }); return }
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const list = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
    const next = list[(list.indexOf(document.activeElement as HTMLButtonElement) + dir + list.length) % list.length]
    next?.focus()
    stepping.current = true
    next?.click()
    stepping.current = false
  }

  const modes: [Mode, string][] = [['walk', u.modeWalk], ['dollhouse', u.modeDollhouse], ['top', u.modeTop]]

  return (
    <div className={`pointer-events-none absolute inset-0 select-none ${helpOpen ? 'z-30' : 'z-10'}`}>
      {/* inset box-shadows do not paint on a canvas, so the keyboard-focus ring is an overlay */}
      {focused && <div data-tour-focus className="absolute inset-0 border-4 border-brand-500 shadow-[inset_0_0_0_2px_#fff]" aria-hidden="true" />}
      <div ref={fadeEl} className="absolute inset-0 bg-black opacity-0" />
      <p id="tour-ui-desc" className="sr-only">{u.canvasDescription}</p>
      <p className="sr-only" role="status" aria-live="polite">
        {u.currentRoom.replace('{room}', label(cur))}. {u.modeChanged[mode]}
      </p>

      {/* top: back + modes (language switcher of the shell sits top right) */}
      <Link href="/" aria-label={u.back}
        className={`${glass} ${btn} ${idle} absolute left-3 top-[max(12px,env(safe-area-inset-top))] px-0! sm:px-4!`}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{u.back}</span>
      </Link>
      {/* graphics quality: next to Back on phones, left of the help button from sm up (never over the mode switch) */}
      <button type="button" data-tour-quality aria-label={u.qualityNames[quality]} title={u.qualityNames[quality]}
        onClick={() => setQuality(api.quality.cycle())}
        className={`${glass} ${btn} ${idle} absolute left-[64px] top-[max(12px,env(safe-area-inset-top))] px-3! text-[13px]! sm:left-auto sm:right-[168px] sm:top-[68px]`}>
        {u.qualityNames[quality]}
      </button>
      <div role="group" aria-label={u.modes}
        className={`${glass} absolute left-3 top-[68px] flex rounded-full p-0.5 max-[379px]:right-3 sm:left-1/2 sm:top-3 sm:-translate-x-1/2`}>
        {modes.map(([m, text]) => (
          <button key={m} aria-pressed={mode === m} onClick={(e) => { ctrl.setMode(m, true); if (e.detail > 0) e.currentTarget.blur() }}
            className={`${btn} px-2! text-[13px]! max-[379px]:flex-1 sm:px-4! sm:text-sm! ${mode === m ? on : idle}`}>{text}</button>
        ))}
      </div>

      {/* right column: help, map toggle, minimap */}
      <div className="absolute right-3 top-[68px] flex flex-col items-end gap-2 max-sm:top-[124px]">
        <div className="flex gap-2">
          <button ref={helpBtn} className={`${glass} ${btn} ${idle} px-0!`} aria-label={u.help} aria-haspopup="dialog" onClick={() => setHelpOpen(true)}>
            <CircleHelp className="h-5 w-5" aria-hidden />
          </button>
          {!touch && mode === 'walk' && (
            <button className={`${glass} ${btn} ${idle} px-0!`} aria-label={u.lockMouse} title={u.lockMouse} onClick={() => { ctrl.lockPointer(); setHint(false) }}>
              <Mouse className="h-5 w-5" aria-hidden />
            </button>
          )}
          <button className={`${glass} ${btn} ${idle} px-0!`} aria-label={mapOpen ? u.mapHide : u.mapShow}
            aria-pressed={mapOpen} aria-keyshortcuts="M" onClick={() => setMapOpen((o) => !o)}>
            <MapIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {mapOpen && !stickOn && (
          <div className={`${glass} w-[124px] rounded-xl p-1.5 sm:w-[224px] sm:p-2`} role="img" aria-label={u.map}>
            <MiniMap rooms={api.rooms} current={room} label={label} onPick={(id) => pickRoom(id)} marker={marker} />
          </div>
        )}
      </div>

      {/* bottom: hint, current room, chips */}
      {mode === 'walk' && hint && (
        <p className={`${glass} absolute bottom-[108px] right-3 max-w-[55%] rounded-2xl px-3 py-1.5 text-center text-xs sm:left-1/2 sm:right-auto sm:max-w-none sm:-translate-x-1/2 sm:text-sm`}>
          {touch ? u.hintTouch : u.hintMouse}
        </p>
      )}
      {mode === 'walk' && (
        <p className={`${glass} absolute bottom-[68px] right-3 rounded-full px-3 py-1 text-sm font-medium sm:left-1/2 sm:right-auto sm:-translate-x-1/2`} aria-hidden="true">
          {label(cur)}
        </p>
      )}
      {touch && mode === 'walk' && <Joystick ctrl={ctrl} label={u.stick} onActive={setStickOn} />}

      <nav aria-label={u.rooms} className="absolute inset-x-0 bottom-0">
        <div ref={chips} data-tour-nokeys onKeyDown={onChipKeys} role="toolbar" aria-label={u.rooms}
          className="pointer-events-auto overflow-x-auto px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 [scrollbar-width:none] snap-x snap-proximity scroll-px-3 [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max gap-2">
            {api.rooms.map((r) => (
              <button key={r.id} onClick={(e) => pickRoom(r.id, e)} aria-current={r.id === room ? 'true' : undefined}
                tabIndex={r.id === room ? 0 : -1}
                className={`${glass} ${btn} snap-center ${r.id === room ? 'bg-white! text-brand-900!' : idle}`}>
                {label(r)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {helpOpen && <Help onClose={() => setHelpOpen(false)} bob={bob} onBob={(v) => { setBob(v); ctrl.setBob(v) }} />}
    </div>
  )
}
