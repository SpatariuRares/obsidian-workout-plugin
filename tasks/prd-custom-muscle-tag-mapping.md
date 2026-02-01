# PRD: Custom Muscle Tag Mapping System

## Introduction

Il plugin attualmente ha tag muscolari hardcoded solo in inglese e italiano (`muscles.constants.ts`). Questo limita gli utenti di altre lingue e non gestisce errori di battitura o varianti personali.

Questa funzionalità introduce un sistema di mappatura tag personalizzati basato su CSV, permettendo agli utenti di creare i propri tag (in qualsiasi lingua) e mapparli ai gruppi muscolari canonici. Include un modal per gestire i tag con suggerimenti fuzzy per tag simili.

## Goals

- Permettere agli utenti di creare tag personalizzati in qualsiasi lingua
- Mappare ogni tag personalizzato a UN gruppo muscolare canonico
- Gestire errori di battitura tramite suggerimenti fuzzy matching
- Salvare i mapping in un file CSV nella stessa cartella dei log
- Fornire un modal UI per CRUD completo + import/export
- Aggiungere un pulsante nelle settings per creare il CSV iniziale con i tag di default

## User Stories

### US-001: Aggiungere pulsante "Create tag CSV" nelle settings
**Description:** Come utente, voglio un pulsante nelle impostazioni per creare il file CSV dei tag con i valori di default, così posso iniziare a personalizzare i miei tag.

**Acceptance Criteria:**
- [ ] Pulsante "Create muscle tags CSV" nella sezione settings del plugin
- [ ] Il pulsante crea il file `muscle-tags.csv` nella stessa cartella del CSV dei log
- [ ] Il CSV viene popolato con tutti i tag di default da `MUSCLE_TAG_MAP`
- [ ] Se il file esiste già, mostra conferma prima di sovrascrivere
- [ ] Messaggio di successo/errore dopo la creazione
- [ ] Typecheck passes

### US-002: Definire struttura CSV e servizio di lettura/scrittura
**Description:** Come sviluppatore, ho bisogno di un servizio per leggere e scrivere il file CSV dei tag muscolari.

**Acceptance Criteria:**
- [ ] Struttura CSV: `tag,muscleGroup` (es. `petto,chest`)
- [ ] `MuscleTagService` con metodi: `loadTags()`, `saveTags()`, `getTagMap()`
- [ ] Caching dei tag (invalidato quando il file cambia)
- [ ] Fallback ai tag di default se il CSV non esiste
- [ ] Gestione errori per CSV malformato
- [ ] Typecheck passes
- [ ] Unit test per il servizio

### US-003: Integrare MuscleTagService nel sistema esistente
**Description:** Come sviluppatore, devo far sì che tutto il plugin usi il nuovo servizio invece di `MUSCLE_TAG_MAP` hardcoded.

**Acceptance Criteria:**
- [ ] `DataFilter` usa `MuscleTagService.getTagMap()` invece di `MUSCLE_TAG_MAP`
- [ ] `MuscleHeatMap` usa il servizio per la mappatura
- [ ] Altri componenti che usano `MUSCLE_TAG_MAP` migrati al servizio
- [ ] I tag di default rimangono come fallback quando CSV non esiste
- [ ] Typecheck passes
- [ ] Test esistenti continuano a passare

### US-004: Creare modal per gestione tag
**Description:** Come utente, voglio un modal per visualizzare, aggiungere, modificare ed eliminare i miei tag personalizzati.

**Acceptance Criteria:**
- [ ] Modal accessibile da comando palette ("Manage muscle tags")
- [ ] Lista tutti i tag esistenti con il loro gruppo muscolare
- [ ] Campo di ricerca per filtrare i tag
- [ ] Pulsante "Add tag" per aggiungere nuovo mapping
- [ ] Click su un tag apre form di modifica
- [ ] Pulsante delete per ogni tag (con conferma)
- [ ] Dropdown per selezionare il gruppo muscolare (lista gruppi canonici)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Implementare fuzzy matching per suggerimenti tag simili
**Description:** Come utente, quando aggiungo un tag voglio vedere suggerimenti per tag simili già esistenti, così evito duplicati e typo.

**Acceptance Criteria:**
- [ ] Quando digito un nuovo tag, mostra suggerimenti per tag simili (Levenshtein distance ≤ 2)
- [ ] Suggerimenti mostrano: tag esistente + gruppo muscolare mappato
- [ ] Click su suggerimento popola il form con quel tag
- [ ] Warning se il tag è molto simile a uno esistente (possibile duplicato)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Implementare import/export CSV nel modal
**Description:** Come utente, voglio poter esportare i miei tag per backup e importare tag da un file CSV esterno.

**Acceptance Criteria:**
- [ ] Pulsante "Export" scarica il CSV attuale
- [ ] Pulsante "Import" apre file picker per CSV
- [ ] Import valida il formato CSV prima di procedere
- [ ] Import mostra preview dei tag da importare
- [ ] Opzione per merge (aggiungi nuovi) o replace (sostituisci tutto)
- [ ] Gestione errori con messaggi chiari
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Aggiungere comando per aprire modal gestione tag
**Description:** Come utente, voglio accedere rapidamente al modal di gestione tag dalla command palette.

**Acceptance Criteria:**
- [ ] Comando "Workout: Manage muscle tags" registrato
- [ ] Comando apre il modal di gestione tag
- [ ] Typecheck passes

## Functional Requirements

- **FR-1:** Il file CSV deve essere salvato nella stessa cartella configurata per i log workout (`settings.dataFilePath`)
- **FR-2:** Il nome file deve essere `muscle-tags.csv`
- **FR-3:** Formato CSV: prima riga header `tag,muscleGroup`, righe successive i mapping
- **FR-4:** Un tag può mappare a UN solo gruppo muscolare
- **FR-5:** I gruppi muscolari canonici sono: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`, `forearms`, `traps`, `rear_delts`
- **FR-6:** Il servizio deve fare cache dei tag e invalidare quando il file cambia
- **FR-7:** Se il CSV non esiste, usare i tag di default da `MUSCLE_TAG_MAP`
- **FR-8:** Il fuzzy matching deve usare Levenshtein distance con soglia ≤ 2, case-insensitive
- **FR-9:** L'export deve generare un file CSV valido scaricabile
- **FR-10:** L'import deve validare che ogni riga abbia esattamente 2 colonne e che il muscleGroup sia valido

## Non-Goals

- Mapping di un tag a più gruppi muscolari (1:N) - fuori scope
- Sincronizzazione cloud dei tag
- Versioning/history dei cambiamenti ai tag
- Traduzione automatica dei tag
- Integrazione con dizionari esterni per validazione spelling

## Design Considerations

- Il modal deve seguire il pattern `ModalBase` esistente
- Riutilizzare componenti atomici esistenti: `Button`, `Input`, `SearchBox`
- Il dropdown dei gruppi muscolari può usare il componente nativo di Obsidian `DropdownComponent`
- Stile coerente con gli altri modal del plugin

## Technical Considerations

- **MuscleTagService**: Nuovo servizio in `app/services/` con pattern singleton
- **Caching**: Usare stesso pattern di `DataService` (cache con TTL o invalidazione su file change)
- **Fuzzy matching**: Implementare funzione Levenshtein distance in `app/utils/`
- **File watching**: Considerare `vault.on('modify')` per invalidare cache quando CSV cambia
- **CSV parsing**: Usare parsing semplice (split su virgola) dato il formato minimale, o libreria leggera se necessario escape

### Struttura file suggerita

```
app/
├── services/
│   └── MuscleTagService.ts          # Nuovo servizio
├── utils/
│   └── StringUtils.ts               # Aggiungere levenshteinDistance()
├── features/
│   └── modals/
│       └── MuscleTagManagerModal.ts # Nuovo modal
```

### Esempio CSV

```csv
tag,muscleGroup
chest,chest
petto,chest
pettorale,chest
brust,chest
poitrine,chest
pectorales,chest
```

## Success Metrics

- Utenti possono aggiungere tag in qualsiasi lingua e vederli funzionare nelle heatmap/filtri
- Tempo per aggiungere un nuovo tag: < 30 secondi
- Fuzzy matching previene duplicati accidentali
- Nessuna regressione nelle funzionalità esistenti (heatmap, filtri, etc.)

## Decisioni

- **Commenti CSV:** No, non supportati
- **Fuzzy matching:** Case-insensitive
- **Limite tag:** Nessun limite
- **Statistiche utilizzo:** Non incluse nel modal
