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
 * What it sets up: ACES tone mapping (exposure 1.1), procedural sky dome (equirect canvas incl. tree line, colour > 1 so windows glow) + small PMREM
 * environment, lawn, alpha-card trees and hedges far away, sun (40 deg elevation from the south-west) with a PCF shadow frustum fitted to the
 * house (soft patches on floor and lower walls behind the S/W windows), window lights (RectAreaLight on level 0, else distance-limited point
 * lights 1.6 m inside the glass so no hot blob forms on the wall between two windows), weak bounce point lights in Kueche + Wohnen, soft ceiling-lamp
 * fills for windowless rooms, weak hemisphere, baked-looking fake AO (merged vertex-alpha meshes: wall feet, ceiling edges, inside corners,
 * furniture contact pads, and a contact band on the lawn along the outer walls), a sunlit/hazy lift of the garden foliage from geometry.ts seen
 * through the windows, and GTAO + bloom (postfx.ts, lazy). In dollhouse/top mode the ceiling is hidden and the same sun lights the open house.
 *
 * Quality levels (0 best): 0 = GTAO(4 samples, 4x MSAA) + bloom + 1536 shadows + area lights, ~35 fps on an M3 Pro, only on request (?q=0 / ?q=high);
 * 1 = bloom only, point/spot lights (DEFAULT on desktop, the "Grafik: hoch" button state); 2 = direct render, 1024 shadows, pixel ratio <= 1.25;
 * 3 = phone: pixel ratio 1, fewer fills; 4 = no window lights, 512 shadows.
 * Start level is auto-detected (mobile -> 3, weak CPU -> 2, software GL -> 2, else 1) and steps DOWN
 * automatically when the measured fps stays under 55 for 1.5 s. The level it dropped to is remembered for 1 h per tab
 * (sessionStorage). Force a level with `?q=0..4` (also `?q=high|medium|low`), which disables auto-step unless `&auto=1` is added.
 * Manual choice: lighting.cycleQuality() (button in TourUI), pinned for the tab.
 * QA handle: window.__tourLight = { scene, renderer, camera, sun, level }.
 */
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

import { buildDressing } from './dressing'
import type { Post } from './postfx'
import { FOOTPRINT, WALL_HEIGHT, footprint, furniture, openings, roomAt, rooms, walls } from './plan'
import type { Opening } from './plan'

export interface Lighting {
  level: number
  render(dt: number): void
  setSize(w: number, h: number): void
  setLevel(level: number): void
  refreshShadows(): void
  /** 0 high, 1 medium, 2 low (for the quality button) */
  readonly qualityIndex: number
  /** high -> medium -> low -> high; pins the choice for this tab; returns the new index */
  cycleQuality(): number
  dispose(): void
}

// towards the sun: south-west, 40 deg elevation (patches land on the floor and lower walls close behind the windows)
const SUN_DIR = new THREE.Vector3(-0.49, 0.643, 0.588).normalize() // 40 deg elevation
const SHADOW_SIZE = [1536, 1536, 1024, 1024, 512]
const PIXEL_RATIO = [1.5, 1.5, 1.25, 1, 1]
const HAZE = 0xdde8ee
const HEMI = 0.17 // walk-mode ambient; window lights, sun and AO supply the contrast
const EXPOSURE = 1.0
const FPS_MIN = 55
const STORE_KEY = 'tour:quality'
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
  for (const [p, col] of [[0, '#6fa3dc'], [0.4, '#c5dcef'], [0.5, '#f0f2f2'], [0.52, '#dedad2'], [1, '#c8c2b6']] as [number, string][]) grad.addColorStop(p, col)
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
  g.fillStyle = '#5c9932'
  g.fillRect(0, 0, s, s)
  const rnd = seeded(3)
  // large soft patches (dry / lush) break up the flat colour; drawn wrapped so the texture tiles
  for (let i = 0; i < 40; i++) {
    const x = rnd() * s, y = rnd() * s, r = 30 + rnd() * 70
    const col = rnd() < 0.5 ? '58,112,34' : '140,185,64'
    for (const [ox, oy] of [[0, 0], [-s, 0], [s, 0], [0, -s], [0, s]]) {
      const rg = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
      rg.addColorStop(0, `rgba(${col},0.16)`)
      rg.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = rg
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
    }
  }
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(70,100,52,0.2)' : 'rgba(150,172,100,0.2)'
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

const EASE = [1, 0.62, 0.3, 0.1, 0] // alpha falloff across a strip (fraction of the peak): smooth without a texture
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
  const Y = 0.006, YC = WALL_HEIGHT - 0.006
  const FOOT_A = 0.46, CEIL_A = 0.3, CORNER_A = 0.34, TOP_A = 0.1
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
          fadeStrip(ou, atO(lo, 0), atO(hi, 0), atO(lo, 0.7), atO(hi, 0.7), 0.3)
        }
        continue
      }
      const minSide = roomMinSide(r.id)
      const at = (s: number, y: number, off: number): V3 => (horiz ? [s, y, face + side * off] : [face + side * off, y, s])
      const wf = Math.min(0.45, 0.3 * minSide)
      for (const [s0, s1] of spans) fadeStrip(fl, at(s0, Y, 0), at(s1, Y, 0), at(s0, Y, wf), at(s1, Y, wf), FOOT_A)
      if (minSide >= 2) { // narrow rooms: strips from opposite walls would cover the whole ceiling
        const wc = Math.min(0.5, 0.3 * minSide)
        fadeStrip(ce, at(lo, YC, 0), at(hi, YC, 0), at(lo, YC, wc), at(hi, YC, wc), CEIL_A)
        // far walls fade slightly darker towards the ceiling (skips doors and windows: the strip would dim the glass)
        const tcuts = openings.filter((o) => o.wall === w.id)
          .map((o) => { const pp = horiz ? o.at.x : o.at.z; return [pp - o.width / 2 - 0.05, pp + o.width / 2 + 0.05] })
          .sort((a, b) => a[0] - b[0])
        let tc = lo
        const tspans: [number, number][] = []
        for (const [s0, s1] of tcuts) { if (s0 > tc) tspans.push([tc, s0]); tc = Math.max(tc, s1) }
        if (hi > tc) tspans.push([tc, hi])
        for (const [s0, s1] of tspans) fadeStrip(ce, at(s0, YC, 0.004), at(s1, YC, 0.004), at(s0, YC - 0.75, 0.004), at(s1, YC - 0.75, 0.004), TOP_A)
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
        const wcl = Math.min(0.32, L * 0.4), off = 0.006
        const a0: V3 = [v.x + nx * off, 0.02, v.z + nz * off], a1: V3 = [a0[0], WALL_HEIGHT - 0.02, a0[2]]
        const b0: V3 = [a0[0] + (dx / L) * wcl, 0.02, a0[2] + (dz / L) * wcl], b1: V3 = [b0[0], WALL_HEIGHT - 0.02, b0[2]]
        fadeStrip(co, a0, a1, b0, b1, CORNER_A)
      }
    }
  }

  // contact shadows under furniture (skip rugs, on-top items, raised pieces, door thresholds)
  const rugs = furniture.filter((f) => f.type === 'rug').map(footprint)
  const alphaOf = (t: string) => (/bed|sofa|wardrobe|dresser|sideboard|kitchen|bath|tv-unit/.test(t) ? 0.4 : /table|desk/.test(t) ? 0.2 : /chair/.test(t) ? 0.22 : 0.28)
  const nearDoor = (r: { x0: number; z0: number; x1: number; z1: number }, m: number) => DOORS.some((o) => {
    const wall = walls.find((w) => w.id === o.wall)
    if (!wall) return false
    const horiz = wall.a.z === wall.b.z, hw = o.width / 2 + 0.1, d = 0.95
    const q = horiz ? { x0: o.at.x - hw, x1: o.at.x + hw, z0: o.at.z - d, z1: o.at.z + d } : { x0: o.at.x - d, x1: o.at.x + d, z0: o.at.z - hw, z1: o.at.z + hw }
    return r.x0 - m < q.x1 && r.x1 + m > q.x0 && r.z0 - m < q.z1 && r.z1 + m > q.z0
  })
  const PAD = 0.3
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
    if (saved && Date.now() - saved.t < 3600 * 1000 && saved.level > level) level = Math.min(4, saved.level)
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
  // r170: shadow.radius only has an effect with PCFShadowMap / VSMShadowMap (PCFSoft has a fixed kernel). VSM was tried and rejected: it leaks sun light through the thin walls.
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.info.autoReset = false // postfx renders several passes per frame; stats() should sum them
  const dpr = renderer.getPixelRatio() // cap chosen by buildScene

  // sky dome (camera-following so it never parallaxes) + environment. Colour > 1: the sky reads brighter than the room and feeds bloom.
  const skyTex = makeSkyTexture(level >= 3 ? 1024 : 2048, level >= 3 ? 512 : 1024)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(95, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, color: new THREE.Color(2.8, 2.8, 2.8), side: THREE.BackSide, fog: false, depthWrite: false }),
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
  scene.environmentIntensity = 0.18
  pmrem.dispose()

  // lawn + scenery
  const lawnTex = makeLawnTexture()
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(92, 48),
    new THREE.MeshStandardMaterial({ map: lawnTex, roughness: 1, envMapIntensity: 0.5, emissive: 0xffffff, emissiveMap: lawnTex, emissiveIntensity: 0.36 }),
  )
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
  const sun = new THREE.DirectionalLight(0xffecd0, 3.4)
  sun.castShadow = true
  sun.shadow.bias = -0.0003
  sun.shadow.normalBias = 0.02
  sun.position.set(cx, 0, cz).addScaledVector(SUN_DIR, 50)
  sun.target.position.set(cx, 0, cz)
  scene.add(sun, sun.target)
  {
    const cam = sun.shadow.camera
    cam.position.copy(sun.position)
    cam.lookAt(sun.target.position)
    cam.updateMatrixWorld()
    const pts: THREE.Vector3[] = []
    for (const x of [FOOTPRINT.x0 - 0.2, FOOTPRINT.x1 + 0.2]) for (const z of [FOOTPRINT.z0 - 0.2, FOOTPRINT.z1 + 0.2]) for (const y of [0, WALL_HEIGHT + 0.1]) {
      const p = new THREE.Vector3(x, y, z)
      pts.push(p, p.clone().addScaledVector(SUN_DIR, -p.y / SUN_DIR.y)) // wall tops projected onto the lawn
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

  // hemisphere: warm bounce from the floor, soft sky from above (kept low: the window lights give the direction)
  const hemi = new THREE.HemisphereLight(0xf1f5fa, 0xd8d2c8, HEMI)
  scene.add(hemi)

  // window lights: windows next to each other on one wall share one light. Sun side (S/W) warmer and stronger.
  RectAreaLightUniformsLib.init()
  interface Win { rect: THREE.RectAreaLight; point: THREE.PointLight; room: string }
  const windowLights: Win[] = []
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
      if (!room || !wall) continue
      const horiz = wall.a.z === wall.b.z
      const along = (o: Opening) => (horiz ? o.at.x : o.at.z)
      const lo = Math.min(...g.map((o) => along(o) - o.width / 2)), hi = Math.max(...g.map((o) => along(o) + o.width / 2))
      const mid = (lo + hi) / 2
      const rc = room.polygon.reduce((a, p) => ({ x: a.x + p.x / room.polygon.length, z: a.z + p.z / room.polygon.length }), { x: 0, z: 0 })
      const inward = horiz ? new THREE.Vector3(0, 0, Math.sign(rc.z - o0.at.z)) : new THREE.Vector3(Math.sign(rc.x - o0.at.x), 0, 0)
      const sunny = inward.dot(SUN_DIR) < 0 // the room looks away from the sun => this window faces it
      const y = o0.sill + o0.height / 2
      const c = horiz ? new THREE.Vector3(mid, y, o0.at.z) : new THREE.Vector3(o0.at.x, y, mid)
      const colour = sunny ? 0xfff0dc : 0xeaf1fb
      // Bigger and weaker than the glass itself: irradiance then falls off gently with depth instead of a hard hot band at the window.
      // Sunny (S/W) walls a bit stronger; north/east windows only give cool skylight.
      const RW = 1.0, RH = 1.3 // extra width / height around the glass
      const rect = new THREE.RectAreaLight(colour, sunny ? 5.6 : 2.8, hi - lo + RW, o0.height + RH)
      rect.position.copy(c).addScaledVector(inward, wall.t / 2 + 0.02) // just inside the room: does not light the reveal from behind
      rect.lookAt(rect.position.clone().add(inward))
      rect.name = `lighting:win:${o0.id}`
      // cheap tiers: point light 0.6 m inside, distance-limited so the light dies out into the room depth
      const point = new THREE.PointLight(colour, sunny ? 6.2 : 4.8, 10, 2)
      point.position.copy(c).addScaledVector(inward, wall.t / 2 + 1.6) // well inside: a light close to the plaster makes a hot blob on the wall between two windows
      point.name = `lighting:winpt:${o0.id}`
      windowLights.push({ rect, point, room: o0.rooms[0] })
      scene.add(rect, point)
    }
  }

  // Soft ceiling-lamp fills for windowless rooms. A downward RectAreaLight (spot on cheap tiers) at the room centre: no point-light hot spots
  // on the plaster next to the lamp. [intensity rect, intensity spot, reach] - deliberately dim, the plaster is close to white.
  interface Fill { rect: THREE.RectAreaLight; spot: THREE.SpotLight; useRect: boolean }
  const fills: Fill[] = []
  const RECT_FILL = new Set(['flur-links', 'bad']) // only the two rooms that matter get an area light (each one costs every pixel); tiny rooms use the spot on all tiers
  const FILL: Record<string, [number, number, number]> = { 'flur-links': [0.7, 2.2, 4], 'flur-rechts': [0.5, 1.6, 3], bad: [2.2, 4.6, 4.5], wc: [0.7, 1.8, 3], abstell: [0.7, 1.8, 3], kamin: [0.5, 1.4, 3] }
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
      const [ir, is, reach] = FILL[id]
      const rect = new THREE.RectAreaLight(0xfff0e2, ir / n, Math.min(0.9, sx * 0.5) , Math.min(0.9, sz * 0.5))
      if (n > 1) { if (sx >= sz) rect.width = (sx / n) * 0.5; else rect.height = (sz / n) * 0.5 }
      rect.position.set(px, WALL_HEIGHT - 0.03, pz)
      rect.rotation.x = -Math.PI / 2 // faces down; width along x, height along z
      rect.name = `lighting:fill:${id}:${i}`
      const spot = new THREE.SpotLight(0xfff0e2, is / n, reach, 1.25, 1, 0.7)
      spot.position.set(px, WALL_HEIGHT - 0.05, pz)
      spot.target.position.set(px, 0, pz)
      spot.name = `lighting:fillspot:${id}:${i}`
      fills.push({ rect, spot, useRect: RECT_FILL.has(id) })
      scene.add(rect, spot, spot.target)
    }
  }

  // Bounce fills: one weak point light at head height in the middle of the two big rooms lifts the far walls (the window lights are
  // distance-limited). Low intensity + decay 2 => a broad gradient, no hot spot.
  const bounce: THREE.PointLight[] = []
  for (const [id, inten] of [['kueche', 2.1], ['wohnen', 2.6]] as [string, number][]) {
    const r = rooms.find((q) => q.id === id)
    if (!r) continue
    const xs = r.polygon.map((p) => p.x), zs = r.polygon.map((p) => p.z)
    const pl = new THREE.PointLight(0xfff1e4, inten, 8, 2)
    pl.position.set((Math.min(...xs) + Math.max(...xs)) / 2, 1.75, (Math.min(...zs) + Math.max(...zs)) / 2) // below the pendants, well away from the ceiling (no hot ceiling spot)
    pl.name = `lighting:bounce:${id}`
    bounce.push(pl)
    scene.add(pl)
  }

  // fixtures + window dressing (pendants, table lamp, ceiling lamps, frosted bath window, curtains): after the furniture, so it can skip what exists
  const dressing = buildDressing(scene)
  scene.add(dressing.group)

  // fake AO
  const ao = buildFakeAo()
  scene.add(ao.floor, ao.ceiling, ao.corners, ao.outside)
  const aoMats = [ao.floor, ao.ceiling, ao.corners, ao.outside].map((m) => m.material as THREE.MeshBasicMaterial)

  // ---- shadow flags
  let flagged = -1
  function refreshShadows(): void {
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o.userData.noShadow || o.name.startsWith('lighting:')) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const glassy = mats.some((m) => m.transparent && m.opacity < 0.99)
      o.castShadow = !glassy && !o.name.startsWith('floor:') && !o.name.startsWith('rug')
      o.receiveShadow = true
    })
    flagged = scene.children.length
    // garden hedges / trees (geometry.ts) are seen from inside on their shadow side: lift them towards a hazy, sunlit green so the window views read as daylight
    const gm = (scene.getObjectByName('exterior:garden-foliage') as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined
    if (gm && gm.emissive) { gm.emissive.set(0x8aa574); gm.emissiveIntensity = 0.75 }
  }
  refreshShadows()

  // ---- quality
  let post: Post | null = null
  let postLoading = false
  let W = 1, H = 1
  const applyLevel = (): void => {
    const shadowSize = SHADOW_SIZE[level]
    if (sun.shadow.mapSize.x !== shadowSize) {
      sun.shadow.mapSize.set(shadowSize, shadowSize)
      sun.shadow.map?.dispose()
      sun.shadow.map = null
    }
    const pr = Math.min(dpr, PIXEL_RATIO[level])
    if (renderer.getPixelRatio() !== pr) { renderer.setPixelRatio(pr); renderer.setSize(W, H, false); post?.setSize(W, H) }
    dressing.setLevel(level)
    windowLights.forEach((w) => {
      w.rect.visible = level === 0
      w.point.visible = level >= 1 && level <= 3 && !(w.room === 'bad' && dressing.bathSpot) // the bath gets a daylight cone (spot) instead
    })
    bounce.forEach((b) => { b.visible = level <= 3 })
    fills.forEach((f, i) => { f.rect.visible = level === 0 && f.useRect; f.spot.visible = !f.rect.visible && (level <= 2 || (level === 3 && i < 3)) })
    sun.shadow.radius = level <= 1 ? 4.5 : 2.5 // PCF tap spacing in texels: wider penumbra on the strong tiers
    if (level <= 1 && !post && !postLoading) {
      postLoading = true
      import('./postfx').then(({ createPost }) => {
        post = createPost(renderer, scene, camera, W, H, [ao.floor, ao.ceiling, ao.corners, ao.outside])
        post.setLevel(level)
      }).catch((e) => console.warn('[tour] postfx unavailable', e))
    }
    post?.setLevel(level)
  }

  // ---- render loop hook
  let ceilingObj: THREE.Object3D | undefined
  let manual = false
  let acc = 0, frames = 0, elapsed = 0, cooldown = 0
  const render = (dt: number): void => {
    ceilingObj ??= scene.getObjectByName('ceiling') ?? undefined
    if (flagged !== scene.children.length) refreshShadows()
    const walk = ceilingObj ? ceilingObj.visible : true
    // overview (roof off): the sun lights everything, so pull it back a little; walk mode: the sun only enters through the window openings (strong, so its patches on the floor read like the photos)
    sun.intensity = walk ? 9 : 2.6
    hemi.intensity = (level < 4 ? HEMI : HEMI + 0.35) + (walk ? 0 : 0.35)
    ao.ceiling.visible = walk
    // with GTAO on the fake AO is only a light extra; in overview keep the floor pads subtle so they never read as black shapes
    const base = level === 0 ? 0.75 : level === 1 ? 0.9 : 1
    aoMats[0].opacity = base * (walk ? 1 : 0.35)
    aoMats[1].opacity = base
    aoMats[2].opacity = base * (walk ? 1 : 0.5)
    aoMats[3].opacity = walk ? 0.6 : 1
    sky.position.copy(camera.position)

    renderer.info.reset()
    if (post && level <= 1) post.render(dt)
    else renderer.render(scene, camera)

    // adaptive quality: step down when fps stays under FPS_MIN for a 1.5 s window
    elapsed += dt
    if (!auto || manual || dt > 0.3) return // ignore stalls (tab switch, shader compile)
    acc += dt; frames++
    cooldown -= dt
    if (acc >= 1.5) {
      const fps = frames / acc
      acc = 0; frames = 0
      if (elapsed > 3 && cooldown <= 0 && fps < FPS_MIN && level < 4) {
        level++
        applyLevel()
        cooldown = 3
        try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ level, t: Date.now() })) } catch { /* ignore */ }
      }
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
  ;(window as unknown as { __tourLight?: unknown }).__tourLight = { scene, renderer, camera, sun, get level() { return level } }

  const lighting: Lighting = {
    get level() { return level },
    render,
    setSize(w, h) { W = w; H = h; post?.setSize(w, h) },
    setLevel(l) { level = Math.max(0, Math.min(4, l)); applyLevel() },
    refreshShadows,
    get qualityIndex() { return qualityIndex() },
    cycleQuality,
    dispose() {
      post?.dispose()
      skyTex.dispose(); envRT.dispose(); lawnTex.dispose(); foliageTex.dispose()
      for (const o of [sky, ground, ao.floor, ao.ceiling, ao.corners, ao.outside]) { o.geometry.dispose(); (o.material as THREE.Material).dispose() }
      scenery.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } })
      sun.shadow.map?.dispose()
      dressing.dispose()
      scene.remove(dressing.group, sky, ground, scenery, ao.floor, ao.ceiling, ao.corners, ao.outside, sun, sun.target, hemi, ...windowLights.flatMap((w) => [w.rect, w.point]), ...bounce, ...fills.flatMap((f) => [f.rect, f.spot, f.spot.target]))
      scene.environment = null
      scene.fog = null
    },
  } as Lighting
  return lighting
}
