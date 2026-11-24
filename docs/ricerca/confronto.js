// Confronta la dose di lievito dei video (verificata sulle trascrizioni) con il motore di index.html.
const fs=require('fs'); const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const {fT,heqOf,yeastPct}=new Function(src+'\nreturn {fT,heqOf,yeastPct};')();
// fasi: [nome, ore, °C]; room = temperatura di casa; k = fattore stile
const V=[
 ['Malati di Pizza, napoletana 4 h (KeSNZrRmp1A)', 0.30, [['a',4.5,21]],21],
 ['Malati di Pizza, scrocchiarella 6-7 h (vQd7_5Iejtw)', 0.40, [['a',6.5,21]],21],
 ['Malati di Pizza, planetaria 4-5 h (l13KFMM7oLc)', 1.00, [['a',4.5,21]],21],
 ['Malati di Pizza, 70% frigo + 4 h (zSfYQcGLFTY)', 0.30, [['a',1.5,21],['frigo',18,4],['a',4,21]],21],
 ['Mirko Savoia, tonda romana 24 h (2Sq5olgGb-s)', 0.30, [['a',1.25,21],['frigo',20,4],['a',3,21]],21],
 ['Gigio Attanasio, romana frigo a 8 °C (yEUDqCk1ezY)', 0.50, [['a',1,21],['frigo',22,8],['a',2,21]],21],
 ['Gigio Attanasio, 2 h + frigo 12 h (MfLKGFF5t6M)', 1.00, [['a',2.3,21],['frigo',14,4],['a',2,21]],21],
 ['Civitiello, 6-8 h + 8-12 h a 18-22 °C (SN2HkepzPhU)', 0.125, [['a',16,20]],20],
 ['Civitiello, 12 h + 8 h a 18-22 °C (WIIOycl_7xU)', 0.10, [['a',20,20]],20],
 ['Piatto, TEGLIA 7-8 h a 21 °C (4jD5XVaJyUg)', 0.57, [['a',7.5,21]],21, 2],
];
for(const [n,y,ph,room,k] of V){
  const heq=heqOf(ph,room,false); const m=Math.min(3,yeastPct(heq)*(k||1));
  console.log(`${n.padEnd(52)} video ${y.toFixed(2)}%  modello ${m.toFixed(2)}%  heq ${heq.toFixed(1)}  rapporto ${(y/m).toFixed(2)}`);
}
