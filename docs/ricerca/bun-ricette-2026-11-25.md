# Burger bun: ricette raccolte e confronto con il motore (25 novembre 2026)

Obiettivo: scegliere dosi, tempi, cottura e fattore `yeastK` dei bun, e documentare il tangzhong. Il modello è in `docs/bun.md`.

## Metodo

- **YouTube.** 18 ricerche con `yt-dlp` (`ytsearch8:`), in italiano e in inglese: Malati di Pizza, panini per hamburger, burger bun, smash burger bun, tangzhong, brioche bun, potato bun, Bonci, Giorilli. Ne sono usciti circa 95 video; ne ho scelti 39 con dosi nella descrizione e ho scaricato descrizioni e sottotitoli automatici (26 disponibili, gli altri bloccati da YouTube con l'errore 429). Tempi e temperature li ho letti nei sottotitoli con il minutaggio.
- **Siti.** ChainBaker, King Arthur (ricetta e articolo sul tangzhong), Matt Adlard, Joshua Weissman. La pagina King Arthur dei potato bun non esiste più (404); Serious Eats rifiuta la lettura automatica.
- File scaricati in `tmp/ricerca-bun/`, fuori dal repository perché sono testi di terzi.
- Dati in [`riferimenti-bun.json`](riferimenti-bun.json): 24 ricette con fonte, dose, fasi, ingredienti in % e qualità A/B/C, più le escluse. Confronto con `node docs/ricerca/confronto-bun.js index.html`.

## La ricetta di riferimento: Malati di Pizza

Video [C2q4j7qp6vk](https://www.youtube.com/watch?v=C2q4j7qp6vk), provato in cucina dall'utente: 500 g di farina forte (Manitoba va bene), 300 g di latte, 20 g di lievito fresco (o 10 g di secco), 1 uovo e 1 tuorlo, 50 g di zucchero, 10 g di sale, 50 g di burro. Tangzhong con 50 g di farina e 250 g di latte presi dal totale, scaldati finché addensano e lasciati raffreddare (anche il giorno prima, in frigo). Impasto 10–15 minuti, raddoppio in 1,5–2 ore a 20–21 °C (oppure in frigo fino al giorno dopo), panetti da 80–120 g, appretto di 1,5 ore coperti, spennellata di uovo e latte, forno statico a 190 °C per 20–25 minuti, burro fuso alla fine. Il video spiega anche perché tanto lievito: l'impasto è carico di grassi.

**Seconda prova dell'utente: una notte in frigo.** Stessa ricetta con 6 g di lievito fresco (1,2%) invece di 20, in frigo dalle 21 alle 8, puntata fino alle 13, palline, appretto fino alle 17 circa, poi in forno, con la casa a 22 °C. Buoni, ma secondo l'utente hanno lievitato molto e i panini erano enormi. Contando a 13 °C le prime 2 ore fuori dal frigo (l'impasto è ancora freddo), il K implicito è circa 6,7: per quegli orari l'app propone circa 0,6%, metà della dose usata. Il risultato va nella stessa direzione del modello: 1,2% era troppo per 9 ore fuori dal frigo a 22 °C. La prova è un tetto, non una dose giusta, quindi resta fuori dalle mediane (`troppo_lievito`). Il piano dell'app con la notte in frigo è più corto fuori (1 ora di puntata e circa 2,5 di appretto) e lì propone circa 1,1%. Il `yeastK` resta 3,5.

È diventato lo stile `bun` dell'app, con il tangzhong all'8% invece del 10% (la mediana delle fonti) e 110 g per panino.

## Risultato del confronto

| Gruppo | Ricette | K mediano | Ricetta / app (mediana, K finali) |
|---|---|---|---|
| Qualità A e B (tempi dichiarati) | 12 | 4,15 | 1,43 |
| Italiane A e B | 7 | 4,27 | 1,25 |
| Straniere A e B | 5 | 4,03 | 1,60 |
| Con tangzhong A e B | 7 | 4,27 | 1,22 |
| Qualità C (tempi “fino al raddoppio”) | 12 | 1,72 | 0,58 |
| Tutte | 24 | 2,95 | 1,13 |

- Come per il pane, la dispersione è grande: K va da 0,95 (CiroPizza) a 11 (ChainBaker). Le ricette americane con lievito istantaneo usano dosi altissime (King Arthur 6,4% di fresco equivalente, Weissman 7,9%).
- Le ricette di qualità C hanno dosi più basse, ma i loro tempi sono stimati e probabilmente più lunghi di quanto si supponga.
- **Scelta:** `yeastK` 3,5 per bun al latte e smash, che riproduce esattamente Malati di Pizza (4% in 3 ore), sta sotto la mediana delle ricette migliori e sopra quella di tutte. Brioche 4,5 (più burro e uova, come il pan bauletto che ha 4). Bun all'olio 2,5 (solo ricette di qualità C, K mediano circa 2).
- Il tetto della dose sale dal 3% al 4% solo per i bun: con zucchero al 6–10% le ricette brevi arrivano al 4–5% senza problemi.

## Altre conferme (tecniche, non dosi)

- **Peso:** 100–120 g per il burger classico (King Arthur, Adlard, Weissman 100 g; Savoia 110 g; Malati di Pizza 80–120 g; Fulvio Marino 100 g). Per lo smash 70–80 g (smashgiulio) e un panino di circa 10 cm (Mochohf e xMurry, che consigliano anche i Martin's potato roll).
- **Cottura:** quasi tutti statico a 175–200 °C per 15–25 minuti; Fulvio Marino 210–240 °C per 10–12. Spennellata di uovo e latte prima, burro fuso dopo (Malati di Pizza, Weissman, ChainBaker, King Arthur).
- **Lievitazione al caldo:** forno spento con la luce (Pastigioca, Peronaci, Schifano), cella a 26–28 °C (Savoia).
- **Burro alla fine, morbido, in più volte** (Pastigioca, Peronaci, CiroPizza, Malati di Pizza, che però lo mette tutto insieme in impastatrice).
- **Frigo:** Malati di Pizza e Savoia propongono la puntata in frigo fino al giorno dopo; Schifano 3–4 ore in frigo.
- **Tangzhong:** Marrazzo spiega gelatinizzazione a 65 °C e retrogradazione; King Arthur dice che la farina assorbe circa il doppio di liquido caldo rispetto a quello tiepido e che i panini iniziano a seccarsi dopo circa 4 giorni; Adlard sconsiglia di tenerlo in frigo più di un giorno, Malati di Pizza lo prepara il giorno prima. Pastigioca attribuisce la tecnica a Yvonne Chen (2004): non verificato, non lo citiamo nell'app.

## Limiti

- Molte ricette non dicono la temperatura: 21 °C per “temperatura ambiente”, 25 °C per il forno con la luce. Spostano K anche del 30–50%.
- Tazze e cucchiaini delle ricette americane sono convertiti a stima (Billy Parisi, Claire Saffitz).
- Lo smash bun con le patate e il brioche bun non hanno ricette di qualità A: sono calcolati.
