/**
 * postfx.ts - optional post-processing chain (MSAA render -> GTAO ambient occlusion -> bloom -> ACES/sRGB output).
 * Loaded lazily by lighting.ts (dynamic import) so the first frame does not wait for it.
 * The composer only exists on quality levels 0/1; lighting.ts falls back to a plain renderer.render() otherwise.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export interface Post {
  render(dt: number): void
  setSize(w: number, h: number): void
  /** level 0 = AO + bloom, level 1 = bloom only */
  setLevel(level: number): void
  setAO(radius: number, intensity: number): void
  dispose(): void
}

/** aoDecals: the fake-AO meshes; they are hidden while GTAO renders its normal/depth pass (a fixed list, no scene traversal per frame). */
export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, w: number, h: number, aoDecals: THREE.Object3D[]): Post {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 2 })
  const composer = new EffectComposer(renderer, rt)
  composer.setPixelRatio(renderer.getPixelRatio())
  composer.setSize(w, h)

  const renderPass = new RenderPass(scene, camera)
  const gtao = new GTAOPass(scene, camera, w, h)
  gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.3, thickness: 1.6, scale: 1.3, samples: 4, distanceFallOff: 1, screenSpaceRadius: false })
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 6 })
  gtao.blendIntensity = 1
  // fake-AO decal meshes and glass must not enter the AO G-buffer (they would be treated as opaque geometry)
  const baseOverride = gtao.overrideVisibility.bind(gtao)
  gtao.overrideVisibility = () => {
    baseOverride()
    for (const o of aoDecals) o.visible = false
  }
  // strength, radius, threshold: only the brightest things (window sky, sun patches) glow. Linear HDR values, so 1.0 catches only the >1 sky and sun patches.
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.14, 0.7, 1.6)
  const out = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(gtao)
  composer.addPass(bloom)
  composer.addPass(out)

  return {
    render: (dt) => composer.render(dt),
    setSize: (nw, nh) => { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(nw, nh) },
    setLevel: (level) => {
      gtao.enabled = level < 1
      bloom.enabled = level < 2
      // MSAA: 4x with GTAO (its blend shows stair-steps on thin geometry otherwise), 2x on the cheap bloom-only tier
      const samples = level < 1 ? 4 : 2
      for (const t of [composer.renderTarget1, composer.renderTarget2]) if (t.samples !== samples) { t.samples = samples; t.dispose() }
    },
    setAO: (radius, intensity) => { gtao.updateGtaoMaterial({ radius }); gtao.blendIntensity = intensity },
    dispose: () => { composer.dispose(); gtao.dispose(); bloom.dispose(); out.dispose(); rt.dispose() },
  }
}
