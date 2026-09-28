# Emerald TCG Finder

Extensão para Firefox que identifica cartas Pokémon TCG da **Pokédex do Emerald** (set ex9) em sites de TCG brasileiros e destaca com badge do Rayquaza.

## Funcionalidades

- ⚡ **Identificação Emerald**: Detecta automaticamente Pokémon da Pokédex do Emerald (202 Pokémon) em sites de TCG
- 🏅 **Badge do Rayquaza**: Adiciona um selo verde e dourado no canto superior direito das cartas Emerald
- 🚦 **Indicador de Preço na Listagem**: A borda do selo do Rayquaza muda de cor comparando o preço da oferta com o **preço médio da Liga Pokemon** pra mesma edição e variante (normal/Foil/Reverse): verde (abaixo), amarelo (perto) ou vermelho (acima). Clique no selo pra ver o médio numa etiqueta
- 🏷️ **Preço da Liga na Página da Carta**: Nas lojas da mesma engine (Turno Zero, Freitas, Meruru...), a página do item mostra, pra cada variante da tabela (edição + idioma + qualidade + extras exatos):
  - **anúncios iguais na Liga** agora: mín. / méd. / máx. (só os anúncios com preço em texto — a Liga oculta parte deles numa imagem, o painel diz quantos)
  - **referência geral da edição** na Liga (mín. / médio / máx., qualquer idioma/qualidade)
  - **últimas 5 vendas** realizadas iguais, com a média (exige login na Liga — as vendas são buscadas pela aba oculta da Liga com a sua sessão)
- ✅ **Selo de veredito ao lado do nome** (ex.: `Treecko (#055/∞) ✓`): compara o preço da loja com a média das últimas vendas iguais (sem vendas: média dos anúncios iguais; sem anúncios: médio geral) — **✓ verde** mais de 5% abaixo (compensa), **− amarelo** até 10% acima (na média), **✕ vermelho** mais de 10% acima
- ⚡ **Modo APENAS EMERALD**: Oculta itens que não pertencem à Pokédex do Emerald
- 📋 **Modo APENAS FALTANDO**: Oculta cartas que você já possui no Emerald TCG Tracker
- 💰 **Comparação de Preços**: No carrinho, mostra o **mín. e o médio da Liga Pokemon** ao lado de cada carta (cor comparando com o preço do carrinho) e a loja suportada mais barata com **exatamente** o mesmo idioma e estado de conservação
- 🔄 **Sincronização do Tracker**: Carrega save do Emerald TCG Tracker via link de compartilhamento

## Sites Suportados

- [freitastcg.com.br](https://www.freitastcg.com.br)
- [ligapokemon.com.br](https://www.ligapokemon.com.br)
- [ligamagic.com.br](https://www.ligamagic.com.br)
- [colecionageek.com](https://www.colecionageek.com)
- [funtako.com.br](https://funtako.com.br)
- [www.rasengan.com.br](https://www.www.rasengan.com.br)
- [pokemonstore.com.br](https://www.pokemonstore.com.br)
- [magicdomain.com.br](https://www.magicdomain.com.br)
- [cardgame.com.br](https://www.cardgame.com.br)
- [mox.com.br](https://www.mox.com.br)
- [gamepod.com.br](https://www.gamepod.com.br)
- [playground.com.br](https://www.playground.com.br)
- [cardshall.com.br](https://www.cardshall.com.br)
- [supernovahobbystore.com.br](https://www.supernovahobbystore.com.br)
- [epicgame.com.br](https://www.epicgame.com.br)
- [epicone.com.br](https://www.epicone.com.br)
- [meruru.com.br](https://www.meruru.com.br)
- [lojadokooper.com.br](https://www.lojadokooper.com.br)
- [viptcg.com](https://www.viptcg.com)
- [reidotcg.com](https://www.reidotcg.com)
- [jimmietcg.com.br](https://www.jimmietcg.com.br)
- [stoptcg.com.br](https://www.stoptcg.com.br)
- [manycollections.com.br](https://www.manycollections.com.br)
- [gajosocollectors.com.br](https://www.gajosocollectors.com.br)
- [daiverso.com.br](https://www.daiverso.com.br)
- [sugoitcg.com.br](https://www.sugoitcg.com.br)
- [mypcards.com](https://mypcards.com)
- [omgtcg.com.br](https://omgtcg.com.br)
- [muitocolecionaveis.com.br](https://www.muitocolecionaveis.com.br)
- [kamusari.com.br](https://www.kamusari.com.br)
- [bazardebagda.com.br](https://www.bazardebagda.com.br)
- [cardsofparadise.com.br](https://www.cardsofparadise.com.br)
- [chucktcg.com.br](https://www.chucktcg.com.br)
- [flowstore.com.br](https://www.flowstore.com.br)
- [kinoenecards.com.br](https://www.kinoenecards.com.br)
- [montshop.com.br](https://www.montshop.com.br)
- [playgroundgames.com.br](https://www.playgroundgames.com.br)
- [ugcardshop.com.br](https://www.ugcardshop.com.br)
- [xplace.com.br](https://www.xplace.com.br)
- [turnozerotcg.com.br](https://www.turnozerotcg.com.br)
- [vilacelta.com.br](https://www.vilacelta.com.br)

## Instalação

### Modo Desenvolvedor (Firefox)

1. Abra o Firefox e digite `about:debugging#/runtime/this-firefox` na barra de endereços
2. Clique em **"Carregar extensão temporária..."**
3. Navegue até a pasta `gen3-extension` e selecione o arquivo `manifest.json`
4. A extensão será carregada e aparecerá na lista

### Uso

1. Acesse qualquer site de TCG brasileiro listado acima
2. As cartas da Pokédex do Emerald terão um badge do Rayquaza no canto superior direito
3. Use o popup da extensão para:
   - **⚡ Apenas Emerald**: Oculta itens que não são da Pokédex do Emerald
   - **📋 Apenas Faltando**: Oculta cartas que você já possui (requer sincronização com o Tracker)
   - **🔄 Sincronizar cartas faltantes**: Cole o link de compartilhamento do Tracker e sincroniza na hora
   - **🔍 Escanear página**: Re-processa a página atual

### Sincronização com o Tracker

1. Acesse o [Emerald TCG Tracker](https://joaogazire.github.io/gen3-track-tcg/src/)
2. Clique em **Compartilhar** no Tracker
3. Copie o link gerado (formato: `https://joaogazire.github.io/gen3-track-tcg/src/#c=...`)
4. Na extensão, na seção **Sincronizar com o Tracker**, cole o link no campo
5. Clique em **🔄 Sincronizar cartas faltantes** — a extensão carrega o save, liga
   o filtro **Apenas Faltando** e já aplica na aba atual
6. Da próxima vez, clicar em sincronizar de novo sem colar um link reaproveita o
   último save carregado

### De onde vem o preço da Liga Pokemon

A referência é o **menor / médio / maior** que a própria Liga calcula por edição e
por variante (normal, Foil, Reverse Foil) — lido do JSON `cards_editions` da página
da carta. Os preços de cada anúncio não são usados: a Liga ofusca a maioria deles
num sprite de imagem, então uma média feita pela extensão sairia enviesada. Essa
referência **não separa idioma nem conservação**.

A carta é buscada pelo nome no formato do cadastro da Liga (`Gardevoir ex (233/091)`,
`Mudkip (#057/∞)`). Nas lojas da mesma engine, a edição exata vem do link da edição
(`txt_edicao=`, mesmo id da Liga). Se a Liga devolver uma carta sem impressão com o
mesmo número, nada é mostrado.

A busca na Liga sai do **background script**, não do site da loja (no Firefox, o
isolamento de cookies por site faz uma requisição feita de dentro da loja chegar na
Liga sem a sessão dela). O Cloudflare da Liga desafia as páginas de carta, então a
busca tem dois caminhos:

1. **Requisição direta** — rápida, funciona quando o navegador já tem a liberação do
   Cloudflare pra Liga;
2. **Aba oculta** — se vier o desafio, a extensão abre a página da carta numa aba
   oculta e inativa (permissão `tabHide`), deixa o navegador passar pelo desafio
   automático como numa visita normal, lê a página e reaproveita a aba nas próximas
   buscas (uma por vez). A aba fecha sozinha depois de 1 minuto sem uso.

Se o Cloudflare pedir o desafio **interativo** (a caixinha "sou humano"), não dá pra
passar sozinho: o painel mostra um link **Abrir a carta na Liga** — clique, passe pela
verificação e recarregue a página da loja.

### Comparação de Preços no Carrinho

1. Adicione cartas ao carrinho em qualquer site suportado
2. Acesse a página do carrinho
3. A extensão busca automaticamente o menor preço pra mesma carta na **Liga Pokemon**
   e em todas as outras lojas suportadas, com o **mesmo idioma e exatamente a mesma
   conservação** (ex: Português + Near Mint só compara com Português + Near Mint).
   Nas lojas de vendedor único (todas exceto Liga Pokemon), só entram na comparação
   os casos em que dá pra garantir a mesma conservação com segurança: Near Mint e
   Danificada/Damaged — os níveis intermediários (Slightly/Moderately/Heavily
   Played) usam uma escala diferente da Liga Pokemon e ficam de fora pra não simular
   uma correspondência que não existe
4. Se o carrinho mostrar o código de edição/coleção da carta (ex: `010/165`), a extensão usa esse código pra comparar com a **mesma edição exata** — evita comparar, por exemplo, um Charizard de um set com o preço de um Charizard de outro set. Nas lojas de vendedor único, o código da edição é obrigatório (sem ele, essas lojas são puladas); na Liga Pokemon, sem o código ainda dá pra comparar só pelo nome
5. O preço é exibido ao lado direito do nome da carta, separado por uma barra:
   - `Blaziken / R$ 45,00` (verde) → match exato por edição, idioma e conservação — passe o mouse pra ver de qual loja veio o preço
   - `Blaziken ~ / R$ 45,00` (âmbar) → o carrinho não mostrou o código da edição, então a comparação foi feita só pelo nome na Liga Pokemon (pode ser uma edição diferente)
   - Quando mais de uma fonte bate exatamente idioma+conservação (+edição), aparece
     também o **preço justo** (média entre elas): `Blaziken / R$ 45,00 · justo R$ 52,30`
     — o tooltip mostra quantas lojas entraram nessa média
6. Se nenhuma fonte tiver um anúncio com idioma e conservação idênticos (e edição, quando aplicável), nada é exibido para aquela carta
7. Além do preço pedido pelos anúncios ativos, a extensão também busca o histórico de
   **Últimas Vendas** da Liga Pokemon (preço de venda já **realizada**, não só pedido) para a
   mesma edição, idioma e conservação **Near Mint** (única conservação aceita aqui — os
   níveis intermediários usam uma escala diferente e ficam de fora, mesmo critério das
   lojas de vendedor único). Quando encontrada, some ao tooltip do preço (`vendido
   recentemente: méd. R$ X`); se nenhum anúncio ativo bater os critérios mas houver
   vendas recentes, aparece um selo cinza `vendido ~ R$ X` sozinho
   > ⚠️ Essa parte específica (Últimas Vendas) foi implementada a partir da estrutura HTML
   > de uma página específica, sem conseguir testar contra o site ao vivo (bloqueio do
   > Cloudflare no meio do desenvolvimento) — confirme se está funcionando antes de confiar
   > nela; se o seletor não bater, ela simplesmente não mostra nada (mesmo comportamento de
   > qualquer fonte indisponível), sem quebrar o resto da comparação

**Observação:** a Liga Pokemon e as lojas suportadas usam proteção Cloudflare contra acesso automatizado. A busca só funciona se o seu navegador já tiver uma sessão válida no site (ex: você já visitou o site normalmente antes). Se uma fonte bloquear o acesso, a extensão detecta isso, para de tentar só naquela fonte pro resto da sessão e avisa no console (F12) — as outras fontes continuam funcionando normalmente.

### Indicador de Preço na Listagem

1. Ao navegar em qualquer site suportado, cada carta Emerald identificada recebe o selo do Rayquaza normalmente
2. Em segundo plano (uma carta por vez, sem travar a página), a extensão busca **todos os anúncios da mesma carta na Liga Pokemon** — mesma edição (quando o código tipo `010/165` aparece no card), idioma e conservação — e calcula o **preço justo**: a média entre esses anúncios (não só o mais barato, pra um anúncio isolado fora da curva não distorcer a comparação)
3. Quando a comparação chega, a borda do selo muda de cor:
   - 🟢 **Verde**: preço da oferta ≤ 90% do preço justo (abaixo do mercado)
   - 🟡 **Amarelo**: preço entre 90% e 110% do preço justo (preço justo)
   - 🔴 **Vermelho**: preço ≥ 110% do preço justo (acima do mercado)
4. **Clique no selo** pra revelar uma etiqueta com o valor do preço justo embaixo dele (clique de novo pra esconder); passe o mouse sobre o selo com a etiqueta aberta pra ver o preço da oferta e quantos anúncios entraram na média
5. Se o card não mostrar um preço reconhecível, ou a Liga Pokemon não tiver nenhum anúncio com idioma/conservação/edição idênticos, o selo fica com a borda dourada padrão e o clique não revela nada (sem comparação)

A referência de mercado usada é só a Liga Pokemon (não as lojas de vendedor único), pra não disparar dezenas de requisições por carta numa página de listagem com muitos itens — diferente da comparação no carrinho, que tem poucos itens e pode se dar ao luxo de consultar todas as lojas. Os preços buscados ficam em cache (`browser.storage.local`) por 20 minutos, então navegar entre páginas de listagem ou ir da listagem pro carrinho reaproveita buscas recentes da mesma carta em vez de repetir a requisição.

Nas lojas de vendedor único (mesma engine — freitastcg, meruru, stoptcg, etc.), o preço da listagem vem ofuscado em sprite CSS (técnica anti-scraping: os dígitos não existem como texto no HTML). Quando isso acontece, a extensão abre em segundo plano a página do próprio item (link já presente no card) pra ler o preço em texto normal — mesma fila serial e mesmo throttling da comparação com a Liga Pokemon, só que como um passo a mais antes dela.

## Estrutura

```
gen3-extension/
├── manifest.json          # Manifest V2 da extensão
├── background.js          # Background script (comunicação)
├── content/
│   ├── content.js         # Script de conteúdo (badges, filtros, preços)
│   └── content.css        # Estilos dos badges
├── popup/
│   ├── popup.html         # HTML do popup
│   └── popup.js           # Lógica do popup (sincronização)
├── vendor/
│   └── lz-string.min.js   # Biblioteca para descomprimir saves
├── icons/
│   ├── rayquaza_logo.png  # Ícone da extensão (toolbar/about:addons)
│   └── rayquaza_badge.png # Badge aplicado nas cartas Emerald
└── README.md
```

## Pokédex do Emerald (202 Pokémon)

A extensão identifica todos os 202 Pokémon da Pokédex do Emerald, incluindo:

- **Iniciais**: Treecko, Torchic, Mudkip e evoluções
- **Lendários**: Kyogre, Groudon, Rayquaza, Regirock, Regice, Registeel, Latias, Latios
- **Míticos**: Jirachi, Deoxys
- **E muitos outros**: Ralts, Absol, Salamence, Metagross, etc.

## Dados do Tracker

O save do Tracker vem comprimido com LZString no hash do link (`#c=...`). A extensão
lê os dois formatos que o Tracker já produziu:

- **v2 (atual)**: payload compacto `2:<estampa em base36>:<entradas>` — cada entrada é
  `<delta-do-índice-na-roster em base36>[.<índice-da-variante>[.<código de conservação>]]`,
  entradas separadas por vírgula
- **v1 (legado)**: JSON `{v:1, g:"<estampa ISO>", c:[[rosterIndex, assetIndex?, finishCode?]]}`
  — ainda aceito para não quebrar links compartilhados antes da migração para v2

Códigos de conservação:
- 0: Normal
- 1: Holo
- 2: Reverse
- 3: Reverse Holo
- 4: Full Art
- 5: Secret
- 6: Shiny

## Customização

### Adicionar Sites

Para adicionar novos sites, edite `manifest.json` e adicione o padrão em `content_scripts.matches`:

```json
"*://*.novo-site.com.br/*"
```

### Alterar Badge

O badge do Rayquaza pode ser substituído trocando o arquivo `icons/rayquaza_badge.png`.

## Limitações

- Requer conexão com a internet para buscar preços nas lojas suportadas
- A detecção de Pokémon depende do nome estar visível no card
- Páginas de detalhes individuais não têm filtros aplicados (para não quebrar a exibição)
- Nas lojas de vendedor único, a comparação de preço só funciona com o código da
  edição visível no carrinho, e só compara Near Mint e Danificada/Damaged (ver
  "Comparação de Preços no Carrinho")

## Licença

MIT © João Gazire
