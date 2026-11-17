# Woodpile

Split logs stacked between two stakes on a bark sleeper, for a stove, a
hearth or a sauna: three rows of seven by default, 1.8 m long, 0.7 m deep and
about 1.1 m tall at its stakes. `rows` and `per` stack more or fewer logs,
`r` is a log's radius and `step` the spacing along the row.

Placed by its `floor` anchor (the sleeper's underside). It is small and low:
set it on ground that falls less than 0.1 m under it, and it needs no plinth.

First stacked in chunk 0_0 on day 1, for the cabin's stove, and restacked as
real split logs on day 5; made a library part on day 21, so every hearth the
plain grows can keep its own wood.

```moxi
material Split { color = "#8a5f3a" }
material Bark  { color = "#6b4a2f" }

thing Woodpile(rows=3, per=7, r=0.12, step=0.22) {
    part Bed    { shape = box(width=1.8, height=0.08, depth=0.7), material = Bark }
    part StakeW { shape = box(width=0.1, height=1.1, depth=0.1), material = Bark }
    part StakeE { shape = box(width=0.1, height=1.1, depth=0.1), material = Bark }
    anchor floor = Bed.bottom
    relation {
        StakeW.bottom on Bed.top shift=(-0.85, 0) gap=-0.08
        StakeE.bottom on Bed.top shift=(0.85, 0) gap=-0.08
    }
    for k in 0..rows * per {
        let row = floor(k / per)
        let col = k - row * per
        part Log[k] { shape = spin(at(cylinder(height=0.62, radius=r), y=-0.31), axis=x, degrees=90), material = Split }
        relation { Log[k].center on Bed.point(x=(col - (per - 1) / 2) * step, y=0.04 + r - 0.01 + row * (2 * r - 0.03), z=0, nx=0, ny=1, nz=0) }
    }
    resolve grain = 0.05
}

print Woodpile detail=low
```
