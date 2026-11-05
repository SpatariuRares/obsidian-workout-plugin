<img src="assets/logo.png" width="96" alt="Logo di Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · Italiano · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Il tracker di allenamento tutto-in-uno per Obsidian.** Pesi, corsa, ciclismo, yoga o esercizi con campi tuoi: registra dal telefono, segui una sessione guidata e vedi i tuoi progressi in grafici, una dashboard e una mappa di calore muscolare. Un solo CSV, 24 lingue.

Pensato per il telefono: registra ogni serie, corsa o posa mentre ti alleni, poi guarda i tuoi progressi in tabelle, grafici e una dashboard, nelle stesse note in cui pianifichi l'allenamento. Le tue serie finiscono in un unico file CSV nel tuo vault. Nessun account, nessun cloud.

I grafici mostrano il tuo andamento, la mappa di calore muscolare mostra cosa hai allenato, e ogni serie conserva la sua unità kg/lb. Puoi interrogare le tue serie da Dataview.

![Workout Planner sul telefono: una scheda workout-sets con due serie spuntate e il timer di riposo in funzione, il modulo di registrazione con i pulsanti +/− e il selettore kg/lb, e il riepilogo della dashboard con il calendario degli allenamenti](assets/hero.png)

## Funzionalità

- Registra serie con ripetizioni e peso, precompilate con la tua ultima serie, con i pulsanti +/− e gli esercizi recenti con un tocco
- Registra ogni serie in kg o lb, qualunque siano i dischi davanti a te
- Etichetta le serie con un protocollo: drop set, myo-reps, rest-pause, superset, 21s o un tuo protocollo
- Tabelle delle tue serie, raggruppate per giorno con i totali giornalieri, modificabili con un tocco
- Le serie di oggi come righe da compilare sul telefono: spunta una serie per registrarla, e parte il timer di riposo
- Grafici di peso, volume, ripetizioni, durata, distanza, passo e frequenza cardiaca, e un andamento che ti dice chiaramente se stai migliorando
- Una dashboard con la striscia settimanale (con obiettivo settimanale), un calendario degli allenamenti, i record personali, il volume totale, gli allenamenti recenti e le statistiche dei protocolli
- Una mappa di calore muscolare, fronte e retro, per volume, serie o ripetizioni
- Timer di riposo (conto alla rovescia, a intervalli, cronometro) con preset, che ripartono quando registri una serie e suonano su iOS e Android
- Una sessione guidata che ti accompagna nella nota dell'allenamento un esercizio alla volta
- Una stima della durata di un allenamento pianificato
- Esercizi di forza, a corpo libero, a tempo, a distanza e cardio, o con campi tuoi
- Ogni serie in un unico file CSV semplice, leggibile da Dataview e Templater
- Pensato per il telefono: niente scorrimento laterale, pulsanti sempre a portata di mano
- Disponibile in 24 lingue

## Per iniziare

La prima volta che installi il plugin, aggiunge delle note di esempio (esercizi di prova, due allenamenti con sei settimane di registri, una dashboard e una vetrina delle funzionalità), punta il plugin verso di esse e apre la **Guida per iniziare**: una pagina breve per ogni funzionalità, con esempi funzionanti da provare. Non serve aprire le impostazioni. Esplora pure prima di configurare i tuoi.

### Il tour guidato

Il tour apre una nota "Visita guidata" con una tabella, un grafico, una dashboard e un timer, e indica ciascuno a turno. Ha nove passaggi brevi:

1. Registra la tua prima serie con il pulsante **+**. Il passaggio si completa quando la salvi.
2. Modifica o elimina una serie con i pulsanti su ogni riga.
3. Vedi i tuoi progressi nel grafico.
4. Vedi i totali e le tendenze nella dashboard.
5. Scopri quali muscoli hai allenato nella mappa di calore muscolare.
6. Avvia il timer di riposo. Il passaggio si completa quando premi avvia.
7. Trova l'icona del manubrio nella barra laterale, che apre il modulo di registrazione da qualsiasi nota. Sul telefono, usa invece la palette dei comandi.
8. Esegui un comando **Inserisci** qualsiasi dalla palette dei comandi. Il passaggio si completa quando lo fai.
9. Fatto.

Usa **Indietro** e **Avanti** per muoverti, oppure **Salta** per uscire. Se la parte della nota che il tour indica è fuori dalla vista, **Mostrami** scorre fino a quel punto. Premi `Esc` in qualsiasi momento per terminare. Il tour finisce anche quando chiudi la sua nota o passi a un altro file. Non si perde nulla: le tue serie restano nel registro.

Quando sono in uso i dati di esempio, il tour gira su di essi. Altrimenti gira sul tuo registro, quindi grafico e dashboard partono quasi vuoti. La nota viene creata una sola volta, accanto agli esempi o in cima al vault. Una nota esistente non viene mai sovrascritta, e puoi modificarla o eliminarla. Se esiste già una nota chiamata "Visita guidata" che non è quella del tour, il tour usa "Visita guidata 1" (o il numero libero successivo).

Vuoi rifare il tour? Seleziona **Inizia il tour** in **Impostazioni → Workout Planner → Per iniziare**, oppure esegui **Inizia il tour** dalla palette dei comandi.

Vuoi di nuovo gli esempi o la guida? Seleziona **Crea esempi** o **Apri la guida per iniziare** in **Impostazioni → Workout Planner → Per iniziare**, oppure esegui **Crea note di esempio** o **Apri la guida per iniziare** dalla palette dei comandi (`Ctrl/Cmd + P`). Creare gli esempi non sovrascrive mai nulla: rieseguirlo aggiunge solo i file di esempio mancanti, e i file che hai modificato restano come sono. La guida propone di creare gli esempi se non esistono ancora. Una tabella, un grafico o una dashboard vuoti hanno anche un link **Oppure esplora con dati di esempio**. Se hai già un registro allenamenti, gli esempi ottengono un file di registro proprio e il tuo resta intatto.

Per aggiungere una tabella a una nota qualsiasi, per esempio `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Tocca **+** sotto la tabella, inserisci ripetizioni e peso, e salva. La tabella si aggiorna da sola. Non devi nemmeno scrivere i blocchi a mano: i comandi **Inserisci grafico allenamento**, **Inserisci tabella allenamento**, **Inserisci timer allenamento**, **Inserisci dashboard allenamento** e **Inserisci durata allenamento** aprono un modulo e inseriscono il blocco al posto tuo.

## Registrare le serie

Apri il modulo di registrazione con il **+** sotto una tabella (l'esercizio è già compilato), con l'icona del manubrio nella barra laterale, o con il comando **Crea registro allenamento**. Il modulo parte dalla tua ultima serie, quindi nella maggior parte dei casi basta un tocco su **+/−** e salvare. Fallo prima che finisca il riposo.

Il modulo chiede i campi adatti all'esercizio: ripetizioni e peso per lo squat, secondi per il plank, distanza e tempo per una corsa (vedi [Tipi di esercizio](#tipi-di-esercizio)). Ogni serie può avere anche una nota e un protocollo, mostrato come badge nella tabella.

Il campo peso ha un selettore kg/lb, quindi puoi registrare 225 lb anche se l'impostazione è kg. La tabella mostra quella serie come "225 lb"; grafici, statistiche e volume convertono ogni serie nell'unità impostata.

Quando registri una serie da una nota, il nome della nota viene salvato come **allenamento** della serie, così una tabella o un grafico con `workout: Push Day` la trova in seguito.

## Tabelle

Un blocco `workout-log` mostra le serie di un esercizio o di un allenamento, dalla più recente. Le serie dello stesso giorno sono raggruppate sotto una riga con i totali di quel giorno, e ogni riga ha un pulsante di modifica; per eliminare una serie usa il modulo di modifica. Sul telefono ogni serie diventa una riga compatta, senza scorrimento laterale.

<img src="assets/tables.png" width="720" alt="Una tabella workout-log sul telefono, con le serie raggruppate per giorno con il loro tempo e un badge di drop set, e il modulo di registrazione che si apre con il pulsante +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Con `targetWeight` e `targetReps`, sopra la tabella compare un obiettivo di sovraccarico progressivo.

<details>
<summary>Tutti i parametri</summary>

| Parametro                    | Predefinito | Cosa fa                                              |
| ---------------------------- | ----------- | ---------------------------------------------------- |
| `exercise`                   | —           | Solo questo esercizio                                |
| `workout`                    | —           | Solo questo allenamento (nome della nota)            |
| `exactMatch`                 | `false`     | Confronta il nome dell'esercizio in modo esatto      |
| `dateRange`                  | tutte       | Oggi e i N giorni precedenti                         |
| `limit`                      | `50`        | Righe massime; con `sets`, `sets × 2` (due allenamenti) |
| `sortBy`                     | `date`      | `date`, `exercise`, `weight`, `reps` o `volume`      |
| `sortOrder`                  | `desc`      | `asc` o `desc`                                       |
| `columns`                    | tutte       | Colonne da mostrare, ad esempio `["date", "reps", "weight"]` |
| `showProtocol`               | `true`      | Mostra la colonna del badge del protocollo           |
| `showAddButton`              | `true`      | Mostra il pulsante **+**                             |
| `targetWeight`, `targetReps` | —           | Mostra un obiettivo di sovraccarico progressivo sopra la tabella |
| `sets`                       | —           | Serie pianificate, conteggiate da un blocco `workout-session` |

Per impostazione predefinita i nomi degli esercizi combaciano in modo approssimativo ("squat" trova "Squat (high bar)"); aggiungi `exactMatch: true` per avere solo quel nome esatto.

</details>

## Serie sul telefono

Un blocco `workout-sets` serve a registrare in palestra: le serie di oggi di un esercizio, come righe da compilare. Ogni riga mostra cosa hai fatto nella stessa serie l'ultima volta, così scrivi solo ciò che è cambiato (un campo vuoto registra quel valore) e spunti la riga. La serie entra nel registro, la riga diventa una serie registrata, e il timer di riposo in cima parte da solo. La freccia di una serie registrata cambia il suo protocollo e le note; spuntarla di nuovo la riprende, con **Annulla** per qualche secondo.

<img src="assets/sets.png" alt="Una scheda workout-sets sul telefono: quattro righe compilate con i valori dell'ultima volta, poi due serie spuntate con il timer di riposo in funzione, e una riga aperta per scegliere il protocollo rest-pause e aggiungere una nota">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Inserisci serie di allenamento** dalla palette dei comandi ne scrive uno per te, e il menu ⋮ lo modifica o modifica il suo timer di riposo.

<details>
<summary>Tutti i parametri</summary>

| Parametro                    | Predefinito         | Cosa fa                                                                                                  |
| ---------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `exercise`                   | —                   | L'esercizio (nome esatto)                                                                                |
| `workout`                    | il nome della nota  | L'allenamento a cui vengono registrate le serie                                                          |
| `sets`                       | come l'ultima volta | Righe da compilare (almeno una); **Aggiungi serie** ne aggiunge altre                                    |
| `targetWeight`, `targetReps` | —                   | Suggerimenti quando non hai mai fatto l'esercizio, e un obiettivo di sovraccarico progressivo            |
| `rest`                       | —                   | Secondi di riposo dopo ogni serie; `0` per nessun timer. Se assente: il `workout-timer` della stessa sezione |
| `timer.*`                    | —                   | Le altre opzioni del timer di riposo: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Grafici e tendenze

Un blocco `workout-chart` disegna una misura nel tempo: peso, volume, ripetizioni, 1RM stimato, durata, distanza, passo o frequenza cardiaca. L'intestazione indica se l'andamento è **In aumento**, **Stabile** o **In diminuzione**. Stabile significa che la linea di tendenza si muove meno del 5% della media sull'intero periodo, quindi un guadagno lento ma costante conta comunque come in aumento. Per il passo, meno è meglio, e una linea in discesa risulta come miglioramento. Sul telefono il grafico diventa una tabella con gli stessi valori.

Usa `type: e1rm` per il miglior 1RM stimato giornaliero (Epley: `weight × (1 + reps / 30)`). Contano solo i pesi positivi con ripetizioni intere da 1 a 12; le serie di riscaldamento e i drop set sono esclusi. I giorni senza serie valide vengono omessi. Le stime seguono l'impostazione kg/lb. Il grafico di forza predefinito resta il volume.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

L'API aggiunge `estimatedOneRepMax` a `getExerciseStats`: la stima migliore nell'unità di peso configurata, oppure `null` se non esiste una serie valida. I campi dei record personali esistenti e le colonne del CSV restano invariati.

![Grafico del 1RM stimato della panca piana con la linea di tendenza in aumento su desktop, e gli stessi valori come tabella sul telefono](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Tutti i parametri</summary>

| Parametro       | Predefinito    | Cosa fa                                                                   |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Solo questo esercizio                                                     |
| `workout`       | —              | Solo questo allenamento                                                   |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` o `heartRate`  |
| `chartType`     | `exercise`     | Come viene costruito il punto di ogni giorno (sotto)                      |
| `dateRange`     | `30`           | Giorni da includere                                                       |
| `limit`         | —              | Solo gli ultimi N punti                                                   |
| `showTrendLine` | `false`        | Disegna una linea di tendenza                                             |
| `showStats`     | `true`         | Mostra media, migliore e peggiore sotto il grafico                        |
| `title`         | `Trend <type>` | Titolo del grafico                                                        |
| `height`        | 4:3            | `300` (pixel) o una lunghezza CSS come `50vh`                             |
| `exactMatch`    | `false`        | Confronta il nome dell'esercizio in modo esatto                           |

| `chartType` | Serie usate                          | Punto di ogni giorno |
| ----------- | ------------------------------------ | -------------------- |
| `exercise`  | serie di `exercise`                  | media                |
| `workout`   | serie di `workout`                   | totale               |
| `combined`  | serie di `exercise` dentro `workout` | totale               |
| `all`       | ogni serie (ignora i filtri)         | totale               |

</details>

## Dashboard e mappa di calore muscolare

Un blocco `workout-dashboard` si apre con quattro numeri: allenamenti totali, striscia settimanale, volume totale e record personali. Sotto trovi statistiche rapide per settimana, mese e anno, un andamento del volume, gli allenamenti recenti, le statistiche dei protocolli, la durata pianificata a confronto con quella effettiva e un calendario degli allenamenti: un anno di giorni di allenamento, sfumati in base al volume, con la tua striscia attuale e la migliore. Una settimana conta per la striscia quando raggiunge i giorni di allenamento del tuo obiettivo settimanale (Impostazioni → Obiettivo settimanale, 1 per impostazione predefinita). Sul telefono, le azioni rapide vengono prima e il riepilogo è una griglia 2 × 2.

<img src="assets/dashboard.png" width="720" alt="La dashboard sul telefono: riepilogo, calendario degli allenamenti con l'obiettivo della settimana raggiunto, allenamenti recenti e statistiche rapide">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Per scegliere i widget e il loro ordine senza scrivere YAML, inserisci la dashboard con il comando **Inserisci dashboard allenamento**, oppure apri il menu ⋮ in alto a destra di una dashboard inserita e scegli **Modifica dashboard**.

Imposta **Layout** su **Griglia** in quella finestra per posizionare ogni widget a mano, come oggetti in un inventario: trascina un widget per spostarlo, trascina il suo angolo per allargarlo o allungarlo, e rilascialo sotto la griglia per toglierlo. Funziona anche la tastiera: le frecce spostano, Shift con le frecce ridimensiona, Canc toglie un widget. La griglia ha tante colonne quante ne entrano nella larghezza della nota; in un riquadro più stretto i widget vengono reimpacchettati nell'ordine di lettura, e sul telefono sono impilati. Il tuo layout viene conservato: quando la nota ha una sola colonna (un telefono), la finestra chiede quante colonne modificare, partendo da quelle salvate. Il blocco mantiene una riga per widget (colonna, riga, larghezza, altezza):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

La mappa di calore mostra quali muscoli hai allenato nell'ultima settimana, mese o anno, fronte e retro, per **Volume**, **Serie** o **Ripetizioni**. È il modo più rapido per accorgerti che hai saltato le gambe per tre settimane. Sotto, una breve analisi dell'allenamento ti avvisa di squilibri, come una parte anteriore che lavora molto più della schiena. Legge i tag muscolari delle tue [pagine esercizio](#tipi-di-esercizio). Gli esercizi a corpo libero e a tempo non hanno peso, quindi si illuminano solo con Serie e Ripetizioni.

<img src="assets/heatmap.png" width="720" alt="Mappa di calore muscolare della settimana sul telefono, fronte e retro: quadricipiti, glutei e femorali allenati, con l'analisi dell'allenamento sotto">

<details>
<summary>Tutti i parametri</summary>

| Parametro             | Predefinito | Cosa fa                                                                                                                                                                                                     |
| --------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —           | Titolo sopra la dashboard                                                                                                                                                                                   |
| `dateRange`           | tutte       | Solo le serie degli ultimi N giorni                                                                                                                                                                         |
| `widgets`             | tutti       | I widget da mostrare, in quest'ordine: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`      | `grid` posiziona ogni widget nelle sue celle (vedi sopra)                                                                                                                                                   |
| `columns`             | —           | Griglia: le colonne per cui è stata creata                                                                                                                                                                  |
| `grid.<widget>`       | —           | Griglia: colonna, riga, larghezza e altezza di quel widget                                                                                                                                                  |
| `recentWorkoutsLimit` | `5`         | Allenamenti nell'elenco recente                                                                                                                                                                             |
| `volumeTrendDays`     | `30`        | Giorni nel grafico dell'andamento del volume                                                                                                                                                                |

</details>

<details>
<summary>Tag muscolari</summary>

I tag possono essere un elenco, una sola parola (`tags: chest`) o una riga separata da virgole (`tags: chest, triceps`).

Gruppi generali: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

I muscoli specifici hanno una propria zona del corpo e contano nel loro gruppo. Un tag generico si distribuisce su tutta la zona: `chest` illumina un po' tutte e tre le parti del petto, mentre `upper_chest` illumina completamente solo la parte alta.

| Gruppo      | Muscoli specifici                           |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (or `ql`) |
| `core`      | `obliques`, `serratus`                      |

I tag nella tua lingua, come `petto` o `schiena`, funzionano anche. Il plugin li associa ai gruppi sopra usando `muscle-tags.csv`, accanto al tuo registro. Modificalo con **Gestisci tag muscolari** (aggiungi, rinomina, cerca, individua i duplicati) oppure a mano:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Un tag che è già il nome di un gruppo (`upper_chest`, `Upper chest`, `upper-chest`) funziona sempre, anche se `muscle-tags.csv` non lo elenca.

</details>

## Timer

Un blocco `workout-timer` è un timer a conto alla rovescia, a intervalli o un cronometro. Salva i tuoi tempi di riposo abituali come preset. Collega un timer a un esercizio o a un allenamento e si riavvia ogni volta che registri una serie, così non devi toccarlo tra una serie e l'altra. Con `autoStart: true` parte appena si apre la nota.

<img src="assets/timers.png" width="320" alt="Due timer sul telefono: un timer a intervalli nella fase di riposo e un preset Tabata nella fase di lavoro del round 2">

Suona anche su iOS e Android. I telefoni consentono l'audio solo dopo che hai toccato la pagina, quindi un timer avviato da `autoStart` resta muto finché non tocchi **Avvia** una volta.

In **Impostazioni → Workout Planner → Segnali del timer sul dispositivo**, **Mantieni lo schermo attivo durante l'esecuzione di un timer** è attivo per impostazione predefinita. Chiede di tenere lo schermo acceso mentre almeno un timer è in funzione in primo piano, dove il dispositivo lo consente. **Vibra al completamento del timer** è disattivato per impostazione predefinita e aggiunge un breve impulso a zero, indipendente dal suono, sui dispositivi che lo supportano, come Android. Su iOS resta il segnale audio esistente; la vibrazione via web non è disponibile. Queste funzioni usano le API del browser in modo best-effort e non sono ancora state verificate su dispositivi Android e iOS reali. Non offrono sveglie in background. Un timer con un `id` continua a girare quando cambi nota; mettilo in pausa o lascia che finisca per rilasciare il blocco dello schermo.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Un timer a intervalli può alternare lavoro e riposo. Il display mostra **Lavoro** o **Riposo**, e ogni fase inizia con il suo suono. Ogni round è il suo lavoro seguito dal suo riposo, l'ultimo incluso, quindi questo Tabata dura 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s di lavoro, 10 s di riposo, 8 round) e `preset: EMOM` (un round ogni minuto per 10 minuti) sono integrati. Un preset salvato con lo stesso nome li sostituisce.

<details>
<summary>Tutti i parametri</summary>

| Parametro             | Predefinito | Cosa fa                                                                                 |
| --------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` o `stopwatch`                                                   |
| `duration`            | `30`        | Secondi (conto alla rovescia; per `interval` il lavoro di ogni round)                   |
| `work`                | —           | Intervallo: secondi di lavoro per round (sostituisce `duration`)                        |
| `rest`                | `0`         | Intervallo: secondi di riposo dopo il lavoro di ogni round                              |
| `rounds`              | `1`         | Round (intervallo)                                                                      |
| `sound`               | `true`      | Suona un segnale quando il tempo è scaduto                                              |
| `autoStart`           | `false`     | Parte appena si apre la nota                                                            |
| `showControls`        | `true`      | Mostra avvia, pausa e reimposta                                                         |
| `preset`              | —           | Parte da un preset (salvato, `Tabata` o `EMOM`); i parametri lo sovrascrivono           |
| `exercise`, `workout` | —           | Riavvia il timer quando registri una serie per questo esercizio o allenamento           |
| `superset`            | `false`     | Solo esportazione su canvas: disegna questo esercizio e il successivo come superset     |

</details>

## Sessione guidata

Un blocco `workout-session` in cima a una nota di allenamento (comando **Inserisci sessione guidata**) ti accompagna un esercizio alla volta: a quale serie sei, l'obiettivo, cosa hai fatto l'ultima volta, un pulsante **Registra serie** e il timer di riposo, che parte quando registri una serie.

![Una sessione guidata sul telefono: serie 3 di 4 dello squat con il riposo in funzione sia sulla sessione sia sulla scheda delle serie, il modulo di registrazione aperto da Registra serie, poi l'esercizio successivo con il suo timer di riposo in funzione](assets/session.png)

````markdown
```workout-session
```

## Squat

```workout-sets
exercise: Squat
sets: 4
targetReps: 8
targetWeight: 100
rest: 180
```
````

Il piano è la nota stessa: ogni blocco `workout-log` o `workout-sets` con un `exercise` è un passaggio, nell'ordine in cui compaiono, con i suoi `sets`, `targetReps` e `targetWeight`. Il riposo viene dal `rest` del blocco `workout-sets`, altrimenti dal blocco `workout-timer` nella stessa sezione `##` (il preset predefinito se non ce n'è uno). La sessione e la scheda delle serie condividono un unico conto alla rovescia. La sessione conta le serie registrate oggi in questo allenamento, quindi riprende da dove avevi lasciato quando riapri la nota. Un esercizio senza `sets` resta quello corrente finché non registri una serie di un esercizio successivo; **Precedente** e **Avanti** ti permettono di muoverti liberamente.

## Durata dell'allenamento

Un blocco `workout-duration` stima quanto dura una nota di allenamento: il riposo dai suoi timer più il tempo di ogni serie, accanto a quanto è durata davvero la tua ultima sessione.

<img src="assets/duration.png" width="420" alt="Scheda della durata stimata con tempo di riposo, tempo per serie e ultima sessione">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` può essere un percorso nel vault, un percorso relativo a questa nota, o solo il nome della nota; se lo ometti, stima la nota corrente. I secondi per ripetizione e per serie arrivano da [Impostazioni](#impostazioni).

## Tipi di esercizio

Una pagina esercizio è una nota nella tua cartella degli esercizi. Il suo frontmatter dice cosa deve chiedere il modulo di registrazione e quali muscoli allena l'esercizio. **Crea pagina esercizio** ne crea una per te.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Il modulo chiede                              | Accettati anche                                              |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `strength` (predefinito) | ripetizioni, peso                         | `bodyweight`, `weights`                                      |
| `timed`              | durata                                        | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distanza, durata (facoltativa)                | `running`, `run`                                             |
| `cardio`             | durata, distanza e frequenza cardiaca (facoltative) | —                                                      |
| `custom`             | solo i campi elencati sotto `parameters`      | —                                                            |

Lo yoga funziona allo stesso modo: ogni posa è un esercizio `timed`, quindi il modulo chiede solo per quanto l'hai tenuta. Le note di esempio includono un flusso di yoga mattutino con una sessione guidata.

![Un flusso di yoga sul telefono: la sessione guidata su Downward Dog, il modulo di registrazione che chiede solo la durata della posa, e la scheda delle serie con la prima posa registrata](assets/yoga.png)

Per uno sport che registra altro (un grado di arrampicata, i tentativi, se l'hai chiusa), crea il tuo tipo in **Impostazioni → Tipi di esercizio**: dagli un nome e scegli i suoi campi, quelli integrati come ripetizioni e peso oppure nuovi (numero, testo o sì/no). Poi compare nell'elenco dei tipi quando crei un esercizio, che scrive `exercise_type: <il tuo tipo>` nella pagina. I tipi integrati non si possono modificare, ma **Duplica** ne crea uno a partire da un altro. Eliminare un tipo fa solo smettere di proporlo: gli esercizi che lo usano mantengono i loro campi e le serie registrate.

`type:` funziona come `exercise_type:`. Puoi anche aggiungere campi a un solo esercizio sotto `parameters`, per esempio i giri per la corda:

```yaml
---
exercise_type: timed
parameters:
  - key: rounds
    label: Rounds
    type: number
    required: false
---
```

Se cambi il tipo di un esercizio dopo averlo registrato, **Converti esercizio** sposta le serie esistenti e ti permette di scegliere in quale campo va ciascun vecchio campo.

## I tuoi dati

Ogni serie è una riga in `workout_logs.csv`, quindi puoi aprirlo in un foglio di calcolo, farne un backup o sincronizzarlo come qualsiasi altro file.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Colonne e modifica a mano</summary>

| Colonna                    | Significato                              |
| -------------------------- | ---------------------------------------- |
| `date`                     | Quando la serie è stata registrata (ISO 8601) |
| `exercise`, `workout`      | Nome dell'esercizio e dell'allenamento   |
| `reps`, `weight`, `volume` | Il volume è ripetizioni × peso           |
| `origine`                  | Link alla nota da cui è stata registrata |
| `timestamp`                | ID univoco della riga (millisecondi)     |
| `notes`, `protocol`        | Testo libero e tecnica di allenamento    |

I tipi di esercizio con campi propri (`duration`, `distance`, `heartRate`, o i tuoi `parameters`) aggiungono colonne in fondo. L'ultima colonna, `weightUnit`, è `kg` o `lb`: l'unità del `weight` e del `volume` di quella riga. Un valore vuoto indica l'unità delle impostazioni.

Se modifichi il file a mano, mantieni la riga di intestazione e racchiudi tra virgolette doppie ogni valore che contiene una virgola, una virgoletta o un a capo. Le note che iniziano con `=`, `+`, `-` o `@` vengono salvate con un `'` iniziale, così i fogli di calcolo non le eseguono come formule; il plugin lo nasconde di nuovo.

</details>

Tutto resta nel tuo vault. Il plugin scrive negli appunti solo quando clicchi su un badge di copia (un tag muscolare nella dashboard), e non li legge mai.

### Dataview e Templater

Il plugin espone `WorkoutPlannerAPI` (anche `window.WorkoutPlannerAPI`) una volta caricato.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Riferimento API ed esempi aggiuntivi</summary>

| Metodo                       | Restituisce                                                                                                                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Serie, ciascuna con `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` e `volume` sono nell'unità delle impostazioni; `enteredWeight` e `enteredUnit` sono quelli inseriti                                    |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Nomi degli esercizi, in ordine: i nomi dei file delle tue pagine esercizio (sottocartelle incluse), oppure i nomi nel registro quando non hai pagine esercizio. `{ tag: "chest" }` tiene gli esercizi la cui pagina ha quel tag, quindi è vuoto senza pagine esercizio. |

`getWorkoutLogs` accetta `exercise` (parziale, senza distinzione tra maiuscole e minuscole), `workout`, `dateRange: { start, end }`, `protocol` e `exactMatch`.

Squat recenti, in Dataview:

```dataviewjs
const logs = await WorkoutPlannerAPI.getWorkoutLogs({
  exercise: "Squat",
  dateRange: { start: moment().subtract(30, "days").format("YYYY-MM-DD") },
});
dv.table(
  ["Date", "Reps", "Weight"],
  logs.map((l) => [l.date.slice(0, 10), l.reps, l.weight]),
);
```

In un template di [Templater](https://github.com/SilentVoid13/Templater), per iniziare una nota con i tuoi ultimi numeri:

```markdown
## Squat

<%\*
const s = await WorkoutPlannerAPI.getExerciseStats("Squat");
tR += s.totalSets
? `Best ${s.prWeight} × ${s.prReps} (${s.prDate}), last session ${s.lastWorkoutDate}`
: "No squats logged yet";
%>
```

</details>

## Impostazioni

Imposta le cartelle di CSV ed esercizi, l'unità di peso predefinita, il passo di peso dei pulsanti **+/−**, i preset dei timer, i tuoi protocolli (nome, etichetta breve e colore), e i secondi per ripetizione e per serie usati dalla stima della durata. **Esegui tutte** in **Avanzate** esegue ogni operazione di manutenzione dopo un aggiornamento.

Cambiare l'unità di peso non rietichetta le serie vecchie: ogni serie conserva l'unità in cui è stata registrata.

<details>
<summary>Tutti i comandi</summary>

Apri la palette dei comandi (`Ctrl/Cmd + P`) e digita il nome.

| Comando                                                     | Cosa fa                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Crea registro allenamento                                   | Registra una serie                                                 |
| Inizia il tour                                              | Fai il tour guidato                                                |
| Crea note di esempio                                        | Aggiungi esercizi, allenamenti, registri e una dashboard di esempio |
| Apri la guida per iniziare                                  | Apri la guida negli esempi                                         |
| Inserisci grafico allenamento / tabella allenamento / timer allenamento / dashboard allenamento / durata allenamento | Inserisci un blocco tramite un modulo |
| Crea pagina esercizio                                       | Nuova pagina esercizio con tipo e tag                              |
| Crea sezione esercizio                                      | Aggiungi titolo, timer e tabella per un esercizio alla nota corrente |
| Aggiungi blocco esercizio                                   | Inserisci un blocco esercizio, con completamento automatico del nome |
| Converti esercizio                                          | Sposta le serie di un esercizio a un altro tipo di esercizio      |
| Gestisci tag muscolari                                      | Modifica `muscle-tags.csv`                                         |
| Genera riferimento dei tag                                  | Crea una nota che elenca ogni tag muscolare                        |
| Verifica nomi degli esercizi                                | Trova lo stesso esercizio registrato con grafie diverse            |
| Esporta allenamento su canvas                               | Disponi l'allenamento corrente su un canvas di Obsidian            |
| Crea file CSV del registro                                  | Crea un registro vuoto                                             |
| Importa da Strong o Hevy                                    | Aggiungi le serie di un export CSV di Strong o Hevy al registro    |
| Migra tipi di esercizio, Aggiungi gli ID mancanti ai blocchi di codice | Manutenzione dopo l'aggiornamento da versioni precedenti |

</details>

## Risoluzione dei problemi

- **Conflitto con Workout Block (`workout-block`).** Entrambi i plugin registrano blocchi di codice `workout-log` e usano `workout_logs.csv` come nome predefinito del file di registro. Disattiva uno dei due plugin prima di usare l'altro.

- **Una tabella o un grafico è vuoto.** Controlla il nome dell'esercizio e `dateRange` (i grafici usano per default gli ultimi 30 giorni). Con `exactMatch: true` il nome deve corrispondere esattamente.
- **Un esercizio manca nella mappa di calore.** La sua pagina deve avere `tags` muscolari ed essere nella cartella degli esercizi. Gli esercizi a corpo libero e a tempo compaiono solo sotto **Serie** o **Ripetizioni**.
- **Il modulo di registrazione chiede ripetizioni e peso per un plank.** Imposta `exercise_type: timed` nella pagina dell'esercizio.
- **Il timer non emette suoni sul telefono.** Tocca **Avvia** una volta; i telefoni bloccano l'audio finché non tocchi la pagina.

## Installazione

### Dai plugin della community

1. Apri **Impostazioni → Plugin della community**
2. Cerca **Workout Planner**
3. Seleziona **Installa**, poi **Attiva**

### Manuale

1. Scarica `main.js`, `manifest.json` e `styles.css` dall'[ultima release](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Crea la cartella `your-vault/.obsidian/plugins/workout-planner/`
3. Copia i file scaricati in quella cartella
4. Attiva il plugin in **Impostazioni → Plugin della community**

## Supporto

Workout Planner è gratuito e open source. Se ti aiuta ad allenarti, puoi [offrirmi un caffè](https://buymeacoffee.com/spatariurares). Hai trovato un bug o manca qualcosa? Apri una [segnalazione](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Ogni lingua diversa dall'inglese è tradotta automaticamente, quindi alcune frasi possono suonare strane. Se la tua ti sembra strana, le correzioni sono benvenute.

## Crediti

I grafici usano [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner è rilasciato sotto [licenza MIT](LICENSE).
