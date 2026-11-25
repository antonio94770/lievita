// Confronta le ricette di bun raccolte (docs/ricerca/riferimenti-bun.json) con il motore di index.html.
// Uso:  node docs/ricerca/confronto-bun.js index.html
// Per ogni ricetta calcola la dose "base" della curva della pizza (fattore 1) sulle stesse fasi e ricava
// il fattore implicito K = dose della ricetta / dose base. Il motore usa yeastK dello stile (bun e smash 3,5, brioche 4,5, all'olio 2,5) e un tetto del 4%.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const src = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const { heqOf, yeastPct, STYLES, FLOURS } = new Function(src + '\nreturn {heqOf,yeastPct,STYLES,FLOURS};')();
const refs = JSON.parse(fs.readFileSync(path.join(__dirname, 'riferimenti-bun.json'), 'utf8')).riferimenti;

const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const rows = [];
for (const r of refs) {
  // fasi: [ore, °C, "frigo"?]; la massa in frigo si raffredda lentamente (come nel motore: teglia=true)
  const room = (r.fasi.find(f => f[2] !== 'frigo') || [0, 21])[1];
  const ferm = r.farina_motore && FLOURS[r.farina_motore] ? (FLOURS[r.farina_motore].ferm || 1) : 1;
  const heq = heqOf(r.fasi.map(([h, T, fr]) => [fr === 'frigo' ? 'frigo' : 'a', h, T]), room, true) * ferm;
  const base = yeastPct(heq);
  const K = r.fresco_pct / base;
  const kApp = (STYLES[r.stile_app] && STYLES[r.stile_app].yeastK) || 2;
  rows.push({ r, heq, base, K, app: Math.min(4, base * kApp) });
}
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(pad('ricetta', 48), pad('q', 2), pad('stile', 10), 'fresco%  heq   base%  K impl.  app%   ric/app');
for (const x of rows) console.log(pad(x.r.id, 48), pad(x.r.qualita, 2), pad(x.r.stile_app, 10),
  x.r.fresco_pct.toFixed(2).padStart(6), x.heq.toFixed(1).padStart(6), x.base.toFixed(2).padStart(6), x.K.toFixed(2).padStart(7), x.app.toFixed(2).padStart(6), (x.r.fresco_pct / x.app).toFixed(2).padStart(8));
const ok = rows.filter(x => !x.r.troppo_lievito); // prove lievitate troppo: solo un tetto, fuori dalle mediane
const groups = {
  'tutte': ok,
  'qualità A+B': ok.filter(x => x.r.qualita !== 'C'),
  'qualità C (solo confronto)': ok.filter(x => x.r.qualita === 'C'),
  'italiane A+B': ok.filter(x => x.r.qualita !== 'C' && !/King Arthur|Adlard|Weissman|ChainBaker|Parisi/.test(x.r.id)),
  'straniere A+B': ok.filter(x => x.r.qualita !== 'C' && /King Arthur|Adlard|Weissman|ChainBaker|Parisi/.test(x.r.id)),
  'con tangzhong A+B': ok.filter(x => x.r.qualita !== 'C' && x.r.tangzhong)
};
console.log('');
for (const [n, g] of Object.entries(groups)) if (g.length)
  console.log(`${pad(n, 28)} n=${String(g.length).padStart(2)}  K mediano ${median(g.map(x => x.K)).toFixed(2)}  ricetta/app mediano ${median(g.map(x => x.r.fresco_pct / x.app)).toFixed(2)}  entro 0,5–2× dell'app: ${g.filter(x => { const q = x.r.fresco_pct / x.app; return q >= .5 && q <= 2; }).length}`);
