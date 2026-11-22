# Grove (look test 2, approved: rigid trunks under a branching nerve canopy)

Three trunks of the alien forest and the nerve canopy between them.

- **Trunks are rigid.** Each is a straight, tapering column with a slight
  lean, ridges and burls on the bark, buttress roots that run down its sides as ridges and spread on the
  ground, and three stiff limbs that fork off the top in two straight
  pieces with an elbow. Joins are tight (`blend=0.7`), so ridges and forks
  keep their edges.
- **Nerves branch.** Each nerve is a wavering arch from one limb tip to
  another, and it carries twigs: every twig is straight pieces that fork
  twice, hanging and spreading at angles drawn from `rand`.

Everything is written in the grove's own frame (x along the grove, y up, z
across), from three numbers per tree: where it stands, how tall, how thick.
Limb tips are functions of those numbers, so a nerve is named by the two
limbs it joins, and moving a tree moves its nerves.

Weight: the build (`makers world canopy`) takes under two minutes; the
game file is about 43k triangles and 213 KB after the pipeline slims it.

Units: meters. Origin: on the ground, under the middle tree.

```moxi
material Trunk { color = "#d9d0c3", roughness = 0.75 }
material Nerve { color = "#d8318f", emissive = 0.7, roughness = 0.5 }

fn dir(yaw, pitch) = [cos(pitch) * cos(yaw), sin(pitch), cos(pitch) * sin(yaw)]
fn add(p, d, s)    = [p[0] + s * d[0], p[1] + s * d[1], p[2] + s * d[2]]

# a tree is (x, z, height, radius, lean, seed); limb j of 3 leaves its top
fn top(t)        = [t[0] + t[4], t[2], t[1]]
fn yaw(t, j)     = 120 * j + 70 * rand(t[5], j)
fn elbow(t, j)   = add(top(t), dir(yaw(t, j), 58), 2.4 * t[3])
fn tip(t, j)     = add(elbow(t, j), dir(yaw(t, j) + 40 * rand(t[5], j, 1) - 20, 30), 3.2 * t[3])

# a wavering arch from p0 to p1, h high in the middle
fn arch(p0, p1, h, u, s) = [
    lerp(p0[0], p1[0], u) + 2.4 * sin(180 * u) * (rand(s, u) - 0.5),
    lerp(p0[1], p1[1], u) + h * sin(180 * u) + 2.4 * sin(180 * u) * (rand(s, u, 1) - 0.5),
    lerp(p0[2], p1[2], u) + 2.4 * sin(180 * u) * (rand(s, u, 2) - 0.5)]

shape Tree(t) = union(
    tube(path=[[t[0], 0, t[1]], [t[0] + 0.3 * t[4], 0.45 * t[2], t[1] + 0.5], top(t)],
         radius=[1.5 * t[3], 1.1 * t[3], t[3], 0.92 * t[3], 0.84 * t[3]]),
    # buttress roots: a ridge down the trunk that spreads on the ground
    for k in 0..6 { tube(path=[
            add([t[0] + 0.25 * t[4], 0.40 * t[2], t[1]], dir(60 * k + 40 * rand(t[5], k, 7), 0), 0.80 * t[3]),
            add([t[0] + 0.10 * t[4], 0.17 * t[2], t[1]], dir(60 * k + 40 * rand(t[5], k, 7), 0), 1.05 * t[3]),
            add([t[0], 0.05 * t[2], t[1]], dir(60 * k + 40 * rand(t[5], k, 7), 0), 1.9 * t[3]),
            add([t[0], -1, t[1]], dir(60 * k + 40 * rand(t[5], k, 7) + 12, 0), (3.0 + 1.2 * rand(t[5], k, 8)) * t[3])],
        radius=[0.14 * t[3], 0.36 * t[3], 0.40 * t[3], 0.18 * t[3]]) },
    # deformities: a few ridges up the bark and two burls, so it is not a rod
    for k in 0..7 { tube(path=[
            add([t[0] + 0.35 * t[4], 0.50 * t[2], t[1]], dir(51 * k + 30 * rand(t[5], k, 9), 0), 0.86 * t[3]),
            add([t[0] + 0.70 * t[4], 0.74 * t[2], t[1]], dir(51 * k + 30 * rand(t[5], k, 9) + 14, 0), 0.80 * t[3]),
            add([t[0] + 0.95 * t[4], 0.97 * t[2], t[1]], dir(51 * k + 30 * rand(t[5], k, 9) + 6, 0), 0.62 * t[3])],
        radius=[0.14 * t[3], (0.24 + 0.14 * rand(t[5], k, 12)) * t[3], 0.2 * t[3]]) },
    for k in 0..4 { at(ellipsoid(rx=(0.3 + 0.2 * rand(t[5], k, 13)) * t[3], ry=(0.45 + 0.3 * rand(t[5], k, 14)) * t[3], rz=(0.3 + 0.2 * rand(t[5], k, 13)) * t[3]),
        x=t[0] + 0.5 * t[4] + 0.8 * t[3] * cos(200 * k + 140 * rand(t[5], k, 10)),
        y=(0.22 + 0.18 * k + 0.1 * rand(t[5], k, 11)) * t[2],
        z=t[1] + 0.8 * t[3] * sin(200 * k + 140 * rand(t[5], k, 10))) },
    # three stiff limbs, each two straight pieces with an elbow
    for j in 0..3 { tube(path=[top(t), elbow(t, j)], radius=[0.74 * t[3], 0.52 * t[3]]) },
    for j in 0..3 { tube(path=[elbow(t, j), tip(t, j)], radius=[0.52 * t[3], 0.34 * t[3]]) },
    blend=0.7)

# a twig: straight pieces that fork twice
shape Twig(p, y, pt, l, s) = union(
    tube(path=[p, add(p, dir(y, pt), l)], radius=[0.62, 0.5]),
    tube(path=[add(p, dir(y, pt), l), add(add(p, dir(y, pt), l), dir(y + 35 + 30 * rand(s, 1), pt - 28), 0.8 * l)], radius=[0.5, 0.45]),
    tube(path=[add(p, dir(y, pt), l), add(add(p, dir(y, pt), l), dir(y - 60 - 30 * rand(s, 2), pt + 22), 0.6 * l)], radius=[0.5, 0.45]),
    tube(path=[add(add(p, dir(y, pt), l), dir(y + 35 + 30 * rand(s, 1), pt - 28), 0.8 * l),
               add(add(add(p, dir(y, pt), l), dir(y + 35 + 30 * rand(s, 1), pt - 28), 0.8 * l), dir(y - 20, pt - 50 * rand(s, 3)), 0.55 * l)], radius=[0.45, 0.45]),
    tube(path=[add(add(p, dir(y, pt), l), dir(y + 35 + 30 * rand(s, 1), pt - 28), 0.8 * l),
               add(add(add(p, dir(y, pt), l), dir(y + 35 + 30 * rand(s, 1), pt - 28), 0.8 * l), dir(y + 95, pt + 30 * rand(s, 4)), 0.5 * l)], radius=[0.45, 0.45]))

# a nerve: an arch from p0 to p1 carrying n twigs
shape Nerve(p0, p1, h, n, s) = union(
    tube(path=[for i in 0..11 { arch(p0, p1, h, i / 10, s) }], radius=[1.7, 1.15, 1.0, 1.15, 1.7]),
    for k in 0..n { Twig(arch(p0, p1, h, (k + 0.6) / n, s), 360 * rand(s, k, 5), 25 - 95 * rand(s, k, 6), 5 + 5 * rand(s, k, 7), s * 17 + k) })

thing Grove {
    # each tree's numbers: (x, z, height, radius, lean, seed)
    let a = [-42, 2, 47, 4.3, 2.0, 1]
    let b = [0, -9, 56, 5.2, -1.5, 2]
    let c = [41, 5, 44, 4.5, 1.2, 3]
    # each limb tip named once (needed on Moxi 0.8.0, where a formula passed
    # straight into a shape was copied into every use; from 0.8.1 a direct
    # `tip(a, 0)` costs the same)
    let ta0 = tip(a, 0)
    let ta1 = tip(a, 1)
    let ta2 = tip(a, 2)
    let tb0 = tip(b, 0)
    let tb1 = tip(b, 1)
    let tb2 = tip(b, 2)
    let tc0 = tip(c, 0)
    let tc1 = tip(c, 1)
    let tc2 = tip(c, 2)

    part Ground { shape = box(width=10, height=1, depth=10), guide }
    part TreeA { shape = Tree(a), material = Trunk }
    part TreeB { shape = Tree(b), material = Trunk }
    part TreeC { shape = Tree(c), material = Trunk }

    # each nerve joins two limbs, or leaves a limb for the next grove
    part N0  { shape = Nerve(ta0, tb1, 9, 14, 11),  material = Nerve }
    part N1  { shape = Nerve(ta1, tc0, 20, 18, 12), material = Nerve }
    part N2  { shape = Nerve(tb0, tc2, 8, 14, 13),  material = Nerve }
    part N3  { shape = Nerve(tb2, ta2, 12, 14, 14), material = Nerve }
    part N4  { shape = Nerve(tc1, tb1, 14, 14, 15), material = Nerve }
    part N5  { shape = Nerve(ta2, [-84, 50, -6], 10, 11, 16), material = Nerve }
    part N6  { shape = Nerve(tc0, [84, 52, 10], 10, 11, 17),  material = Nerve }
    part N7  { shape = Nerve(tb0, [22, 66, -46], 9, 10, 18),  material = Nerve }
    part N8  { shape = Nerve(ta0, tc1, 26, 18, 19), material = Nerve }
    part N9  { shape = Nerve(tb1, [-30, 62, 44], 11, 10, 20), material = Nerve }
    part N10 { shape = Nerve(tc2, [60, 58, -40], 10, 10, 21), material = Nerve }
    part N11 { shape = Nerve(ta1, [-70, 56, 38], 9, 10, 22), material = Nerve }

    relation {
        TreeA.origin on Ground.origin
        TreeB.origin on Ground.origin
        TreeC.origin on Ground.origin
        N0.origin on Ground.origin
        N1.origin on Ground.origin
        N2.origin on Ground.origin
        N3.origin on Ground.origin
        N4.origin on Ground.origin
        N5.origin on Ground.origin
        N6.origin on Ground.origin
        N7.origin on Ground.origin
        N8.origin on Ground.origin
        N9.origin on Ground.origin
        N10.origin on Ground.origin
        N11.origin on Ground.origin
    }
    resolve grain = 0.5
}
print Grove detail=low
```
