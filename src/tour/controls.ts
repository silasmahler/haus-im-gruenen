/**
 * controls.ts - navigation: walk (WASD/arrows, pointer lock or drag look, touch stick + look-drag, circle-vs-rect
 * collision with sliding), dollhouse / top (damped orbit, wheel + pinch zoom), fade transitions for jumps.
 * `goTo` / `setPose` / `setMode` are instant (QA + API contract); `travel*` / `changeMode` fade (UI).
 * The update loop does not allocate.
 */
import * as THREE from 'three'

import type { Rect } from './geometry'
import { EXT_T, FOOTPRINT, poses, roomAt, roomById, tourOrder, type RoomId } from './plan'

export type Mode = 'walk' | 'dollhouse' | 'top'
export interface PoseState { x: number; z: number; yawDeg: number; pitchDeg: number; eye: number }
export interface TourControls {
  mode: Mode
  /** 0..1 black fade for the UI overlay (read every frame) */
  readonly fade: number
  /** live pose (walk position), do not mutate */
  readonly live: Readonly<PoseState>
  /** room the player is in; right after a jump the target room even if the pose stands just outside its polygon (chimney recess) */
  readonly room: RoomId | null
  update(dt: number): void
  setMode(m: Mode, animated?: boolean): void
  setPose(x: number, z: number, yawDeg: number, pitchDeg: number, eye?: number): void
  /** roomId or jump-pose id; instant; returns false when unknown */
  goTo(id: string, o?: { yaw?: number; pitch?: number; eye?: number }): boolean
  /** like goTo but with a fade */
  travel(id: string, o?: { yaw?: number; pitch?: number; eye?: number }): boolean
  /** fade to a plan position, keeping the current viewing direction */
  travelToPoint(x: number, z: number): void
  /** next / previous room of the guided order (fade) */
  stepRoom(dir: 1 | -1): void
  /** analog move input (x right, y forward, -1..1) from the on-screen stick */
  setStick(x: number, y: number): void
  setBob(on: boolean): void
  /** synchronous notification after every pose / mode change (jumps, API calls); returns unsubscribe */
  subscribe(fn: () => void): () => void
  getPose(): PoseState
  dispose(): void
}

const R = 0.25 // collision radius
const WALK = 1.7 // m/s
const SPRINT = 3.4
const FOV_WALK = 75 // vertical FOV of landscape screens
const HFOV_PORTRAIT = 78, FOV_MAX = 100 // portrait: keep ~78 deg horizontal, vertical capped
const FOV_OVERVIEW = 42
const WALL_TOP = 2.5
const DOLL_MIN_DIST = 8, DOLL_MIN_PITCH = 25 // camera stays above the wall tops (sin(25) * 8 = 3.4 m) even when close
const KEY_HOLD = 0.1 // s: a tap shorter than a frame still moves for this long
const TOUCH_LOOK = 0.38, MOUSE_LOOK = 0.16 // degrees per px
const CX = (FOOTPRINT.x0 + FOOTPRINT.x1) / 2
const CZ = (FOOTPRINT.z0 + FOOTPRINT.z1) / 2
const LO_X = EXT_T + R, HI_X = FOOTPRINT.x1 - EXT_T - R // keeps the player inside even at door gaps
const LO_Z = EXT_T + R, HI_Z = FOOTPRINT.z1 - EXT_T - R
const rad = (d: number) => (d * Math.PI) / 180
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const wrap = (d: number) => ((d % 360) + 360) % 360

/**
 * Landing views re-aimed here (plan.ts owns the base poses): the small rooms need a doorway or far-corner stand so the
 * fixtures are in view instead of a blank tile wall / door slab. Keyed by jump-pose id.
 */
const POSE_FIX: Record<string, Partial<PoseState>> = {
  'bad-1': { x: 10.42, z: 2.55, yawDeg: 42, pitchDeg: -10 }, // SW corner across tub and basin
  'kind-mitte-1': { x: 7.15, z: 8.0, yawDeg: 200, pitchDeg: -4 }, // east side, looking SSW: window with sheer curtain + radiator/desk, dresser at the right (the bed is behind; the plant at the SE corner seals it off)
}

// one entry per distinct room in guided order, for stepRoom
const stepIds: string[] = []
{
  const seen = new Set<string>()
  for (const id of tourOrder) {
    const q = poses.find((p) => p.id === id)
    if (q && !seen.has(q.room)) { seen.add(q.room); stepIds.push(q.id) }
  }
}

export function createControls(camera: THREE.PerspectiveCamera, dom: HTMLElement, colliders: Rect[],
  hideInOverview: THREE.Object3D[]): TourControls {
  camera.rotation.order = 'YXZ'
  let mode: Mode = 'walk'
  const p: PoseState = { x: 0, z: 0, yawDeg: 0, pitchDeg: 0, eye: 1.6 }
  const tgt: PoseState = { x: 0, z: 0, yawDeg: 0, pitchDeg: 0, eye: 1.6 } // pending travel target
  const orbit = { yaw: 200, pitch: 48, dist: 19 }
  const orbitT = { yaw: 200, pitch: 48, dist: 19 }
  let userZoomed = false
  const pan = { x: 0, z: 0 }, panT = { x: 0, z: 0 } // top view: look-at offset (m)
  const keys = new Set<string>()
  const hold: Record<string, number> = {} // per-key minimum press time (tap latch)
  const stick = { x: 0, y: 0 }
  let vx = 0, vz = 0, yawVel = 0
  let bob = false, bobPhase = 0
  let jumpRoom: RoomId | null = null, jumpX = 0, jumpZ = 0 // room of the last jump target, valid within 0.7 m
  let tgtRoom: RoomId | null = null
  const listeners = new Set<() => void>()
  const notify = () => { listeners.forEach((fn) => fn()) }

  // fade: 0 idle, 1 fading out (then runs pending), 2 fading in
  let fade = 0, fadePhase = 0
  let pending: (() => void) | null = null
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const transition = (fn: () => void) => {
    if (reduced) { fn(); return }
    pending = fn; fadePhase = 1
  }

  // ---- collision: push the circle out of every overlapping rect (gives sliding along walls for free)
  function resolve() {
    for (let pass = 0; pass < 8; pass++) { // wall clamp + rects meeting in a corner need a few passes to settle
      let moved = false
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i]
        const cx = clamp(p.x, c.x0, c.x1), cz = clamp(p.z, c.z0, c.z1)
        const dx = p.x - cx, dz = p.z - cz
        const d2 = dx * dx + dz * dz
        if (d2 >= R * R) continue
        moved = true
        if (d2 > 1e-9) {
          const k = (R - Math.sqrt(d2)) / Math.sqrt(d2)
          p.x += dx * k; p.z += dz * k
        } else { // centre inside the rect: leave through the nearest side
          const l = p.x - c.x0, r = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z
          // exits sorted by distance; take the first one that does not land in another collider (a wall behind the piece)
          const exits: [number, number, number][] = [[l, c.x0 - R, p.z], [r, c.x1 + R, p.z], [t, p.x, c.z0 - R], [b, p.x, c.z1 + R]]
          exits.sort((u, v) => u[0] - v[0])
          const free = (x: number, z: number) => colliders.every((o) => {
            if (o === c) return true
            const qx = clamp(x, o.x0, o.x1), qz = clamp(z, o.z0, o.z1)
            return (x - qx) ** 2 + (z - qz) ** 2 >= R * R
          })
          const e = exits.find((q) => free(q[1], q[2])) ?? exits[0]
          p.x = e[1]; p.z = e[2]
        }
      }
      p.x = clamp(p.x, LO_X, HI_X); p.z = clamp(p.z, LO_Z, HI_Z)
      if (!moved) break
    }
  }

  function placeOrbit() {
    const pit = rad(orbit.pitch), yw = rad(orbit.yaw)
    const cz = (mode === 'top' ? CZ + 0.5 : CZ) + pan.z // top view: the chip bar + room label at the bottom need more room than the top bar
    const cx = CX + pan.x
    camera.position.set(cx + Math.sin(yw) * Math.cos(pit) * orbit.dist, Math.sin(pit) * orbit.dist,
      cz - Math.cos(yw) * Math.cos(pit) * orbit.dist)
    camera.lookAt(cx, 0.3, cz)
  }
  function placeWalk(bobY: number) {
    camera.position.set(p.x, p.eye + bobY, p.z)
    camera.rotation.set(rad(p.pitchDeg), -rad(p.yawDeg), 0)
  }
  /** walk FOV: 72 deg vertical in landscape; portrait screens get ~78 deg horizontal (vertical capped) instead of a narrow tunnel */
  function walkFov() {
    const a = camera.aspect || 1
    const ar = roomAt(p.x, p.z)?.area // tiny rooms (bath, WC, storage, side hall): +8 deg so the walls do not fill the frame
    const wide = ar != null && ar < 7 ? 8 : 0
    if (a >= 1) return FOV_WALK + wide
    return Math.min(FOV_MAX, Math.max(FOV_WALK, (2 * Math.atan(Math.tan(rad(HFOV_PORTRAIT) / 2) / a) * 180) / Math.PI) + wide)
  }
  function setFov(f: number) {
    if (camera.fov === f) return
    camera.fov = f
    camera.updateProjectionMatrix()
  }
  /** distance at which the whole house fits the view; wall tops are WALL_TOP nearer than the ground, plus room for the UI bars */
  function fitDist() {
    const t = Math.tan(rad(FOV_OVERVIEW) / 2)
    return WALL_TOP + Math.max(6.5 / t, 6.9 / (t * (camera.aspect || 1)))
  }

  function applyMode(m: Mode, snap: boolean) {
    const from = mode
    mode = m
    for (let i = 0; i < hideInOverview.length; i++) hideInOverview[i].visible = m === 'walk'
    dom.style.cursor = m === 'walk' ? 'grab' : 'move'
    if (m === 'walk') { setFov(walkFov()); placeWalk(0); notify(); return }
    setFov(FOV_OVERVIEW)
    userZoomed = false
    panT.x = panT.z = 0
    if (snap || from === 'walk') pan.x = pan.z = 0
    orbitT.dist = fitDist() * (m === 'dollhouse' ? 1.1 : 1)
    if (m === 'top') {
      orbitT.pitch = 89
      orbitT.yaw = 180 + 360 * Math.round((orbit.yaw - 180) / 360)
    } else {
      orbitT.pitch = 48
      if (from === 'walk') orbitT.yaw = 200
    }
    if (snap || from === 'walk') { orbit.yaw = orbitT.yaw; orbit.pitch = orbitT.pitch; orbit.dist = orbitT.dist }
    placeOrbit()
    notify()
  }

  function setPose(x: number, z: number, yawDeg: number, pitchDeg: number, eye?: number) {
    jumpRoom = null
    p.x = x; p.z = z; p.yawDeg = wrap(yawDeg); p.pitchDeg = clamp(pitchDeg, -80, 80)
    if (eye !== undefined) p.eye = eye
    vx = vz = yawVel = 0
    resolve()
    if (mode !== 'walk') applyMode('walk', true)
    else { placeWalk(0); notify() }
  }

  /** resolves an id into `tgt` */
  function resolveId(id: string, o: { yaw?: number; pitch?: number; eye?: number }): boolean {
    const pose = poses.find((q) => q.id === id) ?? poses.find((q) => q.room === id)
    tgtRoom = pose ? pose.room : (id as RoomId)
    if (pose) {
      const f = POSE_FIX[pose.id]
      tgt.x = f?.x ?? pose.x; tgt.z = f?.z ?? pose.z; tgt.yawDeg = f?.yawDeg ?? pose.yawDeg; tgt.eye = pose.eye; tgt.pitchDeg = f?.pitchDeg ?? pose.pitchDeg
    }
    else {
      const r = roomById(id as RoomId)
      if (!r) return false
      tgt.x = r.polygon.reduce((s, q) => s + q.x, 0) / r.polygon.length
      tgt.z = r.polygon.reduce((s, q) => s + q.z, 0) / r.polygon.length
      tgt.yawDeg = 0; tgt.pitchDeg = 0; tgt.eye = 1.6
    }
    if (o.yaw !== undefined) tgt.yawDeg = o.yaw
    if (o.pitch !== undefined) tgt.pitchDeg = o.pitch
    if (o.eye !== undefined) tgt.eye = o.eye
    return true
  }
  const commitTarget = () => {
    setPose(tgt.x, tgt.z, tgt.yawDeg, tgt.pitchDeg, tgt.eye)
    jumpRoom = tgtRoom; jumpX = p.x; jumpZ = p.z
    notify()
  }

  // ---- input
  const isWidgetArrow = (e: KeyboardEvent) =>
    e.code.startsWith('Arrow') && e.target instanceof Element && !!e.target.closest('[data-tour-nokeys]')
  const isField = (e: KeyboardEvent) => e.target instanceof Element && !!e.target.closest('input,select,textarea')
  const moveKeyList = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']
  const moveKeys = new Set(moveKeyList)
  const down = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || isField(e) || isWidgetArrow(e)) return
    if (moveKeys.has(e.code)) {
      keys.add(e.code); hold[e.code] = KEY_HOLD
      if (e.code.startsWith('Arrow')) e.preventDefault()
      return
    }
    if (e.repeat) return
    if (e.code === 'BracketRight' || e.code === 'PageDown' || e.code === 'KeyN') { e.preventDefault(); self.stepRoom(1) }
    else if (e.code === 'BracketLeft' || e.code === 'PageUp' || e.code === 'KeyP') { e.preventDefault(); self.stepRoom(-1) }
    else if (e.code === 'Digit1') self.setMode('walk', true)
    else if (e.code === 'Digit2') self.setMode('dollhouse', true)
    else if (e.code === 'Digit3') self.setMode('top', true)
  }
  const up = (e: KeyboardEvent) => { keys.delete(e.code) }
  const blur = () => { keys.clear(); for (let i = 0; i < moveKeyList.length; i++) hold[moveKeyList[i]] = 0 }

  const ptrs = new Map<number, { x: number; y: number }>()
  let travelled = 0 // px moved by the current mouse press (click vs drag)
  let pinch = 0
  let lastClick = -1e9 // ms; a second click within 400 ms captures the mouse (a single click must not trap the cursor)
  const locked = () => document.pointerLockElement === dom

  function look(dYaw: number, dPitch: number) {
    p.yawDeg = wrap(p.yawDeg + dYaw)
    p.pitchDeg = clamp(p.pitchDeg + dPitch, -80, 80)
  }
  const pd = (e: PointerEvent) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try { dom.setPointerCapture(e.pointerId) } catch { /* synthetic pointer */ }
    if (e.pointerType === 'mouse') travelled = 0
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()]
      pinch = Math.hypot(a.x - b.x, a.y - b.y)
    }
    if (mode !== 'walk') dom.style.cursor = 'grabbing'
  }
  const pu = (e: PointerEvent) => {
    const wasClick = e.pointerType === 'mouse' && e.type === 'pointerup' && travelled < 5 && ptrs.has(e.pointerId)
    ptrs.delete(e.pointerId)
    if (ptrs.size < 2) pinch = 0
    if (mode !== 'walk') dom.style.cursor = 'move'
    const now = performance.now()
    const dbl = wasClick && now - lastClick < 400
    if (wasClick) lastClick = dbl ? -1e9 : now
    if (dbl && mode === 'walk' && !locked() && dom.requestPointerLock) {
      try { (dom.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(() => {}) } catch { /* drag look still works */ }
    }
  }
  const pm = (e: PointerEvent) => {
    if (locked()) {
      if (mode === 'walk') look(e.movementX * 0.12, -e.movementY * 0.12)
      return
    }
    const q = ptrs.get(e.pointerId)
    if (!q) return
    const dx = e.clientX - q.x, dy = e.clientY - q.y
    q.x = e.clientX; q.y = e.clientY
    if (e.pointerType === 'mouse') travelled += Math.abs(dx) + Math.abs(dy)
    if (mode === 'walk') {
      const s = e.pointerType === 'mouse' ? MOUSE_LOOK : TOUCH_LOOK // grab-style: the scene follows the finger/cursor
      look(-dx * s, dy * s)
    } else if (ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch > 0 && d > 0) { orbitT.dist = clamp(orbitT.dist * (pinch / d), minDist(), 40); userZoomed = true }
      pinch = d
    } else {
      if (mode === 'dollhouse') {
        orbitT.yaw += -dx * 0.3
        orbitT.pitch = clamp(orbitT.pitch + dy * 0.3, DOLL_MIN_PITCH, 86)
      } else { // top view: yaw locked (north up, like the minimap), drag pans, wheel / pinch zooms
        const mpp = (2 * orbitT.dist * Math.tan(rad(FOV_OVERVIEW) / 2)) / (dom.clientHeight || 1)
        panT.x = clamp(panT.x - dx * mpp, -7, 7); panT.z = clamp(panT.z - dy * mpp, -6, 6)
      }
    }
  }
  const minDist = () => (mode === 'dollhouse' ? DOLL_MIN_DIST : 6)
  const wheel = (e: WheelEvent) => {
    if (mode === 'walk') return
    orbitT.dist = clamp(orbitT.dist * Math.exp(e.deltaY * 0.001), minDist(), 40)
    userZoomed = true
  }
  const noCtx = (e: Event) => e.preventDefault()
  addEventListener('keydown', down)
  addEventListener('keyup', up)
  addEventListener('blur', blur)
  dom.addEventListener('pointerdown', pd)
  dom.addEventListener('pointerup', pu)
  dom.addEventListener('pointercancel', pu)
  dom.addEventListener('pointermove', pm)
  dom.addEventListener('wheel', wheel, { passive: true })
  dom.addEventListener('contextmenu', noCtx)

  const k = (c: string) => keys.has(c) || hold[c] > 0

  const self: TourControls = {
    get mode() { return mode },
    get fade() { return fade },
    get live() { return p },
    get room() {
      if (jumpRoom && Math.hypot(p.x - jumpX, p.z - jumpZ) < 0.7) return jumpRoom
      return roomAt(p.x, p.z)?.id ?? null
    },
    update(dt) {
      if (fadePhase === 1) {
        fade = Math.min(1, fade + dt / 0.16)
        if (fade >= 1) { const fn = pending; pending = null; fadePhase = 2; fn?.() }
      } else if (fadePhase === 2) {
        fade = Math.max(0, fade - dt / 0.3)
        if (fade <= 0) fadePhase = 0
      }

      if (mode === 'walk') {
        { const tf = walkFov(); setFov(Math.abs(tf - camera.fov) < 0.05 ? tf : camera.fov + (tf - camera.fov) * Math.min(1, dt * 6)) } // aspect can change (resize / rotate); eased when entering a small room
        let f = (k('KeyW') ? 1 : 0) + (k('ArrowUp') ? 1 : 0) - (k('KeyS') ? 1 : 0) - (k('ArrowDown') ? 1 : 0) + stick.y
        let s = (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0) + stick.x
        const l = Math.hypot(f, s)
        if (l > 1) { f /= l; s /= l }
        const fast = k('ShiftLeft') || k('ShiftRight')
        const speed = fast ? SPRINT : WALK
        const y = rad(p.yawDeg)
        const kv = 1 - Math.exp(-dt * 9)
        vx += ((Math.sin(y) * f + Math.cos(y) * s) * speed - vx) * kv
        vz += ((-Math.cos(y) * f + Math.sin(y) * s) * speed - vz) * kv
        const turn = (k('ArrowRight') ? 1 : 0) + (k('KeyE') ? 1 : 0) - (k('ArrowLeft') ? 1 : 0) - (k('KeyQ') ? 1 : 0)
        const tilt = (k('KeyR') ? 1 : 0) - (k('KeyF') ? 1 : 0)
        if (tilt) p.pitchDeg = clamp(p.pitchDeg + tilt * (fast ? 90 : 55) * dt, -80, 80)
        yawVel += (turn * (fast ? 150 : 90) - yawVel) * (1 - Math.exp(-dt * 10))
        if (Math.abs(yawVel) > 0.05) p.yawDeg = wrap(p.yawDeg + yawVel * dt)

        const dist = Math.hypot(vx, vz) * dt
        if (dist > 1e-4) {
          const n = Math.ceil(dist / 0.08)
          for (let i = 0; i < n; i++) { p.x += (vx * dt) / n; p.z += (vz * dt) / n; resolve() }
          bobPhase += dist * 5
        } else if (Math.abs(vx) + Math.abs(vz) < 0.01) { vx = vz = 0 }
        placeWalk(bob ? Math.sin(bobPhase) * 0.02 * Math.min(1, Math.hypot(vx, vz) / WALK) : 0)
        for (let i = 0; i < moveKeyList.length; i++) { const c = moveKeyList[i]; if (hold[c] > 0) hold[c] -= dt }
      } else {
        if (mode === 'top' && !userZoomed) orbitT.dist = fitDist()
        const kd = 1 - Math.exp(-dt * 8)
        orbit.yaw += (orbitT.yaw - orbit.yaw) * kd
        orbit.pitch += (orbitT.pitch - orbit.pitch) * kd
        orbit.dist += (orbitT.dist - orbit.dist) * kd
        pan.x += (panT.x - pan.x) * kd; pan.z += (panT.z - pan.z) * kd
        placeOrbit()
      }
    },
    setMode(m, animated = false) {
      if (m === mode) return
      if (animated && (m === 'walk' || mode === 'walk')) transition(() => applyMode(m, true))
      else applyMode(m, !animated)
    },
    setPose,
    goTo(id, o = {}) {
      if (!resolveId(id, o)) return false
      commitTarget()
      return true
    },
    travel(id, o = {}) {
      if (!resolveId(id, o)) return false
      transition(commitTarget)
      return true
    },
    travelToPoint(x, z) {
      tgtRoom = null; tgt.x = x; tgt.z = z; tgt.yawDeg = p.yawDeg; tgt.pitchDeg = 0; tgt.eye = 1.6
      transition(commitTarget)
    },
    stepRoom(dir) {
      const cur = self.room
      let i = cur ? stepIds.findIndex((id) => poses.find((q) => q.id === id)?.room === cur) : -1
      if (i < 0) i = dir > 0 ? -1 : 0
      self.travel(stepIds[(i + dir + stepIds.length) % stepIds.length])
    },
    setStick(x, y) { stick.x = x; stick.y = y },
    setBob(on) { bob = on },
    subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn) } },
    getPose: () => ({ ...p }),
    dispose() {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
      removeEventListener('blur', blur)
      dom.removeEventListener('pointerdown', pd)
      dom.removeEventListener('pointerup', pu)
      dom.removeEventListener('pointercancel', pu)
      dom.removeEventListener('pointermove', pm)
      dom.removeEventListener('wheel', wheel)
      dom.removeEventListener('contextmenu', noCtx)
      listeners.clear()
      if (locked()) document.exitPointerLock()
    },
  }
  applyMode('walk', true)
  return self
}
