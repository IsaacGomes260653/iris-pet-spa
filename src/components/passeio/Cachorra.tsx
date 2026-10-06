"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Ossos } from "./Guia";

export const MODELO = "/modelos/lobo.glb";

/** Estado compartilhado do passeio, escrito pela rolagem e lido a cada quadro (sem re-render do React). */
export type Marcha = { velocidade: number }; // metros por segundo da câmera

// pelagem da Ellie: preto profundo, marrom-escuro onde o lobo original é claro (patas, traseira, barriga)
const recolorir = (mat: THREE.MeshStandardMaterial) => {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uRim = { value: new THREE.Color("#ffc9a8") };
    s.uniforms.uForcaRim = { value: mat.name.startsWith("Wolf_Fur") ? 0.05 : 0.14 };
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRim;\nuniform float uForcaRim;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 preto = vec3(0.0055, 0.0050, 0.0048);
        vec3 marrom = vec3(0.046, 0.022, 0.010);
        diffuseColor.rgb = mix(preto, marrom, smoothstep(0.42, 0.78, lum)) * (0.8 + 0.4 * lum);`,
      )
      .replace(
        "#include <opaque_fragment>",
        // contraluz fino, só nas bordas viradas para cima: um fio de luz na silhueta preta
        `float rim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 4.0) * smoothstep(-0.1, 0.7, normal.y);
        outgoingLight += uRim * rim * uForcaRim;
        #include <opaque_fragment>`,
      );
  };
  mat.roughness = 0.82;
  mat.metalness = 0;
  mat.needsUpdate = true;
};

export function Cachorra({
  marcha,
  pose,
  ossos,
  ref,
  ...props
}: { marcha: React.RefObject<Marcha>; pose?: { clipe: string; t: number }; ossos?: React.RefObject<Ossos>; ref?: React.Ref<THREE.Group> } & React.ComponentProps<"group">) {
  const grupo = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODELO, "/draco/");
  // a "Idle" original fareja o chão entre 3 s e 12 s; fica só o trecho calmo, em pé, respirando
  const clipes = useMemo(
    () => animations.map((c) => (c.name === "04_Idle_Armature_0" ? THREE.AnimationUtils.subclip(c, c.name, 14 * 30, 42 * 30, 30) : c)),
    [animations],
  );
  const { actions } = useAnimations(clipes, grupo);

  const modelo = useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats as THREE.MeshStandardMaterial[]) {
        if (mat.name === "Material.001") m.visible = false; // disco de sombra falso do arquivo original
        else if (mat.name.startsWith("Wolf_1") || mat.name.startsWith("Wolf_Fur")) recolorir(mat);
        else if (mat.name.startsWith("Wolf_claws")) mat.color.set("#1a1614"); // nada de pontas brancas nas patas
        if (mat.name.startsWith("Wolf_Fur")) {
          mat.transparent = false;
          mat.alphaTest = 0.35;
          mat.depthWrite = true;
        }
      }
    });
    // normaliza: focinho à frente (+z), patas no chão
    const caixa = new THREE.Box3().setFromObject(scene);
    const tam = caixa.getSize(new THREE.Vector3());
    const escala = 1.38 / Math.max(tam.x, tam.z); // ~1,38 m do focinho à ponta do rabo: porte encorpado
    scene.scale.set(escala * 1.14, escala * 1.04, escala); // pastora encorpada: mais larga que o lobo original
    caixa.setFromObject(scene);
    scene.position.y -= caixa.min.y;
    return scene;
  }, [scene]);

  useEffect(() => {
    if (ossos) ossos.current = { pescoco: scene.getObjectByName("Hals_013_21") ?? null, cabeca: scene.getObjectByName("Kopf_002_014_20") ?? null };
  }, [scene, ossos]);

  useEffect(() => {
    if (pose) {
      const a = actions[pose.clipe];
      a?.play();
      if (a) { a.time = pose.t; a.timeScale = 0; }
      return;
    }
    const andar = actions["02_walk_Armature_0"];
    const parada = actions["04_Idle_Armature_0"];
    andar?.play();
    parada?.play();
    andar?.setEffectiveWeight(0);
    parada?.setEffectiveWeight(1);
  }, [actions, pose]);

  // a caminhada acompanha a velocidade da rolagem; parada, ela respira (animação Idle)
  const peso = useRef(0);
  useFrame((_, dt) => {
    const andar = actions["02_walk_Armature_0"];
    const parada = actions["04_Idle_Armature_0"];
    if (!andar || !parada || pose) return;
    const v = marcha.current?.velocidade ?? 0;
    const alvo = Math.min(1, v / 0.35);
    peso.current = THREE.MathUtils.damp(peso.current, alvo, 6, dt);
    andar.setEffectiveWeight(peso.current);
    parada.setEffectiveWeight(1 - peso.current);
    andar.setEffectiveTimeScale(THREE.MathUtils.clamp(v / 1.1, 0.35, 1.8));
  });

  return (
    <group ref={ref} {...props}>
      <group ref={grupo}>
        <primitive object={modelo} />
      </group>
    </group>
  );
}

useGLTF.preload(MODELO, "/draco/");
