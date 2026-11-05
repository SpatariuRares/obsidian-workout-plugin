<img src="assets/logo.png" width="96" alt="Workout Planner-logo">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · Norsk bokmål · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Den alt-i-ett-treningsloggen for Obsidian.** Styrketrening, løping, sykling, yoga eller øvelser med egne felt: logg fra telefonen, følg en veiledet økt, og se fremgangen din i diagrammer, et dashbord og et muskelvarmekart. Én CSV-fil, 24 språk.

Laget for telefonen: logg hvert sett, løp eller positur mens du trener, og se deretter fremgangen din i tabeller, diagrammer og et dashbord, i de samme notatene der du planlegger treningen. Settene dine havner i én CSV-fil i hvelvet ditt. Ingen konto, ingen sky.

Diagrammene viser trenden din, muskelvarmekartet viser hva du har trent, og hvert sett beholder sin egen enhet, kg eller lb. Du kan hente ut settene dine med Dataview.

![Workout Planner på en telefon: et workout-sets-kort med to sett avkrysset og hviletimeren i gang, loggskjemaet med +/−-knapper og kg/lb-velger, og dashbordoppsummeringen med treningskalenderen](assets/hero.png)

## Funksjoner

- Logg sett med repetisjoner og vekt, forhåndsutfylt fra forrige sett, med +/−-knapper og nylige øvelser med ett trykk
- Logg hvert sett i kg eller lb, uansett hva skivene foran deg sier
- Merk sett med en protokoll: dropsett, myo-reps, hvilepause, superset, 21-ere, eller din egen
- Tabeller over settene dine, gruppert etter dag med dagstotaler, og redigerbare med ett trykk
- Dagens sett som rader du fyller ut på telefonen: kryss av et sett for å logge det, og hviletimeren starter (beta)
- Diagrammer for vekt, volum, repetisjoner, varighet, distanse, tempo og puls, og en trend som tydelig sier fra om du forbedrer deg
- Et dashbord med ukentlig serie (med ukentlig mål), en treningskalender, personlige rekorder, totalt volum, nylige treningsøkter og protokollstatistikk
- Et muskelvarmekart, forside og bakside, etter volum, sett eller repetisjoner
- Hviletimere (nedtelling, intervall, stoppeklokke) med forhåndsinnstillinger, som starter på nytt når du logger et sett, og som piper på iOS og Android
- En veiledet økt som går gjennom treningsnotatet én øvelse om gangen
- Et estimat på hvor lang tid en planlagt trening tar
- Styrke-, kroppsvekt-, tidsbaserte, distanse- og kardioøvelser, eller dine egne felt
- Hvert sett i én enkel CSV-fil, lesbar fra Dataview og Templater
- Laget for telefoner: ingen sidelengs scrolling, knappene alltid innen rekkevidde
- Tilgjengelig på 24 språk

## Komme i gang

Første gang du installerer plugin-en, legger den til eksempelnotater (eksempeløvelser, to treninger med seks uker med logger, et dashbord og en funksjonsoversikt), peker plugin-en mot dem og åpner veiledningen **Hvordan komme i gang**: én kort side per funksjon, med fungerende eksempler du kan prøve. Du trenger ikke åpne innstillingene. Utforsk gjerne litt før du setter opp dine egne.

### Den veiledede turen

Turen åpner et notat som heter "Veiledet tur", med en tabell, et diagram, et dashbord og en timer, og peker på hver av dem etter tur. Den har ni korte steg:

1. Logg ditt første sett med **+**-knappen. Steget er fullført når du lagrer det.
2. Rediger eller slett et sett med knappene på hver rad.
3. Se fremgangen din i diagrammet.
4. Se totaler og trender i dashbordet.
5. Se hvilke muskler du trente i muskelvarmekartet.
6. Start hviletimeren. Steget er fullført når du trykker på start.
7. Finn hantelikonet i båndet, som åpner loggskjemaet fra et hvilket som helst notat. På telefonen bruker du kommandopaletten i stedet.
8. Kjør en av kommandoene **Legg til trening** fra kommandopaletten. Steget er fullført når du gjør det.
9. Ferdig.

Bruk **Tilbake** og **Neste** for å bevege deg, eller **Hopp over** for å avslutte. Hvis delen av notatet turen peker på er utenfor synsfeltet, scroller **Vis meg** dit. Trykk `Esc` når som helst for å avslutte. Turen avsluttes også når du lukker notatet eller bytter til en annen fil. Ingenting går tapt: settene dine ligger fortsatt i loggen.

Når eksempeldataene er i bruk, kjører turen på dem. Ellers kjører den på din egen logg, slik at diagrammet og dashbordet starter nesten tomme. Notatet opprettes én gang, ved siden av eksemplene eller øverst i hvelvet. Et eksisterende notat blir aldri overskrevet, og du kan redigere eller slette det. Finnes det allerede et notat som heter "Veiledet tur" som ikke er turens eget, bruker turen "Veiledet tur 1" (eller neste ledige nummer) i stedet.

Vil du ta turen igjen? Velg **Følg guiden** under **Innstillinger → Workout Planner → Komme i gang**, eller kjør **Start guiden** fra kommandopaletten.

Vil du ha eksemplene eller veiledningen igjen? Velg **Opprett eksempler** eller **Åpne veiledning** under **Innstillinger → Workout Planner → Komme i gang**, eller kjør **Opprett eksempelnotater** eller **Åpne veiledning** fra kommandopaletten (`Ctrl/Cmd + P`). Å opprette eksemplene overskriver aldri noe: kjører du det på nytt, legges bare de manglende eksempelfilene til, og filer du har endret, blir som de er. Veiledningen tilbyr å opprette eksemplene hvis de ikke finnes ennå. En tom tabell, et tomt diagram eller et tomt dashbord har også en lenke, **Eller utforsk med eksempeldata**. Har du allerede en treningslogg, får eksemplene sin egen loggfil, og din forblir urørt.

For å legge til en tabell i et hvilket som helst notat, for eksempel `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Trykk **+** under tabellen, skriv inn repetisjoner og vekt, og lagre. Tabellen oppdateres av seg selv. Du trenger heller ikke skrive blokker for hånd: kommandoene **Legg til treningsdiagram**, **Legg til treningstabell**, **Legg til trenings-timer**, **Legg til treningsdashbord** og **Legg til treningsvarighet** åpner et skjema og setter inn blokken for deg.

## Logge sett

Åpne loggskjemaet med **+** under en tabell (øvelsen er fylt ut for deg), med hantelikonet i båndet, eller med kommandoen **Opprett treningslogg**. Skjemaet starter fra ditt siste sett, så de fleste ganger trykker du **+/−** én gang og lagrer. Ferdig før hvilen er over.

Skjemaet spør etter feltene som passer til øvelsen: repetisjoner og vekt for en knebøy, sekunder for en planke, distanse og tid for en løpetur (se [Øvelsestyper](#øvelsestyper)). Hvert sett kan også ha et notat og en protokoll, og protokollen vises som et merke i tabellen.

Vektfeltet har en kg/lb-velger, så du kan logge 225 lb selv om innstillingen din er kg. Tabellen viser settet som "225 lb"; diagrammer, statistikk og volum regner om alle sett til innstillingen din.

Når du logger et sett fra et notat, lagres notatets navn som settets **trening**, slik at en tabell eller et diagram med `workout: Push Day` finner settet senere.

## Tabeller

En `workout-log`-blokk viser settene til en øvelse eller en trening, nyeste først. Sett fra samme dag grupperes under en rad med dagens totaler, og hver rad har en redigeringsknapp. Slett et sett fra redigeringsskjemaet. På telefonen blir hvert sett til en kompakt rad uten sidelengs scrolling.

<img src="assets/tables.png" width="720" alt="En workout-log-tabell på telefonen, med sett gruppert etter dag med tid og et dropsett-merke, og loggskjemaet som åpnes med +-knappen">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Med `targetWeight` og `targetReps` vises et mål for progressiv overbelastning over tabellen.

<details>
<summary>Alle parametere</summary>

| Parameter                    | Standard | Hva den gjør                                              |
| ---------------------------- | -------- | --------------------------------------------------------- |
| `exercise`                   | —        | Bare denne øvelsen                                        |
| `workout`                    | —        | Bare denne treningen (notatnavnet)                        |
| `exactMatch`                 | `false`  | Samsvar med øvelsesnavnet eksakt                          |
| `dateRange`                  | alle     | I dag og de foregående N dagene                           |
| `limit`                      | `50`     | Maks antall rader; med `sets`, `sets × 2` (to treninger)  |
| `sortBy`                     | `date`   | `date`, `exercise`, `weight`, `reps` eller `volume`       |
| `sortOrder`                  | `desc`   | `asc` eller `desc`                                        |
| `columns`                    | alle     | Kolonner som vises, f.eks. `["date", "reps", "weight"]`   |
| `showProtocol`               | `true`   | Vis kolonnen med protokollmerker                          |
| `showAddButton`              | `true`   | Vis **+**-knappen                                         |
| `targetWeight`, `targetReps` | —        | Vis et mål for progressiv overbelastning over tabellen    |
| `sets`                       | —        | Planlagte sett, telt av en `workout-session`-blokk        |

Øvelsesnavn samsvarer løst som standard ("squat" finner "Squat (high bar)"). Legg til `exactMatch: true` for bare det nøyaktige navnet.

</details>

## Sett på telefonen (beta)

En `workout-sets`-blokk er laget for logging på treningsstudioet: dagens sett av én øvelse som rader du fyller ut. Hver rad viser hva du gjorde i samme sett sist, så du skriver bare inn det som er endret (et tomt felt logger den verdien) og krysser av raden. Settet havner i loggen, raden blir et logget sett, og hviletimeren øverst starter av seg selv. Pilen på et logget sett endrer protokollen og merknadene; krysser du av det igjen, tas settet tilbake, med **Angre** i noen sekunder.

<img src="assets/sets.png" alt="Et workout-sets-kort på telefonen: fire rader fylt ut med det de var sist, deretter to sett avkrysset med hviletimeren i gang, og deretter en rad åpnet for å velge protokollen hvilepause og legge til en merknad">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

Blokken er en beta-funksjon: slå på **Treningssett** under **Innstillinger → Funksjoner for beta-versjonen** (nye installasjoner har den på). Deretter skriver **Legg til treningssett** fra kommandopaletten en for deg, og ⋮-menyen redigerer den eller hviletimeren.

<details>
<summary>Alle parametere</summary>

| Parameter                    | Standard      | Hva den gjør                                                                                                                 |
| ---------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `exercise`                   | —             | Øvelsen (eksakt navn)                                                                                                        |
| `workout`                    | notatets navn | Treningen settene logges under                                                                                               |
| `sets`                       | som sist      | Rader å fylle ut (minst én); **Legg til sett** legger til flere                                                              |
| `targetWeight`, `targetReps` | —             | Hint når øvelsen aldri er gjort, og et mål for progressiv overbelastning                                                     |
| `rest`                       | —             | Sekunder med hvile etter hvert sett; `0` for ingen timer. Uten verdi: `workout-timer` i samme seksjon                        |
| `timer.*`                    | —             | Hviletimerens andre alternativer: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Diagrammer og trender

En `workout-chart`-blokk tegner ett mål over tid: vekt, volum, repetisjoner, estimert 1RM, varighet, distanse, tempo eller puls. Overskriften viser om trenden er **Økende**, **Stabil** eller **Synkende**. Stabil betyr at trendlinjen beveger seg mindre enn 5 % av gjennomsnittet over hele perioden, så en langsom, jevn økning teller fortsatt som økende. For tempo er lavere bedre, og en fallende linje vises som forbedring. På telefonen blir diagrammet en tabell med de samme verdiene.

Bruk `type: e1rm` for den beste daglige estimerte maksimalvekten for én repetisjon (Epley: `vekt × (1 + repetisjoner / 30)`). Bare positive vekter med heltallige repetisjoner fra 1 til 12 teller, og oppvarmings- og dropsett er utelatt. Dager uten kvalifiserte sett utelates. Estimatene følger kg/lb-innstillingen din. Standard styrkediagram er fortsatt volum.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API-et legger til `estimatedOneRepMax` i `getExerciseStats`: det beste estimatet i den konfigurerte vektenheten, eller `null` når ingen kvalifiserte sett finnes. Eksisterende PR-felt og CSV-kolonner er uendret.

![Et estimert 1RM-diagram for benkpress med stigende trendlinje på desktop, og de samme verdiene som tabell på telefonen](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Alle parametere</summary>

| Parameter       | Standard       | Hva den gjør                                                                |
| --------------- | -------------- | --------------------------------------------------------------------------- |
| `exercise`      | —              | Bare denne øvelsen                                                          |
| `workout`       | —              | Bare denne treningen                                                        |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` eller `heartRate` |
| `chartType`     | `exercise`     | Hvordan hvert dagspunkt bygges (under)                                      |
| `dateRange`     | `30`           | Dager som tas med                                                           |
| `limit`         | —              | Bare de siste N punktene                                                    |
| `showTrendLine` | `false`        | Tegn en trendlinje                                                          |
| `showStats`     | `true`         | Vis snitt, beste og laveste under diagrammet                                |
| `title`         | `Trend <type>` | Diagramtittel                                                               |
| `height`        | 4:3            | `300` (piksler) eller en hvilken som helst CSS-lengde, f.eks. `50vh`        |
| `exactMatch`    | `false`        | Samsvar med øvelsesnavnet eksakt                                            |

| `chartType` | Brukte sett                          | Hvert dagspunkt |
| ----------- | ------------------------------------ | --------------- |
| `exercise`  | sett av `exercise`                   | gjennomsnitt    |
| `workout`   | sett av `workout`                    | total           |
| `combined`  | sett av `exercise` innenfor `workout` | total          |
| `all`       | alle sett (filtre ignoreres)         | total           |

</details>

## Dashbord og muskelvarmekart

En `workout-dashboard`-blokk åpnes med fire tall: totalt antall treninger, ukentlig serie, totalt volum og personlige rekorder. Under dem får du hurtigstatistikk for uken, måneden og året, en volumtrend, nylige treningsøkter, protokollstatistikk, planlagt mot faktisk treningslengde og en treningskalender: et år med treningsdager, skyggelagt etter volum, med nåværende og beste serie. En uke teller mot serien når den har like mange treningsdager som ditt ukentlige mål (Innstillinger → Ukentlig mål, 1 som standard). På telefonen kommer hurtighandlingene først, og oppsummeringen er et rutenett på 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Dashbordet på telefonen: oppsummering, treningskalender med ukens mål oppnådd, nylige treninger og hurtigstatistikk">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

For å velge widgetene og rekkefølgen uten å skrive YAML, sett inn dashbordet med kommandoen **Legg til treningsdashbord**, eller åpne ⋮-menyen øverst til høyre i et innsatt dashbord og velg **Rediger dashbord**.

Sett **Oppsett** til **Rutenett** i det vinduet for å plassere hver widget selv, slik du flytter ting i et spill-inventar: dra en widget for å flytte den, dra hjørnet for å gjøre den bredere eller høyere, og slipp den under rutenettet for å fjerne den. Tastaturet fungerer også: piltastene flytter, Shift og piltastene endrer størrelse, og Delete fjerner en widget. Rutenettet har så mange kolonner som får plass i bredden på notatet ditt. I et smalere panel pakkes widgetene på nytt i lesrekkefølge, og på telefonen stables de. Oppsettet ditt beholdes: når notatet bare har plass til én kolonne (en telefon), spør vinduet hvor mange kolonner du vil redigere for, med utgangspunkt i de lagrede. Blokken beholder én linje per widget (kolonne, rad, bredde, høyde):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Varmekartet viser hvilke muskler du har trent de siste ukene, månedene eller året, forside og bakside, etter **Volum**, **Sett** eller **Repetisjoner**. Det er den raskeste måten å oppdage at du har hoppet over bena i tre uker. Under den advarer en kort treningsanalyse deg om ubalanser, for eksempel at forsiden jobber mye mer enn baksiden. Den leser muskeltaggene på [øvelsessidene](#øvelsestyper) dine. Kroppsvekt- og tidsbaserte øvelser har ingen vekt, så de lyser bare opp under Sett og Repetisjoner.

<img src="assets/heatmap.png" width="720" alt="Muskelvarmekart for uken på telefonen, forside og bakside: lår, sete og hamstrings trent, med treningsanalysen under">

<details>
<summary>Alle parametere</summary>

| Parameter             | Standard | Hva den gjør                                                                                                                                                                                                  |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —        | Overskrift over dashbordet                                                                                                                                                                                    |
| `dateRange`           | alle     | Bare sett fra de siste N dagene                                                                                                                                                                               |
| `widgets`             | alle     | Widgetene som vises, i denne rekkefølgen: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`   | `grid` plasserer hver widget i sine celler (se over)                                                                                                                                                          |
| `columns`             | —        | Rutenett: kolonnene rutenettet ble laget for                                                                                                                                                                  |
| `grid.<widget>`       | —        | Rutenett: kolonne, rad, bredde og høyde for den widgeten                                                                                                                                                      |
| `recentWorkoutsLimit` | `5`      | Treninger i listen over nylige                                                                                                                                                                                |
| `volumeTrendDays`     | `30`     | Dager i volumtrenddiagrammet                                                                                                                                                                                  |

</details>

<details>
<summary>Muskeltagger</summary>

Tagger kan være en liste, ett enkelt ord (`tags: chest`) eller en kommaseparert linje (`tags: chest, triceps`).

Brede grupper: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Spesifikke muskler har sitt eget område på kroppen og teller mot sin gruppe. En bred tagg fordeler seg over hele området: `chest` lyser alle tre delene av brystet litt, mens `upper_chest` lyser bare den øverste helt.

| Gruppe      | Spesifikke muskler                          |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (or `ql`) |
| `core`      | `obliques`, `serratus`                      |

Tagger på ditt eget språk, som `petto` eller `schiena`, fungerer også. Plugin-en knytter dem til gruppene over ved hjelp av `muscle-tags.csv`, ved siden av loggen din. Rediger den med **Administrer muskeltagger** (legg til, gi nytt navn, søk og finn duplikater), eller for hånd:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

En tagg som allerede er et gruppenavn (`upper_chest`, `Upper chest`, `upper-chest`) fungerer alltid, selv om `muscle-tags.csv` ikke lister den.

</details>

## Timere

En `workout-timer`-blokk er en nedtellings-, intervall- eller stoppeklokketimer. Lagre hviletidene dine som forhåndsinnstillinger. Knytt en timer til en øvelse eller en trening, så starter den på nytt hver gang du logger et sett, slik at du ikke trenger å røre den mellom settene. Med `autoStart: true` starter den så snart notatet åpnes.

<img src="assets/timers.png" width="320" alt="To timere på telefonen: en intervalltimer i hvilefasen og en Tabata-forhåndsinnstilling i arbeidsfasen av runde 2">

Den piper også på iOS og Android. Telefoner tillater bare lyd etter at du har trykket på siden, så en timer startet med `autoStart` forblir stille til du trykker **Start** én gang.

Under **Innstillinger → Workout Planner → Varsler for tidtakeren** er **Hold skjermen aktiv mens en timer kjører** på som standard. Den ber om at skjermen holdes aktiv mens minst én timer kjører i forgrunnen, der enheten tillater det. **Vibrer når en timer er ferdig** er av som standard og gir en kort puls ved null, uavhengig av lyd, på støttede enheter som Android. iOS beholder den eksisterende lydsignalen; vibrasjon i nettleseren er ikke tilgjengelig der. Disse funksjonene bruker nettleser-API-er etter beste evne og er ennå ikke verifisert på fysiske Android- og iOS-enheter. De gir ingen alarmer i bakgrunnen. En timer med en `id` fortsetter å gå når du bytter notat. Sett den på pause eller la den bli ferdig for å frigjøre skjermen.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

En intervalltimer kan veksle mellom arbeid og hvile. Visningen viser **Arbeid** eller **Hvile**, og hver fase starter med sin egen lyd. Hver runde er arbeid etterfulgt av hvile, den siste inkludert, så denne Tabata-en varer 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s arbeid, 10 s hvile, 8 runder) og `preset: EMOM` (en runde hvert minutt i 10 minutter) er innebygd. En lagret forhåndsinnstilling med samme navn erstatter dem.

<details>
<summary>Alle parametere</summary>

| Parameter             | Standard    | Hva den gjør                                                                |
| --------------------- | ----------- | --------------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` eller `stopwatch`                                   |
| `duration`            | `30`        | Sekunder (nedtelling; for intervall, arbeidet i hver runde)                 |
| `work`                | —           | Intervall: sekunder med arbeid per runde (erstatter `duration`)             |
| `rest`                | `0`         | Intervall: sekunder med hvile etter hver rundes arbeid                      |
| `rounds`              | `1`         | Runder (intervall)                                                          |
| `sound`               | `true`      | Pip når tiden er ute                                                        |
| `autoStart`           | `false`     | Start så snart notatet åpnes                                                |
| `showControls`        | `true`      | Vis start, pause og tilbakestilling                                         |
| `preset`              | —           | Start fra en forhåndsinnstilling (lagret, `Tabata` eller `EMOM`); parametere overstyrer den |
| `exercise`, `workout` | —           | Start timeren på nytt når du logger et sett for denne øvelsen eller treningen |
| `superset`            | `false`     | Bare canvas-eksport: tegn denne øvelsen og den neste som et superset        |

</details>

## Veiledet økt

En `workout-session`-blokk øverst i et treningsnotat (kommandoen **Sett inn veiledet økt**) fører deg gjennom treningen én øvelse om gangen: hvilket sett du er på, målet, hva du gjorde sist, en **Logg sett**-knapp og hviletimeren, som starter når du logger et sett.

![En veiledet økt på telefonen: sett 3 av 4 av squat med hvilen i gang på både økten og settkortet, loggskjemaet som åpnes av Logg sett, og deretter neste øvelse med hviletimeren i gang](assets/session.png)

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

Planen er selve notatet: hver `workout-log`- eller `workout-sets`-blokk med en `exercise` er ett steg, i den rekkefølgen de står, med sine `sets`, `targetReps` og `targetWeight`. Hvilen kommer fra `workout-sets`-blokkens egen `rest`, ellers fra `workout-timer` i samme `##`-seksjon (standardforhåndsinnstillingen uten en). Økten og settkortet deler én nedtelling. Økten teller settene du har logget i dag i denne treningen, så den fortsetter der du slapp når du åpner notatet igjen. En øvelse uten `sets` forblir aktuell til du logger et sett fra en senere øvelse. **Forrige** og **Neste** flytter fritt.

## Treningsvarighet

En `workout-duration`-blokk estimerer hvor lang tid et treningsnotat tar: hvilen fra timerne og tiden for hvert sett, ved siden av hvor lang din siste økt faktisk var.

<img src="assets/duration.png" width="420" alt="Kort med estimert varighet: hviletid, settid og siste økt">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` kan være en sti i hvelvet, en sti i forhold til dette notatet, eller bare notatets navn. Utelat den for å estimere det gjeldende notatet. Sekunder per repetisjon og per sett kommer fra [Innstillinger](#innstillinger).

## Øvelsestyper

En øvelsesside er et notat i øvelsesmappen din. Frontmatter forteller hva loggskjemaet skal spørre om, og hvilke muskler øvelsen trener. **Opprett øvelsesside** lager en for deg.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Loggskjemaet spør etter                      | Også akseptert                                               |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (standard) | repetisjoner, vekt                          | `bodyweight`, `weights`                                      |
| `timed`              | varighet                                     | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distanse, varighet (valgfritt)               | `running`, `run`                                             |
| `cardio`             | varighet, distanse og puls (valgfritt)       | —                                                            |
| `custom`             | bare feltene du lister under `parameters`    | —                                                            |

Yoga fungerer på samme måte: hver positur er en `timed`-øvelse, så skjemaet spør bare hvor lenge du holdt den. Eksempelnotatene inneholder en morgenyogaflyt med en veiledet økt.

![En yogaflyt på telefonen: den veiledede økten på Downward Dog, loggskjemaet som bare spør om varigheten av holdet, og settkortet med det første holdet logget](assets/yoga.png)

`type:` fungerer likt som `exercise_type:`. Legg til dine egne felt under `parameters`, for eksempel runder for hopptau:

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

Hvis du endrer typen på en øvelse etter at du har logget den, flytter **Konverter øvelse** de eksisterende settene over, og lar deg velge hvilket gammelt felt som havner hvor.

## Dataene dine

Hvert sett er én rad i `workout_logs.csv`, så du kan åpne den i et regneark, ta backup av den, eller synkronisere den som hvilken som helst annen fil.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Kolonner og redigering for hånd</summary>

| Kolonne                    | Betydning                           |
| -------------------------- | ----------------------------------- |
| `date`                     | Når settet ble logget (ISO 8601)    |
| `exercise`, `workout`      | Navn på øvelse og trening           |
| `reps`, `weight`, `volume` | Volum er repetisjoner × vekt        |
| `origine`                  | Lenke til notatet det ble logget fra |
| `timestamp`                | Unik ID for raden (millisekunder)   |
| `notes`, `protocol`        | Fritekst og treningsteknikk         |

Øvelsestyper med egne felt (`duration`, `distance`, `heartRate`, eller dine `parameters`) legger til kolonner på slutten. Den siste kolonnen, `weightUnit`, er `kg` eller `lb`: enheten for den radens `weight` og `volume`. En tom verdi betyr enheten i innstillingene.

Hvis du redigerer filen for hånd, behold overskriftsraden, og sett verdier som inneholder komma, anførselstegn eller linjeskift i doble anførselstegn. Notater som begynner med `=`, `+`, `-` eller `@` lagres med en innledende `'`, slik at regneark ikke kjører dem som formler. Plugin-en skjuler den igjen.

</details>

Alt blir i hvelvet ditt. Plugin-en skriver til utklippstavlen bare når du klikker på et kopimerke (en muskeltagg i dashbordet), og den leser den aldri.

### Dataview og Templater

Plugin-en eksponerer `WorkoutPlannerAPI` (også `window.WorkoutPlannerAPI`) når den er lastet.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>API-referanse og flere eksempler</summary>

| Metode                       | Returnerer                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Sett, hver med `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` og `volume` er i innstillingsenheten; `enteredWeight` og `enteredUnit` er det som ble logget                                    |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Øvelsesnavn, sortert: filnavnene på øvelsessidene dine (undermapper inkludert), eller navnene i loggen når du ikke har øvelsessider. `{ tag: "chest" }` beholder øvelsene der siden har den taggen, så resultatet er tomt uten øvelsessider. |

`getWorkoutLogs` godtar `exercise` (delvis, uavhengig av store og små bokstaver), `workout`, `dateRange: { start, end }`, `protocol` og `exactMatch`.

Nylige knebøy, i Dataview:

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

I en [Templater](https://github.com/SilentVoid13/Templater)-mal, for å starte et notat med de siste tallene dine:

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

## Innstillinger

Angi mappene for CSV og øvelser, standard vektenhet, vektsteget for **+/−**-knappene, timer-forhåndsinnstillinger, dine egne protokoller (navn, kort etikett og farge), og sekunder per repetisjon og per sett som brukes av varighetsestimatet. **Kjør alt** under Avansert kjører alle vedlikeholdsoppgaver etter en oppgradering.

Å endre vektenheten endrer ikke etiketten på gamle sett: hvert sett beholder enheten det ble logget i.

<details>
<summary>Alle kommandoer</summary>

Åpne kommandopaletten (`Ctrl/Cmd + P`) og skriv inn navnet.

| Kommando                                                    | Hva den gjør                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Opprett treningslogg                                        | Logg et sett                                                       |
| Start guiden                                                | Ta den veiledede turen                                             |
| Opprett eksempelnotater                                     | Legg til eksempeløvelser, treninger, logger og et dashbord         |
| Åpne veiledning                                             | Åpne veiledningen i eksemplene                                     |
| Legg til treningsdiagram / treningstabell / timer / dashbord / varighet | Sett inn en blokk gjennom et skjema                    |
| Opprett øvelsesside                                         | Ny øvelsesside med type og tagger                                  |
| Opprett øvelsesseksjon                                      | Legg til en overskrift, timer og tabell for en øvelse i gjeldende notat |
| Legg til øvelsesblokk                                       | Sett inn en øvelsesblokk, med autofullfør for navn                 |
| Konverter øvelse                                            | Flytt en øvelses sett til en annen øvelsestype                     |
| Administrer muskeltagger                                    | Rediger `muscle-tags.csv`                                          |
| Generer tag-oversikt                                        | Lag et notat som lister hver muskeltagg                            |
| Gå gjennom øvelsesnavn                                      | Finn samme øvelse logget under ulike stavemåter                    |
| Eksporter økt til canvas                                    | Legg ut gjeldende trening på et Obsidian-canvas                    |
| Opprett CSV-loggfil                                         | Lag en tom logg                                                    |
| Importer fra Strong eller Hevy                              | Legg til settene i en Strong- eller Hevy-CSV-eksport i loggen      |
| Migrer øvelsestyper, Legg til manglende ID-er i kodeblokker | Vedlikehold etter oppgradering fra eldre versjoner                 |

</details>

## Feilsøking

- **Konflikt med Workout Block (`workout-block`).** Begge plugin-ene registrerer `workout-log`-kodeblokker og bruker `workout_logs.csv` som standard navn på loggfilen. Deaktiver en av de to pluginene før du bruker den andre.

- **En tabell eller et diagram er tomt.** Sjekk øvelsesnavnet og `dateRange` (diagrammer viser de siste 30 dagene som standard). Med `exactMatch: true` må navnet samsvare eksakt.
- **En øvelse mangler i varmekartet.** Siden må ha muskel-`tags` og ligge i øvelsesmappen. Kroppsvekt- og tidsbaserte øvelser vises bare under **Sett** eller **Repetisjoner**.
- **Loggskjemaet spør om repetisjoner og vekt for en planke.** Sett `exercise_type: timed` på øvelsessiden.
- **Timeren gir ingen lyd på telefonen min.** Trykk på **Start** én gang. Telefoner blokkerer lyd til du berører siden.

## Installasjon

### Fra community-plugins

1. Åpne **Innstillinger → Fellesskapsplugins**
2. Søk etter **Workout Planner**
3. Velg **Installer**, og deretter **Aktiver**

### Manuelt

1. Last ned `main.js`, `manifest.json` og `styles.css` fra den [nyeste utgivelsen](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Opprett mappen `your-vault/.obsidian/plugins/workout-planner/`
3. Kopier de nedlastede filene inn i den mappen
4. Aktiver plugin-en under **Innstillinger → Fellesskapsplugins**

## Støtte

Workout Planner er gratis og åpen kildekode. Hvis den hjelper treningen din, kan du [kjøpe meg en kaffe](https://buymeacoffee.com/spatariurares). Fant du en feil, eller mangler noe? Åpne en [sak](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Alle språk unntatt engelsk er maskinoversatt, så noen fraser kan høres rart ut. Hvis ditt gjør det, er rettelser velkomne.

## Kreditering

Diagrammer bruker [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner er utgitt under [MIT-lisensen](LICENSE).
