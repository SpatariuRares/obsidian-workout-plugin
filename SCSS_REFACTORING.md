# Guida al Refactoring SCSS per Specificità

Questa guida spiega come riorganizzare i file SCSS per migliorare la specificità delle classi CSS e mantenere il codice più pulito e manutenibile. L'obiettivo è replicare il lavoro svolto su `_recent.scss` negli altri file della dashboard (es. `_summary.scss`, `_heatmap.scss`, etc.).

## Il Problema

Definire classi "piatte" o top-level (es. `.workout-card-title`) può causare problemi di:

1.  **Bassa specificità**: Le regole possono essere facilmente sovrascritte da stili globali o del tema.
2.  **Naming conflicts**: Nomi troppo generici possono collidere con altri plugin.
3.  **Mancanza di contesto**: Non è chiaro a quale componente appartenga una classe.

## La Soluzione: Nesting in SCSS

Utilizzare la nidificazione (nesting) di SCSS per incapsulare gli stili all'interno del contenitore principale del componente.

### Esempio Pratico (`_recent.scss`)

**Prima (Non specifico):**

```scss
// Struttura piatta
.workout-recent-workouts-list {
  /* ... */
}

// Questa regola è separata e ha bassa specificità (0,0,1,0)
.workout-recent-date {
  color: var(--text-muted);
}
```

**Dopo (Specifico):**

```scss
// Struttura nidificata
.workout-recent-workouts-list {
  /* ... */

  // La regola è dentro il contenitore.
  // Specificità aumentata (0,0,2,0) -> .workout-recent-workouts-list .workout-recent-date
  .workout-recent-date {
    color: var(--text-muted);
  }
}
```

## Workflow di Refactoring

Per ogni file SCSS in `app/styles/dashboard/`:

1.  **Identifica il Contenitore**: Trova la classe "padre" che racchiude il widget (es. `.workout-summary-card`, `.workout-muscle-heatmap`).
2.  **Sposta le Classi Figlie**: Prendi le regole definite fuori dal contenitore e spostale al suo interno.
    - _Nota_: Se usavi `&` (parent selector) in modo complesso, considera di usare i nomi completi delle classi per chiarezza all'interno del blocco.
3.  **Verifica i Nomi**: Assicurati che i file TypeScript (`.ts`) usino esattamente le stesse classi definite nel SCSS.
    - Spesso i componenti TS usano classi generiche (es. `workout-widget-title`) che potrebbero dover essere rese più specifiche o mirate.

### Checklist File da Controllare

- `_summary.scss`
- `_heatmap.scss`
- `_protocol.scss`
- `_duration.scss`
- `_widgets.scss`

## Esempio di Codice da Correggere

Se trovi questo in `_summary.scss`:

```scss
.workout-summary-card { ... }

.workout-card-title { ... } // Fuori dal blocco!
```

Trasformalo in:

```scss
.workout-summary-card {
  ...
  .workout-card-title { ... } // Dentro il blocco
}
```

Questo garantisce che `.workout-card-title` assuma quello stile _solo_ quando è dentro una `.workout-summary-card`.
