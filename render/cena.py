"""Cena do passeio para o Blender (Cycles): a pastora preta de costas, em primeira pessoa, ao amanhecer.

Uso:  blender -b --factory-startup --python render/cena.py -- <saida.png> [quadro] [amostras]
Precisa de media-src/modelos/lobo-original.glb e media-src/render/ (HDRI e texturas do Poly Haven).
"""
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

RAIZ = Path(__file__).resolve().parent.parent
MIDIA = RAIZ / "media-src"
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
SAIDA = args[0] if args else str(MIDIA / "render" / "teste.png")
QUADRO = int(args[1]) if len(args) > 1 else 40
AMOSTRAS = int(args[2]) if len(args) > 2 else 192

cena = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)


# ---------------------------------------------------------------- materiais
def material(nome, **principled):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    for k, v in principled.items():
        bsdf.inputs[k].default_value = v
    return m


def material_pelo(nome, melanina, vermelho):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nos, lig = m.node_tree.nodes, m.node_tree.links
    nos.clear()
    saida = nos.new("ShaderNodeOutputMaterial")
    pelo = nos.new("ShaderNodeBsdfHairPrincipled")
    pelo.parametrization = "MELANIN"
    pelo.inputs["Melanin"].default_value = melanina
    pelo.inputs["Melanin Redness"].default_value = vermelho
    pelo.inputs["Roughness"].default_value = 0.42
    pelo.inputs["Radial Roughness"].default_value = 0.55
    pelo.inputs["Coat"].default_value = 0.12
    pelo.inputs["Random Color"].default_value = 0.12
    pelo.inputs["Random Roughness"].default_value = 0.2
    # pontas um pouco mais claras e quentes: o marrom-escuro da Ellie aparece na contraluz
    info = nos.new("ShaderNodeHairInfo")
    rampa = nos.new("ShaderNodeMapRange")
    rampa.inputs["From Min"].default_value, rampa.inputs["From Max"].default_value = 0.4, 1.0
    rampa.inputs["To Min"].default_value, rampa.inputs["To Max"].default_value = melanina, melanina - 0.12
    lig.new(info.outputs["Intercept"], rampa.inputs["Value"])
    lig.new(rampa.outputs["Result"], pelo.inputs["Melanin"])
    lig.new(pelo.outputs[0], saida.inputs["Surface"])
    return m


PELE = material("Pele", **{"Base Color": (0.012, 0.010, 0.009, 1), "Roughness": 0.7})
PELO = material_pelo("Pelo", 0.995, 0.12)
COURO = material("Couro conhaque", **{"Base Color": (0.27, 0.09, 0.03, 1), "Roughness": 0.45})
METAL = material("Argola", **{"Base Color": (0.75, 0.62, 0.4, 1), "Metallic": 1.0, "Roughness": 0.3})
CORDA = material("Corda sálvia", **{"Base Color": (0.075, 0.11, 0.07, 1), "Roughness": 0.85})

# ---------------------------------------------------------------- a cachorra
bpy.ops.import_scene.gltf(filepath=str(MIDIA / "modelos" / "lobo-original.glb"))
importados = list(bpy.context.selected_objects)
raiz = next(o for o in importados if o.parent is None)
armacao = next(o for o in importados if o.type == "ARMATURE")
corpo = None
for o in importados:
    if o.type != "MESH":
        continue
    nomes = [s.material.name for s in o.material_slots if s.material]
    if any(n.startswith("Wolf_1") for n in nomes):
        corpo = o
        o.data.materials.clear()
        o.data.materials.append(PELE)
    elif any(n.startswith(("Wolf_Fur", "Material.001")) for n in nomes):
        o.hide_render = o.hide_viewport = True  # cartões de pelo falsos e disco de sombra do arquivo original
    elif any(n.startswith("Wolf_claws") for n in nomes):
        o.data.materials.clear()
        o.data.materials.append(PELE)

acao = next(a for a in bpy.data.actions if "walk" in a.name.lower())
armacao.animation_data_create()
armacao.animation_data.action = acao
if hasattr(armacao.animation_data, "action_slot") and acao.slots:
    armacao.animation_data.action_slot = acao.slots[0]
cena.frame_set(QUADRO)

# escala de pastora-alemã (~1,35 m do focinho à cauda), patas no chão, olhando para -Y
bpy.context.view_layer.update()
dep = bpy.context.evaluated_depsgraph_get()
pts = np.array([corpo.matrix_world @ v.co for v in corpo.evaluated_get(dep).data.vertices])
tam = pts.max(0) - pts.min(0)
escala = 1.35 / max(tam[0], tam[1])
raiz.scale = tuple(s * escala for s in raiz.scale)
raiz.scale.x *= 1.12  # mais encorpada que o lobo original
bpy.context.view_layer.update()
pts = np.array([corpo.matrix_world @ v.co for v in corpo.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices])
frente_y = pts[:, 1].min() < -pts[:, 1].max()  # focinho do lado -Y?
if not frente_y:
    raiz.rotation_euler.z += math.pi
bpy.context.view_layer.update()
pts = np.array([corpo.matrix_world @ v.co for v in corpo.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices])
raiz.location.z -= pts[:, 2].min()
raiz.location.x -= (pts[:, 0].min() + pts[:, 0].max()) / 2
bpy.context.view_layer.update()

# ---------------------------------------------------------------- pelo (nós de geometria básicos)
def arvore_pelo(nome, alvo, densidade, comp, raio, material_):
    g = bpy.data.node_groups.new(nome, "GeometryNodeTree")
    g.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    n, l = g.nodes, g.links
    sai = n.new("NodeGroupOutput")
    info = n.new("GeometryNodeObjectInfo")
    info.inputs["Object"].default_value = alvo
    info.transform_space = "RELATIVE"
    pontos = n.new("GeometryNodeDistributePointsOnFaces")
    pontos.inputs["Density"].default_value = densidade
    l.new(info.outputs["Geometry"], pontos.inputs["Mesh"])
    # direção do fio: normal + "penteado" para trás (+Y, rumo à cauda) e um pouco de gravidade
    norm = pontos.outputs["Normal"]
    pente = n.new("ShaderNodeCombineXYZ")
    pente.inputs["X"].default_value, pente.inputs["Y"].default_value, pente.inputs["Z"].default_value = 0.0, 1.0, -0.35
    mist = n.new("ShaderNodeVectorMath")
    mist.operation = "SCALE"
    mist.inputs["Scale"].default_value = 0.45
    l.new(norm, mist.inputs[0])
    soma = n.new("ShaderNodeVectorMath")
    soma.operation = "ADD"
    l.new(mist.outputs[0], soma.inputs[0])
    l.new(pente.outputs[0], soma.inputs[1])
    unit = n.new("ShaderNodeVectorMath")
    unit.operation = "NORMALIZE"
    l.new(soma.outputs[0], unit.inputs[0])
    gira = n.new("FunctionNodeAlignRotationToVector")
    gira.axis = "Z"
    l.new(unit.outputs[0], gira.inputs["Vector"])
    linha = n.new("GeometryNodeCurvePrimitiveLine")
    linha.inputs["End"].default_value = (0, 0, comp)
    amostra = n.new("GeometryNodeResampleCurve")
    amostra.inputs["Count"].default_value = 5
    l.new(linha.outputs[0], amostra.inputs["Curve"])
    inst = n.new("GeometryNodeInstanceOnPoints")
    l.new(pontos.outputs["Points"], inst.inputs["Points"])
    l.new(amostra.outputs[0], inst.inputs["Instance"])
    l.new(gira.outputs[0], inst.inputs["Rotation"])
    tam_aleat = n.new("FunctionNodeRandomValue")
    tam_aleat.data_type = "FLOAT_VECTOR"
    tam_aleat.inputs["Min"].default_value = (1, 1, 0.55)
    tam_aleat.inputs["Max"].default_value = (1, 1, 1.25)
    l.new(tam_aleat.outputs["Value"], inst.inputs["Scale"])
    real = n.new("GeometryNodeRealizeInstances")
    l.new(inst.outputs[0], real.inputs[0])
    # ondulação: ruído crescendo para a ponta + caimento
    param = n.new("GeometryNodeSplineParameter")
    ruido = n.new("ShaderNodeTexNoise")
    ruido.inputs["Scale"].default_value = 38
    pos = n.new("GeometryNodeInputPosition")
    l.new(pos.outputs[0], ruido.inputs["Vector"])
    centro = n.new("ShaderNodeVectorMath")
    centro.operation = "SUBTRACT"
    l.new(ruido.outputs["Color"], centro.inputs[0])
    centro.inputs[1].default_value = (0.5, 0.5, 0.5)
    cai = n.new("ShaderNodeVectorMath")
    cai.operation = "ADD"
    l.new(centro.outputs[0], cai.inputs[0])
    cai.inputs[1].default_value = (0, 0.25, -0.6)
    quad = n.new("ShaderNodeMath")
    quad.operation = "POWER"
    quad.inputs[1].default_value = 2
    l.new(param.outputs["Factor"], quad.inputs[0])
    peso = n.new("ShaderNodeMath")
    peso.operation = "MULTIPLY"
    peso.inputs[1].default_value = comp * 0.6
    l.new(quad.outputs[0], peso.inputs[0])
    desloc = n.new("ShaderNodeVectorMath")
    desloc.operation = "SCALE"
    l.new(cai.outputs[0], desloc.inputs[0])
    l.new(peso.outputs[0], desloc.inputs["Scale"])
    setpos = n.new("GeometryNodeSetPosition")
    l.new(real.outputs[0], setpos.inputs["Geometry"])
    l.new(desloc.outputs[0], setpos.inputs["Offset"])
    # raio afinando na ponta
    afina = n.new("ShaderNodeMapRange")
    afina.inputs["To Min"].default_value, afina.inputs["To Max"].default_value = raio, raio * 0.15
    l.new(param.outputs["Factor"], afina.inputs["Value"])
    setraio = n.new("GeometryNodeSetCurveRadius")
    l.new(setpos.outputs[0], setraio.inputs["Curve"])
    l.new(afina.outputs["Result"], setraio.inputs["Radius"])
    setmat = n.new("GeometryNodeSetMaterial")
    setmat.inputs["Material"].default_value = material_
    l.new(setraio.outputs[0], setmat.inputs["Geometry"])
    l.new(setmat.outputs[0], sai.inputs[0])
    return g


def objeto_gn(nome, grupo):
    # objeto do tipo "Curves" (cabelo nativo do Blender): é o que o Cycles desenha como fios
    dados = bpy.data.hair_curves.new(nome)
    obj = bpy.data.objects.new(nome, dados)
    cena.collection.objects.link(obj)
    mod = obj.modifiers.new(nome, "NODES")
    mod.node_group = grupo
    return obj


objeto_gn("Pelo", arvore_pelo("Pelo", corpo, 140000, 0.058, 0.0009, PELO))

# ---------------------------------------------------------------- coleira e guia
bpy.context.view_layer.update()
ossos = {b.name: b for b in armacao.pose.bones}
pesc = next((b for n, b in ossos.items() if n.startswith("Hals_013")), None)
cab = next((b for n, b in ossos.items() if n.startswith("Kopf_002")), None)
a = armacao.matrix_world @ pesc.head
b = armacao.matrix_world @ cab.head
eixo = (b - a).normalized()
meio = a.lerp(b, 0.5)
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.098, depth=0.026, end_fill_type="NOTHING", location=meio)
coleira = bpy.context.active_object
coleira.rotation_euler = eixo.to_track_quat("Z", "Y").to_euler()
espessura = coleira.modifiers.new("Couro", "SOLIDIFY")
espessura.thickness = 0.004
coleira.data.materials.append(COURO)
bpy.ops.object.shade_smooth()
cima = Vector((0, 0, 1))
nuca = meio + (cima - eixo * eixo.dot(cima)).normalized() * 0.11

CAM = Vector((0.0, nuca.y + 3.7, 1.32))
mao = Vector((0.36, nuca.y + 3.15, 0.92))
curva = bpy.data.curves.new("Guia", "CURVE")
curva.dimensions = "3D"
curva.bevel_depth = 0.0075
curva.bevel_resolution = 4
sp = curva.splines.new("BEZIER")
sp.bezier_points.add(1)
for p, co in zip(sp.bezier_points, (mao, nuca)):
    p.co = co
    p.handle_left_type = p.handle_right_type = "AUTO"
sp.bezier_points[0].handle_right = mao.lerp(nuca, 0.35) + Vector((0, 0, -0.32))
sp.bezier_points[1].handle_left = mao.lerp(nuca, 0.75) + Vector((0, 0, -0.16))
guia = bpy.data.objects.new("Guia", curva)
guia.data.materials.append(CORDA)
cena.collection.objects.link(guia)

# ---------------------------------------------------------------- chão: trilha de terra + capim baixo
def textura_terra():
    m = bpy.data.materials.new("Terra")
    m.use_nodes = True
    nos, lig = m.node_tree.nodes, m.node_tree.links
    bsdf = nos["Principled BSDF"]
    coord = nos.new("ShaderNodeTexCoord")
    mapa = nos.new("ShaderNodeMapping")
    mapa.inputs["Scale"].default_value = (0.45, 0.45, 0.45)
    lig.new(coord.outputs["Object"], mapa.inputs["Vector"])
    def tex(nome, nao_cor=False):
        t = nos.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(str(MIDIA / "render" / f"park_dirt_{nome}.jpg"))
        if nao_cor:
            t.image.colorspace_settings.name = "Non-Color"
        lig.new(mapa.outputs[0], t.inputs["Vector"])
        return t
    lig.new(tex("Diffuse").outputs["Color"], bsdf.inputs["Base Color"])
    lig.new(tex("Rough", True).outputs["Color"], bsdf.inputs["Roughness"])
    nm = nos.new("ShaderNodeNormalMap")
    lig.new(tex("nor_gl", True).outputs["Color"], nm.inputs["Color"])
    lig.new(nm.outputs[0], bsdf.inputs["Normal"])
    return m


bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -14, 0))
trilha = bpy.context.active_object
trilha.scale = (1.25, 44, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
trilha.data.materials.append(textura_terra())
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -14, -0.01))
grama_base = bpy.context.active_object
grama_base.scale = (160, 200, 1)
grama_base.data.materials.append(material("Solo", **{"Base Color": (0.05, 0.07, 0.035, 1), "Roughness": 1.0}))
CAPIM = material("Capim", **{"Base Color": (0.11, 0.16, 0.06, 1), "Roughness": 0.65})
_n, _l = CAPIM.node_tree.nodes, CAPIM.node_tree.links
_info = _n.new("ShaderNodeHairInfo")
_rampa = _n.new("ShaderNodeValToRGB")
_rampa.color_ramp.elements[0].color = (0.025, 0.04, 0.018, 1)
_rampa.color_ramp.elements[1].color = (0.33, 0.33, 0.16, 1)
_meio = _rampa.color_ramp.elements.new(0.55)
_meio.color = (0.11, 0.17, 0.065, 1)
_l.new(_info.outputs["Intercept"], _rampa.inputs["Fac"])
_aleat = _n.new("ShaderNodeMixRGB")
_aleat.blend_type = "MULTIPLY"
_l.new(_info.outputs["Random"], _aleat.inputs["Fac"])
_aleat.inputs["Color2"].default_value = (0.7, 0.62, 0.45, 1)
_l.new(_rampa.outputs["Color"], _aleat.inputs["Color1"])
_l.new(_aleat.outputs["Color"], _n["Principled BSDF"].inputs["Base Color"])
bpy.ops.mesh.primitive_grid_add(x_subdivisions=240, y_subdivisions=400, size=1, location=(0, -22, 0))
campo = bpy.context.active_object
campo.scale = (30, 60, 1)
# tira a faixa da trilha do campo de capim
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="DESELECT")
bpy.ops.object.mode_set(mode="OBJECT")
for f in campo.data.polygons:
    c = campo.matrix_world @ f.center
    if abs(c.x) < 0.42 + 0.12 * math.sin(c.y * 0.9) ** 2:  # borda irregular: o capim invade a trilha
        f.select = True
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.delete(type="FACE")
bpy.ops.object.mode_set(mode="OBJECT")
campo.hide_render = True
grupo_capim = arvore_pelo("Capim", campo, 900, 0.26, 0.0016, CAPIM)
# capim cresce para cima, não "penteado"
for no in grupo_capim.nodes:
    if no.bl_idname == "ShaderNodeCombineXYZ":
        no.inputs["X"].default_value, no.inputs["Y"].default_value, no.inputs["Z"].default_value = 0.0, 0.05, 1.0
objeto_gn("Capim", grupo_capim)

# ---------------------------------------------------------------- mundo: HDRI de amanhecer com névoa
mundo = bpy.data.worlds.new("Amanhecer")
cena.world = mundo
mundo.use_nodes = True
nos, lig = mundo.node_tree.nodes, mundo.node_tree.links
fundo = nos["Background"]
env = nos.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(str(MIDIA / "render" / "misty_dawn_4k.hdr"))
coord = nos.new("ShaderNodeTexCoord")
mapa = nos.new("ShaderNodeMapping")
lig.new(coord.outputs["Generated"], mapa.inputs["Vector"])
lig.new(mapa.outputs[0], env.inputs["Vector"])
lig.new(env.outputs["Color"], fundo.inputs["Color"])
fundo.inputs["Strength"].default_value = 0.55

# acha o sol no HDRI e gira o mundo para ele ficar à frente da câmera (contraluz no pelo preto)
px = np.empty(env.image.size[0] * env.image.size[1] * 4, dtype=np.float32)
env.image.pixels.foreach_get(px)
px = px.reshape(env.image.size[1], env.image.size[0], 4)
lum = px[..., :3] @ np.array([0.2126, 0.7152, 0.0722])
yy, xx = np.unravel_index(np.argmax(lum), lum.shape)
u, v = xx / env.image.size[0], yy / env.image.size[1]
az_sol = (u - 0.5) * 2 * math.pi
alt_sol = (v - 0.5) * math.pi
# Blender: direção (x, y) do pixel u é atan2(y, -x) = 2π(u - 0.5); queremos o sol em -Y, um pouco à esquerda
alvo_az = math.atan2(-1.0, 0.12)
mapa.inputs["Rotation"].default_value[2] = alvo_az - az_sol
print("SOL", u, v, "elevação", math.degrees(alt_sol))

sol = bpy.data.lights.new("Sol", "SUN")
sol.energy = 9.0
sol.color = (1.0, 0.78, 0.6)
sol.angle = math.radians(1.5)
luz = bpy.data.objects.new("Sol", sol)
direcao = Vector((0.12, -1.0, math.tan(math.radians(6))))
luz.rotation_euler = (-direcao).to_track_quat("-Z", "Y").to_euler()
cena.collection.objects.link(luz)

# névoa volumétrica lavanda-pêssego
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -20, 6))
nevoa = bpy.context.active_object
nevoa.scale = (160, 200, 14)
mv = bpy.data.materials.new("Névoa")
mv.use_nodes = True
mv.node_tree.nodes.remove(mv.node_tree.nodes["Principled BSDF"])
vol = mv.node_tree.nodes.new("ShaderNodeVolumePrincipled")
vol.inputs["Color"].default_value = (0.86, 0.80, 0.86, 1)
vol.inputs["Anisotropy"].default_value = 0.6
_co = mv.node_tree.nodes.new("ShaderNodeTexCoord")
_sep = mv.node_tree.nodes.new("ShaderNodeSeparateXYZ")
_alt = mv.node_tree.nodes.new("ShaderNodeMapRange")
_alt.inputs["From Min"].default_value, _alt.inputs["From Max"].default_value = 0.0, 3.5
_alt.inputs["To Min"].default_value, _alt.inputs["To Max"].default_value = 0.011, 0.0012
mv.node_tree.links.new(_co.outputs["Object"], _sep.inputs[0])
_z = mv.node_tree.nodes.new("ShaderNodeMath")
_z.operation = "MULTIPLY_ADD"
_z.inputs[1].default_value, _z.inputs[2].default_value = 14.0, 6.0  # coordenada local → altura em metros
mv.node_tree.links.new(_sep.outputs["Z"], _z.inputs[0])
mv.node_tree.links.new(_z.outputs[0], _alt.inputs["Value"])
mv.node_tree.links.new(_alt.outputs["Result"], vol.inputs["Density"])
mv.node_tree.links.new(vol.outputs[0], mv.node_tree.nodes["Material Output"].inputs["Volume"])
nevoa.data.materials.append(mv)
nevoa.visible_shadow = False

# ---------------------------------------------------------------- câmera em primeira pessoa
cam = bpy.data.cameras.new("Olhar")
cam.lens = 35
cam.dof.use_dof = True
cam.dof.aperture_fstop = 2.0
camobj = bpy.data.objects.new("Olhar", cam)
cena.collection.objects.link(camobj)
camobj.location = CAM
alvo = Vector((0.0, nuca.y - 12.0, -0.25))
camobj.rotation_euler = (alvo - CAM).to_track_quat("-Z", "Y").to_euler()
cam.dof.focus_distance = (CAM - meio).length
cena.camera = camobj

# ---------------------------------------------------------------- render
cena.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "CUDA"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "CUDA"
cena.cycles.device = "GPU"
cena.cycles.samples = AMOSTRAS
cena.cycles.use_denoising = True
cena.cycles.denoiser = "OPENIMAGEDENOISE"
cena.cycles.volume_step_rate = 2.0
cena.render.resolution_x, cena.render.resolution_y = 1600, 900
cena.render.film_transparent = False
cena.view_settings.view_transform = "AgX"
cena.view_settings.look = "AgX - Medium High Contrast"
cena.render.image_settings.file_format = "PNG"
cena.render.filepath = SAIDA
dep = bpy.context.evaluated_depsgraph_get()
for nome in ("Pelo", "Capim"):
    ob = bpy.data.objects[nome].evaluated_get(dep)
    gs = ob.evaluated_geometry() if hasattr(ob, "evaluated_geometry") else None
    curvas = gs.curves if gs is not None and hasattr(gs, "curves") else None
    print("GEOM", nome, "curvas:", len(curvas.curves) if curvas else None, "avisos:", [m.node_group and [w.message for w in getattr(bpy.data.objects[nome].modifiers[0], "node_warnings", [])] for m in bpy.data.objects[nome].modifiers])
if "--so-checar" in sys.argv:
    raise SystemExit
bpy.ops.render.render(write_still=True)
print("RENDER", SAIDA)
