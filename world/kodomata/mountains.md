# Mountains

The range on the Kodomata's world: three mountains and their foothills,
grown together into one mass. Not buildings and not steps: smooth flanks
that can be hiked from the dunes to the base of each summit horn (the
steepest ground is near 40°), with
root-like ridges running down them and spreading on the ground the way the
forest's trunks do. Every summit ends in a horn that curls over like a claw,
all of them bent the same way; smaller horns grow from two shoulders. A rock
arch 250 m wide stands in front, between the foothills.

It is colored in strata that dip 3° along the range and 2° toward the back:
rust rock with a thin glowing magenta vein, deep purple, a second vein,
mauve, and snow above 285 m, so the summit horns are white.

Caves (all walkable): a gorge at the foot of the main mountain and one at
the foot of the eastern one, each a cleft leading to a chamber; a cave mouth
partway up the main mountain; a summit cave on the western one with a snow
drift on its floor.

About 2.6 km long, 1.6 km deep, the main summit 380 m and its horn's tip
near 500 m. Units: meters. Origin: on the ground under the main summit;
+Z is the front (the side with the arch and the gorges).

Built from components (`lib/rock.md`): a mountain is a list of seven numbers
and every ridge, horn and cave is placed on a mountain by where it sits on
that mountain's flank. To change the range, change the numbers below.

```moxi
from "lib/rock.md" import shape Mountain, shape Horn, shape Arch, shape Gorge, shape Hollow, shape Drift, material Rock, material Snow

# a mountain: [x, z, height, radius, stretch, turn, seed]. a, b, c are the
# mountains (main, west, east); f, g, h the foothills.
shape Massif(a, b, c, f, g, h) = difference(
    union(
        Mountain(a, 8), Mountain(b, 6), Mountain(c, 6),
        Mountain(f, 3), Mountain(g, 3), Mountain(h, 3),
        # horns: (mountain, how far down the flank, which side, length, thickness, lean, curl, which way it bends)
        Horn(a, 0.08, 200, 280, 54, 4, 125, 10),
        Horn(a, 0.33, 150, 130, 28, 10, 110, 10),
        Horn(b, 0.07, 30, 200, 40, 6, 120, 10),
        Horn(c, 0.08, 310, 230, 46, 5, 130, 10),
        Horn(c, 0.4, 60, 110, 24, 12, 105, 10),
        Arch(400, 670, 250, 135, 19, 20),
        blend=30),
    Gorge(a, 82), Hollow(a, 0.4, 110, 34), Hollow(b, 0.12, 100, 24), Gorge(c, 120))

thing Range {
    let a = [0, 0, 380, 720, 1.1, 15, 11]
    let b = [-720, -80, 280, 520, 0.9, -30, 23]
    let c = [720, -40, 320, 600, 1.08, 40, 37]
    let f = [-320, 600, 100, 240, 1.2, 60, 41]
    let g = [620, 740, 70, 200, 0.85, 10, 53]
    let h = [-1000, 380, 120, 270, 1.1, -20, 67]

    part Rock  { shape = Massif(a, b, c, f, g, h), material = Rock }
    part Drift { shape = Drift(b, 0.12, 100, 24), material = Snow }
    relation { Drift.origin on Rock.origin }
    resolve grain = 8
}
print Range detail=low
```

The strata are cut on the built mesh, not written as parts
(`tools/strata.mjs` reads this block; `makers world` runs it): a part has
one material, and the massif cut into one part per layer leaves a groove
along every cut that a hiker cannot cross. Each line is a height (before
the dip) and the material up to it.

```strata
materials lib/rock.md
part Rock
dip 3 2
58  Rock
65  Vein
115 Rock
195 Deep
208 Vein
285 Mauve
*   Snow
```
