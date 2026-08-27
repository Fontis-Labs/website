#!/usr/bin/env bash
# Captura a pagina em um tamanho e um tema, de forma deterministica.
#
#   ./scripts/shoot.sh 1280 light  out.png
#   ./scripts/shoot.sh 375  dark   out.png
#
# Por que --force-prefers-reduced-motion: as animacoes de entrada (.rise, draw, pop)
# fazem a captura sair diferente a cada execucao, o que impede comparar antes e depois.
# Com o movimento desligado o render e estavel — e de graca isso ja confere que a
# pagina fica correta para quem pediu menos movimento.

set -euo pipefail

WIDTH="${1:-1280}"
THEME="${2:-light}"
OUT="${3:-/tmp/fontis-$WIDTH-$THEME.png}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "erro: Chrome nao encontrado em $CHROME" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp -R "$ROOT/public/." "$WORK/"

# O tema escuro e persistido em localStorage, que a captura nao alcanca. Fixar o
# atributo no <html> reproduz exatamente o mesmo estado.
if [ "$THEME" = "dark" ]; then
  sed -i '' 's/<html lang="pt-BR" data-theme-pending>/<html lang="pt-BR" data-theme="dark">/' "$WORK/index.html"
fi

"$CHROME" --headless --disable-gpu --hide-scrollbars --force-prefers-reduced-motion \
  --window-size="$WIDTH,3000" --screenshot="$OUT" "file://$WORK/index.html" 2>/dev/null

echo "$OUT"
