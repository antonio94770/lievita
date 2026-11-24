# Ricerca con Gemini e verifica sui video (12/11/2026)

## Approfondimenti successivi con yt-dlp e fonti primarie

- [Indiretti: video italiani, dosi di lievito e organizzazione](indiretti-video-2026-11-12.md): cinque trascrizioni, tabella poolish a 20–22 °C, biga fredda e lievito al rimpasto. Distinzione fra pianificazione e preparato esistente; tentativo vidIQ non riuscito, documentato senza attribuire al plugin le trascrizioni locali.

- [Altri video e controllo delle descrizioni](video-descrizioni-2026-11-12.md): 10 descrizioni e 9 trascrizioni, con Malati di Pizza, Davidoctor94 e Vincenzo Abbate. **Avvertenza per il precedente riferimento Davidoctor94:** il parlato indica 7 g di fresco su 750 g, la descrizione 5 g su 1 kg; inoltre la posizione vicino al termosifone rende incerta l'ipotesi di 20 °C. Il dato precedente corrisponde al parlato, ma non va trattato come conferma quantitativa forte senza questa riserva.
- [Testimonianze su biga e poolish](testimonianze-prefermenti.json): 59 schemi da ricette, mulini, blog e forum, ciascuno con qualità A/B/C. Si confrontano con il motore usando `node docs/ricerca/confronto-prefermenti.js index.html`. I gruppi Facebook e pizzamaking.com non sono leggibili in modo automatico. Analisi in `docs/prefermenti.md`, revisione della notte del 13 novembre.
- [Manuale Necchi Pizza Genio](manuale-necchi-genio.md): profilo elettrico con resistenze separate, ricette normalizzate, differenze di gestione e incongruenze del ricettario. Nessuna modifica automatica al motore.

Obiettivo: usare Gemini per ricerche approfondite su lievito, teglia, forni, farine e stili, e per analizzare video YouTube di pizzaioli. Poi verificare ogni risultato prima di usarlo.

## Come è stata fatta

- **Gemini CLI non funziona più** con l'account gratuito ("client no longer supported", bisogna passare ad Antigravity). Abbiamo usato `agy`, la CLI di Antigravity, con il modello Gemini 3.8 Flash in modalità `plan` e `--sandbox`.
- **Gemini non può guardare i video da qui.** Interrogato su un video, ha risposto onestamente di avere solo la ricerca web. Per questo i sottotitoli automatici italiani si scaricano con `yt-dlp --write-auto-subs --sub-langs it-orig,it`, si convertono con `vtt2txt.py` (righe `[mm:ss] testo`) e si passano a Gemini come file da leggere.
- I prompt sono in `prompt/`, con le regole comuni in `prompt/_regole.txt`: fonte e citazione per ogni numero, "NON VERIFICATO" quando manca la fonte, nessun URL inventato.
- `confronto.js` confronta la dose dei video con il motore: `node docs/ricerca/confronto.js index.html`.
- Note pratiche su `agy`:
  - in modalità non interattiva serve `--dangerously-skip-permissions`, altrimenti nega `read_url`;
  - ogni passo del modello richiede 1–3 minuti, quindi una ricerca dura 20–40 minuti;
  - con `--output-format stream-json` la risposta è nell'evento `result.response`;
  - in modalità `plan`, se deve leggere file, a volte si ferma su un piano e aspetta il via: si riprende con `--conversation <id> -p "Proceed"`.

## Quanto ci si può fidare di Gemini

| Compito | Cosa ha fatto | Esito della verifica |
|---|---|---|
| 1. Temperatura e frigo | Solo ricerche, **nessuna pagina aperta**; cita homepage generiche (medcraveonline.com, scirp.org) | Dati sui frighi giusti (ANSES 6,4 °C, IZSLER 7,4 °C). Sbagliato il dettaglio sui ripiani. Q10 da enzimi generici, non da impasti |
| 2. Teglia | 8 ricette "verificabili" con citazioni | **3 controllate su 3 non esistono così**: Bonci "800 g / 640 / 4 g", Mercuro 180g, Bosco Crunch "500 g / 375 / 2 g". Inventate |
| 3–5. Forni, farine, stili | Solo ricerche, nessuna pagina aperta | Proposte senza fonti controllabili. Alcune smentite dai video (es. "00 debole al massimo 4–6 h") |
| 6. Elenco video | 15 ID YouTube | 14 esistono, ma titoli e categorie quasi tutti sbagliati; uno è una colonna sonora di cartoni animati |
| 7. Estrazione da 14 trascrizioni | Ha letto tutti i file | **Buona**: i grammi coincidono con la nostra lettura. Errori: dose del modello 4,18% (il motore si ferma al 3%), e "fiducia alta" sul fattore teglia ricavata da un solo video |

**Regola per il futuro:** Gemini è utile per leggere ed estrarre dati da testi che gli diamo noi (trascrizioni, pagine scaricate). Non lo è come fonte quando "ricerca": le citazioni e le ricette vanno sempre controllate, e spesso non esistono.

## Risultato principale: la dose di lievito regge

Dieci video verificati sulle trascrizioni (minutaggi nei file di sottotitoli), confrontati con il motore attuale:

| Video | Lievito fresco nel video | Modello | Rapporto video/modello |
|---|---|---|---|
| Malati di Pizza, napoletana in 4 h ([KeSNZrRmp1A](https://www.youtube.com/watch?v=KeSNZrRmp1A)) | 0,30% | 0,70% | 0,43 |
| Civitiello, 6–8 h + 8–12 h a 18–22 °C ([SN2HkepzPhU](https://www.youtube.com/watch?v=SN2HkepzPhU)) | 0,125% | 0,15% | 0,86 |
| Civitiello, 12 h + 8 h a 18–22 °C ([WIIOycl_7xU](https://www.youtube.com/watch?v=WIIOycl_7xU)) | 0,10% | 0,11% | 0,88 |
| Piatto, **teglia** 7–8 h a 21 °C ([4jD5XVaJyUg](https://www.youtube.com/watch?v=4jD5XVaJyUg)) | 0,57% | 0,65% | 0,88 |
| Malati di Pizza, scrocchiarella 6–7 h ([vQd7_5Iejtw](https://www.youtube.com/watch?v=vQd7_5Iejtw)) | 0,40% | 0,40% | 1,00 |
| Mirko Savoia, tonda romana 24 h ([2Sq5olgGb-s](https://www.youtube.com/watch?v=2Sq5olgGb-s)) | 0,30% | 0,30% | 1,01 |
| Malati di Pizza, 70% con frigo ([zSfYQcGLFTY](https://www.youtube.com/watch?v=zSfYQcGLFTY)) | 0,30% | 0,26% | 1,16 |
| Malati di Pizza, planetaria 4–5 h ([l13KFMM7oLc](https://www.youtube.com/watch?v=l13KFMM7oLc)) | 1,00% | 0,70% | 1,43 |
| Gigio Attanasio, romana con frigo a 8 °C ([yEUDqCk1ezY](https://www.youtube.com/watch?v=yEUDqCk1ezY)) | 0,50% | 0,28% | 1,78 |
| Gigio Attanasio, 2 h + frigo ([MfLKGFF5t6M](https://www.youtube.com/watch?v=MfLKGFF5t6M)) | 1,00% | 0,36% | 2,79 |

- **Mediana circa 1,0**; 7 video su 10 tra 0,86 e 1,43. Le due ricette lunghe a temperatura ambiente di Civitiello (heq 16–20) cadono entro il 15%.
- Attanasio usa sempre circa il doppio della media (anche nei video da 3 ore). Lo stesso canale Malati di Pizza va da 0,43 a 1,43: come già scritto in `docs/lievito.md`, le fonti differiscono anche del doppio.
- Dove la temperatura di casa non è detta, l'ipotesi è 21 °C. Le fasi stimate sono nel file `confronto.js`.
- Ricontrollati anche i video già in `riferimenti-lievito.json`, tutti confermati: Schifano (620 g, "poco più di 1 g", 4 h + 3,5 h), Fermentum (1 h + 18 h frigo + ~5 h a ~25 °C), Andrea Acqua e Farina (2 g di secco su 500 g, 6 h), Davidoctor94 (7 g su 750 g, 3 h + 3 h). Il video di Ruosi non ha sottotitoli.

**Conclusione:** nessun motivo per cambiare `fT()` o `yeastPct()`. La proposta di Gemini di scendere a +7–10% per grado viene da valori di Q10 per reazioni enzimiche generiche, non da impasti. La nostra taratura usa dati di impasti reali (Craig e ricette italiane).

## Altri dati verificati

- **Frigoriferi di casa più caldi di 4 °C.** In Italia la media è 7,4 °C (deviazione standard 1,8; 761 frighi, IZSLER); in Europa 6,4 °C (ANSES, circa 10.000 frighi). Ripiano alto 7,0 °C, basso 6,8 °C, **porta 8,3 °C**. Il nostro `fT(4) ≈ 0,19` è tarato su ricette che dicono "frigo" e quindi include già questo scarto, come scritto in `docs/lievito.md`. Gemini sosteneva che il ripiano basso sia a 4–6 °C e quello alto a 8–12 °C: è falso.
- **Tonda romana: panetti da 180 g.** Lo dicono Savoia (1 kg di farina, 600 g di acqua, 22 g di sale, panetti da 180 g, 300 °C per 2,5–3 min), Attanasio (55% di idratazione, 2% di sale, 5% di olio, 180 g) e Malati di Pizza (180 g per circa 33 cm). Rita indica il 56% di idratazione e una fascia del 50–58%. Noi usiamo 190 g, 57%, 2,3% di sale e 4% di olio.
- **Fornetto G3 Ferrari.** Nel video del produttore i panetti sono da circa 200 g, cottura di circa 5 minuti al livello 3. Graziella cuoce panetti da 230–250 g in 5–6 minuti. L'avviso sopra i 240 g è coerente.
- **Teglia in giornata.** Un solo dato (Piatto: 0,88 volte il modello con il fattore 2). Conferma il fattore anche a temperatura ambiente, ma un video non basta per dire "testata".

## Proposte

Applicate il 12/11/2026: 1 (romana a 180 g), 2 (avviso sulla porta del frigo) e 3 (i video sono in `riferimenti-lievito.json` con il campo `"verificato"`; il video di teglia è tra i riferimenti teglia). Con i nuovi dati la mediana modello/fonte resta 0,99 per le tonde e passa a 0,77 per la teglia; tutti i test passano.

| # | Proposta | Fiducia | Fonte |
|---|---|---|---|
| 1 | Tonda romana: panetto da 190 a **180 g** | Alta | 3 pizzaioli concordi (sopra) |
| 2 | Nel passaggio "frigo": "mettilo su un ripiano, **non nella porta**, che è il punto più caldo" | Alta | IZSLER |
| 3 | Aggiungere a `riferimenti-lievito.json` i 10 video della tabella (Attanasio con peso basso), così i test li controllano | Media | Trascrizioni |
| 4 | Tonda romana: idratazione da 57 a 56% e sale da 2,3 a 2,2% | Bassa (differenza minima) | Savoia, Attanasio, Rita |
| 5 | Teglia, massa unica in frigo: valutare una transizione più lunga di 4 h | Bassa: i dati citati da Gemini non sono verificati | Da misurare con un termometro a sonda |
| 6 | Forno a legna: platea a 430–480 °C forse alta per un principiante (Gemini propone 380–430 °C) | Bassa: nessuna fonte verificata | Da cercare nel disciplinare AVPN |

**Scartate:** limiti delle farine proposti da Gemini (es. 00 al massimo 4–6 h, farina per pizza al massimo 24 h), perché senza schede tecniche lette e smentiti da ricette con frigo verificate. Attrito della planetaria a 10 °C e DDT a 24 °C, perché senza fonte. Fattore 1,15 per la romana, perché ricavato da due video discordanti. Le 8 ricette di teglia del compito 2.

## Fonti verificate

- ANSES, temperature dei frighi europei: https://www.anses.fr/en/content/domestic-fridge-temperatures-studied-europe-better-protect-consumers
- IZSLER, studio nazionale sui frighi di casa (riassunto): https://izsler.it/wp-content/uploads/sites/2/2024/07/ABS1_PRC2016018.pdf
- Il Fatto Alimentare, temperatura dei frighi: https://ilfattoalimentare.it/temperatura-frigorifero-catena-freddo.html
- Video: tutti gli ID nella tabella sopra, più [E4r0tGfTh68](https://www.youtube.com/watch?v=E4r0tGfTh68) (Sorbillo), [JVIaHZVBV3I](https://www.youtube.com/watch?v=JVIaHZVBV3I) (Gaetano Amico, G3), [sMxIs2X-RVI](https://www.youtube.com/watch?v=sMxIs2X-RVI) (Graziella, G3), [wvu61u3QbrI](https://www.youtube.com/watch?v=wvu61u3QbrI) (G3 Ferrari), [y6lKu_h1WPY](https://www.youtube.com/watch?v=y6lKu_h1WPY) (Rita, romana), [T2GxYFLbfY4](https://www.youtube.com/watch?v=T2GxYFLbfY4) (Malati di Pizza con Attanasio, 3 h).
# Indiretti: ricerca del 13 novembre 2026

[Fonti, modelli e guida automatica](indiretti-fonti-modelli-2026-11-13.md) raccoglie
guide primarie, ricette complete, studi e algoritmi per biga/poolish. Distingue
bilanci esatti, stime di fermentazione e ottimizzazione degli orari; documenta
anche i limiti per i percorsi in frigo e il confronto fra percentuali.

