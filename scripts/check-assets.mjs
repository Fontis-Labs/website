// Verifica que todo caminho local citado no site existe de fato no diretorio publicado.
// Um <link> quebrado nao derruba a pagina: ele degrada em silencio (fonte errada,
// favicon sumido) e ninguem percebe ate um cliente abrir o site.
import { readFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const entryFiles = ['index.html', 'site.webmanifest'];
const canonicalHost = 'https://fontislabs.com.br';

const problems = [];

/** Extrai caminhos locais de atributos href/src/content/srcset e do manifest. */
function extractLocalPaths(source) {
  const found = new Set();
  const attrPattern = /(?:href|src|content|srcset)\s*=\s*"([^"]+)"/g;
  const jsonPattern = /"src"\s*:\s*"([^"]+)"/g;
  for (const pattern of [attrPattern, jsonPattern]) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      for (const raw of match[1].split(',')) {
        const value = raw.trim().split(/\s+/)[0];
        if (value.startsWith('/') && !value.startsWith('//')) found.add(value.split(/[?#]/)[0]);
      }
    }
  }
  return found;
}

for (const entry of entryFiles) {
  const source = await readFile(join(publicDir, entry), 'utf8');

  for (const path of extractLocalPaths(source)) {
    try {
      await access(join(publicDir, path));
    } catch {
      problems.push(`${entry}: referencia inexistente -> ${path}`);
    }
  }

  // Conteudo misto: um recurso em http quebra o cadeado do navegador.
  for (const insecure of source.match(/http:\/\/[^"'\s]+/g) ?? []) {
    if (!insecure.startsWith('http://www.w3.org') && !insecure.startsWith('http://www.sitemaps.org')) {
      problems.push(`${entry}: URL sem TLS -> ${insecure}`);
    }
  }

  // O dominio canonico tem que ser um so, senao o buscador divide o ranking.
  for (const url of source.match(/https:\/\/[^"'\s]*fontislabs[^"'\s]*/g) ?? []) {
    if (!url.startsWith(canonicalHost)) problems.push(`${entry}: dominio fora do canonico -> ${url}`);
  }
}

if (problems.length > 0) {
  console.error(`check-assets: ${problems.length} problema(s)\n` + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log('check-assets: ok');
