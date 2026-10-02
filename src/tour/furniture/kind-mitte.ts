import * as THREE from 'three'

import { art, bush, buildRooms, bx, canvasMat, cloth, cy, drawerBed, foldMat, legs4, orchid, paint, picture, pl, poang, poangStool, rb, rod } from './shared'
import { KIND_MITTE_BED_HEAD } from '../plan'
import type { Furniture } from '../plan'

type G = THREE.Group
const W = 'furn-white'

/** fine-stripe throw (grey / white, one dusty-rose stripe in four) */
const stripes = (): THREE.Material => {
  const t = (canvasMat('stripe-fine', 128, 128, (c, w, h) => {
    c.fillStyle = '#eeebe5'; c.fillRect(0, 0, w, h)
    for (let i = 0, x = 0; x < w; x += 16, i++) { c.fillStyle = i % 3 === 2 ? '#dcc4c2' : '#cfcdca'; c.fillRect(x, 0, 6, h) }
  }) as THREE.MeshStandardMaterial).map
  return foldMat(0xffffff, 1, 1, t, 0.95)
}

function bed(g: G, f: Furniture): void {
  const west = f.rotationY > 0 // head at the west wall: drawers must face the room (south), i.e. local -x
  const white = foldMat(0xf4f2ec, 1, 1)
  drawerBed(g, f.w, f.d, {
    top: paint(0x8b8f94, 0.95), cover: stripes(), coverFrac: 0.66, drawerSide: west ? -1 : 1,
    pillows: [{ x: -0.02, z: -0.74, w: 0.6, d: 0.4, h: 0.12, m: white, tilt: 0.1 },
      { x: -0.2, z: -0.5, w: 0.34, d: 0.08, h: 0.3, m: foldMat(0xd9bdbb, 1, 1), tilt: -0.45, ry: 0.2 },
      { x: 0.22, z: -0.5, w: 0.34, d: 0.08, h: 0.3, m: foldMat(0xa3a8ad, 1, 1), tilt: -0.45, ry: -0.18 }],
  })
  bx(g, 0.02, 0.5, 0.12, paint(0xa9757b, 0.7), (west ? -1 : 1) * (f.w / 2 + 0.02), 0.06, f.d / 2 - 0.5) // dusty-rose strap of the bed guard
}

/** white sideboard, zebra drawer fronts and door panels (photo 42); local +z = front */
function dresser(g: G, f: Furniture): void {
  const zb = art('zebra')
  const dark = paint(0x171718, 0.45)
  legs4(g, f.w, f.d, 0.1, 0.014, 0.02, W, 0.04)
  rb(g, f.w, f.h - 0.1, f.d, 0.01, W, 0, 0.1, 0)
  bx(g, f.w + 0.02, 0.025, f.d + 0.02, paint(0xe9d7ae, 0.6), 0, f.h - 0.025, 0) // light-wood top edge
  const n = 3, dw = f.w / n
  for (let i = 0; i < n; i++) {
    const x = -f.w / 2 + dw * (i + 0.5)
    if (i === 1) {
      bx(g, dw - 0.02, f.h - 0.22, 0.012, dark, x, 0.16, f.d / 2 + 0.002)
      bx(g, dw - 0.09, f.h - 0.32, 0.006, zb, x, 0.21, f.d / 2 + 0.009)
    } else {
      bx(g, dw - 0.02, 0.2, 0.012, zb, x, f.h - 0.36, f.d / 2 + 0.002)
      bx(g, dw - 0.02, f.h - 0.62, 0.012, dark, x, 0.16, f.d / 2 + 0.002)
      bx(g, dw - 0.09, f.h - 0.7, 0.006, zb, x, 0.2, f.d / 2 + 0.009)
    }
  }
  bx(g, 0.012, 0.16, 0.02, 'chrome', -0.02, 0.62, f.d / 2 + 0.016)
  orchid(g, 0.3, f.h, 0.0, 0.7)
}

function desk(g: G, f: Furniture): void {
  legs4(g, f.w, f.d, 0.72, 0.017, 0.019, W, 0.04)
  rb(g, f.w, 0.03, f.d, 0.008, W, 0, 0.72, 0)
  bx(g, 0.35, 0.08, f.d - 0.1, W, f.w / 2 - 0.25, 0.63, 0)
  bx(g, 0.28, 0.02, 0.2, paint(0xd8d2c4, 0.7), -0.2, 0.75, 0.0)
  cy(g, 0.03, 0.03, 0.08, paint(0xc23a2a, 0.5), 0.3, 0.75, -0.1, 10)
  bush(g, -0.45, 0.75, -0.1, 0.18, 3, 8, 'furn-white')
}

function xChair(g: G): void {
  legs4(g, 0.4, 0.4, 0.45, 0.014, 0.018, W, 0.03)
  rb(g, 0.42, 0.04, 0.42, 0.01, W, 0, 0.45, 0)
  rod(g, [-0.17, 0.49, -0.19], [0.17, 0.9, -0.19], 0.013, 0.013, W, 6)
  rod(g, [0.17, 0.49, -0.19], [-0.17, 0.9, -0.19], 0.013, 0.013, W, 6)
  for (const s of [-1, 1]) rod(g, [s * 0.18, 0.49, -0.19], [s * 0.18, 0.9, -0.19], 0.013, 0.013, W, 6)
  rb(g, 0.38, 0.05, 0.38, 0.02, paint(0x1f5fa8, 0.9), 0, 0.49, 0.01, 0, 2)
}

function lounge(g: G): void { poang(g, foldMat(0xf5f3ee, 1, 1)) }
function stool(g: G): void { poangStool(g, foldMat(0xf5f3ee, 1, 1)) }

/** folding travel cot (photo 42): slate-blue fabric lower panels, mesh upper sides, navy padded rim, corner posts, visible mattress */
function cot(g: G, f: Furniture): void {
  const blue = paint(0x6f879b, 0.9), pad = paint(0x1b2745, 0.85), post = paint(0x3b4a5c, 0.5, 0.3)
  const mesh = canvasMat('cot-mesh2', 64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(70,88,104,0.95)'; c.lineWidth = 2
    for (let i = 0; i <= 16; i++) { c.beginPath(); c.moveTo(0, i * 4); c.lineTo(w, i * 4); c.moveTo(i * 4, 0); c.lineTo(i * 4, h); c.stroke() }
  }, { transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.9 })
  const w = f.w, d = f.d
  for (const sx of [-1, 1]) { bx(g, 0.012, 0.2, d, blue, sx * (w / 2 - 0.006), 0.15, 0); pl(g, d, 0.32, mesh, sx * (w / 2 - 0.006), 0.35, 0, sx * Math.PI / 2) }
  for (const sz of [-1, 1]) { bx(g, w, 0.2, 0.012, blue, 0, 0.15, sz * (d / 2 - 0.006)); pl(g, w, 0.32, mesh, 0, 0.35, sz * (d / 2 - 0.006), sz > 0 ? 0 : Math.PI) }
  bx(g, w, 0.03, d, post, 0, 0.12, 0) // floor frame
  rb(g, w - 0.03, 0.07, d - 0.03, 0.03, foldMat(0xd9d2c0, 1, 1), 0, 0.15, 0, 0, 2) // mattress
  bx(g, w - 0.03, 0.012, 0.02, pad, 0, 0.19, 0) // mattress centre fold
  for (const sx of [-1, 1]) rb(g, 0.05, 0.05, d + 0.02, 0.02, pad, sx * (w / 2), 0.68, 0)
  for (const sz of [-1, 1]) rb(g, w + 0.02, 0.05, 0.05, 0.02, pad, 0, 0.68, sz * (d / 2))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    rod(g, [sx * (w / 2 + 0.02), 0, sz * (d / 2 + 0.02)], [sx * (w / 2), 0.14, sz * (d / 2)], 0.012, 0.014, 'metal-black', 6)
    rod(g, [sx * (w / 2), 0.14, sz * (d / 2)], [sx * (w / 2), 0.68, sz * (d / 2)], 0.013, 0.013, post, 6)
  }
}

function extras(root: G): void {
  // zebra/red canvas above the bed (north wall face z 5.954), sheer curtain on the south window
  picture(root, 0.9, 0.5, art('zebra-red'), KIND_MITTE_BED_HEAD === 'east' ? 6.61 : 5.9, 1.45, 5.96, 0, 'furn-dark', 0.01, 0.02)
  rod(root, [5.7, 2.3, 10.06], [7.4, 2.3, 10.06], 0.008, 0.008, 'furn-white', 8)
  cloth(root, 1.5, 1.45, 5, 0.02, 'curtain-sheer', 6.56, 0.85, 10.06, Math.PI)
  cloth(root, 0.4, 1.7, 3, 0.03, paint(0xe6e0d4, 0.95), 5.85, 0.6, 10.06, Math.PI)
  cloth(root, 0.4, 1.7, 3, 0.03, paint(0xe6e0d4, 0.95), 7.27, 0.6, 10.06, Math.PI)
}

export function build(): THREE.Group {
  return buildRooms('furniture:kind-mitte', ['kind-mitte'], {
    'bed-single': bed, 'dresser-kind-mitte': dresser, desk, chair: xChair, 'armchair-kind-mitte': lounge, 'stool-kind-mitte': stool,
    'cot-kind-mitte': cot, plant: (g, f) => bush(g, 0, 0, 0, f.h * 0.8, 4, 20, 'terracotta'),
  }, extras)
}
