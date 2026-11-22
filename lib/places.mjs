// Places that are not the engine's to build on (world coordinates, meters).
// Shared by the viewer (no pine grows there) and the gate (no built thing
// may cover them). Changing them is The Architect's call, like the terrain.

/** day 0: where the visitor arrives, on the east bank west of the cabin's door */
export const SPAWN_XZ = [9.5, -6]
/** the Drafting Stone, north of the spawn on the bank, clear of the ice */
export const STONE_XZ = [21, 8]

/** the Kodomata ship, crashed in a far pasture west of the river (The Architect, 2026-11-22) */
export const SHIP_XZ = [-60, 64]

/** rectangles kept clear: the stone, the spawn and the ship (its arms reach about 6 m out) */
export const RESERVED = [
  { name: "the Drafting Stone", x0: STONE_XZ[0] - 1.5, z0: STONE_XZ[1] - 1.5, x1: STONE_XZ[0] + 1.5, z1: STONE_XZ[1] + 1.5 },
  { name: "the spawn", x0: SPAWN_XZ[0] - 2, z0: SPAWN_XZ[1] - 2, x1: SPAWN_XZ[0] + 2, z1: SPAWN_XZ[1] + 2 },
  { name: "the Kodomata ship", x0: SHIP_XZ[0] - 9, z0: SHIP_XZ[1] - 9, x1: SHIP_XZ[0] + 9, z1: SHIP_XZ[1] + 9 },
]
