// Preparazione in corso: ricaricando la pagina non si perde, timer compresi, e finisce solo per scelta dell'utente.
// Si eseguono con:  node --test test/ripresa.test.js
// Stesso DOM minimo di test/correzioni.test.js: due "aperture" dell'app condividono il localStorage.
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

function app(data = new Map(), clock = { v: 0 }) {
  const elements = new Map();
  const element = key => {
    if (!elements.has(key)) elements.set(key, {
      innerHTML: ``, hidden: false, value: ``, dataset: {}, className: ``, textContent: ``,
      addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      setAttribute() {}, focus() {}, scrollIntoView() {}, classList: { add() {}, remove() {}, toggle() {} }
    });
    return elements.get(key);
  };
  const RD = Date;
  class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + clock.v); } static now() { return RD.now() + clock.v; } }
  const ctx = vm.createContext({
    Date: FD,
    document: { querySelector: element, addEventListener() {}, body: element(`body`), activeElement: { matches: () => false },
      createElement: () => ({ textContent: ``, set innerHTML(h) { this.textContent = h.replace(/<[^>]+>/g, ``); } }) },
    window: { addEventListener() {}, scrollTo() {} },
    navigator: {}, location: { pathname: `/`, search: ``, hash: `` }, history: { replaceState() {} },
    localStorage: { setItem: (k, v) => data.set(k, v), getItem: k => data.get(k), removeItem: k => data.delete(k) },
    setInterval() { return 1; }, clearInterval() {}, setTimeout() {}, console
  });
  vm.runInContext(scripts[0] + scripts[1].split(`/* ---------- avvio ---------- */`)[0], ctx);
  return { run: code => vm.runInContext(code, ctx), element, data, clock };
}
function setup(a, style = `classica`) {
  a.run(`state.style='contemporanea'; state.flour='media'; state.oven='casa_acciaio'; state.over={}; state.plan=null; state.prepMode='plan'; state.n=4;
    ui.reviewed=false; state.link=null; requestChange({k:'style',v:'${style}'});
    state.dinner=new Date(Date.now()+4*24*H); state.dinner.setHours(20,0,0,0); state.plan='h24'; R=compute(); rememberForm();`);
  return a.run(`R`);
}
// riapertura dell'app come fa l'avvio: ultime scelte, preparazione in corso, modalità cucina se è quella del piano
function reopen(a) {
  const b = app(a.data, a.clock);
  b.run(`load(); if(mem.last) restoreForm(mem.last); var resumed=resumeCook(); R=compute(); if(resumed){ const r=cookRun(); if(r&&r.here) openCook(); }`);
  return b;
}

test(`ricaricando prima del primo "Fatto": a passaggio da fare la preparazione riparte uguale`, () => {
  const a = app();
  const r0 = setup(a);
  const sig = a.run(`cookSig(R.steps)`);
  // arriva l'ora dell'impasto e si apre la modalità cucina, senza ancora segnare niente
  a.clock.v = r0.steps[0].start - Date.now() - 2 * MIN;
  a.run(`R=compute(); openCook();`);
  assert.ok(a.run(`Number.isFinite(cook.started)`));
  // un'ora dopo la pagina si ricarica: il piano non si ricalcola da adesso
  a.clock.v += H;
  const b = reopen(a);
  assert.equal(b.run(`cookSig(R.steps)`), sig);
  assert.equal(b.run(`document.querySelector('#cook').hidden`), false);
  assert.equal(b.run(`cook.i`), a.run(`cook.i`));
});

test(`"Iniziamo" nella lista Prima di partire avvia la preparazione`, () => {
  const a = app();
  const r0 = setup(a);
  a.run(`openCook({ready:true});`);
  assert.equal(a.run(`cook.ready`), true);
  assert.equal(a.run(`activeCook()`), null);
  a.run(`document.querySelector('#rd-go').onclick();`);
  assert.ok(a.run(`activeCook()`));
  const b = reopen(a);
  assert.equal(b.run(`cookSig(R.steps)`), a.run(`cookSig(R.steps)`));
  assert.equal(b.run(`document.querySelector('#cook').hidden`), false);
  assert.ok(r0.steps.length > 0);
});

test(`il timer del passaggio sopravvive al ricaricamento e a "Esci"`, () => {
  const a = app();
  const r0 = setup(a);
  const ti = r0.steps.findIndex(s => s.timer);
  assert.ok(ti >= 0, `nessun passaggio con timer`);
  a.clock.v = r0.steps[ti].start - Date.now();
  a.run(`R=compute(); openCook(); cook.i=${ti}; renderCook(); document.querySelector('#t-start').onclick();`);
  const end = a.run(`cook.timer.end`);
  assert.equal(a.run(`cook.timer.i`), ti);
  // "Esci" non ferma il timer
  a.run(`closeCook();`);
  assert.equal(JSON.parse(a.data.get(`lievita.cook`)).timer.end, end);
  // ricarico a metà timer: torna con la stessa fine
  a.clock.v += 5 * MIN;
  const b = reopen(a);
  assert.equal(b.run(`cook.i`), ti);
  assert.equal(b.run(`cook.timer&&cook.timer.end`), end);
  assert.equal(b.run(`document.querySelector('#t-stop').hidden`), false);
  // "Ferma" lo toglie anche dal salvataggio
  b.run(`document.querySelector('#t-stop').onclick();`);
  assert.equal(JSON.parse(b.data.get(`lievita.cook`)).timer, null);
});

test(`la preparazione non scade da sola: giorni dopo si riprende ancora`, () => {
  const a = app();
  const r0 = setup(a);
  a.run(`openCook(); commitStep(); cook.i++; saveCook();`);
  a.clock.v = r0.steps[r0.steps.length - 1].end - Date.now() + 5 * 24 * H;
  const b = reopen(a);
  assert.ok(b.run(`savedCook()`));
  assert.equal(b.run(`cook.i`), 1);
  assert.equal(b.run(`document.querySelector('#cook').hidden`), false);
});

test(`finisce solo con "Ho finito" o con "Interrompi"`, () => {
  const a = app();
  setup(a);
  a.run(`openCook(); commitStep(); cook.i++; saveCook(); closeCook();`);
  assert.ok(a.run(`savedCook()`));
  assert.match(a.run(`runBanner()`), /Preparazione in corso/);
  a.run(`askEndCook(); document.querySelector('#end-run').onclick();`);
  assert.equal(a.data.has(`lievita.cook`), false);
  assert.equal(a.run(`runBanner()`), ``);
  // fino all'ultimo passaggio: "Ho finito" e poi "Esci" la chiudono
  a.run(`openCook(); cook.i=cook.steps.length; saveCook(); closeCook();`);
  assert.equal(a.data.has(`lievita.cook`), false);
});

test(`cambiando impostazioni durante la preparazione non si perde: si chiede prima di avviarne una nuova`, () => {
  const a = app();
  setup(a);
  const sig = a.run(`cookSig(R.steps)`);
  a.run(`openCook(); commitStep(); cook.i++; saveCook(); closeCook();`);
  a.run(`state.room=state.room+3; R=compute();`);
  assert.equal(a.run(`cookRun().here`), false);
  assert.match(a.run(`runBanner()`), /Hai una preparazione in corso/);
  // "Avvia" non sovrascrive: chiede
  a.run(`goCook();`);
  assert.equal(JSON.parse(a.data.get(`lievita.cook`)).sig, sig);
  // "Riprendi quella in corso" rimette le impostazioni e la modalità cucina dov'era
  a.run(`document.querySelector('#run-back').onclick();`);
  assert.equal(a.run(`cookSig(R.steps)`), sig);
  assert.equal(a.run(`cook.i`), 1);
  // oppure "Avvia il nuovo piano" la sostituisce
  a.run(`closeCook(); state.room=state.room+3; R=compute(); goCook(); document.querySelector('#run-new').onclick();`);
  assert.notEqual(JSON.parse(a.data.get(`lievita.cook`)).sig, sig);
});
