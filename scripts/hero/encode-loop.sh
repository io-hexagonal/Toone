#!/usr/bin/env bash
# Encodes the hero background loop with the whole look baked in, so the page
# plays a plain video layer (no CSS filter, opacity or blend mode per frame).
#
#   scripts/hero/encode-loop.sh path/to/source.mp4
#
# The chain reproduces the tuned CSS look: blur 43px at display size (sigma 16 at
# 640px), saturate 1.85 on top of the encode's 0.45, contrast 1.2 then 2.45,
# brightness 1.25, then 0.7 opacity screened onto the #141413 page ground
# (val*0.645+20). Poster frame taken at 6s.
set -euo pipefail
SRC="${1:?source video}"
OUT_DIR="$(cd "$(dirname "$0")/../.." && pwd)/public/assets/hero"
FILT="scale=640:360,gblur=sigma=16,eq=saturation=0.83:contrast=1.2,eq=contrast=2.45,lutrgb=r='clip(val*1.25,0,255)*0.645+20':g='clip(val*1.25,0,255)*0.645+20':b='clip(val*1.25,0,255)*0.645+20'"
ffmpeg -v error -y -i "$SRC" -an -vf "$FILT" -c:v libx264 -profile:v main -pix_fmt yuv420p -preset slow -crf 26 -movflags +faststart -g 90 "$OUT_DIR/glitter-loop.mp4"
ffmpeg -v error -y -ss 6 -i "$SRC" -frames:v 1 -vf "$FILT" -q:v 5 "$OUT_DIR/glitter-poster.jpg"
ls -la "$OUT_DIR"
