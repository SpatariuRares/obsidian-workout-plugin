<img src="assets/logo.png" width="96" alt="Logo de Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · Español · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**El registro de entrenamientos todo en uno para Obsidian.** Levantamiento de pesas, carrera, ciclismo, yoga o ejercicios con tus propios campos: registra desde el móvil, sigue una sesión guiada y mira tu progreso en gráficos, un panel y un mapa de calor muscular. Un solo CSV, 24 idiomas.

Pensado para tu teléfono: registra cada serie, carrera o postura mientras entrenas, y luego mira tu progreso en tablas, gráficos y un panel, dentro de las mismas notas donde planificas tu entrenamiento. Tus series se guardan en un único archivo CSV de tu bóveda. Sin cuenta, sin nube.

Los gráficos muestran tu tendencia, el mapa de calor muscular muestra lo que has entrenado, y cada serie conserva su propia unidad kg/lb. Puedes consultar tus series desde Dataview.

![Workout Planner en un móvil: una tarjeta de series con dos series marcadas y el temporizador de descanso en marcha, el formulario de registro con botones +/− y selector kg/lb, y el resumen del panel con el calendario de entrenamiento](assets/hero.png)

## Funciones

- Registra series con repeticiones y peso, rellenadas con tu última serie, con botones +/− y ejercicios recientes con un solo toque
- Registra cada serie en kg o lb, según lo que marquen los discos que tengas delante
- Etiqueta las series con un protocolo: drop set, myo-reps, rest-pause, superserie, 21s, o los tuyos
- Tablas de tus series, agrupadas por día con totales diarios, editables con un toque
- Series de hoy como filas para rellenar en tu teléfono: marca una serie para registrarla, y arranca el temporizador de descanso
- Gráficos de peso, volumen, repeticiones, duración, distancia, ritmo y frecuencia cardíaca, y una tendencia que te dice claramente si estás mejorando
- Un panel con racha semanal (con objetivo semanal), calendario de entrenamiento, récords personales, volumen total, entrenamientos recientes y estadísticas de protocolos
- Un mapa de calor muscular, por delante y por detrás, por volumen, series o repeticiones
- Temporizadores de descanso (cuenta atrás, intervalos, cronómetro) con preajustes, que se reinician al registrar una serie y pitan en iOS y Android
- Una sesión guiada que recorre la nota de entrenamiento ejercicio a ejercicio
- Una estimación de cuánto dura un entrenamiento planificado
- Ejercicios de fuerza, de peso corporal, por tiempo, de distancia y de cardio, o tus propios campos
- Todas las series en un CSV sencillo, legible desde Dataview y Templater
- Pensado para móviles: sin desplazamiento lateral, con los botones siempre al alcance
- Disponible en 24 idiomas

## Cómo empezar

La primera vez que instalas el plugin, añade notas de ejemplo (ejercicios de muestra, dos entrenamientos con seis semanas de registros, un panel y una demostración de funciones), apunta el plugin hacia ellas y abre la guía de inicio: una página corta por función, con ejemplos prácticos que puedes probar. No necesitas abrir los ajustes. Explora antes de configurar los tuyos.

¿Quieres los ejemplos o la guía otra vez? Selecciona **Crear ejemplos** o **Abrir la guía de inicio** en **Configuración → Workout Planner → Cómo empezar**, o ejecuta **Crear notas de ejemplo** o **Abrir la guía de inicio** desde la paleta de comandos (`Ctrl/Cmd + P`). Crear los ejemplos nunca sobrescribe nada: si lo repites, solo añade los archivos de ejemplo que falten, y los archivos que hayas cambiado se quedan como están. La guía ofrece crear los ejemplos si todavía no existen. Una tabla, un gráfico o un panel vacíos también tienen un enlace **O explora con datos de ejemplo**. Si ya tienes un registro de entrenamientos, los ejemplos usan su propio archivo de registro y el tuyo queda intacto.

Para añadir una tabla a cualquier nota, por ejemplo `Push Day`:

````markdown
```workout-log
exercise: Bench Press
```
````

Pulsa **+** debajo de la tabla, introduce repeticiones y peso, y guarda. La tabla se actualiza sola. Tampoco tienes que escribir los bloques a mano: los comandos **Insertar gráfico / tabla / series / temporizador / panel / duración de entrenamiento** e **Insertar sesión guiada** abren un formulario o escriben el bloque por ti.

## Registrar series

Abre el formulario de registro con el **+** debajo de una tabla (el ejercicio ya viene rellenado), con el icono de mancuerna de la cinta, o con el comando **Crear registro de entrenamiento**. El formulario parte de tu última serie, así que casi siempre basta con pulsar **+/−** una vez y guardar. Hazlo antes de que termine tu descanso.

El formulario pide los campos que encajan con el ejercicio: repeticiones y peso para una sentadilla, segundos para una plancha, distancia y tiempo para una carrera (consulta [Tipos de ejercicio](#tipos-de-ejercicio)). Cada serie también puede llevar una nota y un protocolo, que se muestra como distintivo en la tabla.

El campo de peso tiene un selector kg/lb, así que puedes registrar 225 lb aunque tu ajuste sea kg. La tabla muestra esa serie como «225 lb»; los gráficos, las estadísticas y el volumen convierten cada serie a tu ajuste.

Cuando registras una serie desde una nota, el nombre de la nota se guarda como **workout** de la serie, así que una tabla o un gráfico con `workout: Push Day` la encontrarán después.

## Tablas

Un bloque `workout-log` muestra las series de un ejercicio o de un entrenamiento, de la más reciente a la más antigua. Las series del mismo día se agrupan bajo una fila con los totales de ese día, y cada fila tiene un botón de editar; elimina una serie desde su formulario de edición. En el móvil, cada serie se convierte en una fila compacta, sin desplazamiento lateral.

<img src="assets/tables.png" width="720" alt="Tabla workout-log en un móvil, con las series agrupadas por día con su tiempo y una insignia de drop set, y el formulario de registro que abre su botón +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Con `targetWeight` y `targetReps`, aparece encima de la tabla un objetivo de sobrecarga progresiva.

<details>
<summary>Todos los parámetros</summary>

| Parámetro                    | Predeterminado | Qué hace                                             |
| ---------------------------- | -------------- | ---------------------------------------------------- |
| `exercise`                   | —              | Solo este ejercicio                                  |
| `workout`                    | —              | Solo este entrenamiento (nombre de la nota)          |
| `exactMatch`                 | `false`        | Coincidir exactamente con el nombre del ejercicio    |
| `dateRange`                  | todas          | Hoy y los N días anteriores                          |
| `limit`                      | `50`           | Máximo de filas; con `sets`, `sets × 2` (dos entrenamientos) |
| `sortBy`                     | `date`         | `date`, `exercise`, `weight`, `reps` o `volume`      |
| `sortOrder`                  | `desc`         | `asc` o `desc`                                       |
| `columns`                    | todas          | Columnas a mostrar, p. ej. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`         | Mostrar la columna de la insignia de protocolo       |
| `showAddButton`              | `true`         | Mostrar el botón **+**                               |
| `targetWeight`, `targetReps` | —              | Mostrar un objetivo de sobrecarga progresiva encima de la tabla |
| `sets`                       | —              | Series planificadas, contadas por un bloque `workout-session` |

Por defecto, los nombres de ejercicio coinciden de forma flexible («squat» encuentra «Squat (high bar)»); añade `exactMatch: true` para que coincida solo ese nombre exacto.

</details>

## Series en tu teléfono

Un bloque `workout-sets` está pensado para registrar en el gimnasio: las series de hoy de un ejercicio, como filas para rellenar. Cada fila muestra lo que hiciste en la misma serie la última vez, así que solo escribes lo que ha cambiado (un campo vacío registra ese valor) y marcas la fila. La serie pasa al registro, la fila se convierte en una serie registrada y el temporizador de descanso de arriba arranca solo. La flecha de una serie registrada cambia su protocolo y sus notas; volver a marcarla la quita del registro, con **Deshacer** durante unos segundos.

<img src="assets/sets.png" alt="Una tarjeta de series en un móvil: cuatro filas rellenadas con los valores de la última vez, luego dos series marcadas con el temporizador de descanso en marcha, y después una fila abierta para elegir el protocolo rest-pause y añadir una nota">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Insertar series de entrenamiento** desde la paleta de comandos escribe uno por ti, y el menú ⋮ lo edita o edita su temporizador de descanso.

<details>
<summary>Todos los parámetros</summary>

| Parámetro                    | Predeterminado         | Qué hace                                                                                                     |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `exercise`                   | —                      | El ejercicio (nombre exacto)                                                                                 |
| `workout`                    | el nombre de la nota   | El entrenamiento en el que se registran las series                                                           |
| `sets`                       | como la última vez     | Filas para rellenar (al menos una); **Añadir serie** añade más                                              |
| `targetWeight`, `targetReps` | —                      | Pistas cuando nunca hiciste el ejercicio, y un objetivo de sobrecarga progresiva                             |
| `rest`                       | —                      | Segundos de descanso tras cada serie; `0` para no tener temporizador. Sin valor: el `workout-timer` de la sección |
| `timer.*`                    | —                      | Las demás opciones del temporizador de descanso: `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Gráficos y tendencias

Un bloque `workout-chart` dibuja una medida a lo largo del tiempo: peso, volumen, repeticiones, 1RM estimado, duración, distancia, ritmo o frecuencia cardíaca. El encabezado indica si la tendencia es **Aumentando**, **Estable** o **Disminuyendo**. Estable significa que la línea de tendencia se mueve menos del 5 % de la media en todo el periodo, así que un progreso lento pero constante sigue contando como aumento. En el ritmo, menos es mejor, y una línea que baja se muestra como mejora. En un móvil, el gráfico se convierte en una tabla con los mismos valores.

Usa `type: e1rm` para obtener el mejor 1RM estimado diario (Epley: `peso × (1 + repeticiones / 30)`). Solo cuentan los pesos positivos con repeticiones enteras de 1 a 12; las series de calentamiento y los drop sets quedan excluidos. Los días sin series válidas se omiten. Las estimaciones siguen tu ajuste kg/lb. El gráfico de fuerza predeterminado sigue siendo el de volumen.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

La API añade `estimatedOneRepMax` a `getExerciseStats`: la mejor estimación en la unidad de peso configurada, o `null` si no hay ninguna serie válida. Los campos de PR existentes y las columnas del CSV no cambian.

![Gráfico de 1RM estimado de press de banca con su línea de tendencia al alza en escritorio, y los mismos valores como tabla en un móvil](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Todos los parámetros</summary>

| Parámetro       | Predeterminado | Qué hace                                                                  |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Solo este ejercicio                                                       |
| `workout`       | —              | Solo este entrenamiento                                                   |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `e1rm`, `duration`, `distance`, `pace` o `heartRate` |
| `chartType`     | `exercise`     | Cómo se calcula el punto de cada día (abajo)                              |
| `dateRange`     | `30`           | Días a incluir                                                            |
| `limit`         | —              | Solo los últimos N puntos                                                 |
| `showTrendLine` | `false`        | Dibujar una línea de tendencia                                            |
| `showTrend`     | `true`         | Mostrar el encabezado de tendencia encima del gráfico                     |
| `showStats`     | `true`         | Mostrar media, mejor y peor valor debajo del gráfico                      |
| `title`         | `Trend <type>` | Título del gráfico                                                        |
| `height`        | 4:3            | `300` (píxeles) o cualquier longitud CSS, como `50vh`                     |
| `exactMatch`    | `false`        | Coincidir exactamente con el nombre del ejercicio                         |

| `chartType` | Series usadas                       | Punto de cada día |
| ----------- | ----------------------------------- | ----------------- |
| `exercise`  | series de `exercise`                | media             |
| `workout`   | series de `workout`                 | total             |
| `combined`  | series de `exercise` dentro de `workout` | total        |
| `all`       | todas las series (los filtros se ignoran) | total       |

</details>

## Panel y mapa de calor muscular

Un bloque `workout-dashboard` se abre con cuatro cifras: entrenamientos totales, racha semanal, volumen total y récords personales. Debajo tienes estadísticas rápidas de la semana, el mes y el año, una tendencia de volumen, tus entrenamientos recientes, estadísticas de protocolos, la duración planificada frente a la real y un calendario de entrenamiento: un año de días de entrenamiento, sombreados por volumen, con tu racha actual y tu mejor racha. Una semana cuenta para la racha cuando tiene los días de entrenamiento de tu objetivo semanal (**Configuración → Objetivo semanal**, 1 por defecto). En un móvil, las acciones rápidas van primero y el resumen se muestra en una cuadrícula de 2 × 2.

<img src="assets/dashboard.png" width="720" alt="El panel en un móvil: resumen, calendario de entrenamiento con el objetivo semanal cumplido, entrenamientos recientes y estadísticas rápidas">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Para elegir los widgets y su orden sin escribir YAML, inserta el panel con el comando **Insertar panel de entrenamiento**, o abre el menú ⋮ de la esquina superior derecha de un panel insertado y elige **Editar panel**.

Pon **Diseño** en **Cuadrícula** en esa ventana para colocar cada widget tú mismo, como objetos en un inventario: arrastra un widget para moverlo, arrastra su esquina para hacerlo más ancho o más alto, y suéltalo debajo de la cuadrícula para quitarlo. El teclado también funciona: las flechas mueven, Mayús con las flechas redimensiona, y Suprimir quita un widget. La cuadrícula tiene tantas columnas como quepan en el ancho de tu nota; en un panel más estrecho, los widgets se reacomodan en orden de lectura, y en un móvil se apilan. Tu diseño se conserva: cuando la nota cabe en una sola columna (un móvil), la ventana pregunta cuántas columnas editar, empezando por las guardadas. El bloque mantiene una línea por widget (columna, fila, ancho, alto):

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

El mapa de calor muestra qué músculos has entrenado en la última semana, el último mes o el último año, por delante y por detrás, por **Volumen**, **Series** o **Repeticiones**. Es la forma más rápida de notar que llevas tres semanas sin entrenar piernas. Debajo, un breve análisis de entrenamiento te avisa de desequilibrios, como un frente que trabaja mucho más que la espalda. Lee las etiquetas musculares de tus [páginas de ejercicio](#tipos-de-ejercicio). Los ejercicios de peso corporal y por tiempo no tienen peso, así que solo se iluminan en Series y Repeticiones.

<img src="assets/heatmap.png" width="720" alt="Mapa de calor muscular de la semana en un móvil, por delante y por detrás: cuádriceps, glúteos e isquiotibiales entrenados, con el análisis de entrenamiento debajo">

<details>
<summary>Todos los parámetros</summary>

| Parámetro             | Predeterminado | Qué hace                                                                                                                                                                                                    |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —              | Encabezado sobre el panel                                                                                                                                                                                   |
| `dateRange`           | todas          | Solo series de los últimos N días                                                                                                                                                                           |
| `widgets`             | todas          | Los widgets a mostrar, en este orden: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`         | `grid` coloca cada widget en sus celdas (ver arriba)                                                                                                                                                        |
| `columns`             | —              | Cuadrícula: las columnas para las que se creó                                                                                                                                                               |
| `grid.<widget>`       | —              | Cuadrícula: columna, fila, ancho y alto de ese widget                                                                                                                                                       |
| `recentWorkoutsLimit` | `5`            | Entrenamientos en la lista reciente                                                                                                                                                                         |
| `volumeTrendDays`     | `30`           | Días en el gráfico de tendencia de volumen                                                                                                                                                                  |

</details>

<details>
<summary>Etiquetas musculares</summary>

Las etiquetas pueden ser una lista, una sola palabra (`tags: chest`) o una línea separada por comas (`tags: chest, triceps`).

Grupos generales: `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Los músculos concretos tienen su propia zona del cuerpo y cuentan para su grupo. Una etiqueta general se reparte por toda la zona: `chest` ilumina un poco las tres partes del pecho, mientras que `upper_chest` ilumina por completo solo la superior.

| Grupo       | Músculos concretos                          |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (o `ql`)  |
| `core`      | `obliques`, `serratus`                      |

Las etiquetas en tu idioma, como `petto` o `schiena`, también funcionan. El plugin las asigna a los grupos anteriores usando `muscle-tags.csv`, junto a tu registro. Edítalo con **Gestionar etiquetas musculares** (añadir, renombrar, buscar, detectar duplicados) o a mano:

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Una etiqueta que ya es el nombre de un grupo (`upper_chest`, `Upper chest`, `upper-chest`) siempre funciona, aunque `muscle-tags.csv` no la liste.

</details>

## Temporizadores

Un bloque `workout-timer` es un temporizador de cuenta atrás, de intervalos o un cronómetro. Guarda tus tiempos de descanso habituales como preajustes. Vincula un temporizador a un ejercicio o a un entrenamiento y se reinicia cada vez que registras una serie, así no tienes que tocarlo entre series. Con `autoStart: true` arranca en cuanto se abre la nota.

<img src="assets/timers.png" width="320" alt="Dos temporizadores en un móvil: un temporizador de intervalos en su fase de descanso y un preajuste Tabata en la fase de trabajo de la ronda 2">

También pita en iOS y Android. Los teléfonos solo permiten sonido después de que hayas tocado la página, así que un temporizador iniciado por `autoStart` permanece en silencio hasta que pulses **Iniciar** una vez.

En **Configuración → Workout Planner → Indicaciones para dispositivos de temporizador**, **Mantener la pantalla encendida mientras se ejecuta un temporizador** está activado por defecto. Solicita mantener la pantalla activa mientras al menos un temporizador se ejecuta en primer plano, cuando el dispositivo lo permite. **Vibrar al finalizar un temporizador** está desactivado por defecto y añade un breve pulso al llegar a cero, independientemente del sonido, en dispositivos compatibles como Android. iOS mantiene la señal sonora actual; la vibración web no está disponible allí. Estas funciones usan APIs del navegador en la medida de lo posible y todavía no se han verificado en dispositivos Android e iOS físicos. No ofrecen alarmas en segundo plano. Un temporizador con un `id` sigue funcionando cuando cambias de nota; páusalo o deja que termine para liberar la pantalla.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Un temporizador de intervalos puede alternar trabajo y descanso. La pantalla muestra **Trabajo** o **Descanso**, y cada fase empieza con su propio sonido. Cada ronda es su trabajo seguido de su descanso, incluida la última, así que este Tabata dura 4:00:

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s de trabajo, 10 s de descanso, 8 rondas) y `preset: EMOM` (una ronda cada minuto durante 10 minutos) vienen integrados. Un preajuste guardado con el mismo nombre los reemplaza.

<details>
<summary>Todos los parámetros</summary>

| Parámetro             | Predeterminado | Qué hace                                                              |
| --------------------- | -------------- | --------------------------------------------------------------------- |
| `type`                | `countdown`    | `countdown`, `interval` o `stopwatch`                                 |
| `duration`            | `30`           | Segundos (cuenta atrás; en intervalos, el trabajo de cada ronda)      |
| `work`                | —              | Intervalo: segundos de trabajo por ronda (sustituye a `duration`)     |
| `rest`                | `0`            | Intervalo: segundos de descanso tras el trabajo de cada ronda         |
| `rounds`              | `1`            | Rondas (intervalo)                                                    |
| `sound`               | `true`         | Pitar cuando se acaba el tiempo                                       |
| `autoStart`           | `false`        | Arrancar en cuanto se abre la nota                                    |
| `showControls`        | `true`         | Mostrar iniciar, pausar y reiniciar                                   |
| `preset`              | —              | Partir de un preajuste (guardado, `Tabata` o `EMOM`); los parámetros lo sobrescriben |
| `exercise`, `workout` | —              | Reiniciar el temporizador al registrar una serie de este ejercicio o entrenamiento |
| `superset`            | `false`        | Solo exportación al lienzo: dibuja este ejercicio y el siguiente como superserie |

</details>

## Sesión guiada

Un bloque `workout-session` al inicio de una nota de entrenamiento (comando **Insertar sesión guiada**) te guía por ella ejercicio a ejercicio: en qué serie vas, el objetivo, lo que hiciste la última vez, un botón **Registrar serie** y el temporizador de descanso, que arranca al registrar una serie.

![Sesión guiada en un móvil: serie 3 de 4 de la sentadilla con el descanso en marcha tanto en la sesión como en la tarjeta de series, el formulario de registro abierto con Registrar serie, y luego el siguiente ejercicio con su temporizador de descanso en marcha](assets/session.png)

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

El plan es la propia nota: cada bloque `workout-log` o `workout-sets` con un `exercise` es un paso, en el orden en que aparecen, con sus `sets`, `targetReps` y `targetWeight`. El descanso viene del `rest` de su bloque `workout-sets` o, si no lo tiene, del `workout-timer` de la misma sección `##` (o del preajuste predeterminado si no hay ninguno). La sesión y la tarjeta de series comparten una sola cuenta atrás. La sesión cuenta las series que registraste hoy en este entrenamiento, así que retoma donde lo dejaste al reabrir la nota. Un ejercicio sin `sets` sigue siendo el actual hasta que registras una serie de uno posterior; **Anterior** y **Siguiente** te permiten moverte libremente.

## Duración del entrenamiento

Un bloque `workout-duration` estima cuánto dura una nota de entrenamiento: el descanso de sus temporizadores más el tiempo de cada serie, junto a cuánto duró realmente tu última sesión.

<img src="assets/duration.png" width="420" alt="Tarjeta de duración estimada con el tiempo de descanso, el tiempo por serie y la última sesión">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` puede ser una ruta dentro de la bóveda, una ruta relativa a esta nota o solo el nombre de la nota; si lo omites, se estima la nota actual. Los segundos por repetición y por serie vienen de [Configuración](#configuración).

## Tipos de ejercicio

Una página de ejercicio es una nota en tu carpeta de ejercicios. Su frontmatter indica qué pide el formulario de registro y qué músculos entrena el ejercicio. **Crear página de ejercicio** crea una por ti.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | El formulario pide                           | También aceptado                                             |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (predeterminado) | repeticiones, peso                    | `bodyweight`, `weights`                                      |
| `timed`              | duración                                     | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distancia, duración (opcional)               | `running`, `run`                                             |
| `cardio`             | duración, distancia y frecuencia cardíaca (opcional) | —                                                    |
| `custom`             | solo los campos que enumeres en `parameters` | —                                                            |

El yoga funciona igual: cada postura es un ejercicio `timed`, así que el formulario solo pregunta cuánto tiempo la mantuviste. Las notas de ejemplo incluyen un flujo matutino de yoga con una sesión guiada.

![Un flujo de yoga en un móvil: la sesión guiada en Downward Dog, el formulario de registro que solo pide la duración de la postura, y la tarjeta de series con la primera postura registrada](assets/yoga.png)

Para un deporte que registra otra cosa (un grado de escalada, intentos, si lo encadenaste), crea tu propio tipo en **Configuración → Tipos de ejercicio**: ponle un nombre y elige sus campos, los integrados, como repeticiones y peso, o nuevos (número, texto o sí/no). Después aparece en la lista de tipos al crear un ejercicio, que escribe `exercise_type: <your type>` en la página. Los tipos integrados no se pueden cambiar, pero **Duplicar** crea un tipo a partir de uno. Eliminar un tipo solo deja de ofrecerlo: los ejercicios que lo usan conservan sus campos y sus series registradas.

`type:` funciona igual que `exercise_type:`. También puedes añadir campos a un ejercicio concreto bajo `parameters`, por ejemplo rondas para la comba:

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

Si cambias el tipo de un ejercicio después de registrarlo, **Convertir ejercicio** traslada las series existentes y te deja elegir a qué campo nuevo va cada campo antiguo.

## Tus datos

Cada serie es una fila de `workout_logs.csv`, así que puedes abrirlo en una hoja de cálculo, hacer copias de seguridad o sincronizarlo como cualquier otro archivo.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Columnas y edición a mano</summary>

| Columna                    | Significado                          |
| -------------------------- | ------------------------------------ |
| `date`                     | Cuándo se registró la serie (ISO 8601) |
| `exercise`, `workout`      | Nombre del ejercicio y del entrenamiento |
| `reps`, `weight`, `volume` | El volumen es repeticiones × peso    |
| `origine`                  | Enlace a la nota desde la que se registró |
| `timestamp`                | ID único de la fila (milisegundos)   |
| `notes`, `protocol`        | Texto libre y técnica de entrenamiento |

Los tipos de ejercicio con campos propios (`duration`, `distance`, `heartRate` o tus `parameters`) añaden columnas al final. La última columna, `weightUnit`, es `kg` o `lb`: la unidad del `weight` y el `volume` de esa fila. Un valor vacío significa la unidad de la configuración.

Si editas el archivo a mano, conserva la fila de encabezados y encierra entre comillas dobles cualquier valor que contenga una coma, unas comillas o un salto de línea. Las notas que empiezan por `=`, `+`, `-` o `@` se guardan con un `'` inicial para que las hojas de cálculo no las ejecuten como fórmulas; el plugin lo oculta de nuevo.

</details>

Todo se queda en tu bóveda. El plugin escribe en el portapapeles solo cuando pulsas una insignia de copia (una etiqueta muscular del panel), y nunca lo lee.

### Dataview y Templater

El plugin expone `WorkoutPlannerAPI` (también `window.WorkoutPlannerAPI`) una vez cargado.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Referencia de la API y más ejemplos</summary>

| Método                       | Devuelve                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Series, cada una con `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` y `volume` están en la unidad de la configuración; `enteredWeight` y `enteredUnit` son lo que se registró                                    |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Nombres de ejercicios, ordenados: los nombres de archivo de tus páginas de ejercicio (incluidas las subcarpetas), o los nombres de tu registro si no tienes páginas de ejercicio. `{ tag: "chest" }` conserva los ejercicios cuya página tiene esa etiqueta, así que está vacío sin páginas de ejercicio. |

`getWorkoutLogs` acepta `exercise` (parcial, sin distinguir mayúsculas), `workout`, `dateRange: { start, end }`, `protocol` y `exactMatch`.

Sentadillas recientes, en Dataview:

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

En una plantilla de [Templater](https://github.com/SilentVoid13/Templater), para empezar una nota con tus últimos números:

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

## Configuración

Configura las carpetas del CSV y de ejercicios, la unidad de peso predeterminada, el paso de peso de los botones **+/−**, los preajustes de temporizador, tus propios protocolos (nombre, etiqueta corta y color), y los segundos por repetición y por serie que usa la estimación de duración. **Ejecutar todas** en **Avanzado** ejecuta todas las tareas de mantenimiento tras una actualización.

Cambiar la unidad de peso no cambia la etiqueta de las series antiguas: cada serie conserva la unidad con la que se registró.

<details>
<summary>Todos los comandos</summary>

Abre la paleta de comandos (`Ctrl/Cmd + P`) y escribe el nombre.

| Comando | Qué hace |
| --- | --- |
| Crear registro de entrenamiento | Registrar una serie |
| Crear notas de ejemplo | Añadir ejercicios, entrenamientos, registros y un panel de ejemplo |
| Abrir la guía de inicio, Iniciar la visita guiada | Abrir la guía dentro de los ejemplos |
| Mostrar novedades | Mostrar qué ha cambiado en cada versión |
| Insertar gráfico / tabla / series / temporizador / panel / duración de entrenamiento | Insertar un bloque mediante un formulario |
| Insertar sesión guiada | Insertar un bloque `workout-session` en el cursor |
| Crear página de ejercicio | Nueva página de ejercicio con tipo y etiquetas |
| Añadir bloque de ejercicio | Añadir una sección para un ejercicio con su bloque de series, con autocompletado de nombres |
| Convertir ejercicio | Mover las series de un ejercicio a otro tipo de ejercicio |
| Gestionar etiquetas musculares | Editar `muscle-tags.csv` |
| Generar referencia de etiquetas | Crear una nota con todas las etiquetas musculares |
| Revisar nombres de ejercicios | Encontrar el mismo ejercicio registrado con distintas escrituras |
| Exportar entrenamiento al lienzo | Disponer el entrenamiento actual en un lienzo de Obsidian |
| Crear archivo de registro CSV | Crear un registro vacío |
| Importar desde Strong o Hevy | Añadir las series de una exportación CSV de Strong o Hevy al registro |
| Migrar tipos de ejercicio, Añadir los IDs faltantes a los bloques de código | Mantenimiento tras actualizar desde versiones anteriores |

</details>

## Solución de problemas

- **Conflicto con Workout Block (`workout-block`).** Ambos plugins registran bloques de código `workout-log` y usan `workout_logs.csv` como nombre predeterminado del archivo de registro. Desactiva uno de los dos antes de usar el otro.

- **Una tabla o un gráfico está vacío.** Revisa el nombre del ejercicio y el `dateRange` (los gráficos usan por defecto los últimos 30 días). Con `exactMatch: true`, el nombre debe coincidir exactamente.
- **Falta un ejercicio en el mapa de calor.** Su página necesita `tags` musculares y debe estar en la carpeta de ejercicios. Los ejercicios de peso corporal y por tiempo solo aparecen en **Series** o **Repeticiones**.
- **El formulario de registro pide repeticiones y peso para una plancha.** Pon `exercise_type: timed` en la página del ejercicio.
- **El temporizador no suena en mi teléfono.** Pulsa **Iniciar** una vez; los teléfonos bloquean el sonido hasta que tocas la página.

## Instalación

### Desde complementos de la comunidad

1. Abre **Configuración → Complementos de la comunidad**
2. Busca **Workout Planner**
3. Pulsa **Instalar** y luego **Activar**

### Manual

1. Descarga `main.js`, `manifest.json` y `styles.css` desde la [última versión](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Crea la carpeta `your-vault/.obsidian/plugins/workout-planner/`
3. Copia los archivos descargados en esa carpeta
4. Activa el plugin en **Configuración → Complementos de la comunidad**

## Soporte

Workout Planner es gratuito y de código abierto. Si te ayuda en tu entrenamiento, puedes [invitarme a un café](https://buymeacoffee.com/spatariurares). ¿Encontraste un error o echas algo de menos? Abre una [incidencia](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Todos los idiomas salvo el inglés se traducen con máquina, así que algunas frases pueden sonar raras. Si alguna suena extraña, las correcciones son bienvenidas.

## Créditos

Los gráficos usan [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner se publica bajo la [Licencia MIT](LICENSE).
