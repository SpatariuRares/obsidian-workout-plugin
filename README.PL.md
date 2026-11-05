<img src="assets/logo.png" width="96" alt="Logo Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · Polski · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Kompleksowy tracker treningów dla Obsidiana.** Podnoszenie ciężarów, bieganie, jazda na rowerze, joga lub ćwiczenia z własnymi polami: zapisuj serie z telefonu, przechodź przez sesję z przewodnikiem i śledź postępy na wykresach, w panelu kontrolnym i na mapie cieplnej mięśni. Jeden plik CSV, 24 języki.

Stworzony z myślą o telefonie: zapisuj każdą serię, bieg lub pozycję podczas treningu, a potem obserwuj postępy w tabelach, wykresach i panelu kontrolnym, w tych samych notatkach, w których planujesz trening. Twoje serie trafiają do jednego pliku CSV w twoim skarbcu (vault). Bez konta, bez chmury.

Wykresy pokazują twój trend, mapa cieplna mięśni pokazuje, co trenowałeś, a każda seria zachowuje własną jednostkę kg/lb. Możesz wyszukiwać swoje serie w Dataview.

![Workout Planner na telefonie: karta workout-sets z dwiema zaznaczonymi seriami i działającym timerem odpoczynku, formularz zapisu serii z przyciskami +/− i wyborem kg/lb oraz podsumowanie panelu kontrolnego z kalendarzem treningów](assets/hero.png)

## Funkcje

- Zapisuj serie z powtórzeniami i ciężarem, uzupełnione danymi z ostatniej serii, z przyciskami +/− i ostatnimi ćwiczeniami jednym dotknięciem
- Zapisuj każdą serię w kg lub lb, zgodnie z tym, co pokazują talerze przed tobą
- Oznaczaj serie protokołem: drop set, myo-reps, rest-pause, superset, 21s lub własnym
- Tabele twoich serii, pogrupowane według dnia z sumami dziennymi, edytowalne jednym dotknięciem
- Dzisiejsze serie jako wiersze do uzupełnienia na telefonie: zaznacz serię, aby ją zapisać, a timer odpoczynku ruszy
- Wykresy ciężaru, objętości, powtórzeń, czasu trwania, dystansu, tempa i tętna oraz trend, który jasno pokazuje, czy się poprawiasz
- Panel kontrolny z tygodniową passą (z tygodniowym celem), kalendarzem treningów, rekordami osobistymi, łączną objętością, ostatnimi treningami i statystykami protokołów
- Mapa cieplna mięśni, z przodu i z tyłu, według objętości, serii lub powtórzeń
- Timery odpoczynku (odliczanie, interwały, stoper) z ustawieniami predefiniowanymi, które uruchamiają się od nowa po zapisaniu serii i sygnalizują dźwiękiem na iOS i Android
- Sesja z przewodnikiem, która prowadzi przez notatkę treningową, ćwiczenie po ćwiczeniu
- Szacunek, jak długo potrwa zaplanowany trening
- Ćwiczenia siłowe, z masą własnego ciała, na czas, dystansowe i cardio lub z własnymi polami
- Każda seria w jednym prostym pliku CSV, czytelnym dla Dataview i Templater
- Stworzone z myślą o telefonach: bez przewijania w bok, przyciski zawsze pod ręką
- Dostępne w 24 językach

## Jak zacząć

Przy pierwszej instalacji wtyczka dodaje przykładowe notatki (przykładowe ćwiczenia, dwa treningi z sześciotygodniowym dziennikiem, panel kontrolny i prezentację funkcji), kieruje wtyczkę na nie i otwiera **Przewodnik dla początkujących**: krótką stronę na każdą funkcję, z działającymi przykładami do wypróbowania. Nie musisz otwierać ustawień. Rozejrzyj się, zanim skonfigurujesz własne.

### Wycieczka z przewodnikiem

Wycieczka otwiera notatkę „Wycieczka z przewodnikiem” z tabelą, wykresem, panelem kontrolnym i timerem i pokazuje po kolei każdy z nich. Ma dziewięć krótkich kroków:

1. Zapisz pierwszą serię przyciskiem **+**. Krok kończy się po zapisaniu.
2. Edytuj lub usuń serię przyciskami przy każdym wierszu.
3. Zobacz swoje postępy na wykresie.
4. Zobacz sumy i trendy w panelu kontrolnym.
5. Zobacz, które mięśnie trenowałeś, na mapie cieplnej mięśni.
6. Uruchom timer odpoczynku. Krok kończy się po naciśnięciu przycisku Start.
7. Znajdź ikonę hantli na pasku narzędzi, która otwiera formularz zapisu z dowolnej notatki. Na telefonie użyj palety poleceń.
8. Uruchom dowolne polecenie zaczynające się od **Wstaw** (np. **Wstaw tabelę treningu**) z palety poleceń. Krok kończy się, gdy to zrobisz.
9. Gotowe.

Używaj **Wstecz** i **Dalej**, aby się poruszać, lub **Pomiń**, aby wyjść. Jeśli część notatki, na którą wskazuje wycieczka, jest poza ekranem, **Pokaż mi** przewinie do niej. W każdej chwili naciśnij `Esc`, aby zakończyć. Wycieczka kończy się też, gdy zamkniesz jej notatkę lub przełączysz się na inny plik. Nic nie przepada: twoje serie zostają w dzienniku.

Gdy używane są przykładowe dane, wycieczka działa na nich. W przeciwnym razie działa na twoim dzienniku, więc wykres i panel kontrolny będą prawie puste. Notatka powstaje raz, obok przykładów lub na górze skarbca. Istniejąca notatka nigdy nie jest nadpisywana, a ty możesz ją edytować lub usunąć. Jeśli notatka o nazwie „Wycieczka z przewodnikiem” już istnieje i nie należy do wycieczki, wycieczka używa „Wycieczka z przewodnikiem 1” (lub kolejnego wolnego numeru).

Chcesz znowu odbyć wycieczkę? Wybierz **Rozpocznij wycieczkę** w **Ustawienia → Workout Planner → Jak zacząć** albo uruchom **Rozpocznij wycieczkę** z palety poleceń.

Chcesz ponownie przykłady lub przewodnik? Wybierz **Utwórz przykłady** lub **Otwórz przewodnik dla początkujących** w **Ustawienia → Workout Planner → Jak zacząć** albo uruchom **Utwórz przykładowe notatki** lub **Otwórz przewodnik dla początkujących** z palety poleceń (`Ctrl/Cmd + P`). Tworzenie przykładów nigdy niczego nie nadpisuje: ponowne uruchomienie dodaje tylko brakujące pliki przykładów, a pliki, które zmieniłeś, zostają bez zmian. Przewodnik proponuje utworzenie przykładów, jeśli jeszcze nie istnieją. Pusta tabela, wykres lub panel kontrolny ma też link **Albo poznaj na przykładowych danych**. Jeśli masz już dziennik treningów, przykłady dostają własny plik dziennika, a twój pozostaje nietknięty.

Aby dodać tabelę do dowolnej notatki, na przykład `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Naciśnij **+** pod tabelą, wpisz powtórzenia i ciężar, a następnie zapisz. Tabela aktualizuje się sama. Nie musisz też pisać bloków ręcznie: polecenia **Wstaw wykres treningu / tabelę treningu / timer / panel kontrolny / czas treningu** otwierają formularz i wstawiają blok za ciebie.

## Zapisywanie serii

Otwórz formularz zapisu przyciskiem **+** pod tabelą (ćwiczenie jest wpisane za ciebie), ikoną hantli na pasku narzędzi albo poleceniem **Utwórz wpis treningowy**. Formularz zaczyna się od twojej ostatniej serii, więc najczęściej wystarczy raz nacisnąć **+/−** i zapisać. Zrób to, zanim skończy się odpoczynek.

Formularz pyta o pola pasujące do ćwiczenia: powtórzenia i ciężar przy przysiadzie, sekundy przy desce, dystans i czas przy biegu (zobacz [Typy ćwiczeń](#typy-ćwiczeń)). Każda seria może też mieć notatkę i protokół, pokazany jako odznaka w tabeli.

Pole ciężaru ma wybór kg/lb, więc możesz zapisać 225 lb nawet wtedy, gdy twoje ustawienie to kg. Tabela pokazuje tę serię jako „225 lb”; wykresy, statystyki i objętość przeliczają każdą serię na twoje ustawienie.

Gdy zapisujesz serię z notatki, nazwa notatki zapisuje się jako **trening** tej serii, więc tabela lub wykres z `workout: Push Day` znajdzie ją później.

## Tabele

Blok `workout-log` pokazuje serie ćwiczenia lub treningu, od najnowszej. Serie z tego samego dnia są pogrupowane pod wierszem z sumami dnia, a każdy wiersz ma przycisk edycji; usuń serię w formularzu edycji. Na telefonie każda seria staje się kompaktowym wierszem, bez przewijania w bok.

<img src="assets/tables.png" width="720" alt="Tabela workout-log na telefonie: serie pogrupowane według dnia z czasem i odznaką drop set oraz formularz zapisu otwierany przyciskiem +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Z `targetWeight` i `targetReps` nad tabelą pojawia się cel progresywnego przeciążenia.

<details>
<summary>Wszystkie parametry</summary>

| Parametr                     | Domyślnie | Co robi                                              |
| ---------------------------- | --------- | ---------------------------------------------------- |
| `exercise`                   | —         | Tylko to ćwiczenie                                   |
| `workout`                    | —         | Tylko ten trening (nazwa notatki)                    |
| `exactMatch`                 | `false`   | Dopasuj nazwę ćwiczenia dokładnie                    |
| `dateRange`                  | wszystkie | Dzisiaj i poprzednie N dni                           |
| `limit`                      | `50`      | Maksymalnie wierszy; z `sets`, `sets × 2` (dwa treningi) |
| `sortBy`                     | `date`    | `date`, `exercise`, `weight`, `reps` lub `volume`    |
| `sortOrder`                  | `desc`    | `asc` lub `desc`                                     |
| `columns`                    | wszystkie | Kolumny do pokazania, np. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`    | Pokaż kolumnę z odznaką protokołu                    |
| `showAddButton`              | `true`    | Pokaż przycisk **+**                                 |
| `targetWeight`, `targetReps` | —         | Pokaż cel progresywnego przeciążenia nad tabelą      |
| `sets`                       | —         | Zaplanowane serie, liczone przez blok `workout-session` |

Nazwy ćwiczeń domyślnie dopasowują się luźno („przysiad” znajdzie „Przysiad (high bar)”); dodaj `exactMatch: true`, aby dopasować tylko tę dokładną nazwę.

</details>

## Serie na telefonie

Blok `workout-sets` jest stworzony do zapisywania serii na siłowni: dzisiejsze serie jednego ćwiczenia jako wiersze do uzupełnienia. Każdy wiersz pokazuje, co zrobiłeś w tej samej serii ostatnim razem, więc wpisujesz tylko to, co się zmieniło (puste pole zapisuje tę wartość), i zaznaczasz wiersz. Seria trafia do dziennika, wiersz staje się zapisaną serią, a timer odpoczynku na górze startuje sam. Strzałka zapisanej serii zmienia jej protokół i notatki; ponowne zaznaczenie cofa ją, z przyciskiem **Cofnij** przez kilka sekund.

<img src="assets/sets.png" alt="Karta workout-sets na telefonie: cztery wiersze wypełnione wartościami z ostatniego razu, potem dwie zaznaczone serie z działającym timerem odpoczynku, a potem wiersz otwarty, aby wybrać protokół rest-pause i dodać notatkę">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Dodaj serie treningu** z palety poleceń wstawi go za ciebie, a menu ⋮ edytuje blok albo jego timer odpoczynku.

<details>
<summary>Wszystkie parametry</summary>

| Parametr                     | Domyślnie     | Co robi                                                                                          |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | Ćwiczenie (dokładna nazwa)                                                                       |
| `workout`                    | nazwa notatki | Trening, pod którym zapisywane są serie                                                          |
| `sets`                       | jak ostatnio  | Wiersze do uzupełnienia (co najmniej jeden); **Dodaj serię** dodaje kolejne                      |
| `targetWeight`, `targetReps` | —             | Podpowiedzi, gdy ćwiczenia nigdy nie wykonywano, oraz cel progresywnego przeciążenia             |
| `rest`                       | —             | Sekundy odpoczynku po każdej serii; `0` oznacza brak timera. Bez wartości: `workout-timer` z tej samej sekcji |
| `timer.*`                    | —             | Pozostałe opcje timera odpoczynku: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Wykresy i trendy

Blok `workout-chart` rysuje jedną miarę w czasie: ciężar, objętość, powtórzenia, szacowane 1RM, czas trwania, dystans, tempo lub tętno. Nagłówek pokazuje, czy trend jest **Rosnący**, **Stabilny** czy **Malejący**. Stabilny oznacza, że linia trendu zmienia się o mniej niż 5% średniej w całym okresie, więc powolny, stały wzrost nadal liczy się jako rosnący. Przy tempie niżej jest lepiej, więc spadająca linia oznacza poprawę. Na telefonie wykres zamienia się w tabelę tych samych wartości.

Użyj `type: e1rm`, aby uzyskać najlepsze dzienne szacowane maksimum na jedno powtórzenie (Epley: `ciężar × (1 + powtórzenia / 30)`). Liczą się tylko dodatnie ciężary z całkowitą liczbą powtórzeń od 1 do 12; serie rozgrzewkowe i drop sets są wykluczone. Dni bez kwalifikujących się serii są pomijane. Szacunki zależą od twojego ustawienia kg/lb. Domyślny wykres siłowy nadal pokazuje objętość.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API dodaje `estimatedOneRepMax` do `getExerciseStats`: najlepszy szacunek w skonfigurowanej jednostce wagi albo `null`, gdy nie ma kwalifikującej się serii. Istniejące pola rekordów osobistych i kolumny CSV pozostają bez zmian.

![Wykres szacowanego 1RM wyciskania na ławce z rosnącą linią trendu na komputerze i te same wartości w tabeli na telefonie](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Wszystkie parametry</summary>

| Parametr        | Domyślnie      | Co robi                                                                   |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Tylko to ćwiczenie                                                        |
| `workout`       | —              | Tylko ten trening                                                         |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` lub `heartRate` |
| `chartType`     | `exercise`     | Jak budowany jest punkt każdego dnia (poniżej)                            |
| `dateRange`     | `30`           | Dni do uwzględnienia                                                      |
| `limit`         | —              | Tylko ostatnie N punktów                                                  |
| `showTrendLine` | `false`        | Narysuj linię trendu                                                      |
| `showStats`     | `true`         | Pokaż pod wykresem średnią, najlepszą i najniższą wartość                 |
| `title`         | `Trend <type>` | Tytuł wykresu                                                             |
| `height`        | 4:3            | `300` (piksele) lub dowolna długość CSS, np. `50vh`                       |
| `exactMatch`    | `false`        | Dopasuj nazwę ćwiczenia dokładnie                                         |

| `chartType` | Użyte serie                         | Punkt każdego dnia |
| ----------- | ----------------------------------- | ------------------ |
| `exercise`  | serie `exercise`                    | średnia            |
| `workout`   | serie `workout`                     | suma               |
| `combined`  | serie `exercise` w obrębie `workout` | suma              |
| `all`       | każda seria (filtry ignorowane)     | suma               |

</details>

## Panel kontrolny i mapa cieplna mięśni

Blok `workout-dashboard` otwiera się czterema liczbami: łączna liczba treningów, tygodniowa passa, łączna objętość i rekordy osobiste. Poniżej znajdziesz szybkie statystyki za tydzień, miesiąc i rok, trend objętości, ostatnie treningi, statystyki protokołów, planowany i rzeczywisty czas treningu oraz kalendarz treningów: rok dni treningowych, zacieniowanych według objętości, z twoją obecną i najlepszą passą. Tydzień wlicza się do passy, gdy ma dni treningowe z twojego **Cel tygodniowy** (w ustawieniach, domyślnie 1). Na telefonie szybkie akcje są na początku, a podsumowanie to siatka 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Panel kontrolny na telefonie: podsumowanie, kalendarz treningów z osiągniętym celem tygodnia, ostatnie treningi i szybkie statystyki">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Aby wybrać widżety i ich kolejność bez pisania YAML, wstaw panel poleceniem **Wstaw panel kontrolny treningu** albo otwórz menu ⋮ w prawym górnym rogu wstawionego panelu i wybierz **Edytuj panel kontrolny**.

Ustaw **Układ** na **Siatka** w tym oknie, aby samodzielnie umieścić każdy widżet, jak przedmioty w ekwipunku: przeciągnij widżet, aby go przesunąć, przeciągnij jego róg, aby zmienić szerokość lub wysokość, a upuść go pod siatką, aby go usunąć. Działa też klawiatura: strzałki przesuwają, Shift i strzałki zmieniają rozmiar, a Delete usuwa widżet. Siatka ma tyle kolumn, ile mieści się w szerokości notatki; w węższym panelu widżety są ułożone ponownie w kolejności czytania, a na telefonie są ułożone w stos. Twój układ jest zapisywany: gdy notatka mieści tylko jedną kolumnę (telefon), okno pyta, ile kolumn edytować, zaczynając od zapisanych. Blok zachowuje jedną linię na widżet (kolumna, wiersz, szerokość, wysokość):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Mapa cieplna pokazuje, które mięśnie trenowałeś w ostatnim tygodniu, miesiącu lub roku, z przodu i z tyłu, według **Objętość**, **Serie** lub **Powtórzenia**. To najszybszy sposób, by zauważyć, że przez trzy tygodnie pomijasz nogi. Pod nią krótka analiza treningu ostrzega o nierównowagach, na przykład gdy przód pracuje znacznie bardziej niż tył. Czyta tagi mięśni z twoich [stron ćwiczeń](#typy-ćwiczeń). Ćwiczenia z masą własnego ciała i na czas nie mają ciężaru, więc świecą się tylko w trybie Serie i Powtórzenia.

<img src="assets/heatmap.png" width="720" alt="Mapa cieplna mięśni za tydzień na telefonie, z przodu i z tyłu: trenowane czworogłowe, pośladki i dwugłowe uda, z analizą treningu poniżej">

<details>
<summary>Wszystkie parametry</summary>

| Parametr              | Domyślnie | Co robi                                                                                                                                                                                                     |
| --------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —         | Nagłówek nad panelem                                                                                                                                                                                        |
| `dateRange`           | wszystkie | Tylko serie z ostatnich N dni                                                                                                                                                                               |
| `widgets`             | wszystkie | Widżety do pokazania, w tej kolejności: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`    | `grid` umieszcza każdy widżet w jego komórkach (zobacz wyżej)                                                                                                                                               |
| `columns`             | —         | Siatka: liczba kolumn, dla których siatka została zrobiona                                                                                                                                                  |
| `grid.<widget>`       | —         | Siatka: kolumna, wiersz, szerokość i wysokość tego widżetu                                                                                                                                                  |
| `recentWorkoutsLimit` | `5`       | Treningi na liście ostatnich                                                                                                                                                                                |
| `volumeTrendDays`     | `30`      | Dni na wykresie trendu objętości                                                                                                                                                                            |

</details>

<details>
<summary>Tagi mięśni</summary>

Tagi mogą być listą, pojedynczym słowem (`tags: chest`) albo linią rozdzieloną przecinkami (`tags: chest, triceps`).

Szerokie grupy: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Konkretne mięśnie mają własny obszar ciała i liczą się do swojej grupy. Szeroki tag rozkłada się na cały obszar: `chest` lekko oświetla wszystkie trzy części klatki, a `upper_chest` w pełni oświetla tylko górną.

| Grupa       | Konkretne mięśnie                           |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (or `ql`) |
| `core`      | `obliques`, `serratus`                      |

Tagi w twoim języku, na przykład `petto` albo `schiena`, też działają. Wtyczka mapuje je na grupy powyżej za pomocą `muscle-tags.csv`, obok twojego dziennika. Edytuj go poleceniem **Zarządzaj tagami mięśni** (dodawanie, zmiana nazwy, wyszukiwanie, wykrywanie duplikatów) albo ręcznie:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Tag, który jest już nazwą grupy (`upper_chest`, `Upper chest`, `upper-chest`), zawsze działa, nawet jeśli `muscle-tags.csv` go nie wymienia.

</details>

## Timery

Blok `workout-timer` to timer odliczający, interwałowy lub stoper. Zapisz swoje zwykłe czasy odpoczynku jako ustawienia predefiniowane. Powiąż timer z ćwiczeniem lub treningiem, a będzie uruchamiał się od nowa za każdym razem, gdy zapiszesz serię, więc nie musisz go dotykać między seriami. Z `autoStart: true` startuje, gdy tylko notatka się otworzy.

<img src="assets/timers.png" width="320" alt="Dwa timery na telefonie: timer interwałowy w fazie odpoczynku i ustawienie Tabata w fazie pracy rundy 2">

Dźwięk działa też na iOS i Android. Telefony pozwalają na dźwięk dopiero po dotknięciu strony, więc timer uruchomiony przez `autoStart` pozostaje cichy, dopóki raz nie dotkniesz **Start**.

W **Ustawienia → Workout Planner → Przypomnienia dotyczące urządzenia timera** opcja **Utrzymaj ekran włączony, gdy działa timer** jest domyślnie włączona. Prosi o niewygaszanie ekranu, gdy co najmniej jeden timer działa na pierwszym planie, o ile urządzenie na to pozwala. **Wibracja po zakończeniu timera** jest domyślnie wyłączona i dodaje krótkie pulsowanie przy zerze, niezależnie od dźwięku, na obsługujących to urządzeniach, na przykład na Androidzie. iOS zachowuje dotychczasowy sygnał dźwiękowy; wibracja w przeglądarce tam nie działa. Te funkcje korzystają z API przeglądarki w miarę możliwości i nie zostały jeszcze sprawdzone na fizycznych urządzeniach z Androidem i iOS. Nie zapewniają alarmów w tle. Timer z `id` działa dalej, gdy zmienisz notatkę; zatrzymaj go lub pozwól mu dobiec końca, aby zwolnić blokadę ekranu.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Timer interwałowy może naprzemiennie pracować i odpoczywać. Wyświetlacz pokazuje **Praca** albo **Odpoczynek**, a każda faza zaczyna się z własnym dźwiękiem. Każda runda to praca, po której następuje odpoczynek, również ostatnia, więc ten Tabata trwa 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s pracy, 10 s odpoczynku, 8 rund) i `preset: EMOM` (runda co minutę przez 10 minut) są wbudowane. Zapisane ustawienie o tej samej nazwie je zastępuje.

<details>
<summary>Wszystkie parametry</summary>

| Parametr              | Domyślnie   | Co robi                                                                  |
| --------------------- | ----------- | ------------------------------------------------------------------------ |
| `type`                | `countdown` | `countdown`, `interval` lub `stopwatch`                                  |
| `duration`            | `30`        | Sekundy (odliczanie; dla interwału praca w każdej rundzie)               |
| `work`                | —           | Interwał: sekundy pracy w rundzie (zastępuje `duration`)                 |
| `rest`                | `0`         | Interwał: sekundy odpoczynku po pracy każdej rundy                       |
| `rounds`              | `1`         | Rundy (interwał)                                                         |
| `sound`               | `true`      | Sygnał, gdy czas minie                                                   |
| `autoStart`           | `false`     | Start, gdy tylko notatka się otworzy                                     |
| `showControls`        | `true`      | Pokaż start, pauzę i reset                                               |
| `preset`              | —           | Start z ustawienia predefiniowanego (zapisanego, `Tabata` lub `EMOM`); parametry go nadpisują |
| `exercise`, `workout` | —           | Uruchom timer od nowa, gdy zapiszesz serię dla tego ćwiczenia lub treningu |
| `superset`            | `false`     | Tylko eksport do canvasu: narysuj to ćwiczenie i następne jako superset  |

</details>

## Sesja z przewodnikiem

Blok `workout-session` na górze notatki treningowej (polecenie **Wstaw sesję z przewodnikiem**) prowadzi cię przez trening ćwiczenie po ćwiczeniu: pokazuje, której serii dotyczysz, cel, co robiłeś ostatnio, przycisk **Zapisz serię** i timer odpoczynku, który startuje, gdy zapiszesz serię.

![Sesja z przewodnikiem na telefonie: seria 3 z 4 przysiadu z odpoczynkiem działającym jednocześnie w sesji i na karcie serii, formularz otwarty przyciskiem Zapisz serię, a potem następne ćwiczenie z działającym timerem odpoczynku](assets/session.png)

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

Plan to sama notatka: każdy blok `workout-log` lub `workout-sets` z `exercise` to krok, w kolejności występowania, z `sets`, `targetReps` i `targetWeight`. Odpoczynek pochodzi z własnego `rest` bloku `workout-sets`, a jeśli go brak, z `workout-timer` w tej samej sekcji `##` (a bez niego z ustawienia domyślnego). Sesja i karta serii dzielą jeden odliczany czas. Sesja liczy serie zapisane dziś w tym treningu, więc po ponownym otwarciu notatki wraca dokładnie tam, gdzie skończyłeś. Ćwiczenie bez `sets` pozostaje bieżące, aż zapiszesz serię późniejszego; **Wstecz** i **Dalej** pozwalają poruszać się swobodnie.

## Czas trwania treningu

Blok `workout-duration` szacuje, jak długo trwa notatka treningowa: odpoczynek z jej timerów plus czas każdej serii, obok tego, jak długo naprawdę trwała twoja ostatnia sesja.

<img src="assets/duration.png" width="420" alt="Karta szacowanego czasu z czasem odpoczynku, czasem serii i ostatnią sesją">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` może być ścieżką w skarbcu, ścieżką względną do tej notatki albo samą nazwą notatki; pomiń je, aby oszacować bieżącą notatkę. Sekundy na powtórzenie i na serię pochodzą z [Ustawień](#ustawienia).

## Typy ćwiczeń

Strona ćwiczenia to notatka w folderze ćwiczeń. Jej frontmatter określa, o co pyta formularz zapisu i jakie mięśnie ćwiczenie trenuje. **Utwórz stronę ćwiczenia** tworzy ją za ciebie.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Formularz pyta o                              | Także akceptowane                                            |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `strength` (domyślnie) | powtórzenia, ciężar                         | `bodyweight`, `weights`                                      |
| `timed`              | czas trwania                                  | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | dystans, czas trwania (opcjonalnie)           | `running`, `run`                                             |
| `cardio`             | czas trwania, dystans i tętno (opcjonalnie)   | —                                                            |
| `custom`             | tylko pola wymienione pod `parameters`        | —                                                            |

Joga działa tak samo: każda pozycja to ćwiczenie `timed`, więc formularz pyta tylko, jak długo ją utrzymywałeś. Przykładowe notatki zawierają poranny przepływ jogi z sesją z przewodnikiem.

![Przepływ jogi na telefonie: sesja z przewodnikiem przy Psie z głową w dół, formularz zapisu pytający tylko o czas utrzymania pozycji i karta serii z zapisanym pierwszym utrzymaniem](assets/yoga.png)

`type:` działa tak samo jak `exercise_type:`. Dodaj własne pola pod `parameters`, na przykład rundy dla skakanki:

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

Jeśli zmienisz typ ćwiczenia po jego zapisaniu, **Konwertuj ćwiczenie** przeniesie istniejące serie i pozwoli wybrać, które stare pole dokąd trafi.

## Twoje dane

Każda seria to jeden wiersz w `workout_logs.csv`, więc możesz go otworzyć w arkuszu, zrobić kopię zapasową lub zsynchronizować jak każdy inny plik.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Kolumny i ręczna edycja</summary>

| Kolumna                    | Znaczenie                                    |
| -------------------------- | -------------------------------------------- |
| `date`                     | Kiedy zapisano serię (ISO 8601)              |
| `exercise`, `workout`      | Nazwa ćwiczenia i treningu                   |
| `reps`, `weight`, `volume` | Objętość to powtórzenia × ciężar             |
| `origine`                  | Link do notatki, z której zapisano serię     |
| `timestamp`                | Unikalny identyfikator wiersza (milisekundy) |
| `notes`, `protocol`        | Wolny tekst i technika treningowa            |

Typy ćwiczeń z własnymi polami (`duration`, `distance`, `heartRate` lub twoje `parameters`) dodają kolumny na końcu. Ostatnia kolumna, `weightUnit`, to `kg` lub `lb`: jednostka `weight` i `volume` danego wiersza. Pusta wartość oznacza jednostkę z ustawień.

Jeśli edytujesz plik ręcznie, zachowaj wiersz nagłówka i ujmij w podwójne cudzysłowy każdą wartość zawierającą przecinek, cudzysłów lub znak nowej linii. Notatki zaczynające się od `=`, `+`, `-` lub `@` są zapisywane z wiodącym `'`, aby arkusze nie uruchamiały ich jako formuł; wtyczka ukrywa go ponownie.

</details>

Wszystko zostaje w twoim skarbcu. Wtyczka zapisuje do schowka tylko wtedy, gdy klikniesz odznakę kopiowania (tag mięśnia w panelu kontrolnym), i nigdy z niego nie czyta.

### Dataview i Templater

Wtyczka udostępnia `WorkoutPlannerAPI` (także jako `window.WorkoutPlannerAPI`) po załadowaniu.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Dokumentacja API i więcej przykładów</summary>

| Metoda                       | Zwraca                                                                                                                                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Serie, każda z `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` i `volume` są w jednostce z ustawień; `enteredWeight` i `enteredUnit` to to, co zapisano                                    |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Nazwy ćwiczeń, posortowane: nazwy plików twoich stron ćwiczeń (także w podfolderach) albo nazwy z dziennika, gdy nie masz stron ćwiczeń. `{ tag: "chest" }` zostawia ćwiczenia, których strona ma ten tag, więc bez stron ćwiczeń wynik jest pusty. |

`getWorkoutLogs` przyjmuje `exercise` (częściowo, bez rozróżniania wielkości liter), `workout`, `dateRange: { start, end }`, `protocol` i `exactMatch`.

Ostatnie przysiady w Dataview:

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

W szablonie [Templater](https://github.com/SilentVoid13/Templater), aby zacząć notatkę od twoich najnowszych wyników:

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

## Ustawienia

Ustaw foldery CSV i ćwiczeń, domyślną jednostkę wagi, krok wagi przycisków **+/−**, ustawienia predefiniowane timera, własne protokoły (nazwa, krótka etykieta i kolor) oraz sekundy na powtórzenie i na serię używane w szacunku czasu trwania. **Uruchom wszystko** w sekcji **Zaawansowane** wykonuje wszystkie zadania konserwacyjne po aktualizacji.

Zmiana jednostki wagi nie zmienia etykiet starych serii: każda seria zachowuje jednostkę, w której ją zapisano.

<details>
<summary>Wszystkie polecenia</summary>

Otwórz paletę poleceń (`Ctrl/Cmd + P`) i wpisz nazwę.

| Polecenie                                                   | Co robi                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Utwórz wpis treningowy                                      | Zapisz serię                                                       |
| Rozpocznij wycieczkę                                        | Przejdź wycieczkę z przewodnikiem                                  |
| Utwórz przykładowe notatki                                  | Dodaj przykładowe ćwiczenia, treningi, dzienniki i panel kontrolny |
| Otwórz przewodnik dla początkujących                        | Otwórz przewodnik wśród przykładów                                 |
| Wstaw wykres treningu / tabelę treningu / timer / panel kontrolny / czas treningu | Wstaw blok przez formularz                    |
| Utwórz stronę ćwiczenia                                     | Nowa strona ćwiczenia z typem i tagami                             |
| Utwórz sekcję ćwiczenia                                     | Dodaj nagłówek, timer i tabelę ćwiczenia do bieżącej notatki       |
| Dodaj blok ćwiczeń                                          | Wstaw blok ćwiczenia z podpowiedziami nazwy                        |
| Konwertuj ćwiczenie                                         | Przenieś serie ćwiczenia do innego typu ćwiczenia                  |
| Zarządzaj tagami mięśni                                     | Edytuj `muscle-tags.csv`                                           |
| Wygeneruj spis tagów                                        | Utwórz notatkę z listą wszystkich tagów mięśni                     |
| Sprawdź nazwy ćwiczeń                                       | Znajdź to samo ćwiczenie zapisane różną pisownią                   |
| Eksportuj trening do canvasu                                | Ułóż bieżący trening na canvasie Obsidiana                         |
| Utwórz plik dziennika w formacie CSV                        | Utwórz pusty dziennik                                              |
| Importuj z Strong lub Hevy                                  | Dodaj serie z eksportu CSV ze Strong lub Hevy do dziennika         |
| Migruj typy ćwiczeń, Dodaj brakujące identyfikatory do bloków kodu | Konserwacja po aktualizacji ze starszych wersji             |

</details>

## Rozwiązywanie problemów

- **Konflikt z Workout Block (`workout-block`).** Obie wtyczki rejestrują bloki kodu `workout-log` i używają `workout_logs.csv` jako domyślnej nazwy pliku dziennika. Wyłącz jedną z nich, zanim użyjesz drugiej.

- **Tabela lub wykres jest pusty.** Sprawdź nazwę ćwiczenia i `dateRange` (wykresy domyślnie pokazują ostatnie 30 dni). Przy `exactMatch: true` nazwa musi pasować dokładnie.
- **Brakuje ćwiczenia na mapie cieplnej.** Jego strona potrzebuje tagów mięśni `tags` i musi być w folderze ćwiczeń. Ćwiczenia z masą własnego ciała i na czas pojawiają się tylko w trybie **Serie** lub **Powtórzenia**.
- **Formularz zapisu pyta o powtórzenia i ciężar przy desce.** Ustaw `exercise_type: timed` na stronie ćwiczenia.
- **Timer nie wydaje dźwięku w telefonie.** Dotknij **Start** raz; telefony blokują dźwięk, dopóki nie dotkniesz strony.

## Instalacja

### Z wtyczek społeczności

1. Otwórz **Ustawienia → Wtyczki społeczności**
2. Wyszukaj **Workout Planner**
3. Wybierz **Zainstaluj**, a potem **Włącz**

### Ręczna

1. Pobierz `main.js`, `manifest.json` i `styles.css` z [najnowszego wydania](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Utwórz folder `your-vault/.obsidian/plugins/workout-planner/`
3. Skopiuj pobrane pliki do tego folderu
4. Włącz wtyczkę w **Ustawienia → Wtyczki społeczności**

## Wsparcie

Workout Planner jest darmowy i open source. Jeśli pomaga w treningach, możesz [postawić mi kawę](https://buymeacoffee.com/spatariurares). Znalazłeś błąd albo czegoś brakuje? Otwórz [zgłoszenie](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Każdy język poza angielskim jest tłumaczony maszynowo, więc niektóre zwroty mogą brzmieć dziwnie. Jeśli twój brzmi nieprawidłowo, poprawki są mile widziane.

## Podziękowania

Wykresy korzystają z [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner jest udostępniany na [licencji MIT](LICENSE).
