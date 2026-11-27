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
    // a 16 °C anche il 4% di lievito non basta in 4 ore: la giornata si allunga e, per i panini delle 13, non c'è
    if (room === 16 && pk === `giornata` && r.pk !== pk) { assert.match(r.plans.giornata.reason, /cresce piano/, tag); continue; }
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
      // almeno un quarto del latte resta libero, per sciogliere il lievito
      assert.ok(I.water - I.tz.liquid >= I.water * .25 - 1e-9, tag);
    } else assert.equal(pl.begin, pl.mixStart, tag);
    if (pk === `giornata`) assert.ok(pl.total >= 3 - 1e-9 && pl.total <= (room < 20 ? 6 : 4) + 1e-9, `${tag}: ${pl.total}`);
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
  const fast = bun(a, `brioche`, `state.room=20.5; state.plan='giornata'; state.prepMode='day'; state.prepClock='07:45';`);
  assert.ok(fast.I.ypct <= 4 + 1e-9);
  assert.ok(fast.W.some(w => /Tanto lievito/.test(w.t)));
});

test(`bun: al fresco il tetto del 4% non promette gli stessi tempi; la notte chiede un frigo a 5 °C o meno`, () => {
  const a = app();
  const d = r => r.pl.phases.filter(p => p[0] === `puntata` || p[0] === `appretto`).reduce((s, p) => s + p[1], 0);
  const ref = bun(a, `bun`, `state.room=21; state.plan='giornata'; state.prepMode='day'; state.prepClock='07:45';`);
  assert.equal(ref.pk, `giornata`);
  // con cena di sera c'è tempo: a 16 °C la giornata dura di più, con lo stesso 4%
  const ev = `state.dinner=new Date(Date.now()+5*24*H); state.dinner.setHours(20,0,0,0); R=compute();`;
  const warm = bun(a, `bun`, `state.room=21; state.plan='giornata'; ${ev}`), cold = bun(a, `bun`, `state.room=16; state.plan='giornata'; ${ev}`);
  assert.equal(cold.pk, `giornata`);
  assert.ok(Math.abs(cold.I.ypct - 4) < 1e-9);
  assert.ok(d(cold) > d(warm) + 1, `${d(cold)} ${d(warm)}`);
  assert.ok(cold.pl.total <= 6 + 1e-9);
  // a 14 °C non ci sta in 6 ore: niente giornata, con il motivo
  const vc = bun(a, `bun`, `state.room=14; state.plan='giornata'; ${ev}`);
  assert.notEqual(vc.pk, `giornata`);
  assert.match(vc.plans.giornata.reason, /cresce piano/);
  // latte e uova crudi per una notte: niente frigo a 10 °C
  for (const st of BUNS) {
    const f = bun(a, st, `state.fridge=10; state.plan='h24';`);
    assert.equal(f.plans.h24.ok, false, st);
    assert.match(f.plans.h24.reason, /5 °C o meno/, st);
  }
  assert.ok(bun(a, `bun`, `state.fridge=5; state.plan='h24';`).plans.h24.ok);
});

test(`bun: smash con patate, più piccolo e basso; infornate per teglia`, () => {
  const a = app();
  const s = bun(a, `smash`, `state.room=20; state.n=14;`);
  assert.ok(s.I.potato > 0);
  assert.ok(s.W.some(w => /patate già lessate/.test(w.t)));
  assert.equal(s.I.piece, 80);
  assert.match(s.steps.find(x => x.key === `formatura`).body, /schiacciale con il palmo fino a circa 8 cm/);
  assert.match(s.steps.find(x => x.key === `raffreddamento`).body, /smash burger/);
  // 14 panini, 9 per teglia (3 × 3 dischi distanziati): due infornate
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
  assert.match(pb.steps.find(s => s.key === `impasto`).body, /sono nel tangzhong/);
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

test(`bun: con il tangzhong resta sempre del latte per sciogliere il lievito, anche nella brioche`, () => {
  const a = app();
  // brioche al 40% di latte: con l'8% di farina il tangzhong si prenderebbe tutto il latte; scende al 6%
  let { I, steps } = bun(a, `brioche`, `state.room=20; state.plan='giornata'; state.over.tz=true; state.n=6;`);
  assert.ok(Math.abs(I.tz.flour / I.flour - .06) < 1e-9, `${I.tz.flour / I.flour}`);
  const milk = I.water - I.tz.liquid;
  assert.ok(milk > 20, `latte libero ${milk}`);
  assert.doesNotMatch(steps.find(s => s.key === `impasto`).body, /<b>0 g<\/b> di latte/);
  // smash al 45%: 6,75%
  ({ I } = bun(a, `smash`, `state.room=20; state.plan='giornata'; state.over.tz=true;`));
  assert.ok(Math.abs(I.tz.flour / I.flour - .0675) < 1e-9);
  // la tabella degli ingredienti dice la percentuale vera
  bun(a, `brioche`, `state.room=20; state.plan='giornata'; state.over.tz=true;`);
  a.run(`ui.page=5; renderAll();`);
  assert.match(a.element(`#out`).innerHTML, /6% \+ 30%/);
});

test(`bun: lievito difficile da pesare, sciolto nel latte libero`, () => {
  const a = app();
  let seen = 0;
  for (const style of BUNS) for (const room of [16, 20, 26]) for (const pk of [`giornata`, `h24`]) for (const y of [`fresco`, `secco`]) for (const n of [1, 2, 6]) for (const tz of [true, false]) {
    const { I, steps } = bun(a, style, `state.room=${room}; state.plan='${pk}'; state.yeast='${y}'; state.n=${n}; state.over.tz=${tz};`);
    const tag = `${style} ${pk} ${room} °C ${y} n=${n} tz=${tz}`;
    const body = steps.find(s => s.key === `impasto`).body;
    const milk0 = I.water - (I.tz ? I.tz.liquid : 0);
    // poco lievito: c'è il consiglio, tranne quando nemmeno 1 g in 10 g di latte sta nel latte libero (un solo panino)
    const small = (y === `secco` ? I.yeast < 0.7 : I.yeast < 2) && 10 * I.yeast <= milk0 * .9;
    if ((y === `secco` ? I.yeast < 0.7 : I.yeast < 2) && !small) assert.ok(n <= 2, `${tag}: senza consiglio`);
    const m = body.match(/Sciogli 1 g di lievito in (\d+) g di latte e usa <b>(\d+) g<\/b>/);
    assert.equal(!!m, small, tag);
    if (!m) continue;
    seen++;
    const milk = I.water - (I.tz ? I.tz.liquid : 0), D = +m[1] + 1, X = +m[2];
    // 1 g in D−1 g fa D g di soluzione: X g contengono la dose
    assert.ok(X <= milk * .9 + .5, `${tag}: ${X} g di soluzione su ${milk} g di latte`);
    assert.ok(Math.abs(X - I.yeast * D) <= .5, tag);
    assert.ok(X >= 2, `${tag}: soluzione pesabile`);
  }
  assert.ok(seen > 20, `casi con poco lievito: ${seen}`);
});

test(`bun: con poco latte libero la temperatura passa al tangzhong (tiepido) o alle uova (fredde)`, () => {
  const a = app();
  for (const style of BUNS) for (const room of [14, 16, 18, 20, 22, 24, 26, 28]) for (const mixer of [false, true]) {
    const r = bun(a, style, `state.room=${room}; state.plan='giornata'; state.mixer=${mixer}; state.dinner.setHours(18,0,0,0);`);
    const tag = `${style} ${room} °C ${mixer ? `impastatrice` : `a mano`}`;
    assert.ok(r.I.waterT >= 4 && r.I.waterT <= 35, `${tag}: ${r.I.waterT}`);
    if (r.I.tzT != null) assert.ok(r.I.tzT > room && r.I.tzT <= 40 && r.I.waterT === 35, `${tag}: tangzhong ${r.I.tzT}`);
    if (r.I.coldExtras) assert.equal(r.I.waterT, 4, tag);
  }
  // casa fresca: latte a 35 °C e tangzhong ancora tiepido, detto nel tangzhong e nell'impasto
  const f = bun(a, `bun`, `state.room=18; state.plan='giornata'; state.dinner.setHours(18,0,0,0);`);
  assert.ok(f.I.tzT >= 30, `tangzhong ${f.I.tzT}`);
  assert.match(f.steps.find(s => s.key === `tangzhong`).body, /intiepidire fino a circa/);
  assert.match(f.steps.find(s => s.key === `impasto`).body, /tangzhong ancora tiepido/);
  // casa molto calda con l'impastatrice: latte, uova e tangzhong freddi di frigo
  const c = bun(a, `brioche`, `state.room=28; state.mixer=true; state.plan='giornata'; state.dinner.setHours(18,0,0,0);`);
  assert.ok(c.I.coldExtras && c.I.waterT === 4);
  assert.match(c.steps.find(s => s.key === `impasto`).body, /uova sbattute[^,]*fredde di frigo/);
  assert.match(c.steps.find(s => s.key === `tangzhong`).body, /Stendilo su un piatto[^]*mettilo in frigo/);
  // a 28 °C a mano basta il latte freddo: uova e tangzhong restano a temperatura di casa
  const m = bun(a, `bun`, `state.room=28; state.mixer=false; state.plan='giornata'; state.dinner.setHours(18,0,0,0);`);
  assert.ok(!m.I.coldExtras, `a mano ${m.I.waterT}`);
  // casa normale: nessun accorgimento in più
  const n = bun(a, `bun`, `state.room=24; state.plan='giornata'; state.dinner.setHours(18,0,0,0);`);
  assert.ok(n.I.tzT == null && !n.I.coldExtras);
});

test(`bun: con una notte in frigo anche il tangzhong non si prepara di notte`, () => {
  const a = app();
  for (const h of [7, 8, 9]) {
    const r = bun(a, `bun`, `state.room=20; state.plan='h24'; state.dinner.setHours(${h},0,0,0);`);
    assert.equal(r.pk, `h24`);
    const b = new Date(r.pl.begin).getHours();
    assert.ok(b >= 7 && b < 23, `panini alle ${h}: tangzhong alle ${b}`);
  }
});

test(`bun: la finestra di conferma parla di latte e burro e mostra uova, patate, zucchero e tangzhong`, () => {
  const a = app();
  bun(a, `smash`, `state.room=20; state.plan='giornata'; state.dinner.setHours(18,0,0,0);`);
  a.run(`requestChange({k:'over',o:'egg',v:20})`);
  const m = a.element(`#modal`).innerHTML;
  assert.match(m, /<td>Uova<\/td>/);
  assert.match(m, /<td>Latte<\/td>|Vuoi cambiare le uova/);
  assert.doesNotMatch(m, /<td>Acqua<\/td>|<td>Olio<\/td>/);
  a.run(`requestChange({k:'over',o:'potato',v:30})`);
  assert.match(a.element(`#modal`).innerHTML, /<td>Patate lesse<\/td>/);
  a.run(`requestChange({k:'over',o:'oil',v:12})`);
  const o = a.element(`#modal`).innerHTML;
  assert.match(o, /Vuoi cambiare il burro/);
  assert.match(o, /<td>Burro<\/td>/);
  // farina e lievitazione: pregi e difetti dei bun, non della pizza
  const r = a.run(`(()=>{ const keep=cfgNow(), P=params(state); return [explain({k:'flour',v:'media'},P,P,keep), explain({k:'plan',v:'h24'},P,P,keep)]; })()`);
  assert.ok(r[0].pc && r[1].pc);
  assert.doesNotMatch(r[0].t.join(` `), /pizza|abbasso l'idratazione/);
  assert.deepEqual(r[1].pc, a.run(`INFO.bunPlan.h24`));
});
