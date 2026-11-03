# Well

A stone well, sized for its visitor (a 1.8 m ring 0.95 m high, roof posts 2.2 m), with a plank roof on two posts and a windlass.
A round stone ring around dark water, two posts carrying a beam, a little
pitched plank roof, an axle with its crank, and a bucket resting on the rim.
Placed by its `floor` anchor (the ring's underside). It needs no plinth on
ground that falls less than 0.1 m under it; choose such a spot.

First built in chunk 0_0 on day 3, as the cabin's water; made a library part
on day 7 so the settlement can dig more where it grows.

```moxi
material Stone { color = "#8b8a84" }
material Plank { color = "#9c7a54" }
material Water { color = "#2f4b58" }
material Bark  { color = "#6b4a2f" }
material Split { color = "#8a5f3a" }

thing Well {
    part Ring   { shape = difference(cylinder(height=0.95, radius=0.9), at(cylinder(height=0.95, radius=0.68), y=0.15)), material = Stone }
    part Pool   { shape = cylinder(height=0.1, radius=0.68), material = Water }
    part PostW  { shape = box(width=0.14, height=2.2, depth=0.14), material = Bark }
    part PostE  { shape = box(width=0.14, height=2.2, depth=0.14), material = Bark }
    part Beam   { shape = box(width=1.8, height=0.14, depth=0.16), material = Bark }
    part RoofN  { shape = box(width=2.1, height=0.08, depth=1.1), material = Plank }
    part RoofS  { shape = box(width=2.1, height=0.08, depth=1.1), material = Plank }
    part Axle   { shape = cylinder(height=1.44, radius=0.08), material = Split }
    part Crank  { shape = box(width=0.06, height=0.3, depth=0.06), material = Bark }
    part Bucket { shape = cylinder(height=0.3, radius=0.15), material = Plank }
    anchor floor = Ring.bottom
    relation {
        Pool.bottom   on Ring.bottom gap=-0.3
        PostW.bottom  on Ring.top shift=(-0.79, 0)
        PostE.bottom  on Ring.top shift=(0.79, 0)
        Beam.bottom   on PostW.top shift=(0.79, 0)
        RoofN.bottom  on Beam.top shift=(0, -0.43) lean=(0, 35)
        RoofS.bottom  on Beam.top shift=(0, 0.43) lean=(0, -35)
        Axle.bottom   on PostW.east shift=(0.6, 0)
        Crank.bottom  on PostE.east shift=(0.6, 0)
        Bucket.bottom on Ring.top shift=(0, 0.79)
    }
    resolve grain = 0.05
}

print Well detail=low
```
