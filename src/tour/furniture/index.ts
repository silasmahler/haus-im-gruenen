import * as THREE from 'three'

import { build as bad } from './bad-wc-abstell'
import { build as flur } from './flur'
import { build as kindLinks } from './kind-links'
import { build as kindMitte } from './kind-mitte'
import { build as kueche } from './kueche'
import { build as schlafen } from './schlafen'
import { build as wohnen } from './wohnen'

export interface FurnitureGroupStats { drawCalls: number; triangles: number }
/** per room group + total; also put on window.__furnStats for QA (exposed via __tour.stats().furniture when buildScene forwards it) */
export const furnitureStats: Record<string, FurnitureGroupStats> = {}

/** All furniture in one group. Each room module is independent (one owner each). */
export function buildFurniture(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'furniture'
  let dc = 0, tr = 0
  for (const k of Object.keys(furnitureStats)) delete furnitureStats[k]
  for (const b of [schlafen, kueche, wohnen, kindLinks, kindMitte, flur, bad]) {
    const r = b()
    let d = 0, t = 0
    r.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      d++
      t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3
    })
    furnitureStats[r.name.replace('furniture:', '')] = { drawCalls: d, triangles: Math.round(t) }
    dc += d; tr += t
    g.add(r)
  }
  furnitureStats.total = { drawCalls: dc, triangles: Math.round(tr) }
  ;(window as unknown as { __furnStats?: unknown }).__furnStats = furnitureStats
  return g
}
