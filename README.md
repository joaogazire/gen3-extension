# Emerald TCG Finder

Extensão para Firefox que identifica cartas Pokémon TCG da **Pokédex do Emerald** (set ex9) em sites de TCG brasileiros e destaca com badge do Rayquaza.

## Funcionalidades

- ⚡ **Identificação Emerald**: Detecta automaticamente Pokémon da Pokédex do Emerald (202 Pokémon) em sites de TCG
- 🏅 **Badge do Rayquaza**: Adiciona um selo verde e dourado no canto superior direito das cartas Emerald
- 🚦 **Indicador de Preço na Listagem**: À esquerda do preço de cada carta Emerald aparece um selo comparando a oferta com o **preço médio da Liga Pokemon** pra mesma edição e variante (normal/Foil/Reverse): **✓ verde** (abaixo), **− amarelo** (perto) ou **✕ vermelho** (acima). Quando não dá pra comparar, aparece um **? cinza** com o motivo ao passar o mouse (a Liga não tem a carta/impressão, preço da loja ilegível, verificação da Liga). O selo do Rayquaza fica no alto da carta, logo abaixo do símbolo de energia; clique nele pra ver o médio numa etiqueta
- 🏷️ **Preço da Liga na Página da Carta**: Nas lojas da mesma engine (Turno Zero, Freitas, Meruru...), a página do item mostra uma barra de progresso com um Pikachu correndo enquanto busca na Liga (abrindo a carta, lendo os preços ocultos, últimas vendas) e depois, pra cada variante da tabela (edição + idioma + qualidade + extras exatos):
  - **anúncios iguais na Liga** agora: mín. / méd. / máx. e os 3 mais baratos, **com os preços que a Liga esconde em imagem** (ver "Preços ocultos da Liga"), sem contar o anúncio da própria loja aberta, e a posição do preço desta loja entre eles
  - o nome/descrição da variante é um **link pra carta na Liga** (já na edição e número exatos)
  - **últimas 5 vendas** realizadas iguais, com a média (exige login na Liga — as vendas são buscadas pela aba oculta da Liga com a sua sessão)
- 🧾 **Mesmo layout de preço na página da carta**: na tabela de variantes, o selo ✓ / − / ✕ fica à esquerda de cada preço (com a % da referência à direita), e os "Cards Associados" ganham o selo do Rayquaza e o selo de preço iguais aos da busca
- ✅ **Selo de veredito ao lado do nome** (ex.: `Treecko (#055/∞) ✓`): compara o preço da loja com a média das últimas vendas iguais (sem vendas: média dos anúncios iguais, se todos os preços foram lidos; senão: médio geral) — **✓ verde** mais de 5% abaixo (compensa), **− amarelo** até 10% acima (na média), **✕ vermelho** mais de 10% acima
- 🐭 **Mini Pikachu de progresso**: No canto inferior direito da busca, um Pikachu correndo conta as cartas já comparadas com a Liga (ex.: `5/12`). Quando termina, depois de 3 s mostra um resumo (✓ com preço · ✕ sem comparação, e o motivo: sem preço na Liga, sem preço na loja, verificação da Liga) e some depois de 10 s; o × fecha a qualquer momento
- ⚡ **Modo APENAS EMERALD**: Oculta itens que não pertencem à Pokédex do Emerald
- 📋 **Modo APENAS FALTANDO**: Oculta cartas de Pokémon que você já possui no Emerald TCG Tracker (o Tracker guarda uma carta por Pokémon, então qualquer impressão de um Pokémon já coletado é ocultada). Com ele ligado, as cartas ocultadas também não têm o preço buscado na Liga (a busca fica só pras que faltam); ao desligar, elas entram na fila. A busca de preço já é só pras cartas Emerald, com ou sem o modo Apenas Emerald
- 💰 **Preços no Carrinho**: Em cada carta do carrinho, o **mín. e o médio da Liga Pokemon** (mesma edição, idioma, qualidade e extras) e o selo ✓ / − / ✕ comparando com o preço unitário
- 🏷️ **Preço da Liga no Tracker**: com a extensão instalada, o preço do Emerald TCG Tracker (grade, soma da coleção, modal e ordenação das variantes) passa a ser o **médio da Liga Pokemon** de cada impressão (mín./méd./máx. no tooltip, clique abre a carta na Liga). Usa a mesma busca por Pokémon das lojas (uma requisição por Pokémon, fila e pausas do background, cache de 24 h — e aproveita o cache das lojas). O site casa a impressão pelo número **e** total da coleção e usa o TCGplayer só quando a Liga não tem a impressão. Ver `content/tracker-prices.js`
- 🔄 **Sincronização automática com o Tracker**: abrir o Emerald TCG Tracker no mesmo navegador sincroniza a coleção sozinho (a cada clique), com a **impressão** de cada carta; nas lojas, o selo do Rayquaza ganha o aviso **na coleção** (a mesma impressão) ou **outra versão** (você tem o Pokémon em outra impressão). O link de compartilhamento continua como alternativa

## Sites Suportados

A **Liga Pokemon** é a fonte dos preços de referência, não um site onde a extensão
mexe: as páginas da Liga ficam intactas (sem selo nem filtros). As lojas abaixo
recebem o selo, os filtros e as comparações.

- [freitastcg.com.br](https://www.freitastcg.com.br)
- [colecionageek.com](https://www.colecionageek.com)
- [funtako.com.br](https://funtako.com.br)
- [rasengan.com.br](https://www.rasengan.com.br)
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
- [tcgebrinquedos.com.br](https://www.tcgebrinquedos.com.br)
- [Tokyo Cards](https://www.ligamagic.com.br/?view=ecom/itens&id=634008&tcg=2) — loja virtual na LigaMagic (a extensão só age nas páginas de loja, `view=ecom/...`)

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

**Automática (recomendado):** abra o [Emerald TCG Tracker](https://joaogazire.github.io/gen3-track-tcg/src/)
neste navegador. A extensão lê a coleção que o Tracker salva no navegador e, pelo catálogo
dele, a **impressão** marcada de cada Pokémon (coleção, número e total — ex.: Emerald
#56/106). Enquanto o Tracker estiver aberto, cada carta marcada chega nas lojas em poucos
segundos, inclusive em abas de loja já abertas. O popup mostra quando foi a última
sincronização.

Nas lojas, cada carta Emerald que você já tem mostra, embaixo do selo:

- **na coleção** (verde) — é a mesma impressão do Tracker
- **outra versão** (amarelo) — você tem esse Pokémon, mas em outra impressão (passe o
  mouse pra ver qual)

A impressão é casada pelo número **e** pelo total da coleção: só o número não basta (1 em
5 impressões repete o número de outra coleção do mesmo Pokémon). Promos (`∞`) só casam com
promos. Sem o total da coleção (exclusivas japonesas), o aviso diz só que você tem o Pokémon.

**Por link (alternativa):** clique em **Compartilhar** no Tracker, cole o link no popup e
clique em **🔄 Sincronizar cartas faltantes**. Esse caminho traz só quais Pokémon você tem,
sem a impressão.

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

### Preços ocultos da Liga

A Liga manda em texto o preço de só alguns anúncios; nos outros, cada dígito é
um pedaço de uma imagem de números gerada a cada carregamento, com os dígitos
embaralhados e em fontes misturadas. A extensão lê essa imagem no background
(`ocr/liga-ocr.js`): cada dígito é comparado com as células de uma imagem de
referência rotulada (`ocr/liga-digits-ref.jpg`) e fica com o rótulo da mais
parecida.

Conferência: a Liga informa a posição de cada anúncio na ordem de preço (`p`).
Se os preços lidos (junto com os que vêm em texto) não subirem nessa mesma
ordem, a leitura da página inteira é descartada e os preços continuam ocultos —
melhor não mostrar do que mostrar errado. Nos testes (6 páginas, 5.700+
anúncios, imagens diferentes) todos os preços saíram na ordem certa.

Detalhes do cadastro que a extensão usa:
- **extras** de um anúncio são o produto dos ids (primos) dos extras: Foil = 2,
  Promo = 7, então 14 = Foil + Promo. "Promo" não conta na comparação (vem da
  própria edição e as lojas nem sempre marcam)
- **lj_id** é a loja do anúncio; nas lojas da mesma engine o id aparece na
  própria página (link do carrinho `?view=ecom/carrinho&id=...`), e é assim que o
  anúncio da loja aberta sai da conta

### Preços no Carrinho

Nas lojas da mesma engine, o carrinho ganha uma coluna **Tracker** (entre Produto e
Quantidade, com a mesma fonte das outras colunas). Em cada linha, centralizado nela, um
card com **mín.** e **méd.** da Liga e o selo **✓ / − / ✕** comparando o **preço
unitário** do carrinho com o médio. O valor do **mín.** é um link pra carta na Liga, já
na edição e número exatos:

- A referência é a dos **anúncios iguais** na Liga — mesma edição (o carrinho traz o id
  da edição), idioma, qualidade e extras (Foil etc.), sem contar o anúncio da própria
  loja — quando todos os preços foram lidos; senão, a referência geral da
  edição/variante. Passe o mouse pra ver qual foi usada
- Carta já buscada nas **últimas 2 horas** (na busca, na página da carta ou no próprio
  carrinho) vem do cache, sem consultar a Liga de novo
- Sem comparação possível, aparece **? sem preço** com o motivo no tooltip
- O mini Pikachu conta as cartas do carrinho

Só a Liga é consultada. Versões antigas também procuravam a carta em todas as outras
lojas suportadas (até 2 requisições por loja por carta) — isso levava as lojas a
bloquear o IP (erro 1015) e foi removido. Em sites de outra engine, a etiqueta com o
mín./médio da Liga aparece ao lado do nome da carta.

### Indicador de Preço na Listagem

1. Ao navegar em qualquer site suportado, cada carta Emerald identificada recebe o selo do Rayquaza normalmente
2. Em segundo plano (uma carta por vez, sem travar a página), a extensão busca a
   carta na Liga Pokemon e lê a **referência mín./médio/máx.** da mesma edição (quando o
   código tipo `010/165` ou o nome no formato da Liga aparece no card) e variante
   (normal/Foil/Reverse). Essa referência **não separa idioma nem conservação** — uma
   carta PT danificada pode aparecer como "barata" sem ser
3. Quando a comparação chega, aparece um selo à esquerda do preço do card (passe o
   mouse pra ver a % do médio):
   - **✓ verde**: preço da oferta ≤ 95% do médio da Liga
   - **− amarelo**: entre 95% e 110% do médio
   - **✕ vermelho**: ≥ 110% do médio
4. **Clique no selo** pra ver o **preço médio** da carta numa etiqueta embaixo dele (clique
   de novo pra esconder). Se o preço ainda estiver na fila, a etiqueta mostra "buscando…",
   a carta passa pra frente da fila e o médio aparece sozinho quando chegar; sem comparação
   possível, mostra "sem preço" (motivo ao passar o mouse)
5. Se o card não mostrar um preço reconhecível, ou a Liga não tiver a carta/preço médio
   pra essa impressão, não aparece selo no preço e o clique no Rayquaza não revela nada

**Como a busca poupa a Liga** (que bloqueia com o erro 1015 quando recebe requisições demais):

- **Uma busca por Pokémon, não por carta**: a referência do selo vem da busca da Liga
  (`?view=cards/search&card=<nome>`), que traz mín./médio/máx. de todas as impressões
  daquele nome numa requisição só — as outras cartas do mesmo Pokémon na página saem do
  cache. A impressão é casada pelo nome e pelo código inteiro (número e total da
  coleção). Só quando a impressão não aparece lá (ou aparece sem preço, "R$ 0,00") a
  extensão abre a página da carta
- **Só o que está na tela**: um card entra na fila quando chega perto da área visível;
  os de baixo, conforme você rola. Card escondido pelos filtros nunca é buscado
- **Ritmo único pra todas as abas**: no máximo uma requisição à Liga a cada 1,5 s
  (somando todas as abas abertas), mais devagar depois de um limite
- **Pausa e retoma sozinho**: se a Liga limitar mesmo assim, a extensão espera (1 min,
  dobrando se repetir, até 10 min) e continua de onde parou — o mini Pikachu, a barra da
  página da carta e o carrinho mostram a contagem
- **Cache de 24 h** pra referência do selo e pra busca por Pokémon; anúncios, vendas e
  dados detalhados da carta ficam 2 h

Nas lojas de vendedor único (mesma engine — freitastcg, meruru, stoptcg, etc.), o preço da listagem vem como imagem (cada dígito é um pedaço de uma imagem de números; não existe como texto no HTML). A extensão **lê essa imagem direto da listagem** (`ocr/liga-ocr.js`): os dígitos de verdade usam sempre a mesma fonte pixelada 8x8 — o resto da imagem são borrões de isca que a página nunca usa —, então a leitura é por comparação exata de pixels. Só se a leitura falhar ela abre a página do item.

Antes a extensão abria a página de cada item pra ler o preço, uma requisição à loja por carta, e algumas lojas bloqueavam o IP por excesso de requisições (**erro 1015** do Cloudflare). Se isso ainda acontecer, a extensão para de consultar aquela loja na página, não guarda o erro no cache e mostra o motivo no **?** cinza e no resumo do mini Pikachu. O certo é esperar alguns minutos: a extensão não tenta contornar o bloqueio.

## Estrutura

```
gen3-extension/
├── manifest.json          # Manifest V2 da extensão
├── background.js          # Busca na Liga (direta / aba oculta) e leitura dos preços ocultos
├── content/
│   ├── content.js         # Script de conteúdo (badges, filtros, preços)
│   ├── tracker-sync.js    # Roda no Tracker: sincroniza a coleção automaticamente
│   ├── tracker-prices.js  # Roda no Tracker: busca preços da Liga para o site
│   └── content.css        # Estilos dos badges
├── popup/
│   ├── popup.html         # HTML do popup
│   └── popup.js           # Lógica do popup (sincronização)
├── ocr/
│   ├── liga-ocr.js        # Leitura dos preços ocultos da Liga (imagem de números)
│   └── liga-digits-ref.jpg # Imagem de referência com os dígitos rotulados
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

## Licença

MIT © João Gazire
