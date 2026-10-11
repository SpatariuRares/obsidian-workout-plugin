# Muscle Heat Map Widget

Widget del dashboard che visualizza una mappa termica del corpo umano colorata in base al volume di allenamento per gruppo muscolare.

## Data Flow

```
WorkoutLogData[]
  -> MuscleDataCalculator.filterDataByTimeFrame()        filtra per settimana/mese/anno
  -> MuscleDataCalculator.calculateMuscleGroupVolumes()  somma la metrica (volume/sets/reps) per muscolo
  -> MuscleTagService.musclesForExercise()               mappa esercizio -> muscoli (via tag frontmatter)
  -> MuscleDataCalculator.calculateZoneValues()          valore di ogni zona da HEAT_MAP_ZONES
  -> Body.render()                                       disegna l'SVG e colora ogni [data-muscle]
```

## Struttura File

```
muscle-heat-map/
├── MuscleHeatMap.ts          # Orchestratore principale
├── HeatMapControls.ts        # Bottoni toggle (timeframe, view, metrica)
├── types.ts                  # MuscleHeatMapOptions, HeatMapMetric
├── index.ts                  # Barrel export
│
├── business/                 # Logica dati
│   ├── MuscleDataCalculator.ts   # Filtraggio, totali per muscolo, valori delle zone
│   ├── MuscleBalanceAnalyzer.ts  # Analisi sbilanciamenti front/back (lato da MUSCLE_GROUPS)
│   └── index.ts
│
└── body/                     # Rendering SVG
    ├── zones.ts              # HEAT_MAP_ZONES: zona -> { gruppo muscolare: peso }
    ├── Body.ts               # Disegna l'SVG e applica i colori per zona
    ├── BodyViewSvg.ts        # Markup SVG fronte/retro con attributi data-muscle
    ├── HeatMapColors.ts      # Gradiente colori: grigio -> arancione -> rosso -> rosso scuro
    └── index.ts              # Barrel export (Body, VIEW_TYPE, zone)
```

## Aggiungere o modificare una zona

1. Nell'SVG (`BodyViewSvg.ts`) dai al gruppo `data-muscle="<zoneId>"`. Se la zona è una parte di una forma esistente, duplica il path e taglialo con un `clipPath` (vedi petto, romboidi, serrato); gli id dei clip usano il prefisso `${uid}-` per essere unici per istanza.
2. In `zones.ts` aggiungi `<zoneId>: { <gruppo canonico>: peso, ... }`.

Un muscolo nuovo va prima in `MUSCLE_GROUPS` (`app/constants/muscles.constants.ts`), con il gruppo padre se è specifico e il lato del corpo; `app/constants/__tests__/muscleRegistry.test.ts` fallisce se non è disegnato in nessuna zona. I test in `body/__tests__/Body.test.ts` falliscono se una zona dell'SVG manca nel registro o viceversa. `__tests__/HeatMapColors.characterization.test.ts` fissa i colori di ogni zona per dati di prova: se cambi pesi o zone di proposito, aggiorna lo snapshot (`npm test -- -u <file>`).

## Dettaglio File

### Root

**`MuscleHeatMap.ts`** - Entry point del widget. Metodo statico `render()` chiamato da `EmbeddedDashboardView`. Crea il container HTML, istanzia i controls, lancia il rendering iniziale. `renderHeatMap()` coordina il pipeline: filtro dati -> totali per muscolo -> valori delle zone -> rendering Body -> analisi sbilanciamenti.

**`HeatMapControls.ts`** - Tre gruppi di toggle: timeframe (week/month/year), view (front/back) e metrica (volume/sets/reps). Al click aggiorna `MuscleHeatMapOptions` e invoca la callback di re-render.

### business/

**`MuscleDataCalculator.ts`**

1. `filterDataByTimeFrame()` - delega a `DateUtils` per filtrare i dati per periodo
2. `calculateMuscleGroupVolumes()` - usa `MuscleTagService.musclesForExercise()` (una volta per esercizio) per trovare i muscoli e somma la metrica scelta
3. `calculateZoneValues()` - converte i totali per muscolo nei valori delle zone tramite `HEAT_MAP_ZONES`

**`MuscleBalanceAnalyzer.ts`** - Somma il totale dei muscoli di ciascun lato del corpo secondo il campo `side` di `MUSCLE_GROUPS` (`app/constants/muscles.constants.ts`); i muscoli `both` (spalle, deltoidi laterali, avambracci) non contano. Oltre il 30% di differenza mostra un warning tradotto (`dashboard.muscleHeatMap.imbalance.*`).

**Da esercizio a muscoli** (`app/services/exercise/MuscleTagService.ts`, `musclesForExercise()`):

1. Trova la pagina dell'esercizio via `ExerciseLibrary` (nome del file, `exercise_name` o `nome_esercizio`, mai un nome parziale)
2. Legge i tag del frontmatter dalla `metadataCache` di Obsidian
3. Mappa ogni tag con la mappa dell'utente (`muscle-tags.csv`) o quella predefinita; un tag uguale all'id di un gruppo canonico (`upper_chest`, "Upper chest") vale sempre
4. Nessun ripiego sul nome: un esercizio senza tag muscolari non conta (il widget "errori file" lo segnala)

### body/

**`zones.ts`** - `HEAT_MAP_ZONES` dice per ogni zona da quali gruppi muscolari prende il valore e con che peso (es. `upperChest: { chest: 0.4, upper_chest: 1 }`). Le zone di arti e spalle hanno peso 0.5 perché ogni lato mostra metà del volume.

**`Body.ts`** - Riceve i valori delle zone e la view. `render()` crea l'`<svg>`, inserisce il markup di `BODY_VIEWS_SVG.FRONT/BACK(uid)` e colora ogni elemento `[data-muscle]` con `HeatMapColors.getColor(valore / max)`.

**`BodyViewSvg.ts`** - `BODY_VIEWS_SVG.FRONT(uid)` / `BACK(uid)` restituiscono il markup del corpo. Ogni gruppo muscolare ha `data-muscle` e `fill="currentColor"`.

**`HeatMapColors.ts`** - Gradiente a 4 fasce:

- `0` -> `#e9ecef` (grigio, nessuna attività)
- `0 - 0.3` -> grigio chiaro -> arancione chiaro
- `0.3 - 0.7` -> arancione chiaro -> rosso vivo
- `0.7 - 1` -> rosso vivo -> rosso scuro (#9b0000)

