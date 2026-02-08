# Muscle Heat Map Widget

Widget del dashboard che visualizza una mappa termica del corpo umano colorata in base al volume di allenamento per gruppo muscolare.

## Data Flow

```
WorkoutLogData[]
  -> MuscleDataCalculator.filterDataByTimeFrame()    filtra per settimana/mese/anno
  -> MuscleDataCalculator.calculateMuscleGroupVolumes()  somma volumi per muscolo
  -> MuscleTagMapper.findMuscleGroupsFromTags()          mappa esercizio -> muscoli (via tag frontmatter)
  -> MuscleDataCalculator.createBodyDataFromMuscleData()  converte in BodyData (plain object)
  -> ViewDataPreparer                                     normalizza intensita' e calcola colori RGB
  -> Body.render()                                        inietta colori nel template SVG
```

## Struttura File

```
muscle-heat-map/
├── MuscleHeatMap.ts          # Orchestratore principale
├── HeatMapControls.ts        # Bottoni toggle (timeframe + view)
├── types.ts                  # MuscleHeatMapOptions
├── index.ts                  # Barrel export
│
├── business/                 # Logica dati
│   ├── MuscleDataCalculator.ts   # Filtraggio, calcolo volumi, conversione BodyData
│   ├── MuscleBalanceAnalyzer.ts  # Analisi sbilanciamenti front/back
│   ├── MuscleTagMapper.ts        # Mapping tag esercizio -> gruppo muscolare
│   └── index.ts
│
└── body/                     # Rendering SVG
    ├── Body.ts               # Classe principale: crea SVG, delega colori, parsa template
    ├── index.ts              # Barrel export + interfacce dati (BodyData, ArmsData, etc.)
    │
    ├── renderers/
    │   ├── FrontView.ts      # Template SVG (path del corpo) per vista frontale e posteriore
    │   └── ViewDataPrepar.ts # Prepara colori per ogni muscolo da BodyData
    │
    └── utils/
        ├── HeatMapColors.ts      # Gradiente colori: grigio -> arancione -> rosso -> rosso scuro
        ├── IntensityCalculator.ts # Normalizzazione valori a scala 0-1
        ├── SVGBuilder.ts         # Helper per creare elementi SVG con namespace
        └── index.ts
```

## Dettaglio File

### Root

**`MuscleHeatMap.ts`** - Entry point del widget. Metodo statico `render()` chiamato da `EmbeddedDashboardView`. Crea il container HTML, istanzia i controls, lancia il rendering iniziale. `renderHeatMap()` coordina il pipeline completo: filtro dati -> calcolo volumi -> creazione BodyData -> rendering Body -> analisi sbilanciamenti.

**`HeatMapControls.ts`** - Crea due gruppi di toggle button: timeframe (week/month/year) e view (front/back). Al click aggiorna `MuscleHeatMapOptions` e invoca la callback di re-render. Ritorna l'oggetto options mutabile usato dal render iniziale.

**`types.ts`** - Unica interfaccia `MuscleHeatMapOptions` con `timeFrame` e `view`.

### business/

**`MuscleDataCalculator.ts`** - Tre responsabilita':
1. `filterDataByTimeFrame()` - delega a `DateUtils` per filtrare i dati CSV per periodo
2. `calculateMuscleGroupVolumes()` - itera i workout, usa `MuscleTagMapper` per trovare i muscoli coinvolti in ogni esercizio, accumula i volumi, normalizza le intensita' a scala 0-1
3. `createBodyDataFromMuscleData()` - converte la Map di volumi per muscolo in un oggetto `BodyData` strutturato per il rendering, distribuendo i volumi tra parti bilaterali (left/right) e suddivisioni (upper/middle/lower chest)

**`MuscleBalanceAnalyzer.ts`** - Confronta il volume totale dei muscoli frontali (chest, abs, biceps, quads) vs posteriori (back, triceps, hamstrings, glutes). Se la differenza supera il 30%, mostra un warning nel pannello info. Altrimenti mostra un messaggio di equilibrio.

**`MuscleTagMapper.ts`** - Dato un nome esercizio, trova i gruppi muscolari associati:
1. Cerca il file dell'esercizio nel vault via `ExercisePathResolver`
2. Legge i tag dal frontmatter via `FrontmatterParser`
3. Mappa ogni tag al gruppo muscolare canonico via `MUSCLE_TAG_MAP` (supporta tag custom via `DataFilter`)
4. Fallback: se nessun tag matcha, cerca pattern nel nome dell'esercizio
5. Cache statica per performance (persiste per la vita del plugin, `clearCache()` disponibile)

### body/

**`Body.ts`** - Classe che gestisce il rendering SVG del corpo. Riceve `BodyData` e opzioni (view, maxValue). `render()` crea un elemento `<svg>` con viewBox fisso, delega a `ViewDataPreparer` per calcolare i colori, ottiene la stringa SVG da `BODY_VIEWS_SVG.FRONT/BACK`, la parsa con `DOMParser` e la appende al SVG. Supporta `updateBodyData()` e `setView()` per re-render.

**`index.ts`** - Barrel export di `Body`, `VIEW_TYPE`, `BodyVisualizationOptions`. Definisce tutte le interfacce dati: `ArmsData`, `BackData`, `ChestData`, `CoreData`, `LegsData`, `ShoulderData`, `BodyData`.

### body/renderers/

**`FrontView.ts`** - Contiene `BODY_VIEWS_SVG` con due funzioni template:
- `FRONT(10 colori)` - ritorna stringa SVG con path dettagliati per: collo, piedi, inguine, addominali, polpacci, tibiali, obliqui, quadricipiti, avambracci, bicipiti, petto superiore, petto medio-inferiore, spalle, trapezi
- `BACK(11 colori)` - ritorna stringa SVG con path per: trapezi, romboidi, dorsali, lombari, tricipiti, avambracci, glutei, femorali, polpacci, spalle posteriori

Ogni gruppo muscolare SVG usa `style="color: ${colorParam}"` con `fill="currentColor"`.

**`ViewDataPrepar.ts`** - Riceve `BodyData`, usa `IntensityCalculator` per normalizzare i valori raw a 0-1, poi `HeatMapColors` per convertire le intensita' in stringhe colore RGB. Due metodi:
- `prepareFrontViewData()` - 10 colori per la vista frontale
- `prepareBackViewData()` - 11 colori per la vista posteriore

Per muscoli bilaterali (biceps, quads, etc.) prende il max tra left e right.

### body/utils/

**`HeatMapColors.ts`** - Genera colori su un gradiente a 4 fasce:
- `0` -> `#e9ecef` (grigio, nessuna attivita')
- `0 - 0.3` -> grigio chiaro -> arancione chiaro (interpolazione lineare RGB)
- `0.3 - 0.7` -> arancione chiaro -> rosso vivo
- `0.7 - 1` -> rosso vivo -> rosso scuro (#9b0000)

**`IntensityCalculator.ts`** - Normalizza valori numerici raw a scala 0-1 dato un maxValue. Metodi: `normalize()` singolo, `normalizeBilateral()` prende max di due lati, `normalizeAverage()` media di array, `normalizeMultiple()` batch.

**`SVGBuilder.ts`** - Wrapper per `document.createElementNS()` con namespace SVG. Metodi helper: `createElement()`, `createElementWithAttributes()`, `createPath()`, `createRect()`, `createCircle()`, `createEllipse()`, `createGroup()`, `createDefs()`, `createRadialGradient()`, `createLinearGradient()`, `createStop()`, `appendChildren()`. Usato da `Body.ts` per creare l'elemento `<svg>` root.
