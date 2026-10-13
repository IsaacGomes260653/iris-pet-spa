#!/usr/bin/env bash
# Codifica os vídeos de media-src/videos/ para o site (sem áudio, com a correção de cor de amanhecer).
# Uso: FF=<caminho do ffmpeg> bash scripts/videos.sh
set -euo pipefail
FF="${FF:-ffmpeg}"
SAIDA=public/videos
mkdir -p "$SAIDA"
# gradação leve: sombras para lavanda, luzes para pêssego, menos saturação
COR="eq=saturation=0.86:contrast=1.03,colorbalance=rs=-0.02:bs=0.05:rh=0.05:bh=-0.04"
# trechos (início e duração, em segundos) escolhidos a dedo em cada vídeo
declare -A TRECHO=( [banho]="0 9" [tosa]="2 9" [finalizacao]="3 9" )
for nome in banho tosa finalizacao; do
  read -r ini dur <<<"${TRECHO[$nome]}"
  src="media-src/videos/$nome.mp4"
  # desktop 16:9, 1280px
  "$FF" -v error -y -ss "$ini" -t "$dur" -i "$src" -an -vf "scale=1280:-2,$COR,fps=25" \
    -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p -movflags +faststart "$SAIDA/$nome.mp4"
  "$FF" -v error -y -ss "$ini" -t "$dur" -i "$src" -an -vf "scale=1280:-2,$COR,fps=25" \
    -c:v libvpx-vp9 -b:v 0 -crf 47 -row-mt 1 -deadline good -cpu-used 2 "$SAIDA/$nome.webm"
  # celular 4:5, 720px de largura
  "$FF" -v error -y -ss "$ini" -t "$dur" -i "$src" -an -vf "crop=ih*4/5:ih,scale=720:-2,$COR,fps=25" \
    -c:v libx264 -preset slow -crf 27 -profile:v high -pix_fmt yuv420p -movflags +faststart "$SAIDA/$nome-celular.mp4"
  "$FF" -v error -y -ss "$ini" -t "$dur" -i "$src" -an -vf "crop=ih*4/5:ih,scale=720:-2,$COR,fps=25" \
    -c:v libvpx-vp9 -b:v 0 -crf 49 -row-mt 1 -deadline good -cpu-used 2 "$SAIDA/$nome-celular.webm"
  # poster (primeiro quadro), para o componente usar como imagem otimizada
  "$FF" -v error -y -ss "$ini" -i "$src" -frames:v 1 -vf "scale=1600:-2,$COR" -q:v 3 "src/assets/videos/$nome-poster.jpg"
done
ls -la "$SAIDA"
