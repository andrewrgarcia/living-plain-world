# Well

A deep stone well, sized for its visitor: a ring 2.7 m across and 0.95 m high
around a shaft 2.2 m wide (twice the visitor's width, room to go down without
brushing the walls), dug 24 m deep to dark water. Roof posts 2.2 m, a plank roof,
a windlass, and the bucket hanging on its rope halfway down, against the
wall so it does not block the way down.

The shaft is named `Shaft`: the viewer opens the ground over it, so the
visitor can climb onto the rim and drop down to the water (and fly back out).
Placed by its `floor` anchor (the ring's underside). It needs no plinth on
ground that falls less than 0.1 m under it; choose such a spot.

First built in chunk 0_0 on day 3, as the cabin's water; made a library part
on day 7 so the settlement can dig more where it grows; dug deep and widened
by The Architect on day 11.

```moxi
material Stone { color = "#8b8a84" }
material Plank { color = "#9c7a54" }
material Water { color = "#2f4b58" }
material Bark  { color = "#6b4a2f" }
material Split { color = "#8a5f3a" }

thing Well(ro=1.35, ri=1.1, depth=24) {
    # the ring above ground, and the shaft below it, one stone tube
    part Ring   { shape = difference(cylinder(height=0.95, radius=ro), at(cylinder(height=1.75, radius=ri), y=-0.2)), material = Stone }
    part Shaft  { shape = difference(cylinder(height=depth, radius=ro), at(cylinder(height=depth + 0.8, radius=ri), y=-0.2)), material = Stone }
    part Bed    { shape = cylinder(height=0.3, radius=ri), material = Stone }
    part Pool   { shape = cylinder(height=0.6, radius=ri), material = Water }
    part PostW  { shape = box(width=0.16, height=2.2, depth=0.16), material = Bark }
    part PostE  { shape = box(width=0.16, height=2.2, depth=0.16), material = Bark }
    part Beam   { shape = box(width=2 * ro, height=0.14, depth=0.16), material = Bark }
    part RoofN  { shape = box(width=2 * ro + 0.4, height=0.08, depth=1.3), material = Plank }
    part RoofS  { shape = box(width=2 * ro + 0.4, height=0.08, depth=1.3), material = Plank }
    part Axle   { shape = cylinder(height=2 * ro - 0.4, radius=0.09), material = Split }
    part Crank  { shape = box(width=0.06, height=0.3, depth=0.06), material = Bark }
    part Rope   { shape = cylinder(height=15, radius=0.025), material = Split }
    part Bucket { shape = cylinder(height=0.3, radius=0.15), material = Plank }
    anchor floor = Ring.bottom
    relation {
        Shaft.top     on Ring.bottom
        Bed.top       on Shaft.bottom gap=-0.3
        Pool.bottom   on Bed.top
        PostW.bottom  on Ring.top shift=(-(ro - 0.12), 0)
        PostE.bottom  on Ring.top shift=(ro - 0.12, 0)
        Beam.bottom   on PostW.top shift=(ro - 0.12, 0)
        RoofN.bottom  on Beam.top shift=(0, -0.5) lean=(0, 35)
        RoofS.bottom  on Beam.top shift=(0, 0.5) lean=(0, -35)
        Axle.bottom   on PostW.east shift=(0.6, 0)
        Crank.bottom  on PostE.east shift=(0.6, 0)
        Rope.top      on Beam.bottom shift=(0.8, 0)
        Bucket.top    on Rope.bottom
    }
    resolve grain = 0.05
}

print Well detail=low
```
