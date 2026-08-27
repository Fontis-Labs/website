# website

Site institucional da Fontis Labs — **https://fontislabs.com.br**.

HTML e CSS escritos à mão, sem framework, sem build e sem dependência de runtime. É
uma decisão, não preguiça: uma página só, que tem que carregar rápido no 4G de quem
abriu o link no celular, não justifica um pipeline de build para manter.

## Estrutura

```
public/                      raiz publicada — o que está aqui é o que vai para a web
├── index.html               a página inteira (marcação, estilo e script inline)
├── favicon.ico              legado, com 16/32/48 embutidos
├── site.webmanifest         nome, cor e ícones do app instalável
├── robots.txt               libera indexação e aponta o sitemap
├── sitemap.xml              uma URL só; atualize o lastmod ao mexer no conteúdo
├── CNAME                    domínio customizado do GitHub Pages
└── assets/
    ├── fontis-icon.svg      favicon vetorial
    ├── icons/               PNG para iOS e para o manifest
    └── fonts/               JetBrains Mono e IBM Plex Sans (variáveis, subset latin)
scripts/check-assets.mjs     valida referências locais, TLS e domínio canônico
```

## Rodar localmente

Qualquer servidor estático serve. Precisa ser servidor de verdade, e não abrir o
arquivo com `file://` — os caminhos são absolutos (`/assets/...`) e o manifest e as
fontes não carregam de outro jeito.

```sh
python3 -m http.server 4000 --directory public
# abre em http://localhost:4000
```

## Antes de commitar

```sh
node scripts/check-assets.mjs
```

Ele quebra se o HTML apontar para um arquivo que não existe, se aparecer uma URL em
`http://` ou se algum link usar um domínio diferente do canônico.

## Como publicar

A publicação é no **GitHub Pages**, a partir do diretório `public/`. Três passos, nesta
ordem — o workflow está em `workflow_dispatch` de propósito, para não falhar em
vermelho a cada commit enquanto o domínio não existe.

1. **Registrar `fontislabs.com.br`** e apontar o DNS para o Pages:
   - `A` na raiz para `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` na raiz para `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` de `www` para `fontis-labs.github.io`
2. **Settings → Pages** neste repositório: em *Source*, escolher **GitHub Actions**.
   Confirmar o domínio customizado e marcar *Enforce HTTPS* assim que o certificado sair.
3. **Actions → deploy → Run workflow.** Deu certo? Descomente o gatilho `push` em
   `.github/workflows/deploy.yml` e o site passa a publicar sozinho a cada commit na `main`.

### Trocar de hospedagem depois

Nada aqui é específico do GitHub Pages além de `public/CNAME` e do workflow. Para
Cloudflare Pages, Netlify ou Vercel: diretório de publicação `public`, comando de build
vazio. É uma configuração de 10 minutos, não uma migração.

## Ao editar o conteúdo

- Todo texto visível é **PT-BR**; classes, ids e nomes de arquivo são **inglês**.
- O tema claro é o padrão e o escuro vem de `prefers-color-scheme`, com o toggle salvo
  em `localStorage`. O script que aplica o tema roda antes da primeira pintura — se
  você movê-lo para depois do `<body>`, quem usa o escuro passa a ver um flash branco.
- O acento ametista fica limitado a ~5% da área da tela. Roxo em área grande fica brega
   — isso está no guia de marca, não é preferência de quem editou por último.
- Mudou de seção ou de proposta? Atualize a `<meta name="description">`, as tags `og:` e
  o `lastmod` do `sitemap.xml` no mesmo commit.

## Pendências conhecidas

- **CNPJ** no rodapé está como `[a definir]`.
- **Nenhum case citado.** É honesto para uma empresa de agosto de 2026, e é a primeira
  coisa que um visitante procura. Vale priorizar assim que o primeiro projeto fechar.

## Licenças

O conteúdo, o texto e a identidade visual são da Fontis Labs — todos os direitos
reservados. As fontes são de terceiros sob SIL Open Font License 1.1, com o texto da
licença em `public/assets/fonts/`: **JetBrains Mono** (JetBrains s.r.o.) e **IBM Plex
Sans** (IBM Corp.).
