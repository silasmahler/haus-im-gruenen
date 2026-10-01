# TOUR-SPEC - Haus im Gruenen 3D tour

Single source of truth for geometry: `src/tour/plan.ts`. Everything else reads from it; nothing else hard-codes room coordinates.

## Conventions
- Metres. `x` = east, `z` = south (plan down), `y` = up. Origin = NW OUTER corner. Front / entrance = south. Ceiling 2.5 m (`WALL_HEIGHT`).
- Outer footprint 12.17 x 10.41 m (from the plan image; not verifiable from photos); inner clear 11.61 x 9.85 m. Exterior walls 0.28 m (`EXT_T`), interior 0.10-0.17 m (see `walls`).
- Source image `tour-refs/grundriss-neu.png` (preview 900x819 px) measured with pixel scans. Scale **70 px = 1 m**, origin px (28,28); rooms/walls re-cut to the labelled areas (see "Areas").
- Wall `a`/`b` are CENTRE lines. `Room.polygon` = wall FACES (virtual lines at open edges), clockwise seen from above.
- Furniture: `x,z` = centre, `y` = base elevation, `w` = local x, `d` = local z, `h` = height. `rotationY` radians (three.js: `obj.rotation.y = rotationY`).
  Local +z is the FRONT: 0 -> faces south, PI/2 -> east, PI -> north, -PI/2 -> west. Beds: local +z = foot end. All rotations are multiples of 90 deg (`footprint()` relies on it).
  Pieces with `onTopOf` stand on another piece (sink, hob, TV, table plants) - skip them for floor collision.
- Camera yaw (`JumpPose.yawDeg`, `__tour.setPose`): compass, 0 = north (-z), 90 = east, 180 = south, 270 = west; forward = (sin yaw, -cos yaw) in (x,z). three.js camera: `rotation.y = -yawRad`, order `'YXZ'`. Pitch > 0 = up. Eye height 1.6 m.
- Openings: `at` is the centre on the wall centre line; `rooms=[A,B]`; doors have `swing {hinge:'a'|'b', toward, openDeg}` ('a' = lower x/z end of the hosting wall). Windows: `sill`, `height`, `width`. Types: `door`, `entrance` (front/east door, 2.05-2.1 m), `window`.
- `passages` = open connections without wall: kitchen <-> hallway (1.3 m, z=4.2), kitchen <-> living room, kitchen <-> side hall, side hall <-> living room, chimney recess <-> living room. Do NOT build a wall or door there; do not fake a ceiling step.
- Floor keys: `oak` (all bedrooms, living, hallways, side hall), `tile-grey` (kitchen only - hard edge to oak at z=4.62 and x=7.9, plus a step at z=4.2 west of the stub wall), `tile-bath` (bad, wc, abstell), `stone-light` (chimney recess). Wall keys: `plaster-white`, `plaster-warm`, `tile-bath`.

## Exports of plan.ts (module contract)
`rooms, walls, openings, passages, furniture, poses, tourOrder, entrance, FOOTPRINT, WALL_HEIGHT, EXT_T, INT_T, DOOR_H, KIND_MITTE_BED_HEAD`, helpers `roomById, roomAt(x,z), polygonArea, pointInPolygon, footprint(f), areaReport(tol?, log?)` (console.warn on >3% mismatch, console.info for rooms with `knownDeviation`), `checkPlan()` (dev/QA: furniture inside room, no floor overlap, door swings clear; currently returns `[]`). Types: `RoomId, Room, Wall, Opening, Passage, Furniture, FurnitureType, JumpPose, Pt, Side`.
Room ids: schlafen, kueche, wohnen, kind-links, kind-mitte, flur-links, flur-rechts, bad, wc, abstell, kamin. Labels: DE Schlafzimmer, Küche, Wohnzimmer, Kinderzimmer 1, Kinderzimmer 2, Diele, Flur, Bad, WC, Abstellraum, Kaminanschluss (EN in `rooms`).

## File ownership
| File | Owner | Notes |
|---|---|---|
| `src/tour/plan.ts`, this file | Spec | others read only; change requests go to Spec |
| `geometry.ts` | Geometry | walls split at openings, floors per room polygon, ceiling, baseboards, frames, collision data |
| `materials.ts`, `textures.ts` | Materials | keys above |
| `furniture/*.ts` | Furniture | one file per room + shared primitives; place from `furniture[]` by `type` |
| `lighting.ts`, postfx | Lighting | |
| `controls.ts`, `TourUI.tsx` | Controls/UI | expose `window.__tour` (`ready, goTo, setPose, setMode, stats, rooms`) |
| `TourCanvas.tsx`, `buildScene.ts`, route, i18n, teaser | Shell | `buildScene.ts` small additive edits allowed by anyone |

## Areas: photos + labels reconstruction (2026-09-30)
The AI-drawn plan image contradicts its own m2 labels (drawn vs label: kitchen +13.6 %, hall +20.5 %, bath -22.6 %, WC +92 %, side hall +175 %, kind-mitte -6.6 %), and the old Airbnb plan (`grundriss-alt-airbnb.png`, low-res screenshot, cropped on the right, no dimensions, same labels, own inconsistent proportions) gives no metres. Priority: photos > old plan > new plan. `plan.ts` therefore keeps the TOPOLOGY of the new plan (room order, doors, windows, furniture incl. both rearrangements) and re-solves the PROPORTIONS so every polygon matches its label (<= 2 %).

| Room | Label m2 | polygonArea() | Dimensions (clear) | Evidence |
|---|---|---|---|---|
| schlafen | 17.50 | 17.50 | 3.335 x 5.247 | Schlafen + Kind-links share the west column: 32.35 m2 / 9.70 m net depth => width 3.335 |
| kind-links | 14.85 | 14.84 | 3.335 x 4.453 | same |
| kueche | 17.04 | 17.04 | 4.115 x 4.14 (rectangle) | label; table 1.6 x 0.9 + chairs fit (photo 19) |
| wohnen | 26.52 | 26.30 (-0.8 %) | 4.09 wide east of kind-mitte + strip east of kitchen | label; kind-mitte east wall 0.10 m and WC south wall 0.12 m (round 3) gave back ~0.3 m2 |
| kind-mitte | 10.85 | 10.85 | 2.60 x 4.17 | label; bed 1.9 crosswise + dresser 0.4 fits |
| flur-links (Diele) | 7.00 | 6.93 (-1.0 %) | ~1.0 m wide strip + wider junction at the kitchen | label (drawn hall 1.26 m is too wide) |
| flur-rechts | 2.00 | 2.00 | 2.44 x 0.82 | label; vestibule of the east door |
| bad | 6.44 | 6.44 | 1.85 x 3.48 | photo 29/30: narrow and long (tub across the far wall under the window, sink on the west wall, WC + 0.8 x 0.8 shower at the door end) |
| wc | 1.23 | 1.23 | 1.40 x 0.88 | photo 32 (floor = 3 x 4 tiles of 30 cm) |
| abstell | 2.48 | 2.48 | 1.40 x 1.77 | label |
| kamin | - | 1.06 | 0.84 x 1.26 | photo 10 suggests ~1.3 x 1.9 - kept smaller: deepening it would take m2 from the Diele/Kind-mitte, which are already at their limit. Deliberate deviation, mention it if the recess is shown as the real fireplace niche (open question) |

`Room.knownDeviation` is no longer used. The bath grew to z 3.76 (south wall face) so the side hall is only 0.82 m deep and the east door moved from z 3.82 to z 4.33; WC/Abstell column sits between x 8.05 and 9.45 with an installation shaft (0.59 m wall) towards the bath. The `flue` furniture piece was removed earlier: geometry.ts builds a black wood stove + round stovepipe with ceiling thimble in the recess (photo 10). `LAYOUT` (exported from plan.ts) exposes the solved edges.

## Rearrangements from `grundriss-neu-mit-pfeilen.png` (applied)
1. Kitchen dining table (1.50 x 0.75, 4 chairs, plant) moved from centre px (445,295) to px (516,165) = (7.07 m, 1.99 m; footprint x 6.32-7.82, z 1.61-2.36): upper-right kitchen area under the north window. Clearances: east wall face 0.26 m from table end, chairs 0.55 m to north wall face, ~2.6 m free to the L-kitchen.
2. Kind-mitte single bed (0.90 x 1.90) rotated 90 deg: now crosswise (east-west) in the north half, headboard at the east wall (`KIND_MITTE_BED_HEAD`).

## Ambiguities / deviations to confirm
- Bed head end (kind-mitte): arrow curls counter-clockwise, which literally puts the head to the WEST (next to the dresser). Implemented head at EAST wall (headboard on a wall). Flip with `KIND_MITTE_BED_HEAD = 'west'`.
- Bed foot end is 0.18 m from the dresser (bed x 5.79-7.69, dresser x 5.21-5.61, same z band 6.4-7.3): no walk-through between them, dresser reachable only from the south. Alternative: shorten the dresser or move it south.
- "Upper-right corner" of the kitchen: arrow head sits mid-right, not in the literal NE corner (north window at x 6.4-7.4 m; Abstell wall on the east). Table placed under the window, not in the corner.
- Door hinge sides and swing directions are inferred from the small arcs in the plan (all swing into the smaller/private room except `d-wc` which swings out into the side hall). `d-kind-mitte` has no drawn arc (thin line) - treated as a normal 0.8 m door swinging into the room (north hinge; leaf stays clear of desk chair and bed). Interior door widths drawn 0.70-0.80 m are normalised to 0.80 m; front door 0.87 m, east door 0.78 m.
- Window sill/height/width now from photos: kitchen 1.2 x 1.2 sill 1.05 (photo 14), Schlafen 1.2 x 1.2 sill 0.9 (photo 20), Kind 1.1-1.2 x 1.25-1.3 sill 0.9, bath window 0.7 x 0.9 sill 1.1 (photo 29), terrace / French doors floor-length 2.1 m. Living-room windows 0.75/1.40 still assumed.
- Layout uncertainty (2026-09-30): overall outer size 12.17 x 10.41 m is from the plan image only; Kamin recess depth (photo 10 ~1.9 m vs 0.84 m here); east door moved to z 4.33 because the long bath fills the drawn side-hall zone; WC door now opens into the living-room strip (no separate side hall).
- Kitchen L: north arm and west arm assumed to meet in the NW corner (plan shows a possible corner gap). Sink and hob are separate top pieces (`sink-unit`, `hob`).
- Photos (`fotos/`) mention things not in the plan: fireplace / stove (photo 10, "am Feuer" - suits `kamin` recess; geometry.ts now builds the stove + flue), coffee bar + dishwasher (kitchen), extendable single bed (24), roller shutters in one bedroom (26), workspace (33). Furniture agent may add pieces via `plan.ts` requests.
- Flur-rechts (side hall) is only the vestibule of the east door (x >= 10.05); the part of the drawn strip west of it is open living room. Wall stub `int-wohnen-stub` starts at x=8.8.

## Module contract (skeleton, written by Shell; all files exist and render at /tour)
Data flow: `plan.ts` -> `geometry.ts` / `furniture/*` -> `buildScene.ts` (assembler) <- `lighting.ts`, `controls.ts`; `TourCanvas.tsx` (client) dynamic-imports `buildScene` (so `three` is only in the async chunk) and hosts `TourUI.tsx`. Route `src/app/tour/page.tsx` just renders `<TourCanvas/>`. Only `import type` from `buildScene` in UI files (keeps three out of the main bundle). No `forceContextLoss` on dispose (React strict mode remounts the same canvas).

| File | Exports (KEEP these signatures) |
|---|---|
| `materials.ts` | `getMaterial(key: string): THREE.Material` (cached, unknown key = magenta), `disposeMaterials()`. Keys: floors `oak tile-grey tile-bath stone-light`; walls `plaster-white plaster-warm tile-bath`; plus `exterior ceiling baseboard frame door glass`; furniture `furn-wood furn-fabric furn-white furn-plant furn-dark furn-ceramic`. Add keys freely (new keys additive). `textures.ts` (Materials agent) is imported by materials.ts only. |
| `geometry.ts` | `buildGeometry(): { group: Group, ceiling: Object3D, colliders: Rect[] }`, `type Rect {x0,z0,x1,z1}`. `group` holds walls (`wall:<id>` meshes, split at openings, per-face material from the room on that side via `roomAt`), floors (`floor:<roomId>`), and the `ceiling` group (child of `group`; controls hide it outside walk mode). N/S exterior walls extend by EXT_T/2 to own the outer corners. Colliders = wall solids + window-sill parts (door lintels excluded). TODO Geometry agent: baseboards, window/door frames + glass + door leaves; reduce draw calls (box with a 6-material array = 6 draws per wall piece: use one material per piece or merge by material). |
| `furniture/index.ts` | `buildFurniture(): Group` (name `furniture`) = groups from `schlafen kueche wohnen kind-links kind-mitte flur bad-wc-abstell`. |
| `furniture/<room>.ts` | `build(): Group`. `flur.ts` covers flur-links, flur-rechts, kamin; `bad-wc-abstell.ts` covers bad, wc, abstell. Skeleton = one coloured box per `furniture[]` entry. Real models: one Group per piece via `pieceGroup(f)` (positioned at `f.x, f.y, f.z`, `rotation.y = f.rotationY`, name `furn:<id>`), local origin = piece centre on the floor, local +z = front, geometry inside the w x d footprint. Never move a piece: change requests to plan.ts go to Spec. |
| `furniture/shared.ts` | `pieceGroup(f)`, `box(w,h,d,matKey,ox?,oy?,oz?)` (bottom-centre origin), `placeholder(f)`, `piecesOf(roomIds)`, `buildPlaceholders(name, roomIds)`. Furniture agents add shared primitives here (coordinate: append only, this file is shared). |
| `lighting.ts` | `setupLighting(scene, renderer): void` (sets `scene.background`, adds lights; may set renderer shadow/tone-mapping fields). Skeleton = hemisphere + ambient + sun, no shadows. |
| `controls.ts` | `createControls(camera, dom, colliders: Rect[], hideInOverview: Object3D[]): TourControls`; `TourControls { mode; update(dt); setMode; setPose(x,z,yawDeg,pitchDeg,eye?); goTo(roomIdOrPoseId,{yaw?,pitch?,eye?}): boolean; getPose(); dispose() }`; `Mode = 'walk'\|'dollhouse'\|'top'`. Collision = circle (r 0.22) vs Rect list, axis-separated sliding. `hideInOverview` objects are visible only in walk mode. |
| `buildScene.ts` | `createTour(canvas): { api: TourApi, dispose() }` (throws if no WebGL; TourCanvas shows the fallback). Colliders = geometry colliders + `footprint()` of floor furniture (no rugs, no `onTopOf`). Start pose = `poses[0]`. Installs `window.__tour`. |
| `TourCanvas.tsx` | default export client component; states loading / ready / error(WebGL). Full-viewport `fixed inset-0`, canvas `touch-none`. |
| `TourUI.tsx` | `TourUI({ api })`: skeleton overlay (back link, mode buttons, room buttons; DE/EN via `useLanguage().locale` inline strings, to be moved to `dictionaries.ts` tour keys). |

`window.__tour` (type `TourApi` in buildScene.ts): `ready` (true after first rendered frame), `rooms` (plan `Room[]`), `goTo(roomOrPoseId, {yaw?,pitch?,eye?})` (defaults to the first pose of that room; falls back to the room centroid), `setPose(x,z,yawDeg,pitchDeg)` (switches to walk), `setMode('walk'|'dollhouse'|'top')`, `getMode()`, `stats() -> {fps, drawCalls, triangles, mode, pose}` (fps is a 0.5 s average of the render loop; in swiftshader it is very low, judge draw calls / triangles instead).
Camera conventions unchanged (see Conventions). Dollhouse = orbit around house centre (drag rotate, wheel zoom, ceiling hidden); top = perspective straight down from y=20.

QA: `node /tmp/tourqa/shoot.mjs --room <id> --yaw <deg> --pitch <deg> --w 1200 --h 750 --out f.png [--mode dollhouse|top] [--mobile] [--pose x,z,yaw,pitch]` (uses installed Chrome via `channel:'chrome'`; the bundled playwright chromium is missing). Prints stats + console errors.
Known skeleton limits: walls sampled by room at the segment midpoint only (a long wall spanning two rooms gets one material per side); no baseboards/frames/door leaves; ceiling looks flat.

## Geometry budget (round 3)
`__tour.shell` = `{ drawCalls, triangles }` of the meshes created by `buildGeometry()` only (walls, trim, glass, floors, ceiling, stove, exterior apron), computed once at build time. `__tour.stats()` includes furniture + lighting, so it is much larger. Wall side faces are cut at every opening edge height and the reveal jambs are emitted only opening-tall (no T-junction hairlines).
