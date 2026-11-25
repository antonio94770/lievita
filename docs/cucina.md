# Modalità cucina interattiva

Dal 25 novembre 2026, in alcuni passaggi la modalità cucina chiede com'è l'impasto e adatta tempi e fasi alla risposta. Il piano resta una previsione; le risposte dicono come sta andando davvero.

Le regole qui sotto sono **euristiche ragionate, non tarate in cucina**. Vanno verificate con le prove reali e, più avanti, con i voti degli utenti.

## Dove si fanno i controlli

`planGates(steps, pl)` decide i punti a partire dai passaggi del piano. Un controllo può arrivare **prima** di un passaggio (`before`: la domanda compare quando lo apri) oppure **dopo** (`after`: compare quando premi "Fatto, avanti").

| Controllo | Dove | Domanda |
|---|---|---|
| `pref` | prima dell'impasto finale, con biga o poolish | È maturo? |
| `impasto` | dopo l'impasto | Com'è la maglia glutinica? (prova del velo, temperatura facoltativa) |
| `pieghe` | dopo l'ultima serie di pieghe | Tiene la forma? |
| `rise` | prima del passaggio che chiude la puntata (staglio, formatura o frigo) | Quanto è cresciuto? |
| `frigo` | prima di togliere l'impasto dal frigo | Com'è cresciuto in frigo? |
| `proof` | prima di accendere il forno; con il forno a legna anche prima di stendere | Prova del dito |

Ogni domanda ha una spiegazione per chi è alle prime armi ("Cos'è la maglia glutinica e perché conta", "Come leggere la prova del dito"…), il pulsante "Salta il controllo" e, dopo la risposta, "Cambia risposta".

Se il controllo è previsto tra più di 15 minuti, la schermata dice l'ora e offre "Controlla adesso". Quando arriva l'ora, o finisce un'attesa, la domanda torna da sola con un suono.

## Come le risposte cambiano gli orari

Gli orari si spostano con le stesse variabili dei ritardi: `os` e `oe`, gli spostamenti di inizio e fine di ogni passaggio. Le funzioni sono nel motore (`tl*`) e si possono testare senza interfaccia.

**Regola generale: l'ora della cena resta ferma quando si può.** Il cuscinetto è il frigo lungo:

- si accorcia fino al 25%, restando sopra le 8 ore (come per i ritardi);
- si allunga fino al 30%.

Le funzioni:

- `tlPush`: un ritardo da un passaggio in poi. Il primo frigo lungo lo assorbe accorciandosi; il resto sposta la cena.
- `tlPull`: un anticipo. Il frigo lo assorbe allungandosi. Senza `toEnd` si anticipa solo quanto il frigo riesce ad assorbire, così la cena non cambia.
- `tlResize`: allunga o accorcia un riposo a temperatura di casa (puntata, appretto).
  1. Se c'è un frigo prima e l'impasto è ancora dentro, si esce prima o dopo dal frigo.
  2. Altrimenti si usa il frigo successivo.
  3. Quello che nessun frigo assorbe diventa uno slittamento della cena (se il riposo si allunga) oppure un tempo da "frenare" (se si accorcia).
- `tlStartNow`: il passaggio comincia adesso invece che più tardi, e il riposo che segue dura di più.

Un anticipo che nessun frigo assorbe non sposta mai la cena da solo. L'app propone di mettere l'impasto in frigo (`slowFridgeH`) e offre il pulsante per anticipare la cena.

Le ore di frigo si calcolano come in `heqOf`: nelle prime ore l'impasto si raffredda piano, quindi fermenta alla temperatura media tra casa e frigo. A 20 °C, per frenare un'ora di lievitazione servono circa 1,5 ore di frigo.

**Vale l'ultima risposta.** Prima della prima risposta a un controllo si salvano gli orari (`base`). Ogni nuova risposta riparte da lì, quindi rispondere di nuovo non somma gli effetti. Quando si lascia il passaggio la copia si cancella (`ckSeal`), così i ritardi registrati dopo non vanno persi.

Lo stato dei controlli (`ck`) e le note aggiunte ai passaggi successivi (`adj`, il riquadro "Adattato per te") si salvano con il resto in `lievita.cook`.

## Le decisioni

### Crescita della puntata (`riseVerdict`)

Le risposte diventano una crescita di volume `g`:

| Risposta | g |
|---|---|
| uguale | 0,05 |
| un quarto | 0,25 |
| metà | 0,5 |
| quasi doppio | 0,85 |
| più del doppio | 1,3 |

L'obiettivo segue i testi dei passaggi:

- pizza: 0,3 ("appena gonfio");
- prima di un frigo lungo: 0,25 ("deve solo iniziare a gonfiarsi");
- pane e bun in giornata: 0,9 ("quasi raddoppiato").

Se si controlla prima dell'ora prevista, l'obiettivo scala con il tempo passato.

- **Con un frigo dopo:** un impasto lento va bene, perché il frigo lo recupera. Da "quasi doppio" in su l'impasto è veloce: si va in frigo subito (anticipando, se si è in anticipo) e la seconda lievitazione si accorcia di un fattore 1,25 o 1,5, restando in frigo più a lungo.
- **Senza frigo, se f = g / obiettivo < 0,6:** si aspetta. L'attesa è il tempo per arrivare all'obiettivo, tra 15 minuti e 1 ora, poi si ricontrolla. Se l'impasto è molto indietro si suggerisce un posto più tiepido; se è fermo, di controllare il lievito. Dopo tre attese si procede comunque.
- **Senza frigo, se f > 1,35:** si va avanti subito. La seconda lievitazione si accorcia di `f^0,4` (tra 1,1 e 1,6). Per tenere l'orario si propone il frigo; in alternativa si anticipa la cena.
- **Dopo un'attesa, quando la risposta è "a posto":** la velocità reale è `(durata prevista / durata reale)^0,4`, tra 0,7 e 1. Allunga la seconda lievitazione. La correzione è smorzata perché parte della lentezza può venire dall'acqua o dalla puntata stessa, e il controllo prima del forno corregge il resto.

**Crescita accelerata.** La crescita si stima proporzionale a `t^1,5`, perché il lievito si moltiplica. Il tempo che manca dalla frazione `p` già fatta è `t·(p^(−1/1,5) − 1)` (`timeToTarget`). Con una stima lineare i tempi d'attesa venivano circa il doppio di quelli tipici.

### Uscita dal frigo (`fridgeVerdict`)

- "Quasi come prima" e "un po' più gonfi" sono normali.
- "Molto gonfi" vale una velocità di 1,35 per la seconda lievitazione; "enormi o afflosciati" vale 1,7.
- La seconda lievitazione si accorcia restando in frigo di più, entro il 30%: l'ora della cena non cambia.

### Prova del dito (`proofVerdict`)

A che punto è l'appretto (`p`):

| Risposta | p |
|---|---|
| sodi | 0,3 |
| più gonfi ma sodi | 0,65 |
| pronti | 1 |
| oltre | 1,35 |

Il tempo che manca si calcola con la crescita accelerata e si confronta con quello che il piano concede fino alla stesura o all'infornata.

- **Lento (mancano più di 15 minuti oltre il previsto):** si rimanda l'accensione del forno, al massimo di 1,5 ore per volta.
- **Avanti:** un impasto pronto regge ancora circa il 15% del suo tempo di appretto. Oltre quel margine si accende il forno all'ora prevista e intanto si mette l'impasto in frigo (`slowFridgeH`), togliendolo 15 minuti prima di stendere. In alternativa, se si è in anticipo, si accende il forno subito.
- **Oltre:** se si è in anticipo, si accende il forno subito; in ogni caso il frigo durante il preriscaldo e consigli per maneggiarlo con delicatezza.

### Impasto

- **Maglia glutinica:**
  - con le pieghe previste, "si strappa" e "appiccicoso" vanno bene;
  - senza pieghe: riposo di 10 minuti e ancora 2–3 minuti di impasto (con l'impastatrice altri 3–4 minuti);
  - "appiccicoso" ripetuto: farina a cucchiai, al massimo il 3% della farina;
  - "duro": acqua a cucchiai, sempre entro il 3%;
  - dopo due o tre tentativi si procede.
- **Temperatura (facoltativa):** lo scarto dal DDT cambia la puntata di `−min(B, 1,5) · 0,5 · (fT(T)/fT(DDT) − 1)` ore, entro il 40% della puntata. L'impasto si porta verso la temperatura di casa in circa un'ora e mezza. Si suggerisce anche l'acqua per la prossima volta: 3 °C in meno per ogni grado di impasto in più.

### Biga e poolish

- "Giovane": si aspetta 1 ora (biga) o 45 minuti (poolish), al massimo due volte.
- "Oltre": si impasta subito con l'acqua 2 °C più fredda; il controllo della puntata dirà se anticipare.

## Test

`node --test test/cucina.test.js` controlla:

- le funzioni della linea del tempo, cioè il frigo come cuscinetto e le pieghe legate all'inizio della puntata;
- le decisioni;
- che ogni piano (pizza, teglia, pane, bun, giornata e 24 ore) abbia i controlli nei punti giusti;
- che ogni risposta di ogni controllo dia un testo senza valori rotti e orari validi;
- i casi principali: puntata lenta e veloce in giornata, frigo troppo caldo, prova del dito, forno a legna, temperatura dell'impasto, biga e poolish, salvataggio.

## Da validare in cucina

- I fattori di velocità (1,25, 1,35, 1,5, 1,7) e l'esponente della crescita (1,5): sono stime.
- Il margine del 15% di un impasto pronto, soprattutto per il pane, che regge meno della pizza.
- Il frigo per frenare durante il preriscaldo, nei panetti piccoli e nel pane in stampo.
- Le risposte vanno lette insieme ai voti delle cotture: una risposta frequente su un percorso (per esempio "molto gonfi" all'uscita dal frigo) indica che la dose di lievito di quel percorso è da rivedere.
