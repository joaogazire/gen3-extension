/* Emerald TCG Finder - Popup Script */

const emeraldOnlyBtn = document.getElementById('emeraldOnlyBtn');
const missingOnlyBtn = document.getElementById('missingOnlyBtn');
const syncLinkInput = document.getElementById('syncLinkInput');
const syncLinkBtn = document.getElementById('syncLinkBtn');
const saveStatus = document.getElementById('saveStatus');

// Carrega estado salvo
async function loadState() {
  const data = await browser.storage.local.get(['emeraldOnlyMode', 'missingOnlyMode', 'shareUrl', 'trackerCards']);

  updateEmeraldButton(data.emeraldOnlyMode === true);
  updateMissingButton(data.missingOnlyMode === true);

  if (data.shareUrl) {
    syncLinkInput.value = data.shareUrl;
  }

  // Se já temos cartas salvas, mostra no status
  if (data.trackerCards && Array.isArray(data.trackerCards)) {
    const collected = data.trackerCards.filter(c => c.collected).length;
    const total = data.trackerCards.length;
    const missing = total - collected;
    saveStatus.textContent = `✓ ${collected}/${total} cartas (${missing} faltando)`;
  }
}

function updateEmeraldButton(isActive) {
  if (isActive) {
    emeraldOnlyBtn.textContent = '❌ Desativar Apenas Emerald';
    emeraldOnlyBtn.classList.add('active');
  } else {
    emeraldOnlyBtn.textContent = '⚡ Apenas Emerald';
    emeraldOnlyBtn.classList.remove('active');
  }
}

function updateMissingButton(isActive) {
  if (isActive) {
    missingOnlyBtn.textContent = '❌ Desativar Apenas Faltando';
    missingOnlyBtn.classList.add('active');
  } else {
    missingOnlyBtn.textContent = '📋 Apenas Faltando';
    missingOnlyBtn.classList.remove('active');
  }
}

// Roster estático - não precisa carregar do tracker
const HOENN_ROSTER = [
  { id: 252, number: 1, name: "Treecko" },
  { id: 253, number: 2, name: "Grovyle" },
  { id: 254, number: 3, name: "Sceptile" },
  { id: 255, number: 4, name: "Torchic" },
  { id: 256, number: 5, name: "Combusken" },
  { id: 257, number: 6, name: "Blaziken" },
  { id: 258, number: 7, name: "Mudkip" },
  { id: 259, number: 8, name: "Marshtomp" },
  { id: 260, number: 9, name: "Swampert" },
  { id: 261, number: 10, name: "Poochyena" },
  { id: 262, number: 11, name: "Mightyena" },
  { id: 263, number: 12, name: "Zigzagoon" },
  { id: 264, number: 13, name: "Linoone" },
  { id: 265, number: 14, name: "Wurmple" },
  { id: 266, number: 15, name: "Silcoon" },
  { id: 267, number: 16, name: "Beautifly" },
  { id: 268, number: 17, name: "Cascoon" },
  { id: 269, number: 18, name: "Dustox" },
  { id: 270, number: 19, name: "Lotad" },
  { id: 271, number: 20, name: "Lombre" },
  { id: 272, number: 21, name: "Ludicolo" },
  { id: 273, number: 22, name: "Seedot" },
  { id: 274, number: 23, name: "Nuzleaf" },
  { id: 275, number: 24, name: "Shiftry" },
  { id: 276, number: 25, name: "Taillow" },
  { id: 277, number: 26, name: "Swellow" },
  { id: 278, number: 27, name: "Wingull" },
  { id: 279, number: 28, name: "Pelipper" },
  { id: 280, number: 29, name: "Ralts" },
  { id: 281, number: 30, name: "Kirlia" },
  { id: 282, number: 31, name: "Gardevoir" },
  { id: 283, number: 32, name: "Surskit" },
  { id: 284, number: 33, name: "Masquerain" },
  { id: 285, number: 34, name: "Shroomish" },
  { id: 286, number: 35, name: "Breloom" },
  { id: 287, number: 36, name: "Slakoth" },
  { id: 288, number: 37, name: "Vigoroth" },
  { id: 289, number: 38, name: "Slaking" },
  { id: 63, number: 39, name: "Abra" },
  { id: 64, number: 40, name: "Kadabra" },
  { id: 65, number: 41, name: "Alakazam" },
  { id: 290, number: 42, name: "Nincada" },
  { id: 291, number: 43, name: "Ninjask" },
  { id: 292, number: 44, name: "Shedinja" },
  { id: 293, number: 45, name: "Whismur" },
  { id: 294, number: 46, name: "Loudred" },
  { id: 295, number: 47, name: "Exploud" },
  { id: 296, number: 48, name: "Makuhita" },
  { id: 297, number: 49, name: "Hariyama" },
  { id: 118, number: 50, name: "Goldeen" },
  { id: 119, number: 51, name: "Seaking" },
  { id: 129, number: 52, name: "Magikarp" },
  { id: 130, number: 53, name: "Gyarados" },
  { id: 298, number: 54, name: "Azurill" },
  { id: 183, number: 55, name: "Marill" },
  { id: 184, number: 56, name: "Azumarill" },
  { id: 74, number: 57, name: "Geodude" },
  { id: 75, number: 58, name: "Graveler" },
  { id: 76, number: 59, name: "Golem" },
  { id: 299, number: 60, name: "Nosepass" },
  { id: 300, number: 61, name: "Skitty" },
  { id: 301, number: 62, name: "Delcatty" },
  { id: 41, number: 63, name: "Zubat" },
  { id: 42, number: 64, name: "Golbat" },
  { id: 169, number: 65, name: "Crobat" },
  { id: 72, number: 66, name: "Tentacool" },
  { id: 73, number: 67, name: "Tentacruel" },
  { id: 302, number: 68, name: "Sableye" },
  { id: 303, number: 69, name: "Mawile" },
  { id: 304, number: 70, name: "Aron" },
  { id: 305, number: 71, name: "Lairon" },
  { id: 306, number: 72, name: "Aggron" },
  { id: 66, number: 73, name: "Machop" },
  { id: 67, number: 74, name: "Machoke" },
  { id: 68, number: 75, name: "Machamp" },
  { id: 307, number: 76, name: "Meditite" },
  { id: 308, number: 77, name: "Medicham" },
  { id: 309, number: 78, name: "Electrike" },
  { id: 310, number: 79, name: "Manectric" },
  { id: 311, number: 80, name: "Plusle" },
  { id: 312, number: 81, name: "Minun" },
  { id: 81, number: 82, name: "Magnemite" },
  { id: 82, number: 83, name: "Magneton" },
  { id: 100, number: 84, name: "Voltorb" },
  { id: 101, number: 85, name: "Electrode" },
  { id: 313, number: 86, name: "Volbeat" },
  { id: 314, number: 87, name: "Illumise" },
  { id: 43, number: 88, name: "Oddish" },
  { id: 44, number: 89, name: "Gloom" },
  { id: 45, number: 90, name: "Vileplume" },
  { id: 182, number: 91, name: "Bellossom" },
  { id: 84, number: 92, name: "Doduo" },
  { id: 85, number: 93, name: "Dodrio" },
  { id: 315, number: 94, name: "Roselia" },
  { id: 316, number: 95, name: "Gulpin" },
  { id: 317, number: 96, name: "Swalot" },
  { id: 318, number: 97, name: "Carvanha" },
  { id: 319, number: 98, name: "Sharpedo" },
  { id: 320, number: 99, name: "Wailmer" },
  { id: 321, number: 100, name: "Wailord" },
  { id: 322, number: 101, name: "Numel" },
  { id: 323, number: 102, name: "Camerupt" },
  { id: 218, number: 103, name: "Slugma" },
  { id: 219, number: 104, name: "Magcargo" },
  { id: 324, number: 105, name: "Torkoal" },
  { id: 88, number: 106, name: "Grimer" },
  { id: 89, number: 107, name: "Muk" },
  { id: 109, number: 108, name: "Koffing" },
  { id: 110, number: 109, name: "Weezing" },
  { id: 325, number: 110, name: "Spoink" },
  { id: 326, number: 111, name: "Grumpig" },
  { id: 27, number: 112, name: "Sandshrew" },
  { id: 28, number: 113, name: "Sandslash" },
  { id: 327, number: 114, name: "Spinda" },
  { id: 227, number: 115, name: "Skarmory" },
  { id: 328, number: 116, name: "Trapinch" },
  { id: 329, number: 117, name: "Vibrava" },
  { id: 330, number: 118, name: "Flygon" },
  { id: 331, number: 119, name: "Cacnea" },
  { id: 332, number: 120, name: "Cacturne" },
  { id: 333, number: 121, name: "Swablu" },
  { id: 334, number: 122, name: "Altaria" },
  { id: 335, number: 123, name: "Zangoose" },
  { id: 336, number: 124, name: "Seviper" },
  { id: 337, number: 125, name: "Lunatone" },
  { id: 338, number: 126, name: "Solrock" },
  { id: 339, number: 127, name: "Barboach" },
  { id: 340, number: 128, name: "Whiscash" },
  { id: 341, number: 129, name: "Corphish" },
  { id: 342, number: 130, name: "Crawdaunt" },
  { id: 343, number: 131, name: "Baltoy" },
  { id: 344, number: 132, name: "Claydol" },
  { id: 345, number: 133, name: "Lileep" },
  { id: 346, number: 134, name: "Cradily" },
  { id: 347, number: 135, name: "Anorith" },
  { id: 348, number: 136, name: "Armaldo" },
  { id: 174, number: 137, name: "Igglybuff" },
  { id: 39, number: 138, name: "Jigglypuff" },
  { id: 40, number: 139, name: "Wigglytuff" },
  { id: 349, number: 140, name: "Feebas" },
  { id: 350, number: 141, name: "Milotic" },
  { id: 351, number: 142, name: "Castform" },
  { id: 120, number: 143, name: "Staryu" },
  { id: 121, number: 144, name: "Starmie" },
  { id: 352, number: 145, name: "Kecleon" },
  { id: 353, number: 146, name: "Shuppet" },
  { id: 354, number: 147, name: "Banette" },
  { id: 355, number: 148, name: "Duskull" },
  { id: 356, number: 149, name: "Dusclops" },
  { id: 357, number: 150, name: "Tropius" },
  { id: 358, number: 151, name: "Chimecho" },
  { id: 359, number: 152, name: "Absol" },
  { id: 37, number: 153, name: "Vulpix" },
  { id: 38, number: 154, name: "Ninetales" },
  { id: 172, number: 155, name: "Pichu" },
  { id: 25, number: 156, name: "Pikachu" },
  { id: 26, number: 157, name: "Raichu" },
  { id: 54, number: 158, name: "Psyduck" },
  { id: 55, number: 159, name: "Golduck" },
  { id: 360, number: 160, name: "Wynaut" },
  { id: 202, number: 161, name: "Wobbuffet" },
  { id: 177, number: 162, name: "Natu" },
  { id: 178, number: 163, name: "Xatu" },
  { id: 203, number: 164, name: "Girafarig" },
  { id: 231, number: 165, name: "Phanpy" },
  { id: 232, number: 166, name: "Donphan" },
  { id: 127, number: 167, name: "Pinsir" },
  { id: 214, number: 168, name: "Heracross" },
  { id: 111, number: 169, name: "Rhyhorn" },
  { id: 112, number: 170, name: "Rhydon" },
  { id: 361, number: 171, name: "Snorunt" },
  { id: 362, number: 172, name: "Glalie" },
  { id: 363, number: 173, name: "Spheal" },
  { id: 364, number: 174, name: "Sealeo" },
  { id: 365, number: 175, name: "Walrein" },
  { id: 366, number: 176, name: "Clamperl" },
  { id: 367, number: 177, name: "Huntail" },
  { id: 368, number: 178, name: "Gorebyss" },
  { id: 369, number: 179, name: "Relicanth" },
  { id: 222, number: 180, name: "Corsola" },
  { id: 170, number: 181, name: "Chinchou" },
  { id: 171, number: 182, name: "Lanturn" },
  { id: 370, number: 183, name: "Luvdisc" },
  { id: 116, number: 184, name: "Horsea" },
  { id: 117, number: 185, name: "Seadra" },
  { id: 230, number: 186, name: "Kingdra" },
  { id: 371, number: 187, name: "Bagon" },
  { id: 372, number: 188, name: "Shelgon" },
  { id: 373, number: 189, name: "Salamence" },
  { id: 374, number: 190, name: "Beldum" },
  { id: 375, number: 191, name: "Metang" },
  { id: 376, number: 192, name: "Metagross" },
  { id: 377, number: 193, name: "Regirock" },
  { id: 378, number: 194, name: "Regice" },
  { id: 379, number: 195, name: "Registeel" },
  { id: 380, number: 196, name: "Latias" },
  { id: 381, number: 197, name: "Latios" },
  { id: 382, number: 198, name: "Kyogre" },
  { id: 383, number: 199, name: "Groudon" },
  { id: 384, number: 200, name: "Rayquaza" },
  { id: 385, number: 201, name: "Jirachi" },
  { id: 386, number: 202, name: "Deoxys" }
];

// Formatos do link de compartilhamento do Tracker (src/script.js do gen3-track-tcg).
// v2 (atual): payload compacto "2:<estampa base36>:<entradas>" (delta-encoding do
// índice na roster). v1 (legado): JSON {v:1, g, c:[[roster, asset?, finish?]]} —
// ainda aceito porque links v1 compartilhados antes da migração continuam válidos.
const SHARE_FORMAT_VERSION = '2';
const SHARE_FINISH_CODES = ["normal", "holo", "reverse", "reverse holo", "full art", "secret", "shiny"];

function parseShareStateV1(json) {
  let state = null;
  try {
    state = JSON.parse(json || '');
  } catch (error) {
    state = null;
  }
  if (!state || state.v !== 1 || !Array.isArray(state.c)) return null;

  const map = new Map();
  state.c.forEach((entry) => {
    if (!Array.isArray(entry) || !Number.isInteger(entry[0])) return;
    map.set(entry[0], {
      asset: Number.isInteger(entry[1]) ? entry[1] : -1,
      finish: entry.length >= 3 ? SHARE_FINISH_CODES[entry[2]] || '' : ''
    });
  });
  return map.size ? map : null;
}

function parseShareStateV2(payload) {
  const body = payload.slice(SHARE_FORMAT_VERSION.length + 1); // remove "2:"
  const sep = body.indexOf(':');
  const entriesRaw = sep >= 0 ? body.slice(sep + 1) : '';

  const map = new Map();
  let prevRoster = 0;
  entriesRaw.split(',').forEach((token) => {
    if (!token) return;
    const [deltaStr, assetStr, finishStr] = token.split('.');
    const delta = parseInt(deltaStr, 36);
    if (!Number.isFinite(delta)) return;
    const rosterIndex = prevRoster + delta;
    prevRoster = rosterIndex;

    const asset = assetStr !== undefined ? parseInt(assetStr, 36) : NaN;
    const finishCode = finishStr !== undefined ? parseInt(finishStr, 36) : NaN;
    map.set(rosterIndex, {
      asset: Number.isFinite(asset) ? asset : -1,
      finish: Number.isFinite(finishCode) ? (SHARE_FINISH_CODES[finishCode] || '') : ''
    });
  });
  return map.size ? map : null;
}

// Carrega save do tracker via link de compartilhamento
async function loadSaveFromShareLink(shareUrl) {
  saveStatus.textContent = 'Carregando save...';

  try {
    const url = new URL(shareUrl);

    // O hash tem formato: #c=<payload comprimido>
    const hash = url.hash;
    if (!hash || !hash.startsWith('#c=')) {
      saveStatus.textContent = 'Link inválido - use o botão Compartilhar do Tracker';
      return false;
    }

    const compact = hash.slice(3); // Remove "#c="

    // Descomprime exatamente como o tracker faz
    let payload = null;
    try {
      payload = typeof LZString !== 'undefined'
        ? LZString.decompressFromEncodedURIComponent(compact)
        : decodeURIComponent(compact);
    } catch (error) {
      console.error('[Emerald TCG] Erro ao decodificar:', error);
      payload = null;
    }

    const map = !payload ? null
      : payload.startsWith('{') ? parseShareStateV1(payload)
      : payload.startsWith(`${SHARE_FORMAT_VERSION}:`) ? parseShareStateV2(payload)
      : null;

    if (!map) {
      saveStatus.textContent = 'Formato de save inválido - verifique o link';
      return false;
    }

    // Cria a lista completa de cartas (todas as 202), coletada ou não
    const cards = HOENN_ROSTER.map((pokemon, index) => {
      const state = map.get(index);
      return {
        id: pokemon.id,
        name: pokemon.name,
        collected: map.has(index),
        variant: state && state.asset >= 0 ? `variant_${state.asset}` : '',
        finish: state ? state.finish : ''
      };
    });

    // Salva no storage.local da extensão
    await browser.storage.local.set({ trackerCards: cards });

    const collected = cards.filter(c => c.collected).length;
    const missing = cards.length - collected;
    saveStatus.textContent = `✓ Save carregado: ${collected}/${cards.length} (${missing} faltando)`;
    return true;

  } catch (err) {
    console.error('[Emerald TCG Popup] Erro ao carregar save:', err);
    saveStatus.textContent = 'Erro ao carregar save - verifique o link';
    return false;
  }
}

// Sincroniza com o Tracker: carrega o save do link colado (se houver) e liga
// "Apenas Faltando" na aba atual, tudo em um clique só.
async function syncMissingCards() {
  const url = syncLinkInput.value.trim();

  if (url) {
    const success = await loadSaveFromShareLink(url);
    if (!success) return;
    await browser.storage.local.set({ shareUrl: url });
  } else {
    const data = await browser.storage.local.get(['trackerCards']);
    if (!data.trackerCards) {
      saveStatus.textContent = 'Cole o link de compartilhamento do Tracker primeiro';
      return;
    }
  }

  await browser.storage.local.set({ missingOnlyMode: true });
  updateMissingButton(true);

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    browser.tabs.sendMessage(tab.id, { action: 'toggleMissingOnly', enabled: true });
  } catch (err) {
    console.error('[Emerald TCG] Erro ao sincronizar:', err);
  }
}

// Modo APENAS EMERALD
emeraldOnlyBtn.addEventListener('click', async () => {
  const data = await browser.storage.local.get(['emeraldOnlyMode']);
  const newState = !(data.emeraldOnlyMode === true);

  await browser.storage.local.set({ emeraldOnlyMode: newState });
  updateEmeraldButton(newState);

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, { action: 'toggleEmeraldOnly', enabled: newState });
});

// Modo APENAS FALTANDO
missingOnlyBtn.addEventListener('click', async () => {
  const data = await browser.storage.local.get(['missingOnlyMode']);
  const newState = !(data.missingOnlyMode === true);

  await browser.storage.local.set({ missingOnlyMode: newState });
  updateMissingButton(newState);

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, { action: 'toggleMissingOnly', enabled: newState });
});

// Botão de sincronização com o Tracker
syncLinkBtn.addEventListener('click', syncMissingCards);

// Escanear página
document.getElementById('scanBtn').addEventListener('click', async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  browser.tabs.sendMessage(tab.id, { action: 'scanPage' });
  window.close();
});

// Abrir tracker
document.getElementById('openTrackerBtn').addEventListener('click', () => {
  browser.tabs.create({ url: 'https://joaogazire.github.io/gen3-track-tcg/src/' });
  window.close();
});

// Atualiza contagem
async function updateCount() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    browser.tabs.sendMessage(tab.id, { action: 'getCardCount' }, (response) => {
      if (response) {
        document.getElementById('cardsFound').textContent = response.count;
      }
    });
  } catch (e) {}
}

loadState();
updateCount();
