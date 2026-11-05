<img src="assets/logo.png" width="96" alt="Workout Planner 標誌">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · 繁體中文

**專為 Obsidian 打造的全能運動追蹤器。** 重量訓練、跑步、騎車、瑜伽，或你自訂欄位的動作：用手機紀錄、跟著引導訓練，並在圖表、儀表板與肌肉熱度圖中查看進步。一個 CSV 檔，支援 24 種語言。

為手機而設計：訓練時紀錄每一組、每趟跑步或每個姿勢，接著在你規劃訓練的同一則筆記中，透過表格、圖表與儀表板查看進步。你的組數會存入保險庫中的一個 CSV 檔案。不需要帳號，也不需要雲端。

圖表會顯示你的趨勢，肌肉熱度圖會顯示你練過哪些部位，而每一組都保留自己的 kg/lb 單位。你也可以用 Dataview 查詢你的組數。

![手機上的 Workout Planner：運動組卡片勾選了兩組並運作休息計時器、附有 +/− 按鈕與 kg/lb 選擇器的紀錄表單，以及包含訓練日曆的儀表板摘要](assets/hero.png)

## 功能

- 紀錄次數與重量，並自動帶入你的上一組；可用 +/− 按鈕，也能一鍵選取最近的動作
- 以 kg 或 lb 紀錄每一組，不必管面前的槓片是什麼單位
- 為組數標上訓練法：降組、myo-reps、rest-pause、超級組、21s，或你自己的訓練法
- 依日期分組的組數表格，附每日總計，並可一鍵編輯
- 今天的組以列的形式呈現在手機上：勾選即可紀錄，並開始休息計時
- 重量、訓練量、次數、時長、距離、配速與心率的圖表，以及會明確告訴你是否在進步的趨勢
- 包含每週連續紀錄（可設定每週目標）、訓練日曆、個人紀錄、總訓練量、最近運動與訓練法統計的儀表板
- 肌肉熱度圖，可顯示正面與背面，依訓練量、組數或次數呈現
- 休息計時器（倒數、間歇、碼錶），附預設，紀錄一組時會重新開始，並在 iOS 與 Android 上發出提示音
- 引導訓練，依序帶你完成運動筆記中的每個動作
- 估算計畫中的運動需要多長時間
- 力量、自重、計時、距離與有氧動作，或你自己的欄位
- 所有組數都存在一個純文字 CSV 檔中，可由 Dataview 與 Templater 讀取
- 為手機而設計：沒有左右捲動，按鈕隨手可及
- 提供 24 種語言

## 開始使用

第一次安裝外掛時，它會加入範例筆記（範例動作、兩個運動與六週紀錄、一個儀表板，以及功能展示），將外掛指向這些範例，並開啟**開始使用**指南：每項功能各有一頁簡短說明，附有可以實際操作的範例。你不需要開啟設定。在設定自己的內容之前，先隨意逛逛。

想再次取得範例或指南？請在 **設定 → Workout Planner → 開始使用** 下選取 **建立範例** 或 **開啟入門指南**，或從指令面板（`Ctrl/Cmd + P`）執行 **建立範例筆記** 或 **開啟入門指南**。建立範例絕不會覆寫任何內容：再次執行只會加入缺少的範例檔案，你修改過的檔案則維持原狀。如果範例尚不存在，指南會提議為你建立。空白的表格、圖表或儀表板也會有 **或使用範例資料探索** 連結。如果你已有運動紀錄，範例會使用它們自己的紀錄檔，你的紀錄則完全不會被更動。

要在任何筆記中新增表格，例如 `Push Day`：

````markdown
```workout-log
exercise: Bench Press
```
````

在表格下方點按 **+**，輸入次數與重量後儲存。表格會自動更新。你也不必手動撰寫區塊：**插入運動圖表 / 表格 / 組 / 計時器 / 儀表板 / 時長** 與 **插入引導訓練** 指令會開啟表單（或直接寫入區塊）替你插入。

## 紀錄組數

在表格下方的 **+** 開啟紀錄表單（動作已自動填好）、功能區中的啞鈴圖示，或 **建立運動紀錄** 指令。表單會從你的上一組開始，因此大多數時候你只需點一下 **+/−** 再儲存。請在休息時間結束前完成。

表單會詢問符合該動作的欄位：深蹲要填次數與重量，平板式要填秒數，跑步則要填距離與時間（參見 [動作類型](#動作類型)）。每一組也可以附上備註與訓練法，訓練法會以徽章的形式顯示在表格中。

重量欄位有 kg/lb 選擇器，因此即使你的設定是 kg，也能記錄 225 lb。表格會以「225 lb」顯示該組；圖表、統計與訓練量則會把每一組換算成你的設定單位。

從筆記紀錄一組時，筆記名稱會被存為該組的**運動**，因此之後 `workout: Push Day` 的表格或圖表便能找到它。

## 表格

`workout-log` 區塊會依最新到最舊的順序，顯示某個動作或運動的組數。同一天的組會歸在一列之下，該列會顯示當天的總計，每一列都有編輯按鈕；若要刪除某一組，請在編輯表單中操作。在手機上，每一組會變成緊湊的列，不需要左右捲動。

<img src="assets/tables.png" width="720" alt="手機上的 workout-log 表格：組數依日期分組，並附上時間與降組徽章，旁邊是由 + 按鈕開啟的紀錄表單">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

設定 `targetWeight` 與 `targetReps` 後，表格上方會出現漸進式超負荷的目標。

<details>
<summary>所有參數</summary>

| 參數                         | 預設值  | 作用                                                 |
| ---------------------------- | ------- | ---------------------------------------------------- |
| `exercise`                   | —       | 只顯示此動作                                         |
| `workout`                    | —       | 只顯示此運動（筆記名稱）                             |
| `exactMatch`                 | `false` | 完全符合動作名稱                                     |
| `dateRange`                  | 全部    | 今天與前 N 天                                        |
| `limit`                      | `50`    | 列數上限；若有 `sets`，則為 `sets × 2`（兩個運動）   |
| `sortBy`                     | `date`  | `date`、`exercise`、`weight`、`reps` 或 `volume`     |
| `sortOrder`                  | `desc`  | `asc` 或 `desc`                                      |
| `columns`                    | 全部    | 要顯示的欄位，例如 `["date", "reps", "weight"]`      |
| `showProtocol`               | `true`  | 顯示訓練法徽章欄                                     |
| `showAddButton`              | `true`  | 顯示 **+** 按鈕                                      |
| `targetWeight`, `targetReps` | —       | 在表格上方顯示漸進式超負荷的目標                     |
| `sets`                       | —       | 計畫組數，由 `workout-session` 區塊計算              |

預設情況下，動作名稱是模糊比對的（「squat」可以找到「Squat (high bar)」）；若只要完全相同的名稱，請加上 `exactMatch: true`。

</details>

## 手機上的組數

`workout-sets` 區塊是為在健身房紀錄而設計的：某個動作今天的組會以列的形式呈現，讓你逐列填寫。每一列都會顯示你上次同一組做了什麼，因此你只需輸入有變動的數值（留空的欄位會以提示值紀錄），然後勾選該列。組數會進入紀錄，該列變成已紀錄的組，頂端的休息計時器會自動開始。已紀錄組的箭頭可以變更訓練法與備註；再次勾選即可收回，並可在數秒內按 **復原**。

<img src="assets/sets.png" alt="手機上的運動組卡片：四列已依上次的數值填寫，接著勾選兩組並運作休息計時器，然後展開一列以選擇 rest-pause 訓練法並新增備註">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

從指令面板執行 **插入運動組**，即可為你寫入一個區塊；⋮ 選單可編輯該區塊或其休息計時器。

<details>
<summary>所有參數</summary>

| 參數                         | 預設值   | 作用                                                                                                                  |
| ---------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `exercise`                   | —        | 動作（須為完全相同的名稱）                                                                                            |
| `workout`                    | 筆記名稱 | 紀錄這些組所屬的運動                                                                                                  |
| `sets`                       | 與上次相同 | 要填寫的列數（至少一列）；**新增組** 可再加列                                                                        |
| `targetWeight`, `targetReps` | —        | 從未做過該動作時的提示，也是漸進式超負荷的目標                                                                        |
| `rest`                       | —        | 每組之後的休息秒數；`0` 代表不計時。未設定時，取同一區段的 `workout-timer`                                            |
| `timer.*`                    | —        | 休息計時器的其他選項：`timer.type`、`timer.preset`、`timer.rest`、`timer.rounds`、`timer.showControls`、`timer.sound` |

</details>

## 圖表與趨勢

`workout-chart` 區塊會描繪一項指標隨時間的變化：重量、訓練量、次數、預估 1RM、時長、距離、配速或心率。標題會顯示趨勢是 **增加**、**穩定** 還是 **下降**。所謂穩定，是指整段期間內趨勢線的移動幅度小於平均值的 5%，因此緩慢而穩定的進步仍會被視為增加。配速越低越好，因此下降的線代表進步。在手機上，圖表會改為同樣數值的表格。

使用 `type: e1rm` 可取得每日最佳的預估單次最大重量（Epley：`重量 × (1 + 次數 / 30)`）。只計入正重量、且次數為 1 到 12 的整數組；熱身組與遞減組不計。沒有符合條件的組的日子會被省略。估算值會依你的 kg/lb 設定顯示。訓練圖表的預設仍是訓練量。

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API 會在 `getExerciseStats` 中新增 `estimatedOneRepMax`：以設定的重量單位計算的最佳估算值；若沒有符合條件的組，則為 `null`。既有的 PR 欄位與 CSV 欄位保持不變。

![桌機上的臥推預估 1RM 圖表，附有上升的趨勢線；手機上則是相同數值的表格](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>所有參數</summary>

| 參數            | 預設值         | 作用                                                                      |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | 只顯示此動作                                                              |
| `workout`       | —              | 只顯示此運動                                                              |
| `type`          | `volume`       | `volume`、`weight`、`reps`、`e1rm`、`duration`、`distance`、`pace` 或 `heartRate` |
| `chartType`     | `exercise`     | 每一天的數據點如何建立（見下）                                            |
| `dateRange`     | `30`           | 包含的天數                                                                |
| `limit`         | —              | 只顯示最近 N 個數據點                                                     |
| `showTrendLine` | `false`        | 繪製趨勢線                                                                |
| `showTrend`     | `true`         | 在圖表上方顯示趨勢標題                                                    |
| `showStats`     | `true`         | 在圖表下方顯示平均、最佳與最低值                                          |
| `title`         | `Trend <type>` | 圖表標題                                                                  |
| `height`        | 4:3            | `300`（像素）或任何 CSS 長度，例如 `50vh`                                 |
| `exactMatch`    | `false`        | 完全符合動作名稱                                                          |

| `chartType` | 使用的組                            | 每一天的數據點 |
| ----------- | ----------------------------------- | -------------- |
| `exercise`  | `exercise` 的組                     | 平均           |
| `workout`   | `workout` 的組                      | 總計           |
| `combined`  | `workout` 內 `exercise` 的組        | 總計           |
| `all`       | 所有組（忽略篩選條件）              | 總計           |

</details>

## 儀表板與肌肉熱度圖

`workout-dashboard` 區塊開頭會顯示四個數字：總運動次數、每週連續紀錄、總訓練量與個人紀錄。其下是本週、本月與本年的快速統計、訓練量趨勢、最近的運動、訓練法統計、計畫與實際的運動時長，以及訓練日曆：一整年的訓練日，依訓練量著色，並附上目前與最佳的連續紀錄。當一週達到你的每週目標所需的訓練天數（設定 → 每週目標，預設為 1）時，該週才會計入連續紀錄。在手機上，快速操作會排在最前面，摘要則排成 2 × 2 的網格。

<img src="assets/dashboard.png" width="720" alt="手機上的儀表板：摘要、本週已達成目標的訓練日曆、最近的運動與快速統計">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

若要不寫 YAML 就選擇小工具及其順序，請使用 **插入運動儀表板** 指令插入儀表板，或開啟已插入儀表板右上角的 ⋮ 選單，選擇 **編輯儀表板**。

在該視窗中將 **版面配置** 設為 **網格**，即可像物品欄一樣自行放置每個小工具：拖曳小工具即可移動，拖曳其角落即可調整寬度或高度，拖到網格下方則會將其移除。鍵盤也能操作：方向鍵移動，Shift 加方向鍵調整大小，Delete 移除小工具。網格的欄數會依筆記的寬度而定；在較窄的窗格中，小工具會依閱讀順序重新排列，在手機上則會堆疊。你的版面會被保留：當筆記只能顯示一欄（手機）時，視窗會詢問要以幾欄編輯，並從已儲存的欄數開始。區塊會為每個小工具保留一行（欄、列、寬度、高度）：

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

熱度圖會顯示你在過去一週、一個月或一年中練過哪些肌肉，前後兩面，可依 **訓練量**、**組數** 或 **次數** 呈現。這是最快發現你已經三週沒練腿的方法。其下的簡短訓練分析會提醒你失衡之處，例如前側的訓練量遠超過後側。它會讀取你的[動作頁面](#動作類型)上的肌肉標籤。徒手與計時動作沒有重量，因此只會在 **組數** 與 **次數** 下亮起。

<img src="assets/heatmap.png" width="720" alt="手機上一週的肌肉熱度圖，前後兩面：股四頭肌、臀肌與腿後肌已訓練，下方為訓練分析">

<details>
<summary>所有參數</summary>

| 參數                  | 預設值  | 作用                                                                                                                                                                                                        |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —       | 儀表板上方的標題                                                                                                                                                                                            |
| `dateRange`           | 全部    | 只包含最近 N 天的組                                                                                                                                                                                         |
| `widgets`             | 全部    | 要顯示的小工具，依此順序排列：`summary`、`quickStats`、`heatMap`、`volume`、`recentWorkouts`、`protocolDistribution`、`protocolEffectiveness`、`duration`、`quickActions`、`fileErrors`、`muscleTags`、`trainingCalendar` |
| `layout`              | `list`  | `grid` 會將每個小工具放在其儲存格中（見上文）                                                                                                                                                               |
| `columns`             | —       | 網格：網格所使用的欄數                                                                                                                                                                                      |
| `grid.<widget>`       | —       | 網格：該小工具的欄、列、寬度與高度                                                                                                                                                                          |
| `recentWorkoutsLimit` | `5`     | 最近清單中的運動數                                                                                                                                                                                          |
| `volumeTrendDays`     | `30`    | 訓練量趨勢圖中的天數                                                                                                                                                                                        |

</details>

<details>
<summary>肌肉標籤</summary>

標籤可以是清單、單一字詞（`tags: chest`），或以逗號分隔的一行（`tags: chest, triceps`）。

大類肌群：`chest`、`back`、`shoulders`、`biceps`、`triceps`、`forearms`、`traps`、`quads`、`hamstrings`、`glutes`、`calves`、`abs`、`core`

特定肌肉在身體上有自己的區域，並計入其所屬的大類。大類標籤會平均分布於整個區域：`chest` 會讓胸部三個部位都稍微亮起，`upper_chest` 則只會完全點亮上部。

| 大類        | 特定肌肉                                    |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`、`mid_chest`、`lower_chest`   |
| `shoulders` | `front_delts`、`side_delts`、`rear_delts`   |
| `back`      | `lats`、`rhomboids`、`lower_back`（或 `ql`） |
| `core`      | `obliques`、`serratus`                      |

以你自己的語言撰寫的標籤，例如 `petto` 或 `schiena`，也可以使用。外掛會透過紀錄旁的 `muscle-tags.csv`，將它們對應到上述大類。你可以用 **管理肌肉標籤**（新增、重新命名、搜尋、找出重複）來編輯，也可以手動編輯：

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

已經是大類名稱的標籤（`upper_chest`、`Upper chest`、`upper-chest`）一律有效，即使 `muscle-tags.csv` 沒有列出它。

</details>

## 計時器

`workout-timer` 區塊是倒數、間歇或碼錶計時器。將你常用的休息時間存為預設。把計時器連結到某個動作或運動後，每次紀錄一組都會重新開始，因此組與組之間你不必碰它。設定 `autoStart: true` 後，筆記一打開它就會開始計時。

<img src="assets/timers.png" width="320" alt="手機上的兩個計時器：處於休息階段的間歇計時器，以及第 2 輪工作階段中的 Tabata 預設">

在 iOS 與 Android 上也會發出提示音。手機只有在你點擊頁面後才允許播放聲音，因此由 `autoStart` 啟動的計時器會保持靜音，直到你點一下 **開始**。

在 **設定 → Workout Planner → 計時器設備提示** 下，**計時器運作時保持螢幕開啟** 預設為開啟。在裝置允許的情況下，只要至少一個計時器在前景運作，它就會請求保持螢幕亮著。**計時器結束時產生震動** 預設為關閉，開啟後會在歸零時額外產生一次短暫震動，與聲音無關，支援的裝置（例如 Android）可以使用。iOS 保留既有的音效提示；網頁震動在 iOS 上無法使用。這些功能以瀏覽器 API 盡力實作，尚未在實體的 Android/iOS 裝置上完整驗證。它們不提供背景鬧鈴。帶有 `id` 的計時器在你切換筆記時會繼續運作；暫停或讓它跑完即可釋放螢幕保持開啟。

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

間歇計時器可以交替進行工作與休息。顯示器會顯示 **工作** 或 **休息**，每個階段都有自己的提示音。每一輪由工作接休息組成，最後一輪也包含在內，因此這個 Tabata 總共需要 4:00：

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata`（工作 20 秒、休息 10 秒、8 輪）與 `preset: EMOM`（每分鐘一輪，共 10 分鐘）為內建。同名的已儲存預設會取代它們。

<details>
<summary>所有參數</summary>

| 參數                  | 預設值      | 作用                                                                  |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`、`interval` 或 `stopwatch`                                |
| `duration`            | `30`        | 秒數（倒數；間歇則為每一輪的工作時間）                                |
| `work`                | —           | 間歇：每一輪的工作秒數（取代 `duration`）                             |
| `rest`                | `0`         | 間歇：每一輪工作後的休息秒數                                          |
| `rounds`              | `1`         | 輪數（間歇）                                                          |
| `sound`               | `true`      | 時間到時發出提示音                                                    |
| `autoStart`           | `false`     | 筆記一打開即開始                                                      |
| `showControls`        | `true`      | 顯示開始、暫停與重設                                                  |
| `preset`              | —           | 以預設為起點（已儲存的、`Tabata` 或 `EMOM`）；其他參數會覆蓋它        |
| `exercise`, `workout` | —           | 紀錄此動作或運動的一組時，重新開始計時                                |
| `superset`            | `false`     | 僅用於畫布匯出：將此動作與下一個動作繪製為超級組                      |

</details>

## 引導訓練

筆記頂端的 `workout-session` 區塊（指令 **插入引導訓練**）會帶你一次完成一個動作：告訴你目前是第幾組、目標為何、上次做了什麼，並提供 **紀錄一組** 按鈕與休息計時器（紀錄一組時開始計時）。

![手機上的引導訓練：深蹲第 3 組（共 4 組），休息同時在引導訓練與運動組卡片上運作，由紀錄一組開啟的紀錄表單，以及下一個動作的休息計時器運作中](assets/session.png)

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

計畫就是筆記本身：每個帶有 `exercise` 的 `workout-log` 或 `workout-sets` 區塊都是一個步驟，依其出現的順序排列，並包含 `sets`、`targetReps` 與 `targetWeight`。休息時間取自 `workout-sets` 區塊自己的 `rest`，若沒有則取自同一個 `##` 區段中的 `workout-timer`（沒有的話則使用預設的計時器預設）。引導訓練與運動組卡片共用同一個倒數。引導訓練會計算你今天在此運動中已紀錄的組數，因此重新開啟筆記時會接續上次的進度。沒有 `sets` 的動作會一直是目前步驟，直到你紀錄後面某個動作的組數為止；**上一步** 與 **下一步** 可以自由切換。

## 運動時長

`workout-duration` 區塊會估算運動筆記需要多久：包括其計時器的休息時間，加上每一組所需的時間，並與你上次實際訓練的時長並列顯示。

<img src="assets/duration.png" width="420" alt="預估時長卡片，顯示休息時間、每組時間與上次訓練">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` 可以是保險庫中的路徑、相對於本筆記的路徑，或只是筆記名稱；若省略，則估算目前的筆記。每次重複與每組的秒數取自[設定](#設定)。

## 動作類型

動作頁面是你動作資料夾中的一則筆記。它的屬性（frontmatter）會說明紀錄表單要詢問什麼，以及該動作訓練哪些肌肉。**建立動作頁面** 會替你建立一個。

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | 紀錄表單會詢問                                | 同樣接受的值                                                 |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `strength`（預設）   | 次數、重量                                    | `bodyweight`、`weights`                                      |
| `timed`              | 時長                                          | `duration`、`time`、`timer`、`interval`、`hold`、`isometric` |
| `distance`           | 距離、時長（選填）                            | `running`、`run`                                             |
| `cardio`             | 時長、距離與心率（選填）                      | —                                                            |
| `custom`             | 只詢問你在 `parameters` 下列出的欄位          | —                                                            |

瑜伽的運作方式相同：每個姿勢都是一個 `timed` 動作，因此表單只會詢問你維持該姿勢的時間。範例筆記包含一個附引導訓練的晨間瑜伽流程。

![手機上的瑜伽流程：下犬式的引導訓練、只詢問維持時長的紀錄表單，以及已紀錄第一次維持的運動組卡片](assets/yoga.png)

如果是其他運動要紀錄不同的內容（例如攀岩的難度、嘗試次數、是否完成），可以在 **設定 → 動作類型** 建立自己的類型：為它命名，並挑選欄位，可以是內建的次數與重量，也可以是新的欄位（數字、文字或是／否）。之後建立動作時，類型清單中就會出現它，並會在頁面中寫入 `exercise_type: <你的類型>`。內建的類型無法更改，但 **複製** 可以從其中一個開始建立新類型。刪除類型只會停止提供它：使用該類型的動作會保留其欄位與已紀錄的組。

`type:` 與 `exercise_type:` 的作用相同。你也可以為單一動作在 `parameters` 下新增欄位，例如跳繩的回合數：

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

如果你在紀錄某個動作後才變更它的類型，**轉換動作** 會將既有的組移過去，並讓你選擇舊欄位要對應到哪裡。

## 您的資料

每一組都是 `workout_logs.csv` 中的一列，因此你可以用試算表開啟、備份，或像其他檔案一樣同步。

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>欄位與手動編輯</summary>

| 欄位                       | 意義                                |
| -------------------------- | ----------------------------------- |
| `date`                     | 紀錄該組的時間（ISO 8601）          |
| `exercise`, `workout`      | 動作與運動名稱                      |
| `reps`, `weight`, `volume` | 訓練量為次數 × 重量                 |
| `origine`                  | 連結至紀錄時所在的筆記              |
| `timestamp`                | 該列的唯一 ID（毫秒）               |
| `notes`, `protocol`        | 自由文字與訓練技巧                  |

具有自己欄位的動作類型（`duration`、`distance`、`heartRate`，或你的 `parameters`）會在最後新增欄位。最後一欄 `weightUnit` 為 `kg` 或 `lb`：該列 `weight` 與 `volume` 的單位。留空則代表使用設定中的單位。

如果你手動編輯檔案，請保留標題列，並將任何包含逗號、雙引號或換行的值以雙引號括起。以 `=`、`+`、`-` 或 `@` 開頭的備註會以前導 `'` 儲存，讓試算表不會把它們當成公式執行；外掛會再把它隱藏起來。

</details>

所有資料都留在你的保險庫中。外掛只會在你點擊複製徽章（儀表板中的肌肉標籤）時寫入剪貼簿，且從不讀取剪貼簿。

### Dataview 與 Templater

外掛載入後會公開 `WorkoutPlannerAPI`（也就是 `window.WorkoutPlannerAPI`）。

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>API 參考與更多範例</summary>

| 方法                         | 回傳                                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | 組數，每組包含 `date`、`exercise`、`reps`、`weight`、`volume`、`workout`、`notes`、`timestamp`、`protocol`。`weight` 與 `volume` 以設定單位表示；`enteredWeight` 與 `enteredUnit` 則是紀錄時輸入的值                                                       |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`、`totalVolume`、`maxWeight`、`prWeight`、`prReps`、`prDate`、`totalSets`、`averageWeight`、`averageReps`、`lastWorkoutDate`、`trend`                                                                                              |
| `getExercises(filter?)`      | 依排序的動作名稱：動作頁面的檔案名稱（含子資料夾），若沒有動作頁面，則為紀錄中的名稱。`{ tag: "chest" }` 會保留頁面具有該標籤的動作，因此沒有動作頁面時結果為空。                                                                                         |

`getWorkoutLogs` 接受 `exercise`（部分比對，不分大小寫）、`workout`、`dateRange: { start, end }`、`protocol` 與 `exactMatch`。

在 Dataview 中列出近期的深蹲：

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

在 [Templater](https://github.com/SilentVoid13/Templater) 範本中，用你最新的數字開始一則筆記：

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

## 設定

設定 CSV 與動作資料夾、預設的重量單位、**+/−** 按鈕的重量增減量、計時器預設、你自己的訓練法（名稱、簡稱與顏色），以及時長估算所用的每次重複與每組秒數。**進階** 下的 **執行所有維護任務** 會在升級後執行所有維護工作。

變更重量單位不會改寫舊組的單位標示：每一組都會保留紀錄時所用的單位。

<details>
<summary>所有指令</summary>

開啟指令面板（`Ctrl/Cmd + P`）並輸入指令名稱。

| 指令                                                        | 作用                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| 建立運動紀錄 | 紀錄一組 |
| 建立範例筆記 | 新增範例動作、運動、紀錄與儀表板 |
| 開啟入門指南、開始導覽 | 在範例中開啟指南 |
| 顯示更新內容 | 顯示每個版本的變更內容 |
| 插入運動圖表 / 表格 / 組 / 計時器 / 儀表板 / 時長 | 透過表單插入區塊 |
| 插入引導訓練 | 在游標處插入 `workout-session` 區塊 |
| 建立動作頁面 | 新增含有類型與標籤的動作頁面 |
| 新增動作區塊 | 為某個動作新增區段，內含其組區塊，並提供名稱自動完成 |
| 轉換動作 | 將動作的組移至另一種動作類型 |
| 管理肌肉標籤 | 編輯 `muscle-tags.csv` |
| 產生標籤參考 | 建立列出所有肌肉標籤的筆記 |
| 檢查動作名稱 | 找出以不同拼寫紀錄的同一個動作 |
| 將運動匯出至畫布 | 在 Obsidian 畫布上排列目前的運動 |
| 建立 CSV 紀錄檔 | 建立空白的紀錄 |
| 從 Strong 或 Hevy 匯入 | 將 Strong 或 Hevy CSV 匯出檔中的組新增至紀錄 |
| 遷移動作類型、為程式碼區塊補上缺少的 ID | 從舊版本升級後的維護 |

</details>

## 疑難排解

- **與 Workout Block（`workout-block`）衝突。** 兩個外掛都會註冊 `workout-log` 程式碼區塊，並且都以 `workout_logs.csv` 作為預設的紀錄檔名稱。使用其中一個之前，請先停用另一個外掛。

- **表格或圖表是空的。** 請檢查動作名稱與 `dateRange`（圖表預設為最近 30 天）。若設定了 `exactMatch: true`，名稱必須完全相同。
- **動作沒有出現在熱度圖中。** 它的頁面需要肌肉 `tags`，而且必須位於動作資料夾中。自重與計時動作只會在 **組數** 或 **次數** 下顯示。
- **紀錄表單要求平板式輸入次數與重量。** 請在動作頁面中設定 `exercise_type: timed`。
- **計時器在我的手機上沒有聲音。** 請點一下 **開始**；手機會在你碰觸頁面前封鎖聲音。

## 安裝

### 從社群外掛安裝

1. 開啟 **設定 → 社群外掛**
2. 搜尋 **Workout Planner**
3. 選取 **安裝**，然後選取 **啟用**

### 手動安裝

1. 從[最新版本](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)下載 `main.js`、`manifest.json` 與 `styles.css`
2. 建立資料夾 `your-vault/.obsidian/plugins/workout-planner/`
3. 將下載的檔案複製到該資料夾
4. 在 **設定 → 社群外掛** 中啟用外掛

## 支援

Workout Planner 免費且開源。如果它對你的訓練有幫助，你可以[請我喝杯咖啡](https://buymeacoffee.com/spatariurares)。發現錯誤或缺少功能？請開啟一個[問題](https://github.com/SpatariuRares/obsidian-workout-plugin/issues)。

除英文以外的每種語言都是機器翻譯，因此部分用語讀起來可能不太自然。如果你的語言讀起來怪怪的，歡迎提供修正。

## 致謝

圖表使用 [Chart.js](https://github.com/chartjs/Chart.js)（MIT）。Workout Planner 以 [MIT 授權條款](LICENSE)釋出。
