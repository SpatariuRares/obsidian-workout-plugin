# Documento di Analisi – Dead Code / Ghost Dependencies / Unreachable Logic

Repo: /home/rares/obsidian/the-gym-test-plugin/.obsidian/plugins/obsidian-workout-plugin
Data analisi: 2026‑02‑04
Linguaggio reale: TypeScript (non Java/Kotlin)

## 1) Mappa delle Entry Point (manuale)

Plugin lifecycle

- main.ts: WorkoutChartsPlugin.onload()
- main.ts: WorkoutChartsPlugin.onunload()

Command entry points (Obsidian commands)
Registrati in app/services/CommandHandlerService.ts::registerCommands().

Code block processors (Obsidian Markdown code blocks)

- app/services/CodeBlockProcessorService.ts::registerProcessors()
  - workout-chart
  - workout-log
  - workout-timer
  - workout-dashboard
  - workout-duration

API globale (Dataview integration)

- main.ts espone window.WorkoutPlannerAPI (app/api/WorkoutPlannerAPI.ts)

View entry points
Chiamate da CodeBlockProcessorService:

- EmbeddedChartView.createChart
- EmbeddedTableView.createTable
- EmbeddedTimerView.createTimer
- EmbeddedDashboardView.createDashboard
- EmbeddedDurationView.createDurationEstimator

## 2) Reachability Analysis (candidati dead code)

Metodo usato:

- Ho cercato file TS non importati da altri file non‑test.
- Ho verificato alcuni a mano con rg -n "NomeClasse".

Candidati forti (nessun riferimento attivo nel repo):

- app/features/dashboard/body/BodyHeatMap.ts (BodyHeatMap class)
- app/features/dashboard/body/MuscleFactory.ts (MuscleFactory class)
- app/api/index.ts (barrel, non importato)
- app/services/index.ts (barrel, non importato)
- app/services/data/index.ts (barrel, non importato)
- app/features/charts/components/index.ts (barrel, non importato)
- app/features/dashboard/index.ts (barrel, non importato)
- app/components/index.ts (usato solo in test app/components/**tests**/index.test.ts)

Candidati moderati (usati solo in test o con uso implicito):

- app/components/index.ts: nessun import runtime, solo test
- Qualsiasi tipo o interfaccia “export only” potrebbe essere per uso esterno

Nota importante:
Qualsiasi API esposta via window.\* o usata da Obsidian (commands, processors) non va
rimossa anche se non appare nel grafo di import.

## 3) Logic Flow Check (if/switch sempre veri o falsi)

Trovato:

- app/features/dashboard/body/Body.ts::drawFemaleFrontOutline()
  Metodo vuoto (TODO). È chiamato in drawBodyOutline quando vista è FRONT.
  Questo non è “sempre falso”, ma è logica non operativa per la vista front.

Non trovato:

- Non risultano rami if/else o switch con condizioni sempre vere/falsi dal controllo
  manuale.

## 4) Parameter Review (parametri passati ma inutilizzati)

Parametri non usati ma richiesti da API Obsidian (non rimuovere):

- app/services/CodeBlockProcessorService.ts
  - handleWorkoutChart(source, el, \_ctx)
  - handleWorkoutLog(source, el, \_ctx)

Questi sono richiesti dall’interfaccia registerMarkdownCodeBlockProcessor. Non vanno
rimossi.

———

# Tabella Risultati (Dead Code)

| Elemento (Classe/Metodo)                                                                 | Tipo di Dead Code                 | Motivazione Tecnica                | Rischio Rimozione |
| :--------------------------------------------------------------------------------------- | :-------------------------------- | :--------------------------------- | :---------------- |
| app/features/dashboard/body/BodyHeatMap.ts::BodyHeatMap                                  | Classe inutilizzata               | Nessun                             |
| import/istanza in repo; heatmap usa MuscleHeatMap + Body                                 | Basso                             |
| app/features/dashboard/body/MuscleFactory.ts::MuscleFactory                              | Classe inutilizzata               |
| Nessun riferimento in repo; i muscoli sono creati via classi dedicate (Arms, Back, ecc.) |
| Basso                                                                                    |
| app/features/dashboard/body/Body.ts::getHeatMapColor()                                   | Metodo inutilizzato               | Metodo                             |
| privato non chiamato nel file                                                            | Basso                             |
| app/features/dashboard/body/Body.ts::drawFemaleFrontOutline()                            | Logica non operativa              |
| Chiamato ma metodo vuoto (TODO)                                                          | Medio (potenziale feature futura) |
| app/api/index.ts                                                                         | Ghost dependency (barrel)         | Nessun import da @app/api          | Basso             |
| app/services/index.ts                                                                    | Ghost dependency (barrel)         | Nessun import da @app/services     |
| Basso                                                                                    |
| app/services/data/index.ts                                                               | Ghost dependency (barrel)         | Nessun import da @app/services/    |
| data                                                                                     | Basso                             |
| app/features/charts/components/index.ts                                                  | Ghost dependency (barrel)         | Nessun import da                   |
| @app/features/charts/components                                                          | Basso                             |
| app/features/dashboard/index.ts                                                          | Ghost dependency (barrel)         | Nessun import da @app/             |
| features/dashboard                                                                       | Basso                             |
| app/components/index.ts                                                                  | Ghost dependency (barrel)         | Usato solo in test app/components/ |
| **tests**/index.test.ts                                                                  | Basso runtime / Medio test        |

———

# Checklist Manuale di Verifica (passo‑passo)

## A) Verifica entry point

1. Apri main.ts e conferma:
   - onload crea servizi, registra processors, registra comandi
   - onunload pulisce timer, cache, API globale
2. Apri app/services/CommandHandlerService.ts:
   - controlla che ogni addCommand abbia un callback valido
3. Apri app/services/CodeBlockProcessorService.ts:
   - conferma registerMarkdownCodeBlockProcessor per tutti i code block

## B) Verifica reachability per ogni candidato

Per ciascun elemento:

1. Esegui rg -n "NomeClasse" app
2. Se appare solo nel file stesso o in test, è candidato dead code
3. Verifica se è esposto esternamente (barrel o API globale)

## C) Verifica logica non operativa

- app/features/dashboard/body/Body.ts
  controlla drawFemaleFrontOutline → è vuoto; valutare se implementare o rimuovere
  chiamata

## D) Verifica parametri non usati

- Cerca \_ctx, \_data, \_message ecc.
  Se è parte di API esterna, non rimuovere.

———

# Cose da NON rimuovere (rischio alto)

- Tutto ciò che è:
  - registerMarkdownCodeBlockProcessor
  - addCommand
  - window.WorkoutPlannerAPI
  - interfacce pubbliche usate da Dataview o Obsidian
- Metodi richiesti da Obsidian anche se non usati internamente

———

# Piano d’azione per refactoring sicuro (manuale)

1. Confermare ownership
   Verifica se i barrel (app/services/index.ts, app/api/index.ts, ecc.) siano API
   pubbliche “intenzionali”.
2. Rimuovere dead code a rischio basso
   - BodyHeatMap, MuscleFactory, getHeatMapColor()
   - barrel non usati (se non fanno parte di API esterne)
3. Gestire placeholder
   - drawFemaleFrontOutline() → implementare o rimuovere la chiamata + l’hook
4. Test
   - npm test
   - npm run build
