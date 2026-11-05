<img src="assets/logo.png" width="96" alt="Logoja e Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · Shqip · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Gjurmuesi i stërvitjes më i plotë për Obsidian.** Peshëngritje, vrapim, çiklizëm, yoga ose ushtrime me fushat tuaja: regjistroni nga telefoni, ndiqni një seancë të udhëzuar dhe shihni progresin tuaj në grafikë, panel dhe hartë termike të muskujve. Një CSV, 24 gjuhë.

I ndërtuar për telefonin tuaj: regjistroni çdo seri, vrapim ose pozë ndërsa stërviteni, pastaj ndiqni progresin tuaj në tabela, grafikë dhe panel brenda të njëjtave shënime ku planifikoni stërvitjen. Seritë tuaja shkojnë në një skedar CSV në vault-in tuaj. Pa llogari, pa cloud.

Grafikët tregojnë tendencën tuaj, harta termike e muskujve tregon çfarë keni stërvitur, dhe çdo seri mban njësinë e vet kg/lb. Mund t'i kërkoni seritë tuaja nga Dataview.

![Workout Planner në telefon: një bllok workout-sets me dy seri të shënuara dhe timerin e pushimit në punë, formulari i regjistrimit me butonat +/− dhe zgjedhësin kg/lb, dhe përmbledhja e panelit me kalendarin e stërvitjes](assets/hero.png)

## Veçoritë

- Regjistro seritë me përsëritje dhe peshë, të plotësuara nga seria jote e fundit, me butonat +/− dhe ushtrime të fundit me një prekje
- Regjistro çdo seri në kg ose lb, çfarëdo që tregojnë diskat para teje
- Shëno serinë me një protokoll: drop set, myo-reps, rest-pause, superset, 21s, ose protokollin tënd
- Tabela të serive të tua, të grupuara sipas ditës me totalet ditore, të redaktueshme me një prekje
- Seritë e sotme si rreshta për t'i plotësuar në telefon: shëno një rresht për ta regjistruar, dhe timeri i pushimit nis vetë
- Grafikë për peshën, volumin, përsëritjet, kohëzgjatjen, distancën, ritmin dhe rrahjet e zemrës, dhe një tendencë që të tregon qartë nëse po përmirësohesh
- Një panel me serinë javore (me objektiv javor), kalendar stërvitjesh, rekorde personale, volum total, stërvitje të fundit dhe statistika protokollesh
- Një hartë termike e muskujve, para dhe prapa, sipas volumit, serive ose përsëritjeve
- Timera pushimi (numërim mbrapsht, intervale, kronometër) me paracaktime, që rinisin kur regjistron një seri dhe bien zë në iOS dhe Android
- Një seancë e udhëzuar që të kalon nëpër shënimin e stërvitjes një ushtrim në herë
- Vlerësim se sa zgjat një stërvitje e planifikuar
- Ushtrime force, me peshën e trupit, me kohë, me distancë dhe kardio, ose fusha të tua
- Çdo seri në një CSV të thjeshtë, të lexueshëm nga Dataview dhe Templater
- Ndërtuar për telefona: pa lëvizje horizontale, butonat gjithmonë në dorë
- E disponueshme në 24 gjuhë

## Fillimi

Herën e parë që instaloni plugin-in, ai shton shënime shembull (ushtrime shembull, dy stërvitje me gjashtë javë regjistrime, një panel dhe një shfaqje të veçorive), e drejton plugin-in drejt tyre dhe hap udhëzuesin **Fillimi**: një faqe e shkurtër për çdo veçori, me shembuj funksionues që mund t'i provoni. Nuk keni nevojë të hapni cilësimet. Shikoni rreth para se të konfiguroni të tuat.

### Tura udhëzuese

Tura hap një shënim **Tur udhëzues** me një tabelë, një grafik, një panel dhe një timer, dhe tregon secilin në radhë. Ka nëntë hapa të shkurtër:

1. Regjistro serinë tënde të parë me butonin **+**. Hapi përfundon kur e ruan.
2. Redakto ose fshi një seri me butonat në çdo rresht.
3. Shiko progresin tënd në grafik.
4. Shiko totalet dhe tendencat në panel.
5. Shiko cilët muskuj i ke stërvitur në hartën termike të muskujve.
6. Nis timerin e pushimit. Hapi përfundon kur shtyp **Nis**.
7. Gjej ikonën e shtangës në shiritin anësor, që hap formularin e regjistrimit nga çdo shënim. Në telefon, përdor paletën e komandave.
8. Ekzekuto një komandë **Shto ... stërvitjeje** nga paleta e komandave. Hapi përfundon kur e bën.
9. Përfundoi.

Përdor **Prapa** dhe **Tjetra** për të lëvizur, ose **Kalo** për të dalë. Nëse pjesa e shënimit ku tregon tura është jashtë pamjes, **Më tregoni** të çon atje. Shtyp `Esc` në çdo kohë për ta mbyllur. Tura mbyllet gjithashtu kur e mbyll shënimin ose kalon në një skedar tjetër. Asgjë nuk humbet: seritë e tua mbeten në regjistër.

Kur përdoren të dhënat shembull, tura punon mbi to. Përndryshe punon mbi regjistrin tënd, kështu që grafiku dhe paneli fillojnë pothuajse bosh. Shënimi krijohet një herë, pranë shembujve ose në krye të vault-it tënd. Një shënim ekzistues nuk shkruhet kurrë mbi, dhe ti mund ta redaktosh ose fshish. Nëse ekziston tashmë një shënim me emrin "Tur udhëzues" që nuk është i turit, tura përdor "Tur udhëzues 1" (ose numrin e radhës së lirë) në vend të tij.

Dëshiron ta bësh turin përsëri? Zgjidh **Fillo turin** te **Cilësimet → Workout Planner → Fillimi**, ose ekzekuto **Fillo turin** nga paleta e komandave.

Dëshiron shembujt ose udhëzuesin përsëri? Zgjidh **Krijo shembuj** ose **Hap udhëzuesin e fillimit** te **Cilësimet → Workout Planner → Fillimi**, ose ekzekuto **Krijo nota të shembullore** ose **Hap udhëzuesin e fillimit** nga paleta e komandave (`Ctrl/Cmd + P`). Krijimi i shembujve nuk shkruan kurrë mbi asgjë: ekzekutimi përsëri shton vetëm skedarët e shembujve që mungojnë, dhe skedarët që ke ndryshuar mbeten ashtu siç janë. Udhëzuesi të ofron të krijosh shembujt nëse nuk ekzistojnë ende. Një tabelë, grafik ose panel bosh ka gjithashtu një lidhje **Ose eksploro me të dhëna shembull**. Nëse ke tashmë një regjistër stërvitjesh, shembujt marrin skedarin e tyre të regjistrit dhe i yti mbetet i paprekur.

Për të shtuar një tabelë në çdo shënim, për shembull `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Shtyp **+** nën tabelë, fut përsëritjet dhe peshën, dhe ruaje. Tabela përditësohet vetvetiu. As nuk duhet t'i shkruash blloqet me dorë: komandat **Shto grafik / tabelë / timer / panel / kohëzgjatje stërvitjeje** hapin një formular dhe e fusin bllokun për ty.

## Regjistrimi i serive

Hap formularin e regjistrimit me **+** nën një tabelë (ushtrimi plotësohet vetë), me ikonën e shtangës në shiritin anësor, ose me komandën **Krijo regjistrim stërvitjeje**. Formulari fillon nga seria jote e fundit, kështu që shumicën e herëve shtyp **+/−** një herë dhe e ruan. Mbaroje përpara se të mbarojë pushimi yt.

Formulari kërkon fushat që i përshtaten ushtrimit: përsëritje dhe peshë për një squat, sekonda për një plank, distancë dhe kohë për një vrapim (shih [Llojet e ushtrimeve](#llojet-e-ushtrimeve)). Çdo seri mund të mbajë edhe një shënim dhe një protokoll, që shfaqet si distinktiv në tabelë.

Fusha e peshës ka një zgjedhës kg/lb, kështu që mund të regjistrosh 225 lb edhe nëse cilësimi yt është kg. Tabela e shfaq atë seri si "225 lb"; grafikët, statistikat dhe volumi e konvertojnë çdo seri në cilësimin tënd.

Kur regjistron një seri nga një shënim, emri i shënimit ruhet si **stërvitja** e serisë, kështu që një tabelë ose grafik me `workout: Push Day` e gjen më vonë.

## Tabelat

Një bllok `workout-log` shfaq serite e një ushtrimi ose stërvitjeje, më të rejat e para. Seritë e së njëjtës ditë grupohen nën një rresht me totalet e asaj dite, dhe çdo rresht ka një buton redaktimi; fshije një seri nga formulari i redaktimit. Në telefon, çdo seri bëhet një rresht kompakt, pa lëvizje horizontale.

<img src="assets/tables.png" width="720" alt="Një tabelë workout-log në telefon, seritë e grupuara sipas ditës me kohën e tyre dhe një distinktiv drop-set, dhe formulari i regjistrimit që hap butoni i tij +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Me `targetWeight` dhe `targetReps`, mbi tabelë shfaqet një objektiv i mbingarkesës progresive.

<details>
<summary>Të gjitha parametrat</summary>

| Parametri                    | Parazgjedhja | Çfarë bën                                          |
| ---------------------------- | ------------ | -------------------------------------------------- |
| `exercise`                   | —            | Vetëm ky ushtrim                                   |
| `workout`                    | —            | Vetëm kjo stërvitje (emri i shënimit)              |
| `exactMatch`                 | `false`      | Përputhet emri i ushtrimit saktësisht              |
| `dateRange`                  | të gjitha    | Sot dhe N ditët e mëparshme                        |
| `limit`                      | `50`         | Numri maksimal i rreshtave; me `sets`, `sets × 2` (dy stërvitje) |
| `sortBy`                     | `date`       | `date`, `exercise`, `weight`, `reps` ose `volume`  |
| `sortOrder`                  | `desc`       | `asc` ose `desc`                                   |
| `columns`                    | të gjitha    | Kolonat për t'u shfaqur, p.sh. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`       | Shfaq kolonën e distinktivit të protokollit        |
| `showAddButton`              | `true`       | Shfaq butonin **+**                                |
| `targetWeight`, `targetReps` | —            | Shfaq një objektiv mbingarkese progresive mbi tabelë |
| `sets`                       | —            | Seritë e planifikuara, të numëruara nga një bllok `workout-session` |

Emrat e ushtrimeve përputhen me lirshmëri si parazgjedhje ("squat" gjen "Squat (high bar)"); shto `exactMatch: true` për vetëm atë emër të saktë.

</details>

## Seritë në telefonin tuaj

Një bllok `workout-sets` është bërë për regjistrim në palestër: seritë e sotme të një ushtrimi si rreshta për t'i plotësuar. Çdo rresht tregon çfarë bëre në të njëjtën seri herën e fundit, kështu që shkruan vetëm atë që ka ndryshuar (një fushë bosh regjistron vlerën e saj) dhe shënon rreshtin. Seria shkon në regjistër, rreshti bëhet seri e regjistruar, dhe timeri i pushimit në krye nis vetvetiu. Shigjeta e një serie të regjistruar ndryshon protokollin dhe shënimet e saj; shënimi sërish e heq, me **Zhbëj** për disa sekonda.

<img src="assets/sets.png" alt="Një bllok workout-sets në telefon: katër rreshta të plotësuar me vlerat e herës së fundit, pastaj dy seri të shënuara me timerin e pushimit në punë, pastaj një rresht i hapur për të zgjedhur protokollin rest-pause dhe për të shtuar një shënim">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Shto seritë e stërvitjes** nga paleta e komandave e shkruan një për ty, dhe menyja ⋮ e redakton ose timerin e tij të pushimit.

<details>
<summary>Të gjitha parametrat</summary>

| Parametri                    | Parazgjedhja  | Çfarë bën                                                                                        |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | Ushtrimi (emri i saktë)                                                                          |
| `workout`                    | emri i shënimit | Stërvitja nën të cilën regjistrohen seritë                                                     |
| `sets`                       | si herën e fundit | Rreshta për t'i plotësuar (të paktën një); **Shto seri** shton të tjera                      |
| `targetWeight`, `targetReps` | —             | Sugjerime kur ushtrimi nuk është bërë kurrë, dhe një objektiv për progresin e ngarkesës           |
| `rest`                       | —             | Sekonda pushimi pas çdo serie; `0` për pa timer. Pa vlerë: `workout-timer` i të njëjtit seksion |
| `timer.*`                    | —             | Opsionet e tjera të timerit të pushimit: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Grafikët dhe tendencat

Një bllok `workout-chart` vizaton një masë në kohë: peshën, volumin, përsëritjet, 1RM-in e vlerësuar, kohëzgjatjen, distancën, ritmin ose rrahjet e zemrës. Titulli tregon nëse tendenca është **Në rritje**, **Stabil** ose **Në rënie**. Stabil do të thotë se vija e tendencës lëviz më pak se 5% të mesatares gjatë gjithë periudhës, kështu që një përparim i ngadaltë por i qëndrueshëm ende numërohet si në rritje. Për ritmin, më ulët është më mirë, dhe një vijë që bie shfaqet si përmirësim. Në telefon, grafiku bëhet tabelë me të njëjtat vlera.

Përdor `type: e1rm` për 1RM-in e vlerësuar më të mirë ditor (Epley: `weight × (1 + reps / 30)`). Vetëm peshat pozitive me përsëritje të plota nga 1 deri në 12 numërohen; seritë e ngrohjes dhe drop sets përjashtohen. Ditët pa seri të përshtatshme hiqen. Vlerësimet ndjekin cilësimin tënd kg/lb. Grafiku i parazgjedhur i forcës mbetet volumi.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API shton `estimatedOneRepMax` te `getExerciseStats`: vlerësimin më të mirë në njësinë e konfiguruar të peshës, ose `null` kur nuk ekziston asnjë seri e përshtatshme. Fushat ekzistuese të PR dhe kolonat e CSV mbeten të pandryshuara.

![Grafik i 1RM-it të vlerësuar për shtypjen me bankë, me vijën e tendencës në rritje në desktop, dhe të njëjtat vlera si tabelë në telefon](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Të gjitha parametrat</summary>

| Parametri       | Parazgjedhja   | Çfarë bën                                                                 |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Vetëm ky ushtrim                                                          |
| `workout`       | —              | Vetëm kjo stërvitje                                                       |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` ose `heartRate` |
| `chartType`     | `exercise`     | Si ndërtohet pika e çdo dite (më poshtë)                                  |
| `dateRange`     | `30`           | Ditët për t'u përfshirë                                                   |
| `limit`         | —              | Vetëm N pikat e fundit                                                    |
| `showTrendLine` | `false`        | Vizato një vijë tendence                                                  |
| `showStats`     | `true`         | Shfaq mesataren, më të mirën dhe më të ulëtën nën grafik                  |
| `title`         | `Tendenca <type>` | Titulli i grafikut                                                     |
| `height`        | 4:3            | `300` (piksel) ose çdo gjatësi CSS si `50vh`                              |
| `exactMatch`    | `false`        | Përputhet emri i ushtrimit saktësisht                                     |

| `chartType` | Seritë e përdorura                  | Pika e çdo dite  |
| ----------- | ----------------------------------- | ---------------- |
| `exercise`  | serite e `exercise`                 | mesatare         |
| `workout`   | serite e `workout`                  | total            |
| `combined`  | serite e `exercise` brenda `workout` | total           |
| `all`       | çdo seri (filtrat injorohen)        | total            |

</details>

## Paneli dhe harta termike e muskujve

Një bllok `workout-dashboard` hapet me katër numra: numri total i stërvitjeve, seria javore, volumi total dhe rekordet personale. Më poshtë ka statistika të shpejta për javën, muajin dhe vitin, një tendencë volumi, stërvitjet e fundit, statistika protokollesh, gjatësinë e planifikuar kundrejt asaj reale të stërvitjes dhe një kalendar stërvitjesh: një vit ditësh stërvitjeje, të nuancuara sipas volumit, me serinë aktuale dhe më të mirën. Një javë numërohet për serinë sapo ka ditët e stërvitjes të objektivit tënd javor (**Cilësimet → Objektivi javor**, 1 si parazgjedhje). Në telefon, veprimet e shpejta vijnë të parat dhe përmbledhja është një rrjetë 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Paneli në telefon: përmbledhja, kalendari i stërvitjes me objektivin e kësaj jave të arritur, stërvitjet e fundit dhe statistikat e shpejta">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Për të zgjedhur widget-et dhe radhën e tyre pa shkruar YAML, shto panelin me komandën **Shto panel stërvitjeje**, ose hap menynë ⋮ në krye djathtas të një paneli të shtuar dhe zgjidh **Redakto panelin**.

Vendos **Paraqitjen** në **Rrjetë** në atë dritare për të vendosur çdo widget vetë, si sende në një inventar: tërhiq një widget për ta lëvizur, tërhiq cepin e tij për ta bërë më të gjerë ose më të lartë, dhe lësho nën rrjetë për ta hequr. Tastiera funksionon gjithashtu: shigjetat lëvizin, Shift dhe shigjetat ndryshojnë madhësinë, Delete e heq widget-in. Rrjeta ka aq kolona sa i përshtaten gjerësisë së shënimit tënd; në një panel më të ngushtë, widget-et riorganizohen sipas rendit të leximit, dhe në telefon vendosen njëri nën tjetrin. Paraqitja jote ruhet: kur shënimi përshtatet vetëm me një kolonë (telefon), dritarja pyet sa kolona të redaktohen, duke filluar nga ato të ruajtura. Blloku mban një rresht për çdo widget (kolona, rreshti, gjerësia, lartësia):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Harta termike tregon cilët muskuj ke stërvitur gjatë javës, muajit ose vitit të fundit, para dhe prapa, sipas **Volumit**, **Serive** ose **Përsëritjeve**. Është mënyra më e shpejtë për të vërejtur që ke lënë pas këmbët tre javë. Poshtë saj, një analizë e shkurtër stërvitjeje të paralajmëron për çekuilibra, si një pjesë e përparme që punon shumë më tepër se ajo e prapme. Ajo lexon etiketat e muskujve nga [faqet e tua të ushtrimeve](#llojet-e-ushtrimeve). Ushtrimet me peshën e trupit dhe ato me kohë nuk kanë peshë, kështu që ndriçohen vetëm te Seritë dhe Përsëritjet.

<img src="assets/heatmap.png" width="720" alt="Harta termike e muskujve për javën në telefon, para dhe prapa: kuadricepset, glutet dhe ishiokrurale të stërvitura, me analizën e stërvitjes më poshtë">

<details>
<summary>Të gjitha parametrat</summary>

| Parametri             | Parazgjedhja | Çfarë bën                                                                                                                                                                                                   |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —            | Titulli mbi panelin                                                                                                                                                                                         |
| `dateRange`           | të gjitha    | Vetëm seritë e N ditëve të fundit                                                                                                                                                                           |
| `widgets`             | të gjitha    | Widget-et për t'u shfaqur, në këtë rend: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`       | `grid` vendos çdo widget në qelizat e vet (shih më sipër)                                                                                                                                                  |
| `columns`             | —            | Rrjeta: kolonat për të cilat u bë rrjeta                                                                                                                                                                    |
| `grid.<widget>`       | —            | Rrjeta: kolona, rreshti, gjerësia dhe lartësia e atij widget-i                                                                                                                                              |
| `recentWorkoutsLimit` | `5`          | Stërvitjet në listën e fundit                                                                                                                                                                               |
| `volumeTrendDays`     | `30`         | Ditët në grafikun e tendencës së volumit                                                                                                                                                                    |

</details>

<details>
<summary>Etiketat e muskujve</summary>

Etiketat mund të jenë një listë, një fjalë e vetme (`tags: chest`) ose një rresht i ndarë me presje (`tags: chest, triceps`).

Grupet e gjera: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Muskujt specifikë kanë zonën e tyre të trupit dhe numërohen te grupi i tyre. Një etiketë e gjerë shtrihet mbi të gjithë zonën: `chest` ndriçon pak të tri pjesët e gjoksit, ndërsa `upper_chest` ndriçon plotësisht vetëm të sipërmen.

| Grupi       | Muskujt specifikë                           |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (ose `ql`) |
| `core`      | `obliques`, `serratus`                      |

Etiketat në gjuhën tënde, si `petto` ose `schiena`, funksionojnë gjithashtu. Plugin-i i përshtat me grupet e mësipërme duke përdorur `muscle-tags.csv`, pranë regjistrit tënd. Redakto atë me **Menaxho etiketat e muskujve** (shto, riemërto, kërko, gjej dublikatet) ose me dorë:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Një etiketë që është tashmë emër grupi (`upper_chest`, `Upper chest`, `upper-chest`) funksionon gjithmonë, edhe nëse `muscle-tags.csv` nuk e liston.

</details>

## Timerët

Një bllok `workout-timer` është një timer numërimi mbrapsht, intervali ose kronometër. Ruaj pushimet e tua të zakonshme si paracaktime. Lidh një timer me një ushtrim ose stërvitje dhe ai rinis çdo herë që regjistron një seri, kështu që nuk duhet ta prekësh midis serive. Me `autoStart: true` fillon sapo hapet shënimi.

<img src="assets/timers.png" width="320" alt="Dy timerë në telefon: një timer intervali në fazën e pushimit dhe një paracaktim Tabata në fazën e punës të raundit 2">

Bie zë edhe në iOS dhe Android. Telefonat lejojnë zërin vetëm pasi ke prekur faqen, kështu që një timer i nisur nga `autoStart` mbetet pa zë derisa ta prekësh **Nis** një herë.

Te **Cilësimet → Workout Planner → Sinjalet e timerit në pajisje**, **Mbaje ekranin aktiv ndërsa punon një timer** është e aktivizuar si parazgjedhje. Kërkon mbrojtjen e ekranit ndërsa të paktën një timer punon në plan, aty ku pajisja e lejon. **Vibrim kur një timer përfundojë** është i çaktivizuar si parazgjedhje dhe shton një puls të shkurtër në zero, veçmas nga zëri, në pajisjet e mbështetura si Android. iOS e mban sinjalin ekzistues zanor; vibrimi në web nuk është i disponueshëm atje. Këto veçori përdorin API-të e shfletuesit me përpjekje sa më të mirë dhe nuk janë verifikuar ende në pajisje reale Android/iOS. Ato nuk ofrojnë alarme në sfond. Një timer me `id` vazhdon të punojë kur ndryshon shënimet; pauzoje ose lëre të mbarojë për të lëshuar mbrojtjen e ekranit.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Një timer intervali mund të alternojë punën dhe pushimin. Ekrani shfaq **Punë** ose **Pushim**, dhe çdo fazë fillon me tingullin e vet. Çdo raund është puna e tij e ndjekur nga pushimi, edhe i fundit, kështu që ky Tabata zgjat 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s punë, 10 s pushim, 8 raunde) dhe `preset: EMOM` (një raund çdo minutë për 10 minuta) janë të integruara. Një paracaktim i ruajtur me të njëjtin emër i zëvendëson ato.

<details>
<summary>Të gjitha parametrat</summary>

| Parametri             | Parazgjedhja | Çfarë bën                                                             |
| --------------------- | ------------ | --------------------------------------------------------------------- |
| `type`                | `countdown`  | `countdown`, `interval` ose `stopwatch`                               |
| `duration`            | `30`         | Sekonda (numërim mbrapsht; për intervalin, puna e çdo raundi)         |
| `work`                | —            | Intervali: sekonda pune për raund (zëvendëson `duration`)             |
| `rest`                | `0`          | Intervali: sekonda pushimi pas punës së çdo raundi                    |
| `rounds`              | `1`          | Raundet (interval)                                                    |
| `sound`               | `true`       | Sinjal kur mbaron koha                                                |
| `autoStart`           | `false`      | Fillon sapo hapet shënimi                                             |
| `showControls`        | `true`       | Shfaq nisjen, pauzën dhe rivendosjen                                  |
| `preset`              | —            | Fillon nga një paracaktim (i ruajtur, `Tabata` ose `EMOM`); parametrat e mbivendosin atë |
| `exercise`, `workout` | —            | Rinis timerin kur regjistron një seri për këtë ushtrim ose stërvitje  |
| `superset`            | `false`      | Vetëm eksportimi në canvas: vizaton këtë ushtrim dhe të radhës si superset |

</details>

## Seanca e udhëzuar

Një bllok `workout-session` në krye të një shënimi stërvitjeje (komanda **Fut seancë të udhëzuar**) të udhëzon nëpër të një ushtrim në herë: cilën seri je duke bërë, objektivin, çfarë bëre herën e kaluar, një buton **Regjistro serinë** dhe timerin e pushimit, që nis kur regjistron një seri.

![Një seancë e udhëzuar në telefon: seria 3 nga 4 e squat me pushimin që po numërohet te seanca dhe te blloku i serive, formulari i regjistrimit i hapur nga Regjistro serinë, dhe më pas ushtrimi tjetër me timerin e pushimit në punë](assets/session.png)

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

Plani është vetë shënimi: çdo bllok `workout-log` ose `workout-sets` me një `exercise` është një hap, sipas radhës ku shfaqen, me `sets`, `targetReps` dhe `targetWeight` të tij. Pushimi vjen nga `rest` i blokut `workout-sets`, ose nga `workout-timer` në të njëjtën seksion `##` (paracaktimi i parazgjedhur nëse nuk ka një të tillë). Seanca dhe blloku i serive ndajnë një numërim të vetëm. Seanca numëron seritë që ke regjistruar sot në këtë stërvitje, kështu që vazhdon nga aty ku e le kur e rihap shënimin. Një ushtrim pa `sets` mbetet aktual derisa të regjistrosh një seri të një ushtrimi të mëvonshëm; **E mëparshme** dhe **Tjetra** lëvizin lirshëm.

## Kohëzgjatja e stërvitjes

Një bllok `workout-duration` vlerëson sa zgjat një shënim stërvitjeje: pushimet nga timerët e tij plus koha për çdo seri, pranë asaj sa zgjati realisht seanca jote e fundit.

<img src="assets/duration.png" width="420" alt="Kartë e kohëzgjatjes së vlerësuar me kohën e pushimit, kohën për seri dhe seancën e fundit">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` mund të jetë një shteg në vault, një shteg relativ me këtë shënim, ose thjesht emri i shënimit; lëre jashtë për të vlerësuar shënimin aktual. Sekondat për përsëritje dhe për seri vijnë nga [Cilësimet](#cilësimet).

## Llojet e ushtrimeve

Një faqe ushtrimi është një shënim në dosjen tënde të ushtrimeve. Frontmatter-i i tij thotë çfarë duhet të kërkojë formulari i regjistrimit dhe cilët muskuj stërvit ushtrimi. **Krijo faqe ushtrimi** krijon një për ty.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Formulari kërkon                             | Gjithashtu pranohet                                          |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (parazgjedhur) | përsëritje, peshë                       | `bodyweight`, `weights`                                      |
| `timed`              | kohëzgjatje                                  | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distancë, kohëzgjatje (opsionale)            | `running`, `run`                                             |
| `cardio`             | kohëzgjatje, distancë dhe rrahje zemre (opsionale) | —                                                      |
| `custom`             | vetëm fushat që liston nën `parameters`      | —                                                            |

Yoga funksionon në të njëjtën mënyrë: çdo pozë është një ushtrim `timed`, kështu që formulari pyet vetëm sa kohë e mban. Shënimet shembull përfshijnë një rrjedhë yoge në mëngjes me një seancë të udhëzuar.

![Një rrjedhë yoge në telefon: seanca e udhëzuar te Downward Dog, formulari i regjistrimit që pyet vetëm kohëzgjatjen e mbajtjes, dhe blloku i serive me mbajtjen e parë të regjistruar](assets/yoga.png)

`type:` funksionon njësoj si `exercise_type:`. Shto fushat e tua nën `parameters`, për shembull raunde për litarin e kërcimit:

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

Nëse e ndryshon llojin e një ushtrimi pasi e ke regjistruar, **Konverto ushtrimin** i zhvendos serite ekzistuese dhe të lejon të zgjedhësh cila fushë e vjetër shkon ku.

## Të dhënat tuaja

Çdo seri është një rresht në `workout_logs.csv`, kështu që mund ta hapësh në një spreadsheet, ta rezervosh ose ta sinkronizosh si çdo skedar tjetër.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Kolonat dhe redaktimi me dorë</summary>

| Kolona                     | Kuptimi                                      |
| -------------------------- | -------------------------------------------- |
| `date`                     | Kur u regjistrua seria (ISO 8601)            |
| `exercise`, `workout`      | Emri i ushtrimit dhe i stërvitjes            |
| `reps`, `weight`, `volume` | Volumi është përsëritje × peshë              |
| `origine`                  | Lidhja me shënimin nga i cili u regjistrua   |
| `timestamp`                | ID unike e rreshtit (milisekonda)            |
| `notes`, `protocol`        | Tekst i lirë dhe teknika e stërvitjes        |

Llojet e ushtrimeve me fushat e tyre (`duration`, `distance`, `heartRate`, ose `parameters` e tua) shtojnë kolona në fund. Kolona e fundit, `weightUnit`, është `kg` ose `lb`: njësia e `weight` dhe `volume` të atij rreshti. Një vlerë bosh do të thotë njësia nga cilësimet.

Nëse e redakton skedarin me dorë, mbaje rreshtin e titujve, dhe mbyll çdo vlerë që përmban presje, thonjëza ose thyerje rreshti në thonjëza të dyfishta. Shënimet që fillojnë me `=`, `+`, `-` ose `@` ruhen me një `'` në fillim, që spreadsheet-et të mos i ekzekutojnë si formula; plugin-i e fsheh përsëri.

</details>

Çdo gjë mbetet në vault-in tënd. Plugin-i shkruan në clipboard vetëm kur klikon një distinktiv kopjimi (një etiketë muskuli në panel), dhe nuk e lexon kurrë.

### Dataview dhe Templater

Plugin-i ekspozon `WorkoutPlannerAPI` (edhe `window.WorkoutPlannerAPI`) pasi të ketë ngarkuar.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Referenca e API-t dhe shembuj të tjerë</summary>

| Metoda                       | Kthen                                                                                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Serite, secila me `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` dhe `volume` janë në njësinë e cilësimeve; `enteredWeight` dhe `enteredUnit` janë ajo që u regjistrua                          |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Emrat e ushtrimeve, të renditur: emrat e skedarëve të faqeve tua të ushtrimeve (përfshirë nëndosjet), ose emrat në regjistrin tënd kur nuk ke faqe ushtrimesh. `{ tag: "chest" }` mban ushtrimet kur faqja e tyre ka atë etiketë, kështu që është bosh pa faqe ushtrimesh. |

`getWorkoutLogs` pranon `exercise` (pjesërisht, pa dallim shkronjash), `workout`, `dateRange: { start, end }`, `protocol` dhe `exactMatch`.

Squat-et e fundit, në Dataview:

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

Në një shabllon [Templater](https://github.com/SilentVoid13/Templater), për të filluar një shënim me numrat e tu më të fundit:

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

## Cilësimet

Vendos dosjet e CSV dhe të ushtrimeve, njësinë e parazgjedhur të peshës, hapin e peshës së butonave **+/−**, paracaktimet e timerit, protokollet e tua (emri, etiketa e shkurtër dhe ngjyra), dhe sekondat për përsëritje dhe për seri të përdorura nga vlerësimi i kohëzgjatjes. **Ekzekuto të gjitha** te **Të avancuara** ekzekuton çdo detyrë mirëmbajtjeje pas një përditësimi.

Ndryshimi i njësisë së peshës nuk ri-etikedon serinë e vjetër: çdo seri mban njësinë me të cilën u regjistrua.

<details>
<summary>Të gjitha komandat</summary>

Hap paletën e komandave (`Ctrl/Cmd + P`) dhe shkruaj emrin.

| Komanda                                                     | Çfarë bën                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Krijo regjistrim stërvitjeje                                | Regjistro një seri                                                 |
| Fillo turin                                                 | Ndiq turin udhëzues                                                |
| Krijo nota të shembullore                                   | Shto ushtrime shembull, stërvitje, regjistra dhe një panel         |
| Hap udhëzuesin e fillimit                                   | Hap udhëzuesin te shembujt                                         |
| Shto grafik / tabelë / timer / panel / kohëzgjatje stërvitjeje | Fut një bllok përmes një formulari                             |
| Krijo faqe ushtrimi                                         | Faqe e re ushtrimi me llojin dhe etiketat                          |
| Krijo seksionin e ushtrimeve                                | Shto një titull, timer dhe tabelë për një ushtrim te shënimi aktual |
| Shto bllok ushtrimi                                         | Fut një bllok ushtrimi, me plotësim automatik të emrit             |
| Konverto ushtrimin                                          | Zhvendos serite e një ushtrimi te një lloj tjetër ushtrimi         |
| Menaxho etiketat e muskujve                                 | Redakto `muscle-tags.csv`                                          |
| Gjenero referencën e etiketave                              | Krijo një shënim që liston çdo etiketë muskuli                     |
| Kontrollo emrat e ushtrimeve                                | Gjej të njëjtin ushtrim të regjistruar me shkrime të ndryshme      |
| Eksporto stërvitjen në canvas                               | Vendos stërvitjen aktuale në një canvas të Obsidian                |
| Krijo skedarin e regjistrit CSV                             | Krijo një regjistër bosh                                           |
| Importo nga Strong ose Hevy                                 | Shto serinë e një eksporti CSV nga Strong ose Hevy te regjistri    |
| Migro llojet e ushtrimeve, Shto ID-të që mungojnë në blloqet e kodit | Mirëmbajtje pas përditësimit nga versionet e vjetra       |

</details>

## Zgjidhja e problemeve

- **Konflikt me Workout Block (`workout-block`).** Të dy plugin-et regjistrojnë blloqe kodi `workout-log` dhe përdorin `workout_logs.csv` si emrin parazgjedhur të skedarit të regjistrit. Çaktivizo një nga dy plugin-et përpara se të përdorësh tjetrin.

- **Një tabelë ose grafik është bosh.** Kontrollo emrin e ushtrimit dhe `dateRange` (grafikët si parazgjedhje shfaqin 30 ditët e fundit). Me `exactMatch: true` emri duhet të përputhet saktësisht.
- **Një ushtrim mungon në hartën termike.** Faqja e tij duhet të ketë `tags` të muskujve dhe të jetë në dosjen e ushtrimeve. Ushtrimet me peshën e trupit dhe ato me kohë shfaqen vetëm te **Seritë** ose **Përsëritjet**.
- **Formulari i regjistrimit kërkon përsëritje dhe peshë për një plank.** Vendos `exercise_type: timed` në faqen e ushtrimit.
- **Timeri nuk bën zë në telefonin tim.** Prek **Nis** një herë; telefonat bllokojnë zërin derisa ta prekësh faqen.

## Instalimi

### Nga shtojcat e komunitetit

1. Hap **Cilësimet → Shtojcat e komunitetit**
2. Kërko për **Workout Planner**
3. Zgjidh **Instalo**, pastaj **Aktivizo**

### Manualisht

1. Shkarko `main.js`, `manifest.json` dhe `styles.css` nga [publikimi më i fundit](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Krijo dosjen `your-vault/.obsidian/plugins/workout-planner/`
3. Kopjo skedarët e shkarkuar në atë dosje
4. Aktivizo plugin-in te **Cilësimet → Shtojcat e komunitetit**

## Mbështetja

Workout Planner është falas dhe me burim të hapur. Nëse ndihmon stërvitjen tënde, mund të [më blini një kafe](https://buymeacoffee.com/spatariurares). Ke gjetur një gabim ose diçka që mungon? Hap një [çështje](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Çdo gjuhë përveç anglishtes është përkthyer me makinë, kështu që disa fraza mund të dukën të çuditshme. Nëse e jotja lexohet çuditshëm, korrigjimet janë të mirëpritura.

## Kreditet

Grafikët përdorin [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner është publikuar sipas [Licencës MIT](LICENSE).
