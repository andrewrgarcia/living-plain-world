# The living plain

A world written in [Moxi](https://github.com/moxilang/moxi), grown by one edit
a day. An engine reads the world each morning, decides what the place needs
next, makes that one edit, and commits it as a line of the world's history.
The Architect ([@andrewrgarcia](https://github.com/andrewrgarcia)) may step
in at any time; his changes go through the same gate.

- `RULES.md` — how the world may grow
- `world/` — everything built: `chunks/X_Z.md` (64 m squares, only where
  something stands), `lib/` (reusable things), `index.json`
- `lib/terrain.mjs` — the ground, the river and the pines: one frozen function
- `tools/gate.mjs` — the checks every change must pass (`makers gate`)

Every commit here is a day. `git log` is the chronicle.

Needs Moxi 0.7+ (`cargo install moxi`) and Node 18+.
