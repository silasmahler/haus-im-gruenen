import * as THREE from 'three'

import { build as bad } from './bad-wc-abstell'
import { build as flur } from './flur'
import { build as kindLinks } from './kind-links'
import { build as kindMitte } from './kind-mitte'
import { build as kueche } from './kueche'
import { build as schlafen } from './schlafen'
import { build as wohnen } from './wohnen'

/** All furniture in one group. Each room module is independent (one owner each). */
export function buildFurniture(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'furniture'
  for (const b of [schlafen, kueche, wohnen, kindLinks, kindMitte, flur, bad]) g.add(b())
  return g
}
