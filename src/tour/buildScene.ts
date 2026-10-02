/**
 * buildScene.ts - thin assembler. Creates renderer/scene/camera, adds geometry + furniture + lighting, starts the loop
 * and installs window.__tour. Keep it thin: real work lives in the specialist modules. Small additive edits are OK.
 * Loaded via dynamic import from TourCanvas.tsx (so three stays out of the initial bundle).
 */
import * as THREE from 'three'

import { createControls, unreachableRooms, type Mode, type PoseState, type TourControls } from './controls'
import { makeBackdrop } from './backdrop'
import { buildDecor } from './decor'
import { buildFurniture, furnitureStats } from './furniture'
import { buildGeometry, type Rect } from './geometry'
import { setupLighting } from './lighting'
import { disposeMaterials, getMaterial, materialKeys } from './materials'
import { textureBakeMs } from './textures'
import { FOOTPRINT, footprint, furniture, poses, rooms, type Room } from './plan'

export interface TourStats { fps: number; drawCalls: number; triangles: number; mode: Mode; pose: PoseState; furniture?: Record<string, { drawCalls: number; triangles: number }> }
export interface TourApi {
  ready: boolean
  /** total procedural texture bake time in ms (QA: must stay < 400 in production) */
  bakeMs?: number
  /** prefers-reduced-motion at creation time: controls should skip glides / animated transitions */
  reducedMotion: boolean
  /** navigation controls (UI: animated travel, stick input, fade) and the canvas (aria) */
  controls: TourControls
  canvas: HTMLCanvasElement
  /** walk colliders (QA: reachability / pose clearance checks) */
  colliders: Rect[]
  /** room ids that cannot be reached on foot from the front door (must be empty) */
  unreachable: string[]
  /** geometry.ts shell only (walls, floors, ceiling, frames, glass, stove, apron): meshes (= draw calls) and triangles, for budget checks */
  shell: { drawCalls: number; triangles: number }
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

  // dollhouse cut-away: 4 global clip planes owned by controls.ts (constant 1e3 = inactive); set before any program compiles so mode switches never recompile
  const clip = [new THREE.Plane(), new THREE.Plane(), new THREE.Plane(), new THREE.Plane()]
  clip.forEach((q) => { q.constant = 1e3 })
  renderer.clippingPlanes = clip

  let bakeMs = 0
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
    bakeMs = textureBakeMs()
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
    await lighting.precompile() // walk + overview shader programs compile in parallel off the main thread (lighting.ts), not as a stall on frame 1 / first mode switch
    performance.mark('tour:lighting')
  } catch (e) {
    renderer.dispose() // aborted by the shell (unmount) or a build error
    throw e
  }

  // walk collision: wall solids + floor-standing furniture (rugs, pieces on top of others, the ceiling flue and the
  // thin open door leaves are excluded: they would close the chimney niche / narrow door passages)
  // Tucked-in dining chairs are left out (passable in real life; they pinched the kitchen -> storage room route to 0.45 m).
  // Open door leaves ARE colliders (thin rects beside the door gap).
  const floorPieces = furniture.filter((f) => !f.onTopOf && f.type !== 'rug' && f.type !== 'flue' && f.type !== 'dining-chair')
  const pieces = floorPieces.map(footprint)
  // open leaves are only ~6 cm thick and sit flush with the door reveal: slim them by 2 cm a side so they never narrow the gap
  const slim = (r: Rect): Rect => (r.x1 - r.x0 < r.z1 - r.z0
    ? { x0: r.x0 + 0.02, x1: r.x1 - 0.02, z0: r.z0, z1: r.z1 }
    : { x0: r.x0, x1: r.x1, z0: r.z0 + 0.02, z1: r.z1 - 0.02 })
  // Collision-only fixes so the narrow doors (bath, WC, storage: 0.60-0.64 m clear) stay walkable for a 0.18 m circle:
  // jambs are inset 6 cm, and the side-hall console (sits right in front of the bath door) is trimmed to its east part.
  const INSET = 0.06
  const jambs = house.collision.rects.map((r) => ({ ...r }))
  for (const g of house.collision.doorGaps) {
    const h = g.width / 2
    for (const r of jambs) {
      if (g.axis === 'x' && g.z > r.z0 - 0.01 && g.z < r.z1 + 0.01) {
        if (Math.abs(r.x1 - (g.x - h)) < 0.011) r.x1 -= INSET
        else if (Math.abs(r.x0 - (g.x + h)) < 0.011) r.x0 += INSET
      } else if (g.axis === 'z' && g.x > r.x0 - 0.01 && g.x < r.x1 + 0.01) {
        if (Math.abs(r.z1 - (g.z - h)) < 0.011) r.z1 -= INSET
        else if (Math.abs(r.z0 - (g.z + h)) < 0.011) r.z0 += INSET
      }
    }
  }
  const trimmed = pieces.map((r, i) => (floorPieces[i].id === 'console-flur-r' ? { ...r, x0: Math.max(r.x0, 10.85) } : r))
  const colliders = [...jambs, ...house.collision.leaves.map(slim), ...trimmed]
  const unreachable = unreachableRooms(colliders) // every room must be walkable from the front door
  if (unreachable.length) console.error('[tour] rooms not reachable on foot:', unreachable.join(', '))
  const controls = createControls(camera, canvas, colliders, [house.ceiling], clip)
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
    unreachable,
    shell: (() => {
      let n = 0, t = 0
      house.group.traverse((o) => { if (o instanceof THREE.Mesh) { n++; t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 } })
      return { drawCalls: n, triangles: Math.round(t) }
    })(),
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
      furniture: furnitureStats, // per room group + total (meshes = draw calls per pass, triangles)
    }),
  }
  api.bakeMs = bakeMs
  window.__tour = api
  ;(window as unknown as { __scene: unknown }).__scene = { scene, camera } // TMP-DEBUG
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
