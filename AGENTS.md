# Lievita: guida al progetto per agenti e collaboratori

Leggi questo file prima di modificare qualcosa. Raccoglie le decisioni prese finora e il loro motivo.

## L'idea

Lievita è una web app in italiano per chi fa la pizza in casa per la prima volta. L'utente dice:

- che pizza vuole;
- quante pizze, oppure le misure della teglia;
- a che ora vuole la prima pizza in tavola;
- la temperatura di casa e del frigo;
- che forno ha;
- se impasta a mano o con l'impastatrice;
- che farina e che lievito ha.

L'app calcola le dosi, la quantità di lievito e l'orario di ogni passaggio, contando all'indietro dall'ora di cena. Poi lo guida con una modalità cucina, un passaggio alla volta.

Dal 25 novembre 2026 ci sono anche il pane in casa e i panini per burger e smash burger, con il tangzhong (vedi sotto). Più avanti si allargherà agli altri lievitati: focaccia, brioche, cornetti.

## Analisi di mercato (novembre 2026)

Esistono già molte app che calcolano dosi e orari partendo dall'ora di cena. Sono quasi tutte progetti di sviluppatori singoli con poche recensioni, quindi nessuna domina:

- Fornata, Crustly, Doughminator, PizzaCoach Pro, PizzaPlan, Pizzaiolo (Pizzateig Rechner), Impasto, Doughmate, MyPizzaTool, Kneady Pizza;
- l'app Ooni;
- in Italia PizzApp+ e Lievitati Lab. Lievitati Lab copre già pizza, pane e focaccia con una timeline personalizzata.

Ricette personali, diario delle cotture e versioni esistono, ma sparse tra app diverse e soprattutto in app inglesi per il pane (Rise, DoughBuddy+, BreadAdvisor, MyDoughDiary, Homebaker). Non abbiamo trovato un'app che metta insieme tutto questo:

- la ricetta dell'utente;
- lievito e orari ricalcolati per l'ora di cena e la temperatura;
- note fisse su ogni passaggio;
- versioni della ricetta;
- tutto in italiano e pensato per la pizza.

È questo lo spazio di Lievita.

**Come vogliamo distinguerci:**

1. **Davvero per il principiante.** Domande semplici, nessun gergo tecnico obbligatorio.
2. **Farine reali per paese.** Si parte dall'Italia, con marche come Caputo Pizzeria, Caputo Nuvola e Manitoba. Il motore però ragiona sulle caratteristiche della farina (forza, idratazione massima, ore massime di lievitazione), non sulla marca.
3. **Cottura specifica per ogni forno:** forno di casa con teglia, pietra o acciaio; fornetto tipo G3 Ferrari; forno a gas tipo Ooni o Gozney; forno a legna.
4. **Ricette personali che si adattano** a orario e temperatura, con note per passaggio, versioni e un voto per ogni cottura.
5. **Stili italiani:** napoletana classica, contemporanea, canotto, tonda romana, teglia. Le app straniere ragionano su "Neapolitan" e "New York".

## Decisioni prese

- **Nessuna AI dentro l'app.** I contenuti sono scritti dal team, verificati incrociando più fonti affidabili e riscritti con parole nostre. "Ricette scritte da persone" è anche un argomento di vendita. Le dosi vengono da formule deterministiche.
- **Diritto d'autore.** Tecniche e idee si possono usare. Testi, foto e video altrui non si copiano mai: si riscrive tutto. Se possibile si coinvolgono pizzaioli o panificatori come collaboratori citati.
- **Non tutto si può testare in cucina.** La fiducia nei numeri si costruisce così:
  - modelli consolidati per il rapporto tra lievito, tempo e temperatura;
  - consigli confermati da più fonti;
  - test reali solo sui percorsi principali;
  - in futuro, il voto degli utenti dopo ogni cottura per trovare i percorsi che non funzionano. Si può distinguere tra "testata dal team" e "calcolata".
- **Prima web app, Flutter solo dopo.** Il piano di validazione:
  1. motore verificato;
  2. test con 10–20 persone reali;
  3. web app;
  4. app nativa solo quando sappiamo cosa costruire.
- **Hosting su GitHub Pages:** solo file statici, nessun server.
- **Salvataggio nel browser** (localStorage), più esportazione e importazione in JSON. Limite noto: su iPhone Safari può cancellare i dati dei siti non aperti per circa 7 giorni, a meno che l'app sia aggiunta alla schermata Home. Quando servono account e sincronizzazione, il passo previsto è Supabase (o Firebase), chiamato direttamente dalla pagina statica.
- **Notifiche:** il web non può programmare notifiche affidabili a ore di distanza. La soluzione attuale è un file calendario `.ics` con un avviso per ogni passaggio da fare, più i link a Google Calendar. Le notifiche push vere richiedono un server e, su iPhone, l'app installata nella schermata Home.

## Stato attuale

L'app è `index.html`, funzionante e senza dipendenze: solo i font Google. Dal 24 novembre 2026 è pronta per GitHub Pages:

- `manifest.webmanifest` e `icons/` (sorgente `icons/icon.svg`; le PNG 512, 192 e 180 sono ricavate da quella) per aggiungerla alla schermata Home;
- `sw.js`, service worker per l'uso offline: rete prima per la pagina, copia salvata per icone e manifest, font aggiornati in background. Se cambia l'elenco dei file da salvare, aumentare `VERSION`;
- `.nojekyll` e `.gitignore`. La cartella `tmp/` (PDF, trascrizioni e sottotitoli di terzi) resta fuori dal repository, che su Pages gratuito è pubblico.

Tutti i percorsi sono relativi, perché Pages pubblica l'app in una sottocartella (`utente.github.io/lievita/`). `index.html` contiene due blocchi `<script>`:

1. **`<script id="engine">`: il motore.** Dati (`STYLES`, `FLOURS`, `OVENS`, `PLANS`), funzioni di calcolo e `state`. Non tocca il DOM, quindi si può testare in Node estraendo il blocco.
2. **Il secondo script: l'interfaccia.** Procedura a 6 pagine (cosa: pizza, pane o burger bun, quando, cucina, ingredienti, lievitazione, piano) con illustrazioni SVG disegnate nel file, pregi e difetti di stili, farine e lievitazioni (`INFO`), e una finestra che spiega e chiede conferma prima di applicare ogni modifica alla ricetta (sempre per le percentuali; per stile, farina, forno, lievito e lievitazione dopo aver visto il piano o con una ricetta salvata aperta). Poi risultati, note, salvataggio delle ricette con versioni e differenze, calendario, modalità cucina (schermo sempre acceso e timer con suono), voto finale, scheda "Le mie ricette", esportazione e importazione.

Una copia è pubblicata anche come artifact privato su claude.ai, all'indirizzo https://claude.ai/artifact/1tvoFfkSwREv6pd9HrGEH2. Lì il download del file `.ics` non funziona, mentre su GitHub Pages sì.

**Ritardi in modalità cucina (24 novembre 2026).** Ogni "Fatto, avanti" registra l'ora reale. Se l'utente è in ritardo, i passaggi successivi slittano (mai in anticipo): per impasto, pieghe, staglio e stesura conta l'ora in cui finisce; per frigo, appretto e forno l'ora in cui inizia, con 10 minuti di margine. Il frigo lungo (`frigo`, `bigafrigo`) assorbe fino al 25% della sua durata, restando sopra le 8 ore, così l'ora di cena resta ferma quando si può. La "Tabella di marcia" sotto il passaggio mostra gli orari aggiornati, barrando quelli originali. Lo stato si salva in localStorage (`lievita.cook`), legato alla sequenza dei passaggi, e si cancella dopo "Ho finito".

**Modalità cucina interattiva (25 novembre 2026).** In alcuni passaggi l'app chiede com'è l'impasto e adatta tempi e fasi alla risposta:

- maturità di biga o poolish prima del rimpasto;
- maglia glutinica dopo l'impasto, con la prova del velo e la temperatura facoltativa;
- forma dopo l'ultima serie di pieghe;
- crescita a fine puntata;
- crescita in frigo prima di toglierlo;
- prova del dito prima di accendere il forno (con il forno a legna anche prima di stendere).

Ogni domanda spiega ai principianti cosa guardare e perché conta. Le risposte diventano attese ("ricontrolliamo alle…", con timer e suono), passaggi spostati e note sui passaggi successivi ("Adattato per te").

L'ora della cena resta ferma quando si può: il frigo lungo fa da cuscinetto, accorciandosi fino al 25% o allungandosi fino al 30%. Quello che il frigo non assorbe diventa uno slittamento della cena oppure, se l'impasto corre, un'ora di frigo per frenarlo, con il pulsante per anticipare invece la cena.

Quando il fuoco si accende prima dell'appretto o appena cominciato (forno a legna con i bun, o con la pizza a 26 °C), la prova del dito si fa solo prima di stendere o spennellare, e l'appretto non propone il forno spento come cella se va acceso subito. La parte numerica è nel motore (`tlPush`, `tlPull`, `tlResize`, `riseVerdict`, `proofVerdict`…), i testi e le schermate in `CHECKS`, `planGates`, `ckAnswer` e `renderGate`. Vale sempre l'ultima risposta a un controllo, ripartendo dagli orari salvati prima della prima. Sono euristiche da validare in cucina; modello e numeri in `docs/cucina.md`, test in `test/cucina.test.js`.

**Pane (25 novembre 2026).** Nella prima pagina si sceglie Pizza o Pane. I pani sono voci di `STYLES` con `bread:true` (pagnotta, filoncini, ciabatta, siciliano a mafalda con sesamo, pugliese tipo Altamura piegato “a cavallo”, semola, integrale in cassetta, pan bauletto; uno stile può limitare i forni con `ovens`), così ricette, versioni, note, calendario e modalità cucina restano gli stessi. `catOf(style)` dà la categoria; `FLOURS` e `OVENS` hanno `cats` (nuove farine tipo 1, integrale e semola rimacinata; nuovo forno con pentola di ghisa; fornetto e forno a gas solo per la pizza). Solo impasto diretto, in giornata o 24 ore (`BREAD_PLANS`). L'ora scelta è quella del pane **già raffreddato**: all'indietro raffreddamento, infornate, incisione, appretto. Vapore con teglia d'acqua o pentola chiusa, tempi di cottura dal peso, un pane per volta in pentola. Lievito con la curva della pizza × 2 (pan bauletto × 4) e farine con crusca più veloci: **calcolato, da provare in cucina**, e l'app lo dice. Nel piano c'è il pannello “Segreti e accorgimenti” (impasto, umidità, formatura, vapore, conservazione, problemi comuni); nella prima pagina la tabella “Le differenze tra i pani”. Modello, numeri e limiti in `docs/pane.md`; test in `test/pane.test.js`.

**Burger bun e tangzhong (25 novembre 2026).** Terza categoria nella prima pagina. I bun sono voci di `STYLES` con `bread:true, bun:true` (bun al latte, smash burger con patate, brioche bun, bun all'olio) e seguono il percorso del pane; `catOf` dà `bun`. Nei bun `hyd` è il **latte**, con `egg` (uova) e `potato` (patate lesse) in più. Il bun al latte in giornata riproduce la ricetta di Malati di Pizza provata dall'utente (4% di lievito fresco in 3 ore a 20–21 °C; con una notte in frigo, dalle 21 alle 8 e poi 9 ore fuori, a 22 °C, l'utente ha usato 1,2% e i panini sono lievitati troppo: per quegli orari l'app darebbe circa 0,6%, e per il suo piano più corto fuori dal frigo circa 1,1%): `yeastK` 3,5 su 24 ricette, tetto del lievito al 4%. Giornata 3–4 ore oppure notte in frigo; teglia a 180–200 °C senza vapore, 30 minuti per intiepidire, poi la tostatura in padella. Il **tangzhong** (8% della farina con 5 volte il suo peso di latte, preso dal totale, un'ora prima di impastare; almeno un quarto del latte resta libero per il lievito, quindi 6% nel brioche bun e 6,75% nello smash) si sceglie nella pagina Lievitazione con la spiegazione dei vantaggi; vale per i bun e il pan bauletto ed è salvato in `over.tz`. Modello in `docs/bun.md`, ricerca in `docs/ricerca/bun-ricette-2026-11-25.md`, test in `test/bun.test.js`.

**Come si fa (25 novembre 2026).** Ogni passaggio ha una o due piccole animazioni dei gesti, disegnate in SVG e animate solo con CSS (`HOW`, `howScenes(key, howCtx())`): impastare a mano o con l'impastatrice, pieghe, lievitazione nel contenitore, staglio con pesata e pirlatura, lembi al centro, arrotolare, allungare, mafalda, piega a cavallo, ciabatta, frigo, preriscaldo, stesura (polpastrelli, mattarello, teglia), condimento, infornata con la pala, cottura del pane con vapore o pentola, incisione, spennellatura dei bun, raffreddamento, prefermento e tangzhong. La scena cambia con stile, forma del pane, forno, impastatrice e metodo. Si vedono in modalità cucina e, nel piano, sotto “Guarda come si fa”. Le parti che si muovono sono disegnate attorno al loro perno (0,0) dentro un gruppo spostato: così rotazioni e scale partono dal punto giusto. Con “riduci movimento” del telefono restano ferme. In cottura, raffreddamento e voto c'è la scheda “Come deve venire” (`outlook()`), e `ART.style(stile, forno)` disegna più o meno macchie scure sul cornicione secondo il forno. Test in `test/come-si-fa.test.js`.

**Correzioni dopo l'audit (27 novembre 2026).** Il rapporto è in `docs/ricerca/audit-ricette-engine-2026-11-27.md`; le correzioni:

- **Ripresa:** con un passaggio già fatto il piano si ricalcola con l'ora in cui è partita la modalità cucina (`lievita.cook` salva `cfg` e `t0`, vedi `planNow`), così dosi e percorso non cambiano; riaprendo l'app si torna in modalità cucina. `mem.last` ricorda anche ora della cena (se futura) e lievitazione.
- **Modalità cucina:** "Prima pizza" è l'ora in cui esce la prima pizza; gli orari nei testi (`tAt`) seguono gli spostamenti (`liveTimes`); la prova del dito c'è sempre prima di stendere o infornare; dopo tre attese a vuoto l'app dice che l'impasto non cresce; con i prefermenti il frigo cuscinetto resta nei limiti del percorso.
- **Dosi e avvisi:** con una biga già fatta con tutta la farina il totale segue la farina del preparato (niente farina negativa); idratazione e olio scelti dall'utente non vengono più descritti come abbassati o aggiunti.
- **Bun:** notte in frigo solo a 5 °C o meno; in giornata al fresco puntata e appretto si allungano (fino a 6 ore) invece di promettere gli stessi tempi con il 4%; uovo da pesare per dosi piccole; 9 smash per teglia.
- **Forni e cottura:** platea del forno a legna a circa 430 °C (volta sui 480 °C); carta forno con il limite di temperatura; pentola: istruzioni del produttore, orari per infornata, forno di nuovo a 250 °C; teglia troppo grande per fornetto e forno a gas segnalata; fornetto con un solo termostato; pietra del forno a gas da far recuperare; lievito secco mescolato alla farina con liquidi freddi.

Test in `test/correzioni.test.js`. Restano da decidere con prove in cucina: zucchero e grassi nella fermentazione, tangzhong nel pan bauletto, temperatura al cuore del pane morbido.

**Tema.** Il pulsante rotondo nella testata apre un menu Automatico (segue il telefono), Chiaro, Scuro. La scelta si salva in localStorage (`lievita.theme`) e uno script nel `<head>` la applica prima del disegno, per evitare il lampo di colore. Colori solo come variabili su `:root`: la palette scura è ripetuta in `@media (prefers-color-scheme: dark)` e in `:root[data-theme="dark"]`, da tenere uguali.

### Il modello di calcolo

- **Velocità di fermentazione rispetto a 20 °C:**
  - `fT(T) = 1.145^(T-20)` per T ≥ 12 °C (+14,5% per grado);
  - sotto i 12 °C: `1.145^-8 · 1.07^(T-12)`. A 4 °C vale circa 0,19.
- **Ore equivalenti (`heqOf`):** `heq = Σ durata_fase × fT(temperatura_fase)`. Le prime ore in frigo (2 per i panetti, 4 per la massa unica della teglia) contano alla temperatura media tra casa e frigo, perché l'impasto si raffredda lentamente.
- **Lievito di birra fresco in % sulla farina:** `0.55 · exp(1.53·x + 0.18·x²)` con `x = ln(6/heq)`. Oltre heq ≈ 27 prosegue in linea retta per non risalire. Limitato tra 0,02% e 3%. Per la teglia si moltiplica per 2 (`STYLES.teglia.yeastK`), una scelta prudente su 7 ricette verificate: è "calcolata, da testare" e l'app lo dice. Il lievito secco è un terzo del fresco.
- **Taratura (novembre 2026):** congiunta sulla tabella completa di Craig (`docs/craig-2014.json`) e su 18 riferimenti tra disciplinare AVPN, mulini, tabelle italiane e video di pizzaioli (`docs/riferimenti-lievito.json`). Per la temperatura ambiente pesa Craig; per il frigo le ricette italiane (la dose più bassa). Esempio: 24 ore a 20 °C, di cui circa 17 in frigo, danno 0,25% di lievito fresco. Le fonti tra loro differiscono anche del doppio: è una stima centrale, non una certezza. Dettagli e limiti in `docs/lievito.md`.
- **Temperatura dell'acqua:** `3 × DDT − 2 × temperatura_ambiente − attrito`.
  - DDT (temperatura finale dell'impasto voluta) è 23 °C in giornata e 22 °C con il frigo (con 24 °C a 20 °C di casa servirebbe acqua a 30 °C).
  - L'attrito vale 2 a mano e 8 con l'impastatrice.
  - Il risultato è limitato tra 4 e 30 °C.
- **Fasi previste:**
  - **Pizza tonda:** impasto 30 minuti, poi puntata di 1,5–2 ore, con 3 serie di pieghe se l'idratazione è almeno del 66% (ogni 20 minuti, ogni 15 se la puntata dura meno di 70 minuti). Poi staglio, frigo e appretto. L'appretto dura `4 h / fT(ambiente)`, tra 2 e 6 ore.
  - **Teglia:** impasto e puntata con pieghe, frigo con l'impasto in un'unica massa, poi staglio e appretto di `4 h / fT(ambiente)` (almeno 3,5 ore, perché la massa esce fredda dal frigo, al massimo 6), stesura in teglia con 30 minuti di riposo e cottura.
  - **In giornata:** fino a 8 ore in tutto, minimo 3. Se l'inizio cade tra le 23 e le 7 si parte alle 7:30, purché restino almeno 3 ore; altrimenti la giornata non viene proposta (di solito vale per pizza o pane a pranzo), tranne quando quell'ora è proprio quella da cui l'utente ha detto di poter iniziare.
- **Notte:** se i passaggi prima del frigo cadono tra le 23 e le 7 (compreso il tangzhong, un'ora prima di impastare), l'app sposta l'inizio prima o dopo. La durata del frigo resta tra il 65% e il 135% di quella prevista, e comunque almeno 8 ore.
- **Limiti delle farine:**
  - 00 debole: fino a 24 ore e 60% di idratazione;
  - farina per pizza: fino a 48 ore e 70%;
  - mix: fino a 72 ore e 78%;
  - forte: fino a 72 ore e 82%.
- **Fornetto tipo G3 Ferrari:** avvisi se il panetto supera 240 g o l'idratazione il 65%.
- **Forno di casa:** pietra e acciaio sul ripiano alto, a 10–15 cm dalla resistenza, con il grill a fine cottura. Per le pizze tonde napoletane si aggiunge in automatico il 2% di olio.
- **Perdite:** al peso totale dell'impasto si aggiunge il 2%.
- **Valori personalizzati dell'utente:** idratazione, sale, olio, peso del panetto e grammi per cm² prevalgono su quelli dello stile.

### Dati salvati (localStorage, chiave `lievita.v1`)

Dal 12 novembre 2026 sono presenti anche biga e poolish, come **percorsi calcolati, da provare in cucina**. Vedi `docs/prefermenti.md` per fonti, assunzioni e formule: non estendere automaticamente a questi metodi la curva del diretto.

- Scelta nella pagina Lievitazione: diretto, biga (50–100% della farina totale) o poolish (30–50%).
- Biga al 45% d'acqua, 16–18 ore a 16–18 °C; poolish al 100%, 12–16 ore a 18–22 °C. Temperatura del prefermento separata da quella di casa.
- Percorso dedicato `prefermento`: maturazione, poi impasto finale a temperatura ambiente (16–26 °C), senza altro lievito. Frigo facoltativo dopo il rimpasto: 0 oppure 8–18 ore a 3–5 °C misurati; riposo finale suggerito in base alla temperatura o scelto dall’utente entro i limiti spiegati in `docs/prefermenti.md`. Queste estensioni sono euristiche da validare in cucina. Le combinazioni non supportate sono rifiutate con un motivo, senza passaggio automatico al diretto.
- Ingredienti ripartiti tra le due fasi, passaggi in timeline, calendario e modalità cucina. Nuove note stabili: `prefermento`, `maturazione`, `avvio`. Ingresso e uscita dal frigo sono inclusi nei promemoria.
- Configurazioni e ultime scelte aggiungono `method`, `prefPct`, `prefTemp`, `prefHours`, `prefFridge`, `prefOut`, `prefAdd`. I due nuovi tempi valgono 0 nelle ricette precedenti; `prefOut=0` usa il suggerimento automatico. Le ricette senza questi campi restano dirette.
- Nella pagina Quando si indica la disponibilità: da ora, anche nei giorni prima, solo il giorno della pizza con ora iniziale, oppure prefermento già preparato. Il limite iniziale vale anche per il diretto. `prepMode`, `prepClock` e `batch:{flour,water,yeast,started,cold}` vengono salvati; le ricette vecchie mantengono il comportamento precedente. Il preparato esistente conserva grammi e tipo di lievito reali e mostra le proporzioni; il piano riparte dal rimpasto solo nei casi supportati (vedi `docs/prefermenti.md`), senza duplicare gli ingredienti o scalare le dosi già usate.
- Ricerca su cinque trascrizioni italiane in `docs/ricerca/indiretti-video-2026-11-12.md`: non applicare le tabelle poolish al solo lievito mantenendo arbitrariamente gli stessi tempi finali, né trasferire la biga fredda con aggiunte al rimpasto alla biga senza aggiunte.
- Dal 13 novembre, guida con confronto biga 50/100% e poolish 30/50%, bilanci di esempio a parità di farina e idratazione, e “Organizza per me”. Ricerca discreta nei limiti esistenti: meno lavorazioni tra 23–7, poi meno frigo, poi maturazione vicina al riferimento. Non aumenta la precisione biologica delle formule. Dosi e orari si vedono prima della conferma; preparati già esistenti esclusi. Fonti e modelli analizzati in `docs/ricerca/indiretti-fonti-modelli-2026-11-13.md`; algoritmo in `docs/prefermenti.md`.
- Dal 13 novembre (sera) il poolish usa le tabelle italiane (0,25% a 12 h e 21 °C; 8–18 h; 18–24 °C) al posto della dose Ooni, che era 5–7 volte troppo alta.
  - Al rimpasto del poolish si aggiunge lievito: curva del diretto sulle fasi finali, meno 1,5 volte il lievito del poolish (ritarato dalle testimonianze).
  - Frigo dopo il rimpasto fino a 24 h per il poolish e 18 h per la biga senza aggiunta.
  - Biga: lievito al rimpasto facoltativo (`prefAdd`, predefinito no). Con l'aggiunta il frigo arriva a 24 h. Il fattore di crescita, prima 1,2, è stato ritarato a 0,8 (vedi la revisione della notte).
  - Acqua del rimpasto calcolata con un bilancio termico pesato.
  - La guida confronta le quattro opzioni sugli orari reali.
  - Dettagli in `docs/prefermenti.md`, sezione “Revisione del 13 novembre”.
- Dal 13 novembre (notte) le tarature si basano su 59 ricette e testimonianze raccolte in `docs/ricerca/testimonianze-prefermenti.json`. Il confronto con il motore si esegue con `node docs/ricerca/confronto-prefermenti.js index.html`.
  - Biga: 14–20 h a 16–20 °C.
  - Poolish: dose 0,25%·(12/h)^1,9.
  - Efficacia del lievito al rimpasto: biga 0,8, poolish 1,5.
  - La biga senza aggiunta ricava il riposo finale dalla stessa curva, invece della vecchia radice della percentuale.
  - Dopo il frigo, i panetti con prefermento riposano `2,5 / fT(Tcasa)` ore, tra 2 e 4.
  - Biga al 20–40% resta esclusa: il motivo è in `docs/prefermenti.md`.
- Dal 14 novembre la biga ha tre tipi, nel campo `prefKind` (`corta`, `lunga`, `frigo`). Il vecchio `prefLong:true` viene letto come lunga.
- **Biga in frigo per le case calde:**
  - 2–4 h fuori a 21–26 °C, con le ore fuori calcolate da `6/fT`;
  - poi 16–20 h in frigo (in `prefHours`) e 1 h fuori prima del rimpasto;
  - dose ancorata alle ricette: 0,8% con 3 h a 25 °C e 18 h a 4 °C;
  - nuovi passaggi `bigainfrigo` e `bigafuori`;
  - dettagli in `docs/prefermenti.md`.
- **Biga lunga:** 24 h in frigo a 3–5 °C, poi 22–26 h a 18–20 °C, solo con farina forte.
  - La dose usa la stessa regola della biga corta, scalata sulle ore equivalenti: è l'1% con 24 h a 4 °C più 24 h a 18 °C.
  - Dopo il rimpasto valgono le regole della biga corta.
  - Le nuove chiavi stabili dei passaggi sono `bigafrigo` e `bigafuori`. L'uscita dal frigo ha un promemoria.
  - Per una biga lunga già preparata si indicano 20–28 ore di frigo.
  - Dettagli in `docs/prefermenti.md`, sezione “Biga lunga”.
- Eseguire anche `node --test test/prefermenti.test.js`: copre bilanci, limiti, temperature, tempi, conferme e salvataggi. Restano necessarie le prove in cucina, soprattutto per la stima dell'appretto dopo il rimpasto.

```
{ recipes: [ { id, name, created,
    versions: [ { date, note, diff:[testo], cfg:{style,flour,oven,plan,yeast,mixer,over,notes}, bakes:[{date,rating,note,room,plan}] } ] } ],
  last: { ultime scelte del modulo } }
```

Le note sono legate a chiavi fisse dei passaggi (`impasto`, `puntata`, `pieghe1-3`, `staglio`, `frigo`, `appretto`, `preriscaldo`, `stesura`, `cottura`). Così restano al loro posto anche quando cambiano gli orari.

## Prossimi passi

1. ~~Verificare la dose di lievito~~ fatto (novembre 2026, vedi `docs/lievito.md`). Confermata su 10 video di pizzaioli letti dalle trascrizioni, con rapporto mediano video/modello di circa 1,0 (vedi `docs/ricerca/README.md`, che spiega anche come usare Gemini tramite `agy` e quanto fidarsi delle sue ricerche). Restano le prove in cucina sui percorsi principali (in giornata a 18–20 °C, 24 ore contemporanea, 24 ore teglia) e, più avanti, le etichette "testata" e "calcolata".
2. ~~Preparare l'app per GitHub Pages~~ fatto (24 novembre 2026): manifest, icone, service worker, git. Repository pubblico https://github.com/antonio94770/lievita, app online su https://antonio94770.github.io/lievita/ (Pages pubblica il ramo `main`, cartella principale, a ogni push).
3. Separare il motore in un file JS a parte. I test esistono già in `test/engine.test.js` (si eseguono con `node --test test/engine.test.js`) e per ora estraggono il blocco `engine` da `index.html`.
4. Scrivere e rivedere i testi di ogni passaggio, citando le fonti nel repository (non nell'app).
5. Fare il test "a mano" con 10–20 persone: piano e promemoria mandati su WhatsApp usando il motore.
6. Validare in cucina biga e poolish inclusi i nuovi percorsi con frigo dopo il rimpasto, prima di ampliare ulteriormente le durate. Per il pane: raccogliere ricette di riferimento e tarare `yeastK` come per la pizza, provare in cucina pagnotta 24 ore, filoncini in giornata e pan bauletto, poi biga e poolish anche per il pane (vedi `docs/pane.md`). Per i bun: provare smash bun, brioche bun e la notte in frigo (vedi `docs/bun.md`). Per la modalità cucina interattiva: provare in cucina attese, fattori di velocità e frigo durante il preriscaldo, e più avanti registrare le risposte insieme al voto della cottura per scoprire i percorsi con il lievito sbagliato (vedi `docs/cucina.md`). Aggiungere più avanti: lievito madre, altri lievitati, Supabase per account e sincronizzazione.

## Convenzioni

- **Interfaccia e testi:** solo in italiano. Tono semplice e diretto, rivolto a chi è alle prime armi.
- **Niente librerie** finché non servono davvero.
- **Nessun dato personale** viene inviato altrove. Tutto resta nel browser finché non si introduce un backend.
- **Ogni modifica al motore va controllata** con `node --test test/engine.test.js`, che copre: 16, 20 e 26 °C; contemporanea e teglia; in giornata e 24 ore; spostamento notturno; confronto con le fonti di `docs/lievito.md`. Con `node --test test/pane.test.js` si controlla il pane: tutti i tipi a 16, 20 e 26 °C, in giornata e 24 ore, orari dal pane pronto all'indietro, infornate, pentola, cambio tra pizza e pane e disegno delle pagine. Con `node --test test/bun.test.js` si controllano i bun e il tangzhong: tutti i tipi a 16, 20 e 26 °C con e senza tangzhong, la ricetta di Malati di Pizza, patate, infornate, salvataggio e pagine. Con `node --test test/come-si-fa.test.js` si controlla che ogni passaggio di ogni stile, forno e metodo abbia la sua animazione. Con `node --test test/cucina.test.js` si controllano i controlli della modalità cucina: punti in cui compaiono, ogni risposta di ogni controllo, frigo come cuscinetto, cena ferma o spostata, salvataggio. Con `node --test test/correzioni.test.js` si controllano le correzioni dell'audit del 27 novembre 2026: ripresa, orari, bilanci, bun, forni. Tutti insieme: `node --test test/*.test.js`.
