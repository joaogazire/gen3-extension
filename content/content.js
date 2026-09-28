/* Emerald TCG Finder - Content Script
 * Identifica cartas do set Emerald (ex9) em sites de TCG e adiciona selo do Rayquaza
 * Modo APENAS EMERALD: oculta itens que não pertencem à Pokédex do Emerald
 * Modo APENAS FALTANDO: oculta itens que o usuário já possui no Emerald TCG Tracker
 * Carrinho: Compara preços com a Liga Pokemon e com as lojas de vendedor único
 * suportadas (mesma engine de e-commerce — ver ECOM_STORE_DOMAINS)
 */

(function() {
  'use strict';

  // Pokémon da Pokédex do Emerald (Hoenn - 202 Pokémon)
  const HOENN_POKEDEX = new Set([
    'treecko', 'grovyle', 'sceptile',
    'torchic', 'combusken', 'blaziken',
    'mudkip', 'marshtomp', 'swampert',
    'poochyena', 'mightyena', 'zigzagoon', 'linoone',
    'wurmple', 'silcoon', 'beautifly', 'cascoon', 'dustox',
    'lotad', 'lombre', 'ludicolo', 'seedot', 'nuzleaf', 'shiftry',
    'taillow', 'swellow', 'wingull', 'pelipper',
    'ralts', 'kirlia', 'gardevoir',
    'surskit', 'masquerain',
    'shroomish', 'breloom',
    'slakoth', 'vigoroth', 'slaking',
    'nincada', 'ninjask', 'shedinja',
    'whismur', 'loudred', 'exploud',
    'makuhita', 'hariyama',
    'azurill', 'marill', 'azumarill',
    'nosepass',
    'skitty', 'delcatty',
    'sableye', 'mawile',
    'aron', 'lairon', 'aggron',
    'meditite', 'medicham',
    'electrike', 'manectric',
    'plusle', 'minun',
    'volbeat', 'illumise',
    'roselia',
    'gulpin', 'swalot',
    'carvanha', 'sharpedo',
    'wailmer', 'wailord',
    'numel', 'camerupt',
    'torkoal',
    'spoink', 'grumpig',
    'spinda',
    'trapinch', 'vibrava', 'flygon',
    'cacnea', 'cacturne',
    'swablu', 'altaria',
    'zangoose', 'seviper',
    'lunatone', 'solrock',
    'barboach', 'whiscash',
    'corphish', 'crawdaunt',
    'baltoy', 'claydol',
    'lileep', 'cradily',
    'anorith', 'armaldo',
    'feebas', 'milotic',
    'castform',
    'kecleon',
    'shuppet', 'banette',
    'duskull', 'dusclops',
    'tropius',
    'chimecho',
    'absol',
    'wynaut',
    'snorunt', 'glalie',
    'spheal', 'sealeo', 'walrein',
    'clamperl', 'huntail', 'gorebyss',
    'relicanth',
    'luvdisc',
    'bagon', 'shelgon', 'salamence',
    'beldum', 'metang', 'metagross',
    'regirock', 'regice', 'registeel',
    'latias', 'latios',
    'kyogre', 'groudon', 'rayquaza',
    'jirachi', 'deoxys',
    'abra', 'kadabra', 'alakazam',
    'geodude', 'graveler', 'golem',
    'zubat', 'golbat', 'crobat',
    'tentacool', 'tentacruel',
    'machop', 'machoke', 'machamp',
    'magnemite', 'magneton',
    'voltorb', 'electrode',
    'oddish', 'gloom', 'vileplume', 'bellossom',
    'doduo', 'dodrio',
    'grimer', 'muk',
    'koffing', 'weezing',
    'slugma', 'magcargo',
    'sandshrew', 'sandslash',
    'skarmory',
    'vulpix', 'ninetales',
    'pichu', 'pikachu', 'raichu',
    'psyduck', 'golduck',
    'wobbuffet',
    'natu', 'xatu',
    'girafarig',
    'phanpy', 'donphan',
    'pinsir',
    'heracross',
    'rhyhorn', 'rhydon',
    'goldeen', 'seaking',
    'magikarp', 'gyarados',
    'staryu', 'starmie',
    'igglybuff', 'jigglypuff', 'wigglytuff',
    'corsola',
    'chinchou', 'lanturn',
    'horsea', 'seadra', 'kingdra'
  ]);

  const RAYQUAZA_BADGE_URL = browser.runtime.getURL('icons/rayquaza_badge.png');

  // Lojas de vendedor único que rodam na mesma engine de e-commerce (mesma
  // assinatura "(c) ... LigaMagic" / assets em sbrauble.com) — cada uma vende
  // só o próprio estoque, então dá pra comparar preço direto com cada uma.
  // ligamagic.com.br fica de fora: é o marketplace irmão da Liga Pokemon
  // (foco em Magic), não uma loja desse tipo.
  const ECOM_STORE_DOMAINS = [
    'freitastcg.com.br',
    'pokemonstore.com.br',
    'magicdomain.com.br',
    'cardgame.com.br',
    'mox.com.br',
    'gamepod.com.br',
    'playground.com.br',
    'cardshall.com.br',
    'supernovahobbystore.com.br',
    'epicgame.com.br',
    'epicone.com.br',
    'meruru.com.br',
    'lojadokooper.com.br',
    'viptcg.com',
    'reidotcg.com',
    'jimmietcg.com.br',
    'stoptcg.com.br',
    'manycollections.com.br',
    'gajosocollectors.com.br',
    'daiverso.com.br',
    'sugoitcg.com.br',
    'muitocolecionaveis.com.br',
    'kamusari.com.br',
    'bazardebagda.com.br',
    'cardsofparadise.com.br',
    'chucktcg.com.br',
    'flowstore.com.br',
    'kinoenecards.com.br',
    'montshop.com.br',
    'playgroundgames.com.br',
    'ugcardshop.com.br',
    'xplace.com.br',
    'turnozerotcg.com.br'
  ];

  // Seletores genéricos de "card"/linha de produto, usados tanto pra achar
  // cards numa listagem quanto pra decidir se uma página É uma listagem
  // (isCardDetailPage). Mantido num único lugar pra evitar que essa lista
  // fique divergente entre as funções que precisam dela.
  const CARD_SELECTORS = [
    '.card-item',
    '[class*="card-item"]',
    '[class*="card_item"]',
    '.item',
    '[class*="item"]',
    'tr',
    '.list-item',
    '.product-item'
  ];

  // Seletores extras por domínio, pra sites cuja marcação de card não usa
  // nenhuma classe "item"/"card"/"product" (ex.: OMG TCG usa Tailwind puro,
  // sem esses nomes de classe) e por isso não bate com nenhum CARD_SELECTORS
  const SITE_CARD_SELECTORS = {
    'omgtcg.com.br': ['.group.overflow-hidden.rounded-2xl']
  };

  const currentHost = window.location.hostname.replace(/^www\./, '');
  const ALL_CARD_SELECTORS = [...CARD_SELECTORS, ...(SITE_CARD_SELECTORS[currentHost] || [])];
  const CARD_SELECTORS_JOINED = ALL_CARD_SELECTORS.join(', ');

  // Estado dos modos
  let emeraldOnlyMode = false;
  let missingOnlyMode = false;
  let ownedCards = new Set();

  // Cache de preços (Liga Pokemon + lojas), chave prefixada pela fonte.
  // Persiste em browser.storage.local (TTL de 20min) pra sobreviver à
  // navegação entre páginas — sem isso, cada página nova refaz as mesmas
  // buscas de carta já vistas na sessão de compra.
  const priceCache = new Map();
  const PRICE_CACHE_STORAGE_KEY = 'priceCache';
  const PRICE_CACHE_TTL_MS = 20 * 60 * 1000;
  const PRICE_CACHE_FLUSH_DELAY_MS = 2000;
  let priceCacheDirty = false;
  let priceCacheFlushTimeout = null;

  // Carrega o cache salvo do storage (chamado uma vez, no início de init())
  // — descarta entradas já expiradas na hora de carregar
  async function loadPriceCacheFromStorage() {
    try {
      const data = await browser.storage.local.get(PRICE_CACHE_STORAGE_KEY);
      const stored = data[PRICE_CACHE_STORAGE_KEY];
      if (stored && typeof stored === 'object') {
        const now = Date.now();
        for (const [key, entry] of Object.entries(stored)) {
          if (entry && typeof entry.fetchedAt === 'number' && (now - entry.fetchedAt) < PRICE_CACHE_TTL_MS) {
            priceCache.set(key, entry);
          }
        }
        console.log(`[Emerald TCG] ${priceCache.size} preços recuperados do cache`);
      }
    } catch (err) {
      console.error('[Emerald TCG] Erro ao carregar cache de preços:', err);
    }
  }

  // Retorna o valor cacheado (que pode legitimamente ser `null`, pra uma
  // busca anterior sem resultado) ou `undefined` se não há entrada válida
  // (nunca buscado, ou expirado)
  function getCachedPrice(key) {
    const entry = priceCache.get(key);
    if (!entry) return undefined;
    if ((Date.now() - entry.fetchedAt) >= PRICE_CACHE_TTL_MS) {
      priceCache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function setCachedPrice(key, value) {
    priceCache.set(key, { value, fetchedAt: Date.now() });
    priceCacheDirty = true;
    schedulePriceCacheFlush();
  }

  // Agenda a gravação no storage com um pequeno atraso, pra acumular várias
  // gravações (uma por carta processada) numa única escrita em vez de uma
  // por carta
  function schedulePriceCacheFlush() {
    if (priceCacheFlushTimeout) return;
    priceCacheFlushTimeout = setTimeout(flushPriceCacheToStorage, PRICE_CACHE_FLUSH_DELAY_MS);
  }

  function flushPriceCacheToStorage() {
    priceCacheFlushTimeout = null;
    if (!priceCacheDirty) return;
    priceCacheDirty = false;

    const now = Date.now();
    const serializable = {};
    for (const [key, entry] of priceCache.entries()) {
      if ((now - entry.fetchedAt) < PRICE_CACHE_TTL_MS) {
        serializable[key] = entry;
      }
    }

    browser.storage.local.set({ [PRICE_CACHE_STORAGE_KEY]: serializable }).catch(err => {
      console.error('[Emerald TCG] Erro ao salvar cache de preços:', err);
    });
  }

  // Faixas pra classificar o preço da oferta em relação ao menor preço de
  // mercado (Liga Pokemon, mesma edição/idioma/conservação): abaixo de 90%
  // do mercado é "barata", acima de 110% é "cara", entre os dois é "justa".
  const PRICE_CHEAP_RATIO = 0.95;
  const PRICE_EXPENSIVE_RATIO = 1.1;

  // Verifica se estamos em uma página de detalhes da carta
  function isCardDetailPage() {
    const path = window.location.pathname;

    // O motor de e-commerce compartilhado por vários sites suportados
    // (freitastcg, supernovahobbystore, cardshall, epicgame, etc.) usa
    // ?view=ecom/item&refid=... pra página de detalhes — não aparece no
    // pathname, só na query string, então o regex de path abaixo não pega.
    if (/[?&]view=ecom(?:%2f|\/)item\b/i.test(window.location.href)) {
      return true;
    }

    // Página de uma carta na Liga Pokemon (?view=cards/card): o bloco de
    // informações (edição, preços, gráfico de vendas) é montado pelo JS da
    // Liga dentro de .container-item-info — os filtros de listagem
    // escondiam esse bloco (classe com "item" e sem nome de Hoenn). Nada de
    // selo nem filtro aqui; a busca/listagem da Liga continua normal.
    if (/ligapokemon\.com\.br$/.test(window.location.hostname) &&
        /[?&]view=cards(?:%2f|\/)card\b/i.test(window.location.href)) {
      return true;
    }

    if (path.match(/\/(item|produto|carta|card|details|p)\/\d+/)) {
      return true;
    }

    const hasList = document.querySelectorAll(CARD_SELECTORS_JOINED).length > 3;
    const hasDetailContent = document.querySelector('.card-details, .product-details, .item-details, [class*="detail"], [class*="info"], [class*="spec"]');

    if (!hasList && hasDetailContent) {
      return true;
    }

    const cardCount = document.querySelectorAll('img').length;
    if (cardCount <= 5) {
      return true;
    }

    return false;
  }

  // Verifica se estamos no carrinho
  function isCartPage() {
    const path = window.location.pathname;
    const url = window.location.href;

    return path.match(/\/(carrinho|cart|checkout|pedido)/) ||
           url.includes('carrinho') ||
           url.includes('cart') ||
           url.includes('checkout');
  }

  // Normaliza texto para comparação
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  // Verifica se um nome de Pokémon pertence à Pokédex do Emerald
  function isHoennPokemon(name) {
    const normalized = normalizeText(name);
    const cleanName = normalized
      .replace(/\b(ex|gx|v|vmax|vstar|lv|lvx|break|tag team|prime|star|delta|holo|reverse|foil)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (HOENN_POKEDEX.has(cleanName)) return true;

    // Exige nome minimamente completo: evita que texto curto/genérico de
    // elementos fora dos cards (menu, rodapé, alt de logo) vire falso
    // positivo por ser substring de um nome de Pokémon (ex: "ra" -> "rayquaza")
    if (cleanName.length < 4) return false;

    for (const pokemon of HOENN_POKEDEX) {
      if (cleanName === pokemon || cleanName.includes(pokemon)) {
        return true;
      }
    }

    return false;
  }

  // Carrega cartas do usuário do storage.local
  function loadOwnedCards() {
    ownedCards.clear();

    browser.storage.local.get(['trackerCards'], (data) => {
      if (data.trackerCards && Array.isArray(data.trackerCards)) {
        data.trackerCards.forEach(card => {
          if (card.collected === true && card.name) {
            ownedCards.add(normalizeText(card.name));
          }
        });
        console.log(`[Emerald TCG] ${ownedCards.size} cartas carregadas`);
        applyFilters();
      }
    });
  }

  // Verifica se o usuário já possui a carta
  function isOwnedCard(cardName) {
    if (!missingOnlyMode) return false;
    if (ownedCards.size === 0) return false;

    const normalized = normalizeText(cardName);

    for (const owned of ownedCards) {
      if (normalized.includes(owned) || owned.includes(normalized)) {
        return true;
      }
    }

    return false;
  }

  // Encontra o elemento que exibe o nome do Pokémon dentro de um card
  function extractPokemonNameNode(element) {
    const links = element.querySelectorAll('a[href*="item"], a[href*="produto"], a[href*="card"]');
    for (const link of links) {
      // Pula botões de ação (comprar, ver ofertas, adicionar à pasta/lista) —
      // estilizados com classe "btn" mas cujo href também bate os seletores
      // acima; o texto deles não é o nome da carta
      if (/\bbtn\b/i.test(link.className)) continue;

      const text = link.textContent.trim();
      if (text.length > 2 && text.length < 50) {
        return link;
      }
    }

    const titles = element.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, [class*="title"], [class*="name"]');
    for (const title of titles) {
      const text = title.textContent.trim();
      if (text.length > 2 && text.length < 50) {
        return title;
      }
    }

    return null;
  }

  // Extrai nome do Pokémon de um card
  function extractPokemonName(element) {
    const nameNode = extractPokemonNameNode(element);
    if (nameNode) {
      const text = nameNode.textContent.trim();
      const cleanText = text
        .replace(/#\d+\/\d+/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\b\d+\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText.length > 2) {
        return cleanText;
      }
      if (text.length > 2) {
        return text;
      }
    }

    const allText = element.textContent;
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);

    for (const line of lines) {
      if (/^R\$/.test(line)) continue;
      if (/^\d+[.,]\d+$/.test(line)) continue;
      if (/^\d+%$/.test(line)) continue;
      if (/^\d+$/.test(line)) continue;

      return line;
    }

    return '';
  }

  // Escolhe a imagem principal do card entre todas as <img> dentro dele —
  // pega a de maior área em vez de simplesmente a primeira do DOM, porque em
  // alguns sites a primeira imagem é um ícone pequeno (ex: coração de
  // "favoritar") que vem antes da foto da carta
  function selectCardImage(card) {
    let best = null;
    let bestArea = 0;

    card.querySelectorAll('img').forEach(img => {
      const rect = img.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        best = img;
      }
    });

    return best;
  }

  // Classifica idioma e qualidade/conservação a partir de um texto
  function classifyLanguageCondition(text) {
    text = text.toLowerCase();

    // Idioma
    let language = 'pt'; // padrão
    if (text.includes('inglês') || text.includes('english') || text.includes('en ')) {
      language = 'en';
    } else if (text.includes('japonês') || text.includes('japanese') || text.includes('jp')) {
      language = 'jp';
    } else if (text.includes('espanhol') || text.includes('spanish')) {
      language = 'es';
    }

    // Qualidade/Conservação (ordem importa: termos mais específicos primeiro)
    let condition = 'nm'; // padrão Near Mint
    if (text.includes('near mint') || text.includes('(nm)')) {
      condition = 'nm';
    } else if (text.includes('light played') || text.includes('(lp)')) {
      condition = 'lp';
    } else if (text.includes('excellent') || text.includes('(ex)')) {
      condition = 'ex';
    } else if (text.includes('mint') || text.includes('(m)')) {
      condition = 'm';
    } else if (text.includes('good') || text.includes('(gd)')) {
      condition = 'gd';
    } else if (text.includes('poor') || text.includes('(po)')) {
      condition = 'po';
    } else if (text.includes('played') || text.includes('(pl)')) {
      condition = 'pl';
    }

    return { language, condition };
  }

  // Extrai idioma e qualidade da carta do elemento
  function extractCardDetails(element) {
    return classifyLanguageCondition(element.textContent);
  }

  // Código de edição/coleção da carta como o site mostra (ex: "010/165",
  // "TG14/TG30", "#057/∞" dos promos). Mantém zeros à esquerda e o "#" —
  // é o mesmo formato do nome da carta na Liga Pokemon e nas lojas da mesma
  // engine, então o código vai direto pra busca/comparação de texto.
  const CARD_CODE_PATTERN = /(#?[A-Z]{0,4}\d{1,4}[a-z]?)\s*\/\s*([A-Z]{0,4}\d{1,4}|∞)/;

  function extractCardCode(text) {
    const m = text.match(CARD_CODE_PATTERN);
    if (!m) return null;
    return `${m[1]}/${m[2]}`;
  }

  // Número da carta dentro da edição, sem "#" e sem zeros à esquerda — pra
  // casar com `num` de cards_editions na Liga ("057" / "#057" -> "57")
  function cardNumberKey(num) {
    return String(num || '').replace(/^#/, '').replace(/^0+(?=\w)/, '').toUpperCase();
  }

  // Extrai o preço em R$ exibido no próprio card da listagem
  function extractCardPrice(card) {
    const priceElement = card.querySelector('.price, .valor, [class*="price"], [class*="valor"], .product-price, [class*="product-price"], .preco, [class*="preco"]');
    const text = priceElement ? priceElement.textContent : card.textContent;
    const match = text.match(/R\$\s*([\d.,]+)/);
    if (!match) return null;

    const price = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    return price > 0 ? price : null;
  }

  // Formata valor em Reais (padrão brasileiro, vírgula decimal)
  function formatBRL(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  // Detecta se o HTML retornado é uma página de challenge do Cloudflare.
  // Não usar "challenge-platform": o Cloudflare injeta o script
  // /cdn-cgi/challenge-platform/ em TODA página que ele serve (Liga e lojas),
  // inclusive nas respostas normais — isso marcava fontes que respondiam
  // certo como bloqueadas pro resto da sessão.
  function isCloudflareChallenge(html) {
    return /<title>\s*Just a moment|cf-turnstile|challenges\.cloudflare\.com\/turnstile|Verificando se você é humano/i.test(html);
  }

  // Domínios que já bloquearam acesso automatizado (Cloudflare) nesta sessão —
  // por domínio, pra um bloqueio numa fonte não parar a comparação nas outras.
  const blockedDomains = new Set();

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Classifica a qualidade a partir da célula "Qualidade" das lojas de
  // vendedor único (escala NM/SP/MP/HP/D, diferente da escala Cardmarket que
  // classifyLanguageCondition entende). Só reconhece as duas pontas em que dá
  // pra garantir equivalência com a nossa escala: Near Mint == nm, e Damaged
  // (o pior nível) tratado como equivalente ao nosso po (Poor). Qualquer coisa
  // no meio (SP/MP/HP) retorna null — a carta não entra na comparação com
  // aquela loja pra não fingir uma correspondência de qualidade que não existe.
  function classifyEcomQuality(text) {
    const lower = text.toLowerCase();
    if (lower.includes('near mint')) return 'nm';
    if (lower.includes('damaged')) return 'po';
    return null;
  }

  // Busca uma página da Liga Pokemon pelo background script (ver
  // background.js: o fetch daqui de dentro do site da loja não leva os cookies
  // da Liga e toma 403 do Cloudflare). Devolve o HTML, ou null se falhou —
  // e marca a Liga como bloqueada na sessão se veio o desafio do Cloudflare.
  let ligaBlockedNoticeShown = false;
  // URL da Liga que pediu verificação — o painel da página da carta oferece
  // um link pra ela, pro usuário passar pelo desafio interativo e voltar
  let ligaBlockedUrl = null;

  async function fetchLigaHtml(url) {
    if (blockedDomains.has('ligapokemon.com.br')) return null;

    let response;
    try {
      response = await browser.runtime.sendMessage({ action: 'fetchLiga', url });
    } catch (err) {
      console.error('[Emerald TCG] Erro ao buscar na Liga Pokemon:', err);
      return null;
    }
    if (!response) return null;

    if (response.challenge || isCloudflareChallenge(response.text) || response.status === 403) {
      blockedDomains.add('ligapokemon.com.br');
      ligaBlockedUrl = url;
      if (!ligaBlockedNoticeShown) {
        ligaBlockedNoticeShown = true;
        console.warn(`[Emerald TCG] Liga Pokemon pediu verificação (Cloudflare). Abra ${url} , passe pela verificação e recarregue esta página.`);
      }
      return null;
    }

    return response.ok ? response.text : null;
  }

  // Lê uma variável JSON embutida num <script> da página da carta da Liga
  // (`var cards_editions = [...];`) — a Liga monta a página no navegador a
  // partir desses dados, então as informações não existem como HTML.
  function readLigaScriptVar(html, name) {
    const marker = `var ${name} = `;
    const start = html.indexOf(marker);
    if (start === -1) return null;
    const end = html.indexOf(';\n', start);
    if (end === -1) return null;
    try {
      return JSON.parse(html.slice(start + marker.length, end));
    } catch (err) {
      return null;
    }
  }

  // Chave de "extras" usada no preço da Liga (cards_editions[].price):
  // "0" normal, "2" Foil, "3" Reverse Foil — os mesmos ids de dataExtras
  function ligaExtrasKey(text) {
    const lower = String(text || '').toLowerCase();
    if (lower.includes('reverse')) return '3';
    // sem \b no fim: o textContent cola células vizinhas ("FoilR$ 30,00")
    if (/\bfoil|\bholo/.test(lower)) return '2';
    return '0';
  }

  const LIGA_EXTRAS_LABEL = { '0': 'normal', '2': 'Foil', '3': 'Reverse Foil' };

  // Escolhe o preço da variante pedida; se a edição não tem essa variante
  // (ex.: promo que só existe em Foil), usa a única que existir ou a normal
  function pickLigaExtrasPrice(priceByExtras, wantedKey) {
    if (!priceByExtras || typeof priceByExtras !== 'object') return null;
    // Variante sem preço vem como array vazio ("2": []) — só conta as que
    // têm médio de verdade
    const valid = Object.keys(priceByExtras).filter(k => {
      const entry = priceByExtras[k];
      return entry && !Array.isArray(entry) && parseFloat(entry.m) > 0;
    });
    if (valid.length === 0) return null;
    const key = valid.includes(wantedKey) ? wantedKey
      : (valid.includes('0') ? '0' : valid[0]);
    const entry = priceByExtras[key];
    const min = parseFloat(entry.p);
    const avg = parseFloat(entry.m);
    const max = parseFloat(entry.g);
    if (!(avg > 0)) return null;
    return { min: min > 0 ? min : avg, avg, max: max > 0 ? max : avg, extrasKey: key };
  }

  // Nome da carta no formato do cadastro da Liga — "Gardevoir ex (233/091)",
  // "Mudkip (#057/∞)" — que é o que abre direto a carta certa na busca. As
  // lojas da mesma engine usam esse mesmo nome; em outros sites monta a
  // partir do nome do Pokémon + código da edição.
  function extractLigaCardName(text) {
    const m = String(text || '').match(/([A-Za-zÀ-ÿ0-9'’.:\- ]{2,60}?)\s*\(\s*(#?[A-Z]{0,4}\d{1,4}[a-z]?\s*\/\s*(?:[A-Z]{0,4}\d{1,4}|∞))\s*\)/);
    if (!m) return null;
    return `${m[1].replace(/\s+/g, ' ').trim()} (${m[2].replace(/\s+/g, '')})`;
  }

  // Preço de referência da Liga Pokemon pra carta: menor / médio / maior que
  // a própria Liga calcula por edição e por variante (normal/Foil/Reverse),
  // lido de `cards_editions` na página da carta. Os preços de cada anúncio
  // não servem pra isso — a Liga ofusca a maioria deles num sprite de imagem
  // (só uma minoria vem em texto no JSON), então a média calculada por aqui
  // seria de uma amostra enviesada. A referência da Liga não separa idioma
  // nem conservação.
  //
  // `opts.fullName`: nome no formato da Liga, quando a página mostra;
  // `opts.editionId`: id da edição na Liga (as lojas da mesma engine usam o
  // mesmo cadastro — `txt_edicao=` no link da edição), pra escolher a
  // impressão exata; `opts.extrasKey`: variante (ver ligaExtrasKey).
  // Nomes a tentar na busca da Liga, do mais provável pro menos. A Liga
  // cadastra promos sem "#" ("Mew ex (053/∞)"), mas algumas lojas mostram
  // "Treecko (#055/∞)"
  function ligaQueryCandidates(pokemonName, cardCode, fullName) {
    const base = fullName || (cardCode ? `${pokemonName} (${cardCode})` : pokemonName);
    const candidates = [base.replace(/\(\s*#/, '('), base];
    if (cardCode) candidates.push(pokemonName);
    return [...new Set(candidates)];
  }

  // Dados da página da carta na Liga, lidos dos JSON embutidos: impressões
  // (cards_editions, com a referência de preço), anúncios ativos
  // (cards_stock), e as tabelas de idiomas/qualidades/extras. Cache só em
  // memória (é grande pra ir pro storage). Devolve undefined quando a Liga
  // não respondeu (bloqueio/rede — vale tentar de novo) e null quando
  // respondeu mas nenhum nome abriu uma carta.
  const ligaCardDataCache = new Map();

  async function fetchLigaCardData(pokemonName, cardCode, fullName) {
    const queries = ligaQueryCandidates(pokemonName, cardCode, fullName);
    const memoKey = queries[0];
    if (ligaCardDataCache.has(memoKey)) return ligaCardDataCache.get(memoKey);

    for (const query of queries) {
      const url = `https://www.ligapokemon.com.br/?view=cards/card&card=${encodeURIComponent(query)}`;
      const html = await fetchLigaHtml(url);
      if (html == null) return undefined;

      const editions = readLigaScriptVar(html, 'cards_editions');
      if (Array.isArray(editions) && editions.length > 0) {
        const stock = readLigaScriptVar(html, 'cards_stock');
        const data = {
          url,
          editions,
          stock: Array.isArray(stock) ? stock : [],
          languages: readLigaScriptVar(html, 'dataLanguage') || [],
          qualities: readLigaScriptVar(html, 'dataQuality') || [],
          extras: readLigaScriptVar(html, 'dataExtras') || []
        };
        ligaCardDataCache.set(memoKey, data);
        return data;
      }
      console.info(`[Emerald TCG] Liga: "${query}" não abriu uma carta${/<title>([^<]*)/.test(html) ? ` (página: ${html.match(/<title>([^<]*)/)[1].trim()})` : ''}`);
    }

    ligaCardDataCache.set(memoKey, null);
    return null;
  }

  // Impressão exata da carta entre as edições da Liga: pelo id da edição
  // (lojas da mesma engine) ou, sem ele, pelo número — só aceita quando
  // sobra exatamente uma
  function pickLigaEdition(editions, editionId, cardCode) {
    if (editionId) {
      const byId = editions.filter(ed => String(ed.id) === String(editionId));
      if (byId.length === 1) return byId[0];
    }
    if (cardCode) {
      const wantedNum = cardNumberKey(cardCode.split('/')[0]);
      const byNum = editions.filter(ed => cardNumberKey(ed.num) === wantedNum);
      if (byNum.length === 1) return byNum[0];
    }
    return editions.length === 1 && !cardCode ? editions[0] : null;
  }

  // Idioma/qualidade de uma linha de loja -> ids e siglas da Liga. A engine
  // das lojas usa as mesmas bandeiras (images/bandeiras/<sigla>.svg) e a
  // mesma escala de qualidade (M/NM/SP/MP/HP/D) da Liga.
  function ligaVariantIds(data, row) {
    const language = data.languages.find(l => String(l.svg || '').endsWith(`/${row.langKey}.svg`));
    const quality = data.qualities.find(q => String(q.acron).toUpperCase() === row.qualityAcron);
    return {
      languageId: language ? String(language.id) : null,
      languageAcron: language ? String(language.acron).toUpperCase() : (row.langKey || '').toUpperCase(),
      languageLabel: language ? language.label : row.langKey,
      qualityId: quality ? String(quality.id) : null,
      qualityAcron: row.qualityAcron,
      langKey: row.langKey
    };
  }

  function parseLigaPrice(value) {
    if (typeof value === 'number') return value;
    const text = String(value || '').replace(/[^\d.,]/g, '');
    // "1.234,56" (BR) ou "1234.56"
    const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
    const price = parseFloat(normalized);
    return price > 0 ? price : null;
  }

  // Anúncios ativos na Liga com a MESMA edição, número, idioma, qualidade e
  // extras da linha da loja. A Liga manda só parte dos preços em texto
  // (`precoFinal`/`preco`); os outros vêm ofuscados num sprite de imagem
  // (`precoCss`) e só entram na contagem de `hidden`.
  function ligaListingStats(data, edition, ids, extrasKey) {
    if (!ids.languageId || !ids.qualityId) return null;
    const matches = data.stock.filter(s =>
      String(s.idEdicao) === String(edition.id) &&
      cardNumberKey(s.num) === cardNumberKey(edition.num) &&
      String(s.idioma) === ids.languageId &&
      String(s.qualid) === ids.qualityId &&
      String(s.extras || 0) === extrasKey
    );
    const prices = matches
      .map(s => parseLigaPrice(s.precoFinal != null ? s.precoFinal : s.preco))
      .filter(p => p != null);
    return {
      count: matches.length,
      hidden: matches.length - prices.length,
      min: prices.length ? Math.min(...prices) : null,
      avg: prices.length ? prices.reduce((sum, p) => sum + p, 0) / prices.length : null,
      max: prices.length ? Math.max(...prices) : null,
      priced: prices.length
    };
  }

  // Extras que identificam a carta (não o "Promo", que vem da própria
  // edição e as lojas nem sempre marcam)
  function significantExtras(labels) {
    return labels
      .map(label => normalizeText(label))
      .filter(label => label && label !== 'promo')
      .sort()
      .join('|');
  }

  function stripHtml(text) {
    return String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const LIGA_SALES_SHOWN = 5;

  // Últimas vendas REALIZADAS dessa carta na Liga (mesmo endpoint do bloco
  // "Últimas Vendas" da página da carta: /ajax/mp/marketplace.php?
  // opc=latestsales). Edição, qualidade e variante vão como filtro pro
  // servidor; idioma e extras exatos são conferidos aqui venda por venda —
  // venda sem idioma identificável fica de fora. Exige login na Liga.
  async function fetchLigaSales(data, edition, ids, extrasKey, extrasLabels) {
    if (!ids.qualityId) return { sales: [], reason: 'qualidade não reconhecida' };

    const cacheKey = `ligapokemon.com.br:sales2:${edition.idcard}_${edition.id}_${edition.num}_${ids.qualityId}_${extrasKey}_${ids.languageAcron}_${significantExtras(extrasLabels)}`;
    const cached = getCachedPrice(cacheKey);
    if (cached !== undefined) return cached;

    const params = new URLSearchParams({
      opc: 'latestsales',
      tcg: '2',
      card_id: String(edition.idcard),
      card_ed: String(edition.id),
      card_num: String(edition.num),
      filter_set: `${edition.id}_${edition.idcard}`,
      filter_cond: ids.qualityId,
      filter_extras: extrasKey,
      filter_period: '2',
      has_extras: '1'
    });
    const url = `https://www.ligapokemon.com.br/ajax/mp/marketplace.php?${params}`;

    let response;
    try {
      response = await browser.runtime.sendMessage({ action: 'fetchLigaJson', url, pageUrl: data.url });
    } catch (err) {
      console.error('[Emerald TCG] Erro ao buscar últimas vendas na Liga:', err);
      return { sales: [], reason: 'erro' };
    }

    const json = response && response.json;
    if (!json) return { sales: [], reason: response && response.challenge ? 'verificação' : 'erro' };
    if (json.error == 1) {
      const needsLogin = /logad/i.test(json.message || '');
      const result = { sales: [], reason: needsLogin ? 'login' : 'sem vendas' };
      if (!needsLogin) setCachedPrice(cacheKey, result);
      return result;
    }

    const orders = Array.isArray(json.orders) ? json.orders : Object.values(json.orders || {});
    const extrasByAcron = new Map(data.extras.map(e => [String(e.acron).toUpperCase(), e.label]));
    const wantedExtras = significantExtras(extrasLabels);
    let unknownLanguage = 0;

    const sales = [];
    for (const order of orders) {
      if (order.graded == 1) continue;
      if (String(order.qAcronym || '').toUpperCase() !== ids.qualityAcron) continue;

      const rawLang = String(order.lang || '');
      const langText = stripHtml(rawLang).toUpperCase();
      const langOk = rawLang.includes(`/bandeiras/${ids.langKey}.svg`) ||
        langText === ids.languageAcron ||
        normalizeText(langText) === normalizeText(ids.languageLabel || '');
      if (!rawLang) { unknownLanguage++; continue; }
      if (!langOk) continue;

      const orderExtras = String(order.extras || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
        .map(e => extrasByAcron.get(e.toUpperCase()) || e);
      if (significantExtras(orderExtras) !== wantedExtras) continue;

      const price = parseLigaPrice(order.price);
      if (price == null) continue;
      sales.push({ date: stripHtml(order.date), price, quant: order.quant });
      if (sales.length >= LIGA_SALES_SHOWN) break;
    }

    if (unknownLanguage > 0) {
      console.info(`[Emerald TCG] Liga: ${unknownLanguage} venda(s) sem idioma identificável ficaram de fora`, orders[0]);
    }

    const result = {
      sales,
      avg: sales.length ? sales.reduce((sum, s) => sum + s.price, 0) / sales.length : null,
      reason: sales.length ? null : 'sem vendas'
    };
    setCachedPrice(cacheKey, result);
    return result;
  }

  async function fetchLigaPokemonPrice(pokemonName, cardCode, opts = {}) {
    const queries = ligaQueryCandidates(pokemonName, cardCode, opts.fullName);
    const extrasKey = opts.extrasKey || '0';
    const cacheKey = `ligapokemon.com.br:ref:${normalizeText(queries[0])}_${opts.editionId || '~'}_${extrasKey}`;

    const cached = getCachedPrice(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const data = await fetchLigaCardData(pokemonName, cardCode, opts.fullName);
    if (data === undefined) {
      // Sem cachear quando foi bloqueio/erro de rede: a próxima página
      // (depois de o usuário passar pelo Cloudflare) tenta de novo
      return null;
    }
    if (data === null) {
      setCachedPrice(cacheKey, null);
      return null;
    }
    let editions = data.editions;
    const searchUrl = data.url;

    // Filtra a impressão: pelo id da edição (exato) ou pelo número da carta
    let matchedBy = 'name';
    if (opts.editionId) {
      const byId = editions.filter(ed => String(ed.id) === String(opts.editionId));
      if (byId.length > 0) {
        editions = byId;
        matchedBy = 'code';
      }
    }
    if (matchedBy !== 'code' && cardCode) {
      const wantedNum = cardNumberKey(cardCode.split('/')[0]);
      const byNum = editions.filter(ed => cardNumberKey(ed.num) === wantedNum);
      if (byNum.length === 0) {
        // A Liga abriu outra carta (nenhuma impressão com esse número) —
        // melhor não mostrar nada do que o preço de uma carta diferente
        console.info(`[Emerald TCG] Liga: nenhuma impressão nº ${cardCode} em ${editions.map(ed => `${ed.code} ${ed.num}`).join(', ')}`);
        setCachedPrice(cacheKey, null);
        return null;
      }
      editions = byNum;
      matchedBy = byNum.length === 1 ? 'code' : 'name';
    }

    const prices = editions
      .map(ed => ({ ed, price: pickLigaExtrasPrice(ed.price, extrasKey) }))
      .filter(entry => entry.price);

    if (prices.length === 0) {
      console.info(`[Emerald TCG] Liga: ${editions.map(ed => ed.code).join(', ')} sem preço médio cadastrado`);
      setCachedPrice(cacheKey, null);
      return null;
    }

    // Mais de uma impressão possível (sem id/número pra desempatar): junta
    // as faixas — menor dos mínimos, média dos médios, maior dos máximos
    const min = Math.min(...prices.map(e => e.price.min));
    const avg = prices.reduce((sum, e) => sum + e.price.avg, 0) / prices.length;
    const max = Math.max(...prices.map(e => e.price.max));
    const usedKey = prices[0].price.extrasKey;

    const result = {
      price: min,
      fair: avg,
      max,
      matchedBy,
      editionName: prices.length === 1 ? `${prices[0].ed.name} (${prices[0].ed.code})` : `${prices.length} edições`,
      extrasLabel: usedKey === extrasKey
        ? (LIGA_EXTRAS_LABEL[usedKey] || 'normal')
        : `${LIGA_EXTRAS_LABEL[usedKey] || 'normal'} (a Liga não tem preço ${LIGA_EXTRAS_LABEL[extrasKey] || 'dessa variante'})`,
      url: searchUrl,
      store: 'Liga Pokemon'
    };
    setCachedPrice(cacheKey, result);
    return result;
  }

  // Últimas Vendas da Liga Pokemon: preço de venda REALIZADA (não o preço
  // pedido pelos anúncios ativos que fetchLigaPokemonPrice lê). Exige o
  // código da edição — a página usa a busca "<nome> <código>" (ex.:
  // "banette 234/217") pra abrir direto na carta certa.
  //
  // AVISO: implementado a partir do HTML de uma página específica que o
  // usuário colou (não consegui testar ao vivo — a Liga Pokemon me bloqueou
  // com o desafio do Cloudflare no meio da sessão). Se o seletor
  // #container-lastsold-orders não bater com a estrutura real, a função só
  // retorna null silenciosamente (mesmo comportamento de qualquer outra
  // fonte indisponível) — não deve quebrar nada, mas precisa ser confirmado
  // testando no navegador.
  //
  // Conservação: só aceita o extremo inequívoco NM (igual ao que
  // classifyEcomQuality já faz pras lojas de vendedor único) — o código
  // curto da Liga (NM/LP/MP/HP/D) não necessariamente equivale 1:1 à escala
  // usada em classifyLanguageCondition, então os níveis do meio ficam de
  // fora pra não fingir uma correspondência que não existe.
  function classifySaleLanguage(code) {
    const upper = String(code || '').trim().toUpperCase();
    if (upper === 'EN') return 'en';
    if (upper === 'JP' || upper === 'JPN') return 'jp';
    if (upper === 'ES') return 'es';
    if (upper === 'PT') return 'pt';
    return null;
  }

  function classifySaleCondition(text) {
    const code = String(text || '').trim().toUpperCase().split(/[\s-]/)[0];
    if (code === 'NM') return 'nm';
    return null;
  }

  async function fetchRecentSales(pokemonName, language, condition, cardCode) {
    if (!cardCode) return null;

    const cacheKey = `ligapokemon.com.br:sales:${normalizeText(pokemonName)}_${language}_${condition}_${cardCode}`;

    const cached = getCachedPrice(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    if (blockedDomains.has('ligapokemon.com.br')) {
      return null;
    }

    try {
      const query = `${pokemonName} ${cardCode}`;
      const searchUrl = `https://www.ligapokemon.com.br/?view=cards/search&tipo=1&card=${encodeURIComponent(query)}`;

      const html = await fetchLigaHtml(searchUrl);
      if (html == null) return null;

      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('#container-lastsold-orders table.tabsales-card tbody tr');

      const sales = [];
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return;

        const rowLanguage = classifySaleLanguage(cells[1].textContent);
        if (rowLanguage !== language) return;

        const rowCondition = classifySaleCondition(cells[2].textContent);
        if (rowCondition !== condition) return;

        const priceMatch = cells[4].textContent.match(/R\$\s*([\d.,]+)/);
        if (!priceMatch) return;

        const price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
        if (price > 0) sales.push(price);
      });

      const result = sales.length === 0
        ? null
        : {
            avg: sales.reduce((sum, p) => sum + p, 0) / sales.length,
            latest: sales[0],
            count: sales.length
          };

      setCachedPrice(cacheKey, result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Emerald TCG] Erro ao buscar últimas vendas na Liga Pokemon:', err);
      }
      setCachedPrice(cacheKey, null);
      return null;
    }
  }

  // Nome amigável de uma loja a partir do domínio, pro tooltip do badge de preço
  function storeDisplayName(domain) {
    const base = domain.replace(/\.com(\.br)?$/, '');
    return base
      .split(/[-.]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  // Lê todas as linhas de variante (edição/idioma/qualidade/extras/estoque/
  // preço) da tabela ".table-cards-row" de uma página de item da engine de
  // e-commerce compartilhada (ECOM_STORE_DOMAINS), só com estoque e preço
  // válidos. `condition` vem null nos níveis intermediários (ver
  // classifyEcomQuality); `editionId` é o id da edição no cadastro da Liga
  // (link `txt_edicao=` da primeira coluna).
  function readEcomItemRows(doc) {
    const rows = [];

    doc.querySelectorAll('.table-cards-row').forEach(row => {
      const cells = row.querySelectorAll('.table-cards-body-cell');
      if (cells.length < 6) return;

      const editionLink = cells[0].querySelector('a[href*="txt_edicao="]');
      const editionMatch = editionLink ? editionLink.getAttribute('href').match(/txt_edicao=(\d+)/) : null;

      const langImg = cells[1].querySelector('img');
      const language = classifyLanguageCondition(langImg ? (langImg.getAttribute('alt') || langImg.getAttribute('title') || '') : '').language;

      const condition = classifyEcomQuality(cells[2].textContent);

      const stockMatch = cells[4].textContent.match(/(\d+)\s*unid/i);
      const stock = stockMatch ? parseInt(stockMatch[1], 10) : 0;
      if (stock <= 0) return;

      const priceMatch = cells[5].textContent.match(/R\$\s*([\d.,]+)/);
      if (!priceMatch) return;

      const price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
      if (!(price > 0)) return;

      // Sigla da bandeira (images/bandeiras/pt.svg -> "pt") e da qualidade
      // ("Near Mint (NM)" no tooltip) — mesmas da Liga
      const flagMatch = langImg ? (langImg.getAttribute('src') || '').match(/bandeiras\/([a-z]+)\.svg/i) : null;
      const qualityTip = cells[2].querySelector('.tooltip');
      const qualityMatch = (qualityTip ? qualityTip.textContent : '').match(/\((M|NM|SP|MP|HP|D)\)/i) ||
        cells[2].textContent.replace(/Qualidade/i, '').match(/\b(M|NM|SP|MP|HP|D)\b/i);
      const extrasCell = cells[3].cloneNode(true);
      extrasCell.querySelectorAll('.title-mobile').forEach(n => n.remove());

      rows.push({
        language,
        condition,
        price,
        langKey: flagMatch ? flagMatch[1].toLowerCase() : null,
        qualityAcron: qualityMatch ? qualityMatch[1].toUpperCase() : null,
        extrasLabels: extrasCell.textContent.split(',').map(e => e.trim()).filter(Boolean),
        extrasKey: ligaExtrasKey(cells[3].textContent),
        editionId: editionMatch ? editionMatch[1] : null,
        priceCell: cells[5]
      });
    });

    return rows;
  }

  // Só as linhas com conservação reconhecível (NM/Damaged) — usado tanto
  // por fetchStorePrice (filtra por idioma/conservação alvo) quanto por
  // fetchEcomItemDetails (pega a variante mais barata disponível)
  function parseEcomItemRows(doc) {
    return readEcomItemRows(doc).filter(row => row.condition);
  }

  // Nome da carta no formato da Liga numa página de item da engine
  // compartilhada ("Mudkip (#057/∞)" em .nome_en_cards)
  function readEcomItemCardName(doc) {
    const node = doc.querySelector('.nome_en_cards') || doc.querySelector('.nome_pt_cards');
    return node ? extractLigaCardName(node.textContent) : null;
  }

  // Busca o menor preço numa loja de vendedor único (ECOM_STORE_DOMAINS) pra
  // mesma carta, MESMA edição (cardCode obrigatório — sem ele não dá pra saber
  // com segurança qual impressão do nome abrir), idioma e conservação exatos.
  // Fluxo em duas etapas: busca por nome -> acha o link cujo texto bate com o
  // código da edição -> abre a página do item -> lê a tabela de variantes.
  async function fetchStorePrice(storeDomain, pokemonName, language, condition, cardCode) {
    if (!cardCode) return null;

    const cacheKey = `${storeDomain}:${normalizeText(pokemonName)}_${language}_${condition}_${cardCode}`;

    const cached = getCachedPrice(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    if (blockedDomains.has(storeDomain)) {
      return null;
    }

    try {
      const searchUrl = `https://www.${storeDomain}/?view=ecom/itens&busca=${encodeURIComponent(pokemonName)}`;

      const searchController = new AbortController();
      const searchTimeout = setTimeout(() => searchController.abort(), 8000);
      const searchResponse = await fetch(searchUrl, { signal: searchController.signal, headers: { 'Accept': 'text/html' } });
      clearTimeout(searchTimeout);

      if (!searchResponse.ok) {
        setCachedPrice(cacheKey, null);
        return null;
      }

      const searchHtml = await searchResponse.text();

      if (isCloudflareChallenge(searchHtml)) {
        blockedDomains.add(storeDomain);
        console.warn(`[Emerald TCG] ${storeDomain} bloqueou o acesso automatizado. Pulando essa loja pro resto da sessão.`);
        setCachedPrice(cacheKey, null);
        return null;
      }

      const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');
      const codeDigits = cardCode.replace(/\s+/g, '');
      const resultLink = [...searchDoc.querySelectorAll('a[href*="ecom/item&"], a[href*="ecom%2Fitem&"]')]
        .find(a => {
          const text = a.textContent.replace(/\s+/g, ' ').trim();
          return text && text.includes(codeDigits) && normalizeText(text).includes(normalizeText(pokemonName));
        });

      if (!resultLink) {
        setCachedPrice(cacheKey, null);
        return null;
      }

      const itemUrl = new URL(resultLink.getAttribute('href'), `https://www.${storeDomain}/`).toString();

      const itemController = new AbortController();
      const itemTimeout = setTimeout(() => itemController.abort(), 8000);
      const itemResponse = await fetch(itemUrl, { signal: itemController.signal, headers: { 'Accept': 'text/html' } });
      clearTimeout(itemTimeout);

      if (!itemResponse.ok) {
        setCachedPrice(cacheKey, null);
        return null;
      }

      const itemHtml = await itemResponse.text();
      const itemDoc = new DOMParser().parseFromString(itemHtml, 'text/html');

      let minPrice = Infinity;
      parseEcomItemRows(itemDoc).forEach(row => {
        if (row.language !== language || row.condition !== condition) return;
        if (row.price < minPrice) minPrice = row.price;
      });

      const result = minPrice === Infinity ? null : { price: minPrice, matchedBy: 'code', store: storeDisplayName(storeDomain) };
      setCachedPrice(cacheKey, result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(`[Emerald TCG] Erro ao buscar preço em ${storeDomain}:`, err);
      }
      setCachedPrice(cacheKey, null);
      return null;
    }
  }

  // Extrai o link pra página de detalhe do próprio item dentro do card da
  // listagem — na engine compartilhada (ECOM_STORE_DOMAINS) o preço da
  // listagem vem ofuscado (sprite CSS sem dígitos no HTML, técnica
  // anti-scraping), mas a página do item mostra o preço em texto normal.
  function extractEcomItemUrl(card) {
    const link = card.querySelector('a[href*="view=ecom/item"], a[href*="view=ecom%2Fitem"]');
    return link ? link.href : null;
  }

  // Resolve o preço + idioma/conservação reais de um item da listagem
  // abrindo sua página de detalhe (fallback usado quando extractCardPrice
  // não acha dígitos no card — caso do preço ofuscado em sprite). Pega a
  // variante mais barata com estoque, já que a listagem mostra um preço só
  // por item (sem indicar de antemão qual variante é essa).
  async function fetchEcomItemDetails(itemUrl) {
    const cacheKey = `ecom-item:${itemUrl}`;
    const cached = getCachedPrice(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const domain = new URL(itemUrl).hostname.replace(/^www\./, '');
    if (blockedDomains.has(domain)) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(itemUrl, { signal: controller.signal, headers: { 'Accept': 'text/html' } });
      clearTimeout(timeoutId);

      if (!response.ok) {
        setCachedPrice(cacheKey, null);
        return null;
      }

      const html = await response.text();

      if (isCloudflareChallenge(html)) {
        blockedDomains.add(domain);
        console.warn(`[Emerald TCG] ${domain} bloqueou o acesso automatizado. Pulando resolução de preço de listagem pro resto da sessão.`);
        setCachedPrice(cacheKey, null);
        return null;
      }

      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = parseEcomItemRows(doc);

      let best = null;
      rows.forEach(row => {
        if (!best || row.price < best.price) best = row;
      });

      // priceCell é um nó do documento parseado — não vai pro cache
      const result = best && {
        price: best.price,
        language: best.language,
        condition: best.condition,
        extrasKey: best.extrasKey,
        editionId: best.editionId,
        fullName: readEcomItemCardName(doc)
      };
      setCachedPrice(cacheKey, result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(`[Emerald TCG] Erro ao resolver preço de item em ${domain}:`, err);
      }
      setCachedPrice(cacheKey, null);
      return null;
    }
  }

  // Fila serial de avaliação de preço (badges de listagem) — evita disparar
  // dezenas de requisições simultâneas pra Liga Pokemon quando a página tem
  // muitos cards; processa uma carta por vez com um intervalo entre elas.
  const priceEvalQueue = [];
  let priceEvalRunning = false;

  function enqueuePriceEval(task) {
    priceEvalQueue.push(task);
    runPriceEvalQueue();
  }

  async function runPriceEvalQueue() {
    if (priceEvalRunning) return;
    priceEvalRunning = true;

    while (priceEvalQueue.length > 0) {
      const task = priceEvalQueue.shift();
      await evaluateCardPrice(task);
      await sleep(400);
    }

    priceEvalRunning = false;
  }

  // Busca o preço justo da carta na Liga Pokemon (mesma edição/idioma/
  // conservação da oferta, quando o código de edição está disponível) e
  // classifica a oferta em barata/justa/cara em relação a esse preço.
  // Se o preço não veio direto do texto da listagem (`offerPrice` nulo —
  // caso do preço ofuscado em sprite da engine compartilhada), resolve via
  // `itemUrl` antes de seguir; também aproveita idioma/conservação reais
  // dessa resolução, mais confiáveis que o default (a listagem dessa engine
  // não mostra idioma/qualidade em texto, só a página do item mostra).
  async function evaluateCardPrice({ sealWrapper, offerPrice, itemUrl, pokemonName, cardCode, fullName, extrasKey }) {
    if (!sealWrapper.isConnected) return;

    let resolvedOffer = offerPrice;
    const ligaOpts = { fullName, extrasKey };

    if (resolvedOffer == null && itemUrl) {
      const itemDetails = await fetchEcomItemDetails(itemUrl);
      if (!itemDetails) return;
      resolvedOffer = itemDetails.price;
      // A página do item traz o nome no formato da Liga, a edição exata e a
      // variante (Foil etc.) — mais confiáveis que o texto da listagem
      ligaOpts.fullName = itemDetails.fullName || fullName;
      ligaOpts.editionId = itemDetails.editionId;
      ligaOpts.extrasKey = itemDetails.extrasKey || extrasKey;
    }

    if (resolvedOffer == null) return;

    const marketResult = await fetchLigaPokemonPrice(pokemonName, cardCode, ligaOpts);
    if (!marketResult) return;

    applyPriceIndicator(sealWrapper, resolvedOffer, marketResult);
  }

  // Aplica a cor da borda do selo (verde/amarelo/vermelho, sempre visível —
  // indicador rápido de olhar) e prepara o preço médio pra ser revelado só
  // quando o usuário clicar no selo (ver addEmeraldSeal). `marketResult` é a
  // referência da Liga (fetchLigaPokemonPrice): `price` mínimo, `fair` médio,
  // `max` máximo
  function applyPriceIndicator(sealWrapper, offerPrice, marketResult) {
    if (!sealWrapper.isConnected) return;

    const icon = sealWrapper.querySelector('.emerald-badge-icon');
    if (!icon) return;

    icon.classList.remove('emerald-price-cheap', 'emerald-price-fair', 'emerald-price-expensive');

    const fairPrice = marketResult.fair;
    const ratio = offerPrice / fairPrice;
    let priceClass;
    let label;

    if (ratio <= PRICE_CHEAP_RATIO) {
      priceClass = 'emerald-price-cheap';
      label = 'abaixo do mercado';
    } else if (ratio >= PRICE_EXPENSIVE_RATIO) {
      priceClass = 'emerald-price-expensive';
      label = 'acima do mercado';
    } else {
      priceClass = 'emerald-price-fair';
      label = 'preço justo';
    }

    icon.classList.add(priceClass);

    const sampleInfo = `Liga Pokemon: mín. ${formatBRL(marketResult.price)} · médio ${formatBRL(fairPrice)} · máx. ${formatBRL(marketResult.max)} — ${marketResult.editionName}, ${marketResult.extrasLabel}`;

    // Guardado no próprio elemento — o clique (addEmeraldSeal) troca o
    // tooltip pra essa versão detalhada só quando o preço fica visível
    sealWrapper.dataset.priceDetail = `★ Pokémon Emerald Pokédex — ${formatBRL(offerPrice)} (${label}, ${sampleInfo})`;

    const priceTag = sealWrapper.querySelector('.emerald-price-tag');
    if (priceTag) {
      priceTag.classList.remove('emerald-price-cheap', 'emerald-price-fair', 'emerald-price-expensive');
      priceTag.classList.add(priceClass);
      priceTag.textContent = `méd. ${formatBRL(fairPrice)}`;
      // Marca que já tem preço pronto — o clique só revela a etiqueta
      // depois que essa flag existir (ver addEmeraldSeal)
      priceTag.dataset.ready = 'true';
    }
  }

  // Processa cards no site
  function processCards() {
    if (isCardDetailPage()) {
      console.log('[Emerald TCG] Página de detalhes - filtros desativados');
      return;
    }

    // Se estamos no carrinho, processa preços
    if (isCartPage()) {
      processCartPrices();
      return;
    }

    let foundCount = 0;
    const processedElements = new Set();

    console.log('[Emerald TCG] Processando cards...');

    for (const selector of ALL_CARD_SELECTORS) {
      const cards = document.querySelectorAll(selector);

      cards.forEach(card => {
        if (processedElements.has(card)) return;
        if (card.querySelector('.emerald-seal-wrapper')) return;

        const rect = card.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) return;
        if (rect.width > 1000 || rect.height > 1000) return;

        processedElements.add(card);

        const pokemonName = extractPokemonName(card);
        if (!pokemonName) return;

        if (isHoennPokemon(pokemonName)) {
          const image = selectCardImage(card);

          if (image) {
            const sealWrapper = addEmeraldSeal(image);

            if (sealWrapper) {
              foundCount++;

              const offerPrice = extractCardPrice(card);
              // Sem preço no texto do card (engine compartilhada ofusca o
              // preço da listagem em sprite CSS) — se o card linkar pra uma
              // página de item, resolve o preço de lá (evaluateCardPrice,
              // dentro da mesma fila serial pra manter o throttling)
              const itemUrl = offerPrice == null ? extractEcomItemUrl(card) : null;

              // Na própria Liga não compara com a Liga (e a aba oculta que a
              // extensão usa pra ler a Liga também cai aqui)
              if ((offerPrice != null || itemUrl) && currentHost !== 'ligapokemon.com.br') {
                enqueuePriceEval({
                  sealWrapper,
                  offerPrice,
                  itemUrl,
                  pokemonName,
                  cardCode: extractCardCode(card.textContent),
                  fullName: extractLigaCardName(card.textContent),
                  extrasKey: ligaExtrasKey(card.textContent)
                });
              }
            }
          }

          const owned = isOwnedCard(pokemonName);

          if (emeraldOnlyMode || missingOnlyMode) {
            if (missingOnlyMode && owned) {
              card.style.display = 'none';
            } else {
              card.style.display = '';
            }
          }

          card.setAttribute('data-emerald', 'true');
          card.setAttribute('data-owned', owned ? 'true' : 'false');
        } else {
          if (emeraldOnlyMode || missingOnlyMode) {
            card.style.display = 'none';
          }
          card.setAttribute('data-emerald', 'false');
        }
      });
    }

    if (foundCount > 0) {
      console.log(`[Emerald TCG] ✓ ${foundCount} cartas Emerald encontradas`);
      browser.runtime.sendMessage({ action: 'updateBadge', count: foundCount });
    }
  }

  // Processa preços no carrinho
  async function processCartPrices() {
    console.log('[Emerald TCG] Processando preços do carrinho...');

    // Seletores para itens do carrinho
    const cartItemSelectors = [
      '.cart-item',
      '[class*="cart-item"]',
      '[class*="cart_item"]',
      '.item-carrinho',
      '[class*="item-carrinho"]',
      '.carrinho-item',
      '[class*="carrinho"]',
      'tr',
      '.product-item',
      '[class*="product"]',
      '.item',
      '[class*="item"]'
    ];

    const processedItems = new Set();
    const currentDomain = window.location.hostname.replace(/^www\./, '');

    for (const selector of cartItemSelectors) {
      const items = document.querySelectorAll(selector);

      for (const item of items) {
        if (processedItems.has(item)) continue;
        if (item.querySelector('.emerald-price-compare')) continue;

        const nameNode = extractPokemonNameNode(item);
        const pokemonName = extractPokemonName(item);
        if (!pokemonName || !nameNode) continue;

        const details = extractCardDetails(item);
        const cardCode = extractCardCode(item.textContent);
        const priceElement = item.querySelector('.price, .valor, [class*="price"], [class*="valor"], .product-price, [class*="product-price"], .preco, [class*="preco"]');

        // Sem preço visível não é uma linha de carta no carrinho de verdade
        if (!priceElement) continue;

        processedItems.add(item);

        const cartPriceMatch = priceElement.textContent.match(/R\$\s*([\d.,]+)/);
        const cartPrice = cartPriceMatch ? parseFloat(cartPriceMatch[1].replace(/\./g, '').replace(',', '.')) : null;

        // Referência da Liga Pokemon (mín./médio) + menor preço entre as lojas
        // de vendedor único suportadas (mesma edição, idioma e conservação),
        // em paralelo — uma fonte bloqueada/fora do ar não atrapalha as outras
        const ligaPromise = fetchLigaPokemonPrice(pokemonName, cardCode, {
          fullName: extractLigaCardName(nameNode.textContent) || extractLigaCardName(item.textContent),
          extrasKey: ligaExtrasKey(item.textContent)
        });
        const storePromises = ECOM_STORE_DOMAINS
          .filter(domain => domain !== currentDomain)
          .map(domain => fetchStorePrice(domain, pokemonName, details.language, details.condition, cardCode));

        const [liga, storeSettled, recentSales] = await Promise.all([
          ligaPromise.catch(() => null),
          Promise.allSettled(storePromises),
          fetchRecentSales(pokemonName, details.language, details.condition, cardCode)
        ]);
        const storeResults = storeSettled
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => r.value);
        const bestStore = storeResults.length > 0
          ? storeResults.reduce((min, r) => (r.price < min.price ? r : min), storeResults[0])
          : null;

        if (liga || bestStore) {
          addPriceComparison(nameNode, liga, bestStore, cartPrice, recentSales);
        } else if (recentSales) {
          addRecentSalesOnly(nameNode, recentSales);
        }

        await sleep(400);
      }
    }
  }

  // Classe de cor comparando um preço com o médio da Liga
  function priceClassFor(price, avg) {
    const ratio = price / avg;
    if (ratio <= PRICE_CHEAP_RATIO) return { cls: 'emerald-price-cheap', label: 'abaixo do médio da Liga' };
    if (ratio >= PRICE_EXPENSIVE_RATIO) return { cls: 'emerald-price-expensive', label: 'acima do médio da Liga' };
    return { cls: 'emerald-price-fair', label: 'perto do médio da Liga' };
  }

  // Etiqueta com o mín./médio da Liga Pokemon (e a loja mais barata, se
  // alguma bater edição/idioma/conservação) ao lado do nome da carta no
  // carrinho — a cor compara o preço do carrinho com o médio da Liga
  function addPriceComparison(nameNode, liga, bestStore, cartPrice, recentSales) {
    if (nameNode.querySelector('.emerald-price-compare')) return;

    const compareElement = document.createElement('span');
    compareElement.className = 'emerald-price-compare';

    const parts = [];
    const tips = [];

    if (liga) {
      parts.push(`Liga mín. ${formatBRL(liga.price)} · méd. ${formatBRL(liga.fair)}`);
      tips.push(`Liga Pokemon (${liga.editionName}, ${liga.extrasLabel}): mín. ${formatBRL(liga.price)}, médio ${formatBRL(liga.fair)}, máx. ${formatBRL(liga.max)} — todas as línguas e conservações`);
      if (liga.matchedBy !== 'code') {
        tips.push('Edição exata não identificada: a faixa pode misturar impressões diferentes da carta');
        compareElement.classList.add('emerald-price-approx');
      }
      if (cartPrice) {
        const { cls, label } = priceClassFor(cartPrice, liga.fair);
        compareElement.classList.add(cls);
        tips.push(`Preço no carrinho ${formatBRL(cartPrice)}: ${label}`);
      }
    }

    if (bestStore) {
      parts.push(`${bestStore.store} ${formatBRL(bestStore.price)}`);
      tips.push(`Menor preço em outra loja: ${bestStore.store} ${formatBRL(bestStore.price)} (mesma edição, idioma e conservação)`);
    }

    if (recentSales) {
      tips.push(`Vendido recentemente na Liga: méd. ${formatBRL(recentSales.avg)} (última: ${formatBRL(recentSales.latest)}, ${recentSales.count} venda${recentSales.count > 1 ? 's' : ''})`);
    }

    compareElement.textContent = parts.join(' · ');
    compareElement.title = tips.join('\n');

    nameNode.appendChild(compareElement);
  }

  // Quando nenhum anúncio ativo bate idioma/edição/conservação, mas existem
  // vendas recentes registradas na Liga Pokemon com esses mesmos critérios —
  // mostra só o histórico de vendas (preço realizado, não pedido)
  function addRecentSalesOnly(nameNode, recentSales) {
    if (nameNode.querySelector('.emerald-price-compare')) return;

    const compareElement = document.createElement('span');
    compareElement.className = 'emerald-price-compare emerald-price-sales';
    compareElement.textContent = `vendido ~ ${formatBRL(recentSales.avg)}`;
    compareElement.title = `Média de ${recentSales.count} venda${recentSales.count > 1 ? 's' : ''} recente${recentSales.count > 1 ? 's' : ''} na Liga Pokemon (última: ${formatBRL(recentSales.latest)})`;

    nameNode.appendChild(compareElement);
  }

  // Página de uma carta (item) nas lojas da engine compartilhada. Pra cada
  // variante da tabela (edição + idioma + qualidade + extras), um bloco com:
  //   - anúncios ativos iguais na Liga (mesma edição/idioma/qualidade/extras)
  //   - referência geral da Liga pra edição/variante (mín./médio/máx.)
  //   - últimas 5 vendas realizadas iguais
  // e um selo ao lado do nome (✓ / − / ✕) dizendo se a compra compensa.
  async function processItemPage() {
    if (!/[?&]view=ecom(?:%2f|\/)item\b/i.test(window.location.href)) return;
    if (document.querySelector('.emerald-item-panel')) return;

    const nameBlock = document.querySelector('.nomes_cards');
    const fullName = readEcomItemCardName(document);
    if (!nameBlock || !fullName) return;
    // .nomes_cards é float:left nessa engine — o painel entra antes da
    // tabela de variantes (com clear:both no CSS) pra não ficar por baixo
    // do nome
    const anchor = document.getElementById('product--list');

    const rows = readEcomItemRows(document);
    const cardCode = extractCardCode(fullName);
    const pokemonName = fullName.replace(/\s*\(.*$/, '');

    const panel = document.createElement('div');
    panel.className = 'emerald-item-panel';
    panel.textContent = 'Liga Pokemon: buscando preços e últimas vendas…';
    if (anchor) {
      anchor.insertAdjacentElement('beforebegin', panel);
    } else {
      nameBlock.insertAdjacentElement('afterend', panel);
    }

    const data = await fetchLigaCardData(pokemonName, cardCode, fullName);
    panel.textContent = '';

    if (!data) {
      panel.classList.add('emerald-item-panel-empty');
      if (data === undefined && blockedDomains.has('ligapokemon.com.br') && ligaBlockedUrl) {
        panel.append('A Liga Pokemon pediu verificação de segurança. ');
        const link = document.createElement('a');
        link.href = ligaBlockedUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'emerald-item-panel-action';
        link.textContent = 'Abrir a carta na Liga';
        panel.append(link, ', passe pela verificação e recarregue esta página.');
      } else {
        panel.textContent = 'Liga Pokemon: carta não encontrada.';
      }
      return;
    }

    const title = document.createElement('a');
    title.className = 'emerald-item-panel-title';
    title.href = data.url;
    title.target = '_blank';
    title.rel = 'noopener';
    title.textContent = 'Liga Pokemon';
    panel.appendChild(title);

    // Agrupa as linhas da tabela por variante exata
    const variants = new Map();
    rows.forEach(row => {
      const key = [row.editionId, row.langKey, row.qualityAcron, row.extrasKey, significantExtras(row.extrasLabels)].join('_');
      if (!variants.has(key)) variants.set(key, { sample: row, rows: [] });
      variants.get(key).rows.push(row);
    });

    const verdicts = [];

    for (const { sample, rows: variantRows } of variants.values()) {
      const block = document.createElement('div');
      block.className = 'emerald-item-variant';
      panel.appendChild(block);

      const edition = pickLigaEdition(data.editions, sample.editionId, cardCode);
      const ids = ligaVariantIds(data, sample);
      const variantName = [
        sample.extrasLabels.join(', ') || 'Normal',
        ids.qualityAcron || '?',
        ids.languageLabel || '?'
      ].join(' · ');

      const head = document.createElement('div');
      head.className = 'emerald-item-variant-head';
      head.textContent = edition ? `${variantName} — ${edition.name} (${edition.code})` : variantName;
      block.appendChild(head);

      if (!edition) {
        addPanelLine(block, 'Edição exata não encontrada na Liga.', 'muted');
        continue;
      }

      // Anúncios iguais agora
      const listing = ligaListingStats(data, edition, ids, sample.extrasKey);
      if (listing && listing.priced > 0) {
        addPanelLine(block, `Anúncios iguais: mín. ${formatBRL(listing.min)} · méd. ${formatBRL(listing.avg)} · máx. ${formatBRL(listing.max)}` +
          ` (${listing.priced} com preço visível${listing.hidden ? `, ${listing.hidden} com preço oculto pela Liga` : ''})`);
      } else if (listing && listing.count > 0) {
        addPanelLine(block, `Anúncios iguais: ${listing.count}, todos com preço oculto pela Liga.`, 'muted');
      } else {
        addPanelLine(block, 'Anúncios iguais: nenhum no momento.', 'muted');
      }

      // Referência geral da Liga (todas as línguas/conservações)
      const ref = pickLigaExtrasPrice(edition.price, sample.extrasKey);
      if (ref) {
        const refLabel = ref.extrasKey === sample.extrasKey
          ? (LIGA_EXTRAS_LABEL[ref.extrasKey] || 'normal')
          : `${LIGA_EXTRAS_LABEL[ref.extrasKey] || 'normal'}, a Liga não tem ${LIGA_EXTRAS_LABEL[sample.extrasKey] || 'essa variante'}`;
        addPanelLine(block, `Geral da edição (${refLabel}, qualquer idioma/qualidade): mín. ${formatBRL(ref.min)} · médio ${formatBRL(ref.avg)} · máx. ${formatBRL(ref.max)}`, 'muted');
      }

      // Últimas vendas iguais
      const sales = await fetchLigaSales(data, edition, ids, sample.extrasKey, sample.extrasLabels);
      if (sales.sales.length > 0) {
        const line = addPanelLine(block, `Últimas ${sales.sales.length} venda${sales.sales.length > 1 ? 's' : ''} iguais (méd. ${formatBRL(sales.avg)}): `);
        sales.sales.forEach((sale, i) => {
          const chip = document.createElement('span');
          chip.className = 'emerald-sale-chip';
          chip.textContent = `${sale.date} ${formatBRL(sale.price)}`;
          if (sale.quant > 1) chip.title = `${sale.quant} unidades`;
          line.appendChild(chip);
        });
      } else if (sales.reason === 'login') {
        const line = addPanelLine(block, 'Últimas vendas: faça login na ', 'muted');
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'emerald-item-panel-action';
        link.textContent = 'Liga Pokemon';
        line.append(link, ' pra ver (a Liga só mostra vendas pra quem está logado).');
      } else if (sales.reason === 'sem vendas') {
        addPanelLine(block, 'Últimas vendas: nenhuma venda igual (idioma, qualidade e extras) registrada.', 'muted');
      } else {
        addPanelLine(block, 'Últimas vendas: não foi possível carregar agora.', 'muted');
      }

      // Referência pro veredito: vendas realizadas > anúncios iguais > geral
      let basis = null;
      if (sales.avg) basis = { value: sales.avg, label: `média das últimas ${sales.sales.length} vendas iguais` };
      else if (listing && listing.avg) basis = { value: listing.avg, label: 'média dos anúncios iguais na Liga' };
      else if (ref) basis = { value: ref.avg, label: 'médio geral da edição na Liga' };
      if (!basis) continue;

      variantRows.forEach(row => {
        const { cls } = priceClassFor(row.price, basis.value);
        const tag = document.createElement('span');
        tag.className = `emerald-row-price ${cls}`;
        tag.textContent = `${Math.round((row.price / basis.value) * 100)}%`;
        const position = { 'emerald-price-cheap': 'abaixo', 'emerald-price-fair': 'perto', 'emerald-price-expensive': 'acima' }[cls];
        tag.title = `${formatBRL(row.price)} — ${position} da ${basis.label} (${formatBRL(basis.value)})`;
        row.priceCell.appendChild(tag);
        verdicts.push({ ratio: row.price / basis.value, row, basis, variantName });
      });
    }

    addNameVerdict(verdicts);
  }

  function addPanelLine(parent, text, variant) {
    const line = document.createElement('div');
    line.className = `emerald-item-panel-line${variant ? ` emerald-item-panel-${variant}` : ''}`;
    line.textContent = text;
    parent.appendChild(line);
    return line;
  }

  // Selo ao lado do nome da carta: a variante mais vantajosa da página
  // (menor preço em relação à sua referência) decide o símbolo
  function addNameVerdict(verdicts) {
    const nameNode = document.querySelector('.nome_en_cards i') || document.querySelector('.nome_en_cards') || document.querySelector('.nome_pt_cards');
    if (!nameNode || verdicts.length === 0) return;
    nameNode.querySelectorAll('.emerald-verdict').forEach(n => n.remove());

    const best = verdicts.reduce((a, b) => (b.ratio < a.ratio ? b : a));
    const { cls } = priceClassFor(best.row.price, best.basis.value);
    const symbol = { 'emerald-price-cheap': '✓', 'emerald-price-fair': '−', 'emerald-price-expensive': '✕' }[cls];
    const meaning = {
      'emerald-price-cheap': 'compensa',
      'emerald-price-fair': 'na média ou um pouco acima',
      'emerald-price-expensive': 'acima da média'
    }[cls];

    const badge = document.createElement('span');
    badge.className = `emerald-verdict ${cls}`;
    badge.textContent = symbol;
    badge.title = `${meaning}: ${formatBRL(best.row.price)} (${best.variantName}) = ${Math.round(best.ratio * 100)}% da ${best.basis.label} (${formatBRL(best.basis.value)})`;
    nameNode.appendChild(badge);
  }

  // Aplica filtros
  function applyFilters() {
    if (isCardDetailPage() || isCartPage()) {
      return;
    }

    document.querySelectorAll(CARD_SELECTORS_JOINED).forEach(card => {
      const isEmerald = card.getAttribute('data-emerald') === 'true';
      const isOwned = card.getAttribute('data-owned') === 'true';

      if (!isEmerald) {
        card.style.display = (emeraldOnlyMode || missingOnlyMode) ? 'none' : '';
        return;
      }

      if (missingOnlyMode && isOwned) {
        card.style.display = 'none';
      } else {
        card.style.display = '';
      }
    });
  }

  // Adiciona selo do Rayquaza
  function addEmeraldSeal(imageElement) {
    if (imageElement.parentElement.querySelector('.emerald-seal-wrapper')) return null;

    // Não aplica o selo (36x36) em imagens pequenas (ícones, flags de idioma
    // etc.) — evita distorcer visualmente elementos que não são foto de carta
    const imgRect = imageElement.getBoundingClientRect();
    if (imgRect.width < 60 || imgRect.height < 60) return null;

    const sealWrapper = document.createElement('div');
    sealWrapper.className = 'emerald-seal-wrapper';
    sealWrapper.title = '★ Pokémon Emerald Pokédex';

    // Etiqueta com o preço justo de mercado — preenchida em segundo plano
    // por applyPriceIndicator assim que a comparação resolver, mas só fica
    // visível quando o usuário clica no selo (ver listener de clique abaixo)
    const priceTag = document.createElement('div');
    priceTag.className = 'emerald-price-tag';

    const sealImage = document.createElement('img');
    sealImage.src = RAYQUAZA_BADGE_URL;
    sealImage.className = 'emerald-badge-icon';
    sealImage.alt = 'Emerald';

    // Ordem importa: com flex-direction column, o selo (1º filho) fica no
    // topo, encostado no canto, e a etiqueta (2º filho) empilha logo abaixo
    sealWrapper.appendChild(sealImage);
    sealWrapper.appendChild(priceTag);

    // Clicar no selo alterna a etiqueta de preço justo — só faz efeito
    // depois que applyPriceIndicator marcar priceTag.dataset.ready (antes
    // disso não tem preço pra mostrar, então o clique não faz nada)
    sealWrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (priceTag.dataset.ready !== 'true') return;

      const isVisible = priceTag.classList.toggle('emerald-price-tag-visible');
      sealWrapper.title = isVisible ? sealWrapper.dataset.priceDetail : '★ Pokémon Emerald Pokédex';
    });

    const imgParent = imageElement.parentElement;
    if (imgParent) {
      imgParent.style.position = 'relative';
      imgParent.appendChild(sealWrapper);
    }

    return sealWrapper;
  }

  // Observer para mudanças no DOM
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldProcess = true;
      }
    });
    if (shouldProcess) {
      clearTimeout(window._emeraldProcessTimeout);
      window._emeraldProcessTimeout = setTimeout(processCards, 500);
    }
  });

  // Inicialização
  async function init() {
    console.log('[Emerald TCG] Inicializando extensão...');

    if (isCardDetailPage()) {
      console.log('[Emerald TCG] Página de detalhes - só o painel de preço da Liga');
      await loadPriceCacheFromStorage();
      processItemPage();
      return;
    }

    const data = await browser.storage.local.get(['emeraldOnlyMode', 'missingOnlyMode', 'trackerCards']);
    emeraldOnlyMode = data.emeraldOnlyMode === true;
    missingOnlyMode = data.missingOnlyMode === true;

    await loadPriceCacheFromStorage();

    if (missingOnlyMode && data.trackerCards) {
      data.trackerCards.forEach(card => {
        if (card.collected === true && card.name) {
          ownedCards.add(normalizeText(card.name));
        }
      });
      console.log(`[Emerald TCG] ${ownedCards.size} cartas carregadas`);
    }

    processCards();

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(processCards, 300);
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'scanPage') processCards();
      if (message.action === 'getCardCount') {
        sendResponse({ count: document.querySelectorAll('.emerald-seal-wrapper').length });
        return true;
      }
      if (message.action === 'toggleEmeraldOnly') {
        emeraldOnlyMode = message.enabled;
        applyFilters();
      }
      if (message.action === 'toggleMissingOnly') {
        missingOnlyMode = message.enabled;
        if (missingOnlyMode) {
          loadOwnedCards();
        }
        applyFilters();
      }
      if (message.action === 'reloadOwnedCards') {
        loadOwnedCards();
      }
      if (message.action === 'applyMissingFilter') {
        // Aplica filtro de cartas faltantes
        if (message.missingCards && Array.isArray(message.missingCards)) {
          // Atualiza ownedCards com base nas missingCards
          // missingCards contém nomes das cartas que estão faltando (não coletadas)
          const missingSet = new Set(message.missingCards.map(c => normalizeText(c)));

          // Mostra apenas cards que estão na lista de faltantes
          document.querySelectorAll(CARD_SELECTORS_JOINED).forEach(card => {
            const isEmerald = card.getAttribute('data-emerald') === 'true';
            if (!isEmerald) {
              card.style.display = 'none';
              return;
            }

            const pokemonName = extractPokemonName(card);
            if (!pokemonName) {
              card.style.display = 'none';
              return;
            }

            const normalizedName = normalizeText(pokemonName);
            let isMissing = false;

            for (const missing of missingSet) {
              if (normalizedName.includes(missing) || missing.includes(normalizedName)) {
                isMissing = true;
                break;
              }
            }

            card.style.display = isMissing ? '' : 'none';
          });
        }
      }
    });

    console.log('[Emerald TCG] Extensão inicializada');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
