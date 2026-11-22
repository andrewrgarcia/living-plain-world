# Planet

The gas giant in the Kodomata's sky (REDESIGN.md, the planet): an opaque
world with two ring systems of the same size on planes at right angles. Both
are wide flat discs around the planet with the same inner and outer radius,
so they pass through each other along a shared diameter: one khaki, one
magenta, each split into ringlets by thin gaps.

This file is the rings and a plain body. The body's bands are painted by the
viewer (The Living Plain, `components/Kodomata.tsx`): soft purple, lilac and
cream bands that fade into each other with wavering edges, which Andrew
prefers (2026-11-22) to bands cut as flat-colored parts; a part has one
color, so a gradient across a part is not something this script can say.

It hangs in the sky, far off; the viewer places and scales it (not
collidable). Units: planet radii (the planet is 2 across).

```moxi
material Deep    { color = "#6a3f8f", roughness = 0.9 }
material RingK   { color = "#c8b27a", opacity = 0.85, roughness = 0.6 }
material RingM   { color = "#c2378f", opacity = 0.8, roughness = 0.6 }

# the ringlets: both systems share these radii (inner edge, width)
fn ring_r(i) = 1.45 + 0.26 * i
fn ring_w(i) = 0.21 - 0.03 * i

thing Planet(ringlets=4) {
    part Body { shape = sphere(radius=1.0), material = Deep }

    # the khaki system: flat around the equator
    for i in 0..ringlets {
        part Flat[i] { shape = difference(cylinder(height=0.02, radius=ring_r(i) + ring_w(i)), at(cylinder(height=0.06, radius=ring_r(i)), y=-0.02)), material = RingK }
        relation { Flat[i].center on Body.center gap=0 }
    }

    # the magenta system: the same radii, upright, at right angles to the khaki one
    for i in 0..ringlets {
        part Upright[i] { shape = spin(difference(cylinder(height=0.02, radius=ring_r(i) + ring_w(i)), at(cylinder(height=0.06, radius=ring_r(i)), y=-0.02)), axis=x, degrees=90), material = RingM }
        relation { Upright[i].center on Body.center gap=0 }
    }

    resolve grain = 0.012
}
```
