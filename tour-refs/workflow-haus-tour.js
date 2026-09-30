export const meta = {
  name: 'haus-3d-tour',
  description: 'Build the Haus im Gruenen Three.js walkthrough: spec, 6 domain build/critic loops, blind integration gauntlet, final report',
  phases: [
    { title: 'Spec', detail: 'plan data, skeleton, QA harness, deviation check' },
    { title: 'Build', detail: '6 domain tracks, each builder -> independent critic loop' },
    { title: 'Gauntlet', detail: 'blind photo/plan/tech critics, fix, repeat until all pass' },
    { title: 'Report', detail: 'final build, per-room screenshots, open questions' },
  ],
}

const REPO = '/Users/silasmahler/Directory42/github/kreinn/haus-im-gruenen'
const PORT = 3111
const CTX = `
PROJECT: 3D walkable tour ("Matterport-level" real-estate walkthrough) of the holiday home "Haus im Gruenen" (real Airbnb) in Three.js. Repo: ${REPO} (Next.js 15, output:'export', Tailwind, DE/EN via src/i18n). Everything must stay statically exportable. three@0.170 + @types/three are already installed.
HARD RULES: do NOT git commit, push, deploy, or run npm run deploy. Do not touch package.json deps except adding pure-JS packages you truly need (state it). No broad pkill; port 3000 belongs to another project. The dev server for this job is ALREADY running at http://localhost:${PORT} (next dev -p ${PORT}); do not start another, do not kill it. If it died, restart with: cd ${REPO} && nohup npx next dev -p ${PORT} > /tmp/tourqa/dev.log 2>&1 &
REFERENCES: floor plans in ${REPO}/tour-refs/ (grundriss-neu.png = authoritative layout + m2; grundriss-neu-mit-pfeilen.png = requested rearrangements as green arrows; grundriss-alt-airbnb.png = old state). 46 real Airbnb photos + captions.json in ${REPO}/tour-refs/fotos/. IMPORTANT: the Read tool is blocked for large files, so ALWAYS view images via the small copies in /tmp/tourqa/ref/ (same names: 01.jpg..46.jpg, grundriss-neu.jpg, grundriss-neu-mit-pfeilen.jpg, grundriss-alt-airbnb.jpg) using the Read tool. Photo captions: ${REPO}/tour-refs/fotos/captions.json (mojibake encoding, latin1-read UTF-8). Also ${REPO}/10-grundriss-saubere-grafik.svg is an older cleaned-up trace (areas slightly off; the PNG wins).
Rooms (m2): Schlafen 17.50, Kueche 17.04, Wohnen 26.52, Kind-links 14.85, Kind-mitte 10.85, Flur-links(Diele) 7.00, Flur-rechts 2.00, Bad 6.44, WC 1.23, Abstell 2.48, Kaminanschluss niche. Bungalow, ceiling ~2.5 m, entrance at bottom (arrow). Front = bottom of plan = south. Coordinates: metres, x east, z south (plan down), y up, plan origin at NW outer corner.
CODE LAYOUT (all under ${REPO}/src/tour/ unless stated): plan.ts (single source of truth: rooms, walls, openings, windows, door swings, furniture placements, room ids/labels DE+EN, jump-marker poses), geometry.ts (walls w/ openings, floor/ceiling, baseboards, window/door frames, collision data), materials.ts + textures.ts (procedural PBR canvas textures, no big image files), furniture/*.ts (one file per room + shared primitives), lighting.ts (+postfx), controls.ts + TourUI.tsx (navigation and overlay UI), TourCanvas.tsx (client component, dynamic-imports three, loader, WebGL fallback), buildScene.ts (thin assembler, anyone may make SMALL additive edits: re-read right before editing), route src/app/tour/page.tsx, i18n in src/i18n/dictionaries.ts (DE+EN, tour keys only), homepage teaser in src/app/page.tsx. Other agents are editing other files in the same repo AT THE SAME TIME: only edit files you own (see your task), re-read a shared file right before editing it, and never revert or reformat others' work. A compile error that comes from someone else's file is transient: wait ~30 s and retry, don't fix it unless it persists >3 min and is trivial.
QA HARNESS: ${'/tmp/tourqa'} has playwright, lighthouse installed (node_modules). The scene exposes window.__tour (created by the Spec agent): __tour.ready (bool), __tour.goTo(roomId, {yaw,pitch,eye?}), __tour.setPose(x,z,yawDeg,pitchDeg), __tour.setMode('walk'|'dollhouse'|'top'), __tour.stats() (fps, draw calls, triangles), __tour.rooms. Screenshot script: node /tmp/tourqa/shoot.mjs --room <id> --yaw <deg> --pitch <deg> --w 1440 --h 900 --out <file.png> [--mode dollhouse|top] [--mobile] (also --pose x,z,yaw,pitch). Use headless chromium via the playwright in /tmp/tourqa (with --use-gl=swiftshader / angle flags as needed so WebGL works). View resulting PNGs with the Read tool ONLY if they are small enough; if Read is blocked by a size hook, downscale first with: sips -Z 900 -s format jpeg -s formatOptions 55 in.png --out /tmp/tourqa/view/<name>.jpg (keep jpgs small; if still blocked, lower size/quality). Put your screenshots in /tmp/tourqa/shots/<your-track>/ .
QUALITY BAR: hochwertiger Immobilien-Rundgang: photoreal PBR look, soft light, correct proportions, no z-fighting, no floating furniture, no furniture clipping through walls, no flat lighting, no plastic look; 60 fps on an average laptop; usable on phone; no console errors; loading budget ~5 s on mobile network (procedural geometry/textures, lazy-load three via dynamic import, small chunks).
Write plain, boring, working TypeScript. Do not write summaries longer than asked.`

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    score: { type: 'number', description: '0-10, 10 = indistinguishable from real house / flawless' },
    verdict: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { enum: ['blocker', 'major', 'minor'] },
          domain: { enum: ['geometry', 'materials', 'furniture', 'lighting', 'navigation', 'web'] },
          room: { type: 'string' },
          description: { type: 'string' },
          fix_hint: { type: 'string' },
        },
        required: ['severity', 'domain', 'description', 'fix_hint'],
      },
    },
    evidence: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'score', 'verdict', 'issues'],
}

// ---------------- Phase 1: Spec ----------------
phase('Spec')
const SPEC_RULES = `
STALL WARNING: a previous single mega-agent stalled after 40 min without writing any file. You must WRITE OUTPUT FILES EARLY (first draft within your first ~15 tool calls), then refine. Keep every tool call short, never think for minutes without acting, view at most ~6 images per step. Existing scratch crops from that run are in /tmp/tourqa/{plan,mine,sheets,sh2}/ (may help, may be junk).`

// 1) photo notes in 4 parallel batches
const BATCHES = [['01','12'],['13','24'],['25','35'],['36','46']]
await parallel(BATCHES.map(([from,to]) => () => agent(`${CTX}
${SPEC_RULES}
TASK: view Airbnb photos ${from}..${to} (/tmp/tourqa/ref/NN.jpg, captions in captions.json) and write ${REPO}/tour-refs/notes/photos-${from}-${to}.md. Per photo: which room/view, camera position/direction relative to the floor plan, floor/wall/ceiling materials+colours (give approximate hex), furniture (style, colour, dimensions), windows/doors visible, light mood, decor items. End with a "3D scene must copy" bullet list per room. Be concrete and short.`, {label:`photos ${from}-${to}`, phase:'Spec', effort:'medium'})))

// 2) plan data
const specPlan = await agent(`${CTX}
${SPEC_RULES}
TASK: create ${REPO}/src/tour/plan.ts and ${REPO}/tour-refs/TOUR-SPEC.md. View grundriss-neu.jpg (and the -mit-pfeilen one). Measure pixel coordinates of every wall, door, window, furniture piece (a python/PIL scan script or crops are fine; the plan image is ~900x820 px in /tmp/tourqa/ref, full-res original in tour-refs/*.png), then fit a metric scale so that the room polygons' areas match the labelled m2 (Schlafen 17.50, Kueche 17.04, Wohnen 26.52, Kind-links 14.85, Kind-mitte 10.85, Flur-links 7.00, Flur-rechts 2.00, Bad 6.44, WC 1.23, Abstell 2.48). Note the kitchen is open to Wohnen/Flur (no wall) and Kueche/Wohnen differ in floor material (grey tile vs wood). plan.ts exports typed data: rooms (id, DE/EN label, polygon, area, floor material key), walls (segments with thickness), openings (doors with swing, windows with sill/height/width, the open passages), furniture placements (id, type, room, x,z, rotationY, w,d,h), jump poses, plus an areaReport() helper that console.warns for mismatch >3%. Room ids: schlafen, kueche, wohnen, kind-links, kind-mitte, flur-links, flur-rechts, bad, wc, abstell, kamin. Apply the two rearrangements from the arrow image (kitchen dining table -> upper-right kitchen corner; 10.85 m2 child-room bed rotated 90 degrees, crosswise instead of lengthwise at right wall) and RETURN any ambiguity/deviations (head end, clearance, door collisions). TOUR-SPEC.md: conventions, module contract, file ownership, measured-vs-labelled areas table.`, {
  label:'plan.ts', phase:'Spec', effort:'high',
  schema:{type:'object',properties:{areas:{type:'string'},deviations:{type:'array',items:{type:'string'}}},required:['areas','deviations']},
})

// 3) skeleton (after plan)
const skel = await agent(`${CTX}
${SPEC_RULES}
TASK: using ${REPO}/src/tour/plan.ts and tour-refs/TOUR-SPEC.md (already written), create the working ugly-but-correct SKELETON so six specialists can work on disjoint files: src/tour/geometry.ts (extruded walls with openings, floors, ceiling), materials.ts (placeholder MeshStandardMaterials in a name registry), furniture/{index,schlafen,kueche,wohnen,kind-links,kind-mitte,flur,bad-wc-abstell,shared}.ts (each exports build(): THREE.Group with placeholder boxes at plan positions), lighting.ts (sun + hemisphere), controls.ts (WASD + mouse look), TourUI.tsx (minimal), TourCanvas.tsx (client, dynamic import of three), buildScene.ts, src/app/tour/page.tsx, and window.__tour = {ready, goTo(roomId,{yaw,pitch}), setPose(x,z,yawDeg,pitchDeg), setMode('walk'|'dollhouse'|'top'), stats(), rooms}. http://localhost:${PORT}/tour must render the placeholder house (dev server is running; check with curl and a screenshot). Append the final module contract to TOUR-SPEC.md.`, {label:'skeleton', phase:'Spec', effort:'high'})

// 4) QA harness
const harness = await agent(`${CTX}
${SPEC_RULES}
TASK: build /tmp/tourqa/shoot.mjs per the QA HARNESS description (args --room --yaw --pitch --w --h --out --mode --mobile --pose; headless chromium from /tmp/tourqa's playwright with WebGL working via swiftshader/angle flags; wait for __tour.ready; print console errors/warnings), plus /tmp/tourqa/README.txt. Prove it by shooting kueche, wohnen and a dollhouse at 1440x900 and one mobile 390x844 shot, and make sure resulting jpg downscaled views are viewable with Read (see sips advice). If the /tour page is not yet rendering, wait/retry up to 10 min (the skeleton agent is building it).`, {
  label:'qa-harness', phase:'Spec', effort:'medium',
  schema:{type:'object',properties:{works:{type:'boolean'},notes:{type:'string'}},required:['works']},
})
const spec = { deviations: specPlan?.deviations || [], areas: specPlan?.areas, harnessWorks: harness?.works, routeRenders: !!skel }
log(`Spec done. harness=${spec.harnessWorks}; deviations: ${spec.deviations.length}`)

// ---------------- Phase 2: domain tracks ----------------
const TRACKS = [
  {
    key: 'geometry', domain: 'geometry',
    owns: 'src/tour/plan.ts (geometry parts), src/tour/geometry.ts',
    task: `Perfect the floor-plan extrusion: exact wall thicknesses and positions, openings at the spots in the authoritative plan, window reveals with sills/lintels/frames, door frames + door leaves (open/closed as in plan, swings), baseboards, ceiling with subtle details, kitchen/hall opening, fireplace niche (Kaminanschluss with chimney flue connection visible on wall/ceiling), room areas within ~1-2% of labels, proper UVs for texturing (world-scale UVs, 1 unit = 1 m), watertight, no z-fighting/coplanar faces, low triangle count (merge geometries, instancing), and export clean collision data (wall AABBs/segments + door gaps) for the navigation agent via a documented function in geometry.ts. Window glass as transparent pane + frame; outside view plane/garden ground reachable through windows (coordinate with lighting: outside just needs a believable green garden/sky backdrop through windows; you own the ground plane and simple exterior backdrop in geometry.ts).`,
    look: 'walls, openings, window/door positions and proportions in every room, overlay against the floor plan, z-fighting, gaps at corners',
  },
  {
    key: 'materials', domain: 'materials',
    owns: 'src/tour/materials.ts, src/tour/textures.ts',
    task: `Photoreal procedural PBR materials, generated at runtime on canvas (no big image files; keep textures <= 1024 px, use mipmaps, anisotropy, colour space correct): the exact floor materials of the real house per room as seen in the photos (light wood/parquet plank pattern with grain, tiles with grout in the kitchen/bath, etc.), wall paint with subtle roughness/bump variation, ceiling, baseboards, window frames, doors, fabrics (sofa, bed linen), wood furniture, metals, ceramic, glass. Provide normal/roughness maps generated procedurally. Export a documented materials registry (name -> MeshStandardMaterial) that furniture/geometry/lighting use; keep names stable and add new ones without renaming existing ones. Match colours/tones to the Airbnb photos precisely (sample by eye). Lazy/fast: total texture generation < 400 ms on a laptop.`,
    look: 'close-up floors, walls, fabrics, wood, tile: do they read as real materials vs plastic/flat colour; tiling repetition; colour match to photos',
  },
  {
    key: 'furniture', domain: 'furniture',
    owns: 'src/tour/furniture/*',
    task: `Model every piece of furniture and equipment per room as in the NEW plan incl. the two rearrangements (dining table in upper-right kitchen corner with chairs; 10.85 m2 child-room bed rotated 90 degrees crosswise). Build detailed procedural models with rounded edges (RoundedBox / lathe / extrude), correct real-world dimensions (bed 140x200, sofa ~2.1x0.9, table 0.9x1.6 etc.), sitting exactly on the floor (y=0) with no clipping into walls, and at least 0.6 m walking clearance where the plan implies it. Kitchen: L-shaped kitchen run along the top/left wall with hob, sink, dishwasher, coffee bar, upper cabinets like the photos; Bathroom: bathtub, basin+mirror, washer/cabinets; WC; Abstell shelving; Wohnen: sofa, two armchairs, coffee table, rug, TV unit + TV, sideboard, plants, fireplace connection; bedrooms: beds with bedding/pillows, night stands, wardrobes, desk+chair+lamp; hall: coat rack/shoes. Share primitives via furniture/shared.ts. Use materials from materials.ts by name (create a local fallback if a name is missing; do not edit materials.ts). Merge geometries / instance where possible (target < 150k triangles for all furniture), enable castShadow/receiveShadow flags sensibly. Match the real photos: styles, colours, decor items (pillows, books, lamps, plants).`,
    look: 'each room from 3+ angles: proportions, floating/clipping, believable detail vs primitive boxes, match to photos, the two rearrangements',
  },
  {
    key: 'lighting', domain: 'lighting',
    owns: 'src/tour/lighting.ts, src/tour/postfx.ts (create if needed)',
    task: `Soft, believable interior daylight: a sun directional light with soft PCF/VSM shadows fitted tightly to the house, sky/env lighting (procedural gradient sky or a PMREM-filtered generated environment, no HDR file download), light entering through the actual windows (RectAreaLight or window-fitted fill lights; light shafts optional), baked-looking ambient occlusion (SSAO/GTAO via postprocessing if it stays >= 60 fps, else fake contact-shadow/AO via vertex colours/blob decals in corners and under furniture), ACES Filmic tone mapping with sensible exposure, sRGB output, subtle bloom on windows, warm interior fill, night-less bright airy mood like the photos. Provide quality tiers (auto-detect: low on mobile/low fps -> cheaper shadows, no SSAO) and a dynamic resolution/quality fallback keyed off measured fps. Expose lighting via documented functions (setupLighting(scene, renderer, camera), render loop hook for postfx). Make sure dollhouse/top mode (roof/ceiling hidden) still gets nice lighting. No blown-out windows, no black corners, no flat look.`,
    look: 'shadow softness, ambient occlusion in corners, daylight direction/consistency across rooms, exposure/tone, window brightness, flatness vs depth, fps',
  },
  {
    key: 'navigation', domain: 'navigation',
    owns: 'src/tour/controls.ts, src/tour/TourUI.tsx, (and the window.__tour API in buildScene/controls)',
    task: `Navigation and overlay UI: Ego perspective (eye height 1.6 m, FOV ~70-75), WASD + arrow keys + mouse look (pointer lock with click-drag fallback), shift = faster, smooth acceleration/damping, head-bob OFF by default; touch controls on phones (virtual joystick left, look-drag right, 44px+ targets, no page scroll interference); collision against wall segments using the geometry collision data with sliding along walls and door gaps as passages (capsule/circle radius ~0.25 m), also do not walk through furniture footprints from plan.ts; room jump markers/chips (Schlafen, Kueche, Wohnen, Kinderzimmer 1/2, Flur, Bad, WC, Abstell) with smooth camera transitions (no teleport through walls: quick fade or eased path), a minimap of the floor plan with current position + view cone and clickable rooms, mode switch Walk / Dollhouse (orbit, roof+ceilings hidden or cut-away, damped OrbitControls-like own implementation or three/examples OrbitControls) / Top view; ESC/help overlay; a full keyboard-accessible alternative (all buttons focusable with labels, arrow-key room-to-room stepping, aria-live announcements of the current room, aria-labels on canvas with a text description); all UI strings via useLanguage() and the dictionaries (tour.* keys in src/i18n/dictionaries.ts DE+EN: add ONLY your ui keys under a tour.ui subtree and re-read the file before editing). Touch + mouse + keyboard must all work. Keep the animation loop allocation-free.`,
    look: 'walk into walls/furniture, sliding, door passages, jump markers land in the right spot with sensible view direction, dollhouse/top correctness, minimap accuracy, UI at 1440 and 390 px, keyboard-only operation, touch layout',
  },
  {
    key: 'web', domain: 'web',
    owns: 'src/app/tour/page.tsx, src/tour/TourCanvas.tsx, src/app/page.tsx (teaser only), src/i18n/dictionaries.ts (tour.page/teaser keys only), next.config.ts',
    task: `Web integration and performance: /tour route (DE/EN via existing LanguageContext, LanguageSwitcher, page metadata/title, back link to home), teaser card/link on the homepage (src/app/page.tsx) in the site's existing visual style with DE+EN copy in dictionaries.ts (tour.page / tour.teaser subtree; re-read the dictionaries file right before editing since the navigation agent adds tour.ui keys), TourCanvas as client component that lazy-loads three + the scene (next/dynamic or dynamic import, ssr:false), real progress bar based on build steps (geometry, textures, furniture, lighting), timed to hit ~5 s on Fast 4G/slow phone (verify with Chrome DevTools emulation / Lighthouse mobile; report bundle sizes of the /tour chunk), graceful WebGL-missing fallback with a message and static floor plan image (copy a web-optimised floor plan into public/tour/ e.g. grundriss.webp/png <= 150 KB, alt text), prefers-reduced-motion support, cleanup on unmount (dispose geometries/materials/renderer, remove listeners), devicePixelRatio cap, resize handling, pause rendering when tab hidden. Ensure 'npm run build' (static export) is green: run it in a COPY? No: run it directly but NOTE it clobbers .next used by the running dev server; therefore run the build as: cd ${REPO} && rm -rf /tmp/tourqa/buildcopy && rsync -a --exclude .next --exclude out --exclude node_modules ./ /tmp/tourqa/buildcopy/ && ln -s ${REPO}/node_modules /tmp/tourqa/buildcopy/node_modules && cd /tmp/tourqa/buildcopy && npm run build. Also make sure ESLint (npm run lint) passes for tour files and TypeScript is clean (npx tsc --noEmit). Lighthouse (from /tmp/tourqa) for /tour on the static build served locally (npx serve out or python http.server from the buildcopy/out dir on a free port) must have Performance/Accessibility/Best-Practices without red values: fix landmarks, contrast, lang attr, labels, image alts, tap targets, the canvas needing a role/label plus keyboard alternative.`,
    look: 'page load, loading bar, fallback with WebGL disabled, DE/EN switching, homepage teaser, mobile layout 390 px, console errors, build output, Lighthouse scores',
  },
]

const MAX_ROUNDS = 4
const trackResults = await parallel(TRACKS.map(t => async () => {
  let feedback = ''
  let last = null
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    await agent(`${CTX}

TRACK: ${t.key.toUpperCase()} (round ${round}/${MAX_ROUNDS}). You are the BUILDER. Read ${REPO}/tour-refs/TOUR-SPEC.md, the notes in ${REPO}/tour-refs/notes/ and the existing src/tour code first.
FILES YOU OWN: ${t.owns}
TASK: ${t.task}
${round > 1 ? `\nA SEPARATE hard critic reviewed your last round and REJECTED it. Fix EVERY issue below (blockers and majors first, then minors), then re-verify with your own screenshots:\n${feedback}\n` : ''}
Verify your work visually with the QA harness before you finish (screenshots of the relevant rooms/angles at desktop 1440 and mobile 390 where relevant) and fix what you see. Return a 3-line summary of what you changed and anything you could not resolve.`, {
      label: `${t.key}:build r${round}`, phase: 'Build', effort: 'high',
    })
    last = await agent(`${CTX}

You are the CRITIC for the ${t.key.toUpperCase()} track, a DIFFERENT agent from the builder. You never edit source files; you only inspect and judge. Be brutal: assume the builder is flattering itself. Default to pass=false unless you truly could not find defects.
Inspect with the QA harness (fresh screenshots, several angles per room, desktop 1440x900 AND mobile 390x844), plus the reference plan (/tmp/tourqa/ref/grundriss-neu.jpg) and the real Airbnb photos (/tmp/tourqa/ref/NN.jpg). Read ${REPO}/tour-refs/TOUR-SPEC.md and tour-refs/notes/*.md for the contract.
Focus: ${t.look}. Track task the builder was given: ${t.task}
Also check console errors (harness prints them) and frame rate via __tour.stats(). List concrete, reproducible issues (room, angle, what is wrong, how to fix). Score 0-10 for THIS track only. pass=true only if score >= 8.5 and no blocker/major issues in your domain. Screenshots you take: save under /tmp/tourqa/shots/${t.key}-critic/ and list paths in evidence.`, {
      label: `${t.key}:critic r${round}`, phase: 'Build', schema: CRITIC_SCHEMA, effort: 'high',
    })
    if (!last) { feedback = 'critic failed to return; re-verify everything yourself'; continue }
    log(`${t.key} r${round}: score ${last.score} pass=${last.pass} issues=${(last.issues || []).length}`)
    if (last.pass) break
    feedback = (last.issues || []).map((i, n) => `${n + 1}. [${i.severity}] ${i.room || ''} ${i.description} -> ${i.fix_hint}`).join('\n')
  }
  return { key: t.key, last }
}))
log('Build tracks: ' + trackResults.filter(Boolean).map(r => `${r.key}=${r.last?.score}/${r.last?.pass}`).join(', '))

// ---------------- Phase 3: integration gauntlet ----------------
phase('Gauntlet')
const PHOTO_GROUPS = [
  { key: 'wohnen', rooms: 'Wohnen incl. sofa/armchairs/rug/TV/fireplace niche/Flur rechts', hint: 'photos of living room, fireplace, TV' },
  { key: 'kueche', rooms: 'Kueche incl. kitchen run, coffee bar, dishwasher, dining table in the upper-right corner', hint: 'kitchen/dining photos' },
  { key: 'schlafen', rooms: 'Schlafen (master bedroom, dark rollers) and Flur-links', hint: 'master bedroom and hall photos' },
  { key: 'kinder', rooms: 'both child rooms (Kind-links 14.85, Kind-mitte 10.85 with the rotated bed)', hint: 'children rooms, single bed, desk, travel cot photos' },
  { key: 'nass', rooms: 'Bad (tub, basin, mirror, makeup light), WC, Abstell', hint: 'bathroom photos' },
]
const critiquePanel = () => parallel([
  ...PHOTO_GROUPS.map(g => () => agent(`${CTX}

BLIND FIDELITY CRITIC (${g.key}). You are a fresh, hostile reviewer who did not build anything and never edits source. Task: judge if the 3D render shows CREDIBLY THE SAME HOUSE as the real Airbnb photos, for: ${g.rooms}.
Method: FIRST look at the real photos in /tmp/tourqa/ref/ (find the ones for these rooms: ${g.hint}; check captions.json). THEN render the equivalent views (matching camera position/height ~1.6 m, FOV, viewing direction) with the QA harness, desktop 1440x900, plus 2 extra angles and one mobile 390x844 shot. Compare side by side like a buyer would: layout, proportions, materials (floor/wall/tile), colour temperature, furniture style and placement (remember the two intended rearrangements: kitchen table in upper-right corner; 10.85 m2 child bed rotated 90 degrees crosswise), window views, light mood, level of detail, plastic look, z-fighting, floating or wall-clipping furniture, flat lighting, deviations from grundriss-neu.jpg. pass=true only if you would honestly say a guest could not tell surprises apart and score >= 9. Otherwise list precise issues with domain and fix hint. Save your screenshots under /tmp/tourqa/shots/gauntlet-${g.key}/ and list paths in evidence.`, {
    label: `photo:${g.key}`, phase: 'Gauntlet', schema: CRITIC_SCHEMA, effort: 'high',
  })),
  () => agent(`${CTX}

FLOOR-PLAN OVERLAY CRITIC. Fresh reviewer, never edits source. For EVERY room (schlafen, kueche, wohnen, kind-links, kind-mitte, flur-links, flur-rechts, bad, wc, abstell, kamin niche) produce a top-view screenshot (harness --mode top, orthographic if available) and compare/overlay with /tmp/tourqa/ref/grundriss-neu.jpg (e.g. build an HTML page or use sharp/canvas in /tmp/tourqa to alpha-blend the plan image over the render, aligned by outer-wall corners; save overlays in /tmp/tourqa/shots/overlay/). Verify: room positions, wall alignment, door and window positions/widths, door swing, furniture positions incl. the two rearrangements, computed areas vs labelled m2 (read plan.ts area table / compute yourself), room proportions. Report deviations >5 cm-equivalent visible mismatches as issues. pass=true only if every room matches and score >= 9.`, {
    label: 'plan-overlay', phase: 'Gauntlet', schema: CRITIC_SCHEMA, effort: 'high',
  }),
  () => agent(`${CTX}

TECHNICAL CRITIC. Fresh reviewer, never edits source. Measure and judge: (1) console errors/warnings on /tour in DE and EN, desktop and mobile emulation, WebGL-disabled fallback; (2) fps via __tour.stats() while walking a scripted path through all rooms (swiftshader is slow: judge relative cost, draw calls, triangles, shader/postfx cost, texture memory; report a realistic estimate for an average laptop and a mid phone); (3) load time under Fast 4G emulation (playwright CDP network throttling) and /tour JS bundle sizes; (4) collision: script walking into every wall, into furniture, through every door gap; verify no clipping outside the house and no getting stuck; (5) keyboard-only operation and touch controls at 390 px (screenshots); (6) Lighthouse (mobile + desktop) on the STATIC export of /tour (build via the copy method: rsync to /tmp/tourqa/buildcopy, npm run build there, serve out/ on a free port) — Performance, Accessibility, Best Practices must have no red values (>= 90) and SEO not red; (7) npm run build green, npx tsc --noEmit and npm run lint clean; (8) homepage teaser present in DE/EN, dictionaries complete for both locales. pass=true only if all are satisfied.`, {
    label: 'technical', phase: 'Gauntlet', schema: CRITIC_SCHEMA, effort: 'high',
  }),
])

const MAX_GAUNTLET = 5
let panel = []
for (let round = 1; round <= MAX_GAUNTLET; round++) {
  panel = (await critiquePanel()).filter(Boolean)
  const failing = panel.filter(p => !p.pass)
  log(`Gauntlet r${round}: ${panel.length - failing.length}/${panel.length} pass; scores ${panel.map(p => p.score).join(',')}`)
  if (!failing.length && panel.length) break
  if (round === MAX_GAUNTLET) break
  const byDomain = {}
  for (const p of failing) for (const i of (p.issues || [])) (byDomain[i.domain] ||= []).push(i)
  await parallel(Object.entries(byDomain).map(([domain, issues]) => () => {
    const t = TRACKS.find(x => x.domain === domain) || TRACKS[0]
    return agent(`${CTX}

TRACK: ${t.key.toUpperCase()} — GAUNTLET FIX ROUND ${round}. You are a fixer (not a critic). Blind reviewers comparing renders with the real Airbnb photos and the floor plan rejected the scene. Fix ALL of the issues assigned to your domain below, in the files you own: ${t.owns}. (If an issue really lives in another domain's file, make the smallest necessary fix there and say so; re-read before editing.) Re-verify with screenshots.
ISSUES:
${issues.map((i, n) => `${n + 1}. [${i.severity}] ${i.room || ''} ${i.description} -> ${i.fix_hint}`).join('\n')}
Return a 3-line summary.`, { label: `${domain}:fix g${round}`, phase: 'Gauntlet', effort: 'high' })
  }))
}
const allPass = panel.length > 0 && panel.every(p => p.pass)

// ---------------- Phase 4: report ----------------
phase('Report')
const report = await agent(`${CTX}

FINAL REPORT AGENT. State: gauntlet ${allPass ? 'PASSED' : 'DID NOT fully pass'}. Last panel verdicts: ${JSON.stringify(panel.map(p => ({ score: p.score, pass: p.pass, verdict: p.verdict, open: (p.issues || []).filter(i => i.severity !== 'minor').map(i => i.description) })))}
Do: (1) run the final static build via the copy method (rsync to /tmp/tourqa/buildcopy, npm run build) plus tsc and lint; report results honestly. (2) produce one desktop 1440 and one mobile 390 screenshot per room (schlafen, kueche, wohnen, kind-links, kind-mitte, flur-links, flur-rechts, bad, wc, abstell) plus dollhouse and top views, saved to ${REPO}/tour-refs/report/ (jpg, <= 250 KB each, do NOT put them in public/ or src/), and write ${REPO}/tour-refs/report/REPORT.md in German: what was built, how to run (npm run dev -> /tour), room-by-room table with screenshot links, measured areas vs labelled, the deviations/ambiguities found in the two rearrangements (input: ${JSON.stringify(spec?.deviations || [])}), performance/Lighthouse numbers, remaining open questions and known weaknesses. (3) confirm git status shows NO commit was made (git log unchanged) and that nothing was pushed. Return the REPORT.md path and a <=10 line German summary incl. open questions.`, { label: 'report', phase: 'Report', effort: 'high' })

return { spec, tracks: trackResults.filter(Boolean).map(r => ({ key: r.key, score: r.last?.score, pass: r.last?.pass })), gauntlet: panel.map(p => ({ score: p.score, pass: p.pass, verdict: p.verdict })), allPass, report }
