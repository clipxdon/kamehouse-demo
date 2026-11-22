# Kamehouse v2: macchinetta delle capsule + diorama del negozio in sezione, modellati con bpy headless.
# Unità metri, Z in alto (in three.js: x, z, -y). Uso: python build.py <outdir> [--render] [--samples N]
import bpy, bmesh, math, os, sys, json, random, time
from mathutils import Vector, Matrix

args = [a for a in sys.argv[1:] if not a.endswith('.py')]
OUT = args[0] if args and not args[0].startswith('--') else 'out'
DO_RENDER = '--render' in sys.argv
SAMPLES = int(sys.argv[sys.argv.index('--samples') + 1]) if '--samples' in sys.argv else 32
os.makedirs(OUT, exist_ok=True)
T0 = time.time()
def log(*a): print(f'[{time.time() - T0:6.1f}s]', *a, flush=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
random.seed(11)

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)

# ------------------------------------------------------------------ materiali (i nomi li riconosce il sito)
PAL = {'teal': '#14B8A6', 'pink': '#FF5C8A', 'yellow': '#FFD23F', 'ink': '#1A1A22', 'paper': '#FFF4E2', 'white': '#FFFFFF'}
MATS = {}
def mat(name, color, rough=0.6, metal=0.0, emit=None, estr=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = lin(emit); b.inputs['Emission Strength'].default_value = estr
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        b.inputs['Transmission Weight'].default_value = 0.9
        m.surface_render_method = 'BLENDED'
    m.diffuse_color = lin(color)
    MATS[name] = m
    return m

for n, c in [('Teal', PAL['teal']), ('Rosa', PAL['pink']), ('Giallo', PAL['yellow']), ('Inchiostro', PAL['ink']),
             ('Carta', PAL['paper']), ('Bianco', '#F7F7F4'), ('Arancio', '#FF8A3D'), ('Viola', '#7C6CF2'),
             ('Legno', '#C98B55'), ('LegnoScuro', '#8A5A35'), ('Pavimento', '#F1E6D2'), ('PavimentoScuro', '#46505E'),
             ('Muro', '#9EE6DA'), ('MuroLato', '#FFE3EA'), ('MuroScuro', '#2F4858'), ('Sezione', '#1A1A22'),
             ('Tappeto', '#2E7D6F'), ('Feltro', '#1F8F7E'), ('Metallo', '#B9C0C7')]:
    mat(n, c, 0.62, 0.6 if n == 'Metallo' else 0.0)
mat('Vetro', '#CFF5F0', 0.05, 0.0, alpha=0.25)
mat('Luce', '#FFFFFF', 0.5, emit='#FFF1C9', estr=8.0)
mat('Neon', '#FF5C8A', 0.5, emit='#FF5C8A', estr=12.0)
mat('Schermo', '#173B45', 0.3, emit='#2FE0C8', estr=2.0)

# ------------------------------------------------------------------ accumulatori bmesh: un oggetto per (gruppo, materiale)
ACC = {}
def acc(obj, m):
    k = (obj, m)
    if k not in ACC: ACC[k] = bmesh.new()
    return ACC[k]

def _xf(bm, verts, loc, rot=(0, 0, 0), scale=None):
    M = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(rot[2], 4, 'Z') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[0], 4, 'X')
    bmesh.ops.transform(bm, matrix=M, verts=verts)

def box(obj, m, size, loc, rot=(0, 0, 0), bevel=0.0):
    tmp = bmesh.new()
    r = bmesh.ops.create_cube(tmp, size=1.0)
    bmesh.ops.scale(tmp, vec=Vector(size), verts=tmp.verts)
    if bevel > 0:
        bmesh.ops.bevel(tmp, geom=list(tmp.edges), offset=bevel, segments=2, affect='EDGES', profile=0.5)
    _xf(tmp, tmp.verts, loc, rot)
    _merge(obj, m, tmp)

def cyl(obj, m, r, h, loc, rot=(0, 0, 0), seg=24, r2=None):
    tmp = bmesh.new()
    bmesh.ops.create_cone(tmp, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    _xf(tmp, tmp.verts, loc, rot)
    _merge(obj, m, tmp)

def sphere(obj, m, r, loc, seg=20, rings=12, hemi=0, scale=(1, 1, 1)):
    tmp = bmesh.new()
    bmesh.ops.create_uvsphere(tmp, u_segments=seg, v_segments=rings, radius=r)
    if hemi:
        kill = [v for v in tmp.verts if (v.co.z < -1e-4 if hemi > 0 else v.co.z > 1e-4)]
        bmesh.ops.delete(tmp, geom=kill, context='VERTS')
    bmesh.ops.scale(tmp, vec=Vector(scale), verts=tmp.verts)
    _xf(tmp, tmp.verts, loc)
    _merge(obj, m, tmp)

def star(obj, m, r_out, r_in, depth, loc, rot=(0, 0, 0), n=5):
    tmp = bmesh.new()
    pts = []
    for i in range(n * 2):
        a = math.pi / 2 + i * math.pi / n
        rr = r_out if i % 2 == 0 else r_in
        pts.append(tmp.verts.new((math.cos(a) * rr, math.sin(a) * rr, 0)))
    f = tmp.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(tmp, geom=[f])
    bmesh.ops.translate(tmp, vec=(0, 0, depth), verts=[e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(tmp, faces=tmp.faces)
    _xf(tmp, tmp.verts, loc, rot)
    _merge(obj, m, tmp)

def _merge(obj, m, tmp):
    me = bpy.data.meshes.new('tmp'); tmp.to_mesh(me); tmp.free()
    acc(obj, m).from_mesh(me); bpy.data.meshes.remove(me)

COLL = {}
def coll(name):
    if name not in COLL:
        c = bpy.data.collections.new(name); scn.collection.children.link(c); COLL[name] = c
    return COLL[name]

def flush(collection, parent=None, smooth=()):
    """Crea un oggetto per ogni accumulatore e svuota ACC."""
    objs = []
    for (obj, m), bm in list(ACC.items()):
        me = bpy.data.meshes.new(f'{obj}_{m}')
        bm.to_mesh(me); bm.free()
        me.materials.append(MATS[m])
        if obj in smooth or any(obj.startswith(s) for s in smooth):
            for p in me.polygons: p.use_smooth = True
        name = obj if sum(1 for (o, _) in ACC if o == obj) == 1 else f'{obj}_{m}'
        ob = bpy.data.objects.new(name, me)
        coll(collection).objects.link(ob)
        if parent: ob.parent = parent
        objs.append(ob)
    ACC.clear()
    return objs

def empty(name, collection, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None); e.location = loc
    coll(collection).objects.link(e)
    if parent: e.parent = parent
    return e

def text_mesh(name, body, size, loc, m, collection, extrude=0.03, rot=(math.pi / 2, 0, 0), align='CENTER', parent=None):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size; cu.extrude = extrude
    cu.align_x = align; cu.align_y = 'CENTER'
    ob = bpy.data.objects.new(name + '_txt', cu); scn.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
    me.materials.clear(); me.materials.append(MATS[m])
    o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    coll(collection).objects.link(o)
    if parent: o.parent = parent
    return o

# ================================================================== 1) macchinetta delle capsule (originale)
log('macchinetta')
G = 'Gacha'
root = empty('Macchinetta', G)
W, D, H = 1.2, 1.0, 1.1
box('Cabinet', 'Rosa', (W, D, H), (0, 0, H / 2), bevel=0.08)
box('Cabinet', 'Carta', (0.92, 0.04, 0.74), (0, -D / 2 - 0.005, 0.66), bevel=0.03)      # pannello frontale
box('Cabinet', 'Inchiostro', (0.44, 0.06, 0.3), (0, -D / 2 - 0.0, 0.2), bevel=0.04)       # bocca di uscita
box('Cabinet', 'Giallo', (0.26, 0.03, 0.16), (0.3, -D / 2 - 0.03, 0.93), bevel=0.02)      # gettoniera
box('Cabinet', 'Inchiostro', (0.03, 0.035, 0.1), (0.3, -D / 2 - 0.045, 0.93))             # fessura
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl('Cabinet', 'Inchiostro', 0.07, 0.08, (sx * (W / 2 - 0.12), sy * (D / 2 - 0.12), -0.04))
    star('Cabinet', 'Giallo', 0.2, 0.09, 0.03, (sx * (W / 2 + 0.005), 0, 0.62), rot=(0, sx * math.pi / 2, 0))
cyl('Cabinet', 'Teal', 0.6, 0.12, (0, 0, H + 0.06))                                        # anello
cyl('Cabinet', 'Teal', 0.12, 0.14, (0, 0, H + 0.06 + 1.08 + 0.07))                         # colletto del tappo
sphere('Cabinet', 'Giallo', 0.2, (0, 0, H + 1.33), hemi=1)                                 # tappo
sphere('Cabinet', 'Giallo', 0.07, (0, 0, H + 1.56))
cab = flush(G, root, smooth=())
for o in cab:
    for p in o.data.polygons: p.use_smooth = False
# cupola
sphere('Cupola', 'Vetro', 0.56, (0, 0, H + 0.62), seg=40, rings=24)
flush(G, root, smooth=('Cupola',))
# capsule nella cupola: campionamento con rifiuto dentro la sfera, dal basso
CAP_R = 0.115
cols = ['Teal', 'Rosa', 'Giallo', 'Viola', 'Arancio']
centers = []
cz = H + 0.62
tries = 0
while len(centers) < 26 and tries < 20000:
    tries += 1
    p = Vector((random.uniform(-0.42, 0.42), random.uniform(-0.42, 0.42), random.uniform(cz - 0.42, cz + 0.05)))
    if (p - Vector((0, 0, cz))).length > 0.56 - CAP_R - 0.02: continue
    if p.z < H + 0.14 + CAP_R: continue
    if any((p - q).length < CAP_R * 2.02 for q in centers): continue
    centers.append(p)
centers.sort(key=lambda v: v.z)
for i, p in enumerate(centers):
    c = cols[i % len(cols)]
    rz = random.uniform(0, math.pi)
    tmp_rot = (random.uniform(-1, 1), random.uniform(-1, 1), rz)
    # mezza capsula colorata + mezza bianca, ruotate insieme
    for part, m, hemi in (('top', c, 1), ('bot', 'Bianco', -1)):
        tmp = bmesh.new()
        bmesh.ops.create_uvsphere(tmp, u_segments=16, v_segments=10, radius=CAP_R)
        kill = [v for v in tmp.verts if (v.co.z < -1e-4 if hemi > 0 else v.co.z > 1e-4)]
        bmesh.ops.delete(tmp, geom=kill, context='VERTS')
        _xf(tmp, tmp.verts, p, tmp_rot)
        _merge('Capsule', m, tmp)
flush(G, root, smooth=('Capsule',))
# manopola (ruota attorno all'asse Y di Blender)
knob = empty('Manopola', G, (0, -D / 2 - 0.06, 0.66), root)
cyl('ManopolaDisco', 'Teal', 0.2, 0.08, (0, 0, 0), rot=(math.pi / 2, 0, 0), seg=32)
box('ManopolaDisco', 'Giallo', (0.38, 0.09, 0.08), (0, -0.07, 0), bevel=0.025)
cyl('ManopolaDisco', 'Inchiostro', 0.05, 0.12, (0, -0.06, 0), rot=(math.pi / 2, 0, 0))
flush(G, knob, smooth=())
# sportello dell'uscita (cerniera in alto)
flap = empty('Sportello', G, (0, -D / 2 - 0.04, 0.33), root)
box('SportelloAnta', 'Teal', (0.4, 0.03, 0.24), (0, 0, -0.12), bevel=0.012)
flush(G, flap)
# capsula che esce: due metà separate (si apre)
out = empty('CapsulaUscita', G, (0, -D / 2 + 0.1, 0.2), root)
lid = empty('CapsulaCoperchio', G, (0, 0, 0), out)
sphere('CapsulaTop', 'Rosa', 0.14, (0, 0, 0), seg=24, rings=14, hemi=1)
flush(G, lid, smooth=('CapsulaTop',))
sphere('CapsulaBase', 'Bianco', 0.14, (0, 0, 0), seg=24, rings=14, hemi=-1)
flush(G, out, smooth=('CapsulaBase',))
gacha_meta = {'knob': [0, 0.66, D / 2 + 0.06], 'exit': [0, 0.2, D / 2 - 0.1], 'height': H + 1.63}

# ================================================================== 2) diorama del negozio in sezione
log('diorama')
DG = 'Diorama'
droot = empty('Negozio', DG, (0, 0, 0))
RW, RD, FH, SL = 8.0, 5.0, 3.0, 0.3           # larghezza, profondità, altezza piano, solaio
X0, X1, Y0, Y1 = -RW / 2, RW / 2, -RD / 2, RD / 2
ST_X0, ST_X1, ST_Y0, ST_Y1 = 2.0, 3.6, -1.6, 2.2   # apertura scala

# --- involucro: pareti di fondo e laterale sinistra, solai con bordo di sezione scuro
for z0, wall, side in ((0, 'Muro', 'MuroLato'), (-FH - SL, 'MuroScuro', 'MuroScuro')):
    box('Pareti', wall, (RW, 0.2, FH), (0, Y1 + 0.1, z0 + FH / 2))
    box('Pareti', side, (0.2, RD, FH), (X0 - 0.1, 0, z0 + FH / 2))
    box('Pareti', 'Sezione', (RW + 0.2, 0.2, 0.06), (-0.1, Y1 + 0.1, z0 + FH + 0.03))   # cimasa di sezione
    box('Pareti', 'Sezione', (0.2, RD, 0.06), (X0 - 0.1, 0, z0 + FH + 0.03))
# pavimento piano terra (con buco per la scala) e solaio
def slab(z, top_mat, h):
    parts = [  # rettangoli attorno all'apertura
        (X0, ST_X0, Y0, Y1), (ST_X1, X1, Y0, Y1), (ST_X0, ST_X1, Y0, ST_Y0), (ST_X0, ST_X1, ST_Y1, Y1)]
    for a, b, c, d in parts:
        if b - a < 1e-3 or d - c < 1e-3: continue
        box('Solai', 'Sezione', (b - a, d - c, h), ((a + b) / 2, (c + d) / 2, z - h / 2))
        box('Pavimenti', top_mat, (b - a, d - c, 0.02), ((a + b) / 2, (c + d) / 2, z + 0.01))
slab(0, 'Pavimento', SL)
# pavimento interrato e basamento
box('Solai', 'Sezione', (RW, RD, 0.3), (0, 0, -FH - SL - 0.15))
box('Pavimenti', 'PavimentoScuro', (RW, RD, 0.02), (0, 0, -FH - SL + 0.01))
box('Pavimenti', 'Tappeto', (5.0, 3.0, 0.02), (-1.2, 0.2, -FH - SL + 0.025))
flush(DG, droot)

# --- piano terra: tre librerie di manga sulla parete di fondo
log('librerie')
BOOKS = ['Teal', 'Rosa', 'Giallo', 'Bianco', 'Inchiostro', 'Arancio', 'Viola', 'Carta']
def bookcase(cx, cy, w=1.5, d=0.42, h=2.3, shelves=5, rotz=0.0):
    # mobile
    box('Mobili', 'LegnoScuro', (w, 0.04, h), (cx, cy + d / 2 - 0.02, h / 2))
    for sx in (-1, 1): box('Mobili', 'Legno', (0.05, d, h), (cx + sx * (w / 2 - 0.025), cy, h / 2))
    for i in range(shelves + 1):
        z = 0.08 + i * (h - 0.12) / shelves
        box('Mobili', 'Legno', (w, d, 0.04), (cx, cy, z))
    box('Mobili', 'Rosa', (w + 0.06, d + 0.06, 0.1), (cx, cy, h + 0.05))
    # volumi: dorsi di altezza e spessore variabili, gruppi dello stesso colore come le serie vere
    for i in range(shelves):
        z = 0.1 + i * (h - 0.12) / shelves
        x = cx - w / 2 + 0.07
        while True:
            series = random.choice(BOOKS)
            n = random.randint(2, 5)
            bh = random.uniform(0.26, 0.34)
            for _ in range(n):
                t = random.uniform(0.06, 0.085)
                if x + t > cx + w / 2 - 0.07: break
                box('Volumi', series, (t * 0.92, d * 0.72, bh), (x + t / 2, cy - 0.02, z + bh / 2))
                x += t
            else:
                if random.random() < 0.15 and x + 0.2 < cx + w / 2 - 0.07:   # volume inclinato
                    box('Volumi', random.choice(BOOKS), (0.045, d * 0.72, 0.3), (x + 0.1, cy - 0.02, z + 0.14), rot=(0, 0.35, 0))
                    x += 0.2
                continue
            break
for i, cx in enumerate((-3.1, -1.5, 0.1)):
    bookcase(cx, Y1 - 0.24)

# --- vetrina con figure (lungo la parete sinistra)
log('vetrina')
VX, VY, VW, VD, VH = X0 + 0.35, -0.2, 0.55, 2.6, 2.1
box('Mobili', 'Inchiostro', (VW, VD, 0.5), (VX, VY, 0.25), bevel=0.02)
box('Mobili', 'Inchiostro', (VW, VD, 0.08), (VX, VY, VH), bevel=0.02)
for zz in (0.5, 1.05, 1.6):
    box('Ripiani', 'Vetro', (VW - 0.06, VD - 0.06, 0.02), (VX, VY, zz))
box('VetroVetrina', 'Vetro', (0.02, VD, VH - 0.5), (VX + VW / 2, VY, 0.5 + (VH - 0.5) / 2))
for sy in (-1, 1):
    box('Mobili', 'Inchiostro', (VW, 0.04, VH - 0.5), (VX, VY + sy * VD / 2, 0.5 + (VH - 0.5) / 2))
box('Mobili', 'Luce', (VW - 0.1, VD - 0.1, 0.02), (VX, VY, VH - 0.05))

def figure(x, y, z, s, col, kind):
    cyl('Figure', 'Inchiostro', 0.09 * s, 0.03 * s, (x, y, z + 0.015 * s), seg=20)     # basetta
    if kind == 0:   # omino capsula: corpo a goccia e testa tonda
        cyl('Figure', col, 0.055 * s, 0.16 * s, (x, y, z + 0.11 * s), seg=16, r2=0.035 * s)
        sphere('Figure', 'Bianco', 0.06 * s, (x, y, z + 0.24 * s), seg=14, rings=10)
        sphere('Figure', col, 0.062 * s, (x, y, z + 0.25 * s), seg=14, rings=10, hemi=1)
    elif kind == 1:  # robottino squadrato
        box('Figure', col, (0.1 * s, 0.07 * s, 0.12 * s), (x, y, z + 0.1 * s), bevel=0.006 * s)
        box('Figure', 'Bianco', (0.08 * s, 0.07 * s, 0.07 * s), (x, y, z + 0.2 * s), bevel=0.006 * s)
        box('Figure', 'Inchiostro', (0.05 * s, 0.01 * s, 0.015 * s), (x, y - 0.036 * s, z + 0.205 * s))
        for sx in (-1, 1):
            box('Figure', col, (0.025 * s, 0.03 * s, 0.1 * s), (x + sx * 0.065 * s, y, z + 0.1 * s))
        cyl('Figure', 'Giallo', 0.006 * s, 0.05 * s, (x, y, z + 0.26 * s), seg=6)
    else:            # stella su piedistallo
        cyl('Figure', 'Bianco', 0.04 * s, 0.1 * s, (x, y, z + 0.08 * s), seg=12)
        star('Figure', col, 0.08 * s, 0.035 * s, 0.025 * s, (x, y + 0.012 * s, z + 0.19 * s), rot=(math.pi / 2, 0, 0))
fcols = ['Teal', 'Rosa', 'Giallo', 'Viola', 'Arancio']
for zi, zz in enumerate((0.52, 1.07, 1.62)):
    for j in range(5):
        y = VY - VD / 2 + 0.3 + j * (VD - 0.6) / 4
        figure(VX - 0.02, y, zz + 0.01, 1.7, fcols[(j + zi) % 5], (j + zi) % 3)

# --- banco cassa e tavolo novità
log('banco')
box('Mobili', 'Rosa', (2.0, 0.7, 1.0), (0.4, -1.4, 0.5), bevel=0.03)
box('Mobili', 'Carta', (2.1, 0.8, 0.06), (0.4, -1.4, 1.03), bevel=0.02)
for i in range(6): box('Mobili', 'Bianco' if i % 2 else 'Giallo', (0.33, 0.02, 0.5), (-0.43 + i * 0.33, -1.76, 0.5))
box('Cassa', 'Inchiostro', (0.4, 0.3, 0.12), (1.0, -1.3, 1.12), bevel=0.02)
box('Cassa', 'Inchiostro', (0.36, 0.04, 0.26), (1.0, -1.2, 1.32), rot=(0.25, 0, 0))
box('Cassa', 'Schermo', (0.3, 0.01, 0.2), (1.0, -1.226, 1.325), rot=(0.25, 0, 0))
# ciotola di capsule sul banco
cyl('Mobili', 'Teal', 0.25, 0.12, (-0.2, -1.35, 1.12), seg=24, r2=0.18)
for k in range(7):
    a = k / 7 * math.tau
    p = (-0.2 + math.cos(a) * 0.12, -1.35 + math.sin(a) * 0.12, 1.21)
    sphere('Capsule', fcols[k % 5], 0.07, p, seg=12, rings=8, hemi=1)
    sphere('Capsule', 'Bianco', 0.07, p, seg=12, rings=8, hemi=-1)
# tavolo novità con scatole da collezione impilate
box('Mobili', 'Legno', (1.3, 0.9, 0.06), (-1.6, -0.6, 0.78))
for sx in (-1, 1):
    for sy in (-1, 1): box('Mobili', 'LegnoScuro', (0.06, 0.06, 0.75), (-1.6 + sx * 0.58, -0.6 + sy * 0.38, 0.375))
for i in range(6):
    x = -2.0 + (i % 3) * 0.38; y = -0.75 + (i // 3) * 0.32
    hgt = 0.34
    for k in range(random.randint(1, 3)):
        c = fcols[(i + k) % 5]
        box('Scatole', c, (0.3, 0.22, hgt), (x, y, 0.81 + hgt / 2 + k * hgt), bevel=0.01)
        box('Scatole', 'Bianco', (0.2, 0.01, 0.2), (x, y - 0.112, 0.81 + hgt / 2 + k * hgt + 0.02))
# insegna sulla parete di fondo
box('Insegna', 'Rosa', (3.2, 0.08, 0.5), (-1.5, Y1 - 0.04, 2.6), bevel=0.04)
flush(DG, droot, smooth=('Figure', 'Capsule'))
text_mesh('InsegnaTesto', 'KAMEHOUSE', 0.36, (-1.5, Y1 - 0.1, 2.6), 'Carta', DG, extrude=0.02, parent=droot)
# lampade a sospensione
for x in (-2.6, -0.6, 1.2):
    cyl('Lampade', 'Inchiostro', 0.008, 0.5, (x, 0.3, 2.75), seg=6)
    cyl('Lampade', 'Giallo', 0.06, 0.18, (x, 0.3, 2.45), seg=20, r2=0.28)
    cyl('Lampade', 'Luce', 0.24, 0.01, (x, 0.3, 2.355), seg=20)
flush(DG, droot)

# --- scala verso il seminterrato (scende lungo +Y)
log('scala')
N = 13
run = (ST_Y1 - ST_Y0 - 0.2) / N
rise = (FH + SL) / N
for i in range(N):
    z = -rise * (i + 1)
    y = ST_Y0 + 0.1 + run * (i + 0.5)
    box('Scala', 'Legno', (ST_X1 - ST_X0 - 0.1, run + 0.02, 0.06), ((ST_X0 + ST_X1) / 2, y, z + rise - 0.03))
    box('Scala', 'LegnoScuro', (ST_X1 - ST_X0 - 0.1, 0.03, rise), ((ST_X0 + ST_X1) / 2, y + run / 2, z + rise / 2))
# ringhiera
for i in range(0, N + 1, 3):
    y = ST_Y0 + 0.1 + run * i; z = -rise * i
    cyl('Ringhiera', 'Inchiostro', 0.02, 0.9, (ST_X0 + 0.06, y, z + 0.45), seg=8)
L = math.hypot(ST_Y1 - ST_Y0 - 0.2, FH + SL)
ang = math.atan2(FH + SL, ST_Y1 - ST_Y0 - 0.2)
cyl('Ringhiera', 'Teal', 0.035, L, (ST_X0 + 0.06, (ST_Y0 + ST_Y1) / 2, -(FH + SL) / 2 + 0.9), rot=(math.pi / 2 - ang, 0, 0), seg=10)
# parapetto attorno all'apertura al piano terra
box('Ringhiera', 'Teal', (0.04, ST_Y1 - ST_Y0, 0.05), (ST_X1 + 0.02, (ST_Y0 + ST_Y1) / 2, 0.95))
for y in (ST_Y0 + 0.05, (ST_Y0 + ST_Y1) / 2, ST_Y1 - 0.05):
    cyl('Ringhiera', 'Inchiostro', 0.02, 0.95, (ST_X1 + 0.02, y, 0.475), seg=8)
# cartello "Sala giochi"
box('Cartello', 'Giallo', (0.9, 0.05, 0.32), (ST_X1 - 0.6, ST_Y0 - 0.05, 1.7), bevel=0.02)
flush(DG, droot)
text_mesh('CartelloTesto', 'GIOCA ↓', 0.17, (ST_X1 - 0.6, ST_Y0 - 0.085, 1.7), 'Inchiostro', DG, extrude=0.01, parent=droot)

# --- seminterrato: tavoli da gioco, sedie, carte, bacheca e insegna al neon
log('seminterrato')
ZB = -FH - SL
def table(cx, cy, rot=0.0):
    box('Tavoli', 'Legno', (1.6, 0.9, 0.05), (cx, cy, ZB + 0.75), bevel=0.01)
    box('Tavoli', 'Feltro', (1.4, 0.7, 0.01), (cx, cy, ZB + 0.78))
    for sx in (-1, 1):
        for sy in (-1, 1): box('Tavoli', 'Inchiostro', (0.05, 0.05, 0.73), (cx + sx * 0.72, cy + sy * 0.38, ZB + 0.365))
    for sx in (-1, 1):
        for k in (-1, 1):
            # sedia
            x = cx + k * 0.4; y = cy + sx * 0.75
            box('Sedie', 'Teal' if k > 0 else 'Rosa', (0.42, 0.42, 0.05), (x, y, ZB + 0.46), bevel=0.015)
            box('Sedie', 'Teal' if k > 0 else 'Rosa', (0.42, 0.05, 0.45), (x, y + sx * 0.2, ZB + 0.7), bevel=0.015)
            for a in (-1, 1):
                for b in (-1, 1): box('Sedie', 'Inchiostro', (0.03, 0.03, 0.44), (x + a * 0.18, y + b * 0.18, ZB + 0.22))
            # carte in mano del giocatore: un ventaglio e una fila davanti
            for c in range(4):
                box('Carte', random.choice(['Bianco', 'Giallo', 'Teal', 'Rosa']), (0.12, 0.17, 0.004),
                    (x - 0.2 + c * 0.14, cy + sx * 0.18, ZB + 0.79 + c * 0.0005), rot=(0, 0, random.uniform(-0.06, 0.06)))
            box('Carte', 'Viola', (0.12, 0.17, 0.06), (x + 0.32, cy + sx * 0.25, ZB + 0.81))   # mazzo
table(-2.4, 0.4)
table(-0.3, 0.4)
table(-1.35, -1.4)
# bacheca tornei sulla parete di fondo
box('Bacheca', 'LegnoScuro', (2.2, 0.06, 1.2), (-2.2, Y1 - 0.03, ZB + 1.7), bevel=0.02)
box('Bacheca', 'Carta', (2.05, 0.02, 1.05), (-2.2, Y1 - 0.07, ZB + 1.7))
for i in range(5):
    c = fcols[i]
    x = -3.0 + i * 0.4 + random.uniform(-0.05, 0.05); z = ZB + 1.7 + random.uniform(-0.25, 0.25)
    box('Bacheca', c, (0.3, 0.01, 0.4), (x, Y1 - 0.085, z), rot=(0, random.uniform(-0.1, 0.1), 0))
    cyl('Bacheca', 'Rosa', 0.025, 0.02, (x, Y1 - 0.095, z + 0.17), rot=(math.pi / 2, 0, 0), seg=8)
# scaffale con espositori di mazzi lungo la parete sinistra
for k in range(3):
    box('Mobili2', 'LegnoScuro', (0.4, 1.8, 0.04), (X0 + 0.2, 0.4, ZB + 0.6 + k * 0.5))
    for j in range(8):
        box('Mobili2', fcols[(j + k) % 5], (0.12, 0.09, 0.16), (X0 + 0.2, -0.35 + j * 0.21, ZB + 0.7 + k * 0.5), bevel=0.006)
box('Mobili2', 'LegnoScuro', (0.42, 0.04, 1.4), (X0 + 0.2, -0.5, ZB + 0.9))
box('Mobili2', 'LegnoScuro', (0.42, 0.04, 1.4), (X0 + 0.2, 1.3, ZB + 0.9))
# lucine lungo il bordo alto della parete di fondo
for i in range(22):
    x = X0 + 0.2 + i * (RW - 0.4) / 21
    sphere('Lucine', 'Luce', 0.035, (x, Y1 - 0.08, ZB + FH - 0.25 - 0.08 * math.sin(i / 21 * math.pi * 3) ** 2), seg=8, rings=6)
cyl('Lucine', 'Inchiostro', 0.006, RW - 0.4, (0, Y1 - 0.08, ZB + FH - 0.22), rot=(0, math.pi / 2, 0), seg=6)
# lampade sopra i tavoli
for x, y in ((-2.4, 0.4), (-0.3, 0.4), (-1.35, -1.4)):
    cyl('Lampade', 'Inchiostro', 0.008, 0.9, (x, y, ZB + FH - 0.45), seg=6)
    cyl('Lampade', 'Teal', 0.07, 0.16, (x, y, ZB + FH - 0.95), seg=20, r2=0.34)
    cyl('Lampade', 'Luce', 0.3, 0.01, (x, y, ZB + FH - 1.03), seg=20)
flush(DG, droot)
neon = text_mesh('Neon', 'GIOCA!', 0.42, (0.4, Y1 - 0.06, ZB + 2.05), 'Neon', DG, extrude=0.03, parent=droot)
box('NeonFondo', 'Inchiostro', (1.9, 0.04, 0.7), (0.4, Y1 - 0.02, ZB + 2.05), bevel=0.03)
flush(DG, droot)

dio_meta = {
    'size': [RW, FH * 2 + SL, RD], 'zb': ZB,
    # punti notevoli in coordinate three.js (x, z, -y)
    'stops': {
        'overview': [0.2, -1.2, 0], 'shelves': [-1.5, 1.3, -(Y1 - 0.3)], 'case': [VX, 1.1, -VY],
        'counter': [0.4, 1.1, 1.4], 'stairs': [(ST_X0 + ST_X1) / 2, -0.8, -(ST_Y0 + ST_Y1) / 2], 'tables': [-1.35, ZB + 0.9, -0.2],
    },
}

# ------------------------------------------------------------------ export
log('export')
def export(collname, path):
    for o in bpy.data.objects: o.select_set(False)
    for o in COLL[collname].all_objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_yup=True, export_materials='EXPORT', export_extras=False, export_cameras=False,
                              export_lights=False, export_animations=False)
    log('scritto', path, os.path.getsize(path) // 1024, 'KB')
export('Gacha', os.path.join(OUT, 'gacha-raw.glb'))
export('Diorama', os.path.join(OUT, 'diorama-raw.glb'))
json.dump({'gacha': gacha_meta, 'diorama': dio_meta}, open(os.path.join(OUT, 'kamehouse.json'), 'w'), indent=1)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
log('triangoli totali', tris)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(OUT, 'kamehouse.blend')))

# ------------------------------------------------------------------ render di riserva (Cycles + Freestyle per il tratto a china)
if DO_RENDER:
    scn.render.engine = 'CYCLES'
    scn.cycles.device = 'CPU'
    scn.cycles.samples = SAMPLES
    scn.cycles.use_denoising = True
    scn.render.film_transparent = True
    scn.render.use_freestyle = True
    scn.render.line_thickness_mode = 'ABSOLUTE'
    scn.render.line_thickness = 1.5
    vl = scn.view_layers[0]
    vl.use_freestyle = True
    ls = vl.freestyle_settings.linesets[0] if vl.freestyle_settings.linesets else vl.freestyle_settings.linesets.new('L')
    ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('Tratto')
    ls.linestyle.color = (0.07, 0.07, 0.09)
    scn.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('W'); scn.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 0.96, 0.9, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    sun = bpy.data.objects.new('Sole', bpy.data.lights.new('Sole', 'SUN')); scn.collection.objects.link(sun)
    sun.data.energy = 3.5; sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); scn.collection.objects.link(cam); scn.camera = cam

    def look(cam, pos, target, lens):
        cam.location = pos; cam.data.lens = lens
        d = Vector(target) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

    def render(name, show, pos, target, lens, res):
        for c in COLL.values():
            c.hide_render = c.name not in show
        look(cam, pos, target, lens)
        scn.render.resolution_x, scn.render.resolution_y = res
        scn.render.filepath = os.path.join(OUT, name)
        bpy.ops.render.render(write_still=True); log('render', name)

    render('render-gacha.png', {'Gacha'}, (2.6, -5.2, 2.6), (0, 0, 1.15), 55, (900, 1100))
    render('render-diorama.png', {'Diorama'}, (9.5, -11.5, 4.2), (-0.3, 0, -1.4), 38, (1600, 1200))
log('fine')
