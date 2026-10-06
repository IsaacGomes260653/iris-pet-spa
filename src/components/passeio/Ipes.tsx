"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { aoLado, alturaTerreno } from "./Paisagem";
import { flor } from "./texturas";

const aleatorio = (s: number) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

// alameda: ipês dos dois lados, de s = 35 a s = 74
const ARVORES = (() => {
  const r = aleatorio(17), lista: { pos: THREE.Vector3; rot: number; esc: number }[] = [];
  for (let s = 35; s <= 74; s += 6.2)
    for (const lado of [-1, 1]) {
      const p = aoLado(s + (r() - 0.5) * 1.5, lado * (3.1 + r() * 0.6));
      p.y = alturaTerreno(p.x, p.z);
      lista.push({ pos: p, rot: r() * 6.28, esc: 0.9 + r() * 0.3 });
    }
  return lista;
})();

/** Ponta de cada galho (no espaço da árvore), onde as flores se concentram. */
const PONTAS = [
  [1.5, 4.3, 0.3], [-1.3, 4.5, 0.6], [0.4, 4.9, -1.3], [-0.6, 4.1, -1.4], [0.9, 3.8, 1.5], [-1.7, 3.7, -0.4], [0.1, 5.2, 0.2],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));

function geometriaTronco() {
  const partes: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(0.11, 0.2, 2.9, 7).translate(0, 1.45, 0)];
  const topo = new THREE.Vector3(0, 2.7, 0);
  for (const ponta of PONTAS) {
    const dir = ponta.clone().sub(topo), comp = dir.length();
    const g = new THREE.CylinderGeometry(0.025, 0.08, comp, 5).translate(0, comp / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
    partes.push(g.translate(topo.x, topo.y, topo.z));
  }
  return mergeGeometries(partes.map((g) => (g.index ? g.toNonIndexed() : g)));
}

export function Ipes({ floresPorArvore = 240 }: { floresPorArvore?: number }) {
  const tronco = useMemo(() => geometriaTronco(), []);
  const texFlor = useMemo(() => flor(), []);
  const troncos = useRef<THREE.InstancedMesh>(null);
  const flores = useRef<THREE.InstancedMesh>(null);
  const chao = useRef<THREE.InstancedMesh>(null);
  const totalFlores = ARVORES.length * floresPorArvore;
  const totalChao = 2600;

  useLayoutEffect(() => {
    const r = aleatorio(3), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cor = new THREE.Color();
    const um = new THREE.Vector3(1, 1, 1);
    ARVORES.forEach((a, i) => {
      m.compose(a.pos, q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a.rot), um.clone().setScalar(a.esc));
      troncos.current!.setMatrixAt(i, m);
      // cachos em volta das pontas dos galhos, num domo
      for (let k = 0; k < floresPorArvore; k++) {
        const ponta = PONTAS[Math.floor(r() * PONTAS.length)];
        const local = ponta.clone().add(new THREE.Vector3((r() - 0.5) * 1.5, (r() - 0.35) * 1.0, (r() - 0.5) * 1.5));
        local.applyAxisAngle(new THREE.Vector3(0, 1, 0), a.rot).multiplyScalar(a.esc).add(a.pos);
        e.set(r() * 6.28, r() * 6.28, r() * 6.28);
        m.compose(local, q.setFromEuler(e), um.clone().setScalar(0.55 + r() * 0.5));
        flores.current!.setMatrixAt(i * floresPorArvore + k, m);
        flores.current!.setColorAt(i * floresPorArvore + k, cor.setHSL(0.92 + r() * 0.05, 0.45 + r() * 0.2, 0.62 + r() * 0.16));
      }
    });
    // tapete de flores no chão, mais denso perto das árvores
    for (let k = 0; k < totalChao; k++) {
      const a = ARVORES[Math.floor(r() * ARVORES.length)];
      const ang = r() * 6.28, raio = Math.pow(r(), 0.7) * 4.2;
      const p = new THREE.Vector3(a.pos.x + Math.cos(ang) * raio, 0, a.pos.z + Math.sin(ang) * raio);
      p.y = Math.max(alturaTerreno(p.x, p.z), 0) + 0.02 + r() * 0.01;
      e.set(-Math.PI / 2, 0, r() * 6.28);
      m.compose(p, q.setFromEuler(e), um.clone().setScalar(0.18 + r() * 0.25));
      chao.current!.setMatrixAt(k, m);
      chao.current!.setColorAt(k, cor.setHSL(0.92 + r() * 0.05, 0.4, 0.7 + r() * 0.12));
    }
    for (const ref of [troncos, flores, chao]) ref.current!.instanceMatrix.needsUpdate = true;
  }, [floresPorArvore]);

  return (
    <group>
      <instancedMesh ref={troncos} args={[tronco, undefined, ARVORES.length]} castShadow>
        <meshStandardMaterial color="#4c4041" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={flores} args={[undefined, undefined, totalFlores]} castShadow>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial map={texFlor} alphaTest={0.45} side={THREE.DoubleSide} roughness={0.8} emissive="#d98aa8" emissiveIntensity={0.18} />
      </instancedMesh>
      <instancedMesh ref={chao} args={[undefined, undefined, totalChao]} receiveShadow>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial map={texFlor} alphaTest={0.45} roughness={0.9} />
      </instancedMesh>
      <PetalasCaindo />
    </group>
  );
}

/** Pétalas caindo devagar ao longo da alameda (animadas na GPU). */
function PetalasCaindo({ quantidade = 420 }: { quantidade?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tempo = useMemo(() => ({ value: 0 }), []);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#f3b7cf", side: THREE.DoubleSide, roughness: 0.7, emissive: "#e79bba", emissiveIntensity: 0.25 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTempo = tempo;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTempo;").replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float fase = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 0.9;
        float a = uTempo * (1.2 + fract(fase) * 1.4) + fase;
        transformed.xy = mat2(cos(a), -sin(a), sin(a), cos(a)) * transformed.xy;`,
      );
      // a queda e o vento entram depois da matriz da instância
      sh.vertexShader = sh.vertexShader.replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 mundo = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        float centroY = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y;
        float h = mod(centroY - uTempo * (0.28 + fract(fase * 3.1) * 0.2), 5.0);
        mundo.y += h - centroY;
        mundo.x += sin(uTempo * 0.6 + fase) * 0.6;
        mundo.z += cos(uTempo * 0.4 + fase) * 0.3;
        mvPosition = viewMatrix * mundo;
        gl_Position = projectionMatrix * mvPosition;`,
      );
    };
    return m;
  }, [tempo]);
  useLayoutEffect(() => {
    const r = aleatorio(23), m = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < quantidade; i++) {
      const p = aoLado(33 + r() * 44, (r() < 0.5 ? -1 : 1) * (2.3 + r() * 3.5)); // nenhuma pétala colada na câmera
      p.y = r() * 5;
      m.compose(p, q.setFromAxisAngle(new THREE.Vector3(r(), r(), r()).normalize(), r() * 6.28), new THREE.Vector3(1, 1, 1));
      ref.current!.setMatrixAt(i, m);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [quantidade]);
  useFrame((_, dt) => (tempo.value += dt));
  return (
    <instancedMesh ref={ref} args={[undefined, material, quantidade]} frustumCulled={false}>
      <planeGeometry args={[0.045, 0.035]} />
    </instancedMesh>
  );
}
