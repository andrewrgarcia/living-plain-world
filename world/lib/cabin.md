# Cabin

A small Nordic log cabin with a sod roof, a stone chimney and a plank door.
Hollow: a doorway in the front wall, a floor, room to stand inside. It
stands on a stone plinth that reaches down 1.6 m, so on a slope the
downhill side never floats. Placed by its `floor` anchor (the floor's
underside), which the viewer sets on the highest ground under it.

It earns two behaviors:
- the door hangs on its hinge (`joint Door`): walk into it and it swings,
  either way, within its range; left alone it creaks shut. `Open`/`Close`
  play the same swing as clips.
- the windows light at night (state `Lit`).

```moxi
material Log    { color = "#6b4a2f" }
material Sod    { color = "#5d7a3a" }
material Stone  { color = "#7c7a74" }
material Plank  { color = "#8a5f3a" }
material Glass  { color = "#2b2f36", roughness = 0.2 }
material Frame  { color = "#e8e2d4" }

thing Cabin(w=5, h=2.8, d=4, wall=0.2, dw=0.95, dh=2.0) {
    # walls, floor and ceiling: a box with its inside and a doorway cut out
    part Body {
        shape = difference(
            box(width=w, height=h, depth=d),
            box(width=w - 2 * wall, height=h - 0.3, depth=d - 2 * wall),
            at(box(width=dw + 0.05, height=dh + 0.02, depth=wall * 3), y=-h / 2 + 0.18 + dh / 2, z=d / 2)
        ),
        material = Log
    }

    # sod roof: the upper half of a flattened diamond, overhanging the walls
    let r = w * 0.92
    part Roof {
        shape = intersect(
            at(box(width=r * 2, height=r, depth=d + 1), y=r / 2),
            scale(spin(box(width=r, height=r, depth=d + 0.8), axis=z, degrees=45), y=0.5)
        ),
        material = Sod
    }
    part Chimney { shape = box(width=0.7, height=h * 0.9, depth=0.7), material = Stone }
    part Plinth  { shape = box(width=w + 0.4, height=1.6, depth=d + 0.4), material = Stone }

    # the doorstep, and the door hung on its hinge: a point at its bottom
    # hinge corner, so `twist` turns it about that corner's upright
    part Step { shape = box(width=1.3, height=0.18, depth=0.5), material = Stone }
    part Door { shape = box(width=dw, height=dh, depth=0.08), material = Plank }

    # windows on both sides, each a frame with dark glass
    part FrameE { shape = box(width=0.08, height=0.9, depth=1.0), material = Frame }
    part PaneE  { shape = box(width=0.06, height=0.75, depth=0.85), material = Glass }
    part FrameW { shape = box(width=0.08, height=0.9, depth=1.0), material = Frame }
    part PaneW  { shape = box(width=0.06, height=0.75, depth=0.85), material = Glass }

    relation {
        Roof.bottom    on Body.top
        Plinth.top     on Body.bottom
        Chimney.bottom on Body.top shift=(w * 0.28, -d * 0.15) gap=-0.2
        Step.south     on Body.north shift=(-(h / 2) + 0.09, 0)
        Door.point(x=-dw / 2, y=-dh / 2, z=0, nx=0, ny=-1, nz=0)
            on Step.point(x=-dw / 2, y=0.09, z=-0.25 + wall / 2, nx=0, ny=1, nz=0)
        FrameE.west    on Body.east shift=(0.2, 0)
        PaneE.west     on FrameE.east gap=-0.05
        FrameW.east    on Body.west shift=(0.2, 0)
        PaneW.east     on FrameW.west gap=-0.05
    }

    anchor floor = Body.bottom

    joint Door { twist=-110..110 }
    pose Opened { Door twist=-95 }
    animate Open  { 0 rest  1.4 Opened }
    animate Close { 0 Opened  1.4 rest }

    state Lit { Glass.color = "#ffc46b"  Glass.emissive = 1.6 }

    resolve grain = 0.05
}

print Cabin detail=low
```
