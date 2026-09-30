import * as THREE from 'three'

import { arcLamp, at, bake, bx, buildRooms, curtainRod, cy, lantern, orchid, paint, pl, pendant, rb, ribRadiator, rod, sp, tableLamp, bush, canvasMat, cloth, legs4, quiltMat, normalTex, ring } from './shared'
import type { Furniture } from '../plan'

type G = THREE.Group
const F = 'fabric-grey'

/** charcoal diamond-tufted L-sofa (photos 11, 12): local x = along the wall (chaise at -x), +z = front (bbox 2.15 x 1.15) */
function sofa(g: G): void {
  const CH = 0x4a4d52
  const plain = paint(CH, 0.92)
  const wood = 'wood-dark'
  // small tapered wooden feet
  for (const [x, z] of [[-1.0, -0.5], [1.0, -0.5], [1.0, 0.25], [-1.0, 0.52], [-0.45, 0.52], [-0.4, -0.5], [0.3, -0.5]])
    rod(g, [x + Math.sign(x) * 0.015, 0, z + Math.sign(z) * 0.015], [x, 0.13, z], 0.013, 0.02, wood, 8)
  // slim base frame
  rb(g, 2.15, 0.1, 0.9, 0.02, plain, 0, 0.12, -0.125, 0, 1)
  rb(g, 0.7, 0.1, 0.3, 0.02, plain, -0.725, 0.12, 0.42, 0, 1)
  // flat firm seat cushions with shallow diamond quilting (main part + chaise)
  rb(g, 1.31, 0.14, 0.685, 0.03, quiltMat(CH, 1.31, 0.685), 0.28, 0.22, -0.0175, 0, 2)
  rb(g, 0.7, 0.14, 0.935, 0.03, quiltMat(CH, 0.7, 0.935), -0.725, 0.22, 0.1075, 0, 2)
  // back: tall flat quilted panel, slightly reclined, plus a slim arm on the +x side
  const back = rb(g, 2.01, 0.42, 0.18, 0.045, quiltMat(CH, 2.01, 0.42), -0.07, 0.36, -0.47, 0, 2); back.rotation.x = -0.08
  rb(g, 0.14, 0.34, 0.9, 0.04, quiltMat(CH, 0.9, 0.34), 1.005, 0.22, -0.125, 0, 2)
  // two low scatter cushions, not lumps
  const pillow = paint(0x62666c, 0.95)
  const c1 = rb(g, 0.42, 0.36, 0.1, 0.04, pillow, -0.82, 0.36, -0.3, 0.1, 2); c1.rotation.x = -0.35
  const c2 = rb(g, 0.38, 0.34, 0.1, 0.04, pillow, 0.72, 0.36, -0.3, -0.16, 2); c2.rotation.x = -0.35
}

function armchair(g: G, f: Furniture): void {
  const A = paint(0x50545a, 0.92)
  legs4(g, 0.62, 0.64, 0.2, 0.013, 0.02, 'wood-birch', 0.03, 0, 0.035)
  rb(g, 0.78, 0.12, 0.78, 0.035, A, 0, 0.19, 0)
  rb(g, 0.5, 0.13, 0.55, 0.05, A, 0, 0.31, 0.07)
  for (const s of [-1, 1]) rb(g, 0.13, 0.3, 0.72, 0.05, A, s * 0.325, 0.19, 0.02)
  const b = rb(g, 0.78, 0.48, 0.15, 0.06, A, 0, 0.3, -0.31); b.rotation.x = -0.12
  // white sheepskin draped over the seat and back of the north chair (photos 11, 22)
  if (f.id === 'armchair-n') {
    sp(g, 0.28, 'sheepskin', 0.02, 0.455, 0.08, 1, 0.16, 0.95, 12)
    const bk = sp(g, 0.27, 'sheepskin', -0.02, 0.62, -0.3, 1, 0.2, 0.75, 12); bk.rotation.x = -0.9
  }
}

/** silver ornamental candlestick with a glass sleeve and a white candle */
function candlestick(g: THREE.Object3D, x: number, y: number, z: number, h = 0.3): void {
  const silver = paint(0xd6d9dc, 0.18, 1)
  cy(g, 0.04, 0.045, 0.012, silver, x, y, z, 14)
  cy(g, 0.008, 0.012, h * 0.55, silver, x, y + 0.012, z, 8)
  sp(g, 0.02, silver, x, y + h * 0.3, z, 1, 1.2, 1, 8)
  cy(g, 0.045, 0.02, 0.05, silver, x, y + h * 0.55, z, 12)
  cy(g, 0.036, 0.036, h * 0.42, 'glass', x, y + h * 0.58, z, 12)
  cy(g, 0.014, 0.014, h * 0.3, 'furn-white', x, y + h * 0.6, z, 8)
  sp(g, 0.01, 'bulb', x, y + h * 0.6 + h * 0.3, z, 1, 1.5, 1, 6)
}

/** black wire-frame side table with a round top and a rack shelf */
function wireTable(g: THREE.Object3D): void {
  const w = 'metal-black'
  cy(g, 0.22, 0.22, 0.02, paint(0xf4f2ec, 0.9), 0, 0.5, 0, 20)
  ring(g, 0.22, 0.006, w, 0, 0.5, 0, 20)
  ring(g, 0.19, 0.005, w, 0, 0.26, 0, 20)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    rod(g, [Math.cos(a) * 0.2, 0.5, Math.sin(a) * 0.2], [Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24], 0.005, 0.005, w, 5)
    const b = a + 0.5
    rod(g, [Math.cos(a) * 0.22, 0.26, Math.sin(a) * 0.22], [Math.cos(b) * 0.2, 0.5, Math.sin(b) * 0.2], 0.003, 0.003, w, 4)
  }
}

/** black Indian-style low table with turned legs, lanterns and a fruit bowl */
function coffeeTable(g: G): void {
  const lac = paint(0x111113, 0.22, 0.1)
  rb(g, 0.8, 0.045, 0.8, 0.01, lac, 0, 0.375, 0)
  bx(g, 0.68, 0.06, 0.68, lac, 0, 0.315, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * 0.33, z = sz * 0.33
    cy(g, 0.019, 0.026, 0.07, lac, x, 0, z, 10)
    sp(g, 0.036, lac, x, 0.115, z, 1, 1.35, 1, 10)
    cy(g, 0.027, 0.021, 0.14, lac, x, 0.17, z, 10)
    sp(g, 0.03, lac, x, 0.17, z, 1, 0.5, 1, 8)
  }
  candlestick(g, 0.2, 0.42, -0.17, 0.34)
  candlestick(g, 0.08, 0.42, 0.0, 0.26)
  const bowl = paint(0x1b1b1d, 0.3, 0.2)
  cy(g, 0.12, 0.06, 0.06, bowl, -0.15, 0.42, 0.15, 16)
  const fr = [0xd8621f, 0xc23a1c, 0xe0a52a, 0xd8621f, 0x8fa53a, 0xc23a1c]
  fr.forEach((c, i) => sp(g, 0.033, paint(c, 0.6), -0.15 + Math.cos(i * 1.05) * 0.055, 0.5 + (i > 3 ? 0.03 : 0), 0.15 + Math.sin(i * 1.05) * 0.055, 1, 1, 1, 8))
}

function tvUnit(g: G, f: Furniture): void {
  const k = 'furn-dark'
  legs4(g, f.w, f.d, 0.09, 0.012, 0.018, k, 0.05, 0, 0.02)
  bx(g, f.w, 0.03, f.d, k, 0, 0.09, 0)
  rb(g, f.w, 0.035, f.d, 0.008, k, 0, f.h - 0.035, 0)
  for (const x of [-f.w / 2 + 0.015, -f.w / 6, f.w / 6, f.w / 2 - 0.015]) bx(g, 0.03, f.h - 0.155, f.d - 0.02, k, x, 0.12, 0)
  bx(g, f.w - 0.04, f.h - 0.16, 0.01, paint(0x0e0e10, 0.6), 0, 0.12, -f.d / 2 + 0.02)
  // open shelves: set-top box + a few dark objects
  bx(g, 0.34, 0.05, 0.24, paint(0x2b2b2e, 0.4, 0.5), -f.w / 3, 0.12, 0)
  bx(g, 0.2, 0.03, 0.16, paint(0x1e1e20, 0.5, 0.3), f.w / 3, 0.12, 0)
  rb(g, 0.12, 0.13, 0.12, 0.02, paint(0x5b3b2a, 0.7), f.w / 2 - 0.3, 0.12, 0.02)
  rb(g, 0.3, 0.05, 0.22, 0.01, paint(0x3a3a3e, 0.6), 0, 0.12, 0)
}

function tv(g: G): void {
  const m = 'furn-dark'
  bx(g, 0.5, 0.012, 0.22, m, 0, 0, 0)
  bx(g, 0.1, 0.08, 0.03, m, 0, 0.012, -0.01)
  rb(g, 1.24, 0.72, 0.035, 0.008, m, 0, 0.075, -0.02)
  const scr = canvasMat('tv-screen', 256, 128, (c, w, h) => {
    c.fillStyle = '#0b0c0e'; c.fillRect(0, 0, w, h)
    const gr = c.createLinearGradient(0, 0, w, h)
    gr.addColorStop(0.15, 'rgba(255,255,255,0)'); gr.addColorStop(0.32, 'rgba(180,200,225,0.10)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)')
    c.fillStyle = gr; c.fillRect(0, 0, w, h)
  }, { roughness: 0.1, metalness: 0.3 })
  pl(g, 1.2, 0.68, scr, 0, 0.095, -0.0015)
}

function sideboard(g: G, f: Furniture): void {
  const k = paint(0x131315, 0.4, 0.1)
  legs4(g, f.w, f.d, 0.12, 0.012, 0.018, k, 0.06, 0, 0.02)
  rb(g, f.w, 0.66, f.d, 0.01, k, 0, 0.12, 0)
  rb(g, f.w + 0.02, 0.03, f.d + 0.02, 0.008, k, 0, 0.78, 0)
  const pnl = paint(0x1d1d20, 0.35, 0.15)
  for (let i = 0; i < 3; i++) {
    const x = -f.w / 3 + (i * f.w) / 3
    bx(g, f.w / 3 - 0.04, 0.58, 0.01, pnl, x, 0.16, f.d / 2 + 0.002)
    bx(g, 0.012, 0.1, 0.014, 'chrome', x + (i === 1 ? 0.2 : -0.2), 0.5, f.d / 2 + 0.008)
  }
  orchid(g, -0.5, 0.81, 0, 1.15)
  lantern(g, 0.45, 0.81, 0.0, 0.22)
  bx(g, 0.14, 0.18, 0.015, paint(0xc9b79a, 0.6), 0.65, 0.81, 0.06).rotation.x = -0.15
}

/** cream rug with a fine diamond / zigzag relief (photo 11), contrasty */
function rugMaterial(): THREE.Material {
  const map = canvasMat('rug-zig', 256, 256, (c, w, h) => {
    c.fillStyle = '#e9e3d3'; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#9d917a'; c.lineWidth = 6; c.lineJoin = 'miter'
    for (const r of [0.48, 0.36, 0.24, 0.12]) {
      c.beginPath(); c.moveTo(w * 0.5, h * (0.5 - r)); c.lineTo(w * (0.5 + r), h * 0.5); c.lineTo(w * 0.5, h * (0.5 + r)); c.lineTo(w * (0.5 - r), h * 0.5); c.closePath(); c.stroke()
    }
    c.fillStyle = '#9d917a'; c.fillRect(w * 0.5 - 4, h * 0.5 - 4, 8, 8)
    for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(120,108,88,${Math.random() * 0.12})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
  }, { roughness: 1 }) as THREE.MeshStandardMaterial
  const m = map.clone()
  const t = map.map!.clone()
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 8); t.needsUpdate = true
  m.map = t
  const n = normalTex(128, 3, (u, v) => { const d = Math.abs(u - 0.5) + Math.abs(v - 0.5); return 0.5 + 0.5 * Math.cos(d * Math.PI * 2 * 4) + Math.sin(u * 200) * 0.04 })
  n.repeat.set(6, 8); n.needsUpdate = true
  m.normalMap = n; m.normalScale = new THREE.Vector2(0.8, 0.8)
  return m
}
let rugM: THREE.Material | undefined
function rug(g: G, f: Furniture): void { rugM ??= rugMaterial(); bx(g, f.w, f.h, f.d, rugM) }
function plant(g: G, f: Furniture): void { bush(g, 0, 0, 0, f.h, 5, 26, 'furn-white') }

/** log bench with white fur (Kaminanschluss, photo 10) */
function logBench(g: G, f: Furniture): void {
  for (const x of [-0.35, 0.35]) cy(g, 0.13, 0.15, 0.3, 'wood-dark', x, 0, 0, 14)
  bx(g, f.w, 0.06, f.d, 'wood-dark', 0, 0.3, 0)
  rb(g, 0.75, 0.05, 0.27, 0.02, 'sheepskin', -0.05, 0.36, 0.0, 0.05)
  // firewood stack against the north wall next to it
  for (let i = 0; i < 6; i++) rod(g, [0.62, 0.05 + Math.floor(i / 3) * 0.09, -0.1 + (i % 3) * 0.1], [0.98, 0.05 + Math.floor(i / 3) * 0.09, -0.1 + (i % 3) * 0.1], 0.04, 0.04, 'wood-light', 7)
}

function extras(root: G): void {
  const drape = paint(0x7f8388, 0.95) // grey side drape, only at the balcony door (photos 05 / 09 / 12)
  // --- south wall curtains (rod y 2.36, plane 6 cm off the wall face at z 10.127)
  const zc = 10.06
  curtainRod(root, 8.0, 11.3, 2.36, zc, 'chrome')
  for (const cx of [9.01, 10.39]) cloth(root, 1.4, 2.3, 5, 0.035, 'curtain-voile', cx, 0.03, zc - 0.03, Math.PI)
  for (const cx of [8.15, 9.7, 11.15]) cloth(root, 0.4, 2.3, 3, 0.04, 'curtain-voile', cx, 0.03, zc, Math.PI)
  // --- patio door curtains (east wall face x 11.891)
  const xc = 11.82
  rod(root, [xc, 2.36, 5.05], [xc, 2.36, 7.1], 0.009, 0.009, 'chrome', 8)
  cloth(root, 1.5, 2.3, 5, 0.035, 'curtain-voile', xc - 0.03, 0.03, 6.05, -Math.PI / 2)
  for (const cz of [5.25, 6.85]) cloth(root, 0.34, 2.3, 3, 0.03, drape, xc, 0.03, cz, -Math.PI / 2)
  ribRadiator(root, 0.7, 0.62, 11.82, 0.16, 4.85, -Math.PI / 2)
  // --- lamps and side table
  arcLamp(root, 11.65, 6.4, 1.85, -0.75, 0.25)
  arcLamp(root, 8.15, 6.4, 1.75, 0.0, -0.4)
  { const t = at(root, 9.5, 6.3, 0)
    wireTable(t)
    tableLamp(t, 0, 0.52, 0, 0.36)
    lantern(t, 0.1, 0.52, 0.08, 0.14) }
  // second lit side table on the mural wall side (photo 05)
  { const t = at(root, 8.55, 9.55, 0)
    cy(t, 0.2, 0.2, 0.03, paint(0x151517, 0.3), 0, 0.5, 0, 20)
    cy(t, 0.02, 0.02, 0.5, 'metal-black', 0, 0, 0, 8)
    cy(t, 0.14, 0.14, 0.02, 'metal-black', 0, 0, 0, 16)
    bush(t, 0, 0.53, 0, 0.32, 8, 12, 'furn-white') }
  pendant(root, 10.24, 2.5, 7.9, 0.4, 0.2)
}

export function build(): THREE.Group {
  const out = buildRooms('furniture:wohnen', ['wohnen', 'kamin'],
    { sofa, armchair, 'coffee-table': coffeeTable, 'tv-unit': tvUnit, tv, sideboard, rug, plant, 'bench-kamin': logBench },
    extras)
  return out
}
void bake; void pl
