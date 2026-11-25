// Test della modalità cucina interattiva: controlli sull'impasto e adattamento degli orari.
// Si eseguono con:  node --test test/cucina.test.js
// Come gli altri test, eseguo motore e interfaccia di index.html con un DOM minimo e un orologio finto.
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
  run(`const __realNow=Date.now; var __t=null; Date.now=()=>__t==null?__realNow():__t;`);
  return { run, element };
}
// piano a 5 giorni da adesso alle 20: lontano dalla notte e sempre raggiungibile
function plan(a, style, extra = ``) {
  a.run(`__t=null; state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan'; state.n=4;
    state.room=20; state.fridge=4; ui.reviewed=false; state.link=null; state.method='diretto'; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(Date.now()+5*24*H); state.dinner.setHours(20,0,0,0); ${extra} R=compute();`);
  return a.run(`R`);
}
// apre la modalità cucina da zero, senza stato salvato
function open(a) { a.run(`__t=null; localStorage.removeItem(COOK_KEY); openCook();`); }
const keys = a => a.run(`cook.steps.map(s=>s.key)`);
const gates = a => a.run(`JSON.parse(JSON.stringify(cook.gates))`);
const dinner = a => a.run(`tlDinner(cookT())`);
const at = (a, t) => a.run(`__t=${t}`);
const startOf = (a, m) => a.run(`tlS(cookT(),${m})`);
const endOf = (a, m) => a.run(`tlE(cookT(),${m})`);
const answer = (a, i, mode, opt, extra = `{}`) => { a.run(`cook.i=${i}; ckAnswer(${i},'${mode}','${opt}',${extra})`); return a.run(`JSON.parse(JSON.stringify(cook.ck['${i}:${mode}']))`); };
const screen = (a, i) => { a.run(`cook.i=${i}; renderCook()`); return a.element(`#cook`).innerHTML; };
const clean = s => !/undefined|NaN|\[object Object\]|Infinity/.test(s);
const idx = (a, k) => keys(a).indexOf(k);
const lastIdx = (a, k) => keys(a).lastIndexOf(k);

/* ---------- motore: linea del tempo ---------- */
function timeline(a, phases) {
  // phases: [[key, ore]] in fila, più la cottura alla fine
  let t = 0; const steps = phases.map(([key, h]) => { const s = { key, start: t, end: t + h * H }; t += h * H; return s; });
  steps.push({ key: `cottura`, start: t, end: t + 10 * MIN });
  a.run(`var T={steps:${JSON.stringify(steps)},os:Array(${steps.length}).fill(0),oe:Array(${steps.length}).fill(0)}`);
}

test(`motore: il frigo lungo assorbe ritardi e anticipi, la cena resta ferma`, () => {
  const a = app();
  timeline(a, [[`puntata`, 2], [`staglio`, .25], [`frigo`, 18], [`appretto`, 4]]);
  const d0 = a.run(`tlDinner(T)`);
  // ritardo di un'ora prima del frigo: il frigo si accorcia, la cena no
  assert.equal(a.run(`tlPush(T,1,${H})`), 0);
  assert.equal(a.run(`tlDinner(T)`), d0);
  assert.equal(a.run(`tlE(T,2)-tlS(T,2)`), 17 * H);
  // il frigo non scende sotto il 75% (né sotto 8 ore): oltre, slitta la cena
  assert.equal(a.run(`tlPush(T,1,${10 * H})`), 10 * H - 3.5 * H);
  timeline(a, [[`puntata`, 2], [`staglio`, .25], [`frigo`, 18], [`appretto`, 4]]);
  // anticipo senza toccare la cena: il frigo si allunga, al massimo del 30%
  assert.equal(a.run(`tlPull(T,1,${H},false)`), H);
  assert.equal(a.run(`tlDinner(T)`), d0);
  assert.equal(a.run(`tlE(T,2)-tlS(T,2)`), 19 * H);
  assert.ok(Math.abs(a.run(`tlPull(T,1,${10 * H},false)`) - 4.4 * H) < 1);
  assert.equal(a.run(`tlDinner(T)`), d0);
});

test(`motore: allungare o accorciare l'appretto usa il frigo che lo precede`, () => {
  const a = app();
  timeline(a, [[`puntata`, 2], [`staglio`, .25], [`frigo`, 18], [`appretto`, 4]]);
  const d0 = a.run(`tlDinner(T)`);
  // appretto più lungo di un'ora: si esce prima dal frigo, la cena non cambia
  let r = a.run(`tlResize(T,3,${H},3,0)`);
  assert.equal(r.fridge, -H); assert.equal(r.late, 0);
  assert.equal(a.run(`tlE(T,3)-tlS(T,3)`), 5 * H);
  assert.equal(a.run(`tlDinner(T)`), d0);
  // più corto di due ore: si resta in frigo di più
  timeline(a, [[`puntata`, 2], [`staglio`, .25], [`frigo`, 18], [`appretto`, 4]]);
  r = a.run(`tlResize(T,3,${-2 * H},3,0)`);
  assert.equal(r.fridge, 2 * H); assert.equal(r.slow, 0);
  assert.equal(a.run(`tlE(T,3)-tlS(T,3)`), 2 * H);
  assert.equal(a.run(`tlDinner(T)`), d0);
  // dopo essere usciti dal frigo non si può più: senza frigo dopo, resta da frenare l'impasto
  timeline(a, [[`puntata`, 2], [`staglio`, .25], [`frigo`, 18], [`appretto`, 4]]);
  r = a.run(`tlResize(T,3,${-H},5,0)`);
  assert.equal(r.fridge, 0); assert.equal(r.slow, H);
  assert.equal(a.run(`tlDinner(T)`), d0);
  // in giornata, senza frigo: più lungo sposta la cena, più corto la anticipa solo se richiesto
  timeline(a, [[`puntata`, 2], [`staglio`, .25], [`appretto`, 4]]);
  r = a.run(`tlResize(T,2,${H / 2},0,0)`); assert.equal(r.late, H / 2);
  assert.equal(a.run(`tlDinner(T)`), d0 - 18 * H + H / 2);
  timeline(a, [[`puntata`, 2], [`staglio`, .25], [`appretto`, 4]]);
  r = a.run(`tlResize(T,2,${-H},0,0,true)`); assert.equal(r.early, H);
  assert.equal(a.run(`tlDinner(T)`), d0 - 18 * H - H);
  // le pieghe restano legate all'inizio della puntata
  a.run(`T={steps:[{key:'puntata',start:0,end:${2 * H}},{key:'pieghe1',start:${20 * MIN},end:${25 * MIN}},{key:'staglio',start:${2 * H},end:${2.25 * H}},{key:'cottura',start:${2.25 * H},end:${2.5 * H}}],os:[0,0,0,0],oe:[0,0,0,0]}; tlResize(T,0,${H / 2},0,0);`);
  assert.deepEqual(a.run(`JSON.stringify(T.os)`), JSON.stringify([0, 0, H / 2, H / 2]));
});

test(`motore: le risposte diventano decisioni sensate`, () => {
  const a = app();
  const rise = (g, t, f, e) => a.run(`riseVerdict(${g},${t},${f},${e})`);
  // in giornata: quasi fermo dopo 2 ore va aspettato, al massimo un'ora per volta
  let v = rise(.05, .3, false, 2); assert.equal(v.v, `slow`); assert.ok(v.wait > 0 && v.wait <= 1);
  assert.equal(rise(.25, .3, false, 2).v, `ok`);
  v = rise(.85, .3, false, 2); assert.equal(v.v, `fast`); assert.ok(v.kf > 1 && v.kf <= 1.6);
  // prima di un frigo lungo un impasto lento va bene: il frigo lo recupera
  assert.equal(rise(.05, .25, true, 2).v, `ok`);
  assert.equal(rise(1.3, .25, true, 2).v, `fast`);
  // pane in giornata: deve quasi raddoppiare
  assert.equal(rise(.5, .9, false, 2.5).v, `slow`);
  assert.equal(rise(.85, .9, false, 2.5).v, `ok`);
  // prova del dito: lento, pronto prima, andato oltre
  const proof = (p, e, r) => a.run(`proofVerdict(${p},${e},${r})`);
  v = proof(.3, 3, 1); assert.equal(v.v, `slow`); assert.ok(v.wait >= .25 && v.wait <= 1.5);
  assert.equal(proof(.65, 3, .5).v, `slow`);
  assert.ok(a.run(`timeToTarget(3,.65)`) < 3 * .35 / .65, `la crescita accelera: serve meno della stima lineare`);
  assert.ok(a.run(`riseSpeedAfterWait(2.5,3.5)`) > .85);
  assert.equal(proof(1, 3, .25).v, `ok`);
  v = proof(1, 3, 1); assert.equal(v.v, `fast`); assert.ok(v.ahead > 0);
  assert.equal(proof(1.35, 3, 1).v, `over`);
  // frigo: per frenare un'ora a 20 °C servono più di un'ora di frigo (l'impasto si raffredda piano)
  const F = a.run(`slowFridgeH(1,20,4)`); assert.ok(F > 1 && F < 2, F);
  // temperatura dell'impasto: più caldo accorcia la puntata, più freddo la allunga
  assert.ok(a.run(`doughTempDelta(27,23,2)`) < 0);
  assert.ok(a.run(`doughTempDelta(19,23,2)`) > 0);
  assert.equal(a.run(`nextWaterT(20,25,23)`), 14);
});

/* ---------- interfaccia: dove si fanno i controlli ---------- */
test(`ogni piano ha i suoi controlli nei punti giusti`, () => {
  const a = app();
  const styles = a.run(`Object.keys(STYLES)`);
  for (const style of styles) for (const pk of [`giornata`, `h24`]) {
    const R = plan(a, style, `state.plan='${pk}';`);
    if (R.none) continue;
    open(a);
    const G = gates(a), k = keys(a), ids = Object.values(G).flatMap(g => Object.values(g).map(x => x.id));
    const where = `${style} ${pk}`;
    assert.ok(G[k.indexOf(`impasto`)] && G[k.indexOf(`impasto`)].after.id === `impasto`, `${where}: manca il controllo dell'impasto`);
    assert.ok(ids.includes(`rise`), `${where}: manca il controllo della puntata`);
    assert.ok(ids.includes(`proof`), `${where}: manca il controllo dell'appretto`);
    if (k.includes(`frigo`)) assert.ok(ids.includes(`frigo`), `${where}: manca il controllo all'uscita dal frigo`);
    if (k.some(x => /^pieghe/.test(x))) assert.ok(ids.includes(`pieghe`), `${where}: manca il controllo dopo le pieghe`);
    // il controllo della puntata arriva quando la puntata finisce
    const rg = Object.keys(G).find(i => G[i].before && G[i].before.id === `rise`);
    assert.equal(a.run(`cook.steps[${rg}].start`), a.run(`cook.steps[${k.lastIndexOf(`puntata`)}].end`), `${where}: controllo della puntata fuori posto`);
  }
});

test(`ogni risposta di ogni controllo dà un risultato chiaro, senza valori rotti`, () => {
  const a = app();
  const cases = [[`contemporanea`, `giornata`], [`contemporanea`, `h24`], [`teglia`, `h24`], [`classica`, `h48`], [`pagnotta`, `giornata`], [`pagnotta`, `h24`], [`bun`, `giornata`], [`bun`, `h24`], [`bauletto`, `giornata`]];
  for (const [style, pk] of cases) {
    if (!a.run(`!!STYLES['${style}']`)) continue;
    const R = plan(a, style, `state.plan='${pk}';`);
    if (R.none) continue;
    open(a);
    const G = gates(a);
    for (const [i, g] of Object.entries(G)) for (const [mode, def] of Object.entries(g)) {
      const opts = a.run(`(()=>{ cook.i=${i}; return CHECKS['${def.id}'].opts(ckCtx(${i},'${mode}')).map(o=>o.id); })()`);
      for (const opt of opts) {
        open(a);
        // si risponde all'ora prevista: prima del passaggio, o alla fine se il controllo è dopo
        at(a, mode === `before` ? startOf(a, i) : endOf(a, i));
        const ask = screen(a, i);
        if (mode === `before`) assert.match(ask, /ck-opts/, `${style} ${pk} ${def.id}: la domanda non compare`);
        assert.ok(clean(ask), `${style} ${pk} ${def.id}: domanda con valori rotti`);
        const rec = answer(a, i, mode, opt, def.id === `impasto` ? `{t:26}` : `{}`);
        assert.ok([`ok`, `wait`].includes(rec.st), `${style} ${pk} ${def.id} ${opt}: stato ${rec.st}`);
        assert.ok(rec.res.head && rec.res.html, `${style} ${pk} ${def.id} ${opt}: risposta vuota`);
        assert.ok(clean(rec.res.html) && clean(rec.res.head), `${style} ${pk} ${def.id} ${opt}: ${rec.res.html}`);
        assert.ok(a.run(`cook.os.concat(cook.oe).every(Number.isFinite)`), `${style} ${pk} ${def.id} ${opt}: orari non validi`);
        // l'ordine dei passaggi non si rompe e nessuno finisce prima di cominciare
        assert.ok(a.run(`cook.steps.every((s,m)=>tlE(cookT(),m)>=tlS(cookT(),m)-1)`), `${style} ${pk} ${def.id} ${opt}: passaggio con durata negativa`);
        const out = screen(a, i);
        assert.ok(clean(out), `${style} ${pk} ${def.id} ${opt}: schermata con valori rotti`);
        if (rec.st === `wait`) assert.match(out, /Ricontrolliamo alle/);
        if (rec.res.alt) { a.run(`ckAnswer(${i},'${mode}','${opt}',{alt:true},true)`); assert.ok(a.run(`cook.os.every(Number.isFinite)`)); }
      }
    }
  }
});

/* ---------- interfaccia: come si adattano gli orari ---------- */
test(`pizza in giornata: puntata lenta, si aspetta e la cena slitta; dopo l'attesa vale l'ultima risposta`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='giornata';`); open(a);
  const g = idx(a, `staglio`), d0 = dinner(a);
  at(a, startOf(a, g));
  let rec = answer(a, g, `before`, `uguale`);
  assert.equal(rec.st, `wait`);
  assert.ok(dinner(a) > d0, `la cena deve slittare`);
  assert.ok(startOf(a, g) >= rec.until - 1, `lo staglio si sposta all'ora del nuovo controllo`);
  // ricontrollo all'ora indicata: adesso è a posto
  at(a, rec.until);
  rec = answer(a, g, `before`, `quarto`);
  assert.equal(rec.st, `ok`); assert.equal(rec.n, 2);
  assert.ok(a.run(`ckPending(${g})`) === null, `dopo la risposta si fa il passaggio`);
  assert.ok(dinner(a) > d0);
});

test(`pizza in giornata: puntata veloce, si propone il frigo per tenere l'orario oppure di anticipare`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='giornata';`); open(a);
  const g = idx(a, `staglio`), ap = lastIdx(a, `appretto`), d0 = dinner(a);
  at(a, startOf(a, g));
  const rec = answer(a, g, `before`, `quasi`);
  assert.equal(rec.st, `ok`);
  assert.equal(dinner(a), d0, `la cena resta ferma`);
  assert.match(a.run(`ckAdjHtml(${ap})`), /in frigo per/, `l'appretto riceve l'indicazione del frigo`);
  assert.ok(rec.res.alt, `si offre di anticipare`);
  a.run(`ckAnswer(${g},'before','quasi',{alt:true},true)`);
  assert.ok(dinner(a) < d0, `con l'alternativa la cena si anticipa`);
  assert.equal(a.run(`ckAdjHtml(${ap})`), ``, `e il frigo non serve più`);
  assert.equal(a.run(`cook.ck['${g}:before'].n`), 1, `l'alternativa non conta come nuova risposta`);
});

test(`24 ore: fuori dal frigo molto cresciuti, si resta in frigo di più e la cena non cambia`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='h24';`); open(a);
  const f = lastIdx(a, `frigo`), g = f + 1, ap = lastIdx(a, `appretto`), d0 = dinner(a);
  const appretto0 = endOf(a, ap) - startOf(a, ap);
  at(a, startOf(a, g));
  const rec = answer(a, g, `before`, `molto`);
  assert.equal(rec.st, `ok`);
  assert.equal(dinner(a), d0);
  assert.ok(endOf(a, ap) - startOf(a, ap) < appretto0, `l'appretto fuori dal frigo si accorcia`);
  assert.ok(endOf(a, f) - startOf(a, f) > a.run(`cook.steps[${f}].end-cook.steps[${f}].start`), `il frigo si allunga`);
  assert.match(rec.res.html, /in frigo ancora/);
});

test(`24 ore: puntata veloce prima del frigo, si va in frigo e domani si esce più tardi`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='h24';`); open(a);
  const g = idx(a, `staglio`), ap = lastIdx(a, `appretto`), d0 = dinner(a), out0 = startOf(a, ap);
  at(a, startOf(a, g) - 20 * MIN);              // controlla 20 minuti prima: ormai è pronto
  const rec = answer(a, g, `before`, `doppio`);
  assert.equal(rec.st, `ok`);
  assert.equal(dinner(a), d0);
  assert.ok(startOf(a, g) <= a.run(`__t`) + 1, `lo staglio si anticipa ad adesso`);
  assert.ok(startOf(a, ap) > out0, `i panetti escono dal frigo più tardi`);
});

test(`prova del dito: lento sposta il forno, pronto prima frena in frigo, andato oltre anticipa il forno`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='giornata';`); open(a);
  const g = idx(a, `preriscaldo`), st = idx(a, `stesura`), d0 = dinner(a);
  assert.equal(a.run(`cook.gates[${g}].before.id`), `proof`);
  // all'ora del forno ancora sodi: si aspetta prima di accenderlo
  at(a, startOf(a, g));
  let rec = answer(a, g, `before`, `meta`);
  assert.equal(rec.st, `wait`); assert.ok(dinner(a) > d0);
  // pronti già all'ora del forno: si accende e intanto frigo, la cena resta
  open(a); at(a, startOf(a, g));
  rec = answer(a, g, `before`, `pronto`);
  assert.equal(rec.st, `ok`); assert.equal(dinner(a), d0);
  assert.match(a.run(`ckAdjHtml(${st})`), /togli i panetti dal frigo/);
  // andati oltre un'ora prima dell'ora del forno: si anticipa (e si può tenere l'orario)
  open(a); at(a, startOf(a, g) - H);
  rec = answer(a, g, `before`, `oltre`);
  assert.ok(dinner(a) < d0, `il forno si anticipa`);
  assert.ok(rec.res.alt, `si può tenere l'orario`);
  a.run(`ckAnswer(${g},'before','oltre',{alt:true},true)`);
  assert.equal(dinner(a), d0);
});

test(`forno a legna: controllo prima di accendere il fuoco e di nuovo prima di stendere`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='giornata'; state.oven='legna';`); open(a);
  const pre = idx(a, `preriscaldo`), st = idx(a, `stesura`);
  assert.equal(a.run(`cook.gates[${pre}].before.id`), `proof`);
  assert.equal(a.run(`cook.gates[${st}].before.id`), `proof`);
  // pronti già due ore prima: si accende il fuoco e i panetti aspettano in frigo
  at(a, startOf(a, pre));
  const d0 = dinner(a), rec = answer(a, pre, `before`, `pronto`);
  assert.equal(rec.st, `ok`); assert.equal(dinner(a), d0);
  assert.match(rec.res.html, /in frigo per/);
  // al momento di stendere, ancora sodi: si aspetta con il forno caldo
  at(a, startOf(a, st));
  const r2 = answer(a, st, `before`, `meta`);
  assert.equal(r2.st, `wait`);
  assert.match(r2.res.html, /Tieni il forno caldo/);
});

test(`impasto: maglia debole fa impastare ancora, la temperatura cambia la puntata`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='giornata'; state.over={hyd:62};`); open(a);
  const i = idx(a, `impasto`), p = idx(a, `puntata`);
  assert.ok(!keys(a).some(k => /^pieghe/.test(k)), `con il 62% non ci sono pieghe`);
  at(a, endOf(a, i));
  // dichiarato fatto: arriva la domanda
  a.run(`cook.i=${i}; renderCook();`);
  a.run(`ckRec(${i},'after',true).st='ask'`);
  assert.match(screen(a, i), /maglia glutinica/);
  let rec = answer(a, i, `after`, `strappa`);
  assert.equal(rec.st, `wait`);
  assert.ok(startOf(a, p) >= rec.until - 1, `la puntata comincia dopo il nuovo impasto`);
  // alla terza volta si va avanti comunque
  answer(a, i, `after`, `strappa`); rec = answer(a, i, `after`, `strappa`);
  assert.equal(rec.st, `ok`);
  // impasto caldo: puntata più corta (in giornata non si anticipa la cena, quindi lo dice)
  open(a); at(a, endOf(a, i));
  const B0 = endOf(a, p) - startOf(a, p);
  rec = answer(a, i, `after`, `velo`, `{t:28}`);
  assert.equal(rec.st, `ok`);
  assert.match(rec.res.html, /28 °C/);
  assert.match(rec.res.html, /acqua a circa/);
  // 24 ore: il frigo assorbe e la puntata si accorcia davvero
  plan(a, `contemporanea`, `state.plan='h24'; state.over={hyd:62};`); open(a);
  const i2 = idx(a, `impasto`), p2 = idx(a, `puntata`), d0 = dinner(a);
  at(a, endOf(a, i2));
  const B1 = endOf(a, p2) - startOf(a, p2);
  answer(a, i2, `after`, `velo`, `{t:28}`);
  assert.ok(endOf(a, p2) - startOf(a, p2) < B1, `puntata più corta`);
  assert.equal(dinner(a), d0);
  assert.ok(B0 > 0);
});

test(`biga e poolish: maturità controllata prima del rimpasto`, () => {
  const a = app();
  for (const method of [`biga`, `poolish`]) {
    plan(a, `contemporanea`, `state.flour='forte'; applyChange({k:'method',v:'${method}'});`);
    a.run(`R=compute()`);
    if (a.run(`R.none`)) continue;
    open(a);
    const i = idx(a, `impasto`);
    assert.equal(a.run(`cook.gates[${i}].before.id`), `pref`, method);
    at(a, startOf(a, i));
    assert.match(screen(a, i), method === `biga` ? /La biga è matura/ : /Il poolish è maturo/);
    let rec = answer(a, i, `before`, `giovane`);
    assert.equal(rec.st, `wait`);
    rec = answer(a, i, `before`, `oltre`);
    assert.equal(rec.st, `ok`);
    assert.match(rec.res.html, /subito/);
  }
});

test(`lo stato dei controlli si salva e si ritrova riaprendo la modalità cucina`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.plan='giornata';`); open(a);
  const g = idx(a, `staglio`);
  at(a, startOf(a, g));
  answer(a, g, `before`, `uguale`);
  const os = a.run(`cook.os.slice()`);
  a.run(`cook.ck={}; cook.os=[]; openCook();`);
  assert.equal(a.run(`cook.ck['${g}:before'].st`), `wait`);
  assert.deepEqual(a.run(`cook.os`), os);
  // un controllo previsto più avanti si può anticipare
  open(a); a.run(`__t=null`);
  a.run(`cook.i=${g}; renderCook()`);
  assert.match(a.element(`#cook`).innerHTML, /Controlla adesso/);
});
