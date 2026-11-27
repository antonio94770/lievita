// Test della lista "Prima di partire": ingredienti da avere, attrezzatura e controlli per ogni ricetta.
// Si eseguono con:  node --test test/prima-di-partire.test.js
const test = require(`node:test`);
const assert = require(`node:assert/strict`);
const fs = require(`node:fs`);
const path = require(`node:path`);
const vm = require(`node:vm`);

const html = fs.readFileSync(path.join(__dirname, `..`, `index.html`), `utf8`);
const all = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const ei = all.findIndex(m => /id="engine"/.test(m[1]));
const scripts = all.slice(ei).map(m => m[2]);
const H = 36e5;

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
  return { run: code => vm.runInContext(code, ctx), element, data };
}
function setup(a, style, extra = ``) {
  a.run(`state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan'; state.method='diretto';
    ui.reviewed=false; state.link=null; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(Date.now()+3*24*H); state.dinner.setHours(20,0,0,0); ${extra}; R=compute();`);
  return a.run(`R.none?null:readyList(R)`);
}
const ids = l => l.map(x => x.id);

test(`ogni stile con ogni forno ammesso ha ingredienti, attrezzatura e controlli, senza voci doppie`, () => {
  const a = app();
  for (const style of a.run(`Object.keys(STYLES)`)) {
    const cat = a.run(`catOf('${style}')`);
    const ovens = a.run(`Object.keys(OVENS).filter(k=>OVENS[k].cats.includes('${cat}')&&(!STYLES['${style}'].ovens||STYLES['${style}'].ovens.includes(k)))`);
    for (const oven of ovens) for (const plan of [`giornata`, `h24`]) {
      const L = setup(a, style, `state.oven='${oven}'; state.plan='${plan}'`);
      assert.ok(L, `${style} ${oven} ${plan}`);
      const tag = `${style} ${oven} ${plan}`;
      for (const k of [`buy`, `tools`, `checks`]) {
        assert.ok(L[k].length > 0, `${tag} ${k}`);
        assert.equal(new Set(ids(L[k])).size, L[k].length, `${tag} ${k} doppi: ${ids(L[k])}`);
        for (const x of L[k]) assert.ok(!/undefined|NaN|Infinity/.test(x.name + x.qty + x.note), `${tag} ${x.id}: ${x.name} ${x.qty} ${x.note}`);
      }
      for (const id of [`farina`, `sale`, `lievito`]) assert.ok(ids(L.buy).includes(id), `${tag} ${id}`);
      assert.ok(ids(L.tools).includes(`bilancia`), tag);
      assert.ok(ids(L.checks).includes(`orari`) && ids(L.checks).includes(`forno`), tag);
      // con una notte in frigo serve spazio in frigo
      if (a.run(`R.pl.fridgeH`) > 0) assert.ok(ids(L.checks).includes(`frigo`), tag);
      // l'HTML del pannello si disegna
      assert.match(a.run(`readyHtml(R)`), /data-ready="b\.farina"/, tag);
    }
  }
});

test(`le quantità da avere sono quelle della ricetta`, () => {
  const a = app();
  const L = setup(a, `classica`, `state.n=4; state.oven='casa_pietra'`);
  const I = a.run(`R.I`);
  const far = L.buy.find(x => x.id === `farina`);
  assert.equal(far.qty, `${Math.round(I.flour)} g`);
  assert.equal(L.buy.find(x => x.id === `sale`).qty, `${Math.round(I.salt)} g`);
  // condimento per 4 margherite, semola per stendere, pala e pietra
  assert.equal(L.buy.find(x => x.id === `mozzarella`).qty, `400 g`);
  assert.ok(ids(L.buy).includes(`semola`));
  assert.ok(ids(L.tools).includes(`pala`) && ids(L.tools).includes(`pietra`));
  // mix: due farine, 70 e 30
  const M = setup(a, `canotto`, `state.flour='mix'`);
  const f = a.run(`R.I.flour`);
  assert.equal(M.buy.find(x => x.id === `farina`).qty, `${Math.round(f * .7)} g`);
  assert.equal(M.buy.find(x => x.id === `manitoba`).qty, `${Math.round(f * .3)} g`);
  // bun: latte, uova (impasto + spennellata), burro e sesamo; pennello e teglia
  const B = setup(a, `bun`, `state.n=8`);
  const eg = a.run(`R.I.egg`);
  assert.equal(B.buy.find(x => x.id === `uova`).qty, `${Math.ceil(eg / 50) + 1}`);
  assert.ok(ids(B.buy).includes(`latte`) && ids(B.buy).includes(`sesamo`));
  assert.ok(ids(B.tools).includes(`pennello`) && ids(B.tools).includes(`pentolino`));
  // mafalda: sesamo e spruzzino; pentola di ghisa per la pagnotta
  const S = setup(a, `siciliano`, `state.n=2`);
  assert.equal(S.buy.find(x => x.id === `sesamo`).qty, `50 g`);
  const P = setup(a, `pagnotta`, `state.oven='pentola'`);
  assert.ok(ids(P.tools).includes(`pentola`) && !ids(P.tools).includes(`vapore`));
});

test(`con biga o poolish: contenitore per il prefermento; con un preparato già fatto solo la farina del rimpasto`, () => {
  const a = app();
  for (const m of [`biga`, `poolish`]) {
    const L = setup(a, `contemporanea`, `state.flour='forte'; applyChange({k:'method',v:'${m}'})`);
    assert.ok(L && ids(L.tools).includes(`barattolo`), m);
    assert.equal(L.buy.find(x => x.id === `farina`).qty, `${Math.round(a.run(`R.I.flour`))} g`, m);
  }
  // preparato già fatto: rimpasto fra un'ora, come in test/prefermenti.test.js
  const r = a.run(`R`), fh = r.pl.total - .25 - r.pl.pref.hours;
  a.run(`state.prepMode='existing';
    state.dinner=new Date(Date.now()+(1+${fh}+${r.pl.stesDur / 60 + r.pl.bk.per / 60})*H);
    state.batch={flour:${r.I.pref.flour},water:${r.I.pref.water},yeast:${r.I.pref.yeast},started:Date.now()+(1-.25-${r.pl.pref.hours})*H,cold:0};
    R=compute();`);
  assert.ok(!a.run(`R.none`) && a.run(`!!R.pl.pref.actual`));
  const ex = a.run(`readyList(R)`);
  assert.equal(ex.buy.find(x => x.id === `farina`).qty, `${Math.round(a.run(`R.I.final.flour`))} g`);
  assert.ok(!ids(ex.tools).includes(`barattolo`));
});

test(`le spunte si salvano, si contano e ripartono da zero se cambia il piano; la modalità cucina parte dalla lista`, () => {
  const a = app();
  setup(a, `classica`);
  const [, t] = a.run(`readyCount(readyList(R),{})`);
  a.run(`{ const s=readyGet(); s.on['b.farina']=1; s.on['t.bilancia']=1; readySet(s); }`);
  assert.equal(a.run(`readyCountText(R)`), `2 di ${t}`);
  a.run(`state.n=6; R=compute();`);
  assert.equal(a.run(`readyCountText(R)`), `0 di ${a.run(`readyCount(readyList(R),{})[1]`)}`);
  // dal pulsante del piano si apre prima la lista; da altre parti (ripresa, test) no
  a.run(`openCook({ready:true});`);
  assert.equal(a.run(`cook.view`), `ready`);
  assert.match(a.element(`#cook`).innerHTML, /Hai tutto\?/);
  a.run(`closeCook(); openCook();`);
  assert.notEqual(a.run(`cook.view`), `ready`);
  // dopo "iniziamo" non si ripropone
  a.run(`closeCook(); { const s=readyGet(); s.go=true; readySet(s); } openCook({ready:true});`);
  assert.notEqual(a.run(`cook.view`), `ready`);
});
