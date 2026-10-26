/** Manifesto gerado por render/montar.py. Coordenadas da cachorra e da mão em fração do quadro da tela. */
export type Tela = { largura: number; altura: number; cao: [number, number, number, number]; mao: [number, number] };
export type Manifesto = {
  telas: Record<"desktop" | "celular", Tela>;
  fundo: number;
  andar: number;
  parada: number;
  entrada: number;
  passo_m: number;
  q_entrada: number;
  camera_y: number[];
};

/**
 * Uma sequência de quadros: baixa os arquivos (comprimidos ficam na memória) e decodifica sob demanda, guardando só os
 * bitmaps mais recentes — 150 quadros decodificados passariam de meio giga.
 */
export class Quadros {
  private blobs: (Blob | undefined)[];
  private bitmaps = new Map<number, ImageBitmap>();
  private decodificando = new Set<number>();
  private vivo = true;

  constructor(
    private urls: string[],
    private limite: number,
  ) {
    this.blobs = new Array(urls.length);
  }

  get total() {
    return this.urls.length;
  }

  /** Baixa na ordem pedida, 4 de cada vez. */
  async baixar(ordem: number[] = this.urls.map((_, i) => i)) {
    const fila = ordem.filter((i) => !this.blobs[i]);
    const trabalhador = async () => {
      for (let i = fila.shift(); i !== undefined && this.vivo; i = fila.shift()) {
        try {
          this.blobs[i] = await (await fetch(this.urls[i])).blob();
        } catch {
          // rede caiu: o quadro vizinho cobre este
        }
      }
    };
    await Promise.all([trabalhador(), trabalhador(), trabalhador(), trabalhador()]);
  }

  /** O bitmap do quadro i, ou o vizinho mais próximo já decodificado (e pede a decodificação de i). */
  pegar(i: number): ImageBitmap | undefined {
    const pronto = this.bitmaps.get(i);
    if (pronto) {
      this.bitmaps.delete(i);
      this.bitmaps.set(i, pronto); // mais recente por último (LRU)
      return pronto;
    }
    const blob = this.blobs[i];
    if (blob && !this.decodificando.has(i)) {
      this.decodificando.add(i);
      createImageBitmap(blob).then((bmp) => {
        this.decodificando.delete(i);
        if (!this.vivo) return bmp.close();
        this.bitmaps.set(i, bmp);
        while (this.bitmaps.size > this.limite) {
          const [velho, b] = this.bitmaps.entries().next().value!;
          this.bitmaps.delete(velho);
          b.close();
        }
      });
    }
    let melhor: ImageBitmap | undefined;
    let dist = Infinity;
    for (const [k, b] of this.bitmaps) {
      if (Math.abs(k - i) < dist) [melhor, dist] = [b, Math.abs(k - i)];
    }
    return melhor;
  }

  /** Pede a decodificação antecipada de uma faixa de quadros (os próximos da rolagem). */
  aquecer(de: number, ate: number) {
    for (let i = Math.max(0, de); i <= Math.min(this.total - 1, ate); i++) if (!this.bitmaps.has(i)) this.pegar(i);
  }

  liberar() {
    this.vivo = false;
    for (const b of this.bitmaps.values()) b.close();
    this.bitmaps.clear();
  }
}
