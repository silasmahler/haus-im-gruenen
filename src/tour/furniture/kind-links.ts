import * as THREE from 'three'

import { art, at, bush, buildRooms, bx, canvasMat, cloth, cy, drawerBed, foldMat, legs4, mirrorFake, nightstand, paint, picture, pl, poang, rb, rod, sp, tableLamp, whiteChair } from './shared'
import type { Furniture } from '../plan'

type G = THREE.Group
const W = 'furn-white'

const mickey = (): THREE.Material => canvasMat('mickey', 128, 128, (c, w, h) => {
  c.fillStyle = '#1f6fa6'; c.fillRect(0, 0, w, h)
  c.fillStyle = '#7ec0d8'; c.fillRect(0, 0, w, h * 0.25)
  c.fillStyle = '#111'; c.beginPath(); c.arc(w * 0.5, h * 0.55, 26, 0, 7); c.arc(w * 0.32, h * 0.35, 15, 0, 7); c.arc(w * 0.68, h * 0.35, 15, 0, 7); c.fill()
  c.fillStyle = '#f0c8a0'; c.beginPath(); c.arc(w * 0.5, h * 0.62, 17, 0, 7); c.fill()
  c.fillStyle = '#d33'; c.fillRect(w * 0.1, h * 0.86, w * 0.8, 8)
}, { roughness: 0.9 })

function bed(g: G, f: Furniture): void {
  const white = foldMat(0xf4f2ec, 1, 1)
  drawerBed(g, f.w, f.d, {
    // grey mattress with a small camel throw over the foot half (photos 24 / 25)
    top: paint(0x6f747b, 0.95), cover: foldMat(0xc9a27a, 1, 1), coverFrac: 0.42,
    pillows: [{ x: -0.15, z: -0.7, w: 0.5, d: 0.36, h: 0.1, m: white, tilt: 0.14 },
      { x: 0.2, z: -0.7, w: 0.5, d: 0.36, h: 0.1, m: white, tilt: 0.14 },
      { x: -0.22, z: -0.5, w: 0.36, d: 0.1, h: 0.34, m: art('cowbw'), tilt: -0.4, ry: 0.2 },
      { x: 0.22, z: -0.46, w: 0.36, d: 0.1, h: 0.34, m: art('cowbrown'), tilt: -0.4, ry: -0.25 }],
  })
  // back board along the wall (local -x is the wall side)
  rb(g, 0.04, 0.42, f.d - 0.06, 0.01, W, -f.w / 2, 0.36, 0)
}

function nightstandB(g: G, f: Furniture): void {
  nightstand(g, f.w, f.d, f.h)
  bush(g, 0, f.h, 0, 0.2, 7, 8, 'furn-white')
  bx(g, 0.14, 0.04, 0.1, paint(0xc94f2a, 0.7), 0.1, f.h, 0.12)
}

/** matte black two-door wardrobe: door gap, two long vertical handles, plinth; local +z = front (photo 24) */
function wardrobe(g: G, f: Furniture): void {
  const blk = 'wardrobe-dark', door = 'wardrobe-dark' // textured charcoal laminate (materials.ts)
  rb(g, f.w, f.h, f.d - 0.02, 0.008, blk, 0, 0, -0.01, 0, 1)
  const dw = (f.w - 0.04) / 2
  for (const s of [-1, 1]) {
    bx(g, dw - 0.004, f.h - 0.12, 0.02, door, s * (dw / 2 + 0.002), 0.06, f.d / 2 - 0.02)
    bx(g, 0.014, 0.7, 0.024, paint(0x3a3a3d, 0.4, 0.5), s * 0.05, 0.75, f.d / 2 + 0.004)
  }
  bx(g, 0.006, f.h - 0.1, 0.02, paint(0x050506, 0.9), 0, 0.06, f.d / 2 - 0.02) // door gap
}

/** tall black-framed leaning mirror (photo 24); local +z = front */
function leaningMirror(root: G, x: number, z: number, ry: number): void {
  const a = at(root, x, z, ry)
  const fr = paint(0x141416, 0.45)
  const tilt = new THREE.Group(); tilt.rotation.x = -0.07; a.add(tilt)
  bx(tilt, 0.04, 1.65, 0.03, fr, -0.2, 0, 0); bx(tilt, 0.04, 1.65, 0.03, fr, 0.2, 0, 0)
  bx(tilt, 0.4, 0.04, 0.03, fr, 0, 0, 0); bx(tilt, 0.4, 0.04, 0.03, fr, 0, 1.61, 0)
  pl(tilt, 0.36, 1.57, mirrorFake(), 0, 0.04, 0.012)
}

function desk(g: G, f: Furniture): void {
  legs4(g, f.w, f.d, 0.72, 0.017, 0.019, W, 0.04)
  rb(g, f.w, 0.03, f.d, 0.008, W, 0, 0.72, 0)
  bx(g, 0.4, 0.09, f.d - 0.12, W, -f.w / 2 + 0.3, 0.63, 0)
  // laptop (open), desk lamp, mug
  bx(g, 0.34, 0.012, 0.24, paint(0x9a9da1, 0.3, 0.8), 0.1, 0.75, 0.0)
  const lid = bx(g, 0.34, 0.22, 0.008, paint(0x2a2b2e, 0.3, 0.6), 0.1, 0.76, -0.12); lid.rotation.x = -0.2
  bx(g, 0.28, 0.16, 0.003, canvasMat('laptop', 64, 48, (c, w, h) => { c.fillStyle = '#5b8fc7'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8eef5'; c.fillRect(6, 6, w - 12, 8) }, { emissive: 0x334455, emissiveIntensity: 0.4 }), 0.1, 0.775, -0.108).rotation.x = -0.2
  rod(g, [-0.42, 0.75, -0.18], [-0.36, 1.0, -0.15], 0.006, 0.006, 'metal-black', 6)
  rod(g, [-0.36, 1.0, -0.15], [-0.22, 1.05, -0.1], 0.006, 0.006, 'metal-black', 6)
  cy(g, 0.03, 0.05, 0.06, 'metal-black', -0.22, 0.99, -0.1, 12)
  cy(g, 0.035, 0.03, 0.09, paint(0x2f9ba6, 0.4), 0.42, 0.75, -0.05, 12)
}

/** white X-back chair with Mickey cushion */
function chair(g: G): void {
  legs4(g, 0.42, 0.42, 0.45, 0.014, 0.018, W, 0.03)
  rb(g, 0.44, 0.04, 0.44, 0.01, W, 0, 0.45, 0)
  rod(g, [-0.18, 0.49, -0.2], [0.18, 0.92, -0.2], 0.014, 0.014, W, 6)
  rod(g, [0.18, 0.49, -0.2], [-0.18, 0.92, -0.2], 0.014, 0.014, W, 6)
  for (const s of [-1, 1]) rod(g, [s * 0.19, 0.49, -0.2], [s * 0.19, 0.92, -0.2], 0.014, 0.014, W, 6)
  bx(g, 0.4, 0.04, 0.03, W, 0, 0.9, -0.2)
  rb(g, 0.4, 0.05, 0.4, 0.02, mickey(), 0, 0.49, 0.01, 0.2, 2)
}

/** bentwood Poang-style chair with dark leather cushions (photo 25) */
function armchair(g: G, f: Furniture): void { poang(g, paint(0x1a1a1c, 0.5)); void f }

function extras(root: G): void {
  // three cow-hide panels above the bed on the north wall (face z 5.77): brown / black-white / brown
  const kinds = ['cowbrown', 'cowbw', 'cowbrown']
  kinds.forEach((k, i) => picture(root, 0.4, 0.55, art(k), 2.05 + i * 0.5, 1.3, 5.775, 0, 'furn-white', 0.012, 0.03))
  // sheer curtains on both windows (west: face x 0.28, south: face z 10.127)
  rod(root, [0.33, 2.3, 6.5], [0.33, 2.3, 8.06], 0.008, 0.008, 'furn-white', 8)
  cloth(root, 1.5, 1.45, 5, 0.02, 'curtain-sheer', 0.36, 0.8, 7.28, Math.PI / 2)
  rod(root, [1.1, 2.3, 10.06], [2.7, 2.3, 10.06], 0.008, 0.008, 'furn-white', 8)
  cloth(root, 1.5, 1.45, 5, 0.02, 'curtain-sheer', 1.9, 0.85, 10.06, Math.PI)
  leaningMirror(root, 0.38, 8.3, Math.PI / 2)
  // small rug beside the bed
  bx(root, 1.2, 0.01, 0.7, 'rug-cream', 2.2, 0, 7.25)
}

export function build(): THREE.Group {
  return buildRooms('furniture:kind-links', ['kind-links'], {
    'bed-single': bed, nightstand: nightstandB, wardrobe, desk, chair, armchair,
  }, extras)
}
void at; void sp; void tableLamp; void whiteChair
