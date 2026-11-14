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

A well can open at its bottom into a tunnel (lib/tunnel.md): `adit` and
`adit2` are doorways cut through the foot of the shaft wall, 1.6 m wide and
2.3 m high, their sill on the bed. Each is an angle in degrees about the
well's own axis, measured from the well's front (0) toward its right (90);
-1, the default, means no doorway. Its `adit` and `adit2` anchors stand in
the middle of each doorway on the outer face of the wall, pointing out: a
tunnel is placed by its `start` on one of them. A well with a doorway keeps
only a shallow pool (the water runs off down the tunnel), and its bucket is
drawn up under the windlass, out of the way of whoever climbs down.

First built in chunk 0_0 on day 3, as the cabin's water; made a library part
on day 7 so the settlement can dig more where it grows; dug deep and widened
by The Architect on day 11.

```moxi
material Stone { color = "#8b8a84" }
material Plank { color = "#9c7a54" }
material Water { color = "#2f4b58" }
material Bark  { color = "#6b4a2f" }
material Split { color = "#8a5f3a" }

thing Well(ro=1.35, ri=1.1, depth=24, adit=-1, adit2=-1) {
    # a doorway's cut, through the foot of the wall; with no doorway (-1) it
    # is left far below the well, where it cuts nothing
    let dw = 1.6
    let dh = 2.3
    let sill = 0.3
    let dy = sill + dh / 2
    let open = adit >= 0 or adit2 >= 0
    let pool = if open { 0.12 } else { 0.6 }
    # with a doorway the bucket is drawn up under the windlass, out of the
    # way of whoever climbs down to walk the tunnel
    let rope = if open { 1.2 } else { 15 }
    # the ring above ground, and the shaft below it, one stone tube
    part Ring   { shape = difference(cylinder(height=0.95, radius=ro), at(cylinder(height=1.75, radius=ri), y=-0.2)), material = Stone }
    part Shaft  {
        shape = difference(
            cylinder(height=depth, radius=ro),
            at(cylinder(height=depth + 0.8, radius=ri), y=-0.2),
            spin(at(box(width=dw, height=dh, depth=1.2), y=if adit >= 0 { dy } else { -40 }, z=(ro + ri) / 2), axis=y, degrees=max(adit, 0)),
            spin(at(box(width=dw, height=dh, depth=1.2), y=if adit2 >= 0 { dy } else { -40 }, z=(ro + ri) / 2), axis=y, degrees=max(adit2, 0))
        ),
        material = Stone
    }
    part Bed    { shape = cylinder(height=0.3, radius=ri), material = Stone }
    part Pool   { shape = cylinder(height=pool, radius=ri), material = Water }
    part PostW  { shape = box(width=0.16, height=2.2, depth=0.16), material = Bark }
    part PostE  { shape = box(width=0.16, height=2.2, depth=0.16), material = Bark }
    part Beam   { shape = box(width=2 * ro, height=0.14, depth=0.16), material = Bark }
    part RoofN  { shape = box(width=2 * ro + 0.4, height=0.08, depth=1.3), material = Plank }
    part RoofS  { shape = box(width=2 * ro + 0.4, height=0.08, depth=1.3), material = Plank }
    part Axle   { shape = cylinder(height=2 * ro - 0.4, radius=0.09), material = Split }
    part Crank  { shape = box(width=0.06, height=0.3, depth=0.06), material = Bark }
    part Rope   { shape = cylinder(height=rope, radius=0.025), material = Split }
    part Bucket { shape = cylinder(height=0.3, radius=0.15), material = Plank }
    anchor floor = Ring.bottom
    anchor adit  = Shaft.side(t=dy / depth, angle=max(adit, 0))
    anchor adit2 = Shaft.side(t=dy / depth, angle=max(adit2, 0))
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
