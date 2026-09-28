/* Emerald TCG Finder - leitura dos preços ocultos da Liga Pokemon
 *
 * A Liga não manda em texto o preço da maioria dos anúncios (cards_stock):
 * cada dígito é um <div> cujas classes CSS apontam pra uma célula de uma
 * imagem de números (sprite) gerada a cada carregamento, com os dígitos
 * embaralhados e em fontes misturadas. `precoCss` traz, por dígito, o grupo
 * de classes ("xGfHf lIsKx cZfFi"), separados por ";", e "V" pra vírgula.
 *
 * Os desenhos dos dígitos vêm de um conjunto fixo de fontes, então cada
 * célula é reconhecida pelo vizinho mais parecido entre as células de uma
 * imagem de referência rotulada à mão (liga-digits-ref.jpg, 4 linhas x 75
 * células de 8px). Funções puras sobre {width, height, data RGBA} — o
 * background carrega as imagens e chama daqui.
 */

(function(root) {
  'use strict';

  const REF_ROWS = [2, 23, 44, 65];
  const CELL_STEP = 8;
  const CELL_W = 7;
  const CELL_H = 15;
  const REF_LABELS =
    '975983819,369,81,4,138050,804,932908666595,602839338160209707398,26404,,535' +
    '042,61913952,6301828,34341987350441819,237,,61849198,06827,8832136981048724' +
    '83857026422894379295812390437710473,69829,29193,031463696021032013495773706' +
    '233481033430000897969317248955,32303686911129625327272049,76162546,,8950,07';

  const FEAT_W = 8;
  const FEAT_H = 12;
  const INK_THRESHOLD = 0.25;
  // Diferença mínima de semelhança entre o dígito escolhido e o melhor de
  // outro dígito. Nos testes (5.700+ anúncios) a menor foi ~0,18; abaixo
  // disso o dígito é tratado como ilegível
  const MIN_MARGIN = 0.08;

  // "Tinta" de um pixel: escuro ou saturado (dígitos coloridos sobre branco)
  function inkAt(img, x, y) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return 0;
    const i = (y * img.width + x) * 4;
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    const v = (255 - Math.min(r, g, b) * 0.3 - ((r + g + b) / 3) * 0.7) / 255;
    return v < 0 ? 0 : (v > 1 ? 1 : v);
  }

  // Vetor de características de uma célula: recorta pela caixa da tinta,
  // reamostra pra 8x12, centraliza e normaliza; mais a largura/altura da
  // caixa (diferencia "1" de "7" estreitos, vírgula etc.)
  function cellFeature(img, x0, y0, w, h) {
    const cell = [];
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = inkAt(img, x0 + x, y0 + y);
        cell.push(v);
        if (v > INK_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const at = (x, y) => cell[(minY + Math.min(bh - 1, Math.max(0, y))) * w + minX + Math.min(bw - 1, Math.max(0, x))];

    const vec = new Float64Array(FEAT_W * FEAT_H + 2);
    let mean = 0;
    for (let ty = 0; ty < FEAT_H; ty++) {
      for (let tx = 0; tx < FEAT_W; tx++) {
        const sx = (tx + 0.5) * bw / FEAT_W - 0.5;
        const sy = (ty + 0.5) * bh / FEAT_H - 0.5;
        const x = Math.floor(sx), y = Math.floor(sy);
        const fx = sx - x, fy = sy - y;
        const v = at(x, y) * (1 - fx) * (1 - fy) + at(x + 1, y) * fx * (1 - fy) +
          at(x, y + 1) * (1 - fx) * fy + at(x + 1, y + 1) * fx * fy;
        vec[ty * FEAT_W + tx] = v;
        mean += v;
      }
    }
    mean /= FEAT_W * FEAT_H;
    let norm = 0;
    for (let k = 0; k < FEAT_W * FEAT_H; k++) {
      vec[k] -= mean;
      norm += vec[k] * vec[k];
    }
    norm = Math.sqrt(norm) || 1;
    for (let k = 0; k < FEAT_W * FEAT_H; k++) vec[k] /= norm;
    vec[FEAT_W * FEAT_H] = (bw / CELL_W) * 0.8;
    vec[FEAT_W * FEAT_H + 1] = (bh / CELL_H) * 0.8;
    return vec;
  }

  function buildTemplates(refImg) {
    const templates = [];
    let k = 0;
    for (const y of REF_ROWS) {
      for (let col = 0; col < Math.floor(refImg.width / CELL_STEP); col++, k++) {
        const vec = cellFeature(refImg, col * CELL_STEP, y, CELL_W, CELL_H);
        if (vec) templates.push({ vec, label: REF_LABELS[k] });
      }
    }
    return templates;
  }

  function classify(templates, vec) {
    let best = null, bestScore = -Infinity;
    const scores = templates.map(t => {
      let s = 0;
      for (let i = 0; i < vec.length; i++) s += t.vec[i] * vec[i];
      if (s > bestScore) { bestScore = s; best = t.label; }
      return s;
    });
    let other = -Infinity;
    templates.forEach((t, i) => {
      if (t.label !== best && scores[i] > other) other = scores[i];
    });
    return { label: best, margin: bestScore - other };
  }

  // Regras do CSS da página que importam: classe -> imagem, posição,
  // largura e altura
  function parseSpriteCss(cssText) {
    const rules = {};
    const re = /\.([A-Za-z]{3,10})\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(cssText))) {
      const body = m[2];
      const rule = rules[m[1]] || (rules[m[1]] = {});
      const img = body.match(/background-image:\s*url\(([^)]+)\)/);
      if (img) rule.img = img[1].replace(/^["']|["']$/g, '');
      const pos = body.match(/background-position:\s*(-?\d+)px\s+(-?\d+)px/);
      if (pos) { rule.x = -parseInt(pos[1], 10); rule.y = -parseInt(pos[2], 10); }
      const w = body.match(/(?:^|;)\s*width:\s*(\d+)px/);
      if (w) rule.w = parseInt(w[1], 10);
      const h = body.match(/(?:^|;)\s*height:\s*(\d+)px/);
      if (h) rule.h = parseInt(h[1], 10);
    }
    return rules;
  }

  // Células (imagem + posição) de cada dígito de um precoCss; vírgula = null
  function glyphsOf(precoCss, rules) {
    return String(precoCss || '').split(';').filter(Boolean).map(group => {
      if (group.trim() === 'V') return null;
      const glyph = { img: null, x: null, y: null, w: CELL_W, h: CELL_H };
      group.trim().split(/\s+/).forEach(cls => {
        const r = rules[cls];
        if (!r) return;
        if (r.img) glyph.img = r.img;
        if (r.x != null) { glyph.x = r.x; glyph.y = r.y; }
        if (r.w != null) glyph.w = Math.min(glyph.w, r.w);
        if (r.h != null) glyph.h = r.h;
      });
      return glyph;
    });
  }

  function spriteUrls(stock, rules) {
    const urls = new Set();
    stock.forEach(s => glyphsOf(s.precoCss, rules).forEach(g => { if (g && g.img) urls.add(g.img); }));
    return [...urls];
  }

  // Preço de um anúncio a partir das imagens já carregadas (url -> imagem).
  // null se algum dígito faltar ou não for reconhecido com segurança
  function decodePrice(precoCss, rules, sprites, templates) {
    const glyphs = glyphsOf(precoCss, rules);
    if (glyphs.length === 0) return null;
    let text = '';
    for (const g of glyphs) {
      if (g === null) { text += ','; continue; }
      const img = g.img && sprites[g.img];
      if (!img || g.x == null) return null;
      const vec = cellFeature(img, g.x, g.y, Math.min(g.w, CELL_W), Math.min(g.h, CELL_H));
      if (!vec) return null;
      const { label, margin } = classify(templates, vec);
      if (margin < MIN_MARGIN) return null;
      text += label;
    }
    if (!/^\d+(,\d{1,2})?$/.test(text)) return null;
    const price = parseFloat(text.replace(',', '.'));
    return price > 0 ? price : null;
  }

  // Decifra os preços de todo o cards_stock. Conferência: `p` é a posição
  // do anúncio na ordem de preço da Liga, então os preços (decifrados e em
  // texto) têm que subir junto com `p` — se não subirem, a leitura dessa
  // página não é confiável e nenhum preço decifrado é devolvido.
  function decodeStock(stock, rules, sprites, templates) {
    const prices = {};
    stock.forEach(s => {
      if (s.precoFinal != null || !s.precoCss) return;
      const price = decodePrice(s.precoCss, rules, sprites, templates);
      if (price != null) prices[s.id] = price;
    });

    const textPrice = s => {
      const v = parseFloat(String(s.precoFinal).replace(',', '.'));
      return v > 0 ? v : null;
    };
    const ordered = stock
      .filter(s => s.p != null)
      .map(s => ({ p: Number(s.p), price: s.precoFinal != null ? textPrice(s) : prices[s.id] }))
      .filter(e => e.price != null)
      .sort((a, b) => a.p - b.p);
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].price + 0.005 < ordered[i - 1].price) {
        return { prices: {}, consistent: false };
      }
    }
    return { prices, consistent: true };
  }

  // -------------------------------------------------------------------------
  // Listagem das lojas da mesma engine: o preço de cada card também é uma
  // sequência de células de uma imagem de números (/up/ecom/imgnum), mas os
  // dígitos de verdade usam sempre a mesma fonte pixelada (8x8, nas linhas
  // 4–11 de uma célula de 8x16) — o resto da imagem são borrões de isca que
  // a página nunca usa. Então a leitura é por comparação exata de pixels com
  // os 10 dígitos abaixo, com tolerância mínima.
  // -------------------------------------------------------------------------

  const ECOM_CELL_W = 8;
  const ECOM_CELL_H = 16;
  const ECOM_GLYPH_TOP = 4;
  // Comparação suave: cada pixel conta pelo quanto está escuro (0..1), não
  // só escuro/claro — o JPEG decodificado no navegador e o ruído de canvas
  // da proteção anti-rastreamento mexem nos tons perto do limiar, e o 0 e o
  // 8 diferem em só 4 pixels. Aceita o melhor se o custo for baixo e o 2º
  // colocado ficar pelo menos ECOM_MIN_GAP atrás
  const ECOM_MAX_COST = 6;
  const ECOM_MIN_GAP = 2;
  const ECOM_DIGITS = {
    '0': ['..####..', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '..####..'],
    '1': ['...##...', '.####...', '...##...', '...##...', '...##...', '...##...', '...##...', '.######.'],
    '2': ['..####..', '.##..##.', '.....##.', '....##..', '...##...', '..##....', '.##.....', '.######.'],
    '3': ['..####..', '.##..##.', '.....##.', '...###..', '.....##.', '.....##.', '.##..##.', '..####..'],
    '4': ['....##..', '...###..', '..####..', '.##.##..', '##..##..', '#######.', '....##..', '....##..'],
    '5': ['.######.', '.##.....', '.##.....', '.#####..', '.....##.', '.....##.', '.##..##.', '..####..'],
    '6': ['...###..', '..##....', '.##.....', '.#####..', '.##..##.', '.##..##.', '.##..##.', '..####..'],
    '7': ['.######.', '.....##.', '....##..', '....##..', '...##...', '...##...', '..##....', '..##....'],
    '8': ['..####..', '.##..##.', '.##..##.', '..####..', '.##..##.', '.##..##.', '.##..##.', '..####..'],
    '9': ['..####..', '.##..##.', '.##..##.', '.##..##.', '..#####.', '.....##.', '....##..', '..###...']
  };
  const ECOM_TEMPLATES = Object.entries(ECOM_DIGITS).map(([digit, rows]) => {
    const bits = [];
    for (let y = 0; y < ECOM_CELL_H; y++) {
      const row = rows[y - ECOM_GLYPH_TOP] || '........';
      for (let x = 0; x < ECOM_CELL_W; x++) bits.push(row[x] === '#' ? 1 : 0);
    }
    return { digit, bits };
  });

  // Quão escuro é o pixel (0 = fundo, 1 = traço do dígito), considerando
  // transparência (sobre fundo branco). Os dígitos são cinza-escuros (~70),
  // então escurecimento de 0,15 a 0,6 vira a escala 0..1
  function darkAt(img, x, y) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return 0;
    const i = (y * img.width + x) * 4;
    const a = img.data[i + 3] / 255;
    const gray = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
    const dark = (a * (255 - gray)) / 255;
    return Math.min(1, Math.max(0, (dark - 0.15) / 0.45));
  }

  function readEcomDigit(img, x0, y0) {
    const cell = [];
    for (let y = 0; y < ECOM_CELL_H; y++) {
      for (let x = 0; x < ECOM_CELL_W; x++) cell.push(darkAt(img, x0 + x, y0 + y));
    }
    const ranked = ECOM_TEMPLATES
      .map(t => ({ digit: t.digit, cost: t.bits.reduce((n, bit, i) => n + Math.abs(bit - cell[i]), 0) }))
      .sort((a, b) => a.cost - b.cost);
    const [best, second] = ranked;
    return best.cost <= ECOM_MAX_COST && second.cost - best.cost >= ECOM_MIN_GAP ? best.digit : null;
  }

  // `tokens`: por dígito, a string de classes do <div> (ou ',' pra vírgula).
  // Devolve o preço, ou null se algum dígito não for reconhecido
  function decodeEcomPrice(tokens, rules, sprites) {
    let text = '';
    for (const token of tokens) {
      if (token === ',') { text += ','; continue; }
      let img = null, x = null, y = null;
      String(token).trim().split(/\s+/).forEach(cls => {
        const r = rules[cls];
        if (!r) return;
        if (r.img) img = r.img;
        if (r.x != null) { x = r.x; y = r.y; }
      });
      if (!img || !sprites[img] || x == null) return null;
      const digit = readEcomDigit(sprites[img], x, y);
      if (digit == null) return null;
      text += digit;
    }
    if (!/^\d+(,\d{1,2})?$/.test(text)) return null;
    const price = parseFloat(text.replace(',', '.'));
    return price > 0 ? price : null;
  }

  function ecomSpriteUrls(tokens, rules) {
    const urls = new Set();
    tokens.forEach(token => {
      if (token === ',') return;
      String(token).trim().split(/\s+/).forEach(cls => { if (rules[cls] && rules[cls].img) urls.add(rules[cls].img); });
    });
    return [...urls];
  }

  const api = { buildTemplates, parseSpriteCss, spriteUrls, decodeStock, decodePrice, decodeEcomPrice, ecomSpriteUrls };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EmeraldLigaOcr = api;
})(this);
