// Pane con poco tempo: prima lievitazione al caldo (forno spento con la luce). Si eseguono con:  node --test test/caldo.test.js
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
  return { run };
}
// "adesso" fisso: tra tre giorni alle 10:15
const day = new Date(Date.now() + 3 * 24 * H); day.setHours(10, 15, 0, 0);
const NOW = day.getTime();
const OVENS = [`casa_teglia`, `casa_pietra`, `casa_acciaio`, `pentola`, `legna`];
function setup(a, style, extra = ``) {
  a.run(`__t=${NOW}; state.method='diretto'; state.over={}; state.plan=null; state.prepMode='now'; state.warm=false; state.nightOk=false;
    state.room=20; state.fridge=4; ui.reviewed=false; state.link=null; requestChange({k:'style',v:'${style}'}); ${extra}`);
}
// piano in giornata con il pane pronto (raffreddato) all'ora indicata
const plan = (a, t) => a.run(`state.dinner=new Date(${t}); buildPlan('giornata',params(state),state,${NOW})`);
const breads = a => a.run(`Object.keys(STYLES).filter(k=>STYLES[k].bread&&!STYLES[k].bun)`);

test(`senza la spunta il pane in giornata vuole sempre 3 ore; con la spunta si accorcia al caldo`, () => {
  const a = app(), used = new Set();
  for (const style of breads(a)) for (const room of [18, 20, 22]) {
    setup(a, style, `state.room=${room};`);
    const ovens = a.run(`STYLES.${style}.ovens||null`) || OVENS;
    for (const oven of ovens) {
      a.run(`state.oven='${oven}'`);
      // la prima ora possibile con il caldo
      a.run(`state.warm=true`);
      const r = a.run(`earliestReady('giornata',state,${NOW},${NOW},{warm:true})`);
      const tag = `${style} ${oven} ${room} °C`;
      assert.ok(r, tag);
      // il pan bauletto (tanto zucchero e grassi) al fresco resta oltre il 3% anche al caldo: niente scorciatoia
      if (!r.warm) { assert.ok(!a.run(`readyOptions(state,${NOW},${NOW})`).some(o => o.warm), tag); a.run(`state.warm=false`); continue; }
      used.add(style);
      a.run(`state.warm=false`);
      const cold = plan(a, r.t);
      assert.equal(cold.ok, false, `${tag}: senza spunta non si fa`);
      assert.ok(cold.short, tag);
      a.run(`state.warm=true`);
      const pl = plan(a, r.t);
      assert.ok(pl.ok && pl.warm, `${tag}: ${pl.reason}`);
      const ph = Object.fromEntries(pl.phases.map(p => [p[0], p]));
      assert.equal(ph.puntata[2], 27, tag);
      assert.ok(ph.puntata[1] >= 1, `${tag}: almeno un'ora di puntata`);
      assert.equal(ph.appretto[2], room, `${tag}: l'appretto resta a temperatura di casa`);
      assert.ok(!ph.frigobreve, `${tag}: niente frigo breve con poco tempo`);
      assert.ok(pl.yp <= 3, `${tag}: lievito ${pl.yp}`);
      assert.ok(pl.mixStart >= NOW, tag);
      // il forno si accende dopo che l'impasto ne è uscito (tranne il forno a legna)
      const puntEnd = pl.mixStart + (.5 + ph.puntata[1]) * H;
      if (oven !== `legna`) assert.ok(puntEnd <= pl.stesStart - pl.bk.preheat * MIN + 1, `${tag}: forno occupato`);
      // meno di 3 ore e prima di quanto si potrebbe senza caldo
      assert.ok((pl.stesStart - pl.mixStart) / H < 3, tag);
    }
  }
  for (const style of [`pagnotta`, `filoni`, `ciabatta`, `siciliano`, `semola`]) assert.ok(used.has(style), style);
});

test(`il caldo si usa solo quando serve: con 3 ore o più il piano resta quello di sempre`, () => {
  const a = app();
  setup(a, `pagnotta`, `state.warm=true; state.room=20;`);
  const pl = plan(a, NOW + 8 * H);
  assert.ok(pl.ok && !pl.warm);
  assert.ok(pl.phases.every(p => p[2] !== 27));
});

test(`niente caldo per i bun e con la casa già calda`, () => {
  const a = app();
  setup(a, `bun`, `state.warm=true;`);
  assert.ok(!a.run(`readyOptions(state,${NOW},${NOW})`).some(o => o.warm));
  setup(a, `pagnotta`, `state.warm=true; state.room=26;`);
  assert.ok(!a.run(`readyOptions(state,${NOW},${NOW})`).some(o => o.warm));
  const pl = plan(a, NOW + 2.75 * H);
  assert.ok(!pl.ok || !pl.warm);
});

test(`la pagina Quando propone il caldo con l'ora di sfornatura, e la scelta attiva la spunta`, () => {
  const a = app();
  setup(a, `pagnotta`, `state.room=22; state.oven='casa_teglia';`);
  const list = a.run(`readyOptions(state,${NOW},${NOW})`);
  const w = list.find(o => o.warm), g = list.find(o => o.pk === `giornata` && !o.warm && !o.n);
  assert.ok(w && g, JSON.stringify(list));
  assert.ok(w.t <= g.t - 30 * MIN);
  for (const o of list) if (o.out != null) assert.ok(o.out < o.t, `sforni prima del pane pronto`);
  a.run(`applyReady({readyAt:'${w.t}',pk:'giornata',warm:'1'})`);
  assert.equal(a.run(`state.warm`), true);
  const R = a.run(`R=compute()`);
  assert.ok(R.pl.warm);
  assert.equal(R.I.ddt, 26);
  assert.ok(R.I.waterT > 30 && R.I.waterT <= 35, `acqua ${R.I.waterT}`);
  const punt = R.steps.find(s => s.key === `puntata`);
  assert.match(punt.body, /forno spento con <b>solo la luce accesa<\/b>/);
  assert.ok(R.W.some(x => /al caldo/.test(x.t)));
  assert.ok(!R.W.some(x => /serve tanto lievito/.test(x.t)));
  // la spunta compare nella pagina Quando
  assert.match(a.run(`whenAvail()`), /id="warm-ok" checked/);
});

test(`la spunta si ricorda e una preparazione salvata prima resta valida`, () => {
  const a = app();
  setup(a, `pagnotta`, `state.warm=true;`);
  a.run(`rememberForm()`);
  assert.equal(a.run(`mem.last.warm`), true);
  assert.equal(a.run(`cookCfg().warm`), true);
  a.run(`state.warm=false`);
  const old = a.run(`(()=>{const c=cookCfg(); delete c.warm; return {cfg:c,t0:${NOW},done:[true]};})()`);
  assert.equal(a.run(`sameCookCfg(${JSON.stringify(old)})`), true);
});
