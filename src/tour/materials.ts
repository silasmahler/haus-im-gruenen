/**
 * materials.ts - material registry for the whole tour: `getMaterial(key)` -> cached THREE material.
 *
 * Everything is procedural (see textures.ts), generated lazily on first request, cached by key.
 * Unknown key = magenta (bug marker). Keys are STABLE; new keys are only ever added.
 *
 * UV MAPPING: every textured material maps its textures in WORLD METRES (`worldUV` below), so geometry does not
 * need proper UVs: walls, floors, ceilings and box furniture all get the correct texel density and no stretching.
 * Horizontal faces (floor, ceiling, table tops) use world x/z, vertical faces use (horizontal along the wall, y).
 *
 * NOTE metals (steel, chrome, brass, mirror) need `scene.environment` (lighting) to look metallic; without one
 * they only react to direct lights.
 *
 * KEYS
 *  floors     oak (orange-brown honey wood, UNUSED: not pre-baked, only built when asked for)
 *             walnut (mid red-brown walnut, wild figure, satin; bedroom + living)
 *             hall-brown (mid red-brown, Diele + Flur, photos 10/18)  laminate-brown (Kind-links, photo 24)
 *             beech (honey laminate, Kind-mitte, photos 08/26)
 *             tile-grey (kitchen, 33 cm diagonal, cream-beige, per-tile glaze variation)
 *             tile-bath (grey-beige 30x30 floor; as WALL: glossy white 25x30 tiles with a thin cap strip at 1.5 m,
 *             painted above; the WC (bbox from plan.ts) is tiled floor to ceiling)  stone-light (chimney recess)
 *  walls      plaster-white  plaster-warm  tile-bath  exterior (red-brown brick)
 *  shell      ceiling (white T&G panels)  baseboard  frame (white PVC)  door  door-handle  glass  radiator
 *  furniture  furn-wood furn-fabric furn-white furn-plant furn-dark furn-ceramic   (original set)
 *             wood-dark wood-light wood-birch  fabric-grey fabric-armchair fabric-linen fabric-sage fabric-plum
 *             fabric-cream fabric-bluegrey fabric-floral curtain-sheer  leather-brown sheepskin rug-cream
 *             worktop splash-tile sink-black steel steel-dark metal-black chrome brass mirror screen lampshade
 *             bulb terracotta soil paint-green stone-sill plant-dark
 *             furn-white-grain (satin white-painted timber, photo 27)   tile-trim (cap strip / silicone-white trim)
 *  round 1    black-gloss (clearcoat, wardrobe) white-mdf (lacquered) zebra-fabric (canvas print) curtain-plum lace-net (alpha lace)
 *             garden-backdrop (unlit sky + tree line, see decor.ts). Kitchen backsplash = 'plaster-white' with a world-rect tile strip
 *             (splash cfg), 'splash-tile' = the same grey 20x20 tile for furniture quads. 'hearth-slate' now = 'stone-light' (grey 30x30).
 *  feature    mural-branches (tree/branch photo print, stand-alone, UV 0..1; the Wohnen TV wall gets it automatically through
 *             'plaster-warm', see UvCfg.mural)   stove-glass (dark glass + fire canvas, emissive; needs uv = metres, see key)
 *             hearth-slate (slate / blackened steel plate)
 *
 * BAKE BUDGET: textures are generated lazily on first getMaterial(); buildScene loops materialKeys() one by one with
 * yields, so the work is spread over frames behind the loader. Measured 2026-09-30 (round 4, machine load 60-90, so
 * an upper bound): window.__tourMatMs = 330-440 ms in Chrome for the whole set. Sizes: wood 256x512 (walnut 512x512, laminate-brown
 * 1024x384, beech 512x384), tile 510^2, plaster 256^2, mural 1024x512 (canvas paths only), roughness maps half size.
 */
import * as THREE from 'three'

import { LAYOUT, WALL_HEIGHT, footprint, furniture, roomById } from './plan'

import {
  brickTex, brushedTex, ceilingTex, disposeTextures, fireTex, floralTex, furTex, gardenTex, grainTex, laceTex, muralTex, plasterTex, rugTex,
  terrazzoTex, textureBakeMs, tileTex, voileTex, weaveTex, woodFloorTex, woodMetres, zebraTex, type TexSet, type WoodFloor,
} from './textures'

// ------------------------------------------------------------------ world-space UVs
interface UvCfg {
  /** metres covered by one texture repeat on horizontal faces (x, z) */
  floor: [number, number]
  /** rotation of the pattern on horizontal faces, degrees */
  rot?: number
  /** metres per repeat on vertical faces (along wall, up); default = floor */
  wall?: [number, number]
  /** vertical faces: texture u runs up (wood grain vertical) */
  swap?: boolean
  /** bathroom tiles: vertical faces get their own tint / gloss and are painted above `paintY`; a thin cap strip
   *  (colour `cap`) sits at the tile edge. `full` = wall rectangle [x0,z0,x1,z1] tiled up to the ceiling (WC). */
  dual?: { tint: number; roughMul: number; paintY: number; paint: number; cap: number; full?: [number, number, number, number] }
  /** multiplies the image-based (scene.environment) specular, so glossy tile picks up a visible sky reflection */
  env?: number
  /** printed feature wall: the vertical face at x = `x` (normal +x) between z0..z1 and y 0..y1 shows `tex` stretched over
   *  that rectangle (u along z, v = y / y1) instead of the repeating map. Everything else keeps the normal plaster. */
  mural?: { x: number; z0: number; z1: number; y1: number; tex: THREE.Texture; /** second wall (face line z = `z`, normal +z) between x0..x1 */ wall2?: { z: number; x0: number; x1: number } }
  /** tiled wall strip (kitchen backsplash): vertical faces inside any of `rects` ([x0,z0,x1,z1], world metres, the wall face
   *  line +-4 cm) between y0..y1 show `tex` (1 m per repeat, u = horizontal along the wall) tinted by `tint`. Max 4 rects. */
  splash?: { rects: [number, number, number, number][]; y0: number; y1: number; tint: number; tex: THREE.Texture }
}

function worldUV(m: THREE.MeshStandardMaterial, c: UvCfg): void {
  const wall = c.wall ?? c.floor
  const r = ((c.rot ?? 0) * Math.PI) / 180
  const d = c.dual
  const sp = c.splash
  m.customProgramCacheKey = () => (d ? 'worlduv-dual' : 'worlduv') + (c.env ? '-env' : '') + (c.mural ? '-mural' : '') + (sp ? '-splash' : '')
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWF = { value: new THREE.Vector4(1 / c.floor[0], 1 / c.floor[1], Math.cos(r), Math.sin(r)) }
    sh.uniforms.uWW = { value: new THREE.Vector4(1 / wall[0], 1 / wall[1], c.swap ? 1 : 0, 0) }
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <uv_pars_vertex>',
        '#include <uv_pars_vertex>\nuniform vec4 uWF;\nuniform vec4 uWW;\nvarying float vWY;\nvarying float vWall;\nvarying vec2 vWXZ;\nvarying float vHC;',
      )
      .replace(
        '#include <uv_vertex>',
        `vec4 wp4 = modelMatrix * vec4( position, 1.0 );
        vec3 wn3 = abs( normalize( mat3( modelMatrix ) * normal ) );
        vec2 wuv;
        if ( wn3.y >= max( wn3.x, wn3.z ) ) {
          vec2 p = wp4.xz;
          wuv = vec2( uWF.z * p.x - uWF.w * p.y, uWF.w * p.x + uWF.z * p.y ) * uWF.xy;
          vWall = 0.0;
        } else {
          float hc = wn3.x > wn3.z ? wp4.z : wp4.x;
          wuv = ( uWW.z > 0.5 ? vec2( wp4.y, hc ) : vec2( hc, wp4.y ) ) * uWW.xy;
          vWall = 1.0;
        }
        vWY = wp4.y;
        vWXZ = wp4.xz;
        vHC = wn3.y >= max( wn3.x, wn3.z ) ? 0.0 : ( wn3.x > wn3.z ? wp4.z : wp4.x );
        ` + THREE.ShaderChunk.uv_vertex.replace(/\b[A-Z_]+_UV\b/g, (t) => (t === 'USE_UV' ? t : 'wuv')),
      )
    if (c.env) {
      sh.uniforms.uEnv = { value: c.env }
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uEnv;')
        .replace(
          '#include <lights_fragment_end>',
          '#if defined( RE_IndirectSpecular )\n radiance *= uEnv;\n#endif\n#include <lights_fragment_end>',
        )
    }
    if (c.mural) {
      const mu = c.mural
      sh.uniforms.uMu = { value: new THREE.Vector4(mu.x, mu.z0, mu.z1, mu.y1) }
      sh.uniforms.uMuTex = { value: mu.tex }
      const w2 = mu.wall2
      sh.uniforms.uMu2 = { value: new THREE.Vector4(w2 ? w2.z : 1e9, w2 ? w2.x0 : 0, w2 ? w2.x1 : 1, 0) }
      sh.fragmentShader = sh.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform vec4 uMu;
          uniform vec4 uMu2;
          uniform sampler2D uMuTex;` + (d ? '' : '\nvarying float vWY;\nvarying float vWall;\nvarying vec2 vWXZ;'),
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          float mm1 = step( 0.5, vWall ) * step( abs( vWXZ.x - uMu.x ), 0.03 ) * step( uMu.y, vWXZ.y ) * step( vWXZ.y, uMu.z ) * step( vWY, uMu.w );
          float mm2 = step( 0.5, vWall ) * step( abs( vWXZ.y - uMu2.x ), 0.03 ) * step( uMu2.y, vWXZ.x ) * step( vWXZ.x, uMu2.z ) * step( vWY, uMu.w );
          float mmu = mm2 > 0.5 ? 1.0 - clamp( ( vWXZ.x - uMu2.y ) / ( uMu2.z - uMu2.y ), 0.0, 1.0 ) : clamp( ( vWXZ.y - uMu.y ) / ( uMu.z - uMu.y ), 0.0, 1.0 );
          vec3 mcol = texture2D( uMuTex, vec2( mmu, clamp( vWY / uMu.w, 0.0, 1.0 ) ) ).rgb;
          diffuseColor.rgb = mix( diffuseColor.rgb, mcol, max( mm1, mm2 ) );`,
        )
    }
    if (sp) {
      const r = sp.rects
      const pad = (i: number) => new THREE.Vector4(...(r[i] ?? [0, 0, 0, 0]))
      sh.uniforms.uSp = { value: [pad(0), pad(1), pad(2), pad(3)] }
      sh.uniforms.uSpY = { value: new THREE.Vector3(sp.y0, sp.y1, r.length) }
      sh.uniforms.uSpTint = { value: new THREE.Color(sp.tint) }
      sh.uniforms.uSpMap = { value: sp.tex }
      sh.fragmentShader = sh.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform vec4 uSp[4];
          uniform vec3 uSpY;
          uniform vec3 uSpTint;
          uniform sampler2D uSpMap;
          varying float vHC;` + (d || c.mural ? '' : '\nvarying float vWY;\nvarying float vWall;\nvarying vec2 vWXZ;'),
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          float spm = 0.0;
          for ( int i = 0; i < 4; i ++ ) {
            if ( float( i ) < uSpY.z ) {
              vec4 sr = uSp[ i ];
              spm = max( spm, step( sr.x, vWXZ.x ) * step( vWXZ.x, sr.z ) * step( sr.y, vWXZ.y ) * step( vWXZ.y, sr.w ) );
            }
          }
          spm *= step( 0.5, vWall ) * step( uSpY.x, vWY ) * step( vWY, uSpY.y );
          diffuseColor.rgb = mix( diffuseColor.rgb, texture2D( uSpMap, vec2( vHC, vWY ) ).rgb * uSpTint, spm );`,
        )
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix( roughnessFactor, 0.32, spm );')
        .replace(
          '#include <normal_fragment_maps>',
          THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;', 'mapN.xy *= normalScale * ( 1.0 - spm * 0.85 );'),
        )
    }
    if (!d) return
    const f = d.full ?? [1e9, 1e9, 1e9, 1e9]
    sh.uniforms.uD = { value: new THREE.Vector2(d.roughMul, d.paintY) }
    sh.uniforms.uWallTint = { value: new THREE.Color(d.tint) }
    sh.uniforms.uPaint = { value: new THREE.Color(d.paint) }
    sh.uniforms.uCap = { value: new THREE.Color(d.cap) }
    sh.uniforms.uFull = { value: new THREE.Vector4(f[0], f[1], f[2], f[3]) }
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vWY;
        varying float vWall;
        varying vec2 vWXZ;
        uniform vec2 uD;
        uniform vec3 uWallTint;
        uniform vec3 uPaint;
        uniform vec3 uCap;
        uniform vec4 uFull;`,
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `vec4 diffuseColor = vec4( mix( diffuse, uWallTint, vWall ), opacity );
        // inside the full-height rectangle (WC) the wall is tiled to the ceiling
        float inFull = step( uFull.x - 0.04, vWXZ.x ) * step( vWXZ.x, uFull.z + 0.04 ) * step( uFull.y - 0.04, vWXZ.y ) * step( vWXZ.y, uFull.w + 0.04 );
        float pY = mix( uD.y, 9.0, inFull );
        float pm = step( 0.5, vWall ) * step( pY, vWY );
        float capm = step( 0.5, vWall ) * step( pY - 0.016, vWY ) * step( vWY, pY + 0.006 );
        float capShadow = step( 0.5, vWall ) * step( pY - 0.032, vWY ) * step( vWY, pY - 0.016 );`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        diffuseColor.rgb = mix( diffuseColor.rgb, uPaint, pm );
        diffuseColor.rgb *= 1.0 - 0.05 * capShadow;
        diffuseColor.rgb = mix( diffuseColor.rgb, uCap, capm );`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\n roughnessFactor = mix( roughnessFactor * mix( 1.0, uD.x, vWall ), 0.92, pm );\n roughnessFactor = mix( roughnessFactor, 0.3, capm );',
      )
      .replace(
        '#include <normal_fragment_maps>',
        THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;', 'mapN.xy *= normalScale * ( 1.0 - max( pm, capm ) );'),
      )
  }
}

// ------------------------------------------------------------------ builders
type P = THREE.MeshStandardMaterialParameters

/** textured PBR material with world-space UVs; `tint` multiplies the (usually neutral) colour map */
function pbr(t: TexSet, uv: UvCfg, p: P = {}, normal = 1, sheen = 0): THREE.MeshStandardMaterial {
  const args = { roughness: 1, metalness: 0, ...p, map: t.map, normalMap: t.normal, roughnessMap: t.rough }
  // cloth: MeshPhysicalMaterial sheen = soft velvety rim light on the fibres
  const m = sheen > 0
    ? new THREE.MeshPhysicalMaterial({ ...args, sheen, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffffff) })
    : new THREE.MeshStandardMaterial(args)
  m.normalScale.set(normal, normal)
  worldUV(m, uv)
  return m
}
const flat = (p: P): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0, ...p })
/** brighten an sRGB hex so that (colour x neutral map at ~0.8 luminance) lands near the target */
const boost = (hex: number, k = 1.22): number => {
  const r = Math.min(255, ((hex >> 16) & 255) * k), g = Math.min(255, ((hex >> 8) & 255) * k), b = Math.min(255, (hex & 255) * k)
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)
}

// wood floors (photos 20 / 18+45 / 24 / 26). All bake at 256 x 512 (walnut 512 x 512); joints are texel-sized.
// walnut (photos 09 / 05 / 11, Wohnen): red-brown laminate #6b3a26..#7a4028 with high-contrast tiger-stripe figure, slight gloss (rough ~0.35)
const WALNUT: WoodFloor = {
  seed: 3, rows: 14, boardW: 0.16, segs: 3, plankLen: 0.75, dark: [88, 44, 28], light: [168, 94, 58],
  tone: 0.75, streak: 0.6, figure: 1.5, jitter: 0.55, lenVar: 0.5, desat: 0.04, rough: [0.26, 0.44], size: [512, 512], groove: 0.2,
}
// walnut strips (photos 02 / 20 / 21, Schlafen): narrow 10 cm x 1.2 m strips, deep red-brown with dark tiger streaks, clearcoat-like gloss, light seams
const WALNUT_STRIP: WoodFloor = {
  seed: 17, rows: 10, boardW: 0.1, segs: 2, plankLen: 1.2, dark: [78, 38, 24], light: [164, 92, 56],
  tone: 0.85, streak: 0.6, figure: 1.4, jitter: 0.5, lenVar: 0.45, desat: 0.04, rough: [0.26, 0.42], size: [512, 512], groove: 0.1, joint: 0.6,
}
// hallways (photos 10 / 18): mid red-brown satin wood
const HALL: WoodFloor = { seed: 21, rows: 12, boardW: 0.19, segs: 2, plankLen: 1.2, dark: [82, 50, 38], light: [122, 82, 58], tone: 0.3, streak: 0.4, jitter: 0.5, lenVar: 0.4, desat: 0.08, rough: [0.3, 0.6] }
const OAK: WoodFloor = { seed: 5, rows: 12, boardW: 0.19, segs: 2, plankLen: 1.2, dark: [142, 78, 38], light: [196, 120, 64], tone: 0.5, streak: 0.5, rough: [0.35, 0.65] }
// laminates (photos 24 / 26): even figure, per-plank colour jitter instead of bright blotches, capped so they never bleach
// photo 24: dark, even walnut-brown laminate (#6b4a35 on screen), hairline joints, fine straight grain; 1024 wide so the grain stays sharp
// round 1 fix: desaturated, low stripe contrast, matte (rough 0.6-0.85)
const LAMINATE: WoodFloor = {
  seed: 8, rows: 12, boardW: 0.2, segs: 2, plankLen: 1.2, dark: [100, 78, 64], light: [130, 104, 86], tone: 0.1, streak: 0.06, jitter: 0.2,
  cap: 0.85, groove: 0.15, joint: 0.75, fibre: 0.12, desat: 0.22, lenVar: 0.3, rough: [0.62, 0.85], size: [1024, 384],
}
// photo 26: pale, slightly desaturated beech laminate (#D9A26C), joints almost invisible (joint colour = plank colour - 8 %), fine fibre streaks
const BEECH: WoodFloor = {
  seed: 13, rows: 12, boardW: 0.19, segs: 2, plankLen: 1.2, dark: [180, 136, 96], light: [222, 174, 126], tone: 0.22, streak: 0.1, jitter: 0.6,
  cap: 0.8, groove: 0.16, joint: 0.75, fibre: 0.22, desat: 0.1, rough: [0.45, 0.85], size: [512, 384],
}
const wood = (name: string, o: WoodFloor, normal = 0.8, env = 0) => () => pbr(woodFloorTex(name, o), { floor: woodMetres(o), env: env || undefined }, undefined, normal)

// kitchen backsplash rects (world metres): the wall faces behind both arms of the run, from the plan's furniture footprints
const splashRects = (): [number, number, number, number][] => {
  const w = footprint(furniture.find((f) => f.id === 'kitchen-west')!), n = footprint(furniture.find((f) => f.id === 'kitchen-north')!)
  return [
    [w.x0 - 0.04, w.z0, w.x0 + 0.04, w.z1], // west arm against the spine wall
    [n.x0, n.z0 - 0.04, n.x1, n.z0 + 0.04], // north arm against the north wall (sink window)
  ]
}

/** timber: fibres run along world x on horizontal faces, up on vertical faces; `boards` = planks across 0.25 m;
 *  `scale` = metres per repeat along / across the grain (vary it so two pieces never show the same fibres) */
const grainMat = (hex: number, rough = 1, boards = 0, scale: [number, number] = [1, 0.25]) => () =>
  pbr(grainTex(boards), { floor: scale, swap: true }, { color: boost(hex), roughness: rough }, 0.6)
/** fine cloth: `size` = metres per weave repeat (0.15 = 2 mm threads); boost stays low so greys keep their photo value */
const fabricMat = (hex: number, size = 0.15, normal = 0.45, sheen = 0.25, k = 1.06) => () =>
  pbr(weaveTex(), { floor: [size, size] }, { color: boost(hex, k), roughness: 1 }, normal, sheen)
const metalMat = (hex: number, metalness: number, rough = 1) => () =>
  pbr(brushedTex(), { floor: [0.4, 0.4] }, { color: hex, metalness, roughness: rough }, 0.5)

// WC: tiled floor to ceiling (photos 33 / 35): bounding box of the room polygon, walls of the neighbours stay outside
const wcBox = (): [number, number, number, number] => {
  const p = roomById('wc').polygon
  return [Math.min(...p.map((q) => q.x)), Math.min(...p.map((q) => q.z)), Math.max(...p.map((q) => q.x)), Math.max(...p.map((q) => q.z))]
}

const stoneLight = () => pbr(tileTex('floor'), { floor: [1.5, 1.5] }, { color: 0xc3c5c6, roughness: 0.9 }, 1)

const registry: Record<string, () => THREE.Material> = {
  // ---------------------------------------------------------------- floors
  oak: wood('oak', OAK),
  walnut: wood('walnut', WALNUT, 0.8, 2.2),
  'walnut-strip': wood('walnut-strip', WALNUT_STRIP, 0.8, 2.2),
  'laminate-brown': wood('laminate-brown', LAMINATE, 0.7),
  beech: wood('beech', BEECH, 0.65),
  'hall-brown': wood('hall-brown', HALL),
  // kitchen: cream-beige #D9D2C3 in the photos (04 / 16), light-grey grout; albedo is warm and bright because the
  // interior light is cool and dim, the on-screen result is what has to match the photo
  'tile-grey': () => pbr(tileTex('floor'), { floor: [1.65, 1.65], rot: 45 }, { color: 0xcfcdc8, roughness: 0.9 }, 1.0), // cool light grey (photos 16 / 18 / 19) with darker grout (~#8d8a85), slightly glossy; wider grout = crisp at a distance
  // bath / WC: floor grey-beige #cfc9c0..#d0cdc6, walls glossy white #eeeeea (cooler than the paint above), sky reflection
  'tile-bath': () =>
    pbr(tileTex('bath'), {
      // floor: grey-beige ~27x27 (#c9c5bc) with dark grout; walls: white glossy 20x25 (photos 29 / 30 / 32), pale cap only, mild sky reflection
      floor: [1.35, 1.35], wall: [1.0, 1.25], env: 2.5,
      dual: { tint: 0xffffff, roughMul: 0.55, paintY: 1.5, paint: 0xfffdf8, cap: 0xeceeeb, full: wcBox() },
    }, { color: 0xd3cfc5, roughness: 0.85 }, 0.9),
  // light-grey 30x30 with dark grout (photo 10): chimney recess floor, entrance step, apron; the stove's floor plate uses the same material
  'stone-light': stoneLight,
  'hearth-slate': stoneLight,

  // ---------------------------------------------------------------- walls, shell
  // neutral white paint #f3f2ee in the photos; no emissive fake, exposure belongs to lighting
  'plaster-white': () =>
    pbr(plasterTex(), {
      floor: [1.2, 1.2],
      // kitchen: grey 20x20 tile backsplash between worktop (0.9) and wall cabinets (photos 13 / 14 / 16 / 18); world-rect based, so the
      // other rooms sharing this paint are untouched
      splash: { rects: splashRects(), y0: 0.9, y1: 1.5, tint: 0xb6bcb8, tex: tileTex('splash').map },
    }, { color: 0xf5f3ef }, 0.4), // neutral white; slightly warm: the sky-blue ambient in shade turns it neutral, not blue-grey
  // 'plaster-warm' is the wall key of Wohnen + both children's rooms. World-space rule: the Wohnen west wall face (the TV wall, x = kmeE,
  // z zKmN..south wall, floor to ceiling) shows the branch-photo mural (photos 09 / 11) stretched over that rectangle; nothing else changes.
  'plaster-warm': () =>
    pbr(plasterTex(), {
      floor: [1.2, 1.2],
      // TV wall (x = kmeE) + the north wall behind the armchairs / sideboard (z = zWoS, x 8.8..east wall), photos 05 / 09 / 11
      mural: { x: LAYOUT.kmeE, z0: LAYOUT.zKmN, z1: LAYOUT.IN.z1, y1: WALL_HEIGHT, tex: muralTex().map, wall2: { z: LAYOUT.zWoS, x0: 8.8, x1: LAYOUT.IN.x1 } },
    }, { color: 0xf1efec }, 0.4), // near-white, very slightly cool (photos 05 / 09 / 24: bright white walls; also the bedroom paint, photo 20)
  // the same print as a stand-alone material for custom meshes (UV 0..1 over the mesh, e.g. a PlaneGeometry)
  'mural-branches': () => new THREE.MeshStandardMaterial({ map: muralTex().map, roughness: 0.9, metalness: 0 }),
  exterior: () => pbr(brickTex(), { floor: [1.0, 0.75] }, { color: 0xffffff }, 1),
  ceiling: () => pbr(ceilingTex(), { floor: [0.8, 0.8] }, { color: 0xf5f4f0 }, 0.6),
  baseboard: () => flat({ color: 0xf6f5f1, roughness: 0.42 }),
  frame: () => flat({ color: 0xf6f5f1, roughness: 0.32 }), // white PVC, glossier than the wall paint
  door: () => flat({ color: 0xf1f0ec, roughness: 0.42 }), // satin white paint like the walls; untextured so no shading blotches on the panels
  'door-handle': () => flat({ color: 0xb59a4a, metalness: 0.85, roughness: 0.3 }),
  glass: () =>
    flat({ color: 0xdbe8ee, roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false }),
  radiator: () => flat({ color: 0xf4f4f2, roughness: 0.4 }),

  // ---------------------------------------------------------------- furniture: original keys
  'furn-wood': grainMat(0x907250, 0.9),
  'furn-fabric': fabricMat(0x6f757c), // generic placeholder cloth (neutral grey)
  'furn-white': () => flat({ color: 0xf0efeb, roughness: 0.45 }),
  // satin white-painted timber (photo 27): faint open-pore grain under the paint
  'furn-white-grain': () => pbr(grainTex(0), { floor: [0.7, 0.18], swap: true }, { color: 0xf3f2ee, roughness: 0.5 }, 0.25),
  'tile-trim': () => flat({ color: 0xd9dad6, roughness: 0.3 }),
  'furn-plant': () => flat({ color: 0x4f7a3c, roughness: 0.72 }),
  'furn-dark': () => flat({ color: 0x1c1c1e, roughness: 0.45 }),
  'furn-ceramic': () => flat({ color: 0xf8f8f6, roughness: 0.12 }),

  // ---------------------------------------------------------------- furniture: additions
  'wood-dark': grainMat(0x3a302b, 0.7, 2, [1.3, 0.33]), // rustic dining table + chairs (photo 19), brown not orange
  'wood-light': grainMat(0xd6bd93, 0.9, 0, [0.8, 0.2]), // pine / grill shelves
  'wood-birch': grainMat(0xcfa66c, 0.8, 0, [0.9, 0.22]), // Poang bentwood
  'fabric-grey': fabricMat(0x6c7076, 0.15, 0.55), // tufted sofa (photo 11), mid grey #767A80 once lit
  'fabric-armchair': fabricMat(0x4f5257, 0.14, 0.5, 0.1, 1.04), // dark charcoal-grey armchairs (photos 05 / 09 / 11), ~#55585d once lit
  'fabric-linen': fabricMat(0xf2efe8, 0.16, 0.4, 0.3, 1.0), // duvet / white bed linen
  'fabric-sage': fabricMat(0x8fa88f, 0.16, 0.45, 0.25, 1.08), // bedroom blanket (photo 20)
  'fabric-plum': fabricMat(0x7a1f45, 0.16, 0.45, 0.25, 1.1), // bedroom curtain (photo 20)
  'fabric-cream': fabricMat(0xe8dfc8, 0.16, 0.4, 0.25, 1.05),
  'fabric-bluegrey': fabricMat(0x545d68, 0.15, 0.4), // daybed mattress (photo 24); NOT for the double bed (white duvet 'fabric-linen', sage blanket 'fabric-sage')
  'fabric-floral': () => pbr(floralTex(), { floor: [0.6, 0.6] }, { color: 0xffffff, side: THREE.DoubleSide }, 0.8), // kitchen curtain + cushions
  // net curtain (kind rooms, photos 25 / 27 / 33): lace pattern on an almost clear net, the garden view shows through
  'curtain-sheer': () =>
    pbr(laceTex(), { floor: [0.3, 0.3] }, {
      color: 0xffffff, roughness: 1, transparent: true, side: THREE.DoubleSide, depthWrite: false, emissive: 0xffffff, emissiveIntensity: 0.6,
    }, 0),
  // Wohnen voile (photos 05 / 09 / 12): off-white / light-grey translucent fabric, vertical fold variation in colour + alpha (uv 0..1 of the cloth plane)
  'curtain-voile': () => {
    const [map, alpha] = voileTex()
    return new THREE.MeshStandardMaterial({
      color: 0xffffff, map, alphaMap: alpha, roughness: 1, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      emissive: 0xdfe2e4, emissiveIntensity: 0.28,
    })
  },
  'leather-brown': () => flat({ color: 0x4a3226, roughness: 0.5 }),
  sheepskin: () => pbr(furTex(), { floor: [0.3, 0.3] }, { color: 0xf6f3ec, roughness: 1 }, 1, 0.8),
  'rug-cream': () => pbr(rugTex(), { floor: [0.8, 0.8] }, { color: 0xdad4c7, roughness: 1 }, 0.9, 0.3),
  worktop: () => pbr(terrazzoTex(), { floor: [0.5, 0.5] }, { color: 0xffffff, roughness: 0.9 }, 0.6), // fine low-contrast grey-beige pebble laminate, photos 13 / 16
  'splash-tile': () => pbr(tileTex('splash'), { floor: [1.0, 1.0] }, { color: 0xb6bcb8, roughness: 1 }, 0.9), // grey 20x20 wall tile, light grout
  // round 1 additions: kind-links wardrobe / furniture (photos 21 / 24), bedroom window dressing (photos 20 / 23)
  'black-gloss': () => new THREE.MeshPhysicalMaterial({ color: 0x0e0e10, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),
  'white-mdf': () => new THREE.MeshPhysicalMaterial({ color: 0xf3f2ee, roughness: 0.34, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.2 }),
  'zebra-fabric': () => pbr(zebraTex(), { floor: [0.5, 0.5] }, { color: 0xffffff, roughness: 1 }, 0.4, 0.2),
  // plum curtain: double-sided cloth for pleated meshes
  'curtain-plum': () => {
    const m = pbr(weaveTex(), { floor: [0.15, 0.15] }, { color: boost(0x7a1f45, 1.1), roughness: 1, side: THREE.DoubleSide }, 0.45, 0.25)
    return m
  },
  // lace net / voile: transparent, printed lace pattern, lit from behind by the window (emissive lift), 0.3 m per repeat
  'lace-net': () =>
    pbr(laceTex(), { floor: [0.3, 0.3] }, {
      color: 0xffffff, roughness: 1, transparent: true, side: THREE.DoubleSide, depthWrite: false, emissive: 0xffffff, emissiveIntensity: 0.9, // overexposed against the window glare
    }, 0),
  // garden backdrop for the bedroom windows (sky gradient + tree line + hedge), unlit; hidden from bird's-eye cameras (dollhouse / plan)
  'garden-backdrop': () => {
    const m = new THREE.MeshBasicMaterial({ map: gardenTex().map, color: new THREE.Color(1.5, 1.5, 1.5), fog: false })
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'void main() {\n if ( cameraPosition.y > 2.6 ) discard;')
    }
    m.customProgramCacheKey = () => 'garden-backdrop'
    return m
  },
  'sink-black': () => flat({ color: 0x1e1e20, roughness: 0.35 }),
  steel: metalMat(0xc4c6c8, 0.8, 1), // fridge / hood / kettle
  'steel-dark': () => flat({ color: 0x1a1a1c, roughness: 0.25, metalness: 0.35 }), // glossy black fridge, oven glass front (no brushed streaks)
  'metal-black': () => flat({ color: 0x232325, metalness: 0.7, roughness: 0.45 }),
  chrome: () => flat({ color: 0xe6e8ea, metalness: 1, roughness: 0.1 }),
  brass: () => flat({ color: 0xb59a4a, metalness: 0.9, roughness: 0.3 }),
  mirror: () => flat({ color: 0xdfe4e6, metalness: 1, roughness: 0.03 }),
  screen: () => flat({ color: 0x0b0b0d, roughness: 0.12 }),
  lampshade: () =>
    flat({ color: 0xf3e7c9, roughness: 0.9, emissive: 0xf3dcae, emissiveIntensity: 0.35, side: THREE.DoubleSide }),
  bulb: () => flat({ color: 0xfff0d0, roughness: 0.3, emissive: 0xffd9a0, emissiveIntensity: 1.2 }),
  terracotta: () => flat({ color: 0xb5643c, roughness: 0.85 }),
  soil: () => flat({ color: 0x3a2a1e, roughness: 1 }),
  'paint-green': () => flat({ color: 0x1f6a2a, roughness: 0.55 }), // green wardrobes (photo 21)
  'stone-sill': () => pbr(plasterTex(), { floor: [1.2, 1.2] }, { color: 0xb9b3a8, roughness: 1 }, 1.2),
  'plant-dark': () => flat({ color: 0x2f5a2e, roughness: 0.7 }),

  // ---------------------------------------------------------------- wood stove (photo 10)
  // dark sooty glass; the fire texture is both colour and emissive map (glow only where there is fire).
  // The texture spans the door glass quad (0.27 x 0.27 m, centre z = middle of the recess, y 0.3..0.57): repeat / offset map the
  // geometry's metre UVs (u = z, v = y) onto 0..1.
  'stove-glass': () => {
    const t = fireTex().map
    const b = roomById('kamin').polygon
    const sz = (Math.min(...b.map((q) => q.z)) + Math.max(...b.map((q) => q.z))) / 2
    t.repeat.set(1 / 0.27, 1 / 0.27)
    t.offset.set(-(sz - 0.135) / 0.27, -0.3 / 0.27)
    return new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.9, roughness: 0.12, metalness: 0 })
  },
}

// ------------------------------------------------------------------ public API
const cache = new Map<string, THREE.Material>()

/** cached material for a registry key; unknown key = magenta */
export function getMaterial(key: string): THREE.Material {
  let m = cache.get(key)
  if (!m) {
    const build = registry[key]
    m = build ? build() : new THREE.MeshStandardMaterial({ color: 0xff00ff })
    m.name = key
    cache.set(key, m)
    if (typeof window !== 'undefined') (window as unknown as { __tourMatMs?: number }).__tourMatMs = textureBakeMs() // QA
  }
  return m
}

/** keys the loader pre-bakes; `oak` is unused by the plan and stays lazy (saves ~50 ms of bake) */
export const materialKeys = (): string[] => Object.keys(registry).filter((k) => k !== 'oak')

export function disposeMaterials(): void {
  cache.forEach((m) => m.dispose())
  cache.clear()
  disposeTextures()
}
