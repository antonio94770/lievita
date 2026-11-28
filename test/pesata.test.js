// Pesata degli ingredienti: un passaggio con il suo tempo prima di impastare. Si eseguono con:  node --test test/pesata.test.js
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
function plan(a, style, pk, extra = ``) {
  a.run(`__t=${NOW}; state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan';
    state.room=20; state.fridge=4; ui.reviewed=false; state.link=null; state.method='diretto'; state.warm=false; state.nightOk=false; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(${NOW}+3*24*${H}); state.dinner.setHours(STYLES['${style}'].bread?19:20,30,0,0); state.plan='${pk}'; ${extra} R=compute();`);
  return a.run(`R.none?null:{pk:R.pk,steps:R.steps.map(s=>({key:s.key,start:s.start,end:s.end,hands:!!s.hands,body:s.body})),begin:R.pl.begin,mixStart:R.pl.mixStart,weighLead:R.pl.weighLead,tzLead:R.pl.tzLead||0,pref:!!R.pl.pref,flour:R.I.flour,salt:R.I.salt,tz:!!R.I.tz}`);
}
const styles = a => a.run(`Object.keys(STYLES)`);
const bun = (a, s) => a.run(`!!STYLES['${s}'].bun`);
const bread = (a, s) => a.run(`!!STYLES['${s}'].bread`);
const grams = x => `${Math.round(x)} g`;

test(`ogni stile: la pesata viene subito prima dell'impasto, 10 minuti (15 per i bun), e il piano parte da lì`, () => {
  const a = app();
  for (const style of styles(a)) for (const pk of [`giornata`, `h24`]) {
    const R = plan(a, style, pk);
    const tag = `${style} ${pk}`;
    assert.ok(R && R.pk === pk, tag);
    const ps = R.steps.find(s => s.key === `pesata`), im = R.steps.find(s => s.key === `impasto`);
    assert.ok(ps && im, tag);
    assert.equal(ps.end, im.start, tag);
    assert.equal(ps.end - ps.start, (bun(a, style) ? 15 : 10) * MIN, tag);
    assert.ok(ps.hands, tag);
    // viene prima dell'impasto nella lista; con il tangzhong l'inizio resta quello del tangzhong
    const keys = R.steps.map(s => s.key);
    assert.equal(keys.indexOf(`pesata`) + 1, keys.indexOf(`impasto`), tag);
    const pot = R.steps.find(s => s.key === `patate`);
    assert.equal(R.begin, pot ? R.mixStart - 1.5 * H : R.tz ? R.mixStart - H : ps.start, tag);
    assert.equal(Math.min(...R.steps.map(s => s.start)), R.begin, tag);
    // le dosi da pesare ci sono, e l'impasto non chiede di pesarle di nuovo
    assert.ok(ps.body.includes(`<b>${grams(R.salt)}</b> di sale`), tag);
    if (!R.tz) assert.ok(ps.body.includes(`<b>${grams(R.flour)}</b> di farina`), tag);
    assert.ok(!/Pesa tutto prima di iniziare/.test(im.body), tag);
    assert.ok(!/undefined|NaN|\[object Object\]/.test(ps.body), tag);
  }
});

test(`la pesata non cambia dosi né lievito: sposta solo l'inizio`, () => {
  const a = app();
  for (const style of [`contemporanea`, `teglia`, `pagnotta`, `bun`]) for (const pk of [`giornata`, `h24`]) {
    a.run(`__t=${NOW}`);
    plan(a, style, pk);
    const yp = a.run(`R.pl.yp`), phases = a.run(`JSON.stringify(R.pl.phases)`);
    // le fasi dell'impasto non contengono la pesata: il lievito si calcola solo da quelle
    assert.ok(!/pesata/.test(phases), style);
    assert.ok(yp > 0, style);
  }
});

test(`in giornata la pesata conta nel tempo che serve, e non cade prima di adesso`, () => {
  const a = app();
  for (const style of [`contemporanea`, `pagnotta`, `bun`]) {
    // adesso alle 10:15, prima pizza o pane il più presto possibile
    a.run(`__t=${NOW}; state.prepMode='now'; requestChange({k:'style',v:'${style}'}); state.method='diretto'; state.over={}; state.room=22;`);
    const r = a.run(`(()=>{ state.dinner=new Date(${NOW}+2*${H}); return buildPlan('giornata',params(state),state,${NOW}); })()`);
    assert.equal(r.ok, false, style);
    assert.ok(r.earliest, style);
    assert.match(r.reason, /minuti per pesare|tangzhong/, style);
    const ok = a.run(`(()=>{ state.dinner=new Date(${r.earliest}); return buildPlan('giornata',params(state),state,${NOW}); })()`);
    assert.equal(ok.ok, true, style);
    assert.ok(ok.begin >= NOW, `${style}: inizia ${new Date(ok.begin)}`);
    // un quarto d'ora prima non ci sta
    const no = a.run(`(()=>{ state.dinner=new Date(${r.earliest - 15 * MIN}); return buildPlan('giornata',params(state),state,${NOW}); })()`);
    assert.equal(no.ok, false, style);
  }
});

test(`la pesata non si fa di notte`, () => {
  const a = app();
  for (const style of [`contemporanea`, `teglia`, `pagnotta`]) for (let h = 6; h <= 23; h++) {
    const r = a.run(`(()=>{ __t=${NOW}; state.prepMode='plan'; state.nightOk=false; requestChange({k:'style',v:'${style}'}); state.method='diretto'; state.over={};
      state.dinner=new Date(${NOW}+3*24*${H}); state.dinner.setHours(${h},0,0,0); return buildPlan('h24',params(state),state,${NOW}); })()`);
    if (!r.ok) continue;
    const ps = r.mixStart - r.weighLead * H;
    if (r.shiftNote) assert.equal(a.run(`nightAt(${ps})`), false, `${style} alle ${h}`);
  }
});

test(`con un prefermento la pesata del rimpasto si fa mentre matura; il controllo della maturità viene prima`, () => {
  const a = app();
  for (const method of [`biga`, `poolish`]) {
    const R = plan(a, `contemporanea`, `prefermento`, `state.flour='forte'; applyChange({k:'method',v:'${method}'});`);
    if (!R) continue;
    const ps = R.steps.find(s => s.key === `pesata`), im = R.steps.find(s => s.key === `impasto`), mat = R.steps.find(s => s.key === `maturazione`);
    assert.ok(ps && im && mat, method);
    assert.equal(ps.end, im.start, method);
    // l'inizio resta la preparazione del prefermento: la pesata non aggiunge tempo
    assert.equal(R.begin, R.mixStart, method);
    assert.ok(ps.start >= mat.start, method);
    assert.match(ps.body, /prefermento non si pesa/, method);
    assert.ok(!/undefined|NaN/.test(ps.body), method);
  }
});

test(`la pesata ha l'animazione, il nome per le note e un promemoria nel calendario`, () => {
  const a = app();
  plan(a, `contemporanea`, `h24`);
  assert.ok(a.run(`howScenes('pesata',howCtx()).length`) > 0);
  assert.match(a.run(`HOW.weigh(howCtx())`), /<svg/);
  assert.equal(a.run(`STEP_NAMES.pesata`), `Pesa gli ingredienti`);
  assert.ok(a.run(`calSteps().some(s=>s.key==='pesata')`));
  assert.match(a.run(`buildIcs()`), /Pesa gli ingredienti/);
});

/* ---------- patate lesse dei bun e condimento della pizza ---------- */
test(`smash con patate: le patate si lessano un'ora e mezza prima di impastare, e il piano parte da lì`, () => {
  const a = app();
  for (const pk of [`giornata`, `h24`]) for (const room of [16, 20, 26]) {
    const R = plan(a, `smash`, pk, `state.room=${room};`);
    const tag = `${pk} ${room} °C`;
    if (!R) continue;
    const pt = R.steps.find(s => s.key === `patate`), im = R.steps.find(s => s.key === `impasto`), ps = R.steps.find(s => s.key === `pesata`);
    assert.ok(pt && pt.hands, tag);
    assert.equal(im.start - pt.start, 1.5 * H, tag);
    assert.equal(pt.end - pt.start, 35 * MIN, tag);
    assert.ok(pt.end <= ps.start, `${tag}: si raffreddano prima della pesata`);
    assert.equal(R.begin, pt.start, tag);
    assert.match(pt.body, /schiacciapatate/, tag);
    assert.ok(!/undefined|NaN/.test(pt.body), tag);
    if (pk === `h24`) assert.equal(a.run(`nightAt(${pt.start})`), false, `${tag}: non di notte`);
  }
  // senza patate nessun passaggio
  const B = plan(a, `bun`, `giornata`);
  assert.ok(!B.steps.some(s => s.key === `patate`));
  assert.ok(a.run(`HOW.potato()`).includes(`<svg`));
});

test(`pizza: il condimento si prepara durante l'appretto, circa due ore prima di stendere`, () => {
  const a = app();
  for (const style of [`classica`, `contemporanea`, `canotto`, `romana`, `teglia`]) for (const pk of [`giornata`, `h24`]) {
    const R = plan(a, style, pk);
    const tag = `${style} ${pk}`;
    if (!R) continue;
    const cd = R.steps.find(s => s.key === `condimento`), st = R.steps.find(s => s.key === `stesura`), ap = R.steps.filter(s => s.key === `appretto`).pop();
    assert.ok(cd && cd.hands, tag);
    assert.ok(cd.start >= ap.start + 15 * MIN, tag);
    assert.ok(st.start - cd.start <= 2 * H && st.start - cd.start >= 30 * MIN, tag);
    assert.equal(cd.end - cd.start, 15 * MIN, tag);
    assert.match(cd.body, /Mozzarella/, tag);
    assert.ok(!/undefined|NaN/.test(cd.body), tag);
    // la stesura non chiede più di tagliare la mozzarella all'ultimo
    assert.ok(!/un paio d'ore prima/.test(st.body), tag);
  }
  // pane e bun no
  assert.ok(!plan(a, `pagnotta`, `h24`).steps.some(s => s.key === `condimento`));
  assert.ok(a.run(`HOW.drain()`).includes(`<svg`));
  assert.ok(a.run(`calSteps().length`) > 0);
});

test(`patate e condimento nella lista Prima di partire, con gli orari del piano`, () => {
  const a = app();
  plan(a, `contemporanea`, `h24`);
  const c = a.run(`JSON.stringify(readyList(R).checks)`);
  assert.match(c, /Spazio in frigo per la mozzarella/);
  assert.match(c, new RegExp(a.run(`hm(R.steps.find(s=>s.key==='condimento').start)`)));
  plan(a, `smash`, `giornata`);
  assert.match(a.run(`JSON.stringify(readyList(R).checks)`), /un'ora e mezza prima di impastare/);
});
