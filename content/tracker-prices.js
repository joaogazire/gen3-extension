/* Emerald TCG Finder - Preços da Liga no Tracker
 *
 * Roda na página do Emerald TCG Tracker e empresta a ela a busca de preço da
 * Liga Pokemon que a extensão já faz nas lojas: a busca por Pokémon
 * (?view=cards/search&card=<nome>), que traz mín./médio/máx. de todas as
 * impressões daquele nome numa requisição só. O site é estático e não
 * consegue falar com a Liga (Cloudflare + CORS); a extensão consegue, pelo
 * background (fila única, pausa no erro 1015, aba oculta no desafio).
 *
 * Protocolo (window.postMessage, mesma origem):
 *   página  -> extensão  { source: 'emerald-tracker', type: 'ping' }
 *   extensão -> página   { source: 'emerald-extension', type: 'hello', version }
 *   página  -> extensão  { source: 'emerald-tracker', type: 'liga-search', requestId, query }
 *   extensão -> página   { source: 'emerald-extension', type: 'liga-search', requestId, query,
 *                          status: 'ok' | 'blocked' | 'error', entries, blockedUrl }
 *
 * `entries`: [{ name, ed, num, min, avg, max, url }] — o casamento com a
 * impressão (número e total da coleção) fica com o site, que tem o catálogo.
 */

(function () {
  'use strict';

  const LIGA_ORIGIN = 'https://www.ligapokemon.com.br/';
  const CACHE_KEY = 'trackerLigaSearch';
  // Mesma validade da busca por Pokémon nas lojas (a referência muda devagar)
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const MAX_RATE_LIMIT_RETRIES = 3;

  const version = browser.runtime.getManifest().version;

  function post(message) {
    window.postMessage({ source: 'emerald-extension', ...message }, location.origin);
  }

  // Mesma normalização do content.js (chave do cache da busca nas lojas)
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  function nameWords(text) {
    return normalizeText(String(text || '').replace(/[-_&/]/g, ' ')).split(/\s+/).filter(Boolean);
  }

  function parseLigaPrice(value) {
    const text = String(value || '').replace(/[^\d.,]/g, '');
    const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
    const price = parseFloat(normalized);
    return price > 0 ? price : null;
  }

  function isCloudflareErrorPage(html) {
    return /Error 10\d\d|You are being rate limited|cf-error-details|<title>[^<]*(Access denied|Attention Required|Just a moment)/i.test(html);
  }

  function isCloudflareChallenge(html) {
    return /<title>\s*Just a moment|cf-turnstile|challenges\.cloudflare\.com\/turnstile|Verificando se você é humano/i.test(html);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ---- Cache ----------------------------------------------------------------
  // Próprio (trackerLigaSearch), mas também aproveita a busca que as lojas já
  // guardaram em priceCache (só leitura: o content.js regrava aquela chave
  // inteira a partir da memória e apagaria o que fosse escrito daqui).

  async function readCache(words) {
    try {
      const stored = await browser.storage.local.get([CACHE_KEY, 'priceCache']);
      const now = Date.now();
      const own = (stored[CACHE_KEY] || {})[words];
      if (own && now - own.fetchedAt < CACHE_TTL_MS) return own.value;
      const shop = (stored.priceCache || {})[`ligapokemon.com.br:search:${words}`];
      if (shop && now - shop.fetchedAt < CACHE_TTL_MS && Array.isArray(shop.value)) return shop.value;
    } catch (err) {
      console.error('[Emerald TCG] Erro ao ler o cache da Liga:', err);
    }
    return undefined;
  }

  let writeChain = Promise.resolve();
  function writeCache(words, value) {
    writeChain = writeChain.then(async () => {
      const stored = (await browser.storage.local.get(CACHE_KEY))[CACHE_KEY] || {};
      const now = Date.now();
      Object.keys(stored).forEach(k => {
        if (now - stored[k].fetchedAt >= CACHE_TTL_MS) delete stored[k];
      });
      stored[words] = { value, fetchedAt: now };
      await browser.storage.local.set({ [CACHE_KEY]: stored });
    }).catch(err => console.error('[Emerald TCG] Erro ao salvar o cache da Liga:', err));
  }

  // ---- Busca ----------------------------------------------------------------

  // Resultados (.mtg-single) de um pedaço de HTML da busca — o mesmo parser
  // do content.js (parseSearchEntries)
  function parseEntries(doc) {
    const entries = [];
    doc.querySelectorAll('.mtg-single').forEach(el => {
      const link = el.querySelector('a[href*="view=cards/card"]');
      if (!link) return;
      let url;
      try {
        url = new URL(link.getAttribute('href'), LIGA_ORIGIN);
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
    return entries;
  }

  // null = página sem a lista (não é "nenhum resultado")
  function parseSearch(html) {
    const entries = parseEntries(new DOMParser().parseFromString(html, 'text/html'));
    if (entries.length === 0 && !/id="mtg-cards"|Itens encontrados/.test(html)) return null;
    return entries;
  }

  // A busca mostra 40 itens; o resto vem do "Exibir mais" (POST
  // /ajax/cards/main.php, opc=nextPage), como no content.js. false = a Liga
  // não respondeu e a lista ficou incompleta.
  const PAGE_SIZE = 40;
  const MAX_EXTRA_PAGES = 15;

  async function appendPages(html, entries) {
    const next = html.match(/mcards\.nextPage\((\d+)\)/);
    if (!next || entries.length < PAGE_SIZE) return true;
    const param = (name, fallback) => {
      const m = html.match(new RegExp(`mcards\\.${name}\\((?:"([^"]*)"|(\\d+))\\)`));
      return m ? (m[1] != null ? m[1] : m[2]) : fallback;
    };
    const form = {
      opc: 'nextPage',
      totalReg: param('setTotalReg', String(entries.length + 1)),
      search: param('setSearch', ''),
      orderBy: '',
      tipo: param('setTipo', '1'),
      fav: 'false',
      iTCG: '2',
      idPokemon: '0'
    };
    let key = next[1];
    for (let page = 2; page < 2 + MAX_EXTRA_PAGES; page++) {
      let response;
      for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
        try {
          response = await browser.runtime.sendMessage({
            action: 'fetchLigaJson',
            url: `${LIGA_ORIGIN}ajax/cards/main.php`,
            form: { ...form, page: String(page), key: String(key) }
          });
        } catch (err) {
          return false;
        }
        if (!response || !response.rateLimited) break;
        await sleep(Math.max(response.retryAfterMs || 0, 5000));
      }
      const json = response && response.json;
      if (!json || json.error) return false;
      entries.push(...parseEntries(new DOMParser().parseFromString(`<div>${json.html || ''}</div>`, 'text/html')));
      if (String(json.nextPage) !== '1' || json.key == null) return true;
      key = json.key;
    }
    return true;
  }

  // Uma busca por vez daqui (o background ainda serializa com as lojas) e
  // buscas repetidas do mesmo nome compartilham a mesma promessa
  let queue = Promise.resolve();
  const inFlight = new Map();

  function search(query) {
    const words = nameWords(query).join(' ');
    if (!words) return Promise.resolve({ status: 'error', entries: [] });
    if (inFlight.has(words)) return inFlight.get(words);

    const run = queue.then(() => searchNow(query, words));
    queue = run.catch(() => {});
    inFlight.set(words, run);
    run.finally(() => inFlight.delete(words));
    return run;
  }

  async function searchNow(query, words) {
    const cached = await readCache(words);
    if (cached !== undefined) return { status: 'ok', entries: cached };

    const url = `${LIGA_ORIGIN}?view=cards/search&tipo=1&card=${encodeURIComponent(query)}`;
    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
      let response;
      try {
        response = await browser.runtime.sendMessage({ action: 'fetchLiga', url });
      } catch (err) {
        console.error('[Emerald TCG] Erro ao buscar na Liga Pokemon:', err);
        return { status: 'error', entries: [] };
      }
      if (!response) return { status: 'error', entries: [] };

      // Erro 1015: o background impôs uma pausa — espera e tenta de novo
      if (response.rateLimited) {
        await sleep(Math.max(response.retryAfterMs || 0, 5000));
        continue;
      }
      if (response.challenge || response.status === 403 || isCloudflareChallenge(response.text || '')) {
        return { status: 'blocked', entries: [], blockedUrl: url };
      }
      if (!response.ok || isCloudflareErrorPage(response.text || '')) {
        return { status: 'error', entries: [] };
      }

      const entries = parseSearch(response.text);
      if (!entries) return { status: 'error', entries: [] };
      // Lista incompleta vale para agora, mas não vai pro cache
      if (await appendPages(response.text, entries)) writeCache(words, entries);
      return { status: 'ok', entries };
    }
    return { status: 'error', entries: [] };
  }

  // ---- Ponte com a página ----------------------------------------------------

  window.addEventListener('message', async event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'emerald-tracker') return;

    if (data.type === 'ping') {
      post({ type: 'hello', version });
      return;
    }

    if (data.type === 'liga-search' && typeof data.query === 'string') {
      const result = await search(data.query.slice(0, 80));
      post({ type: 'liga-search', requestId: data.requestId, query: data.query, ...result });
    }
  });

  post({ type: 'hello', version });
})();
