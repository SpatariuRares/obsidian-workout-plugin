<img src="assets/logo.png" width="96" alt="Logo Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · Čeština · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Komplexní tracker tréninků pro Obsidian.** Zvedání, běh, cyklistika, jóga nebo cviky s vlastními poli: zapisujte série z telefonu, držte se vedené relace a sledujte pokrok v grafech, dashboardu a tepelné mapě svalů. Jeden soubor CSV, 24 jazyků.

Vytvořeno pro telefon: zapisujte každou sérii, běh nebo pózu během tréninku a poté sledujte pokrok v tabulkách, grafech a dashboardu přímo v poznámkách, kde trénink plánujete. Vaše série se ukládají do jednoho souboru CSV ve vašem trezoru. Bez účtu, bez cloudu.

Grafy ukazují váš trend, tepelná mapa svalů ukazuje, co jste trénovali, a každá série si drží svou jednotku kg/lb. Své série můžete dotazovat z Dataview.

![Workout Planner na telefonu: karta workout-sets se dvěma zaškrtnutými sériemi a běžícím odpočinkem, formulář záznamu s tlačítky +/− a výběrem kg/lb a souhrn dashboardu s kalendářem tréninků](assets/hero.png)

## Funkce

- Zapisujte série s opakováními a váhou, předvyplněné podle vaší poslední série, s tlačítky +/− a jedním klepnutím na nedávná cvičení
- Zapisujte každou sérii v kg nebo lb, podle kotoučů, které máte před sebou
- Označte série protokolem: drop set, myo-reps, rest-pause, superset, 21s, nebo vlastním
- Tabulky vašich sérií seskupené podle dne se součty za den, upravitelné jedním klepnutím
- Dnešní série jako řádky k vyplnění v telefonu: zaškrtněte řádek a série se zapíše a spustí se odpočinkový časovač
- Grafy váhy, objemu, opakování, doby, vzdálenosti, tempa a tepové frekvence a trend, který vám jasně řekne, zda se zlepšujete
- Dashboard s týdenní sérií (s týdenním cílem), kalendářem tréninků, osobními rekordy, celkovým objemem, nedávnými tréninky a statistikami protokolů
- Tepelná mapa svalů, zepředu i zezadu, podle objemu, sérií nebo opakování
- Časovače odpočinku (odpočet, interval, stopky) s předvolbami, které se restartují při zápisu série a pípají na iOS i Androidu
- Vedená relace, která vás provede tréninkovou poznámkou po jednom cviku
- Odhad, jak dlouho bude trvat plánovaný trénink
- Silová, kalisthenická, časovaná, vytrvalostní a kardio cvičení, nebo vlastní pole
- Každá série v jednom prostém souboru CSV, čitelném z Dataview a Templateru
- Vytvořeno pro telefony: žádné vodorovné posouvání, tlačítka vždy po ruce
- Dostupné ve 24 jazycích

## Začínáme

Při prvním nainstalování pluginu se přidají ukázkové poznámky (ukázková cvičení, dva tréninky se šestitýdenními záznamy, dashboard a přehled funkcí), plugin se na ně nasměruje a otevře se návod **Návod pro začátek**: krátká stránka ke každé funkci s funkčními příklady, které si můžete vyzkoušet. Nastavení otevírat nemusíte. Než si nastavíte vlastní, pořádně si to projděte.

Chcete znovu ukázky nebo návod? Vyberte **Vytvořit ukázky** nebo **Zobrazit návod pro začátek** v **Nastavení → Workout Planner → Začít**, nebo spusťte **Vytvořit ukázkové poznámky** či **Zobrazit návod pro začátek** z palety příkazů (`Ctrl/Cmd + P`). Vytvoření ukázek nikdy nic nepřepíše: opakované spuštění přidá jen chybějící ukázkové soubory a soubory, které jste změnili, zůstanou beze změny. Návod nabídne vytvoření ukázek, pokud ještě neexistují. Prázdná tabulka, graf nebo dashboard má také odkaz **Nebo prozkoumejte s ukázkovými daty**. Pokud už máte záznam tréninků, ukázky dostanou vlastní soubor záznamů a ten váš zůstane nedotčený.

Chcete-li přidat tabulku do libovolné poznámky, například `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Klepněte na **+** pod tabulkou, zadejte opakování a váhu a uložte. Tabulka se aktualizuje sama. Bloky ani nemusíte psát ručně: příkazy **Vložit graf tréninku / tabulku tréninku / série tréninku / časovač tréninku / přehled tréninku / dobu tréninku** a **Vložit vedenou relaci** otevřou formulář, nebo blok vloží rovnou za vás.

## Zaznamenávání sérií

Formulář záznamu otevřete tlačítkem **+** pod tabulkou (cvičení se doplní automaticky), ikonou činky na liště nebo příkazem **Vytvořit záznam tréninku**. Formulář začíná od vaší poslední série, takže většinou stačí jednou klepnout na **+/−** a uložit. Hotovo dřív, než skončí odpočinek.

Formulář se ptá na pole, která se k cvičení hodí: u dřepů na opakování a váhu, u prkna na sekundy, u běhu na vzdálenost a čas (viz [Typy cvičení](#typy-cvičení)). Každá série může mít také poznámku a protokol, který se v tabulce zobrazí jako štítek.

Pole váhy má výběr kg/lb, takže můžete zapsat 225 lb, i když máte v nastavení kg. Tabulka tu sérii zobrazí jako „225 lb“; grafy, statistiky a objem přepočítají každou sérii na vaše nastavení.

Když zapíšete sérii z poznámky, název poznámky se uloží jako **trénink** dané série, takže tabulka nebo graf s `workout: Push Day` ji později najdou.

## Tabulky

Blok `workout-log` zobrazuje série cvičení nebo tréninku, od nejnovějších. Série ze stejného dne jsou seskupeny pod řádkem se součty za daný den a každý řádek má tlačítko úpravy; sérii smažte z formuláře úprav. Na telefonu se každá série změní na kompaktní řádek bez vodorovného posouvání.

<img src="assets/tables.png" width="720" alt="Tabulka workout-log na telefonu: série seskupené podle dne s časem a štítkem drop setu a formulář záznamu, který otevírá jeho tlačítko +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

S `targetWeight` a `targetReps` se nad tabulkou zobrazí cíl postupného zatěžování.

<details>
<summary>Všechny parametry</summary>

| Parametr                     | Výchozí | K čemu slouží                                          |
| ---------------------------- | ------- | ------------------------------------------------------ |
| `exercise`                   | —       | Jen toto cvičení                                       |
| `workout`                    | —       | Jen tento trénink (název poznámky)                     |
| `exactMatch`                 | `false` | Hledat přesný název cvičení                            |
| `dateRange`                  | vše     | Dnešek a předchozích N dní                             |
| `limit`                      | `50`    | Nejvyšší počet řádků; s `sets` je to `sets × 2` (dva tréninky) |
| `sortBy`                     | `date`  | `date`, `exercise`, `weight`, `reps` nebo `volume`     |
| `sortOrder`                  | `desc`  | `asc` nebo `desc`                                      |
| `columns`                    | vše     | Sloupce k zobrazení, např. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`  | Zobrazit sloupec se štítkem protokolu                  |
| `showAddButton`              | `true`  | Zobrazit tlačítko **+**                                |
| `targetWeight`, `targetReps` | —       | Zobrazit cíl postupného zatěžování nad tabulkou        |
| `sets`                       | —       | Plánované série, počítá blok `workout-session`         |

Názvy cvičení se ve výchozím nastavení hledají volně („squat“ najde „Squat (high bar)“); pro přesný název přidejte `exactMatch: true`.

</details>

## Série na telefonu

Blok `workout-sets` je určený k zapisování v posilovně: dnešní série jednoho cviku jako řádky k vyplnění. Každý řádek ukazuje, co jste v téže sérii udělali minule, takže píšete jen to, co se změnilo (prázdné pole zapíše tuto hodnotu), a řádek zaškrtnete. Série se zapíše do záznamu, řádek se promění v zapsanou sérii a odpočinkový časovač nahoře se spustí sám. Šipka u zapsané série mění její protokol a poznámky; opětovným zaškrtnutím ji odeberete, s tlačítkem **Vrátit** na několik sekund.

<img src="assets/sets.png" alt="Karta workout-sets na telefonu: čtyři řádky vyplněné hodnotami z minula, pak dvě zaškrtnuté série s během odpočinku a pak řádek otevřený pro výběr protokolu rest-pause a přidání poznámky">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Vložit série tréninku** z palety příkazů vloží jeden blok a nabídka ⋮ ho upraví, včetně jeho odpočinkového časovače.

<details>
<summary>Všechny parametry</summary>

| Parametr                     | Výchozí       | K čemu slouží                                                                                    |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | Cvik (přesný název)                                                                              |
| `workout`                    | název poznámky | Trénink, pod který se série zapisují                                                            |
| `sets`                       | jako minule   | Řádky k vyplnění (alespoň jeden); **Přidat sérii** přidá další                                   |
| `targetWeight`, `targetReps` | —             | Nápověda, když cvik ještě nikdy nedělali, a cíl postupného zatěžování                            |
| `rest`                       | —             | Sekundy odpočinku po každé sérii; `0` znamená žádný časovač. Když není nastaveno: `workout-timer` stejné sekce |
| `timer.*`                    | —             | Další možnosti odpočinkového časovače: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Grafy a trendy

Blok `workout-chart` vykresluje jednu veličinu v čase: váhu, objem, opakování, odhadované 1RM, dobu, vzdálenost, tempo nebo tepovou frekvenci. Záhlaví říká, zda je trend **Rostoucí**, **Stabilní** nebo **Klesající**. Stabilní znamená, že se spojnice trendu za celé období pohne méně než o 5 % průměru, takže pomalý, ale stálý růst se pořád počítá jako rostoucí. U tempa je lepší nižší hodnota, takže klesající čára se zobrazí jako zlepšení. Na telefonu se graf změní na tabulku se stejnými hodnotami.

Pro nejlepší denní odhadované maximum na jedno opakování použijte `type: e1rm` (Epleyho vzorec: `weight × (1 + reps / 30)`). Počítají se jen kladné váhy s celočíselným počtem opakování od 1 do 12; zahřívací a drop sety jsou vyloučeny. Dny bez způsobilých sérií se vynechají. Odhady se řídí vaším nastavením kg/lb. Výchozím silovým grafem zůstává objem.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API přidává `estimatedOneRepMax` do `getExerciseStats`: nejlepší odhad v nastavené jednotce váhy, nebo `null`, když žádná způsobilá série neexistuje. Stávající pole PR a sloupce CSV zůstávají beze změny.

![Graf odhadovaného 1RM u bench pressu s rostoucí spojnicí trendu na počítači a stejné hodnoty jako tabulka na telefonu](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Všechny parametry</summary>

| Parametr        | Výchozí        | K čemu slouží                                                             |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Jen toto cvičení                                                          |
| `workout`       | —              | Jen tento trénink                                                         |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `e1rm`, `duration`, `distance`, `pace` nebo `heartRate` |
| `chartType`     | `exercise`     | Jak se sestaví bod každého dne (níže)                                     |
| `dateRange`     | `30`           | Počet dní, které se zahrnou                                               |
| `limit`         | —              | Jen posledních N bodů                                                     |
| `showTrendLine` | `false`        | Vykreslit spojnici trendu                                                 |
| `showTrend`     | `true`         | Zobrazit záhlaví trendu nad grafem |
| `showStats`     | `true`         | Zobrazit pod grafem průměr, nejlepší a nejnižší hodnotu                   |
| `title`         | `Trend <type>` | Název grafu                                                               |
| `height`        | 4:3            | `300` (pixely) nebo libovolná délka CSS, např. `50vh`                     |
| `exactMatch`    | `false`        | Hledat přesný název cvičení                                               |

| `chartType` | Použité série                       | Bod každého dne  |
| ----------- | ----------------------------------- | ---------------- |
| `exercise`  | série `exercise`                    | průměr           |
| `workout`   | série `workout`                     | součet           |
| `combined`  | série `exercise` v rámci `workout`  | součet           |
| `all`       | každá série (filtry se ignorují)    | součet           |

</details>

## Dashboard a tepelná mapa svalů

Blok `workout-dashboard` začíná čtyřmi čísly: počet tréninků, týdenní série, celkový objem a osobní rekordy. Pod nimi najdete rychlé statistiky za týden, měsíc a rok, trend objemu, nedávné tréninky, statistiky protokolů, plánovanou a skutečnou délku tréninku a kalendář tréninků: rok tréninkových dnů, odstíněných podle objemu, se současnou a nejlepší sérií. Týden se počítá do série, jakmile má počet tréninkových dnů vašeho týdenního cíle (Nastavení → Týdenní cíl, výchozí 1). Na telefonu jsou nahoře rychlé akce a souhrn je mřížka 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Dashboard na telefonu: souhrn, kalendář tréninků se splněným týdenním cílem, nedávné tréninky a rychlé statistiky">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Chcete-li vybrat widgety a jejich pořadí bez psaní YAML, vložte dashboard příkazem **Vložit přehled tréninku**, nebo otevřete nabídku ⋮ vpravo nahoře u vloženého dashboardu a vyberte **Upravit dashboard**.

V tom okně nastavte **Rozvržení** na **Mřížka**, a každý widget umístíte sami, jako předměty v inventáři: přetažením widget přesunete, přetažením rohu ho zvětšíte nebo zvýšíte, a přetažením pod mřížku ho odeberete. Funguje i klávesnice: šipky přesouvají, Shift se šipkami mění velikost a Delete widget odebere. Mřížka má tolik sloupců, kolik se vejde do šířky poznámky; v užším panelu se widgety znovu uspořádají v pořadí čtení a na telefonu se řadí pod sebe. Rozvržení se uchovává: když se do poznámky vejde jen jeden sloupec (telefon), okno se zeptá, kolik sloupců upravovat, a začne od uložených. Blok si drží jeden řádek na widget (sloupec, řádek, šířka, výška):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Mapa ukazuje, které svaly jste trénovali za poslední týden, měsíc nebo rok, zepředu i zezadu, podle **Objemu**, **Sérií** nebo **Počtu opakování**. Je to nejrychlejší způsob, jak si všimnout, že jste tři týdny vynechali nohy. Pod ní krátká analýza tréninku upozorní na nerovnováhu, například když přední strana pracuje mnohem víc než zadní. Čte štítky svalů z vašich [stránek cvičení](#typy-cvičení). Cviky s vlastní vahou a časované nemají váhu, takže se rozsvítí jen u Sérií a Počtu opakování.

<img src="assets/heatmap.png" width="720" alt="Tepelná mapa svalů za týden na telefonu, zepředu i zezadu: trénované stehenní, hýžďové a zadní stehenní svaly, pod nimi analýza tréninku">

<details>
<summary>Všechny parametry</summary>

| Parametr              | Výchozí | K čemu slouží                                                                                                                                                                                               |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —       | Nadpis nad dashboardem                                                                                                                                                                                      |
| `dateRange`           | vše     | Jen série za posledních N dní                                                                                                                                                                               |
| `widgets`             | vše     | Widgety k zobrazení v tomto pořadí: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`  | `grid` umístí každý widget do jeho buněk (viz výše)                                                                                                                                                         |
| `columns`             | —       | Mřížka: počet sloupců, pro které byla mřížka vytvořena                                                                                                                                                      |
| `grid.<widget>`       | —       | Mřížka: sloupec, řádek, šířka a výška daného widgetu                                                                                                                                                        |
| `recentWorkoutsLimit` | `5`     | Počet tréninků v seznamu nedávných                                                                                                                                                                          |
| `volumeTrendDays`     | `30`    | Počet dní v grafu trendu objemu                                                                                                                                                                             |

</details>

<details>
<summary>Štítky svalů</summary>

Štítky mohou být seznam, jedno slovo (`tags: chest`) nebo řádek oddělený čárkami (`tags: chest, triceps`).

Široké skupiny: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Konkrétní svaly mají vlastní oblast těla a počítají se do své skupiny. Široký štítek se rozprostře po celé oblasti: `chest` mírně rozsvítí všechny tři části hrudníku, `upper_chest` plně rozsvítí jen horní.

| Skupina     | Konkrétní svaly                             |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (nebo `ql`) |
| `core`      | `obliques`, `serratus`                      |

Štítky ve vašem vlastním jazyce, například `petto` nebo `schiena`, fungují také. Plugin je přiřadí k výše uvedeným skupinám pomocí souboru `muscle-tags.csv` vedle vašeho záznamu. Upravte ho v **Spravovat štítky svalů** (přidat, přejmenovat, hledat, najít duplicity) nebo ručně:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Štítek, který je už názvem skupiny (`upper_chest`, `Upper chest`, `upper-chest`), vždy funguje, i když ho `muscle-tags.csv` neuvádí.

</details>

## Časovače

Blok `workout-timer` je odpočítávací, intervalový nebo stopkový časovač. Své obvyklé časy odpočinku si uložte jako předvolby. Propojte časovač s cvičením nebo tréninkem a při každém zápisu série se restartuje, takže ho mezi sériemi nemusíte ovládat. S `autoStart: true` se spustí, jakmile se poznámka otevře.

<img src="assets/timers.png" width="320" alt="Dva časovače na telefonu: intervalový časovač ve fázi odpočinku a předvolba Tabata ve fázi práce v 2. kole">

Pípá i na iOS a Androidu. Telefony povolí zvuk až po dotyku stránky, takže časovač spuštěný přes `autoStart` zůstane tichý, dokud jednou neklepnete na **Start**.

V **Nastavení → Workout Planner → Upozornění zařízení pro časovač** je ve výchozím nastavení zapnuto **Udržet obrazovku aktivní, zatímco běží časovač**. Při běhu alespoň jednoho časovače v popředí si vyžádá ochranu obrazovky, pokud to zařízení umožňuje. **Vibrovat, když časovač skončí** je ve výchozím nastavení vypnuto a na podporovaných zařízeních, například na Androidu, přidá krátké zachvění při nule, nezávisle na zvuku. Na iOS zůstává stávající zvukové upozornění; vibrace z webu tam nejsou dostupné. Tyto funkce používají API prohlížeče v rámci možností a zatím nebyly ověřeny na fyzických zařízeních s Androidem a iOS. Nenabízejí žádné budíky na pozadí. Časovač s `id` běží dál, i když změníte poznámku; pozastavte ho nebo nechte doběhnout, aby se uvolnila ochrana obrazovky.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Intervalový časovač umí střídat práci a odpočinek. Displej ukazuje **Práce** nebo **Odpočinek** a každá fáze začíná vlastním zvukem. Každé kolo je práce a za ní odpočinek, včetně posledního, takže tahle Tabata trvá 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s práce, 10 s odpočinku, 8 kol) a `preset: EMOM` (kolo každou minutu po dobu 10 minut) jsou zabudované. Uložená předvolba se stejným názvem je nahradí.

<details>
<summary>Všechny parametry</summary>

| Parametr              | Výchozí     | K čemu slouží                                                         |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` nebo `stopwatch`                              |
| `duration`            | `30`        | Sekundy (odpočet; u intervalu práce každého kola)                     |
| `work`                | —           | Interval: sekundy práce na kolo (nahrazuje `duration`)                |
| `rest`                | `0`         | Interval: sekundy odpočinku po práci každého kola                     |
| `rounds`              | `1`         | Počet kol (interval)                                                  |
| `sound`               | `true`      | Pípnout, když vyprší čas                                              |
| `autoStart`           | `false`     | Spustit, jakmile se poznámka otevře                                   |
| `showControls`        | `true`      | Zobrazit start, pauzu a reset                                         |
| `preset`              | —           | Začít z předvolby (uložené, `Tabata` nebo `EMOM`); parametry ji přepíšou |
| `exercise`, `workout` | —           | Restartovat časovač, když zapíšete sérii pro toto cvičení nebo trénink |
| `superset`            | `false`     | Jen export na plátno: vykreslit toto cvičení a další jako superset    |

</details>

## Vedená relace

Blok `workout-session` na začátku poznámky tréninku (příkaz **Vložit vedenou relaci**) vás provede tréninkem po jednom cviku: která série je na řadě, cíl, co jste dělali minule, tlačítko **Zapsat sérii** a časovač odpočinku, který se spustí, když zapíšete sérii.

![Vedená relace na telefonu: série 3 ze 4 dřepů s během odpočinku v relaci i na kartě sérií, formulář záznamu otevřený tlačítkem Zapsat sérii a poté další cvik s během odpočinku](assets/session.png)

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

Plánem je samotná poznámka: každý blok `workout-log` nebo `workout-sets` s `exercise` je krok v pořadí, v jakém se objevují, se svými `sets`, `targetReps` a `targetWeight`. Odpočinek se vezme z vlastního `rest` bloku `workout-sets`, jinak z bloku `workout-timer` ve stejné sekci `##` (bez něj výchozí předvolba). Relace a karta sérií sdílejí jedno odpočítávání. Relace počítá série, které jste dnes v tomto tréninku zapsali, takže při znovuotevření poznámky naváže tam, kde jste přestali. Cvik bez `sets` zůstává aktuální, dokud nezapíšete sérii dalšího cviku; **Předchozí** a **Další** se dají procházet volně.

## Délka tréninku

Blok `workout-duration` odhadne, jak dlouho bude trvat tréninková poznámka: odpočinek z jejích časovačů plus čas každé série, vedle toho, jak dlouho vaše poslední relace skutečně trvala.

<img src="assets/duration.png" width="420" alt="Karta s odhadovanou délkou: čas odpočinku, čas sérií a poslední relace">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` může být cesta v trezoru, cesta relativní k této poznámce, nebo jen název poznámky; když ho vynecháte, odhadne se aktuální poznámka. Sekundy na opakování a na sérii pocházejí z [Nastavení](#nastavení).

## Typy cvičení

Stránka cvičení je poznámka ve vaší složce cvičení. Její frontmatter určuje, na co se formulář záznamu ptá a které svaly cvičení trénuje. **Vytvořit stránku cvičení** ji vytvoří za vás.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Formulář záznamu se ptá na                    | Přijímá také                                                 |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `strength` (výchozí) | opakování, váhu                               | `bodyweight`, `weights`                                      |
| `timed`              | dobu                                          | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | vzdálenost, dobu (volitelně)                  | `running`, `run`                                             |
| `cardio`             | dobu, vzdálenost a tepovou frekvenci (volitelně) | —                                                         |
| `custom`             | jen pole, která uvedete pod `parameters`      | —                                                            |

Jóga funguje stejně: každá póza je cvik `timed`, takže se formulář ptá jen na to, jak dlouho jste ji drželi. Ukázkové poznámky obsahují ranní jógový tok s vedenou relací.

![Jógový tok na telefonu: vedená relace u Downward Dog, formulář záznamu, který se ptá jen na délku výdrže, a karta sérií s první zapsanou výdrží](assets/yoga.png)

Pro sport, který zaznamenává něco jiného (obtížnost lezení, počet pokusů, jestli jste cestu vylezli), si vytvořte vlastní typ v **Nastavení → Typy cvičení**: dejte mu název a vyberte jeho pole, vestavěná jako opakování a hmotnost, nebo nová (číslo, text nebo ano/ne). Pak se objeví v seznamu typů při vytváření cvičení a do stránky cvičení se zapíše `exercise_type: <your type>`. Vestavěné typy nelze změnit, ale **Duplikovat** vytvoří nový typ jako kopii některého z nich. Smazání typu ho jen přestane nabízet: cvičení, která ho používají, si ponechají svá pole a zaznamenané série.

`type:` funguje stejně jako `exercise_type:`. Vlastní pole můžete přidat také jednotlivému cvičení pod `parameters`, například kola pro švihadlo:

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

Když změníte typ cvičení až po zapsání sérií, **Převést cvičení** existující série přesune a necháte vás vybrat, které staré pole kam patří.

## Vaše data

Každá série je jeden řádek v `workout_logs.csv`, takže ji můžete otevřít v tabulkovém procesoru, zálohovat nebo synchronizovat jako jakýkoli jiný soubor.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Sloupce a ruční úprava</summary>

| Sloupec                    | Význam                                      |
| -------------------------- | ------------------------------------------- |
| `date`                     | Kdy byla série zapsána (ISO 8601)           |
| `exercise`, `workout`      | Název cvičení a tréninku                    |
| `reps`, `weight`, `volume` | Objem je opakování × váha                   |
| `origine`                  | Odkaz na poznámku, ze které byla série zapsána |
| `timestamp`                | Jedinečné ID řádku (milisekundy)            |
| `notes`, `protocol`        | Volný text a tréninková technika            |

Typy cvičení s vlastními poli (`duration`, `distance`, `heartRate`, nebo vaše `parameters`) přidají sloupce na konec. Poslední sloupec, `weightUnit`, je `kg` nebo `lb`: jednotka hodnot `weight` a `volume` daného řádku. Prázdná hodnota znamená jednotku z nastavení.

Když soubor upravujete ručně, ponechte řádek záhlaví a každou hodnotu s čárkou, uvozovkou nebo zalomením řádku uzavřete do dvojitých uvozovek. Poznámky začínající na `=`, `+`, `-` nebo `@` se ukládají s úvodním `'`, aby je tabulkové procesory nepočítaly jako vzorce; plugin ho zase skryje.

</details>

Všechno zůstává ve vašem trezoru. Plugin zapisuje do schránky jen tehdy, když kliknete na štítek ke kopírování (štítek svalu v dashboardu), a nikdy ji nečte.

### Dataview a Templater

Po načtení plugin zpřístupní `WorkoutPlannerAPI` (také `window.WorkoutPlannerAPI`).

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Reference API a další příklady</summary>

| Metoda                       | Vrací                                                                                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Série, každá s `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` a `volume` jsou v jednotce nastavení; `enteredWeight` a `enteredUnit` jsou hodnota a jednotka, které byly zapsány                  |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Názvy cvičení, seřazené: názvy souborů vašich stránek cvičení (včetně podsložek), nebo názvy ze záznamu, pokud žádné stránky cvičení nemáte. `{ tag: "chest" }` ponechá cvičení, jehož stránka má daný štítek, takže bez stránek cvičení je výsledek prázdný. |

`getWorkoutLogs` přijímá `exercise` (částečný název, bez ohledu na velikost písmen), `workout`, `dateRange: { start, end }`, `protocol` a `exactMatch`.

Poslední dřepy v Dataview:

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

V šabloně [Templater](https://github.com/SilentVoid13/Templater), která poznámku začne vašimi nejnovějšími čísly:

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

## Nastavení

Nastavte složky CSV a cvičení, výchozí jednotku váhy, krok váhy tlačítek **+/−**, předvolby časovače, vlastní protokoly (název, krátký štítek a barvu) a sekundy na opakování a na sérii, které používá odhad délky. **Spustit vše** v části Pokročilé spustí po aktualizaci všechny úkoly údržby.

Změna jednotky váhy nepřepíše popisky starých sérií: každá série si zachová jednotku, ve které byla zapsána.

<details>
<summary>Všechny příkazy</summary>

Otevřete paletu příkazů (`Ctrl/Cmd + P`) a napište název.

| Příkaz                                                                                                         | Co dělá                                                                      |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Vytvořit záznam tréninku                                                                                       | Zapsat sérii                                                                 |
| Vytvořit ukázkové poznámky                                                                                     | Přidat ukázková cvičení, tréninky, záznamy a dashboard                       |
| Zobrazit návod pro začátek, Spustit prohlídku                                                                  | Otevřít návod mezi ukázkami                                                  |
| Zobrazit novinky                                                                                               | Zobrazit, co se změnilo v jednotlivých verzích                               |
| Vložit graf tréninku / tabulku tréninku / série tréninku / časovač tréninku / přehled tréninku / dobu tréninku | Vložit blok přes formulář                                                    |
| Vložit vedenou relaci                                                                                          | Vložit blok `workout-session` na kurzor                                      |
| Vytvořit stránku cvičení                                                                                       | Nová stránka cvičení s typem a štítky                                        |
| Přidat blok cvičení                                                                                            | Přidat sekci pro cvik s jejím blokem sérií, s automatickým doplňováním názvu |
| Převést cvičení                                                                                                | Přesunout série cvičení do jiného typu cvičení                               |
| Spravovat štítky svalů                                                                                         | Upravit `muscle-tags.csv`                                                    |
| Vygenerovat přehled štítků                                                                                     | Vytvořit poznámku s výpisem všech štítků svalů                               |
| Zkontrolovat názvy cviků                                                                                       | Najít stejné cvičení zapsané různými pravopisy                               |
| Exportovat trénink na plátno                                                                                   | Rozvrhnout aktuální trénink na plátno Obsidianu                              |
| Vytvořit soubor záznamů CSV                                                                                    | Vytvořit prázdný záznam                                                      |
| Import z Strong nebo Hevy                                                                                      | Přidat série z exportu CSV aplikace Strong nebo Hevy do záznamu              |
| Migrovat typy cvičení, Přidat chybějící ID do bloků kódu                                                       | Údržba po aktualizaci ze starších verzí                                      |

</details>

## Řešení potíží

- **Konflikt s Workout Block (`workout-block`).** Oba pluginy registrují bloky kódu `workout-log` a jako výchozí název souboru záznamů používají `workout_logs.csv`. Před použitím jednoho vypněte druhý.

- **Tabulka nebo graf je prázdný.** Zkontrolujte název cvičení a `dateRange` (grafy ve výchozím nastavení ukazují posledních 30 dní). S `exactMatch: true` musí název sedět přesně.
- **Cvičení chybí v tepelné mapě.** Jeho stránka potřebuje štítky svalů `tags` a musí být ve složce cvičení. Cviky s vlastní vahou a časované se zobrazí jen u **Sérií** nebo **Počtu opakování**.
- **Formulář záznamu se pro prkno ptá na opakování a váhu.** Na stránce cvičení nastavte `exercise_type: timed`.
- **Časovač na telefonu nepípá.** Jednou klepněte na **Start**; telefony blokují zvuk, dokud se nedotknete stránky.

## Instalace

### Z komunitních pluginů

1. Otevřete **Nastavení → Komunitní pluginy**
2. Vyhledejte **Workout Planner**
3. Vyberte **Instalovat**, poté **Povolit**

### Ruční instalace

1. Stáhněte `main.js`, `manifest.json` a `styles.css` z [nejnovější verze](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Vytvořte složku `your-vault/.obsidian/plugins/workout-planner/`
3. Zkopírujte stažené soubory do této složky
4. Povolte plugin v **Nastavení → Komunitní pluginy**

## Podpora

Workout Planner je zdarma a má otevřený zdrojový kód. Pokud vám pomáhá při tréninku, můžete [mi koupit kávu](https://buymeacoffee.com/spatariurares). Našli jste chybu nebo něco chybí? Otevřete [issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Každý jazyk kromě angličtiny je strojově přeložen, takže některé fráze mohou znít nepřirozeně. Pokud vám váš jazyk zní divně, opravy jsou vítány.

## Poděkování

Grafy používají [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner je vydán pod [licencí MIT](LICENSE).
