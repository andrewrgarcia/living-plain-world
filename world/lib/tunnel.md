# Tunnel

A gallery dug underground from the foot of a well, the way a qanat (kārīz,
kariz) carries water: a chain of wells sunk along a line, joined at the
bottom by a gently sloping tunnel, so the water and whoever goes down a well
can walk from one shaft to the next without coming up. Inside it is 1.6 m
wide and 2.3 m high, the walls of packed earth, a runnel of water down the
middle of the floor, and a small clay lamp on a ledge in the right-hand wall
about every 8 m.

Placed by its `start` anchor on a well's doorway (lib/well.md: `Well(adit=…)`
and its `adit` or `adit2` anchor), e.g.

    part Run { thing = Tunnel(run=30.5, rise=0.5) }
    relation { Run.start on Spring.adit }

and it runs straight out of the doorway. `run` is its length over the ground
in metres; `rise` is how far its far end's floor is above its start's (below,
if negative). Up to a slope of 1 in 8 the floor is one even slope; anything
steeper is dug as level stretches with a step of at most 0.25 m between
them. Its `end` anchor is the middle of its far opening.

To join two wells, open a doorway in each facing the other and run the
tunnel from one doorway to the other: `run` is the distance between the two
wells' centers less 2.7 m (both walls), `rise` the difference of their
grounds (the floors lie 23.7 m below each well's ground). A tunnel that
crosses into the next chunk is dug as two halves, one from each well, each
ending exactly on the chunk's edge, at the same height, so the two meet.

```moxi
material Earth  { color = "#6e5a44" }
material Water  { color = "#2f4b58" }
material Clay   { color = "#9a6b4a" }
material Flame  { color = "#e8b04a", emissive = 0 }

thing Tunnel(run=10, rise=0, w=1.6, h=2.3, wall=0.3, every=8) {
    # one even slope up to 1 in 8; steeper, level stretches with steps
    let steep = abs(rise) > run / 8
    let steps = if steep { floor(abs(rise) / 0.25 + 0.999) } else { 0 }
    let n     = steps + 1
    let step  = if steep { rise / steps } else { 0 }
    # a slope is dug along its own length, a little longer than its run
    let len   = if steep { run / n } else { sqrt(run * run + rise * rise) }
    # the slope's angle (atan, to well under a hundredth of a degree here)
    let g     = if steep { 0 } else { rise / run }
    let slope = 57.29578 * g / (1 + 0.28 * g * g)
    let lamps = max(1, floor(run / every))

    part Mouth { shape = box(width=w + 2 * wall, height=h + 2 * wall, depth=0.02), material = Earth }
    part Gallery[0] {
        shape = difference(box(width=w + 2 * wall, height=h + 2 * wall, depth=len), box(width=w, height=h, depth=len + 0.4)),
        material = Earth
    }
    part Runnel[0] { shape = box(width=0.4, height=0.04, depth=len), material = Water }
    anchor start = Mouth.south
    relation {
        Gallery[0].south on Mouth.north lean=(slope, 0)
        Runnel[0].top on Gallery[0].bottom gap=-(wall + 0.02)
    }
    for k in 1..n {
        part Gallery[k] {
            shape = difference(box(width=w + 2 * wall, height=h + 2 * wall, depth=len), box(width=w, height=h, depth=len + 0.4)),
            material = Earth
        }
        part Runnel[k] { shape = box(width=0.4, height=0.04, depth=len), material = Water }
        relation {
            Gallery[k].south on Gallery[k - 1].north shift=(step, 0)
            Runnel[k].top on Gallery[k].bottom gap=-(wall + 0.02)
        }
    }
    # a lamp on a ledge in the right-hand wall about every `every` metres
    for j in 0..lamps {
        let at   = (j + 0.5) * run / lamps
        let seg  = min(n - 1, floor(at / len))
        part Niche[j] { shape = box(width=0.3, height=0.06, depth=0.3), material = Clay }
        part Lamp[j]  { shape = box(width=0.12, height=0.14, depth=0.12), material = Flame }
        relation {
            Niche[j].east on Gallery[seg].east gap=-(wall + 0.15) shift=(0.3, at - seg * len - len / 2)
            Lamp[j].bottom on Niche[j].top
        }
    }
    anchor end = Gallery[n - 1].north
    state Lit { Flame.emissive = 2.5 }
    resolve grain = 0.05
}

print Tunnel detail=low
```
