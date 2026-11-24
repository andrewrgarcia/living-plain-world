# Kodomata

The creature of Kodomata World, written in Moxi, after the 2D Kodomata art and
the cute formula (baby schema): a big round head with a high forehead, big
glossy eyes set low and wide apart (a white shine above, a cyan glow below),
blush, and no mouth: a thin connector line joins the two eyes and sometimes
reads as a smile. Two pegs with soft cyan caps on top. A small chubby block
body with a cyan diamond on its chest, soft block arms held out, short thick
block legs. The pink and cyan are the 2D art's, softened for 3D. The face
and the diamond are paint (Moxi marks), flat on the skin like the 2D art's;
the pegs and their caps stay solid.

Every Kodomata is this one thing. Seven parameters shape it: three set the
body plan of its kind (`neck`, `head`, `tall`) and four are drawn genes
(`leg` Speed, `eye` Curiosity, `peg` SignalAffinity, `girth` Metabolism).
The defaults are the standard kind's standard body. `tools/morphs.mjs` holds
the three kinds (standard pink, longneck pale, tumble light purple) and
writes one catalog per kind (`assets/morphs/`), instancing this
thing once per genotype bin; the viewer picks the kind and bin from each
creature's genome (`lib/morph.ts`). What a creature does with its body over
its life (hunger, fear, aggression: the epigenetics) the viewer paints on
top: squash and tint, not geometry.

Origin: the center of the head. Front is +z. Units: meters; about 1 m tall.

```moxi
material Skin  { color = "#f49ccd", roughness = 0.45 }
material Cap   { color = "#b4ecf6", roughness = 0.35 }
material Gem   { color = "#8fdcf2", emissive = 0.35, metalness = 0.2, roughness = 0.15 }
material Ink   { color = "#26223f", roughness = 0.2 }
material Shine { color = "#ffffff", roughness = 0.1 }
material Glass { color = "#6fd0ec", roughness = 0.2 }
material Blush { color = "#f8b9d8", roughness = 0.9 }

thing Kodomata(leg=0.17, eye=0.108, peg=0.155, girth=1.28, neck=0, head=1.0, tall=1.0) {
    # the cute formula (baby schema): a big round head with a high forehead,
    # big eyes set low and wide apart, almost no mouth, round cheeks, a small
    # chubby body with short thick limbs, soft edges everywhere

    # where the connector line sits: across the front of the head, at the
    # height of the eyes' lower inner edges
    let line_y = -0.142 * head
    # each half of the line, centered about a quarter of the way along the
    # arc; the halves overlap a little at the middle
    let half = 0.0480 * head
    let arc_y = line_y - 0.012 + 0.0042
    let arc_z = 0.36 * head * sqrt(1 - pow(half / (0.42 * head), 2) - pow(arc_y / (0.33 * head), 2))

    part Head  { shape = ellipsoid(rx=0.42 * head, ry=0.33 * head, rz=0.36 * head), material = Skin }
    # the neck: hidden inside the head and torso at neck=0, a long neckline when raised
    part Neck  { shape = capsule(height=neck + 0.02, radius=0.085 + 0.12 * neck), material = Skin }
    part Torso { shape = box(width=0.40 * girth, height=0.26 * tall, depth=0.30 * girth, round=0.11), material = Skin }
    # the gem on the chest: a diamond painted on the front of the torso
    part Jewel { mark = poly(points=[[0, 0.072], [0.072, 0], [0, -0.072], [-0.072, 0]]), material = Gem }

    # face, all paint (marks): big glossy eyes low on the head (a white
    # shine above, a cyan glow below, both painted on the eye), blush, and a
    # thin connector line that joins the two eyes and sometimes reads as a
    # smile
    part EyeR   { mark = oval(width=eye * 2, height=eye * 2.4), material = Ink }
    part EyeL   { mark = oval(width=eye * 2, height=eye * 2.4), material = Ink }
    part ShineR { mark = oval(width=eye * 0.84, height=eye * 1.0), material = Shine }
    part ShineL { mark = oval(width=eye * 0.84, height=eye * 1.0), material = Shine }
    part GlowR  { mark = oval(width=eye * 1.16, height=eye * 0.72), material = Glass }
    part GlowL  { mark = oval(width=eye * 1.16, height=eye * 0.72), material = Glass }
    part CheekR { mark = oval(width=0.12, height=0.064), material = Blush }
    part CheekL { mark = oval(width=0.12, height=0.064), material = Blush }
    # the connector: a shallow arc, 0.22 wide (times the head), its ends
    # 0.022 higher than its middle; drawn as two halves (a poly must go once
    # round its own middle, and a whole arc this curved does not)
    # the mouth: hidden inside the connector line until it eats, when the
    # line opens into a round dark mouth (pose Open)
    part Mouth  { mark = oval(width=0.12 * head, height=0.005), material = Ink }
    part LineR  { mark = poly(points=[[0.062 * head, 0.0024], [0.0443 * head, 0.002], [0.0266 * head, 0.0028], [0.0089 * head, 0.0048], [-0.0089 * head, 0.0079], [-0.0266 * head, 0.0121], [-0.0443 * head, 0.0175], [-0.062 * head, 0.024], [-0.062 * head, 0.0116], [-0.0443 * head, 0.0051], [-0.0266 * head, -0.0003], [-0.0089 * head, -0.0045], [0.0089 * head, -0.0076], [0.0266 * head, -0.0096], [0.0443 * head, -0.0104], [0.062 * head, -0.01]]), material = Ink }
    part LineL  { mark = poly(points=[[-0.062 * head, -0.01], [-0.0443 * head, -0.0104], [-0.0266 * head, -0.0096], [-0.0089 * head, -0.0076], [0.0089 * head, -0.0045], [0.0266 * head, -0.0003], [0.0443 * head, 0.0051], [0.062 * head, 0.0116], [0.062 * head, 0.024], [0.0443 * head, 0.0175], [0.0266 * head, 0.0121], [0.0089 * head, 0.0079], [-0.0089 * head, 0.0048], [-0.0266 * head, 0.0028], [-0.0443 * head, 0.002], [-0.062 * head, 0.0024]]), material = Ink }

    # two pegs on top with soft cyan caps; `peg` sets how tall
    part PegR { shape = box(width=0.1, height=peg, depth=0.1, round=0.035), material = Skin }
    part PegL { shape = box(width=0.1, height=peg, depth=0.1, round=0.035), material = Skin }
    part CapR { shape = box(width=0.115, height=0.06, depth=0.115, round=0.03), material = Cap }
    part CapL { shape = box(width=0.115, height=0.06, depth=0.115, round=0.03), material = Cap }

    # soft block arms held out, short thick block legs; `leg` sets how tall it stands
    part ArmR { shape = box(width=0.11, height=0.16 * tall, depth=0.12, round=0.05), material = Skin }
    part ArmL { shape = box(width=0.11, height=0.16 * tall, depth=0.12, round=0.05), material = Skin }
    part LegR { shape = box(width=0.14 * girth, height=leg, depth=0.15, round=0.055), material = Skin }
    part LegL { shape = box(width=0.14 * girth, height=leg, depth=0.15, round=0.055), material = Skin }

    relation {
        Neck.top     on Head.bottom gap=-0.09
        Torso.top    on Neck.bottom gap=-0.17
        Jewel on Torso.north

        EyeR   on Head.surface(yaw=-26, pitch=-10)
        EyeL   on Head.surface(yaw=26, pitch=-10)
        # a mark on a mark: shift=(along its height, across it)
        ShineR on EyeR.center shift=(eye * 0.45, -eye * 0.3)
        ShineL on EyeL.center shift=(eye * 0.45, -eye * 0.3)
        GlowR  on EyeR.center shift=(-eye * 0.68, 0)
        GlowL  on EyeL.center shift=(-eye * 0.68, 0)
        CheekR on Head.surface(yaw=-50, pitch=-27)
        CheekL on Head.surface(yaw=50, pitch=-27)
        Mouth  on Head.point(x=0, y=line_y - 0.002, z=0.36 * head * sqrt(1 - pow(line_y / (0.33 * head), 2)), nx=0, ny=0, nz=1)
        LineR  on Head.point(x=-half, y=arc_y, z=arc_z, nx=0, ny=0, nz=1)
        LineL  on Head.point(x=half, y=arc_y, z=arc_z, nx=0, ny=0, nz=1)

        PegR.bottom on Head.surface(yaw=-34, pitch=55) gap=-0.04 aim=up facing=north lean=(-16, 0)
        PegL.bottom on Head.surface(yaw=34, pitch=55) gap=-0.04 aim=up facing=north lean=(16, 0)
        CapR.bottom on PegR.top gap=-0.012
        CapL.bottom on PegL.top gap=-0.012

        ArmR.top on Torso.west shift=(0, 0.04) gap=-0.05 lean=(-48, 0)
        ArmL.top on Torso.east shift=(0, 0.04) gap=-0.05 lean=(-48, 0)

        LegR.top on Torso.bottom shift=(-0.1 * girth, 0.0) gap=-0.04
        LegL.top on Torso.bottom shift=(0.1 * girth, 0.0) gap=-0.04
    }

    # ── life: it blinks, and it walks (the game plays the clips; the
    # walk's pace follows how fast the creature goes) ─────────────────
    pose Shut { EyeR height=eye * 0.2  EyeL height=eye * 0.2 }
    animate Blink { 0 rest  0.06 Shut  0.13 rest }

    # a step: one leg forward, the other back, the arms swinging against
    # the legs (held out as they are, a little forward and back)
    pose StepR { LegR lean=(0, 26)  LegL lean=(0, -26)  ArmR lean=(-48, -20)  ArmL lean=(-48, 20) }
    pose StepL { LegR lean=(0, -26)  LegL lean=(0, 26)  ArmR lean=(-48, 20)  ArmL lean=(-48, -20) }
    animate Walk loop { 0 rest  0.25 StepR  0.5 rest  0.75 StepL  1 rest }

    # hi: the right arm goes up and flaps hello, three times (a stubby arm
    # under a big head: much higher and it hides behind the head)
    pose HiA { ArmR lean=(55, 0) }
    pose HiB { ArmR lean=(20, 0) }
    animate Wave { 0 rest  0.22 HiA  0.42 HiB  0.62 HiA  0.82 HiB  1.02 HiA  1.3 rest }

    # eating: the line opens into a mouth and shuts, three bites
    pose Open { Mouth height=0.13 * head }
    animate Eat { 0 rest  0.14 Open  0.32 rest  0.48 Open  0.66 rest  0.82 Open  1.05 rest }

    resolve grain = 0.007
}

print Kodomata detail=low
```
