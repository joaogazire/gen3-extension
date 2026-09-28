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
- 📋 **Modo APENAS FALTANDO**: Oculta cartas de Pokémon que você já possui no Emerald TCG Tracker (o Tracker guarda uma carta por Pokémon, então qualquer impressão de um Pokémon já coletado é ocultada)
- 💰 **Comparação de Preços**: No carrinho, mostra o **mín. e o médio da Liga Pokemon** ao lado de cada carta (cor comparando com o preço do carrinho) e a loja suportada mais barata com **exatamente** o mesmo idioma e estado de conservação
- 🔄 **Sincronização do Tracker**: Carrega save do Emerald TCG Tracker via link de compartilhamento

## Sites Suportados

- [freitastcg.com.br](https://www.freitastcg.com.br)
- [ligapokemon.com.br](https://www.ligapokemon.com.br)
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
3. Ao lado do nome de cada carta aparece uma etiqueta
   `Liga mín. R$ X · méd. R$ Y · <Loja> R$ Z`:
   - **Liga Pokemon**: a referência mín./médio da Liga pra edição e variante
     (normal/Foil/Reverse) — **não separa idioma nem conservação** (ver "De onde vem o
     preço da Liga Pokemon"). A cor compara o preço do carrinho com o médio: verde até
     95%, amarelo entre 95% e 110%, vermelho a partir de 110%. Se o carrinho não mostrar
     o código da edição (ex.: `010/165`) e a Liga tiver mais de uma impressão com esse
     nome, a etiqueta fica tracejada (a faixa pode misturar impressões)
   - **Loja mais barata** entre as lojas de vendedor único suportadas, com a **mesma
     edição, idioma e conservação**. Exige o código da edição no carrinho (sem ele as
     lojas nem são consultadas) e só compara Near Mint e Danificada/Damaged — os níveis
     intermediários (SP/MP/HP) usam outra escala e ficam de fora pra não simular uma
     correspondência que não existe. As lojas são consultadas no máximo 4 por vez
4. Passe o mouse na etiqueta pra ver a edição, o máximo da Liga e de qual loja veio o preço
5. Se nem a Liga nem nenhuma loja bater, nada é exibido para aquela carta

As **últimas vendas** realizadas ficam na página da carta (ver "Preço da Liga na Página
da Carta"), não no carrinho.

**Observação:** a Liga Pokemon e as lojas suportadas usam proteção Cloudflare contra acesso automatizado. A busca só funciona se o seu navegador já tiver uma sessão válida no site (ex: você já visitou o site normalmente antes). Se uma fonte bloquear o acesso, a extensão detecta isso, para de tentar só naquela fonte pro resto da sessão e avisa no console (F12) — as outras fontes continuam funcionando normalmente.

### Indicador de Preço na Listagem

1. Ao navegar em qualquer site suportado, cada carta Emerald identificada recebe o selo do Rayquaza normalmente
2. Em segundo plano (uma carta por vez, sem travar a página), a extensão busca a
   carta na Liga Pokemon e lê a **referência mín./médio/máx.** da mesma edição (quando o
   código tipo `010/165` ou o nome no formato da Liga aparece no card) e variante
   (normal/Foil/Reverse). Essa referência **não separa idioma nem conservação** — uma
   carta PT danificada pode aparecer como "barata" sem ser
3. Quando a comparação chega, a borda do selo muda de cor:
   - 🟢 **Verde**: preço da oferta ≤ 95% do médio da Liga
   - 🟡 **Amarelo**: entre 95% e 110% do médio
   - 🔴 **Vermelho**: ≥ 110% do médio
4. **Clique no selo** pra revelar uma etiqueta com o médio da Liga embaixo dele (clique de
   novo pra esconder); passe o mouse sobre o selo com a etiqueta aberta pra ver mín./médio/
   máx., a edição e a variante usadas
5. Se o card não mostrar um preço reconhecível, ou a Liga não tiver a carta/preço médio
   pra essa impressão, o selo fica com a borda dourada padrão e o clique não revela nada

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
