# Pane: ricette raccolte e confronto con il motore (25 novembre 2026)

Obiettivo: verificare la dose di lievito del pane (`yeastK` = 2 per i pani semplici, allora 2,5 per il pan bauletto, vedi `docs/pane.md`) su ricette reali, italiane e straniere.

## Metodo

- **YouTube.** 21 ricerche con `yt-dlp` (`ytsearch7:`), in italiano e in inglese: pane in casa, pagnotta, notte in frigo, pane veloce, ciabatta, pan bauletto, pane in cassetta, semola, integrale, filoncini, pane in pentola, Bonci, Giorilli, no-knead, Forkish, sandwich bread, baguette. Ne sono usciti 112 video. Ho scelto i 46 con le dosi nella descrizione e ho scaricato i sottotitoli automatici (`--write-auto-subs`, convertiti con `vtt2txt.py`). Tempi e temperature li ho letti io nei sottotitoli, con il minutaggio; nessun numero viene da un riassunto automatico.
- **Siti.** Pagine lette con lo strumento web: King Arthur, Penguin (Forkish), Shipton Mill, Scatti di Gusto, Dissapore, tre blog di GialloZafferano, Tavolartegusto, ChainBaker.
- I file scaricati (descrizioni, sottotitoli, estratti) sono in `tmp/ricerca-pane/`, fuori dal repository perché sono testi di terzi.
- Dati in [`riferimenti-pane.json`](riferimenti-pane.json): 31 ricette, ciascuna con fonte, dose, fasi e qualità A/B/C, più l'elenco delle escluse e il motivo. Confronto con `node docs/ricerca/confronto-pane.js index.html`.

Per ogni ricetta lo script calcola la dose “base” della curva della pizza sulle stesse fasi (massa in frigo come nel motore) e il fattore implicito **K = dose della ricetta / dose base**. Se le fonti fossero coerenti con il motore, K starebbe intorno a 2.

## Risultato

| Gruppo | Ricette | K mediano | Ricetta / app (mediana) | Entro 0,5–2 volte l'app |
|---|---|---|---|---|
| Pani semplici, qualità A e B | 21 | 2,5 | 1,24 | 11 |
| Con il frigo, qualità A e B | 12 (tutti pani semplici) | 1,9 | 0,92 | 7 |
| Senza frigo, qualità A e B | 16 (di cui 7 arricchiti) | 4,2 | 1,84 | 6 |
| Pan bauletto e pani in cassetta | 7 | 5,4 | 2,15 | 2 |

**La dispersione è enorme**: K va da 0,55 a 18. Le fonti non dicono “la dose giusta”, dicono che il pane tollera dosi molto diverse.

Tre gruppi si vedono bene.

1. **Panificatori casalinghi attenti, con temperature misurate** (Forno e Pietra, quattro ricette di qualità A). Usano **la metà del lievito dell'app** (0,36–0,58 volte) e controllano la crescita con il contenitore graduato: fermano la prima lievitazione al 50–80%, non al raddoppio, e fanno l'appretto in frigo per 1,5–2 ore. Impasta con Salvo (A) è vicino all'app (0,88).
2. **Ricette con il frigo** (12): il motore è in linea, con mediana 0,92. Scatti di Gusto 0,70, Altamura 0,97, Cucina Geek integrale 1,24, Sam's Home Kitchen 1,69. Fanno eccezione Rapanello (3% di secco equivalente con una notte in frigo, 7 volte l'app) e ChainBaker (3% con 24 ore, 5 volte).
3. **Ricette senza impasto e lunghe a temperatura ambiente** (GialloZafferano, 2% per 16 ore; Casa Pappagallo, 1,8% per 22 ore a 18 °C; Lahey 2,5 volte l'app; Forkish 2,3 volte). Usano molto più lievito di quanto la curva consiglierebbe: l'impasto molto idratato raddoppia presto e poi “aspetta”. Sono ricette che funzionano proprio perché sono tolleranti, non perché la dose sia necessaria.

Per i **pani arricchiti** (pan bauletto, pane in cassetta) tutte le fonti tranne una usano molto più lievito dell'app: King Arthur 5% di fresco equivalente, Benedetta 4%, Dolci di Una Volta 2,4%, Il caldo sapore del sud 2%, con lievitazioni di 1–3 ore al caldo. Mediana: 2,15 volte la dose dell'app.

## Altre conferme dai video (tecniche, non dosi)

- **Forno con la luce accesa** come cella di lievitazione: Forno e Pietra lo misura a 26 °C, Tavolartegusto lo dà a 28 °C. Gaetano Amico ci mette anche una vaschetta d'acqua bollente, “come la stufa dei panettieri”. È il trucco dell'umidità già presente nell'app.
- **Vapore**: teglia con un bicchiere d'acqua o cubetti di ghiaccio sul fondo, tolta dopo 15–25 minuti (Rita Chef, Mena, Cucina Geek, Forno e Pietra, Bonci 20 minuti); in pentola, coperchio per 25–30 minuti. Coerente con l'app.
- **Cottura della pagnotta**: Forno e Pietra fa 25 min a 240 °C, 30 a 180 °C e 10–15 a 140 °C con lo sportello socchiuso, circa 70 minuti in tutto. Gli altri restano tra 40 e 55 minuti a 250–210 °C. L'app dà 46 minuti per 900 g: siamo nella fascia bassa.
- **Appretto in frigo per 1,5–2 ore** (tre ricette di Forno e Pietra e Salvo): rende il momento di infornare meno critico e il pane più facile da incidere. Alcuni lo mettono 10 minuti in freezer prima del taglio.
- **Raffreddamento di 1,5–2 ore** prima di tagliare (Zambelli, Forno e Pietra): coerente con l'app.

## Proposte

| # | Proposta | Fiducia | Motivo |
|---|---|---|---|
| 1 | **Pani semplici: lasciare `yeastK` = 2.** | Media | Mediana 1,24 volte l'app, con il frigo 0,92. I panificatori più precisi stanno sotto, le ricette senza impasto sopra: 2 è una via di mezzo ragionevole per chi usa la prova del dito. |
| 2 | **Pan bauletto: `yeastK` da 2,5 a circa 4.** | Media | 6 ricette arricchite su 7 stanno sopra l'app (mediana 2,15 volte). Con 4, 24 ore a 20 °C danno circa 1,1% invece di 0,67%, e le 3–4 ore al caldo arrivano al limite del 3%. |
| 3 | Aggiungere ai segreti l'**appretto in frigo** per 1,5–2 ore, come alternativa per avere più margine prima di infornare. | Alta (tecnica) | Forno e Pietra, Salvo. Non cambia le dosi. |
| 4 | Pagnotta: valutare **10 minuti in più a forno basso** (sportello socchiuso) per i pani da 900 g o più. | Bassa | Una sola fonte dettagliata (Forno e Pietra); gli altri stanno sui 40–55 minuti. |
| 5 | Prove in cucina: pagnotta con una notte in frigo e pan bauletto in giornata, i due casi in cui le fonti divergono di più. | — | Solo le prove possono stringere un intervallo così largo. |

**Scartato:** alzare `yeastK` dei pani semplici a 2,5–3 per avvicinarsi alle ricette senza impasto. Darebbe impasti più rapidi del previsto proprio nei casi seguiti con più attenzione (Forno e Pietra), e la tolleranza di quelle ricette dipende da idratazione e metodo, non dalla dose.

## Limiti

- Molte ricette non dicono la temperatura: le convenzioni usate (ambiente 21 °C, forno con la luce 27 °C, “al caldo” 25 °C) sono nel file JSON e spostano K anche del 30–50%.
- Tazze e cucchiaini delle ricette americane sono convertiti con le tabelle King Arthur; i 400 g per 3 tazze di Lahey sono una stima.
- I sottotitoli automatici sbagliano qualche parola (“23 ore” per “2-3 ore” nel video di Gaetano Amico, letto nel contesto: “dopo 2 ore e mezzo”).
- I video di Rita Chef non hanno sottotitoli automatici; tre ricette di Bonci, Fulvio Marino e GialloZafferano usano biga o poolish e sono escluse finché il pane non avrà gli indiretti.

## Applicato (25 novembre 2026)

Proposte 2 e 3: `yeastK` del pan bauletto da 2,5 a 4, e l'appretto in frigo per 1,5–2 ore tra i segreti del pane. Con il nuovo valore il pan bauletto con una notte in frigo a 20 °C passa da circa 0,67% a circa 1,1% di lievito fresco. Proposte 1 (pani semplici invariati), 4 e 5 restano come descritte. Dopo la modifica i pani arricchiti stanno a 1,35 volte la dose dell'app (prima 2,15) e 5 su 7 rientrano tra 0,5 e 2 volte (prima 2).
