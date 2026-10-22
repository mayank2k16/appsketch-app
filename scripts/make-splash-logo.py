"""The launch: an orange screen swept clockwise to white, gathered into a
dot, and the AppSketch logo drawn from that dot by its own pencil.

Run: python3 scripts/make-splash-logo.py   (needs Pillow + cairosvg)

Writes
- assets/lottie/splash-logo.json   the in-app splash Lottie (src/app/splash.tsx)
- assets/splash-blank.png          the native launch image: fully transparent,
                                   so the launch screen is solid ORANGE
- ios/AppSketch/Images.xcassets/SplashScreenLogo.imageset/*.png  (transparent)
- android/app/src/main/res/drawable-*/splashscreen_logo.png       (transparent)
The launch colour itself (ORANGE) lives in app.config.ts, the iOS
SplashScreenBackground colorset/storyboard and Android splashscreen_background.

There is no vector source for the logo, so its geometry and gradients were
measured from assets/splash-mark.png (1024px): shapes fitted by maximising the
alpha overlap (IoU 0.97, the rest is the PNG's soft edges), gradients fitted
per part as the linear direction with the least colour error. All numbers
below are in that 1024 space.

The native launch screen is solid ORANGE, edge to edge. The Lottie is a
CW x CH comp (drawn 1:1 in points around the screen centre, big enough to
cover any portrait phone or iPad) whose frame 0 is that same solid orange.
Opening (frames 0..OPEN, 1s):
  0. a short hold; then the warm canvas sweeps in clockwise from 12 o'clock
     (the orange left is an exact pie sector: a filled path of 4 cubic arcs
     reaching past the comp's corners, keyed every frame), while the orange
     around the centre gathers into a shrinking disc that lands, with a small
     settle, on the 16pt dot at the centre.
From there the logo precomp (480pt, the original sequence, unchanged and
clipped to its own 480pt box as before) plays, starting on that dot
(60fps, ~2.8s, shape layers only):
  1. the dot glides to its place in the logo as the pencil flies in, turning
     to its writing angle with a soft overshoot;
  2. the graphite tip draws the outer frame, its gradient stroke revealed
     exactly under the tip (trim path + per-frame tip position), a faint
     highlight trailing behind it;
  3. the pencil hops and sketches the inner square; the dot pops;
  4. the pencil lifts, turns and grows into its place across the corner and
     snaps in; the whole mark gives a small bounce and a light sheen crosses
     it (alpha matte);
  5. it holds on the finished logo, which matches splash-mark.png.
The wordmark, tagline and the exit are drawn by src/components/splash/.
"""
import io
import json
import math
import os

import cairosvg
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
CANVAS = '#FAFAF8'       # appTheme.light.bg: the splash field
DOT_HEX = '#FA8F32'      # the logo's dot, measured
ORANGE = DOT_HEX         # the native launch screen: it becomes the dot
MARK_PT = 168            # finished logo box on screen, points
SEED_PT = 16             # the native launch dot, points
COMP = 480               # logo precomp, drawn 1:1 in points around the centre
CW, CH = 1120, 1440      # outer comp: covers any portrait phone/iPad (13" = 1032x1376)
OPEN = 60                # opening frames (orange -> sweep -> dot), before the logo
S = MARK_PT / 1024       # 1024 space -> points
FR, OP = 60, 168         # OP: the logo precomp's length
OP_ALL = OPEN + OP
K = 0.5523

# ── Geometry (fitted) ───────────────────────────────────────────────────────
OUT = dict(x0=107.5, y0=337.4, x1=743, y1=953.9, r=104.5, w=43)
INN = dict(x0=218.4, y0=573, x1=598, y1=876.8, r=49.8, w=33.8, sx=356, ey=682)
DOT = (219, 457.3, 31.5)
TIP, ANG = (373.5, 724.1), -51.99
HW, CHW, TIP_DY = 119.4, 119.4, 4.25
CONE_X, BODY, CAP, CAP_R = 266.1, (298.5, 633.1), (666.5, 796.4), 53.5
GRAPHITE_X = 86
GAP_L, GAP_R = 42, 38    # the white channel the pencil cuts through the frame

# ── Gradients (fitted; world = 1024 space) ──────────────────────────────────
G_OUTER = ((646.4, 434.5), (143.9, 936.9), [
    (0, '#F44250'), (0.2, '#EE4162'), (0.4, '#CF36A1'), (0.6, '#9C33D0'),
    (0.8, '#4442EE'), (1, '#0B86E2')])
G_INNER = ((476.6, 604.0), (283.4, 901.6), [
    (0, '#E6438E'), (0.4, '#DB3DA2'), (0.6, '#C83FBA'), (0.8, '#A542D9'),
    (1, '#724AEE')])
G_CONE = ((434.1, 485.4), (557.9, 622.9), [
    (0, '#F97C30'), (0.4, '#FB5E3B'), (0.8, '#E74555'), (1, '#D84164')])
G_BODY = ((547.9, 299.5), (771.9, 413.7), [
    (0, '#3DCDC8'), (0.4, '#1DAFBF'), (0.8, '#138CC6'), (1, '#107ACB')])
G_CAP = ((745.4, 71.7), (901.4, 227.6), [
    (0, '#F88730'), (0.4, '#FC6737'), (0.8, '#EC474F'), (1, '#DB3F68')])
GRAPHITE = '#1B2083'


def hexc(h):
    h = h.lstrip('#')
    return [round(int(h[i:i + 2], 16) / 255, 4) for i in (0, 2, 4)]


def rot(v, deg):
    a = math.radians(deg)
    return (v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a))


def to_world(x, y):
    dx, dy = rot((x, y), ANG)
    return (TIP[0] + dx, TIP[1] + dy)


def to_local(p):
    return rot((p[0] - TIP[0], p[1] - TIP[1]), -ANG)


# ── Paths as (v, i, o, closed), Lottie's own form ───────────────────────────
def open_frame(x0, y0, x1, y1, r, start_x, end_y):
    kr = K * r
    v = [(start_x, y0), (x0 + r, y0), (x0, y0 + r), (x0, y1 - r),
         (x0 + r, y1), (x1 - r, y1), (x1, y1 - r), (x1, end_y)]
    i = [(0, 0), (0, 0), (0, -kr), (0, 0), (-kr, 0), (0, 0), (0, kr), (0, 0)]
    o = [(0, 0), (-kr, 0), (0, 0), (0, kr), (0, 0), (kr, 0), (0, 0), (0, 0)]
    return v, i, o, False


def polygon(pts):
    z = [(0, 0)] * len(pts)
    return list(pts), z, z, True


def cap_local():
    (a, b), r = CAP, CAP_R
    kr = K * r
    v = [(a, -HW), (b - r, -HW), (b, -HW + r), (b, HW - r), (b - r, HW), (a, HW)]
    i = [(0, 0), (0, 0), (0, -kr), (0, 0), (kr, 0), (0, 0)]
    o = [(0, 0), (kr, 0), (0, 0), (0, kr), (0, 0), (0, 0)]
    return v, i, o, True


# The outer frame starts and ends inside the channel, which a mask cuts away.
OUTER_PATH = open_frame(OUT['x0'], OUT['y0'], OUT['x1'], OUT['y1'], OUT['r'],
                        OUT['x0'] + 0.75 * (OUT['x1'] - OUT['x0']),
                        OUT['y0'] + 0.1 * (OUT['y1'] - OUT['y0']))
INNER_PATH = open_frame(INN['x0'], INN['y0'], INN['x1'], INN['y1'], INN['r'],
                        INN['sx'], INN['ey'])
CHANNEL = polygon([to_world(BODY[0] - 60, -HW - GAP_L), to_world(1000, -HW - GAP_L),
                   to_world(1000, HW + GAP_R), to_world(BODY[0] - 60, HW + GAP_R)])
# Pencil parts in its own frame: tip at the origin, +x up its axis.
CONE_L = polygon([(0, TIP_DY), (CONE_X, -CHW), (CONE_X, CHW)])
GRAPHITE_L = polygon([(0, TIP_DY), (GRAPHITE_X, -CHW * GRAPHITE_X / CONE_X),
                      (GRAPHITE_X, CHW * GRAPHITE_X / CONE_X)])
BODY_L = polygon([(BODY[0], -HW), (BODY[1], -HW), (BODY[1], HW), (BODY[0], HW)])
CAP_L = cap_local()


# ── Arc length along a Lottie path (what trim paths measure) ────────────────
def bez(p0, c1, c2, p1, t):
    u = 1 - t
    return tuple(u ** 3 * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t ** 3 * p1[k]
                 for k in (0, 1))


def sampler(path, n=200):
    v, i, o, _ = path
    pts = []
    for k in range(len(v) - 1):
        p0, p1 = v[k], v[k + 1]
        c1 = (p0[0] + o[k][0], p0[1] + o[k][1])
        c2 = (p1[0] + i[k + 1][0], p1[1] + i[k + 1][1])
        pts += [bez(p0, c1, c2, p1, j / n) for j in range(n)]
    pts.append(v[-1])
    acc = [0.0]
    for a, b in zip(pts, pts[1:]):
        acc.append(acc[-1] + math.dist(a, b))
    total = acc[-1]

    def at(f):
        target = max(0.0, min(1.0, f)) * total
        lo, hi = 0, len(acc) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if acc[mid] < target:
                lo = mid + 1
            else:
                hi = mid
        if lo == 0:
            return pts[0]
        a, b = pts[lo - 1], pts[lo]
        seg = acc[lo] - acc[lo - 1] or 1
        t = (target - acc[lo - 1]) / seg
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    return at


# ── Easing (cubic-bezier, solved numerically) ───────────────────────────────
EASE = {
    'inout': (0.65, 0, 0.35, 1),
    'hand': (0.45, 0, 0.25, 1),     # a hand: brisk start, careful landing
    'out': (0.16, 1, 0.3, 1),
    'in': (0.55, 0, 0.75, 0.2),
    'back': (0.3, 1.5, 0.5, 1),
    'snap': (0.25, 1.35, 0.45, 1),
    'sweep': (0.6, 0, 0.3, 1),      # a clock hand: eases away, glides home
    'gather': (0.5, 0, 0.2, 1),     # the orange draws in, then lands soft
}


def ease(name, x):
    x1, y1, x2, y2 = EASE[name]
    lo, hi = 0.0, 1.0
    for _ in range(40):
        t = (lo + hi) / 2
        bx = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3
        lo, hi = (t, hi) if bx < x else (lo, t)
    t = (lo + hi) / 2
    return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3


def phase(f, a, b, name):
    return ease(name, min(1.0, max(0.0, (f - a) / (b - a))))


def lerp(a, b, t):
    if isinstance(a, (tuple, list)):
        return [a[k] + (b[k] - a[k]) * t for k in range(len(a))]
    return a + (b - a) * t


# ── Timeline (frames @60fps) ────────────────────────────────────────────────
T = dict(hold=8, glide=(8, 34), enter=(4, 36), outer=(36, 88), hop=(88, 96),
         inner=(96, 120), pop=(116, 132), lift=(120, 146), fade=(134, 146),
         bounce=(142, 160), sheen=(138, 166))
DRAW_SCALE = 50            # the pencil draws at half its logo size
DRAW_ANG = ANG - 10        # held a little more upright while writing
ENTER_FROM = ((2500, 2250), ANG - 58)  # outside the comp: frame 0 is the dot
OUTER_AT = sampler(OUTER_PATH)
INNER_AT = sampler(INNER_PATH)


def outer_e(f):
    return phase(f, *T['outer'], 'hand')


def inner_e(f):
    return phase(f, *T['inner'], 'hand')


def wobble(t):
    """A hand's small lean while writing, gone at both ends."""
    return 3.2 * math.sin(2 * math.pi * 1.5 * t) * math.sin(math.pi * t)


def arc(a, b, t, lift):
    """a -> b with a perpendicular lift at the middle (a pencil hop)."""
    p = lerp(a, b, t)
    return [p[0], p[1] - lift * math.sin(math.pi * t)]


def pencil_pose(f):
    """(tip position, rotation, scale %) of the pencil at frame f."""
    if f <= T['outer'][0]:
        t = phase(f, *T['enter'], 'out')
        r = lerp(ENTER_FROM[1], DRAW_ANG, phase(f, *T['enter'], 'back'))
        return lerp(ENTER_FROM[0], OUTER_AT(0), t), r, DRAW_SCALE
    if f <= T['outer'][1]:
        t = outer_e(f)
        return list(OUTER_AT(t)), DRAW_ANG + wobble(t), DRAW_SCALE
    if f <= T['inner'][0]:
        t = phase(f, *T['hop'], 'inout')
        s = DRAW_SCALE + 5 * math.sin(math.pi * t)
        return arc(OUTER_AT(1), INNER_AT(0), t, 60), DRAW_ANG, s
    if f <= T['inner'][1]:
        t = inner_e(f)
        return list(INNER_AT(t)), DRAW_ANG + wobble(t) * 0.7, DRAW_SCALE
    t = phase(f, *T['lift'], 'inout')
    r = lerp(DRAW_ANG, ANG, phase(f, *T['lift'], 'back'))
    s = lerp(DRAW_SCALE, 100, phase(f, *T['lift'], 'snap'))
    return arc(INNER_AT(1), TIP, t, 90), r, s


# ── Lottie JSON helpers ─────────────────────────────────────────────────────
def static(v):
    return {'a': 0, 'k': v}


def per_frame(fn, op=OP):
    """Every frame keyed, with the easing baked into the values; runs of
    equal values keep only their ends."""
    vals = [[round(x, 3) for x in fn(f)] for f in range(op + 1)]
    ks = []
    for f, v in enumerate(vals):
        if 0 < f < op and vals[f - 1] == v == vals[f + 1]:
            continue
        ks.append({'t': f, 's': v, 'o': {'x': [0], 'y': [0]}, 'i': {'x': [1], 'y': [1]}})
    del ks[-1]['o'], ks[-1]['i']
    return {'a': 1, 'k': ks}


def r2(p):
    return [round(p[0], 2), round(p[1], 2)]


def sh(path, name='path'):
    v, i, o, closed = path
    return {'ty': 'sh', 'nm': name, 'ks': static(
        {'v': [r2(p) for p in v], 'i': [r2(p) for p in i], 'o': [r2(p) for p in o], 'c': closed})}


def grad_k(stops, alpha=None):
    k = []
    for t, h in stops:
        k += [t] + hexc(h)
    for t, a in alpha or []:
        k += [t, a]
    return {'p': len(stops), 'k': static(k)}


def gfill(g, local=False, name='fill'):
    (s, e, stops) = g
    if local:
        s, e = to_local(s), to_local(e)
    return {'ty': 'gf', 'nm': name, 'o': static(100), 'r': 1, 'bm': 0, 't': 1,
            'g': grad_k(stops), 's': static(r2(s)), 'e': static(r2(e))}


def gstroke(g, w, cap=2):
    (s, e, stops) = g
    return {'ty': 'gs', 'nm': 'stroke', 'o': static(100), 'w': static(w), 'lc': cap, 'lj': 2,
            'ml': 4, 'bm': 0, 't': 1, 'g': grad_k(stops), 's': static(r2(s)), 'e': static(r2(e))}


def fill(hex_, o=None):
    return {'ty': 'fl', 'nm': 'fill', 'c': static(hexc(hex_) + [1]), 'o': o or static(100),
            'r': 1, 'bm': 0}


def stroke(hex_, w, o=None):
    return {'ty': 'st', 'nm': 'stroke', 'c': static(hexc(hex_) + [1]), 'o': o or static(100),
            'w': static(w), 'lc': 2, 'lj': 2, 'ml': 4, 'bm': 0}


def trim(s, e):
    return {'ty': 'tm', 'nm': 'trim', 's': s, 'e': e, 'o': static(0), 'm': 1}


def tr(p=(0, 0), a=(0, 0), s=None, r=None, o=None):
    return {'ty': 'tr', 'nm': 'Transform', 'p': p if isinstance(p, dict) else static(list(p)),
            'a': static(list(a)), 's': s or static([100, 100]), 'r': r or static(0),
            'o': o or static(100), 'sk': static(0), 'sa': static(0)}


def group(name, items, transform=None):
    return {'ty': 'gr', 'nm': name, 'it': items + [transform or tr()]}


def ks3(p=(0, 0), a=(0, 0), s=None, r=None, o=None):
    return {'o': o or static(100), 'r': r or static(0),
            'p': p if isinstance(p, dict) else static(list(p) + [0]),
            'a': static(list(a) + [0]), 's': s or static([100, 100, 100])}


def layer(ind, name, shapes, ks, parent=1, **extra):
    L = {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': name, 'sr': 1, 'ks': ks, 'ao': 0,
         'shapes': shapes, 'ip': 0, 'op': OP, 'st': 0, 'bm': 0, 'parent': parent}
    L.update(extra)
    return L


# ── Layers (all parented to the mark null, in the 1024 space) ───────────────
def null_layer():
    def bounce(f):
        t = phase(f, *T['bounce'], 'inout')
        k = S * 100 * (1 + 0.035 * math.sin(math.pi * t))
        return [k, k, 100]
    c = COMP / 2
    return {'ddd': 0, 'ind': 1, 'ty': 3, 'nm': 'mark', 'sr': 1, 'ao': 0,
            'ks': ks3((c, c), (512, 512), s=per_frame(bounce)),
            'ip': 0, 'op': OP, 'st': 0, 'bm': 0}


def pencil_shapes(final=False):
    """Graphite, wood cone, body (with a facet highlight while it moves),
    cap. Drawn in the pencil's own frame."""
    facet = []
    if not final:
        fade = per_frame(lambda f: [100 * (1 - phase(f, *T['fade'], 'inout'))])
        hl = polygon([(BODY[0] + 14, -HW * 0.62), (BODY[1] - 14, -HW * 0.62),
                      (BODY[1] - 14, -HW * 0.47), (BODY[0] + 14, -HW * 0.47)])
        facet = [group('facet', [sh(hl), fill('#FFFFFF', static(38))], tr(o=fade))]
    return [
        group('graphite', [sh(GRAPHITE_L), fill(GRAPHITE)]),
        *facet,
        group('cap', [sh(CAP_L), gfill(G_CAP, local=True)]),
        group('body', [sh(BODY_L), gfill(G_BODY, local=True)]),
        group('cone', [sh(CONE_L), gfill(G_CONE, local=True)]),
    ]


def pencil_layer(ind):
    pos = per_frame(lambda f: pencil_pose(f)[0] + [0])
    rot_ = per_frame(lambda f: [pencil_pose(f)[1]])
    scl = per_frame(lambda f: [pencil_pose(f)[2]] * 2 + [100])
    return layer(ind, 'pencil', pencil_shapes(), ks3(pos, s=scl, r=rot_), ip=T['enter'][0])


def trail(e_fn, done):
    """A faint highlight running just behind the tip."""
    e = per_frame(lambda f: [100 * e_fn(f)])
    s = per_frame(lambda f: [max(0.0, 100 * e_fn(f) - 7 * (1 - phase(f, done, done + 8, 'inout')))])
    return [trim(s, e), stroke('#FFFFFF', 7, static(55))]


def outer_layer(ind):
    e = per_frame(lambda f: [100 * outer_e(f)])
    mask = {'inv': False, 'mode': 's', 'nm': 'channel', 'pt': static(sh(CHANNEL)['ks']['k']),
            'o': static(100), 'x': static(0)}
    return layer(ind, 'outer', [
        group('trail', [sh(OUTER_PATH)] + trail(outer_e, T['outer'][1])),
        group('frame', [sh(OUTER_PATH), trim(static(0), e), gstroke((G_OUTER[0], G_OUTER[1], G_OUTER[2]), OUT['w'])]),
    ], ks3(), hasMask=True, masksProperties=[mask])


def inner_layer(ind):
    e = per_frame(lambda f: [100 * inner_e(f)])
    return layer(ind, 'inner', [
        group('trail', [sh(INNER_PATH)] + trail(inner_e, T['inner'][1])),
        group('frame', [sh(INNER_PATH), trim(static(0), e), gstroke(G_INNER, INN['w'])]),
    ], ks3())


def dot_layer(ind):
    seed = SEED_PT / S / (2 * DOT[2]) * 100

    def pos(f):
        return lerp((512, 512), DOT[:2], phase(f, *T['glide'], 'inout')) + [0]

    def scl(f):
        k = lerp(seed, 100, phase(f, *T['glide'], 'inout'))
        k *= 1 + 0.28 * math.sin(math.pi * phase(f, *T['pop'], 'out'))
        return [k, k, 100]
    dot = group('dot', [{'ty': 'el', 'nm': 'dot', 'd': 1, 'p': static([0, 0]),
                         's': static([DOT[2] * 2] * 2)}, fill(DOT_HEX)])
    return layer(ind, 'dot', [dot], ks3(per_frame(pos), s=per_frame(scl)))


def sheen_layers(ind):
    """A warm light band crossing the finished mark, through an alpha matte
    of the mark (on the canvas a near-white band is invisible anyway)."""
    final_pencil = group('pencil', pencil_shapes(final=True), tr(p=TIP, r=static(ANG)))
    matte = layer(ind, 'sheen matte', [
        final_pencil,
        group('dot', [{'ty': 'el', 'nm': 'dot', 'd': 1, 'p': static(list(DOT[:2])),
                       's': static([DOT[2] * 2] * 2)}, fill('#000000')]),
        group('inner', [sh(INNER_PATH), stroke('#000000', INN['w'])]),
        group('outer', [sh(OUTER_PATH), stroke('#000000', OUT['w'])]),
    ], ks3(), td=1)
    band = polygon([(-90, -900), (90, -900), (90, 900), (-90, 900)])
    g = {'ty': 'gf', 'nm': 'light', 'o': static(100), 'r': 1, 'bm': 0, 't': 1,
         'g': grad_k([(0, '#FFF4EA'), (0.5, '#FFFFFF'), (1, '#FFF4EA')],
                     [(0, 0), (0.5, 0.5), (1, 0)]),
         's': static([-90, 0]), 'e': static([90, 0])}
    x = per_frame(lambda f: [lerp(-260, 1300, phase(f, *T['sheen'], 'inout')), 512, 0])
    sheen = layer(ind + 1, 'sheen', [group('band', [sh(band), g])], ks3(x, r=static(24)), tt=1)
    return [matte, sheen]


# ── Opening: orange screen -> clockwise sweep -> the dot ─────────────────────
O_T = dict(sweep=(6, 52), gather=(6, 55), settle=(55, OPEN))
GATHER_FROM = 200        # disc radius (pt) when the sweep starts
GATHER_DIP = 0.82        # it lands a touch small, then settles on the dot


def sector(a, r, n=4):
    """The pie sector from a clockwise angle `a` (radians from 12 o'clock) on
    round to 12 o'clock again, radius r, centred on the origin: the centre
    plus n exact cubic arcs, so the vertex count never changes."""
    d = (2 * math.pi - a) / n
    h = 4 / 3 * math.tan(d / 4) * r

    def pt(phi):
        return (r * math.sin(phi), -r * math.cos(phi))

    def tan_(phi):
        return (math.cos(phi), math.sin(phi))
    v, i, o = [(0, 0)], [(0, 0)], [(0, 0)]
    for k in range(n + 1):
        phi = a + k * d
        t = tan_(phi)
        v.append(pt(phi))
        i.append((0, 0) if k == 0 else (-h * t[0], -h * t[1]))
        o.append((0, 0) if k == n else (h * t[0], h * t[1]))
    return v, i, o, True


def gather_r(f):
    rd = SEED_PT / 2
    if f <= O_T['settle'][0]:
        return lerp(GATHER_FROM, rd * GATHER_DIP, phase(f, *O_T['gather'], 'gather'))
    return lerp(rd * GATHER_DIP, rd, phase(f, *O_T['settle'], 'out'))


def sweep_s(f):
    return 100 * phase(f, *O_T['sweep'], 'sweep')


def opening_layers(ind):
    """The orange left behind the clockwise sweep: an exact pie sector (a
    filled path keyed every frame, reaching past the comp's corners) plus a
    disc around the centre that gathers into the dot. Filled, not a
    diagonal-wide trimmed stroke: wide strokes leave antialiasing specks."""
    centre = (CW / 2, CH / 2)
    reach = math.ceil(math.hypot(CW / 2, CH / 2)) + 24
    keys = []
    for f in range(OPEN + 2):
        v, i, o, c = sector(2 * math.pi * sweep_s(f) / 100, reach)
        keys.append({'t': f, 's': [{'v': [r2(q) for q in v], 'i': [r2(q) for q in i],
                                    'o': [r2(q) for q in o], 'c': c}],
                     'o': {'x': [0], 'y': [0]}, 'i': {'x': [1], 'y': [1]}})
    del keys[-1]['o'], keys[-1]['i']
    path = {'ty': 'sh', 'nm': 'sector', 'ks': {'a': 1, 'k': keys}}
    sweep = layer(ind + 1, 'sweep', [group('sector', [path, fill(ORANGE)])],
                  ks3(centre), op=OPEN + 1)
    size = per_frame(lambda f: [2 * gather_r(f)] * 2, OPEN + 1)
    disc = layer(ind, 'gather', [group('disc', [
        {'ty': 'el', 'nm': 'disc', 'd': 1, 'p': static([0, 0]), 's': size}, fill(ORANGE)])],
        ks3(centre), op=OPEN + 1)
    for L in (sweep, disc):
        del L['parent']
    return [disc, sweep]


def write_lottie():
    logo = [null_layer(), *sheen_layers(2), pencil_layer(4), dot_layer(5),
            inner_layer(6), outer_layer(7)]
    pre = {'ddd': 0, 'ind': 1, 'ty': 0, 'nm': 'logo', 'refId': 'logo', 'sr': 1, 'ao': 0,
           'ks': ks3((CW / 2, CH / 2), (COMP / 2, COMP / 2)), 'w': COMP, 'h': COMP,
           'ip': OPEN, 'op': OP_ALL, 'st': OPEN, 'bm': 0}
    doc = {'v': '5.7.0', 'fr': FR, 'ip': 0, 'op': OP_ALL, 'w': CW, 'h': CH,
           'nm': 'AppSketch splash (logo)', 'ddd': 0,
           'assets': [{'id': 'logo', 'layers': logo}], 'markers': [],
           'layers': [pre, *opening_layers(2)]}
    out = os.path.join(ROOT, 'assets', 'lottie', 'splash-logo.json')
    with open(out, 'w') as f:
        json.dump(doc, f, separators=(',', ':'))
    print('wrote', os.path.relpath(out, ROOT), os.path.getsize(out), 'bytes,',
          OP_ALL, 'frames =', round(OP_ALL / FR * 1000), 'ms')


# ── Native launch image: none (solid ORANGE); a transparent placeholder ─────
def blank_png(px):
    return Image.new('RGBA', (px, px), (0, 0, 0, 0))


def write_pngs():
    blank_png(64).save(os.path.join(ROOT, 'assets', 'splash-blank.png'), optimize=True)
    ios = os.path.join(ROOT, 'ios', 'AppSketch', 'Images.xcassets', 'SplashScreenLogo.imageset')
    for scale, name in ((1, 'image.png'), (2, 'image@2x.png'), (3, 'image@3x.png')):
        blank_png(SEED_PT * scale).save(os.path.join(ios, name), optimize=True)
    # Android 12+ draws the splash icon in a 288dp box. Kept as (transparent)
    # PNGs: drawable/ic_launcher_background.xml uses it as a <bitmap> src.
    res = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
    for dpi, d in (('mdpi', 1), ('hdpi', 1.5), ('xhdpi', 2), ('xxhdpi', 3), ('xxxhdpi', 4)):
        blank_png(round(288 * d)).save(
            os.path.join(res, f'drawable-{dpi}', 'splashscreen_logo.png'), optimize=True)
    print('wrote splash-blank.png, iOS imageset, Android drawables (all transparent)')


def status_dark_ms(deg=30):
    """When the sweep has passed the status bar's right side (about 30deg
    clockwise from 12 on a phone): the moment to switch to dark content."""
    f = 0
    while sweep_s(f) < deg / 360 * 100:
        f += 1
    return round(f / FR * 1000)


if __name__ == '__main__':
    write_lottie()
    write_pngs()
    print('opening', round(OPEN / FR * 1000), 'ms; status bar to dark at',
          status_dark_ms(), 'ms')
