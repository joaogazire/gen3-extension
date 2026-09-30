/* Emerald TCG Finder - Background Script */

// ---------------------------------------------------------------------------
// Busca de páginas da Liga Pokemon
//
// O Cloudflare da Liga desafia as páginas de carta/busca (?view=cards/...) —
// home e vitrine passam, mas uma requisição sem o cookie de liberação
// (cf_clearance) leva 403 com a página "Just a moment...". Um fetch não roda
// o JavaScript do desafio, então ele só passa quando já existe uma liberação
// válida e o navegador a envia. Por isso a busca tem dois caminhos:
//
// 1. fetch direto (rápido) — funciona quando a liberação está valendo;
// 2. se vier o desafio: abre a página numa aba oculta e inativa (uma
//    navegação de verdade, que roda o desafio automático do Cloudflare igual
//    a uma visita normal), espera a página real carregar e lê o HTML dela.
//    A aba é reaproveitada entre buscas (fila serial) e fechada depois de
//    um tempo ociosa.
//
// O content script roda dentro do site da loja; no Firefox, o isolamento de
// cookies por site faz o fetch de lá chegar na Liga sem a sessão dela — por
// isso tudo passa por aqui.
// ---------------------------------------------------------------------------

const LIGA_ORIGIN = 'https://www.ligapokemon.com.br/';
const DIRECT_TIMEOUT_MS = 10000;
const TAB_LOAD_TIMEOUT_MS = 25000;
const TAB_POLL_MS = 500;
const WORKER_IDLE_CLOSE_MS = 60000;

const CHALLENGE_PATTERN = /<title>\s*Just a moment|cf-turnstile|challenges\.cloudflare\.com\/turnstile|Verificando se você é humano/i;
// Limite de requisições do Cloudflare (erro 1015) — não é desafio: não
// adianta abrir a aba oculta, tem que esperar
const RATE_LIMIT_PATTERN = /Error 1015|You are being rate limited|<title>[^<]*Too Many Requests/i;

// Aba oculta usada pro caminho 2
let workerTabId = null;
let workerIdleTimer = null;
let workerQueue = Promise.resolve();

// Se o fetch direto continuar bloqueado mesmo depois de a aba ter passado
// pelo desafio (ex.: o navegador não envia o cookie da Liga em requisições
// da extensão), para de tentar o direto nesta sessão e vai sempre pela aba
let tabSolvedChallenge = false;
let directFetchUseless = false;

function isChallenge(status, text) {
  return status === 403 || status === 503 || CHALLENGE_PATTERN.test(text || '');
}

// `form`: corpo de um POST de formulário (ex.: "Exibir mais" da busca); sem
// ele, GET
async function fetchLigaDirect(url, form = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'include',
      ...(form
        ? {
          method: 'POST',
          body: new URLSearchParams(form).toString(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }
        }
        : { headers: { 'Accept': 'text/html,application/xhtml+xml' } })
    });
    const text = await response.text();
    const rateLimited = response.status === 429 || RATE_LIMIT_PATTERN.test(text);
    return { ok: response.ok && !rateLimited, status: response.status, text, rateLimited, challenge: !rateLimited && isChallenge(response.status, text) };
  } catch (err) {
    return { ok: false, status: 0, text: '', challenge: false, error: String(err) };
  } finally {
    clearTimeout(timeoutId);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function workerTabExists() {
  if (workerTabId == null) return false;
  try {
    await browser.tabs.get(workerTabId);
    return true;
  } catch (err) {
    workerTabId = null;
    return false;
  }
}

function scheduleWorkerClose() {
  clearTimeout(workerIdleTimer);
  workerIdleTimer = setTimeout(async () => {
    if (workerTabId != null) {
      const id = workerTabId;
      workerTabId = null;
      try { await browser.tabs.remove(id); } catch (err) { /* já fechada */ }
    }
  }, WORKER_IDLE_CLOSE_MS);
}

// Lido dentro da aba: só devolve o HTML quando a página certa (marcada pelo
// nonce na URL) terminou de carregar e não é o desafio
const READ_PAGE_CODE = `(() => {
  const html = document.documentElement ? document.documentElement.outerHTML : '';
  return {
    href: location.href,
    complete: document.readyState === 'complete',
    challenge: ${CHALLENGE_PATTERN.toString()}.test(html),
    rateLimited: ${RATE_LIMIT_PATTERN.toString()}.test(html),
    html
  };
})()`;

async function loadInWorkerTab(url) {
  clearTimeout(workerIdleTimer);

  // Nonce na URL: garante que o HTML lido é da navegação pedida agora, não
  // da página anterior que ainda estava na aba
  const nonce = `etf${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const targetUrl = `${url}${url.includes('?') ? '&' : '?'}_etf=${nonce}`;

  if (await workerTabExists()) {
    await browser.tabs.update(workerTabId, { url: targetUrl });
  } else {
    const tab = await browser.tabs.create({ url: targetUrl, active: false });
    workerTabId = tab.id;
    // Esconde a aba da barra de abas quando o navegador permite (tabHide);
    // se não der, ela fica só inativa e fecha sozinha depois
    if (browser.tabs.hide) {
      try { await browser.tabs.hide(workerTabId); } catch (err) { /* segue visível */ }
    }
  }

  const deadline = Date.now() + TAB_LOAD_TIMEOUT_MS;
  let sawChallenge = false;

  while (Date.now() < deadline) {
    await sleep(TAB_POLL_MS);
    let state;
    try {
      [state] = await browser.tabs.executeScript(workerTabId, { code: READ_PAGE_CODE, runAt: 'document_end' });
    } catch (err) {
      // Página ainda trocando (sem documento pronto pra injetar) — tenta de novo
      if (!(await workerTabExists())) break;
      continue;
    }
    if (!state || !state.href.includes(nonce)) continue;
    if (state.rateLimited) {
      scheduleWorkerClose();
      return { ok: false, status: 429, text: '', challenge: false, rateLimited: true, via: 'tab' };
    }
    if (state.challenge) {
      sawChallenge = true;
      continue;
    }
    if (state.complete) {
      if (sawChallenge) tabSolvedChallenge = true;
      scheduleWorkerClose();
      return { ok: true, status: 200, text: state.html, challenge: false, via: 'tab' };
    }
  }

  scheduleWorkerClose();
  // Estourou o tempo ainda no desafio: é o desafio interativo (caixinha),
  // que precisa do usuário
  return { ok: false, status: sawChallenge ? 403 : 0, text: '', challenge: sawChallenge, via: 'tab' };
}

// Fila serial: uma navegação por vez na aba oculta
function fetchLigaViaTab(url) {
  const run = workerQueue.then(() => loadInWorkerTab(url));
  workerQueue = run.catch(() => {});
  return run.catch(err => ({ ok: false, status: 0, text: '', challenge: false, error: String(err) }));
}

// ---------------------------------------------------------------------------
// Ritmo das requisições à Liga — um só pra todas as abas (antes cada aba
// tinha o seu, e duas abas abertas dobravam o volume):
//  - intervalo mínimo entre requisições (LIGA_MIN_INTERVAL_MS), que dobra a
//    cada limite (erro 1015) e volta devagar a cada resposta normal;
//  - depois de um limite, uma pausa (começa em 1 min e dobra se repetir,
//    até 10 min) em que nenhuma requisição sai: quem pedir recebe
//    `rateLimited` + `retryAfterMs` e espera (a página mostra a contagem).
// ---------------------------------------------------------------------------

const LIGA_MIN_INTERVAL_MS = 1500;
const LIGA_MAX_INTERVAL_MS = 6000;
const LIGA_COOLDOWN_START_MS = 60 * 1000;
const LIGA_COOLDOWN_MAX_MS = 10 * 60 * 1000;

let ligaInterval = LIGA_MIN_INTERVAL_MS;
let ligaCooldownMs = LIGA_COOLDOWN_START_MS;
let ligaCooldownUntil = 0;
let ligaLastRequestAt = 0;
let ligaGate = Promise.resolve();

function ligaCooldownLeft() {
  return Math.max(0, ligaCooldownUntil - Date.now());
}

function ligaRateLimitedResponse(extra = {}) {
  return { ok: false, status: 429, text: '', json: null, challenge: false, rateLimited: true, retryAfterMs: ligaCooldownLeft(), ...extra };
}

// Espera a vez na fila única (intervalo mínimo desde a última requisição)
function ligaTurn() {
  const turn = ligaGate.then(async () => {
    const wait = ligaLastRequestAt + ligaInterval - Date.now();
    if (wait > 0) await sleep(wait);
    ligaLastRequestAt = Date.now();
  });
  ligaGate = turn.catch(() => {});
  return turn;
}

function noteLigaResult(rateLimited) {
  if (rateLimited) {
    ligaCooldownUntil = Date.now() + ligaCooldownMs;
    console.warn(`[Emerald TCG] Liga limitou as requisições: pausa de ${Math.round(ligaCooldownMs / 1000)}s`);
    ligaCooldownMs = Math.min(ligaCooldownMs * 2, LIGA_COOLDOWN_MAX_MS);
    ligaInterval = Math.min(ligaInterval * 2, LIGA_MAX_INTERVAL_MS);
  } else {
    ligaInterval = Math.max(LIGA_MIN_INTERVAL_MS, Math.round(ligaInterval * 0.9));
    if (!ligaCooldownLeft()) ligaCooldownMs = LIGA_COOLDOWN_START_MS;
  }
}

// Uma requisição à Liga respeitando pausa e intervalo; `request` devolve a
// resposta no formato das funções abaixo (com `rateLimited` quando for o caso)
async function ligaRequest(request) {
  if (ligaCooldownLeft()) return ligaRateLimitedResponse();
  await ligaTurn();
  if (ligaCooldownLeft()) return ligaRateLimitedResponse();
  const result = await request();
  noteLigaResult(!!(result && result.rateLimited));
  return result && result.rateLimited ? { ...result, retryAfterMs: ligaCooldownLeft() } : result;
}

async function fetchLigaHtml(url, senderTabId) {
  if (typeof url !== 'string' || !url.startsWith(LIGA_ORIGIN)) {
    return { ok: false, status: 0, text: '', challenge: false };
  }

  // Pedidos vindos da própria aba oculta nunca abrem outra aba (evita
  // recursão caso o content script de lá dispare alguma busca)
  const fromWorker = senderTabId != null && senderTabId === workerTabId;

  if (!directFetchUseless || fromWorker) {
    const direct = await ligaRequest(() => fetchLigaDirect(url));
    if (!direct.challenge || direct.rateLimited || fromWorker) return direct;
    if (tabSolvedChallenge) directFetchUseless = true;
  }

  return ligaRequest(() => fetchLigaViaTab(url));
}

// ---------------------------------------------------------------------------
// Endpoints JSON da Liga (/ajax/...) — ex.: últimas vendas. Não passam pelo
// desafio do Cloudflare, mas exigem a sessão logada do usuário na Liga. O
// fetch direto só funciona se o navegador mandar os cookies da Liga em
// requisições da extensão; se não vier logado, a requisição é refeita de
// dentro da aba oculta da Liga (mesmo site, com os cookies do usuário).
// ---------------------------------------------------------------------------

const NOT_LOGGED_PATTERN = /precisa estar logado/i;

function parseJson(text) {
  try { return JSON.parse(text); } catch (err) { return null; }
}

async function fetchJsonInWorkerTab(url, pageUrl, form = null) {
  // Garante uma página da Liga carregada na aba oculta (qualquer uma serve
  // de origem; usa a da carta, que provavelmente já está lá)
  let onLiga = false;
  if (await workerTabExists()) {
    try {
      const tab = await browser.tabs.get(workerTabId);
      onLiga = typeof tab.url === 'string' && tab.url.startsWith(LIGA_ORIGIN);
    } catch (err) { onLiga = false; }
  }
  if (!onLiga) {
    const page = await loadInWorkerTab(pageUrl || LIGA_ORIGIN);
    if (!page.ok) return { ok: false, status: page.status, json: null, challenge: page.challenge, rateLimited: !!page.rateLimited };
  }

  clearTimeout(workerIdleTimer);
  try {
    // content.fetch (Firefox): requisição feita como a própria página da
    // Liga — mesma origem e cookies de sessão do usuário
    const init = form
      ? { method: 'POST', credentials: 'include', body: new URLSearchParams(form).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' } }
      : { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } };
    const code = `(typeof content !== 'undefined' && content.fetch ? content.fetch.bind(content) : fetch)(${JSON.stringify(url)}, ${JSON.stringify(init)})
      .then(r => r.text().then(text => ({ status: r.status, text })))
      .catch(err => ({ status: 0, text: '', error: String(err) }))`;
    const [result] = await browser.tabs.executeScript(workerTabId, { code });
    const json = result ? parseJson(result.text) : null;
    const rateLimited = !!result && (result.status === 429 || RATE_LIMIT_PATTERN.test(result.text || ''));
    return { ok: !!json, status: result ? result.status : 0, json, rateLimited };
  } catch (err) {
    return { ok: false, status: 0, json: null, error: String(err) };
  } finally {
    scheduleWorkerClose();
  }
}

async function fetchLigaJson(url, pageUrl, form = null) {
  if (typeof url !== 'string' || !url.startsWith(LIGA_ORIGIN)) {
    return { ok: false, status: 0, json: null };
  }
  if (form != null && (typeof form !== 'object' || Array.isArray(form))) form = null;

  const direct = await ligaRequest(() => fetchLigaDirect(url, form));
  if (direct.rateLimited) return { ...direct, json: null };
  const directJson = direct.ok ? parseJson(direct.text) : null;
  if (directJson && !(directJson.error == 1 && NOT_LOGGED_PATTERN.test(directJson.message || ''))) {
    return { ok: true, status: direct.status, json: directJson, via: 'direct' };
  }

  return ligaRequest(() => {
    const run = workerQueue.then(() => fetchJsonInWorkerTab(url, pageUrl, form));
    workerQueue = run.catch(() => {});
    return run.catch(err => ({ ok: false, status: 0, json: null, error: String(err) }));
  });
}

// ---------------------------------------------------------------------------
// Preços ocultos da Liga (ver ocr/liga-ocr.js). Roda aqui porque a imagem de
// números vem de repositorio.sbrauble.com: baixada pelo background, entra no
// canvas sem "contaminar" (dá pra ler os pixels); na página da loja não daria.
// ---------------------------------------------------------------------------

const SPRITE_URL_PATTERN = /^https:\/\/repositorio\.sbrauble\.com\//;
let ocrTemplatesPromise = null;

async function loadImageData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function ocrTemplates() {
  if (!ocrTemplatesPromise) {
    ocrTemplatesPromise = loadImageData(browser.runtime.getURL('ocr/liga-digits-ref.jpg'))
      .then(EmeraldLigaOcr.buildTemplates)
      .catch(err => {
        ocrTemplatesPromise = null;
        throw err;
      });
  }
  return ocrTemplatesPromise;
}

// `css`: regras de estilo da página da Liga com a imagem de números;
// `stock`: anúncios (id, p, precoCss, precoFinal). Devolve { prices: {id:
// preço}, consistent } — ver decodeStock
async function decodeLigaPrices(css, stock) {
  if (typeof css !== 'string' || !Array.isArray(stock)) return { prices: {}, consistent: false };
  try {
    const rules = EmeraldLigaOcr.parseSpriteCss(css);
    const templates = await ocrTemplates();
    const sprites = {};
    for (const ref of EmeraldLigaOcr.spriteUrls(stock, rules)) {
      const url = ref.startsWith('//') ? `https:${ref}` : ref;
      if (!SPRITE_URL_PATTERN.test(url)) continue;
      sprites[ref] = await loadImageData(url);
    }
    return EmeraldLigaOcr.decodeStock(stock, rules, sprites, templates);
  } catch (err) {
    console.error('[Emerald TCG] Erro ao ler os preços ocultos da Liga:', err);
    return { prices: {}, consistent: false, error: String(err) };
  }
}

// Preço da listagem das lojas (imagem de números /up/ecom/imgnum): lido
// aqui pra não precisar abrir a página de cada item (que estourava o
// limite de requisições das lojas — erro 1015 do Cloudflare). As imagens
// ficam em memória: a mesma página pede várias cartas da mesma imagem.
const ecomSpriteCache = new Map();
const ECOM_SPRITE_CACHE_MAX = 8;

async function ecomSprite(ref) {
  if (ecomSpriteCache.has(ref)) return ecomSpriteCache.get(ref);
  const url = ref.startsWith('//') ? `https:${ref}` : ref;
  if (!SPRITE_URL_PATTERN.test(url)) return null;
  const promise = loadImageData(url).catch(err => {
    ecomSpriteCache.delete(ref);
    throw err;
  });
  ecomSpriteCache.set(ref, promise);
  if (ecomSpriteCache.size > ECOM_SPRITE_CACHE_MAX) ecomSpriteCache.delete(ecomSpriteCache.keys().next().value);
  return promise;
}

async function decodeEcomListingPrice(css, tokens) {
  if (typeof css !== 'string' || !Array.isArray(tokens)) return { price: null };
  try {
    const rules = EmeraldLigaOcr.parseSpriteCss(css);
    const sprites = {};
    for (const ref of EmeraldLigaOcr.ecomSpriteUrls(tokens, rules)) {
      const img = await ecomSprite(ref);
      if (img) sprites[ref] = img;
    }
    return { price: EmeraldLigaOcr.decodeEcomPrice(tokens, rules, sprites) };
  } catch (err) {
    console.error('[Emerald TCG] Erro ao ler o preço da listagem:', err);
    return { price: null };
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'decodeEcomPrice') {
    return decodeEcomListingPrice(message.css, message.tokens);
  }

  if (message.action === 'decodeLigaPrices') {
    return decodeLigaPrices(message.css, message.stock);
  }

  if (message.action === 'fetchLiga') {
    return fetchLigaHtml(message.url, sender.tab ? sender.tab.id : null);
  }

  if (message.action === 'fetchLigaJson') {
    // Pedidos da própria aba oculta não entram aqui (evita recursão)
    if (sender.tab && sender.tab.id === workerTabId) return Promise.resolve({ ok: false, status: 0, json: null });
    return fetchLigaJson(message.url, message.pageUrl, message.form || null);
  }

  if (message.action === 'updateBadge') {
    browser.browserAction.setBadgeText({
      text: message.count > 0 ? message.count.toString() : '',
      tabId: sender.tab.id
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: '#0f4b3c',
      tabId: sender.tab.id
    });
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  if (tabId === workerTabId) workerTabId = null;
});

// Numa atualização, zera o cache de preços: versões antigas podiam ter
// guardado "carta não encontrada" a partir de páginas de erro da Liga
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('[Emerald TCG] Extensão instalada');
  if (details.reason !== 'update') return;
  try {
    const all = await browser.storage.local.get(null);
    const stale = Object.keys(all).filter(k => k === 'priceCache' || k === 'trackerLigaSearch' || k === 'ligaCardIndex' || k.startsWith('ligaCard:'));
    if (stale.length) await browser.storage.local.remove(stale);
  } catch (err) {
    console.error('[Emerald TCG] Erro ao limpar o cache antigo:', err);
  }
});
