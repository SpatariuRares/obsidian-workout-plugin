<img src="assets/logo.png" width="96" alt="Workout Planner-logo">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · Nederlands · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**De alles-in-één trainingstracker voor Obsidian.** Krachttraining, hardlopen, fietsen, yoga of oefeningen met je eigen velden: log vanaf je telefoon, volg een begeleide sessie en bekijk je voortgang in grafieken, een dashboard en een spierheatmap. Eén CSV-bestand, 24 talen.

Gemaakt voor je telefoon: log elke serie, elke run of elke houding terwijl je traint en bekijk daarna je voortgang in tabellen, grafieken en een dashboard, in dezelfde notities waarin je je training plant. Je series gaan naar één CSV-bestand in je kluis. Geen account, geen cloud.

Grafieken laten je trend zien, de spierheatmap laat zien wat je hebt getraind, en elke serie behoudt zijn eigen kg/lb-eenheid. Je kunt je series opvragen vanuit Dataview.

![Workout Planner op een telefoon: een workout-sets-kaart met twee afgevinkte series en de lopende rusttimer, het logformulier met +/−-knoppen en de kg/lb-keuze, en de samenvatting van het dashboard met de trainingskalender](assets/hero.png)

## Functies

- Log series met herhalingen en gewicht, vooraf ingevuld met je laatste serie, met +/−-knoppen en recente oefeningen met één tik
- Log elke serie in kg of lb, wat de schijven voor je ook zeggen
- Markeer series met een protocol: drop set, myo-reps, rest-pause, superset, 21s, of je eigen protocol
- Tabellen met je series, gegroepeerd per dag met dagtotalen, met één tik te bewerken
- De series van vandaag als rijen om op je telefoon in te vullen: tik een serie aan om hem te loggen, en de rusttimer start (bèta)
- Grafieken voor gewicht, volume, herhalingen, duur, afstand, tempo en hartslag, en een trend die duidelijk zegt of je vooruitgaat
- Een dashboard met wekelijkse reeks (met een wekelijks doel), een trainingskalender, persoonlijke records, totaal volume, recente trainingen en protocolstatistieken
- Een spierheatmap, voor- en achterkant, op volume, series of herhalingen
- Rusttimers (aftel-, interval- en stopwatch) met voorinstellingen, die opnieuw starten wanneer je een serie logt en piepen op iOS en Android
- Een begeleide sessie die de trainingsnotitie oefening voor oefening doorloopt
- Een schatting van hoe lang een geplande training duurt
- Kracht-, lichaamsgewicht-, getimede, afstands- en cardio-oefeningen, of je eigen velden
- Elke serie in één gewoon CSV-bestand, leesbaar vanuit Dataview en Templater
- Gemaakt voor telefoons: geen zijwaarts scrollen, knoppen altijd binnen bereik
- Beschikbaar in 24 talen

## Beginnen

De eerste keer dat je de plugin installeert, voegt hij voorbeeldnotities toe (voorbeeldoefeningen, twee trainingen met zes weken aan logs, een dashboard en een functieoverzicht), wijst de plugin naar die notities en opent de handleiding **Beginnen**: per functie een korte pagina, met werkende voorbeelden om uit te proberen. Je hoeft de instellingen niet te openen. Kijk eerst rond voordat je je eigen training instelt.

### De begeleide rondleiding

De rondleiding opent een notitie "Begeleide rondleiding" met een tabel, een grafiek, een dashboard en een timer, en wijst om de beurt naar elk daarvan. Er zijn negen korte stappen:

1. Log je eerste serie met de knop **+**. De stap is klaar zodra je hem opslaat.
2. Bewerk of verwijder een serie met de knoppen op elke rij.
3. Bekijk je voortgang in de grafiek.
4. Bekijk totalen en trends in het dashboard.
5. Bekijk in de spierheatmap welke spieren je hebt getraind.
6. Start de rusttimer. De stap is klaar zodra je op start drukt.
7. Zoek het halterpictogram in het lint; dat opent het logformulier vanuit elke notitie. Op een telefoon gebruik je in plaats daarvan het opdrachtenpalet.
8. Voer een willekeurige opdracht **Trainingsgrafiek / tabel / timer / dashboard / duur invoegen** uit via het opdrachtenpalet. De stap is klaar zodra je dat doet.
9. Klaar.

Gebruik **Terug** en **Volgende** om te bewegen, of **Overslaan** om te stoppen. Als het deel van de notitie waar de rondleiding naar wijst buiten beeld is, scrolt **Laat me zien** ernaartoe. Druk op `Esc` om de rondleiding op elk moment te beëindigen. De rondleiding stopt ook als je de notitie sluit of naar een ander bestand gaat. Er gaat niets verloren: je series blijven in het log.

Wanneer de voorbeeldgegevens in gebruik zijn, loopt de rondleiding daarop. Anders loopt hij op je eigen log, dus starten de grafiek en het dashboard bijna leeg. De notitie wordt één keer aangemaakt, naast de voorbeelden of bovenaan je kluis. Een bestaande notitie wordt nooit overschreven, en je kunt hem bewerken of verwijderen. Als er al een notitie "Begeleide rondleiding" bestaat die niet van de rondleiding is, gebruikt de rondleiding "Begeleide rondleiding 1" (of het eerstvolgende vrije nummer).

Wil je de rondleiding opnieuw doen? Selecteer **Begin de tour** onder **Instellingen → Workout Planner → Beginnen**, of voer **Begin de tour** uit via het opdrachtenpalet.

Wil je de voorbeelden of de handleiding opnieuw? Selecteer **Voorbeelden maken** of **Open handleiding** onder **Instellingen → Workout Planner → Beginnen**, of voer **Voorbeeldnotities maken** of **Open handleiding** uit via het opdrachtenpalet (`Ctrl/Cmd + P`). Het maken van de voorbeelden overschrijft nooit iets: opnieuw uitvoeren voegt alleen de ontbrekende voorbeeldbestanden toe, en bestanden die je hebt gewijzigd blijven zoals ze zijn. De handleiding biedt aan de voorbeelden te maken als die nog niet bestaan. Een lege tabel, grafiek of lege dashboard heeft ook een link **Of verken met voorbeeldgegevens**. Als je al een trainingslog hebt, krijgen de voorbeelden hun eigen logbestand en blijft het jouwe onaangeroerd.

Om een tabel aan een notitie toe te voegen, bijvoorbeeld `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Tik op **+** onder de tabel, vul herhalingen en gewicht in en sla op. De tabel werkt zichzelf bij. Je hoeft blokken ook niet met de hand te schrijven: de opdrachten **Trainingsgrafiek / tabel / timer / dashboard / duur invoegen** openen een formulier en voegen het blok voor je in.

## Series loggen

Open het logformulier met de **+** onder een tabel (de oefening is al ingevuld), het halterpictogram in het lint, of de opdracht **Log aanmaken**. Het formulier begint met je laatste serie, dus meestal tik je één keer op **+/−** en sla je op. Doe dat voordat je rust voorbij is.

Het formulier vraagt om de velden die bij de oefening passen: herhalingen en gewicht voor een squat, seconden voor een plank, afstand en tijd voor een run (zie [Oefeningstypen](#oefeningstypen)). Elke serie kan ook een notitie en een protocol bevatten, dat in de tabel als badge wordt getoond.

Het gewichtsveld heeft een kg/lb-keuze, zodat je 225 lb kunt loggen, ook al staat je instelling op kg. De tabel toont die serie als "225 lb"; grafieken, statistieken en volume rekenen elke serie om naar je instelling.

Wanneer je een serie vanuit een notitie logt, wordt de naam van die notitie opgeslagen als de **training** van die serie, zodat een tabel of grafiek met `workout: Push Day` hem later vindt.

## Tabellen

Een `workout-log`-blok toont de series van een oefening of training, nieuwste eerst. Series van dezelfde dag worden gegroepeerd onder een rij met de totalen van die dag, en elke rij heeft een bewerkknop; verwijder een serie via het bewerkformulier. Op een telefoon wordt elke serie een compacte rij, zonder zijwaarts scrollen.

<img src="assets/tables.png" width="720" alt="Een workout-log-tabel op een telefoon, series gegroepeerd per dag met hun tijd en een drop-set-badge, en het logformulier dat de +-knop opent">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Met `targetWeight` en `targetReps` verschijnt er boven de tabel een doel voor progressieve overbelasting.

<details>
<summary>Alle parameters</summary>

| Parameter                    | Standaard | Wat het doet                                         |
| ---------------------------- | --------- | ---------------------------------------------------- |
| `exercise`                   | —         | Alleen deze oefening                                 |
| `workout`                    | —         | Alleen deze training (naam van de notitie)           |
| `exactMatch`                 | `false`   | De oefeningsnaam exact laten overeenkomen            |
| `dateRange`                  | alles     | Vandaag en de voorgaande N dagen                     |
| `limit`                      | `50`      | Maximaal aantal rijen; met `sets`, `sets × 2` (twee trainingen) |
| `sortBy`                     | `date`    | `date`, `exercise`, `weight`, `reps` of `volume`     |
| `sortOrder`                  | `desc`    | `asc` of `desc`                                      |
| `columns`                    | alles     | Te tonen kolommen, bijv. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`    | De kolom met de protocolbadge tonen                  |
| `showAddButton`              | `true`    | De **+**-knop tonen                                  |
| `targetWeight`, `targetReps` | —         | Een doel voor progressieve overbelasting boven de tabel tonen |
| `sets`                       | —         | Geplande series, geteld door een `workout-session`-blok |

Oefeningsnamen worden standaard losjes vergeleken ("squat" vindt "Squat (high bar)"); voeg `exactMatch: true` toe om alleen die exacte naam te krijgen.

</details>

## Series op je telefoon (bèta)

Een `workout-sets`-blok is gemaakt voor het loggen in de sportschool: de series van vandaag van één oefening als rijen om in te vullen. Elke rij toont wat je bij dezelfde serie de vorige keer deed, zodat je alleen typt wat veranderd is (een leeg veld logt die waarde) en daarna de rij aantikt. De serie gaat naar het log, de rij wordt een gelogde serie, en de rusttimer bovenaan start vanzelf. Met het pijltje van een gelogde serie wijzig je het protocol en de notities; nog een keer aantikken haalt hem terug, met **Ongedaan maken** een paar seconden lang.

<img src="assets/sets.png" alt="Een workout-sets-kaart op een telefoon: vier rijen ingevuld met de waarden van de vorige keer, daarna twee afgevinkte series met de lopende rusttimer, en een rij geopend om het protocol rest-pause te kiezen en een notitie toe te voegen">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

Het blok is een bètafunctie: zet **Trainingsseries** aan onder **Instellingen → Workout Planner → Bètafuncties** (nieuwe installaties hebben het aan staan). Daarna maakt **Trainingsseries invoegen** in het opdrachtenpalet er een voor je, en het ⋮-menu bewerkt het blok of de rusttimer ervan.

<details>
<summary>Alle parameters</summary>

| Parameter                    | Standaard     | Wat het doet                                                                                     |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | De oefening (exacte naam)                                                                        |
| `workout`                    | de naam van de notitie | De training waaronder de series worden gelogd                                           |
| `sets`                       | zoals vorige keer | Rijen om in te vullen (minstens één); **Voeg serie toe** voegt er meer toe                   |
| `targetWeight`, `targetReps` | —             | Hints als de oefening nog nooit is gedaan, en een doel voor progressieve overbelasting           |
| `rest`                       | —             | Seconden rust na elke serie; `0` voor geen timer. Niet ingesteld: de `workout-timer` van dezelfde sectie |
| `timer.*`                    | —             | De overige opties van de rusttimer: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Grafieken en trends

Een `workout-chart`-blok tekent één maat over tijd: gewicht, volume, herhalingen, geschatte 1RM, duur, afstand, tempo of hartslag. De kop laat zien of de trend **Stijgend**, **Stabiel** of **Afnemend** is. Stabiel betekent dat de trendlijn over de hele periode minder dan 5% van het gemiddelde beweegt, dus een langzame, gestage winst telt nog steeds als stijgend. Bij tempo is lager beter, en een dalende lijn telt als verbetering. Op een telefoon wordt de grafiek een tabel met dezelfde waarden.

Gebruik `type: e1rm` voor de beste geschatte one-rep max per dag (Epley: `gewicht × (1 + herhalingen / 30)`). Alleen positieve gewichten met gehele herhalingen van 1 tot 12 tellen mee; opwarm- en drop-sets zijn uitgesloten. Dagen zonder geschikte series worden weggelaten. Schattingen volgen je kg/lb-instelling. De standaard krachtgrafiek blijft volume.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

De API voegt `estimatedOneRepMax` toe aan `getExerciseStats`: de beste schatting in de ingestelde gewichtseenheid, of `null` wanneer er geen geschikte serie is. Bestaande PR-velden en CSV-kolommen blijven ongewijzigd.

![Een grafiek van de geschatte 1RM van bankdrukken met de stijgende trendlijn op de desktop, en dezelfde waarden als tabel op een telefoon](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Alle parameters</summary>

| Parameter       | Standaard      | Wat het doet                                                              |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Alleen deze oefening                                                      |
| `workout`       | —              | Alleen deze training                                                      |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` of `heartRate` |
| `chartType`     | `exercise`     | Hoe het punt van elke dag wordt opgebouwd (hieronder)                     |
| `dateRange`     | `30`           | Aantal dagen dat wordt meegenomen                                         |
| `limit`         | —              | Alleen de laatste N punten                                                |
| `showTrendLine` | `false`        | Een trendlijn tekenen                                                     |
| `showStats`     | `true`         | Gemiddelde, beste en laagste onder de grafiek tonen                       |
| `title`         | `Trend <type>` | Titel van de grafiek                                                      |
| `height`        | 4:3            | `300` (pixels) of een CSS-lengte zoals `50vh`                             |
| `exactMatch`    | `false`        | De oefeningsnaam exact laten overeenkomen                                 |

| `chartType` | Gebruikte series                    | Punt per dag     |
| ----------- | ----------------------------------- | ---------------- |
| `exercise`  | series van `exercise`               | gemiddelde       |
| `workout`   | series van `workout`                | totaal           |
| `combined`  | series van `exercise` binnen `workout` | totaal        |
| `all`       | elke serie (filters genegeerd)      | totaal           |

</details>

## Dashboard en spierheatmap

Een `workout-dashboard`-blok opent met vier getallen: totaal aantal trainingen, wekelijkse reeks, totaal volume en persoonlijke records. Daaronder vind je snelle statistieken voor de week, de maand en het jaar, een volumetrend, je recente trainingen, protocolstatistieken, geplande versus werkelijke trainingsduur en een trainingskalender: een jaar aan trainingsdagen, gekleurd naar volume, met je huidige en beste reeks. Een week telt mee voor de reeks zodra je het aantal trainingsdagen van je wekelijkse doel hebt gehaald (Instellingen → Wekelijks doel, standaard 1). Op een telefoon staan de snelle acties eerst en is de samenvatting een raster van 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Het dashboard op een telefoon: samenvatting, trainingskalender met het wekelijkse doel behaald, recente trainingen en snelle statistieken">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Om de widgets en hun volgorde te kiezen zonder YAML te schrijven, voeg je het dashboard in met de opdracht **Trainingsdashboard invoegen**, of open je het ⋮-menu rechtsboven in een ingevoegd dashboard en kies je **Dashboard bewerken**.

Zet **Indeling** in dat venster op **Raster** om elke widget zelf te plaatsen, als items in een inventaris: sleep een widget om hem te verplaatsen, sleep zijn hoek om hem breder of hoger te maken, en laat hem vallen onder het raster om hem te verwijderen. Het toetsenbord werkt ook: pijltjes verplaatsen, Shift en pijltjes vergroten of verkleinen, Delete haalt een widget weg. Het raster heeft zoveel kolommen als er in de breedte van je notitie passen; in een smallere weergave worden de widgets opnieuw gerangschikt in leesvolgorde, en op een telefoon worden ze onder elkaar gezet. Je indeling blijft bewaard: wanneer de notitie maar één kolom past (een telefoon), vraagt het venster hoeveel kolommen je wilt bewerken, te beginnen bij de opgeslagen kolommen. Het blok houdt één regel per widget aan (kolom, rij, breedte, hoogte):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

De spierheatmap toont welke spieren je in de laatste week, maand of het laatste jaar hebt getraind, voor- en achterkant, op **Volume**, **Series** of **Herhalingen**. Het is de snelste manier om te zien dat je drie weken lang benen hebt overgeslagen. Eronder waarschuwt een korte trainingsanalyse je voor onevenwichtigheden, zoals een voorkant die veel meer werkt dan de achterkant. Hij leest de spierlabels van je [oefeningspagina's](#oefeningstypen). Lichaamsgewicht- en getimede oefeningen hebben geen gewicht, dus die lichten alleen op onder Series en Herhalingen.

<img src="assets/heatmap.png" width="720" alt="Spierheatmap voor de week op een telefoon, voor- en achterkant: quadriceps, billen en hamstrings getraind, met de trainingsanalyse eronder">

<details>
<summary>Alle parameters</summary>

| Parameter             | Standaard | Wat het doet                                                                                                                                                                                                |
| --------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —         | Kop boven het dashboard                                                                                                                                                                                     |
| `dateRange`           | alles     | Alleen series van de laatste N dagen                                                                                                                                                                        |
| `widgets`             | alles     | De te tonen widgets, in deze volgorde: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`    | `grid` plaatst elke widget in zijn cellen (zie hierboven)                                                                                                                                                   |
| `columns`             | —         | Raster: het aantal kolommen waarvoor het raster is gemaakt                                                                                                                                                  |
| `grid.<widget>`       | —         | Raster: kolom, rij, breedte en hoogte van die widget                                                                                                                                                        |
| `recentWorkoutsLimit` | `5`       | Trainingen in de lijst met recente trainingen                                                                                                                                                               |
| `volumeTrendDays`     | `30`      | Dagen in de grafiek van de volumetrend                                                                                                                                                                      |

</details>

<details>
<summary>Spierlabels</summary>

Labels kunnen een lijst zijn, een enkel woord (`tags: chest`) of een regel met komma's (`tags: chest, triceps`).

Brede groepen: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Specifieke spieren hebben hun eigen deel van het lichaam en tellen mee voor hun groep. Een breed label verdeelt zich over het hele gebied: `chest` licht alle drie de delen van de borst een beetje op, `upper_chest` licht alleen het bovenste deel volledig op.

| Groep       | Specifieke spieren                          |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (of `ql`) |
| `core`      | `obliques`, `serratus`                      |

Labels in je eigen taal, zoals `petto` of `schiena`, werken ook. De plugin koppelt ze aan de groepen hierboven via `muscle-tags.csv`, naast je log. Bewerk dat bestand met **Spierlabels beheren** (toevoegen, hernoemen, zoeken, dubbele labels opsporen) of met de hand:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Een label dat al een groepsnaam is (`upper_chest`, `Upper chest`, `upper-chest`) werkt altijd, ook als `muscle-tags.csv` het niet vermeldt.

</details>

## Timers

Een `workout-timer`-blok is een aftel-, interval- of stopwatch-timer. Sla je gebruikelijke rusttijden op als voorinstellingen. Koppel een timer aan een oefening of training en hij start opnieuw elke keer dat je een serie logt, zodat je hem tussen de series niet hoeft aan te raken. Met `autoStart: true` start hij zodra de notitie opent.

<img src="assets/timers.png" width="320" alt="Twee timers op een telefoon: een intervaltimer in zijn rustfase en een Tabata-voorinstelling in de inspanningsfase van ronde 2">

Hij piept ook op iOS en Android. Telefoons staan geluid alleen toe nadat je de pagina hebt aangeraakt, dus een timer die via `autoStart` start, blijft stil totdat je één keer op **Start** tikt.

Onder **Instellingen → Workout Planner → Timersignalen op het apparaat** staat **Houd het scherm actief terwijl een timer loopt** standaard aan. Dat vraagt schermbescherming aan zolang minstens één timer op de voorgrond loopt, waar het apparaat dat toestaat. **Tril als een timer is voltooid** staat standaard uit en voegt bij nul een korte puls toe, los van geluid, op ondersteunde apparaten zoals Android. iOS houdt de bestaande geluidssignaal; webtrillen is daar niet beschikbaar. Deze functies gebruiken browser-API's naar beste kunnen en zijn nog niet geverifieerd op echte Android- en iOS-toestellen. Ze bieden geen achtergrondalarmen. Een timer met een `id` blijft lopen wanneer je van notitie wisselt; pauzeer hem of laat hem aflopen om de schermbescherming vrij te geven.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Een intervaltimer kan werk en rust afwisselen. Het scherm toont **Inspanning** of **Rust**, en elke fase start met zijn eigen geluid. Elke ronde bestaat uit het werk gevolgd door de rust, ook de laatste ronde, dus deze Tabata duurt 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s werk, 10 s rust, 8 rondes) en `preset: EMOM` (elke minuut een ronde, gedurende 10 minuten) zijn ingebouwd. Een opgeslagen voorinstelling met dezelfde naam vervangt ze.

<details>
<summary>Alle parameters</summary>

| Parameter             | Standaard   | Wat het doet                                                          |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` of `stopwatch`                                |
| `duration`            | `30`        | Seconden (aftellen; bij interval het werk van elke ronde)             |
| `work`                | —           | Interval: seconden werk per ronde (vervangt `duration`)               |
| `rest`                | `0`         | Interval: seconden rust na het werk van elke ronde                    |
| `rounds`              | `1`         | Rondes (interval)                                                     |
| `sound`               | `true`      | Piep wanneer de tijd om is                                            |
| `autoStart`           | `false`     | Start zodra de notitie opent                                          |
| `showControls`        | `true`      | Start, pauze en reset tonen                                           |
| `preset`              | —           | Start vanaf een voorinstelling (opgeslagen, `Tabata` of `EMOM`); parameters overschrijven die |
| `exercise`, `workout` | —           | Start de timer opnieuw wanneer je een serie voor deze oefening of training logt |
| `superset`            | `false`     | Alleen canvas-export: deze oefening en de volgende als superset tekenen |

</details>

## Begeleide sessie

Een `workout-session`-blok bovenaan een trainingsnotitie (opdracht **Begeleide sessie invoegen**) leidt je er oefening voor oefening doorheen: welke serie je doet, het doel, wat je de vorige keer deed, een knop **Serie registreren** en de rusttimer, die start wanneer je een serie logt.

![Een begeleide sessie op een telefoon: serie 3 van 4 van de squat met de rust lopend op zowel de sessie als de setkaart, het logformulier geopend via Serie registreren, en daarna de volgende oefening met zijn lopende rusttimer](assets/session.png)

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

Het plan is de notitie zelf: elk `workout-log`- of `workout-sets`-blok met een `exercise` is een stap, in de volgorde waarin ze staan, met zijn `sets`, `targetReps` en `targetWeight`. De rust komt uit de `rest` van het `workout-sets`-blok, of anders uit de `workout-timer` in dezelfde `##`-sectie (zonder die timer geldt de standaardvoorinstelling). De sessie en de setkaart delen één aftelling. De sessie telt de series die je vandaag in deze training hebt gelogd, dus hij pakt het op waar je was wanneer je de notitie opnieuw opent. Een oefening zonder `sets` blijft actueel totdat je een serie van een latere oefening logt; **Vorige** en **Volgende** bewegen vrij.

## Trainingsduur

Een `workout-duration`-blok schat hoe lang een trainingsnotitie duurt: de rust uit de timers plus de tijd voor elke serie, naast hoe lang je laatste sessie echt duurde.

<img src="assets/duration.png" width="420" alt="Kaart met de geschatte duur: rusttijd, tijd per serie en de laatste sessie">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` kan een pad in de kluis zijn, een pad ten opzichte van deze notitie, of alleen de naam van de notitie; laat het weg om de huidige notitie te schatten. Seconden per herhaling en per serie komen uit de [Instellingen](#instellingen).

## Oefeningstypen

Een oefeningspagina is een notitie in je oefeningenmap. De frontmatter zegt welke velden het logformulier moet vragen en welke spieren de oefening traint. **Oefeningspagina maken** maakt er een voor je.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Het logformulier vraagt                      | Ook geaccepteerd                                             |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (standaard) | herhalingen, gewicht                       | `bodyweight`, `weights`                                      |
| `timed`              | duur                                         | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | afstand, duur (optioneel)                    | `running`, `run`                                             |
| `cardio`             | duur, afstand en hartslag (optioneel)        | —                                                            |
| `custom`             | alleen de velden die je onder `parameters` opsomt | —                                                       |

Yoga werkt op dezelfde manier: elke houding is een `timed`-oefening, dus het formulier vraagt alleen hoe lang je de houding aanhield. De voorbeeldnotities bevatten een ochtendyogaflow met een begeleide sessie.

![Een yogaflow op een telefoon: de begeleide sessie bij Neerwaartse hond, het logformulier dat alleen de duur van de houding vraagt, en de setkaart met de eerste houding gelogd](assets/yoga.png)

`type:` werkt hetzelfde als `exercise_type:`. Voeg je eigen velden toe onder `parameters`, bijvoorbeeld rondes voor touwspringen:

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

Als je het type van een oefening wijzigt nadat je die hebt gelogd, verplaatst **Oefening omzetten** de bestaande series en kun je kiezen welk oud veld waar terechtkomt.

## Je gegevens

Elke serie is één rij in `workout_logs.csv`, zodat je het in een spreadsheet kunt openen, een back-up kunt maken of het kunt synchroniseren zoals elk ander bestand.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Kolommen en met de hand bewerken</summary>

| Kolom                      | Betekenis                                   |
| -------------------------- | ------------------------------------------- |
| `date`                     | Wanneer de serie is gelogd (ISO 8601)       |
| `exercise`, `workout`      | Naam van oefening en training               |
| `reps`, `weight`, `volume` | Volume is herhalingen × gewicht             |
| `origine`                  | Link naar de notitie waaruit hij is gelogd  |
| `timestamp`                | Unieke ID van de rij (milliseconden)        |
| `notes`, `protocol`        | Vrije tekst en trainingstechniek            |

Oefeningstypen met eigen velden (`duration`, `distance`, `heartRate`, of je `parameters`) voegen kolommen toe aan het eind. De laatste kolom, `weightUnit`, is `kg` of `lb`: de eenheid van het `weight` en `volume` van die rij. Een lege waarde betekent de eenheid uit de instellingen.

Als je het bestand met de hand bewerkt, behoud dan de kopregel en zet elke waarde die een komma, aanhalingsteken of regeleinde bevat tussen dubbele aanhalingstekens. Notities die beginnen met `=`, `+`, `-` of `@` worden opgeslagen met een voorloopse `'`, zodat spreadsheets ze niet als formules uitvoeren; de plugin verbergt die weer.

</details>

Alles blijft in je kluis. De plugin schrijft alleen naar het klembord wanneer je op een kopieerbadge klikt (een spierlabel in het dashboard), en hij leest het nooit.

### Dataview en Templater

De plugin stelt `WorkoutPlannerAPI` beschikbaar (ook als `window.WorkoutPlannerAPI`) zodra hij is geladen.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>API-referentie en meer voorbeelden</summary>

| Methode                      | Geeft terug                                                                                                                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Series, elk met `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` en `volume` zijn in de eenheid van de instellingen; `enteredWeight` en `enteredUnit` zijn wat er is gelogd                       |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Oefeningsnamen, gesorteerd: de bestandsnamen van je oefeningspagina's (ook in submappen), of de namen in je log als je geen oefeningspagina's hebt. `{ tag: "chest" }` houdt de oefeningen over waarvan de pagina dat label heeft, dus het resultaat is leeg zonder oefeningspagina's. |

`getWorkoutLogs` accepteert `exercise` (gedeeltelijk, hoofdletterongevoelig), `workout`, `dateRange: { start, end }`, `protocol` en `exactMatch`.

Recente squats, in Dataview:

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

In een [Templater](https://github.com/SilentVoid13/Templater)-template, om een notitie te starten met je laatste cijfers:

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

## Instellingen

Stel de CSV- en oefenmappen in, de standaard gewichtseenheid, de gewichtsstap van de **+/−**-knoppen, timervoorinstellingen, je eigen protocollen (naam, korte label en kleur), en de seconden per herhaling en per serie die de duurschatting gebruikt. **Alle onderhoud uitvoeren** onder **Geavanceerd** voert elke onderhoudstaak uit na een upgrade.

Het wijzigen van de gewichtseenheid verandert oude series niet: elke serie behoudt de eenheid waarin hij is gelogd.

<details>
<summary>Alle opdrachten</summary>

Open het opdrachtenpalet (`Ctrl/Cmd + P`) en typ de naam.

| Opdracht                                                    | Wat het doet                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Trainingslog maken                                          | Een serie loggen                                                   |
| Begin de tour                                               | De begeleide rondleiding volgen                                    |
| Voorbeeldnotities maken                                     | Voorbeeldoefeningen, trainingen, logs en een dashboard toevoegen   |
| Open handleiding                                            | De handleiding openen bij de voorbeelden                           |
| Trainingsgrafiek / tabel / timer / dashboard / duur invoegen | Een blok invoegen via een formulier                               |
| Oefeningspagina maken                                       | Nieuwe oefeningspagina met type en labels                          |
| Oefeningssectie maken                                       | Een kop, timer en tabel voor een oefening aan de huidige notitie toevoegen |
| Oefeningsblok toevoegen                                     | Een oefeningsblok invoegen, met automatisch aanvullen van de naam  |
| Oefening omzetten                                           | De series van een oefening naar een ander oefeningstype verplaatsen |
| Spierlabels beheren                                         | `muscle-tags.csv` bewerken                                         |
| Labeloverzicht genereren                                    | Een notitie maken met elk spierlabel                               |
| Oefeningsnamen controleren                                  | Dezelfde oefening vinden die onder verschillende spellingen is gelogd |
| Training exporteren naar canvas                             | De huidige training op een Obsidian-canvas uitlijnen               |
| CSV-logbestand maken                                        | Een leeg log maken                                                 |
| Importeren vanuit Strong of Hevy                            | De series van een Strong- of Hevy-CSV-export aan het log toevoegen |
| Oefeningstypen migreren, Ontbrekende ID's aan codeblokken toevoegen | Onderhoud na een upgrade vanaf oudere versies              |

</details>

## Probleemoplossing

- **Conflict met Workout Block (`workout-block`).** Beide plugins registreren `workout-log`-codeblokken en gebruiken `workout_logs.csv` als standaardnaam voor het logbestand. Schakel een van de twee plugins uit voordat je de andere gebruikt.

- **Een tabel of grafiek is leeg.** Controleer de oefeningsnaam en de `dateRange` (grafieken tonen standaard de laatste 30 dagen). Met `exactMatch: true` moet de naam exact overeenkomen.
- **Een oefening ontbreekt in de heatmap.** De pagina heeft spierlabels (`tags`) nodig en moet in de oefeningenmap staan. Lichaamsgewicht- en getimede oefeningen verschijnen alleen onder **Series** of **Herhalingen**.
- **Het logformulier vraagt om herhalingen en gewicht bij een plank.** Zet `exercise_type: timed` in de oefeningspagina.
- **De timer maakt geen geluid op mijn telefoon.** Tik één keer op **Start**; telefoons blokkeren geluid totdat je de pagina aanraakt.

## Installatie

### Vanuit community-plugins

1. Open **Instellingen → Community-plugins**
2. Zoek naar **Workout Planner**
3. Selecteer **Installeren** en daarna **Inschakelen**

### Handmatig

1. Download `main.js`, `manifest.json` en `styles.css` uit de [nieuwste release](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Maak de map `your-vault/.obsidian/plugins/workout-planner/` aan
3. Kopieer de gedownloade bestanden naar die map
4. Schakel de plugin in via **Instellingen → Community-plugins**

## Ondersteuning

Workout Planner is gratis en open source. Als hij je training helpt, kun je me [trakteren op een koffie](https://buymeacoffee.com/spatariurares). Een bug gevonden of mis je iets? Open een [issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Elke taal behalve Engels is machinaal vertaald, dus sommige zinnen klinken misschien vreemd. Als de jouwe ongewoon klinkt, zijn correcties welkom.

## Credits

Grafieken gebruiken [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner is uitgebracht onder de [MIT-licentie](LICENSE).
