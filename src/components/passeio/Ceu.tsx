"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Sol baixo à frente, quase no eixo do caminho: é ele que faz o contraluz no pelo preto. */
export const SOL = new THREE.Vector3(-0.12, 0.12, -1).normalize();
export const COR_NEVOA = "#d8c5c9";

export function Ceu() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uSol: { value: SOL },
          uZenite: { value: new THREE.Color("#98a2c4") },
          uMeio: { value: new THREE.Color("#cbbdd2") },
          uHorizonte: { value: new THREE.Color(COR_NEVOA) },
          uCorSol: { value: new THREE.Color("#ffd3b0") },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uSol, uZenite, uMeio, uHorizonte, uCorSol;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 c = mix(uHorizonte, uMeio, smoothstep(0.02, 0.2, h));
            c = mix(c, uZenite, smoothstep(0.2, 0.75, h));
            float s = max(dot(d, uSol), 0.0);
            c += uCorSol * (pow(s, 4.0) * 0.28 + pow(s, 40.0) * 0.45 + pow(s, 700.0) * 1.6);
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh ref={ref} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[500, 32, 16]} />
    </mesh>
  );
}
