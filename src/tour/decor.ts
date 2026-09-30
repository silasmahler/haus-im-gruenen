/**
 * decor.ts - garden backdrop (sky gradient + tree line + hedge, material 'garden-backdrop') 5.5 m outside the north and west walls:
 * it hides the low-poly hedge blobs behind the bedroom windows. Two quads, no shadows. Hidden from bird's-eye cameras (material).
 * The bedroom curtains + lace net live in furniture/schlafen.ts (materials 'lace-net' / 'curtain-plum' are available for them).
 */
import * as THREE from 'three'

import { getMaterial } from './materials'
import { FOOTPRINT } from './plan'

export function buildDecor(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'decor'
  // ---- garden backdrop, 5.5 m outside the north and west walls (the bedroom windows look that way); hidden from bird's-eye cameras
  const back = getMaterial('garden-backdrop')
  const bd = (name: string, x: number, z: number, ry: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(22, 8.25), back)
    m.name = `decor:${name}`
    m.position.set(x, 8.25 / 2 - 0.05, z)
    m.rotation.y = ry
    m.userData.noShadow = true
    m.castShadow = false
    m.receiveShadow = false
    m.frustumCulled = false
    group.add(m)
  }
  bd('backdrop-n', FOOTPRINT.x1 / 2 - 2, -5.5, 0)
  bd('backdrop-w', -5.5, FOOTPRINT.z1 / 2 + 1, Math.PI / 2)
  bd('backdrop-s', FOOTPRINT.x1 / 2, FOOTPRINT.z1 + 5.5, Math.PI) // south windows (Wohnen, both children's rooms)

  return group
}
