// Test dei panini per burger (bun) e del tangzhong. Si eseguono con:  node --test test/bun.test.js
// Come test/pane.test.js, eseguo motore e interfaccia di index.html con un DOM minimo.
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
const BUNS = [`bun`, `smash`, `brioche`, `bun_olio`];
// panini pronti a 5 giorni da adesso alle 13: lontano dalla notte e sempre raggiungibile
function bun(a, style, extra = ``) {
  a.run(`state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan'; state.n=4;
    ui.reviewed=false; state.link=null; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(Date.now()+5*24*H); state.dinner.setHours(13,0,0,0); ${extra} R=compute();`);
  return a.run(`R`);
}

test(`bun: dalla pizza ai panini cambiano farina, forno, metodo e quantità, e si torna indietro`, () => {
  const a = app();
  a.run(`state.oven='portatile'; state.method='biga'; state.prepMode='existing'; state.n=4;`);
  a.run(`requestChange({k:'style',v:'bun'});`);
  assert.equal(a.run(`catOf(state.style)`), `bun`);
  assert.equal(a.run(`state.flour`), `forte`);
  assert.equal(a.run(`state.oven`), `casa_teglia`);
  assert.equal(a.run(`state.method`), `diretto`);
  assert.equal(a.run(`state.prepMode`), `plan`);
  assert.equal(a.run(`state.n`), 6);
  // dal bun al pane e alla pizza
  a.run(`requestChange({k:'style',v:'pagnotta'});`);
  assert.equal(a.run(`state.n`), 1);
  a.run(`requestChange({k:'style',v:'classica'});`);
  assert.equal(a.run(`state.n`), 4);
  assert.ok(a.run(`FLOURS[state.flour].cats.includes('pizza')`));
});

test(`bun: ogni tipo, in giornata e con una notte in frigo, a 16, 20 e 26 °C, con e senza tangzhong`, () => {
  const a = app();
  for (const style of BUNS) for (const room of [16, 20, 26]) for (const pk of [`giornata`, `h24`]) for (const tz of [true, false]) {
    const r = bun(a, style, `state.room=${room}; state.plan='${pk}'; state.over.tz=${tz};`);
    const tag = `${style} ${pk} ${room} °C tz=${tz}`;
    assert.ok(!r.none, tag);
    assert.equal(r.pk, pk, tag);
    const { pl, I, steps, P } = r;
    assert.ok(pl.bread && pl.bun, tag);
    assert.equal(P.tz, tz, tag);
    // bilancio: farina, latte, uova, patate, grassi, zucchero, sale e lievito fanno il totale
    assert.ok(Math.abs(I.flour + I.water + I.egg + I.potato + I.salt + I.oil + I.sugar + I.yeast - I.total) < 1e-8, tag);
    assert.ok(I.ypct >= 0.02 && I.ypct <= 4 + 1e-9, `${tag}: ${I.ypct}`);
    assert.ok(I.waterT >= 4 && I.waterT <= 35, `${tag}: ${I.waterT}`);
    // orari: dall'ora dei panini pronti all'indietro
    assert.equal(pl.mixStart + pl.total * H, pl.stesStart, tag);
    assert.equal(pl.cottStart + pl.bk.total * MIN, pl.coolStart, tag);
    assert.equal(pl.coolStart + .5 * H, pl.tFirst, tag);
    const last = steps[steps.length - 1];
    assert.equal(last.key, `raffreddamento`, tag);
    assert.equal(last.end, pl.tFirst, tag);
    for (let i = 1; i < steps.length; i++) assert.ok(steps[i].start >= steps[i - 1].start, tag);
    for (const k of [`impasto`, `puntata`, `formatura`, `appretto`, `preriscaldo`, `incisione`, `cottura`]) assert.ok(steps.some(s => s.key === k), `${tag}: ${k}`);
    assert.equal(steps.some(s => s.key === `frigo`), pk === `h24`, tag);
    assert.ok(!steps.some(s => /^pieghe/.test(s.key)), `${tag}: niente pieghe nei bun`);
    // tangzhong: un'ora prima dell'impasto, e il piano inizia da lì
    const tzs = steps.find(s => s.key === `tangzhong`);
    assert.equal(!!tzs, tz, tag);
    assert.equal(!!I.tz, tz, tag);
    if (tz) {
      assert.equal(tzs.start, pl.mixStart - H, tag);
      assert.equal(pl.begin, tzs.start, tag);
      assert.ok(Math.abs(I.tz.liquid - 5 * I.tz.flour) < 1e-9, tag);
      assert.ok(I.tz.liquid <= I.water + 1e-9, tag);
      assert.ok(I.tz.flour <= I.flour * .08 + 1e-9, tag);
    } else assert.equal(pl.begin, pl.mixStart, tag);
    if (pk === `giornata`) assert.ok(pl.total >= 3 - 1e-9 && pl.total <= 4 + 1e-9, `${tag}: ${pl.total}`);
    else assert.ok(pl.fridgeH >= 8, tag);
    // niente vapore, cottura breve sulla teglia
    assert.equal(pl.bk.steamMin, null, tag);
    assert.ok(pl.bk.per >= 10 && pl.bk.per <= 26, tag);
  }
});

test(`bun: la ricetta di Malati di Pizza (provata in cucina) esce dal motore`, () => {
  const a = app();
  // 500 g di farina forte: 6 panini da 168 g circa, 3 ore a 20-21 °C, tangzhong 50 g + 250 g di latte
  const r = bun(a, `bun`, `state.room=20.5; state.plan='giornata'; state.prepMode='day'; state.prepClock='07:45'; state.n=6; state.over.ball=168;`);
  const { I, pl, P } = r;
  assert.ok(pl.total <= 3.6, `durata ${pl.total}`);
  assert.ok(Math.abs(I.flour - 500) < 15, `farina ${I.flour}`);
  // latte 60%, uova 14% (1 uovo + 1 tuorlo), zucchero 10%, sale 2%, burro 10%, lievito fresco 4%
  assert.equal(P.hyd, 60); assert.equal(P.egg, 14); assert.equal(P.sugar, 10); assert.equal(P.salt, 2); assert.equal(P.oil, 10);
  assert.ok(Math.abs(I.ypct - 4) < 0.05, `lievito ${I.ypct}`);
  // tangzhong: 8% della farina con 5 volte il suo peso di latte (Malati di Pizza: 10%, 1:5)
  assert.ok(Math.abs(I.tz.flour / I.flour - .08) < 1e-9);
  // forno statico a 190 °C, senza vapore
  assert.equal(pl.bk.T1, 190);
});

test(`bun: dose di lievito, temperatura del latte, tangzhong e frigo vanno nel verso giusto`, () => {
  const a = app();
  const g = bun(a, `bun`, `state.room=20; state.plan='giornata';`).I;
  const n = bun(a, `bun`, `state.room=20; state.plan='h24';`).I;
  // la prova dell'utente (1,2%: frigo 21-8, poi 9 h fuori a 22 °C) è lievitata troppo; il piano 24 ore dell'app
  // sta meno tempo fuori dal frigo, e lì una dose vicina a quella resta ragionevole
  assert.ok(n.ypct >= 0.9 && n.ypct <= 1.5, `notte in frigo: ${n.ypct}`);
  assert.ok(n.ypct < g.ypct / 2, `notte ${n.ypct} giornata ${g.ypct}`);
  // casa calda: meno lievito e latte più fresco
  const c = bun(a, `bun`, `state.room=26; state.plan='h24';`).I;
  assert.ok(c.ypct < n.ypct && c.waterT < n.waterT);
  // il tangzhong a temperatura di casa chiede latte un po' più tiepido per lo stesso impasto finito
  const no = bun(a, `bun`, `state.room=22; state.plan='h24'; state.over.tz=false;`).I;
  const si = bun(a, `bun`, `state.room=22; state.plan='h24'; state.over.tz=true;`).I;
  assert.ok(si.waterT > no.waterT, `${si.waterT} ${no.waterT}`);
  // il tangzhong non cambia le dosi totali né il lievito
  assert.ok(Math.abs(si.flour - no.flour) < 1e-9 && Math.abs(si.water - no.water) < 1e-9 && Math.abs(si.ypct - no.ypct) < 1e-9);
  // il brioche bun, più ricco, ne usa più del bun all'olio
  const br = bun(a, `brioche`, `state.room=20; state.plan='h24';`).I.ypct, ol = bun(a, `bun_olio`, `state.room=20; state.plan='h24';`).I.ypct;
  assert.ok(br > ol);
  // il lievito resta sotto il 4% anche in 3 ore
  const fast = bun(a, `brioche`, `state.room=18; state.plan='giornata'; state.prepMode='day'; state.prepClock='07:45';`);
  assert.ok(fast.I.ypct <= 4 + 1e-9);
  assert.ok(fast.W.some(w => /Tanto lievito/.test(w.t)));
});

test(`bun: smash con patate, più piccolo e basso; infornate per teglia`, () => {
  const a = app();
  const s = bun(a, `smash`, `state.room=20; state.n=14;`);
  assert.ok(s.I.potato > 0);
  assert.ok(s.W.some(w => /patate già lessate/.test(w.t)));
  assert.equal(s.I.piece, 80);
  assert.match(s.steps.find(x => x.key === `formatura`).body, /schiacciale con il palmo fino a circa 8 cm/);
  assert.match(s.steps.find(x => x.key === `raffreddamento`).body, /smash burger/);
  // 14 panini, 12 per teglia: due infornate
  assert.equal(s.pl.bk.batches, 2);
  assert.equal(s.pl.bk.total, 2 * s.pl.bk.per + 3);
  // il classico da 110 g cuoce più a lungo dello smash da 80 g
  const c = bun(a, `bun`, `state.room=20;`);
  assert.ok(c.pl.bk.per > s.pl.bk.per);
  // con una farina debole i bun ricchi danno un avviso; il brioche chiede almeno il mix
  assert.ok(bun(a, `bun`, `state.flour='debole';`).W.some(w => w.w && /Manitoba o il mix/.test(w.t)));
  assert.ok(bun(a, `brioche`, `state.flour='media';`).W.some(w => w.w && /brioche bun serve una farina forte/.test(w.t)));
  // il bun all'olio non ha uova né burro
  const o = bun(a, `bun_olio`, `state.room=20;`);
  assert.equal(o.I.egg, 0);
  assert.match(o.steps.find(x => x.key === `impasto`).body, /olio/);
  assert.doesNotMatch(o.steps.find(x => x.key === `impasto`).body, /burro/);
});

test(`bun: senza tempo il motivo parla dei panini e conta l'ora del tangzhong`, () => {
  const a = app();
  const r = bun(a, `bun`, `state.dinner=new Date(Date.now()+3.5*H); state.prepMode='now';`);
  assert.ok(r.none);
  assert.match(r.reason, /panini possono essere pronti/);
  assert.match(r.reason, /tangzhong/);
  // senza tangzhong 3,5 ore bastano per un percorso in giornata da almeno 3 ore? No: servono anche cottura e raffreddamento
  const s = bun(a, `bun`, `state.dinner=new Date(Date.now()+4.5*H); state.prepMode='now'; state.over.tz=false;`);
  assert.ok(!s.none, s.reason);
  assert.ok(s.pl.begin >= Date.now() - MIN);
});

test(`tangzhong: si sceglie con la conferma, si salva con la ricetta e resta dopo "Torna ai valori dello stile"`, () => {
  const a = app();
  bun(a, `bun`, `state.room=20;`);
  assert.equal(a.run(`R.P.tz`), true);
  // si toglie: c'è la finestra con la spiegazione
  a.run(`requestChange({k:'over',o:'tz',v:false});`);
  assert.match(a.element(`#modal`).innerHTML, /togliere il tangzhong/);
  a.run(`applyChange({k:'over',o:'tz',v:false}); R=compute();`);
  assert.equal(a.run(`R.P.tz`), false);
  assert.ok(!a.run(`R.steps`).some(s => s.key === `tangzhong`));
  // il reset delle percentuali tiene la scelta
  a.run(`state.over.hyd=55; applyChange({k:'reset'}); R=compute();`);
  assert.equal(a.run(`state.over.tz`), false);
  assert.equal(a.run(`state.over.hyd`), undefined);
  // differenze tra versioni
  const s = a.run(`snap()`);
  const diff = a.run(`diffCfg(${JSON.stringify(s)},{...${JSON.stringify(s)},over:{tz:true,egg:20}})`);
  assert.ok(diff.some(d => /Tangzhong: no → sì/.test(d)), diff.join(`|`));
  assert.ok(diff.some(d => /Uova: 14% → 20%/.test(d)), diff.join(`|`));
  // il pan bauletto può avere il tangzhong, il pane semplice e la pizza no
  const pb = bun(a, `cassetta`, `state.room=20; state.over.tz=true;`);
  assert.ok(pb.I.tz && pb.steps.some(s => s.key === `tangzhong`));
  assert.match(pb.steps.find(s => s.key === `impasto`).body, /già nel tangzhong/);
  assert.equal(bun(a, `cassetta`, `state.room=20;`).P.tz, false);
  assert.equal(bun(a, `pagnotta`, `state.over.tz=true;`).P.tz, false);
  a.run(`state.style='classica'; state.over={tz:true}; R=compute();`);
  assert.equal(a.run(`R.P.tz`), false);
});

test(`bun: pagine, piano, calendario e cucina si disegnano senza errori`, () => {
  const a = app();
  for (const style of BUNS) {
    bun(a, style, `state.room=20;`);
    for (let p = 0; p <= 5; p++) a.run(`ui.page=${p}; renderAll();`);
    const out = a.element(`#out`).innerHTML;
    assert.match(out, /Panini pronti/);
    assert.match(out, /Segreti e accorgimenti/);
    assert.match(out, /Tosta sempre il lato tagliato/);
    assert.match(out, /Latte/);
    assert.doesNotMatch(out, /Prima pizza|Pane pronto/);
    if (a.run(`R.P.tz`)) assert.match(out, /di cui nel tangzhong/);
    const ics = a.run(`buildIcs()`);
    assert.match(ics, /SUMMARY:Bun: /);
    a.run(`openCook(); renderCook();`);
    assert.match(a.element(`#cook`).innerHTML, /Tabella di marcia/);
    a.run(`closeCook();`);
  }
  // pagina 0: tre categorie, solo i bun e la tabella delle differenze
  a.run(`ui.page=0; renderAll();`);
  const p0 = a.element(`#page`).innerHTML;
  assert.match(p0, /data-val="bun"/);
  assert.match(p0, /Le differenze tra i bun/);
  assert.doesNotMatch(p0, /data-val="pagnotta"/);
  // pagina Lievitazione: scelta del tangzhong con la spiegazione dei vantaggi
  a.run(`ui.page=4; renderAll();`);
  const p4 = a.element(`#page`).innerHTML;
  assert.match(p4, /data-set="tz"/);
  assert.match(p4, /gelatin|amido/);
  assert.match(p4, /Resta morbido per qualche giorno in più/);
  // pagina Cucina: niente pentola né fornetti
  a.run(`ui.page=2; renderAll();`);
  const p2 = a.element(`#page`).innerHTML;
  assert.doesNotMatch(p2, /data-val="pentola"|data-val="fornetto"/);
  // pagina Ingredienti: niente semola, la Manitoba è consigliata
  a.run(`ui.page=3; renderAll();`);
  const p3 = a.element(`#page`).innerHTML;
  assert.doesNotMatch(p3, /data-val="semola"/);
  assert.match(p3, /consigliata/);
});
