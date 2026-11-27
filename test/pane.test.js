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
const BREADS = [`pagnotta`, `filoni`, `ciabatta`, `siciliano`, `pugliese`, `semola`, `integrale`, `cassetta`];
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
    // in giornata il pane è per cena: per pranzo dovrebbe iniziare di notte, e la giornata non è proposta
    const r = bread(a, style, `state.room=${room}; state.plan='${pk}';${pk === `giornata` ? ` state.dinner.setHours(19,0,0,0);` : ``}`);
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
  const giorno = y(`state.room=20; state.plan='giornata'; state.dinner.setHours(19,0,0,0);`);
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
  // taratura del 25/11/2026 (docs/ricerca/pane-ricette-2026-11-25.md): circa 1,1% con una notte in frigo a 20 °C
  assert.ok(c.I.ypct >= 0.9 && c.I.ypct <= 1.3, `pan bauletto 24 h: ${c.I.ypct}`);
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
    assert.match(out, /Appretto in frigo/);
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
  assert.ok(diff.some(d => /Peso di ogni pane: 500 g → 600 g/.test(d)));
  // pizza: nessuno zucchero, olio aggiunto nel forno di casa come prima
  a.run(`requestChange({k:'style',v:'classica'}); state.oven='casa_pietra'; R=compute();`);
  const P = a.run(`R.P`);
  assert.equal(P.sugar, 0);
  assert.equal(P.oil, 2);
  assert.ok(!a.run(`R.pl.bread`));
});

test(`pane siciliano e pugliese: forme, niente pentola, crosta asciugata a fine cottura`, () => {
  const a = app();
  // passando al pugliese da un forno non ammesso si va su un forno adatto
  a.run(`state.style='pagnotta'; state.oven='pentola'; requestChange({k:'style',v:'pugliese'});`);
  assert.equal(a.run(`state.flour`), `semola`);
  assert.equal(a.run(`state.oven`), `casa_pietra`);
  // la pagina Cucina non propone la pentola
  a.run(`ui.page=2; renderAll();`);
  assert.doesNotMatch(a.element(`#page`).innerHTML, /data-val="pentola"/);
  // se la pentola arriva da una ricetta salvata, si cuoce sulla teglia con un avviso
  const pot = bread(a, `siciliano`, `state.oven='pentola'; state.room=20;`);
  assert.equal(pot.pl.bk.oven, `casa_teglia`);
  assert.ok(pot.W.some(w => w.w && /non si cuoce nella pentola/.test(w.t)));
  // mafalda: serpentina con sesamo, nessuna incisione
  const sic = bread(a, `siciliano`, `state.room=20;`);
  const fs = sic.steps.find(s => s.key === `formatura`), inc = sic.steps.find(s => s.key === `incisione`);
  assert.match(fs.title, /mafalda/);
  assert.match(fs.body, /serpentina/);
  assert.match(fs.body, /sesamo/);
  assert.equal(inc.title, `Inforna`);
  assert.match(inc.body, /non si incide/);
  assert.equal(sic.pl.bk.dry, 0);
  // pugliese: piega a cavallo, pane grande, asciugatura finale, raffreddamento lungo, un pane per infornata
  const pug = bread(a, `pugliese`, `state.room=20; state.n=2;`);
  const fp = pug.steps.find(s => s.key === `formatura`);
  assert.match(fp.body, /a cavallo/);
  assert.match(pug.steps.find(s => s.key === `cottura`).body, /sportello socchiuso/);
  assert.equal(pug.pl.bk.dry, 15);
  assert.ok(pug.pl.bk.per >= 70, `cottura ${pug.pl.bk.per}`);
  assert.equal(pug.pl.bk.cool, 3);
  assert.equal(pug.pl.bk.batches, 2);
  assert.ok(pug.W.some(w => /Altamura DOP/.test(w.t)));
  // il pane di semola da 900 g ha 10 minuti di asciugatura, quello piccolo no
  assert.equal(bread(a, `semola`, `state.room=20;`).pl.bk.dry, 10);
  assert.equal(bread(a, `semola`, `state.over.ball=500; state.room=20;`).pl.bk.dry, 0);
});

test(`pane: con poco lievito e il tangzhong l'acqua a parte toglie anche il liquido del tangzhong`, () => {
  const a = app();
  // un pan bauletto piccolo con il lievito secco: meno di 0,7 g
  const { I, steps } = bread(a, `cassetta`, `state.room=26; state.plan='h24'; state.yeast='secco'; state.over.tz=true; state.over.ball=150;`);
  assert.ok(I.tz && I.yeast < 0.7, `lievito ${I.yeast}`);
  const body = steps.find(s => s.key === `impasto`).body;
  const m = body.match(/Sciogli 1 g di lievito in (\d+) g d'acqua e usa <b>(\d+) g<\/b>.*?scende così a <b>([\d,]+) g<\/b>/);
  assert.ok(m, `manca il consiglio sul lievito`);
  const free = I.water - I.tz.liquid, X = +m[2];
  assert.ok(X <= free + .5, `${X} g di soluzione su ${free} g d'acqua libera`);
  const W = X * +m[1] / (+m[1] + 1);            // l'acqua che la soluzione porta con sé
  assert.ok(Math.abs(X / (+m[1] + 1) - I.yeast) < .03, `nella soluzione c'è la dose: ${X / (+m[1] + 1)} su ${I.yeast}`);
  assert.ok(free - W > 0, `acqua a parte: ${free - W}`);
  assert.equal(+m[3].replace(`,`, `.`), a.run(`roundG(${free - W})`));
});

test(`lievito difficile da pesare: la soluzione non supera mai l'acqua della ricetta`, () => {
  const a = app();
  for (const style of a.run(`Object.keys(STYLES)`)) for (const room of [16, 20, 26]) for (const pk of [`giornata`, `h24`]) for (const y of [`fresco`, `secco`]) {
    const R = bread(a, style, `state.room=${room}; state.plan='${pk}'; state.yeast='${y}';`);
    if (R.none) continue;
    const body = (R.steps.find(s => s.key === `impasto`) || {}).body || ``;
    const m = body.match(/Sciogli 1 g di lievito in (\d+) g d'(?:acqua|latte) e usa <b>(\d+) g<\/b>/);
    if (!m) continue;
    const free = R.I.water - (R.I.tz ? R.I.tz.liquid : 0);
    assert.ok(+m[2] <= free + .5, `${style} ${pk} ${room} °C ${y}: ${m[2]} g su ${free} g`);
  }
});

test(`pane e pizza in giornata per pranzo: mai impasto di notte`, () => {
  const a = app();
  // pagnotta pronta alle 13: dalle 7:30 non ci sono 3 ore, quindi la giornata non è proposta
  const r = bread(a, `pagnotta`, `state.room=20; state.plan='giornata';`);
  assert.equal(r.plans.giornata.ok, false);
  assert.match(r.plans.giornata.reason, /di notte/);
  assert.equal(r.pk, `h24`);
  // se l'utente dice che inizia alle 6:30 quel giorno, si rispetta
  const d = bread(a, `pagnotta`, `state.room=20; state.plan='giornata'; state.prepMode='day'; state.prepClock='06:30';`);
  assert.equal(d.pk, `giornata`);
  // pizza alle 11:30: si parte alle 7:30 con almeno 3 ore, non alle 3 di notte
  a.run(`state.style='pagnotta'; requestChange({k:'style',v:'classica'}); state.plan='giornata'; state.room=20; state.dinner=new Date(Date.now()+5*24*H); state.dinner.setHours(11,30,0,0); R=compute();`);
  const p = a.run(`R`);
  assert.equal(p.pk, `giornata`);
  assert.ok(new Date(p.pl.mixStart).getHours() >= 7, `pizza: ${new Date(p.pl.mixStart).getHours()}`);
});

test(`pan bauletto con il tangzhong: dosi nette e niente autolisi`, () => {
  const a = app();
  const r = bread(a, `cassetta`, `state.room=20; state.plan='h24'; state.over.tz=true;`);
  const b = r.steps.find(s => s.key === `impasto`).body;
  assert.doesNotMatch(b, /autolisi/);
  const free = Math.round(r.I.water - r.I.tz.liquid), fl = Math.round(r.I.flour - r.I.tz.flour);
  assert.ok(b.includes(`<b>${fl} g</b> di farina (quella che resta dopo il tangzhong), <b>${free} g</b> d'acqua`), b);
  const s = bread(a, `cassetta`, `state.room=20; state.plan='h24'; state.over.tz=false;`);
  assert.match(s.steps.find(x => x.key === `impasto`).body, /autolisi/);
});

test(`pane: forno a legna conta i pani per infornata, pugliese piccolo senza asciugatura, farine del pane nella conferma`, () => {
  const a = app();
  const l = bread(a, `pugliese`, `state.room=20; state.plan='h24'; state.oven='legna'; state.n=7;`);
  assert.ok(l.W.some(w => /cuoce 6 pani per volta: le infornate sono 2/.test(w.t)));
  assert.equal(bread(a, `pugliese`, `state.room=20; state.plan='h24';`).pl.bk.dry, 15);
  const small = bread(a, `pugliese`, `state.room=20; state.plan='h24'; state.over.ball=300;`);
  assert.equal(small.pl.bk.dry, 0);
  assert.doesNotMatch(small.pl.bk.how, /sportello socchiuso<\/b>/);
  // ciabatta con farina debole (idratazione al 60%): si impasta sul piano
  const c = bread(a, `ciabatta`, `state.room=20; state.plan='h24'; state.flour='debole';`);
  assert.ok(c.P.hyd < 70);
  assert.doesNotMatch(c.steps.find(s => s.key === `impasto`).body, /Non provare a impastarla sul piano/);
  // conferma del cambio di farina e lievitazione: testi e pregi del pane
  bread(a, `pagnotta`, `state.room=20; state.plan='h24';`);
  const r = a.run(`(()=>{ const keep=cfgNow(), P=params(state); return [explain({k:'flour',v:'tipo1'},P,P,keep), explain({k:'plan',v:'giornata'},P,P,keep)]; })()`);
  assert.deepEqual(r[0].pc, a.run(`INFO.breadFlour.tipo1`));
  assert.ok(r[0].pc);
  assert.doesNotMatch(r[0].t.join(` `), /pizza/);
  assert.deepEqual(r[1].pc, a.run(`INFO.breadPlan.giornata`));
});

test(`pane in giornata per colazione: niente formatura e forno di notte`, () => {
  const a = app();
  for (const h of [7, 8, 9]) {
    const r = bread(a, `pagnotta`, `state.room=20; state.plan='giornata'; state.dinner.setHours(${h},0,0,0);`);
    assert.equal(r.plans.giornata.ok, false, `pane alle ${h}`);
    assert.match(r.plans.giornata.reason, /di notte/);
  }
  // ogni pane e bun in giornata, a qualunque ora proposta, ha i passaggi attivi tra le 7 e le 23
  for (const style of [`pagnotta`, `cassetta`, `bun`]) for (let h = 0; h < 24; h++) {
    const r = bread(a, style, `state.room=20; state.plan='giornata'; state.dinner.setHours(${h},0,0,0);`);
    const pl = r.plans.giornata;
    if (!pl.ok) continue;
    for (const s of r.pk === `giornata` ? r.steps.filter(s => s.hands && s.key !== `raffreddamento`) : []) {
      const sh = new Date(s.start).getHours();
      assert.ok(sh >= 7 && sh < 23, `${style} pronto alle ${h}: ${s.key} alle ${sh}`);
    }
  }
});

test(`testi giusti per pizza, pane e panini; canotto con farina media e teglia con il peso delle palle`, () => {
  const a = app();
  bread(a, `bun`, ``);
  a.run(`state.prepMode='day'`);
  const w = a.run(`whenAvail()`);
  assert.doesNotMatch(w, /del pane|della pizza/);
  assert.match(w, /dei panini/);
  assert.equal(a.run(`PREP_MODES.day`), `Preparo solo il giorno stesso`);
  // canotto con la farina per pizza media: avviso forte
  a.run(`requestChange({k:'style',v:'canotto'}); state.flour='media'; state.plan=null; R=compute();`);
  assert.ok(a.run(`R`).W.some(w => w.w && /canotto serve il mix/.test(w.t) && /70%/.test(w.t)));
  a.run(`state.flour='mix'; R=compute();`);
  assert.ok(!a.run(`R`).W.some(w => /canotto serve/.test(w.t)));
  // teglia: le palle si pesano come i panetti delle tonde
  a.run(`requestChange({k:'style',v:'teglia'}); state.tn=2; state.plan='h24'; R=compute();`);
  const r = a.run(`R`), st = r.steps.find(s => s.key === `staglio`);
  assert.match(st.body, new RegExp(`2 pezzi da ${Math.round(r.I.piece)} g`));
});

test(`pagnotte: frigo breve nel cestino prima di cuocere, solo per le forme tonde`, () => {
  const a = app();
  for (const style of BREADS) for (const pk of [`giornata`, `h24`]) {
    const r = bread(a, style, `state.room=20; state.plan='${pk}';${pk === `giornata` ? ` state.dinner.setHours(19,0,0,0);` : ``}`);
    const keys = r.pl.phases.map(p => p[0]), boule = a.run(`STYLES['${style}'].shape`) === `boule`;
    assert.equal(keys.includes(`frigobreve`), boule, `${style} ${pk}: ${keys.join(` `)}`);
    if (!boule) continue;
    assert.equal(keys[keys.length - 1], `frigobreve`);
    assert.equal(keys[keys.length - 2], `appretto`);
    const fb = r.pl.phases.find(p => p[0] === `frigobreve`);
    assert.equal(fb[1], a.run(`CHILL_H`));
    assert.equal(fb[2], a.run(`state.fridge`));
    // le ore a temperatura di casa restano almeno 3 in giornata, e il totale è sempre 24 con la notte in frigo
    const roomH = r.pl.phases.filter(p => p[0] !== `frigobreve` && p[0] !== `frigo`).reduce((s, p) => s + p[1], 0);
    if (pk === `giornata`) assert.ok(roomH >= 3 - 1e-9, `${style}: ${roomH}`); else assert.ok(Math.abs(r.pl.total - 24) < 1e-9);
    const s = r.steps.find(x => x.key === `frigobreve`);
    assert.match(s.body, /solo al momento di infornare/);
    assert.match(r.steps.find(x => x.key === `incisione`).body, /dal frigo adesso/);
  }
  // giornata corta: niente frigo breve se a temperatura di casa resterebbero meno di 3 ore
  const r = bread(a, `pagnotta`, `state.room=20; state.plan='giornata'; state.dinner=new Date(Date.now()+8*H);`);
  if (!r.none) {
    const roomH = r.pl.phases.filter(p => p[0] !== `frigobreve`).reduce((s, p) => s + p[1], 0);
    assert.ok(roomH >= 3 - 1e-9);
  }
  // il frigo breve rallenta poco: conta alla media tra casa e frigo
  assert.ok(Math.abs(a.run(`heqOf([['frigobreve',2,4]],20,true)`) - 2 * a.run(`fT(12)`)) < 1e-12);
});

test(`pane molto bagnato: impasto in ciotola e laminazione come prima serie di pieghe`, () => {
  const a = app();
  for (const [style, hyd, wet] of [[`pagnotta`, 68, false], [`pagnotta`, 78, true], [`semola`, 72, true], [`ciabatta`, 78, false], [`filoni`, 74, true]]) {
    const flour = style === `semola` ? `semola` : `forte`;
    const r = bread(a, style, `state.room=20; state.plan='h24'; state.flour='${flour}'; state.over={hyd:${hyd}};`);
    const tag = `${style} ${hyd}%`;
    assert.ok(!r.none, tag);
    const imp = r.steps.find(s => s.key === `impasto`), p1 = r.steps.find(s => s.key === `pieghe1`);
    assert.equal(/nella ciotola<\/b>/.test(imp.body), wet, tag);
    assert.ok(p1, tag);
    assert.equal(/laminazione/.test(p1.body), wet, tag);
    assert.equal(/^Laminazione/.test(p1.title), wet, tag);
    a.run(`state.mixer=true; R=compute();`);
    assert.doesNotMatch(a.run(`R.steps.find(s=>s.key==='impasto').body`), /nella ciotola<\/b>/, `${tag}: con l'impastatrice si usa il gancio`);
    a.run(`state.mixer=false;`);
  }
});
