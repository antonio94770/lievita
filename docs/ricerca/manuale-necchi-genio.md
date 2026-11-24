# Manuale Necchi Pizza Genio: verifica per Lievita

Verifica del 12 novembre 2026. Fonte primaria: [manuale utente e ricettario Necchi](https://www.necchishop.com/wp-content/uploads/2026/06/Manuale-Pizza-Genio_compressed.pdf), modello GP9022PRA, codice NK9022DIGITAL. Numeri di pagina qui sotto = numeri **stampati**, non indice del lettore PDF: il file contiene 54 pagine, ma la numerazione arriva a 55. Per esempio, pagina stampata 45 = pagina 44 del PDF.

Metodo: lettura del testo completo pertinente e verifica visiva delle pagine stampate 22, 45, 48, 49 e 53. Le screenshot web non funzionavano; scaricato il PDF pubblico in `tmp/pdfs/manuale-necchi.pdf` e renderizzate le pagine con PyMuPDF. Confronto con `index.html` e `docs/ricerca/README.md`. Nessuna modifica al motore o ai testi dell'app.

## Risultato per il progetto

Il contributo maggiore è un **profilo specifico per un forno elettrico da 450 °C**, con resistenze superiore e inferiore regolabili separatamente. L'attuale scelta `fornetto` è esplicitamente tipo G3 Ferrari, arriva a 400 °C ed è accompagnata da limiti sui panetti: non descrive automaticamente il Necchi. Anche `portatile` indica un forno a gas. Non trasferire quindi i parametri Necchi a tutti i fornetti.

Il ricettario aggiunge alcuni riferimenti quantitativi e idee per la guida, ma contiene errori e affermazioni non dimostrate. Non basta, da solo, a ritoccare la curva del lievito o a dichiarare un percorso Lievita testato in cucina.

## Cottura: dati del produttore

[Tabella a pagina 22](https://www.necchishop.com/wp-content/uploads/2026/06/Manuale-Pizza-Genio_compressed.pdf#page=21). Temperature = **impostazioni delle due resistenze**, non misura della platea né temperatura finale dell'impasto.

| Stile rilevante | Superiore | Inferiore | Timer di riferimento |
|---|---:|---:|---:|
| Napoletana | 450 °C | 400 °C | 2 min |
| Tonda romana | 300 °C | 300 °C | 6 min |
| Teglia | 280 °C | 300 °C | 7 min |

Il manuale distingue valore impostato e temperatura interna visualizzata (p. 6); non prova che il sensore misuri la superficie della pietra. Preriscaldo indicativo 15–20 minuti e rotazione di 180° a metà cottura (p. 53), da intendersi per questo apparecchio. Non sostituire con 15–20 minuti l'ora già prevista da Lievita per la pietra nel forno domestico.

Altri dettagli specifici: mantenere chiusa l'imboccatura per conservare calore (pp. 9–11); il timer non spegne immediatamente il riscaldamento (p. 7); niente carta forno alle alte temperature (pp. 2 e 9). La pulizia a vuoto a 450 °C per 30–40 minuti è una procedura del produttore per la sua pietra (p. 54), non un consiglio da estendere ad apparecchi diversi.

## Ricette: dati normalizzati

[Ricette alle pagine 43–49](https://www.necchishop.com/wp-content/uploads/2026/06/Manuale-Pizza-Genio_compressed.pdf#page=42). Percentuali calcolate sui grammi effettivi di farina, senza arrotondare prima. Lievito = fresco. Le temperature ambiente dichiarate per il ricettario sono 22–24 °C (pp. 21 e 42); il freddo è descritto genericamente come 4–6 °C nella guida (p. 24), non misurato in ogni ricetta.

| Ricetta e pagina | Farina / acqua / sale / olio / lievito, g | Acqua / sale / olio / lievito, % | Fasi dichiarate |
|---|---|---|---|
| Napoletana, p. 43 | 615 / 369 / 15 / 0 / 1,6 | 60 / 2,44 / 0 / 0,260 | 2 h ambiente + 18 h frigo **in massa** + staglio + 4 h ambiente |
| Romana, p. 44 | 436 / 262 / 9 / 13 / 1,2 | 60,09 / 2,06 / 2,98 / 0,275 | 1 h ambiente + staglio + 20 h frigo + 3 h ambiente |
| Teglia, p. 45 | 600 / 450 / 15 / 18 / 3,1 | 75 / 2,5 / 3 / 0,517 | 2 h ambiente con pieghe + 20 h frigo in massa + staglio/stesura + 2 h **in teglia** |
| New York, pp. 46–47 | 545 / 325 / 11 / 16 / 1,5; inoltre 11 g zucchero | 59,63 / 2,02 / 2,94 / 0,275; zucchero 2,02 | 2 h ambiente + 18 h frigo in massa + staglio + 4 h ambiente |
| Pinsa, p. 48 | 539 / 431 / 13,5 / 16 / 1,1 | 79,96 / 2,50 / 2,97 / 0,204 | 2 h ambiente con pieghe + 18 h frigo in massa + staglio + 4 h ambiente |
| Romana express, p. 49 | 436 / 262 / 9 / 13 / 3 | 60,09 / 2,06 / 2,98 / 0,688 | 45–60 min puntata + staglio + 4–5 h appretto, circa 6 h totali |

La pinsa usa 377 g grano, 108 g riso e 54 g soia: totale 539 g. Non è un impasto di solo frumento e non è intercambiabile con la farina forte del motore. La New York contiene zucchero ed è fuori dagli stili attuali.

Teglia: 545 g per 33×33 cm equivalgono a **0,500 g/cm²**, contro 0,55 di Lievita. È un possibile percorso più basso, non prova che il valore attuale sia sbagliato. La romana conferma i panetti da **180 g**, già adottati.

Per confrontare la fermentazione, rispettare l'ordine reale delle fasi: nella napoletana Necchi il frigo contiene la massa, mentre Lievita mette in frigo i panetti delle tonde. Inoltre la teglia del manuale lievita già stesa per due ore; Lievita prevede un appretto fuori teglia e un successivo riposo di 20–30 minuti. Il confronto diretto richiede una gestione distinta dell'inerzia termica e della geometria; non inseriti questi dati automaticamente nel dataset di taratura.

## Indicazioni utili e quanto sono nuove

| Indicazione | Fonte | Confronto con Lievita |
|---|---|---|
| Far riposare coperto un impasto che si ritrae, riprendendo senza forzare | pp. 31 e 34 | Già presente per la teglia; utile estendere il soccorso anche alla stesura delle tonde |
| Non stringere eccessivamente il panetto quando lo si forma | p. 28 | Possibile aggiunta pratica: l'app spiega la formatura ma non il rischio di eccessiva tensione |
| Aggiungere una parte dell'acqua solo dopo che l'impasto prende forza; mani umide e pieghe per impasti molli | pp. 26–27 e 34 | Già presente; il codice riserva correttamente il 10% dell'acqua totale |
| Guardare consistenza e risposta alla pressione oltre all'orario | pp. 25 e 30 | Già presente nella seconda lievitazione; non serve importare la soglia rigida di 3–5 secondi |
| Poco condimento e mozzarella scolata; nella teglia aggiungerla dopo la prima parte di cottura | pp. 44–45 e 53 | Già presente |
| Girare la pizza se cuoce in modo disomogeneo | pp. 11 e 53 | Utile nel futuro profilo elettrico Necchi; verificare caso per caso sugli altri modelli |
| Annotare temperatura, dosi e risultati | pp. 32–33 | Già coerente con ricette, versioni e voti dell'app |

## Errori e limiti da conservare accanto ai dati

1. **Acqua della teglia, p. 45:** ingredienti 450 g; istruzioni circa 400 g iniziali più 60–80 g tenuti da parte, cioè 460–480 g. La ricetta non torna. Usando gli ingredienti, dopo 400 g restano 50 g; questa è una correzione aritmetica nostra, non una dose verificata del produttore.
2. **Conversione fresco/secco non uniforme:** napoletana 1,6/0,6; romana 1,2/0,5; teglia 3,1/1,5; express 3/1,5; pinsa 1,1/0,35–0,4. Non adottare il rapporto 2:1 della teglia/express al posto del 3:1 di Lievita sulla base di questo testo.
3. **Arrotondamenti di massa:** la teglia somma 1086,1 g, non 1090 g; la romana 721,2 g invece di 720 g. Differenze piccole, da distinguere dall'errore sull'acqua. New York: 909,5 g includendo lo zucchero, invece dei 900 g dichiarati.
4. **Ore totali:** le fasi nominali sommano 24 h, ma impastamento, staglio e cottura richiedono altro tempo. Per l'express puntata e appretto danno 4,75–6 h prima degli altri lavori: usare circa 6 h, non un vincolo esatto.
5. **Temperatura, p. 29:** gli esempi 1,5→1 g e 1,5→2 g sono variazioni di circa 33%, mentre il testo parla di 20–30%. A p. 49 le correzioni express sono ancora più ampie. Indicazioni grossolane, non una nuova curva temperatura/lievito.
6. **Digeribilità:** il manuale associa frigo e mix pinsa a una migliore digeribilità (pp. 24, 40, 48), senza studi citati. Non usarlo come prova, né rafforzare questa promessa già presente nell'app.
7. **Sale e lievito:** la prescrizione assoluta di tenerli sempre separati (p. 42) non è sostenuta da esperimenti nel manuale; non basta per introdurre un avviso di errore o spiegare qualsiasi mancata crescita.
8. **Testata dal produttore non significa testata dal team Lievita:** il manuale presenta le sue ricette come calibrate/testate, ma non documenta protocollo, prove, temperature misurate e variabilità.

## Proposte ordinate

1. In una futura modifica, distinguere il forno elettrico ad alta temperatura dal fornetto tipo G3. Memorizzare separatamente impostazioni sopra/sotto e fonte del profilo, senza trattarle come temperatura misurata della pietra.
2. Ampliare i testi di aiuto per panetto che si ritrae e formatura troppo stretta, dopo riscontro su altri tutorial primari.
3. Conservare le dosi fresche come riferimenti aggiuntivi con le riserve sopra. Nessuna modifica a `fT()`, `yeastPct()`, `yeastK` o tempi minimi di appretto giustificata dal solo manuale.
