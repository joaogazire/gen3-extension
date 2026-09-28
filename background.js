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

async function fetchLigaDirect(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'include',
      headers: { 'Accept': 'text/html,application/xhtml+xml' }
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, challenge: isChallenge(response.status, text) };
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

async function fetchLigaHtml(url, senderTabId) {
  if (typeof url !== 'string' || !url.startsWith(LIGA_ORIGIN)) {
    return { ok: false, status: 0, text: '', challenge: false };
  }

  // Pedidos vindos da própria aba oculta nunca abrem outra aba (evita
  // recursão caso o content script de lá dispare alguma busca)
  const fromWorker = senderTabId != null && senderTabId === workerTabId;

  if (!directFetchUseless || fromWorker) {
    const direct = await fetchLigaDirect(url);
    if (!direct.challenge || fromWorker) return direct;
    if (tabSolvedChallenge) directFetchUseless = true;
  }

  return fetchLigaViaTab(url);
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

async function fetchJsonInWorkerTab(url, pageUrl) {
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
    if (!page.ok) return { ok: false, status: page.status, json: null, challenge: page.challenge };
  }

  clearTimeout(workerIdleTimer);
  try {
    // content.fetch (Firefox): requisição feita como a própria página da
    // Liga — mesma origem e cookies de sessão do usuário
    const code = `(typeof content !== 'undefined' && content.fetch ? content.fetch.bind(content) : fetch)(${JSON.stringify(url)}, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } })
      .then(r => r.text().then(text => ({ status: r.status, text })))
      .catch(err => ({ status: 0, text: '', error: String(err) }))`;
    const [result] = await browser.tabs.executeScript(workerTabId, { code });
    const json = result ? parseJson(result.text) : null;
    return { ok: !!json, status: result ? result.status : 0, json };
  } catch (err) {
    return { ok: false, status: 0, json: null, error: String(err) };
  } finally {
    scheduleWorkerClose();
  }
}

async function fetchLigaJson(url, pageUrl) {
  if (typeof url !== 'string' || !url.startsWith(LIGA_ORIGIN)) {
    return { ok: false, status: 0, json: null };
  }

  const direct = await fetchLigaDirect(url);
  const directJson = direct.ok ? parseJson(direct.text) : null;
  if (directJson && !(directJson.error == 1 && NOT_LOGGED_PATTERN.test(directJson.message || ''))) {
    return { ok: true, status: direct.status, json: directJson, via: 'direct' };
  }

  const run = workerQueue.then(() => fetchJsonInWorkerTab(url, pageUrl));
  workerQueue = run.catch(() => {});
  return run.catch(err => ({ ok: false, status: 0, json: null, error: String(err) }));
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'fetchLiga') {
    return fetchLigaHtml(message.url, sender.tab ? sender.tab.id : null);
  }

  if (message.action === 'fetchLigaJson') {
    // Pedidos da própria aba oculta não entram aqui (evita recursão)
    if (sender.tab && sender.tab.id === workerTabId) return Promise.resolve({ ok: false, status: 0, json: null });
    return fetchLigaJson(message.url, message.pageUrl);
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

browser.runtime.onInstalled.addListener(() => {
  console.log('[Emerald TCG] Extensão instalada');
});
