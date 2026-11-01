// Places that are not the engine's to build on (world coordinates, meters).
// Shared by the viewer (no pine grows there) and the gate (no built thing
// may cover them). Changing them is The Architect's call, like the terrain.

/** day 0: where the visitor arrives, on the east bank west of the cabin's door */
export const SPAWN_XZ = [9.5, -6]
/** the Drafting Stone, north of the spawn on the bank, clear of the ice */
export const STONE_XZ = [21, 8]

/** rectangles kept clear: the stone and the spawn */
export const RESERVED = [
  { name: "the Drafting Stone", x0: STONE_XZ[0] - 1.5, z0: STONE_XZ[1] - 1.5, x1: STONE_XZ[0] + 1.5, z1: STONE_XZ[1] + 1.5 },
  { name: "the spawn", x0: SPAWN_XZ[0] - 2, z0: SPAWN_XZ[1] - 2, x1: SPAWN_XZ[0] + 2, z1: SPAWN_XZ[1] + 2 },
]
