"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Loja } from "@/content/lojas";

/** Latitude e longitude → ponto na esfera, no mesmo mapeamento da textura equirretangular da SphereGeometry. */
export function noGlobo(lat: number, lng: number, raio = 1) {
  const phi = ((lng + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)).multiplyScalar(raio);
}

/**
 * Rotação (x, y) do globo que traz um ponto para a frente da câmera: o giro em Y o leva para o plano da câmera
 * e a inclinação em X o sobe a ~42° de elevação, o meio da calota que aparece acima do horizonte da tela.
 */
export function rotacaoPara(lat: number, lng: number) {
  const phi = ((lng + 180) / 360) * Math.PI * 2;
  return { y: Math.PI / 2 - phi, x: THREE.MathUtils.degToRad(lat - 42) };
}

/** Um marcador no globo: uma unidade sozinha ou um grupo de unidades vizinhas (com a contagem). */
export type Grupo = { id: string; lat: number; lng: number; membros: Loja[] };

// marcadores desenhados uma vez em canvas: anel pontilhado + patinha, anel cheio (escolhido) ou anel + número (grupo)
function textura(desenho: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.strokeStyle = g.fillStyle = "#ffffff";
  g.lineCap = "round";
  desenho(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function anel(g: CanvasRenderingContext2D, cheio: boolean) {
  g.lineWidth = cheio ? 7 : 5;
  g.setLineDash(cheio ? [] : [2, 9]);
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
}
function patinha(g: CanvasRenderingContext2D) {
  g.beginPath();
  g.ellipse(64, 74, 13, 11, 0, 0, Math.PI * 2);
  g.fill();
  for (const [x, y] of [[46, 56], [57, 47], [71, 47], [82, 56]]) {
    g.beginPath();
    g.ellipse(x, y, 5.5, 7, 0, 0, Math.PI * 2);
    g.fill();
  }
}

const atmosferaVert = `
varying vec3 vNormal;
varying vec3 vVista;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vVista = normalize(-p.xyz);
  gl_Position = projectionMatrix * p;
}`;
const atmosferaFrag = `
varying vec3 vNormal;
varying vec3 vVista;
uniform vec3 cor;
void main() {
  // vista pelo lado de dentro: mais forte junto à borda do globo, some na borda de fora
  float perto = clamp(abs(dot(vNormal, vVista)) / 0.42, 0.0, 1.0);
  gl_FragColor = vec4(cor, pow(perto, 3.0) * 0.55);
}`;

// rota em tubo fino com tracejado que anda (uv.x vai de 0 a 1 ao longo do caminho)
const rotaVert = `
varying float vU;
void main() {
  vU = uv.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const rotaFrag = `
varying float vU;
uniform float tempo;
uniform float tracos;
uniform float opacidade;
void main() {
  if (fract(vU * tracos - tempo) > 0.5) discard;
  gl_FragColor = vec4(1.0, 1.0, 1.0, opacidade);
}`;

type Props = {
  grupos: Grupo[];
  ativos: Set<string>;
  rotas: [Loja, Loja][];
  rotasFortes: boolean;
  selecionada: Loja | null;
  aoEscolher: (l: Loja) => void;
  aoEscolherGrupo: (g: Grupo) => void;
  quieto: boolean;
  celular: boolean;
};

// câmera olhando reto para -Z, abaixada para o topo do globo ficar perto do alto da área (desktop, celular)
const CAMERA: [number, number, number][] = [
  [0, -0.54, 2.1],
  [0, -0.78, 3.2],
];

function Cena({ grupos, ativos, rotas, rotasFortes, selecionada, aoEscolher, aoEscolherGrupo, quieto, celular }: Props) {
  const globo = useRef<THREE.Group>(null);
  const marcadores = useRef<(THREE.Sprite | null)[]>([]);
  const estado = useRef(grupos.map(() => ({ opacidade: 1, escala: 1 })));
  const rotaMats = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const viajantes = useRef<(THREE.Sprite | null)[]>([]);
  // a textura chega depois do primeiro quadro; até lá o globo fica no verde-escuro do material
  const terra = useMemo(() => {
    const t = new THREE.TextureLoader().load(celular ? "/globo/terra-2048.webp" : "/globo/terra-4096.webp");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [celular]);
  const texSolta = useMemo(
    () =>
      textura((g) => {
        anel(g, false);
        patinha(g);
      }),
    [],
  );
  const texEscolhida = useMemo(
    () =>
      textura((g) => {
        anel(g, true);
        patinha(g);
      }),
    [],
  );
  const texPonto = useMemo(
    () =>
      textura((g) => {
        g.beginPath();
        g.arc(64, 64, 40, 0, Math.PI * 2);
        g.fill();
      }),
    [],
  );
  const texGrupos = useMemo(() => {
    const m = new Map<number, THREE.CanvasTexture>();
    for (const gr of grupos) {
      const n = gr.membros.length;
      if (n > 1 && !m.has(n))
        m.set(n, textura((g) => {
          anel(g, false);
          g.font = "500 46px ui-monospace, monospace";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(String(n), 64, 67);
        }));
    }
    return m;
  }, [grupos]);
  const { gl, camera } = useThree();

  // estado da rotação: alvo, velocidade (inércia) e se a pessoa já mexeu (aí a rotação automática para)
  const giro = useRef({ ...rotacaoPara(-14, -51), vx: 0, vy: 0, mexeu: false, arrastando: false, px: 0, py: 0, alvo: null as null | { x: number; y: number } });

  useEffect(() => {
    const el = gl.domElement;
    const g = giro.current;
    const desce = (e: PointerEvent) => {
      g.arrastando = true;
      g.mexeu = true;
      g.alvo = null;
      g.px = e.clientX;
      g.py = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!g.arrastando) return;
      const dx = (e.clientX - g.px) * 0.005;
      const dy = e.pointerType === "touch" ? 0 : (e.clientY - g.py) * 0.005; // no toque, o vertical é da rolagem
      g.px = e.clientX;
      g.py = e.clientY;
      g.vy = dx;
      g.vx = dy;
      g.y += dx;
      g.x = THREE.MathUtils.clamp(g.x + dy, -1.6, 0.6);
    };
    const sobe = () => (g.arrastando = false);
    // zoom limitado: pinça no trackpad ou ctrl + roda (a roda sozinha continua rolando a página)
    const roda = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      g.mexeu = true;
      const z = CAMERA[celular ? 1 : 0][2];
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.004, z * 0.85, z * 1.15);
    };
    el.addEventListener("pointerdown", desce);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", sobe);
    el.addEventListener("pointercancel", sobe);
    el.addEventListener("wheel", roda, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", desce);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", sobe);
      el.removeEventListener("pointercancel", sobe);
      el.removeEventListener("wheel", roda);
    };
  }, [gl, camera, celular]);

  // escolher uma unidade (no marcador ou na lista) gira o globo até ela
  useEffect(() => {
    if (selecionada) giro.current.alvo = rotacaoPara(selecionada.lat, selecionada.lng);
  }, [selecionada]);

  // arcos de grande círculo, um pouco acima da superfície
  const caminhos = useMemo(
    () =>
      rotas.map(([a, b]) => {
        const pa = noGlobo(a.lat, a.lng);
        const pb = noGlobo(b.lat, b.lng);
        const pts = Array.from({ length: 41 }, (_, i) => {
          const t = i / 40;
          return pa.clone().lerp(pb, t).normalize().multiplyScalar(1.004 + Math.sin(Math.PI * t) * 0.025);
        });
        const curva = new THREE.CatmullRomCurve3(pts);
        return { curva, geo: new THREE.TubeGeometry(curva, 48, celular ? 0.0026 : 0.0018, 5, false), tracos: Math.max(4, Math.round(curva.getLength() / 0.014)) };
      }),
    [rotas, celular],
  );

  useFrame((_, dt) => {
    const g = giro.current;
    if (!globo.current) return;
    if (g.alvo) {
      g.x += (g.alvo.x - g.x) * Math.min(1, dt * 3.5);
      // pelo caminho mais curto
      const d = Math.atan2(Math.sin(g.alvo.y - g.y), Math.cos(g.alvo.y - g.y));
      g.y += d * Math.min(1, dt * 3.5);
      if (Math.abs(d) < 0.001 && Math.abs(g.alvo.x - g.x) < 0.001) g.alvo = null;
    } else if (!g.arrastando) {
      g.y += g.vy;
      g.x = THREE.MathUtils.clamp(g.x + g.vx, -1.6, 0.6);
      g.vx *= 0.92;
      g.vy *= 0.92;
      if (!g.mexeu && !quieto) g.y += dt * 0.012; // bem devagar: o Brasil continua à vista
    }
    globo.current.rotation.set(g.x, g.y, 0, "XYZ");

    const t = performance.now() / 1000;
    const base = celular ? 0.075 : 0.055;
    marcadores.current.forEach((m, i) => {
      if (!m) return;
      const gr = grupos[i];
      const e = estado.current[i];
      const ativo = gr.membros.some((l) => ativos.has(l.id));
      const escolhido = gr.membros.length === 1 && selecionada?.id === gr.membros[0].id;
      // fora do filtro a unidade não some: fica a 20%, para o mapa continuar inteiro
      e.opacidade += ((ativo ? 1 : 0.2) - e.opacidade) * Math.min(1, dt * 6);
      e.escala += ((escolhido ? 1.6 : gr.membros.length > 1 ? 1.15 : 1) - e.escala) * Math.min(1, dt * 6);
      const pulso = quieto || !ativo ? 1 : 1 + Math.sin(t * 2.2 + i * 0.7) * 0.06;
      const s = base * e.escala * pulso;
      m.scale.set(s, s, s);
      const mat = m.material as THREE.SpriteMaterial;
      mat.opacity = e.opacidade;
      if (gr.membros.length === 1) mat.map = escolhido ? texEscolhida : texSolta;
    });
    rotaMats.current.forEach((mat) => {
      if (!mat) return;
      mat.uniforms.tempo.value = quieto ? 0 : t * 0.9;
      mat.uniforms.opacidade.value += ((rotasFortes ? 0.95 : 0.3) - mat.uniforms.opacidade.value) * Math.min(1, dt * 5);
    });
    // um ponto percorre cada rota, como um carro do Táxi Dog
    viajantes.current.forEach((v, i) => {
      if (!v) return;
      const u = quieto ? 0.5 : (t * 0.08 + i * 0.37) % 1;
      v.position.copy(caminhos[i].curva.getPointAt(u));
      const s = (celular ? 0.03 : 0.022) * (rotasFortes ? 1 : 0);
      v.scale.set(s, s, s);
    });
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[-3, 3, 4]} intensity={2.2} color="#fff4e8" />
      <group position={[0, -1.08, 0]}>
        <group ref={globo}>
          <mesh>
            <sphereGeometry args={[1, 128, 96]} />
            <meshStandardMaterial map={terra} color="#ffffff" roughness={0.92} metalness={0} />
          </mesh>
          {grupos.map((gr, i) => (
            <sprite
              key={gr.id}
              ref={(s) => void (marcadores.current[i] = s)}
              position={noGlobo(gr.lat, gr.lng, 1.012)}
              renderOrder={2}
              onClick={(e) => {
                e.stopPropagation();
                if (!gr.membros.some((l) => ativos.has(l.id))) return;
                if (gr.membros.length === 1) aoEscolher(gr.membros[0]);
                else aoEscolherGrupo(gr);
              }}
              onPointerOver={() => (document.body.style.cursor = "pointer")}
              onPointerOut={() => (document.body.style.cursor = "")}
            >
              <spriteMaterial map={gr.membros.length > 1 ? texGrupos.get(gr.membros.length) : texSolta} transparent depthWrite={false} />
            </sprite>
          ))}
          {caminhos.map((c, i) => (
            <group key={i}>
              <mesh geometry={c.geo} renderOrder={1}>
                <shaderMaterial
                  ref={(m) => void (rotaMats.current[i] = m)}
                  vertexShader={rotaVert}
                  fragmentShader={rotaFrag}
                  uniforms={{ tempo: { value: 0 }, tracos: { value: c.tracos }, opacidade: { value: 0.95 } }}
                  transparent
                  depthWrite={false}
                />
              </mesh>
              <sprite ref={(s) => void (viajantes.current[i] = s)} renderOrder={3}>
                <spriteMaterial map={texPonto} transparent depthWrite={false} />
              </sprite>
            </group>
          ))}
        </group>
        {/* brilho da atmosfera */}
        <mesh scale={1.09}>
          <sphereGeometry args={[1, 64, 48]} />
          <shaderMaterial
            vertexShader={atmosferaVert}
            fragmentShader={atmosferaFrag}
            uniforms={{ cor: { value: new THREE.Color("#bfe9cf") } }}
            side={THREE.BackSide}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}

export default function Globo(props: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 32, position: CAMERA[props.celular ? 1 : 0], rotation: [0, 0, 0], near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      aria-hidden
    >
      <Cena {...props} />
    </Canvas>
  );
}
