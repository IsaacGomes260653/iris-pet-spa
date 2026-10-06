"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { pontoEm, tangenteEm, COMPRIMENTO } from "./caminho";
import { arvorePintada, madeira, nevoa, pedra } from "./texturas";

// ---------- utilidades ----------

const aleatorio = (s: number) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

/** Amostras do caminho (o z só diminui ao longo dele), para medir distância com busca binária. */
const N_AMOSTRAS = 600;
const amostras = Array.from({ length: N_AMOSTRAS }, (_, i) => pontoEm((i / (N_AMOSTRAS - 1)) * COMPRIMENTO));
export function distanciaAoCaminho(x: number, z: number) {
  let lo = 0, hi = N_AMOSTRAS - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (amostras[m].z > z) lo = m; else hi = m;
  }
  let min = Infinity, iMin = lo;
  for (let i = Math.max(0, lo - 40); i < Math.min(N_AMOSTRAS, lo + 40); i++) {
    const d = (amostras[i].x - x) ** 2 + (amostras[i].z - z) ** 2;
    if (d < min) { min = d; iMin = i; }
  }
  return { d: Math.sqrt(min), s: (iMin / (N_AMOSTRAS - 1)) * COMPRIMENTO };
}

/** Ponto ao lado do caminho: lado > 0 é a direita de quem anda. */
export function aoLado(s: number, lado: number, alvo = new THREE.Vector3()) {
  const t = tangenteEm(s);
  return pontoEm(s, alvo).add(new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(lado));
}

/** Faixa de piso que acompanha o caminho entre s0 e s1. */
export function fita(s0: number, s1: number, largura: number, y: number, repetirU = 1) {
  const n = Math.max(2, Math.ceil((s1 - s0) * 1.5));
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const e = aoLado(s, -largura / 2), d = aoLado(s, largura / 2);
    pos.push(e.x, y, e.z, d.x, y, d.z);
    uv.push(0, (s - s0) / repetirU, largura / repetirU, (s - s0) / repetirU);
    if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2); // face para cima
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// riacho atravessa o caminho entre z = -1 e z = -24, por baixo da ponte
const RIO = { z0: -1.5, z1: -23.5, fundo: -1.7 };
export function alturaTerreno(x: number, z: number) {
  const borda = Math.min(z - RIO.z1, RIO.z0 - z); // > 0 dentro do leito
  const leito = THREE.MathUtils.smoothstep(borda, -1.5, 3) * RIO.fundo;
  // relevo suave longe do caminho; perto dele o chão fica plano e um pouco abaixo dos pisos
  const perto = 1 - THREE.MathUtils.smoothstep(distanciaAoCaminho(x, z).d, 2.2, 7);
  const ondula = (Math.sin(x * 0.08) * Math.cos(z * 0.06) * 0.35 + Math.sin(x * 0.21 + z * 0.13) * 0.1) * (1 - perto);
  return leito + (borda < -1 ? ondula : 0) - 0.03 - perto * 0.03;
}

// ---------- terreno, rio e caminho ----------

export function Terreno() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(320, 320, 170, 170);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -60);
    const p = g.attributes.position, cor = new Float32Array(p.count * 3);
    const grama = new THREE.Color("#6f8459"), seca = new THREE.Color("#8f8f6c"), margem = new THREE.Color("#4a5644");
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = alturaTerreno(x, z);
      p.setY(i, y);
      c.copy(grama).lerp(seca, THREE.MathUtils.clamp(Math.sin(x * 0.05) * Math.sin(z * 0.04) * 0.5 + 0.35, 0, 1));
      if (y < -0.2) c.lerp(margem, 0.8);
      cor.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cor, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}

export function Rio() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -1.15, -12.5]}>
      <planeGeometry args={[320, 24]} />
      <meshStandardMaterial color="#6f7590" roughness={0.12} metalness={0.35} />
    </mesh>
  );
}

export function Caminhos() {
  const t = useMemo(() => {
    const p = pedra();
    p.repeat.set(1, 1);
    return p;
  }, []);
  const terra = useMemo(() => fita(76, COMPRIMENTO - 11.5, 1.6, 0.012, 1.6), []); // termina onde a praça da loja começa
  const inicio = useMemo(() => fita(0, 7.6, 1.8, 0.012, 1.8), []);
  const alameda = useMemo(() => fita(28.5, 76, 3.4, 0.014, 1.7), []); // começa logo onde a ponte termina
  return (
    <>
      <mesh geometry={alameda} receiveShadow>
        <meshStandardMaterial map={t} roughness={0.95} />
      </mesh>
      <mesh geometry={terra} receiveShadow>
        <meshStandardMaterial color="#8a7b63" roughness={1} />
      </mesh>
      <mesh geometry={inicio} receiveShadow>
        <meshStandardMaterial color="#a6987f" roughness={1} />
      </mesh>
    </>
  );
}

// ---------- ponte de madeira ----------

const PONTE = { z0: 7.8, z1: -29.5, largura: 2.6 };
export function Ponte() {
  const tex = useMemo(() => madeira(), []);
  const tabuas = useRef<THREE.InstancedMesh>(null);
  const n = Math.floor((PONTE.z0 - PONTE.z1) / 0.21);
  useLayoutEffect(() => {
    const r = aleatorio(5), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cor = new THREE.Color();
    for (let i = 0; i < n; i++) {
      e.set((r() - 0.5) * 0.02, (r() - 0.5) * 0.03, (r() - 0.5) * 0.015);
      m.compose(new THREE.Vector3((r() - 0.5) * 0.06, -0.012 + r() * 0.008, PONTE.z0 - i * 0.21), q.setFromEuler(e), new THREE.Vector3(1, 1, 1));
      tabuas.current!.setMatrixAt(i, m);
      tabuas.current!.setColorAt(i, cor.setHSL(0.07, 0.18 + r() * 0.1, 0.5 + r() * 0.16));
    }
    tabuas.current!.instanceMatrix.needsUpdate = true;
  }, [n]);

  const corrimao = useMemo(() => {
    const partes: THREE.BufferGeometry[] = [];
    const comp = PONTE.z0 - PONTE.z1, meio = (PONTE.z0 + PONTE.z1) / 2;
    for (const lado of [-1, 1]) {
      const x = lado * (PONTE.largura / 2 + 0.06);
      for (let z = PONTE.z0; z >= PONTE.z1; z -= 2.1) partes.push(new THREE.BoxGeometry(0.075, 1.1, 0.075).translate(x, 0.53, z));
      partes.push(new THREE.BoxGeometry(0.06, 0.07, comp).translate(x, 1.07, meio));
      partes.push(new THREE.BoxGeometry(0.04, 0.05, comp).translate(x, 0.6, meio));
      partes.push(new THREE.BoxGeometry(0.24, 0.32, comp + 0.4).translate(lado * 1.05, -0.2, meio)); // vigas
    }
    for (let z = PONTE.z0 - 6; z > PONTE.z1; z -= 8) partes.push(new THREE.BoxGeometry(0.3, 2.2, 0.3).translate(0, -1.3, z)); // pilares
    return mergeGeometries(partes);
  }, []);

  return (
    <group>
      <instancedMesh ref={tabuas} args={[undefined, undefined, n]} castShadow receiveShadow>
        <boxGeometry args={[PONTE.largura, 0.055, 0.19]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </instancedMesh>
      <mesh geometry={corrimao} castShadow receiveShadow>
        <meshStandardMaterial map={tex} color="#b9a594" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ---------- árvores do parque: silhuetas pintadas em billboards, como cenário na névoa ----------

const VARIANTES: ["copa" | "alta" | "chorao", number][] = [["copa", 3], ["copa", 8], ["alta", 5], ["chorao", 12]];

function materialBillboard(mapa: THREE.Texture) {
  const m = new THREE.MeshBasicMaterial({ map: mapa, alphaTest: 0.4, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace(
      "#include <project_vertex>",
      `vec3 centro = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float sx = length(instanceMatrix[0].xyz), sy = length(instanceMatrix[1].xyz);
      vec3 paraCam = cameraPosition - centro;
      paraCam.y = 0.0;
      paraCam = normalize(paraCam);
      vec3 mundo = centro + vec3(paraCam.z, 0.0, -paraCam.x) * transformed.x * sx + vec3(0.0, transformed.y * sy, 0.0);
      vec4 mvPosition = viewMatrix * vec4(mundo, 1.0);
      gl_Position = projectionMatrix * mvPosition;`,
    );
  };
  return m;
}

export function Arvores({ quantidade = 130 }: { quantidade?: number }) {
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1.5).translate(0, 0.75, 0), []);
  const materiais = useMemo(() => VARIANTES.map(([tipo, semente]) => materialBillboard(arvorePintada(tipo, semente))), []);
  const posicoes = useMemo(() => {
    const r = aleatorio(99), lista: { x: number; z: number; alt: number; v: number; tom: number }[] = [];
    let tentativas = 0;
    while (lista.length < quantidade && tentativas++ < 8000) {
      const x = (r() - 0.5) * 140, z = 16 - r() * 160;
      const { d, s } = distanciaAoCaminho(x, z);
      const naAlameda = s > 31 && s < 77 && d < 9; // a alameda é dos ipês
      if (d < 6.5 || naAlameda || z < -136 || alturaTerreno(x, z) < -0.3) continue;
      const v = Math.floor(r() * VARIANTES.length);
      lista.push({ x, z, alt: (VARIANTES[v][0] === "alta" ? 13 : 9) * (0.75 + r() * 0.6), v, tom: 0.85 + r() * 0.3 });
    }
    return lista;
  }, [quantidade]);
  return (
    <>
      {materiais.map((m, v) => (
        <InstanciasArvore key={v} geo={geo} material={m} itens={posicoes.filter((p) => p.v === v)} />
      ))}
    </>
  );
}
function InstanciasArvore({ geo, material, itens }: { geo: THREE.BufferGeometry; material: THREE.Material; itens: { x: number; z: number; alt: number; tom: number }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), cor = new THREE.Color();
    itens.forEach((it, i) => {
      const esc = it.alt / 1.5;
      m.compose(new THREE.Vector3(it.x, alturaTerreno(it.x, it.z) - 0.1, it.z), q, new THREE.Vector3(esc, esc, esc));
      ref.current!.setMatrixAt(i, m);
      ref.current!.setColorAt(i, cor.setScalar(it.tom));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [itens]);
  return <instancedMesh ref={ref} args={[geo, material, itens.length]} frustumCulled={false} />;
}

// ---------- grama que balança ----------

export function Grama({ quantidade = 52000 }: { quantidade?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#7d8f5c", roughness: 0.85, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTempo = tempoGrama;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTempo;\nvarying float vAlt;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vAlt = clamp(position.y / 0.22, 0.0, 1.0);
          vec3 base = instanceMatrix[3].xyz;
          float vento = sin(uTempo * 1.4 + base.x * 0.35 + base.z * 0.22) + 0.4 * sin(uTempo * 2.7 + base.z * 0.9);
          transformed.x += vento * 0.035 * vAlt * vAlt;
          transformed.z += vento * 0.015 * vAlt * vAlt;`,
        );
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vAlt;")
        .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= mix(0.35, 1.0, vAlt);");
    };
    return m;
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.03, 0.22, 1, 3).translate(0, 0.11, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - p.getY(i) / 0.24));
    return g;
  }, []);
  useLayoutEffect(() => {
    const r = aleatorio(7), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cor = new THREE.Color();
    let i = 0, tent = 0;
    while (i < quantidade && tent++ < quantidade * 6) {
      // concentra a grama no gramado (fim do passeio) e nas bordas do começo
      const s = r() < 0.8 ? 72 + r() * 46 : r() * 34;
      const lado = (r() < 0.5 ? -1 : 1) * (0.9 + Math.pow(r(), 2.2) * 10);
      const p = aoLado(s, lado);
      if (s < 34 && Math.abs(lado) < 3) continue; // nada de grama sobre a ponte
      const y = alturaTerreno(p.x, p.z);
      if (y < -0.25) continue;
      e.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5);
      const tufo = r() < 0.1 ? 2.3 : 1; // grama baixa de parque, com alguns tufos mais altos
      m.compose(new THREE.Vector3(p.x, y, p.z), q.setFromEuler(e), new THREE.Vector3(1.2, (0.6 + r() * 0.8) * tufo, 1.2));
      ref.current!.setMatrixAt(i, m);
      ref.current!.setColorAt(i, cor.setHSL(0.2 + r() * 0.07, 0.42 + r() * 0.16, 0.26 + r() * 0.1));
      i++;
    }
    ref.current!.count = i;
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [quantidade]);
  useFrame((_, dt) => (tempoGrama.value += dt));
  return <instancedMesh ref={ref} args={[geo, material, quantidade]} receiveShadow frustumCulled={false} />;
}
const tempoGrama = { value: 0 };

// ---------- neblina rasteira ----------

export function NevoaRasteira({ camadas = 9 }: { camadas?: number }) {
  const tex = useMemo(() => nevoa(), []);
  const itens = useMemo(() => {
    const r = aleatorio(31);
    return Array.from({ length: camadas }, (_, i) => {
      // só sobre o riacho, longe das lâminas de grama (no gramado quem faz a neblina é a névoa por altura)
      const s = 1 + (i / camadas) * 22;
      const p = aoLado(s, (r() < 0.5 ? -1 : 1) * (5 + r() * 9));
      return { x: p.x, z: p.z, y: -0.85 + r() * 0.3, tam: 18 + r() * 12, op: 0.22 + r() * 0.1, giro: r() * 6.28, vel: 0.004 + r() * 0.006 };
    });
  }, [camadas]);
  const texturas = useMemo(() => itens.map(() => Object.assign(tex.clone(), { needsUpdate: true })), [itens, tex]);
  useFrame((_, dt) => texturas.forEach((t, i) => (t.offset.x += itens[i].vel * dt)));
  return (
    <group>
      {itens.map((it, i) => (
        <mesh key={i} position={[it.x, it.y, it.z]} rotation={[-Math.PI / 2, 0, it.giro]} renderOrder={2}>
          <planeGeometry args={[it.tam, it.tam]} />
          <meshBasicMaterial map={texturas[i]} color="#efe1e6" transparent opacity={it.op} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
