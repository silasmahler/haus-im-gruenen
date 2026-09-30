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
const PX_ORIGIN = 28; // outer NW corner in image px
const r3 = (v: number) => Math.round(v * 1000) / 1000;
/** image px -> metres (coordinate) */
const m = (px: number) => r3((px - PX_ORIGIN) / PX_PER_M);
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
 * GEOMETRY FOLLOWS THE DRAWING (grundriss-neu.png, measured wall faces). The labelled m2 in the image contradict its own
 * drawn geometry (WC label 1.23 m2 but drawn ~2.2 m2, Bad label 6.44 but drawn ~4.7 ...), so the walls sit where they are drawn
 * and rooms whose polygon area misses the label by more than 3% carry a knownDeviation (shown by areaReport()).
 */
const IN = { x0: EXT_T, z0: EXT_T, x1: FOOTPRINT.x1 - EXT_T, z1: FOOTPRINT.z1 - EXT_T }; // inner clear box
const T = { spine: 0.17, sch: 0.15, kmW: 0.15, kmN: 0.16, kmE: len(11), abW: 0.15, wcBad: 0.16, abWc: 0.15, wcS: 0.15 };
const LAB = { schlafen: 17.5, kindLinks: 14.85, kueche: 17.04, hall: 7.0, kindMitte: 10.85, flurR: 2.0, bad: 6.44, wc: 1.23, abstell: 2.48 };
// wall faces measured in the drawing (metres)
const ZB = 2.89; // north face of the Bad/WC south wall (= inner south edge of bath / WC)
const ZH = 4.55; // virtual kitchen | hallway boundary (west of the flur stub); the grey kitchen tile ends at the stub line
// fixed by the plan image
const STUB = { x0: m(386), x1: m(507), c: m(355.5), t: len(8) }; // wall between kitchen and chimney recess
const zK = STUB.c - STUB.t / 2; // north face of the stub = bottom of the kitchen
const zStubS = STUB.c + STUB.t / 2;
const KAMIN_W = { c: m(428), t: len(10) };
const KM_E = { c: m(565.5), t: T.kmE };
const WO = { c: m(336.5), t: len(9), x0: m(644) }; // stub wall north of the living room
const zWoN = WO.c - WO.t / 2, zWoS = WO.c + WO.t / 2;

const xsW = 3.50, xsE = xsW + T.spine; // spine wall faces (drawn 3.50-3.67)
const zsN = 5.62, zsS = zsN + T.sch; // bedroom south face / children's room 1 north face (drawn 5.62-5.77)
const xkE = 7.97; // kitchen east edge = west face of the storage room wall (drawn 7.97-8.12)
const xkmW = 4.93, xkmE = xkmW + T.kmW; // hallway east face / kind-mitte west face (drawn 4.93-5.08)
const kmeW = KM_E.c - KM_E.t / 2, kmeE = KM_E.c + KM_E.t / 2;
const zKmN = 6.07, zKmS = zKmN + T.kmN; // north face of kind-mitte's north wall / kind-mitte north face (drawn 6.07-6.23)
const kaminW = KAMIN_W.c - KAMIN_W.t / 2, kaminE = KAMIN_W.c + KAMIN_W.t / 2;
const abwE = xkE + T.abW; // east face of the storage room west wall
const xbW = 10.09; // west edge of the bath (drawn Bad/WC partition 9.93-10.09)
const xcE = xbW - T.wcBad; // east edge of storage room / WC
const zAbS = 1.53; // south edge of storage room (drawn Abstell/WC wall 1.53-1.68)
const zWcN = zAbS + T.abWc;
const zWcS = ZB + T.wcS; // south face of the WC / bath wall
const xFl = IN.x1 - LAB.flurR / (zWoN - zWcS); // west edge of the side hall (vestibule of the east door)
/** Layout numbers other modules may need (metres). */
export const LAYOUT = { IN, xsW, xsE, zsN, zsS, xkE, xkmW, xkmE, zKmS, zKmN, xbW, xcE, zAbS, zWcN, zWcS, xFl, zK, kaminE, kmeW, kmeE, zWoN, zWoS };

// ---------------------------------------------------------------- rooms
const poly = (...pts: [number, number][]): Pt[] => pts.map(([x, z]) => ({ x, z }));

export const rooms: Room[] = [
  { id: 'schlafen', de: 'Schlafzimmer', en: 'Bedroom', area: LAB.schlafen, floor: 'walnut-strip', wall: 'plaster-warm',
    polygon: poly([IN.x0, IN.z0], [xsW, IN.z0], [xsW, zsN], [IN.x0, zsN]) },
  { id: 'kueche', de: 'Küche', en: 'Kitchen', area: LAB.kueche, floor: 'tile-grey', wall: 'plaster-white',
    knownDeviation: 'drawn walls + tile edge (z 4.6) give ~18.5 m2 vs the 17.04 label',
    polygon: poly([xsE, IN.z0], [xkE, IN.z0], [xkE, zK], [STUB.x0, zK], [STUB.x0, ZH], [xsE, ZH]) },
  { id: 'wohnen', de: 'Wohnzimmer', en: 'Living room', area: 26.52, floor: 'walnut', wall: 'plaster-warm',
    knownDeviation: 'follows the drawn WC/Bad block and kind-mitte wall; ~27.9 m2 vs the 26.52 label',
    polygon: poly([STUB.x1, zK], [xkE, zK], [xkE, zWcS], [xFl, zWcS], [xFl, zWoN], [WO.x0, zWoN], [WO.x0, zWoS], [IN.x1, zWoS],
      [IN.x1, IN.z1], [kmeE, IN.z1], [kmeE, zKmN], [STUB.x1, zKmN]) },
  { id: 'kind-links', de: 'Kinderzimmer 1', en: "Children's room 1", area: LAB.kindLinks, floor: 'laminate-brown', wall: 'plaster-warm',
    knownDeviation: 'drawn walls (spine 3.50, Schlafen wall 5.62-5.77) give ~14.0 m2 vs the 14.85 label',
    polygon: poly([IN.x0, zsS], [xsW, zsS], [xsW, IN.z1], [IN.x0, IN.z1]) },
  { id: 'kind-mitte', de: 'Kinderzimmer 2', en: "Children's room 2", area: LAB.kindMitte, floor: 'beech', wall: 'plaster-warm',
    knownDeviation: 'drawn walls (x 5.08-7.60, z 6.23-10.13) give ~9.8 m2 vs the 10.85 label',
    polygon: poly([xkmE, zKmS], [kmeW, zKmS], [kmeW, IN.z1], [xkmE, IN.z1]) },
  { id: 'flur-links', de: 'Diele', en: 'Hallway', area: LAB.hall, floor: 'hall-brown', wall: 'plaster-white',
    knownDeviation: 'drawn hall is 1.26 m wide (x 3.67-4.93), ~8.0 m2 vs the 7.00 label',
    polygon: poly([xsE, ZH], [STUB.x0, ZH], [STUB.x0, zStubS], [kaminW, zStubS], [kaminW, zKmN], [xkmW, zKmN], [xkmW, IN.z1], [xsE, IN.z1]) },
  { id: 'flur-rechts', de: 'Flur', en: 'Side hall', area: LAB.flurR, floor: 'hall-brown', wall: 'plaster-white',
    polygon: poly([xFl, zWcS], [IN.x1, zWcS], [IN.x1, zWoN], [xFl, zWoN]) },
  { id: 'bad', de: 'Bad', en: 'Bathroom', area: LAB.bad, floor: 'tile-bath', wall: 'tile-bath',
    knownDeviation: 'drawn Bad is 1.80 x 2.61 = ~4.7 m2; the 6.44 label contradicts the drawing',
    polygon: poly([xbW, IN.z0], [IN.x1, IN.z0], [IN.x1, ZB], [xbW, ZB]) },
  { id: 'wc', de: 'WC', en: 'Toilet', area: LAB.wc, floor: 'tile-bath', wall: 'tile-bath',
    knownDeviation: 'drawn WC is 1.81 x 1.21 = ~2.2 m2; the 1.23 label contradicts the drawing',
    polygon: poly([abwE, zWcN], [xcE, zWcN], [xcE, ZB], [abwE, ZB]) },
  { id: 'abstell', de: 'Abstellraum', en: 'Storage room', area: LAB.abstell, floor: 'tile-bath', wall: 'plaster-white',
    knownDeviation: 'drawn Abstell is 1.81 x 1.25 = ~2.3 m2 vs the 2.48 label',
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
const xAbW = xkE + T.abW / 2, xWcBad = xbW - T.wcBad / 2, zAbWc = zAbS + T.abWc / 2, zWcSC = ZB + T.wcS / 2;

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
  HW('int-kmitte-n', 'interior', zKmC, xKmW, KM_E.c, T.kmN),
  VW('int-kmitte-w', 'interior', xKmW, zKmC, Z1c, T.kmW),
  VW('int-kmitte-e', 'interior', KM_E.c, zKmC, Z1c, KM_E.t),
  HW('int-wc-s', 'interior', zWcSC, xAbW, X1c, T.wcS), // before int-abstell-w: owns the corner
  VW('int-abstell-w', 'interior', xAbW, cw, zWcSC, T.abW),
  VW('int-wc-bad', 'interior', xWcBad, cw, zWcSC, T.wcBad),
  HW('int-abstell-wc', 'interior', zAbWc, xAbW, xWcBad, T.abWc),
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
const win = (id: string, wall: string, s: number, wPx: number, sill: number, h: number, room: RoomId): Opening =>
  ({ id, type: 'window', wall, at: onWall(wall, s), width: len(wPx), sill, height: h, rooms: [room, 'outside'] });

const KITCHEN_DX = xsE - (m(278.5) + len(11) / 2); // ~0: drawn spine east face is the plan spine

/*
 * Door table (widths follow the drawn wall-face gaps): d-east 0.76 @ z 3.82, hinge on the SOUTH jamb; d-schlafen / d-kind-links /
 * d-kind-mitte / d-abstell 0.70; d-wc / d-bad 0.66 (drawn ~0.60 + leaf line); d-front 0.87.
 * d-schlafen + d-kind-links: leaf on the SOUTH jamb, opening west (as drawn). d-kind-mitte: the plan shows only a glazed strip
 * without leaf; a leaf hinged on the north jamb is kept deliberately (a real door is needed for the tour).
 * Photo-derived deviations from the drawing (deliberate, see photos 05, 09, 12, 20, 29): w-wohnen-e (French door in the east wall),
 * w-bad-n (small frosted bath window), w-schlafen-w drawn as a floor-length terrace door, Schlafen plant moved to the NE corner.
 * The labelled m2 are the plan's own figures; the polygons follow the drawn walls (knownDeviation), never show labels beside geometry.
 */
export const openings: Opening[] = [
  // doors
  { ...door('d-front', 'ext-s', 4.14, 0.87, ['flur-links', 'outside'], { hinge: 'a', toward: 'n', openDeg: 90 }), type: 'entrance', height: 2.1 },
  { ...door('d-east', 'ext-e', 3.82, 0.76, ['flur-rechts', 'outside'], { hinge: 'b', toward: 'w', openDeg: 90 }), type: 'entrance' },
  door('d-schlafen', 'int-spine', m(345), 0.7, ['schlafen', 'flur-links'], { hinge: 'b', toward: 'w', openDeg: 90 }),
  door('d-kind-links', 'int-spine', m(601.5), 0.7, ['kind-links', 'flur-links'], { hinge: 'b', toward: 'w', openDeg: 90 }),
  door('d-kind-mitte', 'int-kmitte-w', 8.7, 0.7, ['kind-mitte', 'flur-links'], { hinge: 'a', toward: 'e', openDeg: 90 }),
  door('d-abstell', 'int-abstell-w', m(99.5), 0.7, ['abstell', 'kueche'], { hinge: 'a', toward: 'e', openDeg: 90 }),
  door('d-wc', 'int-wc-s', 9.03, 0.66, ['wc', 'flur-rechts'], { hinge: 'a', toward: 's', openDeg: 90 }),
  door('d-bad', 'int-wc-s', m(780), 0.66, ['bad', 'flur-rechts'], { hinge: 'b', toward: 'n', openDeg: 90 }),
  // windows (sill/height from typical bungalow; Wohnen windows larger)
  win('w-schlafen-n', 'ext-n', m(167), 72, 0.9, 1.25, 'schlafen'),
  // terrace door with the burgundy curtain (photo 20); the drawing shows a window here, the photos a floor-length glass door
  win('w-schlafen-w', 'ext-w', m(328.5), 69, 0, 2.1, 'schlafen'),
  win('w-kueche-n2', 'ext-n', m(360.5), 62, 1.05, 1.15, 'kueche'), // over the sink (photos 14, 19)
  win('w-kueche-n', 'ext-n', m(504.5), 65, 1.05, 1.15, 'kueche'),
  win('w-kind-links-w', 'ext-w', m(537.5), 79, 0.9, 1.25, 'kind-links'),
  win('w-kind-links-s', 'ext-s', m(161), 72, 0.9, 1.25, 'kind-links'),
  win('w-kind-mitte-s', 'ext-s', m(487), 71, 0.9, 1.25, 'kind-mitte'),
  win('w-wohnen-s1', 'ext-s', m(658.5), 77, 0.75, 1.4, 'wohnen'),
  win('w-wohnen-s2', 'ext-s', m(755), 78, 0.75, 1.4, 'wohnen'),
  // French / patio door in the garden (east) wall next to the sofa, grey tile threshold (photos 05, 09, 12); sill 0 = full-height glass
  win('w-wohnen-e', 'ext-e', 6.05, 84, 0, 2.1, 'wohnen'),
  // small frosted bath window above the tub, north wall (photo 29); lighting.ts/dressing.ts add the frosted pane + daylight
  { ...win('w-bad-n', 'ext-n', r3(IN.x1 - 0.5), 0, 1.15, 0.75, 'bad'), width: 0.62 },
];

/** Open room connections without wall/door (virtual boundary between two rooms). */
export const passages: Passage[] = [
  { id: 'p-kueche-flur-links', a: 'kueche', b: 'flur-links', from: { x: xsE, z: ZH }, to: { x: STUB.x0, z: ZH } },
  { id: 'p-kueche-wohnen', a: 'kueche', b: 'wohnen', from: { x: STUB.x1, z: zK }, to: { x: xkE, z: zK } },
  { id: 'p-kueche-wohnen-2', a: 'kueche', b: 'wohnen', from: { x: xkE, z: zWcS }, to: { x: xkE, z: zK } },
  { id: 'p-flur-rechts-wohnen', a: 'flur-rechts', b: 'wohnen', from: { x: xFl, z: zWcS }, to: { x: xFl, z: zWoN } },
  { id: 'p-kamin-wohnen', a: 'kamin', b: 'wohnen', from: { x: STUB.x1, z: zStubS }, to: { x: STUB.x1, z: zKmN } },
];

// ---------------------------------------------------------------- furniture
/** centre in image px, size in metres */
const F = (id: string, type: FurnitureType, room: RoomId, cx: number, cy: number, w: number, d: number, h: number,
  rotDeg: number, extra: Partial<Furniture> = {}): Furniture =>
  ({ id, type, room, x: m(cx), z: m(cy), y: 0, rotationY: rad(rotDeg), w, d, h, ...extra });

/** centre in metres */
const M = (id: string, type: FurnitureType, room: RoomId, x: number, z: number, w: number, d: number, h: number,
  rotDeg: number, extra: Partial<Furniture> = {}): Furniture =>
  ({ id, type, room, x, z, y: 0, rotationY: rad(rotDeg), w, d, h, ...extra });

/** Rearrangement 2 (arrow image): child room 2 bed crosswise. Head at east wall (natural) - flip to 'west' to follow the arrow literally. */
export const KIND_MITTE_BED_HEAD = 'west' as 'east' | 'west'; // arrow curves counter-clockwise -> head at the west end

// dining table: rearrangement 1 (arrow image): moved from (445,295) px to the upper right of the kitchen
const TABLE = { cx: 516, cy: 165 };
const tx = m(TABLE.cx), tz = m(TABLE.cy);

export const furniture: Furniture[] = [
  // --- Schlafen
  F('bed-schlafen', 'bed-double', 'schlafen', 121, 165, 1.65, 1.95, 0.55, 90, { note: 'head at west wall' }),
  F('ns-schlafen-1', 'nightstand', 'schlafen', 63, 84, 0.5, 0.42, 0.5, 90),
  F('ns-schlafen-2', 'nightstand', 'schlafen', 63, 248, 0.5, 0.42, 0.5, 90),
  F('wardrobe-schlafen', 'wardrobe', 'schlafen', 149.5, 399, 2.95, 0.6, 2.3, 180),
  M('plant-schlafen', 'plant', 'schlafen', 3.2, 0.6, 0.3, 0.3, 0.8, 0), // NE corner, clear of door and terrace door
  M('desk-schlafen', 'desk', 'schlafen', 1.99, 0.58, 1.1, 0.6, 0.75, 0, { note: 'white desk under the north window (photo 21)' }),
  M('bench-schlafen', 'bench', 'schlafen', 2.55, 1.96, 1.3, 0.38, 0.45, 90, { note: 'bench with sheepskin at the bed foot (photo 20)' }),
  M('fireplace-schlafen', 'sideboard', 'schlafen', 3.34, 3.3, 1.0, 0.3, 1.2, -90, { note: 'white mock fireplace with mirror on the spine wall (photo 02)' }),
  // --- Kueche
  F('kitchen-west', 'kitchen-run', 'kueche', 303, 162, 3.33, 0.55, 0.9, 90, { note: 'L-shaped run, west arm (front faces east)' }),
  F('kitchen-north', 'kitchen-run', 'kueche', 388, 66, 1.88, 0.55, 0.9, 0, { note: 'L-shaped run, north arm (front faces south)' }),
  F('sink-kueche', 'sink-unit', 'kueche', 363.5, 66, 0.97, 0.5, 0.02, 0, { y: 0.89, onTopOf: 'kitchen-north', note: 'flush in the 0.90 worktop, rim 1 cm proud (top 0.91)' }),
  F('hob-kueche', 'hob', 'kueche', 303.5, 210, 0.6, 0.5, 0.03, 90, { y: 0.9, onTopOf: 'kitchen-west' }),
  {
    id: 'table-kueche', type: 'dining-table', room: 'kueche', x: tx, z: tz, y: 0, rotationY: 0, w: 1.5, d: 0.75, h: 0.76,
    note: 'MOVED per arrow: originally centre px (445,295)',
  },
  { id: 'plant-table', type: 'plant-small', room: 'kueche', x: tx, z: tz, y: 0.76, rotationY: 0, w: 0.2, d: 0.2, h: 0.3, onTopOf: 'table-kueche' },
  { id: 'chair-k1', type: 'dining-chair', room: 'kueche', x: r3(tx - 0.36), z: r3(tz - 0.62), y: 0, rotationY: 0, w: 0.45, d: 0.47, h: 0.88 },
  { id: 'chair-k2', type: 'dining-chair', room: 'kueche', x: r3(tx + 0.36), z: r3(tz - 0.62), y: 0, rotationY: 0, w: 0.45, d: 0.47, h: 0.88 },
  { id: 'chair-k3', type: 'dining-chair', room: 'kueche', x: r3(tx - 0.36), z: r3(tz + 0.62), y: 0, rotationY: Math.PI, w: 0.45, d: 0.47, h: 0.88 },
  { id: 'chair-k4', type: 'dining-chair', room: 'kueche', x: r3(tx + 0.36), z: r3(tz + 0.62), y: 0, rotationY: Math.PI, w: 0.45, d: 0.47, h: 0.88 },
  M('fridge-kueche', 'fridge', 'kueche', 6.44, 0.58, 0.55, 0.6, 1.75, 0, { note: 'black/steel fridge-freezer, microwave on top (photos 17, 18)' }),
  M('coffee-bar', 'coffee-bar', 'kueche', 7.85, 2.2, 1.0, 0.24, 1.95, -90, { note: 'white coffee bar niche on the east wall (photo 15)' }),
  // --- Wohnen
  F('sideboard-wohnen', 'sideboard', 'wohnen', 726.5, 356, 1.64, 0.36, 0.8, 0),
  F('rug-wohnen', 'rug', 'wohnen', 769, 574.5, 2.14, 2.7, 0.015, 0),
  F('sofa-wohnen', 'sofa', 'wohnen', 820, 575, 2.15, 1.15, 0.85, -90, { note: 'L-sofa (chaise at the north end), faces west (TV)' }),
  F('armchair-n', 'armchair', 'wohnen', 749, 477.5, 0.78, 0.8, 0.8, 0),
  F('armchair-s', 'armchair', 'wohnen', 749, 674, 0.78, 0.8, 0.8, 180),
  F('coffee-table', 'coffee-table', 'wohnen', 745, 581, 0.8, 0.8, 0.42, 0),
  F('tv-unit', 'tv-unit', 'wohnen', 587, 565, 2.65, 0.42, 0.45, 90, { note: 'long low unit as drawn (z 470..660 px), TV centred on it' }),
  F('tv', 'tv', 'wohnen', 587, 565, 1.3, 0.06, 0.8, 90, { y: 0.45, onTopOf: 'tv-unit' }),
  F('plant-wohnen-se', 'plant', 'wohnen', 826, 681, 0.4, 0.4, 1.0, 0),
  M('plant-wohnen-ne', 'plant', 'wohnen', 11.46, 4.86, 0.4, 0.4, 1.0, 0, { note: 'plan plant beside the sideboard end (px 830,368), clear of radiator + patio door' }),
  M('bench-kamin', 'bench', 'kamin', 6.3, 4.9, 1.0, 0.3, 0.42, 0, { note: 'log bench with white fur in the chimney recess (photo 10)' }),
  // --- Kamin: stove + round flue are built by geometry.ts (buildKaminStove), no furniture piece here
  // --- Kind links
  F('bed-kind-links', 'bed-single', 'kind-links', 205, 466, 0.9, 1.88, 0.5, -90, { note: 'head at east wall' }),
  F('ns-kind-links', 'nightstand', 'kind-links', 257.5, 517.5, 0.5, 0.42, 0.5, -90),
  F('wardrobe-kind-links', 'wardrobe', 'kind-links', 66.5, 671, 1.13, 0.56, 2.1, 90),
  M('armchair-kind-links', 'armchair', 'kind-links', 0.64, 7.28, 0.7, 0.7, 0.8, 90, { note: 'small black armchair under the west window (photo 25)' }),
  F('desk-kind-links', 'desk', 'kind-links', 199, 707, 1.2, 0.75, 0.74, 180),
  F('chair-kind-links', 'chair', 'kind-links', 199, 657, 0.5, 0.5, 0.9, 0),
  // --- Kind mitte (bed ROTATED per arrow: crosswise, long axis east-west)
  F('dresser-kind-mitte', 'dresser', 'kind-mitte', 401, 507.5, 1.2, 0.4, 1.0, 90),
  F('bed-kind-mitte', 'bed-single', 'kind-mitte', 493, 523, 0.9, 1.9, 0.5,
    KIND_MITTE_BED_HEAD === 'east' ? -90 : 90, { note: 'ROTATED per arrow: was lengthwise along east wall (centre px 529,536)' }),
  F('desk-kind-mitte', 'desk', 'kind-mitte', 468.5, 712, 1.2, 0.6, 0.74, 180),
  F('chair-kind-mitte', 'chair', 'kind-mitte', 467, 674, 0.45, 0.45, 0.9, 0),
  F('plant-kind-mitte', 'plant', 'kind-mitte', 534, 655, 0.4, 0.4, 0.9, 0),
  M('armchair-kind-mitte', 'armchair', 'kind-mitte', 7.15, 8.3, 0.68, 0.75, 0.9, -90, { note: 'bentwood lounge chair (photo 25)' }),
  M('stool-kind-mitte', 'bench', 'kind-mitte', 6.45, 8.3, 0.45, 0.4, 0.38, -90, { note: 'footstool for the lounge chair' }),
  M('cot-kind-mitte', 'cot', 'kind-mitte', 5.386, 9.62, 0.9, 0.6, 0.75, 90, { note: 'photo-derived: pale grey-blue travel cot next to the desk / window (photo 42)' }),
  // --- Bad (fixtures placed against the east / north walls of the re-cut room)
  { id: 'bathtub', type: 'bathtub', room: 'bad', x: r3(IN.x1 - 0.375), z: r3(IN.z0 + 0.775), y: 0, rotationY: 0, w: 0.75, d: 1.55, h: 0.55 },
  { id: 'washbasin-bad', type: 'washbasin', room: 'bad', x: r3(IN.x1 - 0.225), z: r3(ZB - 0.25), y: 0, rotationY: rad(-90), w: 0.5, d: 0.45, h: 0.85 }, // flush with the south wall face (plan px z 195..231)
  M('plant-bad', 'plant', 'bad', 11.67, 2.03, 0.35, 0.35, 0.65, 0, { note: 'plan plant between tub and basin (px 845,170)' }),
  M('shower-bad', 'shower', 'bad', 10.55, 0.73, 0.9, 0.9, 2.0, 0, { note: 'photo-derived (photo 31), not in the plan: corner glass shower cabin, dark tiled interior' }),
  M('toilet-bad', 'toilet', 'bad', 10.36, 1.75, 0.38, 0.55, 0.4, 90, { note: 'photo-derived (photo 29), not in the plan: wall-hung WC on the west (partition) wall' }),
  // --- WC (as drawn: toilet against the west wall facing east, basin centred on the north wall, door in the south wall)
  M('shelf-abstell', 'shelf', 'abstell', 9.77, 1.11, 0.78, 0.32, 1.9, -90, { note: 'plain shelving on the east wall' }),
  M('boiler-abstell', 'boiler', 'abstell', 9.72, 0.5, 0.4, 0.4, 1.3, 0),
  M('console-flur-r', 'console', 'flur-rechts', 11.35, 3.2, 0.8, 0.28, 0.8, 0, { note: 'photo-derived: black console with orchid on the north wall of the side hall (photos 09, 10)' }),
  M('console-flur', 'console', 'flur-links', 4.8, 9.7, 0.8, 0.25, 0.85, -90, { note: 'shoe bench / console, east wall by the front door' }),
  { id: 'toilet', type: 'toilet', room: 'wc', x: r3(abwE + 0.3), z: r3((zWcN + ZB) / 2), y: 0, rotationY: rad(90), w: 0.4, d: 0.6, h: 0.8 },
  { id: 'washbasin-wc', type: 'washbasin', room: 'wc', x: r3((abwE + xcE) / 2), z: r3(zWcN + 0.16), y: 0, rotationY: 0, w: 0.45, d: 0.32, h: 0.85 },
];

// The image-derived positions above predate the re-cut walls: keep the kitchen run against the (moved) spine wall and
// nudge every floor piece the minimal distance (<= 15 cm) so its footprint lies inside its room polygon.
for (const f of furniture) if (['kitchen-west', 'kitchen-north', 'sink-kueche', 'hob-kueche'].includes(f.id)) f.x = r3(f.x + KITCHEN_DX);
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
const pose = (id: string, room: RoomId, px: number, py: number, yawDeg: number, de: string, en: string,
  pitchDeg = 0): JumpPose => ({ id, room, x: m(px), z: m(py), yawDeg, pitchDeg, eye: EYE, de, en });

export const poses: JumpPose[] = [
  pose('flur-links-entry', 'flur-links', 336, 647.5, 0, 'Eingang / Diele', 'Entrance hall'),
  pose('flur-links-back', 'flur-links', 335, 420, 180, 'Diele Richtung Haustür', 'Hall toward front door'),
  pose('kueche-1', 'kueche', 350, 300, 60, 'Küche mit Essplatz', 'Kitchen with dining corner'),
  pose('kueche-2', 'kueche', 550, 300, 300, 'Küchenzeile', 'Kitchen units'),
  pose('wohnen-1', 'wohnen', 600, 700, 40, 'Wohnzimmer', 'Living room'),
  pose('wohnen-2', 'wohnen', 620, 560, 90, 'Sitzgruppe', 'Seating area'),
  pose('schlafen-1', 'schlafen', 171.5, 350, 320, 'Schlafzimmer', 'Bedroom', -4), // = (2.05, 4.6) m: SE corner by the door, >= 0.6 m from the open door leaf; bed + both windows in view
  pose('kind-links-1', 'kind-links', 133, 668.5, 355, 'Kinderzimmer 1', "Children's room 1", -3), // SW corner looking north: bed on the north wall, west window, wardrobe
  pose('kind-mitte-1', 'kind-mitte', 503, 663, 345, 'Kinderzimmer 2', "Children's room 2"),
  pose('bad-1', 'bad', 766.5, 199.5, 30, 'Bad', 'Bathroom'),
  { id: 'wc-1', room: 'wc', x: 9.78, z: 2.55, yawDeg: 270, pitchDeg: -8, eye: EYE, de: 'WC', en: 'Toilet' },
  { id: 'abstell-1', room: 'abstell', x: 8.4, z: 1.05, yawDeg: 85, pitchDeg: -6, eye: EYE, de: 'Abstellraum', en: 'Storage room' },
  pose('flur-rechts-1', 'flur-rechts', 826, 315, 270, 'Seitenflur', 'Side hall'),
  pose('kamin-1', 'kamin', 612, 408, 270, 'Kaminanschluss', 'Chimney recess', -12), // backed off into the living room, pitched down: stove front + glass door in frame
];
/** Guided tour order (pose ids). */
export const tourOrder: string[] = [
  'flur-links-entry', 'kueche-1', 'kueche-2', 'wohnen-1', 'wohnen-2', 'kamin-1', 'flur-rechts-1', 'bad-1', 'wc-1',
  'abstell-1', 'schlafen-1', 'kind-links-1', 'kind-mitte-1', 'flur-links-back',
];
/** Front door for the entrance arrow / start position. */
export const entrance = { x: 4.14, z: FOOTPRINT.z1, facing: 'n' as Side };

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
