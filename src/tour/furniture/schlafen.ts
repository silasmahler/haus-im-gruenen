import * as THREE from 'three'

import { art, at, bush, buildRooms, bx, canvasMat, cloth, cy, drawerBed, foldMat, nightstand, orchid, paint, mirrorWarm as fakeMirror, panelRadiator, picture, pl, rb, rod, sp, tableLamp, whiteChair, legs4 } from './shared'
import { fur } from './shared'
import { getMaterial } from '../materials'
import type { Furniture } from '../plan'

type G = THREE.Group
const W = 'furn-white'

/** small-scale floral print on a white ground (photo 02) */
const leafPattern = (): THREE.Material => {
  const t = (canvasMat('pillow-flower', 128, 128, (c, w, h) => {
    c.fillStyle = '#f3f2ec'; c.fillRect(0, 0, w, h)
    for (let i = 0; i < 26; i++) {
      const x = (i * 53) % w, y = (i * 37 + (i % 3) * 11) % h
      c.fillStyle = i % 3 ? '#9db69a' : '#d4b24a'
      c.beginPath(); c.ellipse(x, y, 6, 2.5, i, 0, 7); c.fill()
      c.fillStyle = '#5e8a6a'; c.beginPath(); c.ellipse(x + 5, y + 3, 4.5, 1.8, i + 1, 0, 7); c.fill()
    }
  }) as THREE.MeshStandardMaterial).map
  return foldMat(0xffffff, 1, 1, t, 0.95)
}

const lace = (): THREE.Material => getMaterial('lace-net') // lace pattern texture from materials.ts

function bed(g: G, f: Furniture): void {
  const pat = leafPattern()
  const white = foldMat(0xf4f2ec, 1, 1)
  drawerBed(g, f.w, f.d, {
    top: 'fabric-linen', cover: 'blanket-sage', coverFrac: 0.66, bothSides: true, headH: 0.52, rug: 'fabric-linen',
    pillows: [
      { x: -0.42, z: -0.76, w: 0.62, d: 0.42, h: 0.13, m: white, tilt: 0.1 },
      { x: 0.42, z: -0.76, w: 0.62, d: 0.42, h: 0.13, m: white, tilt: 0.1 },
      { x: 0.0, z: -0.84, w: 0.6, d: 0.4, h: 0.12, m: foldMat(0xece8df, 1, 1), tilt: 0.14 },
      { x: -0.3, z: -0.5, w: 0.4, d: 0.08, h: 0.38, m: pat, tilt: -0.45, ry: 0.22 },
      { x: 0.32, z: -0.5, w: 0.38, d: 0.08, h: 0.36, m: pat, tilt: -0.45, ry: -0.18 },
    ],
  })
}

function nightstandBuilder(g: G, f: Furniture): void {
  nightstand(g, f.w, f.d, f.h)
  if (f.id === 'ns-schlafen-1') tableLamp(g, 0.0, f.h, 0.0, 0.3)
  else { bush(g, 0, f.h, 0, 0.26, 3, 10, 'furn-white'); bx(g, 0.16, 0.03, 0.12, paint(0x6b7f8f, 0.6), 0.12, f.h, 0.1) }
}

/** free-standing painted wardrobe (photo 21): white-painted body, raised door panels, crown + plinth, brass-free black knobs; front +z */
function wardrobe(g: G, f: Furniture): void {
  const G0 = 'furn-white', trim = paint(0xe4e2dc, 0.5)
  rb(g, f.w, f.h - 0.06, f.d, 0.008, G0, 0, 0.06, 0)
  bx(g, f.w - 0.04, 0.06, f.d - 0.04, trim, 0, 0, 0) // plinth
  rb(g, f.w + 0.03, 0.05, f.d + 0.03, 0.01, trim, 0, f.h - 0.05, 0) // crown
  const dw = f.w / 2
  for (const s of [-1, 1]) {
    const x = s * dw / 2
    bx(g, dw - 0.014, f.h - 0.26, 0.012, trim, x, 0.13, f.d / 2 + 0.002) // door frame
    bx(g, dw - 0.09, f.h - 0.34, 0.012, G0, x, 0.17, f.d / 2 + 0.009) // raised panel
    sp(g, 0.011, 'brass', -s * (dw / 2 - 0.045) + x, 1.0, f.d / 2 + 0.024, 1, 1, 0.7, 8)
  }
  bx(g, 0.004, f.h - 0.26, 0.014, paint(0xa9a7a0, 0.6), 0, 0.13, f.d / 2 + 0.004) // door gap
}

/** white painted picket-fence bench: low white seat bench + 0.6 m green fence panel as a back; back at local -z */
function picketBench(g: G, f: Furniture): void {
  const grn = 'furn-white'
  legs4(g, f.w, f.d, 0.4, 0.02, 0.022, W, 0.04)
  rb(g, f.w, 0.05, f.d, 0.01, W, 0, 0.4, 0)
  bx(g, f.w - 0.1, 0.04, 0.03, W, 0, 0.2, 0)
  // fence: two rails + pointed pickets
  const bz = -f.d / 2 + 0.03
  for (const y of [0.55, 0.85]) bx(g, f.w, 0.05, 0.03, grn, 0, y, bz)
  const n = Math.round(f.w / 0.1)
  for (let i = 0; i < n; i++) {
    const x = -f.w / 2 + (i + 0.5) * (f.w / n)
    bx(g, f.w / n - 0.025, 0.5, 0.02, grn, x, 0.45, bz + 0.025)
    const tip = cy(g, 0.001, (f.w / n - 0.025) / 2, 0.05, grn, x, 0.95, bz + 0.025, 4); tip.rotation.y = Math.PI / 4; tip.scale.z = 0.5
  }
  rb(g, f.w - 0.3, 0.05, f.d - 0.1, 0.02, 'sheepskin', 0, 0.45, 0.02, 0.03, 3)
}

function desk(g: G, f: Furniture): void {
  legs4(g, f.w, f.d, 0.72, 0.017, 0.019, W, 0.04)
  rb(g, f.w, 0.03, f.d, 0.008, W, 0, 0.72, 0)
  bx(g, f.w - 0.1, 0.09, 0.02, W, 0, 0.63, -f.d / 2 + 0.04)
  bx(g, 0.4, 0.1, f.d - 0.1, W, f.w / 2 - 0.3, 0.61, 0)
  bx(g, 0.012, 0.014, 0.1, 'chrome', f.w / 2 - 0.3, 0.66, f.d / 2 - 0.045)
  { const lx = -f.w / 2 + 0.15
    cy(g, 0.05, 0.055, 0.015, W, lx, 0.75, -0.12, 14)
    rod(g, [lx, 0.765, -0.12], [lx + 0.03, 1.0, -0.1], 0.007, 0.007, W, 6)
    rod(g, [lx + 0.03, 1.0, -0.1], [lx + 0.16, 1.02, 0.0], 0.007, 0.007, W, 6)
    cy(g, 0.03, 0.07, 0.09, 'lampshade', lx + 0.16, 0.94, 0.0, 14) }
  bx(g, 0.2, 0.025, 0.28, paint(0x3a5a78, 0.7), 0.15, 0.75, 0.0)
  bx(g, 0.22, 0.015, 0.16, paint(0x2a2a2c, 0.4, 0.5), 0.05, 0.775, 0.05)
  bush(g, f.w / 2 - 0.12, 0.75, -0.16, 0.2, 5, 9, 'furn-white')
  // laptop
  bx(g, 0.3, 0.012, 0.21, paint(0x9a9da1, 0.3, 0.8), 0.02, 0.75, 0.08)
  const lid = bx(g, 0.3, 0.19, 0.008, paint(0x2a2b2e, 0.3, 0.6), 0.02, 0.76, -0.02); lid.rotation.x = -0.25
}

/** small white bench with a sheepskin */
function bench(g: G, f: Furniture): void {
  legs4(g, f.w, f.d, 0.4, 0.02, 0.022, W, 0.04)
  rb(g, f.w, 0.05, f.d, 0.01, W, 0, 0.4, 0)
  rb(g, f.w - 0.35, 0.04, f.d - 0.08, 0.018, 'sheepskin', 0.05, 0.45, 0, 0.06, 3)
}

/** pale grey-beige faux brick for the firebox (photo 22) */
const fauxBrick = (): THREE.Material => canvasMat('faux-brick', 128, 128, (c, w, h) => {
  c.fillStyle = '#cfc8bd'; c.fillRect(0, 0, w, h)
  const rows = 8, bh = h / rows
  for (let j = 0; j < rows; j++) for (let i = -1; i < 4; i++) {
    const x = i * (w / 3) + (j % 2 ? w / 6 : 0), t = 178 + ((i * 31 + j * 17) % 30)
    c.fillStyle = `rgb(${t},${t - 8},${t - 16})`; c.fillRect(x + 2, j * bh + 2, w / 3 - 4, bh - 4)
  }
}, { roughness: 0.95 })
/** white mock fireplace: fluted pilasters, mantel, pale faux-brick firebox with 3 LED candles, framed mirror above; local +z = front */
function fireplace(g: G, f: Furniture): void {
  rb(g, f.w, 0.1, f.d, 0.01, W, 0, 0, 0)
  for (const s of [-1, 1]) {
    rb(g, 0.14, 0.86, f.d - 0.02, 0.008, W, s * (f.w / 2 - 0.07), 0.1, 0)
    for (let i = 0; i < 4; i++) bx(g, 0.006, 0.7, 0.008, paint(0xd2d1cc, 0.6), s * (f.w / 2 - 0.07) - 0.045 + i * 0.03, 0.16, f.d / 2 - 0.006)
  }
  bx(g, f.w - 0.28, 0.86, 0.04, 'furn-dark', 0, 0.1, -f.d / 2 + 0.03)
  bx(g, f.w - 0.32, 0.6, 0.02, fauxBrick(), 0, 0.12, -f.d / 2 + 0.06)
  bx(g, f.w - 0.32, 0.03, f.d - 0.1, paint(0xcfc9bd, 0.7), 0, 0.1, 0)
  // three warm LED candles
  const wax = paint(0xffe6b0, 0.4, 0, { emissive: 0xffb45a, emissiveIntensity: 1.1 })
  cy(g, 0.022, 0.022, 0.09, wax, -0.14, 0.13, 0.0, 10); cy(g, 0.024, 0.024, 0.12, wax, 0.0, 0.13, 0.03, 10); cy(g, 0.022, 0.022, 0.07, wax, 0.15, 0.13, 0.0, 10)
  bx(g, f.w - 0.32, 0.16, f.d - 0.1, W, 0, 0.72 + 0.1 + 0.02, 0)
  for (const s of [-1, 1]) bx(g, 0.06, 0.1, 0.012, W, s * (f.w / 2 - 0.1), 0.85, f.d / 2 - 0.004)
  rb(g, f.w + 0.04, 0.05, f.d + 0.05, 0.01, W, 0, 0.96, 0.01)
  // white-framed mirror on the wall above, green ornaments, orchid + small plant on the mantel
  const wallZ = -f.d / 2 + 0.02
  const mw = 0.78, mh = 0.94, fr = 0.1
  bx(g, fr, mh, 0.035, W, -mw / 2 + fr / 2, 1.0, wallZ); bx(g, fr, mh, 0.035, W, mw / 2 - fr / 2, 1.0, wallZ)
  bx(g, mw - 2 * fr, fr, 0.035, W, 0, 1.0, wallZ); bx(g, mw - 2 * fr, fr, 0.035, W, 0, 1.0 + mh - fr, wallZ)
  pl(g, mw - 2 * fr, mh - 2 * fr, fakeMirror(), 0, 1.0 + fr, wallZ + 0.019)
  // inner bevel lip so the glass reads as recessed in the frame
  const lip = paint(0xe6e4de, 0.5)
  bx(g, mw - 2 * fr, 0.012, 0.012, lip, 0, 1.0 + fr, wallZ + 0.02); bx(g, mw - 2 * fr, 0.012, 0.012, lip, 0, 1.0 + mh - fr - 0.012, wallZ + 0.02)
  for (const s of [-1, 1]) bx(g, 0.012, mh - 2 * fr, 0.012, lip, s * (mw / 2 - fr - 0.006), 1.0 + fr, wallZ + 0.02)
  const grn = paint(0x2f8a4f, 0.4)
  for (const [y, sc] of [[1.0 + mh - fr / 2, 1], [1.0 + fr / 2, 1]] as [number, number][]) {
    sp(g, 0.018 * sc, grn, -0.04, y, wallZ + 0.02, 1.6, 0.6, 0.4, 8); sp(g, 0.018 * sc, grn, 0.04, y, wallZ + 0.02, 1.6, 0.6, 0.4, 8); sp(g, 0.012, paint(0xe8e6de, 0.4), 0, y, wallZ + 0.021, 1, 1, 0.4, 8)
  }
  orchid(g, -0.28, 1.01, 0.0, 1.0)
  bush(g, 0.3, 1.01, 0.03, 0.14, 12, 7, 'furn-white')
}

function extras(root: G): void {
  const b = fur('bed-schlafen')
  void b
  // art: b/w portrait above the bed (west wall face x 0.28), red panel on the north wall
  picture(root, 0.95, 0.66, art('portrait'), 0.285, 1.42, 1.96, Math.PI / 2, W)
  picture(root, 0.5, 0.7, art('red'), 0.75, 1.3, 0.285, 0, W)
  // white panel radiator under the north window, left of the desk pedestal (photo 02)
  panelRadiator(root, 0.6, 0.55, 1.5, 0.18, 0.28)
  // desk chair at the desk under the north window (faces north); the west terrace door stays free
  { const c = at(root, 2.4, 0.95, Math.PI); whiteChair(c) }
  // burgundy curtain with lace net at the west terrace door (z 3.8..4.8) + sheer at the north window
  rod(root, [0.33, 2.3, 3.3], [0.33, 2.3, 5.25], 0.011, 0.011, 'metal-black', 8)
  cloth(root, 1.4, 2.25, 6, 0.02, lace(), 0.34, 0.03, 4.29, Math.PI / 2)
  cloth(root, 0.55, 2.25, 3, 0.04, 'fabric-plum', 0.38, 0.03, 3.62, Math.PI / 2)
  cloth(root, 0.55, 2.25, 3, 0.04, 'fabric-plum', 0.38, 0.03, 4.95, Math.PI / 2)
  rod(root, [1.3, 2.3, 0.35], [2.7, 2.3, 0.35], 0.011, 0.011, 'metal-black', 8)
  cloth(root, 1.5, 1.5, 8, 0.02, lace(), 1.99, 0.8, 0.34, 0)
}

export function build(): THREE.Group {
  return buildRooms('furniture:schlafen', ['schlafen'], {
    'bed-double': bed, nightstand: nightstandBuilder, wardrobe, 'desk-schlafen': desk, 'bench-schlafen': bench, 'bench-schlafen-2': picketBench, 'fireplace-schlafen': fireplace,
    plant: (g, f) => bush(g, 0, 0, 0, f.h, 2, 24, 'terracotta'),
  }, extras)
}
void cy; void sp
