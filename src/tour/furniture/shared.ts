/**
 * furniture/shared.ts - shared primitives for all furniture modules.
 * Every helper adds a mesh to `parent` and returns it. Boxes/cylinders sit with their BOTTOM at y (centre x,z).
 * Each room module builds a Group of small meshes, then calls bake(group): meshes are merged per material
 * (one draw call per material and room). Local +z = front of a piece, origin = piece centre on the floor.
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { getMaterial } from '../materials'
import { furniture, type Furniture, type FurnitureType, type RoomId } from '../plan'

export type Mat = THREE.Material | string
const mt = (m: Mat): THREE.Material => (typeof m === 'string' ? getMaterial(m) : m)

// ------------------------------------------------------------------ materials made here
const own = new Map<string, THREE.Material>()
/** plain painted / lacquered material, cached by its parameters */
export function paint(hex: number, rough = 0.6, metal = 0, extra: THREE.MeshStandardMaterialParameters = {}): THREE.Material {
  const key = `p${hex}-${rough}-${metal}-${JSON.stringify(extra)}`
  let m = own.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, ...extra })
    // plain colours (no transparency etc.) are merged by bake() into shared vertex-colour materials: fewer draw calls
    if (Object.keys(extra).length === 0) m.userData.tint = { hex, rough, metal }
    own.set(key, m)
  }
  return m
}
const tinted = new Map<string, THREE.Material>()
/** shared vertex-colour material for all plain paint() colours with (about) this roughness / metalness */
function tintMaterial(rough: number, metal: number): THREE.Material {
  const r = Math.round(rough * 5) / 5, k = Math.round(metal * 5) / 5, key = `${r}-${k}`
  let m = tinted.get(key)
  if (!m) { m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: r, metalness: k }); m.name = `tint${key}`; tinted.set(key, m) }
  return m
}
/** canvas-drawn colour map material (art, zebra, lace...). draw(ctx, w, h). */
export function canvasMat(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  p: THREE.MeshStandardMaterialParameters = {}): THREE.Material {
  let m = own.get('c' + key)
  if (!m) {
    const cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    draw(cv.getContext('2d')!, w, h)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, ...p })
    own.set('c' + key, m)
  }
  return m
}
/** height field -> tangent-space normal map canvas texture (linear). fn(u,v) in [0,1]^2, returns height 0..1 */
export function normalTex(size: number, strength: number, fn: (u: number, v: number) => number): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = size; cv.height = size
  const c = cv.getContext('2d')!, img = c.createImageData(size, size)
  const H = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) H[y * size + x] = fn(x / size, y / size)
  const at = (x: number, y: number): number => H[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength
    const l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255
  }
  c.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}
/** diamond-button quilt height field: one diamond per tile, pillow-shaped cells, seams, a dimple at the centre */
const quiltH = (u: number, v: number): number => {
  const a = (((u + v) % 1) + 1) % 1, b = (((u - v) % 1) + 1) % 1
  const pill = Math.sin(Math.PI * a) * Math.sin(Math.PI * b)
  const d = Math.hypot(a - 0.5, b - 0.5)
  return Math.pow(pill, 0.6) * 0.8 - Math.exp(-d * d * 260) * 0.7
}
let quiltBase: { n: THREE.CanvasTexture; m: THREE.CanvasTexture } | undefined
const quiltCache = new Map<string, THREE.Material>()
/** charcoal (or any colour) diamond-quilted fabric with a shallow normal map + sheen. rw x rh = surface size in metres (sets the tiling). */
export function quiltMat(hex: number, rw: number, rh: number, cell = 0.075, rough = 0.92): THREE.Material {
  const key = `${hex}-${Math.round(rw / cell)}-${Math.round(rh / cell)}-${rough}`
  let m = quiltCache.get(key)
  if (m) return m
  if (!quiltBase) {
    const n = normalTex(128, 5.5, quiltH)
    const cv = document.createElement('canvas'); cv.width = cv.height = 128
    const c = cv.getContext('2d')!, img = c.createImageData(128, 128)
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const h = quiltH(x / 128, y / 128), g = Math.max(0, Math.min(255, 175 + h * 95)), i = (y * 128 + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g; img.data[i + 3] = 255
    }
    c.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(cv)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
    quiltBase = { n, m: t }
  }
  const rx = Math.max(1, Math.round(rw / cell)), ry = Math.max(1, Math.round(rh / cell))
  const n = quiltBase.n.clone(), t = quiltBase.m.clone()
  n.repeat.set(rx, ry); t.repeat.set(rx, ry); n.needsUpdate = true; t.needsUpdate = true
  m = new THREE.MeshPhysicalMaterial({ color: hex, map: t, normalMap: n, normalScale: new THREE.Vector2(0.7, 0.7), roughness: rough, metalness: 0,
    sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x8a8f96) })
  quiltCache.set(key, m)
  return m
}
/** soft fabric fold normal map (pillows, blankets): wide creases + fine weave. rx, ry = tiling */
const foldCache = new Map<string, THREE.Material>()
export function foldMat(hex: number, rx = 1, ry = 1, map?: THREE.Texture | null, rough = 0.95): THREE.Material {
  const key = `${hex}-${rx}-${ry}-${map ? map.uuid : ''}-${rough}`
  let m = foldCache.get(key)
  if (m) return m
  const n = normalTex(128, 3, (u, v) => 0.5 + 0.28 * Math.sin(u * Math.PI * 4 + Math.sin(v * Math.PI * 6) * 1.3) * Math.cos(v * Math.PI * 2 + u * 3) + 0.06 * Math.sin(u * 128) * Math.sin(v * 128))
  n.repeat.set(rx, ry); n.needsUpdate = true
  m = new THREE.MeshStandardMaterial({ color: hex, map: map ?? null, normalMap: n, normalScale: new THREE.Vector2(0.6, 0.6), roughness: rough })
  foldCache.set(key, m)
  return m
}

/** call from nowhere special: textures made here are disposed by buildScene's scene traverse; cache is per page load */
export function disposeOwn(): void { own.forEach((m) => m.dispose()); own.clear(); quiltCache.forEach((m) => m.dispose()); quiltCache.clear(); foldCache.forEach((m) => m.dispose()); foldCache.clear() }

// ------------------------------------------------------------------ primitives
function add(parent: THREE.Object3D, geo: THREE.BufferGeometry, m: Mat, x: number, y: number, z: number, ry = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mt(m))
  mesh.position.set(x, y, z)
  mesh.rotation.y = ry
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}
/** box, bottom-centre at (x,y,z) */
export function bx(p: THREE.Object3D, w: number, h: number, d: number, m: Mat, x = 0, y = 0, z = 0, ry = 0): THREE.Mesh {
  return add(p, new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, ry)
}
/** rounded box, bottom-centre at (x,y,z); r = edge radius */
export function rb(p: THREE.Object3D, w: number, h: number, d: number, r: number, m: Mat, x = 0, y = 0, z = 0, ry = 0, seg = 2): THREE.Mesh {
  const rr = Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005)
  return add(p, new RoundedBoxGeometry(w, h, d, seg, rr), m, x, y + h / 2, z, ry)
}
/** cylinder (or cone: rTop != rBot), bottom at y */
export function cy(p: THREE.Object3D, rTop: number, rBot: number, h: number, m: Mat, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  return add(p, new THREE.CylinderGeometry(rTop, rBot, h, seg), m, x, y + h / 2, z)
}
/** ellipsoid centred at (x,y,z) */
export function sp(p: THREE.Object3D, r: number, m: Mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 10): THREE.Mesh {
  const s = add(p, new THREE.SphereGeometry(r, seg, Math.max(4, seg >> 1)), m, x, y, z)
  s.scale.set(sx, sy, sz)
  return s
}
/** vertical plane facing +z of its parent (rotate with ry), bottom-centre (x,y,z) */
export function pl(p: THREE.Object3D, w: number, h: number, m: Mat, x = 0, y = 0, z = 0, ry = 0): THREE.Mesh {
  const s = add(p, new THREE.PlaneGeometry(w, h), m, x, y + h / 2, z, ry)
  s.castShadow = false
  return s
}
/** cylinder between two points (thin rod / tapered leg) */
export function rod(p: THREE.Object3D, a: [number, number, number], b: [number, number, number], r0: number, r1: number, m: Mat, seg = 8): THREE.Mesh {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b)
  const len = va.distanceTo(vb)
  const mesh = add(p, new THREE.CylinderGeometry(r1, r0, len, seg), m, 0, 0, 0)
  mesh.position.copy(va).add(vb).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize())
  return mesh
}
/** torus lying flat (ring), centre (x,y,z) */
export function ring(p: THREE.Object3D, R: number, r: number, m: Mat, x: number, y: number, z: number, seg = 16): THREE.Mesh {
  const t = add(p, new THREE.TorusGeometry(R, r, 6, seg), m, x, y, z)
  t.rotation.x = Math.PI / 2
  return t
}
/** curtain / cloth strip: pleated plane in the local x-y plane, bulging towards +z. */
export function cloth(p: THREE.Object3D, w: number, h: number, folds: number, amp: number, m: Mat, x: number, y: number, z: number, ry = 0): THREE.Mesh {
  const g = new THREE.PlaneGeometry(w, h, Math.max(8, folds * 6), 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(((pos.getX(i) / w) + 0.5) * folds * Math.PI * 2) * amp)
  g.computeVertexNormals()
  const c = add(p, g, m, x, y + h / 2, z, ry)
  c.castShadow = false
  return c
}

// ------------------------------------------------------------------ composite helpers
/** child group at (x, y, z) rotated ry; local +z = front. Use for props that are not plan pieces. */
export function at(p: THREE.Object3D, x: number, z: number, ry = 0, y = 0): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = ry
  p.add(g)
  return g
}
/** four straight or splayed legs under a w x d rectangle (centre 0,0), inset from the corners; splay = outward lean at the foot */
export function legs4(p: THREE.Object3D, w: number, d: number, h: number, r0: number, r1: number, m: Mat, inset = 0.04, y = 0, splay = 0): void {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 - inset), z = sz * (d / 2 - inset)
    rod(p, [x + sx * splay, y, z + sz * splay], [x, y + h, z], r0, r1, m, 8)
  }
}
/** framed picture, facing +z (bottom-centre x,y,z): frame boxes + art plane */
export function picture(p: THREE.Object3D, w: number, h: number, art: Mat, x: number, y: number, z: number, ry = 0,
  frame: Mat = 'furn-dark', t = 0.02, depth = 0.03): void {
  const g = at(p, x, z, ry, y)
  bx(g, t, h, depth, frame, -w / 2 + t / 2, 0, depth / 2)
  bx(g, t, h, depth, frame, w / 2 - t / 2, 0, depth / 2)
  bx(g, w - 2 * t, t, depth, frame, 0, 0, depth / 2)
  bx(g, w - 2 * t, t, depth, frame, 0, h - t, depth / 2)
  bx(g, w - 2 * t, h - 2 * t, 0.006, 'furn-white', 0, t, 0.004)
  pl(g, w - 2 * t, h - 2 * t, art, 0, t, 0.0075)
}
/** hanging pendant: cord from (x, yTop, z) down `drop`, shade cone + bulb */
export function pendant(p: THREE.Object3D, x: number, yTop: number, z: number, drop: number, r: number, shade: Mat = 'lampshade'): void {
  cy(p, 0.004, 0.004, drop - 0.16, 'furn-dark', x, yTop - drop + 0.16, z, 5)
  cy(p, r * 0.35, r, 0.16, shade, x, yTop - drop, z, 16)
  sp(p, 0.035, 'bulb', x, yTop - drop + 0.04, z, 1, 1, 1, 8)
}
/** curtain rod along x between x0..x1 at (y, z), with finials */
export function curtainRod(p: THREE.Object3D, x0: number, x1: number, y: number, z: number, m: Mat = 'metal-black'): void {
  rod(p, [x0, y, z], [x1, y, z], 0.011, 0.011, m, 8)
  sp(p, 0.02, m, x0 - 0.01, y, z, 1, 1, 1, 8); sp(p, 0.02, m, x1 + 0.01, y, z, 1, 1, 1, 8)
}
/** leafy little plant: white/terracotta pot with n flat leaf blades fanning out */
export function smallPlant(p: THREE.Object3D, x: number, y: number, z: number, h = 0.25, seed = 3, pot: Mat = 'terracotta'): void {
  bush(p, x, y, z, h, seed, 14, pot)
}
/** hurricane lantern with candle (silver) */
export function lantern(p: THREE.Object3D, x: number, y: number, z: number, h = 0.26): void {
  cy(p, 0.052, 0.058, 0.02, 'chrome', x, y, z, 14)
  cy(p, 0.05, 0.05, h, 'glass', x, y + 0.02, z, 14)
  cy(p, 0.02, 0.02, h * 0.55, 'furn-white', x, y + 0.02, z, 10)
  sp(p, 0.014, 'bulb', x, y + 0.02 + h * 0.55, z, 1, 1.6, 1, 6)
  ring(p, 0.052, 0.005, 'chrome', x, y + 0.02 + h, z, 14)
  rod(p, [x - 0.05, y + 0.02 + h, z], [x + 0.05, y + 0.02 + h, z], 0.004, 0.004, 'chrome', 5)
}

/** ribbed white radiator: n vertical ribs (each ~ 8 cm), facing +z, bottom-centre (x,y,z) */
export function ribRadiator(p: THREE.Object3D, w: number, h: number, x: number, y: number, z: number, ry = 0, m: Mat = 'radiator'): void {
  const g = at(p, x, z, ry, y)
  const n = Math.max(3, Math.round(w / 0.085)), sw = w / n
  for (let i = 0; i < n; i++) rb(g, sw * 0.8, h, 0.06, 0.012, m, -w / 2 + sw * (i + 0.5), 0, 0.03, 0, 1)
  bx(g, w, 0.03, 0.05, m, 0, h * 0.82, 0.03); bx(g, w, 0.03, 0.05, m, 0, h * 0.12, 0.03)
  for (const sx of [-1, 1]) bx(g, 0.02, 0.06, 0.02, 'metal-black', sx * (w / 2 - 0.05), 0.0, 0.01)
}
/** flat white panel radiator (photos 02, 20): panel with horizontal press lines, top grille, thin valve pipes; facing +z, bottom-centre (x,y,z) */
export function panelRadiator(p: THREE.Object3D, w: number, h: number, x: number, y: number, z: number, ry = 0): void {
  const g = at(p, x, z, ry, y)
  const white = paint(0xf3f3f1, 0.38)
  rb(g, w, h, 0.045, 0.008, white, 0, 0.0, 0.0225, 0, 1)
  for (let i = 1; i < 6; i++) bx(g, w - 0.02, 0.004, 0.004, paint(0xc9c9c6, 0.6), 0, (h * i) / 6, 0.047)
  bx(g, w, 0.012, 0.055, white, 0, h, 0.026)
  for (const sx of [-1, 1]) {
    rod(g, [sx * (w / 2 - 0.04), 0, 0.02], [sx * (w / 2 - 0.04), -0.09, 0.02], 0.007, 0.007, white, 6)
    bx(g, 0.03, 0.03, 0.03, 'chrome', sx * (w / 2 - 0.04), -0.005, 0.02)
  }
}
/** black arc floor lamp: base at (x,z), pole up to `top`, arc reaching (dx,dz) horizontally, shade at the end */
export function arcLamp(p: THREE.Object3D, x: number, z: number, top: number, dx: number, dz: number): void {
  const m = 'metal-black'
  cy(p, 0.14, 0.15, 0.03, m, x, 0, z, 20)
  const pts: [number, number, number][] = []
  const N = 8
  pts.push([x, 0.03, z], [x, top - 0.25, z])
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2)
    pts.push([x + dx * (1 - Math.cos(a)), top - 0.25 + 0.25 * Math.sin(a) - (i / N) * 0.35, z + dz * (1 - Math.cos(a))])
  }
  for (let i = 0; i < pts.length - 1; i++) rod(p, pts[i], pts[i + 1], 0.01, 0.01, m, 6)
  const e = pts[pts.length - 1]
  cy(p, 0.06, 0.13, 0.17, 'lampshade', e[0], e[1] - 0.17, e[2], 16)
  sp(p, 0.03, 'bulb', e[0], e[1] - 0.14, e[2], 1, 1, 1, 8)
}
/** table lamp on a surface at y */
export function tableLamp(p: THREE.Object3D, x: number, y: number, z: number, h = 0.32, base: Mat = 'chrome'): void {
  cy(p, 0.05, 0.06, 0.02, base, x, y, z, 14)
  cy(p, 0.012, 0.012, h * 0.55, base, x, y + 0.02, z, 8)
  cy(p, 0.09, 0.14, h * 0.5, 'lampshade', x, y + h * 0.5, z, 18)
}

// ------------------------------------------------------------------ art canvases (small canvas-drawn prints)
const rr = (seed: number) => rnd(seed)
/** procedural wall art: 'portrait' (b/w), 'red', 'brown', 'black' (abstract), 'zebra-red', 'zebra' (print), 'land' (pastel landscape) */
export function art(kind: string): THREE.Material {
  const draw = (c: CanvasRenderingContext2D, w: number, h: number): void => {
    const r = rr(kind.length * 7 + kind.charCodeAt(0))
    if (kind === 'portrait') {
      const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#9c9a95'); g.addColorStop(0.5, '#d6d4ce'); g.addColorStop(1, '#8a8883'); c.fillStyle = g; c.fillRect(0, 0, w, h)
      for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(${r() > 0.5 ? 40 : 235},${r() > 0.5 ? 40 : 235},${r() > 0.5 ? 40 : 235},0.10)`; c.fillRect(w * r(), h * r(), w * r() * 0.2, h * r() * 0.03) }
      const fx = w * 0.4, fy = h * 0.52
      // dark flowing hair behind and beside the face
      c.fillStyle = '#1b1b1b'
      c.beginPath(); c.ellipse(fx, fy - h * 0.06, w * 0.17, h * 0.4, 0.15, 0, 7); c.fill()
      for (let i = 0; i < 26; i++) { c.strokeStyle = `rgba(20,20,20,${0.4 + r() * 0.5})`; c.lineWidth = 2 + r() * 5; c.beginPath(); c.moveTo(fx + w * (0.05 + r() * 0.1), fy - h * 0.4 + h * r() * 0.3); c.quadraticCurveTo(fx + w * (0.2 + r() * 0.22), fy, fx + w * (0.1 + r() * 0.3), fy + h * (0.25 + r() * 0.25)); c.stroke() }
      // pale face, eyes, brows, nose, lips
      c.fillStyle = '#e6e3dc'; c.beginPath(); c.ellipse(fx, fy + h * 0.02, w * 0.105, h * 0.29, 0.06, 0, 7); c.fill()
      c.fillStyle = '#1c1c1c'
      c.beginPath(); c.ellipse(fx - w * 0.04, fy - h * 0.06, w * 0.022, h * 0.028, 0, 0, 7); c.ellipse(fx + w * 0.045, fy - h * 0.06, w * 0.022, h * 0.028, 0, 0, 7); c.fill()
      c.strokeStyle = '#2a2a2a'; c.lineWidth = 3
      c.beginPath(); c.moveTo(fx - w * 0.07, fy - h * 0.11); c.lineTo(fx - w * 0.015, fy - h * 0.12); c.moveTo(fx + w * 0.02, fy - h * 0.12); c.lineTo(fx + w * 0.08, fy - h * 0.105); c.stroke()
      c.strokeStyle = 'rgba(60,60,60,0.5)'; c.beginPath(); c.moveTo(fx + w * 0.005, fy - h * 0.04); c.lineTo(fx - w * 0.005, fy + h * 0.06); c.stroke()
      c.fillStyle = '#3a3a3a'; c.beginPath(); c.ellipse(fx, fy + h * 0.15, w * 0.04, h * 0.015, 0, 0, 7); c.fill()
      const sh = c.createLinearGradient(fx - w * 0.1, 0, fx + w * 0.1, 0); sh.addColorStop(0, 'rgba(0,0,0,0.0)'); sh.addColorStop(1, 'rgba(0,0,0,0.28)'); c.fillStyle = sh; c.beginPath(); c.ellipse(fx, fy + h * 0.02, w * 0.105, h * 0.29, 0.06, 0, 7); c.fill()
      return
    }
    if (kind === 'cowbrown' || kind === 'cowbw') {
      const brown = kind === 'cowbrown'
      c.fillStyle = brown ? '#6d3d24' : '#f1eee8'; c.fillRect(0, 0, w, h)
      if (brown) {
        for (let i = 0; i < 90; i++) { c.fillStyle = r() > 0.35 ? '#a4633a' : '#ece0cf'; c.globalAlpha = 0.55 + r() * 0.4; c.beginPath(); c.ellipse(w * r(), h * r(), 3 + r() * 6, 12 + r() * 22, (r() - 0.5) * 0.5, 0, 7); c.fill() }
      } else {
        c.fillStyle = '#1a1a1c'
        for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(w * (0.2 + r() * 0.6), h * (0.15 + r() * 0.7), w * (0.12 + r() * 0.18), h * (0.1 + r() * 0.2), r() * 3, 0, 7); c.fill() }
      }
      c.globalAlpha = 1
      return
    }
    if (kind === 'zebra') {
      c.fillStyle = '#f4f2ee'; c.fillRect(0, 0, w, h); c.fillStyle = '#141414'
      for (let i = 0; i < 26; i++) { const y = (i / 26) * h; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += w / 8) c.lineTo(x, y + (r() - 0.5) * h * 0.05 + h * 0.02); for (let x = w; x >= 0; x -= w / 8) c.lineTo(x, y + h * (0.02 + r() * 0.03) + h * 0.03); c.fill() }
      return
    }
    if (kind === 'land') {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#b9cde0'); g.addColorStop(0.6, '#e6dfc8'); g.addColorStop(1, '#8aa47a'); c.fillStyle = g; c.fillRect(0, 0, w, h)
      c.fillStyle = 'rgba(80,100,70,0.6)'; c.beginPath(); c.moveTo(0, h * 0.7); c.quadraticCurveTo(w * 0.4, h * 0.45, w, h * 0.72); c.lineTo(w, h); c.lineTo(0, h); c.fill()
      return
    }
    if (kind === 'zebra-red') { // street-art canvas: spray-painted red/black backdrop, big stencil zebra, drips, tag
      const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#c9281e'); bg.addColorStop(0.55, '#e8d9c8'); bg.addColorStop(1, '#151515'); c.fillStyle = bg; c.fillRect(0, 0, w, h)
      for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(${r() > 0.5 ? '20,20,20' : '250,240,225'},0.10)`; c.beginPath(); c.arc(w * r(), h * r(), 6 + r() * 26, 0, 7); c.fill() } // spray mist
      c.fillStyle = '#f4f2ee'; c.beginPath(); c.ellipse(w * 0.5, h * 0.58, w * 0.2, h * 0.34, 0.15, 0, 7); c.fill() // head
      c.beginPath(); c.moveTo(w * 0.4, h * 0.3); c.lineTo(w * 0.37, h * 0.04); c.lineTo(w * 0.46, h * 0.24); c.fill(); c.beginPath(); c.moveTo(w * 0.56, h * 0.26); c.lineTo(w * 0.62, h * 0.03); c.lineTo(w * 0.63, h * 0.32); c.fill() // ears
      c.strokeStyle = '#111'; c.lineWidth = h * 0.045; c.lineCap = 'round'
      for (let i = 0; i < 9; i++) { const x = w * (0.34 + i * 0.037); c.beginPath(); c.moveTo(x, h * (0.3 + r() * 0.05)); c.quadraticCurveTo(x + w * 0.03, h * 0.6, x - w * 0.01, h * (0.82 + r() * 0.06)); c.stroke() } // stripes
      c.fillStyle = '#111'; c.beginPath(); c.ellipse(w * 0.46, h * 0.5, w * 0.018, h * 0.04, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(w * 0.56, h * 0.52, w * 0.018, h * 0.04, 0, 0, 7); c.fill() // eyes
      c.strokeStyle = 'rgba(20,20,20,0.9)'; c.lineWidth = 3
      for (let i = 0; i < 6; i++) { const x = w * (0.04 + r() * 0.92); c.beginPath(); c.moveTo(x, h * 0.75); c.lineTo(x, h * (0.85 + r() * 0.14)); c.stroke() } // paint drips
      c.fillStyle = '#f4f2ee'; c.font = `bold ${Math.round(h * 0.16)}px sans-serif`; c.fillText('ZEBRA', w * 0.04, h * 0.2) // tag
      return
    }
    const pal = kind === 'red' ? ['#7a1a14', '#c23a2a', '#e8d9c8', '#2a1210'] : kind === 'brown' ? ['#4a2a1c', '#8a5232', '#e8ddd0', '#2a1a12']
      : kind === 'black' ? ['#141414', '#5a5a5a', '#eee9e0', '#000000'] : ['#b0221c', '#141414', '#e8e0d8', '#6a1010']
    c.fillStyle = pal[2]; c.fillRect(0, 0, w, h)
    for (let i = 0; i < 26; i++) { c.fillStyle = pal[Math.floor(r() * 4)]; c.globalAlpha = 0.5 + r() * 0.5; c.beginPath(); c.ellipse(w * r(), h * r(), w * (0.05 + r() * 0.25), h * (0.03 + r() * 0.15), r() * 3, 0, 7); c.fill() }
    c.globalAlpha = 1
    if (kind === 'zebra-red') { c.fillStyle = '#f4f2ee'; c.beginPath(); c.ellipse(w * 0.5, h * 0.55, w * 0.22, h * 0.25, 0, 0, 7); c.fill(); c.fillStyle = '#141414'; for (let i = 0; i < 9; i++) c.fillRect(w * (0.3 + i * 0.05), h * 0.32, w * 0.02, h * 0.5) }
  }
  return canvasMat('art-' + kind, kind === 'zebra-red' ? 512 : 256, kind === 'zebra' ? 256 : kind === 'zebra-red' ? 232 : 192, draw, { roughness: 0.75 })
}

/** bright, low-roughness fake reflection for the wall mirror (silver-white, streak, hint of ceiling) */
export const mirrorFake = (): THREE.Material => canvasMat('mirror-fake', 128, 128, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#f3f6f7'); g.addColorStop(0.55, '#c9d3d6'); g.addColorStop(1, '#b3bec3')
  c.fillStyle = g; c.fillRect(0, 0, w, h)
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, 0, w, h * 0.22)
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(w * 0.15, h); c.lineTo(w * 0.35, 0); c.lineTo(w * 0.5, 0); c.lineTo(w * 0.3, h); c.fill()
  c.fillStyle = 'rgba(90,100,105,0.25)'; c.fillRect(w * 0.55, h * 0.55, w * 0.3, h * 0.3)
}, { roughness: 0.06, metalness: 0.55 })


// ------------------------------------------------------------------ plants (no alpha textures: small ellipsoid leaves)
const rnd = (seed: number) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280) }
/** pot plant: terracotta / white pot + n leaves. Base at (x,y,z), total height ~h. */
export function bush(p: THREE.Object3D, x: number, y: number, z: number, h: number, seed = 1, leaves = 22, pot: Mat = 'terracotta'): void {
  const r = rnd(seed)
  const potH = h * 0.28, potR = h * 0.13
  cy(p, potR, potR * 0.72, potH, pot, x, y, z, 14)
  cy(p, potR * 0.92, potR * 0.92, 0.01, 'soil', x, y + potH - 0.005, z, 12)
  for (let i = 0; i < leaves; i++) {
    const t = i / leaves
    const a = r() * Math.PI * 2, spread = 0.03 + t * h * 0.16, ly = y + potH + t * (h - potH) * 0.85 + 0.02
    const leaf = sp(p, 1, r() > 0.4 ? 'plant-dark' : 'furn-plant', x + Math.cos(a) * spread, ly, z + Math.sin(a) * spread,
      h * 0.045, h * 0.012, h * 0.11, 6)
    leaf.rotation.set(-0.5 - r() * 0.5, -a + Math.PI / 2, 0, 'YXZ')
  }
}
/** phalaenopsis orchid (magenta) in a pot: arching stem, 8 blooms, 3 broad leaves */
export function orchid(p: THREE.Object3D, x: number, y: number, z: number, s = 1, potMat: Mat = 'furn-white'): void {
  cy(p, 0.05 * s, 0.038 * s, 0.09 * s, potMat, x, y, z, 12)
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1
    const l = sp(p, 1, 'plant-dark', x + Math.cos(a) * 0.05 * s, y + 0.1 * s, z + Math.sin(a) * 0.05 * s, 0.035 * s, 0.008 * s, 0.09 * s, 6)
    l.rotation.set(-0.35, -a + Math.PI / 2, 0, 'YXZ')
  }
  const pts: [number, number, number][] = [[0, 0.09, 0], [0.01, 0.25, 0], [0.05, 0.38, 0.01], [0.12, 0.44, 0.02]]
  for (let i = 0; i < pts.length - 1; i++)
    rod(p, [x + pts[i][0] * s, y + pts[i][1] * s, z + pts[i][2] * s], [x + pts[i + 1][0] * s, y + pts[i + 1][1] * s, z + pts[i + 1][2] * s], 0.004 * s, 0.003 * s, 'plant-dark', 5)
  const bloom = paint(0xb0206e, 0.55)
  for (let i = 0; i < 8; i++) {
    const t = i / 7
    sp(p, 0.032 * s, bloom, x + (0.02 + t * 0.11) * s, y + (0.27 + t * 0.17) * s, z + (i % 2 ? 0.03 : -0.02) * s, 1, 0.8, 0.5, 8)
  }
}

// ------------------------------------------------------------------ baking
/**
 * Merge every mesh under `root` (which must sit at the world origin, identity transform) into one mesh per material.
 * Materials and textures are shared, geometry is copied and the source geometry disposed.
 */
export function bake(root: THREE.Group): THREE.Group {
  root.updateMatrixWorld(true)
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>()
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    let g = o.geometry as THREE.BufferGeometry
    g = g.index ? g.toNonIndexed() : g.clone()
    g.applyMatrix4(o.matrixWorld)
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv' && n !== 'color') g.deleteAttribute(n)
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
    o.geometry.dispose()
    let mat = o.material as THREE.Material
    const tint = mat.userData.tint as { hex: number; rough: number; metal: number } | undefined
    if (tint) {
      const c = new THREE.Color(tint.hex), n = g.attributes.position.count, col = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3))
      mat = tintMaterial(tint.rough, tint.metal)
    }
    const list = buckets.get(mat)
    if (list) list.push(g); else buckets.set(mat, [g])
  })
  const out = new THREE.Group()
  out.name = root.name
  buckets.forEach((gs, mat) => {
    const merged = mergeGeometries(gs, false)
    gs.forEach((g) => g.dispose())
    if (!merged) return
    const mesh = new THREE.Mesh(merged, mat)
    mesh.name = `${root.name}:${mat.name || 'mat'}`
    mesh.castShadow = !mat.transparent
    mesh.receiveShadow = !mat.transparent
    out.add(mesh)
  })
  return out
}

// ------------------------------------------------------------------ plan pieces
/** Empty group positioned/rotated at the plan pose of `f` (rotation.y = rotationY, position = centre at base elevation). */
export function pieceGroup(f: Furniture): THREE.Group {
  const g = new THREE.Group()
  g.name = `furn:${f.id}`
  g.position.set(f.x, f.y, f.z)
  g.rotation.y = f.rotationY
  g.userData.furnitureId = f.id
  return g
}
export const fur = (id: string): Furniture => furniture.find((f) => f.id === id)!
export const piecesOf = (rooms: RoomId[]): Furniture[] => furniture.filter((f) => rooms.includes(f.room))

/** Build every piece of `rooms` with `builders[type]`; pieces without a builder get a plain box. Result is baked. */
export function buildRooms(name: string, rooms: RoomId[], builders: Partial<Record<FurnitureType | string, (g: THREE.Group, f: Furniture) => void>>,
  extra?: (root: THREE.Group) => void): THREE.Group {
  const root = new THREE.Group()
  root.name = name
  for (const f of piecesOf(rooms)) {
    const g = pieceGroup(f)
    const b = builders[f.id] ?? builders[f.type]
    if (b) b(g, f); else bx(g, f.w, f.h, f.d, 'furn-wood')
    root.add(g)
  }
  extra?.(root)
  return bake(root)
}

/** Poang-style bentwood lounge chair (light birch frame, loose cushions); front +z */
export function poang(g: THREE.Object3D, cushion: Mat, back = cushion): void {
  const wd = 'wood-birch'
  const prof: [number, number][] = [[-0.36, 0.05], [-0.34, 0.4], [-0.28, 0.7], [-0.2, 0.9], [-0.3, 0.58], [-0.18, 0.3], [0.2, 0.27], [0.34, 0.22], [0.36, 0.0]]
  for (const s of [-1, 1]) for (let i = 0; i < prof.length - 1; i++) {
    if (i === 3) continue
    rod(g, [s * 0.27, prof[i][1], prof[i][0]], [s * 0.27, prof[i + 1][1], prof[i + 1][0]], 0.02, 0.02, wd, 6)
  }
  rod(g, [-0.27, 0.3, -0.18], [0.27, 0.3, -0.18], 0.013, 0.013, wd, 6)
  rod(g, [-0.27, 0.06, 0.3], [0.27, 0.06, 0.3], 0.013, 0.013, wd, 6)
  const s = rb(g, 0.5, 0.1, 0.5, 0.045, cushion, 0, 0.3, 0.02, 0, 3); s.rotation.x = 0.06
  const b = rb(g, 0.5, 0.52, 0.1, 0.045, back, 0, 0.36, -0.3, 0, 3); b.rotation.x = -0.3
}
/** matching bentwood footstool */
export function poangStool(g: THREE.Object3D, cushion: Mat): void {
  const wd = 'wood-birch'
  for (const s of [-1, 1]) {
    rod(g, [s * 0.15, 0, 0.17], [s * 0.15, 0.3, 0.15], 0.015, 0.015, wd, 6)
    rod(g, [s * 0.15, 0.3, 0.15], [s * 0.15, 0.32, -0.15], 0.015, 0.015, wd, 6)
    rod(g, [s * 0.15, 0.32, -0.15], [s * 0.15, 0, -0.17], 0.015, 0.015, wd, 6)
  }
  rb(g, 0.36, 0.08, 0.32, 0.035, cushion, 0, 0.3, 0, 0, 3)
}

// ------------------------------------------------------------------ beds, small tables
export interface Pillow { x: number; z: number; w: number; d: number; h: number; m: Mat; tilt?: number; ry?: number }
export interface BedCfg {
  top: Mat; cover: Mat; coverFrac: number; coverY?: number; pillows: Pillow[]; bothSides?: boolean; frame?: Mat; headH?: number
  drawerSide?: 1 | -1 // which local x side carries the drawers when not bothSides (default +x)
  rug?: Mat // optional second layer laid over the head third (duvet)
}
/** Brimnes-style white drawer bed. Local +z = foot, head at -z; drawers on +x (and -x if bothSides). */
export function drawerBed(g: THREE.Object3D, w: number, d: number, c: BedCfg): void {
  const W = c.frame ?? 'furn-white'
  rb(g, w, 0.3, d, 0.01, W, 0, 0.06, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.05, 0.06, 0.05, W, sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05))
  const sides = c.bothSides ? [1, -1] : [c.drawerSide ?? 1]
  const nd = d > 1.7 ? 2 : 2, dl = (d - 0.3) / nd
  for (const sx of sides) for (let i = 0; i < nd; i++) {
    const z = -d / 2 + 0.15 + dl * (i + 0.5)
    bx(g, 0.012, 0.21, dl - 0.02, W, sx * (w / 2 + 0.003), 0.1, z)
    bx(g, 0.004, 0.23, 0.014, paint(0x9c9a95, 0.6), sx * (w / 2 + 0.002), 0.09, z + dl / 2)
    bx(g, 0.022, 0.014, 0.17, 'chrome', sx * (w / 2 + 0.016), 0.26, z)
  }
  const hh = c.headH ?? 0.5
  rb(g, w + 0.02, hh + 0.03, 0.05, 0.012, W, 0, 0.36, -d / 2 + 0.02)
  // routed raised panel on the head board (all white, photos 02 / 20)
  rb(g, w - 0.16, hh - 0.14, 0.014, 0.006, W, 0, 0.36 + 0.07, -d / 2 + 0.05, 0, 1)
  rb(g, w + 0.02, 0.2, 0.04, 0.01, W, 0, 0.36, d / 2 - 0.02)
  rb(g, w - 0.04, 0.2, d - 0.08, 0.05, c.top, 0, 0.36, 0)
  const cl = d * c.coverFrac, cz = d / 2 - cl / 2 - 0.03, cy0 = c.coverY ?? 0.56
  rb(g, w + 0.02, 0.05, cl, 0.024, c.cover, 0, cy0, cz, 0, 3)
  for (const sx of [-1, 1]) rb(g, 0.03, 0.17, cl - 0.06, 0.013, c.cover, sx * (w / 2 + 0.012), cy0 - 0.14, cz, 0, 2)
  // blanket drapes over the foot board; folded band at the head edge
  rb(g, w + 0.04, 0.2, 0.035, 0.014, c.cover, 0, cy0 - 0.17, d / 2 + 0.006, 0, 2)
  rb(g, w - 0.02, 0.06, 0.16, 0.028, c.cover, 0, cy0 + 0.03, cz - cl / 2 + 0.05, 0, 3)
  if (c.rug) rb(g, w - 0.04, 0.06, 0.22, 0.026, c.rug, 0, cy0 - 0.01, cz - cl / 2 - 0.1, 0, 3)
  for (const p of c.pillows) { const m = rb(g, p.w, p.h, p.d, Math.min(0.05, p.h / 2.5), p.m, p.x, cy0 - 0.02, p.z, p.ry ?? 0, 3); m.rotation.x = -(p.tilt ?? 0) }
}
/** white bedside table: 4 thin legs, drawer, lower shelf; front +z; top at h */
export function nightstand(g: THREE.Object3D, w: number, d: number, h: number, m: Mat = 'furn-white'): void {
  legs4(g, w - 0.02, d - 0.02, h - 0.03, 0.012, 0.016, m, 0.025)
  rb(g, w, 0.03, d, 0.008, m, 0, h - 0.03, 0)
  bx(g, w - 0.04, 0.02, d - 0.05, m, 0, 0.13, 0)
  bx(g, w - 0.04, 0.13, d - 0.05, m, 0, h - 0.16, -0.005)
  bx(g, w - 0.06, 0.1, 0.01, m, 0, h - 0.15, d / 2 - 0.02)
  sp(g, 0.014, 'chrome', 0, h - 0.1, d / 2 - 0.005, 1, 1, 1, 6)
}
/** white wooden chair with slatted back; front +z */
export function whiteChair(g: THREE.Object3D, m: Mat = 'furn-white', cushion?: Mat): void {
  for (const sx of [-1, 1]) { bx(g, 0.035, 0.45, 0.035, m, sx * 0.19, 0, 0.18); bx(g, 0.035, 0.88, 0.035, m, sx * 0.19, 0, -0.19) }
  rb(g, 0.42, 0.035, 0.42, 0.008, m, 0, 0.45, 0)
  for (const y of [0.6, 0.7, 0.8]) bx(g, 0.34, 0.05, 0.02, m, 0, y, -0.19)
  if (cushion) rb(g, 0.38, 0.045, 0.38, 0.02, cushion, 0, 0.485, 0.005, 0, 2)
}

// ------------------------------------------------------------------ old placeholder API (kept for modules not yet ported)
export function box(w: number, h: number, d: number, key: string, ox = 0, oy = 0, oz = 0): THREE.Mesh {
  return bx(new THREE.Group(), w, h, d, key, ox, oy, oz)
}
export function placeholder(f: Furniture): THREE.Group {
  const g = pieceGroup(f)
  bx(g, f.w, f.h, f.d, 'furn-wood')
  return g
}
export function buildPlaceholders(name: string, rooms: RoomId[]): THREE.Group {
  const g = new THREE.Group()
  g.name = name
  for (const f of piecesOf(rooms)) g.add(placeholder(f))
  return g
}
