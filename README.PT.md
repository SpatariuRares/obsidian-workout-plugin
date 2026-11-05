<img src="assets/logo.png" width="96" alt="Logótipo do Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · Português (Portugal) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**O registo de treinos completo para o Obsidian.** Musculação, corrida, ciclismo, ioga ou exercícios com os seus próprios campos: registe no telemóvel, siga uma sessão guiada e acompanhe o seu progresso em gráficos, num painel e num mapa de calor muscular. Um CSV, 24 idiomas.

Feito para o seu telemóvel: registe cada série, corrida ou postura enquanto treina e, depois, acompanhe o progresso em tabelas, gráficos e num painel, dentro das mesmas notas onde planeia os treinos. As suas séries ficam num único ficheiro CSV no seu cofre. Sem conta, sem nuvem.

Os gráficos mostram a sua tendência, o mapa de calor muscular mostra o que treinou, e cada série mantém a sua unidade kg/lb. Pode consultar as suas séries a partir do Dataview.

![Workout Planner num telemóvel: um cartão workout-sets com duas séries marcadas e o temporizador de descanso a contar, o formulário de registo com botões +/− e seletor kg/lb, e o resumo do painel com o calendário de treino](assets/hero.png)

## Funcionalidades

- Registe séries com repetições e peso, preenchidas a partir da sua última série, com botões +/− e exercícios recentes num toque
- Registe cada série em kg ou lb, conforme o que dizem os discos à sua frente
- Marque as séries com um protocolo: drop set, myo reps, rest-pause, superset, vinte e um (21s) ou um protocolo seu
- Tabelas das suas séries, agrupadas por dia com totais diários, editáveis com um toque
- As séries de hoje como linhas para preencher no telemóvel: marque uma série para a registar e o descanso começa (beta)
- Gráficos de peso, volume, repetições, duração, distância, ritmo e frequência cardíaca, e uma tendência que lhe diz claramente se está a melhorar
- Um painel com sequência semanal (com objetivo semanal), calendário de treino, recordes pessoais, volume total, treinos recentes e estatísticas de protocolos
- Um mapa de calor muscular, frente e costas, por volume, séries ou repetições
- Temporizadores de descanso (contagem decrescente, intervalos, cronómetro) com predefinições, que reiniciam quando regista uma série e emitem um sinal sonoro no iOS e no Android
- Uma sessão guiada que percorre a nota do treino um exercício de cada vez
- Uma estimativa de quanto tempo demora um treino planeado
- Exercícios de força, de peso corporal, cronometrados, de distância e cardio, ou com os seus próprios campos
- Cada série num CSV simples, legível a partir do Dataview e do Templater
- Feito para telemóveis: sem deslocação lateral, botões sempre ao alcance
- Disponível em 24 idiomas

## Como começar

Na primeira vez que instala o plugin, este adiciona notas de exemplo (exercícios de exemplo, dois treinos com seis semanas de registos, um painel e uma montra de funcionalidades), aponta o plugin para elas e abre o guia **Como começar**: uma página curta por funcionalidade, com exemplos práticos que pode experimentar. Não precisa de abrir as definições. Explore à vontade antes de configurar os seus próprios.

### A visita guiada

A visita abre uma nota "Visita guiada" com uma tabela, um gráfico, um painel e um temporizador, e assinala cada um deles por ordem. Tem nove passos curtos:

1. Registe a sua primeira série com o botão **+**. O passo termina quando a guardar.
2. Edite ou elimine uma série com os botões de cada linha.
3. Veja o seu progresso no gráfico.
4. Veja totais e tendências no painel.
5. Veja que músculos treinou no mapa de calor muscular.
6. Inicie o temporizador de descanso. O passo termina quando premir **Iniciar**.
7. Encontre o ícone de haltere na barra lateral, que abre o formulário de registo a partir de qualquer nota. No telemóvel, use o painel de comandos.
8. Execute qualquer comando **Inserir treino** a partir do painel de comandos. O passo termina quando o fizer.
9. Concluído.

Use **Voltar** e **Seguinte** para se movimentar, ou **Saltar** para sair. Se a parte da nota para a qual a visita aponta estiver fora de vista, **Mostrar-me** desloca a página até ela. Prima `Esc` a qualquer momento para a terminar. A visita também termina quando fecha a nota ou muda para outro ficheiro. Nada se perde: as suas séries continuam no registo.

Quando os dados de exemplo estão em uso, a visita usa-os. Caso contrário, usa o seu próprio registo, por isso o gráfico e o painel começam quase vazios. A nota é criada uma única vez, junto dos exemplos ou no topo do seu cofre. Uma nota existente nunca é substituída, e pode editá-la ou eliminá-la. Se já existir uma nota chamada "Visita guiada" que não seja a da visita, esta usa "Visita guiada 1" (ou o número livre seguinte).

Quer repetir a visita? Selecione **Iniciar a visita guiada** em **Definições → Workout Planner → Como começar**, ou execute **Iniciar a visita guiada** a partir do painel de comandos.

Quer voltar a ter os exemplos ou o guia? Selecione **Criar exemplos** ou **Abrir o guia Como começar** em **Definições → Workout Planner → Como começar**, ou execute **Criar notas de exemplo** ou **Abrir o guia Como começar** a partir do painel de comandos (`Ctrl/Cmd + P`). Criar os exemplos nunca substitui nada: voltar a executá-lo acrescenta apenas os ficheiros de exemplo que faltam, e os ficheiros que alterou ficam como estão. O guia oferece-se para criar os exemplos se ainda não existirem. Uma tabela, um gráfico ou um painel vazio tem também uma ligação **Ou explore com dados de exemplo**. Se já tiver um registo de treino, os exemplos ficam com um ficheiro de registo próprio e o seu permanece intacto.

Para adicionar uma tabela a qualquer nota, por exemplo `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Toque em **+** por baixo da tabela, introduza as repetições e o peso, e guarde. A tabela atualiza-se sozinha. Também não precisa de escrever os blocos à mão: os comandos **Inserir gráfico / tabela / temporizador / painel / duração** abrem um formulário e inserem o bloco por si.

## Registar séries

Abra o formulário de registo com o **+** por baixo de uma tabela (o exercício já vem preenchido), com o ícone de haltere na barra lateral, ou com o comando **Criar registo de treino**. O formulário começa com a sua última série, por isso, na maioria das vezes, basta tocar em **+/−** uma vez e guardar. Feito antes de terminar o descanso.

O formulário pede os campos adequados ao exercício: repetições e peso para um agachamento, segundos para uma prancha, distância e tempo para uma corrida (ver [Tipos de exercício](#tipos-de-exercício)). Cada série pode também ter uma nota e um protocolo, mostrado como distintivo na tabela.

O campo de peso tem um seletor kg/lb, por isso pode registar 225 lb mesmo que a sua definição seja kg. A tabela mostra essa série como "225 lb"; os gráficos, as estatísticas e o volume convertem cada série para a unidade das suas definições.

Quando regista uma série a partir de uma nota, o nome da nota é guardado como **treino** da série, por isso uma tabela ou um gráfico com `workout: Push Day` a encontra mais tarde.

## Tabelas

Um bloco `workout-log` mostra as séries de um exercício ou de um treino, da mais recente para a mais antiga. As séries do mesmo dia ficam agrupadas numa linha com os totais desse dia, e cada linha tem um botão de editar; elimine uma série a partir do formulário de edição. No telemóvel, cada série passa a ser uma linha compacta, sem deslocação lateral.

<img src="assets/tables.png" width="720" alt="Tabela workout-log num telemóvel, com as séries agrupadas por dia com a respetiva duração e um distintivo de drop set, e o formulário de registo que o botão + abre">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Com `targetWeight` e `targetReps`, aparece um alvo de sobrecarga progressiva acima da tabela.

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro                    | Predefinição | O que faz                                           |
| ---------------------------- | ------------ | --------------------------------------------------- |
| `exercise`                   | —            | Apenas este exercício                               |
| `workout`                    | —            | Apenas este treino (nome da nota)                   |
| `exactMatch`                 | `false`      | Corresponder exatamente ao nome do exercício        |
| `dateRange`                  | todos        | Hoje e os N dias anteriores                         |
| `limit`                      | `50`         | Número máximo de linhas; com `sets`, `sets × 2` (dois treinos) |
| `sortBy`                     | `date`       | `date`, `exercise`, `weight`, `reps` ou `volume`    |
| `sortOrder`                  | `desc`       | `asc` ou `desc`                                     |
| `columns`                    | todas        | Colunas a mostrar, por exemplo `["date", "reps", "weight"]` |
| `showProtocol`               | `true`       | Mostrar a coluna do distintivo de protocolo         |
| `showAddButton`              | `true`       | Mostrar o botão **+**                               |
| `targetWeight`, `targetReps` | —            | Mostrar um alvo de sobrecarga progressiva acima da tabela |
| `sets`                       | —            | Séries planeadas, contadas por um bloco `workout-session` |

Por predefinição, os nomes dos exercícios correspondem de forma aproximada ("squat" encontra "Squat (high bar)"); adicione `exactMatch: true` para apenas esse nome exato.

</details>

## Séries no seu telemóvel (beta)

Um bloco `workout-sets` serve para registar no ginásio: as séries de hoje de um exercício, em linhas para preencher. Cada linha mostra o que fez nessa mesma série da última vez, por isso escreve apenas o que mudou (um campo vazio regista esse valor) e marca a linha. A série vai para o registo, a linha passa a ser uma série registada e o temporizador de descanso no topo arranca sozinho. A seta de uma série registada altera o seu protocolo e as notas; marcá-la de novo tira-a do registo, com **Desfazer** durante alguns segundos.

<img src="assets/sets.png" alt="Um cartão workout-sets num telemóvel: quatro linhas preenchidas com os valores da última vez, depois duas séries marcadas com o temporizador de descanso a contar, e uma linha aberta para escolher o protocolo rest-pause e acrescentar uma nota">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

O bloco é uma funcionalidade beta: ative **Séries de treino** em **Definições → Workout Planner → Funcionalidades beta** (as novas instalações já a têm ativa). Depois, **Inserir séries de exercícios** a partir do painel de comandos escreve um por si, e o menu ⋮ edita o bloco ou o temporizador de descanso.

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro                    | Predefinição  | O que faz                                                                                        |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —             | O exercício (nome exato)                                                                         |
| `workout`                    | o nome da nota | O treino em que as séries são registadas                                                        |
| `sets`                       | como da última vez | Linhas para preencher (pelo menos uma); **Adicionar conjunto** acrescenta mais              |
| `targetWeight`, `targetReps` | —             | Sugestões quando o exercício nunca foi feito, e um objetivo de sobrecarga progressiva            |
| `rest`                       | —             | Segundos de descanso após cada série; `0` para nenhum temporizador. Não definido: o `workout-timer` da mesma secção |
| `timer.*`                    | —             | As outras opções do temporizador de descanso: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls` e `timer.sound` |

</details>

## Gráficos e tendências

Um bloco `workout-chart` desenha uma medida ao longo do tempo: peso, volume, repetições, 1RM estimado, duração, distância, ritmo ou frequência cardíaca. O cabeçalho indica se a tendência é **Crescente**, **Estável** ou **Decrescente**. Estável significa que a linha de tendência varia menos de 5% da média em todo o período, por isso um ganho lento e constante continua a contar como crescente. No ritmo, menos é melhor, e uma linha descendente aparece como melhoria. No telemóvel, o gráfico passa a ser uma tabela com os mesmos valores.

Use `type: e1rm` para o melhor 1RM estimado diário (Epley: `peso × (1 + repetições / 30)`). Só contam pesos positivos com 1 a 12 repetições inteiras; as séries de aquecimento e os drop sets ficam de fora. Os dias sem séries elegíveis são omitidos. As estimativas seguem a sua definição de kg/lb. O gráfico de força por predefinição continua a ser o de volume.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

A API acrescenta `estimatedOneRepMax` a `getExerciseStats`: a melhor estimativa na unidade de peso configurada, ou `null` quando não existe nenhuma série elegível. Os campos de recorde pessoal (PR) existentes e as colunas do CSV mantêm-se inalterados.

![Gráfico de 1RM estimado do supino, com a linha de tendência crescente, no computador, e os mesmos valores numa tabela no telemóvel](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro       | Predefinição   | O que faz                                                                 |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Apenas este exercício                                                     |
| `workout`       | —              | Apenas este treino                                                        |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` ou `heartRate` |
| `chartType`     | `exercise`     | Como é construído o ponto de cada dia (abaixo)                            |
| `dateRange`     | `30`           | Dias a incluir                                                            |
| `limit`         | —              | Apenas os últimos N pontos                                                |
| `showTrendLine` | `false`        | Desenhar uma linha de tendência                                           |
| `showStats`     | `true`         | Mostrar média, melhor e mínimo por baixo do gráfico                       |
| `title`         | `Trend <type>` | Título do gráfico                                                         |
| `height`        | 4:3            | `300` (píxeis) ou qualquer comprimento CSS, como `50vh`                   |
| `exactMatch`    | `false`        | Corresponder exatamente ao nome do exercício                              |

| `chartType` | Séries usadas                        | Ponto de cada dia |
| ----------- | ------------------------------------ | ----------------- |
| `exercise`  | séries de `exercise`                 | média             |
| `workout`   | séries de `workout`                  | total             |
| `combined`  | séries de `exercise` dentro de `workout` | total         |
| `all`       | todas as séries (filtros ignorados)  | total             |

</details>

## Painel e mapa de calor muscular

Um bloco `workout-dashboard` abre com quatro números: número total de treinos, sequência semanal, volume total e recordes pessoais. Por baixo, tem estatísticas rápidas da semana, do mês e do ano, uma tendência de volume, os seus treinos recentes, estatísticas de protocolos, a duração planeada face à real do treino e um calendário de treino: um ano de dias de treino, sombreados pelo volume, com a sequência atual e a melhor sequência. Uma semana conta para a sequência quando tem os dias de treino do seu objetivo semanal (Definições → Objetivo semanal, 1 por predefinição). No telemóvel, as ações rápidas aparecem primeiro e o resumo passa a ser uma grelha 2 × 2.

<img src="assets/dashboard.png" width="720" alt="O painel num telemóvel: resumo, calendário de treino com o objetivo semanal cumprido, treinos recentes e estatísticas rápidas">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Para escolher os widgets e a sua ordem sem escrever YAML, insira o painel com o comando **Inserir painel de treino**, ou abra o menu ⋮ no canto superior direito de um painel inserido e escolha **Editar painel**.

Defina **Esquema** como **Grelha** nessa janela para colocar cada widget à sua maneira, como itens num inventário: arraste um widget para o mover, arraste o canto para o tornar mais largo ou mais alto, e largue-o por baixo da grelha para o retirar. O teclado também funciona: as setas movem, Shift e as setas redimensionam, e Delete retira um widget. A grelha tem tantas colunas quantas cabem na largura da sua nota; num painel mais estreito, os widgets são reorganizados pela ordem de leitura, e no telemóvel ficam empilhados. O seu esquema é mantido: quando a nota só cabe numa coluna (um telemóvel), a janela pergunta quantas colunas quer editar, começando pelas guardadas. O bloco mantém uma linha por widget (coluna, linha, largura, altura):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

O mapa de calor mostra que músculos treinou na última semana, no último mês ou no último ano, frente e costas, por **Volume**, **Séries** ou **Repetições**. É a forma mais rápida de notar que não treina pernas há três semanas. Por baixo, uma breve análise de treino avisa-o de desequilíbrios, como uma parte da frente a trabalhar muito mais do que as costas. Lê as tags musculares das suas [páginas de exercício](#tipos-de-exercício). Os exercícios de peso corporal e cronometrados não têm peso, por isso só se acendem em **Séries** e **Repetições**.

<img src="assets/heatmap.png" width="720" alt="Mapa de calor muscular da semana num telemóvel, frente e costas: quadríceps, glúteos e isquiotibiais treinados, com a análise de treino por baixo">

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro             | Predefinição | O que faz                                                                                                                                                                                                   |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —            | Título acima do painel                                                                                                                                                                                      |
| `dateRange`           | todos        | Apenas séries dos últimos N dias                                                                                                                                                                            |
| `widgets`             | todos        | Os widgets a mostrar, por esta ordem: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`       | `grid` coloca cada widget nas suas células (ver acima)                                                                                                                                                      |
| `columns`             | —            | Grelha: as colunas para as quais a grelha foi feita                                                                                                                                                         |
| `grid.<widget>`       | —            | Grelha: coluna, linha, largura e altura desse widget                                                                                                                                                        |
| `recentWorkoutsLimit` | `5`          | Treinos na lista recente                                                                                                                                                                                    |
| `volumeTrendDays`     | `30`         | Dias no gráfico de tendência de volume                                                                                                                                                                      |

</details>

<details>
<summary>Tags musculares</summary>

As tags podem ser uma lista, uma única palavra (`tags: chest`) ou uma linha separada por vírgulas (`tags: chest, triceps`).

Grupos gerais: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Os músculos específicos têm a sua própria área do corpo e contam para o seu grupo. Uma tag geral espalha-se por toda a área: `chest` ilumina um pouco as três partes do peitoral, enquanto `upper_chest` ilumina apenas a parte de cima por completo.

| Grupo       | Músculos específicos                        |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (ou `ql`) |
| `core`      | `obliques`, `serratus`                      |

As tags na sua própria língua, como `petto` ou `schiena`, também funcionam. O plugin mapeia-as para os grupos acima através de `muscle-tags.csv`, junto ao seu registo. Edite-o com **Gerir tags musculares** (adicionar, renomear, pesquisar, detetar duplicados) ou à mão:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Uma tag que já é o nome de um grupo (`upper_chest`, `Upper chest`, `upper-chest`) funciona sempre, mesmo que `muscle-tags.csv` não a liste.

</details>

## Temporizadores

Um bloco `workout-timer` é um temporizador de contagem decrescente, de intervalos ou um cronómetro. Guarde os seus tempos de descanso habituais como predefinições. Associe um temporizador a um exercício ou a um treino e ele reinicia sempre que registar uma série, por isso não precisa de lhe tocar entre séries. Com `autoStart: true`, começa assim que a nota abre.

<img src="assets/timers.png" width="320" alt="Dois temporizadores num telemóvel: um temporizador de intervalos na fase de descanso e uma predefinição Tabata na fase de trabalho da ronda 2">

Também emite um sinal sonoro no iOS e no Android. Os telemóveis só permitem som depois de ter tocado na página, por isso um temporizador iniciado por `autoStart` fica em silêncio até tocar em **Iniciar** uma vez.

Em **Definições → Workout Planner → Sinais para dispositivos de temporizador**, **Manter o ecrã ativo enquanto o temporizador estiver em execução** está ativo por predefinição. Pede a proteção do ecrã enquanto pelo menos um temporizador estiver em execução em primeiro plano, quando o dispositivo o permitir. **Vibrar ao terminar um temporizador** está desativado por predefinição e acrescenta um breve impulso ao chegar a zero, independentemente do som, em dispositivos compatíveis, como o Android. No iOS mantém-se o sinal sonoro existente; a vibração na web não está disponível aí. Estas funcionalidades usam APIs do navegador em regime de melhor esforço e ainda não foram verificadas em dispositivos Android e iOS físicos. Não oferecem alarmes em segundo plano. Um temporizador com `id` continua a correr quando muda de nota; pause-o ou deixe-o terminar para libertar a proteção do ecrã.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Um temporizador de intervalos pode alternar entre trabalho e descanso. O ecrã mostra **Trabalho** ou **Descanso**, e cada fase começa com o seu próprio som. Cada ronda é o seu trabalho seguido do seu descanso, incluindo a última, por isso este Tabata dura 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s de trabalho, 10 s de descanso, 8 rondas) e `preset: EMOM` (uma ronda por minuto durante 10 minutos) já vêm incluídos. Uma predefinição guardada com o mesmo nome substitui-os.

<details>
<summary>Todos os parâmetros</summary>

| Parâmetro             | Predefinição | O que faz                                                                 |
| --------------------- | ------------ | ------------------------------------------------------------------------- |
| `type`                | `countdown`  | `countdown`, `interval` ou `stopwatch`                                    |
| `duration`            | `30`         | Segundos (contagem decrescente; em intervalos, o trabalho de cada ronda)  |
| `work`                | —            | Intervalos: segundos de trabalho por ronda (substitui `duration`)         |
| `rest`                | `0`          | Intervalos: segundos de descanso após o trabalho de cada ronda            |
| `rounds`              | `1`          | Rondas (intervalos)                                                       |
| `sound`               | `true`       | Sinal sonoro quando o tempo acaba                                         |
| `autoStart`           | `false`      | Começar assim que a nota abre                                             |
| `showControls`        | `true`       | Mostrar iniciar, pausar e repor                                           |
| `preset`              | —            | Começar a partir de uma predefinição (guardada, `Tabata` ou `EMOM`); os parâmetros substituem-na |
| `exercise`, `workout` | —            | Reiniciar o temporizador quando registar uma série deste exercício ou treino |
| `superset`            | `false`      | Apenas na exportação para o canvas: desenhar este exercício e o seguinte como um superset |

</details>

## Sessão guiada

Um bloco `workout-session` no topo de uma nota de treino (comando **Inserir sessão guiada**) guia-o por ela um exercício de cada vez: em que série está, o objetivo, o que fez da última vez, um botão **Registar série** e o temporizador de descanso, que arranca quando regista uma série.

![Sessão guiada num telemóvel: a série 3 de 4 do agachamento com o descanso a contar na sessão e no cartão de séries, o formulário de registo aberto por Registar série e, depois, o exercício seguinte com o temporizador de descanso a contar](assets/session.png)

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

O plano é a própria nota: cada bloco `workout-log` ou `workout-sets` com um `exercise` é um passo, pela ordem em que aparecem, com os seus `sets`, `targetReps` e `targetWeight`. O descanso vem do `rest` do próprio bloco `workout-sets`, ou, na falta dele, do `workout-timer` na mesma secção `##` (ou da predefinição por omissão, se não houver nenhum). A sessão e o cartão de séries partilham uma só contagem decrescente. A sessão conta as séries que registou hoje neste treino, por isso retoma de onde ficou quando reabre a nota. Um exercício sem `sets` mantém-se atual até registar uma série de um exercício seguinte; **Anterior** e **Seguinte** movem-se livremente.

## Duração do treino

Um bloco `workout-duration` estima quanto tempo demora uma nota de treino: o descanso dos seus temporizadores mais o tempo de cada série, ao lado de quanto tempo durou realmente a sua última sessão.

<img src="assets/duration.png" width="420" alt="Cartão de duração estimada com o tempo de descanso, o tempo das séries e a última sessão">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` pode ser um caminho no cofre, um caminho relativo a esta nota, ou apenas o nome da nota; deixe-o de fora para estimar a nota atual. Os segundos por repetição e por série vêm de [Definições](#definições).

## Tipos de exercício

Uma página de exercício é uma nota na sua pasta de exercícios. O seu frontmatter indica o que o formulário de registo deve pedir e que músculos o exercício trabalha. **Criar página de exercício** cria uma por si.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | O formulário de registo pede                 | Também aceites                                               |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (predefinição) | repetições, peso                        | `bodyweight`, `weights`                                      |
| `timed`              | duração                                      | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distância, duração (opcional)                | `running`, `run`                                             |
| `cardio`             | duração, distância e frequência cardíaca (opcional) | —                                                     |
| `custom`             | apenas os campos listados em `parameters`   | —                                                            |

A ioga funciona da mesma forma: cada postura é um exercício `timed`, por isso o formulário pede apenas quanto tempo a manteve. As notas de exemplo incluem um fluxo de ioga matinal com uma sessão guiada.

![Fluxo de ioga num telemóvel: a sessão guiada em Downward Dog, o formulário de registo a pedir apenas a duração da postura, e o cartão de séries com a primeira postura registada](assets/yoga.png)

`type:` funciona da mesma forma que `exercise_type:`. Acrescente os seus próprios campos em `parameters`, por exemplo rondas para a corda de saltar:

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

Se mudar o tipo de um exercício depois de o registar, **Converter exercício** move as séries existentes e permite escolher para onde vai cada campo antigo.

## Os seus dados

Cada série é uma linha em `workout_logs.csv`, por isso pode abri-la numa folha de cálculo, fazer uma cópia de segurança ou sincronizá-la como qualquer outro ficheiro.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Colunas e edição manual</summary>

| Coluna                     | Significado                                  |
| -------------------------- | -------------------------------------------- |
| `date`                     | Quando a série foi registada (ISO 8601)      |
| `exercise`, `workout`      | Nome do exercício e do treino                |
| `reps`, `weight`, `volume` | O volume é repetições × peso                 |
| `origine`                  | Ligação para a nota em que foi registada     |
| `timestamp`                | ID único da linha (milissegundos)            |
| `notes`, `protocol`        | Texto livre e técnica de treino              |

Os tipos de exercício com campos próprios (`duration`, `distance`, `heartRate`, ou os seus `parameters`) acrescentam colunas no fim. A última coluna, `weightUnit`, é `kg` ou `lb`: a unidade do `weight` e do `volume` dessa linha. Um valor vazio significa a unidade das definições.

Se editar o ficheiro à mão, mantenha a linha de cabeçalho e envolva em aspas duplas qualquer valor que contenha vírgula, aspas ou quebra de linha. As notas que começam por `=`, `+`, `-` ou `@` são guardadas com um `'` no início, para que as folhas de cálculo não as executem como fórmulas; o plugin volta a ocultá-lo.

</details>

Tudo fica no seu cofre. O plugin só escreve na área de transferência quando clica num distintivo de cópia (uma tag muscular no painel), e nunca a lê.

### Dataview e Templater

O plugin expõe `WorkoutPlannerAPI` (também `window.WorkoutPlannerAPI`) assim que tiver carregado.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Referência da API e mais exemplos</summary>

| Método                       | Devolve                                                                                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Séries, cada uma com `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` e `volume` estão na unidade das definições; `enteredWeight` e `enteredUnit` são o que foi registado                          |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Nomes de exercícios, ordenados: os nomes dos ficheiros das suas páginas de exercício (incluindo subpastas), ou os nomes do seu registo quando não tem páginas de exercício. `{ tag: "chest" }` mantém os exercícios cuja página tem essa tag, por isso fica vazio sem páginas de exercício. |

`getWorkoutLogs` aceita `exercise` (parcial, sem distinguir maiúsculas), `workout`, `dateRange: { start, end }`, `protocol` e `exactMatch`.

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

Num modelo do [Templater](https://github.com/SilentVoid13/Templater), para começar uma nota com os seus números mais recentes:

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

## Definições

Defina as pastas do CSV e dos exercícios, a unidade de peso predefinida, o passo de peso dos botões **+/−**, as predefinições de temporizador, os seus próprios protocolos (nome, abreviatura e cor) e os segundos por repetição e por série usados na estimativa de duração. **Executar tudo**, em **Avançado**, executa todas as tarefas de manutenção depois de uma atualização.

Alterar a unidade de peso não muda o nome das séries antigas: cada série mantém a unidade em que foi registada.

<details>
<summary>Todos os comandos</summary>

Abra o painel de comandos (`Ctrl/Cmd + P`) e escreva o nome.

| Comando                                                     | O que faz                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Criar registo de treino                                     | Registar uma série                                                 |
| Iniciar a visita guiada                                     | Fazer a visita guiada                                              |
| Criar notas de exemplo                                      | Adicionar exercícios, treinos, registos e um painel de exemplo    |
| Abrir o guia Como começar                                   | Abrir o guia nos exemplos                                          |
| Inserir gráfico / tabela / temporizador / painel / duração  | Inserir um bloco através de um formulário                          |
| Criar página de exercício                                   | Nova página de exercício com tipo e tags                           |
| Criar secção de exercícios                                  | Adicionar um cabeçalho, temporizador e tabela de um exercício à nota atual |
| Adicionar bloco de exercício                                | Inserir um bloco de exercício, com autocompletação do nome         |
| Converter exercício                                         | Mover as séries de um exercício para outro tipo de exercício      |
| Gerir tags musculares                                       | Editar `muscle-tags.csv`                                           |
| Gerar referência de tags                                    | Criar uma nota com todas as tags musculares                        |
| Auditar nomes de exercícios                                 | Encontrar o mesmo exercício registado com grafias diferentes      |
| Exportar treino para o canvas                               | Dispor o treino atual num canvas do Obsidian                       |
| Criar ficheiro de registo CSV                               | Criar um registo vazio                                             |
| Importar de Strong ou Hevy                                  | Adicionar as séries de uma exportação CSV do Strong ou do Hevy ao registo |
| Migrar tipos de exercício, Adicionar IDs em falta aos blocos de código | Manutenção após a atualização a partir de versões anteriores |

</details>

## Resolução de problemas

- **Conflito com o Workout Block (`workout-block`).** Ambos os plugins registam blocos de código `workout-log` e usam `workout_logs.csv` como nome predefinido do ficheiro de registo. Desative um dos dois plugins antes de usar o outro.

- **Uma tabela ou um gráfico está vazio.** Verifique o nome do exercício e o `dateRange` (os gráficos usam por predefinição os últimos 30 dias). Com `exactMatch: true`, o nome tem de corresponder exatamente.
- **Um exercício não aparece no mapa de calor.** A sua página precisa de `tags` musculares e tem de estar na pasta de exercícios. Os exercícios de peso corporal e cronometrados só aparecem em **Séries** ou **Repetições**.
- **O formulário de registo pede repetições e peso para uma prancha.** Defina `exercise_type: timed` na página do exercício.
- **O temporizador não emite som no meu telemóvel.** Toque em **Iniciar** uma vez; os telemóveis bloqueiam o som até tocar na página.

## Instalação

### A partir dos plugins da comunidade

1. Abra **Definições → Plugins da comunidade**
2. Pesquise por **Workout Planner**
3. Selecione **Instalar** e, depois, **Ativar**

### Manual

1. Transfira `main.js`, `manifest.json` e `styles.css` da [versão mais recente](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Crie a pasta `your-vault/.obsidian/plugins/workout-planner/`
3. Copie os ficheiros transferidos para essa pasta
4. Ative o plugin em **Definições → Plugins da comunidade**

## Apoio

O Workout Planner é gratuito e de código aberto. Se o ajudar nos seus treinos, pode [oferecer-me um café](https://buymeacoffee.com/spatariurares). Encontrou um erro ou falta-lhe alguma coisa? Abra um [issue](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Todas as línguas, exceto o inglês, são traduzidas automaticamente, por isso algumas frases podem soar estranhas. Se a sua soar mal, são bem-vindas correções.

## Créditos

Os gráficos usam o [Chart.js](https://github.com/chartjs/Chart.js) (MIT). O Workout Planner é distribuído sob a [Licença MIT](LICENSE).
