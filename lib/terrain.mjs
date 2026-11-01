// The terrain of the living plain — ONE function for the height of the
// ground anywhere, endless, shared by the viewer (which draws it) and the
// build tools (which check where things may stand). Everything placed on
// the ground asks this file; nothing else knows where the ground is.
//
// FROZEN. Things are set down on these heights; changing a number here
// would leave every building floating or buried. A change is a new
// TERRAIN_VERSION, made by The Architect, and every chunk is re-checked.
//
// Deterministic everywhere: the noise is built from integer hashing
// (Math.imul) and + − × ÷ only, which give the same bits on every machine.
// The river's curve uses Math.sin, but only as a smooth curve (no hashing
// amplifies its last digit), so a difference there is far below a millimeter.

export const TERRAIN_VERSION = 1
/** a chunk's side, in meters */
export const CHUNK = 64

// ── noise ──────────────────────────────────────────────────────────────

/** a 32-bit integer hash of (ix, iz, seed), as a number in [0, 1) */
export function hash2(ix, iz, seed) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ Math.imul(seed | 0, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const smooth = (t) => t * t * (3 - 2 * t)

/** smooth value noise in [0, 1) at (x, z), unit cells */
function value(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z)
  const fx = smooth(x - ix), fz = smooth(z - iz)
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed)
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed)
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz
}

// ── the river ──────────────────────────────────────────────────────────

/** the frozen river's centerline: x as a function of z (the day-0 curve, endless) */
export function riverX(z) {
  return 22 * Math.sin(z * 0.024435) + 6 * Math.sin(z * 0.054105 + 0.698132)
}
/** half the ice's width, and where the bank meets the plain (from the centerline) */
export const RIVER = { half: 5.5, bank: 10 }

// ── the ground ─────────────────────────────────────────────────────────

/** the plain before the river: broad swells, gentle rolls, small bumps (meters) */
export function plainHeight(x, z) {
  return 1
    + 5.0 * value(x / 170, z / 170, 1)
    + 1.8 * value(x / 55, z / 55, 2)
    + 0.35 * value(x / 14, z / 14, 3)
}

/** the ice's surface at z (a frozen river is level across) */
export function iceHeight(z) {
  return plainHeight(riverX(z), z) - 0.9
}

/** the height of the ground at (x, z): the plain, carved down to the riverbed near the river */
export function height(x, z) {
  const h = plainHeight(x, z)
  const d = Math.abs(x - riverX(z))
  if (d >= RIVER.bank) return h
  const bed = iceHeight(z) - 0.35
  const t = d <= RIVER.half ? 0 : smooth((d - RIVER.half) / (RIVER.bank - RIVER.half))
  return bed + (h - bed) * t
}

/** is (x, z) on the ice? */
export function onIce(x, z, margin = 0) {
  return Math.abs(x - riverX(z)) < RIVER.half + margin
}

/** the ground's normal at (x, z), from the slope (unit vector [nx, ny, nz]) */
export function normal(x, z, e = 0.5) {
  const dx = height(x + e, z) - height(x - e, z)
  const dz = height(x, z + e) - height(x, z - e)
  const nx = -dx, ny = 2 * e, nz = -dz
  const l = Math.hypot(nx, ny, nz)
  return [nx / l, ny / l, nz / l]
}

/** highest and lowest ground under a footprint (a rectangle, axis-aligned, in world x/z) */
export function footprintRange(x0, z0, x1, z1, step = 0.5) {
  let lo = Infinity, hi = -Infinity
  for (let x = x0; x <= x1 + 1e-9; x += step) for (let z = z0; z <= z1 + 1e-9; z += step) {
    const h = height(x, z)
    if (h < lo) lo = h
    if (h > hi) hi = h
  }
  return { lo, hi }
}

// ── chunks ─────────────────────────────────────────────────────────────

/** "x_z" for the chunk containing world (x, z) */
export function chunkKey(cx, cz) { return `${cx}_${cz}` }
export function chunkOf(x, z) { return [Math.floor(x / CHUNK + 0.5), Math.floor(z / CHUNK + 0.5)] }
/** the world position of a chunk's center */
export function chunkCenter(cx, cz) { return [cx * CHUNK, cz * CHUNK] }
