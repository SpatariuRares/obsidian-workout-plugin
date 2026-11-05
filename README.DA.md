<img src="assets/logo.png" width="96" alt="Workout Planner-logo">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · Dansk · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Den alt-i-ét træningstracker til Obsidian.** Styrketræning, løb, cykling, yoga eller øvelser med dine egne felter: log fra din telefon, følg en guidet session, og se din udvikling i diagrammer, et dashboard og et muskel-heatmap. Én CSV-fil, 24 sprog.

Lavet til din telefon: log hvert sæt, løb eller stilling, mens du træner, og følg derefter din udvikling i tabeller, diagrammer og et dashboard i de samme noter, hvor du planlægger din træning. Dine sæt gemmes i én CSV-fil i din vault. Ingen konto, ingen cloud.

Diagrammer viser din tendens, muskel-heatmappet viser, hvad du har trænet, og hvert sæt beholder sin egen kg/lb-enhed. Du kan forespørge dine sæt fra Dataview.

![Workout Planner på en telefon: et træningssæt-kort med to sæt afkrydset og hviletimeren kørende, logformularen med +/−-knapper og kg/lb-vælger, og dashboardets oversigt med træningskalenderen](assets/hero.png)

## Funktioner

- Registrér sæt med gentagelser og vægt, forududfyldt fra dit sidste sæt, med +/−-knapper og nylige øvelser med ét tryk
- Registrér hvert sæt i kg eller lb, uanset hvad pladerne foran dig siger
- Markér sæt med en protokol: drop set, myo-reps, hvilepause, supersæt, 21s eller din egen
- Tabeller over dine sæt, grupperet efter dag med dagens totaler, og redigerbare med ét tryk
- Dagens sæt som rækker, du udfylder på din telefon: afkryds et sæt for at registrere det, og hviletimeren starter
- Diagrammer for vægt, volumen, gentagelser, varighed, distance, tempo og puls, samt en tendens, der klart fortæller dig, om du forbedrer dig
- Et dashboard med ugentlig streak (med et ugentligt mål), en træningskalender, personlige rekorder, samlet volumen, seneste træninger og protokolstatistik
- Et muskel-heatmap, for og bag, efter volumen, sæt eller gentagelser
- Hviletimere (nedtælling, interval, stopur) med forudindstillinger, der genstarter, når du registrerer et sæt, og bipper på iOS og Android
- En guidet session, der går gennem træningsnoten én øvelse ad gangen
- Et estimat af, hvor lang tid en planlagt træning tager
- Styrke-, kropsvægts-, tidsbaserede, distance- og kardioøvelser, eller dine egne felter
- Alle sæt i en simpel CSV-fil, som kan læses fra Dataview og Templater
- Lavet til telefoner: ingen vandret scrolling, knapper altid inden for rækkevidde
- Tilgængelig på 24 sprog

## Sådan kommer du i gang

Første gang du installerer pluginet, tilføjer det eksempelnoter (eksempeløvelser, to træninger med seks ugers logs, et dashboard og en funktionsgennemgang), peger pluginet på dem og åbner guiden **Sådan kommer du i gang**: én kort side pr. funktion, med fungerende eksempler, du kan prøve. Du behøver ikke åbne indstillingerne. Udforsk gerne, før du opsætter din egen.

### Den guidede tur

Turen åbner en note "Guidet tur" med en tabel, et diagram, et dashboard og en timer, og peger på hvert af dem i tur og orden. Den har ni korte trin:

1. Registrér dit første sæt med knappen **+**. Trinnet afsluttes, når du gemmer det.
2. Rediger eller slet et sæt med knapperne på hver række.
3. Se din udvikling i diagrammet.
4. Se totaler og tendenser i dashboardet.
5. Se, hvilke muskler du har trænet, i muskel-heatmappet.
6. Start hviletimeren. Trinnet afsluttes, når du trykker på start.
7. Find håndvægtikonet i båndet, som åbner logformularen fra enhver note. På en telefon bruger du i stedet kommandopaletten.
8. Kør en hvilken som helst **Indsæt træning**-kommando fra kommandopaletten. Trinnet afsluttes, når du gør det.
9. Færdig.

Brug **Tilbage** og **Næste** til at bevæge dig rundt, eller **Spring over** for at afslutte. Hvis den del af noten, turen peger på, er uden for synsfeltet, scroller **Vis mig** hen til den. Tryk på `Esc` når som helst for at afslutte. Turen afsluttes også, når du lukker dens note eller skifter til en anden fil. Intet går tabt: dine sæt bliver i loggen.

Når eksempeldata er i brug, kører turen på dem. Ellers kører den på din egen log, så diagram og dashboard starter næsten tomme. Noten oprettes én gang, ved siden af eksemplerne eller øverst i din vault. En eksisterende note bliver aldrig overskrevet, og du kan redigere eller slette den. Hvis en note ved navn "Guidet tur" allerede findes, og den ikke er turens egen, bruger turen i stedet "Guidet tur 1" (eller det næste ledige nummer).

Vil du tage turen igen? Vælg **Tag turen** under **Indstillinger → Workout Planner → Sådan kommer du i gang**, eller kør **Start turen** fra kommandopaletten.

Vil du have eksemplerne eller vejledningen igen? Vælg **Opret eksempler** eller **Åbn vejledningen** under **Indstillinger → Workout Planner → Sådan kommer du i gang**, eller kør **Opret eksempelnoter** eller **Åbn vejledningen** fra kommandopaletten (`Ctrl/Cmd + P`). Oprettelse af eksemplerne overskriver aldrig noget: kører du det igen, tilføjes kun de eksempelfiler, der mangler, og filer, du har ændret, forbliver, som de er. Guiden tilbyder at oprette eksemplerne, hvis de ikke findes endnu. En tom tabel, et tomt diagram eller dashboard har også et link **Eller udforsk med eksempeldata**. Har du allerede en træningslog, får eksemplerne deres egen logfil, og din forbliver urørt.

For at tilføje en tabel til en hvilken som helst note, f.eks. `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Tryk på **+** under tabellen, indtast gentagelser og vægt, og gem. Tabellen opdateres af sig selv. Du behøver heller ikke skrive blokkene i hånden: kommandoerne **Indsæt træningsdiagram / træningstabel / træningstimer / træningsdashboard / træningsvarighed** åbner en formular og indsætter blokken for dig.

## Registrering af sæt

Åbn logformularen med **+** under en tabel (øvelsen er udfyldt for dig), med håndvægtikonet i båndet eller med kommandoen **Opret træningslog**. Formularen starter fra dit sidste sæt, så det meste af tiden trykker du på **+/−** én gang og gemmer. Gør det, før din pause er slut.

Formularen spørger efter de felter, der passer til øvelsen: gentagelser og vægt for en squat, sekunder for en plank, distance og tid for et løb (se [Øvelsestyper](#øvelsestyper)). Hvert sæt kan også have en note og en protokol, som vises som et mærke i tabellen.

Vægtfeltet har en kg/lb-vælger, så du kan registrere 225 lb, selvom din indstilling er kg. Tabellen viser sættet som "225 lb"; diagrammer, statistik og volumen omregner alle sæt til din indstilling.

Når du registrerer et sæt fra en note, gemmes notens navn som sættets **træning**, så en tabel eller et diagram med `workout: Push Day` finder det senere.

## Tabeller

En `workout-log`-blok viser sættene for en øvelse eller en træning, nyeste først. Sæt fra samme dag grupperes under en række med dagens totaler, og hver række har en redigeringsknap; slet et sæt fra redigeringsformularen. På en telefon bliver hvert sæt til en kompakt række uden vandret scrolling.

<img src="assets/tables.png" width="720" alt="En workout-log-tabel på en telefon, med sæt grupperet efter dag med tid og et drop set-mærke, og logformularen som dens +-knap åbner">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Med `targetWeight` og `targetReps` vises et mål for progressiv overbelastning over tabellen.

<details>
<summary>Alle parametre</summary>

| Parameter                    | Standard | Hvad den gør                                         |
| ---------------------------- | -------- | ---------------------------------------------------- |
| `exercise`                   | —        | Kun denne øvelse                                     |
| `workout`                    | —        | Kun denne træning (notenavn)                         |
| `exactMatch`                 | `false`  | Match øvelsesnavnet præcist                          |
| `dateRange`                  | alle     | I dag og de foregående N dage                        |
| `limit`                      | `50`     | Maksimalt antal rækker; med `sets`, `sets × 2` (to træninger) |
| `sortBy`                     | `date`   | `date`, `exercise`, `weight`, `reps` eller `volume`  |
| `sortOrder`                  | `desc`   | `asc` eller `desc`                                   |
| `columns`                    | alle     | Kolonner der vises, f.eks. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`   | Vis kolonnen med protokolmærket                      |
| `showAddButton`              | `true`   | Vis **+**-knappen                                    |
| `targetWeight`, `targetReps` | —        | Vis et mål for progressiv overbelastning over tabellen |
| `sets`                       | —        | Planlagte sæt, talt af en `workout-session`-blok     |

Øvelsesnavne matcher løst som standard ("squat" finder "Squat (high bar)"); tilføj `exactMatch: true` for kun det præcise navn.

</details>

## Sæt på din telefon

En `workout-sets`-blok er lavet til at registrere sæt i fitnesscentret: dagens sæt for én øvelse som rækker, du udfylder. Hver række viser, hvad du gjorde i det samme sæt sidst, så du kun skriver det, der har ændret sig (et tomt felt registrerer den værdi), og afkrydser rækken. Sættet går ind i loggen, rækken bliver til et registreret sæt, og hviletimeren øverst starter af sig selv. Et registreret sæts chevron ændrer dets protokol og noter; afkryds det igen for at tage det tilbage, med **Fortryd** i nogle sekunder.

<img src="assets/sets.png" alt="Et workout-sets-kort på en telefon: fire rækker udfyldt med sidste gangs værdier, derefter to sæt afkrydset med hviletimeren kørende, og så en række åbnet for at vælge hvilepause-protokollen og tilføje en note">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Indsæt træningssæt** fra kommandopaletten skriver en til dig, og ⋮-menuen redigerer den eller dens hviletimer.

<details>
<summary>Alle parametre</summary>

| Parameter                    | Standard      | Hvad den gør                                                                                     |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | Øvelsen (præcist navn)                                                                           |
| `workout`                    | notenavnet    | Træningen sættene registreres under                                                              |
| `sets`                       | som sidst     | Rækker at udfylde (mindst én); **Tilføj sæt** tilføjer flere                                     |
| `targetWeight`, `targetReps` | —             | Hints, når øvelsen aldrig er lavet, og et mål for progressiv overbelastning                      |
| `rest`                       | —             | Sekunder hvile efter hvert sæt; `0` for ingen timer. Ikke angivet: `workout-timer`-blokken i samme afsnit |
| `timer.*`                    | —             | Hviletimerens øvrige valgmuligheder: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Diagrammer og tendenser

En `workout-chart`-blok tegner én måling over tid: vægt, volumen, gentagelser, estimeret 1RM, varighed, distance, tempo eller puls. Overskriften viser, om tendensen er **Stigende**, **Stabil** eller **Faldende**. Stabil betyder, at tendenslinjen bevæger sig mindre end 5 % af gennemsnittet over hele perioden, så en langsom, jævn fremgang stadig tæller som stigende. For tempo er lavere bedre, og en faldende linje vises som forbedring. På en telefon bliver diagrammet til en tabel med de samme værdier.

Brug `type: e1rm` for den bedste daglige estimerede one-rep max (Epley: `weight × (1 + reps / 30)`). Kun positive vægte med hele gentagelser fra 1 til 12 tæller; opvarmnings- og drop sets er udelukket. Dage uden gyldige sæt udelades. Estimaterne følger din kg/lb-indstilling. Standarddiagrammet for styrke er fortsat volumen.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API'et tilføjer `estimatedOneRepMax` til `getExerciseStats`: det bedste estimat i den konfigurerede vægtenhed, eller `null` når der ikke findes et gyldigt sæt. Eksisterende PR-felter og CSV-kolonner er uændrede.

![Et diagram over en bænkpres' estimerede 1RM med en stigende tendenslinje på desktop, og de samme værdier som en tabel på en telefon](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Alle parametre</summary>

| Parameter       | Standard       | Hvad den gør                                                              |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Kun denne øvelse                                                          |
| `workout`       | —              | Kun denne træning                                                         |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` eller `heartRate` |
| `chartType`     | `exercise`     | Hvordan hvert dags punkt bygges (nedenfor)                                |
| `dateRange`     | `30`           | Dage der medtages                                                         |
| `limit`         | —              | Kun de seneste N punkter                                                  |
| `showTrendLine` | `false`        | Tegn en tendenslinje                                                      |
| `showStats`     | `true`         | Vis gennemsnit, bedste og laveste under diagrammet                        |
| `title`         | `Trend <type>` | Diagrammets titel                                                         |
| `height`        | 4:3            | `300` (pixels) eller enhver CSS-længde, f.eks. `50vh`                     |
| `exactMatch`    | `false`        | Match øvelsesnavnet præcist                                               |

| `chartType` | Sæt der bruges                      | Hvert dags punkt |
| ----------- | ----------------------------------- | ---------------- |
| `exercise`  | sæt af `exercise`                   | gennemsnit       |
| `workout`   | sæt af `workout`                    | total            |
| `combined`  | sæt af `exercise` inden for `workout` | total          |
| `all`       | alle sæt (filtre ignoreres)         | total            |

</details>

## Dashboard og muskel-heatmap

En `workout-dashboard`-blok åbner med fire tal: samlet antal træninger, ugentlig streak, samlet volumen og personlige rekorder. Under dem får du hurtig statistik for uge, måned og år, en volumentendens, dine seneste træninger, protokolstatistik, planlagt mod faktisk træningslængde og en træningskalender: et år med træningsdage, skygget efter volumen, med din nuværende og bedste streak. En uge tæller mod streaken, når den har de træningsdage, dit ugentlige mål kræver (Indstillinger → Ugentligt mål, 1 som standard). På en telefon kommer hurtige handlinger først, og oversigten er et 2 × 2-gitter.

<img src="assets/dashboard.png" width="720" alt="Dashboardet på en telefon: oversigt, træningskalender med ugens mål opfyldt, seneste træninger og hurtig statistik">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

For at vælge widgets og deres rækkefølge uden at skrive YAML, indsæt dashboardet med kommandoen **Indsæt træningsdashboard**, eller åbn ⋮-menuen øverst til højre i et indsat dashboard og vælg **Rediger dashboard**.

Sæt **Layout** til **Gitter** i det vindue for at placere hver widget selv, som genstande i et inventar: træk en widget for at flytte den, træk dens hjørne for at gøre den bredere eller højere, og slip den under gitteret for at fjerne den. Tastaturet virker også: piletaster flytter, Shift og piletaster ændrer størrelse, og Delete fjerner en widget. Gitteret har lige så mange kolonner, som der er plads til i din notes bredde; i et smallere panel pakkes widgets igen i læserækkefølge, og på en telefon stables de. Din layout bevares: når noten kun rummer én kolonne (en telefon), spørger vinduet, hvor mange kolonner der skal redigeres, med udgangspunkt i de gemte. Blokken holder én linje pr. widget (kolonne, række, bredde, højde):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Heatmappet viser, hvilke muskler du har trænet i den seneste uge, måned eller år, for og bag, efter **Volumen**, **Sæt** eller **Gentagelser**. Det er den hurtigste måde at opdage, at du har sprunget benene over i tre uger. Under det advarer en kort træningsanalyse dig om ubalancer, f.eks. en forside, der arbejder langt mere end ryggen. Den læser muskeltags fra dine [øvelsessider](#øvelsestyper). Kropsvægts- og tidsbaserede øvelser har ingen vægt, så de lyser kun op under Sæt og Gentagelser.

<img src="assets/heatmap.png" width="720" alt="Muskel-heatmap for ugen på en telefon, for og bag: quads, glutes og hamstrings trænet, med træningsanalysen nedenfor">

<details>
<summary>Alle parametre</summary>

| Parameter             | Standard | Hvad den gør                                                                                                                                                                                                |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —        | Overskrift over dashboardet                                                                                                                                                                                 |
| `dateRange`           | alle     | Kun sæt fra de seneste N dage                                                                                                                                                                               |
| `widgets`             | alle     | De widgets, der vises, i denne rækkefølge: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`   | `grid` placerer hver widget i dens celler (se ovenfor)                                                                                                                                                      |
| `columns`             | —        | Gitter: de kolonner, gitteret blev lavet til                                                                                                                                                                |
| `grid.<widget>`       | —        | Gitter: kolonne, række, bredde og højde for den widget                                                                                                                                                      |
| `recentWorkoutsLimit` | `5`      | Træninger på listen over seneste                                                                                                                                                                            |
| `volumeTrendDays`     | `30`     | Dage i diagrammet over volumentendensen                                                                                                                                                                     |

</details>

<details>
<summary>Muskeltags</summary>

Tags kan være en liste, et enkelt ord (`tags: chest`) eller en kommasepareret linje (`tags: chest, triceps`).

Brede grupper: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Specifikke muskler har deres eget område på kroppen og tæller med i deres gruppe. Et bredt tag fordeles over hele området: `chest` lyser alle tre dele af brystet lidt, mens `upper_chest` kun lyser den øverste fuldt.

| Gruppe      | Specifikke muskler                          |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (or `ql`) |
| `core`      | `obliques`, `serratus`                      |

Tags på dit eget sprog, som `petto` eller `schiena`, virker også. Pluginet omsætter dem til grupperne ovenfor ved hjælp af `muscle-tags.csv`, ved siden af din log. Rediger filen med **Administrer muskeltags** (tilføj, omdøb, søg, find dubletter) eller i hånden:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Et tag, der allerede er et gruppenavn (`upper_chest`, `Upper chest`, `upper-chest`), virker altid, selvom `muscle-tags.csv` ikke har det på listen.

</details>

## Timere

En `workout-timer`-blok er en nedtællings-, interval- eller stopurtimer. Gem dine sædvanlige hviletider som forudindstillinger. Knyt en timer til en øvelse eller en træning, så den genstartes, hver gang du registrerer et sæt, og du ikke skal røre ved den mellem sæt. Med `autoStart: true` starter den, så snart noten åbnes.

<img src="assets/timers.png" width="320" alt="To timere på en telefon: en intervaltimer i sin hvilefase og en Tabata-forudindstilling i arbejdsfasen af runde 2">

Den bipper også på iOS og Android. Telefoner tillader kun lyd, når du har trykket på siden, så en timer startet af `autoStart` forbliver stille, indtil du trykker på **Start** én gang.

Under **Indstillinger → Workout Planner → Signaler fra timeren** er **Hold skærmen tændt, mens en timer kører** slået til som standard. Den beder om skærmbeskyttelse, mens mindst én timer kører i forgrunden, hvor enheden tillader det. **Vibrer når en timer er færdig** er slået fra som standard og tilføjer et kort puls ved nul, uafhængigt af lyden, på understøttede enheder som Android. iOS beholder den eksisterende lydcue; webvibration er ikke tilgængelig der. Disse funktioner bruger browser-API'er efter bedste indsats og er endnu ikke verificeret på fysiske Android- og iOS-enheder. De giver ingen baggrundsalarmer. En timer med et `id` fortsætter med at køre, når du skifter note; sæt den på pause eller lad den løbe ud for at frigive skærmbeskyttelsen.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

En intervaltimer kan veksle mellem arbejde og hvile. Displayet viser **Arbejde** eller **Hvile**, og hver fase starter med sin egen lyd. Hver runde er sit arbejde efterfulgt af sin hvile, også den sidste, så denne Tabata varer 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s arbejde, 10 s hvile, 8 runder) og `preset: EMOM` (en runde hvert minut i 10 minutter) er indbygget. En gemt forudindstilling med samme navn erstatter dem.

<details>
<summary>Alle parametre</summary>

| Parameter             | Standard    | Hvad den gør                                                          |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` eller `stopwatch`                             |
| `duration`            | `30`        | Sekunder (nedtælling; ved interval arbejdet i hver runde)             |
| `work`                | —           | Interval: sekunder arbejde pr. runde (erstatter `duration`)           |
| `rest`                | `0`         | Interval: sekunder hvile efter hver rundes arbejde                    |
| `rounds`              | `1`         | Runder (interval)                                                     |
| `sound`               | `true`      | Bip når tiden er gået                                                 |
| `autoStart`           | `false`     | Start, så snart noten åbnes                                           |
| `showControls`        | `true`      | Vis start, pause og nulstil                                           |
| `preset`              | —           | Start fra en forudindstilling (gemt, `Tabata` eller `EMOM`); parametrene overskriver den |
| `exercise`, `workout` | —           | Genstart timeren, når du registrerer et sæt for denne øvelse eller træning |
| `superset`            | `false`     | Kun canvas-eksport: tegn denne øvelse og den næste som et supersæt    |

</details>

## Guidet session

En `workout-session`-blok øverst i en træningsnote (kommandoen **Indsæt guidet session**) fører dig gennem træningen én øvelse ad gangen: hvilket sæt du er på, målet, hvad du gjorde sidst, en knap **Registrer sæt** og hviletimeren, der starter, når du registrerer et sæt.

![En guidet session på en telefon: sæt 3 af 4 af squat med hvilen kørende både i sessionen og på sætkortet, logformularen åbnet med Registrer sæt, og derefter den næste øvelse med sin hviletimer kørende](assets/session.png)

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

Planen er selve noten: hver `workout-log`- eller `workout-sets`-blok med en `exercise` er et trin, i den rækkefølge de står, med sine `sets`, `targetReps` og `targetWeight`. Hvilen kommer fra `workout-sets`-blokkens egen `rest`, ellers fra `workout-timer`-blokken i samme `##`-afsnit (standardforudindstillingen, hvis der ikke er en). Sessionen og sætkortet deler én nedtælling. Sessionen tæller de sæt, du har registreret i dag i denne træning, så den tager det op, hvor du slap, når du åbner noten igen. En øvelse uden `sets` forbliver aktuel, indtil du registrerer et sæt af en senere øvelse; **Forrige** og **Næste** bevæger sig frit.

## Varighed af træning

En `workout-duration`-blok estimerer, hvor lang tid en træningsnote tager: hvilen fra dens timere plus tiden for hvert sæt, ved siden af hvor lang din sidste session faktisk var.

<img src="assets/duration.png" width="420" alt="Kort med estimeret varighed med hviletid, sættid og sidste session">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` kan være en sti i vaulten, en sti i forhold til denne note, eller blot notens navn; udelad den for at estimere den aktuelle note. Sekunder pr. gentagelse og pr. sæt kommer fra [Indstillinger](#indstillinger).

## Øvelsestyper

En øvelsesside er en note i din øvelsesmappe. Dens frontmatter siger, hvad logformularen skal spørge om, og hvilke muskler øvelsen træner. **Opret øvelsesside** laver en til dig.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Logformularen spørger efter                  | Også accepteret                                              |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (standard) | gentagelser, vægt                           | `bodyweight`, `weights`                                      |
| `timed`              | varighed                                     | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distance, varighed (valgfri)                 | `running`, `run`                                             |
| `cardio`             | varighed, distance og puls (valgfri)         | —                                                            |
| `custom`             | kun de felter, du angiver under `parameters` | —                                                            |

Yoga fungerer på samme måde: hver stilling er en `timed`-øvelse, så formularen kun spørger, hvor længe du holdt den. Eksempelnoterne indeholder et morgenflow med yoga og en guidet session.

![Et yogaflow på en telefon: den guidede session ved Downward Dog, logformularen der kun spørger om holdets varighed, og sætkortet med det første hold registreret](assets/yoga.png)

`type:` virker på samme måde som `exercise_type:`. Tilføj dine egne felter under `parameters`, f.eks. runder til reb-hop:

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

Hvis du ændrer en øvelses type, efter at have registreret den, flytter **Konvertér øvelse** de eksisterende sæt over og lader dig vælge, hvilket gammelt felt der skal hvor.

## Dine data

Hvert sæt er en række i `workout_logs.csv`, så du kan åbne den i et regneark, tage en sikkerhedskopi af den eller synkronisere den som enhver anden fil.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Kolonner og manuel redigering</summary>

| Kolonne                    | Betydning                           |
| -------------------------- | ----------------------------------- |
| `date`                     | Hvornår sættet blev registreret (ISO 8601) |
| `exercise`, `workout`      | Øvelsens og træningens navn         |
| `reps`, `weight`, `volume` | Volumen er gentagelser × vægt       |
| `origine`                  | Link til noten, det blev registreret fra |
| `timestamp`                | Unikt ID for rækken (millisekunder) |
| `notes`, `protocol`        | Fri tekst og træningsteknik         |

Øvelsestyper med deres egne felter (`duration`, `distance`, `heartRate` eller dine `parameters`) tilføjer kolonner til sidst. Den sidste kolonne, `weightUnit`, er `kg` eller `lb`: enheden for rækkens `weight` og `volume`. En tom værdi betyder enheden i indstillingerne.

Hvis du redigerer filen i hånden, skal du beholde overskriftsrækken og sætte værdier, der indeholder komma, anførselstegn eller linjeskift, i dobbelte anførselstegn. Noter, der starter med `=`, `+`, `-` eller `@`, gemmes med et foranstillet `'`, så regnearket ikke kører dem som formler; pluginet skjuler det igen.

</details>

Alt bliver i din vault. Pluginet skriver kun til udklipsholderen, når du klikker på et kopimærke (et muskeltag i dashboardet), og læser den aldrig.

### Dataview og Templater

Pluginet udsætter `WorkoutPlannerAPI` (også `window.WorkoutPlannerAPI`), når det er indlæst.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>API-reference og flere eksempler</summary>

| Metode                       | Returnerer                                                                                                                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Sæt, hver med `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` og `volume` er i indstillingernes enhed; `enteredWeight` og `enteredUnit` er det, der blev registreret                             |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Øvelsesnavne, sorteret: filnavnene på dine øvelsessider (inklusive undermapper), eller navnene i din log, når du ikke har øvelsessider. `{ tag: "chest" }` beholder de øvelser, hvis side har det tag, så listen er tom uden øvelsessider. |

`getWorkoutLogs` accepterer `exercise` (delvist, uden forskel på store og små bogstaver), `workout`, `dateRange: { start, end }`, `protocol` og `exactMatch`.

Seneste squats, i Dataview:

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

I en [Templater](https://github.com/SilentVoid13/Templater)-skabelon, for at starte en note med dine seneste tal:

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

## Indstillinger

Angiv CSV- og øvelsesmapperne, standardenheden for vægt, vægttrinnet for **+/−**-knapperne, timerforudindstillinger, dine egne protokoller (navn, kort forkortelse og farve) samt sekunder pr. gentagelse og pr. sæt, som varighedsestimatet bruger. **Kør alle** under Avanceret kører alle vedligeholdelsesopgaver efter en opgradering.

Ændring af vægtenheden omdøber ikke gamle sæt: hvert sæt beholder den enhed, det blev registreret i.

<details>
<summary>Alle kommandoer</summary>

Åbn kommandopaletten (`Ctrl/Cmd + P`) og skriv navnet.

| Kommando                                                    | Hvad den gør                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Opret træningslog                                           | Registrer et sæt                                                   |
| Start turen                                                 | Tag den guidede tur                                                |
| Opret eksempelnoter                                         | Tilføj eksempelovelser, træninger, logs og et dashboard            |
| Åbn vejledningen                                            | Åbn guiden i eksemplerne                                           |
| Indsæt træningsdiagram / træningstabel / træningstimer / træningsdashboard / træningsvarighed | Indsæt en blok via en formular |
| Opret øvelsesside                                           | Ny øvelsesside med type og tags                                    |
| Opret øvelsessektion                                        | Tilføj en overskrift, timer og tabel for en øvelse til den aktuelle note |
| Tilføj øvelsesblok                                          | Indsæt en øvelsesblok med autofuldførelse af navne                 |
| Konvertér øvelse                                            | Flyt en øvelses sæt til en anden øvelsestype                       |
| Administrer muskeltags                                      | Rediger `muscle-tags.csv`                                          |
| Generér tag-oversigt                                        | Opret en note med alle muskeltags                                  |
| Gennemgå øvelsesnavne                                       | Find den samme øvelse registreret under forskellige stavemåder     |
| Eksportér træning til canvas                                | Læg den aktuelle træning ud på et Obsidian-canvas                  |
| Opret CSV-logfil                                            | Opret en tom log                                                   |
| Importer fra Strong eller Hevy                              | Tilføj sættene fra en Strong- eller Hevy-CSV-eksport til loggen    |
| Migrér øvelsestyper, Tilføj manglende ID'er til kodeblokke  | Vedligehold efter opgradering fra ældre versioner                  |

</details>

## Fejlfinding

- **Konflikt med Workout Block (`workout-block`).** Begge plugins registrerer `workout-log`-kodeblokke og bruger `workout_logs.csv` som standard filnavn til loggen. Deaktiver et af de to plugins, før du bruger det andet.

- **En tabel eller et diagram er tomt.** Tjek øvelsesnavnet og `dateRange` (diagrammer viser som standard de seneste 30 dage). Med `exactMatch: true` skal navnet passe præcist.
- **En øvelse mangler i heatmappet.** Dens side skal have muskel-`tags`, og den skal ligge i øvelsesmappen. Kropsvægts- og tidsbaserede øvelser vises kun under **Sæt** eller **Gentagelser**.
- **Logformularen spørger om gentagelser og vægt for en plank.** Angiv `exercise_type: timed` på øvelsessiden.
- **Timeren laver ingen lyd på min telefon.** Tryk på **Start** én gang; telefoner blokerer lyd, indtil du rører ved siden.

## Installation

### Fra community-plugins

1. Åbn **Indstillinger → Community-plugins**
2. Søg efter **Workout Planner**
3. Vælg **Installer**, og derefter **Aktiver**

### Manuelt

1. Download `main.js`, `manifest.json` og `styles.css` fra [seneste udgivelse](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Opret mappen `your-vault/.obsidian/plugins/workout-planner/`
3. Kopiér de downloadede filer til den mappe
4. Aktiver pluginet under **Indstillinger → Community-plugins**

## Support

Workout Planner er gratis og open source. Hvis det hjælper din træning, kan du [købe mig en kop kaffe](https://buymeacoffee.com/spatariurares). Har du fundet en fejl eller mangler noget? Åbn et [issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Alle sprog undtagen engelsk er maskinoversat, så nogle formuleringer kan lyde forkerte. Hvis dit sprog virker mærkeligt, er rettelser velkomne.

## Kreditering

Diagrammer bruger [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner er udgivet under [MIT-licensen](LICENSE).
