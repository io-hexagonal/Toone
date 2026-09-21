#!/usr/bin/env bash
# Encodes the hero background loop with the whole look baked in, so the page
# plays a plain video layer (no CSS filter, opacity or blend mode per frame).
#
#   scripts/hero/encode-loop.sh path/to/source.mp4
#
# The chain reproduces the tuned CSS look: blur 43px at display size (sigma 16 at
# 640px), saturate 1.85 on top of the encode's 0.45 (0.83 total), contrast 1.2
# then 2.45 applied per RGB channel like CSS contrast() (2.94 total), brightness
# 1.25, then 0.7 opacity screened onto the #141413 page ground (val*0.645+20).
# Poster frame taken at 6s.
set -euo pipefail
SRC="${1:?source video}"
OUT_DIR="$(cd "$(dirname "$0")/../.." && pwd)/public/assets/hero"
LUT="clip(clip((val-128)*2.94+128,0,255)*1.25,0,255)*0.645+20"
FILT="scale=1280:720,gblur=sigma=32,eq=saturation=0.83,lutrgb=r='$LUT':g='$LUT':b='$LUT',noise=alls=3:allf=t+u"
ffmpeg -v error -y -i "$SRC" -an -vf "$FILT" -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 23 -movflags +faststart -g 90 "$OUT_DIR/glitter-loop.mp4"
ffmpeg -v error -y -ss 6 -i "$SRC" -frames:v 1 -vf "$FILT" -q:v 3 "$OUT_DIR/glitter-poster.jpg"
ls -la "$OUT_DIR"
