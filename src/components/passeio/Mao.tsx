"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MAO_PADRAO, type AjusteMao } from "./caminho";

export type { AjusteMao };

export const MODELO_MAO = "/modelos/maos.glb";

// dedos fechados em volta da alça da guia (rotação de cada falange, em radianos)
const CURVA = [1.35, 1.45, 1.1];


/**
 * Mão segurando a guia, entrando pela base do quadro como numa foto em primeira pessoa.
 * Escreve em `pegada` o ponto da palma de onde a guia sai.
 */
export function Mao({ pegada, ajuste = MAO_PADRAO }: { pegada: React.RefObject<THREE.Object3D | null>; ajuste?: AjusteMao }) {
  const { scene } = useGLTF(MODELO_MAO, "/draco/");
  const { camera } = useThree();
  const grupo = useRef<THREE.Group>(null);
  const interno = useRef<THREE.Group>(null);
  const resolvido = useRef(false);

  const palma = useMemo<{ mao: THREE.Object3D | null; punho: THREE.Object3D | null; cotovelo: THREE.Object3D | null }>(() => {
    // girado 180°, o braço esquerdo do modelo é o que fica à direita do quadro
    // (o carregador de glTF tira os pontos dos nomes: "hand.L_031" vira "handL_031")
    scene.getObjectByName("clavicleR_01")?.scale.setScalar(1e-4);
    const eixo = ajuste.eixo ?? "x", sinal = ajuste.sinal ?? 1;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.color = new THREE.Color("#e2b79c");
        mat.roughness = 0.62;
      }
      const n = o.name;
      const dedo = n.match(/^f_(index|middle|ring|pinky)0([123])L_/);
      if (dedo) o.rotation[eixo] += sinal * CURVA[Number(dedo[2]) - 1];
      if (/^thumb0[23]L_/.test(n)) o.rotation[eixo] += sinal * 0.8;
    });
    resolvido.current = false;
    const busca = (re: RegExp) => { let achado: THREE.Object3D | null = null; scene.traverse((o) => { if (!achado && re.test(o.name)) achado = o; }); return achado as THREE.Object3D | null; };
    return { mao: busca(/^handL_/), punho: busca(/^f_middle01L_/), cotovelo: busca(/^forearmL_/) };
  }, [scene, ajuste.eixo, ajuste.sinal]);

  // manga de tricô grafite do cotovelo até o pulso, refeita a cada quadro entre os dois ossos
  const manga = useRef<THREE.Mesh>(null);
  const tricô = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#3a4656";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#2c3644";
    for (let x = 0; x < 64; x += 8) ctx.fillRect(x, 0, 3, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 3);
    return t;
  }, []);

  const v = useMemo(() => ({ p: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), d: new THREE.Vector3(), y: new THREE.Vector3(0, 1, 0), inv: new THREE.Matrix4() }), []);
  useFrame(({ clock }) => {
    if (!grupo.current || !interno.current || !palma.mao) return;
    grupo.current.position.copy(camera.position);
    grupo.current.quaternion.copy(camera.quaternion);
    // a mão respira com o corpo, defasada da câmera
    grupo.current.translateY(Math.sin(clock.elapsedTime * 1.3) * 0.006);
    grupo.current.translateX(Math.sin(clock.elapsedTime * 0.7 + 1) * 0.004);
    grupo.current.updateMatrixWorld(true);
    if (!resolvido.current) {
      // leva a palma exatamente ao ponto pedido do quadro
      palma.mao.getWorldPosition(v.p).applyMatrix4(v.inv.copy(grupo.current.matrixWorld).invert());
      interno.current.position.add(new THREE.Vector3(...ajuste.alvo).sub(v.p));
      grupo.current.updateMatrixWorld(true);
      resolvido.current = true;
    }
    if (pegada.current) (palma.punho ?? palma.mao).getWorldPosition(pegada.current.position);
    if (manga.current && palma.cotovelo) {
      palma.cotovelo.getWorldPosition(v.a);
      palma.mao.getWorldPosition(v.b);
      v.b.lerp(v.a, 0.06); // termina um pouco antes do pulso
      const comp = v.a.distanceTo(v.b);
      manga.current.position.lerpVectors(v.a, v.b, 0.5);
      manga.current.quaternion.setFromUnitVectors(v.y, v.d.subVectors(v.b, v.a).normalize());
      manga.current.scale.set(1, comp, 1);
    }
  });

  return (
    <>
    <mesh ref={manga} castShadow>
      <cylinderGeometry args={[0.047, 0.056, 1, 18, 1, true]} />
      <meshStandardMaterial map={tricô} roughness={1} side={THREE.DoubleSide} />
    </mesh>
    <group ref={grupo}>
      <group ref={interno} rotation={[ajuste.inclina, Math.PI + ajuste.giro, ajuste.rola]} scale={0.01}>
        <primitive object={scene} />
      </group>
    </group>
    </>
  );
}

useGLTF.preload(MODELO_MAO, "/draco/");
