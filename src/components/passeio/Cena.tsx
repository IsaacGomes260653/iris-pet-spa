"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, Effect, ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Cachorra, type Marcha } from "./Cachorra";
import { Cards } from "./Cards";
import { DIANTEIRA, FIM, MAO_CELULAR, MAO_PADRAO, PORTA_Z, pontoEm, tangenteEm } from "./caminho";
import { COR_NEVOA, Ceu, SOL } from "./Ceu";
import { Guia, type Ossos } from "./Guia";
import { Ipes } from "./Ipes";
import { Loja } from "./Loja";
import { Mao, type AjusteMao } from "./Mao";
import { aplicarNevoaDeAltura } from "./nevoaAltura";
import { Arvores, Caminhos, Grama, NevoaRasteira, Ponte, Rio, Terreno } from "./Paisagem";

aplicarNevoaDeAltura();

/** Câmera na altura do peito seguindo o caminho; a Ellie anda à frente, no lugar da proa. */
function Rig({
  progresso,
  marcha,
  cachorra,
  foco,
  sol,
}: {
  progresso: React.RefObject<number>;
  marcha: React.RefObject<Marcha>;
  cachorra: React.RefObject<THREE.Group | null>;
  foco: THREE.Vector3;
  sol: React.RefObject<THREE.DirectionalLight | null>;
}) {
  const { camera, scene } = useThree();
  const s = useRef(-1);
  const passo = useRef(0);
  const fovBase = useRef((camera as THREE.PerspectiveCamera).fov);
  const v = useMemo(() => ({ p: new THREE.Vector3(), alvo: new THREE.Vector3(), t: new THREE.Vector3() }), []);

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 1 / 20);
    const alvo = THREE.MathUtils.clamp(progresso.current ?? 0, 0, 1) * FIM;
    if (s.current < 0) s.current = alvo;
    const antes = s.current;
    s.current = THREE.MathUtils.damp(s.current, alvo, 3.2, dt);
    const vel = (s.current - antes) / Math.max(dt, 1e-4);
    marcha.current.velocidade = THREE.MathUtils.damp(marcha.current.velocidade, Math.abs(vel), 8, dt);

    // passo humano: balanço sutil da câmera enquanto anda
    passo.current += dt * Math.min(marcha.current.velocidade, 2.2) * 5.2;
    const anda = Math.min(1, marcha.current.velocidade / 0.6);
    const bob = Math.sin(passo.current) * 0.018 * anda, lado = Math.sin(passo.current * 0.5) * 0.012 * anda;

    pontoEm(s.current, v.p);
    tangenteEm(s.current, v.t);
    camera.position.set(v.p.x + v.t.z * -lado, 1.16 + bob, v.p.z - v.t.x * -lado);
    // nos últimos metros o olhar sobe para mostrar a fachada e o letreiro
    const chegada = THREE.MathUtils.smoothstep(s.current, FIM - 16, FIM);
    pontoEm(s.current + 9, v.alvo);
    // ~13° para baixo: a cachorra ocupa a metade de baixo do quadro, como a proa na referência
    camera.lookAt(v.alvo.x, THREE.MathUtils.lerp(-0.93, 1.9, chegada), v.alvo.z);
    // na chegada o quadro abre para caber a fachada inteira e a Ellie
    const cam = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.lerp(fovBase.current, fovBase.current + 14, chegada);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    // a névoa abre na chegada: a fachada aparece nítida
    if (scene.fog instanceof THREE.FogExp2) scene.fog.density = THREE.MathUtils.lerp(0.033, 0.009, chegada);

    // a cachorra
    const sc = s.current + DIANTEIRA;
    pontoEm(sc, v.p);
    tangenteEm(sc, v.t);
    if (cachorra.current) {
      cachorra.current.position.copy(v.p);
      cachorra.current.rotation.y = Math.atan2(v.t.x, v.t.z);
      // na chegada o foco passa da cachorra para a fachada
      foco.copy(v.p).setY(0.55).lerp(v.alvo.set(v.p.x, 2.2, PORTA_Z), chegada);
    }
    // o sol acompanha a cachorra para a sombra ficar nítida perto dela
    if (sol.current) {
      sol.current.position.copy(v.p).addScaledVector(SOL, 30);
      sol.current.target.position.copy(v.p);
      sol.current.target.updateMatrixWorld();
    }
  });
  return null;
}

/** Gradação de amanhecer: sombras puxadas para lavanda, luzes para pêssego (soft light). */
class Amanhecer extends Effect {
  constructor() {
    super(
      "Amanhecer",
      /* glsl */ `
      uniform vec3 uSombra, uLuz;
      uniform float uForca;
      void mainImage(const in vec4 cor, const in vec2 uv, out vec4 saida) {
        vec3 c = cor.rgb;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        vec3 tom = mix(uSombra, uLuz, smoothstep(0.04, 0.8, l));
        vec3 suave = (1.0 - 2.0 * tom) * c * c + 2.0 * tom * c;
        saida = vec4(mix(c, suave, uForca), cor.a);
      }`,
      {
        uniforms: new Map<string, THREE.Uniform>([
          ["uSombra", new THREE.Uniform(new THREE.Color("#5b5a86"))],
          ["uLuz", new THREE.Uniform(new THREE.Color("#ffc9a3"))],
          ["uForca", new THREE.Uniform(0.42)],
        ]),
      },
    );
  }
}

function Efeitos({ foco, leve }: { foco: THREE.Vector3; leve: boolean }) {
  // DoF suave e largo de propósito: os cards precisam ficar nítidos quando passam perto
  const gradacao = useMemo(() => new Amanhecer(), []);
  const dof = useRef<DepthOfFieldEffect>(null);
  useFrame(() => dof.current?.target?.copy(foco));
  if (leve)
    return (
      <EffectComposer multisampling={0}>
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <primitive object={gradacao} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
        <Vignette offset={0.25} darkness={0.6} />
      </EffectComposer>
    );
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField ref={dof} target={[0, 0.5, 0]} worldFocusRange={6} bokehScale={4} />
      <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.8} luminanceSmoothing={0.25} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <primitive object={gradacao} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
      <Vignette offset={0.22} darkness={0.62} />
      <SMAA />
    </EffectComposer>
  );
}

export default function Cena({
  progresso,
  leve = false,
  efeitos = true,
  ajusteMao,
  ativa = true,
  aoPronto,
  aoPerder,
}: {
  progresso: React.RefObject<number>;
  leve?: boolean;
  efeitos?: boolean;
  ajusteMao?: AjusteMao;
  ativa?: boolean;
  aoPronto?: () => void;
  aoPerder?: () => void;
}) {
  const marcha = useRef<Marcha>({ velocidade: 0 });
  const cachorra = useRef<THREE.Group>(null);
  const pegada = useRef<THREE.Object3D>(null);
  const ossos = useRef<Ossos>({ pescoco: null, cabeca: null });
  const sol = useRef<THREE.DirectionalLight>(null);
  const foco = useMemo(() => new THREE.Vector3(0, 0.5, 0), []);

  return (
    <Canvas
      frameloop={ativa ? "always" : "never"}
      shadows="variance"
      dpr={leve ? [1, 1.5] : [1, 1.6]}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: leve ? 64 : 44, near: 0.05, far: 700, position: [0, 1.16, 6] }}
      onCreated={({ gl }) => {
        gl.setClearColor(COR_NEVOA);
        // contexto perdido (celular em segundo plano): o poster volta para a frente
        gl.domElement.addEventListener("webglcontextlost", () => aoPerder?.());
      }}
    >
      <fogExp2 attach="fog" args={[COR_NEVOA, 0.033]} />
      <hemisphereLight args={["#b9bbe2", "#5c5045", 1.15]} />
      <directionalLight
        ref={sol}
        color="#ffc293"
        intensity={3.1}
        castShadow
        shadow-mapSize={leve ? [1024, 1024] : [2048, 2048]}
        shadow-radius={9}
        shadow-blurSamples={12}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
      <Suspense fallback={null}>
        <Ceu />
        <Terreno />
        <Rio />
        <Caminhos />
        <Ponte />
        <Arvores quantidade={leve ? 80 : 140} />
        <Ipes floresPorArvore={leve ? 140 : 240} />
        <Grama quantidade={leve ? 14000 : 52000} />
        <NevoaRasteira camadas={leve ? 6 : 9} />
        <Loja />
        <Cards leve={leve} />
        {/* ordem importa: câmera → animação da cachorra → mão → guia, tudo no mesmo quadro */}
        <Rig progresso={progresso} marcha={marcha} cachorra={cachorra} foco={foco} sol={sol} />
        <Cachorra ref={cachorra} marcha={marcha} ossos={ossos} />
        <object3D ref={pegada} />
        <Mao pegada={pegada} ajuste={ajusteMao ?? (leve ? MAO_CELULAR : MAO_PADRAO)} />
        <Guia ossos={ossos} pegada={pegada} />
        <Pronto aoPronto={aoPronto} />
      </Suspense>
      {efeitos && <Efeitos foco={foco} leve={leve} />}
    </Canvas>
  );
}

/** Avisa depois de alguns quadros desenhados, para trocar o poster pela cena sem piscar. */
function Pronto({ aoPronto }: { aoPronto?: () => void }) {
  const quadros = useRef(0);
  useFrame(() => {
    if (++quadros.current === 4) aoPronto?.();
  });
  useEffect(() => () => void (quadros.current = 0), []);
  return null;
}
