// Test delle animazioni "come si fa" (HOW, howScenes). Si eseguono con:  node --test test/come-si-fa.test.js
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

function plan(a, style, extra = ``) {
  a.run(`state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan'; state.n=4;
    ui.reviewed=false; state.link=null; state.method='diretto'; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(Date.now()+5*24*H); state.dinner.setHours(20,0,0,0); ${extra} R=compute();`);
  return a.run(`R`);
}
const sceneOk = (svg) => /^<svg class="hw" viewBox="0 0 200 140"/.test(svg) && !/undefined|NaN/.test(svg);

test(`ogni passaggio di ogni stile, forno e metodo ha la sua animazione`, () => {
  const a = app();
  const styles = a.run(`Object.keys(STYLES)`);
  const ovens = a.run(`Object.keys(OVENS)`);
  let seen = new Set();
  for (const style of styles) for (const oven of ovens) for (const mixer of [false, true]) for (const plan24 of [`giornata`, `h24`]) {
    if (!a.run(`OVENS['${oven}'].cats.includes(catOf('${style}'))&&(!STYLES['${style}'].ovens||STYLES['${style}'].ovens.includes('${oven}'))`)) continue;
    const R = plan(a, style, `state.oven='${oven}'; state.mixer=${mixer}; state.plan='${plan24}';`);
    if (R.none) continue;
    for (const s of a.run(`R.steps.map(s=>s.key)`)) {
      const sc = a.run(`howScenes('${s}',howCtx())`);
      assert.ok(sc.length > 0, `${style} ${oven}: manca l'animazione per ${s}`);
      for (const [svg, cap] of sc) { assert.ok(sceneOk(svg), `${style} ${oven} ${s}: disegno non valido`); assert.ok(cap.length > 20); }
      seen.add(s.replace(/\d+$/, ``));
    }
  }
  for (const k of [`impasto`, `puntata`, `pieghe`, `staglio`, `formatura`, `frigo`, `appretto`, `preriscaldo`, `stesura`, `cottura`, `incisione`, `raffreddamento`, `tangzhong`]) assert.ok(seen.has(k), `non provato: ${k}`);
});

test(`biga e poolish: prefermento, maturazione e frigo hanno l'animazione`, () => {
  const a = app();
  for (const m of [`biga`, `poolish`]) {
    const R = plan(a, `contemporanea`, `state.oven='portatile'; state.method='${m}'; state.prefPct=${m === `biga` ? 100 : 30};`);
    if (R.none) continue;
    for (const s of a.run(`R.steps.map(s=>s.key)`)) assert.ok(a.run(`howScenes('${s}',howCtx()).length`) > 0, `${m}: manca ${s}`);
  }
  // biga in frigo: entra, riposa, esce
  for (const dir of [`in`, `rest`, `out`]) assert.ok(sceneOk(a.run(`HOW.fridge(howCtx(),'${dir}')`)));
});

test(`cucina e piano mostrano i gesti e come deve venire il prodotto`, () => {
  const a = app();
  plan(a, `contemporanea`, `state.oven='portatile';`);
  a.run(`ui.page=5; renderAll();`);
  const out = a.element(`#out`).innerHTML;
  assert.match(out, /Guarda come si fa/);
  assert.match(out, /macchie scure “leopardate”/);
  // prima della stesura c'è la prova del dito: la segno come saltata per vedere il passaggio
  a.run(`openCook(); cook.i=R.steps.findIndex(s=>s.key==='stesura'); Object.assign(ckRec(cook.i,'before',true),{st:'ok',res:{skip:true}}); renderCook();`);
  const ck = a.element(`#cook`).innerHTML;
  assert.match(ck, /class="how"/);
  assert.match(ck, /senza toccare il bordo/);
  a.run(`cook.i=R.steps.findIndex(s=>s.key==='cottura'); renderCook();`);
  assert.match(a.element(`#cook`).innerHTML, /Come deve venire/);
  a.run(`closeCook();`);
  // il forno cambia il disegno: più macchie nel forno a legna che nel forno di casa con la teglia
  const spots = o => (a.run(`ART.style('classica','${o}')`).match(/var\(--a-char\)/g) || []).length;
  assert.ok(spots(`legna`) > spots(`casa_pietra`));
  assert.ok(spots(`casa_pietra`) > spots(`casa_teglia`));
});
