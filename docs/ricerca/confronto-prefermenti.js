// Confronta le testimonianze di biga e poolish (testimonianze-prefermenti.json) con il motore di index.html.
// Uso: node docs/ricerca/confronto-prefermenti.js index.html
const fs=require('fs'), path=require('path');
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'..','..','index.html'),'utf8');
const src=html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const E=new Function(src+'\nreturn {fT,heqOf,yeastPct,heqForYeast,prefermentYeast,POOLISH_GROWTH,BIGA_GROWTH};')();
const D=JSON.parse(fs.readFileSync(path.join(__dirname,'testimonianze-prefermenti.json'),'utf8'));
const f=(x,d=2)=>x==null||!isFinite(x)?'  —  ':x.toFixed(d);
const med=a=>{const s=[...a].sort((x,y)=>x-y), n=s.length; return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):NaN;};
const RT=21;

for(const method of ['biga','poolish']){
  console.log(`\n=== ${method.toUpperCase()}: dose nel prefermento (fresco % sulla farina del prefermento) ===`);
  const ratios=[];
  for(const r of D[method]){
    if(r.y==null||r.h==null||r.freddo||r.T===4||r.qualita==='C') continue;
    const T=r.T??RT, m=E.prefermentYeast({method,hours:r.h,temp:T});
    ratios.push(r.y/m);
    console.log(`${r.id.padEnd(20)} ${String(r.h).padStart(5)} h ${f(T,1)} °C idr ${String(r.idr??100).padStart(3)}%  fonte ${f(r.y)}  modello ${f(m)}  rapporto ${f(r.y/m)}`);
  }
  console.log(`rapporto mediano fonte/modello: ${f(med(ratios))} su ${ratios.length} riferimenti`);

  console.log(`\n=== ${method.toUpperCase()}: lievito dopo il rimpasto ===`);
  console.log('need = curva del diretto sulle fasi dopo il rimpasto; G implicito = (need − aggiunta) / (lievito del prefermento × quota)');
  const Gs=[];
  for(const r of D[method]){
    if(!r.dopo||r.add==null||r.y==null||r.pct==null) continue;
    const room=med(r.dopo.filter(x=>x[0]!=='frigo').map(x=>x[2]));
    const heq=E.heqOf(r.dopo,room,!!r.teglia), need=Math.min(3,E.yeastPct(heq)*(r.teglia?2:1));
    const sup=r.y*r.pct/100, G=(need-r.add)/sup;
    if(r.qualita!=='C') Gs.push(G);
    console.log(`${r.id.padEnd(20)} quota ${String(r.pct).padStart(3)}%  heq ${f(heq,1).padStart(5)}  need ${f(need)}  prefermento ${f(sup)}  aggiunta ${f(r.add,3)}  G ${f(G).padStart(6)}  ${r.qualita}${r.esito?'  esito: '+r.esito:''}`);
  }
  console.log(`G mediano (qualità A e B): ${f(med(Gs))} su ${Gs.length}; modello ${method==='biga'?E.BIGA_GROWTH:E.POOLISH_GROWTH}`);
}

console.log(`\n=== BIGA senza aggiunta: ore equivalenti dopo il rimpasto, fonte e modello ===`);
for(const r of D.biga){
  if(!r.dopo||r.add!==0||r.y==null||r.pct==null) continue;
  const room=med(r.dopo.filter(x=>x[0]!=='frigo').map(x=>x[2]));
  const heq=E.heqOf(r.dopo,room,!!r.teglia), m=E.heqForYeast(E.BIGA_GROWTH*r.y*r.pct/100/(r.teglia?2:1));
  console.log(`${r.id.padEnd(20)} quota ${String(r.pct).padStart(3)}%  lievito ${f(r.y)}  fonte ${f(heq,1)} h  modello ${f(m,1)} h  ${r.dopo.some(x=>x[0]==='frigo')?'(con frigo)':''}`);
}
