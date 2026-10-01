/**
 * plan.ts - single source of truth for the "Haus im Gruenen" tour.
 *
 * Coordinates: metres. x = east, z = south (plan down), y = up. Origin = NW OUTER corner of the house.
 * Front (entrance) = south. Ceiling 2.5 m.
 * Source: tour-refs/grundriss-neu.png (900x819 preview px, measured), scale 69 px/m, see tour-refs/TOUR-SPEC.md.
 * Angles: rotationY in RADIANS (three.js compatible, obj.rotation.y = rotationY). A piece's local +z is its FRONT,
 *   rotationY 0 -> front faces south (+z), PI/2 -> east (+x), PI -> north (-z), -PI/2 -> west (-x).
 *   Local x = width (w), local z = depth (d). Beds: local +z = FOOT end (head at local -z).
 * yawDeg (camera): compass, 0 = looking north (-z), 90 = east, 180 = south, 270 = west. forward = (sin yaw, -cos yaw) in (x,z).
 *   three.js: camera.rotation.y = -yawRad (order 'YXZ'). pitchDeg > 0 looks up.
 */

// ---------------------------------------------------------------- units
const PX_PER_M = 70; // scale of the plan image; 70 makes labelled net areas + walls fill the drawn outline (see TOUR-SPEC.md)
const r3 = (v: number) => Math.round(v * 1000) / 1000;
/** image px length -> metres (length) */
const len = (px: number) => r3(px / PX_PER_M);
const rad = (deg: number) => (deg * Math.PI) / 180;

export const WALL_HEIGHT = 2.5;
export const EXT_T = 0.28; // exterior wall thickness as drawn (24 cm brick + render)
export const INT_T = 0.16; // standard interior wall thickness
export const DOOR_H = 2.05;

// ---------------------------------------------------------------- types
export type RoomId =
  | 'schlafen' | 'kueche' | 'wohnen' | 'kind-links' | 'kind-mitte' | 'flur-links'
  | 'flur-rechts' | 'bad' | 'wc' | 'abstell' | 'kamin';
export type FloorMaterial = 'oak' | 'walnut' | 'walnut-strip' | 'laminate-brown' | 'beech' | 'hall-brown' | 'tile-grey' | 'tile-bath' | 'stone-light';
export type WallMaterial = 'plaster-white' | 'plaster-warm' | 'tile-bath';
export interface Pt { x: number; z: number }
export interface Room {
  id: RoomId;
  de: string;
  en: string;
  polygon: Pt[]; // clockwise seen from above, wall FACES / virtual boundaries for open edges
  area: number | null; // labelled m2 from the plan (null = not labelled)
  floor: FloorMaterial;
  wall: WallMaterial;
  knownDeviation?: string; // drawn geometry disagrees with the label, see TOUR-SPEC.md
}
export interface Wall {
  id: string;
  a: Pt; // centre line
  b: Pt;
  t: number; // thickness
  kind: 'exterior' | 'interior';
}
export type Side = 'n' | 'e' | 's' | 'w';
export interface Opening {
  id: string;
  type: 'door' | 'window' | 'entrance';
  wall: string; // Wall.id that hosts it
  at: Pt; // centre of the opening on the wall centre line
  width: number;
  sill: number; // height of bottom edge above floor (0 for doors)
  height: number;
  rooms: [RoomId | 'outside', RoomId | 'outside']; // [room A side, room B side]
  /** doors only: hinge jamb ('a' = lower x/z end of the wall axis, 'b' = higher) and side toward which the leaf opens */
  swing?: { hinge: 'a' | 'b'; toward: Side; openDeg: number };
}
/** Open connection without wall/door (virtual boundary between two rooms). */
export interface Passage { id: string; a: RoomId; b: RoomId; from: Pt; to: Pt }
export type FurnitureType =
  | 'bed-double' | 'bed-single' | 'nightstand' | 'wardrobe' | 'dresser' | 'desk' | 'chair' | 'plant' | 'plant-small'
  | 'kitchen-run' | 'sink-unit' | 'hob' | 'dining-table' | 'dining-chair' | 'sideboard' | 'rug' | 'sofa'
  | 'armchair' | 'coffee-table' | 'tv-unit' | 'tv' | 'bathtub' | 'washbasin' | 'toilet' | 'flue'
  | 'fridge' | 'coffee-bar' | 'bench' | 'shower' | 'shelf' | 'boiler' | 'console' | 'cot';
export interface Furniture {
  id: string;
  type: FurnitureType;
  room: RoomId;
  x: number; // centre
  z: number;
  y: number; // base elevation above floor (0 unless standing on another piece)
  rotationY: number; // radians, see header
  w: number; // local x
  d: number; // local z
  h: number;
  onTopOf?: string; // furniture id it stands on (excluded from floor collision)
  note?: string;
}
export interface JumpPose {
  id: string;
  room: RoomId;
  x: number;
  z: number;
  yawDeg: number;
  pitchDeg: number;
  eye: number;
  de: string;
  en: string;
}

// ---------------------------------------------------------------- footprint
export const FOOTPRINT = { x0: 0, z0: 0, x1: r3(len(852)), z1: r3(len(728.5)) }; // outer faces of the exterior walls

// ---------------------------------------------------------------- layout (metres)
/*
 * PHOTO + LABEL RECONSTRUCTION (2026-09-30). The AI-drawn floor plan (grundriss-neu.png) contradicts its own m2 labels, so the
 * walls are no longer traced from the drawing. Topology (order of rooms, doors, windows, furniture incl. the two rearrangements)
 * is the drawing's; the proportions are solved so every polygon matches its label (<= 2 %) and agree with the Airbnb photos:
 *   - Bad is narrow and long, ~1.85 x 3.48 m (photo 29: tub across the far wall under the window, sink on one long wall, WC + corner
 *     shower 0.8 x 0.8 on the other), not the drawn 1.8 x 2.6 -> its south wall moves to z 3.92 and the side hall shrinks to a
 *     0.82 m deep vestibule of the east door (label 2.00 m2).
 *   - WC is ~0.9-1.4 x 1.4 (photo 32: floor = 3 x 4 tiles of 30 cm), not the drawn 1.8 x 1.2.
 *   - West column (Schlafen 17.50 + Kind 14.85) share one width: 3.335 m; depths 5.247 / 4.453 m.
 *   - Diele ~1.0 m wide (label 7.00), Kind-mitte 2.70 x 4.02 m (label 10.85), kitchen 4.02 x 4.14 m (label 17.04).
 * Every Room.polygon sits on wall FACES (or on a virtual line between open rooms); see TOUR-SPEC.md for the area table.
 */
const IN = { x0: EXT_T, z0: EXT_T, x1: FOOTPRINT.x1 - EXT_T, z1: FOOTPRINT.z1 - EXT_T }; // inner clear box
const T = { spine: 0.17, sch: 0.15, kmW: 0.15, kmN: 0.16, kmE: 0.10, abW: 0.15, shaft: 0.59, bathS: 0.16, abWc: 0.15, wcS: 0.12 };

// west column
const xsW = 3.615, xsE = xsW + T.spine; // spine wall faces
const zsN = 5.527, zsS = zsN + T.sch; // Schlafen south face / Kind-links north face
// kitchen | hall
const xkE = 7.9; // kitchen east edge (west face of the storage-room wall)
const STUB = { x0: 5.11, x1: 6.62, c: 4.477, t: 0.114 }; // wall between kitchen and chimney recess
const zK = STUB.c - STUB.t / 2; // north face of the stub = bottom of the kitchen (and of the hall passage)
const ZH = zK; // virtual kitchen | hallway boundary
const zStubS = STUB.c + STUB.t / 2;
const KAMIN_W = { c: 5.71, t: 0.143 };
const kaminW = KAMIN_W.c - KAMIN_W.t / 2, kaminE = KAMIN_W.c + KAMIN_W.t / 2;
const xkmW = 4.81, xkmE = xkmW + T.kmW; // hall east face / kind-mitte west face
const zKmN = 5.794, zKmS = zKmN + T.kmN; // north face of kind-mitte's north wall / kind-mitte north face
const kmeW = 7.56, kmeE = kmeW + T.kmE; // kind-mitte east face / east wall east face (TV wall)
// east block
const abwE = xkE + T.abW; // east face of the storage room west wall
const xcE = 9.45; // east edge of storage room / WC (west face of the installation shaft)
const xbW = 10.04; // west edge of the bath (east face of the shaft)
const zAbS = 2.051; // south edge of storage room
const zWcN = zAbS + T.abWc; // north edge of the WC
const ZB = 3.759; // south edge of the bath (north face of the bath south wall)
const zWcS = zWcN + 0.88 + T.wcS; // south face of the WC south wall
const zBathS = ZB + T.bathS; // south face of the bath south wall = north edge of the side hall
const WO = { c: 4.803, t: 0.126, x0: 8.85 }; // stub wall north of the living room
const zWoN = WO.c - WO.t / 2, zWoS = WO.c + WO.t / 2;
const xFl = 9.45; // west edge of the side hall (vestibule of the east door)
const LAB = { schlafen: 17.5, kindLinks: 14.85, kueche: 17.04, hall: 7.0, kindMitte: 10.85, flurR: 2.0, bad: 6.44, wc: 1.23, abstell: 2.48 };
/** Layout numbers other modules may need (metres). */
export const LAYOUT = { IN, xsW, xsE, zsN, zsS, xkE, xkmW, xkmE, zKmS, zKmN, xbW, xcE, zAbS, zWcN, zWcS, xFl, zK, kaminE, kmeW, kmeE, zWoN, zWoS, zBathS };

// ---------------------------------------------------------------- rooms
const poly = (...pts: [number, number][]): Pt[] => pts.map(([x, z]) => ({ x, z }));

export const rooms: Room[] = [
  { id: 'schlafen', de: 'Schlafzimmer', en: 'Bedroom', area: LAB.schlafen, floor: 'walnut-strip', wall: 'plaster-warm',
    polygon: poly([IN.x0, IN.z0], [xsW, IN.z0], [xsW, zsN], [IN.x0, zsN]) },
  { id: 'kueche', de: 'Küche', en: 'Kitchen', area: LAB.kueche, floor: 'tile-grey', wall: 'plaster-white',
    polygon: poly([xsE, IN.z0], [xkE, IN.z0], [xkE, zK], [xsE, zK]) },
  { id: 'wohnen', de: 'Wohnzimmer', en: 'Living room', area: 26.52, floor: 'walnut', wall: 'plaster-warm',
    polygon: poly([STUB.x1, zK], [xkE, zK], [xkE, zWcS], [xFl, zWcS], [xFl, zWoN], [WO.x0, zWoN], [WO.x0, zWoS], [IN.x1, zWoS],
      [IN.x1, IN.z1], [kmeE, IN.z1], [kmeE, zKmN], [STUB.x1, zKmN]) },
  { id: 'kind-links', de: 'Kinderzimmer 1', en: "Children's room 1", area: LAB.kindLinks, floor: 'laminate-brown', wall: 'plaster-warm',
    polygon: poly([IN.x0, zsS], [xsW, zsS], [xsW, IN.z1], [IN.x0, IN.z1]) },
  { id: 'kind-mitte', de: 'Kinderzimmer 2', en: "Children's room 2", area: LAB.kindMitte, floor: 'beech', wall: 'plaster-warm',
    polygon: poly([xkmE, zKmS], [kmeW, zKmS], [kmeW, IN.z1], [xkmE, IN.z1]) },
  { id: 'flur-links', de: 'Diele', en: 'Hallway', area: LAB.hall, floor: 'hall-brown', wall: 'plaster-white',
    polygon: poly([xsE, ZH], [STUB.x0, ZH], [STUB.x0, zStubS], [kaminW, zStubS], [kaminW, zKmN], [xkmW, zKmN], [xkmW, IN.z1], [xsE, IN.z1]) },
  { id: 'flur-rechts', de: 'Flur', en: 'Side hall', area: LAB.flurR, floor: 'hall-brown', wall: 'plaster-white',
    polygon: poly([xFl, zBathS], [IN.x1, zBathS], [IN.x1, zWoN], [xFl, zWoN]) },
  { id: 'bad', de: 'Bad', en: 'Bathroom', area: LAB.bad, floor: 'tile-bath', wall: 'tile-bath',
    polygon: poly([xbW, IN.z0], [IN.x1, IN.z0], [IN.x1, ZB], [xbW, ZB]) },
  { id: 'wc', de: 'WC', en: 'Toilet', area: LAB.wc, floor: 'tile-bath', wall: 'tile-bath',
    polygon: poly([abwE, zWcN], [xcE, zWcN], [xcE, zWcN + 0.88], [abwE, zWcN + 0.88]) },
  { id: 'abstell', de: 'Abstellraum', en: 'Storage room', area: LAB.abstell, floor: 'tile-bath', wall: 'plaster-white',
    polygon: poly([abwE, IN.z0], [xcE, IN.z0], [xcE, zAbS], [abwE, zAbS]) },
  { id: 'kamin', de: 'Kaminanschluss', en: 'Chimney recess', area: null, floor: 'stone-light', wall: 'plaster-white',
    polygon: poly([kaminE, zStubS], [STUB.x1, zStubS], [STUB.x1, zKmN], [kaminE, zKmN]) },
];

// ---------------------------------------------------------------- walls (centre lines)
const cw = EXT_T / 2;
const X1c = FOOTPRINT.x1 - cw, Z1c = FOOTPRINT.z1 - cw;
const VW = (id: string, kind: Wall['kind'], x: number, za: number, zb: number, t: number): Wall => ({ id, kind, a: { x, z: za }, b: { x, z: zb }, t });
const HW = (id: string, kind: Wall['kind'], z: number, xa: number, xb: number, t: number): Wall => ({ id, kind, a: { x: xa, z }, b: { x: xb, z }, t });
const xSpine = xsW + T.spine / 2, zSchC = zsN + T.sch / 2, xKmW = xkmW + T.kmW / 2, zKmC = zKmS - T.kmN / 2;
const xAbW = xkE + T.abW / 2, xShaft = (xcE + xbW) / 2, zAbWc = zAbS + T.abWc / 2, zWcSC = zWcS - T.wcS / 2, zBathSC = ZB + T.bathS / 2;

// Order matters for corners: the earlier wall owns an L corner (see geometry.ts extents()).
export const walls: Wall[] = [
  HW('ext-n', 'exterior', cw, cw, X1c, EXT_T),
  HW('ext-s', 'exterior', Z1c, cw, X1c, EXT_T),
  VW('ext-w', 'exterior', cw, cw, Z1c, EXT_T),
  VW('ext-e', 'exterior', X1c, cw, Z1c, EXT_T),
  VW('int-spine', 'interior', xSpine, cw, Z1c, T.spine), // Schlafen/Kueche | Diele | Kind-links
  HW('int-schlafen-s', 'interior', zSchC, cw, xSpine, T.sch),
  HW('int-flur-stub', 'interior', STUB.c, STUB.x0, STUB.x1, STUB.t),
  VW('int-kamin-w', 'interior', KAMIN_W.c, STUB.c, zKmC, KAMIN_W.t),
  HW('int-kmitte-n', 'interior', zKmC, xKmW, kmeW + T.kmE / 2, T.kmN),
  VW('int-kmitte-w', 'interior', xKmW, zKmC, Z1c, T.kmW),
  VW('int-kmitte-e', 'interior', kmeW + T.kmE / 2, zKmC, Z1c, T.kmE),
  HW('int-bad-s', 'interior', zBathSC, xShaft, X1c, T.bathS), // before the shaft: owns the corner
  HW('int-wc-s', 'interior', zWcSC, xAbW, xShaft, T.wcS),
  VW('int-abstell-w', 'interior', xAbW, cw, zWcSC, T.abW),
  VW('int-wc-bad', 'interior', xShaft, cw, zBathSC, xbW - xcE), // installation shaft between storage/WC and the bath
  HW('int-abstell-wc', 'interior', zAbWc, xAbW, xShaft, T.abWc),
  HW('int-wohnen-stub', 'interior', WO.c, WO.x0, X1c, WO.t),
];

// ---------------------------------------------------------------- openings
const DOOR_W = 0.8;
/** Point on the centre line of wall `id` at along-coordinate `s` (x for horizontal walls, z for vertical ones). */
const onWall = (id: string, s: number): Pt => {
  const w = walls.find((q) => q.id === id)!;
  return w.a.z === w.b.z ? { x: s, z: w.a.z } : { x: w.a.x, z: s };
};
const door = (id: string, wall: string, s: number, width: number | null, rooms: Opening['rooms'],
  swing: Opening['swing']): Opening =>
  ({ id, type: 'door', wall, at: onWall(wall, s), width: width ?? DOOR_W, sill: 0, height: DOOR_H, rooms, swing });
const win = (id: string, wall: string, s: number, w: number, sill: number, h: number, room: RoomId): Opening =>
  ({ id, type: 'window', wall, at: onWall(wall, s), width: w, sill, height: h, rooms: [room, 'outside'] });

const xHallC = r3((xsE + xkmW) / 2); // centre line of the 1.0 m hall (front door)
const zFlurC = r3((zBathS + zWoN) / 2); // centre of the side-hall vestibule (east door)

/*
 * Door table. Leaf 2.01 x 0.86 m (photo 08) => interior doors 0.80-0.86 in the tour; drawn 0.70 doors are widened to 0.80 where the
 * room allows. d-front 0.87 (2.10 high), d-east 0.78. d-schlafen + d-kind-links: leaf on the SOUTH jamb, opening west (as drawn).
 * d-kind-mitte: the plan shows only a glazed strip without leaf; a leaf hinged on the north jamb is kept deliberately.
 * Photo-derived: w-wohnen-e (French door in the east wall), w-bad-n (small frosted bath window 0.70 x 0.90, sill 1.10, photo 29),
 * w-schlafen-w drawn as a floor-length terrace door (photos 20, 28). Window sills / heights from photos 14 (kitchen 1.2 x 1.2,
 * sill 1.05), 20 (Schlafen 1.2 x 1.2, sill 0.9), 27 (Kind 0.9 x 1.1), 33 (Kind 1.3 x 1.3), 46 (French window 2.1 high).
 */
export const openings: Opening[] = [
  // doors
  { ...door('d-front', 'ext-s', xHallC, 0.87, ['flur-links', 'outside'], { hinge: 'a', toward: 'n', openDeg: 90 }), type: 'entrance', height: 2.1 },
  { ...door('d-east', 'ext-e', zFlurC, 0.78, ['flur-rechts', 'outside'], { hinge: 'b', toward: 'w', openDeg: 90 }), type: 'entrance' },
  door('d-schlafen', 'int-spine', 4.53, 0.8, ['schlafen', 'flur-links'], { hinge: 'b', toward: 'w', openDeg: 90 }),
  door('d-kind-links', 'int-spine', 8.19, 0.8, ['kind-links', 'flur-links'], { hinge: 'b', toward: 'w', openDeg: 90 }),
  door('d-kind-mitte', 'int-kmitte-w', 8.7, 0.8, ['kind-mitte', 'flur-links'], { hinge: 'a', toward: 'e', openDeg: 90 }),
  door('d-abstell', 'int-abstell-w', 1.05, 0.7, ['abstell', 'kueche'], { hinge: 'a', toward: 'e', openDeg: 90 }),
  door('d-wc', 'int-wc-s', 8.62, 0.66, ['wc', 'wohnen'], { hinge: 'a', toward: 's', openDeg: 90 }),
  door('d-bad', 'int-bad-s', 10.45, 0.66, ['bad', 'flur-rechts'], { hinge: 'b', toward: 'n', openDeg: 90 }),
  // windows
  win('w-schlafen-n', 'ext-n', 1.99, 1.2, 0.9, 1.2, 'schlafen'), // photo 20: 1.2 x 1.2, sill 0.9
  // terrace door with the burgundy curtain (photo 20); the drawing shows a window here, the photos a floor-length glass door
  win('w-schlafen-w', 'ext-w', 4.11, 0.95, 0, 2.1, 'schlafen'),
  win('w-kueche-n2', 'ext-n', 4.91, 1.2, 1.05, 1.2, 'kueche'), // over the sink (photo 14: 1.2 x 1.2, sill 1.05)
  win('w-kueche-n', 'ext-n', 6.85, 1.2, 1.05, 1.2, 'kueche'), // over the dining table / fridge (photo 19)
  win('w-kind-links-w', 'ext-w', 7.5, 1.1, 0.9, 1.25, 'kind-links'),
  win('w-kind-links-s', 'ext-s', 2.3, 1.1, 0.9, 1.25, 'kind-links'),
  win('w-kind-mitte-s', 'ext-s', 6.3, 1.2, 0.9, 1.3, 'kind-mitte'), // photo 25: ~1.2 x 1.3, deep sill
  win('w-wohnen-s1', 'ext-s', 9.0, 1.1, 0.75, 1.4, 'wohnen'),
  win('w-wohnen-s2', 'ext-s', 10.39, 1.1, 0.75, 1.4, 'wohnen'),
  // French / patio door in the garden (east) wall next to the sofa, grey tile threshold (photos 05, 09, 12); sill 0 = full-height glass
  win('w-wohnen-e', 'ext-e', 6.05, 1.2, 0, 2.1, 'wohnen'),
  // small frosted bath window above the tub, north wall (photo 29); lighting.ts/dressing.ts add the frosted pane + daylight
  { ...win('w-bad-n', 'ext-n', r3((xbW + IN.x1) / 2), 0.7, 1.1, 0.9, 'bad') },
];

/** Open room connections without wall/door (virtual boundary between two rooms). */
export const passages: Passage[] = [
  { id: 'p-kueche-flur-links', a: 'kueche', b: 'flur-links', from: { x: xsE, z: ZH }, to: { x: STUB.x0, z: ZH } },
  { id: 'p-kueche-wohnen', a: 'kueche', b: 'wohnen', from: { x: STUB.x1, z: zK }, to: { x: xkE, z: zK } },
  { id: 'p-kueche-wohnen-2', a: 'kueche', b: 'wohnen', from: { x: xkE, z: zWcS }, to: { x: xkE, z: zK } },
  { id: 'p-flur-rechts-wohnen', a: 'flur-rechts', b: 'wohnen', from: { x: xFl, z: zBathS }, to: { x: xFl, z: zWoN } },
  { id: 'p-kamin-wohnen', a: 'kamin', b: 'wohnen', from: { x: STUB.x1, z: zStubS }, to: { x: STUB.x1, z: zKmN } },
];

// ---------------------------------------------------------------- furniture
/** centre in metres */
const M = (id: string, type: FurnitureType, room: RoomId, x: number, z: number, w: number, d: number, h: number,
  rotDeg: number, extra: Partial<Furniture> = {}): Furniture =>
  ({ id, type, room, x, z, y: 0, rotationY: rad(rotDeg), w, d, h, ...extra });

/** Rearrangement 2 (arrow image): child room 2 bed crosswise. Head at east wall (natural) - flip to 'west' to follow the arrow literally. */
export const KIND_MITTE_BED_HEAD = 'west' as 'east' | 'west'; // arrow curves counter-clockwise -> head at the west end

// dining table: rearrangement 1 (arrow image): moved to the upper right (NE) of the kitchen, under the north window (photo 19: ~1.6-1.8 x 0.9)
const tx = 6.75, tz = 2.05;

export const furniture: Furniture[] = [
  // --- Schlafen (x 0.28..3.615, z 0.28..5.527)
  M('bed-schlafen', 'bed-double', 'schlafen', 1.31, 1.96, 1.65, 2.05, 0.55, 90, { note: 'head at west wall; photo 20: 1.65 x 2.05' }),
  M('ns-schlafen-1', 'nightstand', 'schlafen', 0.49, 0.86, 0.5, 0.42, 0.5, 90),
  M('ns-schlafen-2', 'nightstand', 'schlafen', 0.49, 3.06, 0.5, 0.42, 0.5, 90),
  M('wardrobe-schlafen', 'wardrobe', 'schlafen', 1.75, 5.227, 2.95, 0.6, 2.3, 180),
  M('plant-schlafen', 'plant', 'schlafen', 3.3, 0.6, 0.3, 0.3, 0.8, 0), // NE corner, clear of door and terrace door
  M('desk-schlafen', 'desk', 'schlafen', 1.99, 0.58, 1.1, 0.6, 0.75, 0, { note: 'white desk under the north window (photo 21)' }),
  M('bench-schlafen', 'bench', 'schlafen', 2.56, 1.96, 1.3, 0.38, 0.45, 90, { note: 'bench with sheepskin at the bed foot (photo 20)' }),
  M('fireplace-schlafen', 'sideboard', 'schlafen', 3.465, 3.3, 1.0, 0.3, 1.2, -90, { note: 'white mock fireplace with mirror on the spine wall (photo 02)' }),
  // --- Kueche (x 3.785..7.90, z 0.28..4.42)
  M('kitchen-west', 'kitchen-run', 'kueche', 4.06, 1.945, 3.33, 0.55, 0.9, 90, { note: 'L-shaped run, west arm (front faces east)' }),
  M('kitchen-north', 'kitchen-run', 'kueche', 5.275, 0.555, 1.88, 0.55, 0.9, 0, { note: 'L-shaped run, north arm (front faces south)' }),
  M('sink-kueche', 'sink-unit', 'kueche', 4.91, 0.555, 0.97, 0.5, 0.02, 0, { y: 0.89, onTopOf: 'kitchen-north', note: 'flush in the 0.90 worktop, rim 1 cm proud (top 0.91)' }),
  M('hob-kueche', 'hob', 'kueche', 4.06, 2.6, 0.6, 0.5, 0.03, 90, { y: 0.9, onTopOf: 'kitchen-west' }),
  {
    id: 'table-kueche', type: 'dining-table', room: 'kueche', x: tx, z: tz, y: 0, rotationY: 0, w: 1.6, d: 0.9, h: 0.76,
    note: 'MOVED per arrow: originally in the kitchen centre; photo 19: ~1.6-1.8 x 0.9',
  },
  { id: 'plant-table', type: 'plant-small', room: 'kueche', x: tx, z: tz, y: 0.76, rotationY: 0, w: 0.2, d: 0.2, h: 0.3, onTopOf: 'table-kueche' },
  { id: 'chair-k1', type: 'dining-chair', room: 'kueche', x: r3(tx - 0.4), z: r3(tz - 0.69), y: 0, rotationY: 0, w: 0.45, d: 0.47, h: 0.88 },
  { id: 'chair-k2', type: 'dining-chair', room: 'kueche', x: r3(tx + 0.4), z: r3(tz - 0.69), y: 0, rotationY: 0, w: 0.45, d: 0.47, h: 0.88 },
  { id: 'chair-k3', type: 'dining-chair', room: 'kueche', x: r3(tx - 0.4), z: r3(tz + 0.69), y: 0, rotationY: Math.PI, w: 0.45, d: 0.47, h: 0.88 },
  { id: 'chair-k4', type: 'dining-chair', room: 'kueche', x: r3(tx + 0.4), z: r3(tz + 0.69), y: 0, rotationY: Math.PI, w: 0.45, d: 0.47, h: 0.88 },
  M('fridge-kueche', 'fridge', 'kueche', 6.52, 0.58, 0.55, 0.6, 1.75, 0, { note: 'black/steel fridge-freezer, microwave on top (photos 17, 18)' }),
  M('coffee-bar', 'coffee-bar', 'kueche', 7.78, 2.2, 1.0, 0.24, 1.95, -90, { note: 'white coffee bar niche on the east wall (photo 15)' }),
  // --- Wohnen (x 7.80..11.89, z 4.87..10.13 plus the strip east of the kitchen)
  M('sideboard-wohnen', 'sideboard', 'wohnen', 9.98, 5.05, 1.64, 0.36, 0.8, 0),
  M('rug-wohnen', 'rug', 'wohnen', 10.59, 7.81, 2.14, 2.7, 0.015, 0),
  M('sofa-wohnen', 'sofa', 'wohnen', 11.315, 7.81, 2.15, 1.15, 0.85, -90, { note: 'L-sofa (chaise at the north end), faces west (TV)' }),
  M('armchair-n', 'armchair', 'wohnen', 10.3, 6.43, 0.78, 0.8, 0.8, 0),
  M('armchair-s', 'armchair', 'wohnen', 10.3, 9.23, 0.78, 0.8, 0.8, 180),
  M('coffee-table', 'coffee-table', 'wohnen', 10.24, 7.9, 0.8, 0.8, 0.42, 0),
  M('tv-unit', 'tv-unit', 'wohnen', 8.0, 7.67, 2.65, 0.42, 0.45, 90, { note: 'long low unit against the mural (TV) wall' }),
  M('tv', 'tv', 'wohnen', 8.0, 7.67, 1.3, 0.06, 0.8, 90, { y: 0.45, onTopOf: 'tv-unit' }),
  M('plant-wohnen-se', 'plant', 'wohnen', 11.5, 9.4, 0.4, 0.4, 1.0, 0),
  M('plant-wohnen-ne', 'plant', 'wohnen', 11.5, 5.2, 0.4, 0.4, 1.0, 0, { note: 'plan plant beside the sideboard end, clear of radiator + patio door' }),
  M('bench-kamin', 'bench', 'kamin', 6.4, 5.1, 1.0, 0.3, 0.42, 90, { note: 'log bench with white fur in the chimney recess (photo 10)' }),
  // --- Kamin: stove + round flue are built by geometry.ts (buildKaminStove), no furniture piece here
  // --- Kind links (x 0.28..3.615, z 5.677..10.127)
  M('bed-kind-links', 'bed-single', 'kind-links', 2.675, 6.15, 0.9, 1.88, 0.5, -90, { note: 'head at east wall' }),
  M('ns-kind-links', 'nightstand', 'kind-links', 3.405, 6.87, 0.5, 0.42, 0.5, -90),
  M('wardrobe-kind-links', 'wardrobe', 'kind-links', 0.56, 9.19, 1.13, 0.56, 2.1, 90),
  M('armchair-kind-links', 'armchair', 'kind-links', 0.64, 7.5, 0.7, 0.7, 0.8, 90, { note: 'small black armchair under the west window (photo 25)' }),
  M('desk-kind-links', 'desk', 'kind-links', 2.3, 9.75, 1.2, 0.75, 0.74, 180),
  M('chair-kind-links', 'chair', 'kind-links', 2.3, 9.05, 0.5, 0.5, 0.9, 0),
  // --- Kind mitte (bed ROTATED per arrow: crosswise, long axis east-west) x 4.945..7.645, z 6.11..10.127
  M('dresser-kind-mitte', 'dresser', 'kind-mitte', 5.145, 6.85, 1.2, 0.4, 1.0, 90),
  M('bed-kind-mitte', 'bed-single', 'kind-mitte', 6.69, 7.06, 0.9, 1.9, 0.5,
    KIND_MITTE_BED_HEAD === 'east' ? -90 : 90, { note: 'ROTATED per arrow: was lengthwise along east wall' }),
  M('desk-kind-mitte', 'desk', 'kind-mitte', 6.3, 9.82, 1.2, 0.6, 0.74, 180),
  M('chair-kind-mitte', 'chair', 'kind-mitte', 6.3, 9.15, 0.45, 0.45, 0.9, 0),
  M('plant-kind-mitte', 'plant', 'kind-mitte', 7.4, 9.4, 0.4, 0.4, 0.9, 0),
  M('armchair-kind-mitte', 'armchair', 'kind-mitte', 7.25, 8.3, 0.68, 0.75, 0.9, -90, { note: 'bentwood lounge chair (photo 25)' }),
  M('stool-kind-mitte', 'bench', 'kind-mitte', 6.55, 8.3, 0.45, 0.4, 0.38, -90, { note: 'footstool for the lounge chair' }),
  M('cot-kind-mitte', 'cot', 'kind-mitte', 5.25, 9.62, 0.9, 0.6, 0.75, 90, { note: 'photo-derived: pale grey-blue travel cot next to the desk / window (photo 42)' }),
  // --- Bad (x 10.04..11.89, z 0.28..3.759): tub across the north wall under the window, sink west wall, WC + corner shower east wall (photos 29, 30)
  M('bathtub', 'bathtub', 'bad', 10.965, 0.655, 0.75, 1.7, 0.55, 90),
  M('washbasin-bad', 'washbasin', 'bad', 10.285, 1.95, 0.5, 0.45, 0.85, 90),
  M('plant-bad', 'plant', 'bad', 10.3, 1.3, 0.35, 0.35, 0.65, 0, { note: 'plan plant between tub and basin' }),
  M('shower-bad', 'shower', 'bad', 11.45, 3.34, 0.8, 0.8, 2.0, 0, { note: 'photo 30: corner glass shower cabin 0.8 x 0.8 at the door end, taupe tiled interior' }),
  M('toilet-bad', 'toilet', 'bad', 11.7, 2.15, 0.38, 0.55, 0.4, -90, { note: 'photo 29/30: wall-hung WC on the east wall next to the shower' }),
  M('shelf-abstell', 'shelf', 'abstell', 9.29, 1.16, 0.78, 0.32, 1.9, -90, { note: 'plain shelving on the east wall' }),
  M('boiler-abstell', 'boiler', 'abstell', 9.15, 0.5, 0.4, 0.4, 1.3, 0),
  M('console-flur-r', 'console', 'flur-rechts', 10.9, 4.06, 0.6, 0.22, 0.8, 0, { note: 'photo-derived: black console with orchid on the north wall of the side hall (photos 09, 10)' }),
  M('console-flur', 'console', 'flur-links', 4.67, 7.7, 0.6, 0.25, 0.85, -90, { note: 'shoe bench / console, east wall of the hall' }),
  // --- WC (0.88 x 1.40 m: toilet + corner basin on the north wall, door in the south wall, photo 32)
  M('toilet', 'toilet', 'wc', 8.4, 2.5, 0.4, 0.6, 0.8, 0),
  M('washbasin-wc', 'washbasin', 'wc', 9.22, 2.36, 0.45, 0.32, 0.85, 0),
];

// nudge every floor piece the minimal distance (<= 15 cm) so its footprint lies inside its room polygon
function fitToRoom(f: Furniture): void {
  const room = rooms.find((r) => r.id === f.room)!;
  const inside = (dx: number, dz: number): boolean => {
    const r = footprint({ ...f, x: f.x + dx, z: f.z + dz });
    const e = 0.0005;
    return ([[r.x0 + e, r.z0 + e], [r.x1 - e, r.z0 + e], [r.x1 - e, r.z1 - e], [r.x0 + e, r.z1 - e]] as [number, number][])
      .every(([x, z]) => pointInPolygon(x, z, room.polygon));
  };
  if (inside(0, 0)) return;
  for (let d = 0.01; d <= 0.15; d += 0.01) {
    for (const [dx, dz] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, d], [d, -d], [-d, -d]]) {
      if (!inside(dx, dz)) continue;
      f.x = r3(f.x + dx); f.z = r3(f.z + dz);
      for (const g of furniture) if (g.onTopOf === f.id) { g.x = r3(g.x + dx); g.z = r3(g.z + dz); }
      return;
    }
  }
}
for (const f of furniture) if (!f.onTopOf) fitToRoom(f);
{ // the two kitchen arms meet in the NW corner: north arm starts exactly where the west arm ends
  const kw = furniture.find((f) => f.id === 'kitchen-west')!, kn = furniture.find((f) => f.id === 'kitchen-north')!;
  const dx = r3(kw.x + kw.d / 2 + kn.w / 2 - kn.x);
  kn.x = r3(kn.x + dx);
  for (const g of furniture) if (g.onTopOf === kn.id) g.x = r3(g.x + dx);
}

// ---------------------------------------------------------------- jump poses (eye height 1.6)
const EYE = 1.6;
const pose = (id: string, room: RoomId, x: number, z: number, yawDeg: number, de: string, en: string,
  pitchDeg = 0): JumpPose => ({ id, room, x, z, yawDeg, pitchDeg, eye: EYE, de, en });

export const poses: JumpPose[] = [
  pose('flur-links-entry', 'flur-links', xHallC, 9.55, 0, 'Eingang / Diele', 'Entrance hall'),
  pose('flur-links-back', 'flur-links', xHallC, 5.4, 180, 'Diele Richtung Haustür', 'Hall toward front door'),
  pose('kueche-1', 'kueche', 4.9, 3.7, 60, 'Küche mit Essplatz', 'Kitchen with dining corner'),
  pose('kueche-2', 'kueche', 7.3, 3.7, 300, 'Küchenzeile', 'Kitchen units'),
  pose('wohnen-1', 'wohnen', 8.4, 9.5, 40, 'Wohnzimmer', 'Living room'),
  pose('wohnen-2', 'wohnen', 8.9, 7.8, 90, 'Sitzgruppe', 'Seating area'),
  pose('schlafen-1', 'schlafen', 2.05, 4.5, 320, 'Schlafzimmer', 'Bedroom', -4), // SE corner by the door, bed + both windows in view
  pose('kind-links-1', 'kind-links', 1.27, 9.2, 355, 'Kinderzimmer 1', "Children's room 1", -3), // SW corner looking north
  pose('kind-mitte-1', 'kind-mitte', 6.0, 8.55, 345, 'Kinderzimmer 2', "Children's room 2"),
  pose('bad-1', 'bad', 10.55, 3.05, 355, 'Bad', 'Bathroom'),
  { id: 'wc-1', room: 'wc', x: 8.95, z: 2.82, yawDeg: 270, pitchDeg: -8, eye: EYE, de: 'WC', en: 'Toilet' },
  { id: 'abstell-1', room: 'abstell', x: 8.55, z: 1.55, yawDeg: 85, pitchDeg: -6, eye: EYE, de: 'Abstellraum', en: 'Storage room' },
  pose('flur-rechts-1', 'flur-rechts', 11.1, 4.45, 270, 'Seitenflur', 'Side hall'),
  pose('kamin-1', 'kamin', 8.4, 5.25, 270, 'Kaminanschluss', 'Chimney recess', -12), // backed off into the living room, pitched down
];
/** Guided tour order (pose ids). */
export const tourOrder: string[] = [
  'flur-links-entry', 'kueche-1', 'kueche-2', 'wohnen-1', 'wohnen-2', 'kamin-1', 'flur-rechts-1', 'bad-1', 'wc-1',
  'abstell-1', 'schlafen-1', 'kind-links-1', 'kind-mitte-1', 'flur-links-back',
];
/** Front door for the entrance arrow / start position. */
export const entrance = { x: xHallC, z: FOOTPRINT.z1, facing: 'n' as Side };

// ---------------------------------------------------------------- helpers
export const roomById = (id: RoomId): Room => rooms.find((r) => r.id === id)!;

export function polygonArea(p: Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += a.x * b.z - b.x * a.z;
  }
  return Math.abs(s) / 2;
}

export function pointInPolygon(x: number, z: number, p: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (p[i].z > z !== p[j].z > z && x < ((p[j].x - p[i].x) * (z - p[i].z)) / (p[j].z - p[i].z) + p[i].x) inside = !inside;
  }
  return inside;
}

/** Room containing a point (or null, e.g. inside a wall / outside). */
export function roomAt(x: number, z: number): Room | null {
  return rooms.find((r) => pointInPolygon(x, z, r.polygon)) ?? null;
}

/** Axis-aligned footprint of a piece. All rotations in the plan are multiples of 90 degrees. */
export function footprint(f: Furniture): { x0: number; z0: number; x1: number; z1: number } {
  const quarter = Math.abs(Math.round(f.rotationY / (Math.PI / 2))) % 2 === 1;
  const hw = (quarter ? f.d : f.w) / 2, hd = (quarter ? f.w : f.d) / 2;
  return { x0: f.x - hw, z0: f.z - hd, x1: f.x + hw, z1: f.z + hd };
}

export interface AreaRow { id: RoomId; measured: number; labelled: number | null; pct: number | null; ok: boolean }

/** Compare polygon areas with the labelled m2; console.warn (info if knownDeviation) when the mismatch exceeds tol. */
export function areaReport(tol = 0.03, log = true): AreaRow[] {
  return rooms.map((r) => {
    const measured = r.area === null ? polygonArea(r.polygon) : polygonArea(r.polygon);
    const pct = r.area === null ? null : (measured - r.area) / r.area;
    const ok = pct === null || Math.abs(pct) <= tol;
    if (log && !ok) {
      const msg = `[tour/plan] area ${r.id}: drawn ${measured.toFixed(2)} m2 vs label ${r.area} m2 (${(pct! * 100).toFixed(1)}%)`;
      if (r.knownDeviation) console.info(msg + ' - known: ' + r.knownDeviation);
      else console.warn(msg);
    }
    return { id: r.id, measured: r3(measured), labelled: r.area, pct: pct === null ? null : r3(pct), ok };
  });
}

/**
 * Sanity check of the plan: furniture inside its room, no floor overlap between pieces, door swings free.
 * Returns human-readable issues (empty = fine). Dev/QA only.
 */
export function checkPlan(): string[] {
  const issues: string[] = [];
  const rect = (f: Furniture) => footprint(f);
  const floor = furniture.filter((f) => !f.onTopOf && f.type !== 'rug');
  for (const f of floor) {
    const r = rect(f), room = roomById(f.room);
    const corners: [number, number][] = [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]];
    // nudge 1 cm inwards so pieces touching the wall face count as inside
    const cx = f.x, cz = f.z;
    for (const [px, pz] of corners) {
      const qx = px + Math.sign(cx - px) * 0.01, qz = pz + Math.sign(cz - pz) * 0.01;
      if (!pointInPolygon(qx, qz, room.polygon)) { issues.push(`${f.id}: corner outside ${f.room}`); break; }
    }
  }
  for (let i = 0; i < floor.length; i++) for (let j = i + 1; j < floor.length; j++) {
    const a = rect(floor[i]), b = rect(floor[j]);
    if (a.x0 < b.x1 - 0.005 && a.x1 > b.x0 + 0.005 && a.z0 < b.z1 - 0.005 && a.z1 > b.z0 + 0.005)
      issues.push(`${floor[i].id} overlaps ${floor[j].id}`);
  }
  // door swing square (leaf length = width) on the swing side
  for (const o of openings) {
    if (!o.swing) continue;
    const host = walls.find((w) => w.id === o.wall)!;
    const alongX = host.a.z === host.b.z;
    const half = o.width / 2, s = o.width;
    let x0 = o.at.x, x1 = o.at.x, z0 = o.at.z, z1 = o.at.z;
    if (alongX) { x0 -= half; x1 += half; } else { z0 -= half; z1 += half; }
    const t = o.swing.toward;
    if (t === 'n') { z0 -= s; } else if (t === 's') { z1 += s; } else if (t === 'w') { x0 -= s; } else { x1 += s; }
    // shrink 3 cm at the wall side so the wall itself is not hit
    for (const f of floor) {
      const r = rect(f);
      if (r.x0 < x1 - 0.02 && r.x1 > x0 + 0.02 && r.z0 < z1 - 0.02 && r.z1 > z0 + 0.02) issues.push(`door ${o.id} swing hits ${f.id}`);
    }
  }
  return issues;
}
