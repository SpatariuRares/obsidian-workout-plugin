# Idee per Nuove Progressioni e Feature Grafiche

Ecco una lista di possibili implementazioni aggiornata, divisa per contesto d'uso.

## Feature per Grafici (Contesto: Esercizio/Workout)

Queste feature sono pensate per monitorare la progressione specifica di una scheda o di un esercizio nel tempo.

### 1. Grafico Stima Massimale (Estimated 1RM)

**Concetto:** Visualizzare l'1RM stimato invece del solo peso o volume.
**Formula:** Epley (`w * (1 + r/30)`) o Brzycki.
**Valore:** Metrica regina per la forza. Permette di vedere se stai diventando più forte anche se cambi range di ripetizioni (es. da 5x5 a 3x10).
**Implementazione:** Nuova opzione `ESTIMATED_1RM` in `CHART_DATA_TYPE`.

### 2. Indicatori Personal Record (PR)

**Concetto:** Evidenziare visivamente (es. un pallino d'oro o una stella) sul grafico i punti in cui è stato battuto un record personale (Volume, Peso o 1RM).
**Valore:** Gratificazione immediata e contestualizzazione dei picchi di performance.
**Implementazione:** Logica in `ChartDataUtils` per identificare i massimi storici e plugin annotation per Chart.js.

### 3. Doppio Asse (Volume vs Intensità)

**Concetto:** Sovrapporre due metriche diverse sullo stesso grafico (es. Linea per il Peso Medio/Massimale e Barre per il Volume Totale).
**Valore:** Fondamentale per la periodizzazione: vedere se all'aumentare del carico (intensità) il volume sta scendendo come previsto, o viceversa.
**Implementazione:** Supporto per datasets multipli con `yAxisID` diversi in `ChartConfigBuilder`.

### 4. Linee di Obiettivo (Target/Goal Lines)

**Concetto:** Linea orizzontale fissa che rappresenta un obiettivo (es. "Voglio arrivare a 100kg").
**Valore:** Motivazionale, visualizza la distanza dall'obiettivo.
**Implementazione:** Input extra nell'`InsertChartModal` e plugin annotation.

### 5. Marker di Deload/Scarico

**Concetto:** Se un workout è taggato come "scarico" o "deload", visualizzarlo in modo diverso (es. punto grigio o bandierina).
**Valore:** Spiega visivamente i cali di performance nel grafico, evitando che sembrino regressioni.
**Implementazione:** Parsing del tag `#deload` (o simile) dai metadati del workout in `WorkoutLogData`.

---

## Widget per Dashboard (Contesto: Panoramica/Macro)

Queste idee sono più adatte a una vista aggregata generale (Dashboard).

### 6. Analisi Distribuzione Muscolare (Radar o Pie Chart)

**Concetto:** Visualizzazione aggregata dei gruppi muscolari allenati (es. "40% Gambe, 30% Petto").
**Valore:** Aiuta a identificare squilibri strutturali nell'allenamento e prevenire infortuni.
**Implementazione:** Utilizzo di `MuscleTagService` per mappare esercizi -> muscoli e visualizzazione con un grafico non temporale.

### 7. Heatmap di Consistenza (Consistency Heatmap)

**Concetto:** Calendario stile GitHub che mostra la frequenza degli allenamenti con celle colorate in base all'intensità/frequenza.
**Valore:** Potente strumento motivazionale per mantenere l'abitudine (habit tracking).
**Implementazione:** Widget che analizza le date dei workout e colora una griglia.

### 8. Confronto Periodi (Period Comparison)

**Concetto:** Sovrapporre i dati del mese corrente con quelli del mese precedente (es. "Ottobre vs Novembre").
**Valore:** Feedback immediato sul trend macroscopico: stai migliorando o peggiorando rispetto al passato recente?
**Implementazione:** Fetch di due dataset distinti e sovrapposizione visiva.

### 9. Aggregazione Settimanale/Mensile (Long Term Trend)

**Concetto:** Raggruppare i dati per settimana o mese invece che per singolo giorno.
**Valore:** Riduce il "rumore" nei grafici per chi si allena frequentemente, mostrando meglio il trend a lungo termine (es. Volume totale mensile).
