/**
 * backdrop.ts - what the windows see: one painted panorama on a tall cylinder around the plot (like the photos: saturated
 * meadow, trimmed hedge, a tree line with sunlit crowns, bright blue sky with soft clouds). No leaf sprites or blobs.
 * The texture is authored in angle space (rows = elevation seen from eye height), so it is drawn once and never parallaxes
 * wrongly. Opaque + depth write: the lawn disc behind the cylinder can never paint over the hedge band.
 */
import * as THREE from 'three'

const R = 45 // cylinder radius (m); camera far is 100
const EYE = 1.5
const E0 = -Math.atan((EYE + 0.03) / R) * (180 / Math.PI) // bottom edge = lawn plane
const E1 = 62 // top edge (deg above the horizon)
const RINGS = 40

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

function paint(w: number, h: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const rowOf = (deg: number) => h * (1 - (deg - E0) / (E1 - E0))
  const rnd = seeded(23)
  const hor = rowOf(0)

  // sky: deep blue up high, light near the horizon
  const sky = g.createLinearGradient(0, 0, 0, hor)
  for (const [deg, col] of [[E1, '#2a68c0'], [40, '#3d7fd0'], [20, '#5f9ce0'], [9, '#8dc0ee'], [3, '#b9dcf5'], [0, '#d3e9f5']] as [number, string][]) sky.addColorStop((rowOf(deg)) / hor, col)
  g.fillStyle = sky
  g.fillRect(0, 0, w, hor + 2)

  // clouds: stacks of soft radial puffs with a flat, slightly grey base, drawn wrapped so the seam is invisible
  for (let i = 0; i < 26; i++) {
    const x = rnd() * w, y = rowOf(7 + rnd() * 34), rx = w * (0.018 + rnd() * 0.04), ry = rx * (0.22 + rnd() * 0.12)
    for (let k = 0; k < 7; k++) {
      const ox = (rnd() - 0.5) * rx * 1.5, oy = -Math.abs(rnd() - 0.3) * ry * 0.9, pr = rx * (0.22 + rnd() * 0.22)
      for (const wrap of [-w, 0, w]) {
        g.save()
        g.translate(x + ox + wrap, y + oy)
        g.scale(1, 0.7)
        const rg = g.createRadialGradient(0, pr * 0.15, 0, 0, 0, pr)
        rg.addColorStop(0, 'rgba(255,255,255,0.95)')
        rg.addColorStop(0.55, 'rgba(250,252,255,0.55)')
        rg.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = rg
        g.beginPath()
        g.arc(0, 0, pr, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
    }
  }

  // tree line: far layer (hazy blue-green) and near layer (rich green), crowns as overlapping dark discs with sunlit tops
  const crowns = (baseDeg: number, hMin: number, hMax: number, step: number, dark: string, mid: string, light: string): void => {
    for (let x = -step; x < w + step; x += step * (0.55 + rnd() * 0.5)) {
      const r = (hMin + rnd() * (hMax - hMin)) * (h / (E1 - E0)) // crown radius in px
      const cy = rowOf(baseDeg) - r * (0.55 + rnd() * 0.5)
      for (const wrap of [-w, 0, w]) {
        const cx = x + wrap
        g.fillStyle = dark
        g.beginPath(); g.ellipse(cx, cy, r * 1.05, r, 0, 0, Math.PI * 2); g.fill()
        g.fillStyle = mid
        g.beginPath(); g.ellipse(cx - r * 0.1, cy - r * 0.18, r * 0.85, r * 0.78, 0, 0, Math.PI * 2); g.fill()
        g.fillStyle = light
        g.beginPath(); g.ellipse(cx - r * 0.28, cy - r * 0.42, r * 0.5, r * 0.36, 0, 0, Math.PI * 2); g.fill()
      }
    }
    // fill below the crowns down to the horizon so no sky shows between trunks
    g.fillStyle = dark
    g.fillRect(0, rowOf(baseDeg) - 2, w, hor - rowOf(baseDeg) + 4)
  }
  crowns(2.0, 1.4, 3.6, 40, '#5f8a62', '#7aa56f', '#9cc487')
  crowns(0.9, 1.0, 2.6, 26, '#2f5e26', '#3f7a2e', '#62a038')

  // trimmed hedge: flat-topped band, mid green with speckled leaf texture and a bright sunlit top edge
  const hedgeTop = rowOf(2.3)
  const hg = g.createLinearGradient(0, hedgeTop, 0, h)
  hg.addColorStop(0, '#5c9a2e'); hg.addColorStop(0.15, '#3e7d26'); hg.addColorStop(1, '#25501d')
  g.fillStyle = hg
  g.beginPath()
  g.moveTo(0, h)
  for (let x = 0; x <= w; x += 4) {
    const u = (x / w) * Math.PI * 2
    g.lineTo(x, hedgeTop + Math.sin(u * 23) * 1.4 + Math.sin(u * 61) * 1.1 + Math.sin(u * 157) * 0.6)
  }
  g.lineTo(w, h)
  g.fill()
  for (let i = 0; i < w * 3; i++) {
    const x = rnd() * w, y = hedgeTop + rnd() * (h - hedgeTop)
    g.fillStyle = rnd() < 0.5 ? 'rgba(120,180,60,0.35)' : 'rgba(20,55,20,0.4)'
    g.fillRect(x, y, 1 + rnd() * 2.5, 1 + rnd() * 2.5)
  }

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function makeBackdrop(cx: number, cz: number, lowRes = false): THREE.Mesh {
  const SEG = 96
  const pos: number[] = [], uv: number[] = [], idx: number[] = []
  for (let k = 0; k <= RINGS; k++) {
    const v = k / RINGS
    const e = E0 + (E1 - E0) * v
    const y = EYE + R * Math.tan((e * Math.PI) / 180)
    for (let j = 0; j <= SEG; j++) {
      const a = (j / SEG) * Math.PI * 2
      pos.push(cx + Math.sin(a) * R, y, cz + Math.cos(a) * R)
      uv.push(j / SEG, v)
    }
  }
  for (let k = 0; k < RINGS; k++) for (let j = 0; j < SEG; j++) {
    const a = k * (SEG + 1) + j, b = a + SEG + 1
    idx.push(a, b, a + 1, a + 1, b, b + 1)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  const mat = new THREE.MeshBasicMaterial({
    map: paint(lowRes ? 2048 : 4096, lowRes ? 512 : 1024),
    side: THREE.DoubleSide,
    fog: false,
    color: new THREE.Color(1.25, 1.25, 1.25), // a little brighter than the room: daylight through the glass
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.name = 'backdrop:panorama'
  mesh.renderOrder = -999
  mesh.frustumCulled = false
  mesh.userData.noShadow = true
  return mesh
}
