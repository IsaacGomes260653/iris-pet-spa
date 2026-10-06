import * as THREE from "three";

/**
 * Névoa por altura em todos os materiais: além da névoa exponencial normal, uma camada
 * que abraça o chão e engrossa com a distância (neblina rasteira sobre o gramado e o riacho).
 */
let aplicada = false;
export function aplicarNevoaDeAltura() {
  if (aplicada) return;
  aplicada = true;
  THREE.ShaderChunk.fog_pars_vertex += "\n#ifdef USE_FOG\nvarying float vFogAltura;\n#endif\n";
  THREE.ShaderChunk.fog_vertex += "\n#ifdef USE_FOG\nvFogAltura = (inverse(viewMatrix) * mvPosition).y;\n#endif\n";
  THREE.ShaderChunk.fog_pars_fragment += "\n#ifdef USE_FOG\nvarying float vFogAltura;\n#endif\n";
  THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment.replace(
    "gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );",
    `float rasteira = (1.0 - smoothstep(-0.3, 0.8, vFogAltura)) * smoothstep(14.0, 60.0, vFogDepth) * 0.45;
    fogFactor = max(fogFactor, rasteira);
    gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );`,
  );
}
