<img src="assets/logo.png" width="96" alt="Logo Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · Română · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Aplicația completă de urmărire a antrenamentelor pentru Obsidian.** Ridicări de greutăți, alergare, ciclism, yoga sau exerciții cu propriile câmpuri: înregistrează seriile de pe telefon, urmează o sesiune ghidată și vezi-ți progresul în grafice, într-un tablou de bord și într-o hartă de căldură a mușchilor. Un singur CSV, 24 de limbi.

Creat pentru telefon: înregistrează fiecare serie, alergare sau poziție pe măsură ce te antrenezi, apoi urmărește-ți progresul în tabele, grafice și într-un tablou de bord, în aceleași notițe în care îți planifici antrenamentele. Seriile tale ajung într-un singur fișier CSV din vault-ul tău. Fără cont, fără cloud.

Graficele îți arată tendința, harta de căldură a mușchilor arată ce ai antrenat, iar fiecare serie își păstrează propria unitate kg/lb. Îți poți interoga seriile din Dataview.

![Workout Planner pe telefon: o sesiune ghidată cu temporizatorul de pauză pornit, formularul de înregistrare cu butoanele +/− și selectorul kg/lb, și sumarul tabloului de bord cu calendarul antrenamentelor](assets/hero.png)

## Funcționalități

- Înregistrează serii cu repetări și greutate, completate automat după ultima ta serie, cu butoane +/− și exerciții recente dintr-o singură atingere
- Înregistrează fiecare serie în kg sau lb, indiferent ce discuri vezi în fața ta
- Etichetează seriile cu un protocol: drop set, myo-reps, rest-pause, superset, 21s sau propriul protocol
- Tabele cu seriile tale, grupate pe zile, cu totaluri zilnice, editabile dintr-o singură atingere
- Grafice pentru greutate, volum, repetări, durată, distanță, ritm și ritm cardiac, plus o tendință care îți spune clar dacă progresezi
- Un tablou de bord cu serie săptămânală (cu un obiectiv săptămânal), calendar de antrenamente, recorduri personale, volum total, antrenamente recente și statistici pe protocoale
- O hartă de căldură a mușchilor, față și spate, după volum, serii sau repetări
- Temporizatoare de pauză (numărătoare inversă, interval, cronometru) cu presetări, care se repornesc când înregistrezi o serie și emit un semnal sonor pe iOS și Android
- O sesiune ghidată care parcurge notița de antrenament câte un exercițiu pe rând
- O estimare a duratei unui antrenament planificat
- Exerciții de forță, cu greutatea corpului, pe timp, de distanță și cardio, sau propriile câmpuri
- Fiecare serie într-un fișier CSV simplu, care poate fi citit din Dataview și Templater
- Creat pentru telefoane: fără derulare laterală, butoanele mereu la îndemână
- Disponibil în 24 de limbi

## Primii pași

La prima instalare a pluginului, acesta adaugă note de exemplu (exerciții de probă, două antrenamente cu șase săptămâni de jurnal, un tablou de bord și o prezentare a funcțiilor), le setează ca sursă și deschide ghidul de pornire: o pagină scurtă pentru fiecare funcție, cu exemple funcționale pe care le poți încerca. Nu trebuie să deschizi setările. Explorează înainte să-ți configurezi propriile date.

### Turul ghidat

Turul deschide o notă „Tur ghidat” cu un tabel, un grafic, un tablou de bord și un temporizator, și arată pe rând fiecare dintre ele. Are nouă pași scurți:

1. Înregistrează prima serie cu butonul **+**. Pasul se termină când o salvezi.
2. Modifică sau șterge o serie cu butoanele de pe fiecare rând.
3. Vezi-ți progresul în grafic.
4. Vezi totalurile și tendințele în tabloul de bord.
5. Vezi ce mușchi ai antrenat în harta de căldură a mușchilor.
6. Pornește temporizatorul de pauză. Pasul se termină când apeși **Start**.
7. Găsește pictograma cu ganteră din bara laterală, care deschide formularul de înregistrare din orice notă. Pe telefon, folosește paleta de comenzi.
8. Rulează orice comandă **Adaugă** din paleta de comenzi. Pasul se termină când o faci.
9. Gata.

Folosește **Înapoi** și **Următor** ca să te deplasezi sau **Sări peste** ca să ieși. Dacă partea din notă la care arată turul nu se vede, **Arată-mi** derulează până la ea. Apasă `Esc` oricând ca să-l încheii. Turul se încheie și când închizi nota lui sau treci la alt fișier. Nu se pierde nimic: seriile tale rămân în jurnal.

Când sunt folosite datele de exemplu, turul rulează pe ele. Altfel, rulează pe jurnalul tău, deci graficul și tabloul de bord încep aproape goale. Nota se creează o singură dată, lângă exemple sau în partea de sus a vault-ului tău. O notă existentă nu este suprascrisă niciodată, iar tu o poți edita sau șterge. Dacă există deja o notă numită „Tur ghidat” care nu aparține turului, acesta folosește „Tur ghidat 1” (sau următorul număr liber).

Vrei să faci din nou turul? Selectează **Începe turul** sub **Setări → Workout Planner → Începe**, sau rulează **Începe turul** din paleta de comenzi.

Vrei din nou exemplele sau ghidul? Selectează **Creează exemple** sau **Deschide ghidul de pornire** sub **Setări → Workout Planner → Începe**, ori rulează **Creează note de exemplu** sau **Deschide ghidul de pornire** din paleta de comenzi (`Ctrl/Cmd + P`). Crearea exemplelor nu suprascrie nimic: dacă o rulezi din nou, adaugă doar fișierele de exemplu care lipsesc, iar fișierele pe care le-ai modificat rămân cum sunt. Ghidul oferă să creeze exemplele dacă nu există încă. Un tabel, un grafic sau un tablou de bord gol are și un link **Sau explorează cu date de exemplu**. Dacă ai deja un jurnal de antrenamente, exemplele primesc propriul fișier de jurnal, iar al tău rămâne neatins.

Pentru a adăuga un tabel în orice notă, de exemplu `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Apasă **+** sub tabel, introdu repetările și greutatea și salvează. Tabelul se actualizează singur. Nici blocurile nu trebuie scrise de mână: comenzile **Adaugă grafic / tabel / temporizator / tablou de bord / durată** deschid un formular și inserează blocul pentru tine.

## Înregistrarea seriilor

Deschide formularul de înregistrare cu **+** de sub un tabel (exercițiul este completat pentru tine), cu pictograma cu ganteră din bara laterală sau cu comanda **Creează jurnal de antrenament**. Formularul pornește de la ultima ta serie, așa că de cele mai multe ori apeși **+/−** o singură dată și salvezi. Fă-o înainte să se termine pauza.

Formularul cere câmpurile potrivite exercițiului: repetări și greutate pentru genuflexiuni, secunde pentru planșă, distanță și timp pentru alergare (vezi [Tipuri de exerciții](#tipuri-de-exerciții)). Fiecare serie poate avea și o notă și un protocol, afișat ca etichetă în tabel.

Câmpul de greutate are un selector kg/lb, așa că poți înregistra 225 lb chiar dacă setarea ta este kg. Tabelul afișează seria ca „225 lb”; graficele, statisticile și volumul convertesc fiecare serie la unitatea din setări.

Când înregistrezi o serie dintr-o notă, numele notei se salvează ca **antrenament** al seriei, deci un tabel sau un grafic cu `workout: Push Day` o găsește mai târziu.

## Tabele

Un bloc `workout-log` afișează seriile unui exercițiu sau ale unui antrenament, cele mai noi primele. Seriile din aceeași zi sunt grupate sub un rând cu totalurile zilei, iar fiecare rând are un buton de editare; șterge o serie din formularul de editare. Pe telefon, fiecare serie devine un rând compact, fără derulare laterală.

<img src="assets/tables.png" width="720" alt="Un tabel workout-log pe telefon, cu serii grupate pe zile, cu ora lor și o etichetă de drop set, și formularul de înregistrare deschis de butonul său +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Cu `targetWeight` și `targetReps`, deasupra tabelului apare o țintă de supraîncărcare progresivă.

<details>
<summary>Toți parametrii</summary>

| Parametru                    | Implicit | Ce face                                              |
| ---------------------------- | -------- | ---------------------------------------------------- |
| `exercise`                   | —        | Doar acest exercițiu                                 |
| `workout`                    | —        | Doar acest antrenament (numele notei)                |
| `exactMatch`                 | `false`  | Potrivește numele exercițiului exact                 |
| `dateRange`                  | toate    | Azi și cele N zile anterioare                        |
| `limit`                      | `50`     | Număr maxim de rânduri; cu `sets`, `sets × 2` (două antrenamente) |
| `sortBy`                     | `date`   | `date`, `exercise`, `weight`, `reps` sau `volume`    |
| `sortOrder`                  | `desc`   | `asc` sau `desc`                                     |
| `columns`                    | toate    | Coloanele afișate, de ex. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`   | Afișează coloana cu eticheta protocolului            |
| `showAddButton`              | `true`   | Afișează butonul **+**                               |
| `targetWeight`, `targetReps` | —        | Afișează o țintă de supraîncărcare progresivă deasupra tabelului |
| `sets`                       | —        | Serii planificate, numărate de un bloc `workout-session` |

Numele exercițiilor se potrivesc aproximativ implicit („squat” găsește „Squat (high bar)”); adaugă `exactMatch: true` ca să accepți doar numele exact.

</details>

## Grafice și tendințe

Un bloc `workout-chart` desenează o măsură în timp: greutate, volum, repetări, 1RM estimat, durată, distanță, ritm sau ritm cardiac. Antetul arată dacă tendința este **Creștere**, **Stabil** sau **Scădere**. Stabil înseamnă că linia de tendință se mișcă mai puțin de 5% din medie pe întreaga perioadă, deci un progres lent și constant tot contează ca tendință de creștere. Pentru ritm, mai mic este mai bun, iar o linie care scade arată o îmbunătățire. Pe telefon, graficul devine un tabel cu aceleași valori.

Folosește `type: e1rm` pentru cel mai bun 1RM estimat zilnic (Epley: `weight × (1 + reps / 30)`). Contează doar greutățile pozitive cu repetări întregi de la 1 la 12; seriile de încălzire și drop set sunt excluse. Zilele fără serii eligibile sunt omise. Estimările urmează setarea kg/lb. Graficul implicit de forță rămâne cel de volum.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API-ul adaugă `estimatedOneRepMax` la `getExerciseStats`: cea mai bună estimare în unitatea de greutate configurată, sau `null` când nu există nicio serie eligibilă. Câmpurile existente pentru recorduri personale și coloanele CSV nu se schimbă.

![Grafic cu 1RM estimat la presa pe bancă, cu linia de tendință în creștere pe desktop, și aceleași valori ca tabel pe telefon](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Toți parametrii</summary>

| Parametru       | Implicit       | Ce face                                                                   |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Doar acest exercițiu                                                      |
| `workout`       | —              | Doar acest antrenament                                                    |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` sau `heartRate` |
| `chartType`     | `exercise`     | Cum se construiește punctul fiecărei zile (mai jos)                       |
| `dateRange`     | `30`           | Zile incluse                                                              |
| `limit`         | —              | Doar ultimele N puncte                                                    |
| `showTrendLine` | `false`        | Desenează o linie de tendință                                             |
| `showStats`     | `true`         | Afișează media, cel mai bun și cel mai slab sub grafic                    |
| `title`         | `Trend <type>` | Titlul graficului                                                         |
| `height`        | 4:3            | `300` (pixeli) sau orice lungime CSS, de exemplu `50vh`                   |
| `exactMatch`    | `false`        | Potrivește numele exercițiului exact                                      |

| `chartType` | Serii folosite                      | Punctul fiecărei zile |
| ----------- | ----------------------------------- | --------------------- |
| `exercise`  | seriile lui `exercise`              | medie                 |
| `workout`   | seriile lui `workout`               | total                 |
| `combined`  | seriile lui `exercise` din `workout` | total                 |
| `all`       | fiecare serie (filtrele sunt ignorate) | total               |

</details>

## Tablou de bord și harta de căldură a mușchilor

Un bloc `workout-dashboard` începe cu patru cifre: numărul total de antrenamente, seria săptămânală, volumul total și recordurile personale. Sub ele vezi statistici rapide pentru săptămână, lună și an, o tendință a volumului, antrenamentele recente, statistici pe protocoale, durata planificată față de cea reală și un calendar de antrenamente: un an de zile de antrenament, colorate după volum, cu seria curentă și cea mai bună. O săptămână contează pentru serie din momentul în care are numărul de zile de antrenament din obiectivul tău săptămânal (Setări → Obiectiv săptămânal, implicit 1). Pe telefon, acțiunile rapide vin primele, iar sumarul este o grilă 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Tabloul de bord pe telefon: sumar, calendarul de antrenamente cu obiectivul săptămânii atins, antrenamente recente și statistici rapide">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Pentru a alege widgeturile și ordinea lor fără să scrii YAML, adaugă tabloul de bord cu comanda **Adaugă tablou de bord pentru antrenamente**, sau deschide meniul ⋮ din colțul din dreapta sus al unui tablou de bord adăugat și alege **Editează tabloul de bord**.

Setează **Aranjament** la **Grilă** în acea fereastră ca să plasezi fiecare widget singur, ca obiectele dintr-un inventar: trage un widget ca să-l muți, trage colțul lui ca să-l faci mai lat sau mai înalt, iar dacă îl lași sub grilă, dispare din tablou. Tastatura funcționează și ea: săgețile mută, Shift și săgețile redimensionează, Delete scoate un widget. Grila are câte coloane încap în lățimea notei tale; într-un panou mai îngust, widgeturile sunt reașezate în ordinea de citire, iar pe telefon sunt puse unul sub altul. Aranjamentul tău se păstrează: când nota încape doar o coloană (un telefon), fereastra întreabă câte coloane să editeze, pornind de la cele salvate. Blocul păstrează câte o linie pentru fiecare widget (coloană, rând, lățime, înălțime):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Harta de căldură arată ce mușchi ai antrenat în ultima săptămână, lună sau an, față și spate, după **Volum**, **Serii** sau **Repetări**. Este cel mai rapid mod de a observa că ai sărit peste picioare trei săptămâni la rând. Sub ea, o scurtă analiză a antrenamentului te avertizează despre dezechilibre, de exemplu când partea din față lucrează mult mai mult decât spatele. Citește etichetele de mușchi din [paginile de exerciții](#tipuri-de-exerciții) tale. Exercițiile cu greutatea corpului și cele pe timp nu au greutate, deci se luminează doar la **Serii** și **Repetări**.

<img src="assets/heatmap.png" width="720" alt="Harta de căldură a mușchilor pe săptămână, pe telefon, față și spate: cvadriceps, fesieri și ischiogambieri antrenați, cu analiza antrenamentului dedesubt">

<details>
<summary>Toți parametrii</summary>

| Parametru             | Implicit | Ce face                                                                                                                                                                                                     |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —        | Titlul de deasupra tabloului de bord                                                                                                                                                                        |
| `dateRange`           | toate    | Doar seriile din ultimele N zile                                                                                                                                                                            |
| `widgets`             | toate    | Widgeturile afișate, în această ordine: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`   | `grid` plasează fiecare widget în celulele sale (vezi mai sus)                                                                                                                                              |
| `columns`             | —        | Grilă: coloanele pentru care a fost făcută grila                                                                                                                                                            |
| `grid.<widget>`       | —        | Grilă: coloana, rândul, lățimea și înălțimea widgetului respectiv                                                                                                                                           |
| `recentWorkoutsLimit` | `5`      | Antrenamente din lista recentă                                                                                                                                                                              |
| `volumeTrendDays`     | `30`     | Zile în graficul tendinței volumului                                                                                                                                                                        |

</details>

<details>
<summary>Etichete de mușchi</summary>

Etichetele pot fi o listă, un singur cuvânt (`tags: chest`) sau o linie separată prin virgule (`tags: chest, triceps`).

Grupe mari: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Mușchii specifici au propria zonă a corpului și contează pentru grupul lor. O etichetă mare se răspândește pe toată zona: `chest` luminează ușor toate cele trei părți ale pieptului, iar `upper_chest` luminează complet doar partea de sus.

| Grup        | Mușchi specifici                            |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (sau `ql`) |
| `core`      | `obliques`, `serratus`                      |

Etichetele în propria ta limbă, precum `petto` sau `schiena`, funcționează și ele. Pluginul le mapează la grupele de mai sus folosind `muscle-tags.csv`, lângă jurnalul tău. Editează-l cu **Gestionează etichetele pentru mușchi** (adaugă, redenumește, caută, găsește duplicatele) sau manual:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

O etichetă care este deja numele unui grup (`upper_chest`, `Upper chest`, `upper-chest`) funcționează întotdeauna, chiar dacă `muscle-tags.csv` nu o listează.

</details>

## Temporizatoare

Un bloc `workout-timer` este un temporizator de numărătoare inversă, de interval sau cronometru. Salvează timpii tăi obișnuiți de pauză ca presetări. Leagă un temporizator de un exercițiu sau de un antrenament și se repornește de fiecare dată când înregistrezi o serie, deci nu trebuie să-l atingi între serii. Cu `autoStart: true` pornește imediat ce se deschide nota.

<img src="assets/timers.png" width="320" alt="Două temporizatoare pe telefon: un temporizator de interval în faza de pauză și o presetare Tabata în faza de lucru a rundei 2">

Emite semnale sonore și pe iOS și pe Android. Telefoanele permit sunetul doar după ce ai atins pagina, așa că un temporizator pornit de `autoStart` rămâne mut până apeși o dată **Start**.

În **Setări → Workout Planner → Semnale ale temporizatorului pe dispozitiv**, **Păstrează ecranul activ cât timp funcționează un temporizator** este activat implicit. Solicită protecția ecranului cât timp rulează cel puțin un temporizator în prim-plan, acolo unde dispozitivul o permite. **Vibrează la finalizarea unui temporizator** este dezactivat implicit și adaugă o scurtă vibrație la zero, independent de sunet, pe dispozitivele compatibile, precum Android. Pe iOS rămâne semnalul audio existent; vibrația din browser nu este disponibilă acolo. Aceste funcții folosesc API-uri ale browserului în limita posibilităților și nu au fost încă verificate pe telefoane Android și iOS reale. Nu oferă alarme în fundal. Un temporizator cu `id` continuă să ruleze când schimbi nota; oprește-l sau lasă-l să se termine ca să eliberezi protecția ecranului.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Un temporizator de interval poate alterna lucrul cu pauza. Afișajul arată **Lucru** sau **Pauză**, iar fiecare fază pornește cu propriul semnal sonor. Fiecare rundă este lucrul urmat de pauză, inclusiv ultima, așa că acest Tabata durează 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s lucru, 10 s pauză, 8 runde) și `preset: EMOM` (o rundă pe minut timp de 10 minute) sunt incluse. O presetare salvată cu același nume le înlocuiește.

<details>
<summary>Toți parametrii</summary>

| Parametru             | Implicit    | Ce face                                                               |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` sau `stopwatch`                               |
| `duration`            | `30`        | Secunde (numărătoare inversă; la interval, lucrul din fiecare rundă)  |
| `work`                | —           | Interval: secunde de lucru pe rundă (înlocuiește `duration`)          |
| `rest`                | `0`         | Interval: secunde de pauză după lucrul fiecărei runde                 |
| `rounds`              | `1`         | Runde (interval)                                                      |
| `sound`               | `true`      | Semnal sonor când se termină timpul                                   |
| `autoStart`           | `false`     | Pornește imediat ce se deschide nota                                  |
| `showControls`        | `true`      | Afișează start, pauză și resetare                                     |
| `preset`              | —           | Pornește de la o presetare (salvată, `Tabata` sau `EMOM`); parametrii o suprascriu |
| `exercise`, `workout` | —           | Repornește temporizatorul când înregistrezi o serie pentru acest exercițiu sau antrenament |
| `superset`            | `false`     | Doar la exportul pe canvas: desenează acest exercițiu și următorul ca superset |

</details>

## Sesiune ghidată

Un bloc `workout-session` în partea de sus a notei de antrenament (comanda **Inserează sesiune ghidată**) te conduce prin antrenament câte un exercițiu pe rând: ce serie faci, ținta, ce ai făcut data trecută, un buton **Înregistrează seria** și temporizatorul de pauză, care pornește când înregistrezi o serie.

![Sesiune ghidată pe telefon: seria 1 din 4 cu ce ai făcut data trecută, formularul de înregistrare deschis de Înregistrează seria, apoi seria 2 din 4 cu temporizatorul de pauză pornit](assets/session.png)

````markdown
```workout-session
```

## Squat

```workout-log
exercise: Squat
sets: 4
targetReps: 8
targetWeight: 100
```

```workout-timer
preset: rest
```
````

Planul este chiar nota: fiecare bloc `workout-log` cu un `exercise` este un pas, în ordinea în care apare, cu `sets`, `targetReps` și `targetWeight`. Pauza vine din `workout-timer` din aceeași secțiune `##` (presetarea implicită dacă nu există unul). Sesiunea numără seriile pe care le-ai înregistrat azi în acest antrenament, așa că reia de unde ai rămas când redeschizi nota. Un exercițiu fără `sets` rămâne cel curent până înregistrezi o serie a unuia ulterior; **Anterior** și **Următor** te mută liber.

## Durata antrenamentului

Un bloc `workout-duration` estimează cât durează o notă de antrenament: pauzele din temporizatoarele ei plus timpul pentru fiecare serie, alături de cât a durat de fapt ultima ta sesiune.

<img src="assets/duration.png" width="420" alt="Card cu durata estimată: timpul de pauză, timpul pentru serii și ultima sesiune">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` poate fi o cale în vault, o cale relativă față de această notă sau doar numele notei; dacă îl lași necompletat, estimarea se face pentru nota curentă. Secundele pe repetare și pe serie vin din [Setări](#setări).

## Tipuri de exerciții

O pagină de exercițiu este o notă din folderul tău de exerciții. Frontmatter-ul ei spune ce cere formularul de înregistrare și ce mușchi antrenează exercițiul. **Creează pagină de exercițiu** îți creează una.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Formularul cere                              | Acceptate și                                                 |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (implicit) | repetări, greutate                           | `bodyweight`, `weights`                                      |
| `timed`              | durată                                       | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distanță, durată (opțional)                  | `running`, `run`                                             |
| `cardio`             | durată, distanță și ritm cardiac (opțional)  | —                                                            |
| `custom`             | doar câmpurile pe care le listezi la `parameters` | —                                                       |

Yoga funcționează la fel: fiecare poziție este un exercițiu `timed`, deci formularul întreabă doar cât timp ai ținut-o. Notele de exemplu includ un flux de yoga de dimineață, cu o sesiune ghidată.

![Un flux de yoga pe telefon: sesiunea ghidată la poziția Downward Dog, formularul care cere doar durata menținerii și tabelul menținerilor cu totalul zilei](assets/yoga.png)

`type:` funcționează la fel ca `exercise_type:`. Adaugă propriile câmpuri sub `parameters`, de exemplu runde pentru coarda de sărit:

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

Dacă schimbi tipul unui exercițiu după ce l-ai înregistrat, **Convertește exercițiul** mută seriile existente și te lasă să alegi în ce câmp nou ajunge fiecare câmp vechi.

## Datele tale

Fiecare serie este un rând în `workout_logs.csv`, deci îl poți deschide într-o foaie de calcul, îl poți salva sau sincroniza ca orice alt fișier.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Coloane și editare manuală</summary>

| Coloană                    | Înseamnă                             |
| -------------------------- | ------------------------------------ |
| `date`                     | Când a fost înregistrată seria (ISO 8601) |
| `exercise`, `workout`      | Numele exercițiului și al antrenamentului |
| `reps`, `weight`, `volume` | Volumul este repetări × greutate     |
| `origine`                  | Link către nota din care a fost înregistrată |
| `timestamp`                | ID unic al rândului (milisecunde)    |
| `notes`, `protocol`        | Text liber și tehnica de antrenament |

Tipurile de exerciții cu câmpuri proprii (`duration`, `distance`, `heartRate` sau `parameters` tale) adaugă coloane la final. Ultima coloană, `weightUnit`, este `kg` sau `lb`: unitatea pentru `weight` și `volume` din rândul respectiv. O valoare goală înseamnă unitatea din setări.

Dacă editezi fișierul manual, păstrează rândul de antet și pune între ghilimele duble orice valoare care conține virgulă, ghilimele sau salt de linie. Notele care încep cu `=`, `+`, `-` sau `@` sunt salvate cu un `'` la început, ca foile de calcul să nu le execute ca formule; pluginul îl ascunde din nou.

</details>

Totul rămâne în vault-ul tău. Pluginul scrie în clipboard doar când apeși o etichetă de copiere (o etichetă de mușchi din tabloul de bord) și nu citește niciodată din el.

### Dataview și Templater

Pluginul expune `WorkoutPlannerAPI` (și `window.WorkoutPlannerAPI`) după ce s-a încărcat.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Referința API și mai multe exemple</summary>

| Metodă                       | Returnează                                                                                                                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Serii, fiecare cu `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` și `volume` sunt în unitatea din setări; `enteredWeight` și `enteredUnit` sunt ce s-a înregistrat                                    |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Numele exercițiilor, sortate: numele fișierelor paginilor de exerciții (inclusiv din subfoldere), sau numele din jurnal când nu ai pagini de exerciții. `{ tag: "chest" }` păstrează exercițiile a căror pagină are eticheta respectivă, deci este goală fără pagini de exerciții. |

`getWorkoutLogs` acceptă `exercise` (parțial, fără diferență între majuscule și minuscule), `workout`, `dateRange: { start, end }`, `protocol` și `exactMatch`.

Genuflexiunile recente, în Dataview:

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

Într-un șablon [Templater](https://github.com/SilentVoid13/Templater), ca să începi o notă cu ultimele tale cifre:

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

## Setări

Setează folderele pentru CSV și exerciții, unitatea implicită de greutate, pasul de greutate al butoanelor **+/−**, presetările de temporizator, protocoalele tale (nume, etichetă scurtă și culoare) și secundele pe repetare și pe serie folosite de estimarea duratei. **Rulează toate** sub **Avansat** execută toate sarcinile de întreținere după o actualizare.

Schimbarea unității de greutate nu reetichetează seriile vechi: fiecare serie își păstrează unitatea în care a fost înregistrată.

<details>
<summary>Toate comenzile</summary>

Deschide paleta de comenzi (`Ctrl/Cmd + P`) și scrie numele.

| Comandă                                                     | Ce face                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Creează jurnal de antrenament                               | Înregistrează o serie                                              |
| Începe turul                                                | Parcurge turul ghidat                                              |
| Creează note de exemplu                                     | Adaugă exerciții, antrenamente, jurnale și un tablou de bord de probă |
| Deschide ghidul de pornire                                  | Deschide ghidul din exemple                                        |
| Adaugă grafic / tabel / temporizator / tablou de bord / durată | Inserează un bloc printr-un formular                            |
| Creează pagină de exercițiu                                 | Pagină nouă de exercițiu, cu tip și etichete                       |
| Creează secțiunea de exerciții                              | Adaugă un titlu, un temporizator și un tabel pentru un exercițiu în nota curentă |
| Adaugă bloc de exercițiu                                    | Inserează un bloc de exercițiu, cu completare automată a numelui   |
| Convertește exercițiul                                      | Mută seriile unui exercițiu la alt tip de exercițiu                |
| Gestionează etichetele pentru mușchi                        | Editează `muscle-tags.csv`                                         |
| Generează referința etichetelor                             | Creează o notă cu fiecare etichetă de mușchi                       |
| Verifică numele exercițiilor                                | Găsește același exercițiu înregistrat cu grafii diferite           |
| Exportă antrenamentul în canvas                             | Aranjează antrenamentul curent pe un canvas Obsidian               |
| Creează fișier de jurnal CSV                                | Creează un jurnal gol                                              |
| Importă din Strong sau Hevy                                 | Adaugă seriile dintr-un export CSV Strong sau Hevy în jurnal      |
| Migrează tipurile de exerciții, Adaugă ID-urile lipsă în blocurile de cod | Întreținere după actualizarea din versiuni mai vechi        |

</details>

## Depanare

- **Conflict cu Workout Block (`workout-block`).** Ambele pluginuri înregistrează blocuri de cod `workout-log` și folosesc `workout_logs.csv` ca nume implicit al fișierului de jurnal. Dezactivează unul dintre cele două pluginuri înainte să-l folosești pe celălalt.

- **Un tabel sau un grafic este gol.** Verifică numele exercițiului și `dateRange` (graficele folosesc implicit ultimele 30 de zile). Cu `exactMatch: true`, numele trebuie să se potrivească exact.
- **Un exercițiu lipsește din harta de căldură.** Pagina lui trebuie să aibă `tags` de mușchi și trebuie să se afle în folderul de exerciții. Exercițiile cu greutatea corpului și cele pe timp apar doar la **Serii** sau **Repetări**.
- **Formularul de înregistrare cere repetări și greutate pentru planșă.** Setează `exercise_type: timed` în pagina exercițiului.
- **Temporizatorul nu scoate niciun sunet pe telefonul meu.** Apasă o dată **Start**; telefoanele blochează sunetul până când atingi pagina.

## Instalare

### Din plugin-urile comunitare

1. Deschide **Setări → Plugin-uri comunitare**
2. Caută **Workout Planner**
3. Apasă **Instalează**, apoi **Activează**

### Manual

1. Descarcă `main.js`, `manifest.json` și `styles.css` din [ultima versiune](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Creează folderul `your-vault/.obsidian/plugins/workout-planner/`
3. Copiază fișierele descărcate în acest folder
4. Activează pluginul în **Setări → Plugin-uri comunitare**

## Suport

Workout Planner este gratuit și open source. Dacă te ajută în antrenamente, îmi poți [oferi o cafea](https://buymeacoffee.com/spatariurares). Ai găsit o eroare sau lipsește ceva? Deschide o [problemă](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Fiecare limbă în afară de engleză este tradusă automat, deci unele expresii pot suna ciudat. Dacă a ta sună ciudat, corecturile sunt binevenite.

## Credite

Graficele folosesc [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner este distribuit sub [Licența MIT](LICENSE).
