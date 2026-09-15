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
    'manycollections.com.br'
  ];

  // Estado dos modos
  let emeraldOnlyMode = false;
  let missingOnlyMode = false;
  let ownedCards = new Set();

  // Cache de preços (Liga Pokemon + lojas), chave prefixada pela fonte
  const priceCache = new Map();

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

    const hasList = document.querySelectorAll('.card-item, [class*="card-item"], tr, .list-item, .product-item').length > 3;
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

    for (const pokemon of HOENN_POKEDEX) {
      if (cleanName === pokemon || cleanName.includes(pokemon) || pokemon.includes(cleanName)) {
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

  // Extrai o código de edição/coleção da carta (ex: "010/165") de um texto
  function extractCardCode(text) {
    const m = text.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
    if (!m) return null;
    return `${parseInt(m[1], 10)}/${parseInt(m[2], 10)}`;
  }

  // Formata valor em Reais (padrão brasileiro, vírgula decimal)
  function formatBRL(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  // Detecta se o HTML retornado é uma página de challenge do Cloudflare
  function isCloudflareChallenge(html) {
    return /Just a moment|cf-turnstile|challenge-platform|Verificando se você é humano/i.test(html);
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

  // Busca o menor preço pra mesma carta (edição, idioma e conservação exatos)
  // numa fonte específica. `source` é 'ligapokemon.com.br' (marketplace) ou um
  // domínio de ECOM_STORE_DOMAINS (loja de vendedor único).
  async function fetchLigaPokemonPrice(pokemonName, language, condition, cardCode) {
    const cacheKey = `ligapokemon.com.br:${normalizeText(pokemonName)}_${language}_${condition}_${cardCode || '~'}`;

    if (priceCache.has(cacheKey)) {
      return priceCache.get(cacheKey);
    }

    if (blockedDomains.has('ligapokemon.com.br')) {
      return null;
    }

    try {
      const searchUrl = `https://www.ligapokemon.com.br/?view=cards/card&card=${encodeURIComponent(pokemonName)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(searchUrl, {
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Accept': 'text/html',
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        priceCache.set(cacheKey, null);
        return null;
      }

      const html = await response.text();

      if (isCloudflareChallenge(html)) {
        blockedDomains.add('ligapokemon.com.br');
        console.warn('[Emerald TCG] Liga Pokemon bloqueou o acesso automatizado (Cloudflare). Abra ligapokemon.com.br manualmente e recarregue o carrinho.');
        priceCache.set(cacheKey, null);
        return null;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Percorre linhas/itens de resultado e mantém só as que batem
      // exatamente com o idioma e a conservação da carta do carrinho
      const rowSelectors = [
        '.card-item', '[class*="card-item"]', '[class*="card_item"]',
        '.list-item', '.product-item', '[class*="product"]',
        'tr', '.item', '[class*="item"]'
      ];

      const seenRows = new Set();
      let minPrice = Infinity;

      for (const selector of rowSelectors) {
        doc.querySelectorAll(selector).forEach(row => {
          if (seenRows.has(row)) return;

          const text = row.textContent;
          const priceMatch = text.match(/R\$\s*([\d.,]+)/);
          if (!priceMatch) return;

          seenRows.add(row);

          const rowDetails = classifyLanguageCondition(text);
          if (rowDetails.language !== language || rowDetails.condition !== condition) return;

          // Se sabemos o código de edição da carta do carrinho, só aceita
          // linhas da mesma edição exata (evita comparar com print errado)
          if (cardCode) {
            const rowCode = extractCardCode(text);
            if (rowCode !== cardCode) return;
          }

          const price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
          if (price > 0 && price < minPrice) {
            minPrice = price;
          }
        });
      }

      const result = minPrice === Infinity ? null : { price: minPrice, matchedBy: cardCode ? 'code' : 'name', store: 'Liga Pokemon' };
      priceCache.set(cacheKey, result);

      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Emerald TCG] Erro ao buscar preço na Liga Pokemon:', err);
      }
      priceCache.set(cacheKey, null);
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

  // Busca o menor preço numa loja de vendedor único (ECOM_STORE_DOMAINS) pra
  // mesma carta, MESMA edição (cardCode obrigatório — sem ele não dá pra saber
  // com segurança qual impressão do nome abrir), idioma e conservação exatos.
  // Fluxo em duas etapas: busca por nome -> acha o link cujo texto bate com o
  // código da edição -> abre a página do item -> lê a tabela de variantes.
  async function fetchStorePrice(storeDomain, pokemonName, language, condition, cardCode) {
    if (!cardCode) return null;

    const cacheKey = `${storeDomain}:${normalizeText(pokemonName)}_${language}_${condition}_${cardCode}`;

    if (priceCache.has(cacheKey)) {
      return priceCache.get(cacheKey);
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
        priceCache.set(cacheKey, null);
        return null;
      }

      const searchHtml = await searchResponse.text();

      if (isCloudflareChallenge(searchHtml)) {
        blockedDomains.add(storeDomain);
        console.warn(`[Emerald TCG] ${storeDomain} bloqueou o acesso automatizado. Pulando essa loja pro resto da sessão.`);
        priceCache.set(cacheKey, null);
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
        priceCache.set(cacheKey, null);
        return null;
      }

      const itemUrl = new URL(resultLink.getAttribute('href'), `https://www.${storeDomain}/`).toString();

      const itemController = new AbortController();
      const itemTimeout = setTimeout(() => itemController.abort(), 8000);
      const itemResponse = await fetch(itemUrl, { signal: itemController.signal, headers: { 'Accept': 'text/html' } });
      clearTimeout(itemTimeout);

      if (!itemResponse.ok) {
        priceCache.set(cacheKey, null);
        return null;
      }

      const itemHtml = await itemResponse.text();
      const itemDoc = new DOMParser().parseFromString(itemHtml, 'text/html');

      let minPrice = Infinity;

      itemDoc.querySelectorAll('.table-cards-row').forEach(row => {
        const cells = row.querySelectorAll('.table-cards-body-cell');
        if (cells.length < 6) return;

        const langImg = cells[1].querySelector('img');
        const rowLanguage = classifyLanguageCondition(langImg ? (langImg.getAttribute('alt') || langImg.getAttribute('title') || '') : '').language;
        if (rowLanguage !== language) return;

        const rowCondition = classifyEcomQuality(cells[2].textContent);
        if (rowCondition !== condition) return;

        const stockMatch = cells[4].textContent.match(/(\d+)\s*unid/i);
        if (!stockMatch || parseInt(stockMatch[1], 10) <= 0) return;

        const priceMatch = cells[5].textContent.match(/R\$\s*([\d.,]+)/);
        if (!priceMatch) return;

        const price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
        if (price > 0 && price < minPrice) {
          minPrice = price;
        }
      });

      const result = minPrice === Infinity ? null : { price: minPrice, matchedBy: 'code', store: storeDisplayName(storeDomain) };
      priceCache.set(cacheKey, result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(`[Emerald TCG] Erro ao buscar preço em ${storeDomain}:`, err);
      }
      priceCache.set(cacheKey, null);
      return null;
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

    const cardSelectors = [
      '.card-item',
      '[class*="card-item"]',
      '[class*="card_item"]',
      '.item',
      '[class*="item"]',
      'tr',
      '.list-item',
      '.product-item'
    ];

    for (const selector of cardSelectors) {
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
          const image = card.querySelector('img');

          if (image) {
            addEmeraldSeal(image);
            foundCount++;
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

        // Busca o menor preço entre a Liga Pokemon e as lojas de vendedor
        // único suportadas (todas com mesma edição quando possível, idioma e
        // conservação exatos), em paralelo — uma fonte bloqueada/fora do ar
        // não atrapalha as outras.
        const sources = [
          fetchLigaPokemonPrice(pokemonName, details.language, details.condition, cardCode),
          ...ECOM_STORE_DOMAINS
            .filter(domain => domain !== currentDomain)
            .map(domain => fetchStorePrice(domain, pokemonName, details.language, details.condition, cardCode))
        ];

        const settled = await Promise.allSettled(sources);
        const results = settled
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => r.value);

        if (results.length > 0) {
          const best = results.reduce((min, r) => (r.price < min.price ? r : min), results[0]);
          const avgPrice = results.reduce((sum, r) => sum + r.price, 0) / results.length;
          addPriceComparison(nameNode, best, avgPrice, results.length);
        }

        await sleep(400);
      }
    }
  }

  // Adiciona comparação de preço (mínimo + média entre as fontes que bateram
  // idioma/conservação/edição) ao lado direito do nome da carta
  function addPriceComparison(nameNode, result, avgPrice, sourceCount) {
    if (nameNode.querySelector('.emerald-price-compare')) return;

    const isExact = result.matchedBy === 'code';
    const showAvg = sourceCount > 1;

    const compareElement = document.createElement('span');
    compareElement.className = 'emerald-price-compare';
    compareElement.style.cssText = `
      margin-left: 6px;
      padding: 2px 6px;
      background: ${isExact ? 'rgba(42, 185, 119, 0.15)' : 'rgba(244, 201, 93, 0.15)'};
      border: 1px solid ${isExact ? 'rgba(42, 185, 119, 0.3)' : 'rgba(244, 201, 93, 0.4)'};
      border-radius: 4px;
      font-size: 11px;
      color: ${isExact ? '#8fe6a9' : '#f4c95d'};
      white-space: nowrap;
    `;
    compareElement.textContent = `${isExact ? '' : '~ '}/ ${formatBRL(result.price)}${showAvg ? ` · méd. ${formatBRL(avgPrice)}` : ''}`;

    const sourceInfo = showAvg
      ? ` — média de ${formatBRL(avgPrice)} entre ${sourceCount} lojas com o mesmo idioma e conservação`
      : '';
    compareElement.title = isExact
      ? `Menor preço: ${result.store} (mesma edição, idioma e conservação)${sourceInfo}`
      : `Comparação aproximada com ${result.store} — código da edição não encontrado no carrinho, pode ser carta de edição diferente${sourceInfo}`;

    nameNode.appendChild(compareElement);
  }

  // Aplica filtros
  function applyFilters() {
    if (isCardDetailPage() || isCartPage()) {
      return;
    }

    document.querySelectorAll('.card-item, [class*="card-item"], [class*="card_item"], .item, [class*="item"], tr, .list-item, .product-item').forEach(card => {
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
    if (imageElement.parentElement.querySelector('.emerald-seal-wrapper')) return;

    const sealWrapper = document.createElement('div');
    sealWrapper.className = 'emerald-seal-wrapper';
    sealWrapper.title = '★ Pokémon Emerald Pokédex';

    const sealImage = document.createElement('img');
    sealImage.src = RAYQUAZA_BADGE_URL;
    sealImage.className = 'emerald-badge-icon';
    sealImage.alt = 'Emerald';

    sealWrapper.appendChild(sealImage);

    sealWrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    const imgParent = imageElement.parentElement;
    if (imgParent) {
      imgParent.style.position = 'relative';
      imgParent.appendChild(sealWrapper);
    }
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
      console.log('[Emerald TCG] Página de detalhes - extensão desativada');
      return;
    }

    const data = await browser.storage.local.get(['emeraldOnlyMode', 'missingOnlyMode', 'trackerCards']);
    emeraldOnlyMode = data.emeraldOnlyMode === true;
    missingOnlyMode = data.missingOnlyMode === true;

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
          document.querySelectorAll('.card-item, [class*="card-item"], [class*="card_item"], .item, [class*="item"], tr, .list-item, .product-item').forEach(card => {
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
