// Test delle correzioni dopo l'audit del 27 novembre 2026 (docs/ricerca/audit-ricette-engine-2026-11-27.md).
// Si eseguono con:  node --test test/correzioni.test.js
// Come test/bun.test.js eseguo motore e interfaccia con un DOM minimo; qui l'orologio si può spostare in avanti.
const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const fs = require(`node:fs`);
const path = require(`node:path`);
const vm = require(`node:vm`);

const html = fs.readFileSync(path.join(__dirname, `..`, `index.html`), `utf8`);
const all = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const ei = all.findIndex(m => /id="engine"/.test(m[1]));
const scripts = all.slice(ei).map(m => m[2]);
const H = 36e5, MIN = 6e4;

// data: il localStorage, condiviso tra due "aperture" dell'app; clock.v sposta l'orologio
function app(data = new Map(), clock = { v: 0 }) {
  const elements = new Map();
  const element = key => {
    if (!elements.has(key)) elements.set(key, {
      innerHTML: ``, hidden: false, value: ``, dataset: {}, className: ``, textContent: ``,
      addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      setAttribute() {}, focus() {}, scrollIntoView() {}, classList: { add() {}, remove() {}, toggle() {} }
    });
    return elements.get(key);
  };
  const RD = Date;
  class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + clock.v); } static now() { return RD.now() + clock.v; } }
  const ctx = vm.createContext({
    Date: FD,
    document: { querySelector: element, addEventListener() {}, body: element(`body`), activeElement: { matches: () => false },
      createElement: () => ({ textContent: ``, set innerHTML(h) { this.textContent = h.replace(/<[^>]+>/g, ``); } }) },
    window: { addEventListener() {}, scrollTo() {} },
    navigator: {}, location: { pathname: `/`, search: ``, hash: `` }, history: { replaceState() {} },
    localStorage: { setItem: (k, v) => data.set(k, v), getItem: k => data.get(k), removeItem: k => data.delete(k) },
    setInterval() {}, clearInterval() {}, setTimeout() {}, console
  });
  vm.runInContext(scripts[0] + scripts[1].split(`/* ---------- avvio ---------- */`)[0], ctx);
  return { run: code => vm.runInContext(code, ctx), element, data, clock };
}
function setup(a, style, extra = ``) {
  a.run(`state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan'; state.n=4;
    ui.reviewed=false; state.link=null; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(Date.now()+2*24*H); state.dinner.setHours(20,0,0,0); ${extra}; R=compute();`);
  return a.run(`R`);
}

test(`ripresa: a impasto avviato il piano non cambia percorso né dosi, anche riaprendo l'app`, () => {
  for (const style of [`classica`, `pagnotta`, `bun`]) {
    const a = app();
    // per i bun il percorso proposto è la giornata: qui serve la notte in frigo, scelta dall'utente
    const r0 = setup(a, style, style === `bun` ? `state.plan='h24'` : ``);
    assert.equal(r0.pk, `h24`, style);
    const yp = r0.pl.yp, sig = a.run(`cookSig(R.steps)`);
    // si avvia la modalità cucina e si fa il primo passaggio
    a.run(`openCook(); commitStep(); cook.i++; saveCook();`);
    // un'ora dopo l'ingresso in frigo
    const fr = r0.steps.find(s => s.key === `frigo`);
    a.clock.v = fr.start + H - Date.now();
    a.run(`R=compute();`);
    assert.equal(a.run(`R.pk`), `h24`, style);
    assert.equal(a.run(`R.pl.yp`), yp, style);
    assert.equal(a.run(`cookSig(R.steps)`), sig, style);
    // nuova apertura dell'app con lo stesso localStorage: impostazioni, ora della cena e avanzamento tornano
    const b = app(a.data, a.clock);
    b.run(`load(); if(mem.last) restoreForm(mem.last); resumeCook(); R=compute(); openCook();`);
    assert.equal(b.run(`state.style`), style);
    assert.equal(b.run(`R.pk`), `h24`, style);
    assert.equal(b.run(`R.pl.yp`), yp, style);
    assert.equal(b.run(`cook.i`), 1, style);
    assert.ok(b.run(`cook.done[0]`) > 0, style);
    // cambiando un'impostazione il piano si ricalcola da adesso
    b.run(`state.room=state.room+2; R=compute();`);
    assert.notEqual(b.run(`cookSig(R.steps)`), sig, style);
  }
});

test(`ripresa: aprire la modalità cucina solo per guardare non blocca il piano`, () => {
  const a = app();
  setup(a, `classica`);
  a.run(`openCook(); closeCook();`);
  assert.equal(a.run(`activeCook()`), null);
});

test(`le ultime scelte ricordano l'ora della cena solo se è nel futuro`, () => {
  const a = app();
  setup(a, `classica`);
  const d = a.run(`+state.dinner`);
  a.run(`rememberForm();`);
  const b = app(a.data);
  b.run(`load(); restoreForm(mem.last);`);
  assert.equal(b.run(`+state.dinner`), d);
  const c = app(a.data, { v: 3 * 24 * H });
  const def = c.run(`+state.dinner`);
  c.run(`load(); restoreForm(mem.last);`);
  assert.equal(c.run(`+state.dinner`), def);
});

test(`pizza: in modalità cucina la prima pizza è quella sfornata, all'ora della cena`, () => {
  const a = app();
  const r = setup(a, `classica`, `state.oven='casa_teglia'`);
  const c = r.steps.find(s => s.key === `cottura`);
  assert.equal(r.pl.tFirst - c.start, 12 * MIN);
  assert.equal(c.first, r.pl.tFirst);
  a.run(`openCook(); cook.i=R.steps.length-1;`);
  assert.equal(a.run(`tlDinner(cookT())`), r.pl.tFirst);
});

test(`orari nei testi: in modalità cucina seguono gli spostamenti`, () => {
  const a = app();
  const r = setup(a, `bun`, `state.plan='h24'`);
  const k = r.steps.findIndex(s => s.key === `frigo`);
  const body = r.steps[k].body, m = body.match(/<time data-at="(\d+)">(\d\d:\d\d)<\/time>/);
  assert.ok(m, `orario marcato nel testo del frigo`);
  assert.equal(+m[1], r.steps[k].end);
  a.run(`openCook();`);
  // un'ora di ritardo che arriva fino alla fine del frigo: il testo mostra l'ora nuova
  const P = { os: r.steps.map((_, i) => i >= k ? H : 0), oe: r.steps.map((_, i) => i >= k ? H : 0) };
  const live = a.run(`liveTimes(${JSON.stringify(body)}, ${JSON.stringify(P)})`);
  const hm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, `0`) + `:` + String(d.getMinutes()).padStart(2, `0`); };
  assert.match(live, new RegExp(`>(oggi |[^<]* )?${hm(r.steps[k].end + H)}</time>`));
  // il frigo che assorbe (inizio spostato, fine no) lascia ferma l'ora di fine
  const Q = { os: r.steps.map((_, i) => i === k ? H : 0), oe: r.steps.map(() => 0) };
  assert.match(a.run(`liveTimes(${JSON.stringify(body)}, ${JSON.stringify(Q)})`), new RegExp(`${hm(r.steps[k].end)}</time>`));
});

test(`biga già preparata con tutta la farina: nessuna dose negativa`, () => {
  let found = false;
  for (const hh of [4, 4.5, 5, 5.5, 6]) {
    const a = app();
    a.run(`state.style='teglia';state.flour='forte';state.oven='casa_teglia';state.over={};state.method='biga';state.prefKind='corta';state.prefAdd=true;state.prefPct=100;
      state.prepMode='existing';state.batch={flour:365.499,water:164.475,yeast:2.509,started:Date.now()-20*H,cold:0};state.prefTemp=20;state.prefHours=20;state.prefOut=1.75;
      state.plan='prefermento';state.dinner=new Date(Date.now()+${hh}*H);R=compute();`);
    const r = a.run(`R`);
    if (r.none) continue;
    found = true;
    const f = r.I.final;
    for (const k of [`flour`, `water`, `salt`, `oil`, `yeast`]) assert.ok(f[k] >= 0, `${hh} h: ${k} ${f[k]}`);
    assert.ok(Math.abs(r.I.flour - 365.499) < 1e-6, `farina totale ${r.I.flour}`);
    assert.ok(r.I.yeast > 2.509);
  }
  assert.ok(found, `almeno un orario valido`);
});

test(`avvisi: idratazione e olio scelti dall'utente non vengono descritti come abbassati o aggiunti`, () => {
  const a = app();
  const r = setup(a, `canotto`, `state.flour='debole'; state.over={hyd:65,oil:0}`);
  assert.equal(r.P.hyd, 65);
  assert.equal(r.P.oil, 0);
  const W = r.W.map(w => w.t).join(` | `);
  assert.doesNotMatch(W, /Idratazione abbassata/);
  assert.doesNotMatch(W, /Aggiunto un 2% di olio/);
  // senza personalizzazioni gli adattamenti restano
  const s = setup(a, `canotto`, `state.flour='debole'`);
  assert.match(s.W.map(w => w.t).join(` `), /Idratazione abbassata/);
});

test(`bun: per pochi grammi di uova si sbatte un uovo e se ne pesa una parte`, () => {
  const a = app();
  const r = setup(a, `bun`, `state.n=1; state.over={ball:50}`);
  const t = r.steps.map(s => s.body).join(` `);
  assert.doesNotMatch(t, /di uova sbattute \(circa 1 uovo\)/);
  assert.match(t, /sbatti 1 uovo e pesane solo questa parte/);
});

test(`smash: i panini per teglia stanno nella teglia con la distanza indicata`, () => {
  const a = app();
  const r = setup(a, `smash`, `state.n=13`);
  const cap = r.pl.bk.cap, f = r.steps.find(s => s.key === `formatura`).body;
  const gap = +f.match(/distanziate di almeno (\d+) cm/)[1];
  // 3 × 3 dischi da 8 cm con quella distanza in una teglia da circa 42 × 34 cm
  const cols = Math.floor((42 + gap) / (8 + gap)), rows = Math.floor((34 + gap) / (8 + gap));
  assert.ok(cap <= cols * rows, `${cap} > ${cols}×${rows}`);
  assert.equal(r.pl.bk.batches, Math.ceil(13 / cap));
});

test(`pane in pentola: ogni infornata ha i suoi orari, coperchio compreso`, () => {
  const a = app();
  const r = setup(a, `pagnotta`, `state.n=3; state.oven='pentola'; state.over={ball:900}`);
  const c = r.steps.find(s => s.key === `cottura`);
  assert.equal(r.pl.bk.batches, 3);
  assert.equal((c.body.match(/ª infornata/g) || []).length, 3);
  assert.equal((c.body.match(/via il coperchio/g) || []).length, 3);
  assert.match(c.body, /riporta il forno a 250 °C/);
  assert.match(c.body, /si incide appena prima/);
  assert.match(r.pl.bk.pre, /istruzioni della pentola/);
  assert.match(c.body, /regga almeno 250 °C/);
});

test(`forni: platea del forno a legna, teglia troppo grande per fornetto e forno a gas`, () => {
  const a = app();
  const leg = setup(a, `classica`, `state.oven='legna'`);
  assert.match(leg.pl.bk.pre, /platea deve arrivare a circa 430 °C/);
  assert.doesNotMatch(leg.pl.bk.pre, /430–480/);
  for (const o of [`fornetto`, `portatile`]) {
    const r = setup(a, `teglia`, `state.oven='${o}'; state.tw=30; state.th=40`);
    assert.match(r.pl.bk.warn, /non entra/, o);
    const s = setup(a, `teglia`, `state.oven='${o}'; state.tw=24; state.th=24`);
    assert.doesNotMatch(s.pl.bk.warn, /non entra/, o);
  }
});

test(`lievito secco con liquido freddo: si mescola alla farina`, () => {
  const a = app();
  const r = setup(a, `classica`, `state.yeast='secco'; state.room=26`);
  const imp = r.steps.find(s => s.key === `impasto`).body;
  if (r.I.waterT < 15) assert.match(imp, /mescola il lievito secco alla farina/);
  else assert.match(imp, /secco istantaneo/);
  const f = setup(a, `classica`, `state.yeast='fresco'`);
  assert.match(f.steps.find(s => s.key === `impasto`).body, /scioglici il lievito\./);
});

test(`appretto: la prova del dito resta sempre prima di stendere o infornare`, () => {
  for (const [style, oven] of [[`classica`, `casa_acciaio`], [`filoni`, `casa_pietra`], [`bun`, `casa_teglia`]]) {
    const a = app();
    setup(a, style, `state.oven='${oven}'`);
    const st = a.run(`R.steps.findIndex(s=>s.key==='stesura'||s.key==='incisione')`);
    a.run(`openCook();`);
    assert.equal(a.run(`cook.gates[${st}]&&cook.gates[${st}].before&&cook.gates[${st}].before.id`), `proof`, `${style} ${oven}`);
  }
  // pagnotta con il frigo breve: la prova si fa prima del frigo, non sull'impasto freddo
  const a = app();
  setup(a, `pagnotta`, `state.oven='pentola'`);
  const fb = a.run(`R.steps.findIndex(s=>s.key==='frigobreve')`), st = a.run(`R.steps.findIndex(s=>s.key==='incisione')`);
  assert.ok(fb > 0);
  a.run(`openCook();`);
  assert.equal(a.run(`cook.gates[${fb}].before.id`), `proof`);
  assert.ok(a.run(`cook.gates[${fb}].before.chill`));
  assert.ok(!a.run(`cook.gates[${st}]`), `nessuna seconda prova sul pane freddo`);
});

test(`prefermento: il frigo che fa da cuscinetto resta nei limiti del percorso`, () => {
  const a = app();
  const r = setup(a, `classica`, `state.method='biga'; state.prefKind='frigo'; state.room=24; state.prefTemp=24; state.flour='forte'; state.plan='prefermento'`);
  assert.ok(!r.none, r.reason);
  const k = r.steps.findIndex(s => s.key === `bigafrigo`);
  assert.ok(k >= 0, r.steps.map(s => s.key).join(` `));
  assert.equal(r.steps[k].fmin, 16 * H);
  const T = { steps: r.steps, os: r.steps.map(() => 0), oe: r.steps.map(() => 0) };
  a.run(`var T=${JSON.stringify(T)}; tlPush(T,${k},3*H);`);
  const d = a.run(`T.steps[${k}].end+T.oe[${k}]-(T.steps[${k}].start+T.os[${k}])`);
  assert.ok(d >= 16 * H - 1, `biga in frigo ${d / H} h`);
});
