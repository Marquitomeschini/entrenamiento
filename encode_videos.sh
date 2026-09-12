#!/bin/bash
# Baja los 47 videos del Drive público y los re-encodea a H.264 720p (lado corto) para servirlos desde GitHub Pages.
# Uso: ./encode_videos.sh   (salta los que ya existen en videos/)
cd "$(dirname "$0")"; mkdir -p videos
TMP="${TMPDIR:-/tmp}/gymvid"; mkdir -p "$TMP"
for id in $(node -e "for(const f of require('./drive_videos.json'))for(const c of f.children||[])console.log(c.id)"); do
  [ -s "videos/$id.mp4" ] && continue
  src="$TMP/$id"
  # confirm=t salta el aviso "no se pudo analizar en busca de virus" de los archivos grandes
  curl -sL -A "Mozilla/5.0" "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t" -o "$src" || { echo "FAIL dl $id"; continue; }
  ffprobe -v error -show_entries stream=codec_type "$src" 2>/dev/null | grep -q video || { echo "FAIL not-a-video $id ($(head -c 60 "$src" | tr -d '\n'))"; rm -f "$src"; continue; }
  ffmpeg -nostdin -y -v error -i "$src" -vf "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'" -c:v libx264 -preset fast -crf 27 -profile:v main -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 64k -ac 1 "videos/$id.mp4" \
    && { rm -f "$src"; echo "OK $id $(du -k "videos/$id.mp4" | cut -f1)K"; } || { rm -f "videos/$id.mp4"; echo "FAIL enc $id"; }
done
echo "DONE $(ls videos | wc -l) videos, $(du -sh videos | cut -f1)"
