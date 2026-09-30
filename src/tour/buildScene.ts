/**
 * buildScene.ts - thin assembler. Creates renderer/scene/camera, adds geometry + furniture + lighting, starts the loop
 * and installs window.__tour. Keep it thin: real work lives in the specialist modules. Small additive edits are OK.
 * Loaded via dynamic import from TourCanvas.tsx (so three stays out of the initial bundle).
 */
import * as THREE from 'three'

import { createControls, type Mode, type PoseState, type TourControls } from './controls'
import { makeBackdrop } from './backdrop'
import { buildDecor } from './decor'
import { buildFurniture } from './furniture'
import { buildGeometry, type Rect } from './geometry'
import { setupLighting } from './lighting'
import { disposeMaterials, getMaterial, materialKeys } from './materials'
import { FOOTPRINT, footprint, furniture, poses, rooms, type Room } from './plan'

export interface TourStats { fps: number; drawCalls: number; triangles: number; mode: Mode; pose: PoseState }
export interface TourApi {
  ready: boolean
  /** prefers-reduced-motion at creation time: controls should skip glides / animated transitions */
  reducedMotion: boolean
  /** navigation controls (UI: animated travel, stick input, fade) and the canvas (aria) */
  controls: TourControls
  canvas: HTMLCanvasElement
  /** walk colliders (QA: reachability / pose clearance checks) */
  colliders: Rect[]
  rooms: Room[]
  /** graphics quality (button in TourUI): index 0 high, 1 medium, 2 low; cycle() steps to the next and returns it */
  quality: { index(): number; cycle(): number }
  goTo(id: string, o?: { yaw?: number; pitch?: number; eye?: number }): boolean
  setPose(x: number, z: number, yawDeg: number, pitchDeg: number): void
  setMode(m: Mode): void
  getMode(): Mode
  stats(): TourStats
}
export interface TourHandle { api: TourApi; dispose(): void }
export type BuildStep = 'textures' | 'geometry' | 'furniture' | 'lighting'
/**
 * Called BEFORE each unit of work (a material, or a step) with the step being worked on and overall progress 0..1.
 * `force` = a step boundary: the shell must repaint now. Otherwise the shell may skip the yield if it painted recently.
 */
export type ProgressFn = (step: BuildStep, fraction: number, force?: boolean) => Promise<void> | void
declare global { interface Window { __tour?: TourApi } }

export async function createTour(canvas: HTMLCanvasElement, onProgress?: ProgressFn): Promise<TourHandle> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }) // throws without WebGL
  const coarse = window.matchMedia('(pointer: coarse)').matches
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2)) // cap: phones have 3x screens
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 100)

  let house: ReturnType<typeof buildGeometry>
  let lighting: ReturnType<typeof setupLighting>
  try {
    // textures are the slowest step: one material at a time, progress per material, the shell yields every ~40 ms
    const keys = materialKeys()
    const times: Record<string, number> = {}
    for (let i = 0; i < keys.length; i++) {
      await onProgress?.('textures', 0.05 + 0.45 * (i / keys.length), i === 0)
      const t0 = performance.now()
      getMaterial(keys[i])
      const ms = performance.now() - t0
      if (ms > 5) times[keys[i]] = Math.round(ms)
    }
    ;(window as unknown as { __tourMatTimes?: unknown }).__tourMatTimes = times // QA
    performance.mark('tour:textures')
    await onProgress?.('geometry', 0.5, true)
    house = buildGeometry()
    performance.mark('tour:geometry')
    await onProgress?.('furniture', 0.6, true)
    scene.add(house.group, buildFurniture(), buildDecor())
    performance.mark('tour:furniture')
    await onProgress?.('lighting', 0.8, true)
    lighting = setupLighting(scene, renderer, camera)
    scene.add(makeBackdrop(FOOTPRINT.x1 / 2, FOOTPRINT.z1 / 2, coarse)) // window view: painted panorama (replaces the old leaf-card scenery)
    await onProgress?.('lighting', 0.92, true)
    await renderer.compileAsync(scene, camera) // shaders compile in parallel off the main thread instead of stalling frame 1
    performance.mark('tour:lighting')
  } catch (e) {
    renderer.dispose() // aborted by the shell (unmount) or a build error
    throw e
  }

  // walk collision: wall solids + floor-standing furniture (rugs, pieces on top of others, the ceiling flue and the
  // thin open door leaves are excluded: they would close the chimney niche / narrow door passages)
  // Tucked-in dining chairs are left out (passable in real life; they pinched the kitchen -> storage room route to 0.45 m).
  // Open door leaves ARE colliders (thin rects beside the door gap).
  const pieces = furniture.filter((f) => !f.onTopOf && f.type !== 'rug' && f.type !== 'flue' && f.type !== 'dining-chair').map(footprint)
  // open leaves are only ~6 cm thick and sit flush with the door reveal: slim them by 2 cm a side so they never narrow the gap
  const slim = (r: Rect): Rect => (r.x1 - r.x0 < r.z1 - r.z0
    ? { x0: r.x0 + 0.02, x1: r.x1 - 0.02, z0: r.z0, z1: r.z1 }
    : { x0: r.x0, x1: r.x1, z0: r.z0 + 0.02, z1: r.z1 - 0.02 })
  const colliders = [...house.collision.rects, ...house.collision.leaves.map(slim), ...pieces]
  const controls = createControls(camera, canvas, colliders, [house.ceiling])
  const start = poses[0]
  controls.setPose(start.x, start.z, start.yawDeg, start.pitchDeg, start.eye)

  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    lighting.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  let fps = 0, frames = 0, acc = 0, last = performance.now(), raf = 0, dead = false
  const loop = (now: number) => {
    if (dead) return
    const real = (now - last) / 1000 // true elapsed time for the fps average; only the simulation step is clamped
    const dt = Math.min(real, 0.1)
    last = now
    acc += real; frames++
    if (acc >= 0.5) { fps = frames / acc; frames = 0; acc = 0 }
    controls.update(dt)
    lighting.render(dt)
    api.ready = true
    raf = requestAnimationFrame(loop)
  }

  const api: TourApi = {
    ready: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    controls,
    canvas,
    colliders,
    rooms,
    quality: { index: () => lighting.qualityIndex, cycle: () => lighting.cycleQuality() },
    goTo: (id, o) => controls.goTo(id, o),
    setPose: (x, z, yaw, pitch) => controls.setPose(x, z, yaw, pitch),
    setMode: (m) => controls.setMode(m),
    getMode: () => controls.mode,
    stats: () => ({
      fps: Math.round(fps * 10) / 10,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      mode: controls.mode,
      pose: controls.getPose(),
    }),
  }
  window.__tour = api
  raf = requestAnimationFrame(loop)
  // browsers throttle rAF in background tabs; stop explicitly so nothing renders while hidden
  const onVisibility = () => {
    cancelAnimationFrame(raf)
    if (document.hidden || dead) return
    last = performance.now()
    raf = requestAnimationFrame(loop)
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    api,
    dispose() {
      dead = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      controls.dispose()
      lighting.dispose()
      scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return
        o.geometry.dispose()
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose()
      })
      disposeMaterials()
      renderer.dispose()
      if (window.__tour === api) delete window.__tour
    },
  }
}
