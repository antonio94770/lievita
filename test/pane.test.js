// Test del pane. Si eseguono con:  node --test test/pane.test.js
// Come test/prefermenti.test.js, eseguo motore e interfaccia di index.html con un DOM minimo.
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

function app() {
  const elements = new Map();
  const element = key => {
    if (!elements.has(key)) elements.set(key, {
      innerHTML: ``, hidden: false, value: ``, dataset: {}, className: ``, textContent: ``,
      addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      setAttribute() {}, focus() {}, scrollIntoView() {}, classList: { add() {}, remove() {}, toggle() {} }
    });
    return elements.get(key);
  };
  const data = new Map();
  const ctx = vm.createContext({
    document: { querySelector: element, addEventListener() {}, body: element(`body`), activeElement: { matches: () => false },
      createElement: () => ({ textContent: ``, set innerHTML(h) { this.textContent = h.replace(/<[^>]+>/g, ``); } }) },
    window: { addEventListener() {}, scrollTo() {} },
    navigator: {}, location: { pathname: `/`, search: ``, hash: `` }, history: { replaceState() {} },
    localStorage: { setItem: (k, v) => data.set(k, v), getItem: k => data.get(k), removeItem: k => data.delete(k) },
    setInterval() {}, clearInterval() {}, setTimeout() {}, console
  });
  vm.runInContext(scripts[0] + scripts[1].split(`/* ---------- avvio ---------- */`)[0], ctx);
  const run = code => vm.runInContext(code, ctx);
  return { run, element };
}
const BREADS = [`pagnotta`, `filoni`, `ciabatta`, `semola`, `integrale`, `cassetta`];
// cena fissa a 5 giorni da adesso alle 13: lontana dalla notte e sempre raggiungibile
function bread(a, style, extra = ``) {
  a.run(`state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan'; state.n=1;
    ui.reviewed=false; state.link=null; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(Date.now()+5*24*H); state.dinner.setHours(13,0,0,0); ${extra} R=compute();`);
  return a.run(`R`);
}

test(`pane: passando dalla pizza al pane cambiano farina consigliata, forno, metodo e quantità`, () => {
  const a = app();
  a.run(`state.oven='portatile'; state.method='biga'; state.prepMode='existing'; state.n=6;`);
  a.run(`requestChange({k:'style',v:'semola'});`);
  assert.equal(a.run(`state.flour`), `semola`);
  assert.equal(a.run(`state.oven`), `casa_teglia`);
  assert.equal(a.run(`state.method`), `diretto`);
  assert.equal(a.run(`state.prepMode`), `plan`);
  assert.equal(a.run(`state.n`), 1);
  // e al ritorno la pizza riprende farine e forni da pizza
  a.run(`state.oven='pentola'; requestChange({k:'style',v:'classica'});`);
  assert.ok(a.run(`FLOURS[state.flour].cats.includes('pizza')`));
  assert.equal(a.run(`state.oven`), `casa_acciaio`);
  assert.equal(a.run(`state.n`), 4);
});

test(`pane: ogni tipo, in giornata e con una notte in frigo, a 16, 20 e 26 °C`, () => {
  const a = app();
  for (const style of BREADS) for (const room of [16, 20, 26]) for (const pk of [`giornata`, `h24`]) {
    const r = bread(a, style, `state.room=${room}; state.plan='${pk}';`);
    const tag = `${style} ${pk} ${room} °C`;
    assert.ok(!r.none, tag);
    assert.equal(r.pk, pk, tag);
    const { pl, I, steps } = r;
    assert.ok(pl.bread, tag);
    // nessun olio aggiunto in automatico come per la pizza nel forno di casa
    assert.equal(r.P.oil, a.run(`STYLES['${style}'].oil`), tag);
    // bilancio degli ingredienti
    assert.ok(Math.abs(I.flour + I.water + I.salt + I.oil + I.sugar + I.yeast - I.total) < 1e-8, tag);
    assert.ok(I.ypct >= 0.02 && I.ypct <= 3, `${tag}: ${I.ypct}`);
    assert.ok(I.waterT >= 4 && I.waterT <= 30, tag);
    // orari: tutto in ordine, raffreddamento che termina all'ora scelta
    assert.equal(pl.mixStart + pl.total * H, pl.stesStart, tag);
    assert.equal(pl.cottStart + pl.bk.total * MIN, pl.coolStart, tag);
    assert.equal(pl.coolStart + pl.bk.cool * H, pl.tFirst, tag);
    const last = steps[steps.length - 1];
    assert.equal(last.key, `raffreddamento`, tag);
    assert.equal(last.end, pl.tFirst, tag);
    for (let i = 1; i < steps.length; i++) assert.ok(steps[i].start >= steps[i - 1].start, tag);
    for (const k of [`impasto`, `puntata`, `formatura`, `appretto`, `preriscaldo`, `incisione`, `cottura`]) assert.ok(steps.some(s => s.key === k), `${tag}: ${k}`);
    assert.equal(steps.some(s => s.key === `frigo`), pk === `h24`, tag);
    assert.equal(steps.some(s => s.key === `stesura`), false, tag);
    assert.ok(pl.phases.every(p => p[1] > 0), tag);
    if (pk === `giornata`) assert.ok(pl.total >= 3 - 1e-9 && pl.total <= 8 + 1e-9, tag);
    else assert.ok(pl.fridgeH >= 8, tag);
    // il forno si accende prima di infornare e dopo l'inizio dell'impasto
    const pre = steps.find(s => s.key === `preriscaldo`);
    assert.equal(pre.end, pl.stesStart, tag);
    assert.ok(pre.start > pl.mixStart, tag);
  }
});

test(`pane: dose di lievito vicina ai valori tipici delle ricette italiane`, () => {
  const a = app();
  const y = (extra) => bread(a, `pagnotta`, extra).I.ypct;
  // una notte in frigo a 20 °C: ricette domestiche e di panificatori intorno a 0,3–0,6%
  const notte = y(`state.room=20; state.plan='h24';`);
  assert.ok(notte >= 0.3 && notte <= 0.7, `notte: ${notte}`);
  // 8 ore in giornata a 20 °C: circa 0,5–1%
  const giorno = y(`state.room=20; state.plan='giornata';`);
  assert.ok(giorno >= 0.5 && giorno <= 1.1, `giornata: ${giorno}`);
  // circa 3 ore e mezza a 20 °C: il "pane veloce", con l'1,5–3% delle ricette brevi
  const veloce = y(`state.room=20; state.plan='giornata'; state.prepMode='day'; state.prepClock='06:30';`);
  const r = a.run(`R`);
  assert.ok(r.pl.total <= 4, `durata ${r.pl.total}`);
  assert.ok(veloce >= 1.5 && veloce <= 3, `veloce: ${veloce}`);
  assert.ok(r.W.some(w => /tanto lievito/.test(w.t)) === (r.pl.yp >= 2.9));
  // a parità di ore, con la casa calda ne serve meno
  const caldo = y(`state.room=26; state.plan='giornata';`);
  assert.ok(caldo < giorno, `caldo ${caldo}`);
  // più lievito con meno tempo, meno lievito con il frigo
  assert.ok(veloce > giorno && giorno > notte);
});

test(`pane: le farine con crusca fermentano più in fretta e chiedono meno lievito`, () => {
  const a = app();
  const base = bread(a, `pagnotta`, `state.room=20; state.plan='h24';`).I.ypct;
  const t1 = bread(a, `pagnotta`, `state.flour='tipo1'; state.room=20; state.plan='h24';`).I.ypct;
  const integ = bread(a, `pagnotta`, `state.flour='integrale'; state.room=20; state.plan='h24';`).I.ypct;
  assert.ok(integ < t1 && t1 < base, `${base} ${t1} ${integ}`);
});

test(`pane: zucchero e grassi del pan bauletto e dose più alta per l'impasto arricchito`, () => {
  const a = app();
  const c = bread(a, `cassetta`, `state.room=20; state.plan='h24';`);
  assert.ok(c.I.sugar > 0 && c.I.oil > 0);
  assert.equal(c.pl.bk.steamMin, null);
  assert.equal(c.pl.bk.T1, 180);
  const p = bread(a, `pagnotta`, `state.flour='media'; state.room=20; state.plan='h24';`);
  assert.ok(c.I.ypct > p.I.ypct);
});

test(`pane: pentola di ghisa, un pane per volta; filoncini e stampi tornano sulla teglia`, () => {
  const a = app();
  const pot = bread(a, `pagnotta`, `state.oven='pentola'; state.n=2; state.room=20; state.plan='h24';`);
  assert.equal(pot.pl.bk.oven, `pentola`);
  assert.equal(pot.pl.bk.batches, 2);
  assert.equal(pot.pl.bk.total, 2 * pot.pl.bk.per + 10);
  assert.ok(pot.pl.bk.steamMin >= 15);
  assert.ok(pot.W.some(w => /un pane per volta/.test(w.t)));
  const fil = bread(a, `filoni`, `state.oven='pentola'; state.n=4; state.room=20;`);
  assert.equal(fil.pl.bk.oven, `casa_teglia`);
  assert.equal(fil.pl.bk.batches, 1);
  assert.ok(fil.W.some(w => w.w && /pentola tonda/.test(w.t)));
  const st = bread(a, `integrale`, `state.oven='pentola'; state.room=20;`);
  assert.ok(st.W.some(w => /stampo non va nella pentola/.test(w.t)));
  // un pane più grande cuoce e raffredda più a lungo
  const small = bread(a, `pagnotta`, `state.over.ball=400; state.room=20;`).pl.bk;
  const big = bread(a, `pagnotta`, `state.over.ball=1200; state.room=20;`).pl.bk;
  assert.ok(big.per > small.per && big.cool > small.cool);
});

test(`pane: con il pane pronto alle 8 la sera prima non si impasta di notte`, () => {
  const a = app();
  const r = bread(a, `pagnotta`, `state.room=20; state.plan='h24'; state.dinner=new Date(Date.now()+5*24*H); state.dinner.setHours(8,0,0,0);`);
  assert.ok(!r.none);
  const night = r.steps.filter(s => s.hands && s.key !== `preriscaldo` && a.run(`nightAt(${s.start})`));
  // impasto, pieghe e frigo restano fuori dalla notte (gli ultimi passaggi possono cadere all'alba)
  for (const k of [`impasto`, `pieghe1`, `frigo`]) assert.ok(!night.some(s => s.key === k), k);
});

test(`pane: senza tempo il motivo parla del pane, non della pizza`, () => {
  const a = app();
  const r = bread(a, `pagnotta`, `state.dinner=new Date(Date.now()+3*H); state.prepMode='now';`);
  assert.ok(r.none);
  assert.match(r.reason, /pane può essere pronto/);
  assert.match(a.run(`timeBlock('now')`), /raffreddamento/);
});

test(`pane: le pagine, il piano, il calendario e la cucina si disegnano senza errori`, () => {
  const a = app();
  for (const style of BREADS) {
    bread(a, style, `state.room=20;`);
    for (let p = 0; p <= 5; p++) a.run(`ui.page=${p}; renderAll();`);
    const out = a.element(`#out`).innerHTML;
    assert.match(out, /Pane pronto/);
    assert.match(out, /Segreti e accorgimenti/);
    assert.doesNotMatch(out, /Prima pizza/);
    const ics = a.run(`buildIcs()`);
    assert.match(ics, /SUMMARY:Pane: /);
    a.run(`openCook(); renderCook();`);
    assert.match(a.element(`#cook`).innerHTML, /Tabella di marcia/);
    a.run(`closeCook();`);
  }
  // pagina 0: categoria pane con solo i pani e la tabella delle differenze
  a.run(`ui.page=0; renderAll();`);
  const p0 = a.element(`#page`).innerHTML;
  assert.match(p0, /Le differenze tra i pani/);
  assert.doesNotMatch(p0, /data-val="canotto"/);
  // pagina Ingredienti: niente "farina per pizza", c'è la semola
  a.run(`ui.page=3; renderAll();`);
  const p3 = a.element(`#page`).innerHTML;
  assert.match(p3, /Semola rimacinata/);
  assert.match(p3, /Farina 0 per pane/);
  // pagina Cucina: niente forni solo per pizza, c'è la pentola
  a.run(`ui.page=2; renderAll();`);
  const p2 = a.element(`#page`).innerHTML;
  assert.match(p2, /pentola di ghisa/);
  assert.doesNotMatch(p2, /data-val="fornetto"/);
});

test(`pane: la ricetta salvata conserva stile e peso, e la pizza resta com'era`, () => {
  const a = app();
  bread(a, `ciabatta`, `state.over.ball=500;`);
  const s = a.run(`snap()`);
  assert.equal(s.style, `ciabatta`);
  assert.equal(s.over.ball, 500);
  const diff = a.run(`diffCfg(${JSON.stringify(s)},{...${JSON.stringify(s)},over:{ball:600}})`);
  assert.ok(diff.some(d => /Peso panetto: 500 g → 600 g/.test(d)));
  // pizza: nessuno zucchero, olio aggiunto nel forno di casa come prima
  a.run(`requestChange({k:'style',v:'classica'}); state.oven='casa_pietra'; R=compute();`);
  const P = a.run(`R.P`);
  assert.equal(P.sugar, 0);
  assert.equal(P.oil, 2);
  assert.ok(!a.run(`R.pl.bread`));
});
