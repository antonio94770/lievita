// Pagina Quando: da un'ora d'inizio alle ore in cui può essere pronto. Si eseguono con:  node --test test/quando.test.js
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
// "adesso" fisso: tra tre giorni alle 14, lontano dalla notte
const day = new Date(Date.now() + 3 * 24 * H); day.setHours(14, 0, 0, 0);
const NOW = day.getTime();
function setup(a, style, extra = ``) {
  a.run(`__t=${NOW}; state.method='diretto'; state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null;
    state.prepMode='plan'; state.room=20; state.fridge=4; ui.reviewed=false; state.link=null; requestChange({k:'style',v:'${style}'}); ${extra}`);
}
const opts = (a, start) => a.run(`readyOptions(state,${start},${NOW})`);
// applica la scelta come fa il pulsante e ricalcola il piano
function choose(a, o, start) {
  a.run(`state.prepMode='from'; state.prepFrom=${start}; state.dinner=new Date(${o.t}); state.plan='${o.pk}';
    ${o.n ? `state.n=${o.n}; state.over.ball=${o.ball};` : ``} R=compute();`);
  return a.run(`R`);
}

test(`da un'ora d'inizio: per ogni stile l'ora più vicina possibile, e un quarto d'ora prima non si fa`, () => {
  const a = app();
  for (const style of a.run(`Object.keys(STYLES)`)) {
    setup(a, style);
    const start = NOW + 2 * H, list = opts(a, start);
    assert.ok(list.length >= 2, `${style}: ${JSON.stringify(list)}`);
    assert.ok(list.some(o => o.pk === `giornata`) && list.some(o => o.pk === `h24`), style);
    for (const o of list) {
      const tag = `${style} ${o.pk}${o.n ? ` ${o.n}×${o.ball}` : ``}`;
      const h = new Date(o.t).getHours() + new Date(o.t).getMinutes() / 60;
      assert.ok(h >= 7 && h <= 23, `${tag}: ${h}`);
      setup(a, style);
      const r = choose(a, o, start);
      assert.ok(!r.none && r.pk === o.pk, `${tag}: ${r.reason}`);
      assert.ok((r.pl.begin ?? r.pl.mixStart) >= start, `${tag}: non si parte prima dell'ora indicata`);
      // un quarto d'ora prima (se di giorno) lo stesso percorso non è possibile
      const e = o.t - 15 * 60e3, eh = new Date(e).getHours();
      if (eh >= 7 && !o.n) assert.equal(a.run(`state.dinner=new Date(${e}); buildPlan('${o.pk}',params(state),state,${NOW}).ok`), false, `${tag}: non è il più vicino`);
    }
    // in ordine di tempo
    assert.deepEqual(list.map(o => o.t), list.map(o => o.t).slice().sort((x, y) => x - y), style);
  }
});

test(`pagnotta dalle 16: pronta alle 22, prima con due pani piccoli sulla teglia`, () => {
  const a = app();
  setup(a, `pagnotta`, `state.n=1; state.oven='casa_teglia'; state.flour='forte'; state.over={hyd:77.5,salt:2.5,ball:730};`);
  const start = NOW + 2 * H, list = opts(a, start);
  const g = list.find(o => o.pk === `giornata` && !o.n), small = list.find(o => o.n);
  assert.equal(new Date(g.t).getHours(), 22);
  assert.ok(small, JSON.stringify(list));
  assert.equal(small.n, 2); assert.equal(small.ball, 360);
  assert.ok(small.t <= g.t - 30 * 60e3);
  // la stessa farina in tutto: i pezzi non pesano più del pane intero
  assert.ok(small.n * small.ball <= 730);
  const r = choose(a, small, start);
  assert.equal(r.I.n, 2);
  assert.equal(r.pl.bk.cool, 1);
  // stampo e pugliese restano interi; i bun non si dividono
  for (const style of [`cassetta`, `pugliese`, `bun`]) { setup(a, style); assert.ok(!opts(a, start).some(o => o.n), style); }
});

test(`biga e poolish: l'ora più vicina con il prefermento`, () => {
  const a = app();
  for (const m of [`biga`, `poolish`]) {
    setup(a, `classica`, `state.method='${m}'; state.flour='forte';`);
    const list = opts(a, NOW + H);
    assert.equal(list.length, 1); assert.equal(list[0].pk, `prefermento`);
    const r = choose(a, list[0], NOW + H);
    assert.ok(!r.none, r.reason);
  }
});

test(`l'ora d'inizio limita il piano, anche nei giorni prima`, () => {
  const a = app();
  setup(a, `contemporanea`);
  const start = NOW + 5 * H;
  assert.equal(a.run(`preparationWindow({prepMode:'from',prepFrom:${start}},${NOW}).start`), start);
  assert.equal(a.run(`preparationWindow({prepMode:'from',prepFrom:${NOW - H}},${NOW}).start`), NOW);
  assert.equal(a.run(`preparationWindow({prepMode:'from'},${NOW}).start`), NOW);
  // 24 ore con la cena domani alle 20: si parte dopo l'ora indicata
  a.run(`state.prepMode='from'; state.prepFrom=${start}; state.plan='h24'; state.dinner=new Date(${NOW}+30*H); R=compute();`);
  if (!a.run(`R.none`) && a.run(`R.pk`) === `h24`) assert.ok(a.run(`R.pl.mixStart`) >= start);
});

test(`pagina Quando: ora d'inizio, scelte da toccare e scorciatoie`, () => {
  const a = app();
  setup(a, `pagnotta`, `state.n=1; state.oven='casa_teglia'; state.over={ball:900};`);
  a.run(`applyChange({k:'prepMode',v:'from'})`);
  assert.ok(a.run(`state.prepFrom`) >= NOW);
  a.run(`state.prepFrom=${NOW + 2 * H}; state.dinner=new Date(${NOW}+3*H); R=compute();`);
  const html = a.run(`whenAvail()`);
  assert.match(html, /id="prep-from"/);
  assert.match(html, /Quando può essere pronto\?/);
  assert.match(html, /Partendo/);
  assert.match(html, /data-ready-at="\d+" data-pk="giornata" data-n="2" data-ball="450"/);
  assert.match(html, /Scegli uno degli orari possibili qui sotto/);
  assert.ok(!/undefined|NaN|Infinity/.test(html));
  // il pulsante: ora, pani e percorso
  const small = opts(a, NOW + 2 * H).find(o => o.n);
  a.run(`applyReady({readyAt:'${small.t}',pk:'giornata',n:'2',ball:'450'})`);
  assert.equal(a.run(`+state.dinner`), small.t);
  assert.equal(a.run(`state.n`), 2);
  assert.equal(a.run(`state.over.ball`), 450);
  assert.equal(a.run(`state.plan`), `giornata`);
  assert.ok(!a.run(`R.none`));
  // con "solo il giorno stesso" niente scelte, ma l'avviso indica dove trovarle
  a.run(`state.prepMode='day'; state.prepClock='16:00'; state.dinner=new Date(${NOW}+3*H);`);
  const d = a.run(`whenAvail()`);
  assert.doesNotMatch(d, /data-ready-at/);
  assert.match(d, /Posso iniziare da un’ora precisa/);
  // scorciatoie: il pane a pranzo e a cena, la pizza alle 20
  a.run(`__t=null;`);
  const chips = a.run(`dinnerChips()`), times = [...chips.matchAll(/data-dinner-at="(\d+)"/g)].map(m => new Date(+m[1]));
  assert.equal(times.length, 4);
  assert.ok(times.every(t => [`12:30`, `19:00`].includes(`${t.getHours()}:${String(t.getMinutes()).padStart(2, `0`)}`)), chips);
  setup(a, `contemporanea`); a.run(`__t=null;`);
  const pz = [...a.run(`dinnerChips()`).matchAll(/data-dinner-at="(\d+)"/g)].map(m => new Date(+m[1]));
  assert.ok(pz.every(t => t.getHours() === 20 && t.getMinutes() === 0));
});

test(`biga con una farina non adatta: nessuna scelta, senza errori`, () => {
  const a = app();
  setup(a, `classica`, `state.method='biga'; state.flour='media';`);
  assert.equal(opts(a, NOW + H).length, 0);
  a.run(`R=compute();`);
  assert.match(a.run(`whenAvail()`), /Nessun percorso possibile/);
});

test(`spunta "anche di notte": orari tra le 23 e le 7 permessi ovunque`, () => {
  const a = app();
  // inizio alle 20: senza la spunta il pane in giornata è pronto il giorno dopo, con la spunta nella notte
  setup(a, `pagnotta`, `state.n=1; state.oven='casa_teglia';`);
  const start = NOW + 6 * H;
  const g0 = opts(a, start).find(o => o.pk === `giornata` && !o.n);
  a.run(`state.nightOk=true;`);
  assert.equal(a.run(`nightAt(new Date(${NOW}).setHours(2))`), false);
  const g1 = opts(a, start).find(o => o.pk === `giornata` && !o.n);
  assert.ok(g1.t < g0.t, `${new Date(g1.t)} ${new Date(g0.t)}`);
  const h = new Date(g1.t).getHours();
  assert.ok(h >= 23 || h < 7, `pronto di notte: ${h}`);
  const r = choose(a, g1, start);
  assert.ok(!r.none && r.pk === `giornata`, r.reason);
  assert.ok(!r.W.some(w => /di notte/.test(w.t)), `nessun avviso sulla notte`);
  // frigo lungo: senza la spunta un impasto alle 2 di notte si sposta, con la spunta resta lì
  const two = new Date(NOW); two.setHours(2, 0, 0, 0);
  assert.equal(a.run(`avoidNight(${+two},2,18,${+two - 24 * H}).mix`), +two);
  a.run(`state.nightOk=false;`);
  assert.notEqual(a.run(`avoidNight(${+two},2,18,${+two - 24 * H}).mix`), +two);
  // la spunta si ricorda e compare nella pagina
  a.run(`state.nightOk=true; rememberForm();`);
  assert.equal(a.run(`mem.last.nightOk`), true);
  a.run(`R=compute();`);
  assert.match(a.run(`whenAvail()`), /id="night-ok" checked/);
  a.run(`state.nightOk=false;`);
});
