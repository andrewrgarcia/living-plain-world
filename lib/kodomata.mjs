// The Kodomata world's nature — the alien world the Kodomata's ship flies to
// from the plain (world/kodomata/README.md). Like lib/terrain.mjs for the
// plain, this is the one place that says where its ground is and where its
// mountains and its trees stand; the viewer draws from it, and the gate will
// judge from it once the engine builds there.
//
// FROZEN: the ground, the range and the trees. A change to them is a new
// KODOMATA_VERSION, made by The Architect. The places at the end (the spots
// kept clear, the Monolith) are not its nature: The Architect places them,
// like the plain's lib/places.mjs.
//
// The world's own coordinates: meters, the ship's pad at (0, 0), +x east,
// +z south, y up (as on the plain, but a world of its own: nothing here is
// near anything there).
//
// Its nature, as Moxi scripts in world/kodomata/: the range
// (mountains.md, from the components in lib/rock.md), the grove (canopy.md),
// the lone tree (tree.md), the gas giant's rings (planet.md) and the
// creature (kodomata.md).

export const KODOMATA_VERSION = 1

/** where the ship sets down */
export const PAD = [0, 0]
/** the pad is flat this far out, and the dunes are whole from here (meters from the pad) */
const FLAT = 22, DUNES = 60

/** the ground: a square this wide (meters) around the pad, in cells this big */
export const GROUND = { size: 4800, cell: 12 }
const N = GROUND.size / GROUND.cell

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** the smooth field the ground is sampled from: low dunes, a flat pad for the ship, hills at the rim */
export function fieldHeight(x, z) {
  const dx = x - PAD[0], dz = z - PAD[1]
  const r = Math.hypot(dx, dz)
  const dunes =
    2.4 * Math.sin(x * 0.021 + 1.3) * Math.sin(z * 0.017 - 0.4) +
    1.2 * Math.sin((x * 0.6 + z) * 0.045) +
    0.35 * Math.sin(x * 0.13) * Math.sin(z * 0.11)
  // far out the dunes swell into low hills, the edge of what is drawn
  const hills = 40 * smooth(1900, 2400, r) * (0.7 + 0.3 * Math.sin(Math.atan2(dz, dx) * 7 + r * 0.01))
  return dunes * smooth(FLAT, DUNES, r) + hills
}

/** the field at the grid's vertices, row by row (x across, z down), filled on first use */
let grid = null
export function groundGrid() {
  if (grid) return grid
  grid = new Float32Array((N + 1) * (N + 1))
  for (let j = 0; j <= N; j++)
    for (let i = 0; i <= N; i++)
      grid[j * (N + 1) + i] = fieldHeight(PAD[0] - GROUND.size / 2 + i * GROUND.cell, PAD[1] - GROUND.size / 2 + j * GROUND.cell)
  return grid
}

/** the ground's height at (x, z): the drawn triangle under that point, not the field (between the
 *  grid's vertices the two differ, and feet would sink or float). Each cell is two triangles split
 *  from its (i+1, j) corner to its (i, j+1) corner. */
export function groundHeight(x, z) {
  const g = groundGrid()
  const u = (x - PAD[0] + GROUND.size / 2) / GROUND.cell, v = (z - PAD[1] + GROUND.size / 2) / GROUND.cell
  const i = Math.min(N - 1, Math.max(0, Math.floor(u))), j = Math.min(N - 1, Math.max(0, Math.floor(v)))
  const fx = Math.min(1, Math.max(0, u - i)), fz = Math.min(1, Math.max(0, v - j))
  const h00 = g[j * (N + 1) + i], h10 = g[j * (N + 1) + i + 1], h01 = g[(j + 1) * (N + 1) + i], h11 = g[(j + 1) * (N + 1) + i + 1]
  return fx + fz <= 1
    ? h00 + fx * (h10 - h00) + fz * (h01 - h00)
    : h11 + (1 - fx) * (h01 - h11) + (1 - fz) * (h10 - h11)
}

// ── the range (world/kodomata/mountains.md) ───────────────────────────

/** which way it lies from the pad (radians: 0 is +z, a quarter turn is +x), how far its main
 *  summit is, and its mountains' footprints in its own frame (x, z, radius) */
export const RANGE = {
  bearing: 2.4 + Math.PI,
  far: 1250,
  feet: [[0, 0, 760], [-720, -80, 560], [720, -40, 640], [-320, 600, 270], [620, 740, 230], [-1000, 380, 300], [400, 670, 170]],
}
/** the range's origin (under the main summit) and its turn: its front, with the arch and the gorges, faces the pad */
export const RANGE_AT = [PAD[0] + Math.sin(RANGE.bearing) * RANGE.far, PAD[1] + Math.cos(RANGE.bearing) * RANGE.far]
export const RANGE_TURN = RANGE.bearing + Math.PI

/** is (x, z) on the range, or within `margin` meters of it? */
export function onRange(x, z, margin = 0) {
  const dx = x - RANGE_AT[0], dz = z - RANGE_AT[1]
  const c = Math.cos(RANGE_TURN), s = Math.sin(RANGE_TURN)
  const lx = dx * c - dz * s, lz = dx * s + dz * c
  return RANGE.feet.some(([fx, fz, r]) => Math.hypot(lx - fx, lz - fz) < r + margin)
}

// ── the trees (world/kodomata/canopy.md, tree.md) ─────────────────────

/** a fixed sequence of numbers in 0..1, so every visit finds the same world */
function dice(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

/** the forest: groves east of the pad, each about 180 m across and 90 m tall: [x, z, turn] */
export const GROVES = (() => {
  const rand = dice(7)
  const out = []
  for (let tries = 0; out.length < 12 && tries < 400; tries++) {
    const bearing = 0.85 + rand() * 1.25, far = 130 + rand() * 360
    const x = PAD[0] + Math.sin(bearing) * far, z = PAD[1] + Math.cos(bearing) * far
    if (!onRange(x, z, 100) && out.every(([ox, oz]) => Math.hypot(ox - x, oz - z) > 110)) out.push([x, z, rand() * Math.PI * 2])
  }
  return out
})()

/** lone trees all around, from near the pad out to the rim: thick near, thin far; none on the
 *  range, the pad or a grove, or in the way of the view from the pad to the range: [x, z, turn, size] */
export const TREES = (() => {
  const rand = dice(23)
  const out = []
  for (let tries = 0; out.length < 64 && tries < 4000; tries++) {
    const bearing = rand() * Math.PI * 2
    // a power of a number in 0..1 crowds them toward the pad
    const far = 95 + 1750 * rand() ** 1.7
    const x = PAD[0] + Math.sin(bearing) * far, z = PAD[1] + Math.cos(bearing) * far
    if (onRange(x, z, 30)) continue
    const off = Math.abs(((bearing - RANGE.bearing + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
    if (off < 0.3 && far < 700) continue
    if (GROVES.some(([gx, gz]) => Math.hypot(gx - x, gz - z) < 105)) continue
    if (out.some(([ox, oz]) => Math.hypot(ox - x, oz - z) < 60)) continue
    out.push([x, z, rand() * Math.PI * 2, 0.75 + 0.6 * rand()])
  }
  return out
})()

/** the trunks, for whatever must walk around them: [x, z, radius]. A grove's three trunks stand
 *  where canopy.md puts them ([x, z, radius] in its own frame), turned with the grove; a lone
 *  tree's trunk (tree.md) is at its origin. The radius takes in the flare of the roots. */
const GROVE_TRUNKS = [[-42, 2, 4.3], [0, -9, 5.2], [41, 5, 4.5]]
const LONE_TRUNK = 3.6
export const TRUNKS = [
  ...GROVES.flatMap(([gx, gz, turn]) => GROVE_TRUNKS.map(([x, z, r]) =>
    [gx + x * Math.cos(turn) + z * Math.sin(turn), gz - x * Math.sin(turn) + z * Math.cos(turn), 1.8 * r])),
  ...TREES.map(([x, z, , size]) => [x, z, 1.8 * LONE_TRUNK * size]),
]

// ── places ─────────────────────────────────────────────────────────────

/** the Monolith, the Kodomata world's chronicle stone (a viewer asset): 30 m from the pad, a little
 *  off the line to the range, so it stands against the mountains as one walks out from the ship.
 *  [x, z]; its three horns and their roots are about 5 m across */
export const MONOLITH = (() => {
  const b = RANGE.bearing + 0.45
  return [PAD[0] + Math.sin(b) * 30, PAD[1] + Math.cos(b) * 30]
})()

/** spots kept clear in the Kodomata world: the pad, where the ship sets down (its arms reach about
 *  6 m out), and the Monolith with room to walk around it */
export const RESERVED = [
  { name: "the Kodomata ship's pad", x0: PAD[0] - 12, z0: PAD[1] - 12, x1: PAD[0] + 12, z1: PAD[1] + 12 },
  { name: "the Monolith", x0: MONOLITH[0] - 4, z0: MONOLITH[1] - 4, x1: MONOLITH[0] + 4, z1: MONOLITH[1] + 4 },
]
