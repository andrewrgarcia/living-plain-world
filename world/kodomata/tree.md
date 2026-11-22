# Tree (a lone tree of the Kodomata's forest)

One trunk of the forest standing by itself, for the open ground around the
groves and the mountains: the same rigid, ridged, bone-white trunk with its
flared roots, and from each of its three limbs a magenta nerve that arches
out and hangs down, ending in the air. The trunk and the nerves are the
grove's own components, imported from `canopy.md`.

About 40 m tall and 60 m across. Units: meters. Origin: on the ground under
the trunk.

```moxi
from "canopy.md" import shape Tree, shape Nerve, material Trunk, material Nerve

# `tip`, `yaw`, `add` and `dir` are the grove's own functions: they come along with its shapes
# where limb j's nerve ends: out past the limb and down
fn hang(t, j)    = add(add(tip(t, j), dir(yaw(t, j) + 25, 0), 17 + 6 * rand(t[5], j, 2)), [0, 1, 0], -9 - 7 * rand(t[5], j, 3))

thing LoneTree {
    # (x, z, height, radius, lean, seed)
    let t = [0, 0, 36, 3.6, 1.4, 5]
    part Trunk { shape = Tree(t), material = Trunk }
    for j in 0..3 {
        part N[j] { shape = Nerve(tip(t, j), hang(t, j), 5, 7, 31 + j), material = Nerve }
        relation { N[j].origin on Trunk.origin }
    }
    resolve grain = 0.4
}
print LoneTree detail=low
```
