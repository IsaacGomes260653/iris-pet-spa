"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { PORTA_Z } from "./caminho";
import { pedra } from "./texturas";

const X = -2.2; // centro da fachada, alinhado com o fim do caminho
const CREME = "#ece2cf", SALVIA = "#8fa38b", SALVIA_ESCURO = "#6f846c";

function canvasTex(w: number, h: number, pinta: (c: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  pinta(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { t, ctx, c };
}

const familia = (v: string, reserva: string) =>
  (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(v).trim()) || reserva;

/** Letreiro com o logo: desenhado com a própria Literata da página. */
function useLetreiro() {
  const letreiro = useMemo(() => canvasTex(2048, 512, () => {}), []);
  useEffect(() => {
    const serifa = familia("--font-literata", "Georgia, serif"), mono = familia("--font-martian", "monospace");
    const desenhar = () => {
      const { ctx, c, t } = letreiro;
      ctx.fillStyle = SALVIA_ESCURO;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#fbf3e4";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `400 290px ${serifa}`;
      ctx.fillText("Íris", c.width / 2, 330);
      ctx.font = `500 50px ${mono}`;
      ctx.fillText("P E T   S P A", c.width / 2, 440);
      t.needsUpdate = true;
    };
    desenhar();
    document.fonts.load(`300 300px ${serifa}`).then(desenhar, () => {});
  }, [letreiro]);
  return letreiro.t;
}

/** Interior visto pelo vidro: luz quente, prateleiras e produtos fora de foco. */
function useInterior() {
  return useMemo(
    () =>
      canvasTex(512, 512, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, "#ffd29a");
        g.addColorStop(0.55, "#f0a862");
        g.addColorStop(1, "#8d5a36");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);
        ctx.filter = "blur(6px)";
        const cores = ["#d98a5b", "#8fa38b", "#f1d9c0", "#c86f7a", "#6f8fa3", "#e7b65c"];
        for (let y = 120; y < 470; y += 95) {
          ctx.fillStyle = "rgba(120,80,50,0.55)";
          ctx.fillRect(20, y + 52, 472, 10);
          for (let x = 30; x < 480; x += 34 + ((x * 7) % 19)) {
            ctx.fillStyle = cores[(x + y) % cores.length];
            ctx.fillRect(x, y + 52 - (24 + ((x * y) % 26)), 22, 24 + ((x * y) % 26));
          }
        }
        ctx.filter = "none";
      }).t,
    [],
  );
}

function useToldo() {
  return useMemo(
    () =>
      canvasTex(256, 64, (ctx) => {
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? CREME : SALVIA;
          ctx.fillRect(i * 32, 0, 32, 64);
        }
      }).t,
    [],
  );
}

export function Loja() {
  const letreiro = useLetreiro();
  const interior = useInterior();
  const toldo = useToldo();
  const piso = useMemo(() => {
    const p = pedra();
    p.repeat.set(6, 6);
    return p;
  }, []);
  const z = PORTA_Z;

  const vidro = <meshStandardMaterial color="#d6e2e0" transparent opacity={0.14} roughness={0.05} metalness={0.5} depthWrite={false} />;
  const moldura = <meshStandardMaterial color={SALVIA} roughness={0.6} />;

  return (
    <group>
      {/* praça de pedra */}
      <mesh rotation-x={-Math.PI / 2} position={[X, 0.01, z + 7]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial map={piso} roughness={0.95} color="#e8dfd6" />
      </mesh>
      {/* prédio */}
      <mesh position={[X, 2.9, z - 4.5]} castShadow receiveShadow>
        <boxGeometry args={[13, 5.8, 9]} />
        {/* o sol está atrás da loja: a fachada recebe a luz do céu da manhã (emissão suave) */}
        <meshStandardMaterial color={CREME} roughness={0.92} emissive="#f3e2c8" emissiveIntensity={0.42} />
      </mesh>
      <mesh position={[X, 0.25, z + 0.02]} receiveShadow>
        <boxGeometry args={[13.05, 0.5, 0.08]} />
        <meshStandardMaterial color={SALVIA_ESCURO} roughness={0.8} />
      </mesh>
      {/* porta dupla de vidro */}
      <group position={[X, 0, z + 0.05]}>
        <mesh position={[0, 1.35, -0.035]}>
          <planeGeometry args={[2.1, 2.7]} />
          <meshBasicMaterial map={interior} color="#ffffff" />
        </mesh>
        {[-0.5, 0.5].map((dx) => (
          <mesh key={dx} position={[dx, 1.35, 0.02]}>
            <planeGeometry args={[0.96, 2.6]} />
            {vidro}
          </mesh>
        ))}
        {[[-1.05, 1.4, 0.1, 2.9], [1.05, 1.4, 0.1, 2.9], [0, 2.8, 2.2, 0.12], [0, 1.4, 0.05, 2.7]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.04]} castShadow>
            <boxGeometry args={[w, h, 0.12]} />
            {moldura}
          </mesh>
        ))}
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 1.25, 0.12]}>
            <boxGeometry args={[0.03, 0.55, 0.03]} />
            <meshStandardMaterial color="#c7a76a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* vitrines */}
      {[-3.6, 3.6].map((dx) => (
        <group key={dx} position={[X + dx, 0, z + 0.05]}>
          <mesh position={[0, 1.75, -0.035]}>
            <planeGeometry args={[2.9, 2.1]} />
            <meshBasicMaterial map={interior} color="#ffffff" />
          </mesh>
          <mesh position={[0, 1.75, 0.02]}>
            <planeGeometry args={[2.9, 2.1]} />
            {vidro}
          </mesh>
          {[[-1.5, 1.75, 0.1, 2.3], [1.5, 1.75, 0.1, 2.3], [0, 2.85, 3.1, 0.1], [0, 0.66, 3.1, 0.12], [0, 1.75, 0.05, 2.1]].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, 0.04]}>
              <boxGeometry args={[w, h, 0.1]} />
              {moldura}
            </mesh>
          ))}
        </group>
      ))}
      {/* toldo listrado */}
      <mesh position={[X, 3.25, z + 0.7]} rotation-x={0.42} castShadow>
        <boxGeometry args={[10.6, 0.04, 1.6]} />
        <meshStandardMaterial map={toldo} roughness={0.85} />
      </mesh>
      {/* letreiro */}
      <mesh position={[X, 4.5, z + 0.08]}>
        <planeGeometry args={[4.8, 1.2]} />
        <meshStandardMaterial map={letreiro} roughness={0.85} />
      </mesh>
      {/* luz quente saindo pela porta */}
      <pointLight position={[X, 1.6, z + 1.4]} color="#ffb877" intensity={3.5} distance={9} decay={2} />
      {/* arandelas quentes */}
      {[-1.55, 1.55].map((dx) => (
        <group key={dx} position={[X + dx, 2.35, z + 0.18]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.11, 0.3, 12]} />
            <meshStandardMaterial color="#fff1d6" emissive="#ffc27a" emissiveIntensity={2.4} toneMapped={false} />
          </mesh>
          <pointLight color="#ffc27a" intensity={2.2} distance={6} decay={2} />
        </group>
      ))}
      {/* floreiras */}
      {[-5.6, 5.6].map((dx) => (
        <group key={dx} position={[X + dx, 0, z + 0.9]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[1.4, 0.6, 0.6]} />
            <meshStandardMaterial color={SALVIA_ESCURO} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <icosahedronGeometry args={[0.55, 2]} />
            <meshStandardMaterial color="#56684f" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
