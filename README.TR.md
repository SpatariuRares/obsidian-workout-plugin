<img src="assets/logo.png" width="96" alt="Workout Planner logosu">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · Türkçe · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Obsidian için hepsi bir arada antrenman takipçisi.** Ağırlık antrenmanı, koşu, bisiklet, yoga ya da kendi alanlarınızla tanımladığınız egzersizler: setlerinizi telefonunuzdan kaydedin, rehberli bir antrenmanı takip edin ve ilerlemenizi grafiklerde, bir gösterge panelinde ve bir kas ısı haritasında görün. Tek bir CSV, 24 dil.

Telefonunuz için tasarlandı: antrenman yaparken her seti, koşuyu ya da pozu kaydedin, ardından antrenmanınızı planladığınız aynı notların içinde tablolarda, grafiklerde ve bir gösterge panelinde ilerlemenizi izleyin. Setleriniz kasanızdaki tek bir CSV dosyasına yazılır. Hesap yok, bulut yok.

Grafikler trendinizi gösterir, kas ısı haritası neyi çalıştırdığınızı gösterir ve her set kendi kg/lb birimini korur. Setlerinizi Dataview'dan sorgulayabilirsiniz.

![Telefonda Workout Planner: dinlenme zamanlayıcısı çalışan rehberli bir antrenman, +/− düğmeli ve kg/lb seçicili kayıt formu ve antrenman takvimli özet gösterge paneli](assets/hero.png)

## Özellikler

- Tekrar ve ağırlıkla set kaydedin; son setinizden otomatik doldurulur, +/− düğmeleri ve tek dokunuşla son egzersizler
- Her seti kg ya da lb cinsinden kaydedin; önünüzdeki plakaların ne dediği önemli değil
- Setleri bir protokolle etiketleyin: drop set, myo-reps, rest-pause, superset, 21s veya kendi protokolünüz
- Setlerinizin tabloları, günlük toplamlarıyla günlere göre gruplanır ve tek dokunuşla düzenlenebilir
- Bugünün setleri, telefonunuzda doldurabileceğiniz satırlar olarak: bir seti işaretleyerek kaydedin, dinlenme zamanlayıcısı kendiliğinden başlar
- Ağırlık, hacim, tekrar, süre, mesafe, tempo ve nabız grafikleri; ayrıca ilerleyip ilerlemediğinizi açıkça söyleyen bir trend
- Haftalık seri (haftalık hedefle), antrenman takvimi, kişisel rekorlar, toplam hacim, son antrenmanlar ve protokol istatistikleri içeren bir gösterge paneli
- Ön ve arka görünümlü, hacme, sete ya da tekrara göre bir kas ısı haritası
- Ön ayarlarıyla geri sayım, aralık ve kronometre dinlenme zamanlayıcıları; set kaydettiğinizde yeniden başlar ve iOS ile Android'de bip sesi çalar
- Antrenman notunu egzersiz egzersiz adım adım gezen rehberli bir antrenman
- Planlanan bir antrenmanın ne kadar süreceğinin tahmini
- Güç, vücut ağırlığı, süreli, mesafe ve kardiyo egzersizleri ya da kendi alanlarınız
- Tüm setler tek ve sade bir CSV dosyasında; Dataview ve Templater'dan okunabilir
- Telefonlar için tasarlandı: yana kaydırma yok, düğmeler her zaman elinizin altında
- 24 dilde kullanılabilir

## Başlarken

Eklentiyi ilk kez kurduğunuzda örnek notlar ekler (örnek egzersizler, altı haftalık kayıtları olan iki antrenman, bir gösterge paneli ve bir özellik tanıtımı), eklentiyi bunlara yönlendirir ve **Başlangıç kılavuzu**nu açar: her özellik için kısa bir sayfa, denemeniz için çalışan örneklerle. Ayarları açmanız gerekmez. Kendi notlarınızı kurmadan önce etrafa göz atın.

### Rehberli tur

Tur, bir tablo, bir grafik, bir gösterge paneli ve bir zamanlayıcı içeren bir "Rehberli tur" notu açar ve her birine sırayla işaret eder. Dokuz kısa adımı vardır:

1. **+** düğmesiyle ilk setinizi kaydedin. Adım, kaydettiğinizde tamamlanır.
2. Her satırdaki düğmelerle bir seti düzenleyin ya da silin.
3. İlerlemenizi grafikte görün.
4. Toplamları ve trendleri gösterge panelinde görün.
5. Kas ısı haritasında hangi kasları çalıştırdığınızı görün.
6. Dinlenme zamanlayıcısını başlatın. Adım, başlat tuşuna bastığınızda tamamlanır.
7. Şeritteki dambıl simgesini bulun; bu simge herhangi bir nottan kayıt formunu açar. Telefonda bunun yerine komut paletini kullanın.
8. Komut paletinden herhangi bir **Antrenman ... ekle** komutunu çalıştırın. Adım, bunu yaptığınızda tamamlanır.
9. Tamamlandı.

Gezinmek için **Geri** ve **İleri** düğmelerini, çıkmak için **Atla** düğmesini kullanın. Turun işaret ettiği bölüm görünmüyorsa **Beni göster** o kısma kaydırır. Turu istediğiniz zaman bitirmek için `Esc` tuşuna basın. Notu kapatırsanız ya da başka bir dosyaya geçerseniz tur da sona erer. Hiçbir şey kaybolmaz: setleriniz kayıtta kalır.

Örnek veriler kullanılırken tur onlar üzerinde çalışır. Değilse kendi kayıtlarınız üzerinde çalışır; bu durumda grafik ve gösterge paneli neredeyse boş başlar. Not bir kez oluşturulur; örneklerin yanına ya da kasanızın en üstüne. Var olan bir not asla üzerine yazılmaz ve dilediğiniz gibi düzenleyebilir ya da silebilirsiniz. "Rehberli tur" adlı bir not zaten varsa ve turun kendi notu değilse, tur bunun yerine "Rehberli tur 1" (ya da bir sonraki boş numara) kullanır.

Turu yeniden mi almak istiyorsunuz? **Ayarlar → Workout Planner → Başlangıç** altında **Turu başlat** seçeneğini seçin ya da komut paletinden **Turu başlat** komutunu çalıştırın.

Örnekleri ya da kılavuzu yeniden mi istiyorsunuz? **Ayarlar → Workout Planner → Başlangıç** altında **Örnekleri oluştur** ya da **Başlangıç kılavuzunu aç** seçeneğini seçin; ya da komut paletinden (`Ctrl/Cmd + P`) **Örnek notlar oluştur** ya da **Başlangıç kılavuzunu aç** komutunu çalıştırın. Örnekleri oluşturmak hiçbir şeyin üzerine yazmaz: yeniden çalıştırmak yalnızca eksik örnek dosyaları ekler, değiştirdiğiniz dosyalar olduğu gibi kalır. Kılavuz, örnekler henüz yoksa bunları oluşturmayı önerir. Boş bir tablo, grafik ya da gösterge paneli de **Veya örnek veriyle keşfet** bağlantısını gösterir. Zaten bir antrenman kaydınız varsa örnekler kendi kayıt dosyasını alır ve sizinki dokunulmadan kalır.

Herhangi bir nota, örneğin `Push Day` notuna tablo eklemek için:

````markdown
```workout-log
exercise: Bench Press
```
````

Tablonun altındaki **+** düğmesine dokunun, tekrar ve ağırlığı girin, kaydedin. Tablo kendiliğinden güncellenir. Blokları elle yazmanız da gerekmez: **Antrenman grafiği ekle**, **Antrenman tablosu ekle**, **Antrenman zamanlayıcısı ekle**, **Antrenman gösterge paneli ekle** ve **Antrenman süresi ekle** komutları bir form açar ve bloğu sizin için ekler.

## Set kaydetme

Kayıt formunu, bir tablonun altındaki **+** ile (egzersiz sizin için doldurulur), şeritteki dambıl simgesiyle ya da **Antrenman kaydı oluştur** komutuyla açın. Form son setinizden başlar, bu yüzden çoğu zaman **+/−** düğmesine bir kez dokunup kaydetmeniz yeterlidir. Dinlenmeniz bitmeden tamamlayın.

Form, egzersize uygun alanları ister: bir squat için tekrar ve ağırlık, bir plank için saniye, bir koşu için mesafe ve süre (bkz. [Egzersiz türleri](#egzersiz-türleri)). Her set bir not ve bir protokol de taşıyabilir; bu, tabloda rozet olarak gösterilir.

Ağırlık alanında kg/lb seçici vardır, bu yüzden ayarınız kg olsa bile 225 lb kaydedebilirsiniz. Tablo bu seti "225 lb" olarak gösterir; grafikler, istatistikler ve hacim her seti ayarınızdaki birime çevirir.

Bir nottan set kaydettiğinizde notun adı setin **antrenman** bilgisi olarak kaydedilir; böylece `workout: Push Day` içeren bir tablo ya da grafik onu sonradan bulur.

## Tablolar

Bir `workout-log` bloğu, bir egzersizin ya da antrenmanın setlerini en yenisi önce olacak şekilde gösterir. Aynı güne ait setler, o günün toplamlarını içeren bir satırın altında gruplanır; her satırda bir düzenle düğmesi vardır ve seti düzenleme formundan silebilirsiniz. Telefonda her set, yana kaydırma olmadan kompakt bir satıra dönüşür.

<img src="assets/tables.png" width="720" alt="Telefonda bir workout-log tablosu: setler süresiyle birlikte günlere göre gruplanmış ve bir drop-set rozeti var; yanında + düğmesinin açtığı kayıt formu">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

`targetWeight` ve `targetReps` ile tablonun üstünde bir aşamalı yüklenme (progressive overload) hedefi görünür.

<details>
<summary>Tüm parametreler</summary>

| Parametre                    | Varsayılan | Ne yapar                                              |
| ---------------------------- | ---------- | ----------------------------------------------------- |
| `exercise`                   | —          | Yalnızca bu egzersiz                                  |
| `workout`                    | —          | Yalnızca bu antrenman (not adı)                       |
| `exactMatch`                 | `false`    | Egzersiz adını tam olarak eşleştir                    |
| `dateRange`                  | hepsi      | Bugün ve önceki N gün                                 |
| `limit`                      | `50`       | En fazla satır; `sets` ile `sets × 2` (iki antrenman) |
| `sortBy`                     | `date`     | `date`, `exercise`, `weight`, `reps` veya `volume`    |
| `sortOrder`                  | `desc`     | `asc` veya `desc`                                     |
| `columns`                    | hepsi      | Gösterilecek sütunlar, ör. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`     | Protokol rozet sütununu göster                        |
| `showAddButton`              | `true`     | **+** düğmesini göster                                |
| `targetWeight`, `targetReps` | —          | Tablonun üstünde aşamalı yüklenme hedefini göster     |
| `sets`                       | —          | Planlanan set sayısı; `workout-session` bloğu sayar   |

Egzersiz adları varsayılan olarak gevşek eşleşir ("squat" ifadesi "Squat (high bar)" egzersizini bulur); yalnızca tam adı istiyorsanız `exactMatch: true` ekleyin.

</details>

## Telefonda setler

`workout-sets` bloğu salonda kayıt için tasarlandı: bir egzersizin bugünkü setleri, doldurulacak satırlar olarak. Her satır, aynı setin geçen seferki değerini gösterir; bu yüzden yalnızca değişeni yazarsınız (boş bırakılan alan o değeri kaydeder) ve satırı işaretlersiniz. Set kayda girer, satır kaydedilmiş bir sete dönüşür ve üstteki dinlenme zamanlayıcısı kendiliğinden başlar. Kaydedilmiş bir setin okuyla protokolünü ve notlarını değiştirirsiniz; işaretini yeniden tıklamak seti kayıtlardan kaldırır ve birkaç saniye görünen **Geri al** ile geri getirirsiniz.

<img src="assets/sets.png" alt="Telefonda bir workout-sets kartı: geçen seferki değerlerle doldurulmuş dört satır, ardından dinlenme zamanlayıcısı çalışırken işaretlenmiş iki set, sonra Rest-pause protokolünü seçmek ve not eklemek için açılmış bir satır">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Egzersiz setlerini ekle** komutu komut paletinden sizin için bir tane yazar; ⋮ menüsü bloğu ya da dinlenme zamanlayıcısını düzenler.

<details>
<summary>Tüm parametreler</summary>

| Parametre                    | Varsayılan    | Ne yapar                                                                                         |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | Egzersiz (tam adı)                                                                               |
| `workout`                    | not adı       | Setlerin kaydedileceği antrenman                                                                 |
| `sets`                       | geçen seferki | Doldurulacak satır sayısı (en az bir); **Set ekle** daha fazlasını ekler                         |
| `targetWeight`, `targetReps` | —             | Egzersiz hiç yapılmadıysa ipucu; aşamalı yüklenme hedefi                                         |
| `rest`                       | —             | Her setten sonraki dinlenme (saniye); `0` zamanlayıcı yok demektir. Belirtilmezse: aynı bölümün `workout-timer` bloğu |
| `timer.*`                    | —             | Dinlenme zamanlayıcısının diğer seçenekleri: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Grafikler ve trendler

Bir `workout-chart` bloğu zaman içinde tek bir ölçüyü çizer: ağırlık, hacim, tekrar, tahmini 1RM, süre, mesafe, tempo ya da nabız. Başlıkta trendin **Artan**, **Kararlı** veya **Azalan** olduğu yazar. Kararlı, trend çizgisinin tüm dönem boyunca ortalamanın %5'inden az hareket ettiği anlamına gelir; yavaş ama düzenli bir artış da yine artış sayılır. Tempoda düşük değer daha iyidir ve düşen çizgi iyileşme olarak görünür. Telefonda grafik, aynı değerlerin bir tablosuna dönüşür.

`type: e1rm` ile günlük en iyi tahmini tek tekrar maksimumunu (Epley: `weight × (1 + reps / 30)`) görürsünüz. Yalnızca pozitif ağırlıklar ve 1 ile 12 arasındaki tam tekrarlar sayılır; ısınma ve drop setler hariç tutulur. Uygun seti olmayan günler atlanır. Tahminler kg/lb ayarınızı izler. Varsayılan güç grafiği hâlâ hacimdir.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API, `getExerciseStats` çıktısına `estimatedOneRepMax` ekler: yapılandırılmış ağırlık biriminde en iyi tahmin ya da uygun set yoksa `null`. Mevcut PR alanları ve CSV sütunları değişmez.

![Masaüstünde yükselen trend çizgisiyle bench press tahmini 1RM grafiği; telefonda aynı değerler bir tablo olarak](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Tüm parametreler</summary>

| Parametre       | Varsayılan     | Ne yapar                                                                  |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Yalnızca bu egzersiz                                                      |
| `workout`       | —              | Yalnızca bu antrenman                                                     |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` veya `heartRate` |
| `chartType`     | `exercise`     | Her günün noktasının nasıl oluşturulduğu (aşağıda)                        |
| `dateRange`     | `30`           | Dahil edilecek gün sayısı                                                 |
| `limit`         | —              | Yalnızca son N nokta                                                      |
| `showTrendLine` | `false`        | Trend çizgisi çiz                                                         |
| `showStats`     | `true`         | Grafiğin altında ortalama, en iyi ve en düşük değeri göster               |
| `title`         | `Trend <type>` | Grafik başlığı                                                            |
| `height`        | 4:3            | `300` (piksel) ya da `50vh` gibi herhangi bir CSS uzunluğu               |
| `exactMatch`    | `false`        | Egzersiz adını tam olarak eşleştir                                        |

| `chartType` | Kullanılan setler                         | Her günün noktası |
| ----------- | ----------------------------------------- | ----------------- |
| `exercise`  | `exercise` egzersizinin setleri           | ortalama          |
| `workout`   | `workout` antrenmanının setleri           | toplam            |
| `combined`  | antrenman içindeki `exercise` setleri     | toplam            |
| `all`       | her set (filtreler yok sayılır)           | toplam            |

</details>

## Gösterge paneli ve kas ısı haritası

Bir `workout-dashboard` bloğu dört sayıyla açılır: toplam antrenman, haftalık seri, toplam hacim ve kişisel rekorlar. Bunların altında haftalık, aylık ve yıllık hızlı istatistikler, bir hacim trendi, son antrenmanlarınız, protokol istatistikleri, planlanan ile gerçekleşen antrenman süresi ve bir antrenman takvimi görürsünüz: hacme göre renklendirilmiş, bir yıllık antrenman günleri ve mevcut ile en iyi seriniz. Bir hafta, haftalık hedefinizdeki antrenman gün sayısına ulaştığında seriye sayılır (Ayarlar → Haftalık hedef, varsayılan 1). Telefonda hızlı eylemler önce gelir ve özet 2 × 2 bir ızgara olur.

<img src="assets/dashboard.png" width="720" alt="Telefonda gösterge paneli: özet, bu haftanın hedefinin tutturulduğu antrenman takvimi, son antrenmanlar ve hızlı istatistikler">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Widget'ları ve sıralarını YAML yazmadan seçmek için paneli **Antrenman gösterge paneli ekle** komutuyla ekleyin ya da eklenmiş bir panelin sağ üstündeki ⋮ menüsünü açıp **Gösterge panelini düzenle** seçeneğini seçin.

Bu pencerede **Düzen**i **Izgara** olarak ayarlayın; böylece her widget'ı kendiniz yerleştirirsiniz, tıpkı bir envanterdeki öğeler gibi: widget'ı taşımak için sürükleyin, köşesinden sürükleyerek genişliğini ve yüksekliğini değiştirin, ızgaranın altına bırakarak kaldırın. Klavye de çalışır: oklar taşır, Shift ve oklar boyutu değiştirir, Delete widget'ı kaldırır. Izgara, notunuzun genişliğine sığan kadar sütuna sahiptir; daha dar bir bölmede widget'lar okuma sırasına göre yeniden dizilir, telefonda ise alt alta gelir. Yerleşiminiz korunur: not yalnızca tek sütuna sığdığında (telefon) pencere kaç sütunla düzenleneceğini sorar ve kayıtlı sütun sayısından başlar. Blok her widget için bir satır tutar (sütun, satır, genişlik, yükseklik):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

Isı haritası, son bir hafta, ay ya da yılda hangi kasları çalıştırdığınızı gösterir; ön ve arka görünümlerde **Hacim**, **Setler** ya da **Tekrar sayısı** ölçüsüyle. Ön tarafınızın arkanızdan çok daha fazla çalışması gibi dengesizlikleri, altındaki kısa bir antrenman analizi size bildirir. Bu analiz, [egzersiz sayfalarınızın](#egzersiz-türleri) kas etiketlerini okur. Vücut ağırlığı ve süreli egzersizlerde ağırlık olmaz, bu yüzden yalnızca Setler ve Tekrar sayısı altında yanarlar.

<img src="assets/heatmap.png" width="720" alt="Telefonda haftalık kas ısı haritası, ön ve arka: kuadriseps, kalça ve hamstringler çalıştırılmış, altında antrenman analizi">

<details>
<summary>Tüm parametreler</summary>

| Parametre             | Varsayılan | Ne yapar                                                                                                                                                                                                    |
| --------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —          | Panelin üstündeki başlık                                                                                                                                                                                    |
| `dateRange`           | hepsi      | Yalnızca son N günün setleri                                                                                                                                                                                |
| `widgets`             | hepsi      | Gösterilecek widget'lar, bu sırayla: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`     | `grid` her widget'ı kendi hücrelerine yerleştirir (yukarıya bakın)                                                                                                                                         |
| `columns`             | —          | Izgara: ızgaranın tasarlandığı sütun sayısı                                                                                                                                                                 |
| `grid.<widget>`       | —          | Izgara: o widget'ın sütunu, satırı, genişliği ve yüksekliği                                                                                                                                                 |
| `recentWorkoutsLimit` | `5`        | Son listedeki antrenman sayısı                                                                                                                                                                              |
| `volumeTrendDays`     | `30`       | Hacim trendi grafiğindeki gün sayısı                                                                                                                                                                        |

</details>

<details>
<summary>Kas etiketleri</summary>

Etiketler bir liste, tek bir kelime (`tags: chest`) ya da virgülle ayrılmış bir satır (`tags: chest, triceps`) olabilir.

Geniş gruplar: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Belirli kasların vücutta kendi bölgesi vardır ve kendi grubuna dahil olur. Geniş bir etiket tüm bölgeye yayılır: `chest` göğsün üç bölümünün hepsini biraz aydınlatır, `upper_chest` ise yalnızca üst bölümü tam olarak aydınlatır.

| Grup        | Belirli kaslar                              |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (or `ql`) |
| `core`      | `obliques`, `serratus`                      |

Kendi dilinizdeki etiketler, örneğin `petto` ya da `schiena`, de çalışır. Eklenti bunları, kayıt dosyanızın yanındaki `muscle-tags.csv` dosyasını kullanarak yukarıdaki gruplara eşler. **Kas etiketlerini yönet** ile düzenleyin (ekleyin, yeniden adlandırın, arayın, kopyaları bulun) ya da dosyayı elle düzenleyin:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Zaten bir grup adı olan etiket (`upper_chest`, `Upper chest`, `upper-chest`) `muscle-tags.csv` dosyasında listelenmese bile her zaman çalışır.

</details>

## Zamanlayıcılar

Bir `workout-timer` bloğu geri sayım, aralık ya da kronometre zamanlayıcısıdır. Olağan dinlenme sürelerinizi ön ayar olarak kaydedin. Bir zamanlayıcıyı bir egzersize ya da antrenmana bağlarsanız, her set kaydettiğinizde yeniden başlar; setler arasında ona dokunmanız gerekmez. `autoStart: true` ile not açılır açılmaz başlar.

<img src="assets/timers.png" width="320" alt="Telefonda iki zamanlayıcı: dinlenme aşamasındaki bir aralık zamanlayıcısı ve 2. turun çalışma aşamasındaki bir Tabata ön ayarı">

iOS ve Android'de de bip sesi çalar. Telefonlar sayfaya dokunmadan ses çalmaya izin vermez; bu yüzden `autoStart` ile başlayan bir zamanlayıcı, **Başlat**a bir kez dokunana kadar sessiz kalır.

**Ayarlar → Workout Planner → Zamanlayıcı cihaz uyarıları** altında **Zamanlayıcı çalışırken ekranı açık tut** varsayılan olarak açıktır. Cihazın izin verdiği durumda, en az bir zamanlayıcı ön planda çalışırken ekran koruması ister. **Zamanlayıcı bittiğinde titreşim** varsayılan olarak kapalıdır; sıfırda, sesten bağımsız kısa bir titreşim ekler, Android gibi desteklenen cihazlarda. iOS'ta mevcut ses uyarısı korunur; web titreşimi orada kullanılamaz. Bu özellikler tarayıcı API'lerini en iyi çaba esasıyla kullanır ve henüz fiziksel Android/iOS cihazlarda doğrulanmadı. Arka plan alarmı sağlamazlar. `id` içeren bir zamanlayıcı, notları değiştirseniz de çalışmaya devam eder; ekran korumasını bırakmak için duraklatın ya da bitmesini bekleyin.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Bir aralık zamanlayıcısı çalışma ve dinlenme arasında geçiş yapabilir. Ekran **Çalışma** ya da **Dinlenme** gösterir ve her aşama kendi sesiyle başlar. Her tur, çalışma ve ardından dinlenmedir; sonuncusu dahil. Bu yüzden aşağıdaki Tabata 4:00 sürer:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 sn çalışma, 10 sn dinlenme, 8 tur) ve `preset: EMOM` (10 dakika boyunca her dakika bir tur) yerleşiktir. Aynı adlı kayıtlı bir ön ayar bunların yerini alır.

<details>
<summary>Tüm parametreler</summary>

| Parametre             | Varsayılan  | Ne yapar                                                                         |
| --------------------- | ----------- | -------------------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` veya `stopwatch`                                         |
| `duration`            | `30`        | Saniye (geri sayım; aralıkta her turun çalışma süresi)                           |
| `work`                | —           | Aralık: tur başına çalışma saniyesi (`duration` yerine geçer)                    |
| `rest`                | `0`         | Aralık: her turun çalışmasından sonra dinlenme saniyesi                          |
| `rounds`              | `1`         | Tur sayısı (aralık)                                                              |
| `sound`               | `true`      | Süre dolunca bip sesi                                                            |
| `autoStart`           | `false`     | Not açılır açılmaz başlat                                                        |
| `showControls`        | `true`      | Başlat, duraklat ve sıfırla düğmelerini göster                                   |
| `preset`              | —           | Bir ön ayardan başla (kayıtlı, `Tabata` ya da `EMOM`); parametreler onu geçersiz kılar |
| `exercise`, `workout` | —           | Bu egzersiz ya da antrenman için set kaydedildiğinde zamanlayıcıyı yeniden başlat |
| `superset`            | `false`     | Yalnızca tuval dışa aktarımı: bu egzersizi ve sonrakini süperset olarak çiz     |

</details>

## Rehberli antrenman

Bir antrenman notunun en üstündeki `workout-session` bloğu (**Rehberli antrenman ekle** komutu) sizi bir seferde bir egzersiz boyunca yönlendirir: hangi setteyken olduğunuz, hedef, geçen seferki sonuç, bir **Seti kaydet** düğmesi ve bir dinlenme zamanlayıcısı. Zamanlayıcı, bir set kaydettiğinizde başlar.

![Telefonda rehberli antrenman: squat'ın 4 setinden 3. seti; dinlenme rehberli antrenmanda ve set kartında aynı anda sayıyor. Seti kaydet ile açılan kayıt formu, ardından dinlenme zamanlayıcısı çalışan sonraki egzersiz](assets/session.png)

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

Plan notun kendisidir: egzersizi olan her `workout-log` ya da `workout-sets` bloğu, göründükleri sırayla bir adımdır; `sets`, `targetReps` ve `targetWeight` değerleriyle birlikte. Dinlenme, `workout-sets` bloğunun kendi `rest` değerinden gelir; yoksa aynı `##` bölümündeki `workout-timer` bloğundan (onsuz varsayılan ön ayar). Rehberli antrenman ve set kartı tek bir geri sayımı paylaşır. Oturum, bu antrenmanda bugün kaydettiğiniz setleri sayar; bu yüzden notu yeniden açtığınızda kaldığınız yerden devam eder. `sets` değeri olmayan bir egzersiz, sonraki bir egzersizin setini kaydedene kadar geçerli kalır; **Önceki** ve **Sonraki** düğmeleri serbestçe gezinir.

## Antrenman süresi

Bir `workout-duration` bloğu, bir antrenman notunun ne kadar süreceğini tahmin eder: zamanlayıcılarından gelen dinlenme, her set için süre ve son antrenmanınızın gerçekte ne kadar sürdüğü.

<img src="assets/duration.png" width="420" alt="Tahmini süre kartı: dinlenme süresi, set süresi ve son antrenman">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` vault içindeki bir yol, bu nota göre bir yol ya da yalnızca notun adı olabilir; dışarıda bırakırsanız geçerli not tahmin edilir. Set başına tekrar ve set başına saniye değerleri [Ayarlar](#ayarlar) bölümünden gelir.

## Egzersiz türleri

Egzersiz sayfası, egzersiz klasörünüzdeki bir nottur. Ön maddesi, kayıt formunun neyi istediğini ve egzersizin hangi kasları çalıştırdığını söyler. **Egzersiz sayfası oluştur** sizin için bir tane oluşturur.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Kayıt formunun istediği                       | Ayrıca kabul edilenler                                       |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `strength` (varsayılan) | tekrar, ağırlık                            | `bodyweight`, `weights`                                      |
| `timed`              | süre                                          | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | mesafe, süre (isteğe bağlı)                   | `running`, `run`                                             |
| `cardio`             | süre, mesafe ve nabız (isteğe bağlı)          | —                                                            |
| `custom`             | yalnızca `parameters` altında listelediğiniz alanlar | —                                                     |

Yoga da aynı şekilde çalışır: her poz `timed` bir egzersizdir, yani form yalnızca pozu ne kadar süre tuttuğunuzu sorar. Örnek notlar, rehberli antrenmanlı bir sabah yoga akışı içerir.

![Telefonda bir yoga akışı: Aşağı Bakan Köpek için rehberli antrenman, yalnızca tutuş süresini soran kayıt formu ve ilk tutuşu kaydedilmiş set kartı](assets/yoga.png)

`type:`, `exercise_type:` ile aynı işe yarar. `parameters` altına kendi alanlarınızı ekleyin; örneğin ip atlama için tur sayısı:

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

Bir egzersizi kaydettikten sonra türünü değiştirirseniz, **Egzersizi dönüştür** mevcut setleri taşır ve eski alanlardan hangisinin nereye gideceğini seçmenize izin verir.

## Verileriniz

Her set, `workout_logs.csv` içinde bir satırdır; bu yüzden onu bir tablo programında açabilir, yedekleyebilir ya da diğer dosyalar gibi senkronize edebilirsiniz.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Sütunlar ve elle düzenleme</summary>

| Sütun                      | Anlamı                                  |
| -------------------------- | --------------------------------------- |
| `date`                     | Setin kaydedildiği zaman (ISO 8601)     |
| `exercise`, `workout`      | Egzersiz ve antrenman adı               |
| `reps`, `weight`, `volume` | Hacim, tekrar × ağırlıktır              |
| `origine`                  | Setin kaydedildiği notun bağlantısı     |
| `timestamp`                | Satırın benzersiz kimliği (milisaniye)  |
| `notes`, `protocol`        | Serbest metin ve antrenman tekniği      |

Kendi alanları olan egzersiz türleri (`duration`, `distance`, `heartRate` ya da `parameters`) sona sütunlar ekler. Son sütun olan `weightUnit`, `kg` ya da `lb` değerini alır: o satırdaki `weight` ve `volume` değerlerinin birimi. Boş değer, ayarlardaki birim anlamına gelir.

Dosyayı elle düzenlerseniz başlık satırını koruyun ve virgül, tırnak ya da satır sonu içeren her değeri çift tırnak içine alın. `=`, `+`, `-` ya da `@` ile başlayan notlar, elektronik tabloların bunları formül olarak çalıştırmaması için başına bir `'` eklenerek saklanır; eklenti bunu yeniden gizler.

</details>

Her şey kasanızda kalır. Eklenti panoya yalnızca bir kopyalama rozetine (gösterge panelindeki bir kas etiketi gibi) tıkladığınızda yazar; asla okumaz.

### Dataview ve Templater

Eklenti yüklendikten sonra `WorkoutPlannerAPI` (ayrıca `window.WorkoutPlannerAPI`) sunulur.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>API referansı ve daha fazla örnek</summary>

| Yöntem                       | Döndürür                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Setler; her biri `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol` alanlarıyla. `weight` ve `volume` ayarlardaki birimdedir; `enteredWeight` ve `enteredUnit` ise girilen değerlerdir                          |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Sıralı egzersiz adları: egzersiz sayfalarınızın dosya adları (alt klasörler dahil) ya da egzersiz sayfanız yoksa kayıttaki adlar. `{ tag: "chest" }` yalnızca sayfasında o etiket olan egzersizleri tutar; bu yüzden egzersiz sayfası yoksa sonuç boştur. |

`getWorkoutLogs`, `exercise` (kısmi, büyük/küçük harf duyarsız), `workout`, `dateRange: { start, end }`, `protocol` ve `exactMatch` parametrelerini kabul eder.

Dataview'da son squat setleri:

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

Bir [Templater](https://github.com/SilentVoid13/Templater) şablonunda, bir notu en son sayılarınızla başlatmak için:

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

## Ayarlar

CSV ve egzersiz klasörlerini, varsayılan ağırlık birimini, **+/−** düğmelerinin ağırlık artışını, zamanlayıcı ön ayarlarını, kendi protokollerinizi (ad, kısa etiket ve renk) ve süre tahmini için set başına ile tekrar başına saniyeyi ayarlayın. **Gelişmiş** altındaki **Tümünü çalıştır**, bir güncellemeden sonra her bakım görevini çalıştırır.

Ağırlık birimini değiştirmek eski setlerin etiketini değiştirmez: her set kaydedildiği birimi korur.

<details>
<summary>Tüm komutlar</summary>

Komut paletini açın (`Ctrl/Cmd + P`) ve adını yazın.

| Komut                                                       | Ne yapar                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Antrenman kaydı oluştur                                     | Bir set kaydet                                                      |
| Turu başlat                                                 | Rehberli turu başlat                                                |
| Örnek notlar oluştur                                        | Örnek egzersizler, antrenmanlar, kayıtlar ve bir gösterge paneli ekle |
| Başlangıç kılavuzunu aç                                     | Örneklerdeki kılavuzu aç                                            |
| Antrenman grafiği / tablosu / zamanlayıcısı / gösterge paneli / süresi ekle | Bir bloğu form üzerinden ekle                       |
| Egzersiz sayfası oluştur                                    | Tür ve etiketlerle yeni bir egzersiz sayfası                        |
| Egzersiz bölümü oluştur                                     | Mevcut nota bir egzersiz için başlık, zamanlayıcı ve tablo ekle     |
| Egzersiz bloğu ekle                                         | Ad otomatik tamamlamasıyla bir egzersiz bloğu ekle                  |
| Egzersizi dönüştür                                          | Bir egzersizin setlerini başka bir egzersiz türüne taşı             |
| Kas etiketlerini yönet                                      | `muscle-tags.csv` dosyasını düzenle                                 |
| Etiket başvurusu oluştur                                    | Her kas etiketini listeleyen bir not oluştur                        |
| Egzersiz adlarını denetle                                   | Farklı yazımlarla kaydedilmiş aynı egzersizi bul                    |
| Antrenmanı tuvale aktar                                     | Geçerli antrenmanı bir Obsidian tuvalinde düzenle                   |
| CSV kayıt dosyası oluştur                                   | Boş bir kayıt oluştur                                               |
| Strong veya Hevy'den içe aktar                              | Strong ya da Hevy CSV dışa aktarımındaki setleri kayda ekle         |
| Egzersiz türlerini taşı, Kod bloklarına eksik ID'leri ekle  | Eski sürümlerden yükseltmeden sonra bakım                           |

</details>

## Sorun giderme

- **Workout Block (`workout-block`) ile çakışma.** İki eklenti de `workout-log` kod bloklarını kaydeder ve varsayılan kayıt dosyası adı olarak `workout_logs.csv` kullanır. Birini kullanmadan önce iki eklentiden birini devre dışı bırakın.

- **Bir tablo ya da grafik boş.** Egzersiz adını ve `dateRange` değerini kontrol edin (grafikler varsayılan olarak son 30 güne bakar). `exactMatch: true` ile ad birebir eşleşmelidir.
- **Bir egzersiz ısı haritasında yok.** Sayfasının kas `tags` alanı olmalı ve egzersiz klasöründe bulunmalı. Vücut ağırlığı ve süreli egzersizler yalnızca **Setler** ya da **Tekrar sayısı** altında görünür.
- **Kayıt formu bir plank için tekrar ve ağırlık istiyor.** Egzersiz sayfasında `exercise_type: timed` ayarlayın.
- **Telefonumda zamanlayıcı ses çıkarmıyor.** **Başlat**a bir kez dokunun; telefonlar sayfaya dokunana kadar sesi engeller.

## Kurulum

### Topluluk eklentilerinden

1. **Ayarlar → Topluluk eklentileri** bölümünü açın
2. **Workout Planner** için arama yapın
3. **Yükle**yi, ardından **Etkinleştir**i seçin

### Manuel

1. [En son sürümden](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest) `main.js`, `manifest.json` ve `styles.css` dosyalarını indirin
2. `your-vault/.obsidian/plugins/workout-planner/` klasörünü oluşturun
3. İndirilen dosyaları bu klasöre kopyalayın
4. **Ayarlar → Topluluk eklentileri** bölümünden eklentiyi etkinleştirin

## Destek

Workout Planner ücretsiz ve açık kaynaklıdır. Antrenmanınıza yardımcı olduysa [bana bir kahve ısmarlayabilirsiniz](https://buymeacoffee.com/spatariurares). Bir hata mı buldunuz ya da bir şey mi eksik? Bir [sorun bildirin](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

İngilizce dışındaki her dil makine çevirisidir, bu yüzden bazı ifadeler garip gelebilir. Diliniz garip okunuyorsa düzeltmeler memnuniyetle karşılanır.

## Teşekkürler

Grafikler [Chart.js](https://github.com/chartjs/Chart.js) (MIT) kullanır. Workout Planner, [MIT Lisansı](LICENSE) ile yayımlanmıştır.
