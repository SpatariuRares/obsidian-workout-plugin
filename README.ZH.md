<img src="assets/logo.png" width="96" alt="Workout Planner 标志">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · 简体中文 · [繁體中文](README.ZH-TW.md)

**专为 Obsidian 打造的一站式训练记录工具。** 举重、跑步、骑行、瑜伽，或是带有自定义字段的训练动作：用手机记录，跟随引导训练，并在图表、仪表盘和肌肉热力图中查看进步。一个 CSV 文件，支持 24 种语言。

为手机而生：训练时记录每一组、每次跑步或每个体式，然后在你规划训练的同一篇笔记中，通过表格、图表和仪表盘查看进步。你的训练组会保存在库中的一个 CSV 文件里。无需账号，也不依赖云端。

图表展示你的趋势，肌肉热力图展示你练过哪些部位，每组训练都保留其自己的 kg/lb 单位。你还可以用 Dataview 查询训练组。

![手机上的 Workout Planner：一张训练组卡片，两组已勾选且休息计时器正在运行，带 +/− 按钮和 kg/lb 选择器的记录表单，以及带训练日历的仪表盘摘要](assets/hero.png)

## 功能特性

- 记录次数和重量，自动填入上一组的数据，支持 +/− 按钮，并可一键选择最近的训练动作
- 以 kg 或 lb 记录每一组，无论你手边的杠片标的是什么单位
- 为组标记训练方案：递减组、myo-reps、rest-pause、超级组、21s，或你自己的方案
- 按天分组的训练组表格，附带每日总计，一键即可编辑
- 今天的训练组以行的形式在手机上填写：勾选一组即可记录，休息计时器随之启动
- 重量、训练量、次数、时长、距离、配速和心率图表，以及一条会明确告诉你是否在进步的趋势线
- 仪表盘包含每周连续训练（可设每周目标）、训练日历、个人记录、总训练量、最近训练和训练方案统计
- 肌肉热力图，正面与背面，按训练量、组数或次数显示
- 休息计时器（倒计时、间歇、秒表），支持预设，记录一组时自动重新开始，并在 iOS 和 Android 上发出提示音
- 引导训练，带你按笔记中的顺序逐个完成训练动作
- 预估计划训练所需的时长
- 力量、自重、计时、距离和有氧训练动作，或你自定义的字段
- 所有训练组保存在一个简单的 CSV 文件中，可通过 Dataview 和 Templater 读取
- 专为手机设计：无需横向滚动，按钮始终触手可及
- 提供 24 种语言

## 入门指南

首次安装插件时，它会添加示例笔记（示例训练动作、两个训练计划及六周的记录、一个仪表盘和功能展示），将插件指向这些示例，并打开 **入门指南**：每个功能一页简短说明，附带可以亲自尝试的示例。你无需打开设置，可以先随意探索，再配置你自己的内容。

### 导览

导览会打开一篇“导览”笔记，其中包含一个表格、一个图表、一个仪表盘和一个计时器，并依次指向每一项。它共有九个简短步骤：

1. 点击 **+** 按钮记录你的第一组。保存后此步骤完成。
2. 使用每行的按钮编辑或删除一组。
3. 在图表中查看你的进步。
4. 在仪表盘中查看总计和趋势。
5. 在肌肉热力图中查看你练过哪些肌肉。
6. 启动休息计时器。按下开始后此步骤完成。
7. 在功能区找到哑铃图标，它可以从任意笔记中打开记录表单。在手机上，请改用命令面板。
8. 从命令面板运行任意一个 **插入训练** 命令。完成后此步骤结束。
9. 完成。

使用 **返回** 和 **下一步** 切换步骤，或点击 **跳过** 离开。如果导览指向的笔记部分不在视野内，点击 **显示此处** 即可滚动到该位置。随时按 `Esc` 可结束导览。关闭导览笔记或切换到其他文件时，导览也会结束。不会丢失任何内容：你的训练组仍保存在记录中。

使用示例数据时，导览会基于示例运行；否则它会基于你自己的记录运行，因此图表和仪表盘一开始几乎是空的。该笔记只会创建一次，位于示例旁边，或位于你库的顶层。已存在的笔记永远不会被覆盖，你可以编辑或删除它。如果已存在一篇名为“导览”的笔记，且它并非导览自己创建的，导览会改用“导览 1”（或下一个可用编号）。

想再次体验导览？在 **设置 → Workout Planner → 入门** 下选择 **开始导览**，或在命令面板中运行 **开始导览** 命令。

想再次获取示例或指南？在 **设置 → Workout Planner → 入门** 下选择 **创建示例** 或 **打开入门指南**，或在命令面板（`Ctrl/Cmd + P`）中运行 **创建示例笔记** 或 **打开入门指南** 命令。创建示例不会覆盖任何内容：再次运行只会添加缺失的示例文件，你修改过的文件保持不变。如果示例尚不存在，指南会提示是否创建。空的表格、图表或仪表盘上也会有一个 **或者，使用示例数据进行探索** 链接。如果你已经有训练记录，示例会获得自己的记录文件，你的记录则保持不变。

要在任意笔记中添加表格，例如 `Push Day`：

````markdown
```workout-log
exercise: Bench Press
```
````

点击表格下方的 **+**，输入次数和重量，然后保存。表格会自动更新。你也无需手写代码块：**插入训练图表**、**插入训练表格**、**插入训练计时器**、**插入训练仪表盘** 和 **插入训练时长** 命令会打开表单，并为你插入对应的代码块。

## 记录组

通过表格下方的 **+**（训练动作会自动填入）、功能区的哑铃图标，或 **创建训练记录** 命令打开记录表单。表单会以你上一组的数据为起点，因此大多数时候你只需点一次 **+/−** 并保存。在休息结束前完成即可。

表单会询问适合该训练动作的字段：深蹲需要次数和重量，平板支撑需要秒数，跑步需要距离和时间（参见[训练动作类型](#训练动作类型)）。每一组还可以附带备注和训练方案，并在表格中以徽章显示。

重量字段带有 kg/lb 选择器，因此即使你的设置是 kg，也可以记录 225 lb。表格会将该组显示为“225 lb”；图表、统计和训练量则会将每一组换算为你设置的单位。

从笔记中记录一组时，笔记名称会被保存为该组的 **训练**（workout），因此带有 `workout: Push Day` 的表格或图表之后能找到它。

## 表格

`workout-log` 代码块会显示某个训练动作或某次训练的组，最新的排在最前。同一天的组会归在一个行下，该行显示当天的总计，每一行都有编辑按钮；要删除某组，请在编辑表单中操作。在手机上，每一组会变为紧凑的一行，无需横向滚动。

<img src="assets/tables.png" width="720" alt="手机上的 workout-log 表格：按天分组的组，显示时间和递减组徽章，以及点击 + 按钮打开的记录表单">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

设置 `targetWeight` 和 `targetReps` 后，表格上方会出现渐进超负荷目标。

<details>
<summary>所有参数</summary>

| 参数                         | 默认值  | 作用                                                 |
| ---------------------------- | ------- | ---------------------------------------------------- |
| `exercise`                   | —       | 仅显示此训练动作                                     |
| `workout`                    | —       | 仅显示此训练（笔记名称）                             |
| `exactMatch`                 | `false` | 完全匹配训练动作名称                                 |
| `dateRange`                  | 全部    | 今天及之前的 N 天                                    |
| `limit`                      | `50`    | 最大行数；使用 `sets` 时为 `sets × 2`（两次训练）    |
| `sortBy`                     | `date`  | `date`、`exercise`、`weight`、`reps` 或 `volume`     |
| `sortOrder`                  | `desc`  | `asc` 或 `desc`                                      |
| `columns`                    | 全部    | 要显示的列，例如 `["date", "reps", "weight"]`        |
| `showProtocol`               | `true`  | 显示训练方案徽章列                                   |
| `showAddButton`              | `true`  | 显示 **+** 按钮                                      |
| `targetWeight`, `targetReps` | —       | 在表格上方显示渐进超负荷目标                         |
| `sets`                       | —       | 计划的组数，由 `workout-session` 代码块统计          |

默认情况下，训练动作名称为模糊匹配（"squat" 会匹配 "Squat (high bar)"）；添加 `exactMatch: true` 则只匹配完全相同的名称。

</details>

## 手机上的训练组

`workout-sets` 代码块专为健身房里的记录而设计：今天某个训练动作的组以行的形式呈现，供你填写。每一行都显示你上次同一组的数据，因此你只需输入有变化的部分（留空的字段会记录该值），然后勾选这一行。该组会被记入记录，这一行变为已记录的组，顶部的休息计时器会自动开始。已记录的组点击展开箭头即可修改训练方案和备注；再次勾选即可撤回该组，并可在几秒内点击 **撤销**。

<img src="assets/sets.png" alt="手机上的训练组卡片：四行已按上次的数值填好，然后两组已勾选且休息计时器正在运行，接着打开一行选择 rest-pause 训练方案并添加备注">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

在命令面板中运行 **插入训练组**，即可自动写入一个代码块；⋮ 菜单可编辑它或它的休息计时器。

<details>
<summary>所有参数</summary>

| 参数                         | 默认值        | 作用                                                                                             |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | 训练动作（准确名称）                                                                             |
| `workout`                    | 笔记名称      | 记录这些组所属的训练                                                                             |
| `sets`                       | 与上次相同    | 要填写的行数（至少一行）；**添加组** 可增加更多                                                   |
| `targetWeight`, `targetReps` | —             | 该训练动作从未做过时的提示，也是渐进超负荷的目标                                                 |
| `rest`                       | —             | 每组之后的休息秒数；`0` 表示不使用计时器。未设置时使用同一小节的 `workout-timer`                  |
| `timer.*`                    | —             | 休息计时器的其他选项：`timer.type`、`timer.preset`、`timer.rest`、`timer.rounds`、`timer.showControls`、`timer.sound` |

</details>

## 图表与趋势

`workout-chart` 代码块绘制一个随时间变化的指标：重量、训练量、次数、预估的 1RM、时长、距离、配速或心率。标题会显示趋势是 **增加**、**稳定** 还是 **减少**。“稳定”表示整个时间段内趋势线的变化小于平均值的 5%，因此缓慢而稳定的增长仍算作增加。对于配速，数值越低越好，因此下降的曲线表示进步。在手机上，图表会变为相同数值的表格。

使用 `type: e1rm` 获取每日最佳预估的 1RM（Epley 公式：`weight × (1 + reps / 30)`）。只有重量为正数、次数为 1 至 12 的整数的组才会计入；热身组和递减组会被排除。没有符合条件组的日期会被省略。估算值遵循你的 kg/lb 设置。默认的力量图表仍为训练量。

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

API 会在 `getExerciseStats` 中添加 `estimatedOneRepMax`：即配置的重量单位下的最佳估算值，若没有符合条件的组则为 `null`。现有的 PR 字段和 CSV 列保持不变。

![卧推预估 1RM 图表：桌面端显示上升的趋势线，手机端显示相同数值的表格](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>所有参数</summary>

| 参数            | 默认值         | 作用                                                                      |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | 仅显示此训练动作                                                          |
| `workout`       | —              | 仅显示此训练                                                              |
| `type`          | `volume`       | `volume`、`weight`、`reps`、`duration`、`distance`、`pace` 或 `heartRate` |
| `chartType`     | `exercise`     | 每天的数据点如何计算（见下文）                                            |
| `dateRange`     | `30`           | 包含的天数                                                                |
| `limit`         | —              | 仅显示最近的 N 个数据点                                                   |
| `showTrendLine` | `false`        | 绘制趋势线                                                                |
| `showStats`     | `true`         | 在图表下方显示平均值、最佳值和最低值                                      |
| `title`         | `Trend <type>` | 图表标题                                                                  |
| `height`        | 4:3            | `300`（像素）或任何 CSS 长度，例如 `50vh`                                 |
| `exactMatch`    | `false`        | 完全匹配训练动作名称                                                      |

| `chartType` | 使用的组                            | 每天的数据点 |
| ----------- | ----------------------------------- | ------------ |
| `exercise`  | `exercise` 的组                     | 平均值       |
| `workout`   | `workout` 的组                      | 总计         |
| `combined`  | `workout` 内 `exercise` 的组        | 总计         |
| `all`       | 所有组（忽略筛选条件）              | 总计         |

</details>

## 仪表盘与肌肉热力图

`workout-dashboard` 代码块开头显示四个数字：训练总次数、每周连续训练、总训练量和个人记录。其下是本周、本月和本年的快速统计、训练量趋势、最近训练、训练方案统计、计划与实际训练时长，以及训练日历：一年的训练日，按训练量着色，并显示当前和最佳连续记录。当某一周的训练天数达到你的每周目标（设置 → 每周目标，默认为 1）时，该周才计入连续记录。在手机上，快速操作排在最前，摘要则为 2 × 2 的网格。

<img src="assets/dashboard.png" width="720" alt="手机上的仪表盘：摘要、本周已达成目标的训练日历、最近训练和快速统计">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

要在不编写 YAML 的情况下选择小组件及其顺序，请使用 **插入训练仪表盘** 命令插入仪表盘，或点击已插入仪表盘右上角的 ⋮ 菜单，选择 **编辑仪表盘**。

在该窗口中将 **布局** 设为 **网格**，即可像库存格子一样自行放置每个小组件：拖动小组件可以移动它，拖动其角落可以使其变宽或变高，拖到网格下方即可将其移除。键盘同样可用：方向键移动，Shift 加方向键调整大小，Delete 将小组件移除。网格的列数取决于笔记的宽度；在较窄的窗格中，小组件会按阅读顺序重新排列，在手机上则会堆叠显示。你的布局会被保留：当笔记只能显示一列（手机）时，窗口会询问要以几列进行编辑，默认从已保存的列数开始。代码块会为每个小组件保留一行（列、行、宽度、高度）：

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

热力图显示你在过去一周、一个月或一年中训练过哪些肌肉，包括正面和背面，可按 **训练量**、**组数** 或 **次数** 查看。这是发现你已经三周没练腿的最快方式。其下方的简短训练分析会提醒你存在失衡，例如前侧训练量远高于后侧。它读取你的[训练动作页面](#训练动作类型)上的肌肉标签。自重和计时训练没有重量，因此它们只会在 **组数** 和 **次数** 下亮起。

<img src="assets/heatmap.png" width="720" alt="手机上一周的肌肉热力图，正面与背面：股四头肌、臀部和腘绳肌已训练，下方为训练分析">

<details>
<summary>所有参数</summary>

| 参数                  | 默认值 | 作用                                                                                                                                                                                                        |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —      | 仪表盘上方的标题                                                                                                                                                                                            |
| `dateRange`           | 全部   | 仅包含最近 N 天的组                                                                                                                                                                                         |
| `widgets`             | 全部   | 要显示的小组件，按此顺序排列：`summary`、`quickStats`、`heatMap`、`volume`、`recentWorkouts`、`protocolDistribution`、`protocolEffectiveness`、`duration`、`quickActions`、`fileErrors`、`muscleTags`、`trainingCalendar` |
| `layout`              | `list` | `grid` 按上文所述将每个小组件放入其单元格                                                                                                                                                                   |
| `columns`             | —      | 网格：该网格设计时所用的列数                                                                                                                                                                                |
| `grid.<widget>`       | —      | 网格：该小组件的列、行、宽度和高度                                                                                                                                                                          |
| `recentWorkoutsLimit` | `5`    | 最近训练列表中的训练数                                                                                                                                                                                      |
| `volumeTrendDays`     | `30`   | 训练量趋势图中的天数                                                                                                                                                                                        |

</details>

<details>
<summary>肌肉标签</summary>

标签可以是列表、单个词（`tags: chest`）或逗号分隔的一行（`tags: chest, triceps`）。

大类：`chest`、`back`、`shoulders`、`biceps`、`triceps`、`forearms`、`traps`、`quads`、`hamstrings`、`glutes`、`calves`、`abs`、`core`

具体肌肉有各自的身体区域，并计入其所属的大类。大类标签会覆盖整个区域：`chest` 会略微点亮胸部的全部三个部分，而 `upper_chest` 只会完全点亮上部。

| 大类        | 具体肌肉                                    |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`、`mid_chest`、`lower_chest`   |
| `shoulders` | `front_delts`、`side_delts`、`rear_delts`   |
| `back`      | `lats`、`rhomboids`、`lower_back`（或 `ql`） |
| `core`      | `obliques`、`serratus`                      |

你自己语言的标签，例如 `petto` 或 `schiena`，同样可用。插件会使用你记录旁的 `muscle-tags.csv` 将它们映射到上述大类。可以通过 **管理肌肉标签**（添加、重命名、搜索、查找重复项）编辑它，也可以手动编辑：

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

已经是大类名称的标签（`upper_chest`、`Upper chest`、`upper-chest`）即使未在 `muscle-tags.csv` 中列出，也始终有效。

</details>

## 计时器

`workout-timer` 代码块是倒计时、间歇或秒表计时器。将你常用的休息时长保存为预设。将计时器关联到某个训练动作或训练后，每次记录一组时它都会重新开始，因此组与组之间无需手动操作。设置 `autoStart: true` 后，笔记一打开它就会开始计时。

<img src="assets/timers.png" width="320" alt="手机上的两个计时器：间歇计时器处于休息阶段，以及 Tabata 预设处于第 2 轮的训练阶段">

它在 iOS 和 Android 上同样会发出提示音。手机只允许在你点击页面后播放声音，因此由 `autoStart` 启动的计时器在你点按一次 **开始** 之前保持静音。

在 **设置 → Workout Planner → 计时器设备提示** 下，**在计时器运行期间保持屏幕开启** 默认开启。当至少一个计时器在前台运行时，它会在设备允许的情况下请求保持屏幕常亮。**当计时器完成时振动** 默认关闭，开启后会在归零时短暂震动一下，与声音无关，适用于 Android 等支持振动的设备。iOS 保留现有的声音提示；网页振动在 iOS 上不可用。这些功能基于浏览器 API，尽力而为，尚未在实体 Android/iOS 设备上完成验证。它们不提供后台闹钟。带有 `id` 的计时器在你切换笔记时会继续运行；暂停它或让它结束即可解除屏幕常亮。

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

间歇计时器可以交替进行训练和休息。显示屏会显示 **工作** 或 **休息**，每个阶段都有各自的提示音。每一轮都是先训练再休息，最后一轮也包括在内，因此这个 Tabata 总时长为 4:00：

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata`（工作 20 秒，休息 10 秒，8 轮）和 `preset: EMOM`（每分钟一轮，共 10 分钟）为内置预设。同名的已保存预设会替换它们。

<details>
<summary>所有参数</summary>

| 参数                  | 默认值      | 作用                                                                    |
| --------------------- | ----------- | ----------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`（倒计时）、`interval`（间歇）或 `stopwatch`（秒表）         |
| `duration`            | `30`        | 秒数（倒计时；间歇模式下为每轮的训练时长）                              |
| `work`                | —           | 间歇：每轮训练的秒数（替代 `duration`）                                 |
| `rest`                | `0`         | 间歇：每轮训练之后的休息秒数                                            |
| `rounds`              | `1`         | 轮数（间歇）                                                            |
| `sound`               | `true`      | 时间到时发出提示音                                                      |
| `autoStart`           | `false`     | 笔记打开后立即开始                                                      |
| `showControls`        | `true`      | 显示开始、暂停和重置                                                    |
| `preset`              | —           | 从预设开始（已保存的预设、`Tabata` 或 `EMOM`）；其他参数会覆盖预设      |
| `exercise`, `workout` | —           | 记录该训练动作或训练的组时重新开始计时器                                |
| `superset`            | `false`     | 仅用于画布导出：将此训练动作与下一个训练动作绘制为超级组                |

</details>

## 引导训练

训练笔记顶部的 `workout-session` 代码块（命令 **插入引导训练**）会带你一次完成一个训练动作：显示你当前是第几组、目标、上次的表现、**记录组** 按钮，以及休息计时器（记录一组时开始）。

![手机上的引导训练：深蹲第 3 组（共 4 组），休息同时显示在引导训练和训练组卡片上；接着是打开的记录表单，然后是下一个训练动作及其正在运行的休息计时器](assets/session.png)

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

计划即笔记本身：每个带有 `exercise` 的 `workout-log` 或 `workout-sets` 代码块都是一个步骤，按它们在笔记中出现的顺序排列，并包含 `sets`、`targetReps` 和 `targetWeight`。休息时长优先取自 `workout-sets` 代码块自己的 `rest`，否则取自同一 `##` 小节中的 `workout-timer`（若没有则使用默认预设）。引导训练和训练组卡片共用同一个倒计时。引导训练会统计你今天在本次训练中记录的组数，因此重新打开笔记时会从上次停下的地方继续。没有 `sets` 的训练动作会一直保持为当前步骤，直到你记录后面某个训练动作的组为止；**上一步** 和 **下一步** 可以自由切换。

## 训练时长

`workout-duration` 代码块会估算训练笔记所需的时长：计时器中的休息时间加上每组所需的时间，并与你上次实际训练的时长并列显示。

<img src="assets/duration.png" width="420" alt="预估时长卡片，显示休息时间、每组用时以及上次训练">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` 可以是库中的路径、相对于本笔记的路径，或仅笔记名称；省略则估算当前笔记。每次重复和每组的秒数来自[设置](#设置)。

## 训练动作类型

训练动作页面是训练动作文件夹中的一篇笔记。其前置元数据（frontmatter）说明记录表单应询问哪些字段，以及该训练动作锻炼哪些肌肉。**创建训练动作页面** 会为你生成一篇。

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | 记录表单询问的内容                           | 同样可识别的值                                               |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength`（默认）   | 次数、重量                                   | `bodyweight`、`weights`                                      |
| `timed`              | 时长                                         | `duration`、`time`、`timer`、`interval`、`hold`、`isometric` |
| `distance`           | 距离、时长（可选）                           | `running`、`run`                                             |
| `cardio`             | 时长、距离和心率（可选）                     | —                                                            |
| `custom`             | 仅 `parameters` 中列出的字段                 | —                                                            |

瑜伽的工作方式相同：每个体式都是一个 `timed` 训练动作，因此表单只会询问你保持了多久。示例笔记中包含一个带引导训练的晨间瑜伽流程。

![瑜伽流程：手机上的下犬式引导训练，记录表单只询问保持时长，以及训练组卡片中已记录第一次保持的状态](assets/yoga.png)

对于记录其他内容的运动（例如攀岩的难度、尝试次数，以及是否成功登顶），请在 **设置 → 训练动作类型** 中创建你自己的类型：为它命名，并选择字段，可以是次数和重量等内置字段，也可以是新字段（数字、文本或是/否）。之后创建训练动作时，类型列表中就会出现它，选中后页面中会写入 `exercise_type: <你的类型>`。内置类型无法修改，但 **复制** 可以基于它开始一个新类型。删除一个类型只会停止提供它：使用它的训练动作会保留其字段和已记录的组。

`type:` 与 `exercise_type:` 的作用相同。你也可以为单个训练动作在 `parameters` 下添加字段，例如跳绳的轮数：

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

如果你在记录某个训练动作后更改了它的类型，**转换训练动作** 会迁移现有的组，并让你选择旧字段应对应到哪里。

## 你的数据

每一组都是 `workout_logs.csv` 中的一行，因此你可以用电子表格打开它、备份它，或像其他文件一样同步它。

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>列说明与手动编辑</summary>

| 列                         | 含义                                |
| -------------------------- | ----------------------------------- |
| `date`                     | 记录该组的时间（ISO 8601）          |
| `exercise`, `workout`      | 训练动作和训练名称                  |
| `reps`, `weight`, `volume` | 训练量为次数 × 重量                 |
| `origine`                  | 指向记录该组时所在笔记的链接        |
| `timestamp`                | 该行的唯一 ID（毫秒）               |
| `notes`, `protocol`        | 自由文本和训练方法                  |

带有自身字段的训练动作类型（`duration`、`distance`、`heartRate`，或你的 `parameters`）会在末尾添加列。最后一列 `weightUnit` 为 `kg` 或 `lb`，即该行 `weight` 和 `volume` 的单位。留空则表示使用设置中的单位。

如果你手动编辑该文件，请保留标题行，并将任何包含逗号、引号或换行的值用双引号括起来。以 `=`、`+`、`-` 或 `@` 开头的备注会以前导 `'` 存储，以免电子表格将其当作公式运行；插件会再将其隐藏。

</details>

所有数据都保存在你的库中。插件仅在你点击复制徽章（仪表盘中的肌肉标签）时才写入剪贴板，并且从不读取剪贴板。

### Dataview 与 Templater

插件加载完成后会提供 `WorkoutPlannerAPI`（也可通过 `window.WorkoutPlannerAPI` 访问）。

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>API 参考与更多示例</summary>

| 方法                         | 返回值                                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | 训练组，每组包含 `date`、`exercise`、`reps`、`weight`、`volume`、`workout`、`notes`、`timestamp`、`protocol`。`weight` 和 `volume` 使用设置中的单位；`enteredWeight` 和 `enteredUnit` 为记录时输入的值                                                  |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`、`totalVolume`、`maxWeight`、`prWeight`、`prReps`、`prDate`、`totalSets`、`averageWeight`、`averageReps`、`lastWorkoutDate`、`trend`                                                                                              |
| `getExercises(filter?)`      | 按排序的训练动作名称：训练动作页面的文件名（包括子文件夹），或在没有训练动作页面时为记录中的名称。`{ tag: "chest" }` 会保留页面带有该标签的训练动作，因此在没有训练动作页面时结果为空。                                                          |

`getWorkoutLogs` 接受 `exercise`（部分匹配，不区分大小写）、`workout`、`dateRange: { start, end }`、`protocol` 和 `exactMatch`。

在 Dataview 中查看最近的深蹲：

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

在 [Templater](https://github.com/SilentVoid13/Templater) 模板中，用你最新的数据开始一篇笔记：

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

## 设置

在设置中可以配置 CSV 和训练动作文件夹、默认重量单位、**+/−** 按钮的重量步长、计时器预设、你自己的训练方案（名称、简短标签和颜色），以及时长估算所用的每次重复和每组秒数。**高级** 下的 **全部运行** 会在升级后执行所有维护任务。

更改重量单位不会重新标记旧的组：每组都保留其记录时所用的单位。

<details>
<summary>所有命令</summary>

打开命令面板（`Ctrl/Cmd + P`）并输入名称。

| 命令                                                                     | 作用                                         |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| 创建训练记录                                                             | 记录一组                                     |
| 开始导览                                                                 | 进行引导导览                                 |
| 创建示例笔记                                                             | 添加示例训练动作、训练、记录和仪表盘         |
| 打开入门指南                                                             | 在示例中打开指南                             |
| 插入训练图表 / 插入训练表格 / 插入训练计时器 / 插入训练仪表盘 / 插入训练时长 | 通过表单插入代码块                           |
| 创建训练动作页面                                                         | 新建带类型和标签的训练动作页面               |
| 创建训练板块                                                             | 为当前笔记添加训练动作的标题、计时器和表格   |
| 添加训练动作块                                                           | 插入训练动作块，并支持名称自动补全           |
| 转换训练动作                                                             | 将训练动作的组移到另一种训练动作类型         |
| 管理肌肉标签                                                             | 编辑 `muscle-tags.csv`                       |
| 生成标签参考                                                             | 创建列出所有肌肉标签的笔记                   |
| 检查训练动作名称                                                         | 查找以不同拼写记录的同一训练动作             |
| 将训练导出到画布                                                         | 在 Obsidian 画布上排列当前训练               |
| 创建 CSV 记录文件                                                        | 创建空的记录                                 |
| 从 Strong 或 Hevy 导入                                                   | 将 Strong 或 Hevy CSV 导出文件中的组添加到记录中 |
| 迁移训练动作类型，将缺失的 ID 添加到代码块中                             | 从旧版本升级后的维护                         |

</details>

## 故障排除

- **与 Workout Block（`workout-block`）冲突。** 两个插件都会注册 `workout-log` 代码块，并且都将 `workout_logs.csv` 用作默认的记录文件名。在使用其中一个之前，请先停用另一个插件。

- **表格或图表为空。** 检查训练动作名称和 `dateRange`（图表默认显示最近 30 天）。使用 `exactMatch: true` 时，名称必须完全一致。
- **热力图中缺少某个训练动作。** 它的页面需要肌肉 `tags`，并且必须位于训练动作文件夹中。自重和计时训练仅在 **组数** 或 **次数** 下显示。
- **记录表单为平板支撑询问次数和重量。** 在训练动作页面中设置 `exercise_type: timed`。
- **计时器在我的手机上没有声音。** 点按一次 **开始**；手机会阻止声音，直到你触碰页面。

## 安装

### 从第三方插件安装

1. 打开 **设置 → 第三方插件**
2. 搜索 **Workout Planner**
3. 点击 **安装**，然后点击 **启用**

### 手动安装

1. 从[最新版本](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)下载 `main.js`、`manifest.json` 和 `styles.css`
2. 创建文件夹 `your-vault/.obsidian/plugins/workout-planner/`
3. 将下载的文件复制到该文件夹中
4. 在 **设置 → 第三方插件** 中启用该插件

## 支持

Workout Planner 是免费的开源软件。如果它对你的训练有所帮助，你可以[请我喝杯咖啡](https://buymeacoffee.com/spatariurares)。发现了 bug 或缺少某项功能？请提交一个 [issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues)。

除英语外的每种语言都经过机器翻译，因此部分用语可能听起来不太自然。如果你的语言读起来奇怪，欢迎提出修正。

## 致谢

图表使用 [Chart.js](https://github.com/chartjs/Chart.js)（MIT）。Workout Planner 基于 [MIT 许可证](LICENSE) 发布。
