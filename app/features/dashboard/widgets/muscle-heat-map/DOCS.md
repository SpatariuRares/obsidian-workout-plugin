# Muscle Heat Map Widget

Widget del dashboard che visualizza una mappa termica del corpo umano colorata in base al volume di allenamento per gruppo muscolare.

## Data Flow

```
WorkoutLogData[]
  -> MuscleDataCalculator.filterDataByTimeFrame()        filtra per settimana/mese/anno
  -> MuscleDataCalculator.calculateMuscleGroupVolumes()  somma la metrica (volume/sets/reps) per muscolo
  -> MuscleTagMapper.findMuscleGroupsFromTags()          mappa esercizio -> muscoli (via tag frontmatter)
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
│   ├── MuscleBalanceAnalyzer.ts  # Analisi sbilanciamenti front/back (somma i sottogruppi nel padre)
│   ├── MuscleTagMapper.ts        # Mapping tag esercizio -> gruppo muscolare
│   └── index.ts
│
└── body/                     # Rendering SVG
    ├── zones.ts              # HEAT_MAP_ZONES: zona -> { gruppo muscolare: peso }
    ├── Body.ts               # Disegna l'SVG e applica i colori per zona
    ├── BodyViewSvg.ts        # Markup SVG fronte/retro con attributi data-muscle
    ├── HeatMapColors.ts      # Gradiente colori: grigio -> arancione -> rosso -> rosso scuro
    ├── SVGBuilder.ts         # Helper per creare elementi SVG con namespace
    └── index.ts              # Barrel export (Body, VIEW_TYPE, zone)
```

## Aggiungere o modificare una zona

1. Nell'SVG (`BodyViewSvg.ts`) dai al gruppo `data-muscle="<zoneId>"`. Se la zona è una parte di una forma esistente, duplica il path e taglialo con un `clipPath` (vedi petto, romboidi, serrato); gli id dei clip usano il prefisso `${uid}-` per essere unici per istanza.
2. In `zones.ts` aggiungi `<zoneId>: { <gruppo canonico>: peso, ... }`.

I test in `body/__tests__/Body.test.ts` falliscono se una zona dell'SVG manca nel registro o viceversa. `__tests__/HeatMapColors.characterization.test.ts` fissa i colori di ogni zona per dati di prova: se cambi pesi o zone di proposito, aggiorna lo snapshot (`npm test -- -u <file>`).

## Dettaglio File

### Root

**`MuscleHeatMap.ts`** - Entry point del widget. Metodo statico `render()` chiamato da `EmbeddedDashboardView`. Crea il container HTML, istanzia i controls, lancia il rendering iniziale. `renderHeatMap()` coordina il pipeline: filtro dati -> totali per muscolo -> valori delle zone -> rendering Body -> analisi sbilanciamenti.

**`HeatMapControls.ts`** - Tre gruppi di toggle: timeframe (week/month/year), view (front/back) e metrica (volume/sets/reps). Al click aggiorna `MuscleHeatMapOptions` e invoca la callback di re-render.

### business/

**`MuscleDataCalculator.ts`**

1. `filterDataByTimeFrame()` - delega a `DateUtils` per filtrare i dati per periodo
2. `calculateMuscleGroupVolumes()` - usa `MuscleTagMapper` per trovare i muscoli di ogni esercizio e somma la metrica scelta
3. `calculateZoneValues()` - converte i totali per muscolo nei valori delle zone tramite `HEAT_MAP_ZONES`

**`MuscleBalanceAnalyzer.ts`** - Confronta il volume dei muscoli frontali (chest, abs, biceps, quads) con quelli posteriori (back, triceps, hamstrings, glutes), contando i sottogruppi (es. `lats`, `upper_chest`) nel gruppo padre. Oltre il 30% di differenza mostra un warning.

**`MuscleTagMapper.ts`** - Dato un nome esercizio, trova i gruppi muscolari:

1. Cerca il file dell'esercizio via `ExercisePathResolver`
2. Legge i tag dal frontmatter via `FrontmatterParser`
3. Mappa ogni tag con la mappa dell'utente (`muscle-tags.csv`) o quella predefinita; un tag uguale all'id di un gruppo canonico (`upper_chest`, "Upper chest") vale sempre
4. Fallback: se nessun tag matcha, cerca pattern nel nome dell'esercizio

### body/

**`zones.ts`** - `HEAT_MAP_ZONES` dice per ogni zona da quali gruppi muscolari prende il valore e con che peso (es. `upperChest: { chest: 0.4, upper_chest: 1 }`). Le zone di arti e spalle hanno peso 0.5 perché ogni lato mostra metà del volume.

**`Body.ts`** - Riceve i valori delle zone e la view. `render()` crea l'`<svg>`, inserisce il markup di `BODY_VIEWS_SVG.FRONT/BACK(uid)` e colora ogni elemento `[data-muscle]` con `HeatMapColors.getColor(valore / max)`.

**`BodyViewSvg.ts`** - `BODY_VIEWS_SVG.FRONT(uid)` / `BACK(uid)` restituiscono il markup del corpo. Ogni gruppo muscolare ha `data-muscle` e `fill="currentColor"`.

**`HeatMapColors.ts`** - Gradiente a 4 fasce:

- `0` -> `#e9ecef` (grigio, nessuna attività)
- `0 - 0.3` -> grigio chiaro -> arancione chiaro
- `0.3 - 0.7` -> arancione chiaro -> rosso vivo
- `0.7 - 1` -> rosso vivo -> rosso scuro (#9b0000)

**`SVGBuilder.ts`** - Wrapper per `document.createElementNS()` con namespace SVG, usato da `Body.ts` per l'elemento `<svg>` radice.
