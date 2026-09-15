# Emerald TCG Finder

Extensão para Firefox que identifica cartas Pokémon TCG da **Pokédex do Emerald** (set ex9) em sites de TCG brasileiros e destaca com badge do Rayquaza.

## Funcionalidades

- ⚡ **Identificação Emerald**: Detecta automaticamente Pokémon da Pokédex do Emerald (202 Pokémon) em sites de TCG
- 🏅 **Badge do Rayquaza**: Adiciona um selo verde e dourado no canto superior direito das cartas Emerald
- ⚡ **Modo APENAS EMERALD**: Oculta itens que não pertencem à Pokédex do Emerald
- 📋 **Modo APENAS FALTANDO**: Oculta cartas que você já possui no Emerald TCG Tracker
- 💰 **Comparação de Preços**: No carrinho, compara com o menor valor entre a Liga Pokemon e as lojas suportadas (mercado brasileiro) para cartas com **exatamente** o mesmo idioma e estado de conservação
- 🔄 **Sincronização do Tracker**: Carrega save do Emerald TCG Tracker via link de compartilhamento

## Sites Suportados

- freitastcg.com.br
- ligapokemon.com.br
- ligamagic.com.br
- pokemonstore.com.br
- magicdomain.com.br
- cardgame.com.br
- mox.com.br
- gamepod.com.br
- playground.com.br
- cardshall.com.br
- supernovahobbystore.com.br
- epicgame.com.br
- epicone.com.br
- meruru.com.br
- lojadokooper.com.br
- viptcg.com
- reidotcg.com
- jimmietcg.com.br
- stoptcg.com.br
- manycollections.com.br

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
     também a média entre elas: `Blaziken / R$ 45,00 · méd. R$ 52,30` — o tooltip
     mostra quantas lojas entraram nessa média
6. Se nenhuma fonte tiver um anúncio com idioma e conservação idênticos (e edição, quando aplicável), nada é exibido para aquela carta

**Observação:** a Liga Pokemon e as lojas suportadas usam proteção Cloudflare contra acesso automatizado. A busca só funciona se o seu navegador já tiver uma sessão válida no site (ex: você já visitou o site normalmente antes). Se uma fonte bloquear o acesso, a extensão detecta isso, para de tentar só naquela fonte pro resto da sessão e avisa no console (F12) — as outras fontes continuam funcionando normalmente.

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
