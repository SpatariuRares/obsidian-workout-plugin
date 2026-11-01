---
target: "UI/UX mobile Workout Planner: registrazione set e superfici adiacenti"
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/raresspatariu/Documents/obsidian/the-gym-test-plugin/.obsidian/plugins/obsidian-workout-plugin/app/features/modals"
timestamp: 2026-11-01T10-41-40Z
slug: app-features-modals
---
Metodo: due revisioni indipendenti (A: /root/design_review; B: /root/technical_evidence), più controllo visivo diretto del form in Obsidian.

# Critica UI/UX mobile — Workout Planner

Target primario: `app/features/modals`; contesto adiacente: tabelle, timer, dashboard e impostazioni. Modalità: Operate. Utente primario confermato: persona che registra set sul telefono in palestra.

## Specificità e impressione generale

Il prodotto ha una buona specificità: ultimo set, record personale, incrementi, protocolli e timer servono il lavoro reale. Le convenzioni di Obsidian sono appropriate. La maggiore opportunità è strutturale: rendere breve il percorso conferma del set → salvataggio. Non serve sostituire l'identità visiva per risolvere questo problema.

## Salute del design

Punteggi provvisori delle schermate osservate, non certificazione funzionale o di accessibilità. Le proprietà non verificate non sono considerate funzionalità assenti.

| # | Euristica | Voto /4 | Riscontro |
|---|---|---:|---|
| 1 | Stato del sistema | 2 | Timer leggibile; salvataggio riuscito non verificato |
| 2 | Linguaggio familiare | 3 | Metriche naturali; riepilogo cardio tecnico |
| 3 | Controllo e libertà | 3 | Annulla, chiusura, conferma eliminazione presenti; undo non verificato |
| 4 | Coerenza | 3 | Pattern coerenti, nomi del prodotto discordanti |
| 5 | Prevenzione errori | 2 | Default utili; feedback poco specifico |
| 6 | Riconoscimento | 2 | Ultimo set visibile; stato vuoto senza azione |
| 7 | Efficienza | 2 | Precompilazione utile, salvataggio fuori schermo |
| 8 | Essenzialità | 2 | Form e confronti richiedono scorrimento |
| 9 | Recupero errori | 1 | Messaggio non identifica il campo da correggere |
| 10 | Aiuto e documentazione | 3 | Esempi, guida e tour disponibili; primo avvio non esercitato |
| | Totale | **23/40** | Base utile, con attriti nel flusso principale |

Il punteggio dell'aiuto è corretto in sintesi rispetto ad A: il README documenta già un tour guidato e un welcome. L'indice di otto lezioni non basta per concludere che il primo avvio sia privo di guida.

## Cosa funziona

- Ultimo set e record personale riducono la memoria richiesta.
- Incrementi +/− e valori precompilati riducono la digitazione.
- Tabelle nelle note e timer mantengono l'allenamento nel contesto di Obsidian.

## Priority Issues

Percorsi immagini relativi a `docs/ui-screenshots/2026-11-01/iphone-se/`.

### P1 — Salvataggio dopo i dettagli facoltativi

Evidenza: `create-log-strength-top.png`, `create-log-cardio-top.png`, `create-log-cardio-bottom.png`, `edit-log-top.png`, `edit-log-bottom.png`. Create log si trova dopo protocollo, note e disclosure degli esercizi recenti. Confermato direttamente in Obsidian: dalla tabella Add log apre un form precompilato; per vedere Create log occorre scorrere oltre i dettagli facoltativi. Annullato senza salvare.

Impatto: l'azione ricorrente richiede scorrimento anche confermando valori già corretti. Non sono stati misurati tempi o abbandoni.

Correzione: azione di salvataggio sempre raggiungibile, metriche e ultimo set vicini; dettagli facoltativi separati. Preservare spazio di scorrimento e verificare tastiera/safe area reali.

Comando: `$impeccable adapt`, con `$impeccable distill` per i dettagli opzionali.

### P1 — Stato vuoto senza azione di registrazione

Evidenza: `table-empty-history.png`: No logs match this filter yet., senza Add log vicino. La prosa dell'esempio indica la palette comandi come percorso alternativo. Non significa che la registrazione sia impossibile altrove.

Impatto: all'inizio di un allenamento o con un filtro data vuoto occorre ricordare un altro ingresso.

Correzione: conservare Add set per l'esercizio negli stati vuoto e popolato; offrire il recupero del filtro quando appropriato.

Comando: `$impeccable harden`.

### P2 — Validazione generica

Evidenza: `create-log-validation.png`: Please fill in all fields with valid values. Nessun messaggio specifico visibile vicino ai campi; notes è esplicitamente facoltativo.

Impatto: bisogna dedurre quale valore è errato. Non presumere che peso zero sia sempre invalido: dipende dal tipo di esercizio.

Correzione: indicare campo e regola, focus sul primo errore e conservazione dei valori inseriti.

Comandi: `$impeccable harden`, `$impeccable clarify`.

### P2 — Larghezza mobile insufficiente per confronti e gestione tag

Evidenza: `dashboard-scroll-10.png`, `dashboard-scroll-11.png`: colonne fuori schermo, scrollbar orizzontale e celle strette con forti ritorni a capo. `manage-muscle-tags.png`: azioni della riga tag parzialmente tagliate e placeholder di ricerca troncato. Lo screenshot non dimostra che le azioni siano irraggiungibili con scorrimento.

Impatto: confrontare o gestire un elemento richiede movimento orizzontale e memoria delle colonne.

Correzione: riepiloghi mobili con etichette e valori, azioni sotto il contenuto quando serve; conservare la tabella dettagliata dove utile.

Comando: `$impeccable adapt`.

### P2 — Riepilogo cardio tecnico e senza unità

Evidenza: `create-log-cardio-top.png`: duration, distance, heartRate nello storico; i campi editabili indicano invece min, km, bpm. Conferma indipendente A e B.

Impatto: interpretazione non immediata del precedente allenamento.

Correzione: formattare ad esempio Last time: 56 min · 5.5 km · 147 bpm, rispettando lingua e unità configurate.

Comando: `$impeccable clarify`.

## Carico cognitivo

Focus e gerarchia falliscono nel percorso di salvataggio: dettagli secondari precedono l'azione. Raggruppamento delle metriche e disclosure del workout sono punti positivi. I confronti orizzontali richiedono memoria del contesto. L'indice della guida ha otto link fratelli (>4 opzioni), ma è una biblioteca di lezioni: non è prova che il tour di primo avvio presenti tutte queste scelte. Valutazione qualitativa, non studio di usabilità. L'interfaccia heatmap raggruppa le opzioni in gruppi significativi: non considerarle un unico elenco indistinto.

## Persone e percorso emotivo

- Casey, uso mobile distratto: conferma i valori precedenti ma deve cercare il salvataggio sotto i dettagli. Ripresa dopo interruzione non verificata.
- Jordan, nuovo utente: lo stato vuoto non propone un primo set; heartRate richiede interpretazione. Il tour di primo avvio va provato prima di proporne una sostituzione.
- Sam, tecnologie assistive: verificare focus, nomi accessibili e annunci di errori/stati. I pulsanti +/− comunicano anche con testo: non sono un caso dimostrato di significato affidato solo al colore.

L'ultimo set visibile rassicura; il percorso lungo al salvataggio aumenta l'attenzione richiesta; l'errore generico introduce incertezza. Nessuna cattura di salvataggio riuscito: la conclusione del flusso non è valutabile. Dati e heatmap possono rendere visibile il progresso, ma i confronti densi impongono lavoro aggiuntivo.

## Osservazioni minori

- Uniformare Workout Planner e The Gym Plugin nei contenuti del plugin.
- Sostituire Confirm action / Confirm nella conferma di eliminazione con testo che identifichi set e azione.
- Valutare stato testuale Running/Paused per il timer. Il cursore oscura parte delle icone nelle catture; non dedurre un'icona mancante.
- La toolbar flottante appartiene a Obsidian; un singolo fotogramma sovrapposto non dimostra un difetto persistente del plugin.
- Verificare descrizione del ribbon sotto Mobile logging prima di cambiarla.

## Detector e limiti

Assessment B: source detector 0 segnalazioni, nessuna regola/percorso; 42 file TypeScript analizzati con regex, zero pagine markup ricostruite. Risultato inconcludente per DOM, contrasto e touch target; non certifica assenza di problemi. Nessun falso positivo da classificare. Tentativo CDP 127.0.0.1:9222 fallito con Operation not permitted. Nessun overlay o misurazione live automatica.

Catture del 1 novembre 2026: Obsidian 1.14.5, tema scuro, iPhone SE emulato 375 × 667 CSS px, DPR 2; HEAD b23f6d2 e bundle 10:25:56. Parent ha confermato HEAD, assenza di diff nelle sorgenti app/styles e timestamp main.js/styles.css compatibili. A ha visto 22 immagini, B tre, parent ha integrato immagini e form live.

Non verificati: dispositivo fisico, tastiera iOS, safe area, screen reader, focus completo, contrasto misurato, salvataggi riusciti, undo, vibrazione/wake lock/background, tema chiaro, tutte le lingue. Nessun codice o dato modificato.

## Domande di direzione

1. Iniziare dal flusso di registrazione, dagli overflow mobili o dalla chiarezza di errori e riepiloghi?
2. Affrontare prima le due P1 oppure tutte le cinque priorità?
