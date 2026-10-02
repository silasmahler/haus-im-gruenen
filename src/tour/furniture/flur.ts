import * as THREE from 'three'

import { art, at, bush, buildRooms, bx, cy, mirrorFake, orchid, paint, picture, pl, rb, rod, sp } from './shared'
import type { Furniture } from '../plan'

type G = THREE.Group

/** shoe bench / console on the east wall of the hall; local +z = front (faces west into the hall) */
function console_(g: G, f: Furniture): void {
  const blk = 'metal-black'
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(g, [sx * (f.w / 2 - 0.05), 0, sz * (f.d / 2 - 0.03)], [sx * (f.w / 2 - 0.05), f.h - 0.04, sz * (f.d / 2 - 0.03)], 0.014, 0.014, blk, 6)
  rb(g, f.w, 0.04, f.d, 0.01, 'wood-birch', 0, f.h - 0.04, 0)
  bx(g, f.w - 0.1, 0.02, f.d - 0.04, 'wood-birch', 0, 0.12, 0)
  // two pairs of shoes on the lower shelf, a plant + key bowl on top
  const shoe = (x: number, c: number, ry: number): void => {
    const s = at(g, x, 0, ry, 0.14)
    rb(s, 0.09, 0.06, 0.25, 0.025, paint(c, 0.6), -0.06, 0, 0, 0, 2); rb(s, 0.09, 0.06, 0.25, 0.025, paint(c, 0.6), 0.06, 0, 0, 0, 2)
  }
  shoe(-0.22, 0x2b2b30, 0); shoe(0.1, 0x6a4a34, 0.1)
  bush(g, -0.28, f.h, 0, 0.32, 6, 14, 'furn-white')
  cy(g, 0.07, 0.04, 0.03, 'brass', 0.22, f.h, 0.0, 14)
}

/** black slim console with an orchid + silver tray on the north wall of the side hall (photos 09, 10) */
function consoleR(g: G, f: Furniture): void {
  const blk = paint(0x131315, 0.4, 0.1)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(g, [sx * (f.w / 2 - 0.03), 0, sz * (f.d / 2 - 0.03)], [sx * (f.w / 2 - 0.03), f.h - 0.03, sz * (f.d / 2 - 0.03)], 0.014, 0.014, blk, 6)
  rb(g, f.w, 0.035, f.d, 0.008, blk, 0, f.h - 0.035, 0)
  bx(g, f.w - 0.08, 0.02, f.d - 0.06, blk, 0, 0.2, 0)
  orchid(g, 0.22, f.h, -0.02, 1.15)
  cy(g, 0.11, 0.1, 0.012, paint(0xc9ccd0, 0.25, 1), -0.2, f.h, 0.02, 20)
}

function extras(root: G): void {
  // doormat at the front door (door centre x 4.14, inside face z 10.127)
  bx(root, 0.8, 0.014, 0.5, paint(0x3f3a35, 1), 4.2, 0, 9.78)
  bx(root, 0.72, 0.016, 0.42, paint(0x6a5a48, 1), 4.2, 0, 9.78)
  // real mirror above the console (bright fake reflection, white frame); hall east wall face is x 4.816, west wall face x 3.785
  picture(root, 0.55, 0.85, mirrorFake(), 4.82, 1.05, 9.7, -Math.PI / 2, 'furn-white', 0.035, 0.03)
  // coat board: oak plank with brass hooks, four jackets, a hat and a shoulder bag
  { const r = at(root, 5.6385, 5.16, -Math.PI / 2) // Auftraggeber: Jackenablage in der Dielenecke vor der Küche (kurze Wand x 5.64, z 4.53..5.79)
    rb(r, 1.1, 0.11, 0.025, 0.008, 'wood-birch', 0, 1.62, 0.0125, 0, 1)
    const coats = [0x39435a, 0x6b7350, 0xa0825a, 0x36363a]
    for (let i = 0; i < 4; i++) {
      const x = -0.45 + i * 0.3
      rod(r, [x, 1.67, 0.025], [x, 1.67, 0.07], 0.007, 0.007, 'brass', 5)
      sp(r, 0.011, 'brass', x, 1.67, 0.075, 1, 1, 1, 6)
    }
    coat(r, -0.45, 1.62, 0.085, coats[0], 0.95, 0.46)
    coat(r, -0.15, 1.62, 0.1, coats[1], 0.8, 0.44)
    coat(r, 0.15, 1.62, 0.085, coats[2], 0.95, 0.46)
    // hat on the fourth hook, bag from the hook beside it
    cy(r, 0.11, 0.11, 0.012, paint(0x8a6a44, 0.9), 0.45, 1.63, 0.1, 16).rotation.x = Math.PI / 2
    cy(r, 0.065, 0.075, 0.09, paint(0x8a6a44, 0.9), 0.45, 1.58, 0.1, 14).rotation.x = Math.PI / 2 }
  picture(root, 0.5, 0.36, art('land'), 3.79, 1.55, 6.1, Math.PI / 2, 'furn-white', 0.02, 0.03)
  picture(root, 0.5, 0.36, art('land'), 3.79, 1.55, 6.7, Math.PI / 2, 'furn-white', 0.02, 0.03)
  picture(root, 0.36, 0.5, art('brown'), 3.79, 1.5, 5.4, Math.PI / 2, 'furn-white', 0.02, 0.03)
}
/** jacket on a hook at (x, yTop): wide shoulders, boxy padded body with a slight belly, two sleeves, collar; w = body width, len = hang length */
function coat(r: G, x: number, yTop: number, z: number, hex: number, len: number, w: number): void {
  const m = paint(hex, 0.95)
  sp(r, 0.5, m, x, yTop - 0.07, z, w * 0.56, 0.16, 0.14, 12)
  const body = rb(r, w, len - 0.1, 0.1, 0.045, m, x, yTop - len, z, 0, 2); body.scale.z = 1
  for (const s of [-1, 1]) {
    const sl = rb(r, 0.1, len * 0.72, 0.09, 0.04, m, x + s * (w / 2 + 0.03), yTop - len * 0.8, z + 0.005, 0, 2); sl.rotation.z = s * 0.05
  }
  rb(r, 0.14, 0.05, 0.1, 0.02, paint(hex, 0.8), x, yTop - 0.05, z, 0, 1) // collar
  bx(r, 0.004, len * 0.7, 0.004, paint(0x111111, 0.8), x, yTop - len + 0.05, z + 0.052) // zip line
}

export function build(): THREE.Group {
  return buildRooms('furniture:flur', ['flur-links', 'flur-rechts'], { 'console-flur': console_, 'console-flur-r': consoleR }, extras)
}
void pl; void art; void bush; void rb
