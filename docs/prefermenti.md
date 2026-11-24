# Biga e poolish: tempi personalizzati e frigo

12 novembre 2026. **Percorsi calcolati, non ancora provati in cucina dal team.**
I test verificano aritmetica e comportamento del programma, non la riuscita dell'impasto.

## Biga in frigo per le case calde (14 novembre 2026)

**Percorso calcolato, da provare in cucina.** Con la biga ora si sceglie tra tre tipi (`prefKind`):
`corta`, `lunga` e `frigo`. Le configurazioni salvate con il vecchio campo `prefLong` restano lette come biga lunga.

Quando la casa è calda, la biga corta richiede un posto stabile a 16–20 °C. Chi non ce l'ha può
avviare la biga qualche ora fuori e poi lasciarla maturare in frigo.

**Fonti**, riportate in `testimonianze-prefermenti.json`:

| Fonte | Lievito fresco sulla farina della biga | Fuori | Frigo |
| --- | --- | --- | --- |
| Stadler Made (A) | 0,7% | 2–3 h con casa oltre 18 °C | 18–20 h (16–18 h a 4 °C nei consigli) |
| Billy Parisi (B) | circa 0,75% (0,3% secco attivo) | 4–6 h con casa oltre 22 °C | 24–72 h |
| Mirko Savoia, idrobiga al 75% (B) | 1% | fino al raddoppio, circa 3 h col caldo | 20–24 h a 4 °C |
| Esposito, risposta a un lettore (B) | 1% | 7 h a 17 °C | 16 h a 6 °C |

Gustoblog (C) inverte l'ordine (prima frigo, poi 7–8 h fuori) senza dare i tempi di frigo, quindi non è usato.

| Campo | Biga in frigo |
| --- | --- |
| Farina nel prefermento | 50–100% |
| Temperatura fuori, prima del frigo | 21–26 °C (sotto i 21 °C basta la biga corta) |
| Ore fuori | calcolate: `6 / fT(T)`, tra 2 e 4 (3 h a 25 °C, 4 h a 22 °C) |
| Frigo | 16–20 h, frigo misurato tra 3 e 5 °C; il campo `prefHours` contiene queste ore |
| Prima del rimpasto | 1 h a temperatura di casa (fase `acclimata`) |
| Farina | mix con Manitoba o forte, come la biga corta |

**Dose.** La regola della biga corta, cioè il lievito inversamente proporzionale alle ore equivalenti,
qui darebbe circa il doppio delle ricette. In frigo conta pochissimo, eppure le ricette usano meno
dell'1%: la biga in frigo arriva al rimpasto meno matura, e chi la usa lo accetta.

La dose resta quindi inversamente proporzionale alle ore equivalenti, ma il riferimento viene dalle
ricette di questo metodo:

```
heq = ore_fuori × fT(Tfuori) + heqOf([frigo, ore, Tfrigo], Tfuori, massa unica)
y = 0,8% × heq(3 h a 25 °C, 18 h a 4 °C) / heq(scelta)
```

Rapporto tra fonte e modello:

| Fonte | Rapporto |
| --- | --- |
| Stadler | 0,75 |
| Esposito | 1,03 |
| Parisi | 1,27 |
| Savoia | 1,34, ma con idrobiga al 75% |

La mediana è circa 1,15. Abbiamo scelto 0,8% e non 0,9% perché Stadler, l'unica fonte A, sta più in basso.

**Rimpasto.** La biga esce fredda. Per l'acqua del rimpasto si stima la biga a 4 °C sopra il frigo,
dopo un'ora fuori. L'acqua risulta più tiepida, fino al limite di 35 °C. Dopo il rimpasto valgono le
regole della biga corta. Per Stadler (biga al 100%) il modello dà un riposo finale un po' più breve
della ricetta: 2 h di appretto a 24 °C contro 2–4 h.

**Calendario.** Ci sono due passaggi da fare:

- `bigainfrigo`, alla fine delle ore fuori;
- `bigafuori`, un'ora prima del rimpasto.

Entrambi contano anche come lavorazioni notturne.

**Biga già preparata.** Si indicano le ore in frigo, da 14 a 22. Le ore fuori si assumono uguali a
quelle calcolate.

## Biga lunga (14 novembre 2026)

**Percorso calcolato, da provare in cucina.** Nella pagina Lievitazione, con la biga, si sceglie
tra biga corta e biga lunga (`prefLong`, predefinito no).

La biga lunga è il metodo più citato dopo la biga corta:

- Giorilli, riportato da Dissapore;
- Zaghini, su Scatti di Gusto;
- il calcolatore di F. Olivieri;
- Davide Esposito, su Pizza Napoletana Doc.

Tutte le fonti usano la stessa sequenza: la biga appena impastata va in frigo a 4–5 °C per 24 ore,
poi matura 24 ore a 18–20 °C. La dose resta l'1% di lievito fresco, come per la biga corta.

| Campo | Biga lunga |
| --- | --- |
| Farina nel prefermento | 50–100%, come la biga corta |
| Frigo iniziale | 24 h, frigo misurato tra 3 e 5 °C |
| Maturazione dopo il frigo | 22–26 h a 18–20 °C |
| Farina | solo forte, perché la maturazione dura quasi due giorni |
| Dopo il rimpasto | come la biga corta: aggiunta facoltativa, frigo 0 oppure 8–18 h (24 con aggiunta) |

**Dose.** Si usa la stessa regola della biga corta: il lievito è inversamente proporzionale alle
ore equivalenti di maturazione. Il riferimento è 1% con 24 h a 4 °C più 24 h a 18 °C.

```
heq_lunga = heqOf([frigo, 24 h, Tfrigo], Tbiga, massa unica) + ore × fT(Tbiga)
y = 1% × heq_lunga(24 h a 4 °C, 24 h a 18 °C) / heq_lunga(scelta)
```

In frigo la biga è una massa unica che si raffredda lentamente. Per questo le prime 4 ore contano
alla temperatura media tra il posto della biga e il frigo, come la teglia in `heqOf`.

Esempi con il frigo a 4 °C:

| Temperatura dopo il frigo | Dose fresca |
| --- | --- |
| 18 °C | 1,00% |
| 20 °C | 0,80% |

**Dopo il rimpasto** valgono le regole della biga corta, con la stessa efficacia `BIGA_GROWTH`.
Una biga più matura potrebbe avere un'efficacia più alta, ma non ci sono dati per tararla.
Esempi con la casa a 20 °C:

- biga lunga al 50% a 18 °C, senza aggiunta: riposo finale di 5 ore e 45 minuti, uguale alla
  biga corta all'1%. Il percorso dura 55 ore e 45 minuti prima della stesura;
- biga lunga al 50% a 20 °C: la dose è più bassa, quindi il riposo sale a 7 ore.

Olivieri indica 4–6 ore di riposo a 15–16 °C dopo il rimpasto, con biga al 20% e una piccola aggiunta.

**Calendario.** L'uscita dal frigo è un passaggio da fare (`bigafuori`), con promemoria. Vale anche
per le lavorazioni notturne. Il riposo in frigo ha la chiave `bigafrigo`.

**Biga già preparata.** Si indicano le ore passate in frigo: per la biga lunga sono accettate da 20 a 28.
Con la biga corta il frigo continua a essere rifiutato, e il messaggio suggerisce la biga lunga.

**Ancora esclusi:**

- percorsi con un frigo iniziale diverso da 24 ore. La biga in frigo per le case calde è stata aggiunta dopo: vedi la sezione dedicata.

Brigandi riporta una biga non matura dopo 24 h in frigo e lasciata ancora 5 h a 26 °C. Il caso
conferma che la fase a 18–20 °C dopo il frigo è necessaria, ed è quella del percorso.

## Revisione del 13 novembre 2026 (notte): testimonianze e coerenza tra biga e poolish

Abbiamo raccolto **59 schemi** di biga e poolish:

- ricette di pizzaioli e mulini: Zaghini, Giorilli, Le 5 Stagioni, Molino Dallagiovanna, Pezzetta, Lioniello;
- blog italiani: GialloZafferano, Gustoblog, Ricetta.it, Tavolartegusto, BiancoLievito, Pizza Napoletana Doc;
- siti stranieri: Ooni, Stadler Made, Fond, Weekend Bakery, Jordo, JayArr, Burnhard;
- testimonianze nei forum: The Fresh Loaf e Forno Bravo, con gli esiti riportati.

Ogni schema è riscritto in numeri in
[testimonianze-prefermenti.json](ricerca/testimonianze-prefermenti.json), con una qualità A, B o C.
Lo script [confronto-prefermenti.js](ricerca/confronto-prefermenti.js) li confronta con il motore:

```
node docs/ricerca/confronto-prefermenti.js index.html
```

Limiti della raccolta:

- **Gruppi Facebook:** senza accesso non si leggono, quindi non sono inclusi.
- **pizzamaking.com:** il sito rifiuta la lettura automatica (errore 403). Per quel forum abbiamo solo la sintesi del motore di ricerca, classificata C.
- **Reddit:** i mirror non erano raggiungibili.
- **Esiti:** pochi riportano un esito in cucina. Gli altri sono ricette dichiarate, non prove.

### Cosa dicono i dati

| Grandezza | Modello precedente | Testimonianze (qualità A e B) | Modello nuovo |
| --- | --- | --- | --- |
| Lievito della biga | 1% a 18 h e 18 °C | rapporto mediano fonte/modello 1,02 su 15 | invariato |
| Lievito del poolish | 0,25%·(12/h)^2,55 | troppo ripido: a 16 h le fonti stanno più in alto | 0,25%·(12/h)^1,9 |
| Efficacia del lievito della biga al rimpasto | 1,2 | mediana 0,81 su 16 | `BIGA_GROWTH` = 0,8 |
| Efficacia del lievito del poolish al rimpasto | 2 | mediana 1,35 su 9 (da 0,6 a 2) | `POOLISH_GROWTH` = 1,5 |
| Temperatura della biga | 16–18 °C | Giorilli 18–20, Zaghini 18–19, Barracuda 18–20 | 16–20 °C |
| Ore della biga | 16–18 h | 15–20 h, biga pronta in 18–23 h (Stadler) | 14–20 h |
| Riposo dopo il frigo, panetti | 4 h a 20 °C (come il diretto) | 1,5–2,5 h a 20–21 °C (Le 5 Stagioni, Dallagiovanna, Barracuda, Burnhard, JayArr) | `2,5 / fT(Tcasa)`, tra 2 e 4 h |

L'efficacia confronta il lievito messo nel prefermento con quello che, secondo la curva
del diretto, servirebbe per le fasi dopo il rimpasto. La regola è la stessa per biga e poolish.
È più alta nel poolish che nella biga, e l'ordine è sensato: in un impasto liquido il lievito
si moltiplica di più che in uno duro al 45%.

La dispersione è ampia: per il poolish l'efficacia va da 0,6 (albacore) a 2 (Cinzia). Le ricette
veloci con molto lievito al rimpasto (Weekend Bakery, MasterBiga, Pezzetta in teglia) non servono
a tarare questo valore e sono escluse.

**Poolish: perché la nuova curva.** Le tabelle italiane danno:

- 0,5–0,75% a 8 h;
- 0,2–0,3% a 12 h;
- 0,1% a 15–18 h.

Le fonti straniere (Fond, Weekend Bakery, Jordo, Technomitron) danno il doppio a 16 h. La curva
è stata adattata alle 12 fonti italiane (minimi quadrati in scala logaritmica) e resta 0,25% a 12 h:

| Ore a 21 °C | Prima | Ora |
| --- | --- | --- |
| 8 | 0,70% | 0,54% |
| 12 | 0,25% | 0,25% |
| 16 | 0,12% | 0,15% |
| 18 | 0,09% | 0,12% |

### Biga senza aggiunta: un'unica regola

Prima il riposo finale della biga classica era un'euristica separata:
`2 / fT × sqrt(100 / percentuale)`. Ora usa la stessa logica dell'aggiunta. L'impasto finale
lievita per le ore equivalenti che il lievito della biga sostiene secondo la curva del diretto:

```
heq_dopo = heqForYeast(0,8 × y_biga × quota / yeastK)
appretto = (heq_dopo − impasto − puntata − staglio) / fT(Tcasa), tra 1 e 8 ore
```

A 20 °C con biga all'1%:

- biga al 100%: 4 ore e 45 minuti dopo il rimpasto (prima 3 ore e 45);
- biga al 50%: 7 ore e 30 minuti (prima 4 ore e 50).

Con le testimonianze senza aggiunta il modello si avvicina:

| Fonte | Ore equivalenti della fonte | Ore equivalenti del modello |
| --- | --- | --- |
| Le 5 Stagioni, 40% | 8,8 | 8,7 |
| Ooni, 100% | 8,5 | 8,7 |
| Pizza Making Forum, 50% | 8,6 | 7,4 |
| Nuts and Twigs | 8,5 | 6,6 |
| Stadler | 8,5 | 5,9 |

Fanno eccezione:

- **BiancoLievito:** è una teglia con appretto a 28 °C;
- **Barracuda:** è un consiglio generico con 36 ore di frigo.

La biga con aggiunta e il poolish mantengono l'appretto `3 / fT(Tcasa)` e calcolano la dose al
rimpasto. Con la biga al 50% a 20 °C senza frigo l'aggiunta sale da 0,19% a 0,39%. È dentro la
fascia delle ricette: 0,23% per Maraio, Loberti e Gustoblog; 0,4% per Gustoblog pizza; 0,2–0,5%
per Malati di Pizza.

### Cosa non cambia, e perché

- **Biga al 20–40%.** È molto comune (Zaghini, Dallagiovanna, Dissapore, Le 5 Stagioni) e
  quasi sempre ha frigo lungo o una piccola aggiunta. Non la apriamo ancora: senza aggiunta
  l'appretto supererebbe le 8 ore.
- **Frigo dopo il rimpasto della biga senza aggiunta: resta a 18 ore.** Le 5 Stagioni (40%,
  24 h) e Barracuda (50%, 24–48 h) vanno oltre, ma con la biga al 100% il modello indica troppo
  lievito per un frigo lungo, e non ci sono prove dirette.
- **Biga lunga e biga in frigo.** La biga lunga (24 h a 4 °C più 24 h a 18–20 °C) è il metodo
  più citato dopo la biga corta: Giorilli, Zaghini, Dissapore, Esposito. Per le case calde esiste
  anche la biga in frigo: 2–4 h fuori, poi 16–20 h in frigo (Stadler, Scarcia, Vincenzo's Plate).
  Esclusi in questa revisione; la biga lunga è stata aggiunta il 14 novembre (sezione “Biga lunga”). Brigandi riporta una biga non matura dopo 24 h in frigo, pronta dopo altre 5 h
  a 26 °C: la sola temperatura non basta a prevedere questi percorsi, quindi prima vanno provati.

## Revisione del 13 novembre 2026 (sera): poolish, rimpasto, acqua, confronto

### Cosa era sbagliato

La dose del poolish veniva dalla sola ricetta Ooni: 5 g di fresco su 350 g di
farina, cioè **1,43% per 12 ore**, a 20 °C assunti. Quattro fonti indipendenti
danno invece valori **5–7 volte più bassi**:

| Ore | Video Pizza Pane e fantasia (20–22 °C) | Dissapore, Giorilli | Gustoblog | Technomitron (22–24 °C) |
| --- | --- | --- | --- | --- |
| 8 | 0,5% (8–9 h) | 0,5% (8–9 h) | 0,75% | — |
| 12 | 0,3% (10–12 h) | 0,3% (10–12 h) | 0,2% | 0,4% |
| 13–14 | 0,2% | 0,2% | — | — |
| 15–18 | 0,1% | 0,1% (15–16 h) | 0,1% (18 h) | 0,2% (16 h), 0,1% (18 h) |

Secondo le stesse tabelle, con l'1,43% il poolish arriva al picco intorno alle 4–6 ore:
a 12–16 ore è già oltre la maturazione. La ricetta Ooni funziona perché mette tutto il
lievito nel poolish e accorcia le fasi dopo il rimpasto, ma non descrive un poolish
maturo a 12 ore. Il poolish di Pezzetta (0,1% per 18–20 ore a 18–22 °C) conferma
l'ordine di grandezza.

Fonti consultate in questa revisione:

- [Dissapore, Biga e poolish senza errori](https://www.dissapore.com/ricette/biga-e-poolish-fatti-in-casa-senza-errori/):
  biga Giorilli con 44% d'acqua e 1% di lievito, 16 h a 18–20 °C; tabella del poolish; segni di maturità.
- [Gustoblog, Poolish](https://www.gustoblog.it/2023/09/18/poolish-cose-e-come-preparare-il-preimpasto-dei-lievitati):
  tabella 2 h 3%, 4 h 1,5%, 8 h 0,75%, 12 h 0,2%, 18 h 0,1%; poolish al 20–40% della farina.
  Un esempio della pagina contraddice la sua tabella (3% per 8 ore).
- [Scatti di Gusto, poolish di Luca Pezzetta](https://www.scattidigusto.it/lezioni-di-pizza-il-poolish-o-biga-liquida-di-luca-pezzetta):
  0,1% per 18–20 h a 18–22 °C, con **lievito aggiunto al rimpasto** (circa 1,3% con malto, teglia veloce).
- [Scatti di Gusto, biga di Zaghini](https://www.scattidigusto.it/2017/01/27/lezioni-di-pizza-biga-vincente/):
  44% d'acqua, 1% di lievito, 16 h a 18–19 °C; biga lunga di 24 h a 4 °C più 24 h a 18–20 °C;
  piccola aggiunta di lievito al rimpasto.
- [Scatti di Gusto, biga e poolish di Lioniello per la teglia](https://www.scattidigusto.it/la-mitica-ricetta-biga-poolish-per-la-teglia-di-salvatore-lioniello/):
  poolish all'1% per 16 h a 4 °C. Conferma che il poolish freddo è un percorso diverso.
- La tabella del video è in [indiretti-video-2026-11-12.md](ricerca/indiretti-video-2026-11-12.md),
  quella di Technomitron in [indiretti-fonti-modelli-2026-11-13.md](ricerca/indiretti-fonti-modelli-2026-11-13.md).

### Nuova dose del poolish

```
y_poolish = 0,25 × (12 / ore)^2,55 × fT(21) / fT(Tpoolish)     % di fresco sulla farina del poolish
```

La formula interpola le tabelle: a 21 °C dà 0,70% a 8 h, 0,25% a 12 h, 0,12% a 16 h e 0,09% a 18 h.
I test controllano che resti dentro le fasce delle fonti. Il dominio passa a
**8–18 ore e 18–24 °C**, coperto dalle tabelle. La biga resta a 16–18 h e 16–18 °C.

### Lievito al rimpasto (solo poolish)

Le ricette di pizza con poolish a dose bassa aggiungono lievito al rimpasto,
perché il poolish da solo non basta per le ore che seguono. L'app calcola la dose
con il **modello già tarato del diretto**, applicato solo alle fasi dopo il rimpasto:

```
heq_finale = heqOf(impasto, puntata, staglio, [frigo], appretto)
aggiunta   = max(0, yeastPct(heq_finale) × yeastK − 2 × y_poolish × quota)
```

Il fattore 2 (`POOLISH_GROWTH`) è un'**ipotesi prudente, non tarata**: durante la
maturazione il lievito del poolish si moltiplica, ma non abbiamo misure di quanto.
Verifica di coerenza: Ooni usa 0,48% sulla farina totale per circa 6–8 ore dopo il
rimpasto; per lo stesso tempo la curva del diretto dà 0,44%.

Conseguenze:

- Per il poolish il frigo dopo il rimpasto arriva a **24 ore**. Più ore di frigo
  significano meno lievito al rimpasto, come nel diretto.
- Durata delle fasi del poolish:
  - appretto: `3 / fT(Tcasa)` ore, tra 2 e 6, senza frigo; `4 / fT(Tcasa)` dopo il frigo;
  - puntata: `1 / fT(Tcasa)`, tra 45 minuti e 2 ore.
- Di base la biga resta **senza aggiunta** (Gozney, Giorilli al 100%), con frigo fino a 18 ore.
  L'aggiunta è facoltativa: vedi la sezione seguente.

### Lievito facoltativo al rimpasto della biga

Nella pagina Lievitazione, con la biga, l'utente sceglie tra **solo il lievito della biga**
(predefinito, metodo classico) e **un po' di lievito anche al rimpasto**. Le ricette
italiane con biga al 20–50% lo aggiungono spesso: Malati di Pizza 0,2–0,5% sulla farina
totale con biga al 50%, Zaghini una dose minima. Con l'aggiunta si usa la stessa formula
del poolish, con un fattore di crescita diverso:

```
aggiunta = max(0, yeastPct(heq_finale) × yeastK − 1,2 × y_biga × quota)
```

Il fattore 1,2 (`BIGA_GROWTH`) è scelto perché la biga al 100% a 20 °C non riceva
aggiunta, come nella ricetta Gozney. Con la biga al 50% dà circa 0,2% sulla farina
totale, dentro la fascia delle ricette italiane. È un'ipotesi da tarare in cucina.

Con l'aggiunta:

- l'appretto segue la regola del poolish (`3 / fT(Tcasa)` senza frigo);
- il frigo dopo il rimpasto arriva a 24 ore;
- con molte ore di frigo l'aggiunta può scendere a zero: il modello stima che il
  lievito della biga basti già. Senza aggiunta il frigo resta limitato a 18 ore,
  per prudenza.

La scelta si salva come `prefAdd` (booleano). Le ricette precedenti non hanno il
campo e restano senza aggiunta, senza comparire come differenza. Il cambio passa
dalla finestra di conferma, che mostra il lievito al rimpasto prima e dopo.
Cambiare metodo riporta la scelta al valore predefinito.

### Temperatura dell'acqua al rimpasto

Al posto della formula a quattro fattori si usa un bilancio termico pesato sulle masse.
La formula a quattro fattori dà lo stesso peso a prefermento e farina, e sbaglia molto
con la biga al 100%:

```
Tacqua = ((23 − attrito) × ΣC − Cpref × Tpref − Cfarina × Tcasa) / Cacqua
C = massa × calore specifico (acqua 4,18; farina 1,75 kJ/kg·K)
```

L'attrito vale 2 °C a mano e 8 °C con l'impastatrice, come nel diretto. Il risultato
è limitato tra 2 e 35 °C, con un avviso quando servirebbe acqua più fredda o più calda.
È una stima: il piano chiede sempre di controllare con il termometro.

### Confronto e consigli

Nella guida, le quattro opzioni (biga 50 e 100%, poolish 30 e 50%) vengono organizzate
sui **dati reali** dell'utente. Per ciascuna si vedono:

- posto e temperatura per il prefermento, ora di preparazione e maturazione;
- lievito nelle due fasi e acqua del rimpasto con la sua temperatura;
- ora dell'impasto finale, frigo e lavori notturni;
- difficoltà del rimpasto a mano e gusto atteso, presentato come tendenza e non come promessa.

La ricerca automatica:

- esplora il frigo a passi di 30 minuti: 8–18 h per la biga, 8–24 h per il poolish;
- con casa a 25 °C o più, a parità di lavori notturni, preferisce il frigo;
- mostra il confronto con la migliore alternativa senza frigo.

Per un prefermento maturo che non si può usare subito, l'app consiglia di aspettare
al massimo circa un'ora per la biga e mezz'ora–un'ora per il poolish. Oltre, va messo in
frigo e il rimpasto va fatto nella stessa giornata. Sono indicazioni pratiche,
**non calcolate**: il piano non si ricalcola.

### Cosa resta da fare

1. Prove in cucina: poolish 30% di 12 h senza frigo, poolish 30% con 24 h di frigo, biga 100% senza frigo.
2. Tarare `POOLISH_GROWTH` sui tempi osservati dopo il rimpasto.
3. Tarare `BIGA_GROWTH` con prove di biga al 50% con e senza aggiunta.
4. Percorso dedicato per il poolish freddo. La biga lunga è stata aggiunta il 14 novembre.

## Guida e organizzazione automatica (13 novembre 2026)

La ricerca ampliata è in [Fonti, modelli e guida automatica](ricerca/indiretti-fonti-modelli-2026-11-13.md):
oltre venti riferimenti fra produttori, autori di ricette, studi e algoritmi pubblicati,
con limiti di accesso e trasferibilità. Nessuna nuova fonte valida universalmente
le formule correnti. Non sono stati ampliati gli intervalli biologici supportati.

Nella pagina Lievitazione, dopo aver scelto biga o poolish, **Organizza per me**
cerca un percorso per una preparazione nuova. Mantiene quota di farina,
temperatura del prefermento, farina, stile, idratazione, quantità e ora della cena.
Esplora la maturazione a intervalli di 15 minuti (biga 16–18 ore, poolish 12–16)
e il frigo dopo il rimpasto (0 oppure 8–18 ore, sempre a intervalli di 15 minuti).
Il riposo finale torna al suggerimento automatico; questa modifica è esplicita
nella proposta. Il lievito viene ricalcolato con la formula esistente, senza
aggiunte al rimpasto. Non si cercano temperature che l'utente non ha dichiarato.

Si scartano i candidati incompatibili con disponibilità, temperatura, bilanci e
limiti della farina. L'ordine di preferenza è deterministico: meno lavorazioni
nella fascia 23–7, poi meno ore di frigo, poi maturazione più vicina al riferimento
di 18 ore per biga e 14 per poolish. Si considerano preparazione, rimpasto,
staglio, pieghe, ingresso/uscita dal frigo, accensione forno, stesura e cotture.
Il controllo nota anche un intervento breve che attraversa le 23. Se la notte
è inevitabile, la proposta lo segnala; non dice di aver risolto il vincolo.
Questo ordinamento ottimizza l'organizzazione, non il sapore o la maturazione.
Il freddo resta un adattamento da provare in cucina: non diventa validato
perché evita un intervento notturno.

Il confronto biga 50/100% e poolish 30/50% usa **1 kg della stessa farina e la
stessa idratazione finale** per spiegare i bilanci. Non promette risultati o
tempi proporzionali alla percentuale. I pulsanti cercano poi una proposta per
numero e peso reali delle pizze, dove la farina totale tiene conto anche del
peso del lievito. Se un cambio metodo richiede una temperatura diversa, questa
è mostrata prima della conferma; non si cambia automaticamente farina o idratazione.

Nessuna scelta viene applicata prima della conferma prevista dall'interfaccia.
Al momento di confermare si ricontrolla che l'inizio non sia già passato. Le
scelte confermate usano i campi esistenti: dosi, timeline, calendario, modalità
cucina, versioni ed esportazione seguono lo stesso percorso, senza nuovo schema.
I prefermenti già preparati restano esclusi dalla ricerca automatica: non se ne
riscrivono quantità e storia termica.

La guida distingue frigo dopo il rimpasto, maturazione fredda del prefermento
e mantenimento di un prefermento maturo. Gli ultimi due richiedono processi
dedicati e non sono ottenuti allungando arbitrariamente quelli attuali.

## Ambito

La pagina Lievitazione permette di scegliere impasto diretto, biga o poolish.
La percentuale indica la farina nel prefermento divisa per la farina totale,
non il peso del prefermento nell'impasto.

| Campo | Biga | Poolish |
| --- | --- | --- |
| Farina totale nel prefermento | 50–100% | 30–50% |
| Acqua sulla farina del prefermento | 45% | 100% |
| Temperatura del prefermento | 16–20 °C | 18–24 °C |
| Maturazione scelta dall'utente | 14–20 ore | 8–18 ore |
| Farina | Mix con Manitoba o forte | Almeno media |

La biga in frigo per le case calde ha limiti propri: 2–4 h fuori a 21–26 °C, poi 16–20 h in frigo (sezione “Biga in frigo”).

La biga lunga ha limiti propri: 24 h in frigo, poi 22–26 h a 18–20 °C, solo con farina forte (sezione “Biga lunga”).

Entrambi prevedono l'impasto finale a 16–26 °C in casa, senza
altro lievito. È disponibile anche un passaggio facoltativo dell’impasto finale
in frigo: 0 ore per escluderlo, oppure 8–18 ore a 3–5 °C misurati. La temperatura del prefermento è una scelta separata:
il programma non presume che una casa a 26 °C abbia un posto a 18 °C.
L'utente deve poter mantenere davvero la temperatura indicata.

Il percorso dedicato non viene chiamato “24 ore”: la durata effettiva comprende
15 minuti di preparazione del prefermento, maturazione, 30 minuti di impasto finale,
puntata, 15 minuti di staglio e appretto. Stesura e cottura si aggiungono dopo.
Gli orari si calcolano a ritroso dalla prima pizza in tavola. Se l'inizio è passato,
il piano è indisponibile; non si abbrevia arbitrariamente la maturazione e non si
passa automaticamente all'impasto diretto. Gli interventi notturni sono segnalati:
non vengono spostati alterando la maturazione di un prefermento senza frigo.

## Fonti consultate

- [Gozney, Adam Atkins, 100% Biga Pizza Dough](https://www.gozney.com/blogs/recipes/100-biga-pizza-dough-recipe):
  biga al 45% d'acqua, 1% di lievito sulla sua farina, 16–18 ore a 16–18 °C;
  nessuna aggiunta di lievito al rimpasto. Temperatura finale 23–24 °C.
  Il percorso pubblicato usa malto e un riposo finale più breve del nostro.
  Verifica del 13 novembre: l'elenco dice “yeast” senza specificare il tipo;
  l'interpretazione come fresco del modello è un'ipotesi, coerente con altre
  formule tradizionali, e non una specifica esplicita di questa ricetta.
- [Ooni, Our Best Poolish Dough](https://eu.ooni.com/blogs/recipes/our-best-poolish-dough):
  poolish con 350 g ciascuno di farina e acqua e 5 g di lievito fresco,
  12 ore; aggiunta di 700 g di farina, 2 ore di riposo e, per la variante senza
  frigo, 4–6 ore in panetti. Non è precisata la temperatura ambiente.
  La ricetta propone anche 2 g istantaneo o 3 g secco attivo al posto dei 5 g
  fresco: non coincide esattamente con il rapporto 3:1 adottato dall'app.
  Il tipo di secco resta una fonte di incertezza del modello attuale.
- [King Arthur Baking, Preferment](https://www.kingarthurbaking.com/pro/reference/preferment):
  conferma rapporto acqua/farina del poolish, assenza di sale nel prefermento,
  dipendenza della dose di lievito da tempo e temperatura, e importanza dei
  segnali di maturazione. Non fornisce una formula universale per la pizza.
- [American Society of Baking, Poolish](https://asbe.org/article/poolish/):
  conferma l'impostazione ma pubblica una tabella a temperatura dell'impasto
  di 26–29 °C. **Non va letta come tabella a 20 °C.** Le dosi sono diverse da
  quelle della ricetta Ooni: non ne abbiamo ricavato una media arbitraria.

Queste fonti confermano la struttura dei metodi. Non validano tutte le percentuali,
le temperature e gli stili disponibili nell'app. I testi nell'app sono originali.

## Gestione del frigo e del tempo finale scelto dall’utente

Il frigo riguarda **l’impasto dopo il rimpasto**, non la biga o il poolish.
La maturazione del prefermento e la relativa dose di lievito restano quelle
sopra. Non si usa `heqOf` per trasformare il freddo in ore equivalenti di
maturazione del prefermento e non si applica la curva del diretto.

Riferimenti riletti il 12 novembre 2026:

- La ricetta Gozney citata sopra propone anche un’ora a temperatura ambiente
  dopo lo staglio, poi frigo. Non specifica durata del freddo e rinvenimento.
- La ricetta Ooni citata sopra propone una notte in frigo dopo le due ore di
  puntata e lo staglio. Non specifica temperatura del frigo né rinvenimento.
- [MasterBiga, Vincenzo Angelucci, Perché usare la biga?](https://www.masterbiga.cloud/20200430_biga.html)
  descrive una **biga lunga** con freddo iniziale e successiva maturazione
  a temperatura controllata. È un metodo diverso: non lo si ottiene
  mettendo in frigo per altre ore la biga corta già matura dell’app.

**Scelte del team da verificare, non valori validati dalle ricette:** finestra
8–18 ore per il freddo e frigo a 3–5 °C. Non è una taratura sperimentale per
tutte le combinazioni di percentuali, farine e stili. Il lievito non viene
ridotto allungando il frigo: il prefermento deve comunque maturare prima.
Questo limita la previsione della crescita dopo il rimpasto; lo segnaliamo
nel piano con l’invito a controllare l’impasto prima e dopo il freddo.

Sequenza per tonde con biga: rimpasto, puntata, staglio, un’ora di riposo
prima del frigo, freddo, riposo finale fuori frigo. Per tonde con poolish:
rimpasto, puntata, staglio, freddo, riposo finale. Per teglia: rimpasto,
puntata, massa in frigo, staglio e riposo finale; è un adattamento del team,
non una sequenza verificata dalle due ricette. Senza frigo i percorsi
precedenti sono conservati.

Dopo il frigo, suggerimento iniziale `4 / fT(Tcasa)` ore, arrotondato a
15 minuti e limitato a 2–6 ore per tonde, 3,5–6 per teglia. È un’euristica
ripresa dal rinvenimento del diretto, **non una taratura degli indiretti**.
Non assume che l’impasto sia fermo durante il freddo. Non stima il tempo
esatto necessario al cuore dell’impasto per riscaldarsi.

L’utente può lasciare `prefOut=0` per il suggerimento oppure scegliere
un riposo finale di 1–10 ore, purché entro il 50–150% della stima.
Questi margini sono limiti di prodotto, non soglie biologiche: servono a
non dare un piano apparentemente affidabile per scelte molto lontane dalla
stima. Le scelte rifiutate hanno un motivo; non vengono corrette in silenzio.
La dose del prefermento non viene modificata per far coincidere una scelta
arbitraria di appretto con l’ora di cena.

Tutti gli orari sono ricavati a ritroso dalla cena. L’aggiunta di ore di
frigo anticipa l’inizio, lasciando invariata la cena; non recupera un inizio
già passato e non equivale a riprogrammare un impasto già avviato.
Il riepilogo mostra preparazione, rimpasto, ingresso e uscita dal frigo.
Ingresso e uscita sono azioni incluse nei promemoria calendario e in cucina.
Le istruzioni invitano ad aspettare e rimandare la cottura con panetti ancora
freddi e tenaci, oppure ad anticiparla con panetti già gonfi e fragili.

## Formule e ipotesi esplicite

La curva `yeastPct(heq)` del diretto non viene estesa ai prefermenti. La dose
fresca sulla farina del prefermento è calcolata da due riferimenti distinti:

```
biga:    y = 1 × (18 / ore) × fT(18) / fT(Tprefermento)
poolish: y = 0,25 × (12 / ore)^1,9 × fT(21) / fT(Tprefermento)   (revisione della notte del 13 novembre)
```

**20 °C per il riferimento Ooni è una nostra assunzione**, perché la ricetta
non dà la temperatura. Anche la proporzionalità inversa con il tempo e l'uso di
`fT` per correggere queste dosi sono approssimazioni del team entro i soli
intervalli supportati, non leggi validate per questi prefermenti.
Il riferimento biga è fissato all'estremo 18 ore/18 °C della finestra Gozney.
La dose in percentuale sulla farina totale è `y × percentuale / 100`.
Il secco vale un terzo del fresco, come nel motore esistente.

Per l'impasto finale si usano stime, arrotondate a 15 minuti:

```
biga:    puntata = 1 / fT(Tcasa)
         appretto = 2 / fT(Tcasa) × sqrt(100 / percentuale)
poolish: puntata = 2 / fT(Tcasa)
         appretto = 5 / fT(Tcasa) × sqrt((100/3) / percentuale)
```

**Superato:** queste regole sono state sostituite il 13 novembre. Valgono la sezione “Revisione
del 13 novembre 2026 (sera)” per il poolish e la sezione “(notte)” per la biga. Le formule
restano qui come storia.

Per il poolish, 2 e 5 ore sono ancorate al percorso Ooni con un terzo della
farina prefermentata. Per la biga si è scelto un riposo più prudente rispetto
al percorso Gozney, che contiene malto. **La correzione con la radice della
percentuale è una nostra euristica non validata.** La quantità di lievito
iniziale non descrive da sola la popolazione attiva dopo la maturazione:
non viene sommata a una seconda dose stimata per il diretto.

Le varianti per teglia ereditano stesura e cottura del motore, ma non il
moltiplicatore del lievito del diretto. Sono anch'esse da verificare in cucina.
Non si calcola una temperatura numerica dell'acqua con la formula del diretto:
le istruzioni richiedono di misurare prefermento e impasto finale con un termometro.

## Bilancio e dati

La farina totale comprende anche il lievito nel calcolo del peso dell'impasto.
Acqua e farina del prefermento vengono sottratte dalle dosi finali. Sale e olio
vanno solo nel rimpasto. Si rifiutano combinazioni che lasciano meno del 5% di
acqua sulla farina totale per il rimpasto. Non si arrotondano i valori intermedi;
l'arrotondamento a grammi è solo di presentazione.

Per le microdosi: soluzione con 1 g di lievito e 99 g d'acqua, prelievo di
`100 × lievito richiesto` grammi, sottraendo dal resto dell'acqua il 99% del
prelievo. Questa istruzione si mostra solo se l'acqua a disposizione basta;
altrimenti si richiede la bilancia da 0,01 g.

Le configurazioni aggiungono `method`, `prefPct`, `prefTemp`, `prefHours`,
`prefFridge` (default 0) e `prefOut` (default 0, suggerimento automatico).
Le ricette precedenti senza questi campi restano dirette, anche se aperte dopo
una ricetta con prefermento. Le note hanno due nuove chiavi stabili:
`prefermento`, `maturazione` e `avvio` (riposo prima del frigo delle tonde con biga). Salvataggio, differenze tra versioni, esportazione
JSON e ultima configurazione mantengono i nuovi campi.

## Verifica

```
node --test test/engine.test.js test/prefermenti.test.js
```

Prima di considerare questi percorsi affidabili occorrono prove in cucina:
biga 50 e 100%, poolish 30 e 50%, temperatura realmente misurata, annotando
maturazione, crescita dopo il rimpasto e risultato cotto. La variante con frigo richiede prove dedicate con 8, 12 e 18 ore,
sia per tonde sia per teglia. Ampliare a 48/72 ore e altri intervalli
solo con riferimenti e verifiche dedicati.


## Disponibilità e prefermento già preparato (12 novembre 2026)

Nella pagina Quando si distingue tra possibilità di preparare anche nei giorni
prima, disponibilità da adesso, preparazione soltanto il giorno della pizza
(con un’ora di inizio), oppure biga/poolish già preparati. I primi due casi
hanno lo stesso limite temporale: adesso. Esprimono l’intenzione dell’utente;
non sono un timer di avvio. L’inizio rimane calcolato a ritroso dalla cena e
può essere successivo alla compilazione. Per il giorno della pizza si usa il
maggiore fra adesso e data della cena all’ora indicata. Il limite vale anche
per i piani diretti: in giornata si accorciano le ore disponibili, mentre
24/48/72 ore incompatibili non sono proposti come eseguibili.

Non si comprime la biga di 18 ore in poche ore aumentando il lievito.
Le [cinque trascrizioni italiane](ricerca/indiretti-video-2026-11-12.md)
confermano la necessità di distinguere dose nel prefermento, eventuale aggiunta
al rimpasto, farina, temperatura e storia termica. La tabella poolish breve
non fornisce da sola un nuovo appretto per pizza senza lievito aggiuntivo:
non è stata sostituita alla formula esistente.

Per il preparato esistente si registrano grammi effettivi di farina, acqua e
lievito (con tipo fresco/secco), data e ora di inizio preparazione e ore già
trascorse in frigo. `prefTemp` e `prefHours` devono descrivere la ricetta
originale: non sono una nuova prescrizione applicata retroattivamente.
Farina scelta nella pagina Ingredienti deve essere quella realmente usata.
Le proporzioni acqua/farina e lievito/farina vengono mostrate anche quando
non si può produrre un piano. Nessuna quantità già mescolata viene scalata.
Si considera tutta la porzione registrata; per usarne meno, occorre registrare
le dosi relative alla sola porzione da usare, non solo il peso del composto.

Per ottenere il bilancio delle quantità richieste dall’utente:

```
farina totale = (peso impasto richiesto − lievito già pesato)
                / (1 + (idratazione + sale + olio) / 100)
quota prefermentata = farina già pesata / farina totale × 100
```

Il peso richiesto include il 2% per perdite, come negli altri percorsi.
Il resto della farina e dell’acqua si aggiunge solo al rimpasto; il lievito
nuovo resta zero. La quota realmente risultante deve rientrare nei limiti del
metodo: 50–100% biga, 30–50% poolish. Il selettore della quota teorica è nascosto
per il preparato esistente: non può cambiare la quantità già usata.

**Ambito volutamente limitato del piano per preparati esistenti:**

- Idratazione già registrata al 45% biga o 100% poolish (tolleranza numerica
  0,01 punti percentuali), temperature e durate supportate dal metodo.
- Nessuna fase già trascorsa in frigo: le ricette dei video con biga fredda
  sono diverse e spesso prevedono altro lievito al rimpasto.
- Dose reale fresca equivalente fra 50 e 150% del riferimento attuale.
  È un margine di prodotto prudente, **non una validazione biologica**.
  Una dose fuori margine non è dichiarata sbagliata: non usiamo però questo
  modello per fingere di conoscerne i tempi. La comune tabella poolish con
  dosi più basse resta un percorso diverso, da implementare interamente.
- Il rimpasto richiesto dalla cena deve cadere fra la fine della maturazione
  indicata e 30 minuti dopo. La fine è data da inizio registrato + 15 minuti
  di preparazione + ore di maturazione. Anche questa finestra è un limite
  del programma, non una garanzia che il prefermento sia pronto o conservabile.
  Occorre verificare i segni di maturazione e l’assenza di collasso.

Le combinazioni non supportate restano registrate nell’ultima configurazione
locale, ma il piano è indisponibile con un motivo. Non si ripiega al diretto.
Per i casi compatibili, timeline e calendario partono dal rimpasto: nessun
promemoria chiede di rifare il prefermento già presente. La durata residua
non comprende le fasi già trascorse; il controllo della tenuta della farina
considera invece anche il tempo dalla preparazione registrata.

`prepMode`, `prepClock` e `batch:{flour,water,yeast,started,cold}` sono salvati
in ultime scelte, ricette, versioni ed esportazioni. Le ricette precedenti
usano `plan`, `08:00` e dosi vuote. Cambiamenti dei dati reali sono confermabili
e compaiono fra le differenze. Una ricetta salvata in modalità già preparato
conserva anche il timestamp storico: riaprirla richiede di controllare i dati,
non crea automaticamente una nuova biga.
