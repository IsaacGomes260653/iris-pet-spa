import * as THREE from "three";

// ruído de valor simples e determinístico, suficiente para veios, névoa e pedra
const aleatorio = (s: number) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
function ruido2d(tam: number, oitavas: number, semente: number) {
  const r = aleatorio(semente);
  const grade = (n: number) => Array.from({ length: (n + 1) * (n + 1) }, r);
  const camadas = Array.from({ length: oitavas }, (_, o) => ({ n: 4 << o, g: grade(4 << o), a: 0.5 ** o }));
  const suave = (t: number) => t * t * (3 - 2 * t);
  const out = new Float32Array(tam * tam);
  for (let y = 0; y < tam; y++)
    for (let x = 0; x < tam; x++) {
      let v = 0, soma = 0;
      for (const { n, g, a } of camadas) {
        const fx = (x / tam) * n, fy = (y / tam) * n, ix = Math.floor(fx), iy = Math.floor(fy);
        const tx = suave(fx - ix), ty = suave(fy - iy), i = (xx: number, yy: number) => g[(yy % n) * (n + 1) + (xx % n)];
        v += a * THREE.MathUtils.lerp(THREE.MathUtils.lerp(i(ix, iy), i(ix + 1, iy), tx), THREE.MathUtils.lerp(i(ix, iy + 1), i(ix + 1, iy + 1), tx), ty);
        soma += a;
      }
      out[y * tam + x] = v / soma;
    }
  return out;
}

function textura(tam: number, pinta: (img: ImageData) => void, repetir = true) {
  const c = document.createElement("canvas");
  c.width = c.height = tam;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(tam, tam);
  pinta(img);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Tábua de madeira envelhecida: veios ao longo de x. */
export const madeira = () => {
  const n = ruido2d(256, 4, 7);
  return textura(256, (img) => {
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const veio = Math.sin(y * 0.55 + n[y * 256 + x] * 9) * 0.5 + 0.5;
        const v = 0.62 + 0.22 * n[y * 256 + ((x * 3) % 256)] + 0.12 * veio;
        const i = (y * 256 + x) * 4;
        img.data.set([150 * v, 118 * v, 92 * v, 255], i);
      }
  });
};

/** Névoa: nuvem macia em alfa, para as camadas de neblina rasteira. */
export const nevoa = () => {
  const n = ruido2d(256, 5, 21);
  return textura(256, (img) => {
    for (let i = 0; i < 256 * 256; i++) {
      const a = THREE.MathUtils.smoothstep(n[i], 0.35, 0.8);
      img.data.set([255, 255, 255, a * 255], i * 4);
    }
  });
};

/** Calçada de pedra clara (alameda): blocos irregulares com rejunte. */
export const pedra = () => {
  const n = ruido2d(256, 4, 3);
  return textura(256, (img) => {
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const bx = (x + (Math.floor(y / 32) % 2) * 16) % 32, by = y % 32;
        const junta = bx < 2 || by < 2 ? 0.72 : 1;
        const v = (0.78 + 0.2 * n[y * 256 + x]) * junta;
        img.data.set([214 * v, 204 * v, 196 * v, 255], (y * 256 + x) * 4);
      }
  });
};

/** Cacho de flores de ipê-rosa (alfa), para a copa e as pétalas no chão. */
export const flor = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const r = aleatorio(11);
  for (let k = 0; k < 26; k++) {
    const x = 20 + r() * 88, y = 20 + r() * 88, raio = 7 + r() * 9;
    const tom = ["#f2a6c6", "#e88bb3", "#f7c3d8", "#d977a3", "#fbd9e6"][Math.floor(r() * 5)];
    ctx.fillStyle = tom;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 + r();
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * raio * 0.55, y + Math.sin(a) * raio * 0.55, raio * 0.55, raio * 0.32, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#f6e3a1";
    ctx.beginPath();
    ctx.arc(x, y, raio * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/**
 * Silhueta de árvore pintada (alfa): tronco, galhos recursivos e copa em cachos com falhas,
 * mais clara do lado do sol (esquerda). Gerada em coordenadas livres e depois encaixada no quadro.
 */
export const arvorePintada = (tipo: "copa" | "alta" | "chorao", semente: number) => {
  const W = 320, H = 480;
  const r = aleatorio(semente);
  const galhos: number[][] = []; // x1 y1 cx cy x2 y2 largura
  const cachos: number[][] = []; // x y raio achatamento giro tom
  const abre = tipo === "alta" ? 0.28 : tipo === "chorao" ? 0.8 : 0.6;
  const cresce = (x: number, y: number, ang: number, comp: number, larg: number, nivel: number) => {
    const x2 = x + Math.cos(ang) * comp, y2 = y - Math.sin(ang) * comp;
    galhos.push([x, y, (x + x2) / 2 + (r() - 0.5) * comp * 0.3, (y + y2) / 2, x2, y2, larg]);
    if (nivel >= (tipo === "alta" ? 2 : 3)) {
      const n = 2 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const raio = comp * (0.55 + r() * 0.6);
        const caida = tipo === "chorao" ? raio * (0.6 + r()) : 0;
        cachos.push([x2 + (r() - 0.5) * raio * 1.6, y2 + (r() - 0.5) * raio + caida, raio, 0.65 + r() * 0.45, r() * 3, r()]);
      }
    }
    if (nivel >= 6) return;
    const filhos = tipo === "alta" ? 2 : 2 + (r() < 0.45 ? 1 : 0);
    for (let k = 0; k < filhos; k++) cresce(x2, y2, ang + (k - (filhos - 1) / 2) * abre + (r() - 0.5) * 0.35, comp * (0.7 + r() * 0.1), larg * 0.66, nivel + 1);
  };
  cresce(0, 0, Math.PI / 2 + (r() - 0.5) * 0.06, tipo === "alta" ? 120 : 90, tipo === "alta" ? 10 : 13, 0);
  // caixa de tudo, para encaixar com margem e o pé do tronco na base
  let minX = 0, maxX = 0, minY = 0;
  for (const g of galhos) { minX = Math.min(minX, g[4]); maxX = Math.max(maxX, g[4]); minY = Math.min(minY, g[5]); }
  for (const c of cachos) { minX = Math.min(minX, c[0] - c[2]); maxX = Math.max(maxX, c[0] + c[2]); minY = Math.min(minY, c[1] - c[2]); }
  const esc = Math.min((W * 0.9) / (maxX - minX), (H * 0.94) / -minY);
  const cx = W / 2 - ((minX + maxX) / 2) * esc;
  const T = (x: number) => cx + x * esc, Ty = (y: number) => H - 3 + y * esc;

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2c2725";
  for (const [x1, y1, qx, qy, x2, y2, l] of galhos) {
    ctx.lineWidth = Math.max(1, l * esc);
    ctx.beginPath();
    ctx.moveTo(T(x1), Ty(y1));
    ctx.quadraticCurveTo(T(qx), Ty(qy), T(x2), Ty(y2));
    ctx.stroke();
  }
  for (const [x, y, raio, ach, giro, tom] of cachos) {
    const px = T(x), py = Ty(y), rr = raio * esc;
    const luz = px < W * 0.45 && py < H * 0.55 ? 1 : 0; // lado do sol
    const base = 30 + Math.floor(tom * 18) + luz * 10;
    const g = ctx.createRadialGradient(px - rr * 0.25, py - rr * 0.25, 0, px, py, rr);
    g.addColorStop(0, `rgba(${base + 10},${base + 18},${base + 6},0.82)`);
    g.addColorStop(0.65, `rgba(${base},${base + 11},${base},0.62)`);
    g.addColorStop(1, `rgba(${base},${base + 11},${base},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, rr, rr * ach, giro, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
