# Burger bun: modello, assunzioni e limiti

Dal 25 novembre 2026 Lievita prepara anche i panini per burger e smash burger, con il tangzhong facoltativo. Il bun al latte riproduce la ricetta di Malati di Pizza, provata in cucina dall'utente in due modi: in giornata (20 g di lievito, 3 ore) e con una notte in frigo (6 g di lievito, in frigo dalle 21 alle 8, puntata fino alle 13, palline e appretto fino alle 17 circa, poi in forno). Gli altri tipi sono **calcolati, da provare in cucina**, e l'app lo dice nel piano.

## Come è innestato nel codice

- I bun sono voci di `STYLES` con `bread:true` e `bun:true`: usano il percorso del pane (`buildBreadPlan`), quindi ricette, versioni, note, calendario e modalità cucina restano gli stessi.
- `catOf(style)` restituisce `bun`, una terza categoria accanto a `pizza` e `pane`. `FLOURS[k].cats` e `OVENS[k].cats` contengono `bun` dove servono: farine 00 debole, per pizza, mix, forte e tipo 1; forno di casa (teglia, pietra, acciaio) e forno a legna. Niente pentola, fornetto o forno a gas.
- Cottura in `bunBakeInfo`, passaggi in `makeBunSteps`, avvisi in `bunWarnings`, testi in `bunCompareHtml`, `bunSecretsHtml` e `tzExplainHtml`. `CAT_DEF.bun` parte dal bun al latte, 6 panini.
- Nei bun **`hyd` è il latte** in % sulla farina (nel bun all'olio latte o acqua). Si aggiungono `egg` (uova intere, tuorli compresi), `potato` (patate lesse schiacciate), `oil` (burro; olio nel bun all'olio, `fat:'olio'`). Sono tutti personalizzabili in “Personalizza la ricetta” e finiscono in `over`.
- Nei bun non si applica l'abbassamento automatico dell'idratazione per farina (`maxHyd`): il latte non è acqua pura e uova e burro cambiano tutto.

## Tipi di bun

| Chiave | Bun | Farina | Latte | Uova | Grassi | Zucchero | Patate | Peso | Forno | `yeastK` |
|---|---|---|---|---|---|---|---|---|---|---|
| `bun` | Burger bun al latte | forte | 60% | 14% | burro 10% | 10% | — | 110 g | 190 °C | 3,5 |
| `smash` | Bun per smash burger | forte | 45% | 10% | burro 8% | 8% | 20% | 80 g | 190 °C | 3,5 |
| `brioche` | Brioche bun | forte (almeno il mix) | 40% | 25% | burro 20% | 10% | — | 100 g | 180 °C | 4,5 |
| `bun_olio` | Bun all'olio | per pizza | 62% | — | olio 7% | 4% | — | 100 g | 200 °C | 2,5 |

Sale sempre al 2%. Il bun al latte è la ricetta di Malati di Pizza: 500 g di farina forte, 300 g di latte, 1 uovo e 1 tuorlo, 50 g di zucchero, 10 g di sale, 50 g di burro, 20 g di lievito fresco.

Lo **smash burger** vuole un panino più piccolo e basso (circa 10 cm), morbido, che si comprime al morso: nelle ricette straniere è quasi sempre il *potato bun*. Le patate delle fonti vanno dal 5% (Fulvio Marino) a circa il 50% (Claire Saffitz, Billy Parisi): il 20% è una via di mezzo, con il latte ridotto di conseguenza. La formatura schiaccia le palline a 8 cm.

## Tangzhong

Si attiva nella pagina Lievitazione (scelta con pregi e difetti e una spiegazione) per i bun e per il pan bauletto (`tzAllowed`). È salvato come `over.tz` e resta quando si torna ai valori dello stile. Di base è attivo per bun al latte, smash e brioche, spento per il bun all'olio e il pan bauletto.

- **Dose:** l'8% della farina con 5 volte il suo peso di liquido (`TZ`), presi dal totale. Le fonti vanno dal 3% al 10% (Malati di Pizza e “Ti racconto la mia cucina” 10%, ChainBaker 9%, Weissman 6%, Adlard e smashgiulio 5%), quasi tutte con il rapporto 1:5. Se il liquido non basta, la farina del tangzhong scende a un quinto del liquido.
- **Non cambia** le dosi totali né il lievito. Non è un prefermento.
- **Orari:** un passaggio `tangzhong` un'ora prima dell'impasto (10 minuti al fuoco, poi a raffreddare). Il piano inizia da lì (`pl.begin`), e il tempo minimo in giornata conta quest'ora. Il testo dice che si può preparare la sera prima e tenere in frigo.
- **Temperatura del latte:** tangzhong, uova e patate entrano a temperatura di casa; il resto del latte compensa con una media pesata sulle masse, `(Tl − f·casa) / (1 − f)`, con `f` la quota di liquidi a temperatura di casa (al massimo 0,8) e un tetto di 35 °C.
- **Perché funziona** (testo dell'app, riscritto da Marrazzo, King Arthur e ChainBaker): verso i 65 °C l'amido si gelatinizza, assorbe molta più acqua e la trattiene; la mollica è più tenera e la retrogradazione dell'amido, la vera causa del pane duro, è più lenta. King Arthur nota che i panini cominciano a seccarsi dopo circa 4 giorni: l'app parla di “qualche giorno in più” e di 4 giorni in sacchetto, non di una settimana.

## Lievitazioni

Solo impasto diretto:

- **In giornata** (3–4 ore, più l'ora del tangzhong): impasto 30 minuti, puntata pari al 50% del tempo dopo impasto e formatura (1–2,5 ore), formatura 15 minuti, appretto con il resto. Le ricette raccolte stanno tra 2,5 e 5 ore. Per i bun si propone prima la giornata, il percorso della ricetta provata.
- **24 ore:** impasto, puntata di 1 ora, frigo con l'impasto in un'unica massa, formatura, appretto di `2,5 h / fT(casa)` tra 1,5 e 3,5 ore (i panini piccoli si scaldano prima di una pagnotta).
- Niente pieghe: gli impasti con il burro si lavorano in impastatrice o a mano fino alla prova del velo.
- Temperatura finale dell'impasto: 25 °C in giornata, 24 °C con il frigo (gli impasti ricchi stanno un po' più caldi).

## Lievito

Stesso modello della pizza (`heqOf`, `yeastPct`), con `yeastK` dello stile e un tetto del 4% di lievito fresco invece del 3%: con zucchero e burro le ricette in 3 ore arrivano al 4–5%.

La taratura usa 24 ricette di bun raccolte il 25 novembre 2026 (`docs/ricerca/riferimenti-bun.json`, confronto con `node docs/ricerca/confronto-bun.js index.html`, resoconto in `docs/ricerca/bun-ricette-2026-11-25.md`). Il fattore implicito K ha mediana 4,15 sulle 12 ricette con tempi dichiarati e 2,95 su tutte. **3,5** riproduce esattamente la ricetta di Malati di Pizza (4% in 3 ore a 20–21 °C). Il brioche bun, con il doppio del burro, ha 4,5; il bun all'olio, senza uova né burro, 2,5.

| Caso (bun al latte, 20 °C) | Lievito fresco |
|---|---|
| 3 ore in giornata | 4% (tetto) |
| 4 ore in giornata | circa 3,7% |
| Una notte in frigo (piano dell'app) | circa 1,1% |
| Orari della prova dell'utente (frigo 21–8, 9 ore fuori, 22 °C) | circa 0,6% (l'utente: 1,2%, lievitati troppo) |

## Cottura

- Teglia sulla griglia centrale, forno statico a 180–200 °C (ventilato 20 °C in meno), niente vapore. Pietra e acciaio vanno tolti o lasciati in basso.
- Tempo: `9 + 0,09 × peso` minuti, tra 10 e 26 (110 g → 19 minuti, 80 g → 16). Le ricette danno 15–25 minuti a 175–200 °C per 70–120 g.
- 9 panini per teglia (12 sotto i 90 g, 6 sopra i 130 g), una teglia per volta con 3 minuti tra le infornate.
- L'ora scelta è quella dei panini cotti e intiepiditi: 30 minuti su una griglia. Il passaggio finale spiega come tostare il lato tagliato in padella con il burro, che per lo smash burger è essenziale.

## Da fare

1. Provare in cucina smash bun con patate e brioche bun. Per la notte in frigo del bun al latte: rifare la prova dell'utente con circa 0,6% (3 g su 500 g) e gli stessi orari a 22 °C, oppure seguire il piano dell'app, e annotare quanto crescono i panini.
2. Valutare un bun con biga (Bakery Explorer, GialloZafferano) quando pane e bun avranno i prefermenti.
3. Altri formati: panini per hot dog e mini bun (slider da 30–40 g).
