// Verifica que todo caminho local citado no site existe de fato no diretorio publicado.
// Um <link> quebrado nao derruba a pagina: ele degrada em silencio (fonte errada,
// favicon sumido) e ninguem percebe ate um cliente abrir o site.
import { readFile, access } from 'node:fs/promises';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const entryFiles = ['index.html', 'site.webmanifest'];
const canonicalHost = 'https://fontislabs.com.br';

const problems = [];

/** Caminhos que nao sao arquivo local do site. */
function isExternal(value) {
  return (
    value === '' ||
    value.startsWith('#') ||
    value.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) // http:, https:, mailto:, data:, tel:
  );
}

/** Extrai caminhos locais de atributos, de url() do CSS e do "src" do manifest. */
function extractLocalPaths(source) {
  const found = new Set();
  const patterns = [
    // `content` fica de fora de proposito: em <meta> ele carrega texto, nao caminho.
    /(?:href|src|srcset)\s*=\s*"([^"]+)"/g, // atributos HTML
    /url\(\s*['"]?([^'")]+)['"]?\s*\)/g, // url() do CSS, com ou sem aspas
    /"src"\s*:\s*"([^"]+)"/g, // icons[].src do webmanifest
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      for (const raw of match[1].split(',')) {
        const value = raw.trim().split(/\s+/)[0].split(/[?#]/)[0];
        if (!isExternal(value)) found.add(value);
      }
    }
  }
  return found;
}

for (const entry of entryFiles) {
  const source = await readFile(join(publicDir, entry), 'utf8');
  const entryDir = dirname(join(publicDir, entry));

  for (const path of extractLocalPaths(source)) {
    // Absoluto resolve na raiz publicada; relativo resolve ao lado do arquivo que cita.
    const target = isAbsolute(path) ? join(publicDir, path) : resolve(entryDir, path);

    if (relative(publicDir, target).startsWith('..')) {
      problems.push(`${entry}: referencia sai de public/ -> ${path}`);
      continue;
    }
    try {
      await access(target);
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
