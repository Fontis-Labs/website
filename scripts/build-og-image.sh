#!/usr/bin/env bash
# Gera a imagem de compartilhamento a partir de public/assets/og/fontis-og.html.
#
# Nao faz parte do build do site — o site nao tem build. Rode a mao quando a fonte
# HTML mudar, e versione o PNG resultante. O CI so confere que o arquivo existe e que
# cabe no limite de tamanho.
#
#   ./scripts/build-og-image.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/public/assets/og/fontis-og.html"
OUT="$ROOT/public/assets/og/fontis-og.png"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
  echo "erro: Chrome nao encontrado em $CHROME" >&2
  echo "no Linux, troque por 'google-chrome' ou 'chromium'" >&2
  exit 1
fi

# O ruido de task_policy_set no stderr vem do sandbox do macOS e nao afeta a captura.
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --screenshot="$OUT" --window-size=1200,630 \
  "file://$SRC" 2>/dev/null

SIZE=$(stat -f%z "$OUT" 2>/dev/null || stat -c%s "$OUT")
echo "gerado: ${OUT#"$ROOT/"} ($((SIZE / 1024)) KB)"
