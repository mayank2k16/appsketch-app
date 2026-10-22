"""Generates assets/lottie/splash-white.json: the white-theme splash.

Run: python3 scripts/make-splash-lottie.py

Story (30fps, ~3.3s): an orange dot drops in, floods the screen
in a Lamborghini-orange radial gradient, then retracts into a
single point at the centre and vanishes (f57) — where the app's real gradient
icon (assets/splash-mark.png) springs in, drawn by src/app/splash.tsx. Minimal
on purpose: no sparkles, ripples or twists. One rounded-rect morphs through
dot -> full screen -> point, so the motion reads as a single object.
"""
import json, os

FR, OP = 30, 100
W, H = 360, 640
CX, CY = 180, 300
TILE, TILE_R = 140, 38

def hexc(h, a=1):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [a]

ORANGE = '#FF6A00'   # Arancio Borealis-like
LIGHT = '#FF9A2E'
DEEP = '#E04800'
WHITE = '#FFFFFF'

EASE = {
    'inout': ((0.42, 0), (0.58, 1)),
    'in': ((0.55, 0), (0.9, 0.5)),
    'out': ((0.16, 1), (0.3, 1)),
    'expo': ((0.7, 0), (0.15, 1)),
    'back': ((0.34, 1.56), (0.64, 1)),
    'lin': ((0, 0), (1, 1)),
}

def static(v):
    return {'a': 0, 'k': v}

def anim(frames, spatial=False):
    """frames: [(t, value, ease_to_next), ...]"""
    ks = []
    for idx, (t, v, ease) in enumerate(frames):
        k = {'t': t, 's': v if isinstance(v, list) else [v]}
        if idx < len(frames) - 1:
            (ox, oy), (ix, iy) = EASE[ease]
            n = 1 if spatial else len(k['s'])
            if spatial:
                k['o'] = {'x': ox, 'y': oy}
                k['i'] = {'x': ix, 'y': iy}
            else:
                k['o'] = {'x': [ox] * n, 'y': [oy] * n}
                k['i'] = {'x': [ix] * n, 'y': [iy] * n}
        ks.append(k)
    return {'a': 1, 'k': ks}

def tr(p=(0, 0), s=(100, 100), r=0, o=100):
    return {'ty': 'tr', 'p': static(list(p)), 'a': static([0, 0]),
            's': static(list(s)), 'r': static(r), 'o': static(o),
            'sk': static(0), 'sa': static(0), 'nm': 'Transform'}

def group(items, name='g'):
    return {'ty': 'gr', 'nm': name, 'it': items + [tr()]}

def fill(c, o=100):
    return {'ty': 'fl', 'c': static(hexc(c)), 'o': static(o), 'r': 1, 'bm': 0}

def stroke(c, w, o=100):
    return {'ty': 'st', 'c': static(hexc(c)), 'o': static(o) if not isinstance(o, dict) else o,
            'w': static(w), 'lc': 2, 'lj': 2, 'ml': 4, 'bm': 0}

def trim(end):
    return {'ty': 'tm', 's': static(0), 'e': end, 'o': static(0), 'm': 1}

def path(vs, closed=False):
    z = [[0, 0]] * len(vs)
    return {'ty': 'sh', 'ks': static({'i': z, 'o': z, 'v': vs, 'c': closed})}

def layer(ind, name, shapes, p, s=None, r=None, o=None, ip=0, extra=None):
    ks = {
        'o': o or static(100), 'r': r or static(0),
        'p': p if isinstance(p, dict) else static(list(p) + [0]),
        'a': static([0, 0, 0]), 's': s or static([100, 100, 100]),
    }
    L = {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': name, 'sr': 1, 'ks': ks,
         'ao': 0, 'shapes': shapes, 'ip': ip, 'op': OP, 'st': 0, 'bm': 0}
    if extra:
        L.update(extra)
    return L

# Logo drawn at 128% of its path units.

layers = []
ind = iter(range(1, 100))

# ── The morphing body: dot -> full-screen flood -> icon tile ──────────────────
def rr(size):
    return [size, size]

size = anim([
    (0, rr(18), 'lin'), (16, rr(18), 'expo'), (34, rr(980), 'lin'),
    (37, rr(980), 'expo'), (52, rr(18), 'in'), (57, rr(0), 'lin'),
])
radius = anim([
    (0, 9, 'lin'), (16, 9, 'expo'), (34, 490, 'lin'),
    (37, 490, 'expo'), (52, 9, 'in'), (57, 0, 'lin'),
])
grad_end = anim([
    (0, [12, 0], 'lin'), (16, [12, 0], 'expo'), (34, [560, 0], 'lin'),
    (37, [560, 0], 'expo'), (52, [12, 0], 'lin'),
])
body = group([
    {'ty': 'rc', 'd': 1, 's': size, 'p': static([0, 0]), 'r': radius, 'nm': 'morph'},
    {'ty': 'gf', 'o': static(100), 'r': 1, 'bm': 0, 't': 2, 'nm': 'Lambo orange',
     'g': {'p': 3, 'k': static(sum([[0] + hexc(LIGHT)[:3], [0.55] + hexc(ORANGE)[:3],
                                    [1] + hexc(DEEP)[:3]], []))},
     's': static([-18, -22]), 'e': grad_end, 'h': static(0), 'a': static(0)},
], 'body')
layers.append(layer(
    next(ind), 'body', [body],
    # Falls from above and settles.
    anim([(0, [CX, -40, 0], 'in'), (10, [CX, CY, 0], 'lin')], spatial=True),
    # A restrained landing: a slight give, no cartoon squash, no twist.
    s=anim([(0, [94, 106, 100], 'lin'), (10, [106, 95, 100], 'out'),
            (16, [100, 100, 100], 'lin')]),
))

doc = {'v': '5.7.0', 'fr': FR, 'ip': 0, 'op': OP, 'w': W, 'h': H,
       'nm': 'AppSketch splash (white)', 'ddd': 0, 'assets': [], 'layers': layers, 'markers': []}
out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'lottie', 'splash-white.json')
with open(out, 'w') as f:
    json.dump(doc, f, separators=(',', ':'))
print('wrote', os.path.normpath(out), os.path.getsize(out), 'bytes')
