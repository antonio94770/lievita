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

Più avanti si allargherà agli altri lievitati: pane, focaccia, brioche, cornetti, panini per hamburger.

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
2. **Il secondo script: l'interfaccia.** Procedura a 6 pagine (pizza, quando, cucina, ingredienti, lievitazione, piano) con illustrazioni SVG disegnate nel file, pregi e difetti di stili, farine e lievitazioni (`INFO`), e una finestra che spiega e chiede conferma prima di applicare ogni modifica alla ricetta (sempre per le percentuali; per stile, farina, forno, lievito e lievitazione dopo aver visto il piano o con una ricetta salvata aperta). Poi risultati, note, salvataggio delle ricette con versioni e differenze, calendario, modalità cucina (schermo sempre acceso e timer con suono), voto finale, scheda "Le mie ricette", esportazione e importazione.

Una copia è pubblicata anche come artifact privato su claude.ai, all'indirizzo https://claude.ai/artifact/1tvoFfkSwREv6pd9HrGEH2. Lì il download del file `.ics` non funziona, mentre su GitHub Pages sì.

**Ritardi in modalità cucina (24 novembre 2026).** Ogni "Fatto, avanti" registra l'ora reale. Se l'utente è in ritardo, i passaggi successivi slittano (mai in anticipo): per impasto, pieghe, staglio e stesura conta l'ora in cui finisce; per frigo, appretto e forno l'ora in cui inizia, con 10 minuti di margine. Il frigo lungo (`frigo`, `bigafrigo`) assorbe fino al 25% della sua durata, restando sopra le 8 ore, così l'ora di cena resta ferma quando si può. La "Tabella di marcia" sotto il passaggio mostra gli orari aggiornati, barrando quelli originali. Lo stato si salva in localStorage (`lievita.cook`), legato alla sequenza dei passaggi, e si cancella dopo "Ho finito".

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
  - **In giornata:** fino a 8 ore in tutto, minimo 3.
- **Notte:** se i passaggi prima del frigo cadono tra le 23 e le 7, l'app sposta l'inizio prima o dopo. La durata del frigo resta tra il 65% e il 135% di quella prevista, e comunque almeno 8 ore.
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
6. Validare in cucina biga e poolish inclusi i nuovi percorsi con frigo dopo il rimpasto, prima di ampliare ulteriormente le durate. Aggiungere più avanti: lievito madre, altri lievitati, Supabase per account e sincronizzazione.

## Convenzioni

- **Interfaccia e testi:** solo in italiano. Tono semplice e diretto, rivolto a chi è alle prime armi.
- **Niente librerie** finché non servono davvero.
- **Nessun dato personale** viene inviato altrove. Tutto resta nel browser finché non si introduce un backend.
- **Ogni modifica al motore va controllata** con `node --test test/engine.test.js`, che copre: 16, 20 e 26 °C; contemporanea e teglia; in giornata e 24 ore; spostamento notturno; confronto con le fonti di `docs/lievito.md`.
