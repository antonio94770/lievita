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

**Asciugatura della crosta.** Con `dry` gli ultimi minuti si cuociono a 170 °C con lo sportello socchiuso: 15 minuti per il pugliese, 10 per il pane di semola, in entrambi i casi solo da 800 g in su (un pane piccolo si seccherebbe) (proposta 4 della ricerca del 25 novembre, ricavata da Forno e Pietra). Il pane pugliese, oltre 1,1 kg, raffredda 3 ore.

Il pane di Altamura DOP usa lievito madre e grani locali: l'app propone una versione di casa con il lievito di birra e lo dice in un avviso.

`ball` è il peso crudo di ogni pane (pagnotta 900 g, filoncino 300 g, ciabatta 450 g, stampo 750–800 g). L'utente lo cambia nella pagina Quando, e il valore finisce in `over.ball`, salvato con la ricetta.

## Lievitazioni

Solo impasto diretto, con due percorsi:

- **In giornata** (3–8 ore; se un passaggio dall'inizio alla fine della cottura cade di notte si parte alle 7:30 con almeno 3 ore, altrimenti la giornata non è proposta: il pane pronto alle 13 o per colazione va fatto con la notte in frigo): impasto 30 min, puntata pari al 55% del tempo dopo impasto e formatura (1–4,5 ore), formatura 15 min, appretto con il resto. Con le pieghe (idratazione ≥ 66% o ciabatta) valgono gli stessi intervalli della pizza.
- **24 ore**: impasto, puntata (2 ore con pieghe, altrimenti 1,5), frigo con l'impasto in un'unica massa, formatura, appretto di `3,5 h / fT(casa)` tra 2,5 e 5 ore (il pane formato con l'impasto freddo è lento). Lo spostamento notturno è lo stesso della pizza (funzione `avoidNight`).

Biga e poolish per il pane non sono ancora supportati.

### Impasti molto bagnati e frigo breve (27 novembre 2026)

Dal confronto con la pagnotta in pentola di Davide Zambelli (`docs/ricerca/zambelli-pane-2026-11-27.md`):

- **Impasto in ciotola** quando l'idratazione è almeno del 72% e si impasta a mano (esclusa la ciabatta, che ha già il suo testo): 15 minuti di riposo dopo aver mescolato, poi 3–4 minuti tirando l'impasto dal fondo verso l'alto e ruotando la ciotola. Sul piano un impasto così si attacca dappertutto. Con l'impastatrice non cambia nulla.
- **Laminazione** come prima serie di pieghe, con le stesse condizioni (chiave `pieghe1`, così le note restano al loro posto): sul piano bagnato l'impasto si allarga in un foglio sottilissimo e si richiude a pacchetto. Dura 10 minuti se le pieghe sono ogni 15–20 minuti.
- **Frigo breve** (`frigobreve`, `CHILL_H` = 1,5 ore, le ricette dicono 1–2) dopo l'appretto, per i pani tondi nel cestino (`shape:'boule'`: pagnotta e pane di semola). L'impasto freddo si capovolge senza allargarsi e si incide netto, e il forno si scalda mentre il pane aspetta. In giornata c'è solo se a temperatura di casa restano almeno 3 ore; con la notte in frigo si accorcia il frigo lungo. In `heqOf` conta tutto alla temperatura media tra casa e frigo, perché in un'ora e mezza il pane si raffredda poco. In modalità cucina la prova del dito si fa **prima** di metterlo in frigo (dopo, l'impasto freddo risponde piano anche quando è pronto e il controllo ingannerebbe): se è in anticipo va in frigo subito e ci resta di più, se è indietro si aspetta fuori e gli orari slittano. Durata e effetto sulla crescita in forno vanno provati in cucina.

## Orari: si conta dall'ora del pane pronto

L'ora scelta dall'utente è quella in cui il pane è **cotto e raffreddato**. All'indietro: raffreddamento (1 ora fino a 450 g, 2 ore oltre, 1,5 ore per il pan bauletto), cottura, 10 minuti per incidere e infornare, poi l'appretto.

- Tempo in forno per infornata: `14 + 0,035 × peso` minuti (pan bauletto `15 + 0,03 × peso`), ciabatta × 0,85, tra 15 e 65. Dà circa 25 minuti per un filoncino da 300 g, 46 per una pagnotta da 900 g.
- Pentola: prima del preriscaldo a vuoto a 250 °C l'app ricorda di controllare le istruzioni della pentola (smalto, pomelli). Tra un pane e l'altro il forno torna a 250 °C, e ogni pane si incide appena prima di entrare. La carta forno deve reggere la temperatura: molte arrivano a 220–230 °C, quindi l'app lo dice in pentola, su pietra e acciaio e per la pizza sulla teglia rovente.
- Con più infornate il passaggio di cottura elenca gli orari di ognuna (in pentola anche quando togliere il coperchio); il timer vale per una fase e si riavvia.
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
