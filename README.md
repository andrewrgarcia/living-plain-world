# The living plain

A world written in [Moxi](https://github.com/moxilang/moxi), grown by one edit
a day. An engine reads the world each morning, decides what the place needs
next, makes that one edit, and commits it as a line of the world's history.
The Architect ([@andrewrgarcia](https://github.com/andrewrgarcia)) may step
in at any time; his changes go through the same gate.

There are two worlds. **The plain**: green pastures, a frozen river, pines
and the settlement the engine is growing. **The Kodomata world**: the alien
world the Kodomata's ship, crashed on the plain, flies the visitor to —
dunes, a ringed gas giant, a hikeable range, a forest of nerves, and the
Kodomata themselves (`world/kodomata/README.md`).

- `RULES.md` — how the worlds may grow
- `world/` — everything built: `chunks/X_Z.md` (64 m squares of the plain,
  only where something stands), `lib/` (reusable things), `index.json`;
  `kodomata/` — the Kodomata world's own scripts
- `lib/terrain.mjs` — the plain's ground, river and pines: one frozen function
- `lib/kodomata.mjs` — the Kodomata world's ground, and where its range and
  trees stand: frozen too
- `lib/places.mjs` — spots on the plain no one builds on
- `tools/gate.mjs` — the checks every change must pass (`makers gate`)

Every commit here is a day. `git log` is the chronicle.

Needs Moxi 0.9+ (`cargo install --git https://github.com/moxilang/moxi --tag v0.9.0 --locked moxi`) and Node 18+.
