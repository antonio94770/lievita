// Test del motore di Lievita. Si eseguono con:  node --test test/engine.test.js
// Il motore vive ancora dentro index.html: estraggo il blocco <script id="engine"> e lo eseguo in un contesto isolato.
const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const fs = require(`node:fs`);
const path = require(`node:path`);
const vm = require(`node:vm`);

const root = path.join(__dirname, `..`);
const html = fs.readFileSync(process.env.LIEVITA_HTML || path.join(root, `index.html`), `utf8`);
const src = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const ctx = { Math, Date, Object, JSON, String, Number, Array };
vm.createContext(ctx);
vm.runInContext(src + `;this.E={state,params,buildPlan,ingredients,fT,heqOf,yeastPct,PLANS,nightAt,STYLES};`, ctx);
const E = ctx.E;

const CRAIG = JSON.parse(fs.readFileSync(path.join(root, `docs`, `craig-2014.json`), `utf8`));
const ALL_REFS = JSON.parse(fs.readFileSync(path.join(root, `docs`, `riferimenti-lievito.json`), `utf8`)).riferimenti;
const REFS = ALL_REFS.filter(r => r.stile !== `teglia`);
const TEGLIA_REFS = ALL_REFS.filter(r => r.stile === `teglia`);

const H = 36e5;
const DINNER = new Date(2026, 10, 21, 20, 0, 0, 0); // sabato 21/11/2026 alle 20
const NOW = DINNER.getTime() - 5 * 24 * H;

function plan(style, room, pk, opts = {}) {
  Object.assign(E.state, { room, fridge: opts.fridge ?? 4, dinner: opts.dinner ?? DINNER, style, tn: 1, tw: 30, th: 40, n: 4 });
  const cfg = { style, flour: opts.flour ?? `forte`, oven: `casa_acciaio`, over: {}, yeast: `fresco`, mixer: false };
  const P = E.params(cfg);
  const pl = E.buildPlan(pk, P, cfg, opts.now ?? NOW);
  return { P, pl, cfg };
}
// lievito previsto per un riferimento: fasi [ore, °C, frigo?]
function predict(fasi, teglia = false) {
  const room = (fasi.find(f => !f[2]) || [0, 20])[1];
  const y = E.yeastPct(E.heqOf(fasi.map(([h, T, fr]) => [fr ? `frigo` : `ambiente`, h, T]), room, teglia));
  return teglia ? Math.min(3, y * E.STYLES.teglia.yeastK) : y;
}
const median = a => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

test(`fT: vale 1 a 20 °C, cresce con la temperatura, è continua a 12 °C e a 4 °C vale circa 0,19`, () => {
  assert.equal(E.fT(20), 1);
  assert.ok(Math.abs(E.fT(12) - E.fT(11.999)) < 1e-3);
  assert.ok(Math.abs(E.fT(4) / 0.193 - 1) < 0.03, `fT(4) = ${E.fT(4).toFixed(3)}`);
  for (let t = 2; t < 35; t++) assert.ok(E.fT(t + 1) > E.fT(t), `fT cresce (${t} °C)`);
});

test(`yeastPct: scende sempre con le ore e resta tra 0,02% e 3%`, () => {
  let prev = Infinity;
  for (let h = 0.5; h <= 300; h += 0.5) {
    const y = E.yeastPct(h);
    assert.ok(y <= prev + 1e-12, `non deve risalire (heq ${h})`);
    assert.ok(y >= 0.02 && y <= 3);
    prev = y;
  }
});

// Tabella di Craig (docs/craig-2014.json), solo nella zona che usa l'app: 14–28 °C, 3–30 ore a temperatura costante.
test(`tabella di Craig: mediana entro ±20% e 80% delle celle entro 0,7–1,45 volte`, () => {
  const r = [];
  for (const [t, row] of Object.entries(CRAIG.ore)) {
    const T = Number(t), off = CRAIG.cy.length - row.length;
    row.forEach((h, i) => { if (T >= 13.9 && T <= 28.3 && h >= 3 && h <= 30) r.push(E.yeastPct(h * E.fT(T)) / CRAIG.cy[off + i]); });
  }
  const m = median(r);
  assert.ok(m > 0.8 && m < 1.2, `mediana ${m.toFixed(2)}`);
  const inside = r.filter(x => x >= 0.7 && x <= 1.45).length / r.length;
  assert.ok(inside >= 0.8, `solo il ${(inside * 100).toFixed(0)}% delle celle è entro 0,7–1,45`);
});

// Riferimenti di ricette, mulini, video e disciplinare (docs/riferimenti-lievito.json).
// Le fonti tra loro differiscono anche del doppio: chiedo che la mediana sia centrata e che i riferimenti affidabili
// (peso 1) restino entro 1,6 volte, tutti gli altri entro 3,5 volte.
test(`riferimenti: mediana centrata, affidabili entro 1,6 volte, tutti entro 3,5 volte`, () => {
  const ratios = REFS.map(r => ({ r, x: predict(r.fasi) / r.lievito }));
  const m = median(ratios.map(o => o.x));
  assert.ok(m > 0.8 && m < 1.25, `mediana ${m.toFixed(2)}`);
  for (const { r, x } of ratios) {
    const lim = r.peso >= 1 ? 1.6 : 3.5;
    assert.ok(x <= lim && x >= 1 / lim, `${r.nome}: modello ${(x * r.lievito).toFixed(3)}% contro ${r.lievito}% (${x.toFixed(2)} volte)`);
  }
});

// Teglia: le ricette verificate usano da 0,6 a 5,7 volte la curva della tonda. Il fattore (yeastK) è volutamente
// prudente: chiedo che il modello stia sotto la mediana delle ricette ma non sotto la metà, e ogni ricetta entro 3,5 volte.
test(`riferimenti teglia: dose prudente, mediana tra 0,5 e 1 volta le ricette, tutte entro 3,5 volte`, () => {
  assert.ok(TEGLIA_REFS.length >= 5);
  const ratios = TEGLIA_REFS.map(r => ({ r, x: predict(r.fasi, true) / r.lievito }));
  const m = median(ratios.map(o => o.x));
  assert.ok(m >= 0.5 && m <= 1, `mediana ${m.toFixed(2)}`);
  for (const { r, x } of ratios) assert.ok(x <= 3.5 && x >= 1 / 3.5, `${r.nome}: ${x.toFixed(2)} volte`);
});

test(`teglia: appretto di almeno 3,5 ore dopo il frigo, perché la massa esce fredda`, () => {
  for (const room of [16, 20, 26, 30]) {
    const { pl } = plan(`teglia`, room, `h24`);
    assert.ok(pl.A >= 3.5 && pl.A <= 6, `${room} °C: ${pl.A} h`);
  }
});

const STYLES = [`contemporanea`, `teglia`];
const ROOMS = [16, 20, 26];

test(`piani principali: in giornata e 24 ore, a 16, 20 e 26 °C, contemporanea e teglia`, () => {
  const want = { // intervalli attesi di lievito fresco, in %
    giornata: { 16: [0.6, 1.0], 20: [0.28, 0.45], 26: [0.09, 0.18] },
    h24: { 16: [0.25, 0.42], 20: [0.2, 0.32], 26: [0.11, 0.2] },
  };
  const wantTeglia = { // teglia: circa il doppio (riferimenti teglia in docs/riferimenti-lievito.json)
    giornata: { 16: [1.3, 2.0], 20: [0.55, 0.9], 26: [0.18, 0.35] },
    h24: { 16: [0.5, 0.8], 20: [0.4, 0.6], 26: [0.18, 0.32] },
  };
  for (const style of STYLES) for (const room of ROOMS) for (const pk of [`giornata`, `h24`]) {
    const { pl } = plan(style, room, pk);
    assert.ok(pl.ok, `${style} ${room} °C ${pk} deve essere possibile`);
    const [lo, hi] = (style === `teglia` ? wantTeglia : want)[pk][room];
    assert.ok(pl.yp >= lo && pl.yp <= hi, `${style} ${room} °C ${pk}: ${pl.yp.toFixed(3)}% fuori da ${lo}–${hi}%`);
    assert.equal(Math.round((pl.stesStart - pl.mixStart) / H), pk === `giornata` ? 8 : 24);
    assert.ok(pl.A >= 2 && pl.A <= 6, `appretto tra 2 e 6 ore (${pl.A})`);
  }
});

test(`più ore e più caldo vogliono meno lievito`, () => {
  for (const style of STYLES) {
    for (const room of ROOMS) {
      const y = [`h24`, `h48`, `h72`].map(pk => plan(style, room, pk).pl.yp);
      assert.ok(y[0] > y[1] && y[1] >= y[2], `${style} ${room} °C: 24 > 48 ≥ 72 ore`);
    }
    for (const pk of [`giornata`, `h24`, `h48`, `h72`]) {
      const y = ROOMS.map(room => plan(style, room, pk).pl.yp);
      assert.ok(y[0] > y[1] && y[1] > y[2], `${style} ${pk}: 16 > 20 > 26 °C`);
    }
  }
});

test(`un frigo più caldo vuole meno lievito`, () => {
  const cold = plan(`contemporanea`, 20, `h48`, { fridge: 3 }).pl.yp;
  const warm = plan(`contemporanea`, 20, `h48`, { fridge: 7 }).pl.yp;
  assert.ok(warm < cold);
});

test(`ingredienti: per 24 ore a 20 °C, 4 panetti da 270 g, circa 1,6 g di lievito fresco`, () => {
  const { P, pl, cfg } = plan(`contemporanea`, 20, `h24`);
  const I = E.ingredients(P, pl, cfg);
  assert.ok(I.yeast > 1.3 && I.yeast < 1.9, `lievito ${I.yeast.toFixed(2)} g`);
  // dosi arrotondate (farina e acqua a 5 g): il totale resta entro pochi grammi da quello voluto
  assert.ok(Math.abs(I.flour + I.water + I.salt + I.oil + I.yeast - 4 * 270 * 1.02) < 8);
  assert.ok(I.flour % 5 === 0 && I.water % 5 === 0 && Number.isInteger(I.salt), `${I.flour} ${I.water} ${I.salt}`);
});

test(`acqua: in giornata a 20 °C non serve acqua calda (DDT 23, attrito 2 a mano e 8 con l'impastatrice)`, () => {
  const { P, pl, cfg } = plan(`contemporanea`, 20, `giornata`, { now: DINNER.getTime() - 10 * H });
  assert.ok(pl.ok);
  assert.equal(E.ingredients(P, pl, cfg).waterT, 27);
  assert.equal(E.ingredients(P, pl, { ...cfg, mixer: true }).waterT, 21);
  const f = plan(`contemporanea`, 20, `h24`);
  assert.equal(E.ingredients(f.P, f.pl, f.cfg).waterT, 24);
});

test(`farine: una 00 debole porta l'idratazione al 60%, una farina per pizza al 70%`, () => {
  assert.equal(plan(`classica`, 20, `h24`, { flour: `debole` }).P.hyd, 60);
  assert.equal(plan(`canotto`, 20, `h24`, { flour: `media` }).P.hyd, 70);
  assert.equal(plan(`contemporanea`, 20, `h24`, { flour: `media` }).P.hyd, 68);
});

test(`spostamento notturno: niente impasto di notte e frigo entro i limiti`, () => {
  const dinner = new Date(2026, 10, 21, 23, 30); // l'inizio cadrebbe alle 23 circa del giorno prima
  for (const style of STYLES) {
    const { pl } = plan(style, 20, `h24`, { dinner });
    assert.ok(pl.ok);
    assert.ok(pl.shiftNote, `${style}: deve spostare l'inizio`);
    const pre = pl.phases.slice(0, pl.phases.findIndex(p => p[0] === `frigo`));
    let t = pl.mixStart;
    for (const [k, d] of pre) { assert.ok(!E.nightAt(t), `${style}: ${k} non deve cadere di notte`); t += d * H; }
    const nominal = 24 - (style === `teglia` ? 2.5 : 2.75) - pl.A - (style === `teglia` ? 0.25 : 0);
    assert.ok(pl.fridgeH >= Math.max(8, nominal * 0.65) - 1e-9 && pl.fridgeH <= nominal * 1.35 + 1e-9, `${style}: frigo ${pl.fridgeH} h`);
  }
});
