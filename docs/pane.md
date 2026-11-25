# Pane: modello, assunzioni e limiti

Dal 25 novembre 2026 Lievita prepara anche il pane in casa. È un **percorso calcolato, da provare in cucina**: nessuna dose del pane è ancora stata verificata dal team. L'app lo dice nel piano.

## Come è innestato nel codice

- I pani sono voci di `STYLES` con `bread:true`. Così ricette salvate, versioni, note, calendario, modalità cucina ed esportazione funzionano senza un formato nuovo: una ricetta di pane è una ricetta con `style:'pagnotta'` (o un altro pane).
- `catOf(style)` dice se uno stile è `pizza` o `pane`. `FLOURS[k].cats` e `OVENS[k].cats` dicono in quale categoria compaiono farine e forni.
- `buildPlan` passa a `buildBreadPlan` quando lo stile è un pane. Le scelte di cottura sono in `breadBakeInfo`, i passaggi in `makeBreadSteps`, i testi su differenze e segreti in `breadCompareHtml` e `breadSecretsHtml`.
- Cambiando stile da pizza a pane (`switchStyle`) si passa alla farina consigliata per quel pane, a un forno adatto, all'impasto diretto e a un pane solo; al ritorno, a farina e forno da pizza e a 4 pizze.

## Tipi di pane

| Chiave | Pane | Farina consigliata | Acqua | Altro | Forma | Cottura |
|---|---|---|---|---|---|---|
| `pagnotta` | Pagnotta casereccia | 0 media | 68% | sale 2% | cestino | 240 → 220 °C, vapore |
| `filoni` | Filoncini | 0 media | 65% | sale 2% | filone | 240 → 220 °C, vapore |
| `ciabatta` | Ciabatta | forte (almeno il mix) | 78% | sale 2,2%, pieghe sempre | non si forma | 240 → 220 °C, vapore |
| `siciliano` | Pane siciliano (mafalda) | semola rimacinata | 65% | sale 2,2%, zucchero o malto 1%, sesamo | serpentina, non si incide | 230 → 210 °C, vapore |
| `pugliese` | Pane pugliese (tipo Altamura) | semola rimacinata | 70% | sale 2%, pane da 1,3 kg | piegato “a cavallo”, non si incide | 240 → 220 °C, vapore, 15 min finali a 170 °C con lo sportello socchiuso |
| `semola` | Pane di semola | semola rimacinata | 72% | sale 2% | cestino | 230 → 210 °C, vapore |
| `integrale` | Pane integrale in cassetta | integrale | 75% | sale 2% | stampo | 220 → 200 °C, vapore |
| `cassetta` | Pan bauletto | 0 media | 60% | sale 1,8%, olio 5%, zucchero 4% | stampo | 180 °C, senza vapore |

**Forni limitati.** Uno stile può avere `ovens`, l'elenco dei forni ammessi: siciliano e pugliese escludono la pentola di ghisa, dove la forma non entra. La pagina Cucina mostra solo quelli; se un forno escluso arriva da una ricetta salvata, `breadBakeInfo` usa la teglia e lo dice in un avviso.

**Asciugatura della crosta.** Con `dry` gli ultimi minuti si cuociono a 170 °C con lo sportello socchiuso: 15 minuti per il pugliese, 10 per il pane di semola da 800 g in su (proposta 4 della ricerca del 25 novembre, ricavata da Forno e Pietra). Il pane pugliese, oltre 1,1 kg, raffredda 3 ore.

Il pane di Altamura DOP usa lievito madre e grani locali: l'app propone una versione di casa con il lievito di birra e lo dice in un avviso.

`ball` è il peso crudo di ogni pane (pagnotta 900 g, filoncino 300 g, ciabatta 450 g, stampo 750–800 g). L'utente lo cambia nella pagina Quando, e il valore finisce in `over.ball`, salvato con la ricetta.

## Lievitazioni

Solo impasto diretto, con due percorsi:

- **In giornata** (3–8 ore): impasto 30 min, puntata pari al 55% del tempo dopo impasto e formatura (1–4,5 ore), formatura 15 min, appretto con il resto. Con le pieghe (idratazione ≥ 66% o ciabatta) valgono gli stessi intervalli della pizza.
- **24 ore**: impasto, puntata (2 ore con pieghe, altrimenti 1,5), frigo con l'impasto in un'unica massa, formatura, appretto di `3,5 h / fT(casa)` tra 2,5 e 5 ore (il pane formato con l'impasto freddo è lento). Lo spostamento notturno è lo stesso della pizza (funzione `avoidNight`).

Biga e poolish per il pane non sono ancora supportati.

## Orari: si conta dall'ora del pane pronto

L'ora scelta dall'utente è quella in cui il pane è **cotto e raffreddato**. All'indietro: raffreddamento (1 ora fino a 450 g, 2 ore oltre, 1,5 ore per il pan bauletto), cottura, 10 minuti per incidere e infornare, poi l'appretto.

- Tempo in forno per infornata: `14 + 0,035 × peso` minuti (pan bauletto `15 + 0,03 × peso`), ciabatta × 0,85, tra 15 e 65. Dà circa 25 minuti per un filoncino da 300 g, 46 per una pagnotta da 900 g.
- Infornate: in pentola un pane per volta, con 10 minuti per riscaldarla; altrimenti `cap` pani per volta (2, i filoncini 4; nel forno a legna almeno 6), con 5 minuti tra un'infornata e l'altra.
- Vapore: con la teglia d'acqua per il 40% della cottura (al massimo 15 minuti); in pentola con il coperchio per il 50% (al massimo 25).
- Preriscaldamento: teglia 30 minuti, pentola 45, acciaio 50, pietra 60, legna 120.

## Lievito

Stesso modello della pizza (`heqOf`, `yeastPct`), con due differenze:

1. **`yeastK` = 2** per i pani semplici, come per la teglia, e **4** per il pan bauletto (era 2,5 fino al 25 novembre 2026: le ricette arricchite raccolte stanno quasi tutte più in alto). Il pane è una massa grande che deve quasi raddoppiare due volte, più di un panetto da pizza; zucchero e grassi rallentano il lievito. Il frigo conta come per la teglia: le prime 4 ore alla temperatura media tra casa e frigo.
2. **`ferm`** delle farine con crusca: le ore equivalenti si moltiplicano per 1,1 (tipo 1) e 1,2 (integrale), perché queste farine fermentano più in fretta (più enzimi e sali minerali). Il risultato è un po' meno lievito.

Controllo di plausibilità, non una taratura (i test in `test/pane.test.js` lo verificano):

| Caso | Modello (fresco) | Valori tipici delle ricette di pane diretto |
|---|---|---|
| 24 ore, 17–18 in frigo, casa a 20 °C | circa 0,5% | 0,3–0,6% |
| 8 ore in giornata a 20 °C | circa 0,7% | 0,5–1% |
| 3,5 ore in giornata a 20 °C | 2,5–3% | 1,5–3% (il “pane veloce”) |

I valori a destra sono intervalli indicativi. Il 25 novembre 2026 sono stati confrontati con 31 ricette puntuali (video e siti, italiani e stranieri) in `docs/ricerca/riferimenti-pane.json`: per i pani semplici la mediana è 1,24 volte la dose dell'app (0,92 con il frigo), con una dispersione enorme; per i pani arricchiti 2,15 volte. Analisi e proposte in `docs/ricerca/pane-ricette-2026-11-25.md`.

## Temperatura dell'acqua

Come per la pizza, `3 × DDT − 2 × casa − attrito`, ma con la temperatura finale voluta un grado più alta: 24 °C in giornata e 23 °C con il frigo.

## Segreti e accorgimenti

Nel piano c'è il pannello “Segreti e accorgimenti”, diviso in sei gruppi: impasto, lievitazione e umidità, formatura e incisione, forno e vapore, dopo la cottura, “se qualcosa va storto”. I passaggi della modalità cucina ripetono i consigli che servono in quel momento: prova del velo, autolisi, contenitore trasparente, tazza d'acqua bollente nel forno spento per l'umidità (con l'avviso di toglierla prima di accenderlo), incisione a 45°, teglia d'acqua per il vapore, come togliere il vapore, prova del suono e temperatura al cuore (96–98 °C, pan bauletto 92–95), raffreddamento su griglia e conservazione.

Sono tecniche comuni della panificazione, riscritte con parole nostre. Prima di pubblicare va fatta la stessa revisione dei testi prevista per la pizza (punto 4 dei prossimi passi in `AGENTS.md`).

## Da fare

1. ~~Raccogliere ricette di pane diretto con dose, tempi e temperature~~ fatto (31 ricette, vedi sopra). Applicato: `yeastK` del pan bauletto da 2,5 a 4; tra i segreti c'è l'appretto in frigo per 1,5–2 ore.
2. Provare in cucina almeno pagnotta 24 ore, filoncini in giornata e pan bauletto.
3. Biga e poolish per il pane, poi il lievito madre.
