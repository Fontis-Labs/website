# Plano de implementação — Rodada 1 de melhorias do site

> **Para quem executa com agente:** SUB-SKILL OBRIGATÓRIA — use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa por tarefa. Os passos usam `- [ ]` para acompanhamento.

**Objetivo:** dar ao site um caminho de contato que funciona, um preview de link que renderiza, e um ritmo de leitura que sustenta o visitante até o CTA final — sem introduzir build, dependência de runtime ou regressão de acessibilidade.

**Arquitetura:** o site é uma página única em `public/index.html` com marcação, CSS e JS inline, servida estaticamente pelo GitHub Pages. Não existe build nem framework, e isso é decisão registrada — nenhuma tarefa aqui introduz um. O portão de verificação é `scripts/check-assets.mjs`, que roda em `node` puro e é executado no CI a cada push e PR. **Cada tarefa começa escrevendo uma asserção nova nesse script, vendo-a falhar, e só então mexendo no HTML.** É o mais próximo de TDD que um site estático permite, e é suficiente para pegar toda a classe de erro que essas mudanças podem causar.

**Stack:** HTML5, CSS moderno (custom properties, `clamp()`, `animation-timeline: scroll()`), JS ES5 inline sem dependência, Node 22 para o verificador, GitHub Actions para CI e deploy.

**Spec:** [`Fontis-Labs/website#2`](https://github.com/Fontis-Labs/website/issues/2)

---

## Achado que reordena a prioridade

`fontislabs.com.br` **não está delegado**: `dig` não retorna `NS`, `MX`, `SOA` nem `A`.

Sem `MX`, e-mail para `contato@fontislabs.com.br` **não pode ser entregue**. Esse endereço é a única forma de contato do site, repetida em 5 lugares. Ou seja: **hoje todo CTA da página é um beco sem saída.** Isso deixa de ser "melhoria de conversão" e passa a ser correção de defeito.

Consequência para o plano: a Tarefa 2 (WhatsApp) é a única que restabelece um caminho de contato sem depender do domínio, e por isso vem antes de tudo que é estético.

---

## Correções feitas na execução (27/08/2026)

Três premissas deste plano não sobreviveram à medição. Ficam registradas aqui em vez de o plano ser reescrito como se sempre estivesse certo — ver `#5`.

**Tarefa 6 — o diagnóstico estava errado.** O plano manda tirar a faixa de números do hero alegando que ela empurra o CTA para baixo da dobra. Medido em viewport real de 375×667, a faixa começa em **y=833**: nunca esteve na dobra, e mover uma seção para um irmão não muda a ordem do conteúdo. O que consome a dobra é o **símbolo**, que abre a tela no mobile e ocupa 233 px dos 667. O ajuste foi no ritmo vertical do hero em ≤ 560 px, e a faixa ficou onde estava. Resultado: CTA de y=679 para **y=628**, com 39 px de folga.

**Tarefa 8 — desnecessária, foi pulada.** Os dois itens já estavam resolvidos. A frase *"Um de nós veio da mesa onde a decisão é tomada…"* **já é** um `.pquote` com régua de acento (linha 1033) — a issue dizia que estava enterrada em corpo de texto, e isso veio de eu ter lido um dump de texto puro, onde o estilo não aparece. E a medida de leitura já está no limite: em 1440 px, `.hero-sub` 52ch, `.who-copy p` 51ch, `.prose` 60ch, `.step-out p` 56ch, `.partner p` 54ch, `.pquote` 48ch, `.pain-a` 34ch, `.honest-d` 36ch, `.svc-lead` 34ch. Nada passa de 75.

**Tarefa 7 — a lista de seções alternadas mudou.** `.band-alt` só pode ir em seção sem cartão de fundo `--surface`. Levantado antes de escolher: a seção 01 (`.pain`), `#quem` (`.partner`) e `#risco` (`.honest`) têm esse problema. A alternância ficou em `#como` e `#contato`, e a restrição está escrita no CSS.

**Duas armadilhas de ferramenta**, que deram falso resultado antes de serem descobertas:

- Chrome headless **trava a largura mínima em 500 CSS px**. `--window-size=375` renderiza a 500 e a captura sai cortada, o que parece rolagem horizontal e não é (`scrollWidth == clientWidth == 500`). Viewport de 375 real só via iframe dentro de uma janela de 500.
- As animações de entrada tornam cada captura diferente, então comparar antes e depois exige `--force-prefers-reduced-motion`. É a razão de existir o `scripts/shoot.sh`.

---

## Restrições globais

Valem para toda tarefa, sem repetição no corpo de cada uma.

- **Sem build.** Nenhuma dependência de npm, nenhum passo de compilação, nenhum arquivo gerado que precise de ferramenta para reproduzir. Tudo que entra em `public/` é servido como está.
- **Sem dependência externa em runtime.** Nada de CDN, fonte remota, script de terceiro ou pixel. O que a página carrega vem do mesmo host.
- **Idioma:** texto visível e comentário em PT-BR; classe, id, nome de arquivo e mensagem de commit em inglês.
- **Movimento:** todo efeito novo respeita `prefers-reduced-motion: reduce`. O padrão do arquivo é desligar transição e transformação nesse modo, não reduzi-las.
- **Tema:** toda cor nova existe nos dois temas (claro por `:root`, escuro pelo bloco `prefers-color-scheme: dark` **e** pelo bloco `[data-theme="dark"]`, porque o toggle é persistido).
- **Contraste:** texto normal ≥ 4,5:1; texto grande e borda ≥ 3:1. Valor não conferido não entra.
- **Orçamento de acento:** ≤ 10 % da área, gasto nesta ordem — a ação que importa → *um* bloco de superfície → detalhe. Nunca fundo cheio, nunca gradiente, nunca dois roxos na mesma peça. (`Fontis-Labs/brand`, seção de cor.)
- **Origem do site:** `https://fontis-labs.github.io/website` — ver premissa B.
- **Commit:** `<emoji> <tipo>: <assunto em inglês>`, corpo em PT-BR explicando o porquê. Um commit por tarefa, salvo onde o plano pedir mais.
- **Branch:** uma por tarefa, `fix/…` ou `feat/…` conforme o tipo. Agente não faz merge na `main`.

## Insumos e premissas

**A. Número do WhatsApp — bloqueia a Tarefa 2.**
Não existe no repositório e não pode ser inventado. O plano usa o sentinela literal `55DDDNUMERO`, e a Tarefa 2 adiciona uma asserção que **falha enquanto o sentinela estiver no HTML**. Assim a falta de insumo é um portão vermelho, não um bug silencioso que vai para produção.
Recomendação registrada: use um número de **WhatsApp Business dedicado**. Número publicado em site é raspado por bot e não tem volta.

**B. Origem do site — premissa declarada, não bloqueia.**
O plano assume `https://fontis-labs.github.io/website` como origem canônica, porque é o único endereço que resolve hoje. A Tarefa 10 troca a origem quando `fontislabs.com.br` existir, e é uma mudança de uma constante mais quatro linhas de `<meta>`.
**Recomendação:** registre o domínio antes de executar a Tarefa 3. Ele já aparece no rodapé e no endereço de e-mail do próprio site; um site que anuncia um endereço que não existe é o mesmo defeito do `CNPJ [a definir]`, só menos visível. Custa ~R$ 40/ano no registro.br.

**C. Paleta — resolvido.** Orçamento de acento em 10 % (`Fontis-Labs/brand#1`). A Tarefa 9 executa.

**D. Cases — não resolvido.** Frente 7 da issue (imagens e vitrine) fica **fora deste plano**. Ver *Fora de escopo*.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Tarefas |
|---|---|---|
| `scripts/check-assets.mjs` | Portão único de verificação: referências locais, TLS, origem canônica e — a partir daqui — asserções de conteúdo (placeholder, CTA, meta social). | 1–10 |
| `public/index.html` | A página. Marcação, CSS e JS inline. | 1–9 |
| `public/assets/og/fontis-og.html` | **Novo.** Fonte da imagem de compartilhamento, em HTML, para poder ser regerada e revisada em diff. | 4 |
| `public/assets/og/fontis-og.png` | **Novo.** Imagem 1200×630 gerada a partir do HTML acima. | 4 |
| `scripts/build-og-image.sh` | **Novo.** Gera o PNG com o Chrome headless. Não é build do site: roda à mão, e o PNG é versionado. | 4 |
| `docs/plans/2026-08-27-melhorias-rodada-1.md` | Este plano. | — |

O verificador cresce de "confere caminhos" para "confere caminhos e contrato de conteúdo". Isso é intencional: é o único lugar onde uma regra sobre esta página pode ser executada, e um arquivo só de 130 linhas é mais fácil de manter do que dois que se sobrepõem.

---

# Fase A — restabelecer contato e preview

Independentes entre si e de todo o resto. Podem ir hoje, em PRs separados.

---

### Tarefa 1: portão de placeholder e limpeza do rodapé

Resolve a frente 3 da issue e fecha a porta para o próximo placeholder.

**Arquivos:**
- Modificar: `scripts/check-assets.mjs`
- Modificar: `public/index.html:1025` (rodapé)

**Interfaces:**
- Produz: constante `FORBIDDEN_CONTENT` no verificador, consumida pelas Tarefas 2 e 3 para acrescentar novos padrões proibidos.

- [ ] **Passo 1: escrever a asserção que falha**

Em `scripts/check-assets.mjs`, logo abaixo da constante `canonicalHost`, adicione:

```js
// Conteudo que nunca deve chegar em producao. Cada entrada e [regex, motivo].
const FORBIDDEN_CONTENT = [
  [/\[a definir\]/gi, 'placeholder de conteudo'],
  [/\bTODO\b|\bFIXME\b/g, 'marcacao de trabalho pendente'],
  [/lorem ipsum/gi, 'texto de preenchimento'],
];
```

E dentro do laço `for (const entry of entryFiles)`, depois da checagem de TLS:

```js
  for (const [pattern, reason] of FORBIDDEN_CONTENT) {
    for (const hit of source.match(pattern) ?? []) {
      problems.push(`${entry}: ${reason} -> ${hit}`);
    }
  }
```

- [ ] **Passo 2: rodar e confirmar que falha**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: 1 problema(s)` com a linha `index.html: placeholder de conteudo -> [a definir]`.

- [ ] **Passo 3: corrigir o rodapé**

Em `public/index.html`, troque:

```html
      <span class="lbl">Fontis Labs · CNPJ [a definir]</span>
```

por:

```html
      <!-- CNPJ entra aqui quando a empresa estiver aberta. Nao e obrigatorio para
           site institucional (o Decreto 7.962/2013 obriga para comercio eletronico),
           mas em venda B2B e sinal de empresa real. Placeholder e pior que ausencia. -->
      <span class="lbl">Fontis Labs</span>
```

- [ ] **Passo 4: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

- [ ] **Passo 5: commitar**

```sh
git switch -c fix/remove-footer-placeholder
git add scripts/check-assets.mjs public/index.html
git commit -m "🔒 fix: block placeholder content and clean the footer" \
  -m "O rodape publicava 'CNPJ [a definir]'. Placeholder em producao le como site
inacabado, que e o oposto do que a pagina argumenta. A assercao no verificador
existe para o proximo nao passar: agora o CI quebra em vez de a gente descobrir
depois que um cliente viu."
git push -u origin fix/remove-footer-placeholder
gh pr create --fill
```

---

### Tarefa 2: CTA por WhatsApp

Resolve a frente 1. **É a tarefa que restabelece um caminho de contato funcional** — ver *Achado* no topo.

**Arquivos:**
- Modificar: `scripts/check-assets.mjs`
- Modificar: `public/index.html` — 5 links `mailto:` nas linhas 709 (nav), 732 (hero), 989 (seção contato), 990 (seção contato, texto), 1026 (rodapé)

**Interfaces:**
- Consome: `FORBIDDEN_CONTENT` da Tarefa 1.
- Produz: classe CSS `.btn-wa` e o padrão de link `wa.me`, consumidos pela Tarefa 5 quando o CTA secundário for rebaixado.

- [ ] **Passo 1: escrever as asserções que falham**

Em `scripts/check-assets.mjs`, acrescente ao array `FORBIDDEN_CONTENT`:

```js
  [/55DDDNUMERO/g, 'sentinela do numero de WhatsApp nao substituido'],
```

E adicione um bloco novo de verificação dentro do laço, depois de `FORBIDDEN_CONTENT`:

```js
  // O CTA principal tem que existir e tem que ser seguro. `target="_blank"` sem
  // `rel="noopener"` da a pagina aberta acesso a `window.opener`.
  if (entry === 'index.html') {
    const waLinks = source.match(/<a[^>]*href="https:\/\/wa\.me\/[^"]*"[^>]*>/g) ?? [];
    if (waLinks.length === 0) {
      problems.push(`${entry}: nenhum link de WhatsApp — o CTA principal nao existe`);
    }
    for (const link of waLinks) {
      if (!link.includes('rel="noopener noreferrer"')) {
        problems.push(`${entry}: link wa.me sem rel="noopener noreferrer" -> ${link.slice(0, 80)}`);
      }
      if (!link.includes('target="_blank"')) {
        problems.push(`${entry}: link wa.me sem target="_blank" -> ${link.slice(0, 80)}`);
      }
    }
    // O e-mail continua existindo como alternativa: comprador B2B quer rastro escrito.
    if (!source.includes('mailto:contato@fontislabs.com.br')) {
      problems.push(`${entry}: o e-mail secundario desapareceu`);
    }
  }
```

- [ ] **Passo 2: rodar e confirmar que falha**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: 1 problema(s)` — `nenhum link de WhatsApp — o CTA principal nao existe`.

- [ ] **Passo 3: adicionar o estilo do CTA**

Em `public/index.html`, depois da regra `.btn-lg` (linha 285), acrescente:

```css
  /* O icone e decorativo: o rotulo em texto ja da o nome acessivel ao link. */
  .btn-wa { display: inline-flex; align-items: center; gap: 0.5rem; }
  .btn-wa svg { width: 1.05em; height: 1.05em; flex: none; fill: currentColor; }
```

- [ ] **Passo 4: trocar os três CTAs de ação**

Linha 709 (nav) — de:

```html
      <a class="btn btn-cta" href="mailto:contato@fontislabs.com.br?subject=Diagn%C3%B3stico%20t%C3%A9cnico"><span class="hide-sm">Agendar diagnóstico</span><span class="only-sm">Diagnóstico</span></a>
```

para:

```html
      <a class="btn btn-cta btn-wa" href="https://wa.me/55DDDNUMERO?text=Oi%2C%20vim%20pelo%20site.%20Queria%20falar%20sobre%20um%20diagn%C3%B3stico." target="_blank" rel="noopener noreferrer"><span class="hide-sm">Falar no WhatsApp</span><span class="only-sm">WhatsApp</span></a>
```

Linha 732 (hero) — de `<a class="btn btn-lg" href="mailto:...">Agendar diagnóstico</a>` para:

```html
              <a class="btn btn-lg btn-wa" href="https://wa.me/55DDDNUMERO?text=Oi%2C%20vim%20pelo%20site.%20Queria%20falar%20sobre%20um%20diagn%C3%B3stico." target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
```

Linha 989 (seção contato) — mesma troca, mantendo `class="btn btn-lg btn-wa"`.

- [ ] **Passo 5: manter o e-mail como secundário**

Linha 990 já é `<a class="lbl" href="mailto:contato@fontislabs.com.br">contato@fontislabs.com.br</a>`. **Não mexa.** Linha 1026 (rodapé) também fica. São os dois pontos onde o e-mail sobrevive, de propósito.

Na seção contato, acrescente logo abaixo do link de e-mail:

```html
          <p class="note">Prefere e-mail? Também respondemos por lá — só demora mais.</p>
```

- [ ] **Passo 6: substituir o sentinela**

Troque **todas** as ocorrências de `55DDDNUMERO` pelo número real, sem espaço, parêntese ou hífen. Formato: `55` + DDD + número. Exemplo de forma, não de valor: `5551999998888`.

```sh
grep -c '55DDDNUMERO' public/index.html   # tem que voltar 0
```

- [ ] **Passo 7: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

- [ ] **Passo 8: verificar no navegador**

```sh
python3 -m http.server 4000 --directory public
```

Abra `http://localhost:4000`, clique no CTA do hero e confirme: abre o WhatsApp Web ou o app, a conversa é com o número certo, e a mensagem vem preenchida. Confira também que o e-mail continua visível na seção *Contato* e no rodapé.

- [ ] **Passo 9: commitar**

```sh
git switch -c feat/whatsapp-cta
git add scripts/check-assets.mjs public/index.html
git commit -m "✨ feat: switch primary cta to whatsapp" \
  -m "O dominio nao esta delegado e nao tem MX, entao contato@fontislabs.com.br nao
recebe mensagem — todo CTA da pagina era um beco sem saida. O WhatsApp restabelece
contato sem depender do dominio.

O e-mail fica como secundario, visivel: parte do comprador B2B nao fecha nada por
WhatsApp e quer rastro escrito. O verificador passa a exigir os dois."
git push -u origin feat/whatsapp-cta
gh pr create --fill
```

---

### Tarefa 3: origem única e meta social completa

Resolve a metade "tags" da frente 2. **Correção de premissa registrada na issue:** o `site.webmanifest` não participa do preview de link. Ele serve para instalar o site como app. Preview no WhatsApp, Telegram, LinkedIn e Slack vem de Open Graph. Não mexa no manifest nesta tarefa.

**Arquivos:**
- Modificar: `scripts/check-assets.mjs` (constante `canonicalHost` e verificação de origem)
- Modificar: `public/index.html:10` (`canonical`), `:12-19` (bloco `og:`/`twitter:`)

**Interfaces:**
- Consome: nada.
- Produz: constante `SITE_ORIGIN` no verificador — é o único lugar que sabe o endereço do site, e é o que a Tarefa 10 troca. A Tarefa 4 depende dela para montar a URL absoluta da imagem.

- [ ] **Passo 1: escrever as asserções que falham**

Em `scripts/check-assets.mjs`, substitua a linha `const canonicalHost = 'https://fontislabs.com.br';` por:

```js
// Origem canonica do site. Unico lugar que sabe o endereco — trocar aqui e nos
// <meta> do HTML quando o dominio proprio entrar. Ver docs/plans/, Tarefa 10.
const SITE_ORIGIN = 'https://fontis-labs.github.io/website';

// Meta que o WhatsApp, o LinkedIn e o Slack leem para montar o card do link.
const REQUIRED_META = [
  'og:type', 'og:locale', 'og:site_name', 'og:title', 'og:description',
  'og:url', 'og:image', 'og:image:width', 'og:image:height',
  'og:image:type', 'og:image:alt', 'twitter:card',
];
```

Substitua o bloco que hoje verifica `fontislabs` por:

```js
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
  }
```

- [ ] **Passo 2: rodar e confirmar que falha**

```sh
node scripts/check-assets.mjs
```

Esperado: 8 problemas — 3 URLs em `fontislabs.com.br` fora da origem, 4 `<meta>` faltando (`og:image:width`, `og:image:height`, `og:image:type`, `og:image:alt`) e 1 de `twitter:card=summary`.

- [ ] **Passo 3: reescrever o bloco de meta**

Em `public/index.html`, substitua as linhas 10 e 12–19 por:

```html
<link rel="canonical" href="https://fontis-labs.github.io/website/">

<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Fontis Labs">
<meta property="og:title" content="Fontis — Da fonte à decisão">
<meta property="og:description" content="Dois sócios que desenham a arquitetura, constroem o sistema e entregam a operação rodando. Diagnóstico com escopo e preço fechados.">
<meta property="og:url" content="https://fontis-labs.github.io/website/">
<!-- Imagem dedicada de 1200x630: icone quadrado vira miniatura pequena, nao card grande. -->
<meta property="og:image" content="https://fontis-labs.github.io/website/assets/og/fontis-og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="Logotipo da Fontis sobre fundo escuro, com a frase: da fonte à decisão.">
<meta name="twitter:card" content="summary_large_image">
```

- [ ] **Passo 4: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

Repare que a imagem apontada por `og:image` **ainda não existe** e o verificador não reclama: a URL é absoluta, e a checagem de caminhos locais só alcança caminho relativo. Esse buraco é fechado no Passo 1 da Tarefa 4 — é o primeiro erro que ela provoca de propósito.

- [ ] **Passo 5: commitar**

```sh
git switch -c fix/canonical-origin-and-og-meta
git add scripts/check-assets.mjs public/index.html
git commit -m "🐛 fix: point canonical origin at the live address and complete og meta" \
  -m "As tags apontavam para fontislabs.com.br, dominio sem NS nem A. O crawler do
WhatsApp buscava a imagem la, recebia erro e nao renderizava card nenhum.

A origem agora e a URL do Pages, que resolve, e vive numa constante so — trocar
para o dominio proprio e mudar SITE_ORIGIN e quatro <meta>. O verificador passa a
exigir as 12 tags e recusa twitter:card=summary, que so rende miniatura pequena."
git push -u origin fix/canonical-origin-and-og-meta
gh pr create --fill
```

---

### Tarefa 4: imagem de compartilhamento 1200×630

Fecha a frente 2. A imagem é gerada de uma fonte HTML versionada — não de um binário opaco — para que uma mudança de marca apareça em diff e possa ser revisada.

**Arquivos:**
- Criar: `public/assets/og/fontis-og.html`
- Criar: `public/assets/og/fontis-og.png` (gerado)
- Criar: `scripts/build-og-image.sh`
- Modificar: `scripts/check-assets.mjs`

**Interfaces:**
- Consome: `SITE_ORIGIN` da Tarefa 3; a fonte `public/assets/fonts/jetbrains-mono-vf-latin.woff2`; a paleta do guia de marca.
- Produz: `public/assets/og/fontis-og.png`, referenciado pela `og:image` da Tarefa 3.

- [ ] **Passo 1: escrever a asserção que falha**

Em `scripts/check-assets.mjs`, no bloco `if (entry === 'index.html')`, acrescente:

```js
    // og:image e URL absoluta, entao a checagem de caminho local nao a alcanca.
    // Sem esta assercao, apagar o PNG passaria no CI e quebraria o card em silencio.
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
```

E troque o import do topo para incluir `stat`:

```js
import { readFile, access, stat } from 'node:fs/promises';
```

- [ ] **Passo 2: rodar e confirmar que falha**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: 1 problema(s)` — `og:image aponta para arquivo inexistente -> assets/og/fontis-og.png`.

- [ ] **Passo 3: criar a fonte da imagem**

`public/assets/og/fontis-og.html` — 1200×630, cores e tipografia do guia. O símbolo é o mesmo desenho do hero, no peso grande.

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Fontis — imagem de compartilhamento</title>
<style>
  /* Fonte local com caminho relativo: o Chrome headless carrega por file://. */
  @font-face {
    font-family: "JetBrains Mono";
    src: url("../fonts/jetbrains-mono-vf-latin.woff2") format("woff2");
    font-weight: 100 800;
    font-display: block;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #100D14;
    color: #F5F4F7;
    font-family: "JetBrains Mono", monospace;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 88px;
  }
  .top { display: flex; align-items: center; gap: 22px; }
  .top svg { width: 76px; height: 76px; flex: none; }
  .sym { fill: none; stroke: #F5F4F7; stroke-width: 5; stroke-linecap: round; }
  .sym-dot { fill: #A585D8; }
  .wordmark { font-size: 52px; font-weight: 500; letter-spacing: 0.02em; }
  h1 { font-size: 76px; font-weight: 500; letter-spacing: -0.015em; line-height: 1.08; }
  h1 em { font-style: normal; color: #A585D8; }
  .foot { display: flex; justify-content: space-between; align-items: baseline; }
  .lbl {
    font-size: 21px; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.14em; color: #A79FB3;
  }
</style>
</head>
<body>
  <div class="top">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="sym" d="M9.6 55.4 A32 32 0 1 1 54.4 55.4"/>
      <path class="sym" d="M17.28 48.35 A22 22 0 1 1 46.72 48.35"/>
      <circle class="sym-dot" cx="32" cy="32" r="4.5"/>
    </svg>
    <span class="wordmark">fontis</span>
  </div>

  <h1>Da fonte<br><em>à decisão.</em></h1>

  <div class="foot">
    <span class="lbl">Consultoria · Engenharia · Dados</span>
    <span class="lbl">fontislabs.com.br</span>
  </div>
</body>
</html>
```

- [ ] **Passo 4: criar o gerador**

`scripts/build-og-image.sh`:

```bash
#!/usr/bin/env bash
# Gera a imagem de compartilhamento a partir de public/assets/og/fontis-og.html.
#
# Nao faz parte do build do site — o site nao tem build. Rode a mao quando a fonte
# HTML mudar e versione o PNG resultante. O CI so confere que o arquivo existe e
# que cabe no limite de tamanho.
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

# O ruido de task_policy_set no stderr e do sandbox do macOS e nao afeta a captura.
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --screenshot="$OUT" --window-size=1200,630 \
  "file://$SRC" 2>/dev/null

SIZE=$(stat -f%z "$OUT" 2>/dev/null || stat -c%s "$OUT")
echo "gerado: ${OUT#"$ROOT/"} ($((SIZE / 1024)) KB)"
```

```sh
chmod +x scripts/build-og-image.sh
```

- [ ] **Passo 5: gerar e conferir as dimensões**

```sh
./scripts/build-og-image.sh
sips -g pixelWidth -g pixelHeight public/assets/og/fontis-og.png
```

Esperado: `pixelWidth: 1200`, `pixelHeight: 630`, e um tamanho na casa das dezenas de KB — a imagem é chapada, sem foto.

- [ ] **Passo 6: revisar a imagem com o olho**

```sh
open public/assets/og/fontis-og.png
```

Confira: a JetBrains Mono carregou (se caiu para monospace do sistema, o caminho da `@font-face` está errado); o símbolo aparece inteiro, sem corte; o texto não toca a borda; o ponto da nascente está em ametista clara.

- [ ] **Passo 7: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

- [ ] **Passo 8: commitar**

```sh
git switch -c feat/og-share-image
git add scripts/build-og-image.sh scripts/check-assets.mjs public/assets/og/
git commit -m "✨ feat: add 1200x630 share image built from html source" \
  -m "A og:image apontava para o icone de 512 px, que rende miniatura pequena em vez
do card grande. A imagem nova vem de uma fonte HTML versionada, e nao de um binario
opaco: mudanca de marca aparece em diff e da para revisar.

O verificador passa a checar existencia e tamanho do arquivo — og:image e URL
absoluta, entao a checagem de caminho local nao a alcancava, e apagar o PNG
quebraria o card em silencio."
git push -u origin feat/og-share-image
gh pr create --fill
```

- [ ] **Passo 9: verificar o preview de verdade, depois do merge**

Depois que o deploy rodar:

1. Cole `https://fontis-labs.github.io/website/` no [Sharing Debugger](https://developers.facebook.com/tools/debug/) e clique em *Scrape Again*.
2. Mande o link para você mesmo no WhatsApp.

Se o card vier velho, **é cache, não bug** — o WhatsApp guarda preview de forma agressiva. Teste com `?v=2` no fim da URL para forçar leitura nova.

---

# Fase B — sistema de cor

Vem antes das tarefas de leitura porque elas gastam estes tokens. Fazer na ordem inversa significa escrever hex à mão e trocar depois.

---

### Tarefa 5: rampa da ametista e cores funcionais

Resolve a frente 6. O orçamento de acento subiu para 10 % (`Fontis-Labs/brand#1`), e hoje a página usa `--accent` 16 vezes — abaixo até do orçamento antigo. Esta tarefa cria o vocabulário; as próximas o gastam.

Descoberta que muda o escopo: **`--accent-soft` está definido nos três blocos de tema e nunca é usado.** É token morto. Ele entra na rampa em vez de virar uma quarta convenção.

**Arquivos:**
- Modificar: `scripts/check-assets.mjs`
- Modificar: `public/index.html:87-95` (`:root`), `:113-125` (bloco `prefers-color-scheme: dark`), `:127-138` (bloco `[data-theme="dark"]`)

**Interfaces:**
- Produz: `--accent-100` … `--accent-700`, `--success`, `--warning`, `--danger`, `--info`. Consumidos pelas Tarefas 6 a 9.
- **Contrato de uso, válido nos dois temas:** `100`–`300` são **superfície e borda, nunca texto**. `400`–`700` são seguros para texto. `500` é o acento canônico do guia em cada tema (`#5A3A82` no claro, `#A585D8` no escuro) e **não pode ser alterado** — é valor de marca, não de sistema.

**Valores conferidos.** Todos os contrastes abaixo foram calculados (WCAG 2.x) contra Papel `#F5F4F7` no tema claro e contra `#0C0A10` no escuro:

| Token | Claro | vs Papel | Escuro | vs fundo escuro | Uso |
|---|---|---|---|---|---|
| `--accent-100` | `#EFEAF6` | 1,08 | `#241B33` | — | superfície |
| `--accent-200` | `#DACEE9` | 1,37 | `#33214A` | — | superfície, borda |
| `--accent-300` | `#BAA3D6` | 2,06 | `#472E66` | — | borda, divisor |
| `--accent-400` | `#8F6BBD` | 3,83 | `#8F6BBD` | 4,69 | texto grande (claro), texto normal (escuro) |
| `--accent-500` | `#5A3A82` | **8,11** | `#A585D8` | **6,51** | texto, link, ação — o acento do guia |
| `--accent-600` | `#472E66` | 10,36 | `#BAA3D6` | 8,72 | hover, ênfase |
| `--accent-700` | `#33214A` | 13,15 | `#DACEE9` | 13,11 | máxima ênfase |
| `--success` | `#1B6B45` | 4,92 → **5,92** | `#57C08A` | 8,73 | confirmação |
| `--warning` | `#8A5A00` | **5,41** | `#E0A83C` | 9,22 | atenção |
| `--danger` | `#A32118` | **6,87** | `#F08279` | 7,66 | erro, ação destrutiva |
| `--info` | `#2C5AA8` | **6,11** | `#85AEEA` | 8,66 | informação neutra |

Toda funcional passa AA para texto normal nos dois temas. A rampa é derivada do matiz e da saturação do `#5A3A82` (H 266,7 / S 38,3 %) variando só a luminosidade — por isso `accent-500` cai exatamente no valor do guia.

- [ ] **Passo 1: escrever a asserção que falha**

Em `scripts/check-assets.mjs`, acrescente antes do bloco final de relatório:

```js
// Token usado e nao definido rende cor invisivel, nao erro. E token definido em um
// tema e esquecido no outro rende texto ilegivel so para quem usa o tema escuro.
{
  const source = await readFile(join(publicDir, 'index.html'), 'utf8');
  const used = new Set([...source.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  const themeBlocks = [
    ['claro', /:root \{([\s\S]*?)\n  \}/],
    ['escuro (prefers)', /:root:not\(\[data-theme="light"\]\) \{([\s\S]*?)\n    \}/],
    ['escuro (toggle)', /:root\[data-theme="dark"\] \{([\s\S]*?)\n  \}/],
  ].map(([name, re]) => [name, new Set([...(source.match(re)?.[1] ?? '').matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]))]);

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
```

- [ ] **Passo 2: rodar e confirmar que passa (ainda)**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`. A asserção é uma rede para os passos seguintes, não um erro pré-existente — a página hoje está consistente. Se acusar algo, **pare e investigue antes de continuar**: significa que havia um token divergente que ninguém tinha visto.

- [ ] **Passo 3: escrever a rampa no tema claro**

Em `public/index.html`, no bloco `:root`, substitua a linha `--accent-soft: #E2DBEC;` por:

```css
    /* Rampa da ametista: matiz e saturacao do #5A3A82, so a luminosidade varia.
       100-300 sao superficie e borda — NUNCA texto. 400-700 servem para texto.
       500 e o acento do guia e nao muda: e valor de marca, nao de sistema.
       Orcamento de area do acento: 10 %, gasto nesta ordem — a acao que importa,
       depois UM bloco de superficie, e so o que sobrar em detalhe. */
    --accent-100: #EFEAF6;
    --accent-200: #DACEE9;
    --accent-300: #BAA3D6;
    --accent-400: #8F6BBD;
    --accent-500: #5A3A82;
    --accent-600: #472E66;
    --accent-700: #33214A;

    /* Cores funcionais: significado, nao decoracao. Todas passam AA (>= 4,5:1)
       para texto normal sobre o fundo do seu tema. */
    --success: #1B6B45;
    --warning: #8A5A00;
    --danger: #A32118;
    --info: #2C5AA8;
```

- [ ] **Passo 4: escrever a rampa nos dois blocos de tema escuro**

Nos blocos `:root:not([data-theme="light"])` **e** `:root[data-theme="dark"]`, substitua `--accent-soft: #241B33;` pelo mesmo trecho, em ambos:

```css
      /* A rampa inverte no escuro: 100 continua sendo a superficie mais discreta
         e 700 a enfase maxima, mas os valores caminham na direcao oposta. */
      --accent-100: #241B33;
      --accent-200: #33214A;
      --accent-300: #472E66;
      --accent-400: #8F6BBD;
      --accent-500: #A585D8;
      --accent-600: #BAA3D6;
      --accent-700: #DACEE9;

      --success: #57C08A;
      --warning: #E0A83C;
      --danger: #F08279;
      --info: #85AEEA;
```

Atenção à indentação: o bloco `prefers-color-scheme` está aninhado (6 espaços), o bloco `[data-theme="dark"]` não (4 espaços). O regex da asserção do Passo 1 depende disso.

- [ ] **Passo 5: ligar o token semântico à rampa**

Não troque as 16 ocorrências de `var(--accent)`. O desenho certo é de duas camadas: a rampa é a **primitiva** (valores), `--accent` é o **semântico** (intenção). Quem escreve componente pede a intenção; só quem precisa de um degrau específico chama a primitiva.

Nos três blocos de tema, troque o valor literal de `--accent` por uma referência:

```css
    --accent: var(--accent-500);
```

Custom property resolve no uso, não na definição, então a ordem das linhas não importa — `--accent` pode continuar onde está, acima da rampa.

```sh
grep -c 'var(--accent-500)' public/index.html   # esperado: 3, um por bloco de tema
```

**Risco declarado:** os degraus `100`–`400`, `600` e `700` nascem definidos e não usados — exatamente a situação que matou o `--accent-soft`. O primeiro consumo real é a Tarefa 7, que usa `--accent-200` no cartão de clímax. Se a Fase C não for executada, **volte e remova os degraus não usados** em vez de deixá-los apodrecendo no arquivo.

- [ ] **Passo 6: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

- [ ] **Passo 7: conferir os dois temas no navegador**

```sh
python3 -m http.server 4000 --directory public
```

Abra `http://localhost:4000`, alterne o tema pelo botão da nav e confirme que **nada mudou visualmente** — esta tarefa é só vocabulário. Qualquer diferença de cor perceptível é regressão: `--accent-500` tem exatamente o valor que `--accent` tinha nos dois temas.

- [ ] **Passo 8: commitar**

```sh
git switch -c feat/color-token-ramp
git add scripts/check-assets.mjs public/index.html
git commit -m "✨ feat: add amethyst ramp and functional color tokens" \
  -m "O orcamento de area do acento subiu para 10 % (brand#1) e a pagina usava um roxo
chapado so. A rampa deriva do matiz e da saturacao do #5A3A82 variando luminosidade,
entao accent-500 cai exatamente no valor do guia e nada muda de aparencia.

--accent-soft estava definido nos tres blocos de tema e nunca usado. Virou
accent-200 em vez de sobreviver como quarta convencao.

As funcionais (success/warning/danger/info) nao existiam e vao faltar na primeira
area logada. Todas conferidas em AA para texto normal nos dois temas.

O verificador passa a exigir que todo token usado exista, e que todo token de cor
exista nos tres blocos de tema — esquecer o escuro rendia texto ilegivel so para
quem usa o escuro, e ninguem percebia."
git push -u origin feat/color-token-ramp
gh pr create --fill
```

---

# Fase C — ritmo de leitura

**Nota sobre verificação nesta fase.** As Tarefas 7 e 8 são visuais. Uma asserção de regex sobre marcação daria falsa confiança: passaria com o layout quebrado. Aqui o portão é **captura de tela em dois tamanhos e dois temas**, com lista de conferência explícita. Só a Tarefa 9 tem comportamento testável, e ela ganha asserção.

Todas as quatro dependem da Tarefa 5 (tokens).

---

### Tarefa 6: desafogar o hero

Resolve a parte **estrutural** da frente 4. Reescrever a manchete é decisão de texto e fica fora — ver *Fora de escopo*.

Três problemas concretos, nomeados na issue: o `<h1>` diz o estado do cliente e nunca o que a Fontis faz; os dois botões têm peso quase igual, contra a regra de uma ação primária por tela; e a faixa de quatro números repete conteúdo das seções 03 e 04 enquanto empurra a dobra para baixo.

**Arquivos:**
- Modificar: `scripts/check-assets.mjs`
- Modificar: `public/index.html` — CSS após linha 285, lista de `transition: none` na linha 659, hero nas linhas 723–779

**Interfaces:**
- Consome: `.btn-wa` da Tarefa 2.
- Produz: classes `.strip` e `.link-arrow`.

- [ ] **Passo 1: escrever a asserção que falha**

Em `scripts/check-assets.mjs`, dentro do bloco `if (entry === 'index.html')`:

```js
    // Uma acao primaria por tela. O hero tinha dois botoes de peso igual, e a faixa
    // de numeros ocupava a dobra com dado que se repete duas secoes depois.
    const hero = source.match(/<section class="hero">[\s\S]*?\n  <\/section>/)?.[0] ?? '';
    if (!hero) {
      problems.push(`${entry}: nao achei a secao .hero — o seletor da assercao ficou obsoleto`);
    } else {
      const bigButtons = (hero.match(/class="btn btn-lg/g) ?? []).length;
      if (bigButtons > 1) {
        problems.push(`${entry}: hero tem ${bigButtons} botoes btn-lg; a regra e uma acao primaria por tela`);
      }
      if (hero.includes('class="facts')) {
        problems.push(`${entry}: a faixa de numeros ainda esta dentro do hero`);
      }
    }
```

- [ ] **Passo 2: rodar e confirmar que falha**

```sh
node scripts/check-assets.mjs
```

Esperado: 2 problemas — `hero tem 2 botoes btn-lg` e `a faixa de numeros ainda esta dentro do hero`.

- [ ] **Passo 3: adicionar o CSS**

Depois da regra `.btn-lg` (linha 285):

```css
  /* Faixa fina entre o hero e a secao 01. Tira os numeros de cima da dobra sem
     jogar o dado fora. */
  .strip { border-top: 1px solid var(--rule); padding: clamp(1.5rem, 3vw, 2.25rem) 0; }

  /* CTA secundario rebaixado: link com regua, nao botao. Continua obvio, para de
     competir com a acao que importa. */
  .link-arrow {
    display: inline-flex; align-items: center; gap: 0.45rem;
    font-family: var(--f-mono); font-size: 0.875rem; font-weight: 500;
    color: var(--fg); text-decoration: none;
    border-bottom: 1px solid var(--rule-strong); padding-bottom: 0.2rem;
    transition: border-color 200ms var(--ease);
  }
  .link-arrow:hover { border-color: var(--fg); }
  .link-arrow .arrow { transition: transform 200ms var(--ease); }
  .link-arrow:hover .arrow { transform: translateX(0.2rem); }
```

- [ ] **Passo 4: respeitar `prefers-reduced-motion`**

Na linha 659, acrescente as duas classes novas à lista existente:

```css
    .btn, .svc, .theme, .nav-links a.lbl, .link-arrow, .link-arrow .arrow { transition: none; }
```

- [ ] **Passo 5: dar peso ao rótulo do hero**

O rótulo `Consultoria · Engenharia · Dados` já responde "o que é isso" — ele só está pequeno demais para ser lido antes da manchete. Depois da regra `.hero-copy` (linha 353), acrescente:

```css
  /* O rotulo do hero e a unica linha que diz o que a empresa faz antes da manchete.
     Nos outros usos de .lbl o tamanho padrao serve; aqui ele carrega peso. */
  .hero-copy > .lbl { font-size: 0.8125rem; color: var(--accent-500); }
```

- [ ] **Passo 6: rebaixar o CTA secundário**

Na linha 733, troque:

```html
              <a class="btn btn-lg btn-ghost" href="#como">Como trabalhamos</a>
```

por:

```html
              <a class="link-arrow" href="#como">Como trabalhamos <span class="arrow" aria-hidden="true">→</span></a>
```

- [ ] **Passo 7: mover a faixa de números para fora do hero**

Recorte o bloco inteiro `<div class="facts reveal-stagger"> … </div>` (linhas 758–777) de dentro do hero. Feche o hero logo depois do `</div>` do `.hero-grid`, e cole a faixa numa seção nova imediatamente após `</section>` do hero:

```html
  <!-- FAIXA DE NUMEROS -->
  <section class="strip">
    <div class="wrap">
      <div class="facts reveal-stagger">
        <div class="fact">
          <span class="fact-n">2 sócios</span>
          <span class="lbl">que atendem direto</span>
        </div>
        <div class="fact">
          <span class="fact-n">10 anos</span>
          <span class="lbl">cada um em tecnologia</span>
        </div>
        <div class="fact">
          <span class="fact-n">6 – 12</span>
          <span class="lbl">semanas por projeto</span>
        </div>
        <div class="fact">
          <span class="fact-n">Fechado</span>
          <span class="lbl">escopo e preço</span>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Passo 8: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

- [ ] **Passo 9: provar que a dobra cabe**

```sh
python3 -m http.server 4000 --directory public &
sleep 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --screenshot=/tmp/hero-375.png --window-size=375,667 http://localhost:4000/ 2>/dev/null
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --screenshot=/tmp/hero-1440.png --window-size=1440,900 http://localhost:4000/ 2>/dev/null
open /tmp/hero-375.png /tmp/hero-1440.png
```

Critério de aceite, em 375 px **sem rolar**: dá para responder "o que é isso" (rótulo) e "o que eu faço agora" (CTA de WhatsApp). Se o CTA não aparecer, o problema é o parágrafo `.hero-sub` — encurte o texto, não o `padding`.

- [ ] **Passo 10: commitar**

```sh
git switch -c feat/hero-above-the-fold
git add scripts/check-assets.mjs public/index.html
git commit -m "✨ feat: give the hero one primary action and free the fold" \
  -m "Dois botoes de peso igual competiam entre si, e a faixa de quatro numeros
empurrava o CTA para baixo da dobra em 375 px repetindo dado que aparece de novo
nas secoes 03 e 04.

O rotulo 'Consultoria · Engenharia · Dados' ganhou peso porque e a unica linha que
diz o que a empresa faz antes da manchete. A manchete em si nao mudou: e decisao de
texto, nao de layout.

O verificador passa a contar botao primario dentro do hero."
git push -u origin feat/hero-above-the-fold
gh pr create --fill
```

---

### Tarefa 7: alternância de fundo e um clímax

Resolve a maior parte da frente 5. Seis seções com a mesma densidade e o mesmo fundo, sem nada que sinalize "isto aqui é o mais importante" — o olho desiste antes do CTA final.

**Bug que esta tarefa tem que evitar:** o cartão `.honest` (linha 510) usa `background: var(--surface)`. Se a seção que o contém também virar `--surface`, o cartão desaparece. É por isso que `#risco` recebe tratamento de acento e não de superfície.

**Arquivos:**
- Modificar: `public/index.html` — CSS após linha 411, seções `#como` (804), `#quem` (895), `#risco` (951)

**Interfaces:**
- Consome: `--accent-100`, `--accent-200`, `--accent-500` da Tarefa 5. **Este é o primeiro consumo real da rampa** — ver o risco declarado na Tarefa 5.

- [ ] **Passo 1: adicionar as duas variantes de banda**

Depois da regra `.band:first-of-type` (linha 411):

```css
  /* Alternancia de fundo: cria respiro e sinaliza hierarquia sem mexer no conteudo.
     A borda superior sai quando o fundo muda — a mudanca de cor ja e a separacao. */
  .band-alt { background: var(--surface); border-top-color: transparent; }

  /* Climax da pagina. "Quando nao nos contratar" e o diferencial editorial, e era a
     secao mais escondida. Gasta o bloco de superficie do orcamento de 10 % de acento
     — um bloco, nao dois: nenhuma outra secao pode receber este tratamento. */
  .band-climax .honest {
    background: var(--accent-100);
    border-color: var(--accent-200);
    border-left: 3px solid var(--accent-500);
  }
```

- [ ] **Passo 2: aplicar nas seções**

- Linha 804: `<section class="band" id="como">` → `<section class="band band-alt" id="como">`
- Linha 895: `<section class="band" id="quem">` → `<section class="band band-alt" id="quem">`
- Linha 951: `<section class="band" id="risco">` → `<section class="band band-climax" id="risco">`

Não toque na seção 01 (linha 780), em `#servicos` (850) nem em `#contato` (982). O ritmo pretendido é papel → superfície → papel → superfície → **acento** → papel.

- [ ] **Passo 3: conferir nos dois temas, em dois tamanhos**

```sh
python3 -m http.server 4000 --directory public &
sleep 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for w in 375 1440; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=$w,2400 \
    --screenshot=/tmp/rhythm-$w.png http://localhost:4000/ 2>/dev/null
done
open /tmp/rhythm-375.png /tmp/rhythm-1440.png
```

Depois, no navegador, com o botão de tema no escuro, role a página inteira e confira:

- [ ] O cartão `.honest` **é visível** dentro de `#risco` nos dois temas (é o bug que esta tarefa evita)
- [ ] A alternância de fundo lê como ritmo, não como emenda mal-feita
- [ ] `#risco` é claramente a seção diferente da página
- [ ] Nenhuma outra seção ganhou acento — um bloco de superfície, não dois
- [ ] Rolando a página em ~10 segundos, dá para dizer quantas seções existem e qual é a mais importante

- [ ] **Passo 4: commitar**

```sh
git switch -c feat/section-rhythm
git add public/index.html
git commit -m "✨ feat: alternate section backgrounds and mark the climax" \
  -m "Seis secoes com a mesma densidade e o mesmo fundo. Sem hierarquia visual, o
olho desiste antes do CTA final.

'Quando nao nos contratar' virou o climax: e o diferencial editorial da pagina e era
a secao mais escondida. Gasta o bloco de superficie que o orcamento de 10 % de acento
liberou — um bloco, e nenhuma outra secao pode receber o mesmo tratamento.

#risco recebe acento e nao superficie de proposito: o cartao .honest ja usa
var(--surface), e uma secao --surface faria o cartao desaparecer."
git push -u origin feat/section-rhythm
gh pr create --fill
```

---

### Tarefa 8: medida de linha e uma citação de bloco

Fecha a parte de texto da frente 5. Dois parágrafos passam de 75 caracteres por linha em telas largas, e a melhor frase do site está enterrada em corpo de texto.

**Arquivos:**
- Modificar: `public/index.html` — CSS após linha 195, seção `#quem` (linha ~938)

- [ ] **Passo 1: limitar a medida dos parágrafos longos**

Depois da regra `.note` (linha 195):

```css
  /* Medida de leitura. Acima de ~75 caracteres por linha o olho perde a linha
     seguinte no retorno. .prose ja limita a 60ch; estes dois ficaram de fora. */
  .hero-sub { max-width: 46ch; }
  .band-in > .prose.note { max-width: 68ch; }
```

Note que `.hero-sub` já tem `max-width: 52ch` na linha 354 — esta regra vem depois e ganha por ordem de cascata. **Não** edite a linha 354: deixar as duas visíveis mostra a intenção de aperto no diff.

- [ ] **Passo 2: transformar a melhor linha em citação**

Ainda depois da regra `.note`:

```css
  /* Uma citacao de bloco na pagina inteira. Duas competiriam entre si. */
  .pull {
    font-family: var(--f-mono);
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: var(--tr-title);
    max-width: 34ch;
    margin: 0;
    padding-left: clamp(1rem, 2vw, 1.5rem);
    border-left: 2px solid var(--accent-500);
  }
```

Na seção `#quem`, localize o parágrafo que hoje começa com `Um de nós veio da mesa onde a decisão é tomada.` e troque a marcação por:

```html
        <blockquote class="pull reveal">
          <p>Um de nós veio da mesa onde a decisão é tomada. O outro, da mesa onde o sistema quebra.</p>
        </blockquote>
```

Confira no diff que a frase saiu do parágrafo antigo — ela **não pode aparecer duas vezes** na página.

- [ ] **Passo 3: conferir**

```sh
node scripts/check-assets.mjs
grep -c 'da mesa onde a decisão é tomada' public/index.html   # esperado: 1
```

Depois, no navegador em 1440 px: nenhuma linha de parágrafo passa de ~75 caracteres, e a citação lê como o ponto alto da seção.

- [ ] **Passo 4: commitar**

```sh
git switch -c feat/reading-measure-and-pullquote
git add public/index.html
git commit -m "✨ feat: cap reading measure and pull the best line out" \
  -m "Dois paragrafos passavam de 75 caracteres por linha em tela larga, onde o olho
perde a linha seguinte no retorno.

'Um de nos veio da mesa onde a decisao e tomada' e a melhor frase do site e estava
enterrada em corpo de texto. Uma citacao de bloco na pagina inteira — duas
competiriam entre si."
git push -u origin feat/reading-measure-and-pullquote
gh pr create --fill
```

---

### Tarefa 9: seção ativa na navegação

Último item da frente 5. A nav tem 3 links no desktop e 4 no mobile, e nenhum indica onde o visitante está.

**Arquivos:**
- Modificar: `scripts/check-assets.mjs`
- Modificar: `public/index.html` — CSS após linha 411, JS antes do fecho do IIFE (linha ~1101)

**Interfaces:**
- Consome: `temIO` e `reduz`, já declarados no IIFE (linhas 1073–1074). Reaproveite; não declare de novo.

- [ ] **Passo 1: escrever a asserção que falha**

Em `scripts/check-assets.mjs`, dentro do bloco `if (entry === 'index.html')`:

```js
    // Marcar a secao ativa so com cor exclui quem nao distingue cor e quem usa
    // leitor de tela. aria-current e o que carrega a informacao de verdade.
    if (source.includes('is-active') && !source.includes('aria-current')) {
      problems.push(`${entry}: secao ativa marcada sem aria-current`);
    }
```

- [ ] **Passo 2: adicionar o estilo**

Depois de `.band-climax .honest` (Tarefa 7):

```css
  /* Secao ativa. A regua e o sinal primario; a cor reforca. Cor sozinha nao serve. */
  .nav-links a.lbl.is-active,
  .nav-sm a.lbl.is-active {
    color: var(--fg);
    border-bottom: 1px solid var(--accent-500);
    padding-bottom: 0.15rem;
  }
```

- [ ] **Passo 3: implementar o observador**

No IIFE, imediatamente antes do observador do CTA da nav (o comentário `/* ---- CTA da nav ... */`):

```js
    /* ---- secao ativa na nav ----
       IntersectionObserver e nao listener de scroll: o listener dispara dezenas de
       vezes por segundo e cada disparo le layout, o que forca reflow. */
    var linksNav = document.querySelectorAll('.nav-links a.lbl[href^="#"], .nav-sm a.lbl[href^="#"]');
    if (temIO && linksNav.length) {
      var porId = {};
      for (var k = 0; k < linksNav.length; k++) {
        var id = linksNav[k].getAttribute('href').slice(1);
        (porId[id] = porId[id] || []).push(linksNav[k]);
      }

      var marcar = function (idAtivo) {
        for (var alvo in porId) {
          var ativo = alvo === idAtivo;
          for (var n = 0; n < porId[alvo].length; n++) {
            porId[alvo][n].classList.toggle('is-active', ativo);
            if (ativo) porId[alvo][n].setAttribute('aria-current', 'true');
            else porId[alvo][n].removeAttribute('aria-current');
          }
        }
      };

      /* A secao ativa e a que ocupa a faixa central da tela. Sem essa faixa, duas
         secoes visiveis ao mesmo tempo ficam piscando entre si. */
      var ioSecao = new IntersectionObserver(function (entradas) {
        for (var e = 0; e < entradas.length; e++) {
          if (entradas[e].isIntersecting) { marcar(entradas[e].target.id); return; }
        }
      }, { rootMargin: '-45% 0px -45% 0px' });

      for (var s in porId) {
        var secao = document.getElementById(s);
        if (secao) ioSecao.observe(secao);
      }
    }
```

- [ ] **Passo 4: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

- [ ] **Passo 5: verificar o comportamento**

Com o servidor local rodando, role a página devagar e confira:

- [ ] Exatamente **um** link fica marcado a cada momento — nunca dois, nunca zero depois da primeira seção
- [ ] A marcação não pisca na fronteira entre duas seções
- [ ] Navegando só pelo teclado (Tab), o foco continua visível e distinguível da marcação de ativo
- [ ] No inspetor, o link ativo tem `aria-current="true"` e os outros não têm o atributo
- [ ] Com `prefers-reduced-motion: reduce` ligado, tudo continua funcionando — a marcação não é animação, e não deve desaparecer

- [ ] **Passo 6: commitar**

```sh
git switch -c feat/active-section-nav
git add scripts/check-assets.mjs public/index.html
git commit -m "✨ feat: mark the active section in the nav" \
  -m "A nav tinha 3 links no desktop e 4 no mobile, e nenhum dizia onde o visitante
estava.

IntersectionObserver com faixa central de 10 % da tela, e nao listener de scroll:
listener dispara dezenas de vezes por segundo e cada disparo le layout. A faixa
estreita evita o piscar quando duas secoes aparecem juntas.

A regua e o sinal primario e aria-current carrega a informacao — cor sozinha exclui
quem nao distingue cor e quem usa leitor de tela."
git push -u origin feat/active-section-nav
gh pr create --fill
```

---

# Fase D — quando o domínio existir

### Tarefa 10: trocar a origem para o domínio próprio

Só execute depois que `dig +short A fontislabs.com.br` retornar os IPs do Pages.

**Arquivos:**
- Modificar: `scripts/check-assets.mjs` (`SITE_ORIGIN`)
- Modificar: `public/index.html` (`canonical`, `og:url`, `og:image`)
- Criar: `public/CNAME`
- Modificar: `README.md`

- [ ] **Passo 1: conferir o DNS antes de qualquer coisa**

```sh
dig +short A fontislabs.com.br
dig +short MX fontislabs.com.br
```

O primeiro tem que retornar `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. Se vier vazio, **pare** — o passo anterior é DNS, não código.

O segundo diz se `contato@fontislabs.com.br` passou a receber mensagem. Se vier vazio, o e-mail continua morto e o WhatsApp segue sendo o único contato real.

- [ ] **Passo 2: criar o CNAME**

```sh
printf 'fontislabs.com.br\n' > public/CNAME
```

- [ ] **Passo 3: trocar a origem no verificador**

```js
const SITE_ORIGIN = 'https://fontislabs.com.br';
```

- [ ] **Passo 4: rodar e confirmar que falha**

```sh
node scripts/check-assets.mjs
```

Esperado: 3 problemas de `origem fora da canonica` — `canonical`, `og:url` e `og:image` ainda apontam para a URL do Pages.

- [ ] **Passo 5: trocar os três `<meta>`**

```html
<link rel="canonical" href="https://fontislabs.com.br/">
<meta property="og:url" content="https://fontislabs.com.br/">
<meta property="og:image" content="https://fontislabs.com.br/assets/og/fontis-og.png">
```

- [ ] **Passo 6: rodar e confirmar que passa**

```sh
node scripts/check-assets.mjs
```

Esperado: `check-assets: ok`

- [ ] **Passo 7: atualizar o README**

Na tabela do topo, `No ar agora` passa a ser `https://fontislabs.com.br`, e a seção *Ligar o domínio próprio* vira histórico — reduza a uma linha dizendo que foi feito e em que data.

- [ ] **Passo 8: commitar e, depois do deploy, forçar o Pages**

```sh
git switch -c chore/switch-to-own-domain
git add public/CNAME scripts/check-assets.mjs public/index.html README.md
git commit -m "🚀 chore: switch site origin to the registered domain" \
  -m "DNS delegado e apontando para o Pages. A origem canonica passa a ser o dominio
proprio, e o CNAME faz o Pages adotar o endereco no proximo deploy."
git push -u origin chore/switch-to-own-domain
gh pr create --fill
```

Depois do merge e do deploy: em *Settings → Pages*, confirme o domínio customizado e marque **Enforce HTTPS** quando o certificado sair. Por último, refaça o *Scrape Again* no Sharing Debugger — o card antigo aponta para a URL do Pages e fica em cache.

---

## Fora de escopo, e por quê

**Frente 7 da issue — imagens e vitrine de projetos.** Bloqueada no insumo D: não existe case para mostrar. Carrossel sem projeto vira placeholder, ou pior, sugere trabalho que não aconteceu — e contradiz a seção *Quando não nos contratar* três telas acima. Quando houver o primeiro case, a recomendação registrada na issue continua valendo: **grade estática, não carrossel** (engajamento cai fora do primeiro slide, e o custo de acessibilidade é real), com `width`/`height` explícitos, AVIF ou WebP, e `loading="lazy"` só abaixo da dobra.

**Neutro quente para superfície secundária** (item da frente 6). A Tarefa 5 entrega a rampa e as funcionais, mas não o neutro quente — e é omissão consciente, não esquecimento. `--surface` já existe, e a Tarefa 7 o usa nas bandas alternadas; um segundo tom de superfície não tem onde ser gasto hoje. Introduzi-lo agora criaria exatamente o token morto que a Tarefa 5 critica no `--accent-soft`. Ele entra quando aparecer o primeiro componente que precise de dois níveis de superfície na mesma tela — cartão dentro de banda alternada, provavelmente.

**Reescrever a manchete do hero.** A Tarefa 6 resolve o layout do hero. Trocar `Cresceu além da planilha.` é decisão de texto, e a linha atual é boa — mudá-la sem uma alternativa testada é risco sem retorno. Se for para mexer, abra issue própria com duas ou três alternativas escritas.

**CNPJ no rodapé.** A Tarefa 1 remove o placeholder. Recolocar o número real é tarefa de quando a empresa estiver aberta, não de código.

**Registrar o domínio e configurar e-mail.** Não é trabalho de repositório. Mas é o único item desta lista que hoje deixa a empresa sem caixa de entrada — trate como prioridade acima de qualquer tarefa aqui.

## Ordem de execução recomendada

```
Tarefa 2  (WhatsApp)          ← restabelece contato. Faça primeiro.
Tarefa 1  (placeholder)          independente, 10 minutos
Tarefa 3  (origem + meta)     ┐
Tarefa 4  (imagem OG)         ┘ 4 depende de 3
Tarefa 5  (tokens de cor)     ← base da Fase C
Tarefa 6  (hero)              ┐
Tarefa 7  (ritmo)             │ dependem de 5; 7 depende de 6 na seção 01
Tarefa 8  (medida, citação)   │
Tarefa 9  (nav ativa)         ┘ depende de 7 (posição da regra CSS)
Tarefa 10 (domínio)           ← quando o DNS existir
```

Cada tarefa é um PR. Nenhuma delas quebra a anterior se for revertida sozinha.
