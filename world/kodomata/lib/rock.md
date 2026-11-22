# Rock: the parts a Kodomata mountain is made of

Components for `../mountains.md` (and any later range): import the shapes
and call them with a mountain's numbers. Nothing here is drawn on its own.

A mountain is a list `m = [x, z, height, radius, stretch, turn, seed]`: where
its axis stands, how high and how wide it is, how much it is stretched along
one side (1 is round) and turned, and the seed its ridges are drawn from.
Every component takes `m` and works in that mountain's own frame, so a cave
or a horn stays on its mountain when the mountain's numbers change.

- `Mountain(m, ridges)`: the body, a smooth cone with a hollow flank (gentle
  at the foot, steep at the top), and `ridges` root-like ridges that run down
  it and spread on the ground. The flank is steepest at the top, where it rises
  1.5 × height / radius: with a radius of 1.8 times the height or more it
  stays near 40° at its steepest, so it can be hiked all the way up.
- `Horn(m, q, a, len, thick, lean, curl, yaw)`: a spire that grows out of the
  flank at (`q` of the radius, angle `a`) and curls over like a claw.
- `Arch(x, z, span, rise, thick, turn)`: a free-standing rock arch.
- `Gorge(m, a)`: a cut to carve away: a cleft at the foot at angle `a` that
  leads to a chamber inside.
- `Hollow(m, q, a, size)`: a cut: a cave in the flank whose mouth is at (`q`, `a`)
  and whose floor runs level into the mountain.
- `Drift(m, q, a, size)`: the snow on a hollow's floor.
- `Band(lo, hi)`: the slab of space between two heights:
  `intersect(Band(lo, hi), whole)` is one stratum of the whole.

Units: meters. +Y up.

```moxi
material Rock  { color = "#8a4c22", roughness = 0.95 }
material Deep  { color = "#55296e", roughness = 0.9 }
material Vein  { color = "#c2378f", emissive = 0.35, roughness = 0.7 }
material Mauve { color = "#8c5a88", roughness = 0.9 }
material Snow  { color = "#d9d9d6", roughness = 0.7 }

# the flank: the height (as a fraction of the mountain's) at q of its radius
fn flank(q) = 0.5 * (1 - q) + 0.5 * pow(max(1 - q, 0), 2)
# the point on the flank at (q, angle a), in the mountain's frame, lifted by dy
fn fp(m, q, a, dy) = [m[3] * q * cos(a), m[2] * flank(q) - 10 + dy, m[3] * q * sin(a)]

# ridge k: where it starts, how it wanders round the mountain on the way down, how thick it is
fn ridge_a(m, n, k, q) = 360 / n * k + 40 * rand(m[6], k) + (30 + 50 * rand(m[6], k, 1)) * q + 9 * sin(360 * q + 360 * rand(m[6], k, 2))
fn ridge_q(m, k, i)    = 0.06 + 0.2 * rand(m[6], k, 3) + (1.04 - 0.06 - 0.2 * rand(m[6], k, 3)) * i / 5
fn ridge_r(m, k, u)    = m[3] * (0.03 + (0.05 + 0.04 * rand(m[6], k, 4)) * u)

shape Body(m, ridges) = union(
    lathe(profile=[for i in 0..13 { [m[3] * (1 - i / 12), m[2] * flank(1 - i / 12) - 10] }]),
    for k in 0..ridges { tube(
        path=[for i in 0..6 { fp(m, ridge_q(m, k, i), ridge_a(m, ridges, k, ridge_q(m, k, i)), -0.45 * ridge_r(m, k, i / 5)) }],
        radius=[ridge_r(m, k, 0), ridge_r(m, k, 0.25), ridge_r(m, k, 0.5), ridge_r(m, k, 0.75), ridge_r(m, k, 1)]) },
    blend=m[3] * 0.05)

shape Mountain(m, ridges) = at(spin(scale(Body(m, ridges), x=m[4], z=1 / m[4]), axis=y, degrees=m[5]), x=m[0], z=m[1])

# a horn: an arc that leaves the flank leaning `lean` from upright and bends `curl` more, toward `yaw`
fn horn(p, len, lean, curl, yaw, t) = [
    p[0] + len * 57.3 / curl * (cos(lean) - cos(lean + curl * t)) * cos(yaw),
    p[1] + len * 57.3 / curl * (sin(lean + curl * t) - sin(lean)),
    p[2] + len * 57.3 / curl * (cos(lean) - cos(lean + curl * t)) * sin(yaw)]

shape Horn(m, q, a, len, thick, lean, curl, yaw) = at(spin(scale(
    tube(path=[for i in 0..9 { horn(fp(m, q, a, -0.8 * thick), len, lean, curl, yaw, i / 8) }],
         radius=[thick, 0.86 * thick, 0.66 * thick, 0.42 * thick, 0.16 * thick]),
    x=m[4], z=1 / m[4]), axis=y, degrees=m[5]), x=m[0], z=m[1])

shape Arch(x, z, span, rise, thick, turn) = at(spin(
    tube(path=[for i in 0..9 { [-0.5 * span * cos(22.5 * i), rise * sin(22.5 * i) - 0.25 * thick, 0] }],
         radius=[1.9 * thick, 1.2 * thick, thick, 0.9 * thick, 1.5 * thick]),
    axis=y, degrees=turn), x=x, z=z)

# cuts, in the mountain's frame
shape Gorge(m, a) = at(spin(scale(union(
        tube(path=[[m[3] * 1.02 * cos(a), 7, m[3] * 1.02 * sin(a)], [m[3] * 0.8 * cos(a + 4), 9, m[3] * 0.8 * sin(a + 4)], [m[3] * 0.6 * cos(a), 12, m[3] * 0.6 * sin(a)]],
             radius=[19, 14, 15]),
        at(ellipsoid(rx=34, ry=17, rz=34), x=m[3] * 0.57 * cos(a), y=16, z=m[3] * 0.57 * sin(a)),
        blend=4),
    x=m[4], z=1 / m[4]), axis=y, degrees=m[5]), x=m[0], z=m[1])

shape Hollow(m, q, a, size) = at(spin(scale(
    at(ellipsoid(rx=size, ry=0.38 * size, rz=size), x=m[3] * (q - 0.07) * cos(a), y=m[2] * flank(q) - 10 + 0.3 * size, z=m[3] * (q - 0.07) * sin(a)),
    x=m[4], z=1 / m[4]), axis=y, degrees=m[5]), x=m[0], z=m[1])

shape Drift(m, q, a, size) = at(spin(scale(
    at(ellipsoid(rx=0.7 * size, ry=0.36 * size, rz=0.7 * size), x=m[3] * (q - 0.07) * cos(a), y=m[2] * flank(q) - 10 - 0.36 * size, z=m[3] * (q - 0.07) * sin(a)),
    x=m[4], z=1 / m[4]), axis=y, degrees=m[5]), x=m[0], z=m[1])

# a stratum: everything between two heights (flat: a range dips its strata by
# tilting itself into the slab and back, which keeps each stratum's box small)
shape Band(lo, hi) = at(box(width=9000, height=hi - lo, depth=9000), y=(lo + hi) / 2)
```
