const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
// salta gli script brevi nel <head> (tema): il motore è <script id="engine">, l'interfaccia il successivo
const all = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const ei = all.findIndex(m => /id="engine"/.test(m[1]));
const scripts = all.slice(ei).map(m => m[2]);
const H = 36e5;

// Esegue anche le funzioni dell'interfaccia. Il DOM minimo serve a raccogliere
// l'HTML prodotto e gli eventi; non sostituisce una verifica visiva nel browser.
function app() {
  const elements = new Map(), events = {};
  const element = key => {
    if (!elements.has(key)) elements.set(key, {
      innerHTML: '', hidden: false, value: '', dataset: {},
      addEventListener(name, fn) { (events[key + ':' + name] ||= []).push(fn); },
      querySelector() { return null; }, querySelectorAll() { return []; },
      setAttribute() {}, focus() {}, scrollIntoView() {},
      classList: { add() {}, remove() {} }
    });
    return elements.get(key);
  };
  const data = new Map();
  const ctx = vm.createContext({
    document: { querySelector: element, addEventListener: (name, fn) => (events[name] ||= []).push(fn), body: element('body') },
    window: { addEventListener() {}, scrollTo() {} },
    navigator: {}, location: { pathname: '/', search: '', hash: '' }, history: { replaceState() {} },
    localStorage: { setItem: (k,v) => data.set(k,v), getItem: k => data.get(k), removeItem: k => data.delete(k) },
    setInterval() {}, clearInterval() {}, setTimeout() {}, console
  });
  vm.runInContext(scripts[0] + scripts[1].split('/* ---------- avvio ---------- */')[0], ctx);
  const run = code => vm.runInContext(code, ctx);
  run(`state.dinner=new Date(Date.now()+5*24*H); state.flour='forte';`);
  return { run, element, events, data };
}
function configure(a, method, extra = '') {
  a.run(`applyChange({k:'method',v:'${method}'}); ${extra} R=compute();`);
  return a.run('R');
}

test('prefermenti: bilancio delle dosi, tutte le farine ripartite e nessun lievito duplicato', () => {
  const a = app();
  for (const method of ['biga','poolish']) for (const room of [16,20,26]) {
    for (const pct of method === 'biga' ? [50,75,100] : [30,40,50]) {
      const r = configure(a, method, `state.room=${room};state.prefPct=${pct};`);
      assert.ok(!r.none);
      const i = r.I;
      for (const key of ['flour','water','yeast']) {
        assert.ok(Math.abs(i.pref[key]+i.final[key]-i[key])<1e-8, key);
        assert.ok(i.final[key]>=0);
      }
      if(method==='biga') assert.equal(i.final.yeast,0); else assert.ok(i.final.yeast>0);
      assert.ok(i.remixT.t>=2&&i.remixT.t<=35);
      // farina del prefermento a 5 g, acqua al grammo
      assert.ok(Math.abs(i.pref.flour/i.flour*100-pct)<1);
      assert.ok(Math.abs(i.pref.water-i.pref.flour*(method==='biga'?.45:1))<=.5);

      assert.ok(Math.abs(i.flour+i.water+i.yeast+i.salt+i.oil-i.total)<1e-8);
      assert.equal(i.waterT,null);
      assert.equal(r.pk,'prefermento');
      assert.equal(r.pl.fridgeH,0);
      assert.ok(r.pl.phases.every(p=>p[1]>0));
      assert.equal(r.pl.mixStart+r.pl.total*H,r.pl.stesStart);
      assert.equal(r.steps.find(s=>s.key==='cottura').start+r.pl.bk.per*6e4,r.pl.tFirst);
    }
  }
});

test('prefermenti: secco un terzo del fresco, con lo stesso peso totale', () => {
  const a=app();
  const fresh=configure(a,'poolish').I;
  const dry=a.run(`state.yeast='secco'; R=compute(); R.I;`);
  assert.ok(Math.abs(fresh.ypct/3-dry.ypct)<1e-10);
  assert.ok(Math.abs(fresh.total-dry.total)<8);
  assert.ok(Math.abs(dry.pref.yeast+dry.final.yeast-dry.yeast)<1e-10);
  assert.ok(Math.abs(fresh.pref.yeast/3/dry.pref.yeast-1)<1e-2);
});

test('prefermenti: rifiuta tempi, percentuali, farine e temperature non supportati senza tornare al diretto', () => {
  const a=app();
  for (const [method,invalid] of [
    ['biga',`state.prefPct=49`],['biga',`state.prefPct=101`],
    ['biga',`state.prefTemp=21`],['biga',`state.prefTemp=15`],['biga',`state.prefHours=13.75`],['biga',`state.prefHours=20.25`],
    ['biga',`state.flour='media'`],['poolish',`state.prefPct=60`],
    ['poolish',`state.prefTemp=25`],['poolish',`state.prefHours=7.75`],['poolish',`state.prefHours=18.25`],['biga',`state.prefFridge=19`],['poolish',`state.prefFridge=24.5`],
    ['poolish',`state.flour='debole'`],['poolish',`state.room=28`],
    ['poolish',`state.prefPct=NaN`],['poolish',`state.prefPct=Infinity`],
    ['biga',`state.dinner=new Date(Date.now()+8*H)`]
  ]) {
    a.run(`state.room=20;state.flour='forte';state.dinner=new Date(Date.now()+5*24*H);`);
    const r=configure(a,method,invalid+';');
    assert.equal(r.none,true,method+' '+invalid);
    assert.ok(r.reason.length>10);
    assert.ok(Object.values(r.plans).every(p=>!p.ok));
    a.run('ui.page=LAST;renderOut(); renderNav();');
    assert.match(a.element('#out').innerHTML,/Percorso non disponibile/);
    assert.match(a.element('#pnav').innerHTML,/disabled/);
  }
});

test('prefermenti: il lievito risponde a durata e temperatura; la percentuale e la temperatura di casa cambiano gli orari', () => {
  const a=app();
  for (const method of ['biga','poolish']) {
    const base=configure(a,method,`state.room=20;`).pl;
    const warm=a.run(`state.prefTemp=${method==='biga'?18:22};R=compute();R.pl;`);
    const cool=a.run(`state.prefTemp=${method==='biga'?16:18};R=compute();R.pl;`);
    assert.ok(cool.pref.yp>warm.pref.yp);
    const short=a.run(`state.prefHours=${method==='biga'?16:12};R=compute();R.pl;`);
    const long=a.run(`state.prefHours=${method==='biga'?18:16};R=compute();R.pl;`);
    assert.ok(short.pref.yp>long.pref.yp);
    assert.ok(long.mixStart<short.mixStart);
    const faster=configure(a,method,`state.prefPct=${method==='biga'?100:50};state.room=26;`).pl;
    assert.ok(faster.A<base.A);
    assert.ok(faster.mixStart>base.mixStart);
  }
});

test('prefermenti: punti di riferimento delle ricette e dosi piccole leggibili', () => {
  const a=app();
  const biga=configure(a,'biga',`state.prefPct=100;`);
  assert.equal(biga.pl.pref.yp,1);
  // Poolish: tabelle italiane a 20–22 °C (docs/prefermenti.md): 0,5–1% a 8 h, 0,2–0,3% a 12 h, ~0,1% a 15–18 h.
  const poolish=configure(a,'poolish',`state.room=20;state.prefPct=30;state.prefTemp=21;state.prefHours=12;`);
  assert.ok(Math.abs(poolish.pl.pref.yp-0.25)<1e-10);
  for(const [h,lo,hi] of [[8,.5,1],[12,.2,.3],[14,.15,.25],[16,.1,.2],[18,.07,.12]]){
    const y=a.run(`state.prefHours=${h};R=compute();R.pl.pref.yp`);
    assert.ok(y>=lo&&y<=hi,h+' h: '+y);
  }
  a.run(`state.prefHours=12;R=compute();`);
  assert.equal(a.run(`R.pl.phases.find(p=>p[0]==='puntata')[1]`),1);
  assert.equal(a.run('R.pl.A'),3);
  // Lievito al rimpasto: curva del diretto sulle fasi finali meno il poolish (×1,5), mai negativo.
  const pp=a.run('R.pl.pref');
  assert.ok(Math.abs(pp.addYp-(a.run(`yeastPct(${pp.finalHeq})`)-1.5*pp.yp*.3))<1e-10);
  assert.equal(a.run('gy(0.04)'),'0,04 g');
});

test('prefermenti: istruzioni, calendario, cucina e riepilogo riportano le due fasi', () => {
  const a=app();
  for (const method of ['biga','poolish']) {
    const r=configure(a,method);
    assert.ok(r.steps.find(s=>s.key==='prefermento').hands);
    assert.equal(r.steps.find(s=>s.key==='maturazione').hands,false);
    const final=r.steps.find(s=>s.key==='impasto');
    assert.match(final.body,method==='biga'?/Non aggiungere altro lievito/:/Aggiungi anche <b>[\d,]+ g<\/b> di lievito/);
    assert.match(final.body,/Usa acqua a circa <b>\d+ °C<\/b>/);
    assert.ok(!final.body.includes('null'));
    a.run('renderOut(); openCook();');
    assert.match(a.element('#out').innerHTML,/Come dividere le dosi/);
    assert.ok(!a.element('#out').innerHTML.includes('null °C'));
    assert.match(a.element('#cook').innerHTML,/Prepara/);
    const keys=a.run('calSteps().map(s=>s.key)');
    assert.ok(keys.includes('prefermento')&&keys.includes('impasto'));
    assert.ok(!keys.includes('maturazione'));
  }
});

test('prefermenti: conferma annullabile, salvataggio, versioni e compatibilità delle ricette precedenti', () => {
  const a=app();
  configure(a,'poolish');
  a.run(`ui.reviewed=true; requestChange({k:'method',v:'biga'});`);
  assert.equal(a.run('state.method'),'poolish');
  assert.equal(a.run('state.prefHours'),14);
  a.run('closeModal();');
  assert.equal(a.run('state.method'),'poolish');
  a.run(`requestChange({k:'prefPct',v:40});`);
  assert.equal(a.run('state.prefPct'),50);
  a.element('#ch-ok').onclick();
  assert.equal(a.run('state.prefPct'),40);
  a.run(`state.notes.prefermento='La mia nota';R=compute();openSave();`);
  a.element('#r-name').value='Poolish personale';
  a.element('#v-note').value='Prima prova';
  a.element('#save-r').onclick();
  assert.equal(a.run('isDirty()'),false);
  const saved=JSON.parse(a.data.get('lievita.v1'));
  assert.equal(saved.recipes[0].versions[0].cfg.method,'poolish');
  assert.equal(saved.recipes[0].versions[0].cfg.prefPct,40);
  a.run(`applyChange({k:'prefPct',v:45});R=compute();`);
  assert.equal(a.run('isDirty()'),true);
  assert.match(a.run('diffCfg(mem.recipes[0].versions[0].cfg,snap()).join(" ")'),/40% → 45%/);
  // Simula la riapertura usando il vero gestore del pulsante Usa.
  const target={closest:sel=>sel==='[data-use]'?{dataset:{use:saved.recipes[0].id,v:'0'}}:null};
  a.events.click.at(-1)({target});
  assert.equal(a.run('state.prefPct'),40);
  assert.equal(a.run('state.notes.prefermento'),'La mia nota');
  a.run(`delete mem.recipes[0].versions[0].cfg.method;delete mem.recipes[0].versions[0].cfg.prefPct;delete mem.recipes[0].versions[0].cfg.prefTemp;delete mem.recipes[0].versions[0].cfg.prefHours;mem.recipes[0].versions[0].cfg.plan='h24';`);
  a.events.click.at(-1)({target});
  assert.equal(a.run('state.method'),'diretto');
  assert.equal(a.run('R.pk'),'h24');
});

test('indiretti con frigo: sequenza, bilanci e promemoria di ingresso e uscita', () => {
  const a=app();
  for(const method of ['biga','poolish']) for(const style of ['contemporanea','teglia']) {
    const r=configure(a,method,`state.style='${style}';state.room=20;state.fridge=4;state.prefFridge=12;`);
    assert.ok(!r.none);
    assert.equal(r.pl.fridgeH,12);
    assert.equal(r.pl.mixStart+r.pl.total*H,r.pl.stesStart);
    const keys=r.pl.phases.map(p=>p[0]);
    assert.ok(keys.indexOf('maturazione')<keys.indexOf('impasto'));
    assert.ok(keys.indexOf('impasto')<keys.indexOf('frigo'));
    assert.ok(keys.indexOf('frigo')<keys.indexOf('appretto'));
    assert.equal(keys.indexOf('frigo')<keys.indexOf('staglio'),style==='teglia');
    assert.equal(keys.includes('avvio'),method==='biga'&&style!=='teglia');
    const cold=r.steps.find(s=>s.key==='frigo');
    const exit=r.steps.find(s=>s.key===(style==='teglia'?'staglio':'appretto'));
    assert.ok(cold.hands&&exit.hands);
    assert.equal(cold.end,exit.start);
    assert.ok(a.run('calSteps().map(s=>s.key)').includes('frigo'));
    if(method==='biga') assert.equal(r.I.final.yeast,0);
    else assert.ok(r.I.final.yeast<a.run('state.prefFridge=0;compute().I.final.yeast'));
    a.run('state.prefFridge=12;R=compute();');
    assert.ok(Math.abs(r.I.pref.flour+r.I.final.flour-r.I.flour)<1e-8);
    if(method==='biga'&&style!=='teglia') assert.ok(!r.steps.find(s=>s.key==='staglio').body.includes('subito in frigorifero'));
    a.run('renderOut();');
    assert.match(a.element('#out').innerHTML,/Come organizzarti con questi tempi/);
    assert.ok(!a.element('#out').innerHTML.includes('null °C'));
  }
});

test('indiretti: tempi scelti rispettati, suggerimento termico e dose del prefermento distinta dal freddo', () => {
  const a=app();
  for(const method of ['biga','poolish']) {
    const base=configure(a,method,`state.room=20;state.fridge=4;state.prefFridge=8;`);
    const longer=a.run('state.prefFridge=18;R=compute();R;');
    assert.equal(longer.pl.mixStart,base.pl.mixStart-10*H);
    assert.equal(longer.pl.pref.yp,base.pl.pref.yp);
    // Poolish: più frigo, meno lievito al rimpasto. Biga: nessuna aggiunta.
    if(method==='biga') assert.equal(longer.I.yeast,base.I.yeast); else assert.ok(longer.I.final.yeast<base.I.final.yeast);
    const custom=a.run(`state.prefOut=${longer.pl.A+1};R=compute();R;`);
    assert.equal(custom.pl.A,longer.pl.A+1);
    assert.equal(custom.pl.mixStart,longer.pl.mixStart-H);
    assert.equal(custom.pl.pref.yp,longer.pl.pref.yp);
    const warm=a.run('state.prefOut=0;state.room=26;R=compute();R.pl;');
    const cool=a.run('state.room=16;R=compute();R.pl;');
    assert.ok(warm.A<cool.A);
  }
});

test('indiretti: rifiuta durate e temperature frigo fuori ambito, senza ripiego al diretto', () => {
  const a=app();
  for(const extra of ['state.prefFridge=-1','state.prefFridge=4','state.prefFridge=24.25',
    'state.prefFridge=NaN','state.prefOut=Infinity','state.prefOut=-1','state.prefOut=10',
    'state.fridge=6','state.fridge=2','state.fridge=NaN',
    'state.dinner=new Date(Date.now()+24*H)']) {
    const r=configure(a,'poolish',`state.room=20;state.fridge=4;state.prefFridge=12;${extra};`);
    assert.equal(r.none,true,extra);
    assert.ok(r.reason);
    assert.ok(Object.values(r.plans).every(p=>!p.ok));
  }
});

test('indiretti: nuovi tempi confermabili, persistenti e compatibili con ricette precedenti', () => {
  const a=app();
  configure(a,'poolish');
  a.run(`requestChange({k:'prefFridge',v:12});`);
  assert.equal(a.run('state.prefFridge'),0);
  assert.ok(!a.element('#modal').innerHTML.includes('null °C'));
  a.element('#ch-ok').onclick();
  a.run(`requestChange({k:'prefOut',v:5});`);
  assert.equal(a.run('state.prefOut'),0);
  a.element('#ch-ok').onclick();
  a.run(`R=compute();openSave();`);
  a.element('#r-name').value='Poolish con notte in frigo';
  a.element('#save-r').onclick();
  const cfg=JSON.parse(a.data.get('lievita.v1')).recipes[0].versions[0].cfg;
  assert.equal(cfg.prefFridge,12);
  assert.equal(cfg.prefOut,5);
  assert.equal(a.run('isDirty()'),false);
  a.run('state.prefFridge=14;R=compute();');
  assert.equal(a.run('isDirty()'),true);
  assert.match(a.run('diffCfg(mem.recipes[0].versions[0].cfg,snap()).join(" ")'),/12 h → 14 h/);
  a.run(`rememberForm();`);
  assert.equal(JSON.parse(a.data.get('lievita.v1')).last.prefOut,5);
  const target={closest:sel=>sel==='[data-use]'?{dataset:{use:a.run('mem.recipes[0].id'),v:'0'}}:null};
  a.events.click.at(-1)({target});
  assert.equal(a.run('state.prefFridge'),12);
  a.run('delete mem.recipes[0].versions[0].cfg.prefFridge;delete mem.recipes[0].versions[0].cfg.prefOut;');
  a.events.click.at(-1)({target});
  assert.equal(a.run('state.prefFridge'),0);
  assert.equal(a.run('state.prefOut'),0);
  assert.equal(a.run('R.pl.fridgeH'),0);
});

test('disponibilità: il giorno della pizza limita anche il diretto e non inventa un prefermento breve', () => {
  const a=app();
  a.run(`state.dinner.setHours(20,0,0,0);state.prepMode='day';state.prepClock='16:00';R=compute();`);
  const direct=a.run('R');
  assert.ok(!direct.none);
  assert.equal(direct.pk,'giornata');
  assert.ok(new Date(direct.pl.mixStart).getHours()>=16);
  const pref=configure(a,'poolish',`state.prepClock='08:00';`);
  assert.equal(pref.none,true);
  assert.match(pref.reason,/giorno della pizza/);
  a.run(`state.prepClock='25:00';R=compute();`);
  assert.equal(a.run('R.none'),true);
  assert.match(a.run('R.reason'),/ora valida/);
});

function prepared(a,method,extra='') {
  const r=configure(a,method,`state.room=20;state.fridge=4;state.prepMode='plan';state.prefFridge=0;`);
  // Ricostruisce un preparato reale compatibile, avviato prima di ora,
  // con rimpasto fra un'ora; evita dipendenza da giorno/ora del test.
  const finalHours=r.pl.total-.25-r.pl.pref.hours;
  a.run(`state.prepMode='existing';
    state.dinner=new Date(Date.now()+(1+${finalHours}+${r.pl.stesDur/60+r.pl.bk.per/60})*H);
    state.batch={flour:${r.I.pref.flour},water:${r.I.pref.water},yeast:${r.I.pref.yeast},
      started:Date.now()+(1-.25-${r.pl.pref.hours})*H,cold:0};
    ${extra} R=compute();`);
  return a.run('R');
}

test('prefermento già fatto: conserva i grammi reali e pianifica solo ciò che resta', () => {
  for(const method of ['biga','poolish']) for(const yeast of ['fresco','secco']) {
    const a=app();
    a.run(`state.yeast='${yeast}';`);
    const r=prepared(a,method), b=a.run('state.batch');
    assert.ok(!r.none,r.reason);
    assert.equal(r.I.pref.flour,b.flour);
    assert.equal(r.I.pref.water,b.water);
    assert.ok(Math.abs(r.I.pref.yeast-b.yeast)<1e-10);
    if(method==='biga') assert.equal(r.I.final.yeast,0); else assert.ok(r.I.final.yeast>0);
    for(const key of ['flour','water','yeast']) assert.ok(Math.abs(r.I.pref[key]+r.I.final[key]-r.I[key])<1e-8);
    assert.ok(r.I.final.flour>=-1e-8&&r.I.final.water>=0);
    assert.equal(r.steps.some(s=>s.key==='prefermento'||s.key==='maturazione'),false);
    const keys=a.run('calSteps().map(s=>s.key)');
    assert.ok(keys.includes('impasto')&&!keys.includes('prefermento'));
    a.run('renderOut();');
    assert.match(a.element('#out').innerHTML,/Già preparato/);
    assert.match(a.run('preparedForm()'),/Proporzioni registrate/);
  }
});

test('prefermento già fatto: quantità incompatibili e storia termica diversa restano registrate senza piano fittizio', () => {
  for(const extra of ['state.batch.water*=1.2;','state.batch.flour*=3;','state.batch.yeast*=10;',
    'state.batch.started=Date.now()+H;','state.batch.started-=24*H;',
    'state.batch.cold=4;','state.batch.flour=0;','state.batch.yeast=NaN;']) {
    const a=app();
    const r=prepared(a,'biga',extra);
    assert.equal(r.none,true,extra);
    assert.ok(r.reason);
    assert.ok(Object.values(r.plans).every(p=>!p.ok));
  }
});

test('dati reali e disponibilità: conferma annullabile, salvataggio, differenze e ripristino', () => {
  const a=app(); prepared(a,'biga');
  const before=a.run('state.batch.flour');
  a.run(`requestChange({k:'batch',o:'flour',v:${before+1}});`);
  assert.equal(a.run('state.batch.flour'),before);
  a.run('closeModal();');
  assert.equal(a.run('state.batch.flour'),before);
  a.run('R=compute();openSave();');
  a.element('#r-name').value='La biga che ho già fatto';
  a.element('#save-r').onclick();
  const saved=JSON.parse(a.data.get('lievita.v1')).recipes[0].versions[0].cfg;
  assert.equal(saved.prepMode,'existing');
  assert.equal(saved.batch.flour,before);
  a.run('state.batch={...state.batch,flour:state.batch.flour+1};R=compute();');
  assert.equal(a.run('isDirty()'),true);
  assert.match(a.run('diffCfg(mem.recipes[0].versions[0].cfg,snap()).join(" ")'),/Dati del prefermento/);
  const target={closest:sel=>sel==='[data-use]'?{dataset:{use:a.run('mem.recipes[0].id'),v:'0'}}:null};
  a.events.click.at(-1)({target});
  assert.equal(a.run('state.batch.flour'),before);
  a.run('delete mem.recipes[0].versions[0].cfg.batch;delete mem.recipes[0].versions[0].cfg.prepMode;delete mem.recipes[0].versions[0].cfg.prepClock;');
  a.events.click.at(-1)({target});
  assert.equal(a.run('state.prepMode'),'plan');
  assert.equal(a.run('state.batch.flour'),0);
});

test('guida automatica: trova il minimo lessicografico rispettando temperatura, percentuale, cena e farina', () => {
  const a=app();
  for(const method of ['biga','poolish']) for(const room of [16,20,26]) for(const style of ['contemporanea','teglia']) {
    configure(a,method,`state.room=${room};state.style='${style}';state.oven='casa_acciaio';state.prefPct=50;state.prefOut=3;`);
    const before=a.run('JSON.stringify(state)');
    const result=a.run(`suggestPreferment(cfgNow(),Date.now())`);
    assert.ok(result.ok,result.reason);
    assert.equal(a.run('JSON.stringify(state)'),before,'ricerca senza mutazioni');
    assert.equal(result.cfg.prefTemp,method==='biga'?18:20);
    assert.equal(result.cfg.prefPct,50);
    assert.equal(result.cfg.prefOut,0);
    assert.equal(result.pl.tFirst,a.run('state.dinner.getTime()'));
    assert.ok(result.pl.flourOk);
    assert.ok(Math.abs(Object.values(result.I.final).reduce((s,v)=>s+v,0)+Object.values(result.I.pref).reduce((s,v)=>s+v,0)-result.I.total)<1e-8);
    const better=a.run(`(()=>{
      const best=suggestPreferment(cfgNow(),Date.now()), P=params(state), start=preparationWindow(state,Date.now()).start;
      const L=PREF_LIMITS['${method}'];
      for(let h=L.hours[0];h<=L.hours[1];h+=.25) for(let f=0;f<=L.fridge;f=f?f+.5:8) {
        const pl=buildPrefermentPlan('prefermento',P,{...state,prefHours:h,prefFridge:f,prefOut:0},start);
        if(!pl.ok||!pl.flourOk) continue;
        const n=prefermentNightActions(pl,P);
        // Con casa a 25 °C o più, a parità di notti si preferisce il frigo.
        const prefer=state.room>=25?(f>0&&!best.pl.fridgeH):f<best.pl.fridgeH;
        if(n<best.nights||(n===best.nights&&prefer)) return true;
      }
      return false;
    })()`);
    assert.equal(better,false,'nessuna alternativa ammissibile migliora notte/frigo');
  }
});

test('guida automatica: il freddo si propone per evitare lavorazioni notturne, mai con frigo caldo', () => {
  const a=app();
  configure(a,'biga',`state.dinner=new Date(Date.now()+5*24*H);state.dinner.setHours(12,30,0,0);`);
  const r=a.run('suggestPreferment(cfgNow(),Date.now())');
  assert.ok(r.ok);
  assert.ok(r.pl.fridgeH>=8);
  assert.equal(r.nights,0);
  const warm=a.run('state.fridge=7;suggestPreferment(cfgNow(),Date.now())');
  assert.ok(warm.ok);
  assert.equal(warm.pl.fridgeH,0);
  assert.ok(warm.nights>0);
});

test('guida automatica: nessuna ricetta inventata con poca disponibilità, temperatura errata o dosi già mescolate', () => {
  for(const extra of [
    `state.prefTemp=26;`, `state.prefPct=150;`, `state.flour='debole';`,
    `state.prepMode='day';state.prepClock='08:00';state.dinner.setHours(20,0,0,0);`,
    `state.dinner=new Date(Date.now()+8*H);`, `state.prepMode='existing';`,
    `state.over.hyd=90;`
  ]) {
    const a=app();configure(a,'biga',extra);
    const r=a.run('suggestPreferment(cfgNow(),Date.now())');
    assert.equal(r.ok,false,extra);assert.ok(r.reason.length>10);
  }
});

test('guida automatica: nota anche una lavorazione breve che attraversa le 23', () => {
  const a=app();
  const count=a.run(`(()=>{
    const t=new Date();t.setHours(22,58,0,0);
    return prefermentNightActions({mixStart:t.getTime(),phases:[['prefermento',.25,18]],
      pieghe:false,stesStart:t.getTime()-5*H,tFirst:t.getTime()-4*H,bk:{per:2}},params(state));
  })()`);
  assert.equal(count,1);
});

test('guida: confronto su stessa farina e idratazione, proposta annullabile e salvabile', () => {
  const a=app();configure(a,'biga',`state.dinner.setHours(20,0,0,0);`);
  const guide=a.run('prefermentGuideHtml()');
  for(const text of ['Biga 50%','Biga 100%','Poolish 30%','Poolish 50%','225 g','450 g','300 g','500 g']) assert.ok(guide.includes(text),text);
  assert.match(guide,/68%/);
  const original=a.run('JSON.stringify(cfgNow())');
  a.run('openPrefermentSuggestion(1)');
  assert.equal(a.run('JSON.stringify(cfgNow())'),original);
  assert.match(a.element('#modal').innerHTML,/posto stabile/);
  assert.match(a.element('#modal').innerHTML,/100%/);
  a.run('closeModal();');
  assert.equal(a.run('JSON.stringify(cfgNow())'),original);
  a.run('openPrefermentSuggestion(1)');a.element('#pref-accept').onclick();
  assert.equal(a.run('state.prefPct'),100);
  assert.equal(a.run('state.method'),'biga');
  assert.equal(a.run('state.prefOut'),0);
  const last=JSON.parse(a.data.get('lievita.v1')).last;
  assert.equal(last.prefPct,100);assert.equal(last.prefFridge,a.run('state.prefFridge'));
  a.run('openSave()');a.element('#r-name').value='Biga guidata';a.element('#save-r').onclick();
  const cfg=JSON.parse(a.data.get('lievita.v1')).recipes[0].versions[0].cfg;
  assert.equal(cfg.prefPct,100);assert.equal(cfg.prefHours,last.prefHours);
});

test('guida: cambio metodo espone temperatura necessaria e non cambia la farina per far funzionare il piano', () => {
  const a=app();configure(a,'poolish',`state.prefTemp=22;state.flour='media';`);
  a.run('openPrefermentSuggestion(0)');
  assert.match(a.element('#modal').innerHTML,/mix con Manitoba/);
  assert.equal(a.run('state.flour'),'media');assert.equal(a.run('state.method'),'poolish');
  a.run(`state.flour='forte';openPrefermentSuggestion(0)`);
  assert.match(a.element('#modal').innerHTML,/18 °C/);
  assert.equal(a.run('state.prefTemp'),22);
  a.element('#pref-accept').onclick();
  assert.equal(a.run('state.prefTemp'),18);
  assert.equal(a.run('state.method'),'biga');
});

test('poolish rivisto: dose dalle tabelle italiane, lievito al rimpasto che scende con il frigo', () => {
  const a=app();
  const noF=configure(a,'poolish',`state.room=20;state.fridge=4;state.prefPct=30;state.prefHours=12;state.prefTemp=20;state.prefFridge=0;`);
  const f12=a.run('state.prefFridge=12;R=compute();R');
  const f24=a.run('state.prefFridge=24;R=compute();R');
  assert.ok(noF.I.final.yeast>f12.I.final.yeast&&f12.I.final.yeast>=f24.I.final.yeast);
  assert.ok(f24.I.final.yeast>=0);
  // La dose totale resta nell'ordine di grandezza del diretto per le stesse ore dopo il rimpasto.
  const pp=noF.pl.pref;
  assert.ok(noF.pl.yp<pp.needYp&&noF.pl.yp>pp.needYp*.7);
  // Più poolish o più caldo nel prefermento: meno lievito al rimpasto.
  const p50=a.run('state.prefFridge=0;state.prefPct=50;R=compute();R');
  assert.ok(p50.pl.pref.addYp<noF.pl.pref.addYp);
});

test('acqua del rimpasto: bilancio termico pesato e coerente', () => {
  const a=app();
  const hand=configure(a,'biga',`state.room=20;state.prefPct=100;state.mixer=false;`).I.remixT;
  const mixer=a.run('state.mixer=true;R=compute();R.I.remixT');
  assert.ok(mixer.raw<hand.raw);
  const cold=a.run('state.mixer=false;state.prefTemp=16;R=compute();R.I.remixT');
  assert.ok(cold.raw>hand.raw);
  // Verifica diretta del bilancio: la miscela con l'attrito torna a 23 °C.
  const I=a.run('R.I'), c=(f,w)=>1.75*f+4.18*w;
  const mix=(c(I.pref.flour,I.pref.water)*16+c(I.final.flour,0)*20+c(0,I.final.water)*cold.raw)/(c(I.pref.flour,I.pref.water)+c(I.final.flour,I.final.water))+2;
  assert.ok(Math.abs(mix-23)<1e-9);
});

test('guida: confronto delle quattro opzioni sui tempi reali, con consiglio sul frigo', () => {
  const a=app();
  configure(a,'poolish',`state.room=20;state.fridge=4;`);
  const html=a.run('prefCompareHtml()');
  assert.match(html,/Confronto sui tuoi orari/);
  assert.match(html,/Cosa aspettarti/);
  for(const name of ['Biga 50%','Biga 100%','Poolish 30%','Poolish 50%']) assert.ok(html.includes(name),name);
  for(const row of ['Lievito al rimpasto','Acqua al rimpasto','Frigo dopo il rimpasto','Lavori tra le 23 e le 7']) assert.ok(html.includes(row),row);
  assert.ok(!/undefined|NaN|null/.test(html));
  assert.equal(a.run(`state.prepMode='existing';prefCompareHtml()`),'');
  a.run(`state.prepMode='plan';`);
  const s=a.run('suggestPreferment(cfgNow(),Date.now())');
  assert.ok(a.run('fridgeAdvice(suggestPreferment(cfgNow(),Date.now()))').length>20);
  // Casa calda: a parità di notti si preferisce il frigo dopo il rimpasto.
  const warm=a.run('state.room=26;suggestPreferment(cfgNow(),Date.now())');
  assert.ok(warm.ok&&warm.warm);
  if(warm.noFridge&&warm.noFridge.nights===warm.nights) assert.ok(warm.pl.fridgeH>0);
  assert.ok(s.ok);
});

test('biga: lievito facoltativo al rimpasto, coerente con le ricette e salvato', () => {
  const a=app();
  // Senza aggiunta: comportamento classico invariato.
  const base=configure(a,'biga',`state.room=20;state.fridge=4;state.prefPct=50;`);
  assert.equal(base.I.final.yeast,0);
  assert.equal(a.run('state.prefAdd'),false);
  // Con aggiunta: biga al 50% riceve circa 0,1–0,5% sulla farina totale (Malati di Pizza: 0,2–0,5%).
  const add=a.run('state.prefAdd=true;R=compute();R');
  assert.ok(add.pl.pref.addYp>.1&&add.pl.pref.addYp<.5,String(add.pl.pref.addYp));
  assert.ok(Math.abs(add.I.pref.yeast+add.I.final.yeast-add.I.yeast)<1e-8);
  assert.equal(add.pl.pref.yp,base.pl.pref.yp);
  assert.match(add.steps.find(s=>s.key==='impasto').body,/Aggiungi anche/);
  // Biga al 100% a 20 °C: l'aggiunta resta quasi nulla, come nella ricetta senza aggiunta.
  const full=a.run('state.prefPct=100;R=compute();R');
  assert.ok(full.pl.pref.addYp<.05,String(full.pl.pref.addYp));
  // Frigo: 24 ore solo con l'aggiunta, e meno lievito al rimpasto con più freddo.
  a.run('state.prefPct=50;');
  const f8=a.run('state.prefFridge=8;R=compute();R'), f24=a.run('state.prefFridge=24;R=compute();R');
  assert.ok(!f24.none,f24.reason);
  // Con il frigo il lievito della biga può bastare da solo: l'aggiunta scende fino a zero.
  assert.ok(f24.I.final.yeast<=f8.I.final.yeast&&f8.I.final.yeast<add.I.final.yeast);
  const off=a.run('state.prefAdd=false;R=compute();R');
  assert.equal(off.none,true);
  assert.match(off.reason,/lievito al rimpasto/);
  // Il cambio passa dalla conferma e compare tra le differenze; le ricette vecchie restano senza aggiunta.
  a.run('state.prefFridge=0;R=compute();');
  a.run(`requestChange({k:'prefAdd',v:true});`);
  assert.equal(a.run('state.prefAdd'),false);
  assert.match(a.run('diffCfg({...cfgNow(),prefAdd:false},{...cfgNow(),prefAdd:true}).join()'),/Lievito al rimpasto della biga: no → sì/);
  assert.equal(a.run('(()=>{const c=cfgNow(); delete c.prefAdd; return diffCfg(c,{...cfgNow(),prefAdd:false}).length;})()'),0);
  assert.equal(a.run(`prefermentSettings({method:'poolish',prefAdd:true}).add`),false);
  // Il cambio di metodo riporta la biga alla versione classica.
  a.run(`state.prefAdd=true;applyChange({k:'method',v:'poolish'});applyChange({k:'method',v:'biga'});`);
  assert.equal(a.run('state.prefAdd'),false);
  assert.match(a.run('prefermentForm()'),/Un po’ di lievito anche al rimpasto/);
});

test('biga lunga: 24 h in frigo poi 22–26 h a 18–20 °C, dose e riposi coerenti con la biga corta', () => {
  const a=app();
  const short=configure(a,'biga',`state.room=20;state.fridge=4;state.prefPct=50;state.prefTemp=18;state.prefHours=18;`);
  a.run(`applyChange({k:'prefKind',v:'lunga'});`);
  assert.equal(a.run('state.prefHours'),24);
  assert.equal(a.run('state.prefTemp'),18);
  const r=a.run('R=compute();R');
  assert.ok(!r.none,r.reason);
  // Riferimento delle ricette: 1% fresco con 24 h a 4 °C e 24 h a 18 °C.
  assert.ok(Math.abs(r.pl.pref.yp-1)<1e-9,String(r.pl.pref.yp));
  assert.equal(r.pl.phases.slice(0,4).map(p=>p[0]).join(),'prefermento,bigafrigo,maturazione,impasto');
  assert.equal(r.pl.phases[1][1],24);
  assert.equal(r.pl.phases[1][2],4);
  // Stessa dose nella biga, stesso riposo finale della biga corta all'1%.
  assert.equal(r.pl.A,short.pl.A);
  assert.equal(r.I.final.yeast,0);
  assert.ok(Math.abs(r.pl.mixStart-(short.pl.mixStart-30*H))<1e-6);
  // Più caldo fuori frigo: meno lievito.
  const warm=a.run('state.prefTemp=20;R=compute();R');
  assert.ok(warm.pl.pref.yp>.7&&warm.pl.pref.yp<.9,String(warm.pl.pref.yp));
  // Promemoria: uscita dal frigo come passaggio da fare, anche in calendario.
  const out=warm.steps.find(s=>s.key==='bigafuori'), fr=warm.steps.find(s=>s.key==='bigafrigo');
  assert.ok(out&&out.hands&&fr&&!fr.hands);
  assert.equal(out.start,fr.end);
  assert.ok(a.run('calSteps().map(s=>s.key)').includes('bigafuori'));
  assert.match(warm.steps.find(s=>s.key==='prefermento').body,/biga lunga/);
  assert.match(a.run('prefermentForm()'),/Biga lunga/);
  assert.match(a.run('prefermentAdvice()'),/toglila/);
  // Limiti: temperatura, ore, farina, frigo; il poolish ignora l'opzione.
  for(const extra of ['state.prefTemp=17;','state.prefTemp=21;','state.prefHours=21.75;','state.prefHours=26.25;','state.flour="mix";','state.fridge=6;']) {
    const b=a.run(`(()=>{const k=JSON.stringify(state); ${extra} const x=compute(); Object.assign(state,JSON.parse(k),{dinner:state.dinner}); return x;})()`);
    assert.equal(b.none,true,extra);
    assert.ok(b.reason);
  }
  assert.equal(a.run(`prefermentSettings({method:'poolish',prefKind:'lunga'}).long`),false);
  // Le configurazioni salvate con il vecchio prefLong restano biga lunga.
  assert.equal(a.run(`prefermentSettings({method:'biga',prefLong:true}).kind`),'lunga');
  // Guida automatica: resta nella biga lunga e nelle sue ore.
  const s=a.run('suggestPreferment(cfgNow(),Date.now())');
  assert.ok(s.ok,s.reason);
  assert.ok(s.cfg.prefKind==='lunga'&&s.cfg.prefHours>=22&&s.cfg.prefHours<=26);
  // Conferma, differenze, ricette vecchie e ritorno alla corta col cambio di metodo.
  a.run(`state.prefKind='corta';R=compute();requestChange({k:'prefKind',v:'lunga'});`);
  assert.equal(a.run('state.prefKind'),'corta');
  assert.match(a.run('diffCfg({...cfgNow(),prefKind:"corta"},{...cfgNow(),prefKind:"lunga"}).join()'),/Biga: corta → lunga/);
  assert.equal(a.run('(()=>{const c=cfgNow(); delete c.prefKind; return diffCfg(c,{...cfgNow(),prefKind:"corta"}).length;})()'),0);
  a.run(`state.prefKind='lunga';applyChange({k:'method',v:'poolish'});applyChange({k:'method',v:'biga'});`);
  assert.equal(a.run('state.prefKind'),'corta');
});

test('biga lunga già preparata: le ore in frigo registrate entrano nella maturazione', () => {
  const a=app();
  const r=configure(a,'biga',`state.room=20;state.fridge=4;state.prepMode='plan';state.prefFridge=0;state.prefKind='lunga';state.prefHours=24;state.prefTemp=18;`);
  assert.ok(!r.none,r.reason);
  const finalHours=r.pl.total-.25-24-r.pl.pref.hours;
  const setup=cold=>a.run(`state.prepMode='existing';
    state.dinner=new Date(Date.now()+(1+${finalHours}+${r.pl.stesDur/60+r.pl.bk.per/60})*H);
    state.batch={flour:${r.I.pref.flour},water:${r.I.pref.water},yeast:${r.I.pref.yeast},
      started:Date.now()+(1-.25-${cold}-24)*H,cold:${cold}}; R=compute(); R`);
  const ok=setup(24);
  assert.ok(!ok.none,ok.reason);
  assert.equal(ok.I.pref.flour,r.I.pref.flour);
  assert.equal(ok.steps.some(s=>s.key==='bigafrigo'),false);
  assert.equal(setup(0).none,true);
  assert.equal(setup(30).none,true);
  a.run("state.prefKind='corta';");
  const plain=setup(24);
  assert.equal(plain.none,true);
  assert.match(plain.reason,/biga lunga/);
});

test('biga in frigo per le case calde: qualche ora fuori, poi 16–20 h in frigo, dose dalle ricette', () => {
  const a=app();
  const short=configure(a,'biga',`state.room=24;state.fridge=4;state.prefPct=50;`);
  a.run(`applyChange({k:'prefKind',v:'frigo'});`);
  assert.equal(a.run('state.prefTemp'),24);
  assert.equal(a.run('state.prefHours'),18);
  const r=a.run('R=compute();R');
  assert.ok(!r.none,r.reason);
  assert.equal(r.pl.phases.slice(0,5).map(p=>p[0]).join(),'prefermento,maturazione,bigafrigo,acclimata,impasto');
  // Ore fuori calcolate dalla temperatura, tra 2 e 4; frigo come scelto.
  assert.ok(r.pl.phases[1][1]>=2&&r.pl.phases[1][1]<=4);
  assert.equal(r.pl.phases[2][1],18);
  assert.equal(r.pl.phases[2][2],4);
  // Dose ancorata alle ricette (0,5–1%), sotto la regola della biga corta applicata a questa storia termica.
  assert.ok(r.pl.pref.yp>.6&&r.pl.pref.yp<1,String(r.pl.pref.yp));
  assert.equal(r.I.final.yeast,0);
  // La biga esce fredda: acqua del rimpasto più tiepida che con la biga corta.
  assert.ok(r.I.remixT.raw>short.I.remixT.raw);
  assert.ok(r.I.remixT.t>=2&&r.I.remixT.t<=35);
  // Promemoria per entrare e uscire dal frigo.
  const inn=r.steps.find(s=>s.key==='bigainfrigo'), out=r.steps.find(s=>s.key==='bigafuori'), fr=r.steps.find(s=>s.key==='bigafrigo');
  assert.ok(inn.hands&&out.hands&&!fr.hands);
  assert.equal(inn.start,fr.start);
  assert.equal(out.start,fr.end);
  const keys=a.run('calSteps().map(s=>s.key)');
  assert.ok(keys.includes('bigainfrigo')&&keys.includes('bigafuori'));
  assert.equal(r.steps.find(s=>s.key==='maturazione').title,'Lascia partire la biga');
  assert.match(a.run('prefermentForm()'),/Biga in frigo/);
  assert.match(a.run('prefermentForm()'),/Ore della biga in frigo/);
  // Limiti: solo case calde, 16–20 h di frigo, frigo misurato.
  for(const extra of ['state.prefTemp=20;','state.prefTemp=27;','state.prefHours=15.75;','state.prefHours=20.25;','state.fridge=6;']) {
    const b=a.run(`(()=>{const k=JSON.stringify(state); ${extra} const x=compute(); Object.assign(state,JSON.parse(k),{dinner:state.dinner}); return x;})()`);
    assert.equal(b.none,true,extra);
    assert.ok(b.reason);
  }
  // Guida automatica nelle ore di frigo della biga in frigo.
  const s=a.run('suggestPreferment(cfgNow(),Date.now())');
  assert.ok(s.ok,s.reason);
  assert.ok(s.cfg.prefKind==='frigo'&&s.cfg.prefHours>=16&&s.cfg.prefHours<=20);
  // Salvataggio: prefHours restano le ore di frigo scelte, non le ore fuori calcolate.
  assert.equal(a.run('cfgNow().prefHours'),18);
  assert.match(a.run('diffCfg({...cfgNow(),prefKind:"corta"},{...cfgNow(),prefKind:"frigo"}).join()'),/Biga: corta → in frigo/);
  // Biga in frigo già preparata: le ore di frigo registrate sostituiscono quelle scelte.
  const finalHours=r.pl.total-.25-r.pl.pref.hours-18-1;
  const setup=cold=>a.run(`state.prepMode='existing';
    state.dinner=new Date(Date.now()+(1+${finalHours}+${r.pl.stesDur/60+r.pl.bk.per/60})*H);
    state.batch={flour:${r.I.pref.flour},water:${r.I.pref.water},yeast:${r.I.pref.yeast},
      started:Date.now()+(1-.25-${r.pl.pref.hours}-${cold}-1)*H,cold:${cold}}; R=compute(); R`);
  const ok=setup(18);
  assert.ok(!ok.none,ok.reason);
  assert.equal(setup(0).none,true);
});
