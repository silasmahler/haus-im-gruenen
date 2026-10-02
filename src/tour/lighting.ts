/**
 * lighting.ts - soft interior daylight for the tour.
 *
 * API (used by buildScene.ts):
 *   const lighting = setupLighting(scene, renderer, camera)
 *   lighting.render(dt)      // call INSTEAD of renderer.render(scene, camera) every frame (postfx + adaptive quality)
 *   lighting.setSize(w, h)   // call after renderer.setSize (CSS px)
 *   lighting.refreshShadows()// re-scan the scene for shadow casters/receivers after adding meshes later
 *   lighting.dispose()
 *
 * Round 3: lights are a POOL. Window spots, fills, bounce, washes and the dressing.ts lamps are described as virtual lights; only SLOTS[level] real
 * SpotLights/PointLights exist (5+3 at level 1, 0 in dollhouse/top) and follow the camera's room, so shaders carry ~11 lights (was 46).
 * Shadow maps render on demand (static scene). lighting.precompile() compiles walk + overview programs behind the loader.
 * Adaptive quality: timed with performance.now, hidden tabs / stalls ignored, 3 bad 1.5 s windows (<52 fps) to step down, max one step per 10 s,
 * 6 good windows to step back up to the detected level, remembered step-down expires after 10 min.
 * Walk: ACES exposure 1.04, sun 28 deg from the SW (long floor patches), weak hemisphere (0.13), deeper AO bands. Overview: exposure 0.9, sun + hemisphere only.
 * Sky dome / backdrop (seen through windows) kept near 1.0 so glass stays ~1.5-2x the wall and does not clip; curtains are dimmed albedo + visible folds.
 * Quality levels (0 best): 0 = GTAO + bloom + 1536 shadows (?q=0 only); 1 = bloom only (DEFAULT desktop); 2 = direct render, 1024 shadows; 3 = phone (pixel ratio 1); 4 = 512 shadows, no pool.
 * Force a level with `?q=0..4` (`&auto=1` keeps auto-step). Manual: lighting.cycleQuality() (TourUI button).
 * QA handle: window.__tourLight = { scene, renderer, camera, sun, level }.
 */
import * as THREE from 'three'

import { buildDressing } from './dressing'
import type { Post } from './postfx'
import { LAYOUT, FOOTPRINT, WALL_HEIGHT, footprint, furniture, openings, roomAt, rooms, walls } from './plan'
import type { Opening } from './plan'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface Lighting {
  level: number
  render(dt: number): void
  setSize(w: number, h: number): void
  setLevel(level: number): void
  refreshShadows(): void
  /** compile the shader programs of walk AND overview light setups (call once, behind the loader) */
  precompile(): Promise<void>
  /** 0 high, 1 medium, 2 low (for the quality button) */
  readonly qualityIndex: number
  /** high -> medium -> low -> high; pins the choice for this tab; returns the new index */
  cycleQuality(): number
  dispose(): void
}

// towards the sun: south-west, 40 deg elevation (patches land on the floor and lower walls close behind the windows)
const SUN_DIR = new THREE.Vector3(-0.373, 0.469, 0.8).normalize() // 28 deg elevation, 25 deg west of south: long floor patches behind the S/W glass, readable wall shadows in the overview
const SKY_DIR = new THREE.Vector3(0.15, 0.85, -0.5).normalize() // cool skylight from the north, 58 deg elevation
const SHADOW_SIZE = [1536, 1536, 1024, 1024, 512]
const PIXEL_RATIO = [1.5, 1.5, 1.25, 1, 1]
const HAZE = 0xdde8ee
const HEMI = 0.13 // walk-mode ambient (kept low): window lights, sun patches and AO supply the contrast
const EXPOSURE = 1.04
const EXPOSURE_OVERVIEW = 0.9 // dollhouse / top: open house, whites would clip at the walk exposure
const FPS_MIN = 52
const STORE_KEY = 'tour:quality'
const STORE_TTL = 10 * 60 * 1000 // a remembered step-down expires after 10 min
const SLOTS: [number, number][] = [[5, 3], [5, 3], [4, 2], [3, 2], [0, 0]] // [spot, point] pool slots per quality level: the per-material light cap (+ sun, sky, hemisphere)
const MANUAL_KEY = 'tour:quality-manual'

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

// ---------------------------------------------------------------- sky / ground
function makeSkyTexture(w: number, h: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, h)
  const stops: [number, string][] = [
    [0, '#3f7fc8'], [0.18, '#5f9ad8'], [0.34, '#93c1ea'], [0.44, '#c9e0f0'], [0.485, '#eaf1f2'], [0.5, '#f1f3ee'],
    [0.502, '#c8d6b4'], [0.55, '#9db67f'], [0.7, '#7a9862'], [1, '#4a6337'],
  ]
  for (const [p, col] of stops) grad.addColorStop(p, col)
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  const rnd = seeded(7)
  // sun glow in the south-west
  const sx = w * 0.35, sy = h * 0.3
  const sg = g.createRadialGradient(sx, sy, 0, sx, sy, w * 0.09)
  sg.addColorStop(0, 'rgba(255,250,235,0.9)')
  sg.addColorStop(0.25, 'rgba(255,246,220,0.35)')
  sg.addColorStop(1, 'rgba(255,246,220,0)')
  g.fillStyle = sg
  g.fillRect(0, 0, w, h)
  // soft clouds: stacks of elliptical radial gradients
  for (let i = 0; i < 34; i++) {
    const x = rnd() * w, y = h * (0.1 + rnd() * 0.33), rx = w * (0.025 + rnd() * 0.055), ry = rx * (0.14 + rnd() * 0.12)
    for (let k = 0; k < 5; k++) {
      const ox = (rnd() - 0.5) * rx * 1.3, oy = (rnd() - 0.5) * ry * 0.9
      g.save()
      g.translate(x + ox, y + oy)
      g.scale(1, ry / rx)
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx * 0.6)
      rg.addColorStop(0, 'rgba(255,255,255,0.7)')
      rg.addColorStop(0.6, 'rgba(250,252,255,0.25)')
      rg.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = rg
      g.beginPath()
      g.arc(0, 0, rx * 0.6, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
  }
  // distant tree line (two hazy layers) so the horizon is not a ruler-straight edge
  const hor = h * 0.5
  for (const [amp, base, col] of [[0.028, 0.012, 'rgba(121,150,120,0.85)'], [0.02, 0.006, 'rgba(84,118,80,0.95)']] as [number, number, string][]) {
    const ph = rnd() * 6
    g.fillStyle = col
    g.beginPath()
    g.moveTo(0, hor + 4)
    for (let x = 0; x <= w; x += 3) {
      const u = (x / w) * Math.PI * 2
      const n = Math.sin(u * 7 + ph) * 0.4 + Math.sin(u * 19 + ph * 2) * 0.3 + Math.sin(u * 53 + ph) * 0.2 + Math.sin(u * 131) * 0.1
      g.lineTo(x, hor - h * (base + amp * (0.5 + 0.5 * n)))
    }
    g.lineTo(w, hor + 4)
    g.closePath()
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.mapping = THREE.EquirectangularReflectionMapping
  return t
}

/** Small environment for image-based light: bright sky above, warm beige below (bounce off floors) so ceilings do not pick up lawn green. */
function makeEnvTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 64)
  for (const [p, col] of [[0, '#a9c4e0'], [0.4, '#dbe4ea'], [0.5, '#f2f0ea'], [0.52, '#e2dccf'], [1, '#cdc3b2']] as [number, string][]) grad.addColorStop(p, col)
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.mapping = THREE.EquirectangularReflectionMapping
  return t
}

function makeLawnTexture(): THREE.CanvasTexture {
  const s = 512
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  g.fillStyle = '#7a9862'
  g.fillRect(0, 0, s, s)
  const rnd = seeded(3)
  // large soft patches (dry / lush) break up the flat colour; drawn wrapped so the texture tiles
  for (let i = 0; i < 40; i++) {
    const x = rnd() * s, y = rnd() * s, r = 30 + rnd() * 70
    const col = rnd() < 0.5 ? '84,112,62' : '150,172,100'
    for (const [ox, oy] of [[0, 0], [-s, 0], [s, 0], [0, -s], [0, s]]) {
      const rg = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
      rg.addColorStop(0, `rgba(${col},0.16)`)
      rg.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = rg
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
    }
  }
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(80,104,62,0.22)' : 'rgba(160,178,116,0.2)'
    g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 2 + rnd() * 5)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(30, 30)
  t.anisotropy = 4
  return t
}

/** Leafy blob on a transparent canvas (dark underside, sunlit top): the alpha card that crowns are made of. */
function makeFoliageTexture(): THREE.CanvasTexture {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const rnd = seeded(5)
  for (let i = 0; i < 900; i++) {
    // leaf clusters scattered inside an ellipse, denser in the middle
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 0.46
    const x = s / 2 + Math.cos(a) * d * s, y = s / 2 + Math.sin(a) * d * s * 0.88
    const up = 1 - y / s // 1 at the top
    const l = 50 + up * 18 + rnd() * 10
    g.fillStyle = `hsl(${86 + rnd() * 24},${30 + rnd() * 14}%,${l}%)`
    g.beginPath()
    g.ellipse(x, y, 3 + rnd() * 5, 2 + rnd() * 3.5, rnd() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// ---------------------------------------------------------------- fake AO (merged meshes, vertex alpha)
type V3 = [number, number, number]
class AoBuilder {
  pos: number[] = []
  col: number[] = []
  idx: number[] = []
  /** quad p0-p1-p2-p3 (in order around the quad) with one alpha per corner */
  quad(p: V3[], a: number[]): void {
    const n = this.pos.length / 3
    for (let i = 0; i < 4; i++) {
      this.pos.push(p[i][0], p[i][1], p[i][2])
      this.col.push(0.03, 0.022, 0.016, a[i])
    }
    this.idx.push(n, n + 1, n + 2, n, n + 2, n + 3)
  }
  mesh(name: string): THREE.Mesh {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 4)) // rgba -> USE_COLOR_ALPHA
    g.setIndex(this.idx)
    const m = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: true,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    })
    const mesh = new THREE.Mesh(g, m)
    mesh.name = name
    mesh.renderOrder = 2
    mesh.userData.noShadow = true
    return mesh
  }
}

const EASE = Array.from({ length: 9 }, (_, i) => { const t = 1 - i / 8; return t * t * (3 - 2 * t) }) // smoothstep 1 -> 0 over 8 steps: no visible banding, no texture
const lerp3 = (p: V3, q: V3, t: number): V3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]

/** Strip from edge A (a0->a1) fading from `peak` to 0 at edge B (b0->b1) in several eased steps. */
function fadeStrip(b: AoBuilder, a0: V3, a1: V3, b0: V3, b1: V3, peak: number): void {
  const n = EASE.length - 1
  for (let i = 0; i < n; i++) {
    b.quad([lerp3(a0, b0, i / n), lerp3(a1, b1, i / n), lerp3(a1, b1, (i + 1) / n), lerp3(a0, b0, (i + 1) / n)],
      [peak * EASE[i], peak * EASE[i], peak * EASE[i + 1], peak * EASE[i + 1]])
  }
}

function roomMinSide(id: string): number {
  const r = rooms.find((q) => q.id === id)
  if (!r) return 0
  const xs = r.polygon.map((p) => p.x), zs = r.polygon.map((p) => p.z)
  return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs))
}

function buildFakeAo(): { floor: THREE.Mesh; ceiling: THREE.Mesh; corners: THREE.Mesh; outside: THREE.Mesh } {
  const fl = new AoBuilder(), ce = new AoBuilder(), co = new AoBuilder(), ou = new AoBuilder()
  const Y = 0.006, YC = WALL_HEIGHT - 0.006, WOFF = 0.01 // strips on the wall face sit 1 cm off it (no z-fight)
  const FOOT_A = 0.9, CEIL_A = 0.62, CORNER_A = 0.9, TOP_A = 0.34 // round 3: about 1.5-2x deeper and wider bands (flat-look fix)
  const DOORS = openings.filter((o) => o.type !== 'window')

  // wall feet + ceiling edges
  for (const w of walls) {
    const horiz = w.a.z === w.b.z
    const c = horiz ? w.a.z : w.a.x
    const lo = horiz ? Math.min(w.a.x, w.b.x) : Math.min(w.a.z, w.b.z)
    const hi = horiz ? Math.max(w.a.x, w.b.x) : Math.max(w.a.z, w.b.z)
    // spans cut by doors (no dark line across thresholds)
    const cuts = DOORS.filter((o) => o.wall === w.id)
      .map((o) => { const p = horiz ? o.at.x : o.at.z; return [p - o.width / 2 - 0.05, p + o.width / 2 + 0.05] })
      .sort((a, b) => a[0] - b[0])
    const spans: [number, number][] = []
    let cur = lo
    for (const [s0, s1] of cuts) { if (s0 > cur) spans.push([cur, s0]); cur = Math.max(cur, s1) }
    if (hi > cur) spans.push([cur, hi])
    for (const side of [-1, 1]) {
      const face = c + side * w.t / 2
      const mid = (lo + hi) / 2
      const probe = face + side * 0.05
      const r = horiz ? roomAt(mid, probe) : roomAt(probe, mid)
      if (!r) { // outside face of an exterior wall: soft contact shadow on the lawn
        const far = face + side * 0.6
        const outer = horiz ? !roomAt(mid, far) : !roomAt(far, mid)
        if (outer) {
          const atO = (s: number, off: number): V3 => (horiz ? [s, -0.02, face + side * off] : [face + side * off, -0.02, s])
          fadeStrip(ou, atO(lo, 0), atO(hi, 0), atO(lo, 1.1), atO(hi, 1.1), 0.5)
        }
        continue
      }
      const minSide = roomMinSide(r.id)
      const at = (s: number, y: number, off: number): V3 => (horiz ? [s, y, face + side * off] : [face + side * off, y, s])
      const wf = Math.min(1.15, 0.4 * minSide)
      for (const [s0, s1] of spans) fadeStrip(fl, at(s0, Y, 0), at(s1, Y, 0), at(s0, Y, wf), at(s1, Y, wf), FOOT_A)
      if (minSide >= 2) { // narrow rooms: strips from opposite walls would cover the whole ceiling
        const wc = Math.min(1.1, 0.38 * minSide)
        fadeStrip(ce, at(lo, YC, 0), at(hi, YC, 0), at(lo, YC, wc), at(hi, YC, wc), CEIL_A)
        // far walls fade slightly darker towards the ceiling (skips doors and windows: the strip would dim the glass)
        const tcuts = openings.filter((o) => o.wall === w.id)
          .map((o) => { const pp = horiz ? o.at.x : o.at.z; return [pp - o.width / 2 - 0.05, pp + o.width / 2 + 0.05] })
          .sort((a, b) => a[0] - b[0])
        let tc = lo
        const tspans: [number, number][] = []
        for (const [s0, s1] of tcuts) { if (s0 > tc) tspans.push([tc, s0]); tc = Math.max(tc, s1) }
        if (hi > tc) tspans.push([tc, hi])
        for (const [s0, s1] of tspans) fadeStrip(ce, at(s0, YC, WOFF), at(s1, YC, WOFF), at(s0, YC - 1.5, WOFF), at(s1, YC - 1.5, WOFF), TOP_A)
      }
    }
  }

  // vertical strips in inside corners (room polygon = wall faces; only where both edges are real walls)
  const wallOfEdge = (px: number, pz: number, qx: number, qz: number): (typeof walls)[number] | null => {
    const horiz = Math.abs(pz - qz) < 1e-6, vert = Math.abs(px - qx) < 1e-6
    if (!horiz && !vert) return null
    const coord = horiz ? pz : px, mid = horiz ? (px + qx) / 2 : (pz + qz) / 2
    for (const w of walls) {
      if ((w.a.z === w.b.z) !== horiz) continue
      const wc = horiz ? w.a.z : w.a.x
      const lo = horiz ? Math.min(w.a.x, w.b.x) : Math.min(w.a.z, w.b.z)
      const hi = horiz ? Math.max(w.a.x, w.b.x) : Math.max(w.a.z, w.b.z)
      if (Math.abs(Math.abs(coord - wc) - w.t / 2) < 0.02 && mid >= lo - 0.01 && mid <= hi + 0.01) return w
    }
    return null
  }
  for (const r of rooms) {
    const P = r.polygon
    let area = 0
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a.x * b.z - b.x * a.z }
    const sgn = Math.sign(area) || 1
    for (let i = 0; i < P.length; i++) {
      const p = P[(i + P.length - 1) % P.length], v = P[i], n = P[(i + 1) % P.length]
      const cross = (v.x - p.x) * (n.z - v.z) - (v.z - p.z) * (n.x - v.x)
      if (cross * sgn <= 1e-6) continue // reflex or straight vertex
      for (const other of [p, n]) {
        const dx = other.x - v.x, dz = other.z - v.z, L = Math.hypot(dx, dz)
        if (L < 0.5) continue
        // test the stretch next to the vertex (not the edge midpoint): edges can be part wall, part open passage
        const wall = wallOfEdge(v.x, v.z, v.x + (dx / L) * 0.4, v.z + (dz / L) * 0.4)
        if (!wall) continue
        // skip if a door/window sits at the corner
        if (openings.some((o) => o.wall === wall.id && Math.hypot(o.at.x - v.x, o.at.z - v.z) < o.width / 2 + 0.3)) continue
        // inward normal = right of the polygon travel direction (polygon is clockwise on the plan for sgn > 0)
        const tx = other === n ? dx : -dx, tz = other === n ? dz : -dz
        const nx = (-tz / L) * sgn, nz = (tx / L) * sgn
        const wcl = Math.min(0.42, L * 0.4), off = 0.006
        const a0: V3 = [v.x + nx * off, 0.02, v.z + nz * off], a1: V3 = [a0[0], WALL_HEIGHT - 0.02, a0[2]]
        const b0: V3 = [a0[0] + (dx / L) * wcl, 0.02, a0[2] + (dz / L) * wcl], b1: V3 = [b0[0], WALL_HEIGHT - 0.02, b0[2]]
        fadeStrip(co, a0, a1, b0, b1, CORNER_A)
      }
    }
  }

  // contact shadows under furniture (skip rugs, on-top items, raised pieces, door thresholds)
  const rugs = furniture.filter((f) => f.type === 'rug').map(footprint)
  const alphaOf = (t: string) => (/bed|sofa|wardrobe|dresser|sideboard|kitchen|bath|tv-unit/.test(t) ? 0.66 : /table|desk/.test(t) ? 0.42 : /chair/.test(t) ? 0.46 : 0.5)
  const nearDoor = (r: { x0: number; z0: number; x1: number; z1: number }, m: number) => DOORS.some((o) => {
    const wall = walls.find((w) => w.id === o.wall)
    if (!wall) return false
    const horiz = wall.a.z === wall.b.z, hw = o.width / 2 + 0.1, d = 0.95
    const q = horiz ? { x0: o.at.x - hw, x1: o.at.x + hw, z0: o.at.z - d, z1: o.at.z + d } : { x0: o.at.x - d, x1: o.at.x + d, z0: o.at.z - hw, z1: o.at.z + hw }
    return r.x0 - m < q.x1 && r.x1 + m > q.x0 && r.z0 - m < q.z1 && r.z1 + m > q.z0
  })
  const PAD = 0.42
  for (const f of furniture) {
    if (f.type === 'rug' || f.onTopOf || f.y > 0.05 || f.type === 'flue' || f.type === 'tv') continue
    const r = footprint(f)
    if (nearDoor(r, PAD)) continue
    const onRug = rugs.some((q) => f.x > q.x0 && f.x < q.x1 && f.z > q.z0 && f.z < q.z1)
    const y = onRug ? 0.024 : Y
    const a = alphaOf(f.type)
    const ring = (m: number): V3[] => [[r.x0 - m, y, r.z0 - m], [r.x1 + m, y, r.z0 - m], [r.x1 + m, y, r.z1 + m], [r.x0 - m, y, r.z1 + m]]
    const rings = EASE.map((_, k) => ring((PAD * k) / (EASE.length - 1)))
    for (let k = 0; k < rings.length - 1; k++) {
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4
        fl.quad([rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]], [a * EASE[k], a * EASE[k], a * EASE[k + 1], a * EASE[k + 1]])
      }
    }
    fl.quad(ring(0), [a, a, a, a])
  }
  return { floor: fl.mesh('lighting:ao-floor'), ceiling: ce.mesh('lighting:ao-ceiling'), corners: co.mesh('lighting:ao-corners'), outside: ou.mesh('lighting:ao-outside') }
}


// ---------------------------------------------------------------- draw-call merge + material trims
/**
 * Merge all opaque furniture meshes that share one material (across rooms) into a single mesh: ~180 furniture draws -> ~60, and the sun shadow
 * pass draws them again, so the saving counts twice. Furniture is static and sits at the world origin (bake() in furniture/shared.ts).
 * ponytail: no per-room frustum culling afterwards (whole-house meshes), fine at ~160k triangles.
 */
function mergeFurniture(scene: THREE.Scene): void {
  const root = scene.getObjectByName('furniture')
  if (!root) return
  root.updateMatrixWorld(true)
  const buckets = new Map<THREE.Material, THREE.Mesh[]>()
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return
    const m = o.material as THREE.Material
    if (m.transparent || o.userData.noMerge || !o.geometry.attributes.position) return
    const list = buckets.get(m)
    if (list) list.push(o); else buckets.set(m, [o])
  })
  buckets.forEach((meshes, mat) => {
    if (meshes.length < 2) return
    const sig = (g: THREE.BufferGeometry) => Object.keys(g.attributes).sort().join() + (g.index ? 'i' : 'n')
    const groups = new Map<string, THREE.Mesh[]>()
    for (const m of meshes) { const k = sig(m.geometry); const l = groups.get(k); if (l) l.push(m); else groups.set(k, [m]) }
    groups.forEach((list) => {
      if (list.length < 2) return
      const gs = list.map((m) => { const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); return g })
      const merged = mergeGeometries(gs, false)
      gs.forEach((g) => g.dispose())
      if (!merged) return
      const out = new THREE.Mesh(merged, mat)
      out.name = `furniture:merged:${mat.name || 'mat'}`
      out.castShadow = list[0].castShadow
      out.receiveShadow = list[0].receiveShadow
      root.add(out)
      for (const m of list) { m.parent?.remove(m); m.geometry.dispose() }
    })
  })
}

/** Black lacquer (vertex-colour tint materials) is lifted to a dark grey so it keeps form under the soft light instead of a flat black hole. */
function liftBlacks(scene: THREE.Scene): void {
  const c = new THREE.Color()
  scene.getObjectByName('furniture')?.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const col = o.geometry.attributes.color as THREE.BufferAttribute | undefined
    if (!col || col.itemSize !== 3) return
    const floor = o.parent?.name.includes('kind-links') ? 0.07 : 0.012 // linear
    let touched = false
    for (let i = 0; i < col.count; i++) {
      c.setRGB(col.getX(i), col.getY(i), col.getZ(i))
      const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
      if (l < floor) { const k = l > 0 ? floor / l : 0; col.setXYZ(i, l > 0 ? c.r * k : floor, l > 0 ? c.g * k : floor, l > 0 ? c.b * k : floor); touched = true }
    }
    if (touched) col.needsUpdate = true
  })
}

/** Garden panorama seen through doors/windows: pull it towards the sky colour so it reads as distance (atmospheric haze), not a flat painted band. */
function hazeBackdrop(scene: THREE.Scene): void {
  const m = (scene.getObjectByName('backdrop:panorama') as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined
  if (!m) return
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.95, 1.02, 1.08), 0.12);\n#include <dithering_fragment>')
  }
  m.color.setRGB(0.92, 0.92, 0.92) // window plane about 1.5-2x the wall luminance after tone mapping: bright but not clipped, the tree / lawn contrast survives
  m.needsUpdate = true
}

/** Baked-looking vertical gradient for large flat fronts (wardrobes): darker at the floor and under the ceiling, lighter in between. */
function heightGradient(m: THREE.MeshStandardMaterial): void {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vGradY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGradY = (modelMatrix * vec4(position, 1.0)).y;')
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGradY;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(0.5, 1.0, smoothstep(0.0, 0.7, vGradY)) * mix(0.8, 1.0, smoothstep(2.45, 1.7, vGradY));')
  }
  m.customProgramCacheKey = () => 'heightGradient'
  m.needsUpdate = true
}

/** Small material trims that belong to lighting (glare / overexposure), applied once by name. */
function trimMaterials(scene: THREE.Scene): void {
  const done = new Set<THREE.Material>()
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (done.has(m) || !(m instanceof THREE.MeshStandardMaterial)) continue
      done.add(m)
      if (m.name === 'curtain-sheer' || m.name === 'lace-net') { m.emissiveIntensity = 0.03; m.color.setRGB(0.5, 0.5, 0.5) } // sun (30) falls straight on the cloth: dim the albedo so it stays white-grey with visible folds instead of clipping // was // was 0.6-0.9: bloom sparkle dots on the lace
      else if (m.name === 'curtain-voile') { m.emissiveIntensity = 0.03; m.color.setRGB(0.5, 0.5, 0.52); m.opacity = 0.92 } // translucent, folds stay visible (the alpha + colour bands carry the shading)
      else if (m.name === 'tile-bath') { m.roughnessMap = null; m.roughness = 0.8; m.envMapIntensity = 0.25; m.needsUpdate = true } // no glaze hot spot from the ceiling lamp // blotchy specular glare on the WC wall
      else if (m.name === 'mirror') m.envMapIntensity = 0.4
      else if (m.name === 'wardrobe-dark') { m.color.setRGB(0.3, 0.3, 0.32); m.emissive.setRGB(0.075, 0.075, 0.082); m.roughness = 0.75; m.envMapIntensity = 2.2; heightGradient(m) } // charcoal, not a black hole at 0.7 m
      else if (m.name === 'paint-green') { m.color.multiplyScalar(1.2); m.emissive.setRGB(0.01, 0.03, 0.012); m.envMapIntensity = 2; heightGradient(m) } // dark green wardrobes: form stays readable, no black hole
      else if (m.name === 'furn-white' || m.name === 'furn-white-grain' || m.name === 'white-mdf') {
        m.color.multiplyScalar(0.93) // pure white blew out and read flat
        m.roughness = Math.max(m.roughness, 0.6)
        if (m instanceof THREE.MeshPhysicalMaterial) m.clearcoat = Math.min(m.clearcoat, 0.1)
      } else if (m.map && m.emissiveMap === m.map && m.roughness < 0.1) m.emissiveIntensity = Math.min(m.emissiveIntensity, 0.25) // fake mirrors
    }
  })
}

// ---------------------------------------------------------------- level detection
function detectLevel(renderer: THREE.WebGLRenderer): { level: number; forced: boolean } {
  const params = new URLSearchParams(window.location.search)
  const q = params.get('q')
  const named: Record<string, number> = { high: 0, medium: 2, low: 3 }
  if (q !== null) {
    const n = q in named ? named[q] : Number(q)
    // ?q=N pins the level; add &auto=1 to keep the fps step-down active (used to test the fallback path on software GL)
    if (Number.isFinite(n)) return { level: Math.max(0, Math.min(4, Math.round(n))), forced: params.get('auto') !== '1' }
  }
  try { // level chosen with the on-screen quality button
    const manual = Number(sessionStorage.getItem(MANUAL_KEY))
    if (sessionStorage.getItem(MANUAL_KEY) !== null && Number.isFinite(manual)) return { level: Math.max(0, Math.min(4, manual)), forced: true }
  } catch { /* storage unavailable */ }
  const gl = renderer.getContext()
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  const gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
  if (/swiftshader|llvmpipe|software/i.test(gpu)) return { level: 2, forced: true } // software GL: never auto-step
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || window.matchMedia('(pointer: coarse)').matches
  let level = mobile ? 3 : 1 // level 0 (GTAO + area lights, ~35 fps on an M3 Pro) only on explicit request: ?q=0 / ?q=high
  if (!mobile) {
    const cores = navigator.hardwareConcurrency || 4
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    if (cores <= 4 || mem <= 4) level = 2
  }
  try { // level this device had to drop to earlier in this tab (see step-down below)
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null') as { level: number; t: number } | null
    if (saved && Date.now() - saved.t < STORE_TTL && saved.level > level) level = Math.min(4, saved.level)
  } catch { /* storage unavailable */ }
  return { level, forced: false }
}

// ---------------------------------------------------------------- main
export function setupLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera): Lighting {
  const start = detectLevel(renderer)
  let level = start.level
  const auto = !start.forced

  // renderer
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = EXPOSURE
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.autoUpdate = false // static scene: shadow maps are re-rendered on demand (needsUpdate), not every frame
  renderer.shadowMap.needsUpdate = true
  // r170: shadow.radius only has an effect with PCFShadowMap / VSMShadowMap (PCFSoft has a fixed kernel). VSM was tried and rejected: it leaks sun light through the thin walls.
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.info.autoReset = false // postfx renders several passes per frame; stats() should sum them
  const dpr = renderer.getPixelRatio() // cap chosen by buildScene

  // sky dome (camera-following so it never parallaxes) + environment. Colour > 1: the sky reads brighter than the room and feeds bloom.
  const skyTex = makeSkyTexture(level >= 3 ? 1024 : 2048, level >= 3 ? 512 : 1024)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(95, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, color: new THREE.Color(1.5, 1.5, 1.5), side: THREE.BackSide, fog: false, depthWrite: false }),
  )
  sky.name = 'lighting:sky'
  sky.renderOrder = -1000
  sky.frustumCulled = false
  sky.userData.noShadow = true
  scene.add(sky)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = makeEnvTexture()
  const envRT = pmrem.fromEquirectangular(envTex)
  envTex.dispose()
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.2
  pmrem.dispose()

  // lawn + scenery
  const lawnTex = makeLawnTexture()
  const groundMat = new THREE.MeshStandardMaterial({ map: lawnTex, roughness: 1, envMapIntensity: 0.5, emissive: 0xffffff, emissiveMap: lawnTex, emissiveIntensity: 0.3 })
  const ground = new THREE.Mesh(new THREE.CircleGeometry(92, 48), groundMat)
  ground.name = 'lighting:ground'
  ground.rotation.x = -Math.PI / 2
  ground.position.set((FOOTPRINT.x0 + FOOTPRINT.x1) / 2, -0.03, (FOOTPRINT.z0 + FOOTPRINT.z1) / 2)
  ground.receiveShadow = true
  ground.userData.noShadow = true
  scene.add(ground)
  const foliageTex = makeFoliageTexture()
  const scenery = new THREE.Group() // leaf-card trees/hedges removed: the window view is the painted panorama (backdrop.ts)
  scene.add(scenery)
  scene.fog = new THREE.Fog(HAZE, 40, 110) // treeline and lawn turn hazy / bright with distance; the lawn edge dissolves into the horizon

  // sun with fitted shadow frustum
  const cx = (FOOTPRINT.x0 + FOOTPRINT.x1) / 2, cz = (FOOTPRINT.z0 + FOOTPRINT.z1) / 2
  /** Fit an orthographic shadow frustum tightly around the house (wall tops projected onto the lawn included, so the house shadow is covered). */
  const fitShadow = (light: THREE.DirectionalLight, dir: THREE.Vector3): void => {
    light.position.set(cx, 0, cz).addScaledVector(dir, 50)
    light.target.position.set(cx, 0, cz)
    const cam = light.shadow.camera
    cam.position.copy(light.position)
    cam.lookAt(light.target.position)
    cam.updateMatrixWorld()
    const pts: THREE.Vector3[] = []
    for (const x of [FOOTPRINT.x0 - 0.2, FOOTPRINT.x1 + 0.2]) for (const z of [FOOTPRINT.z0 - 0.2, FOOTPRINT.z1 + 0.2]) for (const y of [0, WALL_HEIGHT + 0.3]) {
      const p = new THREE.Vector3(x, y, z)
      pts.push(p, p.clone().addScaledVector(dir, -p.y / dir.y))
    }
    let l = Infinity, r = -Infinity, b = Infinity, t = -Infinity, n = Infinity, f = -Infinity
    for (const p of pts) {
      p.applyMatrix4(cam.matrixWorldInverse)
      l = Math.min(l, p.x); r = Math.max(r, p.x); b = Math.min(b, p.y); t = Math.max(t, p.y)
      n = Math.min(n, -p.z); f = Math.max(f, -p.z)
    }
    cam.left = l; cam.right = r; cam.bottom = b; cam.top = t
    cam.near = Math.max(0.5, n - 2); cam.far = f + 2
    cam.updateProjectionMatrix()
  }
  const sun = new THREE.DirectionalLight(0xffecd0, 3.4)
  sun.castShadow = true
  sun.shadow.bias = -0.0006
  sun.shadow.normalBias = 0.05
  scene.add(sun, sun.target)
  fitShadow(sun, SUN_DIR)
  // weak cool skylight from the north: a second, soft shadow caster, so furniture also throws shadows in rooms the sun never reaches (N/E windows)
  const skyLight = new THREE.DirectionalLight(0xd6e4fa, 2)
  skyLight.castShadow = true
  skyLight.shadow.bias = -0.0008
  skyLight.shadow.normalBias = 0.08
  skyLight.shadow.radius = 7
  scene.add(skyLight, skyLight.target)
  fitShadow(skyLight, SKY_DIR)
  // Roof: shadow-only box over the house. The ceiling is a single-sided plane and casts nothing, so without this the sun shone through the roof,
  // lit the wall tops and made a serrated shadow fringe under the cornice. Invisible to the camera; off in dollhouse/top mode.
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(FOOTPRINT.x1 - FOOTPRINT.x0 + 0.4, 0.3, FOOTPRINT.z1 - FOOTPRINT.z0 + 0.4),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }),
  )
  roof.name = 'lighting:roof'
  roof.position.set(cx, WALL_HEIGHT + 0.18, cz)
  roof.castShadow = true
  roof.frustumCulled = false
  roof.renderOrder = -999
  scene.add(roof)

  // hemisphere: warm bounce from the floor, soft sky from above (kept low: the window lights give the direction)
  const hemi = new THREE.HemisphereLight(0xf7f5ef, 0xd8d0c2, HEMI)
  scene.add(hemi)

  // ---- light pool. Every light below is first described as a "virtual light" (room, pose, colour, reach). Only a handful of real
  // SpotLight / PointLight objects exist (SLOTS per quality level); each frame they are handed to the virtual lights nearest to the camera
  // (fading over 0.3 s). So the shaders always carry ~9 lights, however many lights the house has. Overview modes: pool off, sun + hemisphere only.
  interface VLight { kind: 'spot' | 'point'; room: string; pos: THREE.Vector3; target: THREE.Vector3; color: number; intensity: number; distance: number; angle: number; penumbra: number; decay: number }
  const vls: VLight[] = []
  const addSpot = (room: string, pos: THREE.Vector3, target: THREE.Vector3, color: number, intensity: number, distance: number, angle: number, penumbra: number, decay: number): void => {
    vls.push({ kind: 'spot', room, pos, target, color, intensity, distance, angle, penumbra, decay })
  }
  const addPoint = (room: string, pos: THREE.Vector3, color: number, intensity: number, distance: number, decay: number): void => {
    vls.push({ kind: 'point', room, pos, target: pos, color, intensity, distance, angle: 0, penumbra: 0, decay })
  }

  // window lights: windows next to each other on one wall share one light. Sun side (S/W) warmer and stronger. A spot (not a point light) 0.5 m inside the
  // glass, aimed down-inward: a soft daylight pool on the floor 1-2.5 m in front of the glass, bright near the window, dark at the far wall.
  {
    const groups: Opening[][] = []
    for (const o of openings.filter((q) => q.type === 'window')) {
      const wall = walls.find((w) => w.id === o.wall)
      if (!wall) continue
      const horiz = wall.a.z === wall.b.z
      const g = groups.find((q) => q[0].wall === o.wall && q[0].rooms[0] === o.rooms[0] &&
        q.some((m) => Math.abs(horiz ? m.at.x - o.at.x : m.at.z - o.at.z) < (m.width + o.width) / 2 + 1.0))
      if (g) g.push(o); else groups.push([o])
    }
    for (const g of groups) {
      const o0 = g[0]
      const room = rooms.find((r) => r.id === o0.rooms[0])
      const wall = walls.find((w) => w.id === o0.wall)
      if (!room || !wall || (o0.rooms[0] === 'bad')) continue // the bath gets its own daylight cone (dressing.ts)
      const horiz = wall.a.z === wall.b.z
      const along = (o: Opening) => (horiz ? o.at.x : o.at.z)
      const lo = Math.min(...g.map((o) => along(o) - o.width / 2)), hi = Math.max(...g.map((o) => along(o) + o.width / 2))
      const mid = (lo + hi) / 2
      const rc = room.polygon.reduce((a, p) => ({ x: a.x + p.x / room.polygon.length, z: a.z + p.z / room.polygon.length }), { x: 0, z: 0 })
      const inward = horiz ? new THREE.Vector3(0, 0, Math.sign(rc.z - o0.at.z)) : new THREE.Vector3(Math.sign(rc.x - o0.at.x), 0, 0)
      const sunny = inward.dot(SUN_DIR) < 0 // the room looks away from the sun => this window faces it
      const y = o0.sill + o0.height / 2
      const c = horiz ? new THREE.Vector3(mid, y, o0.at.z) : new THREE.Vector3(o0.at.x, y, mid)
      const pos = c.clone().addScaledVector(inward, wall.t / 2 + 0.5)
      pos.y = Math.min(y, 1.6)
      const target = c.clone().addScaledVector(inward, wall.t / 2 + 1.8)
      target.y = 0
      addSpot(o0.rooms[0], pos, target, sunny ? 0xfff0dc : 0xeaf1fb, sunny ? 17 : 10, 9, 1.2, 1, 1.6)
    }
  }

  // Soft ceiling-lamp fills for windowless rooms (spot straight down at the room centre; deliberately dim, the plaster is close to white).
  const FILL: Record<string, [number, number]> = { 'flur-links': [2.2, 4], 'flur-rechts': [1.6, 3], bad: [4.6, 4.5], wc: [3.2, 3.4], abstell: [1.8, 3], kamin: [1.4, 3], 'kind-mitte': [1.9, 3.6], 'kind-links': [1.4, 4] }
  for (const id of Object.keys(FILL)) {
    const r = rooms.find((q) => q.id === id)
    if (!r) continue
    const xs = r.polygon.map((p) => p.x), zs = r.polygon.map((p) => p.z)
    const sx = Math.max(...xs) - Math.min(...xs), sz = Math.max(...zs) - Math.min(...zs)
    const n = Math.max(1, Math.round(Math.max(sx, sz) / 3.5)) // long corridor: one lamp per ~3.5 m
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const px = sx >= sz ? Math.min(...xs) + sx * t : Math.min(...xs) + sx / 2
      const pz = sx >= sz ? Math.min(...zs) + sz / 2 : Math.min(...zs) + sz * t
      const [is, reach] = FILL[id]
      addSpot(id, new THREE.Vector3(px, WALL_HEIGHT - 0.05, pz), new THREE.Vector3(px, 0, pz), 0xfff0e2, is / n, reach, 1.25, 1, 0.7)
    }
  }

  // Bounce fills: one weak point light at head height in the middle of the bigger rooms lifts the far walls a little (window spots are distance-limited).
  for (const [id, inten] of [['kueche', 1.7], ['wohnen', 2.1], ['schlafen', 2.4], ['kind-links', 2.1], ['kind-mitte', 1.5]] as [string, number][]) {
    const r = rooms.find((q) => q.id === id)
    if (!r) continue
    const xs = r.polygon.map((p) => p.x), zs = r.polygon.map((p) => p.z)
    addPoint(id, new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, 1.75, (Math.min(...zs) + Math.max(...zs)) / 2), 0xfff1e4, inten, 9, 2)
  }

  // Wall wash on the Wohnen mural wall (TV wall, x = kmeE): a dark photo print would otherwise be the darkest thing in the house. Two soft spots from the room side.
  for (const z of [6.9, 8.9]) {
    addSpot('wohnen', new THREE.Vector3(LAYOUT.kmeE + 1.9, WALL_HEIGHT - 0.1, z), new THREE.Vector3(LAYOUT.kmeE, 1.2, z), 0xfff1e2, 7, 5.5, 1.0, 1, 2)
  }

  // fixtures + window dressing (pendants, table lamp, ceiling lamps, frosted bath window, curtains): after the furniture, so it can skip what exists
  const dressing = buildDressing(scene)
  dressing.bathSpot?.color.set(0xf6f2ea) // was a cold blue: bath walls read grey-blue next to the warm house
  {
    // dressing.ts creates its own warm lights (pendants, worklight, table lamp, bath daylight cone): move them into the pool
    const found: THREE.Light[] = []
    dressing.group.traverse((o) => { if (o instanceof THREE.PointLight || o instanceof THREE.SpotLight) found.push(o) })
    for (const l of found) {
      const pos = l.getWorldPosition(new THREE.Vector3())
      const room = roomAt(pos.x, pos.z)?.id ?? ''
      if (l instanceof THREE.SpotLight) addSpot(room, pos, l.target.getWorldPosition(new THREE.Vector3()), l.color.getHex(), l.intensity, l.distance, l.angle, l.penumbra, l.decay)
      else addPoint(room, pos, l.color.getHex(), (l as THREE.PointLight).intensity, (l as THREE.PointLight).distance, (l as THREE.PointLight).decay)
      l.parent?.remove(l)
      if (l instanceof THREE.SpotLight) l.target.parent?.remove(l.target)
    }
  }
  scene.add(dressing.group)

  hazeBackdrop(scene)
  liftBlacks(scene)
  mergeFurniture(scene)
  trimMaterials(scene)

  // fake AO
  const ao = buildFakeAo()
  scene.add(ao.floor, ao.ceiling, ao.corners, ao.outside)
  const aoMats = [ao.floor, ao.ceiling, ao.corners, ao.outside].map((m) => m.material as THREE.MeshBasicMaterial)

  // ---- shadow flags
  let flagged = -1
  let shadowDirty = true
  function refreshShadows(): void {
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o.userData.noShadow || o.name.startsWith('lighting:')) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const glassy = mats.some((m) => m.transparent) // glass, voile, lace: let the sun through
      o.castShadow = !glassy && !o.name.startsWith('floor:') && !o.name.startsWith('rug')
      o.receiveShadow = !glassy // sheer curtains picked up a stair-stepped shadow from the folds / frame: they are translucent, so no shadow receiving
    })
    flagged = scene.children.length
    shadowDirty = true
    // garden hedges / trees (geometry.ts) are seen from inside on their shadow side: lift them towards a hazy, sunlit green so the window views read as daylight
    const gm = (scene.getObjectByName('exterior:garden-foliage') as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined
    if (gm && gm.emissive) { gm.emissive.set(0x8aa574); gm.emissiveIntensity = 0.75 }
  }
  refreshShadows()

  // ---- light pool (see the virtual-light comment above): a fixed number of real lights per quality level, reassigned to the lights nearest the camera
  interface Slot { light: THREE.SpotLight | THREE.PointLight; target: THREE.Object3D | null; vl: VLight | null; k: number }
  const slots: Slot[] = []
  const makeSlots = (n: number, kind: 'spot' | 'point'): void => {
    for (let i = 0; i < n; i++) {
      const light = kind === 'spot' ? new THREE.SpotLight(0xffffff, 0) : new THREE.PointLight(0xffffff, 0)
      light.name = `lighting:pool:${kind}:${i}`
      const target = kind === 'spot' ? (light as THREE.SpotLight).target : null
      scene.add(light)
      if (target) scene.add(target)
      slots.push({ light, target, vl: null, k: 0 })
    }
  }
  makeSlots(SLOTS[0][0], 'spot')
  makeSlots(SLOTS[0][1], 'point')
  const camPos = new THREE.Vector3()
  let camRoom = ''
  /** Hand the pool to the virtual lights nearest to the camera (same room first); fade a slot out before it is re-pointed so nothing pops. */
  function updatePool(dt: number, on: boolean): void {
    camera.getWorldPosition(camPos)
    camRoom = roomAt(camPos.x, camPos.z)?.id ?? camRoom
    for (const kind of ['spot', 'point'] as const) {
      const all = slots.filter((sl) => (sl.light instanceof THREE.SpotLight) === (kind === 'spot'))
      for (const sl of all) if (!sl.light.visible) sl.light.intensity = 0
      const mine = all.filter((sl) => sl.light.visible)
      const want = vls.filter((v) => v.kind === kind)
        .map((v) => ({ v, score: v.pos.distanceTo(camPos) + (v.room === camRoom ? 0 : 3.5) }))
        .sort((p, q) => p.score - q.score).slice(0, mine.length).map((e) => e.v)
      const free = mine.filter((sl) => !sl.vl || !want.includes(sl.vl))
      const todo = want.filter((v) => !mine.some((sl) => sl.vl === v))
      for (const sl of mine) {
        if (sl.vl && want.includes(sl.vl)) { sl.k = on ? Math.min(1, sl.k + dt / 0.25) : 0; continue }
        sl.k = Math.max(0, sl.k - dt / 0.2)
        if (sl.k > 0 && on) continue
        const next = free.includes(sl) ? todo.shift() : undefined
        sl.vl = next ?? null
        if (next) {
          sl.light.position.copy(next.pos)
          sl.light.color.setHex(next.color)
          sl.light.distance = next.distance
          sl.light.decay = next.decay
          if (sl.light instanceof THREE.SpotLight && sl.target) { sl.light.angle = next.angle; sl.light.penumbra = next.penumbra; sl.target.position.copy(next.target) }
        }
      }
      for (const sl of mine) sl.light.intensity = sl.vl && on ? sl.vl.intensity * sl.k : 0
    }
  }

  // ---- quality
  let post: Post | null = null
  let postLoading = false
  let postReady: Promise<void> = Promise.resolve()
  let W = 1, H = 1
  let poolOn = true // off in dollhouse / top: sun + hemisphere only
  const applyLevel = (): void => {
    const shadowSize = SHADOW_SIZE[level]
    if (sun.shadow.mapSize.x !== shadowSize) {
      sun.shadow.mapSize.set(shadowSize, shadowSize)
      sun.shadow.map?.dispose()
      sun.shadow.map = null
    }
    const skySize = Math.max(512, shadowSize / 2)
    if (skyLight.shadow.mapSize.x !== skySize) {
      skyLight.shadow.mapSize.set(skySize, skySize)
      skyLight.shadow.map?.dispose()
      skyLight.shadow.map = null
    }
    skyLight.castShadow = level <= 1 // extra shadow pass (rendered once, see autoUpdate): strong tiers only
    skyLight.visible = level <= 1
    const pr = Math.min(dpr, PIXEL_RATIO[level])
    if (renderer.getPixelRatio() !== pr) { renderer.setPixelRatio(pr); renderer.setSize(W, H, false); post?.setSize(W, H) }
    dressing.setLevel(level)
    // pool size per level: lights above the limit are hidden (visible=false also removes them from the shader)
    const [nSpot, nPoint] = SLOTS[level]
    let si = 0, pi = 0
    for (const sl of slots) {
      const isSpot = sl.light instanceof THREE.SpotLight
      sl.light.visible = poolOn && (isSpot ? si++ < nSpot : pi++ < nPoint)
    }
    sun.shadow.radius = level <= 1 ? 8 : 5 // PCF tap spacing in texels: wider penumbra on the strong tiers
    shadowDirty = true
    if (level <= 1 && !post && !postLoading) {
      postLoading = true
      postReady = import('./postfx').then(({ createPost }) => {
        post = createPost(renderer, scene, camera, W, H, [ao.floor, ao.ceiling, ao.corners, ao.outside])
        post.setLevel(level)
      }).catch((e) => console.warn('[tour] postfx unavailable', e))
    }
    post?.setLevel(level)
  }

  // ---- render loop hook
  let ceilingObj: THREE.Object3D | undefined
  let manual = false
  let wasWalk: boolean | null = null
  // adaptive quality state. Frames are timed here (performance.now), NOT with the caller's clamped dt: a throttled rAF (background tab, 1 Hz) must not look like 1 fps of real load.
  const bestLevel = start.level // never step up past what this device was detected as
  let lastNow = performance.now(), acc = 0, frames = 0, bad = 0, good = 0, settle = 1.5, lastChange = -1e9
  const onVis = (): void => { lastNow = performance.now(); acc = 0; frames = 0; bad = 0; good = 0; settle = 2 }
  document.addEventListener('visibilitychange', onVis)
  const render = (dt: number): void => {
    ceilingObj ??= scene.getObjectByName('ceiling') ?? undefined
    if (flagged !== scene.children.length) refreshShadows()
    const walk = ceilingObj ? ceilingObj.visible : true
    if (walk !== wasWalk) { wasWalk = walk; shadowDirty = true; poolOn = walk; roof.visible = walk; applyLevel() }
    // overview (roof off): the open house is lit by the sun + hemisphere only (no pool lights, no window fills), lower exposure keeps the whites below clipping and
    // the low sun throws readable wall shadows across the rooms. Walk mode: the sun only enters through the window openings (strong, so its patches read like the photos).
    sun.intensity = walk ? 30 : 3.3
    renderer.toneMappingExposure = walk ? EXPOSURE : EXPOSURE_OVERVIEW
    groundMat.emissiveIntensity = walk ? 0.12 : 0.05 // overview: darker, greyer lawn so the house shadow reads and the lawn does not outshine the interior
    groundMat.color.setRGB(walk ? 0.42 : 0.62, walk ? 0.46 : 0.68, walk ? 0.4 : 0.6) // walk: the strong window sun would blow the lawn out to pale green
    skyLight.intensity = walk ? 2.0 : 0.5
    hemi.intensity = (level < 4 ? HEMI : HEMI + 0.3) + (walk ? 0 : 0.3)
    ao.ceiling.visible = walk
    // with GTAO on the fake AO is only a light extra; in overview keep the floor pads subtle so they never read as black shapes
    const base = level === 0 ? 0.75 : 1
    aoMats[0].opacity = base * (walk ? 1 : 0.5)
    aoMats[1].opacity = base
    aoMats[2].opacity = base * (walk ? 1 : 0.6)
    aoMats[3].opacity = walk ? 0.6 : 1.6 // >1 is harmless (vertex alpha x opacity is clamped): dollhouse keeps a clear contact band around the plinth
    sky.position.copy(camera.position)
    if (walk) updatePool(dt, true)
    if (shadowDirty) { renderer.shadowMap.needsUpdate = true; shadowDirty = false }

    renderer.info.reset()
    if (post && level <= 1) post.render(dt)
    else renderer.render(scene, camera)

    // adaptive quality: 1.5 s windows. Step DOWN after 3 consecutive bad windows (max one step per 10 s); step UP (back to the detected level) after 6 good ones.
    const now = performance.now()
    const real = (now - lastNow) / 1000
    lastNow = now
    if (!auto || manual || document.hidden || real > 0.3) { acc = 0; frames = 0; if (real > 0.3) { bad = 0; good = 0 } ; return } // stalls, shader compiles, hidden/throttled tabs
    settle -= real
    if (settle > 0) return // first seconds after load / tab return / level change: shaders still warming up
    acc += real; frames++
    if (acc < 1.5) return
    const fps = frames / acc
    acc = 0; frames = 0
    if (fps < FPS_MIN) { bad++; good = 0 } else if (fps >= 57) { good++; bad = 0 } else { bad = 0 }
    const t = now / 1000
    if (bad >= 3 && level < 4 && t - lastChange > 10) {
      level++
      bad = 0; lastChange = t; settle = 1.5
      applyLevel()
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ level, t: Date.now() })) } catch { /* ignore */ }
    } else if (good >= 6 && level > bestLevel && t - lastChange > 10) {
      level--
      good = 0; lastChange = t; settle = 1.5
      applyLevel()
      try { sessionStorage.removeItem(STORE_KEY) } catch { /* ignore */ }
    }
  }

  applyLevel()

  // ---- manual quality (button lives in TourUI): cycles high / medium / low and pins the choice for this tab.
  const qualityIndex = (): number => (level <= 1 ? 0 : level === 2 ? 1 : 2)
  const cycleQuality = (): number => {
    level = [2, 3, 1][qualityIndex()] // high (level 1) -> medium -> low -> high
    applyLevel()
    try { sessionStorage.setItem(MANUAL_KEY, String(level)) } catch { /* ignore */ }
    manual = true
    return qualityIndex()
  }

  // QA / debugging handle
  ;(window as unknown as { __tourLight?: unknown }).__tourLight = { THREE, scene, renderer, camera, sun, get level() { return level } }

  const lighting: Lighting = {
    get level() { return level },
    render,
    setSize(w, h) { W = w; H = h; post?.setSize(w, h) },
    setLevel(l) { level = Math.max(0, Math.min(4, l)); applyLevel() },
    refreshShadows,
    async precompile() {
      await postReady
      const was = poolOn
      const ceil = scene.getObjectByName('ceiling')
      const ceilWas = ceil?.visible ?? true
      for (const on of [true, false]) {
        poolOn = on; applyLevel()
        if (ceil) ceil.visible = on // overview = roof off, pool off: a different light count => different shader programs
        roof.visible = on
        if (on) updatePool(1, true)
        await renderer.compileAsync(scene, camera)
      }
      if (ceil) ceil.visible = ceilWas
      roof.visible = ceilWas
      poolOn = was; applyLevel()
    },
    get qualityIndex() { return qualityIndex() },
    cycleQuality,
    dispose() {
      post?.dispose()
      skyTex.dispose(); envRT.dispose(); lawnTex.dispose(); foliageTex.dispose()
      for (const o of [sky, ground, ao.floor, ao.ceiling, ao.corners, ao.outside]) { o.geometry.dispose(); (o.material as THREE.Material).dispose() }
      scenery.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } })
      sun.shadow.map?.dispose(); skyLight.shadow.map?.dispose(); roof.geometry.dispose(); (roof.material as THREE.Material).dispose()
      dressing.dispose()
      document.removeEventListener('visibilitychange', onVis)
      scene.remove(dressing.group, sky, ground, scenery, ao.floor, ao.ceiling, ao.corners, ao.outside, sun, sun.target, skyLight, skyLight.target, roof, hemi, ...slots.flatMap((sl) => (sl.target ? [sl.light, sl.target] : [sl.light])))
      scene.environment = null
      scene.fog = null
    },
  } as Lighting
  return lighting
}
