# Tables Feature - Audit Report

> Data: 2026-02-07
> Scope: `app/features/tables/`, componenti correlati, CSS, test

---

## Sommario

L'analisi ha individuato **codice morto** lasciato da refactoring precedenti (rimozione TableContainer, spostamento MobileTable), **componenti UI mai usati** in produzione, e un **silent catch** che nasconde errori. Nessun bug critico, ma c'e' del peso inutile da eliminare.

---

## 1. CODICE MORTO - Priorita' Alta

### 1.1 `TableHeader` - Classe mai usata in produzione

|                         |                                                        |
| ----------------------- | ------------------------------------------------------ |
| **File**                | `app/features/tables/ui/TableHeader.ts`                |
| **Test**                | `app/features/tables/ui/__tests__/TableHeader.test.ts` |
| **Esportato da**        | `ui/index.ts`, `tables/index.ts`                       |
| **Usato in produzione** | **NO**                                                 |

`TableHeader.render()` crea un `<thead>` con celle `<th>` usando `createEl()`. Ma `TableRenderer.renderTable()` (linee 75-81) crea gli header **direttamente** con `document.createElement()`:

```typescript
// TableRenderer.ts:75-81 - Questo e' il codice effettivo
const thead = table.appendChild(document.createElement("thead"));
const headerRow = thead.appendChild(document.createElement("tr"));
headers.forEach((header) => {
  const th = headerRow.appendChild(document.createElement("th"));
  th.textContent = header;
});
```

`TableHeader` e' un duplicato inutilizzato. Esistono solo test che lo testano, ma nessun codice di produzione lo chiama.

**Azione**: Eliminare `TableHeader.ts` + test + rimuovere dalle barrel exports.

**DONE**: ho inserito dentro a TableRenderer.ts al posto del vecchio codice che faceva la stessa cosa per diminuire le righe di codice.

### 1.2 `TableHeaderCell` - Componente sorting mai integrato

|                         |                                                                   |
| ----------------------- | ----------------------------------------------------------------- |
| **File**                | `app/features/tables/ui/TableHeaderCell.ts`                       |
| **Test**                | `app/features/tables/ui/__tests__/TableHeaderCell.test.ts`        |
| **Esportato da**        | `ui/index.ts`, `tables/index.ts`, `components/molecules/index.ts` |
| **Usato in produzione** | **NO**                                                            |

Questo componente implementa **sorting sulle colonne** (`sortable`, `sortDirection: "asc" | "desc" | "none"`, icone freccia). Ma il sorting **non esiste** nella tabella attuale - i dati sono semplicemente raggruppati per data.

Nessun file di produzione chiama `TableHeaderCell.create()` o `TableHeaderCell.updateSortDirection()`. L'unico consumer e' il test file.

Anche il re-export in `components/molecules/index.ts` (linea 55-60) con il commento `// TableHeaderCell moved to @app/features/tables/ui` conferma che e' stato spostato ma mai effettivamente usato.

**Azione**: Eliminare `TableHeaderCell.ts` + test + rimuovere da tutte le barrel exports (tables/ui, tables/index, molecules/index). Se il sorting e' una feature futura pianificata, spostare in un branch separato.

**DONE**: ho eliminato il file TableHeaderCell.ts e il test associato. Ho anche rimosso i re-export dalle barrel exports.

---

### 1.3 Test MobileTable nella posizione sbagliata

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **File**       | `app/features/tables/ui/__tests__/MobileTable.test.ts` |
| **Componente** | `app/features/charts/components/MobileTable.ts`        |

MobileTable e' stato spostato in `charts/` (commit `f5c00f0`), ma il test e' rimasto in `tables/ui/__tests__/`. L'import nel test e' corretto (`@app/features/charts/components/MobileTable`), ma la posizione del file e' ingannevole.

**Azione**: Spostare `MobileTable.test.ts` in `app/features/charts/components/__tests__/`.

**DONE**: ho spostato il file MobileTable.test.ts nella posizione corretta.

---

### 1.4 Commento test obsoleto su TableContainer

|           |                                                                  |
| --------- | ---------------------------------------------------------------- |
| **File**  | `app/features/tables/components/__tests__/TableRenderer.test.ts` |
| **Linea** | 77                                                               |

```typescript
it("delegates to TableContainer.create", () => {
```

`TableContainer` e' stato rimosso (commit `f5c00f0`). `createTableContainer()` ora crea il div direttamente inline. Il test funziona, ma la descrizione e' fuorviante.

**Azione**: Rinominare in `it("creates a container with the correct class", () => {`

**DONE**: ho rinominato il test.

---

## 2. ROBUSTEZZA - Priorita' Media

### 2.1 Silent catch in `applyRowGroupingOptimized`

|           |                                                   |
| --------- | ------------------------------------------------- |
| **File**  | `app/features/tables/components/TableRenderer.ts` |
| **Linea** | 327-329                                           |

```typescript
} catch {
  // Silent error - grouping failed
}
```

Se il row grouping fallisce (es. dati malformati, `originalLog` null inatteso), l'errore viene **completamente ingoiato**. L'utente vede una tabella vuota o parziale senza nessun feedback. Considerando che il 90% dell'uso e' su mobile in palestra, un errore silenzioso qui e' particolarmente frustrante.

**Azione**: Propagare l'errore o loggarla via `onError` callback (gia' disponibile nel pattern del plugin tramite `callbacks.onError`).

**TO DO**: usare il feedback error del plugin per notificare l'utente in caso di errore.

---

### 2.2 Accesso non protetto a `row.originalLog` nello spacer

|           |                                                   |
| --------- | ------------------------------------------------- |
| **File**  | `app/features/tables/components/TableRenderer.ts` |
| **Linea** | 164                                               |

```typescript
groupRows.forEach((r) => {
  const log = r.originalLog;
  if (!log) return; // <-- ok, c'e' il guard
```

Il guard c'e', ma `originalLog` e' tipizzato come `WorkoutLogData` (non opzionale) nella definizione di `TableRow`. Questo significa che TypeScript non avvisa se qualcuno passa un row senza `originalLog`. Il tipo dovrebbe essere `WorkoutLogData | undefined` per essere onesto.

**Azione**: Verificare il tipo `TableRow.originalLog` - se puo' essere undefined, tipizzarlo come tale.

## **TO DO**: da controllare

## 3. INCONSISTENZE DOCUMENTAZIONE - Priorita' Bassa

### 3.1 CONTEXT.md descrive "Sortable data tables"

|          |                                  |
| -------- | -------------------------------- |
| **File** | `CONTEXT.md` (plugin), linea ~59 |

> Features: sortable columns, protocol badges...

Le colonne **non sono sortabili**. Il componente `TableHeaderCell` con sorting esiste ma non e' integrato. La tabella mostra i dati raggruppati per data, senza interazione di sorting.

**Azione**: Aggiornare CONTEXT.md rimuovendo "sortable columns" dalla descrizione, oppure implementare la feature.

**TO DO**: da controllare

---

## 4. RIEPILOGO AZIONI

| #   | Azione                        | File coinvolti                                           | Tipo           | Priorita' |
| --- | ----------------------------- | -------------------------------------------------------- | -------------- | --------- |
| 1   | Eliminare `TableHeader`       | `ui/TableHeader.ts`, test, barrel exports                | Dead code      | Alta      |
| 2   | Eliminare `TableHeaderCell`   | `ui/TableHeaderCell.ts`, test, barrel exports (3 file)   | Dead code      | Alta      |
| 3   | Spostare test MobileTable     | `tables/ui/__tests__/` -> `charts/components/__tests__/` | Organizzazione | Media     |
| 4   | Fix commento test             | `TableRenderer.test.ts:77`                               | Pulizia        | Bassa     |
| 5   | Fix silent catch              | `TableRenderer.ts:327`                                   | Robustezza     | Media     |
| 6   | Verificare tipo `originalLog` | `types.ts` (TableRow)                                    | Type safety    | Bassa     |
| 7   | Aggiornare CONTEXT.md         | `CONTEXT.md`                                             | Documentazione | Bassa     |

---

## 5. COSA VA BENE

- **Error handling in EmbeddedTableView**: Try/catch con `handleError()` e logging strutturato
- **Validation**: `TableConfig.validateParams()` controlla i parametri prima del render
- **AbortSignal**: Event listener cleanup tramite signal (previene memory leak)
- **Fragment pattern**: DOM costruito in un fragment e appendato in un colpo solo (performance)
- **Protocol badges**: Supporto completo built-in + custom, ben strutturato
- **LogCallouts**: Integrazione corretta per il pulsante "Add Log"
- **Spacer rows**: Aggregazione intelligente per tipo di esercizio (strength/cardio/timed)
