<img src="assets/logo.png" width="96" alt="Logo do Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · Português (Brasil) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**O rastreador de treinos completo para o Obsidian.** Musculação, corrida, ciclismo, ioga ou exercícios com seus próprios campos: registre pelo celular, siga uma sessão guiada e acompanhe seu progresso em gráficos, um painel e um mapa de calor muscular. Um único CSV, 24 idiomas.

Feito para o seu celular: registre cada série, corrida ou postura enquanto treina e depois acompanhe seu progresso em tabelas, gráficos e um painel, dentro das mesmas notas em que você planeja seus treinos. Suas séries ficam em um único arquivo CSV no seu cofre. Sem conta, sem nuvem.

Os gráficos mostram sua tendência, o mapa de calor muscular mostra o que você treinou, e cada série mantém a própria unidade, kg ou lb. Você pode consultar suas séries pelo Dataview.

![Workout Planner no celular: uma sessão guiada com o temporizador de descanso em execução, o formulário de registro com botões +/− e o seletor kg/lb, e o resumo do painel com o calendário de treinos](assets/hero.png)

## Recursos

- Registre séries com repetições e carga, preenchidas a partir da sua última série, com botões +/− e exercícios recentes em um toque
- Registre cada série em kg ou lb, do jeito que os discos à sua frente indicarem
- Marque séries com um protocolo: drop set, myo-reps, rest-pause, superset, 21s ou o seu próprio
- Tabelas das suas séries, agrupadas por dia com totais diários, editáveis com um toque
- Gráficos de carga, volume, repetições, duração, distância, ritmo e frequência cardíaca, e uma tendência que mostra com clareza se você está evoluindo
- Um painel com sequência semanal (com meta semanal), calendário de treinos, recordes pessoais, volume total, treinos recentes e estatísticas de protocolo
- Um mapa de calor muscular, frente e costas, por volume, séries ou repetições
- Temporizadores de descanso (contagem regressiva, intervalado, cronômetro) com predefinições, que reiniciam ao registrar uma série e emitem um bipe no iOS e no Android
- Uma sessão guiada que percorre a nota do treino um exercício por vez
- Uma estimativa de quanto tempo leva um treino planejado
- Exercícios de força, peso corporal, cronometrados, de distância e cardio, ou os seus próprios campos
- Todas as séries em um CSV simples, legível pelo Dataview e pelo Templater
- Feito para celulares: sem rolagem lateral, botões sempre ao alcance
- Disponível em 24 idiomas

## Como começar

Na primeira vez que você instala o plugin, ele adiciona notas de exemplo (exercícios de exemplo, dois treinos com seis semanas de registros, um painel e uma demonstração dos recursos), aponta o plugin para elas e abre o guia **Como começar**: uma página curta por recurso, com exemplos práticos para testar. Você não precisa abrir as configurações. Explore à vontade antes de montar o seu.

### O tour guiado

O tour abre uma nota "Tour guiado" com uma tabela, um gráfico, um painel e um temporizador, e aponta para cada um deles em sequência. São nove passos curtos:

1. Registre sua primeira série com o botão **+**. A etapa termina quando você salva.
2. Edite ou exclua uma série com os botões de cada linha.
3. Veja seu progresso no gráfico.
4. Veja totais e tendências no painel.
5. Veja quais músculos você treinou no mapa de calor muscular.
6. Inicie o temporizador de descanso. A etapa termina quando você pressiona Iniciar.
7. Encontre o ícone de halter na faixa lateral, que abre o formulário de registro em qualquer nota. No celular, use a paleta de comandos.
8. Execute qualquer comando **Inserir** pela paleta de comandos. A etapa termina quando você fizer isso.
9. Pronto.

Use **Voltar** e **Próximo** para navegar, ou **Pular** para sair. Se a parte da nota apontada pelo tour estiver fora da tela, **Me mostre** rola até ela. Pressione `Esc` a qualquer momento para encerrar. O tour também termina quando você fecha a nota ou muda para outro arquivo. Nada se perde: suas séries continuam no registro.

Quando os dados de exemplo estão em uso, o tour roda sobre eles. Caso contrário, roda sobre o seu próprio registro, então o gráfico e o painel começam quase vazios. A nota é criada uma única vez, ao lado dos exemplos ou no topo do seu cofre. Uma nota existente nunca é sobrescrita, e você pode editá-la ou excluí-la. Se já existir uma nota chamada "Tour guiado" que não seja do tour, ele usa "Tour guiado 1" (ou o próximo número livre).

Quer fazer o tour de novo? Selecione **Iniciar o tour** em **Configurações → Workout Planner → Como começar**, ou execute **Iniciar o tour** pela paleta de comandos.

Quer os exemplos ou o guia de novo? Selecione **Criar exemplos** ou **Abrir guia de início rápido** em **Configurações → Workout Planner → Como começar**, ou execute **Criar notas de exemplo** ou **Abrir guia de início rápido** pela paleta de comandos (`Ctrl/Cmd + P`). Criar os exemplos nunca sobrescreve nada: executá-lo de novo apenas adiciona os arquivos de exemplo que estiverem faltando, e os arquivos que você alterou permanecem como estão. O guia oferece criar os exemplos caso ainda não existam. Uma tabela, um gráfico ou um painel vazio também tem o link **Ou explore com dados de exemplo**. Se você já tem um registro de treino, os exemplos ganham um arquivo de registro próprio e o seu permanece intacto.

Para adicionar uma tabela a qualquer nota, por exemplo `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Toque em **+** abaixo da tabela, informe as repetições e a carga, e salve. A tabela se atualiza sozinha. Você também não precisa escrever os blocos à mão: os comandos **Inserir gráfico de treino / tabela de treino / temporizador de treino / painel de treino / duração do treino** abrem um formulário e inserem o bloco para você.

## Registrando séries

Abra o formulário de registro pelo **+** abaixo de uma tabela (o exercício já vem preenchido), pelo ícone de halter na faixa lateral ou pelo comando **Criar registro de treino**. O formulário começa a partir da sua última série, então na maioria das vezes você toca em **+/−** uma vez e salva. Faça isso antes de terminar o descanso.

O formulário pede os campos adequados ao exercício: repetições e carga para um agachamento, segundos para uma prancha, distância e tempo para uma corrida (veja [Tipos de exercício](#tipos-de-exercício)). Cada série também pode ter uma observação e um protocolo, mostrado como um selo na tabela.

O campo de carga tem um seletor kg/lb, então você pode registrar 225 lb mesmo que sua configuração esteja em kg. A tabela mostra essa série como "225 lb"; gráficos, estatísticas e volume convertem cada série para a sua configuração.

Quando você registra uma série a partir de uma nota, o nome da nota é salvo como o **treino** da série, então uma tabela ou gráfico com `workout: Push Day` a encontra depois.

## Tabelas

Um bloco `workout-log` mostra as séries de um exercício ou treino, da mais recente para a mais antiga. As séries do mesmo dia ficam agrupadas sob uma linha com os totais daquele dia, e cada linha tem um botão de edição; para excluir uma série, use o formulário de edição. No celular, cada série vira uma linha compacta, sem rolagem lateral.

<img src="assets/tables.png" width="720" alt="Uma tabela workout-log no celular, com séries agrupadas por dia com o tempo e um selo de drop set, e o formulário de registro aberto pelo botão +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Com `targetWeight` e `targetReps`, uma meta de sobrecarga progressiva aparece acima da tabela.

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro                    | Padrão  | O que faz                                              |
| ---------------------------- | ------- | ------------------------------------------------------ |
| `exercise`                   | —       | Somente este exercício                                 |
| `workout`                    | —       | Somente este treino (nome da nota)                     |
| `exactMatch`                 | `false` | Corresponder exatamente ao nome do exercício           |
| `dateRange`                  | todos   | Hoje e os N dias anteriores                            |
| `limit`                      | `50`    | Máximo de linhas; com `sets`, `sets × 2` (dois treinos) |
| `sortBy`                     | `date`  | `date`, `exercise`, `weight`, `reps` ou `volume`       |
| `sortOrder`                  | `desc`  | `asc` ou `desc`                                        |
| `columns`                    | todas   | Colunas a mostrar, por exemplo `["date", "reps", "weight"]` |
| `showProtocol`               | `true`  | Mostrar a coluna do selo de protocolo                  |
| `showAddButton`              | `true`  | Mostrar o botão **+**                                  |
| `targetWeight`, `targetReps` | —       | Mostrar uma meta de sobrecarga progressiva acima da tabela |
| `sets`                       | —       | Séries planejadas, contadas por um bloco `workout-session` |

Por padrão, os nomes dos exercícios são comparados de forma aproximada ("squat" encontra "Squat (high bar)"); adicione `exactMatch: true` para aceitar apenas esse nome exato.

</details>

## Gráficos e tendências

Um bloco `workout-chart` desenha uma medida ao longo do tempo: carga, volume, repetições, 1RM estimado, duração, distância, ritmo ou frequência cardíaca. O cabeçalho indica se a tendência é **Subindo**, **Estável** ou **Caindo**. Estável significa que a linha de tendência varia menos de 5% da média em todo o período, então um ganho lento e constante ainda conta como subida. Para o ritmo, menor é melhor, e uma linha descendente aparece como melhora. No celular, o gráfico vira uma tabela com os mesmos valores.

Use `type: e1rm` para a melhor estimativa diária de 1RM (Epley: `weight × (1 + reps / 30)`). Só contam cargas positivas com repetições inteiras de 1 a 12; séries de aquecimento e drop sets ficam de fora. Dias sem séries elegíveis são omitidos. As estimativas seguem a sua configuração de kg/lb. O gráfico de força padrão continua sendo o de volume.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

A API adiciona `estimatedOneRepMax` a `getExerciseStats`: a melhor estimativa na unidade de peso configurada, ou `null` quando não existe série elegível. Os campos de PR existentes e as colunas do CSV não mudam.

![Um gráfico de 1RM estimado no supino, com a linha de tendência subindo, no computador, e os mesmos valores em uma tabela no celular](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro       | Padrão         | O que faz                                                                 |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Somente este exercício                                                    |
| `workout`       | —              | Somente este treino                                                       |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` ou `heartRate` |
| `chartType`     | `exercise`     | Como o ponto de cada dia é formado (abaixo)                               |
| `dateRange`     | `30`           | Dias a incluir                                                            |
| `limit`         | —              | Apenas os N pontos mais recentes                                          |
| `showTrendLine` | `false`        | Desenhar uma linha de tendência                                           |
| `showStats`     | `true`         | Mostrar média, melhor e pior valor abaixo do gráfico                      |
| `title`         | `Trend <type>` | Título do gráfico                                                         |
| `height`        | 4:3            | `300` (pixels) ou qualquer medida CSS, como `50vh`                        |
| `exactMatch`    | `false`        | Corresponder exatamente ao nome do exercício                              |

| `chartType` | Séries usadas                       | Ponto de cada dia |
| ----------- | ----------------------------------- | ----------------- |
| `exercise`  | séries de `exercise`                | média             |
| `workout`   | séries de `workout`                 | total             |
| `combined`  | séries de `exercise` dentro de `workout` | total        |
| `all`       | todas as séries (filtros ignorados) | total             |

</details>

## Painel e mapa de calor muscular

Um bloco `workout-dashboard` começa com quatro números: total de treinos, sequência semanal, volume total e recordes pessoais. Abaixo deles, você encontra estatísticas rápidas da semana, do mês e do ano, uma tendência de volume, seus treinos recentes, estatísticas de protocolo, a duração planejada versus a real e um calendário de treinos: um ano de dias treinados, sombreados pelo volume, com sua sequência atual e melhor sequência. Uma semana conta para a sequência quando atinge os dias de treino da sua meta semanal (Configurações → Meta semanal, 1 por padrão). No celular, as ações rápidas vêm primeiro e o resumo aparece em uma grade 2 × 2.

<img src="assets/dashboard.png" width="720" alt="O painel no celular: resumo, calendário de treinos com a meta semanal cumprida, treinos recentes e estatísticas rápidas">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Para escolher os widgets e a ordem deles sem escrever YAML, insira o painel com o comando **Inserir painel de treino**, ou abra o menu ⋮ no canto superior direito de um painel inserido e escolha **Editar painel**.

Defina **Layout** como **Grade** nessa janela para posicionar cada widget você mesmo, como itens em um inventário: arraste um widget para movê-lo, arraste o canto dele para torná-lo mais largo ou mais alto, e solte-o abaixo da grade para removê-lo do painel. O teclado também funciona: as setas movem, Shift com as setas redimensiona, e Delete tira um widget do painel. A grade tem tantas colunas quantas couberem na largura da sua nota; em um painel mais estreito, os widgets são reorganizados na ordem de leitura, e no celular ficam empilhados. Seu layout é mantido: quando a nota comporta apenas uma coluna (um celular), a janela pergunta quantas colunas usar na edição, começando pelas que estavam salvas. O bloco mantém uma linha por widget (coluna, linha, largura, altura):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

O mapa de calor mostra quais músculos você treinou na última semana, no último mês ou no último ano, na frente e nas costas, por **Volume**, **Séries** ou **Repetições**. É a forma mais rápida de perceber que você está há três semanas sem treinar as pernas. Abaixo dele, uma breve análise de treino avisa sobre desequilíbrios, como a parte frontal trabalhando muito mais do que a traseira. Ela lê as tags musculares das suas [páginas de exercício](#tipos-de-exercício). Exercícios de peso corporal e cronometrados não têm carga, então só aparecem nas opções Séries e Repetições.

<img src="assets/heatmap.png" width="720" alt="Mapa de calor muscular da semana no celular, frente e costas: quadríceps, glúteos e posteriores treinados, com a análise de treino abaixo">

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro             | Padrão  | O que faz                                                                                                                                                                                                   |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —       | Título acima do painel                                                                                                                                                                                      |
| `dateRange`           | todos   | Somente séries dos últimos N dias                                                                                                                                                                           |
| `widgets`             | todos   | Os widgets a mostrar, nesta ordem: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`  | `grid` posiciona cada widget nas suas células (veja acima)                                                                                                                                                  |
| `columns`             | —       | Grade: as colunas para as quais a grade foi feita                                                                                                                                                           |
| `grid.<widget>`       | —       | Grade: coluna, linha, largura e altura desse widget                                                                                                                                                         |
| `recentWorkoutsLimit` | `5`     | Treinos na lista de recentes                                                                                                                                                                                |
| `volumeTrendDays`     | `30`    | Dias no gráfico de tendência de volume                                                                                                                                                                      |

</details>

<details>
<summary>Tags musculares</summary>

As tags podem ser uma lista, uma única palavra (`tags: chest`) ou uma linha separada por vírgulas (`tags: chest, triceps`).

Grupos amplos: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Músculos específicos têm a sua própria região do corpo e contam para o grupo a que pertencem. Uma tag ampla se espalha por toda a região: `chest` ativa levemente as três partes do peitoral, enquanto `upper_chest` ativa totalmente apenas a parte de cima.

| Grupo       | Músculos específicos                        |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (ou `ql`) |
| `core`      | `obliques`, `serratus`                      |

Tags no seu próprio idioma, como `petto` ou `schiena`, também funcionam. O plugin as associa aos grupos acima usando o `muscle-tags.csv`, ao lado do seu registro. Edite-o com **Gerenciar tags musculares** (adicionar, renomear, pesquisar, encontrar duplicadas) ou manualmente:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Uma tag que já é o nome de um grupo (`upper_chest`, `Upper chest`, `upper-chest`) sempre funciona, mesmo que o `muscle-tags.csv` não a liste.

</details>

## Temporizadores

Um bloco `workout-timer` é um temporizador de contagem regressiva, intervalado ou cronômetro. Salve seus tempos de descanso habituais como predefinições. Vincule um temporizador a um exercício ou treino e ele reinicia toda vez que você registrar uma série, para que você não precise mexer nele entre as séries. Com `autoStart: true`, ele começa assim que a nota abre.

<img src="assets/timers.png" width="320" alt="Dois temporizadores no celular: um temporizador intervalado na fase de descanso e uma predefinição Tabata na fase de trabalho da rodada 2">

Ele também emite um bipe no iOS e no Android. Os celulares só permitem som depois que você toca na página, então um temporizador iniciado por `autoStart` fica em silêncio até você tocar em **Iniciar** uma vez.

Em **Configurações → Workout Planner → Sinais para dispositivos de temporizador**, a opção **Mantenha a tela ativa enquanto o temporizador estiver em execução** vem ativada por padrão. Ela solicita a proteção da tela enquanto pelo menos um temporizador roda em primeiro plano, quando o dispositivo permite. **Vibre quando o temporizador terminar** vem desativada por padrão e acrescenta uma breve vibração ao chegar a zero, independentemente do som, em dispositivos compatíveis como o Android. No iOS, o sinal sonoro continua sendo o mesmo; a vibração pela web não está disponível lá. Esses recursos usam APIs do navegador da melhor forma possível e ainda não foram testados em aparelhos Android/iOS reais. Eles não oferecem alarmes em segundo plano. Um temporizador com um `id` continua rodando quando você troca de nota; pause-o ou deixe-o terminar para liberar a proteção da tela.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Um temporizador intervalado pode alternar trabalho e descanso. O painel mostra **Trabalho** ou **Descanso**, e cada fase começa com o seu próprio som. Cada rodada é o seu trabalho seguido do seu descanso, incluindo a última, então este Tabata dura 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s de trabalho, 10 s de descanso, 8 rodadas) e `preset: EMOM` (uma rodada a cada minuto por 10 minutos) já vêm embutidos. Uma predefinição salva com o mesmo nome substitui essas.

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro             | Padrão      | O que faz                                                             |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` ou `stopwatch`                                |
| `duration`            | `30`        | Segundos (contagem regressiva; no intervalado, o trabalho de cada rodada) |
| `work`                | —           | Intervalado: segundos de trabalho por rodada (substitui `duration`)   |
| `rest`                | `0`         | Intervalado: segundos de descanso após o trabalho de cada rodada      |
| `rounds`              | `1`         | Rodadas (intervalado)                                                 |
| `sound`               | `true`      | Bipe quando o tempo acaba                                             |
| `autoStart`           | `false`     | Começar assim que a nota abrir                                        |
| `showControls`        | `true`      | Mostrar iniciar, pausar e redefinir                                   |
| `preset`              | —           | Começar a partir de uma predefinição (salva, `Tabata` ou `EMOM`); os parâmetros a substituem |
| `exercise`, `workout` | —           | Reiniciar o temporizador quando você registrar uma série deste exercício ou treino |
| `superset`            | `false`     | Somente na exportação para o canvas: desenhar este exercício e o seguinte como um superset |

</details>

## Sessão guiada

Um bloco `workout-session` no topo de uma nota de treino (comando **Inserir sessão guiada**) guia você por ele um exercício por vez: em qual série você está, a meta, o que você fez da última vez, um botão **Registrar série** e o temporizador de descanso, que começa ao registrar uma série.

![Uma sessão guiada no celular: série 1 de 4 com o que foi feito na última vez, o formulário de registro aberto por Registrar série, e depois a série 2 de 4 com o temporizador de descanso em execução](assets/session.png)

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

O plano é a própria nota: cada bloco `workout-log` com um `exercise` é um passo, na ordem em que aparecem, com seus `sets`, `targetReps` e `targetWeight`. O descanso vem do `workout-timer` na mesma seção `##` (a predefinição padrão, se não houver um). A sessão conta as séries que você registrou hoje neste treino, então ela retoma de onde você parou ao reabrir a nota. Um exercício sem `sets` continua como atual até que você registre uma série de um exercício posterior; **Anterior** e **Próximo** permitem navegar livremente.

## Duração do treino

Um bloco `workout-duration` estima quanto tempo dura um treino: o descanso dos seus temporizadores somado ao tempo de cada série, ao lado de quanto tempo sua última sessão realmente levou.

<img src="assets/duration.png" width="420" alt="Cartão de duração estimada com o tempo de descanso, o tempo por série e a última sessão">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` pode ser um caminho no cofre, um caminho relativo a esta nota ou apenas o nome da nota; omita-o para estimar a nota atual. Os segundos por repetição e por série vêm de [Configurações](#configurações).

## Tipos de exercício

Uma página de exercício é uma nota na sua pasta de exercícios. O frontmatter dela informa o que o formulário de registro deve pedir e quais músculos o exercício trabalha. **Criar página de exercício** cria uma para você.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | O formulário de registro pede                 | Também aceitos                                               |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `strength` (padrão)  | repetições, carga                             | `bodyweight`, `weights`                                      |
| `timed`              | duração                                       | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distância, duração (opcional)                 | `running`, `run`                                             |
| `cardio`             | duração, distância e frequência cardíaca (opcional) | —                                                      |
| `custom`             | somente os campos listados em `parameters`   | —                                                            |

A ioga funciona da mesma forma: cada postura é um exercício `timed`, então o formulário pergunta apenas por quanto tempo você a manteve. As notas de exemplo incluem uma sequência matinal de ioga com uma sessão guiada.

![Uma sequência de ioga no celular: a sessão guiada em Cachorro para baixo, o formulário de registro pedindo apenas a duração da postura, e a tabela de posturas com o total do dia](assets/yoga.png)

`type:` funciona da mesma forma que `exercise_type:`. Adicione seus próprios campos em `parameters`, por exemplo rodadas para o pular corda:

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

Se você mudar o tipo de um exercício depois de registrá-lo, **Converter exercício** move as séries existentes e permite escolher em qual campo antigo cada valor vai.

## Seus dados

Cada série é uma linha em `workout_logs.csv`, então você pode abri-lo em uma planilha, fazer backup dele ou sincronizá-lo como qualquer outro arquivo.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Colunas e edição manual</summary>

| Coluna                     | Significado                              |
| -------------------------- | ---------------------------------------- |
| `date`                     | Quando a série foi registrada (ISO 8601) |
| `exercise`, `workout`      | Nome do exercício e do treino            |
| `reps`, `weight`, `volume` | O volume é repetições × carga            |
| `origine`                  | Link para a nota de onde foi registrada  |
| `timestamp`                | ID único da linha (milissegundos)        |
| `notes`, `protocol`        | Texto livre e técnica de treino          |

Os tipos de exercício com campos próprios (`duration`, `distance`, `heartRate`, ou seus `parameters`) adicionam colunas no final. A última coluna, `weightUnit`, é `kg` ou `lb`: a unidade do `weight` e do `volume` daquela linha. Um valor vazio significa a unidade das configurações.

Se você editar o arquivo à mão, mantenha a linha de cabeçalho e coloque entre aspas duplas qualquer valor que contenha vírgula, aspas ou quebra de linha. Observações que começam com `=`, `+`, `-` ou `@` são salvas com um `'` no início para que as planilhas não as executem como fórmulas; o plugin o oculta de novo.

</details>

Tudo fica no seu cofre. O plugin escreve na área de transferência somente quando você clica em um selo de cópia (uma tag muscular no painel), e nunca lê dela.

### Dataview e Templater

O plugin expõe o `WorkoutPlannerAPI` (também `window.WorkoutPlannerAPI`) assim que é carregado.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Referência da API e mais exemplos</summary>

| Método                       | Retorna                                                                                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Séries, cada uma com `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` e `volume` estão na unidade das configurações; `enteredWeight` e `enteredUnit` são o que foi registrado                       |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Nomes de exercícios, em ordem: os nomes dos arquivos das suas páginas de exercício (incluindo subpastas), ou os nomes do seu registro quando você não tem páginas de exercício. `{ tag: "chest" }` mantém os exercícios cuja página tem essa tag, então fica vazio sem páginas de exercício. |

`getWorkoutLogs` aceita `exercise` (parcial, sem diferenciar maiúsculas), `workout`, `dateRange: { start, end }`, `protocol` e `exactMatch`.

Agachamentos recentes, no Dataview:

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

Em um modelo do [Templater](https://github.com/SilentVoid13/Templater), para iniciar uma nota com os seus números mais recentes:

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

## Configurações

Defina as pastas do CSV e dos exercícios, a unidade de peso padrão, o incremento de carga dos botões **+/−**, as predefinições de temporizador, seus próprios protocolos (nome, abreviação e cor) e os segundos por repetição e por série usados na estimativa de duração. **Executar tudo** em Avançado executa todas as tarefas de manutenção após uma atualização.

Mudar a unidade de peso não altera o rótulo das séries antigas: cada série mantém a unidade em que foi registrada.

<details>
<summary>Todos os comandos</summary>

Abra a paleta de comandos (`Ctrl/Cmd + P`) e digite o nome.

| Comando                                                     | O que faz                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Criar registro de treino                                    | Registrar uma série                                                |
| Iniciar o tour                                              | Fazer o tour guiado                                                |
| Criar notas de exemplo                                      | Adicionar exercícios, treinos, registros e um painel de exemplo    |
| Abrir guia de início rápido                                 | Abrir o guia nos exemplos                                          |
| Inserir gráfico / tabela / temporizador / painel / duração de treino | Inserir um bloco por meio de um formulário                |
| Criar página de exercício                                   | Nova página de exercício com tipo e tags                           |
| Criar seção de exercício                                    | Adicionar um título, temporizador e tabela de um exercício à nota atual |
| Adicionar bloco de exercício                                | Inserir um bloco de exercício, com autocompletar de nomes          |
| Converter exercício                                         | Mover as séries de um exercício para outro tipo de exercício       |
| Gerenciar tags musculares                                   | Editar o `muscle-tags.csv`                                         |
| Gerar referência de tags                                    | Criar uma nota com todas as tags musculares                        |
| Auditar nomes de exercícios                                 | Encontrar o mesmo exercício registrado com grafias diferentes      |
| Exportar treino para o canvas                               | Organizar o treino atual em um canvas do Obsidian                  |
| Criar arquivo CSV de registro                               | Criar um registro vazio                                            |
| Importar de Strong ou Hevy                                  | Adicionar as séries de uma exportação CSV do Strong ou do Hevy ao registro |
| Migrar tipos de exercício, Adicionar IDs ausentes aos blocos de código | Manutenção após atualizar de versões antigas            |

</details>

## Solução de problemas

- **Conflito com o Workout Block (`workout-block`).** Os dois plugins registram blocos de código `workout-log` e usam `workout_logs.csv` como nome padrão do arquivo de registro. Desative um dos dois plugins antes de usar o outro.

- **Uma tabela ou gráfico está vazio.** Verifique o nome do exercício e o `dateRange` (os gráficos usam os últimos 30 dias por padrão). Com `exactMatch: true`, o nome precisa corresponder exatamente.
- **Um exercício não aparece no mapa de calor.** A página dele precisa ter `tags` musculares e estar na pasta de exercícios. Exercícios de peso corporal e cronometrados aparecem apenas em **Séries** ou **Repetições**.
- **O formulário de registro pede repetições e carga para uma prancha.** Defina `exercise_type: timed` na página do exercício.
- **O temporizador não emite som no meu celular.** Toque em **Iniciar** uma vez; os celulares bloqueiam o som até você tocar na página.

## Instalação

### A partir dos plugins da comunidade

1. Abra **Configurações → Plugins da comunidade**
2. Pesquise por **Workout Planner**
3. Selecione **Instalar**, depois **Ativar**

### Manual

1. Baixe o `main.js`, o `manifest.json` e o `styles.css` da [versão mais recente](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Crie a pasta `seu-cofre/.obsidian/plugins/workout-planner/`
3. Copie os arquivos baixados para essa pasta
4. Ative o plugin em **Configurações → Plugins da comunidade**

## Apoio

O Workout Planner é gratuito e de código aberto. Se ele ajudar nos seus treinos, você pode [me pagar um café](https://buymeacoffee.com/spatariurares). Encontrou um bug ou sentiu falta de algo? Abra uma [issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Todos os idiomas, exceto o inglês, são traduzidos por máquina, então algumas frases podem soar estranhas. Se a sua parecer estranha, correções são bem-vindas.

## Créditos

Os gráficos usam o [Chart.js](https://github.com/chartjs/Chart.js) (MIT). O Workout Planner é distribuído sob a [Licença MIT](LICENSE).
