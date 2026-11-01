# Pine

A spruce: a straight trunk and three stacked cones, darker toward the top.
Still: trees do not move in this world.

```moxi
material Bark   { color = "#4a3424" }
material Needle { color = "#2f5a3a" }
material NeedleDark { color = "#24472e" }

thing Pine(height=12) {
    part Trunk { shape = cylinder(height=height * 0.35, radius=height * 0.03), material = Bark }
    part Low   { shape = cone(height=height * 0.45, radius=height * 0.22), material = Needle }
    part Mid   { shape = cone(height=height * 0.38, radius=height * 0.16), material = Needle }
    part Top   { shape = cone(height=height * 0.32, radius=height * 0.10), material = NeedleDark }

    relation {
        Low.bottom on Trunk.top gap=-height * 0.12
        Mid.bottom on Trunk.top gap=height * 0.08
        Top.bottom on Trunk.top gap=height * 0.26
    }

    resolve grain = 0.3
}

print Pine detail=low
```
