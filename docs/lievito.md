# Dose di lievito: verifica e taratura

Questo file spiega da dove vengono `fT()`, `heqOf()` e `yeastPct()` in `index.html`. I dati usati sono in due file accanto a questo:

- `craig-2014.json`: la tabella completa di Craig (pizzamaking.com), trascritta a mano;
- `riferimenti-lievito.json`: i 18 riferimenti della taratura (disciplinare, mulini, tabelle italiane, articoli e video di pizzaioli), più 9 video di controllo aggiunti dopo e le ricette di teglia. I video di controllo hanno il campo `"verificato"`: dosi e tempi sono stati letti sulla trascrizione (vedi `ricerca/README.md`).

I test in `test/engine.test.js` leggono questi due file e controllano che il motore resti vicino ai dati.

## Storia

1. **Modello originale** (prima del 12/11/2026): `0.8 × (6/heq)^1.2`, +9% per grado. Dava da 2 a 3 volte il lievito delle fonti.
2. **Prima correzione** (12/11/2026): curva tarata su pochi riferimenti. Restava +9% per grado e il lievito in casa fresca era circa la metà del necessario.
3. **Seconda correzione** (12/11/2026, quella attuale): taratura congiunta su tabella di Craig completa e 18 riferimenti.

## Il modello attuale

- `fT(T)`, velocità rispetto a 20 °C:
  - da 12 °C in su `1.145^(T-20)`, cioè +14,5% per grado;
  - sotto i 12 °C `1.145^-8 · 1.07^(T-12)`, cioè circa 0,19 a 4 °C.
- `heqOf()`: le prime ore in frigo (2 per i panetti, 4 per la massa unica della teglia) contano alla temperatura media tra casa e frigo, perché l'impasto si raffredda lentamente.
- `yeastPct(heq) = 0.55 · exp(1.53·x + 0.18·x²)` con `x = ln(6/heq)`, in linea retta oltre heq ≈ 27, tra 0,02% e 3%.
- L'appretto dura `4 h / fT(casa)`, tra 2 e 6 ore. Per la teglia almeno 3,5 ore, perché la massa unica esce fredda dal frigo.
- Teglia: la dose della curva si moltiplica per `STYLES.teglia.yeastK = 2` (sempre entro il 3%). Vedi sotto.

## Cosa dicono le fonti

### Temperatura: quanto accelera l'impasto per ogni grado

| Fonte | Aumento per grado (12–28 °C) |
|---|---|
| Tabella di Craig (modello di crescita di Gänzle, tarato sui dati degli utenti del forum) | circa +15% |
| Taratura sulle sole fonti italiane e video, senza Craig | circa +12% |
| Scatti di Gusto (calcolo della biga) | 8–12% |
| Studio scientifico Salvadó 2011, crescita di *S. cerevisiae* in brodo di coltura | circa +6% sopra i 20 °C, molto di più sotto |
| **Lievita** | **+14,5%** |

Lo studio di Salvadó (Tmin 2,8 °C, Topt 32,3 °C, Tmax 45,4 °C, media di 10 ceppi di *S. cerevisiae*) misura la **crescita delle cellule in un liquido**, con ceppi da vino, non la **produzione di gas in un impasto**. Per questo serve come controllo della forma della curva, non per tarare i numeri. Vicino ai 4 °C prevede una crescita quasi nulla, mentre uno studio del 1995 (Applied and Environmental Microbiology) conferma che il lievito continua a fermentare l'impasto anche a 5 °C per giorni.

### Frigo

Qui le fonti non sono d'accordo:

- per Craig a 4 °C l'impasto va a circa un decimo della velocità che ha a 20 °C;
- le ricette italiane con 24 ore di frigo usano 0,2–0,3% di lievito, mentre con i numeri di Craig ne servirebbe 0,4–0,5%.

Abbiamo scelto le ricette italiane, cioè la dose più bassa: un impasto un po' lento si recupera aspettando, uno troppo lievitato no. Il valore effettivo di 0,19 a 4 °C comprende anche il fatto che i frighi di casa sono spesso più caldi di quanto si pensi.

### Quanto è precisa la taratura

| Insieme di dati | Risultato |
|---|---|
| Tabella di Craig, 14–28 °C, 3–30 ore | mediana 0,98 volte; 80% delle celle tra 0,87 e 1,21 volte |
| Riferimenti affidabili (peso 1) | tutti entro 1,5 volte |
| Tutti i 18 riferimenti | mediana centrata; i più lontani sono Ooni (il modello dà 0,46 volte) e un video da 6 ore (0,31 volte) |
| 9 video di controllo, non usati per tarare (12/11/2026) | mediana 0,99 volte; i più lontani sono due ricette di Attanasio, che usa sempre più lievito della media |

**Conclusione onesta:** le fonti tra loro differiscono anche del doppio per lo stesso tempo e la stessa temperatura (farine, frighi, abitudini diverse). Nessuna formula può essere "certificata" più precisa di così. Il modello dà una stima centrale; la prova del dito nei passaggi resta indispensabile, e i voti degli utenti dopo ogni cottura serviranno a correggerla.

## Effetto sui piani (contemporanea, frigo a 4 °C)

| Casa | In giornata | 24 ore | 48 ore | 72 ore |
|---|---|---|---|---|
| 16 °C | 0,82% | 0,34% | 0,19% | 0,13% |
| 20 °C | 0,36% | 0,25% | 0,16% | 0,11% |
| 26 °C | 0,13% | 0,16% | 0,11% | 0,09% |

A 26 °C "in giornata" chiede meno lievito di "24 ore": è corretto, perché 8 ore a 26 °C sono tantissima fermentazione. Lo confermano sia Craig sia il disciplinare AVPN.

## Teglia: un fattore a parte (novembre 2026)

La curva è tarata solo su pizze tonde. Abbiamo confrontato 7 ricette di teglia verificabili (in `riferimenti-lievito.json` con `"stile": "teglia"`), simulando per ognuna le sue fasi. Con la sola curva della tonda le ricette usavano da 0,6 a 5,7 volte il lievito calcolato, mediana circa 3,3. Il sale e l'olio non spiegano lo scarto (la formula Japi dà circa +7%): le ricette di teglia cercano più volume.

Le fonti si dividono: Dissapore 2016 sta sotto la curva, i blog intorno a 0,6%, Trezzi, Alfè e Bonci (intervista del 2013) molto sopra. Alcuni blog giudicano eccessiva la dose di Bonci per casa.

Scelta: un fattore **prudente di 2**, sotto la mediana. Con il fattore il modello dà da 0,35 a 3,2 volte le ricette, mediana 0,62. Esempio: 24 ore a 20 °C passano da circa 0,27% a 0,48% di lievito fresco. La dose è "calcolata, da testare": l'app lo dice all'utente finché non c'è la prova in cucina. Il test `riferimenti teglia` chiede che la mediana resti tra 0,5 e 1 volta le ricette.

Non confermate (citate in un report di Gemini senza fonte controllabile): teglia di Malati di Pizza (0,79%), Davidoctor94 (0,7%), Renato Bosco, e una "scuola" a 2–3 g/kg attribuita a Confraternita, Pezzetta, Marino, Misya e Benedetta.

## Limiti noti

- La tabella di Craig è trascritta dalla miniatura del forum (l'originale è riservato agli iscritti): qualche cifra può essere letta male.
- Del disciplinare AVPN è verificata solo la dose di lievito; i tempi (puntata ~2 h, appretto 4–6 h a ~25 °C) sono quelli tipici, da ricontrollare sul PDF.
- Diversi riferimenti non dicono la temperatura di casa: l'ipotesi usata è scritta nel campo `ipotesi` del file JSON.
- Mancano prove in cucina del team sui percorsi principali.

## Fonti

**Studi**
- Salvadó et al. 2011, *Temperature Adaptation Markedly Determines Evolution within the Genus Saccharomyces*, Applied and Environmental Microbiology 77(7): https://pmc.ncbi.nlm.nih.gov/articles/PMC3067424/
- Fermentazione dell'impasto a basse temperature, Applied and Environmental Microbiology 61(2), 1995: https://journals.asm.org/doi/pdf/10.1128/aem.61.2.639-642.1995

**Tabelle e modelli**
- Craig (TXCraig1), modello di previsione del lievito, pizzamaking.com (tabella alla risposta #201): https://www.pizzamaking.com/forum/index.php?topic=26831.200
- Tabella Pescenudo: https://www.pescenudo.it/2020/tempi-di-lievitazione-degli-impasti-con-lievito-di-birra
- Guida Misya: https://www.misya.info/guide/lieviti-e-lievitazione
- Scatti di Gusto, calcolo della biga (velocità per grado): https://www.scattidigusto.it/lezioni-di-pizza-calcolo-semplice-biga/

**Disciplinari, mulini e produttori**
- Disciplinare AVPN 2022: https://www.pizzanapoletana.org/public/pdf/Disciplinare_AVPN_2022.pdf
- Ooni, cold-proof pizza dough: https://eu.ooni.com/en-it/blogs/recipes/cold-prove-pizza-dough
- Petra 3 (Dissapore): https://www.dissapore.com/ricette/pizza-sottile-e-croccante-con-farina-petra-3/

**Ricette e articoli**
- Impasto con Caputo Nuvola (GialloZafferano): https://blog.giallozafferano.it/rosly/ricetta-impasto-base-per-pizza-e-panzerotti/
- Pizza napoletana (Cookist): https://www.cookist.it/ricetta-pizza-napoletana/
- Pizza napoletana (Mani in Pasta, GialloZafferano): https://blog.giallozafferano.it/maniinpasta/ricetta-pizza-napoletana/
- Impasto napoletano 24 ore (Il Granduca): https://ristoranteilgranduca.it/articoli/impasto-pizza-napoletana-24-ore-8340/
- Lievito naturale o di birra (Scatti di Gusto): https://www.scattidigusto.it/pizza-fatta-in-casa-scegliere-tra-lievito-naturale-e-lievito-di-birra/

**Pizza in teglia**
- Dissapore, pizza in teglia (2016): https://www.dissapore.com/ricette/pizza-in-teglia-impasto-fatto-in-casa/
- Alessandro Trezzi, Dissapore: https://www.dissapore.com/cucina/pizza-fatta-in-casa-senza-errori
- Cinzia Alfè, Scatti di Gusto: https://www.scattidigusto.it/2020/05/31/lezioni-di-pizza-la-ricetta-della-teglia-ad-alta-idratazione-a-casa/
- Gabriele Bonci, intervista di V. Pagano, Scatti di Gusto: https://www.scattidigusto.it/2013/10/31/gabriele-bonci-pizza-a-casa-senza-lievito-madre
- Salvatore Lioniello, Scatti di Gusto: https://www.scattidigusto.it/pizza-a-casa-ricetta-salvatore-lioniello/
- Blog GialloZafferano, teglia "Bonci" 24 ore: https://blog.giallozafferano.it/lericettedisimo/ricetta-pizza-in-teglia-24-ore-di-lievitazione-pizza-bonci/
- Millegrammi, teglia 24–48 ore: https://blog.giallozafferano.it/millegrammi/pizza-in-teglia-24-48-ore/

**Video (YouTube)**
- Luigi Schifano, 8 ore a temperatura ambiente: https://www.youtube.com/watch?v=n4BtK6OM7cU
- Fabrizio Ruosi (Art in Kitchen), lievitazione di 8 ore: https://www.youtube.com/watch?v=m9vktZP1At8
- Fermentum, napoletana diretta 24 ore: https://www.youtube.com/watch?v=EXTiKirkihY
- Andrea Acqua e Farina, Caputo Nuvola in 6 ore: https://www.youtube.com/watch?v=oGZ2apFL0u4
- Davidoctor94, canotto in 6 ore: https://www.youtube.com/watch?v=2-gJKsw3BmE
