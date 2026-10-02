import * as THREE from 'three'

import { at, bracket, cardboard, hangTowel, foldMat, bush, buildRooms, bx, canvasMat, cy, mirrorFake, paint, pl, rb, ring, rod, sp } from './shared'
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
  const w = f.w, d = Math.min(f.d, 0.4), zc = -f.d / 2 + d / 2 // bowl 0.5 x 0.4 hard against the back wall
  rb(g, w, 0.1, d, 0.025, C, 0, 0.76, zc, 0, 3)
  bx(g, w - 0.09, 0.004, d - 0.09, paint(0xdfe5e7, 0.12), 0, 0.86, zc + 0.01)
  cy(g, 0.016, 0.016, 0.004, CH, 0, 0.861, zc + 0.06, 10)
  cy(g, 0.03, 0.045, 0.16, C, 0, 0.6, -f.d / 2 + 0.07, 12) // slim column
  cy(g, 0.012, 0.012, 0.22, CH, 0, 0.3, -f.d / 2 + 0.06, 8)
  rod(g, [0, 0.3, -f.d / 2 + 0.06], [0, 0.4, -f.d / 2], 0.009, 0.009, CH, 8)
  const tz = -f.d / 2 + 0.05
  cy(g, 0.012, 0.015, 0.045, CH, 0, 0.86, tz, 10)
  rod(g, [0, 0.9, tz], [0, 0.91, tz + 0.07], 0.006, 0.006, CH, 6)
  for (const s of [-1, 1]) cy(g, 0.007, 0.007, 0.02, CH, s * 0.05, 0.86, tz, 6)
  if (!mirrorCab) return
  // mirror cabinet 0.6 x 0.7 centred over the basin: white reveal, bright LED make-up strip above (real glow)
  const zb = -d / 2 + 0.065, mw = 0.6, mh = 0.7, my = 1.22
  bx(g, mw, mh, 0.13, 'furn-white', 0, my, zb)
  const rv = 0.025
  bx(g, mw - 0.02, rv, 0.02, 'furn-white', 0, my + mh - rv, zb + 0.067); bx(g, mw - 0.02, rv, 0.02, 'furn-white', 0, my, zb + 0.067)
  for (const sx of [-1, 1]) bx(g, rv, mh, 0.02, 'furn-white', sx * (mw / 2 - rv / 2 - 0.01), my, zb + 0.067)
  pl(g, mw - 0.09, mh - 0.06, mirrorFake(), 0, my + 0.03, zb + 0.068)
  const led = paint(0xfff6e0, 0.3, 0, { emissive: 0xfff0c8, emissiveIntensity: 3.2 })
  bx(g, mw - 0.06, 0.02, 0.03, led, 0, my + mh + 0.05, zb + 0.03)
  bx(g, mw - 0.06, 0.02, 0.03, 'furn-white', 0, my + mh + 0.03, zb + 0.03)
  // soft additive glow on the wall around the strip (fake light, no extra scene light)
  const glow = canvasMat('led-glow', 64, 64, (c, gw, gh) => { const r = c.createRadialGradient(gw / 2, gh / 2, 0, gw / 2, gh / 2, gw / 2); r.addColorStop(0, 'rgba(255,240,200,0.75)'); r.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = r; c.fillRect(0, 0, gw, gh) },
    { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, roughness: 1 })
  pl(g, mw + 0.3, 0.4, glow, 0, my + mh - 0.1, zb + 0.005)
  bx(g, w - 0.1, 0.012, 0.12, paint(0xd8e6ea, 0.1, 0, { transparent: true, opacity: 0.6 }), 0, 1.18, -d / 2 + 0.06)
  cy(g, 0.025, 0.025, 0.12, paint(0xe6c2a8, 0.4), -0.17, 0.86, -0.1, 10)
  cy(g, 0.02, 0.02, 0.08, paint(0x9ec7d0, 0.3), 0.17, 0.86, -0.1, 10)
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

/** steel-and-pine utility shelving: 4 corner uprights with cross braces, 5 shelves, mixed supplies; front +z */
function shelfUnit(g: G, f: Furniture): void {
  const w = f.w, d = f.d, steel = paint(0x8d9196, 0.4, 0.7)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.035, f.h, 0.035, steel, sx * (w / 2 - 0.02), 0, sz * (d / 2 - 0.02))
  for (const sx of [-1, 1]) for (const [y0, y1] of [[0.1, 0.9], [0.9, 1.7]] as [number, number][]) rod(g, [sx * (w / 2 - 0.02), y0, -d / 2 + 0.02], [sx * (w / 2 - 0.02), y1, -d / 2 + 0.02], 0.006, 0.006, steel, 5) // back diagonals
  const ys = [0.12, 0.52, 0.92, 1.32, 1.72]
  for (const y of ys) { bx(g, w - 0.03, 0.025, d, 'wood-light', 0, y, 0); bx(g, w - 0.03, 0.04, 0.012, steel, 0, y - 0.03, d / 2 - 0.006) }
  const top = (i: number) => ys[i] + 0.025
  const x = (k: number) => -w / 2 + 0.11 + k * 0.17
  // shelf 0 (floor level): vacuum cleaner + crate of bottles
  { const y = top(0); const vx = -w / 2 + 0.2
    rb(g, 0.3, 0.14, 0.24, 0.05, paint(0xc23a2a, 0.5), vx, y, 0.0, 0, 2)
    cy(g, 0.045, 0.045, 0.02, paint(0x222224, 0.5), vx - 0.08, y, 0.1, 10)
    rod(g, [vx + 0.08, y + 0.1, 0], [vx + 0.14, y + 0.42, -0.06], 0.012, 0.012, paint(0x3a3a3c, 0.5, 0.4), 6)
    rb(g, 0.1, 0.03, 0.06, 0.012, paint(0x3a3a3c, 0.5), vx + 0.14, y + 0.42, -0.06, 0, 1)
    rb(g, 0.26, 0.2, 0.22, 0.015, paint(0x2f5d8a, 0.6), w / 2 - 0.2, y, 0.0, 0, 1) // blue plastic bin with lid
    bx(g, 0.28, 0.025, 0.24, paint(0x24496c, 0.6), w / 2 - 0.2, y + 0.2, 0.0) }
  // shelf 1: towels + bottles
  { const y = top(1)
    for (let i = 0; i < 3; i++) rb(g, 0.3, 0.05, 0.22, 0.015, paint([0xe9e4da, 0x9ec7d0, 0xd9b8a0][i], 0.95), -w / 2 + 0.2, y + i * 0.05, 0, 0, 1) // folded towels
    for (let i = 0; i < 4; i++) { cy(g, 0.03, 0.03, 0.17, paint([0x2f6a3a, 0x6a3a1a, 0xd8c070, 0x2f6a3a][i], 0.2), x(2) + 0.02 + i * 0.07, y, -0.04, 10); cy(g, 0.012, 0.03, 0.04, paint([0x2f6a3a, 0x6a3a1a, 0xd8c070, 0x2f6a3a][i], 0.2), x(2) + 0.02 + i * 0.07, y + 0.17, -0.04, 10); cy(g, 0.012, 0.012, 0.03, paint([0x2f6a3a, 0x6a3a1a, 0xd8c070, 0x2f6a3a][i], 0.2), x(2) + 0.02 + i * 0.07, y + 0.2, -0.04, 8) }
    cy(g, 0.055, 0.055, 0.12, paint(0xd8d8d6, 0.5), w / 2 - 0.12, y, 0.02, 14) }
  // shelf 2: cleaning supplies (spray bottles, buckets) + cardboard box
  { const y = top(2)
    cy(g, 0.11, 0.09, 0.2, paint(0xc9ccd0, 0.5), -w / 2 + 0.14, y, 0.0, 14); ring(g, 0.1, 0.005, paint(0x55585c, 0.4, 0.6), -w / 2 + 0.14, y + 0.2, 0.0, 14)
    for (let i = 0; i < 3; i++) { cy(g, 0.032, 0.032, 0.18, paint([0x3a86c8, 0xe8e8e2, 0x58a85a][i], 0.4), x(1) + 0.08 + i * 0.075, y, 0.02, 10); bx(g, 0.03, 0.03, 0.05, paint(0x2a2a2c, 0.5), x(1) + 0.08 + i * 0.075, y + 0.18, 0.03) }
    rb(g, 0.28, 0.2, 0.22, 0.008, cardboard(), w / 2 - 0.17, y, 0.0, 0, 1) }
  // shelf 3: storage boxes, jars
  { const y = top(3)
    rb(g, 0.3, 0.22, 0.24, 0.012, cardboard(), -w / 2 + 0.18, y, 0.0, 0, 1)
    rb(g, 0.26, 0.16, 0.24, 0.012, cardboard(), -w / 2 + 0.18 + 0.29, y, 0.0, 0, 1)
    for (let i = 0; i < 3; i++) cy(g, 0.04, 0.04, 0.12, 'glass', w / 2 - 0.1 - i * 0.09, y, 0.0, 10) }
  // shelf 4: light bulbs box, rolled paper, basket
  { const y = top(4)
    rb(g, 0.28, 0.14, 0.22, 0.01, cardboard(), -w / 2 + 0.2, y, 0.0, 0, 1)
    for (let i = 0; i < 2; i++) cy(g, 0.05, 0.05, 0.14, paint(0xf0ede6, 0.7), 0.0 + i * 0.11, y, 0.02, 12)
    bx(g, 0.2, 0.06, 0.14, paint(0x9a9da1, 0.6), w / 2 - 0.15, y, 0.0) }
}

/** storage-room water heater: white tank with steel bands, top cap, copper pipes with shut-off valves, pressure-relief valve, drip tray, wall panel; front +z */
function boiler(g: G, f: Furniture): void {
  const cu = paint(0xb87333, 0.3, 0.9), tank = 'furn-white'
  bx(g, 0.5, 0.03, 0.4, paint(0x8d9196, 0.4, 0.6), 0, 0, 0.0) // drip tray
  cy(g, 0.185, 0.185, 1.12, tank, 0, 0.05, 0, 28)
  cy(g, 0.185, 0.165, 0.06, tank, 0, 1.17, 0, 28)
  cy(g, 0.13, 0.15, 0.05, tank, 0, 1.23, 0, 24) // domed cap
  cy(g, 0.17, 0.17, 0.015, 'furn-dark', 0, 1.26, 0, 24)
  for (const y of [0.3, 0.7, 1.05]) ring(g, 0.187, 0.005, paint(0xb9bcc0, 0.35, 0.8), 0, y, 0, 28)
  rb(g, 0.16, 0.2, 0.025, 0.008, paint(0x222325, 0.4), 0, 0.8, 0.185, 0, 1) // control panel
  cy(g, 0.028, 0.028, 0.02, paint(0xd93a2a, 0.5), -0.03, 0.9, 0.195, 10).rotation.x = Math.PI / 2
  bx(g, 0.07, 0.025, 0.012, paint(0x9ad0a0, 0.3, 0, { emissive: 0x66c070, emissiveIntensity: 0.6 }), 0.03, 0.83, 0.2) // status window
  // pipes: cold in (left) and hot out (right) from the cap up to the duct, elbows, valves
  for (const [sx, valve] of [[-1, 0x2a6ab8], [1, 0xc23a2a]] as [number, number][]) {
    const px = sx * 0.07
    rod(g, [px, 1.26, 0], [px, 1.5, 0], 0.011, 0.011, cu, 8)
    rod(g, [px, 1.5, 0], [sx * 0.14, 1.5, -0.1], 0.011, 0.011, cu, 8)
    rod(g, [sx * 0.14, 1.5, -0.1], [sx * 0.14, 2.45, -0.14], 0.011, 0.011, cu, 8)
    sp(g, 0.017, cu, px, 1.5, 0, 1, 1, 1, 8)
    cy(g, 0.022, 0.022, 0.03, cu, px, 1.33, 0, 8)
    bx(g, 0.07, 0.014, 0.014, paint(valve, 0.5), px, 1.39, 0)
  }
  rod(g, [0.185, 1.0, 0.0], [0.25, 1.0, 0.0], 0.013, 0.013, cu, 8) // pressure relief valve + drain
  rod(g, [0.25, 1.0, 0.0], [0.25, 0.1, 0.0], 0.008, 0.008, cu, 6)
  bx(g, 0.54, 2.5 - 1.2, 0.03, 'furn-white', 0, 1.2, -0.185) // wall duct boxing in the pipes up to the ceiling
  bx(g, 0.5, 0.95, 0.02, paint(0xe9e6de, 0.6), 0, 0.3, -0.19) // tiled-look wall panel behind the tank
  void f
}

function extras(root: G): void {
  // Bad: no washing machine (Auftraggeber)
  { const t = at(root, 10.045, 3.1, Math.PI / 2) // hook rail: oak board with brass hooks, two folded towels (west wall, 0.5 m clear of the door line)
    rb(t, 0.6, 0.07, 0.022, 0.006, 'wood-light', 0, 1.6, 0.011, 0, 1)
    for (let i = 0; i < 2; i++) {
      const x = -0.15 + i * 0.3
      rod(t, [x, 1.6, 0.02], [x, 1.6, 0.055], 0.005, 0.005, 'brass', 5)
      sp(t, 0.009, 'brass', x, 1.6, 0.058, 1, 1, 1, 6)
      hangTowel(t, 0.26, 0.5, foldMat(i ? 0xe6e2d8 : 0x9db5bd, 1, 1), x, 1.62, 0.07, 0, i + 2)
    } }
  { const r = at(root, 10.07, 2.6, Math.PI / 2) // tall white towel radiator (west wall, south of the basin)
    const rw = 0.5, rh = 1.15, y0 = 0.3
    for (const y of [0.1, 0.3, 0.5, 0.7, 0.9, 1.1]) rod(r, [-rw / 2, y0 + y, 0.06], [rw / 2, y0 + y, 0.06], 0.014, 0.014, 'radiator', 8)
    for (const sx of [-1, 1]) rb(r, 0.03, rh + 0.04, 0.03, 0.01, 'radiator', sx * (rw / 2), y0 - 0.02, 0.06, 0, 1)
    rb(r, 0.4, 0.3, 0.014, 0.006, paint(0xe6e4df, 0.95), 0, y0 + 0.75, 0.085, 0, 1) // hand towel over the rails
    rod(r, [rw / 2, y0 + 0.02, 0.06], [rw / 2, y0 - 0.05, 0.02], 0.008, 0.008, 'chrome', 6) }
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
  // --- WC (room x 8.05..9.45, z 2.20..3.08): loo-roll holder west wall, brush by the bowl, hand towel on the back wall, decor shelf
  { const h = at(root, 8.055, 2.5, Math.PI / 2) // chrome roll holder beside the toilet, spare roll above
    bx(h, 0.05, 0.1, 0.012, CH, 0, 0.62, 0.006)
    rod(h, [0, 0.67, 0.012], [0, 0.67, 0.12], 0.006, 0.006, CH, 6)
    cy(h, 0.055, 0.055, 0.1, 'furn-white', 0, 0.62, 0.07, 16).rotation.x = Math.PI / 2
    cy(h, 0.052, 0.052, 0.1, 'furn-white', 0, 0.84, 0.07, 14) }
  { const b = at(root, 8.78, 2.33, 0) // toilet brush in a steel holder
    cy(b, 0.05, 0.045, 0.36, paint(0xc9ccd0, 0.25, 0.9), 0, 0, 0, 14)
    cy(b, 0.052, 0.052, 0.012, paint(0x2a2a2c, 0.5), 0, 0.36, 0, 14)
    rod(b, [0, 0.36, 0], [0, 0.5, 0], 0.006, 0.006, paint(0x2a2a2c, 0.5), 5)
    sp(b, 0.03, paint(0x2a2a2c, 0.9), 0, 0.52, 0, 1, 1.5, 1, 8) }
  { const r = at(root, 8.78, 2.2, 0) // towel ring + hand towel on the north wall between toilet and basin
    ring(r, 0.03, 0.005, CH, 0, 1.2, 0.045, 14).rotation.set(0, 0, 0)
    hangTowel(r, 0.26, 0.42, foldMat(0xe9e5dc, 1, 1), 0, 1.2, 0.055, 0, 4) }
  { const s = at(root, 8.055, 2.6, Math.PI / 2) // birch shelf on the west wall above the roll holder
    bx(s, 0.6, 0.025, 0.16, 'wood-birch', 0, 1.35, 0.0)
    for (const bxp of [-0.22, 0.22]) bracket(s, bxp, 1.35, 0.14)
    cy(s, 0.028, 0.028, 0.1, 'furn-white', -0.2, 1.375, 0.07, 12) // soap dispenser
    cy(s, 0.006, 0.006, 0.05, CH, -0.2, 1.475, 0.07, 6)
    cy(s, 0.04, 0.045, 0.06, paint(0xb5643c, 0.5), 0.02, 1.375, 0.07, 10); bush(s, 0.02, 1.435, 0.07, 0.14, 3, 8, 'furn-white')
    cy(s, 0.05, 0.05, 0.1, 'furn-white', 0.22, 1.375, 0.07, 14); cy(s, 0.05, 0.05, 0.1, 'furn-white', 0.22, 1.475, 0.07, 14) }
}

export function build(): THREE.Group {
  return buildRooms('furniture:bad-wc-abstell', ['bad', 'wc', 'abstell'], {
    bathtub: tub, 'washbasin-bad': (g, f) => basin(g, f, true), 'washbasin-wc': (g, f) => basin(g, f, false),
    plant: (g, f) => bush(g, 0, 0, 0, f.h, 5, 14, 'furn-white'), 'shower-bad': shower, 'toilet-bad': toiletBad, toilet: toiletWc, 'shelf-abstell': shelfUnit, 'boiler-abstell': boiler,
  }, extras)
}
void pl
