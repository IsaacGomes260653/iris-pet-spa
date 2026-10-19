#!/bin/bash
# Renderiza o passeio: os 150 quadros do fundo e depois a camada da cachorra (desktop e celular, 160 quadros).
# Retomável: o que já está pronto (e inteiro) é pulado, então pode interromper e rodar de novo.
# Uso, no Git Bash, de qualquer pasta:  bash "C:/Users/isaac/Programação/iris-v2/render/produzir.sh"
# Os quadros ficam em media-src/passeio-render/ (fora do Git). Depois: python render/montar.py
set -u
cd "$(dirname "$0")/.." || exit 1
BLENDER="${BLENDER:-C:/Users/isaac/Tools/blender-5.2.2-windows-x64/blender.exe}"
SAIDA=media-src/passeio-render
FUNDO=150
LOTE=10 # quadros por abertura do Blender (a cena leva ~25 s para montar)
CAO=(andar:32 parada:24 entrada:24)

contar() { ls "$@" 2>/dev/null | wc -l; }
relogio() { printf "%dh%02d" $(($1 / 3600)) $(($1 % 3600 / 60)); }

# mostra "quadro X de Y" e o tempo que falta, pela média dos quadros feitos nesta sessão
acompanhar() { # rótulo total comando...
  local rotulo=$1 total=$2
  shift 2
  "$@" 2>&1 | while IFS= read -r linha; do
    case "$linha" in
      QUADRO*)
        local feitos agora media
        feitos=$($CONTAR)
        agora=$(date +%s)
        if [ "$feitos" -gt "$INICIO_FEITOS" ]; then
          media=$(((agora - INICIO) / (feitos - INICIO_FEITOS)))
          echo "$rotulo: quadro $feitos de $total · ~$(relogio $(((total - feitos) * media))) para terminar esta etapa"
        fi
        ;;
      *Traceback* | *Error:*) echo "  $linha" ;;
    esac
  done
}

[ -x "$BLENDER" ] || [ -f "$BLENDER" ] || { echo "Blender não encontrado em $BLENDER"; exit 1; }
mkdir -p "$SAIDA/fundo"

# ------------------------------------------------------------------ 1. fundo
CONTAR="contar $SAIDA/fundo/fundo-*.png"
INICIO=$(date +%s)
INICIO_FEITOS=$($CONTAR)
echo "Fundo: $INICIO_FEITOS de $FUNDO prontos"
for ((q = 0; q < FUNDO; q += LOTE)); do
  fim=$((q + LOTE - 1))
  [ $fim -ge $FUNDO ] && fim=$((FUNDO - 1))
  falta=0
  for ((k = q; k <= fim; k++)); do [ -f "$SAIDA/fundo/fundo-$(printf %03d $k).png" ] || falta=1; done
  [ $falta -eq 0 ] && continue
  acompanhar "Fundo" $FUNDO "$BLENDER" -b --factory-startup --python render/parque.py -- \
    fundo "$SAIDA/fundo" $q $fim --res 1280 --amostras 32 --passo-nevoa 8 --limiar 0.05
done
[ "$($CONTAR)" -ge $FUNDO ] || { echo "O fundo não terminou ($($CONTAR) de $FUNDO). Rode de novo para continuar."; exit 1; }

# ------------------------------------------------------------------ 2. cachorra (andar, parada e entrada, por tela)
CONTAR="contar $SAIDA/cao-desktop/*.png $SAIDA/cao-celular/*.png"
INICIO=$(date +%s)
INICIO_FEITOS=$($CONTAR)
echo "Cachorra: $INICIO_FEITOS de 160 prontos"
for tela in desktop celular; do
  mkdir -p "$SAIDA/cao-$tela"
  for par in "${CAO[@]}"; do
    trecho=${par%%:*} n=${par##*:}
    [ "$(contar "$SAIDA/cao-$tela/$trecho"-*.png)" -ge "$n" ] && continue
    acompanhar "Cachorra" 160 "$BLENDER" -b --factory-startup --python render/parque.py -- \
      cao "$SAIDA/cao-$tela" "$trecho" --tela $tela --res 1280 --amostras 96
  done
done
[ "$($CONTAR)" -ge 160 ] || { echo "A cachorra não terminou ($($CONTAR) de 160). Rode de novo para continuar."; exit 1; }
echo "PRONTO"
