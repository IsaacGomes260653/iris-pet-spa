"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cards } from "@/content/midia";
import { posicoesCards } from "./caminho";
import { aoLado } from "./Paisagem";

const L = 1280, A = 800, ETIQ = 96; // foto 16:10 + faixa da etiqueta acima
const LARGURA = 1.45; // metros

function desenharCard(foto: HTMLImageElement, rotulo: string, mono: string) {
  const c = document.createElement("canvas");
  c.width = L;
  c.height = A + ETIQ;
  const ctx = c.getContext("2d")!;
  const esc = Math.max(L / foto.width, A / foto.height);
  const w = foto.width * esc, h = foto.height * esc;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, ETIQ, L, A);
  ctx.clip();
  ctx.drawImage(foto, (L - w) / 2, ETIQ + (A - h) / 2, w, h);
  ctx.restore();
  // etiqueta branca de canto vivo, apoiada na borda de cima, à direita (como na referência)
  ctx.font = `500 46px ${mono}`;
  const texto = rotulo.toUpperCase();
  const tw = ctx.measureText(texto).width + 52;
  ctx.fillStyle = "#fffdfb";
  ctx.fillRect(L - tw, 0, tw, ETIQ);
  ctx.fillStyle = "#16181c";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, L - tw + 26, ETIQ / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  return t;
}

/** Cards das fotos dos serviços: sempre de frente para quem passeia, passando perto, um de cada lado. */
export function Cards() {
  const itens = useMemo(
    () =>
      posicoesCards.map((p, i) => {
        const pos = aoLado(p.s, p.lado * (1.55 + (i % 2) * 0.2));
        pos.y = p.y;
        return { pos, card: cards[i], fase: i * 1.7 };
      }),
    [],
  );
  const materiais = useMemo(
    () => itens.map(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, toneMapped: false, fog: false })),
    [itens],
  );

  useEffect(() => {
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-martian").trim() || "monospace";
    let vivo = true;
    document.fonts.load(`500 46px ${mono}`).finally(() => {
      itens.forEach((it, i) => {
        const img = new Image();
        img.decoding = "async";
        img.src = it.card.foto.src;
        img.onload = () => {
          if (!vivo) return;
          materiais[i].map = desenharCard(img, it.card.rotulo, mono);
          materiais[i].needsUpdate = true;
        };
      });
    });
    return () => {
      vivo = false;
    };
  }, [itens, materiais]);

  const grupo = useRef<THREE.Group>(null);
  useFrame(({ camera, clock }) => {
    grupo.current?.children.forEach((c, i) => {
      const it = itens[i];
      c.position.y = it.pos.y + Math.sin(clock.elapsedTime * 0.6 + it.fase) * 0.025;
      // de frente para a câmera, sempre em pé
      c.rotation.y = Math.atan2(camera.position.x - c.position.x, camera.position.z - c.position.z);
      // longe, o card se dissolve na névoa (ele ignora a névoa da cena para ficar nítido quando perto)
      const d = camera.position.distanceTo(c.position);
      materiais[i].opacity = 1 - THREE.MathUtils.smoothstep(d, 14, 34);
    });
  });

  return (
    <group ref={grupo}>
      {itens.map((it, i) => (
        <mesh key={i} position={it.pos} material={materiais[i]} renderOrder={3}>
          <planeGeometry args={[LARGURA, (LARGURA * (A + ETIQ)) / L]} />
        </mesh>
      ))}
    </group>
  );
}
