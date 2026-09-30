/**
 * geometry.ts - the building shell of the tour: walls (trimmed at junctions, split at openings), floors, ceiling,
 * baseboards, cornices, window + door frames, glass, door leaves, radiators, fireplace flue collar, exterior apron and
 * garden backdrop, plus collision data.
 *
 * Everything is batched per material key (one mesh per material, ~25 draw calls for the whole house).
 * UVs are WORLD-SCALE (1 unit = 1 m): floors/ceilings (x,z), walls facing +-z (x,y), walls facing +-x (z,y).
 * Coordinates: see plan.ts (x east, z south, y up, metres).
 *
 * Exports: buildGeometry() (scene objects + colliders), getCollisionData() (pure data, no three objects).
 *
 * Ground ownership: the lawn disc (lighting:ground, y=-0.03), sky dome, fog and the far tree line live in lighting.ts
 * (it owns light + atmosphere); this file owns everything that touches the house: paved apron / path, the near garden
 * hedges and trees seen through the windows, plus the ceiling details and the stove with its flue.
 * Keys starting with 'geo-' are private materials made here (soffit / cornice with low env reflection so downward faces
 * do not pick up the green lawn from the environment map, satin door leaves, flat ceilings, stove, LED).
 */
import * as THREE from 'three'

import { getMaterial } from './materials'
import {
  DOOR_H, EXT_T, FOOTPRINT, WALL_HEIGHT, footprint, furniture, openings, roomAt, rooms, walls,
  type Opening, type RoomId, type Wall,
} from './plan'

// ---------------------------------------------------------------- public types
export interface Rect { x0: number; z0: number; x1: number; z1: number }
export interface DoorGap {
  id: string
  /** axis the hosting wall runs along ('x' = wall runs east-west) */
  axis: 'x' | 'z'
  /** centre of the clear opening on the wall centre line */
  x: number
  z: number
  /** clear width (between the door linings) */
  width: number
}
export interface CollisionData {
  /** wall solids, already split at door gaps (windows are NOT gaps), trimmed at junctions, N/S walls own the corners */
  rects: Rect[]
  /** thin rects of the open door leaves (leaf angle >= 30 deg). Blocking them is optional. */
  leaves: Rect[]
  /** door / entrance openings that are walkable (clear width, between the linings) */
  doorGaps: DoorGap[]
  /** outer wall faces of the house */
  bounds: Rect
}
export interface HouseGeometry {
  group: THREE.Group
  /** named sub-group; controls hide `ceiling` (ceiling + cornices + flue collar) in dollhouse/top mode */
  ceiling: THREE.Object3D
  /** wall solids + open door leaves for walk collision (== collision.rects + collision.leaves) */
  colliders: Rect[]
  collision: CollisionData
}

// ---------------------------------------------------------------- constants
const EPS = 0.004
const SUBFLOOR_Y = -0.004
const BASE_H = 0.07 // baseboard height
const BASE_T = 0.012
const CORNICE = 0.035
const LINING = 0.03 // door lining (Zarge) thickness in the reveal
const CASING_W = 0.07 // door casing width
const CASING_T = 0.012
const LEAF_T = 0.04
const FR_W = 0.05 // window frame width
const SASH_W = 0.03

// ---------------------------------------------------------------- batching
type V3 = [number, number, number]
interface Buf { pos: number[]; nor: number[]; uv: number[]; idx: number[] }
interface Run { a: number; b: number; key: string }
type Face = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz'
type FaceSpec = string | Run[] | null
type Faces = Record<Face, FaceSpec>

/** all faces `key`, except those listed in `skip` */
function allFaces(key: string, skip: Face[] = []): Faces {
  const f = {} as Faces
  for (const k of ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as Face[]) f[k] = skip.includes(k) ? null : key
  return f
}

class Batch {
  bufs = new Map<string, Buf>()
  private buf(key: string): Buf {
    let b = this.bufs.get(key)
    if (!b) { b = { pos: [], nor: [], uv: [], idx: [] }; this.bufs.set(key, b) }
    return b
  }
  /** flat quad a,b,c,d (counter-clockwise seen from the front). Optional hint = desired normal (flips if needed). */
  quad(key: string, a: V3, b: V3, c: V3, d: V3, hint?: V3): void {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const l = Math.hypot(...n)
    if (l < 1e-9) return
    n = [n[0] / l, n[1] / l, n[2] / l]
    if (hint && n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) {
      this.quad(key, a, d, c, b)
      return
    }
    const bf = this.buf(key)
    const base = bf.pos.length / 3
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2])
    for (const p of [a, b, c, d]) {
      bf.pos.push(p[0], p[1], p[2])
      bf.nor.push(n[0], n[1], n[2])
      if (ay >= ax && ay >= az) bf.uv.push(p[0], p[2])
      else if (ax >= az) bf.uv.push(p[2], p[1])
      else bf.uv.push(p[0], p[1])
    }
    bf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  /** flat triangle facing `hint` */
  tri(key: string, a: V3, b: V3, c: V3, hint: V3): void {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) { this.tri(key, a, c, b, hint); return }
    const l = Math.hypot(...n)
    if (l < 1e-12) return
    const bf = this.buf(key)
    const base = bf.pos.length / 3
    const nn = [n[0] / l, n[1] / l, n[2] / l]
    const ay = Math.abs(nn[1])
    for (const p of [a, b, c]) {
      bf.pos.push(p[0], p[1], p[2])
      bf.nor.push(nn[0], nn[1], nn[2])
      if (ay >= Math.abs(nn[0]) && ay >= Math.abs(nn[2])) bf.uv.push(p[0], p[2])
      else if (Math.abs(nn[0]) >= Math.abs(nn[2])) bf.uv.push(p[2], p[1])
      else bf.uv.push(p[0], p[1])
    }
    bf.idx.push(base, base + 1, base + 2)
  }
  /** axis aligned box; per face material key, run list (side faces) or null (skip) */
  box(f: Faces, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
    if (x1 - x0 < 1e-5 || y1 - y0 < 1e-5 || z1 - z0 < 1e-5) return
    const runs = (s: FaceSpec, lo: number, hi: number): Run[] =>
      s === null ? [] : typeof s === 'string' ? [{ a: lo, b: hi, key: s }]
        : s.map((r) => ({ a: Math.max(r.a, lo), b: Math.min(r.b, hi), key: r.key })).filter((r) => r.b - r.a > 1e-5)
    for (const r of runs(f.px, z0, z1)) this.quad(r.key, [x1, y0, r.b], [x1, y0, r.a], [x1, y1, r.a], [x1, y1, r.b])
    for (const r of runs(f.nx, z0, z1)) this.quad(r.key, [x0, y0, r.a], [x0, y0, r.b], [x0, y1, r.b], [x0, y1, r.a])
    if (typeof f.py === 'string') this.quad(f.py, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0])
    if (typeof f.ny === 'string') this.quad(f.ny, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1])
    for (const r of runs(f.pz, x0, x1)) this.quad(r.key, [r.a, y0, z1], [r.b, y0, z1], [r.b, y1, z1], [r.a, y1, z1])
    for (const r of runs(f.nz, x0, x1)) this.quad(r.key, [r.b, y0, z0], [r.a, y0, z0], [r.a, y1, z0], [r.b, y1, z0])
  }
  /** vertical prism over a convex footprint (any orientation), all faces */
  prism(key: string, pts: [number, number][], y0: number, y1: number): void {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length]
      const mx = (p[0] + q[0]) / 2 - cx, mz = (p[1] + q[1]) / 2 - cz
      this.quad(key, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], [mx, 0, mz])
    }
    const [a, b, c, d] = pts
    this.quad(key, [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], [0, 1, 0])
    this.quad(key, [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]], [d[0], y0, d[1]], [0, -1, 0])
  }
  /** merge a three geometry (indexed or not); UVs are re-projected in world space */
  geo(key: string, g: THREE.BufferGeometry, m: THREE.Matrix4): void {
    const bf = this.buf(key)
    const g2 = g.clone().applyMatrix4(m)
    const p = g2.getAttribute('position'), n = g2.getAttribute('normal'), ix = g2.getIndex()
    const base = bf.pos.length / 3
    for (let i = 0; i < p.count; i++) {
      bf.pos.push(p.getX(i), p.getY(i), p.getZ(i))
      bf.nor.push(n.getX(i), n.getY(i), n.getZ(i))
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i))
      if (ay >= ax && ay >= az) bf.uv.push(p.getX(i), p.getZ(i))
      else if (ax >= az) bf.uv.push(p.getZ(i), p.getY(i))
      else bf.uv.push(p.getX(i), p.getY(i))
    }
    if (ix) for (let i = 0; i < ix.count; i++) bf.idx.push(base + ix.getX(i))
    else for (let i = 0; i < p.count; i++) bf.idx.push(base + i)
    g2.dispose()
  }
  /** one Mesh per material key */
  meshes(prefix: string, into: THREE.Object3D, opts: { cast?: boolean; noShadow?: boolean; only?: (k: string) => boolean } = {}): void {
    for (const [key, b] of this.bufs) {
      if (opts.only && !opts.only(key)) continue
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
      g.setIndex(b.idx)
      g.computeBoundingSphere()
      const mesh = new THREE.Mesh(g, mat(key))
      mesh.name = `${prefix}:${key}`
      mesh.receiveShadow = true
      if (opts.noShadow) mesh.userData.noShadow = true
      into.add(mesh)
    }
  }
}

// ---------------------------------------------------------------- private materials ('geo-*')
const localMats = new Map<string, THREE.Material>()
/** clone of a shared material with a different env reflection (keeps the world-UV shader hooks of materials.ts) */
function tweak(base: string, env: number, fill: number): THREE.Material {
  const src = getMaterial(base) as THREE.MeshStandardMaterial
  const c = src.clone()
  c.onBeforeCompile = src.onBeforeCompile
  c.customProgramCacheKey = src.customProgramCacheKey
  c.envMapIntensity = env
  // downward faces only see the (brown / green) ground side of the hemisphere + env map: add a neutral white fill
  c.emissive.setHex(0xf6f2e8)
  c.emissiveIntensity = fill
  return c
}
function makeLocal(key: string): THREE.Material {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ metalness: 0, ...p })
  switch (key) {
    case 'geo-soffit': return tweak('plaster-white', 0.12, 0.3) // window heads: the lawn in the env map would tint them green
    case 'geo-trim-hi': return tweak('baseboard', 0.18, 0.25) // cornice
    case 'geo-ceiling-panel': return tweak('ceiling', 0.35, 0.22)
    case 'geo-ceiling-flat': return std({ color: 0xf5f2ea, roughness: 0.93, envMapIntensity: 0.3, emissive: 0xf6f2e8, emissiveIntensity: 0.24 })
    case 'geo-leaf': return std({ color: 0xf7f5ef, roughness: 0.3 }) // satin paint, no plaster noise
    case 'geo-leaf-panel': return std({ color: 0xebe8e0, roughness: 0.34 })
    case 'geo-stove': return std({ color: 0x1d1d1f, roughness: 0.5, metalness: 0.55, envMapIntensity: 0.6 })
    case 'geo-fire': return std({ color: 0x120a06, roughness: 0.2, emissive: 0xff6a1c, emissiveIntensity: 0.85 })
    case 'geo-led': return std({ color: 0xeeeeea, roughness: 0.5, emissive: 0xf2f2ec, emissiveIntensity: 0.42 }) // soft diffuser, not a blown-out slab
    case 'geo-detector': return std({ color: 0xf8f8f6, roughness: 0.5 })
    default: return new THREE.MeshStandardMaterial({ color: 0xff00ff })
  }
}
function mat(key: string): THREE.Material {
  if (!key.startsWith('geo-')) return getMaterial(key)
  let m = localMats.get(key)
  if (!m) { m = makeLocal(key); m.name = key; localMats.set(key, m) }
  return m
}

// private material (handles); Materials agent owns the shared keys
let metalMat: THREE.MeshStandardMaterial | null = null
function metal(): THREE.MeshStandardMaterial {
  if (!metalMat) {
    metalMat = new THREE.MeshStandardMaterial({ color: 0xb8bbbf, roughness: 0.35, metalness: 0.9 })
    metalMat.name = 'geo-metal'
  }
  return metalMat
}

// ---------------------------------------------------------------- wall extents
interface WExt {
  w: Wall
  i: number
  horiz: boolean
  c: number // centre line coordinate (z for horizontal walls, x for vertical)
  alo: number // original centre-line extent along the axis
  ahi: number
  lo: number // trimmed extent (outer faces at corners, inner faces at T junctions)
  hi: number
}

let extCache: WExt[] | null = null
/** Trim every wall so no two solids overlap: T junctions end at the through wall's face, L corners are owned by the wall that comes first in plan.walls. */
function extents(): WExt[] {
  if (extCache) return extCache
  const list: WExt[] = walls.map((w, i) => {
    const horiz = w.a.z === w.b.z
    const c = horiz ? w.a.z : w.a.x
    const alo = horiz ? Math.min(w.a.x, w.b.x) : Math.min(w.a.z, w.b.z)
    const ahi = horiz ? Math.max(w.a.x, w.b.x) : Math.max(w.a.z, w.b.z)
    return { w, i, horiz, c, alo, ahi, lo: alo, hi: ahi }
  })
  for (const e of list) {
    for (const end of ['lo', 'hi'] as const) {
      const at = end === 'lo' ? e.alo : e.ahi
      for (const o of list) {
        if (o.horiz === e.horiz) continue
        if (Math.abs(at - o.c) > EPS || e.c < o.alo - EPS || e.c > o.ahi + EPS) continue
        const atOEnd = Math.abs(e.c - o.alo) < EPS || Math.abs(e.c - o.ahi) < EPS
        const owner = !atOEnd || o.i < e.i // o owns the corner (or it is a T): e is trimmed
        const d = owner ? o.w.t / 2 : -o.w.t / 2
        if (end === 'lo') e.lo = at + d
        else e.hi = at - d
        break
      }
    }
  }
  extCache = list
  return list
}

const extOf = (id: string): WExt => extents().find((e) => e.w.id === id)!

/** world helpers for wall-local coordinates: s along the wall, p across (relative to the centre line) */
function wpos(e: WExt, s: number, p: number): [number, number] {
  return e.horiz ? [s, e.c + p] : [e.c + p, s]
}
function wbox(bt: Batch, f: Faces, e: WExt, s0: number, s1: number, y0: number, y1: number, p0: number, p1: number): void {
  const [xa, za] = wpos(e, s0, Math.min(p0, p1)), [xb, zb] = wpos(e, s1, Math.max(p0, p1))
  bt.box(f, Math.min(xa, xb), y0, Math.min(za, zb), Math.max(xa, xb), y1, Math.max(za, zb))
}
/** face of a box at side `sign` (+1: +z / +x) */
const sideFace = (e: WExt, sign: number): Face => (e.horiz ? (sign > 0 ? 'pz' : 'nz') : (sign > 0 ? 'px' : 'nx'))
const backFace = (e: WExt, sign: number): Face => sideFace(e, -sign)

const SWING_SIGN: Record<string, number> = { n: -1, w: -1, s: 1, e: 1 }

// ---------------------------------------------------------------- room material sampling along wall faces
const axisCuts = { x: [] as number[], z: [] as number[] }
for (const r of rooms) for (const p of r.polygon) { axisCuts.x.push(p.x); axisCuts.z.push(p.z) }

function sampleKey(x: number, z: number): string {
  const r = roomAt(x, z)
  if (r) return r.wall
  const outside = x < FOOTPRINT.x0 || x > FOOTPRINT.x1 || z < FOOTPRINT.z0 || z > FOOTPRINT.z1
  return outside ? 'exterior' : 'plaster-white'
}

/** material runs along one face of a wall between s0 and s1 (split where the room on that side changes) */
function faceRuns(e: WExt, sign: number, s0: number, s1: number): Run[] {
  const cuts = (e.horiz ? axisCuts.x : axisCuts.z).filter((v) => v > s0 + 1e-4 && v < s1 - 1e-4)
  const pts = [s0, ...Array.from(new Set(cuts.map((v) => Math.round(v * 1000) / 1000))).sort((a, b) => a - b), s1]
  const out: Run[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const mid = (pts[i] + pts[i + 1]) / 2
    const [x, z] = wpos(e, mid, sign * (e.w.t / 2 + 0.05))
    const key = sampleKey(x, z)
    const last = out[out.length - 1]
    if (last && last.key === key) last.b = pts[i + 1]
    else out.push({ a: pts[i], b: pts[i + 1], key })
  }
  return out
}

// ---------------------------------------------------------------- collision data
function doorOpenings(e: WExt): Opening[] {
  return openings.filter((o) => o.wall === e.w.id && o.type !== 'window')
}
const alongOf = (e: WExt, o: Opening) => (e.horiz ? o.at.x : o.at.z)

function leafAngle(o: Opening): number { return o.swing ? o.swing.openDeg : 0 }

/** Leaf footprint corners in world xz (wall-local pivot geometry shared with the renderer). */
function leafGeom(e: WExt, o: Opening): { pivot: [number, number]; u: [number, number]; len: number; ph: number; dirS: number; sgn: number } {
  const sw = o.swing!
  const t = e.w.t
  const sgn = SWING_SIGN[sw.toward]
  const dirS = sw.hinge === 'a' ? 1 : -1
  const p = alongOf(e, o)
  const sh = sw.hinge === 'a' ? p - o.width / 2 + LINING : p + o.width / 2 - LINING
  const ph = sgn * Math.min(t / 2 - 0.045, 0.08)
  const th = (sw.openDeg * Math.PI) / 180
  return { pivot: [sh, ph], u: [dirS * Math.cos(th), sgn * Math.sin(th)], len: o.width - 2 * LINING - 0.008, ph, dirS, sgn }
}

/**
 * Collision data for the navigation agent: wall AABBs (split at door gaps), open door leaves, door gaps, outer bounds.
 * Pure data; the same numbers buildGeometry() uses for `colliders`.
 */
export function getCollisionData(): CollisionData {
  const rects: Rect[] = []
  const leaves: Rect[] = []
  const doorGaps: DoorGap[] = []
  for (const e of extents()) {
    const doors = doorOpenings(e).sort((a, b) => alongOf(e, a) - alongOf(e, b))
    const push = (s0: number, s1: number) => {
      if (s1 - s0 < 0.01) return
      const [xa, za] = wpos(e, s0, -e.w.t / 2), [xb, zb] = wpos(e, s1, e.w.t / 2)
      rects.push({ x0: Math.min(xa, xb), z0: Math.min(za, zb), x1: Math.max(xa, xb), z1: Math.max(za, zb) })
    }
    let cur = e.lo
    for (const o of doors) {
      const p = alongOf(e, o)
      const s0 = p - o.width / 2 + LINING, s1 = p + o.width / 2 - LINING
      push(cur, s0)
      cur = s1
      const [gx, gz] = wpos(e, p, 0)
      doorGaps.push({ id: o.id, axis: e.horiz ? 'x' : 'z', x: gx, z: gz, width: o.width - 2 * LINING })
      if (o.swing && leafAngle(o) >= 30) {
        const g = leafGeom(e, o)
        const th = LEAF_T / 2 + 0.01
        const v: [number, number] = [-g.u[1], g.u[0]]
        const cs: [number, number][] = []
        for (const l of [0, g.len]) for (const k of [-th, th]) cs.push(wpos(e, g.pivot[0] + g.u[0] * l + v[0] * k, g.pivot[1] + g.u[1] * l + v[1] * k))
        leaves.push({
          x0: Math.min(...cs.map((c) => c[0])), x1: Math.max(...cs.map((c) => c[0])),
          z0: Math.min(...cs.map((c) => c[1])), z1: Math.max(...cs.map((c) => c[1])),
        })
      }
    }
    push(cur, e.hi)
  }
  rects.push(stoveSpec().rect) // wood stove in the chimney recess
  return { rects, leaves, doorGaps, bounds: { ...FOOTPRINT } }
}

// ---------------------------------------------------------------- walls
function addWall(e: WExt, bt: Batch): void {
  const w = e.w
  const ext = w.kind === 'exterior'
  const yBase = ext ? -0.1 : 0 // exterior walls sink into the ground (no gap above the lawn)
  const topKey = ext ? 'exterior' : 'plaster-white'
  const ops = openings.filter((o) => o.wall === w.id).sort((a, b) => alongOf(e, a) - alongOf(e, b))
  const half = w.t / 2

  const piece = (s0: number, s1: number, y0: number, y1: number, o: { endLo: string | null; endHi: string | null; top: string | null; bottom: string | null }) => {
    if (s1 - s0 < 0.003 || y1 - y0 < 0.003) return
    const f = {} as Faces
    const rp = faceRuns(e, 1, s0, s1), rn = faceRuns(e, -1, s0, s1)
    if (e.horiz) { f.pz = rp; f.nz = rn; f.px = o.endHi; f.nx = o.endLo } else { f.px = rp; f.nx = rn; f.pz = o.endHi; f.nz = o.endLo }
    f.py = o.top
    f.ny = o.bottom
    wbox(bt, f, e, s0, s1, y0, y1, -half, half)
  }
  const end = ext ? 'exterior' : 'plaster-white'
  let cur = e.lo
  ops.forEach((o) => {
    const p = alongOf(e, o)
    const s0 = p - o.width / 2, s1 = p + o.width / 2
    // full-height piece before the opening (its end face toward the opening is a jamb)
    piece(cur, s0, yBase, WALL_HEIGHT, { endLo: cur === e.lo ? end : 'geo-soffit', endHi: 'geo-soffit', top: topKey, bottom: null }) // reveals use the lighter soffit shading
    if (o.sill > yBase) piece(s0, s1, yBase, o.sill, { endLo: null, endHi: null, top: null, bottom: null }) // below window; sill board covers the top
    piece(s0, s1, o.sill + o.height, WALL_HEIGHT, { endLo: null, endHi: null, top: topKey, bottom: 'geo-soffit' }) // lintel + soffit
    cur = s1
  })
  piece(cur, e.hi, yBase, WALL_HEIGHT, { endLo: cur === e.lo ? end : 'geo-soffit', endHi: end, top: topKey, bottom: null })
  // sill piece top inside the reveal is closed by the sill boards (windows) - reveal top face for the part beside boards is covered
}

// ---------------------------------------------------------------- windows
function outwardSign(e: WExt): number {
  for (const sgn of [1, -1]) {
    const [x, z] = wpos(e, (e.lo + e.hi) / 2, sgn * (e.w.t / 2 + 0.05))
    if (x < FOOTPRINT.x0 || x > FOOTPRINT.x1 || z < FOOTPRINT.z0 || z > FOOTPRINT.z1) return sgn
  }
  return 1
}

function addWindow(e: WExt, o: Opening, bt: Batch, rad: Batch, glass: Batch): void {
  const t = e.w.t
  const so = outwardSign(e) // +1 when outside is on the +p side
  const at = (d: number) => so * t / 2 - so * d // p coordinate at distance d from the outer face (inward)
  const p = alongOf(e, o)
  const s0 = p - o.width / 2, s1 = p + o.width / 2
  const patio = o.sill === 0 // full-height French / terrace door: tile threshold instead of a sill board
  const yb = o.sill + (patio ? 0.01 : 0.03), yt = o.sill + o.height
  const F = allFaces('frame')
  const fb = (a: number, b: number, y0: number, y1: number, d0: number, d1: number) => wbox(bt, F, e, a, b, y0, y1, at(d0), at(d1))

  // frame ring (depth d 0.055..0.125 from the outer face)
  const D0 = 0.09, D1 = 0.16 // ~12 cm inner reveal in the 28 cm wall
  fb(s0, s0 + FR_W, yb, yt, D0, D1)
  fb(s1 - FR_W, s1, yb, yt, D0, D1)
  fb(s0 + FR_W, s1 - FR_W, yb, yb + FR_W, D0, D1)
  fb(s0 + FR_W, s1 - FR_W, yt - FR_W, yt, D0, D1)
  // panes: split by a mullion when wide
  const twoWing = o.width > 0.95 || o.rooms[0] === 'bad' // bath window: two wings + thin bar (photo 29)
  const inner: [number, number][] = twoWing
    ? [[s0 + FR_W, p - 0.02], [p + 0.02, s1 - FR_W]]
    : [[s0 + FR_W, s1 - FR_W]]
  if (twoWing) fb(p - 0.02, p + 0.02, yb + FR_W, yt - FR_W, D0, D1)
  const y0 = yb + FR_W, y1 = yt - FR_W
  const G = allFaces('frame')
  for (const [a, b] of inner) {
    // sash ring, slightly narrower/stepped profile
    const S0 = 0.105, S1 = 0.15
    wbox(bt, G, e, a, a + SASH_W, y0, y1, at(S0), at(S1))
    wbox(bt, G, e, b - SASH_W, b, y0, y1, at(S0), at(S1))
    wbox(bt, G, e, a + SASH_W, b - SASH_W, y0, y0 + SASH_W, at(S0), at(S1))
    wbox(bt, G, e, a + SASH_W, b - SASH_W, y1 - SASH_W, y1, at(S0), at(S1))
    // glass: two quads back to back (front faces both ways, no double-sided material needed)
    const ga = a + SASH_W, gb = b - SASH_W, gy0 = y0 + SASH_W, gy1 = y1 - SASH_W
    for (const [d, dir] of [[0.1255, -1], [0.1285, 1]] as [number, number][]) {
      const q = (s: number, y: number): V3 => { const [x, z] = wpos(e, s, at(d)); return [x, y, z] }
      const hint: V3 = e.horiz ? [0, 0, dir * so] : [dir * so, 0, 0]
      glass.quad('glass', q(ga, gy0), q(gb, gy0), q(gb, gy1), q(ga, gy1), hint)
    }
    // glazing bars (photos 05, 12, 14): French door = 2 columns x 4 rows per wing, windows = transom at ~3/4 height + centre bar when wide
    if (o.rooms[0] !== 'bad') {
      const BW = 0.011, bd0 = 0.1175, bd1 = 0.1365, gm = (ga + gb) / 2
      const bar = (s0: number, s1: number, b0: number, b1: number) => wbox(bt, G, e, s0, s1, b0, b1, at(bd0), at(bd1))
      if (patio) {
        bar(gm - BW, gm + BW, gy0, gy1)
        for (let i = 1; i < 4; i++) { const yy = gy0 + ((gy1 - gy0) * i) / 4; bar(ga, gb, yy - BW, yy + BW) }
      } else {
        const yy = gy0 + (gy1 - gy0) * 0.75
        bar(ga, gb, yy - BW, yy + BW)
        if (gb - ga > 0.45) bar(gm - BW, gm + BW, gy0, gy1)
      }
    }
  }
  // interior window board (sill) 3 cm high, 4 cm projection; exterior brick sill
  const innerP = so * t / 2 - so * t // inner wall face p
  if (patio) {
    // grey tile threshold across the reveal, 1 cm proud of the floor inside, exterior step outside
    wbox(bt, allFaces('tile-grey', ['ny']), e, s0, s1, 0, 0.01, at(-0.04), innerP - so * 0.05)
  } else {
    wbox(bt, allFaces('frame'), e, s0 - 0.04, s1 + 0.04, o.sill, o.sill + 0.02, at(D0), innerP - so * 0.03)
    wbox(bt, allFaces('exterior'), e, s0 - 0.03, s1 + 0.03, o.sill, o.sill + 0.02, at(-0.03), at(D0))
  }
  // radiator under interior windows (skipped when furniture stands there)
  const room = o.rooms[0] !== 'outside' ? o.rooms[0] : null
  if (room) {
    const rw = Math.min(1.0, o.width - 0.2), rh = Math.min(0.6, o.sill - 0.2)
    if (rh > 0.3) {
      const ry0 = 0.14, ry1 = ry0 + rh
      const pa = innerP - so * 0.02, pb = pa - so * 0.075
      const [xa, za] = wpos(e, p - rw / 2, Math.min(pa, pb)), [xb, zb] = wpos(e, p + rw / 2, Math.max(pa, pb))
      const bx = { x0: Math.min(xa, xb), z0: Math.min(za, zb), x1: Math.max(xa, xb), z1: Math.max(za, zb) }
      const blocked = furniture.some((f) => {
        if (f.onTopOf || f.type === 'rug' || f.type === 'plant' || f.type === 'plant-small' || f.y > 0.3) return false
        const r = footprint(f)
        return r.x0 < bx.x1 + 0.05 && r.x1 > bx.x0 - 0.05 && r.z0 < bx.z1 + 0.05 && r.z1 > bx.z0 - 0.05
      })
      if (!blocked) wbox(rad, allFaces('furn-white', [backFace(e, -so)]), e, p - rw / 2, p + rw / 2, ry0, ry1, pa, pb)
    }
  }
}

// ---------------------------------------------------------------- doors
function addDoor(e: WExt, o: Opening, bt: Batch, leafB: Batch, handles: Batch, glass: Batch): void {
  const t = e.w.t
  const H = o.height
  const p = alongOf(e, o)
  const s0 = p - o.width / 2, s1 = p + o.width / 2
  const F = allFaces('frame')
  // lining in the reveal
  wbox(bt, F, e, s0, s0 + LINING, 0, H, -t / 2, t / 2)
  wbox(bt, F, e, s1 - LINING, s1, 0, H, -t / 2, t / 2)
  wbox(bt, F, e, s0 + LINING, s1 - LINING, H - LINING, H, -t / 2, t / 2)
  // casing on both wall faces
  for (const sg of [1, -1]) {
    const pa = sg * t / 2, pb = sg * (t / 2 + CASING_T)
    wbox(bt, F, e, s0 - CASING_W, s0, 0, H, pa, pb)
    wbox(bt, F, e, s1, s1 + CASING_W, 0, H, pa, pb)
    wbox(bt, F, e, s0 - CASING_W, s1 + CASING_W, H, H + CASING_W, pa, pb)
  }
  if (!o.swing) return
  const g = leafGeom(e, o)
  const u = g.u
  const v: [number, number] = [-u[1], u[0]]
  const yLo = 0.008, yHi = H - LINING - 0.004
  // leaf-local (a along leaf from hinge, b across thickness) -> prism corners in world xz
  const lp = (a0: number, a1: number, b0: number, b1: number): [number, number][] =>
    ([[a0, b0], [a1, b0], [a1, b1], [a0, b1]] as [number, number][]).map(([a, b]) =>
      wpos(e, g.pivot[0] + u[0] * a + v[0] * b, g.pivot[1] + u[1] * a + v[1] * b))
  const entrance = o.type === 'entrance'
  const th = (entrance ? 0.058 : LEAF_T) / 2 // the front doors are visibly thicker than room doors
  const L = g.len
  /** stepped raised panel on one face: 6 mm rim (darker), 12 mm field; reads as a bevel under soft light */
  const panel = (a0: number, a1: number, y0: number, y1: number, faceSign: number, key = 'geo-leaf-panel'): void => {
    const s0 = faceSign > 0 ? th : -th - 0.007, s1 = faceSign > 0 ? th + 0.007 : -th
    leafB.prism(key, lp(a0, a1, s0, s1), y0, y1)
    const i0 = faceSign > 0 ? th + 0.007 : -th - 0.013, i1 = faceSign > 0 ? th + 0.013 : -th - 0.007
    leafB.prism('geo-leaf', lp(a0 + 0.035, a1 - 0.035, i0, i1), y0 + 0.035, y1 - 0.035)
  }
  if (!entrance) {
    leafB.prism('geo-leaf', lp(0, L, -th, th), yLo, yHi)
    for (const sg of [1, -1]) {
      panel(0.1, L - 0.1, 0.16, 1.0, sg)
      panel(0.1, L - 0.1, 1.1, yHi - 0.14, sg)
    }
  } else {
    // stiles + rails + glazed upper part (muntins), raised lower panel
    const stile = 0.12
    leafB.prism('geo-leaf', lp(0, stile, -th, th), yLo, yHi)
    leafB.prism('geo-leaf', lp(L - stile, L, -th, th), yLo, yHi)
    leafB.prism('geo-leaf', lp(stile, L - stile, -th, th), yLo, 0.95)
    leafB.prism('geo-leaf', lp(stile, L - stile, -th, th), 1.02, 1.12) // mid rail
    leafB.prism('geo-leaf', lp(stile, L - stile, -th, th), yHi - 0.11, yHi)
    for (const sg of [1, -1]) panel(stile + 0.02, L - stile - 0.02, 0.1, 0.87, sg)
    const mid = L / 2
    leafB.prism('geo-leaf', lp(mid - 0.02, mid + 0.02, -th * 0.6, th * 0.6), 1.12, yHi - 0.11) // vertical muntin
    leafB.prism('geo-leaf', lp(stile, L - stile, -th * 0.6, th * 0.6), (1.12 + yHi - 0.11) / 2 - 0.02, (1.12 + yHi - 0.11) / 2 + 0.02) // horizontal muntin
    const yg0 = 1.12, yg1 = yHi - 0.11
    for (const [b, dir] of [[-0.004, -1], [0.004, 1]] as [number, number][]) {
      const A = (a: number, y: number): V3 => {
        const [x, z] = wpos(e, g.pivot[0] + u[0] * a + v[0] * b, g.pivot[1] + u[1] * a + v[1] * b)
        return [x, y, z]
      }
      const nv = wpos(e, v[0] * dir, v[1] * dir)
      const o0 = wpos(e, 0, 0)
      glass.quad('glass', A(stile, yg0), A(L - stile, yg0), A(L - stile, yg1), A(stile, yg1), [nv[0] - o0[0], 0, nv[1] - o0[1]])
    }
  }
  // handles (metal): lever + rose on both faces at 1.02 m, on the free edge
  for (const sg of [1, -1]) {
    const b0 = sg > 0 ? th : -th - 0.014, b1 = sg > 0 ? th + 0.014 : -th
    handles.prism('metal', lp(L - 0.075, L - 0.035, b0, b1), 0.99, 1.05) // rose
    const bb0 = sg > 0 ? th + 0.014 : -th - 0.032, bb1 = sg > 0 ? th + 0.032 : -th - 0.014
    handles.prism('metal', lp(L - 0.135, L - 0.045, bb0, bb1), 1.005, 1.03) // lever
  }
}

// ---------------------------------------------------------------- baseboards + cornices
function addTrim(e: WExt, bt: Batch, top: Batch): void {
  const w = e.w
  // door intervals (incl. casing) are left free
  const gaps = doorOpenings(e).map((o) => { const p = alongOf(e, o); return [p - o.width / 2 - CASING_W, p + o.width / 2 + CASING_W] as [number, number] })
    .sort((a, b) => a[0] - b[0])
  const spans: [number, number][] = []
  let cur = e.lo
  for (const [a, b] of gaps) { if (a > cur) spans.push([cur, a]); cur = Math.max(cur, b) }
  if (e.hi > cur) spans.push([cur, e.hi])
  // horizontal boards a hair lower than vertical ones -> no coplanar tops in inside corners
  const bh = e.horiz ? BASE_H : BASE_H + 0.0006
  const ch = e.horiz ? CORNICE : CORNICE + 0.0006
  for (const sign of [1, -1]) {
    const pa = sign * w.t / 2, pb = sign * (w.t / 2 + BASE_T), cb = sign * (w.t / 2 + CORNICE)
    // cornice: wall is solid above the lintel, so it runs the full face
    for (const r of faceRuns(e, sign, e.lo, e.hi)) {
      if (r.key === 'exterior' || r.key === 'tile-bath') continue // no coving on the tiled wet rooms (photos 29 / 33)
      wbox(top, allFaces('geo-trim-hi', [backFace(e, sign), 'py']), e, r.a, r.b, WALL_HEIGHT - ch, WALL_HEIGHT, pa, cb)
    }
    // baseboard: interrupted at doors
    for (const [a, b] of spans) {
      for (const r of faceRuns(e, sign, a, b)) {
        if (r.key === 'exterior' || r.key === 'tile-bath') continue
        wbox(bt, allFaces('baseboard', [backFace(e, sign), 'ny']), e, r.a, r.b, 0, bh, pa, pb)
      }
    }
  }
}

// ---------------------------------------------------------------- floors + ceiling
function triangulated(poly: { x: number; z: number }[]): { tris: number[][]; pts: THREE.Vector2[] } {
  const pts = poly.map((p) => new THREE.Vector2(p.x, p.z))
  return { pts, tris: THREE.ShapeUtils.triangulateShape(pts, []) }
}

/** panelled (T&G) ceilings in the sleeping rooms + bath (photos 02, 08, 20, 24, 29); everything else is flat white (photos 18, 19) */
const CEIL_KEY: Record<RoomId, string> = {
  schlafen: 'geo-ceiling-panel', 'kind-links': 'geo-ceiling-panel', 'kind-mitte': 'geo-ceiling-panel', bad: 'geo-ceiling-panel',
  kueche: 'geo-ceiling-flat', wohnen: 'geo-ceiling-flat', 'flur-links': 'geo-ceiling-flat', 'flur-rechts': 'geo-ceiling-flat',
  wc: 'geo-ceiling-flat', abstell: 'geo-ceiling-flat', kamin: 'geo-ceiling-flat',
}

function addRooms(floors: Batch, ceil: Batch): void {
  for (const r of rooms) {
    const { pts, tris } = triangulated(r.polygon)
    for (const [i, j, k] of tris) {
      const a = pts[i], b = pts[j], c = pts[k]
      floors.tri(r.floor, [a.x, 0, a.y], [b.x, 0, b.y], [c.x, 0, c.y], [0, 1, 0])
      ceil.tri(CEIL_KEY[r.id], [a.x, WALL_HEIGHT, a.y], [b.x, WALL_HEIGHT, b.y], [c.x, WALL_HEIGHT, c.y], [0, -1, 0])
    }
  }
}

// ---------------------------------------------------------------- ceiling details (merged, ~40 tris each)
const bbox = (id: RoomId) => {
  const p = rooms.find((r) => r.id === id)!.polygon
  const xs = p.map((q) => q.x), zs = p.map((q) => q.z)
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }
}
const centre = (id: RoomId) => { const b = bbox(id); return { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 } }

function addCeilingDetails(d: Batch): void {
  const Y = WALL_HEIGHT
  const disc = (key: string, x: number, z: number, r: number, h: number, seg = 20) => {
    const g = new THREE.CylinderGeometry(r, r, h, seg)
    d.geo(key, g, new THREE.Matrix4().makeTranslation(x, Y - h / 2, z))
    g.dispose()
  }
  const slab = (key: string, x: number, z: number, w: number, dd: number, h: number) =>
    d.box(allFaces(key, ['py']), x - w / 2, Y - h, z - dd / 2, x + w / 2, Y, z + dd / 2)
  // pendant canopies (ceiling roses) where the photos show hanging lamps
  const table = furniture.find((f) => f.id === 'table-kueche')
  if (table) for (const k of [-0.42, 0.42]) disc('geo-ceiling-flat', table.x + k, table.z, 0.06, 0.024)
  const coffee = furniture.find((f) => f.id === 'coffee-table')
  if (coffee) disc('geo-ceiling-flat', coffee.x, coffee.z, 0.07, 0.026)
  for (const id of ['schlafen', 'kind-mitte', 'flur-rechts'] as RoomId[]) { const c = centre(id); disc('geo-ceiling-flat', c.x, c.z, 0.065, 0.024) }
  { const c = centre('flur-links'); disc('geo-ceiling-flat', c.x, c.z + 1.2, 0.065, 0.024) }
  // 60 x 60 LED panel in children's room 1 (photo 24): white frame + lit face
  { const c = centre('kind-links'); slab('frame', c.x, c.z, 0.64, 0.64, 0.016); slab('geo-led', c.x, c.z, 0.6, 0.6, 0.019) }
  // flush round ceiling lights in the windowless wet rooms
  for (const id of ['bad', 'wc', 'abstell'] as RoomId[]) { const c = centre(id); disc('geo-ceiling-flat', c.x, c.z, 0.15, 0.03, 24); disc('geo-led', c.x, c.z, 0.115, 0.034, 24) }
  // smoke detectors (mandatory in bedrooms and escape routes)
  for (const id of ['schlafen', 'kind-links', 'kind-mitte', 'flur-links'] as RoomId[]) {
    const c = centre(id); const o = id === 'flur-links' ? 0 : 0.9
    disc('geo-detector', c.x + o, c.z + (id === 'flur-links' ? -1.3 : 0.5), 0.055, 0.03, 16)
  }
}

/** floor under every door: material of the wet / tiled side if any, otherwise the first room */
function addThresholds(floors: Batch): void {
  for (const o of openings) {
    if (o.type === 'window') continue
    const e = extOf(o.wall)
    const p = alongOf(e, o)
    const floorOf = (id: string) => rooms.find((r) => r.id === id)?.floor
    const fa = o.rooms[0] === 'outside' ? undefined : floorOf(o.rooms[0])
    const fb = o.rooms[1] === 'outside' ? undefined : floorOf(o.rooms[1])
    const key = o.type === 'entrance' ? 'stone-light' : [fa, fb].find((k) => k && k.startsWith('tile')) ?? fa ?? fb ?? 'oak'
    const pad = 0.006
    const [xa, za] = wpos(e, p - o.width / 2, -e.w.t / 2 - pad), [xb, zb] = wpos(e, p + o.width / 2, e.w.t / 2 + pad)
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), z0 = Math.min(za, zb), z1 = Math.max(za, zb)
    const y = -0.001 // just below the room floors so overlaps never z-fight
    floors.quad(key, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0])
  }
}

// ---------------------------------------------------------------- Kaminanschluss: stove + round stovepipe
/** Free-standing wood stove in the chimney recess (photo 10), door facing the living room (east). */
function stoveSpec() {
  const b = bbox('kamin')
  const sx = b.x0 + 0.05 + 0.24, sz = (b.z0 + b.z1) / 2 // 0.48 m deep (x), 0.52 m wide (z)
  return { sx, sz, pipeX: sx - 0.03, rect: { x0: sx - 0.25, x1: sx + 0.25, z0: sz - 0.27, z1: sz + 0.27 } as Rect }
}

function addStove(st: Batch, corn: Batch): void {
  const { sx, sz, pipeX } = stoveSpec()
  const K = 'geo-stove'
  const cyl = (bt: Batch, key: string, r: number, y0: number, y1: number, x = pipeX, z = sz, seg = 24) => {
    const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg)
    bt.geo(key, g, new THREE.Matrix4().makeTranslation(x, (y0 + y1) / 2, z))
    g.dispose()
  }
  for (const dx of [-0.19, 0.19]) for (const dz of [-0.21, 0.21]) cyl(st, K, 0.018, 0, 0.12, sx + dx, sz + dz, 10) // legs
  st.box(allFaces(K), sx - 0.23, 0.12, sz - 0.25, sx + 0.23, 0.17, sz + 0.25) // plinth
  st.box(allFaces(K), sx - 0.22, 0.17, sz - 0.24, sx + 0.22, 0.68, sz + 0.24) // body
  st.box(allFaces(K), sx - 0.245, 0.68, sz - 0.265, sx + 0.245, 0.705, sz + 0.265) // top plate
  // door: frame + glowing glass + handle on the east face
  const fx = sx + 0.22
  st.box(allFaces(K), fx, 0.27, sz - 0.17, fx + 0.014, 0.6, sz + 0.17)
  st.quad('stove-glass', [fx + 0.0145, 0.3, sz - 0.135], [fx + 0.0145, 0.3, sz + 0.135], [fx + 0.0145, 0.57, sz + 0.135], [fx + 0.0145, 0.57, sz - 0.135], [1, 0, 0])
  st.box(allFaces(K), fx + 0.014, 0.42, sz + 0.15, fx + 0.04, 0.45, sz + 0.165) // handle
  st.box(allFaces('hearth-slate'), sx - 0.1, 0.0, sz - 0.42, sx + 0.62, 0.004, sz + 0.42) // spark-guard plate on the floor
  // round pipe (Ø 14 cm) straight to the ceiling, joint rings, wall/ceiling thimble + rosette
  cyl(st, K, 0.07, 0.705, WALL_HEIGHT)
  for (const y of [0.95, 1.45, 1.95]) cyl(st, K, 0.079, y, y + 0.03)
  cyl(st, K, 0.088, 2.32, 2.4) // sleeve of the ceiling passage
  cyl(corn, K, 0.125, WALL_HEIGHT - 0.014, WALL_HEIGHT) // rosette (in the ceiling group so it hides with the ceiling)
  cyl(corn, K, 0.098, WALL_HEIGHT - 0.1, WALL_HEIGHT - 0.014)
}

// ---------------------------------------------------------------- exterior: apron, path, terrace, hedges, trees
function addExterior(ex: Batch): void {
  const { x1: W, z1: D } = FOOTPRINT
  const y = -0.02
  const B = 0.9
  const top: V3 = [0, 1, 0]
  const flat = (key: string, x0: number, z0: number, x1: number, z1: number) =>
    ex.quad(key, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], top)
  const st = 'stone-light'
  flat(st, -B, -B, W + B, 0) // north
  flat(st, -B, D, W + B, D + B) // south
  flat(st, -B, 0, 0, D) // west
  flat(st, W, 0, W + B, D) // east
  // path from the front door
  const door = openings.find((o) => o.id === 'd-front')
  const px = door ? door.at.x : W / 4
  flat(st, px - 0.65, D + B, px + 0.65, D + 6)
  // terrace in front of the east door (photos 36, 38): 3 m deep paved patio
  const de = openings.find((o) => o.id === 'd-east')
  if (de) flat(st, W + B, de.at.z - 1.6, W + 3.4, de.at.z + 2.4)
}

// ---------------------------------------------------------------- assemble
export function buildGeometry(): HouseGeometry {
  localMats.forEach((m) => m.dispose())
  localMats.clear()
  const group = new THREE.Group()
  group.name = 'house'
  const shell = new Batch() // walls + reveals
  const trim = new Batch() // baseboards, frames (opaque)
  const rad = new Batch()
  const leafB = new Batch()
  const handles = new Batch()
  const glass = new Batch()
  const floors = new Batch()
  const ceilB = new Batch()
  const corn = new Batch()
  const exB = new Batch()
  const stoveB = new Batch()
  const detail = new Batch()

  const exts = extents()
  for (const e of exts) {
    addWall(e, shell)
    addTrim(e, trim, corn)
    for (const o of openings.filter((q) => q.wall === e.w.id)) {
      if (o.type === 'window') addWindow(e, o, trim, rad, glass)
      else addDoor(e, o, trim, leafB, handles, glass)
    }
  }
  // subfloor hides hairline gaps between room polygons and wall faces
  const F = FOOTPRINT
  floors.quad('oak', [F.x0, SUBFLOOR_Y, F.z1], [F.x1, SUBFLOOR_Y, F.z1], [F.x1, SUBFLOOR_Y, F.z0], [F.x0, SUBFLOOR_Y, F.z0], [0, 1, 0])
  addRooms(floors, ceilB)
  addThresholds(floors)
  addStove(stoveB, corn)
  addCeilingDetails(detail)
  addExterior(exB)

  shell.meshes('wall', group)
  trim.meshes('trim', group)
  rad.meshes('radiator', group)
  leafB.meshes('door', group)
  handles.bufs.forEach((b, key) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
    g.setIndex(b.idx)
    const m = new THREE.Mesh(g, metal())
    m.name = `handle:${key}`
    group.add(m)
  })
  glass.meshes('window', group)
  floors.meshes('floor', group)
  exB.meshes('exterior', group, { noShadow: true })
  // buildGarden(group) // lumpy foliage blobs replaced by the painted panorama (backdrop.ts)
  stoveB.meshes('stove', group)

  const ceiling = new THREE.Group()
  ceiling.name = 'ceiling'
  ceilB.meshes('ceiling', ceiling)
  corn.meshes('cornice', ceiling)
  detail.meshes('ceildetail', ceiling)
  group.add(ceiling)

  const collision = getCollisionData()
  return { group, ceiling, colliders: [...collision.rects, ...collision.leaves], collision }
}

export { EXT_T, DOOR_H }
