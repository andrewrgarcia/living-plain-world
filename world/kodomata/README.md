# The Kodomata world

The plain is not the only world here. West of the river lies the Kodomata's
ship, crashed in a far pasture (`lib/places.mjs`). When the visitor comes
near it mends itself; under its belly they can board it, and it flies them
over everything built on the plain, out of the sky, and down into the
Kodomata's own world. It flies them home the same way.

The Kodomata world is a second world, not a far corner of the plain: its own
ground, sky, light and fog, its own coordinates (meters, the ship's pad at
the origin), and its own inhabitants. It can be opened directly at the
viewer's `/kodomata` page.

## What is there

- **The ground** — warm dunes, flat at the pad, rising into low hills at the
  rim, 4.8 km across. One frozen function, `lib/kodomata.mjs`, like the
  plain's `lib/terrain.mjs`.
- **The range** — `mountains.md`: three mountains and their foothills grown
  into one mass, 2.6 km long, the main summit 380 m. Smooth flanks that can
  be hiked (about 40° at the steepest), ridges like roots, summit horns that
  curl over, a rock arch, two gorges with chambers inside, a cave partway up,
  a summit cave with snow. Its strata (rust, a glowing magenta vein, deep
  purple, mauve, snow) dip across it; they are cut on the built mesh from
  the script's `strata` table. It is written from components,
  `lib/rock.md`: a mountain is seven numbers, and every ridge, horn and cave
  is placed on a mountain's flank.
- **The planet** — `planet.md`: the gas giant's two ring systems, the same
  size and at right angles, khaki and magenta. Its banded body is painted by
  the viewer.
- **The forest** — `canopy.md`: a grove of bone-white trunks under glowing
  magenta nerves, about 180 m across and 90 m tall, twelve of them east of
  the pad; and `tree.md`, a lone tree built from the grove's own parts, 64 of
  them all around.
- **The fruit** — `fruit.md`: a peach half a meter across that the nerves
  bear at their hanging ends. On the trees near the pad it grows, ripens
  and falls, by itself or when the visitor flies up to it; fallen fruit can
  be carried. It is what the Kodomata eat.
- **The Kodomata** — `kodomata.md`: the creature. Three kinds (standard,
  longneck, tumble) and 243 bodies, each grown from one creature's genes.
  The viewer runs them as a living swarm: they walk, blink, meet, say hi to
  each other and to the visitor, mate and are born. They get hungry (never
  starve): a hungry one smells fallen fruit, trots to it and eats, the line
  between its eyes opening into a mouth; it remembers where it ate and
  calls, and the hungry who hear it learn the place. Each has a voice of
  its own, from its genes. The newborn are small and grow up in a few
  minutes, keeping near a parent. Each has two names and a hash; a card
  shows them, and the Tally by the pad counts them all. Each visit finds a
  new swarm; nothing about them is stored.

Where each of these stands is in `lib/kodomata.mjs` (the range's bearing and
distance from the pad, the seeds the groves and the trees are scattered
from). Like everything in the world's nature, it is frozen: a change is The
Architect's, with a new `KODOMATA_VERSION`.

The scripts were designed in Kodomata World, the game the creatures come
from; the copies here are the ones the living plain shows.

## Who builds here

For now, only The Architect. The engine's days are still the plain's: the
gate, the planner's view and the viewer read only the plain's chunks. The
rules for building here are drafted in `RULES.md` ("The Kodomata world"),
and the engine starts building here once those tools read this world too.
