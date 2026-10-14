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

// marcador: anel pontilhado + patinha, desenhado uma vez num canvas
function texturaMarcador(cor: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.strokeStyle = cor;
  g.fillStyle = cor;
  g.lineWidth = 5;
  g.setLineDash([2, 9]);
  g.lineCap = "round";
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.stroke();
  // patinha: almofada + 4 dedos
  g.beginPath();
  g.ellipse(64, 74, 13, 11, 0, 0, Math.PI * 2);
  g.fill();
  for (const [x, y] of [[46, 56], [57, 47], [71, 47], [82, 56]]) {
    g.beginPath();
    g.ellipse(x, y, 5.5, 7, 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
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

// rota pontilhada que anda: descarta trechos alternados pela distância ao longo da linha
const rotaVert = `
attribute float lineDistance;
varying float vDist;
void main() {
  vDist = lineDistance;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const rotaFrag = `
varying float vDist;
uniform float tempo;
uniform float opacidade;
void main() {
  if (fract(vDist * 60.0 - tempo) > 0.45) discard;
  gl_FragColor = vec4(1.0, 1.0, 1.0, opacidade);
}`;

type Props = {
  lojas: Loja[];
  visiveis: Set<string>;
  rotas: [Loja, Loja][];
  mostrarRotas: boolean;
  selecionada: Loja | null;
  aoEscolher: (l: Loja) => void;
  quieto: boolean;
  celular: boolean;
};

function Cena({ lojas, visiveis, rotas, mostrarRotas, selecionada, aoEscolher, quieto, celular }: Props) {
  const globo = useRef<THREE.Group>(null);
  const marcadores = useRef<(THREE.Sprite | null)[]>([]);
  const escalas = useRef(lojas.map(() => 1));
  const rotaMat = useRef<THREE.ShaderMaterial>(null);
  // a textura chega depois do primeiro quadro; até lá o globo fica no verde-escuro do material
  const textura = useMemo(() => {
    const t = new THREE.TextureLoader().load(celular ? "/globo/terra-2048.webp" : "/globo/terra-4096.webp");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [celular]);
  const marca = useMemo(() => texturaMarcador("#ffffff"), []);
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
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.004, CAMERA[celular ? 1 : 0][2] * 0.85, CAMERA[celular ? 1 : 0][2] * 1.15);
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

  const geoRotas = useMemo(
    () =>
      rotas.map(([a, b]) => {
        const pa = noGlobo(a.lat, a.lng);
        const pb = noGlobo(b.lat, b.lng);
        const pts = Array.from({ length: 33 }, (_, i) => {
          const t = i / 32;
          return pa.clone().lerp(pb, t).normalize().multiplyScalar(1.004 + Math.sin(Math.PI * t) * 0.03);
        });
        const linha = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts));
        linha.computeLineDistances();
        return linha.geometry;
      }),
    [rotas],
  );

  useFrame((_, dt) => {
    const g = giro.current;
    if (!globo.current) return;
    if (g.alvo) {
      g.x += (g.alvo.x - g.x) * Math.min(1, dt * 3);
      // pelo caminho mais curto
      const d = Math.atan2(Math.sin(g.alvo.y - g.y), Math.cos(g.alvo.y - g.y));
      g.y += d * Math.min(1, dt * 3);
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
    marcadores.current.forEach((m, i) => {
      if (!m) return;
      const alvo = visiveis.has(lojas[i].id) ? 1 : 0;
      escalas.current[i] += (alvo - escalas.current[i]) * Math.min(1, dt * 6);
      const pulso = quieto ? 1 : 1 + Math.sin(t * 2.2 + i * 0.7) * 0.08;
      const destaque = selecionada?.id === lojas[i].id ? 1.5 : 1;
      const s = (celular ? 0.075 : 0.055) * escalas.current[i] * pulso * destaque;
      m.scale.set(s, s, s);
      m.visible = escalas.current[i] > 0.02;
    });
    if (rotaMat.current) {
      rotaMat.current.uniforms.tempo.value = quieto ? 0 : t * 1.2;
      const o = rotaMat.current.uniforms.opacidade;
      o.value += ((mostrarRotas ? 0.85 : 0) - o.value) * Math.min(1, dt * 5);
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[-3, 3, 4]} intensity={2.2} color="#fff4e8" />
      <group position={[0, -1.08, 0]}>
        <group ref={globo}>
          <mesh>
            <sphereGeometry args={[1, 128, 96]} />
            <meshStandardMaterial map={textura} color="#ffffff" roughness={0.92} metalness={0} />
          </mesh>
          {lojas.map((l, i) => (
            <sprite
              key={l.id}
              ref={(s) => void (marcadores.current[i] = s)}
              position={noGlobo(l.lat, l.lng, 1.012)}
              onClick={(e) => {
                e.stopPropagation();
                if (visiveis.has(l.id)) aoEscolher(l);
              }}
              onPointerOver={() => (document.body.style.cursor = "pointer")}
              onPointerOut={() => (document.body.style.cursor = "")}
            >
              <spriteMaterial map={marca} transparent depthWrite={false} sizeAttenuation />
            </sprite>
          ))}
          {geoRotas.map((geo, i) => (
            <line key={i}>
              <primitive object={geo} attach="geometry" />
              <shaderMaterial
                ref={i === 0 ? rotaMat : undefined}
                attach="material"
                vertexShader={rotaVert}
                fragmentShader={rotaFrag}
                transparent
                depthWrite={false}
                uniforms={i === 0 ? { tempo: { value: 0 }, opacidade: { value: 0.85 } } : undefined}
              />
            </line>
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

// câmera olhando reto para -Z, abaixada para o topo do globo ficar perto do alto da área (desktop, celular)
const CAMERA: [number, number, number][] = [
  [0, -0.54, 2.1],
  [0, -0.78, 3.2],
];

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
