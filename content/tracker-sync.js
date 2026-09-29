/* Emerald TCG Finder - Sincronização automática com o Tracker
 *
 * Roda na página do Emerald TCG Tracker. Lê a coleção que o próprio Tracker
 * salva no navegador (localStorage) e o catálogo dele (coleção, número e
 * total de cada impressão) e guarda na extensão — sem colar link. Confere
 * de novo a cada poucos segundos, então marcar uma carta no Tracker chega
 * nas lojas sozinho.
 *
 * Só lê a coleção salva: link compartilhado (#c=, coleção de outra pessoa)
 * e o modo planejamento não gravam no localStorage, então não entram.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'pokemon_emerald_tcg_tracker_v1';
  const POLL_MS = 3000;

  // Sem a coleção salva não é a página do Tracker (ou ele ainda não salvou nada)
  if (localStorage.getItem(STORAGE_KEY) == null) return;

  let lastRaw = null;
  let catalogPromise = null;

  function loadCatalog() {
    if (!catalogPromise) {
      const url = new URL('../assets/data/catalog.min.json', location.href);
      catalogPromise = fetch(url)
        .then(response => (response.ok ? response.json() : null))
        .catch(() => null);
    }
    return catalogPromise;
  }

  async function sync() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === lastRaw) return;

    let saved;
    try {
      saved = JSON.parse(raw);
    } catch (err) {
      return;
    }
    if (!Array.isArray(saved)) return;
    lastRaw = raw;

    // Impressão marcada: o `file` do Tracker é a chave do catálogo
    const catalog = await loadCatalog();
    const byFile = new Map();
    if (catalog && Array.isArray(catalog.cards)) {
      catalog.cards.forEach(card => byFile.set(card.file, card));
    }
    const sets = (catalog && catalog.sets) || {};

    const trackerCards = saved.map(card => {
      const print = card.file ? byFile.get(card.file) : null;
      const set = print ? print.set : null;
      return {
        id: card.id,
        name: card.name,
        collected: card.collected === true,
        finish: card.finish || '',
        collection: card.collection || (print && print.collection) || '',
        set,
        number: print ? String(print.number) : null,
        total: set && sets[set] && sets[set].total ? sets[set].total : null
      };
    });

    const collected = trackerCards.filter(card => card.collected).length;
    await browser.storage.local.set({
      trackerCards,
      trackerSync: { at: Date.now(), source: 'auto', collected, total: trackerCards.length }
    });
    console.log(`[Emerald TCG] Tracker sincronizado: ${collected}/${trackerCards.length} cartas`);
  }

  sync();
  setInterval(sync, POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sync();
  });
})();
