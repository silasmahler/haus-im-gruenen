import * as THREE from 'three'

import { at, bush, buildRooms, bx, cloth, curtainRod, cy, legs4, lantern, paint, pl, rb, ring, rod, sp, canvasMat, tableLamp } from './shared'
import { fur } from './shared'
import type { Furniture } from '../plan'

type G = THREE.Group
const BLK = 'metal-black'
const WHITE = 'furn-white'

/** one bar handle (black), horizontal (len along x) or vertical */
const handle = (g: G, x: number, y: number, z: number, len = 0.2, vertical = false): void => {
  if (vertical) bx(g, 0.012, len, 0.02, BLK, x, y - len / 2, z + 0.01)
  else bx(g, len, 0.012, 0.02, BLK, x, y, z + 0.01)
}

type Kind = 'doors' | 'drawers' | 'dw' | 'oven' | 'corner'
/** base cabinet segment x0..x1 in the run's local frame (front at +d/2) */
function cab(g: G, d: number, x0: number, x1: number, kind: Kind): void {
  const w = x1 - x0, cx = (x0 + x1) / 2, zf = d / 2
  bx(g, w - 0.004, 0.77, d - 0.03, WHITE, cx, 0.1, -0.015)
  if (kind === 'oven') {
    bx(g, w - 0.01, 0.16, 0.02, WHITE, cx, 0.12, zf - 0.01)
    handle(g, cx, 0.245, zf, 0.3)
    bx(g, w - 0.03, 0.56, 0.025, 'steel', cx, 0.29, zf - 0.0125)
    bx(g, w - 0.14, 0.32, 0.012, 'steel-dark', cx, 0.33, zf + 0.004)
    rod(g, [cx - 0.22, 0.7, zf + 0.04], [cx + 0.22, 0.7, zf + 0.04], 0.008, 0.008, 'chrome', 8)
    for (const k of [-0.18, -0.06, 0.06, 0.18]) cy(g, 0.014, 0.014, 0.014, BLK, cx + k, 0.79, zf + 0.008, 8).rotation.x = Math.PI / 2
    return
  }
  if (kind === 'drawers') {
    let y = 0.11
    for (const h of [0.2, 0.24, 0.25]) { bx(g, w - 0.008, h - 0.006, 0.02, WHITE, cx, y, zf - 0.01); handle(g, cx, y + h - 0.045, zf, Math.min(0.32, w - 0.16)); y += h }
    return
  }
  if (kind === 'dw') {
    bx(g, w - 0.008, 0.73, 0.02, WHITE, cx, 0.11, zf - 0.01)
    bx(g, w - 0.008, 0.012, 0.005, paint(0x2a2a2d, 0.5), cx, 0.82, zf + 0.001)
    handle(g, cx, 0.79, zf, w - 0.2)
    return
  }
  const n = w > 0.75 ? 2 : 1
  for (let i = 0; i < n; i++) {
    const pw = w / n, px = x0 + pw * (i + 0.5)
    bx(g, pw - 0.008, 0.73, 0.02, WHITE, px, 0.11, zf - 0.01)
    handle(g, px + (n === 2 ? (i ? -1 : 1) * (pw / 2 - 0.04) : pw / 2 - 0.05), 0.8, zf, 0.22, true)
  }
}

/** wall cabinet segment; frosted-glass door when `glass` */
function upper(g: G, d: number, x0: number, x1: number, glass = false): void {
  const w = x1 - x0, cx = (x0 + x1) / 2, zb = -d / 2, dd = 0.33
  const y0 = 1.45, h = 0.72
  bx(g, w, h, dd - 0.02, WHITE, cx, y0, zb + dd / 2 - 0.01)
  const n = w > 0.8 ? 2 : 1
  for (let i = 0; i < n; i++) {
    const pw = w / n, px = x0 + pw * (i + 0.5)
    bx(g, pw - 0.006, h - 0.006, 0.02, WHITE, px, y0, zb + dd - 0.01)
    if (glass && i === n - 1) {
      bx(g, pw - 0.1, h - 0.1, 0.006, paint(0xdfe8e8, 0.18, 0, { transparent: true, opacity: 0.85 }), px, y0 + 0.05, zb + dd + 0.001)
    }
    bx(g, 0.012, 0.18, 0.02, BLK, px + (n === 2 ? (i ? -1 : 1) * (pw / 2 - 0.04) : pw / 2 - 0.05), y0 + 0.08, zb + dd + 0.01)
  }
}


/** tall white two-door fridge-freezer, 0.6 x 0.6 x 1.85, black bar handles (photo 18); local x = centre in the run, front +z */
function fridgeFreezer(g: G, cx: number): void {
  const w = 0.6, d = 0.6, h = 1.85, zf = 0.3
  const body = paint(0xf1f1ef, 0.3)
  rb(g, w, h, d, 0.012, body, cx, 0.02, 0.0, 0, 1)
  bx(g, w - 0.04, 0.02, d - 0.06, BLK, cx, 0, 0)
  // door seam + two door panels
  bx(g, w + 0.002, 0.006, 0.004, paint(0x9a9a98, 0.5), cx, 1.27, zf + 0.001)
  // long bar handles at the free edge of each door
  handle(g, cx + w / 2 - 0.05, 1.7, zf + 0.006, 0.34, true)
  handle(g, cx + w / 2 - 0.05, 1.2, zf + 0.006, 0.6, true)
  bx(g, 0.02, 0.014, 0.004, paint(0x666666, 0.5), cx - 0.2, 1.8, zf + 0.001)
}

function kitchenWest(g: G, f: Furniture): void {
  const L = f.w, d = f.d, e = L / 2
  bx(g, L - 0.02, 0.1, d - 0.09, BLK, 0, 0, -0.02)
  cab(g, d, e - 0.55, e, 'corner')
  cab(g, d, e - 1.15, e - 0.55, 'drawers')
  cab(g, d, -0.39, e - 1.15, 'drawers')
  cab(g, d, -0.99, -0.39, 'oven')
  fridgeFreezer(g, -e + 0.335)
  bx(g, e + 0.99 + 0.02, 0.03, d + 0.025, 'worktop', (e - 0.99) / 2, 0.87, 0.0125)
  // splash-back tiles behind the worktop, wall cabinets, hood, utensil rail
  bx(g, e + 0.99, 0.55, 0.01, 'splash-tile', (e - 0.99) / 2, 0.9, -d / 2 - 0.015)
  upper(g, d, e - 1.15, e, true)
  rod(g, [-0.3, 1.38, -d / 2 + 0.02], [0.45, 1.38, -d / 2 + 0.02], 0.007, 0.007, 'chrome', 6)
  const teal = paint(0x2aa198, 0.5)
  for (const x of [-0.2, -0.05, 0.1, 0.25, 0.4]) {
    rod(g, [x, 1.38, -d / 2 + 0.02], [x, 1.2, -d / 2 + 0.03], 0.004, 0.004, 'chrome', 4)
    bx(g, 0.05, 0.12, 0.012, x > 0.1 ? teal : 'steel', x - 0.025, 1.08, -d / 2 + 0.03)
  }
  // counter props
  { const kt = at(g, 0.25, 0, 0, 0.9)
    cy(kt, 0.075, 0.09, 0.19, 'steel', 0, 0, 0.0, 16); cy(kt, 0.04, 0.075, 0.04, 'steel', 0, 0.19, 0, 16)
    bx(kt, 0.02, 0.1, 0.04, BLK, 0.09, 0.1, 0)
    cy(g, 0.055, 0.055, 0.14, teal, 1.2, 0.9, -0.1, 14)
    for (let i = 0; i < 4; i++) rod(g, [1.2, 1.03, -0.1], [1.2 + (i - 1.5) * 0.03, 1.22, -0.1 + (i % 2) * 0.03], 0.005, 0.005, i % 2 ? 'furn-dark' : 'wood-birch', 5)
    sp(g, 0.05, paint(0xa8a29a, 0.7), 0.85, 0.94, 0.05, 1, 0.7, 1, 8) }
}

function kitchenNorth(g: G, f: Furniture): void {
  const L = f.w, d = f.d, e = L / 2
  bx(g, L - 0.02, 0.1, d - 0.09, BLK, 0, 0.0, -0.02)
  cab(g, d, -e, -e + 1.08, 'doors')
  cab(g, d, -e + 1.08, -e + 1.68, 'dw')
  cab(g, d, -e + 1.68, e, 'doors')
  bx(g, L + 0.02, 0.03, d + 0.025, 'worktop', 0, 0.87, 0.0125)
  bx(g, 0.75, 0.55, 0.01, 'splash-tile', e - 0.38, 0.9, -d / 2 - 0.015)
  upper(g, d, e - 0.8, e - 0.02, true)
  // paper towel roll on a stand + fruit bowl on the counter
  { const t = at(g, e - 0.3, 0, 0, 0.9)
    cy(t, 0.09, 0.09, 0.01, BLK, 0, 0, 0.1, 14); cy(t, 0.006, 0.006, 0.3, BLK, 0, 0.01, 0.1, 6)
    cy(t, 0.06, 0.06, 0.24, WHITE, 0, 0.02, 0.1, 16)
    cy(t, 0.16, 0.08, 0.06, paint(0xe8e2d6, 0.5), -0.28, 0, 0.12, 16)
    ;[0xd8621f, 0xc23a1c, 0xe0a52a].forEach((c, i) => sp(t, 0.033, paint(c, 0.6), -0.28 + (i - 1) * 0.05, 0.085, 0.12 + (i % 2) * 0.03, 1, 1, 1, 8)) }
}

function sink(g: G, f: Furniture): void {
  const b = 'sink-black'
  bx(g, f.w - 0.06, 0.012, f.d - 0.04, 'steel', 0, 0.0, 0)
  const bw = 0.34
  for (const x of [-0.25, 0.12]) {
    bx(g, bw + 0.04, 0.014, 0.4, b, x, 0.0, -0.01)
    bx(g, bw, 0.016, 0.34, paint(0x08080a, 0.5), x, 0.0, -0.01)
  }
  // draining board grooves
  for (let i = 0; i < 6; i++) bx(g, 0.008, 0.014, 0.28, 'steel-dark', 0.32 + i * 0.03, 0.0, 0.02)
  // gooseneck tap
  const tz = -f.d / 2 + 0.05, tx = -0.065
  cy(g, 0.022, 0.026, 0.05, 'chrome', tx, 0, tz, 12)
  rod(g, [tx, 0.05, tz], [tx, 0.3, tz], 0.012, 0.012, 'chrome', 8)
  rod(g, [tx, 0.3, tz], [tx + 0.015, 0.34, tz + 0.06], 0.011, 0.011, 'chrome', 8)
  rod(g, [tx + 0.015, 0.34, tz + 0.06], [tx + 0.02, 0.32, tz + 0.15], 0.011, 0.011, 'chrome', 8)
  rod(g, [tx + 0.02, 0.32, tz + 0.15], [tx + 0.02, 0.27, tz + 0.17], 0.011, 0.011, 'chrome', 8)
  bx(g, 0.02, 0.06, 0.02, 'chrome', tx + 0.05, 0, tz)
}

function hob(g: G, f: Furniture): void {
  const glass = paint(0x0a0a0c, 0.12, 0.3)
  bx(g, 0.58, 0.008, 0.5, glass, 0, 0.001, 0)
  const rimM = paint(0x8f9297, 0.4, 0.8)
  for (const [x, z, r] of [[-0.14, -0.11, 0.075], [0.14, -0.11, 0.06], [-0.14, 0.12, 0.06], [0.14, 0.12, 0.085]] as [number, number, number][]) {
    ring(g, r, 0.0025, rimM, x, 0.0105, z, 24)
    cy(g, r * 0.62, r * 0.62, 0.001, paint(0x1c1c1f, 0.3, 0.5), x, 0.0095, z, 20)
  }
  for (let i = 0; i < 4; i++) sp(g, 0.007, rimM, -0.15 + i * 0.1, 0.011, f.d / 2 - 0.03, 1, 0.4, 1, 6)
  // hood: smooth brushed stainless, slanted dark glass front, square flue up to the ceiling (hob group sits at y 0.9)
  const hs = paint(0xc2c5c8, 0.35, 1)
  bx(g, 0.6, 0.07, 0.44, hs, 0, 0.6, -0.02)
  const gl = bx(g, 0.58, 0.39, 0.02, paint(0x14181b, 0.1, 0.4), 0, 0.595, 0.09); gl.rotation.x = -0.6
  bx(g, 0.26, 0.88, 0.2, hs, 0, 0.72, -0.13)
}

function dwarf(g: G): void { void g }

function fridge(g: G, f: Furniture): void {
  const k = 'steel-dark'
  const bodyH = 1.45
  rb(g, f.w, bodyH, f.d, 0.012, k, 0, 0.03, 0)
  bx(g, f.w - 0.06, 0.03, f.d - 0.08, BLK, 0, 0, 0)
  bx(g, f.w + 0.002, 0.006, 0.004, BLK, 0, 0.03 + 0.42, f.d / 2 + 0.001)
  bx(g, 0.022, 0.42, 0.03, 'steel', -f.w / 2 + 0.06, 0.62, f.d / 2 + 0.01)
  bx(g, 0.022, 0.24, 0.03, 'steel', -f.w / 2 + 0.06, 0.2, f.d / 2 + 0.01)
  bx(g, f.w - 0.1, 0.06, 0.004, paint(0x111113, 0.3), 0, 1.36, f.d / 2 + 0.001)
  // microwave on top
  rb(g, 0.46, 0.27, 0.36, 0.012, paint(0x1d1d20, 0.35, 0.4), 0, 1.48, 0)
  bx(g, 0.28, 0.19, 0.006, paint(0x08080a, 0.12), -0.06, 1.52, 0.18)
  bx(g, 0.1, 0.19, 0.006, 'steel', 0.14, 1.52, 0.18)
  bx(g, 0.012, 0.16, 0.02, 'steel', 0.09, 1.535, 0.19)
}

/** weathered white-washed plank back wall (photo 15): light grey-cream vertical boards, worn grain */
const plankWash = (): THREE.Material => canvasMat('plank-wash', 256, 256, (c, w, h) => {
  c.fillStyle = '#e4e1d8'; c.fillRect(0, 0, w, h)
  const n = 7, bw = w / n
  for (let i = 0; i < n; i++) {
    const tone = 218 + ((i * 37) % 24)
    c.fillStyle = `rgb(${tone},${tone - 3},${tone - 10})`; c.fillRect(i * bw + 1, 0, bw - 2, h)
    for (let k = 0; k < 26; k++) { c.fillStyle = `rgba(150,146,134,${0.05 + ((k * 13 + i * 7) % 10) / 90})`; c.fillRect(i * bw + ((k * 29) % (bw - 3)), ((k * 71 + i * 13) % h), 1.2, 14 + ((k * 17) % 60)) }
    c.fillStyle = 'rgba(120,116,104,0.55)'; c.fillRect(i * bw, 0, 1.6, h)
  }
}, { roughness: 0.85 })
const mugGreen = (): THREE.Material => canvasMat('mug-green', 64, 64, (c, w, h) => {
  c.fillStyle = '#f3f1e8'; c.fillRect(0, 0, w, h); c.fillStyle = '#5f9a6a'
  for (let x = 4; x < w; x += 10) c.fillRect(x, 0, 5, h)
  c.fillStyle = '#2f2f2f'; c.beginPath(); c.arc(w * 0.28, h * 0.5, 7, 0, 7); c.fill()
}, { roughness: 0.3 })

/** white coffee-bar hutch: local x along the wall, +z front */
function coffeeBar(g: G, f: Furniture): void {
  const w = f.w, d = f.d
  const stl = paint(0xc2c5c8, 0.35, 1)
  for (const s of [-1, 1]) bx(g, 0.03, f.h, d, WHITE, s * (w / 2 - 0.015), 0, 0)
  bx(g, w, 0.03, d, WHITE, 0, f.h - 0.03, 0)
  bx(g, w - 0.06, 0.82, d - 0.02, WHITE, 0, 0.06, -0.01)
  bx(g, w - 0.06, 0.06, d - 0.06, BLK, 0, 0, -0.02)
  for (const s of [-1, 1]) { bx(g, w / 2 - 0.04, 0.78, 0.018, WHITE, s * (w / 4 - 0.005), 0.08, d / 2 - 0.009); bx(g, 0.012, 0.16, 0.02, BLK, s * 0.03, 0.78, d / 2 + 0.01) }
  bx(g, w - 0.06, 0.03, d, WHITE, 0, 0.88, 0)
  // weathered plank back wall + shelf
  bx(g, w - 0.06, f.h - 0.94, 0.012, plankWash(), 0, 0.91, -d / 2 + 0.008)
  bx(g, w - 0.06, 0.025, d - 0.02, WHITE, 0, 1.45, -0.01)
  // mug rail with hooks + green striped mugs
  bx(g, w - 0.08, 0.03, 0.02, WHITE, 0, 1.78, -d / 2 + 0.024)
  const mg = mugGreen()
  for (let i = 0; i < 5; i++) {
    const x = -0.36 + i * 0.18
    rod(g, [x, 1.78, -d / 2 + 0.03], [x, 1.7, -d / 2 + 0.05], 0.003, 0.003, 'chrome', 4)
    cy(g, 0.035, 0.03, 0.08, mg, x, 1.62, -d / 2 + 0.06, 12)
    ring(g, 0.024, 0.004, paint(0xf3f1e8, 0.35), x + 0.036, 1.66, -d / 2 + 0.06, 8).rotation.set(0, 0, 0)
  }
  // shelf: glass tea jug on a black warmer, bowls, glass jars
  cy(g, 0.075, 0.08, 0.035, BLK, -0.3, 1.475, 0.0, 16)
  cy(g, 0.066, 0.066, 0.15, 'glass', -0.3, 1.51, 0.0, 16)
  cy(g, 0.036, 0.036, 0.1, stl, -0.3, 1.52, 0.0, 12)
  cy(g, 0.068, 0.068, 0.014, BLK, -0.3, 1.66, 0.0, 16)
  rod(g, [-0.235, 1.62, 0.0], [-0.205, 1.58, 0.0], 0.007, 0.007, BLK, 5); rod(g, [-0.205, 1.58, 0.0], [-0.235, 1.52, 0.0], 0.007, 0.007, BLK, 5)
  cy(g, 0.09, 0.05, 0.07, paint(0xe8d9a8, 0.5), 0.05, 1.475, 0.0, 16)
  cy(g, 0.09, 0.05, 0.08, paint(0xe6d9c4, 0.5), 0.27, 1.475, -0.02, 16)
  cy(g, 0.03, 0.03, 0.1, 'glass', 0.4, 1.475, 0.0, 10)
  // counter: AEG-style drip coffee machine (steel body, black base, glass carafe), canister, tray with jars
  const mx = 0.02
  bx(g, 0.2, 0.03, 0.22, BLK, mx, 0.91, -0.01)
  rb(g, 0.19, 0.34, 0.075, 0.01, stl, mx, 0.94, -0.06)
  rb(g, 0.19, 0.07, 0.21, 0.012, stl, mx, 1.21, -0.005)
  bx(g, 0.19, 0.02, 0.212, BLK, mx, 1.21, -0.005)
  cy(g, 0.055, 0.058, 0.12, 'glass', mx, 0.945, 0.03, 16)
  cy(g, 0.05, 0.05, 0.05, paint(0x2b1a10, 0.3), mx, 0.95, 0.03, 12)
  cy(g, 0.058, 0.058, 0.02, BLK, mx, 1.065, 0.03, 16)
  rod(g, [mx + 0.055, 1.05, 0.03], [mx + 0.085, 1.0, 0.03], 0.007, 0.007, BLK, 5); rod(g, [mx + 0.085, 1.0, 0.03], [mx + 0.055, 0.96, 0.03], 0.007, 0.007, BLK, 5)
  cy(g, 0.05, 0.05, 0.14, 'furn-dark', -0.34, 0.91, 0.0, 16)
  cy(g, 0.052, 0.052, 0.015, 'brass', -0.34, 1.05, 0.0, 16)
  bx(g, 0.22, 0.02, 0.14, paint(0xc9b79a, 0.7), 0.3, 0.91, 0.02)
  cy(g, 0.03, 0.03, 0.08, 'glass', 0.26, 0.93, 0.02, 10)
  cy(g, 0.03, 0.03, 0.06, paint(0xd8a23a, 0.4), 0.34, 0.93, 0.02, 10)
  bush(g, 0.4, 0.91, -0.06, 0.2, 4, 10, 'furn-white')
}

function table(g: G, f: Furniture): void {
  const top = paint(0x3b302a, 0.42), leg = paint(0x2f2621, 0.5)
  // heavy weathered slab: thick satin top, deep apron, chunky 10 cm legs
  rb(g, f.w, 0.055, f.d, 0.008, top, 0, 0.705, 0, 0, 1)
  bx(g, f.w - 0.22, 0.09, f.d - 0.22, leg, 0, 0.615, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.11, 0.705, 0.11, leg, sx * (f.w / 2 - 0.11), 0, sz * (f.d / 2 - 0.11))
  bx(g, f.w - 0.22, 0.05, 0.05, leg, 0, 0.16, 0)
  // linen runner + fruit bowl
  bx(g, 1.15, 0.006, 0.26, paint(0x5c6a72, 0.95), 0, 0.76, 0.0)
  const bowl = paint(0xd8cdb6, 0.5)
  cy(g, 0.15, 0.08, 0.07, bowl, -0.42, 0.766, 0.0, 18)
  ;[0xc9382a, 0xe0a52a, 0x8fa53a, 0xd8621f, 0xc9382a].forEach((c, i) => sp(g, 0.036, paint(c, 0.55), -0.42 + Math.cos(i * 1.26) * 0.07, 0.86 + (i > 3 ? 0.03 : 0), Math.sin(i * 1.26) * 0.07, 1, 1, 1, 8))
}

/** ladder-back dining chair with floral seat cushion; front +z */
function chair(g: G): void {
  const m = 'wood-dark'
  for (const sx of [-1, 1]) {
    bx(g, 0.035, 0.46, 0.035, m, sx * 0.19, 0, 0.19)
    bx(g, 0.04, 0.88, 0.035, m, sx * 0.19, 0, -0.2)
  }
  rb(g, 0.42, 0.04, 0.42, 0.008, m, 0, 0.44, -0.0)
  for (const y of [0.56, 0.67, 0.78]) bx(g, 0.34, 0.06, 0.02, m, 0, y, -0.2)
  bx(g, 0.36, 0.03, 0.03, m, 0, 0.2, 0.19)
  rb(g, 0.39, 0.05, 0.39, 0.02, 'fabric-floral', 0, 0.48, 0.005, 0, 2)
  rb(g, 0.3, 0.16, 0.04, 0.018, 'fabric-floral', 0, 0.6, -0.17, 0, 2)
}

function extras(root: G): void {
  const t = fur('table-kueche')
  // hanging lamp bar with 3 pendants over the table (canopies come from geometry.ts at table.x +/- 0.42)
  for (const s of [-0.42, 0.42]) rod(root, [t.x + s, 2.5, t.z], [t.x + s, 1.98, t.z], 0.003, 0.003, 'furn-dark', 4)
  // rustic wood beam (~1.2 m) carrying three black cords with clear-glass round bulbs (photo 19); dressing.ts adds the glowing filament + light
  bx(root, 1.2, 0.07, 0.08, 'furn-wood', t.x, 1.955, t.z)
  for (const x of [-0.42, 0, 0.42]) {
    rod(root, [t.x + x, 1.955, t.z], [t.x + x, 1.83, t.z], 0.0025, 0.0025, BLK, 4) // cord
    cy(root, 0.016, 0.016, 0.06, BLK, t.x + x, 1.79, t.z, 8) // socket
    sp(root, 0.062, 'glass', t.x + x, 1.735, t.z, 1, 1.1, 1, 14) // clear glass globe
  }
  // floral curtains on both north windows, sills with plant / glasses / kettle
  const frame = (cx: number, halfW: number): void => {
    curtainRod(root, cx - halfW - 0.1, cx + halfW + 0.1, 2.28, 0.36)
    for (const s of [-1, 1]) cloth(root, 0.46, 1.42, 5, 0.05, 'fabric-floral', cx + s * (halfW - 0.12), 0.9, 0.34, 0) // dense gathered floral drapes (photos 14 / 16 / 19)
  }
  frame(4.75, 0.5); frame(6.81, 0.52)
  // sink window sill (photo 14): small lamp, herbs, two coloured stemmed glass candle holders
  tableLamp(root, 4.42, 1.07, 0.33, 0.3, paint(0x222224, 0.4, 0.4))
  bush(root, 4.66, 1.07, 0.31, 0.27, 2, 12, 'furn-white')
  const gl = (x: number, c: number): void => {
    cy(root, 0.006, 0.006, 0.07, paint(0xcfd6d8, 0.1, 0, { transparent: true, opacity: 0.6 }), x, 1.07, 0.31, 6)
    cy(root, 0.03, 0.015, 0.045, paint(c, 0.12, 0, { transparent: true, opacity: 0.85 }), x, 1.14, 0.31, 10)
  }
  gl(4.88, 0xe8792a); gl(4.99, 0x3fa34d)
  bush(root, 5.1, 1.07, 0.31, 0.18, 7, 9, 'terracotta')
  // wine bottle beside the sink
  cy(root, 0.038, 0.038, 0.2, paint(0x1c3a26, 0.15), 5.42, 0.9, 0.42, 12)
  cy(root, 0.014, 0.02, 0.09, paint(0x1c3a26, 0.15), 5.42, 1.1, 0.42, 8)
  bush(root, 6.55, 1.07, 0.3, 0.22, 6, 10, 'furn-white')
  cy(root, 0.045, 0.05, 0.14, paint(0xd8c9a8, 0.4), 7.0, 1.07, 0.3, 12)
  lantern(root, 7.12, 1.07, 0.3, 0.12)
}

export function build(): THREE.Group {
  return buildRooms('furniture:kueche', ['kueche'], {
    'kitchen-west': kitchenWest, 'kitchen-north': kitchenNorth, 'sink-unit': sink, hob, fridge, 'coffee-bar': coffeeBar,
    'dining-table': table, 'dining-chair': chair,
    'plant-small': (g) => bush(g, 0, 0, 0, 0.3, 9, 12, 'furn-white'),
  }, extras)
}
void dwarf; void legs4; void pl
