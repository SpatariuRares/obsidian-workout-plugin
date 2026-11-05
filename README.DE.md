<img src="assets/logo.png" width="96" alt="Workout-Planner-Logo">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · Deutsch · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Der All-in-one-Trainingstracker für Obsidian.** Krafttraining, Laufen, Radfahren, Yoga oder Übungen mit eigenen Feldern: Protokolliere vom Handy aus, folge einer geführten Einheit und verfolge deinen Fortschritt in Diagrammen, einem Dashboard und einer Muskel-Heatmap. Eine CSV-Datei, 24 Sprachen.

Für dein Handy gebaut: Protokolliere jeden Satz, jede Strecke oder jede Pose während des Trainings und verfolge deinen Fortschritt danach in Tabellen, Diagrammen und einem Dashboard, direkt in den Notizen, in denen du dein Training planst. Deine Sätze landen in einer einzigen CSV-Datei in deinem Vault. Kein Konto, keine Cloud.

Diagramme zeigen deinen Trend, die Muskel-Heatmap zeigt, was du trainiert hast, und jeder Satz behält seine eigene kg/lb-Einheit. Du kannst deine Sätze mit Dataview abfragen.

![Workout Planner auf einem Handy: eine Trainingssätze-Karte mit zwei abgehakten Sätzen und laufendem Pausen-Timer, das Protokollformular mit +/−-Tasten und kg/lb-Auswahl sowie die Dashboard-Übersicht mit dem Trainingskalender](assets/hero.png)

## Funktionen

- Sätze mit Wiederholungen und Gewicht protokollieren, vorausgefüllt mit deinem letzten Satz, mit +/−-Tasten und zuletzt genutzten Übungen mit einem Tipp
- Jeden Satz in kg oder lb protokollieren, je nachdem, was die Scheiben vor dir sagen
- Sätze mit einem Protokoll markieren: Dropset, Myo-Reps, Rest-Pause, Superset, 21er oder eigene
- Tabellen deiner Sätze, nach Tagen gruppiert mit Tagessummen, mit einem Tipp bearbeitbar
- Die heutigen Sätze als Zeilen zum Ausfüllen auf dem Handy: abhaken, um einen Satz zu protokollieren, und der Pausen-Timer startet (Beta)
- Diagramme für Gewicht, Volumen, Wiederholungen, Dauer, Strecke, Tempo und Herzfrequenz sowie ein Trend, der dir klar sagt, ob du dich verbesserst
- Ein Dashboard mit wöchentlicher Serie (mit Wochenziel), Trainingskalender, persönlichen Rekorden, Gesamtvolumen, letzten Trainings und Protokollstatistiken
- Eine Muskel-Heatmap, vorne und hinten, nach Volumen, Sätzen oder Wiederholungen
- Pausen-Timer (Countdown, Intervall, Stoppuhr) mit Voreinstellungen, die bei jedem protokollierten Satz neu starten und auf iOS und Android piepen
- Eine geführte Einheit, die die Trainingsnotiz Übung für Übung durchgeht
- Eine Schätzung, wie lange ein geplantes Training dauert
- Kraft-, Körpergewichts-, Zeit-, Strecken- und Ausdauerübungen oder eigene Felder
- Jeder Satz in einer einfachen CSV-Datei, lesbar aus Dataview und Templater
- Für Handys gebaut: kein seitliches Scrollen, Schaltflächen immer in Reichweite
- In 24 Sprachen verfügbar

## Erste Schritte

Beim ersten Installieren des Plugins legt es Beispielnotizen an (Beispielübungen, zwei Trainings mit sechs Wochen Protokollen, ein Dashboard und eine Funktionsübersicht), verweist das Plugin darauf und öffnet die Anleitung **Erste Schritte**: eine kurze Seite pro Funktion, mit funktionierenden Beispielen zum Ausprobieren. Du musst die Einstellungen nicht öffnen. Schau dich in Ruhe um, bevor du deine eigenen einrichtest.

### Die geführte Tour

Die Tour öffnet eine Notiz „Geführte Tour“ mit einer Tabelle, einem Diagramm, einem Dashboard und einem Timer und zeigt nacheinander auf jedes davon. Sie hat neun kurze Schritte:

1. Protokolliere deinen ersten Satz mit der **+**-Schaltfläche. Der Schritt endet, wenn du ihn speicherst.
2. Bearbeite oder lösche einen Satz mit den Schaltflächen in jeder Zeile.
3. Sieh deinen Fortschritt im Diagramm.
4. Sieh Summen und Trends im Dashboard.
5. Sieh, welche Muskeln du in der Muskel-Heatmap trainiert hast.
6. Starte den Pausen-Timer. Der Schritt endet, wenn du **Timer starten** drückst.
7. Suche das Hantel-Symbol in der Leiste, das das Protokollformular aus jeder Notiz öffnet. Auf dem Handy verwendest du stattdessen die Befehlspalette.
8. Führe über die Befehlspalette einen beliebigen der Befehle **Trainingsdiagramm einfügen**, **Trainingstabelle einfügen**, **Trainings-Timer einfügen**, **Trainings-Dashboard einfügen** oder **Trainingsdauer einfügen** aus. Der Schritt endet, wenn du das tust.
9. Fertig.

Nutze **Zurück** und **Weiter**, um dich zu bewegen, oder **Überspringen**, um die Tour zu verlassen. Liegt der Teil der Notiz, auf den die Tour zeigt, außerhalb des Sichtbereichs, scrollt **Zeige mir** dorthin. Drücke jederzeit `Esc`, um die Tour zu beenden. Die Tour endet auch, wenn du ihre Notiz schließt oder zu einer anderen Datei wechselst. Nichts geht verloren: Deine Sätze bleiben im Protokoll.

Wenn die Beispieldaten verwendet werden, läuft die Tour mit ihnen. Andernfalls läuft sie mit deinem eigenen Protokoll, sodass Diagramm und Dashboard anfangs fast leer sind. Die Notiz wird einmal angelegt, neben den Beispielen oder oben in deinem Vault. Eine bestehende Notiz wird nie überschrieben, und du kannst sie bearbeiten oder löschen. Gibt es bereits eine Notiz „Geführte Tour“, die nicht die der Tour ist, verwendet die Tour stattdessen „Geführte Tour 1“ (oder die nächste freie Nummer).

Möchtest du die Tour noch einmal machen? Wähle **Tour starten** unter **Einstellungen → Workout Planner → Erste Schritte** oder führe **Tour starten** aus der Befehlspalette aus.

Möchtest du die Beispiele oder die Anleitung noch einmal? Wähle **Beispiele erstellen** oder **Anleitung für den Einstieg öffnen** unter **Einstellungen → Workout Planner → Erste Schritte** oder führe **Beispielnotizen erstellen** bzw. **Anleitung für den Einstieg öffnen** aus der Befehlspalette aus (`Ctrl/Cmd + P`). Das Erstellen der Beispiele überschreibt nichts: Beim erneuten Ausführen werden nur fehlende Beispieldateien ergänzt, und Dateien, die du geändert hast, bleiben, wie sie sind. Die Anleitung bietet an, die Beispiele zu erstellen, falls es sie noch nicht gibt. Eine leere Tabelle, ein leeres Diagramm oder Dashboard hat außerdem einen Link **Oder erkunde es mit Beispieldaten**. Hast du bereits ein Trainingsprotokoll, bekommen die Beispiele eine eigene Protokolldatei, und deine bleibt unberührt.

Um eine Tabelle zu einer beliebigen Notiz hinzuzufügen, zum Beispiel `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Tippe unter der Tabelle auf **+**, gib Wiederholungen und Gewicht ein und speichere. Die Tabelle aktualisiert sich von selbst. Du musst Blöcke auch nicht von Hand schreiben: Die Befehle **Trainingsdiagramm einfügen**, **Trainingstabelle einfügen**, **Trainings-Timer einfügen**, **Trainings-Dashboard einfügen** und **Trainingsdauer einfügen** öffnen ein Formular und fügen den Block für dich ein.

## Sätze erfassen

Öffne das Protokollformular mit der **+**-Schaltfläche unter einer Tabelle (die Übung ist dann schon ausgefüllt), dem Hantel-Symbol in der Leiste oder dem Befehl **Trainingsprotokoll erstellen**. Das Formular startet mit deinem letzten Satz, daher tippst du meistens einmal auf **+/−** und speicherst. Sei fertig, bevor deine Pause vorbei ist.

Das Formular fragt nach den Feldern, die zur Übung passen: Wiederholungen und Gewicht für eine Kniebeuge, Sekunden für einen Plank, Strecke und Zeit für einen Lauf (siehe [Übungstypen](#übungstypen)). Jeder Satz kann außerdem eine Notiz und ein Protokoll tragen, das in der Tabelle als Badge erscheint.

Das Gewichtsfeld hat eine kg/lb-Auswahl, sodass du 225 lb protokollieren kannst, auch wenn deine Einstellung kg ist. Die Tabelle zeigt diesen Satz als „225 lb“; Diagramme, Statistiken und Volumen rechnen jeden Satz in deine Einstellung um.

Wenn du einen Satz aus einer Notiz protokollierst, wird der Name der Notiz als **Training** des Satzes gespeichert, damit eine Tabelle oder ein Diagramm mit `workout: Push Day` ihn später findet.

## Tabellen

Ein `workout-log`-Block zeigt die Sätze einer Übung oder eines Trainings, neueste zuerst. Sätze desselben Tages werden unter einer Zeile mit den Tagessummen gruppiert, und jede Zeile hat eine Bearbeiten-Schaltfläche; einen Satz löschst du im Bearbeitungsformular. Auf dem Handy wird jeder Satz zu einer kompakten Zeile ohne seitliches Scrollen.

<img src="assets/tables.png" width="720" alt="Eine workout-log-Tabelle auf dem Handy, Sätze nach Tagen gruppiert mit Zeit und einem Dropset-Badge, und das Protokollformular, das die +-Schaltfläche öffnet">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Mit `targetWeight` und `targetReps` erscheint über der Tabelle ein Ziel für progressive Überlast.

<details>
<summary>Alle Parameter</summary>

| Parameter                    | Standard | Funktion                                             |
| ---------------------------- | -------- | ---------------------------------------------------- |
| `exercise`                   | —        | Nur diese Übung                                      |
| `workout`                    | —        | Nur dieses Training (Notizname)                      |
| `exactMatch`                 | `false`  | Übungsnamen exakt abgleichen                         |
| `dateRange`                  | alle     | Heute und die vorherigen N Tage                      |
| `limit`                      | `50`     | Maximale Zeilen; mit `sets` `sets × 2` (zwei Trainings) |
| `sortBy`                     | `date`   | `date`, `exercise`, `weight`, `reps` oder `volume`   |
| `sortOrder`                  | `desc`   | `asc` oder `desc`                                    |
| `columns`                    | alle     | Anzuzeigende Spalten, z. B. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`   | Die Spalte mit dem Protokoll-Badge anzeigen          |
| `showAddButton`              | `true`   | Die **+**-Schaltfläche anzeigen                      |
| `targetWeight`, `targetReps` | —        | Ziel für progressive Überlast über der Tabelle anzeigen |
| `sets`                       | —        | Geplante Sätze, gezählt von einem `workout-session`-Block |

Übungsnamen werden standardmäßig ungefähr abgeglichen („squat“ findet „Squat (high bar)“). Mit `exactMatch: true` gilt nur genau dieser Name.

</details>

## Sätze auf dem Handy (Beta)

Ein `workout-sets`-Block ist zum Protokollieren im Fitnessstudio gemacht: die heutigen Sätze einer Übung als Zeilen zum Ausfüllen. Jede Zeile zeigt, was du beim letzten Mal im selben Satz gemacht hast, sodass du nur tippst, was sich geändert hat (ein leeres Feld protokolliert diesen Wert), und die Zeile abhakst. Der Satz landet im Protokoll, die Zeile wird zu einem protokollierten Satz, und der Pausen-Timer oben startet von selbst. Über den Pfeil eines protokollierten Satzes änderst du sein Protokoll und seine Notizen; abhaken nimmt ihn wieder zurück, mit **Rückgängig** für ein paar Sekunden.

<img src="assets/sets.png" alt="Eine Trainingssätze-Karte auf dem Handy: vier ausgefüllte Zeilen mit den Werten vom letzten Mal, danach zwei abgehakte Sätze mit laufendem Pausen-Timer und eine geöffnete Zeile, in der das Rest-Pause-Protokoll gewählt und eine Notiz hinzugefügt wird">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

Der Block ist eine Beta-Funktion: Aktiviere **Trainingssätze** unter **Einstellungen → Beta-Funktionen** (bei neuen Installationen ist sie eingeschaltet). Danach fügt **Trainingssätze einfügen** aus der Befehlspalette einen Block für dich ein, und das ⋮-Menü bearbeitet ihn oder seinen Pausen-Timer.

<details>
<summary>Alle Parameter</summary>

| Parameter                    | Standard       | Funktion                                                                                         |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —              | Die Übung (exakter Name)                                                                         |
| `workout`                    | der Notizname  | Das Training, unter dem die Sätze protokolliert werden                                           |
| `sets`                       | wie beim letzten Mal | Zeilen zum Ausfüllen (mindestens eine); **Satz hinzufügen** fügt weitere hinzu            |
| `targetWeight`, `targetReps` | —              | Hinweise, wenn die Übung noch nie gemacht wurde, und ein Ziel für progressive Überlast           |
| `rest`                       | —              | Sekunden Pause nach jedem Satz; `0` für keinen Timer. Ohne Angabe: der `workout-timer` desselben Abschnitts |
| `timer.*`                    | —              | Die übrigen Optionen des Pausen-Timers: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Diagramme und Trends

Ein `workout-chart`-Block zeichnet eine Größe über die Zeit: Gewicht, Volumen, Wiederholungen, geschätzte 1RM, Dauer, Strecke, Tempo oder Herzfrequenz. Die Kopfzeile zeigt, ob der Trend **Steigend**, **Stabil** oder **Abnehmend** ist. Stabil heißt, dass sich die Trendlinie über den gesamten Zeitraum um weniger als 5 % des Durchschnitts bewegt. So zählt auch ein langsamer, stetiger Zuwachs als steigend. Beim Tempo ist niedriger besser, und eine fallende Linie gilt als Verbesserung. Auf dem Handy wird das Diagramm zu einer Tabelle mit denselben Werten.

Verwende `type: e1rm` für das beste tägliche geschätzte Maximum für eine Wiederholung (1RM) nach Epley: `weight × (1 + reps / 30)`. Gezählt werden nur positive Gewichte mit ganzzahligen Wiederholungen von 1 bis 12; Aufwärm- und Dropsätze sind ausgenommen. Tage ohne geeignete Sätze werden weggelassen. Schätzungen folgen deiner kg/lb-Einstellung. Das Standard-Kraftdiagramm bleibt das Volumen.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

Die API ergänzt `getExerciseStats` um `estimatedOneRepMax`: die beste Schätzung in der eingestellten Gewichtseinheit oder `null`, wenn es keinen geeigneten Satz gibt. Bestehende PR-Felder und CSV-Spalten bleiben unverändert.

![Diagramm der geschätzten 1RM beim Bankdrücken mit steigender Trendlinie auf dem Desktop und dieselben Werte als Tabelle auf dem Handy](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Alle Parameter</summary>

| Parameter       | Standard       | Funktion                                                                  |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Nur diese Übung                                                           |
| `workout`       | —              | Nur dieses Training                                                       |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` oder `heartRate` |
| `chartType`     | `exercise`     | Wie der Punkt jedes Tages entsteht (unten)                                |
| `dateRange`     | `30`           | Einzubeziehende Tage                                                      |
| `limit`         | —              | Nur die letzten N Punkte                                                  |
| `showTrendLine` | `false`        | Eine Trendlinie zeichnen                                                  |
| `showStats`     | `true`         | Durchschnitt, Bestwert und niedrigsten Wert unter dem Diagramm anzeigen   |
| `title`         | `Trend <type>` | Diagrammtitel                                                             |
| `height`        | 4:3            | `300` (Pixel) oder eine beliebige CSS-Länge wie `50vh`                    |
| `exactMatch`    | `false`        | Übungsnamen exakt abgleichen                                              |

| `chartType` | Genutzte Sätze                      | Punkt je Tag |
| ----------- | ----------------------------------- | ------------ |
| `exercise`  | Sätze von `exercise`                | Durchschnitt |
| `workout`   | Sätze von `workout`                 | Summe        |
| `combined`  | Sätze von `exercise` innerhalb von `workout` | Summe |
| `all`       | jeder Satz (Filter ignoriert)       | Summe        |

</details>

## Dashboard und Muskel-Heatmap

Ein `workout-dashboard`-Block beginnt mit vier Kennzahlen: Gesamt-Trainings, wöchentliche Serie, Gesamtvolumen und persönliche Rekorde. Darunter folgen Schnelle Statistiken für Woche, Monat und Jahr, ein Volumentrend, deine letzten Trainings, Protokollstatistiken, geplante gegenüber tatsächlicher Trainingsdauer und ein Trainingskalender: ein Jahr mit Trainingstagen, nach Volumen schattiert, mit deiner aktuellen und besten Serie. Eine Woche zählt zur Serie, sobald sie die Trainingstage deines Wochenziels hat (Einstellungen → Wochenziel, standardmäßig 1). Auf dem Handy kommen die Schnellaktionen zuerst, und die Übersicht ist ein 2 × 2-Raster.

<img src="assets/dashboard.png" width="720" alt="Das Dashboard auf dem Handy: Übersicht, Trainingskalender mit erreichtem Wochenziel, letzte Trainings und Schnelle Statistiken">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Um die Widgets und ihre Reihenfolge ohne YAML zu wählen, füge das Dashboard mit dem Befehl **Trainings-Dashboard einfügen** ein, oder öffne das ⋮-Menü oben rechts an einem eingefügten Dashboard und wähle **Dashboard bearbeiten**.

Stelle im Fenster **Layout** auf **Raster**, um jedes Widget selbst zu platzieren, wie Gegenstände in einem Inventar: Ziehe ein Widget, um es zu verschieben, ziehe an seiner Ecke, um es breiter oder höher zu machen, und lass es unter dem Raster fallen, um es zu entfernen. Die Tastatur funktioniert auch: Pfeiltasten verschieben, Umschalt mit Pfeiltasten verändert die Größe, und Entf nimmt ein Widget heraus. Das Raster hat so viele Spalten, wie in die Breite deiner Notiz passen. In einem schmaleren Fenster werden die Widgets in Leserichtung neu angeordnet, auf dem Handy untereinander gestapelt. Dein Layout bleibt erhalten: Passt die Notiz nur in eine Spalte (ein Handy), fragt das Fenster, wie viele Spalten du bearbeiten möchtest, und beginnt bei den gespeicherten. Der Block behält eine Zeile pro Widget (Spalte, Zeile, Breite, Höhe):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Die Heatmap zeigt, welche Muskeln du in der letzten Woche, im letzten Monat oder im letzten Jahr trainiert hast, vorne und hinten, nach **Volumen**, **Sätzen** oder **Wiederholungen**. Sie ist der schnellste Weg, um zu merken, dass du drei Wochen lang die Beine ausgelassen hast. Darunter warnt dich eine kurze Trainingsanalyse vor Ungleichgewichten, etwa wenn die Vorderseite deutlich mehr arbeitet als die Rückseite. Sie liest die Muskel-Tags deiner [Übungsseiten](#übungstypen). Körpergewichts- und Zeitübungen haben kein Gewicht und leuchten deshalb nur unter Sätzen und Wiederholungen auf.

<img src="assets/heatmap.png" width="720" alt="Muskel-Heatmap der Woche auf dem Handy, vorne und hinten: Quadrizeps, Gesäß und Beinbeuger trainiert, darunter die Trainingsanalyse">

<details>
<summary>Alle Parameter</summary>

| Parameter             | Standard | Funktion                                                                                                                                                                                                    |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —        | Überschrift über dem Dashboard                                                                                                                                                                              |
| `dateRange`           | alle     | Nur Sätze aus den letzten N Tagen                                                                                                                                                                           |
| `widgets`             | alle     | Die anzuzeigenden Widgets in dieser Reihenfolge: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`   | `grid` platziert jedes Widget in seinen Zellen (siehe oben)                                                                                                                                                 |
| `columns`             | —        | Raster: die Spalten, für die das Raster gemacht wurde                                                                                                                                                       |
| `grid.<widget>`       | —        | Raster: Spalte, Zeile, Breite und Höhe dieses Widgets                                                                                                                                                       |
| `recentWorkoutsLimit` | `5`      | Trainings in der Liste „Letzte Trainings“                                                                                                                                                                   |
| `volumeTrendDays`     | `30`     | Tage im Volumentrenddiagramm                                                                                                                                                                                |

</details>

<details>
<summary>Muskel-Tags</summary>

Tags können eine Liste sein, ein einzelnes Wort (`tags: chest`) oder eine durch Kommas getrennte Zeile (`tags: chest, triceps`).

Grobe Gruppen: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Einzelne Muskeln haben einen eigenen Bereich des Körpers und zählen zu ihrer Gruppe. Ein grober Tag verteilt sich über den ganzen Bereich: `chest` lässt alle drei Teile der Brust ein wenig aufleuchten, `upper_chest` nur den oberen ganz.

| Gruppe      | Einzelne Muskeln                            |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (oder `ql`) |
| `core`      | `obliques`, `serratus`                      |

Tags in deiner eigenen Sprache, etwa `petto` oder `schiena`, funktionieren auch. Das Plugin ordnet sie den Gruppen oben anhand von `muscle-tags.csv` zu, das neben deinem Protokoll liegt. Bearbeite die Datei mit **Muskel-Tags verwalten** (hinzufügen, umbenennen, suchen, Doppelte finden) oder von Hand:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Ein Tag, der schon ein Gruppenname ist (`upper_chest`, `Upper chest`, `upper-chest`), funktioniert immer, auch wenn `muscle-tags.csv` ihn nicht aufführt.

</details>

## Timer

Ein `workout-timer`-Block ist ein Countdown-, Intervall- oder Stoppuhr-Timer. Speichere deine üblichen Pausenzeiten als Voreinstellungen. Verknüpfst du einen Timer mit einer Übung oder einem Training, startet er jedes Mal neu, wenn du einen Satz protokollierst, sodass du zwischen den Sätzen nichts anfassen musst. Mit `autoStart: true` startet er, sobald die Notiz geöffnet wird.

<img src="assets/timers.png" width="320" alt="Zwei Timer auf dem Handy: ein Intervall-Timer in seiner Pause und ein Tabata-Preset in der Arbeitsphase von Runde 2">

Er piept auch auf iOS und Android. Handys erlauben Ton erst, nachdem du die Seite berührt hast. Ein per `autoStart` gestarteter Timer bleibt daher stumm, bis du einmal auf **Timer starten** tippst.

Unter **Einstellungen → Workout Planner → Hinweise für Timer-Geräte** ist **Bildschirm aktiv halten, während ein Timer läuft** standardmäßig eingeschaltet. Dabei wird der Bildschirm wachgehalten, solange mindestens ein Timer im Vordergrund läuft, sofern das Gerät es erlaubt. **Vibration, wenn ein Timer abgelaufen ist** ist standardmäßig aus und ergänzt bei null einen kurzen Impuls, unabhängig vom Ton, auf unterstützten Geräten wie Android. iOS behält den bestehenden Tonhinweis bei, Web-Vibration ist dort nicht verfügbar. Diese Funktionen nutzen Browser-APIs nach bestem Bemühen und wurden noch nicht auf echten Android- und iOS-Geräten geprüft. Sie sind keine Hintergrundwecker. Ein Timer mit einer `id` läuft weiter, wenn du die Notiz wechselst. Pausiere ihn oder lass ihn ablaufen, um den Bildschirmschutz freizugeben.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Ein Intervall-Timer kann zwischen Arbeit und Pause wechseln. Die Anzeige zeigt **Arbeit** oder **Pause**, und jede Phase startet mit ihrem eigenen Ton. Jede Runde besteht aus ihrer Arbeit, gefolgt von ihrer Pause, auch die letzte. Dieses Tabata dauert daher 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s Arbeit, 10 s Pause, 8 Runden) und `preset: EMOM` (eine Runde jede Minute für 10 Minuten) sind eingebaut. Eine gespeicherte Voreinstellung mit demselben Namen ersetzt sie.

<details>
<summary>Alle Parameter</summary>

| Parameter             | Standard    | Funktion                                                              |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` oder `stopwatch`                              |
| `duration`            | `30`        | Sekunden (Countdown; bei Intervall die Arbeit jeder Runde)            |
| `work`                | —           | Intervall: Sekunden Arbeit pro Runde (ersetzt `duration`)             |
| `rest`                | `0`         | Intervall: Sekunden Pause nach der Arbeit jeder Runde                 |
| `rounds`              | `1`         | Runden (Intervall)                                                    |
| `sound`               | `true`      | Piepen, wenn die Zeit abgelaufen ist                                  |
| `autoStart`           | `false`     | Start, sobald die Notiz geöffnet wird                                 |
| `showControls`        | `true`      | Start, Pause und Zurücksetzen anzeigen                                |
| `preset`              | —           | Mit einer Voreinstellung starten (gespeichert, `Tabata` oder `EMOM`); Parameter überschreiben sie |
| `exercise`, `workout` | —           | Timer neu starten, wenn du einen Satz für diese Übung oder dieses Training protokollierst |
| `superset`            | `false`     | Nur Canvas-Export: diese Übung und die nächste als Superset zeichnen  |

</details>

## Geführte Einheit

Ein `workout-session`-Block oben in einer Trainingsnotiz (Befehl **Geführte Einheit einfügen**) führt dich Übung für Übung durch das Training: welchen Satz du gerade machst, das Ziel, was du beim letzten Mal gemacht hast, eine Schaltfläche **Satz erfassen** und den Pausen-Timer, der startet, wenn du einen Satz protokollierst.

![Eine geführte Einheit auf dem Handy: Satz 3 von 4 der Kniebeuge mit laufender Pause in Einheit und Satzkarte, das mit Satz erfassen geöffnete Protokollformular und danach die nächste Übung mit laufendem Pausen-Timer](assets/session.png)

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

Der Plan ist die Notiz selbst: Jeder `workout-log`- oder `workout-sets`-Block mit einer `exercise` ist ein Schritt, in der Reihenfolge, in der sie erscheinen, mit seinen `sets`, `targetReps` und `targetWeight`. Die Pause kommt aus der `rest` des `workout-sets`-Blocks, sonst vom `workout-timer` im selben `##`-Abschnitt (ohne einen gilt die Standard-Voreinstellung). Einheit und Satzkarte teilen sich einen Countdown. Die Einheit zählt die heute in diesem Training protokollierten Sätze, sodass sie dort weitermacht, wo du aufgehört hast, wenn du die Notiz erneut öffnest. Eine Übung ohne `sets` bleibt aktuell, bis du einen Satz einer späteren Übung protokollierst. **Zurück** und **Weiter** bewegen dich frei.

## Trainingsdauer

Ein `workout-duration`-Block schätzt, wie lange eine Trainingsnotiz dauert: die Pausen aus ihren Timern plus die Zeit für jeden Satz, neben der Dauer deiner letzten echten Einheit.

<img src="assets/duration.png" width="420" alt="Karte mit der geschätzten Dauer: Pausenzeit, Satzzeit und die letzte Einheit">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` kann ein Pfad im Vault, ein Pfad relativ zu dieser Notiz oder nur der Name der Notiz sein. Lässt du es weg, wird die aktuelle Notiz geschätzt. Sekunden pro Wiederholung und pro Satz kommen aus den [Einstellungen](#einstellungen).

## Übungstypen

Eine Übungsseite ist eine Notiz in deinem Übungsordner. Ihr Frontmatter legt fest, wonach das Protokollformular fragt und welche Muskeln die Übung trainiert. **Übungsseite erstellen** legt eine für dich an.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Das Protokollformular fragt nach             | Außerdem akzeptiert                                          |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (Standard) | Wiederholungen, Gewicht                     | `bodyweight`, `weights`                                      |
| `timed`              | Dauer                                        | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | Strecke, Dauer (optional)                    | `running`, `run`                                             |
| `cardio`             | Dauer, Strecke und Herzfrequenz (optional)   | —                                                            |
| `custom`             | nur die Felder, die du unter `parameters` aufführst | —                                                     |

Yoga funktioniert genauso: Jede Pose ist eine `timed`-Übung, sodass das Formular nur fragt, wie lange du sie gehalten hast. Die Beispielnotizen enthalten einen Morgen-Yoga-Ablauf mit geführter Einheit.

![Ein Yoga-Ablauf auf dem Handy: die geführte Einheit bei Herabschauender Hund, das Protokollformular, das nur nach der Haltedauer fragt, und die Satzkarte mit dem ersten protokollierten Halten](assets/yoga.png)

`type:` funktioniert wie `exercise_type:`. Füge eigene Felder unter `parameters` hinzu, zum Beispiel Runden fürs Seilspringen:

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

Wenn du den Typ einer Übung nach dem Protokollieren änderst, verschiebt **Übung umwandeln** die bestehenden Sätze und lässt dich wählen, welches alte Feld wohin kommt.

## Deine Daten

Jeder Satz ist eine Zeile in `workout_logs.csv`. So kannst du sie in einer Tabellenkalkulation öffnen, sichern oder wie jede andere Datei synchronisieren.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Spalten und manuelle Bearbeitung</summary>

| Spalte                     | Bedeutung                                  |
| -------------------------- | ------------------------------------------ |
| `date`                     | Wann der Satz protokolliert wurde (ISO 8601) |
| `exercise`, `workout`      | Name der Übung und des Trainings           |
| `reps`, `weight`, `volume` | Volumen ist Wiederholungen × Gewicht       |
| `origine`                  | Link zur Notiz, aus der protokolliert wurde |
| `timestamp`                | Eindeutige ID der Zeile (Millisekunden)    |
| `notes`, `protocol`        | Freitext und Trainingstechnik              |

Übungstypen mit eigenen Feldern (`duration`, `distance`, `heartRate` oder deine `parameters`) fügen Spalten am Ende hinzu. Die letzte Spalte, `weightUnit`, ist `kg` oder `lb`: die Einheit von `weight` und `volume` dieser Zeile. Ein leerer Wert bedeutet die Einheit aus den Einstellungen.

Wenn du die Datei von Hand bearbeitest, behalte die Kopfzeile bei und setze jeden Wert, der ein Komma, ein Anführungszeichen oder einen Zeilenumbruch enthält, in doppelte Anführungszeichen. Notizen, die mit `=`, `+`, `-` oder `@` beginnen, werden mit einem vorangestellten `'` gespeichert, damit Tabellenkalkulationen sie nicht als Formeln ausführen. Das Plugin blendet es wieder aus.

</details>

Alles bleibt in deinem Vault. Das Plugin schreibt nur dann in die Zwischenablage, wenn du auf ein Kopier-Badge klickst (ein Muskel-Tag im Dashboard), und liest sie nie.

### Dataview und Templater

Das Plugin stellt `WorkoutPlannerAPI` bereit (auch als `window.WorkoutPlannerAPI`), sobald es geladen ist.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>API-Referenz und weitere Beispiele</summary>

| Methode                      | Liefert                                                                                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Sätze, jeweils mit `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` und `volume` sind in der Einstellungseinheit; `enteredWeight` und `enteredUnit` sind das, was protokolliert wurde |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Übungsnamen, sortiert: die Dateinamen deiner Übungsseiten (inklusive Unterordner) oder die Namen in deinem Protokoll, wenn du keine Übungsseiten hast. `{ tag: "chest" }` behält die Übungen, deren Seite diesen Tag hat. Ohne Übungsseiten ist das Ergebnis daher leer. |

`getWorkoutLogs` akzeptiert `exercise` (teilweise, ohne Beachtung der Groß-/Kleinschreibung), `workout`, `dateRange: { start, end }`, `protocol` und `exactMatch`.

Letzte Kniebeugen, in Dataview:

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

In einer [Templater](https://github.com/SilentVoid13/Templater)-Vorlage, um eine Notiz mit deinen neuesten Werten zu beginnen:

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

## Einstellungen

Lege die CSV- und Übungsordner fest, die Standard-Gewichtseinheit, die Gewichtsschrittweite der **+/−**-Tasten, Timer-Voreinstellungen, eigene Protokolle (Name, Kurzbezeichnung und Farbe) sowie die Sekunden pro Wiederholung und pro Satz für die Dauerschätzung. **Alle durchführen** unter **Erweitert** führt nach einem Update jede Wartungsaufgabe aus.

Eine Änderung der Gewichtseinheit beschriftet alte Sätze nicht um: Jeder Satz behält die Einheit, in der er protokolliert wurde.

<details>
<summary>Alle Befehle</summary>

Öffne die Befehlspalette (`Ctrl/Cmd + P`) und gib den Namen ein.

| Befehl                                                      | Was er macht                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Trainingsprotokoll erstellen                                | Einen Satz protokollieren                                          |
| Tour starten                                                | Die geführte Tour machen                                           |
| Beispielnotizen erstellen                                   | Beispielübungen, Trainings, Protokolle und ein Dashboard hinzufügen |
| Anleitung für den Einstieg öffnen                           | Die Anleitung in den Beispielen öffnen                             |
| Trainingsdiagramm / Trainingstabelle / Trainings-Timer / Trainings-Dashboard / Trainingsdauer einfügen | Einen Block über ein Formular einfügen |
| Übungsseite erstellen                                       | Neue Übungsseite mit Typ und Tags                                  |
| Übungsabschnitt erstellen                                   | Eine Überschrift, einen Timer und eine Tabelle für eine Übung zur aktuellen Notiz hinzufügen |
| Übungsblock hinzufügen                                      | Einen Übungsblock mit Namensvorschlägen einfügen                   |
| Übung umwandeln                                             | Die Sätze einer Übung in einen anderen Übungstyp verschieben       |
| Muskel-Tags verwalten                                       | `muscle-tags.csv` bearbeiten                                       |
| Tag-Referenz erstellen                                      | Eine Notiz mit allen Muskel-Tags erstellen                         |
| Übungsnamen prüfen                                          | Dieselbe Übung unter verschiedenen Schreibweisen finden            |
| Training als Canvas exportieren                             | Das aktuelle Training auf einer Obsidian-Canvas anordnen           |
| CSV-Protokolldatei erstellen                                | Ein leeres Protokoll erstellen                                     |
| Import von Strong oder Hevy                                 | Die Sätze einer Strong- oder Hevy-CSV-Datei zum Protokoll hinzufügen |
| Übungstypen migrieren, Fehlende IDs zu Codeblöcken hinzufügen | Wartung nach dem Update von älteren Versionen                    |

</details>

## Fehlerbehebung

- **Konflikt mit Workout Block (`workout-block`).** Beide Plugins registrieren `workout-log`-Codeblöcke und verwenden `workout_logs.csv` als Standardnamen der Protokolldatei. Deaktiviere eines der beiden Plugins, bevor du das andere verwendest.

- **Eine Tabelle oder ein Diagramm ist leer.** Prüfe den Übungsnamen und `dateRange` (Diagramme zeigen standardmäßig die letzten 30 Tage). Mit `exactMatch: true` muss der Name genau übereinstimmen.
- **Eine Übung fehlt in der Heatmap.** Ihre Seite braucht Muskel-`tags` und muss im Übungsordner liegen. Körpergewichts- und Zeitübungen erscheinen nur unter **Sätze** oder **Wiederholungen**.
- **Das Protokollformular fragt bei einem Plank nach Wiederholungen und Gewicht.** Setze `exercise_type: timed` auf der Übungsseite.
- **Der Timer ist auf meinem Handy stumm.** Tippe einmal auf **Timer starten**. Handys blockieren Ton, bis du die Seite berührst.

## Installation

### Aus den Community-Plugins

1. Öffne **Einstellungen → Community-Plugins**
2. Suche nach **Workout Planner**
3. Wähle **Installieren** und dann **Aktivieren**

### Manuell

1. Lade `main.js`, `manifest.json` und `styles.css` aus der [neuesten Version](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest) herunter
2. Lege den Ordner `your-vault/.obsidian/plugins/workout-planner/` an
3. Kopiere die heruntergeladenen Dateien in diesen Ordner
4. Aktiviere das Plugin unter **Einstellungen → Community-Plugins**

## Unterstützung

Workout Planner ist kostenlos und Open Source. Wenn es dir bei deinem Training hilft, kannst du [mir einen Kaffee spendieren](https://buymeacoffee.com/spatariurares). Einen Fehler gefunden oder etwas vermisst? Eröffne ein [Issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Jede Sprache außer Englisch ist maschinell übersetzt, daher klingen manche Formulierungen womöglich holprig. Wenn dir etwas seltsam vorkommt, sind Korrekturen willkommen.

## Danksagungen

Diagramme nutzen [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner steht unter der [MIT-Lizenz](LICENSE).
