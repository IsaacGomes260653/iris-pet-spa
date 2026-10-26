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

import bmesh
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
Y_INICIO, Y_FIM = 0.0, 60.0  # a câmera anda de Y_INICIO a Y_FIM (para a 14 m da fachada, com as copas e o céu em volta)
Q_ENTRADA = round(TOTAL * 0.78)  # a partir deste quadro a câmera desacelera e a cachorra se adianta até a porta
# (com a câmera parando a 14 m, a chegada precisa de 22% dos quadros para ela ir só ~1,4× mais rápida que a câmera)
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
    # sem corte seco: a soma vira a chance de cada pétala ficar, então a densidade varia aos poucos (o corte fazia
    # manchas azuladas de borda dura no caminho)
    chance = n.new("ShaderNodeMapRange")
    chance.inputs["From Min"].default_value, chance.inputs["From Max"].default_value = 0.3, 0.9
    chance.inputs["To Min"].default_value, chance.inputs["To Max"].default_value = 0.12, 0.75
    l.new(soma.outputs[0], chance.inputs["Value"])
    sorteio = n.new("FunctionNodeRandomValue")
    sorteio.data_type = "FLOAT"
    sorteio.inputs["Seed"].default_value = 3
    pouco = n.new("ShaderNodeMath")
    pouco.operation = "GREATER_THAN"
    l.new(sorteio.outputs["Value"], pouco.inputs[0])
    l.new(chance.outputs["Result"], pouco.inputs[1])
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
# Modelada de verdade (nada de foto): parede com espessura, vãos fundos com caixilhos, toldos listrados, arandelas,
# salão aceso com prateleiras e produtos, mesa de camas, balcão e vitrines montadas. Semente fixa: igual em todo quadro.
antes_da_loja = set(bpy.data.objects)
L, FUNDO_LOJA, PE_DIREITO, PAREDE = 10.0, 7.5, 3.6, 0.3  # largura, profundidade, altura de dentro, espessura da parede
TOPO_VAO = 2.75  # topo da porta e das vitrines
VAOS = ((0.0, 1.3, 0.0), (-3.0, 2.6, 0.55), (3.0, 2.6, 0.55))  # (centro x, largura, peitoril): a porta e as vitrines
DENTRO_X, Y_DENTRO0, Y_DENTRO1 = L / 2 - PAREDE, Y_LOJA + PAREDE, Y_LOJA + FUNDO_LOJA - PAREDE
loja_rng = np.random.default_rng(11)
# reboco: do barro do Poly Haven ficam só o relevo e a variação de claro e escuro; a cor é o creme da marca
# (a textura tem luminância média 0,11; o tom leva o reboco ao creme ~(0,7; 0,58; 0,43))
REBOCO = material_textura("Reboco creme", "clay_plaster", 0.5, (6.1, 5.1, 3.75, 1))
_tingir = next(n for n in REBOCO.node_tree.nodes if n.bl_idname == "ShaderNodeMix")
_pb = REBOCO.node_tree.nodes.new("ShaderNodeRGBToBW")
REBOCO.node_tree.links.new(_tingir.inputs["A"].links[0].from_socket, _pb.inputs[0])
REBOCO.node_tree.links.new(_pb.outputs[0], _tingir.inputs["A"])
PEDRA = material("Pedra", **{"Base Color": (0.5, 0.46, 0.4, 1), "Roughness": 0.75})
SALVIA = material("Verde-sálvia", **{"Base Color": (0.27, 0.36, 0.3, 1), "Roughness": 0.4})  # caixilho pintado, acetinado
VIDRO = material("Vidro", **{"Base Color": (0.96, 0.98, 0.97, 1), "Transmission Weight": 1.0, "Roughness": 0.0, "IOR": 1.5})
LETRA = material("Letreiro", **{"Base Color": (0.98, 0.95, 0.9, 1), "Roughness": 0.4, "Emission Color": (1, 0.96, 0.9, 1), "Emission Strength": 2.5})
FORRO = material("Forro", **{"Base Color": (0.86, 0.8, 0.72, 1), "Roughness": 0.9})
FUNDO_ESTANTE = material("Fundo da estante", **{"Base Color": (0.36, 0.45, 0.4, 1), "Roughness": 0.85})
METAL_ESCURO = material("Metal escuro", **{"Base Color": (0.05, 0.06, 0.06, 1), "Metallic": 1.0, "Roughness": 0.35})
LUZ_MORNA = material("Luz morna", **{"Base Color": (1, 0.85, 0.65, 1), "Emission Color": (1.0, 0.76, 0.5, 1), "Emission Strength": 12.0})
COR_MORNA = (1.0, 0.78, 0.56)


def madeira(nome, cor, escala=5.0):
    """Madeira procedural: veios (ondas distorcidas) em dois tons."""
    m = material(nome, Roughness=0.5)
    arvore, liga = m.node_tree.nodes, m.node_tree.links
    veio = arvore.new("ShaderNodeTexWave")
    veio.bands_direction = "X"
    veio.inputs["Scale"].default_value = escala
    veio.inputs["Distortion"].default_value = 8.0
    veio.inputs["Detail"].default_value = 4.0
    tom = arvore.new("ShaderNodeMix")
    tom.data_type = "RGBA"
    tom.inputs[6].default_value = cor
    tom.inputs[7].default_value = tuple(c * 0.68 for c in cor[:3]) + (1,)
    liga.new(veio.outputs["Fac"], tom.inputs["Factor"])
    liga.new(tom.outputs[2], arvore["Principled BSDF"].inputs["Base Color"])
    return m


CARVALHO = madeira("Carvalho", (0.42, 0.27, 0.15, 1))
PISO = madeira("Piso de tábuas", (0.36, 0.23, 0.13, 1), 3.0)
# embalagens nas cores da marca e de petshop: sálvia, creme, terracota, lilás, mostarda, marinho, branco, rosa, preto
PALETA = [material(f"Produto {k}", **{"Base Color": (*c, 1), "Roughness": r}) for k, (c, r) in enumerate((
    ((0.27, 0.36, 0.3), 0.5), ((0.86, 0.79, 0.66), 0.55), ((0.6, 0.27, 0.16), 0.5), ((0.5, 0.4, 0.66), 0.45),
    ((0.82, 0.6, 0.18), 0.5), ((0.16, 0.24, 0.38), 0.4), ((0.92, 0.91, 0.88), 0.35), ((0.72, 0.42, 0.4), 0.5),
    ((0.12, 0.12, 0.12), 0.3)))]
CREME = PALETA[1]
ROTULOS = [material(f"Rótulo {k}", **{"Base Color": (*c, 1), "Roughness": 0.35}) for k, c in enumerate(
    ((0.95, 0.94, 0.9), (0.9, 0.84, 0.7), (0.1, 0.1, 0.1)))]


class Pecas:
    """Muitas peças (caixas, cilindros, cones e esferas) numa malha só, cada uma com o seu material."""

    def __init__(self):
        self.bm, self.mats = bmesh.new(), []

    def _pintar(self, verts, m):
        if m not in self.mats:
            self.mats.append(m)
        k = self.mats.index(m)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = k

    def caixa(self, centro, tam, m):
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=Matrix.Translation(centro) @ Matrix.Diagonal((*tam, 1.0)))
        self._pintar(r["verts"], m)

    def cone(self, centro, raio1, raio2, altura, m, lados=20, tampa=True):
        r = bmesh.ops.create_cone(self.bm, cap_ends=tampa, segments=lados, radius1=raio1, radius2=raio2, depth=altura,
                                  matrix=Matrix.Translation(centro))
        self._pintar(r["verts"], m)

    def cilindro(self, centro, raio, altura, m, lados=20):
        self.cone(centro, raio, raio, altura, m, lados)

    def esfera(self, centro, raio, m, achatar=1.0, escala=(1, 1)):
        r = bmesh.ops.create_uvsphere(self.bm, u_segments=16, v_segments=10, radius=raio,
                                      matrix=Matrix.Translation(centro) @ Matrix.Diagonal((*escala, achatar, 1)))
        self._pintar(r["verts"], m)

    def objeto(self, nome, bisel=0.0, suave=False):
        malha = bpy.data.meshes.new(nome)
        self.bm.to_mesh(malha)
        self.bm.free()
        for m in self.mats:
            malha.materials.append(m)
        if suave:
            malha.shade_smooth()
        o = bpy.data.objects.new(nome, malha)
        cena.collection.objects.link(o)
        if bisel:  # nenhuma aresta perfeitamente viva
            b = o.modifiers.new("Bisel", "BEVEL")
            b.width, b.segments, b.limit_method = bisel, 2, "ANGLE"
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


# casca: fachada com espessura, laterais, fundo e laje; cornija e friso no alto, rodapé de pedra embaixo
fachada = caixa("Fachada", (0, Y_LOJA + PAREDE / 2, 2.0), (L, PAREDE, 4.0), REBOCO)
for lado in (-1, 1):
    caixa("Parede lateral", (lado * (L / 2 - PAREDE / 2), Y_LOJA + FUNDO_LOJA / 2, 2.0), (PAREDE, FUNDO_LOJA, 4.0), REBOCO)
caixa("Parede do fundo", (0, Y_LOJA + FUNDO_LOJA - PAREDE / 2, 2.0), (L, PAREDE, 4.0), REBOCO)
caixa("Laje", (0, Y_LOJA + FUNDO_LOJA / 2, (PE_DIREITO + 4.0) / 2), (L - 0.01, FUNDO_LOJA - 0.01, 4.0 - PE_DIREITO), FORRO)
caixa("Cornija", (0, Y_LOJA + (PAREDE - 0.14) / 2, 4.12), (L + 0.28, PAREDE + 0.14, 0.24), REBOCO)
caixa("Friso", (0, Y_LOJA, 3.88), (L + 0.12, 0.12, 0.08), REBOCO)
for lado in (-1, 1):
    comp = L / 2 + 0.03 - 0.65
    caixa("Rodapé", (lado * (0.65 + comp / 2), Y_LOJA, 0.21), (comp, 0.06, 0.42), PEDRA)
# vãos atravessando a parede: a profundidade do reboco aparece em volta de cada caixilho
for x, larg, peit in VAOS:
    base = peit if peit else -0.1
    corte = caixa("Vão", (x, Y_LOJA + PAREDE / 2, (base + TOPO_VAO) / 2), (larg, PAREDE + 0.3, TOPO_VAO - base), REBOCO)
    corte.hide_render = corte.hide_viewport = True
    bo = fachada.modifiers.new("Vão", "BOOLEAN")
    bo.operation, bo.object = "DIFFERENCE", corte
    if peit:
        caixa("Peitoril", (x, Y_LOJA + PAREDE / 2 - 0.05, peit - 0.03), (larg + 0.12, PAREDE + 0.1, 0.06), PEDRA)

# caixilhos verde-sálvia recuados 12 cm, com bandeira em cima; vitrines com montante no meio; vidro de verdade
cx = Pecas()
for x, larg, peit in VAOS:
    yq, alt, e = Y_LOJA + 0.12, TOPO_VAO - peit, 0.06
    zc, travessa = (peit + TOPO_VAO) / 2, peit + (TOPO_VAO - peit) * 0.78
    cx.caixa((x - larg / 2 + e / 2, yq, zc), (e, 0.07, alt), SALVIA)
    cx.caixa((x + larg / 2 - e / 2, yq, zc), (e, 0.07, alt), SALVIA)
    cx.caixa((x, yq, TOPO_VAO - e / 2), (larg, 0.07, e), SALVIA)
    cx.caixa((x, yq, travessa), (larg, 0.07, 0.05), SALVIA)
    if peit:
        cx.caixa((x, yq, peit + e / 2), (larg, 0.07, e), SALVIA)
        cx.caixa((x, yq, (peit + travessa) / 2), (0.05, 0.07, travessa - peit), SALVIA)
        cx.caixa((x, yq + 0.01, zc), (larg - 0.02, 0.008, alt - 0.02), VIDRO)
    else:  # a porta: só a bandeira de vidro (a folha está aberta)
        cx.caixa((x, yq + 0.01, (travessa + TOPO_VAO) / 2), (larg - 0.02, 0.008, TOPO_VAO - travessa - 0.02), VIDRO)
cx.objeto("Caixilhos", bisel=0.004)
# a folha da porta, aberta para dentro: a cachorra entra por ela
folha = Pecas()
fw, fh, e = 1.18, 2.1, 0.09
for cx_, w_ in ((e / 2, e), (fw - e / 2, e)):
    folha.caixa((cx_, 0, fh / 2), (w_, 0.05, fh), SALVIA)
folha.caixa((fw / 2, 0, fh - e / 2), (fw, 0.05, e), SALVIA)
folha.caixa((fw / 2, 0, 0.13), (fw, 0.05, 0.26), SALVIA)
folha.caixa((fw / 2, 0, (0.26 + fh - e) / 2), (fw - 2 * e, 0.01, fh - e - 0.26), VIDRO)
folha.caixa((fw - 0.16, -0.05, 1.0), (0.03, 0.04, 0.3), METAL_ESCURO)  # puxador
porta = folha.objeto("Porta", bisel=0.004)
porta.location = (-0.62, Y_LOJA + 0.16, 0.0)
porta.rotation_euler = (0, 0, math.radians(78))

# toldos listrados (sálvia e creme) sobre as vitrines, com a franja caindo na frente
TOLDO = material("Toldo listrado", **{"Roughness": 0.85, "Sheen Weight": 0.3})
_n, _l = TOLDO.node_tree.nodes, TOLDO.node_tree.links
_geo = _n.new("ShaderNodeNewGeometry")
_sx = _n.new("ShaderNodeSeparateXYZ")
_l.new(_geo.outputs["Position"], _sx.inputs[0])
_fr = _n.new("ShaderNodeMath")
_fr.operation = "PINGPONG"
_fr.inputs[1].default_value = 0.18  # listras de 18 cm
_l.new(_sx.outputs["X"], _fr.inputs[0])
_lst = _n.new("ShaderNodeMath")
_lst.operation = "GREATER_THAN"
_lst.inputs[1].default_value = 0.09
_l.new(_fr.outputs[0], _lst.inputs[0])
_cor = _n.new("ShaderNodeMix")
_cor.data_type = "RGBA"
_cor.inputs[6].default_value = (0.3, 0.4, 0.33, 1)
_cor.inputs[7].default_value = (0.86, 0.8, 0.68, 1)
_l.new(_lst.outputs[0], _cor.inputs["Factor"])
_l.new(_cor.outputs[2], _n["Principled BSDF"].inputs["Base Color"])
for x, larg, peit in VAOS[1:]:
    bm = bmesh.new()
    w = larg / 2 + 0.15
    vs = [bm.verts.new(p) for p in ((x - w, Y_LOJA - 0.02, 3.02), (x + w, Y_LOJA - 0.02, 3.02), (x + w, Y_LOJA - 0.8, 2.66),
                                    (x - w, Y_LOJA - 0.8, 2.66), (x + w, Y_LOJA - 0.8, 2.44), (x - w, Y_LOJA - 0.8, 2.44))]
    bm.faces.new((vs[0], vs[1], vs[2], vs[3]))
    bm.faces.new((vs[3], vs[2], vs[4], vs[5]))
    malha = bpy.data.meshes.new("Toldo")
    bm.to_mesh(malha)
    bm.free()
    malha.materials.append(TOLDO)
    toldo = bpy.data.objects.new("Toldo", malha)
    cena.collection.objects.link(toldo)
    toldo.modifiers.new("Espessura", "SOLIDIFY").thickness = 0.012

# letreiro: "Íris" em Literata e "PET SPA" em Martian Mono, sobre faixa verde-sálvia acima da porta
caixa("Faixa do letreiro", (0, Y_LOJA - 0.03, 3.42), (4.6, 0.06, 0.6), SALVIA)


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


texto("Íris", "Literata.ttf", 0.5, (-0.55, Y_LOJA - 0.08, 3.44))
texto("PET SPA", "MartianMono.ttf", 0.14, (1.05, Y_LOJA - 0.08, 3.4), 0.01)
# arandelas dos dois lados da porta: poças de luz morna no reboco
for lado in (-1, 1):
    ar = Pecas()
    ar.caixa((lado * 1.0, Y_LOJA - 0.05, 2.3), (0.08, 0.1, 0.08), METAL_ESCURO)
    ar.cilindro((lado * 1.0, Y_LOJA - 0.13, 2.14), 0.05, 0.2, LUZ_MORNA)
    ar.cone((lado * 1.0, Y_LOJA - 0.13, 2.27), 0.08, 0.03, 0.06, METAL_ESCURO)
    ar.objeto("Arandela")
    luz_ = bpy.data.lights.new("Arandela", "POINT")
    luz_.energy, luz_.color, luz_.shadow_soft_size = 25.0, COR_MORNA, 0.05
    o_ = bpy.data.objects.new("Arandela", luz_)
    o_.location = (lado * 1.0, Y_LOJA - 0.22, 2.12)
    cena.collection.objects.link(o_)

# ---- o salão: piso de tábuas, estantes cheias, mesa de camas, balcão, pendentes e luz morna
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, (Y_DENTRO0 + Y_DENTRO1) / 2, 0.015))
piso = bpy.context.active_object
piso.scale = (2 * DENTRO_X, Y_DENTRO1 - Y_DENTRO0, 1)
piso.data.materials.append(PISO)


def estante(nome, comp, prof=0.38, alturas=(0.12, 0.55, 0.98, 1.41, 1.84, 2.27)):
    """Estante de carvalho com fundo sálvia, de frente para -Y (local): produtos em grupos de 2 a 5 iguais."""
    p = Pecas()
    topo = alturas[-1] + 0.33
    p.caixa((comp / 2, prof - 0.01, topo / 2), (comp, 0.02, topo), FUNDO_ESTANTE)
    n_mod = max(1, round(comp / 1.1))
    for k in range(n_mod + 1):
        p.caixa((min(max(k * comp / n_mod, 0.02), comp - 0.02), prof / 2, topo / 2), (0.035, prof, topo), CARVALHO)
    for k, z in enumerate(alturas):
        p.caixa((comp / 2, prof / 2, z), (comp, prof, 0.03), CARVALHO)
        vao = (alturas[k + 1] if k + 1 < len(alturas) else topo) - z - 0.06
        x = 0.06
        while x < comp - 0.15:
            tipo = loja_rng.choice(3, p=(0.55, 0.2, 0.25)) if vao > 0.36 else loja_rng.choice((0, 2))
            m = PALETA[loja_rng.integers(len(PALETA))]
            rotulo = ROTULOS[loja_rng.integers(len(ROTULOS))]
            if tipo == 1:  # saco de ração
                w, h, d = loja_rng.uniform(0.26, 0.34), loja_rng.uniform(0.3, min(0.38, vao)), 0.15
            elif tipo == 2:  # lata ou pote
                w = loja_rng.uniform(0.08, 0.12)
                h, d = loja_rng.uniform(0.08, min(0.16, vao)), w
            else:  # caixa: mais larga que alta (embalagem, não livro)
                w, h, d = loja_rng.uniform(0.14, 0.28), loja_rng.uniform(0.1, min(0.24, vao)), loja_rng.uniform(0.1, prof - 0.08)
            for _ in range(loja_rng.integers(2, 6)):
                if x + w > comp - 0.06:
                    break
                centro = (x + w / 2, 0.04 + d / 2, z + 0.015 + h / 2)
                if tipo == 2:
                    p.cilindro(centro, w / 2, h, m, 14)
                    p.cilindro(centro, w / 2 + 0.002, h * 0.45, rotulo, 14)  # cinta do rótulo
                else:
                    p.caixa(centro, (w, d, h), m)
                    p.caixa((centro[0], 0.038, centro[2] + h * 0.08), (w * 0.72, 0.004, h * 0.42), rotulo)  # rótulo na frente
                x += w + 0.01
            x += loja_rng.uniform(0.03, 0.12)
    return p.objeto(nome, bisel=0.005)


fundo_estante = estante("Estante do fundo", 2 * DENTRO_X - 0.1)
fundo_estante.location = (-DENTRO_X + 0.05, Y_DENTRO1 - 0.38, 0.015)
e_esq = estante("Estante da esquerda", 4.6)
e_esq.location, e_esq.rotation_euler = (-DENTRO_X + 0.38, Y_DENTRO0 + 1.4, 0.015), (0, 0, math.radians(90))
e_dir = estante("Estante da direita", 4.6)
e_dir.location, e_dir.rotation_euler = (DENTRO_X - 0.38, Y_DENTRO0 + 6.0, 0.015), (0, 0, math.radians(-90))
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


PORTA = Y_LOJA + 0.9  # onde a cachorra termina, já do lado de dentro


def cao_y(q):
    """Onde a cachorra está no quadro q: sempre à frente da câmera e, na chegada, adiantando-se até a porta."""
    if q <= Q_ENTRADA:
        return camera_y(q) + DIST_CAO
    ini = camera_y(Q_ENTRADA) + DIST_CAO
    return ini + (PORTA - ini) * (q - Q_ENTRADA) / (TOTAL - 1 - Q_ENTRADA)


def foco(q):
    """O foco acompanha a cachorra: perto no passeio e, na chegada, vai com ela até a porta (a fachada fica nítida)."""
    return math.hypot(cao_y(q) - camera_y(q), ALTURA_OLHO - 0.5)


OLHAR_LOJA = math.radians(5)  # na chegada o olhar sobe para a fachada, como quem chega e olha a loja


def inclinacao(q):
    if q <= Q_ENTRADA:
        return INCLINA
    t = (q - Q_ENTRADA) / (TOTAL - 1 - Q_ENTRADA)
    return INCLINA - OLHAR_LOJA * t * t * (3 - 2 * t)


def posicionar_camera(y, q=0):
    camobj.location = (0.0, y, ALTURA_OLHO)
    camobj.rotation_euler = (math.pi / 2 - inclinacao(q), 0.0, 0.0)  # +Y, um pouco para baixo


cam.dof.focus_distance = foco(0)


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
# a luz do sol espalhada na névoa (anisotropia alta) dá amostras raras e muito fortes, que o denoiser deixa como
# granulado; limitar a luz direta a 5 tira o granulado e mantém o brilho do véu. A camada da cachorra não tem névoa
# e fica sem limite (o brilho do sol nas pontas do pelo continua)
cena.cycles.sample_clamp_direct = opcao("--clamp-direto", 5.0 if MODO == "fundo" else 0.0)
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
cena.view_settings.look = "AgX - Medium High Contrast"
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
REGIAO = [float(v) for v in opcao("--regiao", "").split(",") if v]  # testes: só um recorte (x0,x1,y0,y1 em 0..1)
if REGIAO:
    cena.render.use_border = True
    cena.render.border_min_x, cena.render.border_max_x, cena.render.border_min_y, cena.render.border_max_y = REGIAO
if MODO == "fundo":
    ini, fim = int(args[2]), int(args[3])
    for q in QUADROS or range(ini, fim + 1):
        posicionar_camera(camera_y(q), q)
        cam.dof.focus_distance = foco(q)
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
    COURO = material("Couro conhaque", **{"Base Color": (0.3, 0.1, 0.035, 1), "Roughness": 0.45})
    METAL = material("Argola", **{"Base Color": (0.78, 0.66, 0.45, 1), "Metallic": 1.0, "Roughness": 0.28})
    FITA = material("Guia de corda", **{"Base Color": (0.13, 0.19, 0.15, 1), "Roughness": 0.9, "Specular IOR Level": 0.2})  # verde-sálvia escuro

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
        amostra.inputs["Count"].default_value = 6
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

    pelo = arvore_pelo(corpo, opcao("--densidade", 300000.0), 0.035, opcao("--raio-pelo", 0.00018), material_pelo())

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
    # a mão fica logo abaixo da base do quadro: a corda entra pela borda, sem ponta solta no ar
    MAO = ponto_da_tela(0.62, 1.12, 0.8) if TELA == "desktop" else ponto_da_tela(0.66, 1.06, 0.8)
    curva = bpy.data.curves.new("Guia", "CURVE")
    curva.dimensions = "3D"
    curva.bevel_depth = 0.005  # corda redonda de 1 cm
    curva.bevel_resolution = 3
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
        n_ = TOTAL - 1 - Q_ENTRADA
        for q in QUADROS or range(Q_ENTRADA, TOTAL):
            t = (q - Q_ENTRADA) / n_
            raiz.location.y = y_base + (cao_y(q) - camera_y(q)) - DIST_CAO
            cam.dof.focus_distance = foco(q)
            posicionar_camera(0.0, q)  # a camada da cachorra fica com a câmera parada; só o olhar sobe
            fase = ((cao_y(q) - DIST_CAO) / passo) % 1.0  # continua a passada do passeio (a distância andada)
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
