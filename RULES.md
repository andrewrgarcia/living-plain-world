# Growth rules — draft

Working title: **the living plain**. A world written in Moxi that a scheduled
job edits once a day. Nobody hand-edits the world; people edit these rules.

Status: draft, 2026-10-29 (character added 2026-11-01). Every rule here is open to change by Andrew.

## The world

- **Character.** Green, open, clean: pastures, a frozen river, pines, late
  snow. The first homes are rustic cabins in a Nordic spirit (log walls, sod
  roofs, stone chimneys). Not a modern city, not SimCity: no grids, no
  zoning, no skyscrapers by default. The engine may grow it into much more
  over time (a village, a market, a mill, a harbor, odder things) as long as
  each step grows out of what is already there.
- Day 0: the plain, the river, the snow, the pines, one cabin. Units are
  meters.
- **Human scale.** Everything is built for its visitor, who stands 1.85 m:
  doors at least 2.1 m, walls at least 2.8 m, a house 6–9 m on a side.
- The world is endless and built in chunks (see "The ground and the
  chunks"). Built things live in `world/chunks/X_Z.md`; the things they
  are made of live in `world/lib/` as reusable parts (a wall, a roof, a
  door, a window) and are imported, not copied.

## The ground and the chunks

- **Nature is endless and generated; built things are authored.** The
  ground, the hills, the frozen river, the snow on its banks and the pines
  are generated from one frozen function (`lib/terrain.mjs`), the same
  everywhere, forever. They are never edited and never in a chunk file.
  Everything the engine or The Architect adds is a built thing, in a chunk,
  with a day in the chronicle. The world never fills itself with buildings.
- **One height.** There is exactly one function for the height of the ground
  (`lib/terrain.mjs`); everything set on the ground asks it. It is frozen
  (`TERRAIN_VERSION`): changing it is an Architect intervention that
  re-checks every chunk.
- **Chunks.** The world is a grid of 64 m squares, keyed `X_Z` (chunk `0_0`
  is centered on day 0). Only chunks with something built in them exist as
  files; `world/index.json` lists them. Inside a chunk, coordinates are
  local to its center: +x east, +z south, y up.
- **How a thing is set down.** Each built thing hangs off the chunk's
  `Plot` by its `floor` anchor at y = 0. The viewer sets it on the highest
  ground under its footprint. So every building has a plinth (stone, logs)
  reaching down at least 1.5 m below its floor, and the gate rejects a spot
  whose ground varies more than 1.5 m under the footprint.
- **A thing belongs to the chunk its origin is in** and must fit inside that
  chunk, at least 1 m from its edges. It never stands on the ice, on another
  thing, or on a reserved spot (where the visitor arrives, the Drafting
  Stone: `lib/places.mjs`).
- **Nature yields to building.** No pine grows inside a built thing's
  footprint (plus 3 m).
- **Where the engine builds.** On an ordinary day, in a chunk that already
  has something built, or in its neighbor. Opening a chunk that touches no
  built chunk is a seventh-day move. The settlement grows outward; it does
  not scatter.
- **What the planner reads.** The index, the chunk it is editing and that
  chunk's neighbors, never the whole world: its view stays the same size on
  day 900 as on day 1.

## One day

1. **Planner** reads the index, the `moxi report` of the chunk it means to
   edit and of its neighbors, and the last 30 lines of the chronicle. It writes one sentence of intent: what the place
   needs next, and why. Example: "The east bank has no way across the river."
2. **Builder** makes one edit that serves that sentence. One edit means one of:
   - add one thing (a house, a well, a bridge, a tree line)
   - change one thing that is there
   - add one behavior to one thing that is there
   - on the seventh day only: a structural move (see below)
3. **Gate.** The edited chunk must compile, every built thing in it must be
   one whole piece in `moxi report` (the `Plot` itself is a separate piece),
   it must stand on the ground as the rules above say, and the viewer must
   load it. The checks are `tools/gate.mjs` (`makers gate`), the same for the
   engine and The Architect; `tools/faults.mjs` (`makers faults`) proves they
   still say no to each kind of bad edit. If it fails: one retry with the error. If it fails again,
   the day is skipped and the chronicle says so. A skipped day is kept.
4. **Chronicle.** The commit message is one line of the world's history, in
   plain words: "Day 41: a footbridge across the east bank, for the mill."

## Motion is earned

- A thing moves only if a real one would: doors, gates, windmills, water
  wheels, lamps, flags, water. Walls, benches, rocks, roofs and most of a
  house stay still.
- Most of the world is still at any moment. Stillness is what makes motion
  readable.
- **No chains by default.** One thing does one thing. Rarely, the planner may
  link two things (a bell rings, the gate opens) and only when a real place
  would have that link. A link that only exists to be clever is rejected.
- **No Rube Goldberg machines.** If explaining why something moves needs more
  than one sentence, it doesn't move.

## The clock

- The viewer plays a day: dawn, noon, dusk, night, in a few minutes.
- Behaviors are tied to the hour (doors open at dawn, lamps light at dusk), so
  the world looks alive because things happen at the right time, not because
  many things happen at once.

## The seventh day

Once a week the planner may make one structural move instead of a normal edit:

- start a new area of the plain (a district, a farm, a park, a harbor)
- add a new reusable part to `world/lib/`
- **demolish** something to make room for something better

Demolition is what stops the world from becoming a pile. Growth only, and it
becomes a heap; a world that tears down its granary for an aqueduct is alive.

## The Architect

The engine builds the plain, but it is not alone. **The Architect** (the
plain's owner) may intervene at any time, sporadically or by season: to
correct a mistake, straighten what drifted, or add what he sees fit.

- An intervention is an ordinary commit to the world, authored by him. It
  passes the same gate as any day (compile, report, the viewer loads).
- **An intervention does not make a day.** Its title never starts with
  "Day N:"; it belongs to the day it was made on, and the chronicle lists it
  under that day, credited to The Architect. Only the engine's daily commit
  (built or skipped) advances the count. This keeps provenance: every day
  number is one engine day, and what The Architect touched is visible within
  it.
- The engine never pauses for him and never undoes him: tomorrow's planner
  reads his change like any other and builds on it.
- Nothing is hidden. Every change, his or the engine's, is in the chronicle.

## The chronicle

Who built what is derived from git, never written by hand.
`tools/chronicle.mjs` reads the history of `world/` and writes
`public/chronicle.json`: a commit by the engine's identity is credited to
**the Actions**, any other author to **The Architect**, and each is numbered
by the calendar day since the first commit. The engine regenerates it on
every run, so an intervention made by hand shows up, labeled, the next
morning.

In the world, the chronicle is read at **the Drafting Stone**: a block of
marble with a square, a compass, papers and a pen on it, standing where day
0 began. It belongs to the viewer, not the world: the planner cannot move,
copy or build on it.

## What the visitor can do with things

Three ways a thing in the world can act, so a new thing works without
touching the viewer:

- **Pushable:** a part named `…Door` with a Moxi `joint` swings when the
  visitor walks into it, within the joint's range, and creaks shut.
- **Usable:** Enter within reach, or a click. (The Drafting Stone is the
  first. The builder's `Use…` actions will go through the same door.)
- **Timed:** states named `….Lit` turn on at night.

## What the planner must never do

- name or imitate a real place, brand or person
- edit these rules, the gate, or the workflow
- move, copy or build on the Drafting Stone, or touch the visitor (the pill)
- make more than one edit in a day
- rewrite history (no force-push, no amending past days)

## Open questions for Andrew

- Which model runs the daily job, on the Max subscription (no paid API)
- Day-clock length in the viewer
