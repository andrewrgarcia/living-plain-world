# Fruit (the peach of the Kodomata's forest)

What the forest's nerves bear: a plump fruit half a meter across, shaped
like a peach, with the peach's cleft down one side and a blush on its
cheek. It glows a little from inside, so a tree in fruit shows at night.
It hangs by a short magenta stem from the end of a nerve, ripens, and
falls. The Kodomata eat it.

The viewer hangs it and drops it (components/Fruit.tsx): where the fruit
grow is the trees' own doing, not a thing the daily engine places.

Units: meters. Origin: the middle of the fruit; the stem rises from its top.

```moxi
material Flesh { color = "#ffab7a", emissive = 0.35, roughness = 0.55 }
material Blush { color = "#ff5f8f", emissive = 0.3, roughness = 0.6 }
material Stem  { color = "#d8318f", emissive = 1.2, roughness = 0.4 }

thing Fruit(r=0.26) {
    # the body: two lobes side by side, blended, so a cleft runs between them
    part Body {
        shape = union(
            at(ellipsoid(rx=0.76 * r, ry=r, rz=0.95 * r), x=-0.3 * r),
            at(ellipsoid(rx=0.76 * r, ry=r, rz=0.95 * r), x=0.3 * r),
            blend = 0.025),
        material = Flesh
    }
    # the blush on one cheek
    part Cheek { mark = oval(width=0.9 * r, height=1.1 * r), material = Blush }
    # the stem: a short curl of nerve
    part Stem {
        shape = tube(path=[[0, 0.8 * r, 0], [0.02, 1.25 * r, 0.01], [0.06, 1.6 * r, 0]], radius=[0.045, 0.03, 0.02]),
        material = Stem
    }
    relation {
        Cheek on Body.surface(yaw=62, pitch=8)
        Stem.origin on Body.origin
    }
    resolve grain = 0.012
}

print Fruit detail=low
```
