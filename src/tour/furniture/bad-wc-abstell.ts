import * as THREE from 'three'

import { at, bush, buildRooms, bx, canvasMat, cy, mirrorFake, paint, pl, rb, ribRadiator, rod, sp } from './shared'
import { LAYOUT } from '../plan'
import type { Furniture } from '../plan'

type G = THREE.Group
const C = 'furn-ceramic'
const CH = 'chrome'

/** bathtub: ring of walls around a recessed basin, rim, chrome mixer + overflow, side panel; tap end at +z */
function tub(g: G, f: Furniture): void {
  const w = f.w, d = f.d, h = f.h, t = 0.07
  rb(g, w, h, t, 0.03, C, 0, 0, -d / 2 + t / 2)
  rb(g, w, h, t, 0.03, C, 0, 0, d / 2 - t / 2)
  rb(g, t, h, d, 0.03, C, -w / 2 + t / 2, 0, 0)
  rb(g, t, h, d, 0.03, C, w / 2 - t / 2, 0, 0)
  bx(g, w - 2 * t + 0.02, 0.16, d - 2 * t + 0.02, C, 0, 0, 0)
  bx(g, w - 2 * t, 0.01, d - 2 * t, paint(0xe2e8ea, 0.12), 0, 0.16, 0)
  bx(g, 0.008, 0.36, d - 0.3, paint(0xf3f3f1, 0.35), -w / 2 - 0.003, 0.08, 0)
  cy(g, 0.03, 0.03, 0.006, CH, 0, 0.17, -d / 2 + 0.25, 12)
  const ez = d / 2 - t - 0.004
  cy(g, 0.03, 0.03, 0.008, CH, 0, 0.4, ez, 12).rotation.x = Math.PI / 2
  // mixer on the rim at the +z end
  const tz = d / 2 - t / 2
  cy(g, 0.03, 0.035, 0.05, CH, 0, h, tz, 12)
  rod(g, [0, h + 0.05, tz], [0, h + 0.1, tz - 0.05], 0.011, 0.011, CH, 8)
  rod(g, [0, h + 0.1, tz - 0.05], [0, h + 0.09, tz - 0.14], 0.011, 0.011, CH, 8)
  for (const s of [-1, 1]) { cy(g, 0.013, 0.013, 0.05, CH, s * 0.1, h, tz, 8) }
  cy(g, 0.03, 0.03, 0.04, C, 0, 0, 0, 4)
}

/** wall-hung WC: false wall panel with flush plate, bowl, seat and lid; back at local -z */
function wallWC(g: G, backZ: number, seat: THREE.Material | string, plateH = 1.0): void {
  bx(g, 0.5, 1.15, 0.13, 'tile-bath', 0, 0, backZ + 0.065)
  bx(g, 0.5, 0.03, 0.14, 'tile-trim', 0, 1.15, backZ + 0.065)
  bx(g, 0.22, 0.14, 0.014, 'furn-white', 0, plateH - 0.07, backZ + 0.135)
  bx(g, 0.07, 0.03, 0.016, CH, -0.045, plateH - 0.01, backZ + 0.137)
  bx(g, 0.07, 0.03, 0.016, CH, 0.045, plateH - 0.045, backZ + 0.137)
  sp(g, 1, C, 0, 0.3, backZ + 0.32, 0.18, 0.16, 0.27, 16)
  sp(g, 1, seat, 0, 0.44, backZ + 0.34, 0.18, 0.018, 0.25, 16)
  sp(g, 1, C, 0, 0.462, backZ + 0.32, 0.17, 0.014, 0.23, 16)
  bx(g, 0.34, 0.08, 0.05, C, 0, 0.46, backZ + 0.13)
}

/** sheep-shaped toilet-roll figure (photo 29): fluffy white body, dark head + legs */
function sheep(g: G, x: number, y: number, z: number): void {
  const wool = paint(0xf4f2ec, 1), dark = paint(0x2a2a2c, 0.7)
  sp(g, 0.05, wool, x, y + 0.06, z, 1, 0.85, 1.2, 10)
  sp(g, 0.028, dark, x, y + 0.075, z + 0.075, 1, 1.05, 1, 8)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.006, 0.006, 0.04, dark, x + sx * 0.025, y, z + sz * 0.03, 5)
}
function toiletBad(g: G): void { wallWC(g, -0.275, paint(0xf0f0ee, 0.35)); sheep(g, 0.0, 1.18, -0.2) }
const printed = (): THREE.Material => canvasMat('seat-print', 128, 128, (c, w, h) => {
  // teal wood planks (photo 32): horizontal boards with grain lines, a few pale shell shapes
  c.fillStyle = '#4f9db2'; c.fillRect(0, 0, w, h)
  for (let i = 0; i < 8; i++) {
    const y = i * (h / 8)
    c.fillStyle = i % 2 ? '#5aaabd' : '#458fa4'; c.fillRect(0, y, w, h / 8 - 2)
    c.fillStyle = '#2f6f82'; c.fillRect(0, y + h / 8 - 2, w, 2)
    c.strokeStyle = 'rgba(30,80,96,0.35)'; c.lineWidth = 1
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(0, y + 5 + k * 4); c.lineTo(w, y + 6 + k * 4 + (i % 3)); c.stroke() }
  }
  c.fillStyle = 'rgba(232,244,246,0.85)'
  for (const [sx, sy] of [[0.25, 0.3], [0.7, 0.6], [0.4, 0.8]]) { c.beginPath(); c.ellipse(w * sx, h * sy, 9, 6, 0.5, 0, Math.PI, true); c.fill() }
}, { roughness: 0.4 })
function toiletWc(g: G, f: Furniture): void { wallWC(g, -f.d / 2, printed(), 1.05) }

function basin(g: G, f: Furniture, mirrorCab: boolean): void {
  const w = f.w, d = f.d
  rb(g, w, 0.14, d, 0.05, C, 0, 0.72, 0, 0, 3)
  bx(g, w - 0.14, 0.004, d - 0.14, paint(0xdfe5e7, 0.12), 0, 0.86, 0.02)
  cy(g, 0.022, 0.022, 0.006, CH, 0, 0.865, 0.06, 10)
  cy(g, 0.018, 0.018, 0.34, CH, 0, 0.4, -d / 2 + 0.11, 10)
  rod(g, [0, 0.4, -d / 2 + 0.11], [0, 0.45, -d / 2], 0.014, 0.014, CH, 8)
  const tz = -d / 2 + 0.06
  cy(g, 0.02, 0.025, 0.06, CH, 0, 0.86, tz, 10)
  rod(g, [0, 0.92, tz], [0, 0.93, tz + 0.1], 0.01, 0.01, CH, 8)
  if (!mirrorCab) return
  // mirror cabinet with white reveal, bright LED make-up strip above (real glow), glass shelf
  const zb = -d / 2 + 0.065
  bx(g, w, 0.68, 0.13, 'furn-white', 0, 1.3, zb)
  const rv = 0.025
  bx(g, w - 0.02, rv, 0.02, 'furn-white', 0, 1.3 + 0.68 - rv, zb + 0.067); bx(g, w - 0.02, rv, 0.02, 'furn-white', 0, 1.3, zb + 0.067)
  for (const sx of [-1, 1]) bx(g, rv, 0.68, 0.02, 'furn-white', sx * (w / 2 - rv / 2 - 0.01), 1.3, zb + 0.067)
  pl(g, w - 0.09, 0.62, mirrorFake(), 0, 1.33, zb + 0.068)
  const led = paint(0xfff6e0, 0.3, 0, { emissive: 0xfff0c8, emissiveIntensity: 3.2 })
  bx(g, w - 0.06, 0.02, 0.03, led, 0, 2.0, zb + 0.03)
  bx(g, w - 0.06, 0.02, 0.03, 'furn-white', 0, 1.98, zb + 0.03)
  // soft additive glow on the wall around the strip (fake light, no extra scene light)
  const glow = canvasMat('led-glow', 64, 64, (c, gw, gh) => { const r = c.createRadialGradient(gw / 2, gh / 2, 0, gw / 2, gh / 2, gw / 2); r.addColorStop(0, 'rgba(255,240,200,0.75)'); r.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = r; c.fillRect(0, 0, gw, gh) },
    { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, roughness: 1 })
  pl(g, w + 0.3, 0.5, glow, 0, 1.78, zb + 0.005)
  bx(g, w - 0.1, 0.012, 0.12, paint(0xd8e6ea, 0.1, 0, { transparent: true, opacity: 0.6 }), 0, 1.18, -d / 2 + 0.06)
  cy(g, 0.03, 0.03, 0.14, paint(0xe6c2a8, 0.4), -0.2, 0.86, 0.0, 10)
  cy(g, 0.025, 0.025, 0.09, paint(0x9ec7d0, 0.3), 0.2, 0.86, -0.02, 10)
}

function shower(g: G, f: Furniture): void {
  const s = f.w / 2
  // warm mid-taupe tiles with lighter grout (photos 29 / 30)
  const taupe = canvasMat('tile-taupe', 128, 128, (c, w, h) => {
    c.fillStyle = '#8c7a6c'; c.fillRect(0, 0, w, h)
    for (let i = 0; i < 16; i++) { c.fillStyle = i % 3 ? 'rgba(255,240,225,0.05)' : 'rgba(40,25,15,0.05)'; c.fillRect((i % 4) * 32, Math.floor(i / 4) * 32, 32, 32) }
    c.strokeStyle = '#b9aea3'; c.lineWidth = 2
    for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32); c.moveTo(i * 32, 0); c.lineTo(i * 32, h); c.stroke() }
  }, { roughness: 0.35, metalness: 0.05 })
  // structured / frosted glass: vertical ribs, ~35 % opaque, so the tiles show through
  const frost = canvasMat('shower-glass', 64, 64, (c, w, h) => {
    c.fillStyle = 'rgba(214,226,230,0.5)'; c.fillRect(0, 0, w, h)
    for (let x = 0; x < w; x += 4) { c.fillStyle = x % 8 ? 'rgba(255,255,255,0.35)' : 'rgba(150,170,178,0.35)'; c.fillRect(x, 0, 2, h) }
  }, { roughness: 0.15, transparent: true, opacity: 0.55, depthWrite: false })
  const tray = 'furn-white', mat = paint(0x3a3d3f, 0.9)
  rb(g, f.w, 0.06, f.d, 0.02, tray, 0, 0, 0)
  bx(g, f.w - 0.12, 0.008, f.d - 0.12, mat, 0, 0.06, 0) // dark grey anti-slip mat
  cy(g, 0.04, 0.04, 0.004, CH, 0, 0.068, 0, 14)
  pl(g, f.w, 1.95, taupe, 0, 0.06, -s + 0.005, 0)
  pl(g, f.d, 1.95, taupe, -s + 0.005, 0.06, 0, Math.PI / 2)
  // glass: fixed panel east, two sliding doors south with a silver frame and a visible track
  bx(g, 0.008, 1.9, f.d, frost, s - 0.004, 0.06, 0)
  const dw = f.w * 0.62
  bx(g, dw / 2, 1.86, 0.006, frost, -f.w * 0.19 - dw / 4, 0.08, s - 0.012)
  bx(g, dw / 2, 1.86, 0.006, frost, -f.w * 0.19 + dw / 4, 0.08, s + 0.002)
  for (const y of [0.06, 1.94]) { bx(g, 0.03, 0.03, f.d, CH, s - 0.004, y, 0); bx(g, dw, 0.03, 0.03, CH, -f.w * 0.19, y, s - 0.004) }
  bx(g, dw, 0.008, 0.03, CH, -f.w * 0.19, 1.925, s - 0.004) // double top rail
  for (const x of [-f.w * 0.19 - dw / 2, -f.w * 0.19, -f.w * 0.19 + dw / 2]) bx(g, 0.02, 1.9, 0.03, CH, x, 0.06, s - 0.004)
  bx(g, 0.03, 1.9, 0.03, CH, s - 0.004, 0.06, s - 0.004)
  bx(g, 0.012, 0.3, 0.014, CH, f.w * 0.12, 0.9, s + 0.02)
  // shower: mixer, riser, head
  cy(g, 0.03, 0.03, 0.03, CH, -s + 0.02, 1.05, 0.15, 10).rotation.z = Math.PI / 2
  rod(g, [-s + 0.02, 1.1, 0.1], [-s + 0.02, 1.95, 0.1], 0.008, 0.008, CH, 8)
  rod(g, [-s + 0.02, 1.95, 0.1], [-s + 0.09, 1.95, 0.1], 0.008, 0.008, CH, 8)
  cy(g, 0.07, 0.07, 0.012, CH, -s + 0.11, 1.93, 0.1, 18)
}

function shelfUnit(g: G, f: Furniture): void {
  const w = f.w, d = f.d
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.03, f.h, 0.03, paint(0xd8d8d6, 0.4, 0.6), sx * (w / 2 - 0.015), 0, sz * (d / 2 - 0.015))
  const cols = [0xb8a07c, 0x8f9aa3, 0xd9d4c6, 0xa8a58f, 0xa89486] // cardboard / grey / off-white, nothing saturated
  const card = paint(0xb69d78, 0.95)
  for (let i = 0; i < 5; i++) {
    const y = 0.15 + i * 0.4
    bx(g, w, 0.025, d, 'wood-light', 0, y, 0)
    // supplies: boxes / crates / bottles, deterministic
    for (let j = 0; j < 3; j++) {
      const bw = 0.16 + ((i * 3 + j) % 3) * 0.06, bh = 0.14 + ((i + j) % 3) * 0.06
      const kind = (i + j) % 3
      const x = -w / 2 + 0.12 + j * (w - 0.24) / 2.2
      if (kind === 0) rb(g, bw, bh, d - 0.1, 0.01, paint(cols[(i + j) % 5], 0.8), x, y + 0.025, 0, 0, 1)
      else if (kind === 1) cy(g, 0.05, 0.05, bh + 0.05, paint(cols[(i * 2 + j) % 5], 0.5), x, y + 0.025, 0, 10)
      else bx(g, bw, bh * 0.7, d - 0.1, card, x, y + 0.025, 0) // plain cardboard box, no relief map
    }
  }
}

function boiler(g: G, f: Furniture): void {
  cy(g, 0.19, 0.19, 1.2, 'furn-white', 0, 0.05, 0, 24)
  cy(g, 0.14, 0.19, 0.08, 'furn-white', 0, 1.25, 0, 24)
  bx(g, 0.1, 0.14, 0.02, paint(0x222325, 0.4), 0, 0.85, 0.185)
  bx(g, 0.03, 0.06, 0.02, paint(0xd93a2a, 0.5), 0.01, 0.88, 0.196)
  cy(g, 0.03, 0.03, 0.08, 'furn-dark', 0, 0, 0, 10)
  bx(g, 0.2, 2.5 - 1.2, 0.12, 'furn-white', 0, 1.2, -0.16) // wall duct hides the pipes up to the ceiling
  void f
}

function extras(root: G): void {
  // --- Bad: towel radiator on the west wall, towel, stool with tray + toiletries by the tub
  ribRadiator(root, 0.8, 0.5, 10.09, 0.2, 2.45, Math.PI / 2)
  { const t = at(root, 10.09, 2.45, Math.PI / 2)
    bx(t, 0.4, 0.34, 0.025, paint(0xe6e4df, 0.95), 0.05, 0.6, 0.07)
    // hook rail on the tile wall above the radiator
    bx(t, 0.55, 0.03, 0.014, 'furn-white', 0, 1.55, 0.007)
    for (const x of [-0.18, 0, 0.18]) { rod(t, [x, 1.55, 0.014], [x, 1.55, 0.05], 0.006, 0.006, 'metal-black', 5); cy(t, 0.011, 0.011, 0.012, 'metal-black', x, 1.545, 0.05, 8) } }
  { const s = at(root, 11.28, 2.05, 0)
    for (let i = 0; i < 3; i++) { const a = i * 2.1; rod(s, [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12], [Math.cos(a) * 0.09, 0.4, Math.sin(a) * 0.09], 0.012, 0.014, 'wood-dark', 6) }
    cy(s, 0.15, 0.15, 0.03, 'wood-light', 0, 0.4, 0, 20)
    bx(s, 0.26, 0.02, 0.18, 'wood-dark', 0, 0.43, 0)
    cy(s, 0.025, 0.025, 0.14, paint(0xe8d9a8, 0.4), -0.07, 0.45, 0, 10)
    cy(s, 0.022, 0.022, 0.1, paint(0x9ec7d0, 0.3), 0.0, 0.45, 0.03, 10)
    cy(s, 0.028, 0.028, 0.06, 'furn-white', 0.07, 0.45, -0.02, 10) }
  // --- Bad: window sill props (photo 29)
  { const w = at(root, LAYOUT.IN.x1 - 0.5, 0.2, 0)
    cy(w, 0.03, 0.03, 0.09, paint(0xb5643c, 0.5), -0.12, 1.17, 0, 12)
    cy(w, 0.022, 0.022, 0.16, paint(0x9ec7d0, 0.3), 0.0, 1.17, 0.02, 10)
    bx(w, 0.12, 0.03, 0.08, 'furn-white', 0.12, 1.17, -0.01) }
  // --- WC: black paper holder, decor shelf above the toilet
  { const h = at(root, 8.5, 2.89, Math.PI)
    bx(h, 0.14, 0.14, 0.03, 'furn-dark', 0, 0.62, 0)
    cy(h, 0.06, 0.06, 0.1, 'furn-white', 0, 0.6, 0.07, 16).rotation.x = Math.PI / 2
    rod(h, [0, 0.67, 0.02], [0, 0.67, 0.13], 0.005, 0.005, 'furn-dark', 4) }
  { const s = at(root, 8.12, 2.29, Math.PI / 2)
    bx(s, 0.8, 0.025, 0.16, 'wood-birch', 0, 1.35, 0.08)
    cy(s, 0.03, 0.04, 0.17, paint(0x2f6ea8, 0.3), -0.25, 1.375, 0.08, 12)
    cy(s, 0.03, 0.05, 0.02, paint(0xb5643c, 0.5), -0.05, 1.375, 0.08, 10)
    rb(s, 0.09, 0.14, 0.07, 0.02, 'furn-white', 0.12, 1.375, 0.08)
    cy(s, 0.035, 0.035, 0.09, 'furn-white', 0.28, 1.375, 0.08, 12) }
}

export function build(): THREE.Group {
  return buildRooms('furniture:bad-wc-abstell', ['bad', 'wc', 'abstell'], {
    bathtub: tub, 'washbasin-bad': (g, f) => basin(g, f, true), 'washbasin-wc': (g, f) => basin(g, f, false),
    plant: (g, f) => bush(g, 0, 0, 0, f.h, 5, 14, 'furn-white'), 'shower-bad': shower, 'toilet-bad': toiletBad, toilet: toiletWc, 'shelf-abstell': shelfUnit, 'boiler-abstell': boiler,
  }, extras)
}
void pl
