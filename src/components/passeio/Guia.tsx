"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const SEG = 48, LADOS = 7, RAIO = 0.0062, COMPRIMENTO_GUIA = 1.9;

export type Ossos = { pescoco: THREE.Object3D | null; cabeca: THREE.Object3D | null };

/**
 * Coleira conhaque em volta do pescoço da Ellie e guia de corda até a mão.
 * `pegada` é o ponto da mão (mundo) onde a guia começa.
 */
export function Guia({ ossos, pegada }: { ossos: React.RefObject<Ossos>; pegada: React.RefObject<THREE.Object3D | null> }) {
  const coleira = useRef<THREE.Mesh>(null);
  const argola = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = (SEG + 1) * LADOS;
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i <= SEG; i++)
      for (let k = 0; k < LADOS; k++) {
        if (i < SEG) {
          const a = i * LADOS + k, b = i * LADOS + ((k + 1) % LADOS);
          idx.push(a, a + LADOS, b, b, a + LADOS, b + LADOS);
        }
      }
    g.setIndex(idx);
    return g;
  }, []);

  const v = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), cab: new THREE.Vector3(), eixo: new THREE.Vector3(), p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), bn: new THREE.Vector3(), cima: new THREE.Vector3(0, 1, 0), c1: new THREE.Vector3(), q: new THREE.Quaternion() }),
    [],
  );

  useFrame(({ clock }) => {
    const { pescoco, cabeca } = ossos.current ?? {};
    if (!pescoco || !cabeca || !pegada.current || !coleira.current || !argola.current) return;
    // coleira: entre a base do pescoço e a cabeça, perpendicular ao pescoço
    pescoco.getWorldPosition(v.a);
    cabeca.getWorldPosition(v.cab);
    v.eixo.subVectors(v.cab, v.a).normalize();
    v.p.lerpVectors(v.a, v.cab, 0.42);
    coleira.current.position.copy(v.p);
    coleira.current.quaternion.copy(v.q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.eixo));
    // argola no alto da nuca, onde a guia prende
    v.n.copy(v.cima).addScaledVector(v.eixo, -v.eixo.dot(v.cima)).normalize();
    v.b.copy(v.p).addScaledVector(v.n, 0.085);
    argola.current.position.copy(v.b);
    argola.current.quaternion.copy(coleira.current.quaternion);

    // guia: curva com barriga conforme a folga
    pegada.current.getWorldPosition(v.a);
    const dist = v.a.distanceTo(v.b);
    const folga = Math.max(0, COMPRIMENTO_GUIA - dist);
    v.c1.lerpVectors(v.a, v.b, 0.5);
    v.c1.y -= 0.06 + folga * 0.35 + Math.sin(clock.elapsedTime * 2.2) * 0.01;
    const pos = geo.attributes.position as THREE.BufferAttribute, nor = geo.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG, iu = 1 - u;
      // bezier quadrática a → c1 → b
      v.p.set(0, 0, 0).addScaledVector(v.a, iu * iu).addScaledVector(v.c1, 2 * iu * u).addScaledVector(v.b, u * u);
      v.t.set(0, 0, 0).addScaledVector(v.c1.clone().sub(v.a), 2 * iu).addScaledVector(v.b.clone().sub(v.c1), 2 * u).normalize();
      v.n.crossVectors(v.t, v.cima).normalize();
      v.bn.crossVectors(v.n, v.t).normalize();
      for (let k = 0; k < LADOS; k++) {
        const ang = (k / LADOS) * Math.PI * 2, cs = Math.cos(ang), sn = Math.sin(ang);
        const nx = v.n.x * cs + v.bn.x * sn, ny = v.n.y * cs + v.bn.y * sn, nz = v.n.z * cs + v.bn.z * sn;
        pos.setXYZ(i * LADOS + k, v.p.x + nx * RAIO, v.p.y + ny * RAIO, v.p.z + nz * RAIO);
        nor.setXYZ(i * LADOS + k, nx, ny, nz);
      }
    }
    pos.needsUpdate = nor.needsUpdate = true;
    geo.computeBoundingSphere();
  });

  return (
    <>
      <mesh geometry={geo} castShadow frustumCulled={false}>
        <meshStandardMaterial color="#56704f" roughness={1} />
      </mesh>
      <mesh ref={coleira} castShadow>
        <torusGeometry args={[0.08, 0.009, 8, 40]} />
        <meshStandardMaterial color="#7a3f1e" roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh ref={argola}>
        <torusGeometry args={[0.016, 0.004, 8, 20]} />
        <meshStandardMaterial color="#c9b07a" roughness={0.3} metalness={0.9} />
      </mesh>
    </>
  );
}
