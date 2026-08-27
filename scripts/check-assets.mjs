// Verifica que todo caminho local citado no site existe de fato no diretorio publicado.
// Um <link> quebrado nao derruba a pagina: ele degrada em silencio (fonte errada,
// favicon sumido) e ninguem percebe ate um cliente abrir o site.
import { readFile, access, stat } from 'node:fs/promises';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const entryFiles = ['index.html', 'site.webmanifest'];
// Origem canonica do site. Unico lugar que sabe o endereco — trocar aqui e nos <meta>
// do HTML quando o dominio proprio entrar. Ver docs/plans/, Tarefa 10.
const SITE_ORIGIN = 'https://fontis-labs.github.io/website';

// Meta que o WhatsApp, o LinkedIn e o Slack leem para montar o card do link.
// O site.webmanifest nao participa disso: ele serve para instalar o site como app.
const REQUIRED_META = [
  'og:type', 'og:locale', 'og:site_name', 'og:title', 'og:description',
  'og:url', 'og:image', 'og:image:width', 'og:image:height',
  'og:image:type', 'og:image:alt', 'twitter:card',
];

// Conteudo que nunca deve chegar em producao. Cada entrada e [regex, motivo].
const FORBIDDEN_CONTENT = [
  [/\[a definir\]/gi, 'placeholder de conteudo'],
  [/\bTODO\b|\bFIXME\b/g, 'marcacao de trabalho pendente'],
  [/lorem ipsum/gi, 'texto de preenchimento'],
];

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

  for (const [pattern, reason] of FORBIDDEN_CONTENT) {
    for (const hit of source.match(pattern) ?? []) {
      problems.push(`${entry}: ${reason} -> ${hit}`);
    }
  }

  // Origem divergente divide o ranking do buscador e quebra o card do link.
  for (const url of source.match(/https:\/\/[a-z0-9.-]+[^"'\s]*/gi) ?? []) {
    const isOwnSite = url.includes('fontislabs') || url.includes('fontis-labs.github.io');
    if (isOwnSite && !url.startsWith(SITE_ORIGIN)) {
      problems.push(`${entry}: origem fora da canonica -> ${url}`);
    }
  }

  if (entry === 'index.html') {
    for (const name of REQUIRED_META) {
      const attr = name.startsWith('og:') ? 'property' : 'name';
      if (!new RegExp(`<meta ${attr}="${name}"`).test(source)) {
        problems.push(`${entry}: falta <meta ${attr}="${name}">`);
      }
    }
    if (/<meta name="twitter:card" content="summary">/.test(source)) {
      problems.push(`${entry}: twitter:card=summary da miniatura pequena; use summary_large_image`);
    }

    // Uma acao primaria por tela. O hero tinha dois botoes de peso igual competindo.
    const hero = source.match(/<section class="hero">[\s\S]*?\n  <\/section>/)?.[0] ?? '';
    if (!hero) {
      problems.push(`${entry}: nao achei a secao .hero — o seletor da assercao ficou obsoleto`);
    } else {
      const bigButtons = (hero.match(/class="btn btn-lg/g) ?? []).length;
      if (bigButtons > 1) {
        problems.push(`${entry}: hero tem ${bigButtons} botoes btn-lg; a regra e uma acao primaria por tela`);
      }
    }

    // og:image e URL absoluta, entao a checagem de caminho local nao a alcanca. Sem
    // esta assercao, apagar o PNG passaria no CI e quebraria o card em silencio.
    const ogImage = source.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    if (ogImage?.startsWith(SITE_ORIGIN)) {
      const localPath = ogImage.slice(SITE_ORIGIN.length).replace(/^\//, '');
      try {
        const { size } = await stat(join(publicDir, localPath));
        // Acima de ~300 KB o WhatsApp costuma desistir do card grande.
        if (size > 300 * 1024) {
          problems.push(`${entry}: og:image tem ${Math.round(size / 1024)} KB; mantenha abaixo de 300 KB`);
        }
      } catch {
        problems.push(`${entry}: og:image aponta para arquivo inexistente -> ${localPath}`);
      }
    }
  }
}

// Token usado e nao definido rende cor invisivel, nao erro. E token definido em um
// tema e esquecido no outro rende texto ilegivel so para quem usa o tema escuro.
{
  const source = await readFile(join(publicDir, 'index.html'), 'utf8');
  const used = new Set([...source.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  const themeBlocks = [
    ['claro', /:root \{([\s\S]*?)\n  \}/],
    ['escuro (prefers)', /:root:not\(\[data-theme="light"\]\) \{([\s\S]*?)\n    \}/],
    ['escuro (toggle)', /:root\[data-theme="dark"\] \{([\s\S]*?)\n  \}/],
  ].map(([name, re]) => [
    name,
    new Set([...(source.match(re)?.[1] ?? '').matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1])),
  ]);

  const COLOR_TOKEN = /^--(accent|bg|surface|fg|muted|rule|success|warning|danger|info)/;

  for (const token of used) {
    if (!themeBlocks.some(([, defined]) => defined.has(token))) {
      problems.push(`index.html: var(${token}) usado e nunca definido`);
    }
    if (!COLOR_TOKEN.test(token)) continue;
    for (const [name, defined] of themeBlocks) {
      if (!defined.has(token)) problems.push(`index.html: ${token} nao existe no tema ${name}`);
    }
  }
}

if (problems.length > 0) {
  console.error(`check-assets: ${problems.length} problema(s)\n` + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log('check-assets: ok');
