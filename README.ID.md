<img src="assets/logo.png" width="96" alt="Logo Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · Bahasa Indonesia · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Pelacak latihan serba bisa untuk Obsidian.** Angkat beban, lari, bersepeda, yoga, atau latihan dengan kolom Anda sendiri: catat dari ponsel, ikuti sesi terpandu, dan lihat kemajuan Anda dalam grafik, dasbor, dan peta panas otot. Satu CSV, 24 bahasa.

Dibuat untuk ponsel Anda: catat setiap set, lari, atau pose saat berlatih, lalu lihat kemajuan Anda dalam tabel, grafik, dan dasbor di dalam catatan yang sama tempat Anda merencanakan latihan. Set Anda masuk ke satu file CSV di vault Anda. Tanpa akun, tanpa cloud.

Grafik menampilkan tren Anda, peta panas otot menunjukkan apa yang Anda latih, dan setiap set menyimpan satuan kg/lb-nya sendiri. Anda dapat membuat kueri set Anda dari Dataview.

![Workout Planner di ponsel: kartu workout-sets dengan dua set tercentang dan timer istirahat berjalan, formulir log dengan tombol +/− dan pemilih kg/lb, serta ringkasan dasbor dengan kalender latihan](assets/hero.png)

## Fitur

- Catat set dengan repetisi dan berat, terisi otomatis dari set terakhir Anda, dengan tombol +/− dan latihan terbaru dalam satu ketukan
- Catat setiap set dalam kg atau lb, sesuai dengan cakram beban di depan Anda
- Beri tag set dengan protokol: drop set, myo-reps, rest-pause, superset, 21s, atau protokol Anda sendiri
- Tabel set Anda, dikelompokkan per hari dengan total harian, dapat disunting dengan satu ketukan
- Set hari ini sebagai baris untuk diisi di ponsel: centang set untuk mencatatnya, dan timer istirahat dimulai
- Grafik untuk berat, volume, repetisi, durasi, jarak, pace, dan detak jantung, serta tren yang memberi tahu dengan jelas apakah Anda membaik
- Dasbor dengan rentetan mingguan (dengan target mingguan), kalender latihan, rekor pribadi, total volume, latihan terbaru, dan statistik protokol
- Peta panas otot, depan dan belakang, berdasarkan volume, set, atau repetisi
- Timer istirahat (hitung mundur, interval, stopwatch) dengan preset, yang dimulai ulang saat Anda mencatat set dan berbunyi bip di iOS dan Android
- Sesi terpandu yang memandu catatan latihan satu latihan per waktu
- Perkiraan berapa lama sebuah latihan yang direncanakan berlangsung
- Latihan kekuatan, berat badan, berbasis waktu, jarak, dan kardio, atau kolom Anda sendiri
- Setiap set dalam satu file CSV sederhana, dapat dibaca dari Dataview dan Templater
- Dibuat untuk ponsel: tanpa gulir samping, tombol selalu mudah dijangkau
- Tersedia dalam 24 bahasa

## Memulai

Saat pertama kali Anda memasang plugin, plugin akan menambahkan catatan contoh (latihan contoh, dua sesi dengan log enam minggu, dasbor, dan pameran fitur), mengarahkan plugin ke catatan tersebut, dan membuka panduan **Memulai**: halaman pendek untuk setiap fitur, dengan contoh yang bisa Anda coba. Anda tidak perlu membuka pengaturan. Jelajahi dulu sebelum menyiapkan latihan Anda sendiri.

Ingin contoh atau panduan lagi? Pilih **Buat contoh** atau **Buka panduan memulai** di **Pengaturan → Workout Planner → Memulai**, atau jalankan **Buat catatan contoh** atau **Buka panduan memulai** dari palet perintah (`Ctrl/Cmd + P`). Membuat contoh tidak pernah menimpa apa pun: menjalankannya lagi hanya menambahkan file contoh yang belum ada, dan file yang sudah Anda ubah tetap seperti semula. Panduan akan menawarkan untuk membuat contoh jika belum ada. Tabel, grafik, atau dasbor kosong juga memiliki tautan **Atau jelajahi dengan data contoh**. Jika Anda sudah punya log latihan, contoh akan mendapat file log sendiri dan log Anda tetap tidak tersentuh.

Untuk menambahkan tabel ke catatan apa pun, misalnya `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Ketuk **+** di bawah tabel, masukkan repetisi dan berat, lalu simpan. Tabel akan diperbarui sendiri. Anda juga tidak perlu menulis blok dengan tangan: perintah **Sisipkan grafik latihan**, **Sisipkan tabel latihan**, **Sisipkan set latihan**, **Sisipkan timer latihan**, **Sisipkan dasbor latihan**, dan **Sisipkan durasi latihan**, serta **Sisipkan sesi terpandu**, membuka formulir (atau langsung menulis blok) untuk Anda.

## Mencatat set

Buka formulir log dengan **+** di bawah tabel (latihannya sudah terisi), ikon dumbel di ribbon, atau perintah **Buat catatan latihan**. Formulir dimulai dari set terakhir Anda, jadi sebagian besar waktu Anda cukup mengetuk **+/−** sekali lalu menyimpan. Selesaikan sebelum istirahat Anda habis.

Formulir meminta kolom yang sesuai dengan latihan: repetisi dan berat untuk squat, detik untuk plank, jarak dan waktu untuk lari (lihat [Jenis latihan](#jenis-latihan)). Setiap set juga dapat berisi catatan dan protokol, yang ditampilkan sebagai lencana di tabel.

Kolom berat memiliki pemilih kg/lb, jadi Anda bisa mencatat 225 lb meskipun pengaturan Anda kg. Tabel menampilkan set itu sebagai "225 lb"; grafik, statistik, dan volume mengonversi setiap set ke pengaturan Anda.

Saat Anda mencatat set dari sebuah catatan, nama catatan disimpan sebagai **workout** set tersebut, sehingga tabel atau grafik dengan `workout: Push Day` dapat menemukannya nanti.

## Tabel

Blok `workout-log` menampilkan set dari sebuah latihan atau sesi, dari yang terbaru. Set pada hari yang sama dikelompokkan di bawah satu baris dengan total hari itu, dan setiap baris memiliki tombol sunting; hapus set dari formulir sunting. Di ponsel, setiap set menjadi baris ringkas tanpa gulir samping.

<img src="assets/tables.png" width="720" alt="Tabel workout-log di ponsel, set dikelompokkan per hari dengan waktu dan lencana drop set, serta formulir log yang dibuka oleh tombol +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Dengan `targetWeight` dan `targetReps`, target kelebihan beban progresif muncul di atas tabel.

<details>
<summary>Semua parameter</summary>

| Parameter                    | Default | Fungsinya                                             |
| ---------------------------- | ------- | ----------------------------------------------------- |
| `exercise`                   | —       | Hanya latihan ini                                     |
| `workout`                    | —       | Hanya sesi ini (nama catatan)                         |
| `exactMatch`                 | `false` | Cocokkan nama latihan secara persis                   |
| `dateRange`                  | all     | Hari ini dan N hari sebelumnya                        |
| `limit`                      | `50`    | Jumlah baris maksimum; dengan `sets`, `sets × 2` (dua sesi) |
| `sortBy`                     | `date`  | `date`, `exercise`, `weight`, `reps` atau `volume`    |
| `sortOrder`                  | `desc`  | `asc` atau `desc`                                     |
| `columns`                    | all     | Kolom yang ditampilkan, misalnya `["date", "reps", "weight"]` |
| `showProtocol`               | `true`  | Tampilkan kolom lencana protokol                      |
| `showAddButton`              | `true`  | Tampilkan tombol **+**                                |
| `targetWeight`, `targetReps` | —       | Tampilkan target kelebihan beban progresif di atas tabel |
| `sets`                       | —       | Set yang direncanakan, dihitung oleh blok `workout-session` |

Nama latihan cocok secara longgar secara default ("squat" menemukan "Squat (high bar)"); tambahkan `exactMatch: true` untuk hanya nama persis itu.

</details>

## Set di ponsel

Blok `workout-sets` dibuat untuk mencatat di gym: set hari ini dari satu latihan sebagai baris yang tinggal Anda isi. Setiap baris menampilkan apa yang Anda lakukan pada set yang sama terakhir kali, jadi Anda cukup mengetik yang berubah (kolom kosong mencatat nilai itu), lalu centang barisnya. Set masuk ke log, baris berubah menjadi set yang tercatat, dan timer istirahat di bagian atas langsung berjalan. Panah (chevron) pada set yang tercatat mengubah protokol dan catatannya; mencentangnya lagi membatalkan set itu, dengan **Urungkan** selama beberapa detik.

<img src="assets/sets.png" alt="Kartu workout-sets di ponsel: empat baris terisi dengan nilai terakhir, lalu dua set tercentang dengan timer istirahat berjalan, lalu sebuah baris dibuka untuk memilih protokol rest-pause dan menambahkan catatan">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Sisipkan set latihan** dari palet perintah menulis satu blok untuk Anda, dan menu ⋮ mengedit blok atau timer istirahatnya.

<details>
<summary>Semua parameter</summary>

| Parameter                    | Default          | Fungsinya                                                                                          |
| ---------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `exercise`                   | —                | Latihan (nama persis)                                                                              |
| `workout`                    | nama catatan     | Sesi tempat set dicatat                                                                            |
| `sets`                       | sesuai terakhir  | Baris untuk diisi (minimal satu); **Tambah set** menambah lagi                                     |
| `targetWeight`, `targetReps` | —                | Petunjuk saat latihan belum pernah dilakukan, dan target kelebihan beban progresif                 |
| `rest`                       | —                | Detik istirahat setelah setiap set; `0` untuk tanpa timer. Tidak diisi: `workout-timer` di bagian yang sama |
| `timer.*`                    | —                | Opsi timer istirahat lainnya: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Grafik dan tren

Blok `workout-chart` menggambar satu ukuran dari waktu ke waktu: berat, volume, repetisi, estimasi 1RM, durasi, jarak, pace, atau detak jantung. Judul menunjukkan apakah tren **Meningkat**, **Stabil**, atau **Menurun**. Stabil berarti garis tren bergerak kurang dari 5% dari rata-rata selama seluruh periode, sehingga kenaikan yang lambat dan stabil tetap dihitung sebagai meningkat. Untuk pace, makin rendah makin baik, dan garis yang turun ditampilkan sebagai membaik. Di ponsel, grafik berubah menjadi tabel dengan nilai yang sama.

Gunakan `type: e1rm` untuk estimasi satu repetisi maksimum harian terbaik (Epley: `weight × (1 + reps / 30)`). Hanya berat positif dengan repetisi bilangan bulat 1 sampai 12 yang dihitung; set pemanasan dan drop set dikecualikan. Hari tanpa set yang memenuhi syarat dihilangkan. Estimasi mengikuti pengaturan kg/lb Anda. Grafik kekuatan default tetap volume.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API menambahkan `estimatedOneRepMax` ke `getExerciseStats`: estimasi terbaik dalam satuan berat yang diatur, atau `null` jika tidak ada set yang memenuhi syarat. Kolom PR yang ada dan kolom CSV tidak berubah.

![Grafik estimasi 1RM bench press dengan garis tren yang meningkat di desktop, dan nilai yang sama sebagai tabel di ponsel](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Semua parameter</summary>

| Parameter       | Default        | Fungsinya                                                                 |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Hanya latihan ini                                                         |
| `workout`       | —              | Hanya sesi ini                                                            |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `e1rm`, `duration`, `distance`, `pace` atau `heartRate` |
| `chartType`     | `exercise`     | Cara titik setiap hari dibuat (di bawah)                                  |
| `dateRange`     | `30`           | Jumlah hari yang disertakan                                               |
| `limit`         | —              | Hanya N titik terbaru                                                     |
| `showTrendLine` | `false`        | Gambar garis tren                                                         |
| `showTrend`     | `true`         | Tampilkan header tren di atas grafik                                      |
| `showStats`     | `true`         | Tampilkan rata-rata, terbaik, dan terendah di bawah grafik                |
| `title`         | `Trend <type>` | Judul grafik                                                              |
| `height`        | 4:3            | `300` (piksel) atau panjang CSS apa pun seperti `50vh`                    |
| `exactMatch`    | `false`        | Cocokkan nama latihan secara persis                                       |

| `chartType` | Set yang dipakai                    | Titik tiap hari |
| ----------- | ----------------------------------- | --------------- |
| `exercise`  | set dari `exercise`                 | rata-rata       |
| `workout`   | set dari `workout`                  | total           |
| `combined`  | set dari `exercise` dalam `workout` | total           |
| `all`       | setiap set (filter diabaikan)       | total           |

</details>

## Dasbor dan peta panas otot

Blok `workout-dashboard` dibuka dengan empat angka: total latihan, rentetan mingguan, total volume, dan rekor pribadi. Di bawahnya ada statistik cepat untuk minggu, bulan, dan tahun, tren volume, latihan terbaru, statistik protokol, durasi latihan yang direncanakan vs. aktual, dan kalender latihan: setahun hari latihan, diberi warna menurut volume, dengan rentetan saat ini dan terbaik Anda. Satu minggu dihitung untuk rentetan setelah memiliki jumlah hari latihan sesuai target mingguan Anda (Pengaturan → Target mingguan, default 1). Di ponsel, tindakan cepat tampil lebih dulu dan ringkasan berbentuk kisi 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Dasbor di ponsel: ringkasan, kalender latihan dengan target minggu ini tercapai, latihan terbaru, dan statistik cepat">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Untuk memilih widget dan urutannya tanpa menulis YAML, sisipkan dasbor dengan perintah **Sisipkan dasbor latihan**, atau buka menu ⋮ di kanan atas dasbor yang disisipkan lalu pilih **Sunting dasbor**.

Atur **Tata letak** ke **Grid** di jendela itu untuk menempatkan setiap widget sendiri, seperti item dalam inventaris: seret widget untuk memindahkannya, seret sudutnya untuk membuatnya lebih lebar atau lebih tinggi, dan lepaskan di bawah grid untuk mengeluarkannya. Keyboard juga berfungsi: panah untuk memindahkan, Shift dan panah untuk mengubah ukuran, Delete untuk mengeluarkan widget. Grid memiliki sebanyak kolom yang muat di lebar catatan Anda; di panel yang lebih sempit, widget disusun ulang mengikuti urutan baca, dan di ponsel widget ditumpuk. Tata letak Anda disimpan: saat catatan hanya muat satu kolom (ponsel), jendela akan menanyakan berapa kolom yang akan disunting, dimulai dari yang tersimpan. Blok menyimpan satu baris per widget (kolom, baris, lebar, tinggi):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Peta panas menunjukkan otot yang Anda latih selama seminggu, sebulan, atau setahun terakhir, depan dan belakang, berdasarkan **Volume**, **Set**, atau **Repetisi**. Ini cara tercepat untuk menyadari bahwa Anda telah melewatkan kaki selama tiga minggu. Di bawahnya, analisis latihan singkat memperingatkan ketidakseimbangan, misalnya bagian depan bekerja jauh lebih banyak daripada belakang. Analisis ini membaca tag otot dari [halaman latihan](#jenis-latihan) Anda. Latihan berat badan dan berbasis waktu tidak memiliki berat, sehingga hanya menyala di bawah Set dan Repetisi.

<img src="assets/heatmap.png" width="720" alt="Peta panas otot untuk minggu ini di ponsel, depan dan belakang: quads, glutes dan hamstring terlatih, dengan analisis latihan di bawahnya">

<details>
<summary>Semua parameter</summary>

| Parameter             | Default | Fungsinya                                                                                                                                                                                                   |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —       | Judul di atas dasbor                                                                                                                                                                                        |
| `dateRange`           | all     | Hanya set dari N hari terakhir                                                                                                                                                                              |
| `widgets`             | all     | Widget yang ditampilkan, dalam urutan ini: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`  | `grid` menempatkan setiap widget di selnya (lihat di atas)                                                                                                                                                  |
| `columns`             | —       | Grid: jumlah kolom yang dibuat untuk grid                                                                                                                                                                   |
| `grid.<widget>`       | —       | Grid: kolom, baris, lebar, dan tinggi widget itu                                                                                                                                                            |
| `recentWorkoutsLimit` | `5`     | Latihan dalam daftar terbaru                                                                                                                                                                                |
| `volumeTrendDays`     | `30`    | Hari dalam grafik tren volume                                                                                                                                                                               |

</details>

<details>
<summary>Tag otot</summary>

Tag bisa berupa daftar, satu kata (`tags: chest`), atau satu baris dipisahkan koma (`tags: chest, triceps`).

Kelompok umum: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Otot spesifik memiliki area tubuhnya sendiri dan dihitung ke kelompoknya. Tag umum tersebar di seluruh area: `chest` menyalakan ketiga bagian dada sedikit, `upper_chest` hanya menyalakan bagian atas sepenuhnya.

| Kelompok    | Otot spesifik                               |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (atau `ql`) |
| `core`      | `obliques`, `serratus`                      |

Tag dalam bahasa Anda sendiri, seperti `petto` atau `schiena`, juga berfungsi. Plugin memetakannya ke kelompok di atas menggunakan `muscle-tags.csv`, di sebelah log Anda. Sunting dengan **Kelola tag otot** (tambah, ganti nama, cari, temukan duplikat) atau secara manual:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Tag yang sudah berupa nama kelompok (`upper_chest`, `Upper chest`, `upper-chest`) selalu berfungsi, bahkan jika `muscle-tags.csv` tidak mencantumkannya.

</details>

## Timer

Blok `workout-timer` adalah timer hitung mundur, interval, atau stopwatch. Simpan waktu istirahat biasa Anda sebagai preset. Tautkan timer ke latihan atau sesi dan timer akan dimulai ulang setiap kali Anda mencatat set, sehingga Anda tidak perlu menyentuhnya di antara set. Dengan `autoStart: true`, timer dimulai begitu catatan dibuka.

<img src="assets/timers.png" width="320" alt="Dua timer di ponsel: timer interval dalam fase istirahat dan preset Tabata dalam fase kerja putaran 2">

Timer juga berbunyi bip di iOS dan Android. Ponsel hanya mengizinkan suara setelah Anda mengetuk halaman, jadi timer yang dimulai oleh `autoStart` tetap senyap sampai Anda mengetuk **Mulai** sekali.

Di bawah **Pengaturan → Workout Planner → Petunjuk perangkat timer**, **Biarkan layar menyala saat timer berjalan** aktif secara default. Fitur ini meminta perlindungan layar selama setidaknya satu timer berjalan di latar depan, jika perangkat mendukungnya. **Getarkan saat timer selesai** nonaktif secara default dan menambahkan getaran singkat saat nol, terpisah dari suara, di perangkat yang mendukung seperti Android. iOS tetap menggunakan isyarat audio yang ada; getaran web tidak tersedia di sana. Fitur ini memakai API peramban dengan upaya terbaik dan belum diverifikasi di perangkat Android/iOS sungguhan. Fitur ini tidak menyediakan alarm latar belakang. Timer dengan `id` tetap berjalan saat Anda berpindah catatan; jeda atau biarkan selesai untuk melepas perlindungan layar.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Timer interval dapat bergantian antara kerja dan istirahat. Tampilannya menunjukkan **Kerja** atau **Istirahat**, dan setiap fase dimulai dengan bunyinya sendiri. Tiap putaran terdiri dari kerja diikuti istirahat, termasuk putaran terakhir, sehingga Tabata ini berjalan 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (kerja 20 detik, istirahat 10 detik, 8 putaran) dan `preset: EMOM` (satu putaran setiap menit selama 10 menit) sudah tersedia bawaan. Preset tersimpan dengan nama yang sama akan menggantikannya.

<details>
<summary>Semua parameter</summary>

| Parameter             | Default     | Fungsinya                                                             |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` atau `stopwatch`                              |
| `duration`            | `30`        | Detik (hitung mundur; untuk interval, kerja tiap putaran)             |
| `work`                | —           | Interval: detik kerja per putaran (menggantikan `duration`)           |
| `rest`                | `0`         | Interval: detik istirahat setelah kerja tiap putaran                  |
| `rounds`              | `1`         | Putaran (interval)                                                    |
| `sound`               | `true`      | Bunyi bip saat waktu habis                                            |
| `autoStart`           | `false`     | Mulai begitu catatan dibuka                                           |
| `showControls`        | `true`      | Tampilkan mulai, jeda, dan atur ulang                                 |
| `preset`              | —           | Mulai dari preset (tersimpan, `Tabata`, atau `EMOM`); parameter menggantikannya |
| `exercise`, `workout` | —           | Mulai ulang timer saat Anda mencatat set untuk latihan atau sesi ini  |
| `superset`            | `false`     | Hanya ekspor kanvas: gambar latihan ini dan latihan berikutnya sebagai superset |

</details>

## Sesi terpandu

Blok `workout-session` di bagian atas catatan latihan (perintah **Sisipkan sesi terpandu**) memandu Anda melalui latihan satu latihan per waktu: set mana yang sedang Anda kerjakan, targetnya, apa yang Anda lakukan terakhir kali, tombol **Catat set**, dan timer istirahat, yang dimulai saat Anda mencatat set.

![Sesi terpandu di ponsel: set 3 dari 4 squat dengan istirahat berjalan di sesi dan di kartu set, formulir log dibuka oleh Catat set, lalu latihan berikutnya dengan timer istirahatnya berjalan](assets/session.png)

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

Rencana adalah catatan itu sendiri: setiap blok `workout-log` atau `workout-sets` dengan `exercise` menjadi satu langkah, sesuai urutan kemunculannya, dengan `sets`, `targetReps`, dan `targetWeight`-nya. Istirahatnya berasal dari `rest` pada blok `workout-sets`, atau dari `workout-timer` dalam bagian `##` yang sama (preset default jika tidak ada). Sesi dan kartu set berbagi satu hitung mundur. Sesi menghitung set yang Anda catat hari ini dalam latihan ini, sehingga melanjutkan dari tempat Anda berhenti saat membuka kembali catatan. Latihan tanpa `sets` tetap aktif hingga Anda mencatat set dari latihan berikutnya; **Sebelumnya** dan **Berikutnya** dapat dipakai bebas.

## Durasi latihan

Blok `workout-duration` memperkirakan berapa lama sebuah catatan latihan: istirahat dari timernya ditambah waktu untuk setiap set, di samping berapa lama sesi terakhir Anda sebenarnya.

<img src="assets/duration.png" width="420" alt="Kartu estimasi durasi dengan waktu istirahat, waktu set, dan sesi terakhir">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` bisa berupa path di vault, path relatif terhadap catatan ini, atau hanya nama catatan; kosongkan untuk memperkirakan catatan saat ini. Detik per repetisi dan per set berasal dari [Pengaturan](#pengaturan).

## Jenis latihan

Halaman latihan adalah catatan di folder latihan Anda. Frontmatter-nya menyatakan apa yang harus ditanyakan formulir log dan otot mana yang dilatih. **Buat halaman latihan** membuatnya untuk Anda.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Formulir log meminta                         | Juga diterima                                                |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (bawaan)  | repetisi, berat                              | `bodyweight`, `weights`                                      |
| `timed`              | durasi                                       | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | jarak, durasi (opsional)                     | `running`, `run`                                             |
| `cardio`             | durasi, jarak, dan detak jantung (opsional)  | —                                                            |
| `custom`             | hanya kolom yang Anda daftarkan di `parameters` | —                                                         |

Yoga bekerja dengan cara yang sama: setiap pose adalah latihan `timed`, sehingga formulir hanya menanyakan berapa lama Anda menahannya. Catatan contoh mencakup alur yoga pagi dengan sesi terpandu.

![Alur yoga di ponsel: sesi terpandu pada Downward Dog, formulir log yang hanya meminta durasi tahan, dan kartu set dengan tahanan pertama tercatat](assets/yoga.png)

Untuk olahraga yang mencatat hal lain (grade panjat, percobaan, apakah Anda berhasil mendakinya), buat jenis Anda sendiri di **Pengaturan → Jenis latihan**: beri nama dan pilih bidangnya, bidang bawaan seperti repetisi dan berat, atau bidang baru (angka, teks, atau ya/tidak). Jenis itu lalu muncul dalam daftar jenis saat Anda membuat latihan, yang menulis `exercise_type: <jenis Anda>` di halaman. Jenis bawaan tidak dapat diubah, tetapi **Duplikat** memulai jenis dari salah satunya. Menghapus jenis hanya berhenti menawarkannya: latihan yang memakainya tetap menyimpan bidang dan set yang sudah dicatat.

`type:` bekerja sama seperti `exercise_type:`. Anda juga bisa menambahkan kolom ke satu latihan di bawah `parameters`, misalnya putaran untuk lompat tali:

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

Jika Anda mengubah jenis latihan setelah mencatatnya, **Konversi latihan** memindahkan set yang ada dan memungkinkan Anda memilih kolom lama mana yang masuk ke mana.

## Data Anda

Setiap set adalah satu baris di `workout_logs.csv`, sehingga Anda dapat membukanya di spreadsheet, mencadangkannya, atau menyinkronkannya seperti file lain.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Kolom dan penyuntingan manual</summary>

| Kolom                      | Artinya                                    |
| -------------------------- | ------------------------------------------ |
| `date`                     | Kapan set dicatat (ISO 8601)               |
| `exercise`, `workout`      | Nama latihan dan sesi                      |
| `reps`, `weight`, `volume` | Volume adalah repetisi × berat             |
| `origine`                  | Tautan ke catatan tempat set dicatat       |
| `timestamp`                | ID unik baris (milidetik)                  |
| `notes`, `protocol`        | Teks bebas dan teknik latihan              |

Jenis latihan dengan kolomnya sendiri (`duration`, `distance`, `heartRate`, atau `parameters` Anda) menambahkan kolom di akhir. Kolom terakhir, `weightUnit`, berisi `kg` atau `lb`: satuan dari `weight` dan `volume` pada baris tersebut. Nilai kosong berarti satuan di pengaturan.

Jika Anda menyunting file secara manual, pertahankan baris header, dan apit nilai yang mengandung koma, tanda kutip, atau pemutusan baris dengan tanda kutip ganda. Catatan yang diawali `=`, `+`, `-`, atau `@` disimpan dengan awalan `'` agar spreadsheet tidak menjalankannya sebagai rumus; plugin menyembunyikannya kembali.

</details>

Semua tetap di vault Anda. Plugin hanya menulis ke papan klip saat Anda mengklik lencana salin (tag otot di dasbor), dan tidak pernah membacanya.

### Dataview dan Templater

Plugin mengekspos `WorkoutPlannerAPI` (juga `window.WorkoutPlannerAPI`) setelah dimuat.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Referensi API dan contoh lainnya</summary>

| Metode                       | Mengembalikan                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Set, masing-masing dengan `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` dan `volume` dalam satuan pengaturan; `enteredWeight` dan `enteredUnit` adalah yang dicatat                              |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Nama latihan, diurutkan: nama file halaman latihan Anda (termasuk subfolder), atau nama di log Anda jika belum punya halaman latihan. `{ tag: "chest" }` mempertahankan latihan yang halamannya memiliki tag itu, sehingga kosong tanpa halaman latihan. |

`getWorkoutLogs` menerima `exercise` (sebagian, tidak peka huruf besar-kecil), `workout`, `dateRange: { start, end }`, `protocol`, dan `exactMatch`.

Squat terbaru, di Dataview:

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

Di templat [Templater](https://github.com/SilentVoid13/Templater), untuk memulai catatan dengan angka terbaru Anda:

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

## Pengaturan

Atur folder CSV dan latihan, satuan berat default, langkah berat tombol **+/−**, preset timer, protokol Anda sendiri (nama, label singkat, dan warna), serta detik per repetisi dan per set yang digunakan oleh estimasi durasi. **Jalankan semua** di bagian Lanjutan menjalankan setiap tugas pemeliharaan setelah pembaruan.

Mengubah satuan berat tidak mengganti label set lama: setiap set tetap menyimpan satuan saat dicatat.

<details>
<summary>Semua perintah</summary>

Buka palet perintah (`Ctrl/Cmd + P`) dan ketik namanya.

| Perintah                                                                                                | Fungsinya                                                                   |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Buat catatan latihan                                                                                    | Catat satu set                                                              |
| Buat catatan contoh                                                                                     | Tambahkan latihan, sesi, log, dan dasbor contoh                             |
| Buka panduan memulai, Mulai tur                                                                         | Buka panduan di contoh                                                      |
| Tampilkan yang baru                                                                                     | Tampilkan apa yang berubah di setiap versi                                  |
| Sisipkan grafik latihan / tabel latihan / set latihan / timer latihan / dasbor latihan / durasi latihan | Sisipkan blok lewat formulir                                                |
| Sisipkan sesi terpandu                                                                                  | Sisipkan blok `workout-session` di kursor                                   |
| Buat halaman latihan                                                                                    | Halaman latihan baru dengan jenis dan tag                                   |
| Tambah blok latihan                                                                                     | Tambahkan bagian untuk latihan dengan blok set-nya, dengan autolengkap nama |
| Konversi latihan                                                                                        | Pindahkan set latihan ke jenis latihan lain                                 |
| Kelola tag otot                                                                                         | Sunting `muscle-tags.csv`                                                   |
| Buat referensi tag                                                                                      | Buat catatan yang mencantumkan setiap tag otot                              |
| Audit nama latihan                                                                                      | Temukan latihan yang sama yang dicatat dengan ejaan berbeda                 |
| Ekspor latihan ke kanvas                                                                                | Susun latihan saat ini di kanvas Obsidian                                   |
| Buat file log CSV                                                                                       | Buat log kosong                                                             |
| Impor dari Strong atau Hevy                                                                             | Tambahkan set dari ekspor CSV Strong atau Hevy ke log                       |
| Migrasikan jenis latihan, Tambahkan ID yang hilang ke blok kode                                         | Pemeliharaan setelah memperbarui dari versi lama                            |

</details>

## Pemecahan masalah

- **Konflik dengan Workout Block (`workout-block`).** Kedua plugin mendaftarkan blok kode `workout-log` dan menggunakan `workout_logs.csv` sebagai nama file log default. Nonaktifkan salah satu dari dua plugin sebelum memakai yang lain.

- **Tabel atau grafik kosong.** Periksa nama latihan dan `dateRange` (grafik default ke 30 hari terakhir). Dengan `exactMatch: true`, nama harus persis sama.
- **Sebuah latihan tidak ada di peta panas.** Halamannya memerlukan `tags` otot dan harus berada di folder latihan. Latihan berat badan dan berbasis waktu hanya muncul di bawah **Set** atau **Repetisi**.
- **Formulir log meminta repetisi dan berat untuk plank.** Atur `exercise_type: timed` di halaman latihan.
- **Timer tidak berbunyi di ponsel saya.** Ketuk **Mulai** sekali; ponsel memblokir suara sampai Anda menyentuh halaman.

## Instalasi

### Dari plugin komunitas

1. Buka **Pengaturan → Plugin komunitas**
2. Cari **Workout Planner**
3. Pilih **Pasang**, lalu **Aktifkan**

### Manual

1. Unduh `main.js`, `manifest.json`, dan `styles.css` dari [rilis terbaru](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Buat folder `your-vault/.obsidian/plugins/workout-planner/`
3. Salin file yang diunduh ke dalam folder itu
4. Aktifkan plugin di **Pengaturan → Plugin komunitas**

## Dukungan

Workout Planner gratis dan open source. Jika membantu latihan Anda, Anda dapat [membelikan saya kopi](https://buymeacoffee.com/spatariurares). Menemukan bug atau ada yang kurang? Buka [issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Setiap bahasa selain Inggris diterjemahkan dengan mesin, jadi beberapa frasa mungkin terdengar janggal. Jika bahasa Anda terdengar aneh, koreksi sangat diterima.

## Kredit

Grafik menggunakan [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner dirilis di bawah [Lisensi MIT](LICENSE).
