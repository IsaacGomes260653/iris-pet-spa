"""O passeio da abertura no Blender (Cycles): alameda de jacarandás ao amanhecer, terminando na loja Íris.

Duas camadas, montadas no navegador:
  fundo  → a câmera em primeira pessoa andando pela alameda (sem a cachorra), um quadro por posição da rolagem;
  cao    → a cachorra de costas com coleira, guia e sombra, em fundo transparente, na mesma câmera:
           ciclo de caminhada (amarrado à rolagem), respiração (parada) e a entrada na loja.

Cada tela tem a sua câmera: desktop 1920 × 1080 e celular 1080 × 1920 (vertical), na mesma posição.

Uso:
  blender -b --factory-startup --python render/parque.py -- fundo <pasta> <ini> <fim> --tela desktop|celular [--amostras N]
  blender -b --factory-startup --python render/parque.py -- cao <pasta> <andar|parada|entrada> --tela desktop|celular [--amostras N]
  (--escala P renderiza a P% da resolução, para testes; --quadros a,b,c escolhe quadros)
Precisa de media-src/parque (modelos e texturas do Poly Haven), media-src/modelos/lobo-cinza.glb,
media-src/render/misty_dawn_4k.hdr e media-src/fontes.

Memória (para caber num PC de 8 GB, até ~4 GB): texturas limitadas a 1024 px no render, céu reduzido a 2K, grama só
perto do caminho, pelo com menos fios e mais grossos, render em blocos (tiling). Cada render imprime "MEMORIA ...".
"""
import ctypes
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

RAIZ = Path(__file__).resolve().parent.parent
MIDIA = RAIZ / "media-src"
PARQUE = MIDIA / "parque"
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["fundo", str(MIDIA / "render" / "parque"), "0", "0"]


def opcao(nome, padrao):
    return type(padrao)(args[args.index(nome) + 1]) if nome in args else padrao


MODO = args[0]
SAIDA = Path(args[1]) if Path(args[1]).is_absolute() else RAIZ / args[1]  # o Blender resolveria relativo à raiz do disco
AMOSTRAS = opcao("--amostras", 64)
TELA = opcao("--tela", "desktop")
RES = (1920, 1080) if TELA == "desktop" else (1080, 1920)
TOTAL = opcao("--total", 180)  # quadros do fundo ao longo do caminho


def memoria():
    """Memória do processo (Windows): privada agora e no pico, e o pico de memória física."""
    try:
        class Info(ctypes.Structure):
            _fields_ = [("cb", ctypes.c_ulong), ("faltas", ctypes.c_ulong)] + [(n, ctypes.c_size_t) for n in (
                "pico_fisica", "fisica", "a", "b", "c", "d", "privada", "pico_privada")]

        k32, psapi = ctypes.WinDLL("kernel32"), ctypes.WinDLL("psapi")
        k32.GetCurrentProcess.restype = ctypes.c_void_p
        psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.POINTER(Info), ctypes.c_ulong]
        i = Info()
        i.cb = ctypes.sizeof(i)
        psapi.GetProcessMemoryInfo(k32.GetCurrentProcess(), ctypes.byref(i), i.cb)
        mb = 2 ** 20
        return f"privada {i.privada / mb:.0f} MB, pico privada {i.pico_privada / mb:.0f} MB, pico física {i.pico_fisica / mb:.0f} MB"
    except (AttributeError, OSError):
        return "indisponível"

# ---------------------------------------------------------------- medidas do passeio (metros; a câmera olha para +Y)
ALTURA_OLHO = 1.1  # um pouco acima da cachorra
Y_INICIO, Y_FIM = 0.0, 62.0  # a câmera anda de Y_INICIO a Y_FIM ao longo dos quadros do fundo
Q_ENTRADA = round(TOTAL * 0.84)  # a partir deste quadro a câmera desacelera e a cachorra se adianta até a porta
DIST_CAO = 1.45  # a cachorra anda sempre à frente da câmera, a esta distância: grande no centro de baixo, como a proa
Y_LOJA = 74.0  # fachada da loja (porta no centro do caminho)
LARGURA_CAMINHO = 2.3
INCLINA = math.radians(3)  # quase reta: o horizonte fica a ~40% da altura e sobra céu para as frases

cena = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- materiais
def material(nome, **principled):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    for k, v in principled.items():
        bsdf.inputs[k].default_value = v
    return m


def material_textura(nome, pasta, escala, tinta=(1, 1, 1, 1), sufixo_diff="diff"):
    """PBR do Poly Haven projetado em XY do mundo (chão e paredes sem costura)."""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nos, lig = m.node_tree.nodes, m.node_tree.links
    bsdf = nos["Principled BSDF"]
    coord = nos.new("ShaderNodeTexCoord")
    mapa = nos.new("ShaderNodeMapping")
    mapa.inputs["Scale"].default_value = (escala, escala, escala)
    lig.new(coord.outputs["UV"], mapa.inputs["Vector"])
    base = PARQUE / "tex" / pasta

    def tex(chave, nao_cor=False):
        arq = next(base.glob(f"*_{chave}_2k.jpg"))
        t = nos.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(str(arq), check_existing=True)
        if nao_cor:
            t.image.colorspace_settings.name = "Non-Color"
        lig.new(mapa.outputs[0], t.inputs["Vector"])
        return t

    tingir = nos.new("ShaderNodeMix")
    tingir.data_type = "RGBA"
    tingir.blend_type = "MULTIPLY"
    tingir.inputs["Factor"].default_value = 1.0
    tingir.inputs["B"].default_value = tinta
    lig.new(tex(sufixo_diff).outputs["Color"], tingir.inputs["A"])
    lig.new(tingir.outputs["Result"], bsdf.inputs["Base Color"])
    lig.new(tex("rough", True).outputs["Color"], bsdf.inputs["Roughness"])
    nm = nos.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 0.8
    lig.new(tex("nor_gl", True).outputs["Color"], nm.inputs["Color"])
    lig.new(nm.outputs[0], bsdf.inputs["Normal"])
    return m


def importar(caminho):
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(caminho))
    return [o for o in bpy.data.objects if o not in antes]


def gltf(nome):
    return next((PARQUE / nome).glob("*.gltf"))


def colecao(nome, objetos):
    """Guarda modelos importados numa coleção fora da cena (fonte de instâncias)."""
    col = bpy.data.collections.new(nome)
    for o in objetos:
        for c in o.users_collection:
            c.objects.unlink(o)
        col.objects.link(o)
        o.location = (0, 0, 0) if o.parent is None else o.location
    return col


def instancia(col, local, rot_z=0.0, escala=1.0):
    o = bpy.data.objects.new(col.name, None)
    o.instance_type = "COLLECTION"
    o.instance_collection = col
    o.location = local
    o.rotation_euler = (0, 0, rot_z)
    o.scale = (escala,) * 3
    cena.collection.objects.link(o)
    return o


# ---------------------------------------------------------------- chão: caminho de cascalho com flores e gramado
def faixa(nome, x0, x1, y0, y1, mat, uv_escala, sub=1):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=sub, y_subdivisions=max(1, int((y1 - y0) / 2)), size=1)
    o = bpy.context.active_object
    o.name = nome
    o.scale = (x1 - x0, y1 - y0, 1)
    o.location = ((x0 + x1) / 2, (y0 + y1) / 2, 0)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
    uv = o.data.uv_layers.active.data
    for laco in o.data.loops:
        co = o.data.vertices[laco.vertex_index].co
        uv[laco.index].uv = (co.x * uv_escala, co.y * uv_escala)
    o.data.materials.append(mat)
    return o


CASCALHO = material_textura("Cascalho com flores", "flower_scattered_gravel", 1.0, (0.86, 0.84, 0.86, 1))
GRAMA_CHAO = material_textura("Chão de grama", "grass_ground", 1.0, (0.55, 0.68, 0.45, 1))
TIJOLO = material_textura("Calçada da loja", "brick_pavement_02", 1.0, (0.9, 0.85, 0.82, 1))
meio = LARGURA_CAMINHO / 2


def chao_misto():
    """Um chão só: cascalho no meio e grama dos lados, com a borda irregular (sem faixa nem degrau)."""
    m = bpy.data.materials.new("Chão")
    m.use_nodes = True
    nos, lig = m.node_tree.nodes, m.node_tree.links
    bsdf = nos["Principled BSDF"]
    coord = nos.new("ShaderNodeTexCoord")

    def pbr(pasta, escala, tinta):
        mapa = nos.new("ShaderNodeMapping")
        mapa.inputs["Scale"].default_value = (escala,) * 3
        lig.new(coord.outputs["Object"], mapa.inputs["Vector"])
        out = {}
        for chave in ("diff", "rough", "nor_gl"):
            t = nos.new("ShaderNodeTexImage")
            t.image = bpy.data.images.load(str(next((PARQUE / "tex" / pasta).glob(f"*_{chave}_2k.jpg"))), check_existing=True)
            if chave != "diff":
                t.image.colorspace_settings.name = "Non-Color"
            lig.new(mapa.outputs[0], t.inputs["Vector"])
            out[chave] = t.outputs["Color"]
        mult = nos.new("ShaderNodeMix")
        mult.data_type = "RGBA"
        mult.blend_type = "MULTIPLY"
        mult.inputs["Factor"].default_value = 1.0
        mult.inputs[7].default_value = tinta
        lig.new(out["diff"], mult.inputs[6])
        out["diff"] = mult.outputs[2]
        return out

    a = pbr("flower_scattered_gravel", 0.5, (1.35, 1.25, 1.2, 1))
    b = pbr("grass_ground", 0.35, (0.42, 0.62, 0.34, 1))
    # o tapete de jacarandá: pétalas em manchas (ruído fino recortado por um ruído largo), por cima dos dois chãos
    petala = nos.new("ShaderNodeTexNoise")
    petala.inputs["Scale"].default_value = 70.0
    petala.inputs["Detail"].default_value = 0.0
    lig.new(coord.outputs["Object"], petala.inputs["Vector"])
    mancha = nos.new("ShaderNodeTexNoise")
    mancha.inputs["Scale"].default_value = 2.4
    lig.new(coord.outputs["Object"], mancha.inputs["Vector"])
    soma_p = nos.new("ShaderNodeMath")
    soma_p.operation = "MULTIPLY_ADD"
    soma_p.inputs[1].default_value = 0.7
    lig.new(petala.outputs["Fac"], soma_p.inputs[0])
    lig.new(mancha.outputs["Fac"], soma_p.inputs[2])
    cobre = nos.new("ShaderNodeMapRange")
    cobre.interpolation_type = "SMOOTHSTEP"
    cobre.inputs["From Min"].default_value, cobre.inputs["From Max"].default_value = 0.985, 1.04  # só um pó de pétalas: as de verdade vêm em instâncias
    lig.new(soma_p.outputs[0], cobre.inputs["Value"])
    for d_ in (a, b):
        ponte = nos.new("ShaderNodeMix")
        ponte.data_type = "RGBA"
        lig.new(cobre.outputs["Result"], ponte.inputs["Factor"])
        lig.new(d_["diff"], ponte.inputs[6])
        ponte.inputs[7].default_value = (0.3, 0.17, 0.52, 1)
        d_["diff"] = ponte.outputs[2]
    sep = nos.new("ShaderNodeSeparateXYZ")
    lig.new(coord.outputs["Object"], sep.inputs[0])
    absx = nos.new("ShaderNodeMath")
    absx.operation = "ABSOLUTE"
    lig.new(sep.outputs["X"], absx.inputs[0])
    ruido = nos.new("ShaderNodeTexNoise")
    ruido.inputs["Scale"].default_value = 2.2
    ruido.inputs["Detail"].default_value = 10
    ruido.inputs["Roughness"].default_value = 0.7
    lig.new(coord.outputs["Object"], ruido.inputs["Vector"])
    soma = nos.new("ShaderNodeMath")
    soma.operation = "MULTIPLY_ADD"
    soma.inputs[1].default_value = 0.45  # borda do caminho definida, só um pouco irregular
    lig.new(ruido.outputs["Fac"], soma.inputs[0])
    lig.new(absx.outputs[0], soma.inputs[2])
    borda = nos.new("ShaderNodeMapRange")
    borda.interpolation_type = "SMOOTHSTEP"
    borda.inputs["From Min"].default_value, borda.inputs["From Max"].default_value = meio + 0.2, meio + 0.45
    lig.new(soma.outputs[0], borda.inputs["Value"])
    for chave, destino in (("diff", "Base Color"), ("rough", "Roughness"), ("nor_gl", None)):
        mx = nos.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        lig.new(borda.outputs["Result"], mx.inputs["Factor"])
        lig.new(a[chave], mx.inputs[6])
        lig.new(b[chave], mx.inputs[7])
        if destino:
            lig.new(mx.outputs[2], bsdf.inputs[destino])
        else:
            nm = nos.new("ShaderNodeNormalMap")
            nm.inputs["Strength"].default_value = 0.8
            lig.new(mx.outputs[2], nm.inputs["Color"])
            lig.new(nm.outputs[0], bsdf.inputs["Normal"])
    return m


CHAO = chao_misto()
chao = faixa("Chão", -60, 60, -12, Y_LOJA + 30, CHAO, 0.5, 60)
gramado_e = faixa("Gramado esq", -18, -meio - 0.1, -6, Y_LOJA + 4, GRAMA_CHAO, 0.35, 12)
gramado_d = faixa("Gramado dir", meio + 0.1, 18, -6, Y_LOJA + 4, GRAMA_CHAO, 0.35, 12)
for g_ in (gramado_e, gramado_d):
    g_.hide_render = True  # só base para espalhar a vegetação
calcada = faixa("Calçada", -9, 9, Y_LOJA - 6, Y_LOJA + 0.5, TIJOLO, 0.55)
calcada.location.z = 0.012


def petalas():
    """Pétalas caídas de verdade: discos de 2,4 cm lilases e translúcidos espalhados no chão, em tufos, mais densos
    debaixo das copas (|x| de 3 a 8 m) que no meio do caminho. Instâncias: a malha é uma só."""
    bpy.ops.mesh.primitive_circle_add(vertices=6, radius=0.012, fill_type="TRIFAN")
    petala = bpy.context.active_object
    petala.name = "Pétala"
    petala.scale.y = 0.7
    bpy.ops.object.transform_apply(scale=True)
    m = material("Pétala", **{"Base Color": (0.5, 0.33, 0.72, 1), "Roughness": 0.6})
    nos_, lig_ = m.node_tree.nodes, m.node_tree.links
    transl = nos_.new("ShaderNodeBsdfTranslucent")
    transl.inputs["Color"].default_value = (0.6, 0.4, 0.8, 1)
    junta = nos_.new("ShaderNodeMixShader")
    junta.inputs["Fac"].default_value = 0.35
    lig_.new(nos_["Principled BSDF"].outputs[0], junta.inputs[1])
    lig_.new(transl.outputs[0], junta.inputs[2])
    lig_.new(junta.outputs[0], nos_["Material Output"].inputs["Surface"])
    petala.data.materials.append(m)
    col = colecao("Pétalas", [petala])
    base = faixa("Chão das pétalas", -8, 8, -6, Y_LOJA - 6.5, CHAO, 1.0, 8)
    base.data.materials.clear()
    g = bpy.data.node_groups.new("Pétalas", "GeometryNodeTree")
    g.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    g.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    n, l = g.nodes, g.links
    ent, sai = n.new("NodeGroupInput"), n.new("NodeGroupOutput")
    pts = n.new("GeometryNodeDistributePointsOnFaces")
    pts.inputs["Density"].default_value = 420.0
    l.new(ent.outputs[0], pts.inputs["Mesh"])
    # tufos (ruído) + mais pétalas longe do eixo do caminho: apaga onde a soma fica abaixo do corte
    pos = n.new("GeometryNodeInputPosition")
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(pos.outputs[0], sep.inputs[0])
    absx = n.new("ShaderNodeMath")
    absx.operation = "ABSOLUTE"
    l.new(sep.outputs["X"], absx.inputs[0])
    sob_copa = n.new("ShaderNodeMapRange")
    sob_copa.inputs["From Min"].default_value, sob_copa.inputs["From Max"].default_value = 1.5, 4.5
    sob_copa.inputs["To Min"].default_value, sob_copa.inputs["To Max"].default_value = 0.0, 0.22
    l.new(absx.outputs[0], sob_copa.inputs["Value"])
    ruido = n.new("ShaderNodeTexNoise")
    ruido.inputs["Scale"].default_value = 1.3
    ruido.inputs["Detail"].default_value = 4.0
    l.new(pos.outputs[0], ruido.inputs["Vector"])
    soma = n.new("ShaderNodeMath")
    l.new(ruido.outputs["Fac"], soma.inputs[0])
    l.new(sob_copa.outputs["Result"], soma.inputs[1])
    pouco = n.new("ShaderNodeMath")
    pouco.operation = "LESS_THAN"
    pouco.inputs[1].default_value = 0.6
    l.new(soma.outputs[0], pouco.inputs[0])
    apaga = n.new("GeometryNodeDeleteGeometry")
    apaga.domain = "POINT"
    l.new(pts.outputs["Points"], apaga.inputs["Geometry"])
    l.new(pouco.outputs[0], apaga.inputs["Selection"])
    info = n.new("GeometryNodeCollectionInfo")
    info.inputs["Collection"].default_value = col
    info.inputs["Separate Children"].default_value = True
    info.inputs["Reset Children"].default_value = True
    inst = n.new("GeometryNodeInstanceOnPoints")
    l.new(apaga.outputs[0], inst.inputs["Points"])
    l.new(info.outputs[0], inst.inputs["Instance"])
    rot = n.new("FunctionNodeRandomValue")
    rot.data_type = "FLOAT_VECTOR"
    rot.inputs["Min"].default_value = (-0.35, -0.35, 0)
    rot.inputs["Max"].default_value = (0.35, 0.35, 6.283)
    l.new(rot.outputs["Value"], inst.inputs["Rotation"])
    esc = n.new("FunctionNodeRandomValue")
    esc.data_type = "FLOAT"
    esc.inputs["Min"].default_value, esc.inputs["Max"].default_value = 0.7, 1.35
    l.new(esc.outputs["Value"], inst.inputs["Scale"])
    sobe = n.new("GeometryNodeTranslateInstances")
    sobe.inputs["Translation"].default_value = (0, 0, 0.004)
    l.new(inst.outputs[0], sobe.inputs["Instances"])
    l.new(sobe.outputs[0], sai.inputs[0])
    base.modifiers.new("Pétalas", "NODES").node_group = g


petalas()

# ---------------------------------------------------------------- vegetação (Poly Haven, CC0)
def preparar(nome):
    objs = importar(gltf(nome))
    return colecao(nome, [o for o in objs])


jacaranda = preparar("jacaranda_tree")
grama = preparar("grass_medium_02")
samambaia = preparar("fern_02")
pervinca = preparar("periwinkle_plant")
arbusto = preparar("shrub_02")
arbusto_flor = preparar("shrub_04")
dente = preparar("dandelion_01")
vaso = preparar("potted_plant_02")
jardineira = preparar("planter_box_01")

# jacarandás dos dois lados, perto do caminho e próximos entre si: as copas se encontram por cima (um túnel lilás);
# perto da loja a fileira para, e a fachada aparece no fim do túnel
for lado in (-1, 1):
    y = -8.0 + (3.0 if lado > 0 else 0.0)
    while y < Y_LOJA - 8:
        x = lado * rng.uniform(5.4, 6.2)  # as copas quase se tocam: fica uma faixa de céu sobre o caminho
        instancia(jacaranda, (x, y, 0), rng.uniform(0, 2 * math.pi), rng.uniform(0.56, 0.66))
        y += rng.uniform(7.5, 9.0)
# segunda fileira, mais longe, só para encher a névoa
for lado in (-1, 1):
    for y in np.arange(-6, Y_LOJA + 20, 13.0):
        instancia(jacaranda, (lado * rng.uniform(15, 20), y + rng.uniform(-3, 3), 0), rng.uniform(0, 6.28), rng.uniform(0.55, 0.7))


def florada(col):
    """Jacarandá em flor: parte das folhas (por ilha da malha) vira lilás, o resto fica verde."""
    for o in col.all_objects:
        for slot in o.material_slots:
            m = slot.material
            if not m or "leaves" not in m.name:
                continue
            nos, lig = m.node_tree.nodes, m.node_tree.links
            bsdf = next(n for n in nos if n.type == "BSDF_PRINCIPLED")
            origem = bsdf.inputs["Base Color"].links[0].from_socket
            matiz = nos.new("ShaderNodeHueSaturation")
            matiz.inputs["Hue"].default_value = 0.05  # verde → violeta-lilás de jacarandá (não azul)
            matiz.inputs["Saturation"].default_value = 1.05
            matiz.inputs["Value"].default_value = 2.6
            lig.new(origem, matiz.inputs["Color"])
            geo = nos.new("ShaderNodeNewGeometry")
            corte = nos.new("ShaderNodeMath")
            corte.operation = "GREATER_THAN"
            corte.inputs[1].default_value = 0.4  # ~60% das ilhas em flor, o resto verde
            lig.new(geo.outputs["Random Per Island"], corte.inputs[0])
            mistura = nos.new("ShaderNodeMix")
            mistura.data_type = "RGBA"
            lig.new(corte.outputs[0], mistura.inputs["Factor"])
            lig.new(origem, mistura.inputs["A"])
            lig.new(matiz.outputs["Color"], mistura.inputs["B"])
            lig.new(mistura.outputs["Result"], bsdf.inputs["Base Color"])
            saida = next(n for n in nos if n.type == "OUTPUT_MATERIAL")
            transl = nos.new("ShaderNodeBsdfTranslucent")
            lig.new(mistura.outputs["Result"], transl.inputs["Color"])
            junta = nos.new("ShaderNodeMixShader")
            junta.inputs["Fac"].default_value = 0.55
            lig.new(bsdf.outputs[0], junta.inputs[1])
            lig.new(transl.outputs[0], junta.inputs[2])
            lig.new(junta.outputs[0], saida.inputs["Surface"])
            print("FLORADA", m.name, flush=True)


florada(jacaranda)


def espalhar(nome, alvo, col, densidade, escala, afastar=0.0, semente=0):
    """Nós de geometria: instancia a coleção sobre a malha (rotação e escala aleatórias)."""
    g = bpy.data.node_groups.new(nome, "GeometryNodeTree")
    g.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    g.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    n, l = g.nodes, g.links
    ent, sai = n.new("NodeGroupInput"), n.new("NodeGroupOutput")
    pts = n.new("GeometryNodeDistributePointsOnFaces")
    pts.inputs["Density"].default_value = densidade
    pts.inputs["Seed"].default_value = semente
    l.new(ent.outputs[0], pts.inputs["Mesh"])
    # longe do caminho: some o que está a menos de "afastar" metros do eixo x = 0
    pos = n.new("GeometryNodeInputPosition")
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(pos.outputs[0], sep.inputs[0])
    absx = n.new("ShaderNodeMath")
    absx.operation = "ABSOLUTE"
    l.new(sep.outputs["X"], absx.inputs[0])
    ruido = n.new("ShaderNodeTexNoise")
    ruido.inputs["Scale"].default_value = 0.7
    l.new(pos.outputs[0], ruido.inputs["Vector"])
    borda = n.new("ShaderNodeMath")
    borda.operation = "MULTIPLY_ADD"
    borda.inputs[1].default_value = 0.6
    borda.inputs[2].default_value = afastar - 0.3
    l.new(ruido.outputs["Fac"], borda.inputs[0])
    perto = n.new("ShaderNodeMath")
    perto.operation = "LESS_THAN"
    l.new(absx.outputs[0], perto.inputs[0])
    l.new(borda.outputs[0], perto.inputs[1])
    # nada de mato na calçada de tijolos da loja
    na_calcada = n.new("ShaderNodeMath")
    na_calcada.operation = "GREATER_THAN"
    na_calcada.inputs[1].default_value = Y_LOJA - 6.6
    l.new(sep.outputs["Y"], na_calcada.inputs[0])
    largo = n.new("ShaderNodeMath")
    largo.operation = "LESS_THAN"
    largo.inputs[1].default_value = 9.4
    l.new(absx.outputs[0], largo.inputs[0])
    calc = n.new("ShaderNodeMath")
    calc.operation = "MULTIPLY"
    l.new(na_calcada.outputs[0], calc.inputs[0])
    l.new(largo.outputs[0], calc.inputs[1])
    algum = n.new("ShaderNodeMath")
    algum.operation = "MAXIMUM"
    l.new(perto.outputs[0], algum.inputs[0])
    l.new(calc.outputs[0], algum.inputs[1])
    apaga = n.new("GeometryNodeDeleteGeometry")
    apaga.domain = "POINT"
    l.new(pts.outputs["Points"], apaga.inputs["Geometry"])
    l.new(algum.outputs[0], apaga.inputs["Selection"])
    info = n.new("GeometryNodeCollectionInfo")
    info.inputs["Collection"].default_value = col
    info.inputs["Separate Children"].default_value = True
    info.inputs["Reset Children"].default_value = True
    inst = n.new("GeometryNodeInstanceOnPoints")
    inst.inputs["Pick Instance"].default_value = True
    l.new(apaga.outputs[0], inst.inputs["Points"])
    l.new(info.outputs[0], inst.inputs["Instance"])
    idx = n.new("FunctionNodeRandomValue")
    idx.data_type = "INT"
    idx.inputs["Min"].default_value, idx.inputs["Max"].default_value = 0, 64
    l.new(idx.outputs["Value"], inst.inputs["Instance Index"])
    rot = n.new("FunctionNodeRandomValue")
    rot.data_type = "FLOAT_VECTOR"
    rot.inputs["Min"].default_value = (0, 0, 0)
    rot.inputs["Max"].default_value = (0, 0, 6.283)
    l.new(rot.outputs["Value"], inst.inputs["Rotation"])
    esc = n.new("FunctionNodeRandomValue")
    esc.data_type = "FLOAT"
    esc.inputs["Min"].default_value, esc.inputs["Max"].default_value = escala * 0.65, escala * 1.25
    l.new(esc.outputs["Value"], inst.inputs["Scale"])
    junta = n.new("GeometryNodeJoinGeometry")
    l.new(inst.outputs[0], junta.inputs[0])
    l.new(ent.outputs[0], junta.inputs[0])
    l.new(junta.outputs[0], sai.inputs[0])
    if alvo.hide_render:  # a base some, as instâncias ficam: um objeto visível só com a vegetação
        base = bpy.data.objects.new(nome, alvo.data)
        cena.collection.objects.link(base)
        alvo = base
        apaga_base = n.new("GeometryNodeDeleteGeometry")
        apaga_base.domain = "FACE"
        l.new(ent.outputs[0], apaga_base.inputs["Geometry"])
        l.new(apaga_base.outputs[0], junta.inputs[0])
        for lk in list(junta.inputs[0].links):
            if lk.from_node == ent:
                g.links.remove(lk)
    mod = alvo.modifiers.new(nome, "NODES")
    mod.node_group = g


for i, lado in enumerate((gramado_e, gramado_d)):
    espalhar(f"Grama {i}", lado, grama, 14.0, 1.0, afastar=2.0, semente=i)  # a touceira tem ~1,3 m: o centro fica longe da borda
    # samambaias e pervincas (flores lilás) junto do caminho; dentes-de-leão espalhados
    espalhar(f"Pervinca {i}", lado, pervinca, 0.18, 1.0, afastar=1.5, semente=10 + i)
    espalhar(f"Samambaia {i}", lado, samambaia, 0.12, 0.9, afastar=2.2, semente=20 + i)
    espalhar(f"Dente {i}", lado, dente, 0.25, 1.0, afastar=1.6, semente=30 + i)


# postes de luz de praça: haste verde escura e lanterna morna (ainda acesa ao amanhecer)
POSTE = material("Poste", **{"Base Color": (0.05, 0.08, 0.07, 1), "Metallic": 0.6, "Roughness": 0.45})
LANTERNA = material("Lanterna", **{"Base Color": (1, 0.8, 0.55, 1), "Emission Color": (1.0, 0.72, 0.45, 1), "Emission Strength": 2.2})
for k, y in enumerate(np.arange(11, Y_LOJA - 8, 13.0)):
    lado = 1 if k % 2 == 0 else -1
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.05, depth=3.4, location=(lado * 3.2, y, 1.7))
    bpy.context.active_object.data.materials.append(POSTE)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.13, depth=0.36, location=(lado * 3.2, y, 3.5))
    bpy.context.active_object.data.materials.append(LANTERNA)
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.2, depth=0.18, location=(lado * 3.2, y, 3.76))
    bpy.context.active_object.data.materials.append(POSTE)

# ---------------------------------------------------------------- a loja Íris no fim da alameda
antes_da_loja = set(bpy.data.objects)
REBOCO = material("Reboco creme", **{"Base Color": (0.86, 0.79, 0.67, 1), "Roughness": 0.85})
SALVIA = material("Verde-sálvia", **{"Base Color": (0.27, 0.36, 0.3, 1), "Roughness": 0.55})
VIDRO = material("Vidro", **{"Base Color": (0.9, 0.92, 0.92, 1), "Transmission Weight": 1.0, "Roughness": 0.02, "IOR": 1.05})
INTERIOR = material("Interior aceso", **{"Base Color": (1, 0.85, 0.7, 1), "Emission Color": (1.0, 0.83, 0.62, 1), "Emission Strength": 9.0})
LETRA = material("Letreiro", **{"Base Color": (0.98, 0.95, 0.9, 1), "Roughness": 0.4, "Emission Color": (1, 0.96, 0.9, 1), "Emission Strength": 2.5})
TOLDO = material("Toldo", **{"Base Color": (0.42, 0.53, 0.46, 1), "Roughness": 0.8, "Sheen Weight": 0.4})


def interior(x, y, base, larg, alt):
    """O lado de dentro: foto de uma parede de produtos de petshop, acesa e morna, em cada vão."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, base + alt / 2), rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.scale = (larg, alt, 1)
    m = bpy.data.materials.new(f"Interior {x}")
    m.use_nodes = True
    nos, lig = m.node_tree.nodes, m.node_tree.links
    saida = nos["Material Output"]
    nos.remove(nos["Principled BSDF"])
    tex = nos.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(MIDIA / "interior-loja.jpg"), check_existing=True)
    mapa = nos.new("ShaderNodeMapping")
    # cada vão mostra um pedaço diferente da foto, na proporção dele
    foto_ar = tex.image.size[0] / tex.image.size[1]
    mapa.inputs["Scale"].default_value = (larg / alt / foto_ar * 0.9, 0.9, 1)
    mapa.inputs["Location"].default_value = (0.05 + (x + 4) / 12 * 0.5, 0.05, 0)
    coord = nos.new("ShaderNodeTexCoord")
    lig.new(coord.outputs["UV"], mapa.inputs["Vector"])
    lig.new(mapa.outputs[0], tex.inputs["Vector"])
    morno = nos.new("ShaderNodeMix")
    morno.data_type = "RGBA"
    morno.blend_type = "MULTIPLY"
    morno.inputs["Factor"].default_value = 1.0
    morno.inputs[7].default_value = (1.0, 0.82, 0.62, 1)
    lig.new(tex.outputs["Color"], morno.inputs[6])
    em = nos.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 3.6
    lig.new(morno.outputs[2], em.inputs["Color"])
    lig.new(em.outputs[0], saida.inputs["Surface"])
    o.data.materials.append(m)
    return o


def caixa(nome, centro, tam, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=centro)
    o = bpy.context.active_object
    o.name = nome
    o.scale = tam
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    # UV por projeção cúbica simples para o reboco
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.uv.cube_project(cube_size=2.0)
    bpy.ops.object.mode_set(mode="OBJECT")
    return o


L = 12.0  # largura da fachada
predio = caixa("Prédio", (0, Y_LOJA + 4, 2.1), (L, 8, 4.2), REBOCO)
caixa("Platibanda", (0, Y_LOJA - 0.05, 4.0), (L + 0.3, 0.3, 0.5), REBOCO)
# porta e vitrines: molduras verde-sálvia, vidro e o interior aceso logo atrás
for x, larg, alt, base in ((0, 1.5, 2.6, 0.0), (-3.6, 3.2, 2.3, 0.5), (3.6, 3.2, 2.3, 0.5)):
    moldura = caixa("Moldura", (x, Y_LOJA + 0.02, base + alt / 2), (larg + 0.24, 0.12, alt + 0.24), SALVIA)
    if x != 0:  # a porta fica aberta: a cachorra entra por ela
        caixa("Vidro", (x, Y_LOJA - 0.05, base + alt / 2), (larg, 0.02, alt), VIDRO)
    interior(x, Y_LOJA + 1.1, base, larg, alt)
    corte = caixa("Corte", (x, Y_LOJA + 0.6, base + alt / 2), (larg, 1.4, alt), REBOCO)
    corte.hide_render = corte.hide_viewport = True
    for alvo_ in (predio, moldura):  # o vão atravessa a parede e a moldura (sobra só o caixilho)
        bo = alvo_.modifiers.new("Vão", "BOOLEAN")
        bo.operation = "DIFFERENCE"
        bo.object = corte
    if x != 0:
        instancia(jardineira, (x, Y_LOJA - 0.45, 0.0), 0.0, 1.6)
# toldo inclinado sobre porta e vitrines
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, Y_LOJA - 0.42, 2.98))
toldo = bpy.context.active_object
toldo.scale = (L - 1.2, 0.9, 1)
toldo.rotation_euler = (math.radians(-22), 0, 0)
toldo.data.materials.append(TOLDO)
toldo.modifiers.new("Espessura", "SOLIDIFY").thickness = 0.03
# letreiro: "Íris" em Literata e "PET SPA" em Martian Mono, sobre faixa verde-sálvia
caixa("Faixa do letreiro", (0, Y_LOJA - 0.12, 3.48), (5.2, 0.08, 0.78), SALVIA)


def texto(conteudo, fonte, tamanho, local, extrude=0.02):
    curva = bpy.data.curves.new(conteudo, "FONT")
    curva.body = conteudo
    curva.font = bpy.data.fonts.load(str(MIDIA / "fontes" / fonte), check_existing=True)
    curva.size = tamanho
    curva.align_x = "CENTER"
    curva.align_y = "CENTER"
    curva.extrude = extrude
    o = bpy.data.objects.new(conteudo, curva)
    o.location = local
    o.rotation_euler = (math.radians(90), 0, 0)
    o.data.materials.append(LETRA)
    cena.collection.objects.link(o)
    return o


texto("Íris", "Literata.ttf", 0.66, (-0.55, Y_LOJA - 0.2, 3.52))
texto("PET SPA", "MartianMono.ttf", 0.17, (1.1, Y_LOJA - 0.2, 3.45), 0.012)
for x in (-1.25, 1.25):
    instancia(vaso, (x, Y_LOJA - 0.5, 0.0), rng.uniform(0, 6.28), 1.25)
for x, y in ((-10.5, Y_LOJA - 1), (10.5, Y_LOJA + 1.5), (-6, Y_LOJA + 11), (7, Y_LOJA + 12)):
    instancia(jacaranda, (x, y, 0), rng.uniform(0, 6.28), 0.6)
# cerca viva dos lados da loja
for x in (-8.5, 8.5):
    for y in (Y_LOJA - 1.5, Y_LOJA + 2.0):
        instancia(arbusto, (x, y, 0.6), rng.uniform(0, 6.28), 0.9)

LOJA = [o for o in bpy.data.objects if o not in antes_da_loja]

# ---------------------------------------------------------------- mundo: céu de amanhecer, sol baixo à frente e névoa rasteira
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
fundo.inputs["Strength"].default_value = 0.95
# gira o HDRI para o sol dele ficar à frente da câmera (+Y), levemente à esquerda: contraluz no pelo preto
px = np.empty(env.image.size[0] * env.image.size[1] * 4, dtype=np.float32)
env.image.pixels.foreach_get(px)
px = px.reshape(env.image.size[1], env.image.size[0], 4)
lum = px[..., :3] @ np.array([0.2126, 0.7152, 0.0722])
yy, xx = np.unravel_index(np.argmax(lum), lum.shape)
az_sol = (xx / env.image.size[0] - 0.5) * 2 * math.pi
mapa.inputs["Rotation"].default_value[2] = math.atan2(1.0, -0.06) - az_sol
del px, lum
env.image.scale(2048, 1024)

sol = bpy.data.lights.new("Sol", "SUN")
sol.energy = 8.0
sol.color = (1.0, 0.64, 0.42)
sol.angle = math.radians(2.5)
luz = bpy.data.objects.new("Sol", sol)
DIR_SOL = Vector((-0.06, 1.0, math.tan(math.radians(6)))).normalized()  # quase de frente: as sombras da grama correm junto ao caminho  # de onde a luz vem
luz.rotation_euler = (-DIR_SOL).to_track_quat("-Z", "Y").to_euler()
cena.collection.objects.link(luz)
# o céu atrás de quem passeia: luz fraca e fria vinda de trás, sem sombra marcada, que acende o lilás das copas
ceu = bpy.data.lights.new("Céu atrás", "SUN")
ceu.energy = 2.0
ceu.color = (0.85, 0.82, 1.0)
ceu.angle = math.radians(30)
luz_ceu = bpy.data.objects.new("Céu atrás", ceu)
luz_ceu.rotation_euler = Vector((0.15, 1.0, -0.55)).normalized().to_track_quat("-Z", "Y").to_euler()
cena.collection.objects.link(luz_ceu)
# a loja fica fora dessa luz: contra o sol, a fachada fica na sombra suave e o que brilha são as vitrines e o letreiro
sem_luz_de_tras = bpy.data.collections.new("Sem luz de trás")
for o in LOJA:
    sem_luz_de_tras.objects.link(o)
luz_ceu.light_linking.receiver_collection = sem_luz_de_tras
for item in sem_luz_de_tras.collection_objects:
    item.light_linking.link_state = "EXCLUDE"

# névoa: densa rente ao chão e rala no alto, lavanda; a luz do sol à frente acende o véu (anisotropia)
# o cubo começa 40 cm abaixo do chão: com a face colada no chão (z = 0) os raios ficavam ora dentro, ora fora do
# volume, e o cascalho saía riscado nas arestas da malha
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, Y_LOJA / 2, 6.8))
nevoa = bpy.context.active_object
nevoa.name = "Névoa"
nevoa.scale = (140, 200, 14.4)
mv = bpy.data.materials.new("Névoa")
mv.use_nodes = True
mv.node_tree.nodes.remove(mv.node_tree.nodes["Principled BSDF"])
vol = mv.node_tree.nodes.new("ShaderNodeVolumePrincipled")
vol.inputs["Color"].default_value = (0.9, 0.85, 0.95, 1)
vol.inputs["Anisotropy"].default_value = 0.82
_co = mv.node_tree.nodes.new("ShaderNodeTexCoord")
_sep = mv.node_tree.nodes.new("ShaderNodeSeparateXYZ")
mv.node_tree.links.new(_co.outputs["Object"], _sep.inputs[0])
_z = mv.node_tree.nodes.new("ShaderNodeMath")
_z.operation = "MULTIPLY_ADD"
_z.inputs[1].default_value, _z.inputs[2].default_value = 14.4, 6.8  # coordenada local → altura em metros
mv.node_tree.links.new(_sep.outputs["Z"], _z.inputs[0])
_alt = mv.node_tree.nodes.new("ShaderNodeMapRange")
_alt.interpolation_type = "SMOOTHSTEP"
_alt.inputs["From Min"].default_value, _alt.inputs["From Max"].default_value = 0.0, 6.0
_alt.inputs["To Min"].default_value, _alt.inputs["To Max"].default_value = 0.016, 0.003
mv.node_tree.links.new(_z.outputs[0], _alt.inputs["Value"])
mv.node_tree.links.new(_alt.outputs["Result"], vol.inputs["Density"])
mv.node_tree.links.new(vol.outputs[0], mv.node_tree.nodes["Material Output"].inputs["Volume"])
nevoa.data.materials.append(mv)
nevoa.visible_shadow = False

# ---------------------------------------------------------------- câmera em primeira pessoa
cam = bpy.data.cameras.new("Olhar")
cam.sensor_width = 36
if TELA == "desktop":
    cam.sensor_fit = "HORIZONTAL"
    cam.lens = 35  # ~54° na horizontal: a cachorra entra cortada na base, como a proa
else:
    cam.sensor_fit = "VERTICAL"
    cam.lens = 34  # ~56° na vertical
    INCLINA = math.radians(7)
cam.dof.use_dof = True
cam.dof.aperture_fstop = 4.0
cam.dof.focus_distance = math.hypot(DIST_CAO, ALTURA_OLHO - 0.5)
camobj = bpy.data.objects.new("Olhar", cam)
cena.collection.objects.link(camobj)
cena.camera = camobj


def camera_y(q):
    """Posição da câmera no quadro q do fundo: velocidade constante e, na chegada, desacelera até parar."""
    v = (Y_FIM - Y_INICIO) / (Q_ENTRADA + (TOTAL - 1 - Q_ENTRADA) / 2)  # metros por quadro no trecho constante
    if q <= Q_ENTRADA:
        return Y_INICIO + v * q
    t = (q - Q_ENTRADA) / (TOTAL - 1 - Q_ENTRADA)
    return Y_INICIO + v * Q_ENTRADA + v * (TOTAL - 1 - Q_ENTRADA) * (t - t * t / 2)


def posicionar_camera(y):
    camobj.location = (0.0, y, ALTURA_OLHO)
    camobj.rotation_euler = (math.pi / 2 - INCLINA, 0.0, 0.0)  # +Y, um pouco para baixo


# ---------------------------------------------------------------- render
cena.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "CUDA"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "CUDA"
cena.cycles.device = "GPU"
cena.cycles.samples = AMOSTRAS
cena.cycles.adaptive_threshold = opcao("--limiar", 0.02)
cena.cycles.use_denoising = True
cena.cycles.denoiser = "OPENIMAGEDENOISE"
cena.cycles.volume_step_rate = opcao("--passo-nevoa", 4.0)
cena.cycles.max_bounces = 4
cena.cycles.volume_bounces = 0
cena.cycles.transparent_max_bounces = 24
cena.cycles.sample_clamp_indirect = 6.0
cena.render.resolution_x, cena.render.resolution_y = RES
cena.render.resolution_percentage = opcao("--escala", 100)
# memória: as texturas da vegetação e dos objetos caem para 1024 px (o chão, visto de perto e de lado, fica em 2K).
# As cópias reduzidas ficam em media-src/parque-1k e o Cycles lê delas; render em blocos de 1024 px e a cena mantida
# entre os quadros do mesmo lote
REDUZIDAS = MIDIA / "parque-1k"
REDUZIDAS.mkdir(exist_ok=True)
for im in bpy.data.images:
    origem = Path(bpy.path.abspath(im.filepath)) if im.filepath else None
    if not origem or PARQUE not in origem.parents or origem.parent.parent.name == "tex" or im.size[0] <= 1024:
        continue
    destino = REDUZIDAS / f"{origem.stem}.png"
    if not destino.exists():
        im.scale(1024, 1024)
        im.filepath_raw = str(destino)
        im.file_format = "PNG"
        im.save()
    im.filepath = str(destino)
    im.reload()
cena.cycles.use_auto_tile = True
cena.cycles.tile_size = 1024
cena.render.use_persistent_data = True
cena.view_settings.view_transform = "AgX"
cena.view_settings.look = "AgX - Base Contrast"
cena.view_settings.exposure = 1.25
cena.render.image_settings.file_format = "PNG"
cena.render.image_settings.color_depth = "8"
SAIDA.mkdir(parents=True, exist_ok=True)


def pronto(caminho):
    """Quadro já renderizado e inteiro (o PNG termina no bloco IEND): a produção retoma de onde parou."""
    arq = Path(caminho)
    if not arq.exists() or arq.stat().st_size < 1000:
        return False
    with open(arq, "rb") as f:
        f.seek(-12, 2)
        return f.read(12)[4:8] == b"IEND"

QUADROS = [int(q) for q in opcao("--quadros", "").split(",") if q]
if MODO == "fundo":
    ini, fim = int(args[2]), int(args[3])
    for q in QUADROS or range(ini, fim + 1):
        posicionar_camera(camera_y(q))
        cena.render.filepath = str(SAIDA / f"fundo-{q:03d}.png")
        if pronto(cena.render.filepath):
            continue
        bpy.ops.render.render(write_still=True)
        print("QUADRO", q, flush=True)
        print("MEMORIA", memoria(), flush=True)

# ================================================================ camada da cachorra
if MODO == "cao":
    # o ambiente não aparece nesta camada: só a luz (sol e céu) chega na cachorra
    for o in list(cena.objects):
        if o.type not in {"LIGHT", "CAMERA"}:
            o.hide_render = True
    # o céu claro da névoa deixaria o pelo preto cinza-azulado: menos céu nesta camada, a contraluz do sol continua
    fundo.inputs["Strength"].default_value = 0.18
    ceu.energy = 0.25  # a luz de trás acende as copas; nas costas da cachorra, deixaria o pelo preto cinzento
    sol.energy = 3.0  # debaixo do túnel de copas quase não chega sol direto: a 8, o topo da cabeça estourava
    PELE = material("Pele", **{"Base Color": (0.008, 0.007, 0.007, 1), "Roughness": 1.0, "Specular IOR Level": 0.0})  # sem brilho entre os fios
    COURO = material("Couro conhaque", **{"Base Color": (0.11, 0.04, 0.015, 1), "Roughness": 0.6})  # escuro: ao sol de frente, o conhaque claro virava uma mancha
    METAL = material("Argola", **{"Base Color": (0.78, 0.66, 0.45, 1), "Metallic": 1.0, "Roughness": 0.28})
    FITA = material("Guia", **{"Base Color": (0.02, 0.02, 0.022, 1), "Roughness": 1.0, "Specular IOR Level": 0.0})

    importados = importar(MIDIA / "modelos" / "lobo-cinza.glb")
    raiz = next(o for o in importados if o.parent is None and o.type == "EMPTY")
    armacao = next(o for o in importados if o.type == "ARMATURE")
    corpo = olhos = None
    for o in importados:
        if o.type != "MESH":
            continue
        nomes = [s.material.name for s in o.material_slots if s.material]
        if o.parent is None:
            o.hide_render = True  # esfera solta do arquivo original
            continue
        if any(n.startswith("Wolf_Main") for n in nomes):
            corpo = o
        elif any(n.startswith("Wolf_Eye") for n in nomes):
            olhos = o
        o.hide_render = not any(n.startswith(("Wolf_Main", "Claw")) for n in nomes)  # de costas: sem olhos, língua, dentes
        o.data.materials.clear()
        o.data.materials.append(PELE)
    acao = bpy.data.actions[0]
    armacao.animation_data_create()
    armacao.animation_data.action = acao
    if hasattr(armacao.animation_data, "action_slot") and acao.slots:
        armacao.animation_data.action_slot = acao.slots[0]
    ANDAR = (58, 90)  # laço perfeito da caminhada (32 quadros)
    PARADA = 11  # pose em pé para a respiração
    cena.frame_set(ANDAR[0])

    def vertices(obj):
        bpy.context.view_layer.update()
        ev = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        return np.array([obj.matrix_world @ v.co for v in ev.data.vertices])

    # focinho para +Y (de costas para a câmera)
    pts, oc = vertices(corpo), vertices(olhos).mean(0)
    frente = oc[:2] - pts.mean(0)[:2]
    raiz.matrix_world = Matrix.Rotation(math.atan2(1.0, 0.0) - math.atan2(frente[1], frente[0]), 4, "Z") @ raiz.matrix_world
    # porte de pastora-alemã encorpada: ~1,05 m do peito à garupa (sem a cauda), ~0,62 m na cernelha
    pts = vertices(corpo)
    tam = pts.max(0) - pts.min(0)
    raiz.scale = tuple(s * 0.63 / tam[2] for s in raiz.scale)
    pts = vertices(corpo)
    raiz.location.z -= pts[:, 2].min()
    raiz.location.x -= (pts[:, 0].min() + pts[:, 0].max()) / 2
    centro_y = (pts[:, 1].min() + pts[:, 1].max()) / 2
    raiz.location.y += DIST_CAO - centro_y
    bpy.context.view_layer.update()
    # a caminhada do arquivo é no lugar? (se andar, desconta depois)
    ys = []
    for f in range(ANDAR[0], ANDAR[1] + 1, 8):
        cena.frame_set(f)
        ys.append(round(float(vertices(corpo)[:, 1].mean()), 3))
    print("CENTRO Y NA CAMINHADA", ys, "tamanho", np.round(vertices(corpo).max(0) - vertices(corpo).min(0), 2), flush=True)
    # pastora encorpada: o lobo do arquivo é estreito
    raiz.scale.x *= 1.55
    bpy.context.view_layer.update()

    # ------------------------------------------------------------ pelo: fios curtos e densos, mais longos na cauda e no pescoço
    def material_pelo():
        m = bpy.data.materials.new("Pelo preto")
        m.use_nodes = True
        nos, lig = m.node_tree.nodes, m.node_tree.links
        nos.clear()
        saida = nos.new("ShaderNodeOutputMaterial")
        pelo = nos.new("ShaderNodeBsdfHairPrincipled")
        pelo.parametrization = "MELANIN"
        pelo.inputs["Melanin Redness"].default_value = 0.15
        pelo.inputs["Roughness"].default_value = 0.75  # espalha o reflexo do sol rasante nos fios da cabeça
        pelo.inputs["Radial Roughness"].default_value = 0.6
        pelo.inputs["IOR"].default_value = 1.45  # menos reflexo do céu claro: o preto continua preto
        pelo.inputs["Coat"].default_value = 0.0
        pelo.inputs["Random Color"].default_value = 0.1
        pelo.inputs["Random Roughness"].default_value = 0.15
        # preto no corpo; nas patas e nas pontas, o marrom-escuro da Ellie
        info = nos.new("ShaderNodeHairInfo")
        ponta = nos.new("ShaderNodeMapRange")
        ponta.inputs["From Min"].default_value, ponta.inputs["From Max"].default_value = 0.55, 1.0
        ponta.inputs["To Min"].default_value, ponta.inputs["To Max"].default_value = 0.0, 0.015  # pontas quase pretas: contra o sol, clareavam
        lig.new(info.outputs["Intercept"], ponta.inputs["Value"])
        alt = nos.new("ShaderNodeAttribute")
        alt.attribute_name = "altura"
        pata = nos.new("ShaderNodeMapRange")
        pata.inputs["From Min"].default_value, pata.inputs["From Max"].default_value = 0.12, 0.32
        pata.inputs["To Min"].default_value, pata.inputs["To Max"].default_value = 0.04, 0.0
        lig.new(alt.outputs["Fac"], pata.inputs["Value"])
        tira = nos.new("ShaderNodeMath")
        tira.operation = "ADD"
        lig.new(ponta.outputs["Result"], tira.inputs[0])
        lig.new(pata.outputs["Result"], tira.inputs[1])
        melanina = nos.new("ShaderNodeMath")
        melanina.operation = "SUBTRACT"
        melanina.inputs[0].default_value = 1.0
        lig.new(tira.outputs[0], melanina.inputs[1])
        lig.new(melanina.outputs[0], pelo.inputs["Melanin"])
        lig.new(pelo.outputs[0], saida.inputs["Surface"])
        return m

    def arvore_pelo(alvo, densidade, comp, raio, mat):
        g = bpy.data.node_groups.new("Pelo", "GeometryNodeTree")
        g.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
        n, l = g.nodes, g.links
        sai = n.new("NodeGroupOutput")
        info = n.new("GeometryNodeObjectInfo")
        info.inputs["Object"].default_value = alvo
        info.transform_space = "RELATIVE"
        # comprimento extra: cauda (pesos dos ossos da cauda) e pescoço mais peludos
        soma = None
        for nome_, peso_ in (("Tail_Bone_1_Wolf_Armature", 1.2), ("Tail_Bone_2_Wolf_Armature", 1.8), ("Tail_Bone_3_Wolf_Armature", 2.0),
                             ("Tail_Bone_4_Wolf_Armature", 1.6), ("Neck_Bone_Wolf_Armature", 0.6),
                             ("Head_Wolf_Armature", -0.7)):  # a cabeça de pelo curto (o pelo longo fazia um gorro claro ao sol)
            at = n.new("GeometryNodeInputNamedAttribute")
            at.data_type = "FLOAT"
            at.inputs["Name"].default_value = nome_
            mul = n.new("ShaderNodeMath")
            mul.operation = "MULTIPLY"
            mul.inputs[1].default_value = peso_
            l.new(at.outputs["Attribute"], mul.inputs[0])
            if soma is None:
                soma = mul
            else:
                s_ = n.new("ShaderNodeMath")
                s_.operation = "ADD"
                l.new(soma.outputs[0], s_.inputs[0])
                l.new(mul.outputs[0], s_.inputs[1])
                soma = s_
        guarda = n.new("GeometryNodeCaptureAttribute")
        guarda.capture_items.new("FLOAT", "comp")
        l.new(info.outputs["Geometry"], guarda.inputs[0])
        l.new(soma.outputs[0], guarda.inputs[1])
        pontos = n.new("GeometryNodeDistributePointsOnFaces")
        pontos.inputs["Density"].default_value = densidade
        l.new(guarda.outputs[0], pontos.inputs["Mesh"])
        # direção do fio: normal + penteado para a cauda (-Y) e um pouco de gravidade
        norm = pontos.outputs["Normal"]
        pente = n.new("ShaderNodeCombineXYZ")
        pente.inputs["X"].default_value, pente.inputs["Y"].default_value, pente.inputs["Z"].default_value = 0.0, -1.0, -0.4
        mist = n.new("ShaderNodeVectorMath")
        mist.operation = "SCALE"
        mist.inputs["Scale"].default_value = 0.55
        l.new(norm, mist.inputs[0])
        soma_v = n.new("ShaderNodeVectorMath")
        soma_v.operation = "ADD"
        l.new(mist.outputs[0], soma_v.inputs[0])
        l.new(pente.outputs[0], soma_v.inputs[1])
        unit = n.new("ShaderNodeVectorMath")
        unit.operation = "NORMALIZE"
        l.new(soma_v.outputs[0], unit.inputs[0])
        gira = n.new("FunctionNodeAlignRotationToVector")
        gira.axis = "Z"
        l.new(unit.outputs[0], gira.inputs["Vector"])
        linha = n.new("GeometryNodeCurvePrimitiveLine")
        linha.inputs["End"].default_value = (0, 0, comp)
        amostra = n.new("GeometryNodeResampleCurve")
        amostra.inputs["Count"].default_value = 5
        l.new(linha.outputs[0], amostra.inputs["Curve"])
        # a altura da raiz de cada fio (para o marrom das patas), guardada nos pontos
        pos0 = n.new("GeometryNodeInputPosition")
        sep0 = n.new("ShaderNodeSeparateXYZ")
        l.new(pos0.outputs[0], sep0.inputs[0])
        guarda_alt = n.new("GeometryNodeCaptureAttribute")
        guarda_alt.domain = "POINT"
        guarda_alt.capture_items.new("FLOAT", "alt")
        l.new(pontos.outputs["Points"], guarda_alt.inputs[0])
        l.new(sep0.outputs["Z"], guarda_alt.inputs[1])
        inst = n.new("GeometryNodeInstanceOnPoints")
        l.new(guarda_alt.outputs[0], inst.inputs["Points"])
        l.new(amostra.outputs[0], inst.inputs["Instance"])
        l.new(gira.outputs[0], inst.inputs["Rotation"])
        # escala do fio: aleatória × (1 + peso da cauda/pescoço)
        aleat = n.new("FunctionNodeRandomValue")
        aleat.data_type = "FLOAT"
        aleat.inputs["Min"].default_value, aleat.inputs["Max"].default_value = 0.6, 1.2
        um = n.new("ShaderNodeMath")
        um.operation = "ADD"
        um.inputs[1].default_value = 1.0
        l.new(guarda.outputs[1], um.inputs[0])
        fator = n.new("ShaderNodeMath")
        fator.operation = "MULTIPLY"
        l.new(aleat.outputs["Value"], fator.inputs[0])
        l.new(um.outputs[0], fator.inputs[1])
        comb = n.new("ShaderNodeCombineXYZ")
        comb.inputs["X"].default_value = comb.inputs["Y"].default_value = 1.0
        l.new(fator.outputs[0], comb.inputs["Z"])
        l.new(comb.outputs[0], inst.inputs["Scale"])
        real = n.new("GeometryNodeRealizeInstances")
        l.new(inst.outputs[0], real.inputs[0])
        grava = n.new("GeometryNodeStoreNamedAttribute")
        grava.data_type = "FLOAT"
        grava.domain = "CURVE"
        grava.inputs["Name"].default_value = "altura"
        l.new(real.outputs[0], grava.inputs["Geometry"])
        l.new(guarda_alt.outputs[1], grava.inputs["Value"])
        # ondulação leve e caimento
        param = n.new("GeometryNodeSplineParameter")
        ruido = n.new("ShaderNodeTexNoise")
        ruido.inputs["Scale"].default_value = 30
        pos = n.new("GeometryNodeInputPosition")
        l.new(pos.outputs[0], ruido.inputs["Vector"])
        centro = n.new("ShaderNodeVectorMath")
        centro.operation = "SUBTRACT"
        l.new(ruido.outputs["Color"], centro.inputs[0])
        centro.inputs[1].default_value = (0.5, 0.5, 0.5)
        cai = n.new("ShaderNodeVectorMath")
        cai.operation = "ADD"
        l.new(centro.outputs[0], cai.inputs[0])
        cai.inputs[1].default_value = (0, -0.2, -0.5)
        quad = n.new("ShaderNodeMath")
        quad.operation = "POWER"
        quad.inputs[1].default_value = 2
        l.new(param.outputs["Factor"], quad.inputs[0])
        peso = n.new("ShaderNodeMath")
        peso.operation = "MULTIPLY"
        peso.inputs[1].default_value = comp * 0.5
        l.new(quad.outputs[0], peso.inputs[0])
        desloc = n.new("ShaderNodeVectorMath")
        desloc.operation = "SCALE"
        l.new(cai.outputs[0], desloc.inputs[0])
        l.new(peso.outputs[0], desloc.inputs["Scale"])
        setpos = n.new("GeometryNodeSetPosition")
        l.new(grava.outputs[0], setpos.inputs["Geometry"])
        l.new(desloc.outputs[0], setpos.inputs["Offset"])
        afina = n.new("ShaderNodeMapRange")
        afina.inputs["To Min"].default_value, afina.inputs["To Max"].default_value = raio, raio * 0.15
        l.new(param.outputs["Factor"], afina.inputs["Value"])
        setraio = n.new("GeometryNodeSetCurveRadius")
        l.new(setpos.outputs[0], setraio.inputs["Curve"])
        l.new(afina.outputs["Result"], setraio.inputs["Radius"])
        setmat = n.new("GeometryNodeSetMaterial")
        setmat.inputs["Material"].default_value = mat
        l.new(setraio.outputs[0], setmat.inputs["Geometry"])
        l.new(setmat.outputs[0], sai.inputs[0])
        dados = bpy.data.hair_curves.new("Pelo")
        obj = bpy.data.objects.new("Pelo", dados)
        cena.collection.objects.link(obj)
        obj.modifiers.new("Pelo", "NODES").node_group = g
        return obj

    pelo = arvore_pelo(corpo, opcao("--densidade", 110000.0), 0.04, opcao("--raio-pelo", 0.0011), material_pelo())

    # ------------------------------------------------------------ coleira, guia (fita preta, como a da foto da mão) e sombra
    ossos = {b.name: b for b in armacao.pose.bones}

    def nuca_e_coleira():
        bpy.context.view_layer.update()
        a = armacao.matrix_world @ ossos["Neck_Bone_Wolf_Armature"].head
        b = armacao.matrix_world @ ossos["Head_Wolf_Armature"].head
        eixo = (b - a).normalized()
        meio_ = a.lerp(b, 0.45)
        cima = Vector((0, 0, 1))
        return meio_, eixo, meio_ + (cima - eixo * eixo.dot(cima)).normalized() * 0.1

    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.1, depth=0.034, end_fill_type="NOTHING")
    coleira = bpy.context.active_object
    coleira.modifiers.new("Couro", "SOLIDIFY").thickness = 0.007
    coleira.data.materials.append(COURO)
    bpy.ops.object.shade_smooth()
    bpy.ops.mesh.primitive_torus_add(major_radius=0.016, minor_radius=0.0035)
    argola = bpy.context.active_object
    argola.data.materials.append(METAL)

    posicionar_camera(0.0)
    bpy.context.view_layer.update()

    def ponto_da_tela(u, v, dist):
        """Ponto 3D a "dist" metros da câmera que aparece em (u, v) da imagem (0..1, v de cima para baixo)."""
        cantos = [camobj.matrix_world @ c for c in cam.view_frame(scene=cena)]  # sup-dir, inf-dir, inf-esq, sup-esq
        topo = cantos[3].lerp(cantos[0], u)
        base = cantos[2].lerp(cantos[1], u)
        alvo = topo.lerp(base, v)
        origem = camobj.matrix_world.translation
        return origem + (alvo - origem).normalized() * dist

    # a mão segura a guia embaixo, à direita: no desktop, na borda de baixo do recorte 16:9; no celular, na base da tela
    MAO = ponto_da_tela(0.6, 0.97, 0.8) if TELA == "desktop" else ponto_da_tela(0.64, 0.975, 0.8)
    curva = bpy.data.curves.new("Guia", "CURVE")
    curva.dimensions = "3D"
    curva.extrude = 0.009  # fita de 18 mm
    curva.bevel_depth = 0.0015
    sp = curva.splines.new("BEZIER")
    sp.bezier_points.add(1)
    guia = bpy.data.objects.new("Guia", curva)
    guia.data.materials.append(FITA)
    cena.collection.objects.link(guia)

    def atualizar_guia():
        meio_, eixo, nuca = nuca_e_coleira()
        coleira.location = meio_
        coleira.rotation_euler = eixo.to_track_quat("Z", "Y").to_euler()
        argola.location = nuca + Vector((0, 0, 0.012))
        argola.rotation_euler = (0, math.pi / 2, 0)
        p0, p1 = sp.bezier_points
        p0.co, p1.co = MAO, nuca
        p0.handle_left = MAO + (MAO - nuca) * 0.1
        p0.handle_right = MAO.lerp(nuca, 0.35) + Vector((0, 0, -0.08))  # a guia quase esticada sobe até a coleira
        p1.handle_left = MAO.lerp(nuca, 0.78) + Vector((0, 0, -0.03))
        p1.handle_right = nuca + (nuca - MAO) * 0.1

    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 10, 0))
    sombra = bpy.context.active_object
    sombra.is_shadow_catcher = True

    posicionar_camera(0.0)
    cena.render.film_transparent = True
    cena.cycles.samples = opcao("--amostras", 128)
    from bpy_extras.object_utils import world_to_camera_view

    bpy.context.view_layer.update()
    mao_tela = world_to_camera_view(cena, camobj, MAO)
    # passada: quanto o chão "anda" num ciclo (a pata de apoio desliza para trás na caminhada no lugar)
    pe = ossos["Rear_Left_Foot_Bone_Wolf_Armature"]
    ys_pe = []
    for f in range(ANDAR[0], ANDAR[1]):
        cena.frame_set(f)
        bpy.context.view_layer.update()
        ys_pe.append((armacao.matrix_world @ pe.head).y)
    passo = max(ys_pe) - min(ys_pe)
    tela = TELA
    (SAIDA / f"camada-{tela}.json").write_text(json.dumps({
        "mao": [round(mao_tela.x, 4), round(1 - mao_tela.y, 4)], "passo_m": round(passo, 3), "quadros_andar": ANDAR[1] - ANDAR[0],
        "fundo_total": TOTAL, "q_entrada": Q_ENTRADA, "camera_y": [round(camera_y(q), 3) for q in range(TOTAL)],
    }))
    print("MAO NA TELA", mao_tela, "PASSO", passo, flush=True)
    # só a região da cachorra, da guia e da sombra é renderizada (o resto é transparente)
    cena.render.use_border = True
    cena.render.use_crop_to_border = False
    cantos = []
    for f in range(ANDAR[0], ANDAR[1], 4):
        cena.frame_set(f)
        bpy.context.view_layer.update()
        cantos += [world_to_camera_view(cena, camobj, Vector(v)) for v in vertices(corpo)[::40]]
    us = [c.x for c in cantos] + [mao_tela.x]
    vs = [c.y for c in cantos]
    cena.render.border_min_x, cena.render.border_max_x = max(0.0, min(us) - 0.06), min(1.0, max(us) + 0.06)
    cena.render.border_min_y, cena.render.border_max_y = 0.0, min(1.0, max(vs) + 0.05)  # da base até acima das orelhas
    print("BORDA", [round(v, 3) for v in (cena.render.border_min_x, cena.render.border_max_x, cena.render.border_max_y)], flush=True)

    trecho = args[2]
    if "--depurar" in args:  # guia vermelha e sem pelo: confere material e luz da camada
        FITA.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.0, 0.0, 1)
        pelo.hide_render = True
    quadros = opcao("--quadros", "")
    if trecho == "andar":
        lista = [int(q) for q in quadros.split(",")] if quadros else range(ANDAR[0], ANDAR[1])
        for f in lista:
            cena.frame_set(f)
            atualizar_guia()
            cena.render.filepath = str(SAIDA / f"andar-{f - ANDAR[0]:02d}.png")
            if pronto(cena.render.filepath):
                continue
            bpy.ops.render.render(write_still=True)
            print("QUADRO", f, flush=True)
            print("MEMORIA", memoria(), flush=True)
    elif trecho == "parada":
        # parada: a pose em pé e a respiração (peito sobe e desce, cabeça acompanha de leve), laço de 24 quadros
        cena.frame_set(PARADA)
        base = {pb.name: pb.matrix_basis.copy() for pb in armacao.pose.bones}
        armacao.animation_data.action = None
        for k in range(24):
            fase = math.sin(2 * math.pi * k / 24)
            for pb in armacao.pose.bones:
                pb.matrix_basis = base[pb.name]
            for nome_, amp in (("Trunk_Bone_2_Wolf_Armature", 0.016), ("Trunk_Bone_3_Wolf_Armature", 0.01)):
                ossos[nome_].matrix_basis = base[nome_] @ Matrix.Diagonal((1 + amp * fase, 1, 1 + amp * fase, 1))
            cab_ = ossos["Head_Wolf_Armature"]
            cab_.matrix_basis = base[cab_.name] @ Matrix.Rotation(math.radians(0.8) * fase, 4, "X")
            atualizar_guia()
            cena.render.filepath = str(SAIDA / f"parada-{k:02d}.png")
            if pronto(cena.render.filepath):
                continue
            bpy.ops.render.render(write_still=True)
            print("QUADRO", k, flush=True)
            print("MEMORIA", memoria(), flush=True)
    elif trecho == "entrada":
        cena.render.use_border = False  # ela se afasta rumo à porta: sai da região medida com ela perto da câmera
        # chegada: a câmera desacelera e a cachorra se adianta até a porta aberta; a guia escapa da mão e arrasta no chão
        y_base = raiz.location.y
        ini = camera_y(Q_ENTRADA) + DIST_CAO
        porta = Y_LOJA + 0.9
        n_ = TOTAL - 1 - Q_ENTRADA
        for q in QUADROS or range(Q_ENTRADA, TOTAL):
            t = (q - Q_ENTRADA) / n_
            cao_y = ini + (porta - ini) * t
            raiz.location.y = y_base + (cao_y - camera_y(q)) - DIST_CAO
            fase = ((camera_y(Q_ENTRADA) + cao_y - ini) / passo) % 1.0
            quadro = ANDAR[0] + fase * (ANDAR[1] - ANDAR[0])
            cena.frame_set(int(quadro), subframe=quadro % 1)
            atualizar_guia()
            # nos primeiros quadros a ponta da guia sai da mão e cai no chão, atrás da cachorra
            solta = min(1.0, t * n_ / 6)
            _, _, nuca = nuca_e_coleira()
            chao_ = nuca + Vector((0.06, -1.25, 0))
            chao_.z = 0.012
            p0, p1 = sp.bezier_points
            p0.co = MAO.lerp(chao_, solta)
            p0.handle_right = p0.co.lerp(nuca, 0.35) + Vector((0, 0, -0.32 * (1 - solta)))
            p1.handle_left = p0.co.lerp(nuca, 0.6) + Vector((0, 0, -0.18 * (1 - solta) + 0.05 * solta))
            cena.render.filepath = str(SAIDA / f"entrada-{q - Q_ENTRADA:02d}.png")
            if pronto(cena.render.filepath):
                continue
            bpy.ops.render.render(write_still=True)
            print("QUADRO", q, flush=True)
            print("MEMORIA", memoria(), flush=True)
