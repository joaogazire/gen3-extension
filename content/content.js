/* Emerald TCG Finder - Content Script
 * Identifica cartas do set Emerald (ex9) em sites de TCG e adiciona selo do Rayquaza
 * Modo APENAS EMERALD: oculta itens que não pertencem à Pokédex do Emerald
 * Modo APENAS FALTANDO: oculta itens que o usuário já possui no Emerald TCG Tracker
 * Carrinho: mín./médio da Liga Pokemon e selo de preço em cada carta
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
  // Persiste em browser.storage.local (TTL de 2h) pra sobreviver à
  // navegação entre páginas — sem isso, cada página nova refaz as mesmas
  // buscas de carta já vistas na sessão de compra.
  const priceCache = new Map();
  const PRICE_CACHE_STORAGE_KEY = 'priceCache';
  const PRICE_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
  // A referência geral da Liga (selo da busca) e o índice da busca por
  // Pokémon mudam devagar: 24h. Anúncios, vendas etc. seguem com 2h.
  const REFERENCE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  function cacheTtlFor(key) {
    return key.startsWith('ligapokemon.com.br:ref:') || key.startsWith('ligapokemon.com.br:search:')
      ? REFERENCE_CACHE_TTL_MS
      : PRICE_CACHE_TTL_MS;
  }

  // Requisições de rede feitas por esta página (Liga e página de item). A
  // fila de preços compara antes/depois de cada carta: se tudo veio do
  // cache, não espera o intervalo entre cartas
  let networkRequests = 0;
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
          if (entry && typeof entry.fetchedAt === 'number' && (now - entry.fetchedAt) < cacheTtlFor(key)) {
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
    if ((Date.now() - entry.fetchedAt) >= cacheTtlFor(key)) {
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
      if ((now - entry.fetchedAt) < cacheTtlFor(key)) {
        serializable[key] = entry;
      }
    }

    browser.storage.local.set({ [PRICE_CACHE_STORAGE_KEY]: serializable }).catch(err => {
      console.error('[Emerald TCG] Erro ao salvar cache de preços:', err);
    });
  }

  // Faixas pra classificar um preço em relação à referência (médio da Liga,
  // ou média das vendas/anúncios iguais na página do item): até 95% é
  // "barata", a partir de 110% é "cara", entre os dois é "justa".
  const PRICE_CHEAP_RATIO = 0.95;
  const PRICE_EXPENSIVE_RATIO = 1.1;

  // Selo de veredito (página da carta e busca): símbolo e significado por faixa
  // Ícones em SVG (16x16): caractere de texto (✓ − ✕) sai descentralizado
  // conforme a fonte da loja
  const VERDICT_ICON = {
    'emerald-price-cheap': 'M4.6 8.4l2.3 2.3 4.6-5',
    'emerald-price-fair': 'M4.8 8h6.4',
    'emerald-price-expensive': 'M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2',
    'emerald-price-unknown': 'M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M8 11.6v.1'
  };
  const VERDICT_MEANING = {
    'emerald-price-cheap': 'compensa',
    'emerald-price-fair': 'na média ou um pouco acima',
    'emerald-price-expensive': 'acima da média'
  };
  // Motivo de uma carta ficar sem comparação (selo cinza "?" na busca)
  const UNKNOWN_REASON = {
    'not-found': 'Sem comparação: a Liga Pokemon não tem essa carta, ou não tem preço pra essa impressão',
    'no-offer': 'Sem comparação: não deu pra ler o preço desta loja',
    blocked: 'Sem comparação: a Liga pediu verificação (Cloudflare) — abra a Liga, passe pela verificação e recarregue',
    'rate-limited': 'Sem comparação: a loja limitou as requisições (erro 1015) — espere alguns minutos e recarregue',
    'liga-limited': 'Sem comparação: a Liga Pokemon limitou as requisições (erro 1015) — espere alguns minutos e recarregue',
    error: 'Sem comparação: erro ao buscar o preço (detalhes no console, F12)'
  };

  function createVerdictBadge(cls, extraClass = '') {
    const badge = document.createElement('span');
    badge.className = `emerald-verdict ${extraClass} ${cls}`.replace(/\s+/g, ' ').trim();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', VERDICT_ICON[cls]);
    svg.appendChild(path);
    badge.appendChild(svg);
    return badge;
  }

  const PRICE_ELEMENT_SELECTOR = '.price, .valor, [class*="price"], [class*="valor"], .product-price, [class*="product-price"], .preco, [class*="preco"]';

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
  // Casa só palavras inteiras do caminho/query — "cart" solto pegaria
  // "cartas" (ex.: /cartas-pokemon) e jogaria a listagem no modo carrinho
  function isCartPage() {
    const target = `${window.location.pathname}${window.location.search}`.toLowerCase();
    return /(^|[\/=&?_-])(carrinho|cart|checkout|pedido)(?![a-z])/.test(target);
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

  // Palavras normalizadas de um nome de carta. Hífen, "&" e barra viram
  // espaço antes de normalizar ("Blaziken-FB", "Pikachu&Zekrom-GX"), senão
  // normalizeText colaria as palavras
  function nameWords(text) {
    return normalizeText(String(text || '').replace(/[-_&/]/g, ' ')).split(/\s+/).filter(Boolean);
  }

  // Verifica se um nome de Pokémon pertence à Pokédex do Emerald. Compara
  // palavra inteira: substring dava falso positivo em texto comum
  // ("natural" -> natu, "abraço" -> abra, "Baron" -> aron)
  function isHoennPokemon(name) {
    return nameWords(name).some(word => HOENN_POKEDEX.has(word));
  }

  // Carrega cartas do usuário do storage.local
  // Troca a coleção inteira só depois de ler (esvaziar antes deixava tudo
  // "faltando" enquanto o storage respondia)
  function loadOwnedCards() {
    browser.storage.local.get(['trackerCards'], (data) => {
      if (data.trackerCards && Array.isArray(data.trackerCards)) {
        const loaded = new Set();
        data.trackerCards.forEach(card => {
          if (card.collected === true && card.name) {
            loaded.add(normalizeText(card.name));
          }
        });
        ownedCards = loaded;
        console.log(`[Emerald TCG] ${ownedCards.size} cartas carregadas`);
        applyFilters();
        // O save pode ter mudado quais cartas faltam
        flushDeferredPriceEvals();
      }
    });
  }

  // Verifica se o usuário já possui a carta (independe do filtro estar
  // ligado — o filtro decide o que fazer com isso)
  function isOwnedCard(cardName) {
    if (ownedCards.size === 0) return false;

    // O Tracker guarda uma carta por Pokémon: basta uma palavra do nome da
    // carta ser um Pokémon já coletado
    return nameWords(cardName).some(word => ownedCards.has(word));
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

    // Idioma: nome por extenso ou sigla isolada/entre parênteses — "en "
    // e "jp" soltos batiam no meio de qualquer texto
    let language = 'pt'; // padrão
    if (/\b(ingl[eê]s|english)\b|[(\[]en[)\]]|^\s*en\s*$/.test(text)) {
      language = 'en';
    } else if (/\b(japon[eê]s|japanese)\b|[(\[](jp|ja)[)\]]|^\s*(jp|ja)\s*$/.test(text)) {
      language = 'jp';
    } else if (/\b(espanhol|spanish|español)\b|[(\[]es[)\]]|^\s*es\s*$/.test(text)) {
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

  // Código de edição/coleção da carta como o site mostra (ex: "010/165",
  // "TG14/TG30", "#057/∞" dos promos). Mantém zeros à esquerda e o "#" —
  // é o mesmo formato do nome da carta na Liga Pokemon e nas lojas da mesma
  // engine, então o código vai direto pra busca/comparação de texto.
  // Letras antes ("TG14", "SWSH145") e/ou depois do número ("012JP",
  // "025PB", "055P" — impressões japonesas e variantes)
  const CARD_CODE_PATTERN = /(#?[A-Z]{0,4}\d{1,4}[A-Za-z]{0,3})\s*\/\s*([A-Z]{0,4}\d{1,4}|∞)/;

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

  // Elemento de preço de um card/linha, ignorando os da própria extensão
  // (a etiqueta do selo, "emerald-price-tag", também casa com [class*="price"])
  // e preferindo o que mostra "R$"
  function findPriceElement(root) {
    const candidates = [...root.querySelectorAll(PRICE_ELEMENT_SELECTOR)]
      .filter(el => !el.closest('.emerald-seal-wrapper, .emerald-price-compare, .emerald-verdict, .emerald-item-panel'));
    return candidates.find(el => /R\$/.test(el.textContent)) || candidates[0] || null;
  }

  // Extrai o preço em R$ exibido no próprio card da listagem
  function extractCardPrice(card) {
    const priceElement = findPriceElement(card);
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
  // Os que limitaram as requisições (429 / erro 1015 do Cloudflare)
  const rateLimitedDomains = new Set();

  // Resposta de "muitas requisições" (429 — o erro 1015 do Cloudflare vem
  // assim) ou de bloqueio: para de pedir àquela loja nesta página e NÃO
  // guarda no cache (daqui a pouco pode voltar a responder)
  function markIfRateLimited(domain, response) {
    if (response.status === 429 || response.status === 1015) {
      if (!rateLimitedDomains.has(domain)) {
        console.warn(`[Emerald TCG] ${domain} limitou as requisições (erro 1015/429). Parando de consultar essa loja nesta página.`);
      }
      rateLimitedDomains.add(domain);
      blockedDomains.add(domain);
      return true;
    }
    return false;
  }

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
  // A Liga limitou as requisições (erro 1015): quanto falta da pausa que o
  // background impôs
  let ligaRateLimited = false;
  let ligaRetryAfterMs = 0;

  // Espera a pausa da Liga acabar (mostrando a contagem no mini Pikachu) e
  // libera pra tentar de novo
  async function waitLigaCooldown(onTick) {
    const until = Date.now() + (ligaRetryAfterMs || 60000);
    miniProgress.paused(until);
    while (Date.now() < until) {
      if (onTick) onTick(Math.ceil((until - Date.now()) / 1000));
      await sleep(Math.min(1000, until - Date.now()));
    }
    ligaRateLimited = false;
    ligaRetryAfterMs = 0;
    miniProgress.resumed();
  }

  // Página de erro/bloqueio do Cloudflare (não é "carta não encontrada" —
  // não pode ir pro cache)
  function isCloudflareErrorPage(html) {
    return /Error 10\d\d|You are being rate limited|cf-error-details|<title>[^<]*(Access denied|Attention Required|Just a moment)/i.test(html);
  }
  // URL da Liga que pediu verificação — o painel da página da carta oferece
  // um link pra ela, pro usuário passar pelo desafio interativo e voltar
  let ligaBlockedUrl = null;

  async function fetchLigaHtml(url) {
    if (blockedDomains.has('ligapokemon.com.br')) return null;

    let response;
    try {
      networkRequests++;
      response = await browser.runtime.sendMessage({ action: 'fetchLiga', url });
    } catch (err) {
      console.error('[Emerald TCG] Erro ao buscar na Liga Pokemon:', err);
      return null;
    }
    if (!response) return null;

    if (response.rateLimited) {
      // Não bloqueia a Liga na página: o background segura as requisições
      // durante a pausa e quem chamou espera (waitLigaCooldown) e tenta de novo
      if (!ligaRateLimited) console.warn('[Emerald TCG] A Liga Pokemon limitou as requisições (erro 1015). Pausando e retomando sozinho.');
      ligaRateLimited = true;
      ligaRetryAfterMs = Math.max(response.retryAfterMs || 0, 5000);
      return null;
    }

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
    // sem \b no fim: o textContent cola células vizinhas ("FoilR$ 30,00");
    // mas "holon" (Holon Phantoms, Holon's Castform) não é holo
    if (/\bfoil|\bholo(?!n)/.test(lower)) return '2';
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
    const m = String(text || '').match(/([A-Za-zÀ-ÿ0-9'’.:\- ]{2,60}?)\s*\(\s*(#?[A-Z]{0,4}\d{1,4}[A-Za-z]{0,3}\s*\/\s*(?:[A-Z]{0,4}\d{1,4}|∞))\s*\)/);
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

  // Também persiste em browser.storage.local por PRICE_CACHE_TTL_MS, uma
  // chave por carta (só os campos usados), com um índice pra limpar as
  // vencidas — voltar à página da carta não refaz a busca na Liga
  const LIGA_CARD_STORAGE_PREFIX = 'ligaCard:';
  const LIGA_CARD_INDEX_KEY = 'ligaCardIndex';
  const STOCK_FIELDS = ['id', 'p', 'idEdicao', 'num', 'idioma', 'qualid', 'extras', 'lj_id', 'precoFinal', 'preco', 'precoOcr'];

  async function readStoredCardData(memoKey) {
    const key = LIGA_CARD_STORAGE_PREFIX + memoKey;
    try {
      const entry = (await browser.storage.local.get(key))[key];
      if (entry && typeof entry.fetchedAt === 'number' && Date.now() - entry.fetchedAt < PRICE_CACHE_TTL_MS) {
        return entry.value;
      }
    } catch (err) {
      console.error('[Emerald TCG] Erro ao ler carta do cache:', err);
    }
    return undefined;
  }

  function storeCardData(memoKey, data) {
    const key = LIGA_CARD_STORAGE_PREFIX + memoKey;
    const now = Date.now();
    const value = data && {
      ...data,
      stock: data.stock.map(s => Object.fromEntries(STOCK_FIELDS.filter(f => s[f] !== undefined).map(f => [f, s[f]])))
    };
    browser.storage.local.get(LIGA_CARD_INDEX_KEY).then(stored => {
      const index = stored[LIGA_CARD_INDEX_KEY] || {};
      const expired = Object.keys(index).filter(k => now - index[k] >= PRICE_CACHE_TTL_MS);
      expired.forEach(k => delete index[k]);
      index[key] = now;
      return Promise.all([
        expired.length ? browser.storage.local.remove(expired) : null,
        browser.storage.local.set({ [key]: { value, fetchedAt: now }, [LIGA_CARD_INDEX_KEY]: index })
      ]);
    }).catch(err => console.error('[Emerald TCG] Erro ao salvar carta no cache:', err));
  }

  // `onStage` (opcional) é avisado de cada etapa: 'page' (buscando a página
  // da carta) e 'decode' (lendo os preços ocultos) — usado pela barra de
  // progresso do painel
  async function fetchLigaCardData(pokemonName, cardCode, fullName, onStage = () => {}) {
    const queries = ligaQueryCandidates(pokemonName, cardCode, fullName);
    const memoKey = queries[0];
    if (ligaCardDataCache.has(memoKey)) return ligaCardDataCache.get(memoKey);

    const stored = await readStoredCardData(memoKey);
    if (stored !== undefined) {
      ligaCardDataCache.set(memoKey, stored);
      return stored;
    }

    for (const query of queries) {
      const url = `https://www.ligapokemon.com.br/?view=cards/card&card=${encodeURIComponent(query)}`;
      onStage('page');
      const html = await fetchLigaHtml(url);
      if (html == null) return undefined;
      // Página de erro do Cloudflare passou como "normal": não conclui nada
      // (e não guarda no cache)
      if (isCloudflareErrorPage(html)) return undefined;

      const editions = readLigaScriptVar(html, 'cards_editions');
      if (Array.isArray(editions) && editions.length > 0) {
        const stock = readLigaScriptVar(html, 'cards_stock');
        const data = {
          url,
          editions,
          stock: Array.isArray(stock) ? stock : [],
          pricesDecoded: false,
          languages: readLigaScriptVar(html, 'dataLanguage') || [],
          qualities: readLigaScriptVar(html, 'dataQuality') || [],
          extras: readLigaScriptVar(html, 'dataExtras') || []
        };
        onStage('decode');
        data.pricesDecoded = await decodeLigaStockPrices(html, data.stock);
        ligaCardDataCache.set(memoKey, data);
        storeCardData(memoKey, data);
        return data;
      }
      console.info(`[Emerald TCG] Liga: "${query}" não abriu uma carta${/<title>([^<]*)/.test(html) ? ` (página: ${html.match(/<title>([^<]*)/)[1].trim()})` : ''}`);
    }

    ligaCardDataCache.set(memoKey, null);
    storeCardData(memoKey, null);
    return null;
  }

  // Preços que a Liga manda como imagem (precoCss): o background lê a imagem
  // de números (ocr/liga-ocr.js) e o preço entra em `precoOcr` de cada
  // anúncio. Devolve true se a leitura da página passou na conferência
  // (preços na mesma ordem que a Liga indica em `p`).
  async function decodeLigaStockPrices(html, stock) {
    const hidden = stock.filter(s => s.precoFinal == null && s.precoCss);
    if (hidden.length === 0) return true;

    const css = [];
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let m;
    while ((m = styleRe.exec(html))) {
      if (m[1].includes('imgnum')) css.push(m[1]);
    }
    if (css.length === 0) return false;

    let response;
    try {
      response = await browser.runtime.sendMessage({
        action: 'decodeLigaPrices',
        css: css.join('\n'),
        stock: stock.map(s => ({ id: s.id, p: s.p, precoCss: s.precoCss, precoFinal: s.precoFinal }))
      });
    } catch (err) {
      console.error('[Emerald TCG] Erro ao ler os preços ocultos da Liga:', err);
      return false;
    }
    if (!response || !response.consistent) {
      console.warn('[Emerald TCG] Liga: leitura dos preços ocultos não passou na conferência — ficam ocultos');
      return false;
    }
    stock.forEach(s => {
      const price = response.prices[s.id];
      if (price != null) s.precoOcr = price;
    });
    console.info(`[Emerald TCG] Liga: ${Object.keys(response.prices).length}/${hidden.length} preços ocultos lidos`);
    return true;
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

  // Extras de um anúncio do cards_stock: a Liga guarda o PRODUTO dos ids
  // (primos) dos extras — Foil=2, Promo=7, então 14 = Foil + Promo; 0 = nenhum
  function stockExtrasLabels(data, value) {
    const n = Number(value) || 0;
    if (n <= 1) return [];
    return data.extras
      .filter(e => Number(e.id) > 1 && n % Number(e.id) === 0)
      .map(e => e.label);
  }

  // Preço de um anúncio: o texto que a Liga manda ou o lido da imagem
  function stockPrice(s) {
    if (s.precoFinal != null) return parseLigaPrice(s.precoFinal);
    return s.precoOcr != null ? s.precoOcr : null;
  }

  // Id da loja aberta no cadastro da Liga (lj_id dos anúncios) — as lojas
  // dessa engine anunciam pelo comparador da Liga, e sem isso a loja seria
  // comparada com ela mesma
  function ownLigaStoreId() {
    const cartLink = document.querySelector('a[href*="view=ecom/carrinho"][href*="id="]');
    const fromLink = cartLink && cartLink.getAttribute('href').match(/[?&]id=(\d+)/);
    if (fromLink) return fromLink[1];
    const scripts = [...document.querySelectorAll('script:not([src])')].map(el => el.textContent).join('\n');
    const fromScript = scripts.match(/EcomConversion\.checkReferrer\((\d+)/) || scripts.match(/"store":(\d+)/);
    return fromScript ? fromScript[1] : null;
  }

  // Anúncios ativos na Liga com a MESMA edição, número, idioma, qualidade e
  // extras (sem contar "Promo") da linha da loja, fora os da própria loja.
  // `hidden` conta os que ficaram sem preço (imagem que não deu pra ler).
  function ligaListingStats(data, edition, ids, extrasLabels, ownStoreId) {
    if (!ids.languageId || !ids.qualityId) return null;
    const wantedExtras = significantExtras(extrasLabels);
    const allMatches = data.stock.filter(s =>
      String(s.idEdicao) === String(edition.id) &&
      cardNumberKey(s.num) === cardNumberKey(edition.num) &&
      String(s.idioma) === ids.languageId &&
      String(s.qualid) === ids.qualityId &&
      significantExtras(stockExtrasLabels(data, s.extras)) === wantedExtras
    );
    const own = allMatches.filter(s => ownStoreId && String(s.lj_id) === String(ownStoreId));
    const matches = allMatches.filter(s => !own.includes(s));
    const prices = matches.map(stockPrice).filter(p => p != null).sort((a, b) => a - b);
    return {
      count: matches.length,
      ownExcluded: own.length,
      hidden: matches.length - prices.length,
      prices,
      min: prices.length ? prices[0] : null,
      avg: prices.length ? prices.reduce((sum, p) => sum + p, 0) / prices.length : null,
      max: prices.length ? prices[prices.length - 1] : null,
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
  // `onPause(segundos)` (opcional) é avisado se a Liga pedir pausa.
  async function fetchLigaSales(data, edition, ids, extrasKey, extrasLabels, onPause) {
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
    for (;;) {
      try {
        networkRequests++;
        response = await browser.runtime.sendMessage({ action: 'fetchLigaJson', url, pageUrl: data.url });
      } catch (err) {
        console.error('[Emerald TCG] Erro ao buscar últimas vendas na Liga:', err);
        return { sales: [], reason: 'erro' };
      }
      if (!response || !response.rateLimited) break;
      // A Liga pediu pausa: espera e tenta de novo
      ligaRateLimited = true;
      ligaRetryAfterMs = Math.max(response.retryAfterMs || 0, 5000);
      await waitLigaCooldown(onPause);
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

  // Índice da busca da Liga (?view=cards/search) por nome: cada resultado
  // traz o nome no formato da Liga, edição, número e mín./médio/máx. (os
  // mesmos da página da carta, mas sem separar variante). "R$ 0,00" = sem
  // preço. Devolve undefined quando a Liga não respondeu (não vai pro cache).
  async function fetchLigaSearchIndex(query) {
    const cacheKey = `ligapokemon.com.br:search:${nameWords(query).join(' ')}`;
    const cached = getCachedPrice(cacheKey);
    if (cached !== undefined) return cached;

    const html = await fetchLigaHtml(`https://www.ligapokemon.com.br/?view=cards/search&tipo=1&card=${encodeURIComponent(query)}`);
    if (html == null || isCloudflareErrorPage(html)) return undefined;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const entries = [];
    doc.querySelectorAll('.mtg-single').forEach(el => {
      const link = el.querySelector('a[href*="view=cards/card"]');
      if (!link) return;
      let url;
      try {
        url = new URL(link.getAttribute('href'), 'https://www.ligapokemon.com.br/');
      } catch (err) {
        return;
      }
      const name = url.searchParams.get('card');
      if (!name) return;
      const priceOf = selector => {
        const node = el.querySelector(selector);
        return node ? parseLigaPrice(node.textContent) : null;
      };
      entries.push({
        name,
        ed: url.searchParams.get('ed') || '',
        num: url.searchParams.get('num') || '',
        min: priceOf('.price-min'),
        avg: priceOf('.price-avg'),
        max: priceOf('.price-max'),
        url: url.toString()
      });
    });
    // Página sem a lista de resultados não é "nenhum resultado": não guarda
    if (entries.length === 0 && !/id="mtg-cards"|Itens encontrados/.test(html)) return undefined;

    setCachedPrice(cacheKey, entries);
    return entries;
  }

  // Referência da carta a partir da busca: mesmo nome (sem o código) e mesmo
  // número. Várias edições com esse número: junta as faixas, como na página
  // da carta.
  async function ligaSearchPrice(pokemonName, cardCode, fullName) {
    if (!cardCode) return null;
    const baseName = String(fullName || pokemonName || '').replace(/\s*\(.*$/, '').trim();
    if (!baseName) return null;

    const entries = await fetchLigaSearchIndex(baseName);
    if (!entries) return null;

    // Compara o código inteiro (número E total da coleção): só o número
    // misturava coleções ("5/40" com "05/12")
    const codeKey = code => {
      const [num, total] = String(code || '').split('/');
      return `${cardNumberKey(num)}/${cardNumberKey(total)}`;
    };
    const wantedName = nameWords(baseName).join(' ');
    const wantedCode = codeKey(cardCode);
    const matches = entries.filter(entry => entry.avg > 0 &&
      codeKey(extractCardCode(entry.name)) === wantedCode &&
      nameWords(entry.name.replace(/\s*\(.*$/, '')).join(' ') === wantedName);
    if (matches.length === 0) return null;

    return {
      price: Math.min(...matches.map(m => m.min || m.avg)),
      fair: matches.reduce((sum, m) => sum + m.avg, 0) / matches.length,
      max: Math.max(...matches.map(m => m.max || m.avg)),
      matchedBy: matches.length === 1 ? 'code' : 'name',
      editionName: matches.length === 1 ? (matches[0].ed || 'edição') : `${matches.length} edições`,
      extrasLabel: 'referência da busca da Liga',
      url: matches[0].url,
      store: 'Liga Pokemon'
    };
  }

  async function fetchLigaPokemonPrice(pokemonName, cardCode, opts = {}) {
    const queries = ligaQueryCandidates(pokemonName, cardCode, opts.fullName);
    const extrasKey = opts.extrasKey || '0';
    const cacheKey = `ligapokemon.com.br:ref:${normalizeText(queries[0])}_${opts.editionId || '~'}_${extrasKey}`;

    const cached = getCachedPrice(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // 1º: a busca da Liga por Pokémon — uma requisição traz todas as
    // impressões com esse nome, e as outras cartas do mesmo Pokémon na
    // página já saem do cache. Sem a impressão lá (ou sem preço), cai na
    // página da carta como antes.
    const fromSearch = await ligaSearchPrice(pokemonName, cardCode, opts.fullName);
    if (fromSearch) {
      setCachedPrice(cacheKey, fromSearch);
      return fromSearch;
    }
    if (ligaRateLimited) return null;

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

  // Lê todas as linhas de variante (edição/idioma/qualidade/extras/estoque/
  // preço) da tabela ".table-cards-row" de uma página de item da engine de
  // e-commerce compartilhada, só com estoque e preço
  // válidos. `condition` vem null nos níveis intermediários (ver
  // classifyEcomQuality); `editionId` é o id da edição no cadastro da Liga
  // (link `txt_edicao=` da primeira coluna).
  const FLAG_LANGUAGE = { pt: 'pt', en: 'en', jp: 'jp', ja: 'jp', es: 'es' };

  function readEcomItemRows(doc) {
    const rows = [];

    doc.querySelectorAll('.table-cards-row').forEach(row => {
      const cells = row.querySelectorAll('.table-cards-body-cell');
      if (cells.length < 6) return;

      const editionLink = cells[0].querySelector('a[href*="txt_edicao="]');
      const editionMatch = editionLink ? editionLink.getAttribute('href').match(/txt_edicao=(\d+)/) : null;

      // Idioma pela sigla da bandeira (images/bandeiras/pt.svg -> "pt");
      // sem bandeira reconhecida, pelo alt/title da imagem
      const langImg = cells[1].querySelector('img');
      const flagMatch = langImg ? (langImg.getAttribute('src') || '').match(/bandeiras\/([a-z]+)\.svg/i) : null;
      const langKey = flagMatch ? flagMatch[1].toLowerCase() : null;
      const language = FLAG_LANGUAGE[langKey] ||
        classifyLanguageCondition(langImg ? (langImg.getAttribute('alt') || langImg.getAttribute('title') || '') : '').language;

      const condition = classifyEcomQuality(cells[2].textContent);

      const stockMatch = cells[4].textContent.match(/(\d+)\s*unid/i);
      const stock = stockMatch ? parseInt(stockMatch[1], 10) : 0;
      if (stock <= 0) return;

      const priceMatch = cells[5].textContent.match(/R\$\s*([\d.,]+)/);
      if (!priceMatch) return;

      const price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
      if (!(price > 0)) return;

      // Sigla da qualidade ("Near Mint (NM)" no tooltip) — mesma da Liga
      const qualityTip = cells[2].querySelector('.tooltip');
      const qualityMatch = (qualityTip ? qualityTip.textContent : '').match(/\((M|NM|SP|MP|HP|D)\)/i) ||
        cells[2].textContent.replace(/Qualidade/i, '').match(/\b(M|NM|SP|MP|HP|D)\b/i);
      const extrasCell = cells[3].cloneNode(true);
      extrasCell.querySelectorAll('.title-mobile').forEach(n => n.remove());

      rows.push({
        language,
        condition,
        price,
        langKey,
        qualityAcron: qualityMatch ? qualityMatch[1].toUpperCase() : null,
        extrasLabels: extrasCell.textContent.split(',').map(e => e.trim()).filter(Boolean),
        extrasKey: ligaExtrasKey(cells[3].textContent),
        editionId: editionMatch ? editionMatch[1] : null,
        priceCell: cells[5]
      });
    });

    return rows;
  }

  // Só as linhas com conservação reconhecível (NM/Damaged) — usado por
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

  // Extrai o link pra página de detalhe do próprio item dentro do card da
  // listagem — na engine compartilhada o preço da
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
      networkRequests++;
      const response = await fetch(itemUrl, { signal: controller.signal, headers: { 'Accept': 'text/html' } });
      clearTimeout(timeoutId);

      if (markIfRateLimited(domain, response)) return null;
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
      // Erro de rede/tempo esgotado: sem cache, a próxima visita tenta de novo
      return null;
    }
  }

  // Fila serial de avaliação de preço (badges de listagem) — evita disparar
  // dezenas de requisições simultâneas pra Liga Pokemon quando a página tem
  // muitos cards; processa uma carta por vez com um intervalo entre elas.
  const priceEvalQueue = [];
  let priceEvalRunning = false;

  // Buscas guardadas porque o filtro escondia a carta (ver processCards)
  let deferredPriceEvals = [];

  // "Apenas Faltando" ligado e a carta já está na coleção: não busca preço.
  // ("Apenas Emerald" não precisa de nada aqui: só carta Emerald entra na fila)
  function isPriceEvalFiltered(task) {
    return missingOnlyMode && isOwnedCard(task.pokemonName);
  }

  function flushDeferredPriceEvals() {
    const pending = deferredPriceEvals;
    deferredPriceEvals = [];
    pending.forEach(task => {
      if (task.sealWrapper.isConnected) schedulePriceEval(task);
    });
  }

  // Busca só o que está na tela: o card entra na fila quando chega a 400px
  // da área visível (e as próximas conforme a rolagem). Quem abre a página e
  // sai logo quase não gasta requisição; card escondido (filtros) nunca
  // aparece, então nunca é buscado.
  const pendingVisible = new Map();
  const visibilityObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const task = pendingVisible.get(entry.target);
          visibilityObserver.unobserve(entry.target);
          pendingVisible.delete(entry.target);
          if (task) queueVisiblePriceEval(task);
        });
      }, { rootMargin: '400px 0px' })
    : null;

  function queueVisiblePriceEval(task) {
    if (!task.sealWrapper.isConnected) return;
    // Carta que o filtro "Apenas Faltando" pula fica guardada e entra na
    // fila se o filtro for desligado
    if (isPriceEvalFiltered(task)) deferredPriceEvals.push(task);
    else enqueuePriceEval(task);
  }

  function schedulePriceEval(task) {
    if (!visibilityObserver) {
      queueVisiblePriceEval(task);
      return;
    }
    pendingVisible.set(task.card, task);
    visibilityObserver.observe(task.card);
  }

  function enqueuePriceEval(task) {
    priceEvalQueue.push(task);
    miniProgress.added();
    runPriceEvalQueue();
  }

  async function runPriceEvalQueue() {
    if (priceEvalRunning) return;
    priceEvalRunning = true;

    while (priceEvalQueue.length > 0) {
      const task = priceEvalQueue.shift();
      const requestsBefore = networkRequests;
      // O filtro pode ter sido ligado depois de a carta entrar na fila
      if (isPriceEvalFiltered(task)) {
        deferredPriceEvals.push(task);
        miniProgress.finished('skipped');
        continue;
      }
      let status;
      try {
        status = await evaluateCardPrice(task);
      } catch (err) {
        console.error('[Emerald TCG] Erro ao avaliar preço:', err);
        status = 'error';
      }
      // A Liga pediu pausa: a carta volta pro começo da fila, espera e segue
      if (status === 'liga-limited') {
        priceEvalQueue.unshift(task);
        await waitLigaCooldown();
        continue;
      }
      addListingUnknown(task.card, status);
      miniProgress.finished(status);
      // Intervalo só pra poupar a Liga: carta resolvida pelo cache segue direto
      if (networkRequests !== requestsBefore) await sleep(400);
    }

    priceEvalRunning = false;
    miniProgress.idle();
  }

  // Mini Pikachu no canto inferior direito: conta as cartas da busca já
  // comparadas com a Liga; quando a fila esvazia, espera 3s (pode entrar
  // mais carta com a rolagem), mostra um resumo e some depois de 10s.
  const MINI_SUMMARY_DELAY_MS = 3000;
  const MINI_HIDE_DELAY_MS = 10000;

  const miniProgress = (() => {
    let root = null;
    let text = null;
    let bar = null;
    let stats = null;
    let summaryTimer = null;
    let hideTimer = null;
    let pauseTimer = null;

    function reset() {
      stats = { total: 0, done: 0, ok: 0, 'no-offer': 0, 'not-found': 0, blocked: 0, 'rate-limited': 0, 'liga-limited': 0, error: 0 };
    }

    function build() {
      root = document.createElement('div');
      root.className = 'emerald-mini';
      root.setAttribute('role', 'status');
      root.setAttribute('aria-live', 'polite');

      const runner = document.createElement('div');
      runner.className = 'emerald-mini-runner';
      runner.appendChild(createPikachuSvg());

      const body = document.createElement('div');
      body.className = 'emerald-mini-body';
      text = document.createElement('div');
      text.className = 'emerald-mini-text';
      const track = document.createElement('div');
      track.className = 'emerald-mini-track';
      bar = document.createElement('div');
      bar.className = 'emerald-mini-fill';
      track.appendChild(bar);
      body.append(text, track);

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'emerald-mini-close';
      close.setAttribute('aria-label', 'Fechar');
      close.textContent = '×';
      close.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        remove();
      });

      root.append(runner, body, close);
      document.body.appendChild(root);
    }

    function remove() {
      clearTimeout(summaryTimer);
      clearTimeout(hideTimer);
      if (root) {
        const node = root;
        node.classList.add('emerald-mini-out');
        setTimeout(() => node.remove(), 250);
      }
      root = null;
      // Próxima leva de cartas começa uma contagem nova
      stats = null;
      clearInterval(pauseTimer);
    }

    function renderProgress() {
      if (!root) return;
      if (root.classList.contains('emerald-mini-paused')) return; // a contagem da pausa fica na tela
      root.classList.remove('emerald-progress-done', 'emerald-mini-summary');
      text.textContent = '';
      const label = document.createElement('span');
      label.className = 'emerald-mini-label';
      label.textContent = 'Preços da Liga';
      const count = document.createElement('strong');
      count.textContent = `${stats.done}/${stats.total}`;
      text.append(label, ' ', count);
      bar.style.width = `${stats.total ? (stats.done / stats.total) * 100 : 0}%`;
    }

    function renderSummary() {
      if (!root) return;
      root.classList.add('emerald-progress-done', 'emerald-mini-summary');
      bar.style.width = '100%';
      text.textContent = '';

      const errors = stats['no-offer'] + stats['not-found'] + stats.blocked + stats['rate-limited'] + stats['liga-limited'] + stats.error;
      const line = document.createElement('div');
      const ok = document.createElement('span');
      ok.className = 'emerald-mini-ok';
      ok.textContent = `✓ ${stats.ok} com preço`;
      line.appendChild(ok);
      if (errors > 0) {
        const bad = document.createElement('span');
        bad.className = 'emerald-mini-bad';
        bad.textContent = `✕ ${errors} sem comparação`;
        line.append(' · ', bad);
      }
      text.appendChild(line);

      const details = [
        stats['not-found'] && `${stats['not-found']} sem preço na Liga`,
        stats['no-offer'] && `${stats['no-offer']} sem preço na loja`,
        stats.blocked && `${stats.blocked} bloqueada${stats.blocked > 1 ? 's' : ''} pela verificação da Liga`,
        stats['rate-limited'] && `${stats['rate-limited']} sem preço: a loja limitou as requisições`,
        stats['liga-limited'] && `${stats['liga-limited']} sem preço: a Liga limitou as requisições`,
        stats.error && `${stats.error} com erro`
      ].filter(Boolean);
      if (details.length) {
        const small = document.createElement('div');
        small.className = 'emerald-mini-details';
        small.textContent = details.join(' · ');
        text.appendChild(small);
      }

      hideTimer = setTimeout(remove, MINI_HIDE_DELAY_MS);
    }

    return {
      added() {
        clearTimeout(summaryTimer);
        clearTimeout(hideTimer);
        if (!stats) reset();
        stats.total++;
        if (!root) build();
        renderProgress();
      },
      finished(status) {
        if (!stats) return; // fechado no ×: não reabre por causa da leva atual
        if (status === 'skipped') {
          stats.total = Math.max(0, stats.total - 1);
        } else {
          stats.done++;
          stats[status in stats ? status : 'error']++;
        }
        renderProgress();
      },
      idle() {
        if (!stats || !root) return;
        clearTimeout(summaryTimer);
        summaryTimer = setTimeout(renderSummary, MINI_SUMMARY_DELAY_MS);
      },
      // Pausa imposta pela Liga (erro 1015): contagem até retomar
      paused(until) {
        if (!root) return;
        clearInterval(pauseTimer);
        const tick = () => {
          const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
          root.classList.add('emerald-mini-paused');
          text.textContent = '';
          const label = document.createElement('span');
          label.className = 'emerald-mini-label';
          label.textContent = 'Liga pediu uma pausa · retomando em ';
          const count = document.createElement('strong');
          count.textContent = `${left}s`;
          text.append(label, count);
          if (left <= 0) clearInterval(pauseTimer);
        };
        tick();
        pauseTimer = setInterval(tick, 1000);
      },
      resumed() {
        clearInterval(pauseTimer);
        if (!root) return;
        root.classList.remove('emerald-mini-paused');
        if (stats) renderProgress();
      }
    };
  })();

  // Busca o preço justo da carta na Liga Pokemon (mesma edição/idioma/
  // conservação da oferta, quando o código de edição está disponível) e
  // classifica a oferta em barata/justa/cara em relação a esse preço.
  // Se o preço não veio direto do texto da listagem (`offerPrice` nulo —
  // caso do preço ofuscado em sprite da engine compartilhada), resolve via
  // `itemUrl` antes de seguir; também aproveita idioma/conservação reais
  // dessa resolução, mais confiáveis que o default (a listagem dessa engine
  // não mostra idioma/qualidade em texto, só a página do item mostra).
  // Preço da listagem nas lojas da engine compartilhada: os dígitos são
  // pedaços de uma imagem (sem texto no HTML). Manda as classes de cada
  // dígito + o CSS da página pro background ler a imagem — sem abrir a
  // página do item (uma requisição à loja por carta estourava o limite
  // delas, erro 1015)
  function readEcomPriceTokens(card) {
    const box = card.querySelector('.price .vidgmi, [class*="price"] .vidgmi');
    if (!box) return null;
    const tokens = [];
    for (const el of box.children) {
      if (/v\.png/.test(el.getAttribute('style') || '')) tokens.push(',');
      else if (el.className && typeof el.className === 'string') tokens.push(el.className);
    }
    return tokens.length ? tokens : null;
  }

  function pageSpriteCss() {
    return [...document.querySelectorAll('style')]
      .map(el => el.textContent)
      .filter(text => text.includes('imgnum'))
      .join('\n');
  }

  async function decodeListingPrice(card) {
    const tokens = readEcomPriceTokens(card);
    if (!tokens) return null;
    const css = pageSpriteCss();
    if (!css) return null;
    try {
      const response = await browser.runtime.sendMessage({ action: 'decodeEcomPrice', css, tokens });
      return response && response.price > 0 ? response.price : null;
    } catch (err) {
      console.error('[Emerald TCG] Erro ao ler o preço da listagem:', err);
      return null;
    }
  }

  // Devolve como terminou (pro resumo do mini Pikachu): 'ok', 'no-offer'
  // (sem preço legível na loja), 'not-found' (Liga sem a carta/preço),
  // 'blocked' (Liga pediu verificação) ou 'skipped' (card saiu da página)
  async function evaluateCardPrice({ card, sealWrapper, offerPrice, itemUrl, pokemonName, cardCode, fullName, extrasKey }) {
    if (!sealWrapper.isConnected) return 'skipped';

    let resolvedOffer = offerPrice;
    const ligaOpts = { fullName, extrasKey };

    // 1º: lê o preço da própria listagem (sem requisição à loja)
    if (resolvedOffer == null) {
      resolvedOffer = await decodeListingPrice(card);
    }

    // 2º (só se a leitura falhar): abre a página do item
    if (resolvedOffer == null && itemUrl) {
      const itemDetails = await fetchEcomItemDetails(itemUrl);
      if (!itemDetails) {
        const domain = new URL(itemUrl).hostname.replace(/^www\./, '');
        return rateLimitedDomains.has(domain) ? 'rate-limited' : 'no-offer';
      }
      resolvedOffer = itemDetails.price;
      // A página do item traz o nome no formato da Liga, a edição exata e a
      // variante (Foil etc.) — mais confiáveis que o texto da listagem
      ligaOpts.fullName = itemDetails.fullName || fullName;
      ligaOpts.editionId = itemDetails.editionId;
      ligaOpts.extrasKey = itemDetails.extrasKey || extrasKey;
    }

    if (resolvedOffer == null) return 'no-offer';

    const marketResult = await fetchLigaPokemonPrice(pokemonName, cardCode, ligaOpts);
    if (!marketResult) {
      if (ligaRateLimited) return 'liga-limited';
      return blockedDomains.has('ligapokemon.com.br') ? 'blocked' : 'not-found';
    }

    applyPriceIndicator(sealWrapper, resolvedOffer, marketResult, card);
    return 'ok';
  }

  // Aplica a cor da borda do selo (verde/amarelo/vermelho, sempre visível —
  // indicador rápido de olhar) e prepara o preço médio pra ser revelado só
  // quando o usuário clicar no selo (ver addEmeraldSeal). `marketResult` é a
  // referência da Liga (fetchLigaPokemonPrice): `price` mínimo, `fair` médio,
  // `max` máximo
  function applyPriceIndicator(sealWrapper, offerPrice, marketResult, card) {
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

    if (card) addListingVerdict(card, priceClass, offerPrice, fairPrice, marketResult);
  }

  // Selo ✓ / − / ✕ à esquerda do preço do card na busca — mesma comparação
  // da borda do selo do Rayquaza (preço da oferta x médio da Liga)
  function addListingVerdict(card, priceClass, offerPrice, fairPrice, marketResult) {
    if (!card.isConnected) return;
    const priceElement = findPriceElement(card);
    if (!priceElement) return;
    card.querySelectorAll('.emerald-verdict-listing').forEach(n => n.remove());

    const badge = createVerdictBadge(priceClass, 'emerald-verdict-listing');
    badge.title = `${VERDICT_MEANING[priceClass]}: ${formatBRL(offerPrice)} = ${Math.round((offerPrice / fairPrice) * 100)}% do médio da Liga (${formatBRL(fairPrice)} — ${marketResult.editionName}, ${marketResult.extrasLabel})`;
    priceElement.insertBefore(badge, priceElement.firstChild);
  }

  // Selo cinza "?" quando a carta ficou sem comparação — com o motivo no
  // tooltip, pra falha não ficar invisível
  function addListingUnknown(card, status) {
    if (!card || !card.isConnected || !UNKNOWN_REASON[status]) return;
    const priceElement = findPriceElement(card);
    if (!priceElement) return;
    card.querySelectorAll('.emerald-verdict-listing').forEach(n => n.remove());
    const badge = createVerdictBadge('emerald-price-unknown', 'emerald-verdict-listing');
    badge.title = UNKNOWN_REASON[status];
    priceElement.insertBefore(badge, priceElement.firstChild);
  }

  // Processa cards no site
  function processCards() {
    // Carrinho antes: a página do carrinho pode parecer "página de detalhe"
    // (poucos cards, um bloco "cart-info-...") e nunca ser processada
    if (isCartPage()) {
      processCartPrices();
      return;
    }

    if (isCardDetailPage()) {
      console.log('[Emerald TCG] Página de detalhes - filtros desativados');
      return;
    }

    console.log('[Emerald TCG] Processando cards...');
    const foundCount = scanCards(ALL_CARD_SELECTORS, true);

    if (foundCount > 0) {
      console.log(`[Emerald TCG] ✓ ${foundCount} cartas Emerald encontradas`);
      browser.runtime.sendMessage({ action: 'updateBadge', count: foundCount });
    }
  }

  // Selo + busca de preço (e, com `applyModes`, os filtros Apenas Emerald /
  // Faltando) nos cards que casam com `selectors`. Usado na listagem e nos
  // "Cards Associados" da página da carta. Devolve quantos cards Emerald
  // novos recebeu selo.
  function scanCards(selectors, applyModes) {
    let foundCount = 0;
    const processedElements = new Set();

    for (const selector of selectors) {
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
          const owned = isOwnedCard(pokemonName);
          card.dataset.emeraldName = pokemonName;
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
              const hasPriceImage = offerPrice == null && !!readEcomPriceTokens(card);

              if (offerPrice != null || itemUrl || hasPriceImage) {
                const task = {
                  card,
                  sealWrapper,
                  offerPrice,
                  itemUrl,
                  pokemonName,
                  cardCode: extractCardCode(card.textContent),
                  fullName: extractLigaCardName(card.textContent),
                  extrasKey: ligaExtrasKey(card.textContent)
                };
                // Só entra na fila quando o card chega perto da tela
                schedulePriceEval(task);
              }
            }
          }

          if (applyModes && (emeraldOnlyMode || missingOnlyMode)) {
            if (missingOnlyMode && owned) {
              card.style.display = 'none';
            } else {
              card.style.display = '';
            }
          }

          card.setAttribute('data-emerald', 'true');
          card.setAttribute('data-owned', owned ? 'true' : 'false');
        } else {
          if (applyModes && (emeraldOnlyMode || missingOnlyMode)) {
            card.style.display = 'none';
          }
          card.setAttribute('data-emerald', 'false');
        }
      });
    }

    return foundCount;
  }

  // Carrinho. Nas lojas da engine compartilhada (.table-cart-row) cada
  // linha ganha, no espaço entre os dados da carta e a quantidade, o mín. e
  // o médio da Liga e o selo ✓/−/✕; em outros sites, a etiqueta genérica
  // ao lado do nome. Só a Liga é consultada (comparar com as outras lojas
  // eram até 2 requisições por loja por carta — e as lojas bloqueiam com o
  // erro 1015). Carta buscada nas últimas 2h vem do cache.
  async function processCartPrices() {
    const ecomRows = document.querySelectorAll('.table-cart-row');
    if (ecomRows.length > 0) {
      await processEcomCart(ecomRows);
      return;
    }

    console.log('[Emerald TCG] Processando preços do carrinho...');

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

    for (const selector of cartItemSelectors) {
      for (const item of document.querySelectorAll(selector)) {
        if (processedItems.has(item)) continue;
        if (item.querySelector('.emerald-price-compare')) continue;

        const nameNode = extractPokemonNameNode(item);
        const pokemonName = extractPokemonName(item);
        if (!pokemonName || !nameNode) continue;

        const priceElement = findPriceElement(item);
        // Sem preço visível não é uma linha de carta no carrinho de verdade
        if (!priceElement) continue;

        processedItems.add(item);

        const cartPriceMatch = priceElement.textContent.match(/R\$\s*([\d.,]+)/);
        const cartPrice = cartPriceMatch ? parseFloat(cartPriceMatch[1].replace(/\./g, '').replace(',', '.')) : null;

        const requestsBefore = networkRequests;
        const liga = await fetchLigaPokemonPrice(pokemonName, extractCardCode(item.textContent), {
          fullName: extractLigaCardName(nameNode.textContent) || extractLigaCardName(item.textContent),
          extrasKey: ligaExtrasKey(item.textContent)
        }).catch(() => null);

        if (liga) addPriceComparison(nameNode, liga, cartPrice);
        if (networkRequests !== requestsBefore) await sleep(400);
      }
    }
  }

  const CART_LANGUAGE_BY_LABEL = { 'japones': 'jp', 'ingles': 'en', 'portugues': 'pt', 'espanhol': 'es', 'frances': 'fr', 'alemao': 'de', 'italiano': 'it', 'coreano': 'ko' };

  // Dados de uma linha do carrinho da engine compartilhada: nome no formato
  // da Liga, edição (txt_edicao — mesmo id da Liga), idioma (bandeira),
  // qualidade "(NM)", extras ("Foil"...) e o preço unitário exato (campo
  // escondido txt_preco_*, "0.44")
  function readEcomCartRow(row) {
    const info = row.querySelector('.cart-info-produto');
    const title = row.querySelector('.checkout-product--title');
    const fullName = title ? extractLigaCardName(title.textContent) : null;
    if (!info || !fullName) return null;

    const priceInput = row.querySelector('input[id^="txt_preco_"]');
    let unitPrice = priceInput ? parseFloat(priceInput.value) : NaN;
    if (!(unitPrice > 0)) {
      const priceText = row.querySelector('.checkout-product--price');
      const m = priceText && priceText.textContent.match(/R\$\s*([\d.,]+)/);
      unitPrice = m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : NaN;
    }

    let editionId = null;
    let langKey = null;
    let qualityAcron = null;
    const extrasLabels = [];
    row.querySelectorAll('.checkout-product--description').forEach(p => {
      const text = p.textContent.replace(/\s+/g, ' ').trim();
      const editionLink = p.querySelector('a[href*="txt_edicao="]');
      if (editionLink) {
        const m = editionLink.getAttribute('href').match(/txt_edicao=(\d+)/);
        if (m) editionId = m[1];
        return;
      }
      const quality = text.match(/\((M|NM|SP|MP|HP|D)\)\s*$/i);
      if (quality) {
        qualityAcron = quality[1].toUpperCase();
        return;
      }
      const flag = p.querySelector('img[src*=".svg"]');
      if (flag) {
        const src = flag.getAttribute('src') || '';
        const m = src.match(/bandeiras\/([a-z]+)\.svg/i) || src.match(/\/([a-z]{2,4})(?:_[A-Za-z0-9]+)?\.svg/i);
        langKey = m ? m[1].toLowerCase() : CART_LANGUAGE_BY_LABEL[normalizeText(flag.getAttribute('alt') || text)] || null;
        return;
      }
      if (text) extrasLabels.push(text);
    });

    return {
      info,
      fullName,
      pokemonName: fullName.replace(/\s*\(.*$/, ''),
      cardCode: extractCardCode(fullName),
      unitPrice: unitPrice > 0 ? unitPrice : null,
      editionId,
      langKey,
      qualityAcron,
      extrasLabels,
      extrasKey: ligaExtrasKey(extrasLabels.join(', '))
    };
  }

  // Coluna "Tracker" entre Produto e Quantidade: as células copiam as
  // classes das da própria loja (mesma fonte, padding e alinhamento). Toda
  // linha ganha a célula, mesmo sem carta, pra tabela não desalinhar.
  function ensureCartColumn(rows) {
    const header = document.querySelector('.table-cart-header');
    const firstHeaderCell = header && header.querySelector('.table-cart-header-cell');
    // Marca a tabela pra tirar a largura fixa do título (ver CSS)
    const table = document.querySelector('.table-cart');
    if (table) table.classList.add('emerald-cart-table');
    if (firstHeaderCell && !header.querySelector('.emerald-cart-col')) {
      const col = document.createElement('div');
      col.className = `${firstHeaderCell.className} emerald-cart-col`;
      col.textContent = 'Tracker';
      firstHeaderCell.insertAdjacentElement('afterend', col);
    }
    rows.forEach(row => {
      if (row.querySelector(':scope > .emerald-cart-cell')) return;
      const firstCell = row.querySelector(':scope > .table-cart-body-cell');
      if (!firstCell) return;
      const cell = document.createElement('div');
      cell.className = `${firstCell.className} emerald-cart-cell`;
      firstCell.insertAdjacentElement('afterend', cell);
    });
  }

  async function processEcomCart(rows) {
    const ownStoreId = ownLigaStoreId();
    let added = 0;
    ensureCartColumn(rows);

    for (const row of rows) {
      if (row.querySelector('.emerald-cart-price')) continue;
      const cell = row.querySelector(':scope > .emerald-cart-cell');
      const item = readEcomCartRow(row);
      if (!item || !cell) continue;

      const slot = document.createElement('div');
      slot.className = 'emerald-cart-price emerald-cart-loading';
      slot.textContent = 'buscando…';
      cell.appendChild(slot);
      miniProgress.added();
      added++;

      const requestsBefore = networkRequests;
      let status;
      for (;;) {
        try {
          status = await fillCartPrice(slot, item, ownStoreId);
        } catch (err) {
          console.error('[Emerald TCG] Erro no preço do carrinho:', err);
          status = 'error';
        }
        if (status !== 'liga-limited') break;
        // A Liga pediu pausa: espera (contagem na etiqueta) e tenta de novo
        await waitLigaCooldown(left => { slot.textContent = `pausa da Liga · ${left}s`; });
        slot.textContent = 'buscando…';
      }
      if (status !== 'ok') {
        slot.className = 'emerald-cart-price emerald-cart-empty';
        slot.textContent = '';
        slot.appendChild(createVerdictBadge('emerald-price-unknown', 'emerald-verdict-listing'));
        slot.append('sem preço');
        slot.title = UNKNOWN_REASON[status] || UNKNOWN_REASON.error;
      }
      miniProgress.finished(status);
      if (networkRequests !== requestsBefore) await sleep(400);
    }

    if (added > 0) miniProgress.idle();
  }

  // Referência pra linha: anúncios iguais na Liga (mesma edição, idioma,
  // qualidade e extras, sem a própria loja) quando todos têm preço lido;
  // senão, a referência geral da edição/variante
  async function fillCartPrice(slot, item, ownStoreId) {
    const data = await fetchLigaCardData(item.pokemonName, item.cardCode, item.fullName);
    if (!data) {
      if (ligaRateLimited) return 'liga-limited';
      if (data === undefined && blockedDomains.has('ligapokemon.com.br')) return 'blocked';
      return data === undefined ? 'error' : 'not-found';
    }

    const edition = pickLigaEdition(data.editions, item.editionId, item.cardCode);
    if (!edition) return 'not-found';

    const ids = ligaVariantIds(data, { langKey: item.langKey, qualityAcron: item.qualityAcron });
    const listing = ligaListingStats(data, edition, ids, item.extrasLabels, ownStoreId);
    const ref = pickLigaExtrasPrice(edition.price, item.extrasKey);

    const variantDesc = [item.extrasLabels.join(', ') || 'normal', item.qualityAcron, ids.languageLabel].filter(Boolean).join(' · ');
    let basis = null;
    if (listing && listing.priced > 0 && listing.hidden === 0) {
      basis = { min: listing.min, avg: listing.avg, label: `${listing.priced} anúncio${listing.priced > 1 ? 's' : ''} igua${listing.priced > 1 ? 'is' : 'l'} na Liga (${variantDesc})` };
    } else if (ref) {
      basis = { min: ref.min, avg: ref.avg, label: `geral da edição na Liga (${LIGA_EXTRAS_LABEL[ref.extrasKey] || 'normal'}, qualquer idioma/qualidade)` };
    }
    if (!basis) return 'not-found';

    slot.className = 'emerald-cart-price';
    slot.textContent = '';

    const tips = [`Liga Pokemon — ${edition.name} (${edition.code}): ${basis.label}`];
    if (item.unitPrice) {
      const { cls } = priceClassFor(item.unitPrice, basis.avg);
      const badge = createVerdictBadge(cls, 'emerald-verdict-listing');
      slot.appendChild(badge);
      tips.unshift(`${VERDICT_MEANING[cls]}: ${formatBRL(item.unitPrice)} = ${Math.round((item.unitPrice / basis.avg) * 100)}% do médio`);
    }

    const values = document.createElement('div');
    values.className = 'emerald-cart-price-values';
    // Mín. e méd. em linhas separadas (etiqueta estreita); o mín. é o link
    // pra carta na Liga, já na edição e número exatos
    const lineFor = (text, value, href) => {
      const line = document.createElement('div');
      const strong = document.createElement(href ? 'a' : 'strong');
      strong.textContent = formatBRL(value);
      if (href) {
        strong.href = href;
        strong.target = '_blank';
        strong.rel = 'noopener';
        strong.className = 'emerald-cart-price-link';
        strong.title = 'Abrir esta carta na Liga Pokemon';
      }
      line.append(`${text} `, strong);
      return line;
    };
    const cardUrl = `${data.url}&ed=${encodeURIComponent(edition.code)}&num=${encodeURIComponent(edition.num)}`;
    values.append(lineFor('mín.', basis.min, cardUrl), lineFor('méd.', basis.avg));
    slot.appendChild(values);
    slot.title = tips.join('\n');
    return 'ok';
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
  function addPriceComparison(nameNode, liga, cartPrice) {
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


    compareElement.textContent = parts.join(' · ');
    compareElement.title = tips.join('\n');

    nameNode.appendChild(compareElement);
  }

  // Pikachu em pixel art (22x16, virado pra direita) pra barra de progresso:
  // o corpo é igual nos dois quadros, só as pernas mudam (esticadas /
  // recolhidas) — alternados pelo CSS dão a corrida
  const PIKACHU_BODY = [
    '...........kk.........',
    '...........kky....kk..',
    '............yyy...yk..',
    '.............yyy.yy...',
    'yyyy.........yyyyyy...',
    '.yyy........yyyyyyyy..',
    '..yy........yyyyywkyy.',
    '.yyyy.......yyyyykkyy.',
    '..byy......yyyyyyyyyk.',
    '...bb.yyyyyyyyyyyrryy.',
    '....yyyyyyyyyyyyyrryy.',
    '.....yyyyyyyyyyyyyyy..',
    '......yyyyyyyyyyyyy...',
    '......oyyyyyyyyyyoy...'
  ];
  const PIKACHU_LEGS = [
    ['.....yy..........yy...', '....yy............yy..'],
    ['.......yy.....yy......', '........yy...yy.......']
  ];
  const PIKACHU_COLORS = { k: '#1c1c1c', y: '#f8d030', o: '#c98c14', r: '#e3463a', b: '#7a4a18', w: '#ffffff' };
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Uma <g> por quadro, com um <rect> por trecho contínuo da mesma cor
  function pikachuFrame(rows, className) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', className);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const color = PIKACHU_COLORS[row[x]];
        let end = x + 1;
        while (end < row.length && row[end] === row[x]) end++;
        if (color) {
          const rect = document.createElementNS(SVG_NS, 'rect');
          rect.setAttribute('x', x);
          rect.setAttribute('y', y);
          rect.setAttribute('width', end - x);
          rect.setAttribute('height', 1);
          rect.setAttribute('fill', color);
          g.appendChild(rect);
        }
        x = end;
      }
    });
    return g;
  }

  function createPikachuSvg() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 22 16');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'emerald-pika');
    PIKACHU_LEGS.forEach((legs, i) => {
      svg.appendChild(pikachuFrame([...PIKACHU_BODY, ...legs], `emerald-pika-frame emerald-pika-frame-${i}`));
    });
    return svg;
  }

  // Barra de progresso da busca na Liga. Cada etapa ocupa uma faixa
  // (`from`..`to`); enquanto a etapa espera a Liga, a barra avança devagar
  // dentro da faixa, sem passar do fim dela — o progresso não mente sobre
  // etapas que ainda não aconteceram.
  function createLigaProgress(parent) {
    const root = document.createElement('div');
    root.className = 'emerald-progress';
    root.setAttribute('role', 'progressbar');
    root.setAttribute('aria-valuemin', '0');
    root.setAttribute('aria-valuemax', '100');

    const head = document.createElement('div');
    head.className = 'emerald-progress-head';
    const label = document.createElement('span');
    label.className = 'emerald-progress-label';
    const pct = document.createElement('span');
    pct.className = 'emerald-progress-pct';
    head.append(label, pct);

    const lane = document.createElement('div');
    lane.className = 'emerald-progress-lane';
    const track = document.createElement('div');
    track.className = 'emerald-progress-track';
    const fill = document.createElement('div');
    fill.className = 'emerald-progress-fill';
    track.appendChild(fill);
    const runner = document.createElement('div');
    runner.className = 'emerald-progress-runner';
    runner.appendChild(createPikachuSvg());
    lane.append(runner, track);

    root.append(head, lane);
    parent.appendChild(root);

    let shown = 0;
    let ceiling = 0;

    function render() {
      const value = Math.min(100, shown);
      root.style.setProperty('--p', value.toFixed(2));
      pct.textContent = `${Math.floor(value)}%`;
      root.setAttribute('aria-valuenow', String(Math.floor(value)));
    }

    const timer = setInterval(() => {
      if (shown < ceiling) {
        shown = Math.min(ceiling, shown + Math.max(0.08, (ceiling - shown) * 0.05));
        render();
      }
    }, 80);

    render();

    return {
      stage(text, from, to) {
        label.textContent = text;
        shown = Math.max(shown, from);
        ceiling = Math.max(ceiling, to - 0.5);
        render();
      },
      // Completa a barra, deixa o Pikachu chegar e some; resolve quando
      // pode mostrar o conteúdo
      finish() {
        clearInterval(timer);
        label.textContent = 'Pronto';
        shown = 100;
        render();
        root.classList.add('emerald-progress-done');
        return new Promise(resolve => {
          setTimeout(() => {
            root.classList.add('emerald-progress-out');
            setTimeout(() => {
              root.remove();
              resolve();
            }, 260);
          }, 520);
        });
      },
      remove() {
        clearInterval(timer);
        root.remove();
      }
    };
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
    const ownStoreId = ownLigaStoreId();
    const cardCode = extractCardCode(fullName);
    const pokemonName = fullName.replace(/\s*\(.*$/, '');

    const panel = document.createElement('div');
    panel.className = 'emerald-item-panel';
    if (anchor) {
      anchor.insertAdjacentElement('beforebegin', panel);
    } else {
      nameBlock.insertAdjacentElement('afterend', panel);
    }

    // Faixas da barra: página da carta 0–55%, preços ocultos 55–70%,
    // últimas vendas 70–100% (divididas entre as variantes)
    const progress = createLigaProgress(panel);
    progress.stage('Abrindo a carta na Liga', 0, 55);
    const onPause = left => progress.stage(`A Liga pediu uma pausa · retomando em ${left}s`, 0, 0);
    let data;
    for (;;) {
      data = await fetchLigaCardData(pokemonName, cardCode, fullName, stage => {
        if (stage === 'page') progress.stage('Abrindo a carta na Liga', 3, 55);
        else progress.stage('Lendo os preços ocultos', 55, 70);
      });
      // Limite da Liga: espera a pausa (contagem na barra) e tenta de novo
      if (data !== undefined || !ligaRateLimited) break;
      await waitLigaCooldown(onPause);
    }

    if (!data) {
      progress.remove();
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
      } else if (ligaRateLimited) {
        panel.textContent = 'A Liga Pokemon limitou as requisições (erro 1015). Espere alguns minutos e recarregue esta página.';
      } else if (data === undefined) {
        panel.textContent = 'Liga Pokemon: não foi possível consultar agora. Recarregue a página pra tentar de novo.';
      } else {
        panel.textContent = 'Liga Pokemon: carta não encontrada.';
      }
      return;
    }

    // O conteúdo é montado escondido e aparece quando a barra termina
    const body = document.createElement('div');
    body.className = 'emerald-item-panel-body emerald-item-panel-pending';
    panel.appendChild(body);

    const title = document.createElement('a');
    title.className = 'emerald-item-panel-title';
    title.href = data.url;
    title.target = '_blank';
    title.rel = 'noopener';
    title.textContent = 'Liga Pokemon';
    body.appendChild(title);

    // Agrupa as linhas da tabela por variante exata
    const variants = new Map();
    rows.forEach(row => {
      const key = [row.editionId, row.langKey, row.qualityAcron, row.extrasKey, significantExtras(row.extrasLabels)].join('_');
      if (!variants.has(key)) variants.set(key, { sample: row, rows: [] });
      variants.get(key).rows.push(row);
    });

    const verdicts = [];

    const variantList = [...variants.values()];
    for (const [index, { sample, rows: variantRows }] of variantList.entries()) {
      const block = document.createElement('div');
      block.className = 'emerald-item-variant';
      body.appendChild(block);

      const edition = pickLigaEdition(data.editions, sample.editionId, cardCode);
      const ids = ligaVariantIds(data, sample);
      const variantName = [
        sample.extrasLabels.join(', ') || 'Normal',
        ids.qualityAcron || '?',
        ids.languageLabel || '?'
      ].join(' · ');

      // Nome e descrição da carta = link pra impressão exata na Liga
      const head = document.createElement(edition ? 'a' : 'div');
      head.className = 'emerald-item-variant-head';
      head.textContent = edition ? `${variantName} — ${edition.name} (${edition.code})` : variantName;
      if (edition) {
        head.href = `${data.url}&ed=${encodeURIComponent(edition.code)}&num=${encodeURIComponent(edition.num)}`;
        head.target = '_blank';
        head.rel = 'noopener';
        head.title = 'Abrir esta carta na Liga Pokemon';
      }
      block.appendChild(head);

      if (!edition) {
        addPanelLine(block, 'Edição não encontrada na Liga.', 'muted');
        continue;
      }

      // Anúncios iguais agora
      const listing = ligaListingStats(data, edition, ids, sample.extrasLabels, ownStoreId);
      const countLabel = listing ? `${listing.count}${listing.ownExcluded ? ', sem esta loja' : ''}` : '';
      if (listing && listing.count > 0 && listing.priced > 0) {
        addPanelLine(block, listing.priced > 1
          ? `Anúncios iguais (${countLabel}): mín. ${formatBRL(listing.min)} · méd. ${formatBRL(listing.avg)} · máx. ${formatBRL(listing.max)}`
          : `Anúncios iguais (${countLabel}): ${formatBRL(listing.min)}`);
        if (listing.priced > 1) {
          addPanelLine(block, `Mais baratos: ${listing.prices.slice(0, 3).map(formatBRL).join(' · ')}`);
        }
        if (listing.hidden > 0) {
          addPanelLine(block, `${listing.hidden} anúncio${listing.hidden > 1 ? 's' : ''} com preço ilegível, fora da conta.`, 'muted');
        }

        // Posição do preço desta loja entre os anúncios iguais
        const ownPrice = Math.min(...variantRows.map(row => row.price));
        const cheaper = listing.prices.filter(price => price < ownPrice).length;
        const same = listing.prices.filter(price => price === ownPrice).length;
        addPanelLine(block, `Esta loja: ${formatBRL(ownPrice)} — ${cheaper === 0
          ? (same ? 'empata com o menor preço' : 'menor preço')
          : `${cheaper} anúncio${cheaper > 1 ? 's' : ''} mais barato${cheaper > 1 ? 's' : ''}`}`);
      } else if (listing && listing.count > 0) {
        addPanelLine(block, `Anúncios iguais (${countLabel}): preços ilegíveis.`, 'muted');
      } else {
        addPanelLine(block, `Anúncios iguais: nenhum${listing && listing.ownExcluded ? ' além desta loja' : ''}.`, 'muted');
      }

      // Referência geral da edição: não aparece, só serve de base pro selo
      // quando não há vendas nem anúncios iguais legíveis
      const ref = pickLigaExtrasPrice(edition.price, sample.extrasKey);

      // Últimas vendas iguais
      const share = 30 / variantList.length;
      progress.stage(
        variantList.length > 1 ? `Últimas vendas (${index + 1}/${variantList.length})` : 'Últimas vendas',
        70 + share * index,
        70 + share * (index + 1)
      );
      const sales = await fetchLigaSales(data, edition, ids, sample.extrasKey, sample.extrasLabels, onPause);
      if (sales.sales.length > 0) {
        const line = addPanelLine(block, `Últimas vendas (méd. ${formatBRL(sales.avg)}): `);
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
        line.append(link, ' pra ver.');
      } else if (sales.reason === 'sem vendas') {
        addPanelLine(block, 'Últimas vendas: nenhuma igual.', 'muted');
      } else {
        addPanelLine(block, 'Últimas vendas: indisponíveis agora.', 'muted');
      }

      // Referência pro veredito: vendas realizadas > anúncios iguais > geral
      let basis = null;
      if (sales.avg) basis = { value: sales.avg, label: `média das últimas ${sales.sales.length} vendas iguais` };
      // Anúncios só servem de base quando todos têm preço lido
      else if (listing && listing.avg && listing.hidden === 0) basis = { value: listing.avg, label: 'média dos anúncios iguais na Liga' };
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
        // Mesmo selo da busca, à esquerda do preço
        row.priceCell.querySelectorAll('.emerald-verdict-listing').forEach(n => n.remove());
        const badge = createVerdictBadge(cls, 'emerald-verdict-listing');
        badge.title = tag.title;
        row.priceCell.insertBefore(badge, row.priceCell.firstChild);
        verdicts.push({ ratio: row.price / basis.value, row, basis, variantName });
      });
    }

    await progress.finish();
    body.classList.remove('emerald-item-panel-pending');
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
    const meaning = VERDICT_MEANING[cls];

    const badge = createVerdictBadge(cls);
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
      // Recalcula a posse: a coleção pode ter sido carregada depois do card
      const isOwned = isEmerald && isOwnedCard(card.dataset.emeraldName || '');
      if (isEmerald) card.setAttribute('data-owned', isOwned ? 'true' : 'false');

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

  // Posição do selo sobre a carta, em fração da altura/largura da imagem
  const SEAL_TOP_RATIO = 0.085;
  const SEAL_RIGHT_RATIO = 0.035;

  // Adiciona selo do Rayquaza
  // Caixa onde o selo é preso: o primeiro ancestral que não é em linha. Um
  // <a> em linha em volta da imagem (comum nas lojas) serve mal: com
  // position:relative, ele posiciona pela linha de texto, na base da imagem
  function sealContainerFor(imageElement) {
    let el = imageElement.parentElement;
    while (el && el !== document.body && getComputedStyle(el).display === 'inline') {
      el = el.parentElement;
    }
    return el || imageElement.parentElement;
  }

  function addEmeraldSeal(imageElement) {
    if (!imageElement.parentElement) return null;
    if (sealContainerFor(imageElement).querySelector('.emerald-seal-wrapper')) return null;

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

    const imgParent = sealContainerFor(imageElement);
    if (imgParent) {
      // Só vira referência de posição se ainda não era (não mexe em
      // absolute/fixed/sticky da loja)
      if (getComputedStyle(imgParent).position === 'static') imgParent.style.position = 'relative';
      imgParent.appendChild(sealWrapper);

      // Posiciona pelo desenho da carta, não pela caixa em volta (que pode
      // ser maior que a imagem): no alto à direita, logo abaixo do símbolo
      // de energia. Refaz quando a imagem carrega ou muda de tamanho.
      // Mede pelas caixas reais na tela: offsetLeft/clientWidth não servem
      // quando a caixa em volta é um elemento em linha (ex.: <a>, que tem
      // clientWidth 0 e jogava o selo pra fora da carta)
      const place = () => {
        if (!sealWrapper.isConnected) return;
        const img = imageElement.getBoundingClientRect();
        const box = imgParent.getBoundingClientRect();
        if (!img.width || !img.height) return;
        const style = getComputedStyle(imgParent);
        const top = img.top - box.top - (parseFloat(style.borderTopWidth) || 0) + img.height * SEAL_TOP_RATIO;
        const right = box.right - img.right - (parseFloat(style.borderRightWidth) || 0) + img.width * SEAL_RIGHT_RATIO;
        sealWrapper.style.top = `${Math.max(0, Math.round(top))}px`;
        sealWrapper.style.right = `${Math.max(0, Math.round(right))}px`;
      };
      place();
      imageElement.addEventListener('load', place);
      if (typeof ResizeObserver === 'function') new ResizeObserver(place).observe(imageElement);
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

    const data = await browser.storage.local.get(['emeraldOnlyMode', 'missingOnlyMode', 'trackerCards']);
    emeraldOnlyMode = data.emeraldOnlyMode === true;
    missingOnlyMode = data.missingOnlyMode === true;

    await loadPriceCacheFromStorage();

    if (!isCartPage() && isCardDetailPage()) {
      console.log('[Emerald TCG] Página de detalhes - painel da Liga e cards associados');
      if (Array.isArray(data.trackerCards)) {
        data.trackerCards.forEach(card => {
          if (card.collected === true && card.name) ownedCards.add(normalizeText(card.name));
        });
      }
      processItemPage();
      // "Cards Associados": mesmo selo e preço da busca, sem os filtros
      // (não esconde nada na página da carta)
      scanCards(['.card-item'], false);
      return;
    }

    // Carrega a coleção sempre (não só com o filtro ligado): ligar o filtro
    // depois já encontra quem é de quem
    if (Array.isArray(data.trackerCards)) {
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
        // Desligado: as cartas que estavam escondidas entram na fila agora
        // (ligado: loadOwnedCards decide quando a coleção terminar de carregar)
        if (!missingOnlyMode) flushDeferredPriceEvals();
      }
      if (message.action === 'reloadOwnedCards') {
        loadOwnedCards();
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
