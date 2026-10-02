/**
 * textures.ts - procedural PBR canvas textures (colour + normal + roughness). Imported by materials.ts only.
 *
 * - Every generator is lazy and memoised: the first call bakes the texture, later calls return the same set.
 * - All textures tile seamlessly (periodic value noise). Sizes <= 1024 px, mipmaps + anisotropy on.
 * - Colour maps are sRGB, normal/roughness maps are linear data. Roughness is stored ABSOLUTE in the G channel
 *   (use material.roughness = 1). Normal maps are OpenGL (+Y up) tangent-space.
 * - "neutral" textures (plaster, tile, grain, weave, fur, brushed) are near-white and get their colour from
 *   material.color, so one bake serves many materials.
 * - UV scale is NOT part of the texture: materials.ts maps everything in world metres (see worldUV there).
 *   The `metres` field of each generator's doc comment says how much world space one repeat should cover.
 */
import * as THREE from 'three'

export interface TexSet {
  map: THREE.CanvasTexture
  normal: THREE.CanvasTexture | null
  rough: THREE.CanvasTexture | null
}
type RGB = [number, number, number]

// ------------------------------------------------------------------ stats (QA: window.__tourMatMs)
let bakeMs = 0
export const textureBakeMs = (): number => bakeMs

// ------------------------------------------------------------------ noise (periodic value noise)
const NT = new Float32Array(65536)
{
  let s = 1234567
  for (let i = 0; i < NT.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    NT[i] = s / 4294967296
  }
}
/** hash of two ints + seed -> [0,1) */
function hash(a: number, b: number, seed: number): number {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(seed, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
/** value noise in [0,1), periodic in u,v in [0,1) with cx x cy cells (integers) */
function vn(u: number, v: number, cx: number, cy: number, seed: number): number {
  const x = u * cx, y = v * cy
  const xf = Math.floor(x), yf = Math.floor(y)
  const fx = x - xf, fy = y - yf
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const x0 = xf % cx, y0 = yf % cy
  const x1 = x0 + 1 === cx ? 0 : x0 + 1, y1 = y0 + 1 === cy ? 0 : y0 + 1
  const o = seed * 7919, p = seed * 4513
  const r0 = ((y0 + o) & 255) << 8, r1 = ((y1 + o) & 255) << 8
  const c0 = (x0 + p) & 255, c1 = (x1 + p) & 255
  const a = NT[r0 | c0], b = NT[r0 | c1], c = NT[r1 | c0], d = NT[r1 | c1]
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

// ------------------------------------------------------------------ layers -> textures
class Layers {
  col: Uint8ClampedArray
  hgt: Float32Array
  rgh: Uint8ClampedArray
  constructor(public w: number, public h: number) {
    this.col = new Uint8ClampedArray(w * h * 4)
    this.hgt = new Float32Array(w * h)
    this.rgh = new Uint8ClampedArray(w * h)
  }
  /** run fn per row; row-sized closures tier up in V8 much faster than one giant OSR loop */
  eachRow(fn: (y: number) => void): void {
    for (let y = 0; y < this.h; y++) fn(y)
  }
  /** r,g,b 0..255 (sRGB), height (arbitrary units, see finish strength), rough 0..1 */
  put(x: number, y: number, r: number, g: number, b: number, hh: number, rough: number): void {
    const i = y * this.w + x, o = i * 4
    this.col[o] = r; this.col[o + 1] = g; this.col[o + 2] = b; this.col[o + 3] = 255
    this.hgt[i] = hh
    this.rgh[i] = rough * 255
  }
}

const made: THREE.Texture[] = []
function canvasTex(c: HTMLCanvasElement, srgb: boolean, aniso: number): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = aniso // clamped to the GPU maximum by three
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  made.push(t)
  return t
}
function canvasOf(w: number, h: number, data: Uint8ClampedArray): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d')!.putImageData(new ImageData(data as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0)
  return c
}

/** normal strength 0 = none; noRough = skip the roughness map; aniso = anisotropy */
function finish(L: Layers, normal: number, noRough = false, aniso = 8): TexSet {
  const { w, h } = L
  const map = canvasTex(canvasOf(w, h, L.col), true, aniso)
  let nt: THREE.CanvasTexture | null = null
  if (normal > 0) {
    const out = new Uint8ClampedArray(w * h * 4)
    const H = L.hgt
    L.eachRow((y) => {
      const ym = ((y - 1 + h) % h) * w, yp = ((y + 1) % h) * w, y0 = y * w
      for (let x = 0; x < w; x++) {
        const xm = (x - 1 + w) % w, xp = (x + 1) % w
        const dx = (H[y0 + xp] - H[y0 + xm]) * 0.5 * normal
        const dy = (H[yp + x] - H[ym + x]) * 0.5 * normal // canvas y points down = -v
        const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1)
        const o = (y0 + x) * 4
        out[o] = (-dx * inv * 0.5 + 0.5) * 255
        out[o + 1] = (dy * inv * 0.5 + 0.5) * 255
        out[o + 2] = (inv * 0.5 + 0.5) * 255
        out[o + 3] = 255
      }
    })
    nt = canvasTex(canvasOf(w, h, out), false, aniso)
  }
  let rt: THREE.CanvasTexture | null = null
  if (!noRough) {
    // roughness at half resolution is plenty
    const rw = w >> 1, rh = h >> 1
    const out = new Uint8ClampedArray(rw * rh * 4)
    L.eachRow((y) => {
      for (let x = 0; x < rw; x++) {
        const v = L.rgh[y * 2 * w + x * 2], o = (y * rw + x) * 4
        out[o] = v; out[o + 1] = v; out[o + 2] = v; out[o + 3] = 255
      }
    })
    rt = canvasTex(canvasOf(rw, rh, out), false, aniso)
  }
  return { map, normal: nt, rough: rt }
}

const cache = new Map<string, TexSet>()
function memo(key: string, fn: () => TexSet): TexSet {
  let t = cache.get(key)
  if (!t) {
    const t0 = performance.now()
    t = fn()
    const dt = performance.now() - t0
    bakeMs += dt
    if (typeof window !== 'undefined') { const w = window as unknown as { __tourMatBy?: Record<string, number> }; (w.__tourMatBy ??= {})[key] = Math.round(dt * 10) / 10 } // QA
    cache.set(key, t)
  }
  return t
}
export function disposeTextures(): void {
  made.forEach((t) => t.dispose())
  made.length = 0
  cache.clear()
  voileCache = null
}

// ------------------------------------------------------------------ wood planks (floors)
export interface WoodFloor {
  seed: number
  rows: number // boards across the texture
  boardW: number // m
  segs: number // planks along the texture
  plankLen: number // m
  dark: RGB
  light: RGB
  tone: number // per-plank tone variation 0..1
  streak: number // coarse streak contrast 0..1 (soft colour clouds inside a plank)
  rough: [number, number]
  /** wild figure (walnut): light figure streaks + dark grain lines, 0..1 */
  figure?: number
  /** per-plank hue jitter (warm/cool + tone), 0..1; replaces bright blotches on laminates */
  jitter?: number
  /** upper cap for the light/dark mix, keeps laminates from bleaching (default 1) */
  cap?: number
  /** darkening of the plank joints 0..1 (default 0.3) */
  groove?: number
  /** joint width in texels relative to the default (1); 0.5 = hairline */
  joint?: number
  /** fine fibre streaks across the plank (high frequency, along the grain), 0..1 */
  fibre?: number
  /** desaturation 0..1 (laminates look paler than the raw colour mix) */
  desat?: number
  /** plank-length variation 0..1: joints per row are spread irregularly instead of evenly (0 = all planks equal) */
  lenVar?: number
  /** depth of the plank-edge bevel in the normal map (default 0.25); also darkens the bevel colour */
  bevel?: number
  /** regular 1/3-plank stagger between rows (+- 3 % jitter) instead of random row offsets */
  stagger?: boolean
  /** default 256 x 512 */
  size?: [number, number]
}
/** metres covered by one repeat: [segs*plankLen, rows*boardW] (x along planks, z across) */
export const woodMetres = (o: WoodFloor): [number, number] => [o.segs * o.plankLen, o.rows * o.boardW]

export function woodFloorTex(name: string, o: WoodFloor): TexSet {
  return memo('wood:' + name, () => {
    const [W, H] = o.size ?? [256, 512]
    const L = new Layers(W, H)
    const { rows, segs } = o
    const fig = o.figure ?? 0, jit = o.jitter ?? 0, cap = o.cap ?? 1, gv = o.groove ?? 0.3
    const jw = o.joint ?? 1, fib = o.fibre ?? 0, dsat = o.desat ?? 0, bvl = o.bevel ?? 0.25
    const off: number[] = []
    for (let r = 0; r < rows; r++) off.push(o.stagger ? 1 + (r % 3) / 3 + (hash(r, 7, o.seed) - 0.5) * 0.3 : hash(r, 7, o.seed))
    // per plank: tone + colour jitter, computed once
    const nPl = rows * segs
    const pTone = new Float32Array(nPl), pJr = new Float32Array(nPl), pJb = new Float32Array(nPl)
    for (let i = 0; i < nPl; i++) {
      pTone[i] = hash(i, 3, o.seed) - 0.5
      pJr[i] = 1 + (hash(i, 5, o.seed) - 0.5) * 0.16 * jit
      pJb[i] = 1 - (hash(i, 6, o.seed) - 0.5) * 0.2 * jit
    }
    const pxBoard = H / rows
    // per-row plank boundaries (cumulative fractions of the texture width); equal weights = the old even spacing
    const lv = o.lenVar ?? 0
    const cum: number[][] = []
    for (let r = 0; r < rows; r++) {
      const w: number[] = []
      let sum = 0
      for (let k = 0; k < segs; k++) { const q = 1 + (hash(r * 16 + k, 9, o.seed) - 0.5) * 2 * lv; w.push(q); sum += q }
      const c = [0]
      for (let k = 0; k < segs; k++) c.push(c[k] + w[k] / sum)
      cum.push(c)
    }
    L.eachRow((y) => {
      const v = y / H
      const rowF = v * rows
      const b = Math.floor(rowF)
      const fy = rowF - b
      const dAcross = Math.min(fy, 1 - fy) * pxBoard
      for (let x = 0; x < W; x++) {
        const u = x / W
        const u2 = (u + off[b] / segs) % 1
        const cb2 = cum[b]
        let seg = 0
        while (seg < segs - 1 && u2 >= cb2[seg + 1]) seg++
        const pxPlank = (cb2[seg + 1] - cb2[seg]) * W
        const fx = (u2 - cb2[seg]) / (cb2[seg + 1] - cb2[seg])
        const id = b * segs + seg
        const tone = pTone[id]
        // fibres wander slightly along the plank: warp v with a low-frequency field, then two fibre octaves
        const vw = v + (vn(u, v, segs * 2, rows * 2, id + 17) - 0.5) * (0.6 / (rows * 8))
        const g1 = vn(u, v, segs * 2, rows * 3, id + o.seed) // soft colour clouds
        const f1 = vn(u, vw, segs * 5, rows * 15, id * 3 + o.seed) // fibres
        const f2 = vn(u, vw, segs * 11, rows * 35, id * 5 + o.seed) // fine pores
        const g2 = f1 * 0.65 + f2 * 0.35
        let t = 0.5 + tone * o.tone + (fx - 0.5) * (tone * 0.12) + (g1 - 0.5) * o.streak + (g2 - 0.5) * 0.3
        if (fib > 0) t += (vn(u, vw, segs * 9, rows * 14, id * 9 + o.seed) - 0.5) * fib // long fibre streaks (>= 3 texels tall: no pixel-level aliasing)
        if (fig > 0) {
          // walnut: bright figure streaks and dark grain lines, pronounced contrast
          const fg = sstep(0.6, 0.82, vn(u, v, segs * (3 + (id % 3)), rows * (8 + (id % 4)), id * 7 + o.seed))
          const dk = sstep(0.6, 0.8, vn(u, vw, segs * (2 + (id % 3)), rows * (18 + (id % 5) * 3), id * 11 + o.seed))
          t += (fg * 0.3 - dk * 0.26) * fig
          // second grain scale, different per plank: broad wavy bands + tighter cathedral lines, breaks the repeat
          const w2 = vn(u, vw, segs * (2 + (id % 3)), rows * (6 + (id % 5) * 3), id * 13 + o.seed)
          const w3 = vn(u, vw, segs * (6 + (id % 4) * 2), rows * (20 + (id % 3) * 8), id * 17 + o.seed)
          t += ((w2 - 0.5) * 0.3 + (w3 - 0.5) * 0.14) * fig
        }
        t = t < 0.02 ? 0.02 : t > cap ? cap : t
        // hairline joint + soft bevel, widths in texels so they survive the low texture size
        const d = Math.min(dAcross, Math.min(fx, 1 - fx) * pxPlank)
        const gr = 1 - sstep(0.3 * jw, 1.0 * jw, d)
        const bev = 1 - sstep(1.0 * jw, 2.6 * jw, d)
        const k = 1 - gv * gr - 0.04 * (bvl / 0.25) * bev * jw
        let cr = mix(o.dark[0], o.light[0], t) * k * pJr[id], cg = mix(o.dark[1], o.light[1], t) * k, cb = mix(o.dark[2], o.light[2], t) * k * pJb[id]
        if (dsat > 0) {
          const ly = cr * 0.299 + cg * 0.587 + cb * 0.114
          cr += (ly - cr) * dsat; cg += (ly - cg) * dsat; cb += (ly - cb) * dsat
        }
        L.put(
          x, y,
          cr, cg, cb,
          (g2 - 0.5) * 0.3 + (g1 - 0.5) * 0.12 - gr * 1.1 - bev * bvl,
          clamp01(mix(o.rough[0], o.rough[1], clamp01((f2 - 0.5) * 0.9 + 0.5)) + gr * 0.25), // pores only: cloudy gloss patches would read as smudges
        )
      }
    })
    return finish(L, 1.6)
  })
}

// ------------------------------------------------------------------ tile (neutral, 5x5 tiles per repeat)
export const TILE_N = 5
/** Near-white square tiles with recessed light-grey grout, 5x5 tiles per repeat. Tint with material.color.
 *  metres = 5 * tile size (0.30 m tile -> 1.5). Per-tile tone + glaze mottling (about +-3 %), bevelled edges with a
 *  soft edge highlight. Roughness map: tile 0.34, grout 0.9. */
export type TileKind = 'std' | 'floor' | 'kfloor' | 'splash' | 'bath'
const TILE_KINDS: Record<TileKind, { g: number; tile: number; grout: number; var: number; speck?: number; tint?: number; edge?: number; rough?: number; bev?: number; ns?: number; hs?: number }> = {
  std: { g: 0.55, tile: 1, grout: 0.86, var: 1 },
  floor: { g: 0.9, tile: 1, grout: 0.7, var: 1 }, // wider, darker grout: stays visible (and crisp) at a distance
  kfloor: { g: 0.6, tile: 0.93, grout: 0.8, var: 0.9, speck: 1.3, tint: 0.4, ns: 0.25, hs: 0.3 }, // kitchen floor (photos 04 / 19): flat glazed light grey-white ceramic (~#DEDDD8), mild tile-to-tile tone, 1-2 px shallow light-grey grout, normal map at ~25 %
  splash: { g: 0.8, tile: 0.95, grout: 1.02, var: 0.9 }, // grey wall tile with LIGHTER grout, strong tile-to-tile variation
  bath: { g: 0.85, tile: 1, grout: 0.78, var: 1.3, edge: 1.1, rough: 0.22, bev: 0.4, speck: 2.2 }, // bathroom / WC: glossy glaze with fine speckle, ~3 mm mid-grey grout (10 % darker than before, visible from 2 m), small bevel (photos 29 / 32)
}
export function tileTex(kind: TileKind = 'std'): TexSet {
  return memo('tile' + (kind === 'std' ? '' : ':' + kind), () => {
    const S = 400, C = S / TILE_N // 80 px per tile (4 mm per texel at 33 cm tiles)
    const K = TILE_KINDS[kind]
    const L = new Layers(S, S)
    const g = K.g // half grout width in px
    const pt = new Float32Array(TILE_N * TILE_N), pw = new Float32Array(TILE_N * TILE_N)
    for (let i = 0; i < pt.length; i++) { pt[i] = (hash(i, 1, 11) - 0.5) * 0.06 * K.var; pw[i] = (hash(i, 2, 11) - 0.5) * 0.02 * (K.tint ?? K.var) }
    L.eachRow((y) => {
      const fy = y % C, dy = Math.min(fy, C - fy)
      const ty = Math.floor(y / C)
      for (let x = 0; x < S; x++) {
        const fx = x % C, dx = Math.min(fx, C - fx)
        const d = Math.min(dx, dy)
        const gr = 1 - sstep(g - 0.5, g + 0.5, d)
        const id = Math.floor(x / C) + TILE_N * ty
        const n = vn(x / S, y / S, 85, 85, 5) // glaze speckle
        const sp = K.speck && K.speck > 1 ? (hash(x, y, 31) - 0.5) * 0.045 * (K.speck - 1) : 0 // per-texel glaze speckle (kitchen / bath floors)
        const m = vn(x / S, y / S, 10, 10, 6) // glaze cloud inside a tile
        const bevel = 1 - sstep(g, g + (kind === 'kfloor' ? 1.5 : 3.5) * (K.edge ? 1.5 : 1) * (K.bev ?? 1), d)
        const tone = (0.975 + pt[id] + (n - 0.5) * 0.02 * (K.speck ?? 1) + (m - 0.5) * 0.03 * K.var + bevel * 0.025 * (K.edge ?? 1) + sp) * K.tile // edges catch the light
        // floor / std tiles: patchy wear (glaze rubbed matt) and rare tiny chips, so the highlight is never a uniform hotspot
        const wear = kind === 'floor' || kind === 'kfloor' ? sstep(0.55, 0.8, vn(x / S, y / S, 14, 14, 9)) : 0
        const chip = kind === 'floor' && vn(x / S, y / S, 170, 170, 12) > 0.86 ? 1 : 0 // kfloor: no chips
        const c = mix(tone * (1 - 0.05 * chip), K.grout + (n - 0.5) * 0.05, gr) * 255
        L.put(x, y, c * (1 + pw[id]), c, c * (1 - pw[id]), (-gr * 2.4 * (K.bev ? 0.6 : 1) - bevel * 0.9 * (K.bev ?? 1) + (n - 0.5) * 0.12 - chip * 0.5) * (K.hs ?? 1), mix((K.rough ?? 0.34) + (m - 0.5) * 0.12 + wear * 0.22 + chip * 0.3, 0.9, gr))
      }
    })
    return finish(L, 1.3 * (K.ns ?? 1))
  })
}

// ------------------------------------------------------------------ plaster (neutral)
/** Rough-cast / Raufaser wall plaster, fine grained, low relief. metres ~0.7 per repeat. Tint with material.color. */
export function plasterTex(): TexSet {
  return memo('plaster', () => {
    const S = 256
    const L = new Layers(S, S)
    L.eachRow((y) => {
      const v = y / S
      for (let x = 0; x < S; x++) {
        const u = x / S
        const a = vn(u, v, 128, 128, 1) // fine orange-peel (about 1 cm cells at 1.2 m per repeat)
        const b = vn(u, v, 64, 64, 2)
        const d = vn(u, v, 200, 200, 7) // finest octave
        const blot = vn(u, v, 4, 4, 4) // broad roller / trowel blotches (colour only)
        const streak = vn(u, v, 3, 20, 5) // vertical roller streaks (colour only)
        const lum = (0.985 + (a - 0.5) * 0.016 + (b - 0.5) * 0.012 + (blot - 0.5) * 0.024 + (streak - 0.5) * 0.016) * 255
        // relief is small and fine; the amplitude lives in the roughness map (paint sheen breaks up in raking light)
        L.put(x, y, lum, lum, lum, (a * 0.6 + b * 0.25 + d * 0.5) * 0.3, 0.84 + (a - 0.5) * 0.14 + (b - 0.5) * 0.1 + (blot - 0.5) * 0.14)
      }
    })
    return finish(L, 1.0)
  })
}

// ------------------------------------------------------------------ white panel ceiling (tongue and groove)
/** White painted T&G boards, 8 boards (10 cm) per repeat -> metres 0.8. Tint with material.color. */
export function ceilingTex(): TexSet {
  return memo('ceiling', () => {
    const S = 256, rows = 8
    const L = new Layers(S, S)
    L.eachRow((y) => {
      const v = y / S
      const rowF = v * rows
      const b = Math.floor(rowF)
      const fy = rowF - b
      const d = Math.min(fy, 1 - fy) * (S / rows)
      const gr = 1 - sstep(0.6, 2.4, d)
      for (let x = 0; x < S; x++) {
        const u = x / S
        const gn = vn(u, v, 3, rows * 22, b * 5 + 1)
        const lum = (0.99 + (gn - 0.5) * 0.02 + (hash(b, 2, 4) - 0.5) * 0.04) * (1 - 0.1 * gr) * 255 // board tone +-2 %
        L.put(x, y, lum, lum, lum, (gn - 0.5) * 0.25 - gr * 2, 0.88 + gr * 0.08 + (gn - 0.5) * 0.06)
      }
    })
    return finish(L, 0.6)
  })
}

// ------------------------------------------------------------------ brick (exterior, running bond)
/** Red-brown clinker brick, running bond: 4 bricks x 10 courses per repeat -> metres [1.0, 0.75]. */
export function brickTex(): TexSet {
  return memo('brick', () => {
    const W = 384, H = 380, nx = 4, ny = 10
    const bw = W / nx, bh = H / ny
    const jx = 2.0, jy = 2.0 // half joint in px
    const L = new Layers(W, H)
    const bTone = new Float32Array(nx * ny), bPatch = new Float32Array(nx * ny)
    for (let i = 0; i < bTone.length; i++) { bTone[i] = hash(i, 9, 21); bPatch[i] = hash(i, 4, 33) > 0.86 ? 0.35 : 0 }
    L.eachRow((y) => {
      const row = Math.floor(y / bh)
      const fy = y - row * bh
      const dy = Math.min(fy, bh - fy)
      const offx = row % 2 ? bw / 2 : 0
      for (let x = 0; x < W; x++) {
        const xx = (x + offx) % W
        const col = Math.floor(xx / bw)
        const fx = xx - col * bw
        const dx = Math.min(fx, bw - fx)
        const j = 1 - Math.min(sstep(jy - 1, jy + 1, dy), sstep(jx - 1, jx + 1, dx))
        const id = row * nx + col
        const tone = bTone[id], patch = bPatch[id]
        const n = vn(x / W, y / H, 70, 70, 6)
        const k = 0.82 + tone * 0.32 + (n - 0.5) * 0.18
        const r = mix(164 * k + patch * 45, 190 + (n - 0.5) * 20, j)
        const g = mix(84 * k + patch * 35, 176 + (n - 0.5) * 20, j)
        const b = mix(63 * k + patch * 30, 158 + (n - 0.5) * 20, j)
        L.put(x, y, r, g, b, (n - 0.5) * 0.9 - j * 2.6, mix(0.9, 0.97, j))
      }
    })
    return finish(L, 1.6)
  })
}

// ------------------------------------------------------------------ wood grain (neutral, furniture)
/**
 * Timber fibres: 512 x 128 px, u = along the grain (1 m), v = across (0.25 m) -> map with floor [1, 0.25] (materials.ts
 * varies that scale per material so two pieces never show the same fibres). Tint with material.color.
 * Fibres are soft (low contrast), the surface is broken by fine open pores (small dark dashes in colour, height and
 * roughness) so the normal map reads as sawn + sanded timber and not as hair.
 * `boards` > 0 adds that many planks across v with dark seams and per-plank tone (rustic table top, cabinet fronts).
 */
export function grainTex(boards = 0): TexSet {
  return memo('grain' + boards, () => {
    const W = 512, H = 128
    const L = new Layers(W, H)
    L.eachRow((y) => {
      const v = y / H
      const bd = boards > 0 ? Math.floor(v * boards) : 0
      const fyb = boards > 0 ? v * boards - bd : 0.5
      const edge = boards > 0 ? Math.min(fyb, 1 - fyb) * (H / boards) : 99 // px to board edge
      const seam = 1 - sstep(0.3, 1.3, edge)
      const bt = boards > 0 ? (hash(bd, 4, 21) - 0.5) * 0.14 : 0
      for (let x = 0; x < W; x++) {
        const u = x / W
        const vw = v + (vn(u, v, 3, 2, 8) - 0.5) * 0.07 // fibres wander gently
        const f1 = vn(u, vw, 4, 32, 10 + bd)
        const f2 = vn(u, vw, 10, 64, 11 + bd)
        const ring = 0.5 + 0.5 * Math.sin((vw * 3 + vn(u, v, 2, 2, 9) * 1.4) * Math.PI * 2)
        const pn = vn(u, vw, 128, 48, 13 + bd)
        const pore = sstep(0.78, 0.9, pn) // open pores: short dark dashes along the grain
        const lum = (0.8 + bt + (f1 - 0.5) * 0.09 + (f2 - 0.5) * 0.05 + (ring - 0.5) * 0.07 - 0.07 * pore) * (1 - 0.45 * seam) * 255
        L.put(x, y, lum, lum * 0.985, lum * 0.96, (f1 - 0.5) * 0.35 + (f2 - 0.5) * 0.25 - pore * 0.9 - seam * 1.4, 0.6 + (f1 - 0.5) * 0.16 + seam * 0.2 + pore * 0.15)
      }
    })
    return finish(L, 1.1)
  })
}

// ------------------------------------------------------------------ woven fabric (neutral)
/** Plain weave, 64 threads per repeat -> metres ~0.15 (2 mm threads: a fine cloth, not sandpaper). Tint with material.color. */
export function weaveTex(): TexSet {
  return memo('weave', () => {
    const S = 256, T = 4
    const L = new Layers(S, S)
    L.eachRow((y) => {
      const j = Math.floor(y / T), fy = (y % T) / T
      for (let x = 0; x < S; x++) {
        const i = Math.floor(x / T), fx = (x % T) / T
        const over = (i + j) % 2 === 0
        // over: thread runs along y (profile across x); under: runs along x (profile across y)
        const prof = over ? Math.sin(fx * Math.PI) : Math.sin(fy * Math.PI)
        const n = vn(x / S, y / S, 128, 128, 12)
        const cl = vn(x / S, y / S, 5, 5, 25) // soft cloudy tone: worn / brushed patches, +-4 %
        const lum = (0.8 + prof * 0.12 + (n - 0.5) * 0.045 + (cl - 0.5) * 0.09) * 255
        L.put(x, y, lum, lum, lum, prof * 0.8 + (over ? 0.1 : 0) + (n - 0.5) * 0.1, 0.84 + (cl - 0.5) * 0.2 + (n - 0.5) * 0.05)
      }
    })
    return finish(L, 1.6)
  })
}

// ------------------------------------------------------------------ fur / sheepskin (neutral)
/** Fluffy fur, metres ~0.3 per repeat. */
export function furTex(): TexSet {
  return memo('fur', () => {
    const S = 256
    const L = new Layers(S, S)
    L.eachRow((y) => {
      for (let x = 0; x < S; x++) {
        const u = x / S, v = y / S
        const a = vn(u, v, 128, 128, 14), b = vn(u, v, 64, 64, 15), c = vn(u, v, 12, 12, 16)
        const lum = (0.78 + a * 0.16 + (c - 0.5) * 0.06) * 255
        L.put(x, y, lum, lum, lum * 0.985, a * 1.4 + b * 0.8, 0.95)
      }
    })
    return finish(L, 1.1, true)
  })
}

// ------------------------------------------------------------------ brushed metal (neutral)
/** Brushed stainless: streaks along u, metres ~0.4. */
export function brushedTex(): TexSet {
  return memo('brushed', () => {
    const S = 256
    const L = new Layers(S, S)
    L.eachRow((y) => {
      for (let x = 0; x < S; x++) {
        const u = x / S, v = y / S
        const s1 = vn(u, v, 2, 200, 17), s2 = vn(u, v, 6, 96, 18)
        const lum = (0.86 + (s1 - 0.5) * 0.1 + (s2 - 0.5) * 0.06) * 255
        L.put(x, y, lum, lum, lum, (s1 - 0.5) * 0.6, 0.36 + (s1 - 0.5) * 0.2)
      }
    })
    return finish(L, 1.2)
  })
}

// ------------------------------------------------------------------ terrazzo worktop
/** Beige laminate worktop with dark/light chips (photo 13), metres ~0.6 per repeat. Colour baked. */
export function terrazzoTex(): TexSet {
  return memo('terrazzo', () => {
    const S = 384
    const L = new Layers(S, S)
    L.eachRow((y) => {
      for (let x = 0; x < S; x++) {
        const u = x / S, v = y / S
        // fine, low-contrast grey-beige pebble pattern (photos 13 / 16): chips are half the old size, base ~#cfc9bd
        const n = vn(u, v, 128, 128, 19), m = vn(u, v, 80, 80, 20), q = vn(u, v, 192, 192, 23), c = vn(u, v, 6, 6, 21)
        let r = 207 + (c - 0.5) * 8, g = 201 + (c - 0.5) * 8, b = 189 + (c - 0.5) * 8
        if (m > 0.64) { const t = sstep(0.64, 0.69, m); r = mix(r, 188, t); g = mix(g, 182, t); b = mix(b, 168, t) }
        if (n > 0.66) { const t = sstep(0.66, 0.71, n); r = mix(r, 160, t); g = mix(g, 154, t); b = mix(b, 142, t) }
        if (q > 0.72) { const t = sstep(0.72, 0.77, q); r = mix(r, 226, t); g = mix(g, 222, t); b = mix(b, 212, t) }
        L.put(x, y, r, g, b, 0, 0.36 + (n - 0.5) * 0.08)
      }
    })
    return finish(L, 0, false, 4)
  })
}

// ------------------------------------------------------------------ cream rug
/** Cream rug with a quiet diamond pattern and pile, metres ~0.8 per repeat. Tint with material.color. */
export function rugTex(): TexSet {
  return memo('rug', () => {
    const S = 256
    const L = new Layers(S, S)
    L.eachRow((y) => {
      for (let x = 0; x < S; x++) {
        const u = x / S, v = y / S
        // warp the pattern so the diamonds are not perfectly regular
        const wu = u + (vn(u, v, 4, 4, 31) - 0.5) * 0.05, wv = v + (vn(u, v, 4, 4, 32) - 0.5) * 0.05
        const fx = (wu * 2) % 1, fy = (wv * 2) % 1
        const d = Math.abs(fx - 0.5) + Math.abs(fy - 0.5) // diamond distance
        const ring = sstep(0.11, 0.0, Math.abs(d - 0.36)) // soft, blurred outline
        const ring2 = sstep(0.09, 0.0, Math.abs(d - 0.2)) * 0.6
        const a = vn(u, v, 110, 110, 22), b = vn(u, v, 30, 30, 23), big = vn(u, v, 3, 3, 24)
        const lum = (0.94 + (a - 0.5) * 0.09 + (b - 0.5) * 0.04 + (big - 0.5) * 0.08) * (1 - 0.1 * ring - 0.06 * ring2) * 255
        L.put(x, y, lum, lum, lum, a * 0.9 + b * 0.5, 0.97)
      }
    })
    return finish(L, 0.5, true)
  })
}

// ------------------------------------------------------------------ floral fabric (curtains, chair cushions)
/** Cream fabric with red/blue/yellow/orange blossoms and green leaves (photos 04/13/14), metres ~0.6. Colour baked. */
export function floralTex(): TexSet {
  return memo('floral', () => {
    const S = 512
    const c = document.createElement('canvas')
    c.width = c.height = S
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.fillStyle = '#efe6d0'
    g.fillRect(0, 0, S, S)
    let seed = 99
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
    // draw a shape once, plus wrapped copies only where it crosses the tile edge (seamless repeat)
    const wrap = (x: number, y: number, r: number, fn: (ox: number, oy: number) => void) => {
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        if (x + ox + r < 0 || x + ox - r > S || y + oy + r < 0 || y + oy - r > S) continue
        fn(ox, oy)
      }
    }
    const leaf = (x: number, y: number, a: number, l: number, col: string, vein: string) =>
      wrap(x, y, l, (ox, oy) => {
        g.save(); g.translate(x + ox, y + oy); g.rotate(a); g.fillStyle = col
        g.beginPath(); g.ellipse(l / 2, 0, l / 2, l / 4.2, 0, 0, Math.PI * 2); g.fill()
        g.strokeStyle = vein; g.lineWidth = 1.5
        g.beginPath(); g.moveTo(2, 0); g.lineTo(l - 3, 0); g.stroke(); g.restore()
      })
    const flower = (x: number, y: number, r: number, col: string, inner: string, centre: string) =>
      wrap(x, y, r * 1.2, (ox, oy) => {
        g.save(); g.translate(x + ox, y + oy); g.rotate(rnd() * 6.28)
        g.fillStyle = col
        for (let k = 0; k < 6; k++) {
          g.rotate((Math.PI * 2) / 6)
          g.beginPath(); g.ellipse(r * 0.6, 0, r * 0.52, r * 0.3, 0, 0, Math.PI * 2); g.fill()
        }
        g.fillStyle = inner
        for (let k = 0; k < 6; k++) {
          g.rotate((Math.PI * 2) / 6)
          g.beginPath(); g.ellipse(r * 0.45, 0, r * 0.28, r * 0.13, 0, 0, Math.PI * 2); g.fill()
        }
        g.fillStyle = centre; g.beginPath(); g.arc(0, 0, r * 0.22, 0, Math.PI * 2); g.fill(); g.restore()
      })
    // dense large-scale print (photos 14 / 16 / 19): dark leaves first, then saturated blooms, then small buds
    const greens: [string, string][] = [['#2c5a2b', '#5f8f4a'], ['#3e7433', '#79a55a'], ['#1f4a2c', '#4a7c4a'], ['#54803a', '#8db35f']]
    for (let i = 0; i < 44; i++) { const [a, v] = greens[i % 4]; leaf(rnd() * S, rnd() * S, rnd() * 6.28, 56 + rnd() * 50, a, v) }
    const blooms: [string, string, string][] = [
      ['#b8322a', '#d9503f', '#f2c94c'], ['#2c56a3', '#4a7bc4', '#f2e3a0'], ['#e39a2a', '#f0bb4a', '#8a3a22'],
      ['#d8642a', '#ee8a4a', '#f6e6b0'], ['#a8264a', '#cc4a6a', '#f2d16b'],
    ]
    for (let i = 0; i < 17; i++) {
      const [a, b, cc] = blooms[i % 5]
      flower(rnd() * S, rnd() * S, 30 + rnd() * 24, a, b, cc)
    }
    for (let i = 0; i < 38; i++) {
      const [a] = blooms[i % 5]
      const x = rnd() * S, y = rnd() * S
      wrap(x, y, 9, (ox, oy) => { g.fillStyle = a; g.beginPath(); g.arc(x + ox, y + oy, 5 + rnd() * 4, 0, Math.PI * 2); g.fill() })
    }
    const data = g.getImageData(0, 0, S, S)
    const L = new Layers(S, S)
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const o = (y * S + x) * 4
      const n = vn(x / S, y / S, 200, 200, 24)
      const k = 0.96 + (n - 0.5) * 0.08
      L.put(x, y, data.data[o] * k, data.data[o + 1] * k, data.data[o + 2] * k, n * 0.8, 0.92)
    }
    return finish(L, 1.0, true, 4)
  })
}

// ------------------------------------------------------------------ tree / branch photo mural (living room feature wall)
/**
 * Feature wall of the Wohnzimmer (Airbnb photos 05 / 09 / 11): weathered grey concrete with a warm orange-rust glow behind the
 * crown, dense fine black twigs hanging from the top edge that fade towards the bottom, strong vignette. 1536 x 1024, NO tiling
 * (clamped): map it once over a whole wall rectangle (u along the wall, v = height / wall height). Colour only.
 */
export function muralTex(): TexSet {
  return memo('mural', () => {
    const W = 1024, H = 683, K = W / 768 // 3:2 = the TV wall (3.9 x 2.5 m); drawing code below works in the old 768 x 512 design space (scale K)
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const g = c.getContext('2d')!
    // ---- light grey-beige base #B7AFA4 -> #A89C8E (top to bottom), broad soft clouds, warm glow in the middle only (photos 06 / 09)
    const BW = 384, BH = 256 // soft clouds: low-res base, upscaled smoothly
    const base = document.createElement('canvas')
    base.width = BW; base.height = BH
    const img = base.getContext('2d')!.createImageData(BW, BH)
    const d = img.data
    for (let y = 0; y < BH; y++) {
      const v = y / BH
      for (let x = 0; x < BW; x++) {
        const u = x / BW
        const n1 = vn(u, v, 5, 3, 31), n2 = vn(u, v, 18, 10, 32), n3 = vn(u, v, 70, 40, 33)
        const cl = (n1 - 0.5) * 16 + (n2 - 0.5) * 10 + (n3 - 0.5) * 5
        let r = mix(183, 168, v) + cl, gg = mix(175, 156, v) + cl, b = mix(164, 142, v) + cl
        const d1 = Math.hypot((u - 0.45) * 2, (v - 0.5) * 1.15)
        const glow = Math.exp(-d1 * d1 * 4.5) * (0.8 + (n2 - 0.5) * 0.4)
        r = mix(r, 222, glow * 0.4); gg = mix(gg, 170, glow * 0.4); b = mix(b, 128, glow * 0.4)
        const eF = sstep(0, 0.03, Math.min(u, 1 - u)) * sstep(0, 0.04, 1 - v) // blend into the white wall paint
        const o = (y * BW + x) * 4
        d[o] = mix(236, r, eF); d[o + 1] = mix(235, gg, eF); d[o + 2] = mix(231, b, eF); d[o + 3] = 255
      }
    }
    base.getContext('2d')!.putImageData(img, 0, 0)
    g.imageSmoothingQuality = 'high'
    g.drawImage(base, 0, 0, W, H)
    g.scale(K, K)
    // ---- thin black twigs hanging from the top edge, ~60 % opacity, fading towards the bottom
    let seed = 9001
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
    g.lineCap = 'round'
    const twig = (x: number, y: number, a: number, len: number, w: number, depth: number): void => {
      if (depth <= 0 || len < 3) return
      const bend = (rnd() - 0.5) * 0.9
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len
      const mx = x + Math.cos(a + bend) * len * 0.5, my = y + Math.sin(a + bend) * len * 0.5
      const fade = 1 - 0.75 * sstep(0.08, 0.9, y / 512)
      g.strokeStyle = `rgba(16,13,11,${0.68 * fade})`
      g.lineWidth = Math.max(0.45, w)
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke()
      const n = rnd() < 0.6 ? 2 : 3
      for (let i = 0; i < n; i++) twig(ex, ey, a + (rnd() - 0.5) * 1.7 + (i - 0.5) * 0.3, len * (0.6 + rnd() * 0.2), w * 0.68, depth - 1)
      if (rnd() < 0.4) twig(ex, ey, a + (rnd() < 0.5 ? -1 : 1) * (0.35 + rnd() * 0.6), len * 0.5, w * 0.6, depth - 2)
    }
    for (let i = 0; i < 26; i++) {
      const x = (i + rnd() * 0.9) * (768 / 26), len = 80 + rnd() * 100, w = 1.1 + rnd() * 1.1
      twig(x, -6, Math.PI / 2 + (rnd() - 0.5) * 0.9, len, w, 6)
    }
    // sparse far hairline twigs (depth of field)
    g.strokeStyle = 'rgba(50,44,40,0.14)'
    g.lineWidth = 0.5
    for (let i = 0; i < 120; i++) {
      const x = rnd() * 768, y = 512 * (0.05 + rnd() * 0.5), a = Math.PI / 2 + (rnd() - 0.5) * 2.4, l = 14 + rnd() * 40
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke()
    }
    g.setTransform(1, 0, 0, 1, 0, 0)
    // fine photo-paper grain over everything (no vignette)
    const gd = g.getImageData(0, 0, W, H), q = gd.data
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = 1 + (hash(x, y, 77) - 0.5) * 0.07, o = (y * W + x) * 4
      q[o] *= k; q[o + 1] *= k; q[o + 2] *= k
    }
    g.putImageData(gd, 0, 0)
    const t = canvasTex(c, true, 8)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return { map: t, normal: null, rough: null }
  })
}

// ------------------------------------------------------------------ stove glass (fire behind dark glass)
/** 256 x 256: sooty dark glass, ember bed at the bottom, a few flame tongues, soot creeping up the edges. Used as map AND emissiveMap. */
export function fireTex(): TexSet {
  return memo('fire', () => {
    const S = 256
    const c = document.createElement('canvas')
    c.width = c.height = S
    const g = c.getContext('2d')!
    g.fillStyle = '#0d0706'
    g.fillRect(0, 0, S, S)
    // ember bed glow rising from the bottom centre
    const rg = g.createRadialGradient(S * 0.5, S * 1.02, 0, S * 0.5, S * 1.02, S * 0.85)
    rg.addColorStop(0, 'rgba(255,170,60,1)'); rg.addColorStop(0.25, 'rgba(230,90,20,0.95)'); rg.addColorStop(0.6, 'rgba(120,32,10,0.6)'); rg.addColorStop(1, 'rgba(30,8,4,0)')
    g.fillStyle = rg
    g.fillRect(0, 0, S, S)
    // flame tongues
    const tongue = (x: number, h: number, w: number, a: number) => {
      const lg = g.createLinearGradient(0, S, 0, S - h)
      lg.addColorStop(0, `rgba(255,214,110,${a})`); lg.addColorStop(0.45, `rgba(255,120,30,${a * 0.85})`); lg.addColorStop(1, 'rgba(160,40,10,0)')
      g.fillStyle = lg
      g.beginPath(); g.moveTo(x - w, S); g.quadraticCurveTo(x - w * 0.6, S - h * 0.55, x + (x - S / 2) * 0.04, S - h); g.quadraticCurveTo(x + w * 0.6, S - h * 0.55, x + w, S); g.fill()
    }
    for (const [x, h, w, a] of [[0.3, 120, 26, 0.7], [0.48, 168, 32, 0.85], [0.66, 130, 28, 0.75], [0.8, 90, 20, 0.55], [0.18, 80, 18, 0.5]] as const) tongue(x * S, h, w, a)
    // logs: dark silhouettes in the fire
    g.fillStyle = 'rgba(20,10,6,0.85)'
    g.save(); g.translate(S * 0.4, S * 0.93); g.rotate(-0.12); g.fillRect(-S * 0.3, -7, S * 0.6, 15); g.restore()
    g.save(); g.translate(S * 0.62, S * 0.88); g.rotate(0.16); g.fillRect(-S * 0.22, -6, S * 0.44, 13); g.restore()
    // soot: top of the glass and the corners are black-brown
    const sg = g.createLinearGradient(0, 0, 0, S * 0.6)
    sg.addColorStop(0, 'rgba(6,4,3,0.92)'); sg.addColorStop(1, 'rgba(6,4,3,0)')
    g.fillStyle = sg
    g.fillRect(0, 0, S, S * 0.6)
    for (const [gx, gy] of [[0, 1], [1, 1], [0, 0.5], [1, 0.5]] as const) {
      const cg = g.createRadialGradient(gx * S, gy * S, 0, gx * S, gy * S, S * 0.4)
      cg.addColorStop(0, 'rgba(6,4,3,0.75)'); cg.addColorStop(1, 'rgba(6,4,3,0)')
      g.fillStyle = cg
      g.fillRect(0, 0, S, S)
    }
    const t = canvasTex(c, true, 4)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return { map: t, normal: null, rough: null }
  })
}

// ------------------------------------------------------------------ slate / blackened steel (hearth plate)
/** Dark slate with fine cleavage streaks and patchy sheen, metres ~0.6 per repeat. Tint with material.color. */
export function slateTex(): TexSet {
  return memo('slate', () => {
    const S = 256
    const L = new Layers(S, S)
    L.eachRow((y) => {
      const v = y / S
      for (let x = 0; x < S; x++) {
        const u = x / S
        const a = vn(u, v, 96, 96, 30), b = vn(u, v, 14, 14, 31), s = vn(u, v, 6, 60, 32) // streaks along u
        const lum = (0.62 + (a - 0.5) * 0.1 + (b - 0.5) * 0.22 + (s - 0.5) * 0.14) * 255
        L.put(x, y, lum, lum, lum * 1.03, (a - 0.5) * 0.5 + (s - 0.5) * 0.5 + (b - 0.5) * 0.4, 0.5 + (b - 0.5) * 0.5 + (s - 0.5) * 0.25)
      }
    })
    return finish(L, 1.2)
  })
}

// ------------------------------------------------------------------ small canvas painters (2D-context textures)
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function paint2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return [c, c.getContext('2d')!]
}
/** run `fn` at the 9 wrapped offsets so anything crossing the tile edge continues on the other side */
function wrap9(g: CanvasRenderingContext2D, S: number, fn: () => void): void {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { g.save(); g.translate(dx, dy); fn(); g.restore() }
}

// ------------------------------------------------------------------ lace net (alpha)
/** Lace / voile with a flower-and-diamond pattern on a sheer net, 256 px = 0.3 m. Alpha texture: sheer 0.3, lace threads 0.95. */
export function laceTex(): TexSet {
  return memo('lace', () => {
    const S = 256
    const [c, g] = paint2d(S, S)
    g.fillStyle = 'rgba(255,255,255,0.08)'
    g.fillRect(0, 0, S, S)
    // fine mesh: 4 px diagonal threads
    g.strokeStyle = 'rgba(255,255,255,0.3)'
    g.lineWidth = 0.9
    g.beginPath()
    for (let i = -S; i <= S * 2; i += 4) { g.moveTo(i, 0); g.lineTo(i + S, S); g.moveTo(i, S); g.lineTo(i + S, 0) }
    g.stroke()
    g.strokeStyle = 'rgba(255,255,255,0.72)'
    g.fillStyle = 'rgba(255,255,255,0.72)'
    g.lineWidth = 1.6
    const flower = (cx: number, cy: number, r: number) => {
      g.beginPath(); g.arc(cx, cy, 2.5, 0, Math.PI * 2); g.fill()
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        g.beginPath()
        g.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.62, r * 0.28, a, 0, Math.PI * 2)
        g.stroke()
      }
    }
    wrap9(g, S, () => {
      flower(64, 64, 11); flower(192, 192, 11)
      flower(192, 64, 7); flower(64, 192, 7)
      // diamond chain joining the flowers
      g.beginPath()
      g.moveTo(64, 96); g.lineTo(96, 128); g.lineTo(64, 160); g.lineTo(32, 128); g.closePath()
      g.moveTo(192, 96); g.lineTo(224, 128); g.lineTo(192, 160); g.lineTo(160, 128); g.closePath()
      g.stroke()
      // scalloped bands top and bottom of the tile
      for (const y of [0, 128]) {
        g.beginPath()
        for (let x = 0; x < S; x += 32) g.arc(x + 16, y, 16, 0, Math.PI)
        g.stroke()
      }
    })
    const t = canvasTex(c, true, 4)
    return { map: t, normal: null, rough: null }
  })
}

// ------------------------------------------------------------------ voile (Wohnen curtains)
/** Off-white / light-grey voile, 256 x 256, u = across the cloth (0..1, clamped), v = up. Returns [colour map, alpha map (G channel)]:
 *  soft vertical fold bands vary tone and opacity, fine thread lines, a slightly denser hem at the bottom. */
let voileCache: [THREE.CanvasTexture, THREE.CanvasTexture] | null = null
export function voileTex(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  if (voileCache) return voileCache
  const t0 = performance.now()
  const S = 256
  const col = new Uint8ClampedArray(S * S * 4), alp = new Uint8ClampedArray(S * S * 4)
  for (let y = 0; y < S; y++) {
    const v = y / S // 0 = top
    for (let x = 0; x < S; x++) {
      const u = x / S
      const band = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 5.3 + vn(u, 0.3, 7, 1, 3) * 3)
      const soft = vn(u, v, 12, 3, 41) - 0.5
      const thread = vn(u, v, 128, 4, 42) - 0.5
      const tone = 236 + band * 14 - (1 - band) * 18 + soft * 14
      const a = (0.38 + band * 0.2 + soft * 0.16 + thread * 0.08 + sstep(0.9, 0.97, v) * 0.25) * (1 - sstep(0.965, 1, v)) // hem fades out over the last rows: no hard alpha edge
      const o = (y * S + x) * 4
      col[o] = tone - 3; col[o + 1] = tone - 1; col[o + 2] = tone; col[o + 3] = 255
      const av = clamp01(a) * 255
      alp[o] = av; alp[o + 1] = av; alp[o + 2] = av; alp[o + 3] = 255
    }
  }
  const mk = (data: Uint8ClampedArray, srgb: boolean) => {
    const tx = canvasTex(canvasOf(S, S, data), srgb, 4)
    tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping
    return tx
  }
  voileCache = [mk(col, true), mk(alp, false)]
  bakeMs += performance.now() - t0
  return voileCache
}

// ------------------------------------------------------------------ zebra print (fabric)
/** Black-on-white zebra stripes, seamless, 256 px = 0.5 m. Colour baked. */
export function zebraTex(): TexSet {
  return memo('zebra', () => {
    const S = 256
    const [c, g] = paint2d(S, S)
    g.fillStyle = '#f2f0ea'
    g.fillRect(0, 0, S, S)
    g.fillStyle = '#141414'
    g.lineCap = 'round'
    wrap9(g, S, () => {
      const rr = rng(41)
      for (let i = 0; i < 14; i++) {
        const y = (i + rr()) * (S / 14), w = 6 + rr() * 11, len = 90 + rr() * 90, x = rr() * S, sl = (rr() - 0.5) * 0.9
        g.beginPath()
        g.moveTo(x, y)
        g.quadraticCurveTo(x + len * 0.5, y + len * sl * 0.5 + (rr() - 0.5) * 30, x + len, y + len * sl)
        g.quadraticCurveTo(x + len * 0.5, y + len * sl * 0.5 + w, x, y + w * 0.4)
        g.closePath()
        g.fill()
        g.lineWidth = w * 0.6
        g.strokeStyle = '#141414'
        g.stroke()
      }
    })
    return { map: canvasTex(c, true, 4), normal: null, rough: null }
  })
}

// ------------------------------------------------------------------ garden backdrop (sky + tree line + hedge)
/** 1024 x 384 = 22 x 8.25 m plane standing 5.5 m outside the bedroom windows: bottom edge = lawn level (y 0), 46 px per metre. */
export function gardenTex(): TexSet {
  return memo('garden', () => {
    const W = 1024, H = 384
    const [c, g] = paint2d(W, H)
    const rnd = rng(7)
    const sky = g.createLinearGradient(0, 0, 0, H * 0.72)
    sky.addColorStop(0, '#5f9fd8'); sky.addColorStop(0.5, '#9ccbee'); sky.addColorStop(1, '#dcecf5')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // a few soft clouds
    for (let i = 0; i < 7; i++) {
      const cx = rnd() * W, cy = 20 + rnd() * 110
      for (let k = 0; k < 9; k++) {
        const x = cx + (rnd() - 0.5) * 120, y = cy + (rnd() - 0.5) * 16, r = 22 + rnd() * 30
        const rg = g.createRadialGradient(x, y, 0, x, y, r)
        rg.addColorStop(0, 'rgba(255,255,255,0.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = rg
        g.fillRect(x - r, y - r, r * 2, r * 2)
      }
    }
    const leafDots = (cx: number, cy: number, rx: number, ry: number, n: number, hue: number, lightBase: number, hazy: number) => {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd())
        const x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry
        const top = 1 - (y - (cy - ry)) / (2 * ry) // 1 at the crown top
        const l = lightBase + top * 14 + (rnd() - 0.5) * 14
        g.fillStyle = `hsla(${hue + (rnd() - 0.5) * 26},${34 + rnd() * 20 - hazy * 10}%,${l + hazy * 8}%,0.95)`
        const r = 2.4 + rnd() * 3.6
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
      }
    }
    // distant ridge: pale blue-green, low contrast (aerial perspective)
    g.fillStyle = 'rgba(150,176,166,0.9)'
    g.beginPath(); g.moveTo(0, H)
    for (let x = 0; x <= W; x += 8) g.lineTo(x, H - 3.9 * 46 - 22 * Math.sin(x * 0.011 + 1) - 14 * Math.sin(x * 0.037) - rnd() * 6)
    g.lineTo(W, H); g.closePath(); g.fill()
    // far row: tall trees (crowns 3.5 - 6.5 m), bluish and hazy
    for (let i = 0; i < 9; i++) {
      const cx = (i + 0.2 + rnd() * 0.6) * (W / 9), h = 3.6 + rnd() * 2.2
      const cy = H - h * 46, rx = 55 + rnd() * 40, ry = 42 + rnd() * 30
      g.fillStyle = '#4b3d30'
      g.fillRect(cx - 3, cy + ry * 0.5, 6, H - cy)
      leafDots(cx, cy, rx, ry, 620, 105, 22, 0.6)
      leafDots(cx - rx * 0.5, cy + ry * 0.4, rx * 0.6, ry * 0.6, 260, 100, 21, 0.6)
      leafDots(cx + rx * 0.5, cy + ry * 0.35, rx * 0.6, ry * 0.6, 260, 108, 23, 0.6)
    }
    // mid row: a few darker trees with visible trunks, branches and sky gaps between the crown clumps
    for (let i = 0; i < 6; i++) {
      const cx = (i + 0.3 + rnd() * 0.4) * (W / 6), h = 3.0 + rnd() * 1.6
      const cy = H - h * 46, rx = 40 + rnd() * 26, ry = 30 + rnd() * 18
      g.strokeStyle = '#3a2e24'; g.lineCap = 'round'
      g.lineWidth = 7; g.beginPath(); g.moveTo(cx, H); g.lineTo(cx + (rnd() - 0.5) * 8, cy + ry * 0.6); g.stroke()
      g.lineWidth = 3
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx, cy + ry * 1.0); g.lineTo(cx + s * rx * 0.7, cy + ry * 0.2); g.stroke() }
      leafDots(cx - rx * 0.6, cy + ry * 0.1, rx * 0.5, ry * 0.5, 190, 100, 20, 0.2)
      leafDots(cx + rx * 0.6, cy + ry * 0.1, rx * 0.5, ry * 0.5, 190, 96, 22, 0.2)
      leafDots(cx, cy - ry * 0.3, rx * 0.55, ry * 0.5, 190, 98, 25, 0.2)
    }
    // near hedge band 0 - 2.7 m, brighter
    for (let x = -30; x < W + 30; x += 34) {
      const h = 2.0 + rnd() * 0.9
      leafDots(x, H - h * 23, 46, h * 23, 260, 95, 24, 0)
    }
    // shaded base of the hedge / grass edge
    const bg = g.createLinearGradient(0, H - 26, 0, H)
    bg.addColorStop(0, 'rgba(20,40,14,0)'); bg.addColorStop(1, 'rgba(20,40,14,0.7)')
    g.fillStyle = bg
    g.fillRect(0, H - 26, W, 26)
    const t = canvasTex(c, true, 4)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return { map: t, normal: null, rough: null }
  })
}
