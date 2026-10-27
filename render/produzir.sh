#!/bin/bash
# Renderiza o passeio: o fundo (180 quadros por tela) e a camada da cachorra (andar, parada e entrada, por tela),
# com a câmera do desktop (1920 × 1080) e a vertical do celular (1080 × 1920).
# Retomável: o que já está pronto (e inteiro) é pulado, então pode interromper e rodar de novo.
# Uso, no Git Bash, de qualquer pasta:  bash "C:/Users/isaac/Programação/iris-v2/render/produzir.sh"
# Os quadros ficam em media-src/passeio-render/ (fora do Git). Depois: python render/montar.py
set -u
cd "$(dirname "$0")/.." || exit 1
BLENDER="${BLENDER:-C:/Users/isaac/Tools/blender-5.2.2-windows-x64/blender.exe}"
SAIDA=media-src/passeio-render
FUNDO=180
LOTE=15 # quadros por abertura do Blender (a cena leva ~30 s para montar; depois fica carregada entre os quadros)
TELAS=(desktop celular)
CAO=(andar:32 parada:24 entrada:40)
CAO_TOTAL=$(((32 + 24 + 40) * 2))
TOTAL=$((FUNDO * 2 + CAO_TOTAL))

contar() { ls "$@" 2>/dev/null | wc -l; }
relogio() { printf "%dh%02d" $(($1 / 3600)) $(($1 % 3600 / 60)); }
feitos_tudo() { contar $SAIDA/fundo-*/fundo-*.png $SAIDA/cao-*/*.png; }

# mostra "quadro X de Y" e o tempo que falta (pela média dos quadros feitos nesta sessão), e a memória de pico
acompanhar() { # comando...
  "$@" 2>&1 | while IFS= read -r linha; do
    case "$linha" in
      QUADRO*)
        local feitos agora media
        feitos=$(feitos_tudo)
        agora=$(date +%s)
        if [ "$feitos" -gt "$INICIO_FEITOS" ]; then
          media=$(((agora - INICIO) / (feitos - INICIO_FEITOS)))
          echo "quadro $feitos de $TOTAL · ~$(relogio $(((TOTAL - feitos) * media))) para terminar"
        fi
        ;;
      MEMORIA*) echo "  ${linha#MEMORIA }" ;;
      *Traceback* | *Error:*) echo "  $linha" ;;
    esac
  done
}

[ -x "$BLENDER" ] || [ -f "$BLENDER" ] || { echo "Blender não encontrado em $BLENDER"; exit 1; }
INICIO=$(date +%s)
INICIO_FEITOS=$(feitos_tudo)
echo "Passeio: $INICIO_FEITOS de $TOTAL quadros prontos"

# ------------------------------------------------------------------ 1. fundo, por tela
for tela in "${TELAS[@]}"; do
  pasta="$SAIDA/fundo-$tela"
  mkdir -p "$pasta"
  for ((q = 0; q < FUNDO; q += LOTE)); do
    fim=$((q + LOTE - 1))
    [ $fim -ge $FUNDO ] && fim=$((FUNDO - 1))
    falta=0
    for ((k = q; k <= fim; k++)); do [ -f "$pasta/fundo-$(printf %03d $k).png" ] || falta=1; done
    [ $falta -eq 0 ] && continue
    acompanhar "$BLENDER" -b --factory-startup --python render/parque.py -- \
      fundo "$pasta" $q $fim --tela "$tela" --amostras 16 --passo-nevoa 12 --limiar 0.05
  done
  [ "$(contar "$pasta"/fundo-*.png)" -ge $FUNDO ] || { echo "O fundo ($tela) não terminou. Rode de novo para continuar."; exit 1; }
done

# ------------------------------------------------------------------ 2. cachorra (andar, parada e entrada), por tela
for tela in "${TELAS[@]}"; do
  pasta="$SAIDA/cao-$tela"
  mkdir -p "$pasta"
  for par in "${CAO[@]}"; do
    trecho=${par%%:*} n=${par##*:}
    [ "$(contar "$pasta/$trecho"-*.png)" -ge "$n" ] && continue
    acompanhar "$BLENDER" -b --factory-startup --python render/parque.py -- \
      cao "$pasta" "$trecho" --tela "$tela" --amostras 64
  done
done
[ "$(feitos_tudo)" -ge $TOTAL ] || { echo "Ainda faltam quadros ($(feitos_tudo) de $TOTAL). Rode de novo para continuar."; exit 1; }
echo "PRONTO"
