# Lantern post

A lantern hung from the arm of a log post on a stone foot, for a path, a
door or a well that is used after dark: the post `h` tall (2.6 m by
default, so the lantern hangs above the visitor's head), the arm reaching
`reach` out from it, an iron cap and base around the glass. Its glass is lit
at dusk (`Lit`).

Placed by its `floor` anchor (the post's foot at ground level; the stone
foot is sunk 0.65 m below it). It is small: set it on ground that falls
less than 0.1 m under it, and it needs no plinth.

First set up in chunk 0_0 on day 12, on the path from the cabin's door to
the well; made a library part on day 28, so every path and door the plain
grows can have its own light.

```moxi
material Stone { color = "#7c7a74" }
material Bark  { color = "#6b4a2f" }
material Iron  { color = "#3a3a3a" }
material Flame { color = "#e8b04a", emissive = 0 }

thing LanternPost(h=2.6, reach=0.55) {
    part Foot  { shape = box(width=0.5, height=0.9, depth=0.5), material = Stone }
    part Post  { shape = cylinder(height=h, radius=0.08), material = Bark }
    part Arm   { shape = box(width=reach + 0.1, height=0.08, depth=0.08), material = Bark }
    part Hook  { shape = cylinder(height=0.14, radius=0.015), material = Iron }
    part Cap   { shape = cone(height=0.16, radius=0.15), material = Iron }
    part Glass { shape = box(width=0.2, height=0.26, depth=0.2), material = Flame }
    part Base  { shape = box(width=0.24, height=0.04, depth=0.24), material = Iron }
    anchor floor = Post.bottom
    relation {
        Foot.top     on Post.bottom gap=-0.25
        Arm.west     on Post.side(t=0.95, angle=90) gap=-0.08
        Hook.top     on Arm.bottom shift=(reach / 2 - 0.05, 0)
        Cap.apex     on Hook.bottom gap=-0.02
        Glass.top    on Cap.bottom gap=-0.01
        Base.top     on Glass.bottom
    }
    state Lit { Flame.emissive = 2.5 }
    resolve grain = 0.05
}

print LanternPost detail=low
```
