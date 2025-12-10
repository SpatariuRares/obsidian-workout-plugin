# Obsidian Workout Plugin - Spiegazione del Progetto

## Panoramica

Questo è un plugin completo per Obsidian progettato per visualizzare i dati di allenamento attraverso grafici interattivi, tabelle e timer. Converte i file di log degli allenamenti (CSV) in visualizzazioni estetiche e fornisce strumenti per tracciare i progressi nel tempo.

## Funzionalità Principali

- **Grafici Interattivi**: Visualizza i dati (Volume, Peso, Ripetizioni) usando Chart.js.
- **Tabelle Dati**: Mostra i log degli allenamenti in tabelle ordinabili.
- **Timer Allenamento**: Timer integrati per gestire i periodi di riposo.
- **Ricerca Avanzata**: Matching intelligente degli esercizi con strategie multiple.
- **Parsing Dati**: Legge automaticamente i file di log da una cartella specificata.
- **Aggiornamenti Real-time**: Rifresca grafici e tabelle per mostrare i dati più recenti.
- **Design Responsivo**: Funziona sia su desktop che su mobile.

## Come Funziona

Il plugin legge i dati da un singolo file CSV presente nel vault. Questo file funge da database centrale per tutte le voci di allenamento, che vengono poi processate per generare le visualizzazioni.

## Installazione e Configurazione

1.  Scaricare l'ultima release.
2.  Estrarre i file in `.obsidian/plugins/workout-planner/`.
3.  Attivare il plugin nelle impostazioni di Obsidian.
4.  Configurare il percorso del file CSV nelle impostazioni (Default: `theGYM/Log/workout_logs.csv`).

## Utilizzo

Il plugin offre diversi comandi tramite la Command Palette (Ctrl/Cmd + P):

- **Create Workout Log**: Per inserire un nuovo allenamento.
- **Insert Workout Chart/Table/Timer**: Per inserire i blocchi di codice nelle note.

### Esempi di Blocchi di Codice

**Grafico:**

````markdown
```workout-chart
exercise: Squat
chartType: Volume
dateRange: 30
showTrendLine: true
```
````

````

**Tabella:**
```markdown
```workout-log
exercise: Bench Press
exactMatch: false
dateRange: 14
````

````

**Timer:**
```markdown
```workout-timer
duration: 90
label: Rest Period
````

```

## Formato Dati (CSV)
Il file CSV deve avere le seguenti colonne:
`date,exercise,reps,weight,volume,origine,workout,timestamp`

*   **date**: Data ISO 8601.
*   **exercise**: Nome esercizio.
*   **reps**: Ripetizioni.
*   **weight**: Peso usato.
*   **volume**: Reps * Weight.
*   **origine**: Link alla scheda/routine.
*   **workout**: Dettagli opzionali.
*   **timestamp**: Identificativo univoco.

## Tecnologie Usate
*   **Chart.js** per i grafici.
*   **Obsidian API**.
```
