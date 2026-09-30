/**
 * dressing.ts - lighting-side fixtures and window dressing (built by lighting.ts, after the furniture):
 * warm lights under the kitchen pendants / over the sink / at the Wohnen table lamp (the lamp meshes come from the furniture modules),
 * ceiling fixtures (Bad round, Kinderzimmer 2 LED panel), the frosted bath window with a soft daylight cone, sheer curtains in the
 * children's rooms and a radiator behind the desk. Procedural and cheap. Meshes are flagged noShadow so refreshShadows() leaves them alone.
 * Curtains / radiators / ceiling fixtures are skipped where a furniture module already put a mesh (material-name match near the spot).
 */
import * as THREE from 'three'

import { getMaterial } from './materials'
import { footprint, furniture, openings, rooms, walls, WALL_HEIGHT } from './plan'
import type { Opening } from './plan'

export interface Dressing {
  group: THREE.Group
  /** quality gate: lights that cost every pixel are only on the stronger tiers */
  setLevel(level: number): void
  /** the bath window's soft daylight cone replaces the generic window point light for that room */
  bathSpot: THREE.SpotLight | null
  dispose(): void
}

interface WinFrame { inward: THREE.Vector3; tangent: THREE.Vector3; inner: THREE.Vector3; outer: THREE.Vector3; t: number; yaw: number }

function frameOf(o: Opening): WinFrame | null {
  const wall = walls.find((w) => w.id === o.wall)
  const room = rooms.find((r) => r.id === o.rooms[0])
  if (!wall || !room) return null
  const horiz = wall.a.z === wall.b.z
  const n = room.polygon.length
  const rc = room.polygon.reduce((a, p) => ({ x: a.x + p.x / n, z: a.z + p.z / n }), { x: 0, z: 0 })
  const inward = horiz ? new THREE.Vector3(0, 0, Math.sign(rc.z - o.at.z)) : new THREE.Vector3(Math.sign(rc.x - o.at.x), 0, 0)
  const tangent = horiz ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)
  const c = new THREE.Vector3(o.at.x, 0, o.at.z)
  return {
    inward, tangent, t: wall.t,
    inner: c.clone().addScaledVector(inward, wall.t / 2),
    outer: c.clone().addScaledVector(inward, -wall.t / 2),
    yaw: Math.atan2(-tangent.z, tangent.x),
  }
}

/** True when a furniture-module mesh with one of the given material names (or, with `ceiling`, any mesh in the top 25 cm) sits near (x, z). */
const hasMat = (root: THREE.Object3D, mats: string[], near: THREE.Vector3, r = 0.9, ceiling = false): boolean => {
  let found = false
  const box = new THREE.Box3(), c = new THREE.Vector3()
  root.traverse((o) => {
    if (found || !(o instanceof THREE.Mesh) || o.userData.noShadow) return
    const names = (Array.isArray(o.material) ? o.material : [o.material]).map((m) => m.name)
    if (!ceiling && !names.some((n) => mats.includes(n))) return
    box.setFromObject(o).getCenter(c)
    if (ceiling && box.max.y < WALL_HEIGHT - 0.25) return
    if (Math.hypot(c.x - near.x, c.z - near.z) < r) found = true
  })
  return found
}

/** Gathered cloth: subdivided plane whose depth wobbles like pleats. Local x along the wall, y up. */
function clothPanel(w: number, h: number, mat: THREE.Material, pleat: number, amp: number, phase = 0): THREE.Mesh {
  const seg = Math.max(8, Math.round(w / (pleat / 3)))
  const g = new THREE.PlaneGeometry(w, h, seg, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setZ(i, amp * Math.sin(((pos.getX(i) + phase) / pleat) * Math.PI * 2))
  g.computeVertexNormals()
  const m = new THREE.Mesh(g, mat)
  m.castShadow = false
  m.receiveShadow = false
  return m
}

const panelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.05, 1.05, 1.02) }) // soft diffuser: reads white, does not bloom into a slab
const casingMat = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.5 })

function frostTexture(): THREE.CanvasTexture {
  // pale patterned obscure glass (photo 29): soft vertical ribs, brighter in the middle
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 128)
  grad.addColorStop(0, '#dfe8ee')
  grad.addColorStop(1, '#f6f7f5')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = 'rgba(150,170,180,0.28)'
  g.lineWidth = 2
  for (let x = 6; x < 128; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke() }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Voile: semi-transparent, lit from behind by the daylight (small emissive), with a denser lace hem. Alpha map: 128 x 256, hem at the bottom. */
function sheerMaterial(): { mat: THREE.MeshStandardMaterial; tex: THREE.CanvasTexture } {
  const c = document.createElement('canvas')
  c.width = 64; c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#b4b4b4' // ~70 % opaque voile
  g.fillRect(0, 0, 64, 128)
  g.fillStyle = '#9c9c9c'
  for (let x = 0; x < 64; x += 4) g.fillRect(x, 0, 1, 128) // fine vertical weave
  g.fillStyle = '#ffffff'
  g.fillRect(0, 112, 64, 16) // hem
  g.fillStyle = '#ffffff'
  for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 112, 4, 0, Math.PI); g.fill() } // scallops
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf7f2e8, roughness: 1, alphaMap: tex, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false,
    emissive: 0xfff2dc, emissiveIntensity: 0.32,
  })
  return { mat, tex }
}

export function buildDressing(scene: THREE.Scene): Dressing {
  const group = new THREE.Group()
  group.name = 'lighting:dressing'
  const disposables: { dispose(): void }[] = []
  const gated: { l: THREE.Light; maxLevel: number }[] = []
  const furn = scene.getObjectByName('furniture') ?? scene
  const add = (o: THREE.Object3D): void => { group.add(o) }
  const own = <T extends { dispose(): void }>(x: T): T => { disposables.push(x); return x }
  const roomBox = (id: string) => {
    const r = rooms.find((q) => q.id === id)!
    const xs = r.polygon.map((p) => p.x), zs = r.polygon.map((p) => p.z)
    return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }
  }

  // ---- kitchen: warm light under the pendant bar over the table (kueche.ts builds bar + shades) and a work light over the sink
  const table = furniture.find((f) => f.id === 'table-kueche')
  if (table) {
    const bulbGeo = new THREE.SphereGeometry(0.04, 10, 8), bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.15, 0.6) })
    disposables.push(bulbGeo, bulbMat)
    for (const dx of [-0.42, 0, 0.42]) { // warm filaments inside the clear glass globes on the wood beam (kueche.ts, photo 19)
      const b = new THREE.Mesh(bulbGeo, bulbMat)
      b.position.set(table.x + dx, 1.735, table.z)
      add(b)
    }
    const pl = new THREE.PointLight(0xffbe78, 14, 5.5, 2)
    pl.position.set(table.x, 1.6, table.z)
    pl.name = 'lighting:pendant-light'
    add(pl)
    gated.push({ l: pl, maxLevel: 2 })
  }
  {
    // warm work light on the worktop / sink (north arm of the L)
    const sink = furniture.find((f) => f.id === 'sink-kueche')
    if (sink) {
      const sp = new THREE.SpotLight(0xffd09a, 14, 4.5, 0.8, 1, 2)
      sp.position.set(sink.x + 0.5, WALL_HEIGHT - 0.1, sink.z + 1.1)
      sp.target.position.set(sink.x - 0.2, 0.9, sink.z - 0.1)
      sp.name = 'lighting:worklight'
      add(sp); add(sp.target)
      gated.push({ l: sp, maxLevel: 2 })
    }
  }

  // ---- Wohnen: warm pool of the table lamp on the lit side table (wohnen.ts builds the lamp at x 9.5, z 6.3)
  {
    const pl = new THREE.PointLight(0xffb870, 2.6, 4, 2)
    pl.position.set(9.5, 1.0, 6.3)
    pl.name = 'lighting:table-lamp-light'
    add(pl)
    gated.push({ l: pl, maxLevel: 2 })
  }

  // ---- ceiling fixtures
  const bad = roomBox('bad')
  const badC = new THREE.Vector3((bad.x0 + bad.x1) / 2, WALL_HEIGHT, (bad.z0 + bad.z1) / 2) // same spot as the fill light in lighting.ts
  if (!hasMat(furn, [], badC, 0.6, true)) {
    const g = new THREE.Group()
    g.name = 'lighting:ceiling-bad'
    g.position.copy(badC)
    const rim = new THREE.Mesh(own(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 28)), casingMat)
    rim.position.y = -0.03
    const disc = new THREE.Mesh(own(new THREE.CircleGeometry(0.16, 28)), panelMat)
    disc.rotation.x = Math.PI / 2
    disc.position.y = -0.062
    g.add(rim, disc)
    add(g)
  }
  const km = roomBox('kind-mitte')
  const kmC = new THREE.Vector3(km.x0 + (km.x1 - km.x0) * 0.5, WALL_HEIGHT, km.z0 + (km.z1 - km.z0) * 0.45)
  if (!hasMat(furn, [], kmC, 0.6, true)) {
    const g = new THREE.Group()
    g.name = 'lighting:ceiling-kind-mitte'
    g.position.copy(kmC)
    const rim = new THREE.Mesh(own(new THREE.BoxGeometry(0.62, 0.05, 0.62)), casingMat)
    rim.position.y = -0.025
    const led = new THREE.Mesh(own(new THREE.PlaneGeometry(0.54, 0.54)), panelMat) // LED panel, photo 24
    led.rotation.x = Math.PI / 2
    led.position.y = -0.052
    g.add(rim, led)
    add(g)
  }

  // ---- bath window: frosted pane (photo 29) + soft daylight cone from the sill
  let bathSpot: THREE.SpotLight | null = null
  const bw = openings.find((o) => o.id === 'w-bad-n')
  const bf = bw ? frameOf(bw) : null
  if (bw && bf) {
    const tex = own(frostTexture())
    const mat = own(new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.9, 1.95, 2.0), side: THREE.DoubleSide }))
    const pane = new THREE.Mesh(own(new THREE.PlaneGeometry(bw.width - 0.1, bw.height - 0.1)), mat)
    pane.name = 'lighting:bath-frost'
    pane.position.copy(bf.outer).addScaledVector(bf.inward, 0.139)
    pane.position.y = bw.sill + bw.height / 2
    pane.rotation.y = bf.yaw
    add(pane)
    bathSpot = new THREE.SpotLight(0xe4eeff, 26, 5, 0.85, 1, 2)
    bathSpot.position.copy(bf.inner).addScaledVector(bf.inward, 0.12)
    bathSpot.position.y = bw.sill + bw.height * 0.55
    bathSpot.target.position.copy(bf.inner).addScaledVector(bf.inward, 1.15)
    bathSpot.target.position.y = 0
    bathSpot.name = 'lighting:bath-daylight'
    add(bathSpot); add(bathSpot.target)
    gated.push({ l: bathSpot, maxLevel: 3 })
  }

  // ---- sheer curtains (kind rooms, bedroom) and floral kitchen drapes on the sink windows
  const { mat: sheer, tex: sheerTex } = sheerMaterial()
  disposables.push(sheer, sheerTex)
  const floral = getMaterial('fabric-floral'), steel = getMaterial('steel')
  const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 8)
  disposables.push(rodGeo)
  for (const o of openings) {
    if (o.type !== 'window' || o.sill < 0.5) continue // terrace doors: leave to the furniture modules
    const kind = o.rooms[0] === 'kind-mitte' || o.rooms[0] === 'kind-links' ? 'sheer' : null // kitchen drapes + Wohnen curtains come from the furniture modules
    const f = kind ? frameOf(o) : null
    if (!kind || !f) continue
    const mid = f.inner.clone().addScaledVector(f.inward, 0.09)
    mid.y = 0
    if (hasMat(furn, ['curtain-sheer', 'fabric-floral'], mid, 0.9)) continue
    const top = o.sill + o.height + 0.14, bottom = o.sill + (kind === 'sheer' ? 0.05 : 0.02)
    const g = new THREE.Group()
    g.name = `lighting:curtain:${kind}:${o.id}`
    g.position.copy(mid)
    g.rotation.y = f.yaw
    const rod = new THREE.Mesh(rodGeo, steel)
    rod.scale.y = o.width + 0.3
    rod.rotation.z = Math.PI / 2
    rod.position.set(0, top + 0.01, 0.02)
    g.add(rod)
    if (kind === 'sheer') {
      const p = clothPanel(o.width + 0.16, top - bottom, sheer, 0.11, 0.014)
      p.position.y = (top + bottom) / 2
      g.add(p)
    } else {
      for (const s of [-1, 1]) { // drapes gathered to both sides, photo 19
        const p = clothPanel(0.32, top - bottom, floral, 0.1, 0.02, s)
        p.position.set(s * (o.width / 2 - 0.02), (top + bottom) / 2, 0)
        g.add(p)
      }
    }
    add(g)
  }

  // ---- radiator behind the desk in Kinderzimmer 2 (geometry.ts skips it where furniture stands in front of the window)
  for (const o of openings) {
    if (o.type !== 'window' || o.rooms[0] !== 'kind-mitte') continue
    const f = frameOf(o)
    if (!f) continue
    const rw = Math.min(1.0, o.width - 0.2)
    const c = f.inner.clone().addScaledVector(f.inward, 0.035)
    const half = f.tangent.clone().multiplyScalar(rw / 2)
    const a = c.clone().sub(half), b = c.clone().add(half)
    const rect = { x0: Math.min(a.x, b.x) - 0.05, x1: Math.max(a.x, b.x) + 0.05, z0: Math.min(a.z, b.z) - 0.05, z1: Math.max(a.z, b.z) + 0.05 }
    const blocked = furniture.some((q) => {
      if (q.onTopOf || q.type === 'rug' || q.type === 'plant' || q.type === 'plant-small' || q.y > 0.3) return false
      const r = footprint(q)
      return r.x0 < rect.x1 && r.x1 > rect.x0 && r.z0 < rect.z1 && r.z1 > rect.z0
    })
    if (!blocked || hasMat(furn, ['radiator'], c, 1.2)) continue
    const rad = new THREE.Group()
    rad.name = `lighting:radiator:${o.id}`
    rad.position.copy(c)
    rad.rotation.y = f.yaw
    const rh = Math.max(0.4, o.sill - 0.24) // top just under the sill board: peeks out above a desk
    const body = new THREE.Mesh(own(new THREE.BoxGeometry(rw, rh, 0.05)), getMaterial('radiator'))
    body.position.y = 0.14 + rh / 2
    rad.add(body)
    for (let i = 0; i < 12; i++) { // panel ribs
      const rib = new THREE.Mesh(own(new THREE.BoxGeometry(0.012, rh, 0.012)), getMaterial('radiator'))
      rib.position.set(-rw / 2 + (rw * (i + 0.5)) / 12, 0.14 + rh / 2, -0.03)
      rad.add(rib)
    }
    add(rad)
  }

  group.traverse((o) => { if (o instanceof THREE.Mesh) o.userData.noShadow = true })

  return {
    group, bathSpot,
    setLevel(level) { for (const { l, maxLevel } of gated) l.visible = level <= maxLevel },
    dispose() { for (const d of disposables) d.dispose() },
  }
}
