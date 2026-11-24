# Indiretti: video italiani, lievito e organizzazione dei tempi

Verifica del 12 novembre 2026. Cinque trascrizioni automatiche italiane lette,
con descrizioni e metadati. Non sono stati osservati i filmati: gesti, consistenze
e risultati sono quelli raccontati nel parlato, non verificati visivamente.
I minutaggi sotto indicano blocchi di circa 30 secondi: per una citazione precisa
occorre controllare il segmento originale. Tutte le sintesi sono riscritte.

## Metodo e accesso alle trascrizioni

Ricerca pubblica YouTube con `python -m yt_dlp` (`ytsearch`), poi download
soltanto di descrizioni, metadati e sottotitoli `it-orig,it`, senza audio/video.
Testi convertiti con `docs/ricerca/vtt2txt.py`; materiali di lavoro in
`tmp/ricerca-indiretti/`, da non considerare testi editoriali dell’app.
La prima ricerca nella sandbox non risolveva il dominio; l’accesso autorizzato
fuori sandbox ha funzionato.

È stato proposto vidIQ, poi ne sono comparsi gli strumenti. Due tentativi al
lettore di trascrizioni per `oo7jcXuPD8k` (agente di ricerca e verifica finale)
hanno però restituito errore MCP -32001,
`Unknown tool vidiq.vidiq_video_transcript`: non si può affermare di aver letto
alcuna trascrizione tramite il plugin in questa verifica. Lo stesso video,
Biancolievito, *BIGA E POOLISH | Guida completa ai prefermenti per un pane
professionale a casa*, era stato trovato su YouTube ma il download locale dei
sottotitoli italiani è fallito con HTTP 429. Non è usato come fonte quantitativa.

## 1. Una tabella esplicita di lievito e ore del poolish

[Pizza Pane e fantasia, Tutti i segreti per un poolish sempre perfetto! Garantito](https://www.youtube.com/watch?v=3eZL8_QUovA),
29 settembre 2021. Nel parlato [02:08–03:49], percentuali di **lievito fresco sulla
farina del poolish**, con acqua pari alla farina:

| Tempo di maturazione | Fresco sulla farina del poolish |
| --- | --- |
| meno di circa 2 ore | 2,5% |
| 4–5 ore | 1,5% |
| 6–7 ore | 1% |
| 8–9 ore | 0,5% |
| 10–12 ore | 0,3% |
| 13–14 ore | 0,2% |
| 15–18 ore | 0,1% |

Temperatura dichiarata: 20–22 °C [03:49]. Il video distingue la maturazione
raggiunta dal semplice aumento di volume [06:36]. Non fornisce un ciclo completo
con dose aggiuntiva al rimpasto e tempi finali verificabili. È una tabella di
prefermento, non una ricetta universale di pizza pronta a cena.

## 2. Poolish interamente in frigorifero, con farina specifica

[Farina Petra, Tutto sul POOLISH - Introduzione](https://www.youtube.com/watch?v=G0piLnUHxMM),
9 settembre 2022. Il produttore presenta poolish con 1 kg di farina, 1 kg d’acqua
e 10 g di fresco: **1% sulla farina del poolish** [02:46], subito in frigorifero
per 24 ore [03:50–04:25], a 4 °C [00:33].

Usa espressamente Petra 0101 HP, con frumento parzialmente germogliato e attività
enzimatica elevata, per la lavorazione fredda [00:33–01:06]. Il video chiarisce
che il 20% o 50% di poolish indica la quota della farina totale destinata al
prefermento, non il peso del composto [01:06–02:12].

**Limite:** non trasferire questo percorso a qualunque farina dell’app. Le
successive ricette del ciclo non sono state analizzate qui, quindi non abbiamo
un appretto finale da importare nel modello.

## 3. Biga fredda e altra dose di lievito al rimpasto

[Malati di Pizza, PIZZA NAPOLETANA CON BIGA - La Ricetta di Malati di Pizza](https://www.youtube.com/watch?v=ZVU9D4OkviM),
12 settembre 2024. Biga: 500 g farina, 250 g acqua, 5 g fresco [01:05–01:37]:
50% d’idratazione e 1% fresco sulla farina della biga. Riposo iniziale di
20 minuti, poi frigo [03:51–04:59]; il passaggio mostrato è di circa 16 ore
[06:40]. Il video ammette una finestra più ampia, ma non misura tutte le durate.

Rimpasto: altri 500 g farina, 450 g acqua, **altri 5 g fresco**, 20 g sale
[07:49–08:57]. Totale lievito aggiunto: 10 g su 1 kg farina totale, cioè 1%.
Segue breve riposo e staglio; appretto dimostrato di 2 ore a temperatura ambiente
[11:14–13:27]. Casa e frigo non hanno temperature numeriche dichiarate nei
segmenti letti. Il suggerimento alternativo di tenere i panetti in frigo
5–6 ore [12:53] non valida una notte nel frigo dell’app senza lievito aggiuntivo.

## 4. Biga a mano: aggiunta finale dichiarata facoltativa

[Malati di Pizza, PIZZA CON BIGA - Impasto a Mano](https://www.youtube.com/watch?v=8a5eYKpsNO4),
10 settembre 2026. Biga: 500 g farina W270–290, 250 g acqua, 5 g fresco
[01:03–01:39]. Quaranta minuti fuori, poi almeno 12 ore in frigo; il caso
raccontato è una notte di circa 12–16 ore [03:50–04:22].

Al rimpasto altri 500 g farina, 450 g acqua, 25 g sale e **2 g fresco**
[04:55–06:02]. Il presentatore precisa che i 2 g sono facoltativi e possono
servire ad accorciare i tempi [05:27]. La dimostrazione li usa: non è quindi
una verifica della variante senza aggiunta. Il totale aggiunto è 7 g su
1 kg di farina, 0,7%.

Sono previsti brevi riposi in frigo durante la lavorazione manuale, poi
appretto dimostrato di 3 ore a temperatura ambiente [07:39–11:32]. Non sono
dichiarate temperature numeriche di casa/frigo. Il contenitore più alto viene
associato a raffreddamento più lento [03:18].

## 5. Perché distinguere i percorsi invece di chiamarli tutti biga

[Arte Bianca CHANNEL, BIGA o POOLISH e perché? detto in breve cosa cambia?](https://www.youtube.com/watch?v=mFqyGHOHSyc),
15 dicembre 2021. I metadati correnti riportano Arte Bianca CHANNEL, mentre
la ricerca preliminare mostrava Pizzeria da Toni: si conserva l’identità del
file completo letto, senza attribuirgli un altro autore.

Il video descrive ampie variazioni della dose del poolish in funzione di tempi
e temperature [02:48–03:55]. Distingue la biga codificata dai prefermenti con
idratazioni, farine e durate diverse [04:29–06:07]. Non pubblica una tabella
numerica completa tempo-temperatura-lievito utilizzabile nel motore.
I sottotitoli hanno numerosi errori: un passaggio trascrive “38 ore” in un
contesto incoerente [10:01]; quel numero non viene usato.

## Confronto con Lievita e decisioni di prodotto

La formula attuale del poolish deriva dalla ricetta Ooni senza altra aggiunta
al rimpasto: 5 g fresco su 350 g farina prefermentata, cioè circa 1,43%,
per 12 ore, con riferimento termico 20 °C assunto dal team. La tabella del
video1 indica 0,3% per 10–12 ore a 20–22 °C: la differenza è sostanziale e va
mantenuta visibile nella documentazione. Non basta fare una media: non abbiamo
lo stesso intero percorso finale né le stesse condizioni misurate.

Il confronto con pagine dei mulini consultate separatamente dal lavoro sui
video porta alla stessa cautela. Il [Mulino Padano](https://www.mulinopadano.it/blog/ricette/ricetta-baguette-metodo-poolish/)
riporta dosi di fresco legate alle ore, ma la sua baguette aggiunge anche
lievito al rimpasto; non è il medesimo percorso dell’app. Non usare queste
percentuali isolate per sostituire la dose del modello senza aggiunta finale.

Conseguenze ragionate dal team, non istruzioni letterali di un singolo autore:

- Chiedere separatamente **quando si prepara il prefermento** e **quando si vuole
  la pizza**. Il tempo del prefermento non comprende impasto finale, puntata,
  staglio, appretto e cottura.
- Per un piano da avviare adesso, calcolare le ore disponibili fino alla cena;
  rifiutare un metodo che non ci sta, oppure proporre un orario successivo. Non
  abbreviare biga 16–18 ore applicando una tabella del poolish.
- Per un prefermento già fatto, conservare dosi, ora di preparazione e condizioni
  realmente usate. La dose iniziale non si può ricalcolare retroattivamente.
- La sola ora trascorsa non prova la maturazione; richiedere controllo di crescita,
  struttura e tenuta prima del rimpasto.
- Un’ora in frigo per facilitare l’impasto, una notte di maturazione del prefermento
  e un riposo freddo dei panetti sono fasi diverse. Non sommarle come ore
  intercambiabili e non assumere che il freddo fermi istantaneamente la crescita.

Questa ricerca non valida in cucina i nuovi percorsi e non introduce una curva
universale del lievito per gli indiretti. Il motore del diretto resta separato.
