<img src="assets/logo.png" width="96" alt="Logo de Workout Planner">

# Workout Planner

[English](README.md) · [العربية](README.AR.md) · [Čeština](README.CZ.md) · [Dansk](README.DA.md) · [Deutsch](README.DE.md) · [Español](README.ES.md) · Français · [हिन्दी](README.HI.md) · [Bahasa Indonesia](README.ID.md) · [Italiano](README.IT.md) · [日本語](README.JA.md) · [한국어](README.KO.md) · [Nederlands](README.NL.md) · [Norsk bokmål](README.NO.md) · [Polski](README.PL.md) · [Português (Brasil)](README.PT-BR.md) · [Português (Portugal)](README.PT.md) · [Română](README.RO.md) · [Русский](README.RU.md) · [Shqip](README.SQ.md) · [Türkçe](README.TR.md) · [Українська](README.UK.md) · [简体中文](README.ZH.md) · [繁體中文](README.ZH-TW.md)

**Le suivi d'entraînement tout-en-un pour Obsidian.** Musculation, course, vélo, yoga ou exercices avec vos propres champs : enregistrez depuis votre téléphone, suivez une séance guidée et visualisez vos progrès dans des graphiques, un tableau de bord et une carte thermique musculaire. Un seul CSV, 24 langues.

Conçu pour votre téléphone : enregistrez chaque série, course ou posture pendant l'entraînement, puis suivez vos progrès dans des tableaux, des graphiques et un tableau de bord, directement dans les notes où vous planifiez vos entraînements. Vos séries sont stockées dans un seul fichier CSV de votre coffre. Pas de compte, pas de cloud.

Les graphiques montrent votre tendance, la carte thermique musculaire montre ce que vous avez travaillé, et chaque série conserve son unité kg/lb. Vous pouvez interroger vos séries depuis Dataview.

![Workout Planner sur téléphone : une carte de séries avec deux séries cochées et le minuteur de repos en cours, le formulaire d'enregistrement avec ses boutons +/− et son sélecteur kg/lb, et le résumé du tableau de bord avec le calendrier d'entraînement](assets/hero.png)

## Fonctionnalités

- Enregistrez des séries avec répétitions et poids, pré-remplies à partir de votre dernière série, avec des boutons +/− et les exercices récents en un seul geste
- Enregistrez chaque série en kg ou en lb, quelle que soit la charge affichée sur vos disques
- Associez un protocole à une série : drop set, myo-reps, rest-pause, superset, 21s, ou le vôtre
- Tableaux de vos séries, regroupés par jour avec les totaux quotidiens, modifiables d'un seul geste
- Les séries du jour sous forme de lignes à remplir sur votre téléphone : cochez une série pour l'enregistrer, et le minuteur de repos démarre
- Graphiques du poids, du volume, des répétitions, de la durée, de la distance, de l'allure et de la fréquence cardiaque, avec une tendance qui vous indique clairement si vous progressez
- Un tableau de bord avec la série de semaines (avec un objectif hebdomadaire), un calendrier d'entraînement, les records personnels, le volume total, les entraînements récents et les statistiques de protocoles
- Une carte thermique musculaire, de face et de dos, par volume, séries ou répétitions
- Des minuteurs de repos (compte à rebours, intervalles, chronomètre) avec préréglages, qui redémarrent quand vous enregistrez une série et émettent un bip sur iOS et Android
- Une séance guidée qui parcourt la note d'entraînement un exercice à la fois
- Une estimation de la durée d'un entraînement prévu
- Exercices de force, au poids du corps, chronométrés, de distance et cardio, ou vos propres champs
- Toutes les séries dans un fichier CSV simple, lisible depuis Dataview et Templater
- Conçu pour téléphone : pas de défilement horizontal, boutons toujours à portée de main
- Disponible en 24 langues

## Premiers pas

La première fois que vous installez le plugin, il ajoute des notes d'exemple (exercices types, deux entraînements avec six semaines de journaux, un tableau de bord et une présentation des fonctionnalités), le configure pour les utiliser et ouvre le guide **Premiers pas** : une courte page par fonctionnalité, avec des exemples fonctionnels à essayer. Vous n'avez pas besoin d'ouvrir les paramètres. Explorez avant de configurer le vôtre.

### La visite guidée

La visite ouvre une note « Visite guidée » avec un tableau, un graphique, un tableau de bord et un minuteur, et pointe chacun d'eux à tour de rôle. Elle comporte neuf étapes courtes :

1. Enregistrez votre première série avec le bouton **+**. L'étape se termine quand vous l'enregistrez.
2. Modifiez ou supprimez une série avec les boutons de chaque ligne.
3. Visualisez votre progression dans le graphique.
4. Consultez les totaux et les tendances dans le tableau de bord.
5. Voyez quels muscles vous avez travaillés dans la carte thermique musculaire.
6. Lancez le minuteur de repos. L'étape se termine quand vous appuyez sur **Démarrer**.
7. Repérez l'icône d'haltère dans le ruban, qui ouvre le formulaire d'enregistrement depuis n'importe quelle note. Sur téléphone, utilisez plutôt la palette de commandes.
8. Lancez depuis la palette de commandes une commande **Insérer** (graphique, tableau, minuteur, tableau de bord ou durée d'entraînement). L'étape se termine quand vous le faites.
9. Terminé.

Utilisez **Retour** et **Suivant** pour vous déplacer, ou **Passer la visite** pour quitter. Si la partie de la note visée par la visite est hors de l'écran, **Montrez-moi** fait défiler jusqu'à elle. Appuyez sur `Esc` à tout moment pour la terminer. La visite se termine aussi quand vous fermez sa note ou passez à un autre fichier. Rien n'est perdu : vos séries restent dans le journal.

Quand les données d'exemple sont utilisées, la visite s'appuie sur elles. Sinon, elle utilise votre propre journal, si bien que le graphique et le tableau de bord sont presque vides au départ. La note n'est créée qu'une fois, à côté des exemples ou en haut de votre coffre. Une note existante n'est jamais écrasée, et vous pouvez la modifier ou la supprimer. Si une note nommée « Visite guidée » existe déjà et n'appartient pas à la visite, la visite utilise « Visite guidée 1 » (ou le prochain numéro libre) à la place.

Vous voulez refaire la visite ? Sélectionnez **Commencer la visite** sous **Paramètres → Workout Planner → Premiers pas**, ou lancez **Commencer la visite** depuis la palette de commandes.

Vous voulez de nouveau les exemples ou le guide ? Sélectionnez **Créer les exemples** ou **Ouvrir le guide de démarrage** sous **Paramètres → Workout Planner → Premiers pas**, ou lancez **Créer des notes d'exemple** ou **Ouvrir le guide de démarrage** depuis la palette de commandes (`Ctrl/Cmd + P`). Créer les exemples n'écrase jamais rien : le relancer ajoute seulement les fichiers d'exemple manquants, et les fichiers que vous avez modifiés restent tels quels. Le guide propose de créer les exemples s'ils n'existent pas encore. Un tableau, un graphique ou un tableau de bord vide affiche aussi un lien **Ou explorez avec des données d'exemple.** Si vous avez déjà un journal d'entraînement, les exemples obtiennent leur propre fichier de journal, et le vôtre reste intact.

Pour ajouter un tableau à n'importe quelle note, par exemple `Push Day` :

````markdown
```workout-log
exercise: Bench Press
```
````

Appuyez sur **+** sous le tableau, saisissez les répétitions et le poids, puis enregistrez. Le tableau se met à jour tout seul. Vous n'avez pas non plus à écrire les blocs à la main : les commandes **Insérer un graphique / un tableau / un minuteur / un tableau de bord / une durée d'entraînement** ouvrent un formulaire et insèrent le bloc pour vous.

## Enregistrer des séries

Ouvrez le formulaire d'enregistrement avec le bouton **+** sous un tableau (l'exercice est déjà renseigné), l'icône d'haltère dans le ruban, ou la commande **Créer un journal d'entraînement**. Le formulaire part de votre dernière série : la plupart du temps, il vous suffit d'appuyer une fois sur **+/−** puis d'enregistrer. Le tout avant la fin de votre repos.

Le formulaire demande les champs adaptés à l'exercice : répétitions et poids pour un squat, secondes pour une planche, distance et durée pour une course (voir [Types d'exercices](#types-dexercices)). Chaque série peut aussi porter une note et un protocole, affiché sous forme de badge dans le tableau.

Le champ du poids dispose d'un sélecteur kg/lb : vous pouvez donc enregistrer 225 lb même si votre réglage est en kg. Le tableau affiche cette série « 225 lb ». Les graphiques, statistiques et volumes convertissent chaque série dans votre réglage.

Quand vous enregistrez une série depuis une note, le nom de la note est enregistré comme **entraînement** de la série. Un tableau ou un graphique avec `workout: Push Day` la retrouvera donc plus tard.

## Tableaux

Un bloc `workout-log` affiche les séries d'un exercice ou d'un entraînement, les plus récentes en premier. Les séries d'un même jour sont regroupées sous une ligne avec les totaux de la journée, et chaque ligne possède un bouton de modification ; supprimez une série depuis le formulaire de modification. Sur téléphone, chaque série devient une ligne compacte, sans défilement horizontal.

<img src="assets/tables.png" width="720" alt="Un tableau workout-log sur téléphone, séries regroupées par jour avec leur durée et un badge drop set, et le formulaire d'enregistrement ouvert par son bouton +">

```workout-log
exercise: Bench Press
dateRange: 14
targetWeight: 100
targetReps: 8
```

Avec `targetWeight` et `targetReps`, une cible de surcharge progressive apparaît au-dessus du tableau.

<details>
<summary>Tous les paramètres</summary>

| Paramètre                    | Défaut  | Rôle                                                 |
| ---------------------------- | ------- | ---------------------------------------------------- |
| `exercise`                   | —       | Seulement cet exercice                               |
| `workout`                    | —       | Seulement cet entraînement (nom de la note)          |
| `exactMatch`                 | `false` | Correspondance exacte du nom de l'exercice           |
| `dateRange`                  | toutes  | Aujourd'hui et les N jours précédents                |
| `limit`                      | `50`    | Nombre maximal de lignes ; avec `sets`, `sets × 2` (deux entraînements) |
| `sortBy`                     | `date`  | `date`, `exercise`, `weight`, `reps` ou `volume`     |
| `sortOrder`                  | `desc`  | `asc` ou `desc`                                      |
| `columns`                    | toutes  | Colonnes à afficher, par ex. `["date", "reps", "weight"]` |
| `showProtocol`               | `true`  | Affiche la colonne du badge de protocole             |
| `showAddButton`              | `true`  | Affiche le bouton **+**                              |
| `targetWeight`, `targetReps` | —       | Affiche une cible de surcharge progressive au-dessus du tableau |
| `sets`                       | —       | Séries prévues, comptées par un bloc `workout-session` |

La correspondance des noms d'exercices est souple par défaut (« squat » trouve « Squat (high bar) ») ; ajoutez `exactMatch: true` pour ne retenir que ce nom exact.

</details>

## Séries sur votre téléphone

Un bloc `workout-sets` sert à enregistrer à la salle : les séries du jour d'un exercice, sous forme de lignes à remplir. Chaque ligne affiche ce que vous avez fait lors de la même série la fois précédente, si bien que vous ne saisissez que ce qui a changé (un champ vide enregistre cette valeur) puis cochez la ligne. La série rejoint le journal, la ligne devient une série enregistrée, et le minuteur de repos en haut démarre tout seul. La flèche d'une série enregistrée modifie son protocole et ses notes ; la décocher la retire du journal, et **Annuler** la remet pendant quelques secondes.

<img src="assets/sets.png" alt="Une carte workout-sets sur téléphone : quatre lignes remplies avec les valeurs de la dernière fois, puis deux séries cochées avec le minuteur de repos en cours, puis une ligne ouverte pour choisir le protocole rest-pause et ajouter une note">

```workout-sets
exercise: Squat
sets: 4
rest: 120
```

**Ajouter des séries d'exercices** dans la palette de commandes en insère un, et le menu ⋮ modifie le bloc ou son minuteur de repos.

<details>
<summary>Tous les paramètres</summary>

| Paramètre                    | Défaut                 | Rôle                                                                                             |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `exercise`                   | —                      | L'exercice (nom exact)                                                                           |
| `workout`                    | le nom de la note      | L'entraînement sous lequel les séries sont enregistrées                                          |
| `sets`                       | comme la fois précédente | Lignes à remplir (au moins une) ; **Ajouter une série** en ajoute                              |
| `targetWeight`, `targetReps` | —                      | Indications quand l'exercice n'a jamais été fait, et objectif de surcharge progressive          |
| `rest`                       | —                      | Secondes de repos après chaque série ; `0` pour aucun minuteur. Non défini : le `workout-timer` de la section |
| `timer.*`                    | —                      | Les autres options du minuteur de repos : `timer.type`, `timer.preset`, `timer.rest`, `timer.rounds`, `timer.showControls`, `timer.sound` |

</details>

## Graphiques et tendances

Un bloc `workout-chart` trace une mesure dans le temps : poids, volume, répétitions, 1RM estimé, durée, distance, allure ou fréquence cardiaque. L'en-tête indique si la tendance est **En progression**, **Stable** ou **En baisse**. Stable signifie que la ligne de tendance varie de moins de 5 % de la moyenne sur toute la période : une progression lente mais régulière compte donc toujours comme une progression. Pour l'allure, plus bas est mieux : une courbe descendante est une amélioration. Sur téléphone, le graphique devient un tableau des mêmes valeurs.

Utilisez `type: e1rm` pour le meilleur 1RM estimé quotidien (Epley : `poids × (1 + répétitions / 30)`). Seuls les poids positifs avec un nombre entier de répétitions de 1 à 12 comptent ; les séries d'échauffement et les drop sets sont exclus. Les jours sans série éligible sont omis. Les estimations suivent votre réglage kg/lb. Le graphique de force par défaut reste le volume.

```workout-chart
exercise: Bench Press
type: e1rm
dateRange: 180
```

L'API ajoute `estimatedOneRepMax` à `getExerciseStats` : la meilleure estimation dans l'unité de poids configurée, ou `null` lorsqu'aucune série éligible n'existe. Les champs de record personnel existants et les colonnes du CSV ne changent pas.

![Graphique du 1RM estimé au développé couché avec sa ligne de tendance en hausse sur ordinateur, et les mêmes valeurs sous forme de tableau sur téléphone](assets/charts.png)

```workout-chart
exercise: Squat
type: volume
dateRange: 90
showTrendLine: true
```

<details>
<summary>Tous les paramètres</summary>

| Paramètre       | Défaut         | Rôle                                                                      |
| --------------- | -------------- | ------------------------------------------------------------------------- |
| `exercise`      | —              | Seulement cet exercice                                                    |
| `workout`       | —              | Seulement cet entraînement                                                |
| `type`          | `volume`       | `volume`, `weight`, `reps`, `duration`, `distance`, `pace` ou `heartRate` |
| `chartType`     | `exercise`     | Comment le point de chaque jour est construit (ci-dessous)                |
| `dateRange`     | `30`           | Jours à inclure                                                           |
| `limit`         | —              | Seulement les N derniers points                                           |
| `showTrendLine` | `false`        | Trace une ligne de tendance                                               |
| `showStats`     | `true`         | Affiche la moyenne, le meilleur et le plus bas sous le graphique          |
| `title`         | `Évolution <type>` | Titre du graphique                                                    |
| `height`        | 4:3            | `300` (pixels) ou toute longueur CSS comme `50vh`                         |
| `exactMatch`    | `false`        | Correspondance exacte du nom de l'exercice                                |

| `chartType` | Séries utilisées                    | Point de chaque jour |
| ----------- | ----------------------------------- | -------------------- |
| `exercise`  | séries de `exercise`                | moyenne              |
| `workout`   | séries de `workout`                 | total                |
| `combined`  | séries de `exercise` dans `workout` | total                |
| `all`       | toutes les séries (filtres ignorés) | total                |

</details>

## Tableau de bord et carte thermique musculaire

Un bloc `workout-dashboard` s'ouvre sur quatre chiffres : nombre total d'entraînements, série de semaines, volume total et records personnels. En dessous, vous trouverez les statistiques rapides de la semaine, du mois et de l'année, une tendance du volume, vos entraînements récents, les statistiques de protocoles, la durée prévue comparée à la durée réelle, et un calendrier d'entraînement : une année de jours d'entraînement, colorés selon le volume, avec votre série actuelle et votre meilleure série. Une semaine compte pour la série dès qu'elle atteint le nombre de jours d'entraînement de votre objectif hebdomadaire (Paramètres → Objectif hebdomadaire, 1 par défaut). Sur téléphone, les actions rapides passent en premier et le résumé devient une grille 2 × 2.

<img src="assets/dashboard.png" width="720" alt="Le tableau de bord sur téléphone : résumé, calendrier d'entraînement avec l'objectif de la semaine atteint, entraînements récents et statistiques rapides">

```workout-dashboard
title: Last three months
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
```

Pour choisir les widgets et leur ordre sans écrire de YAML, insérez le tableau de bord avec la commande **Insérer un tableau de bord d'entraînement**, ou ouvrez le menu ⋮ en haut à droite d'un tableau de bord inséré et choisissez **Modifier le tableau de bord**.

Réglez **Disposition** sur **Grille** dans cette fenêtre pour placer chaque widget vous-même, comme des objets dans un inventaire : faites glisser un widget pour le déplacer, faites glisser son coin pour le rendre plus large ou plus haut, et déposez-le sous la grille pour le retirer. Le clavier fonctionne aussi : les flèches déplacent, Maj et les flèches redimensionnent, Suppr retire un widget. La grille a autant de colonnes que la largeur de votre note le permet ; dans un volet plus étroit, les widgets sont de nouveau rangés dans l'ordre de lecture, et sur téléphone ils sont empilés. Votre disposition est conservée : quand la note ne tient qu'une colonne (un téléphone), la fenêtre demande combien de colonnes éditer, en partant de celles enregistrées. Le bloc garde une ligne par widget (colonne, ligne, largeur, hauteur) :

```workout-dashboard
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.recentWorkouts: 3 2 1 1
```

La carte thermique montre les muscles travaillés sur la dernière semaine, le dernier mois ou la dernière année, de face et de dos, par **Volume**, **Séries** ou **Répétitions**. C'est le moyen le plus rapide de remarquer que vous avez sauté les jambes pendant trois semaines. En dessous, une courte analyse d'entraînement vous signale les déséquilibres, comme un avant qui travaille beaucoup plus que l'arrière. Elle lit les tags musculaires de vos [pages d'exercices](#types-dexercices). Les exercices au poids du corps et chronométrés n'ont pas de poids : ils ne s'allument que sous **Séries** et **Répétitions**.

<img src="assets/heatmap.png" width="720" alt="Carte thermique musculaire de la semaine sur téléphone, de face et de dos : quadriceps, fessiers et ischio-jambiers travaillés, avec l'analyse d'entraînement en dessous">

<details>
<summary>Tous les paramètres</summary>

| Paramètre             | Défaut  | Rôle                                                                                                                                                                                                        |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | —       | Titre au-dessus du tableau de bord                                                                                                                                                                          |
| `dateRange`           | toutes  | Seulement les séries des N derniers jours                                                                                                                                                                   |
| `widgets`             | toutes  | Les widgets à afficher, dans cet ordre : `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`, `trainingCalendar` |
| `layout`              | `list`  | `grid` place chaque widget dans ses cellules (voir ci-dessus)                                                                                                                                               |
| `columns`             | —       | Grille : les colonnes pour lesquelles la grille a été faite                                                                                                                                                 |
| `grid.<widget>`       | —       | Grille : colonne, ligne, largeur et hauteur de ce widget                                                                                                                                                    |
| `recentWorkoutsLimit` | `5`     | Entraînements dans la liste récente                                                                                                                                                                         |
| `volumeTrendDays`     | `30`    | Jours dans le graphique de tendance du volume                                                                                                                                                               |

</details>

<details>
<summary>Tags musculaires</summary>

Les tags peuvent être une liste, un seul mot (`tags: chest`) ou une ligne séparée par des virgules (`tags: chest, triceps`).

Groupes généraux : `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `traps`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `core`

Les muscles spécifiques ont leur propre zone du corps et comptent dans leur groupe. Un tag général se répartit sur toute la zone : `chest` éclaire légèrement les trois parties de la poitrine, tandis que `upper_chest` n'éclaire que la partie haute, à fond.

| Groupe      | Muscles spécifiques                         |
| ----------- | ------------------------------------------- |
| `chest`     | `upper_chest`, `mid_chest`, `lower_chest`   |
| `shoulders` | `front_delts`, `side_delts`, `rear_delts`   |
| `back`      | `lats`, `rhomboids`, `lower_back` (ou `ql`) |
| `core`      | `obliques`, `serratus`                      |

Les tags dans votre langue, comme `petto` ou `schiena`, fonctionnent aussi. Le plugin les associe aux groupes ci-dessus grâce à `muscle-tags.csv`, à côté de votre journal. Modifiez-le avec **Gérer les tags musculaires** (ajouter, renommer, rechercher, repérer les doublons) ou à la main :

```csv
tag,muscleGroup,language
petto,chest,it
dorsali,lats,it
```

Un tag qui est déjà un nom de groupe (`upper_chest`, `Upper chest`, `upper-chest`) fonctionne toujours, même si `muscle-tags.csv` ne le liste pas.

</details>

## Minuteurs

Un bloc `workout-timer` est un minuteur à compte à rebours, par intervalles ou chronomètre. Enregistrez vos temps de repos habituels comme préréglages. Liez un minuteur à un exercice ou à un entraînement : il redémarre à chaque série enregistrée, si bien que vous n'avez rien à toucher entre deux séries. Avec `autoStart: true`, il démarre dès que la note s'ouvre.

<img src="assets/timers.png" width="320" alt="Deux minuteurs sur téléphone : un minuteur par intervalles en phase de repos et un préréglage Tabata en phase de travail du tour 2">

Il émet aussi un bip sur iOS et Android. Les téléphones n'autorisent le son qu'après un appui sur la page : un minuteur lancé par `autoStart` reste donc silencieux tant que vous n'avez pas appuyé une fois sur **Démarrer**.

Sous **Paramètres → Workout Planner → Signaux du minuteur sur l'appareil**, **Garder l'écran allumé pendant qu'un minuteur tourne** est activé par défaut : l'écran reste allumé tant qu'au moins un minuteur tourne au premier plan, lorsque l'appareil le permet. **Vibrer à la fin d'un minuteur** est désactivé par défaut et ajoute une brève impulsion à zéro, indépendamment du son, sur les appareils compatibles comme Android. iOS conserve le signal sonore existant ; la vibration web n'y est pas disponible. Ces fonctions utilisent les API du navigateur au mieux de leurs possibilités et n'ont pas encore été vérifiées sur des appareils Android et iOS physiques. Elles ne fournissent pas d'alarmes en arrière-plan. Un minuteur avec un `id` continue de tourner quand vous changez de note ; mettez-le en pause ou laissez-le se terminer pour libérer le maintien de l'écran.

```workout-timer
type: countdown
duration: 90
exercise: Bench Press
```

Un minuteur par intervalles peut alterner travail et repos. L'affichage indique **Travail** ou **Repos**, et chaque phase commence avec son propre son. Chaque tour se compose de son travail suivi de son repos, le dernier compris, donc ce Tabata dure 4:00 :

```workout-timer
type: interval
work: 20
rest: 10
rounds: 8
```

`preset: Tabata` (20 s de travail, 10 s de repos, 8 tours) et `preset: EMOM` (un tour par minute pendant 10 minutes) sont intégrés. Un préréglage enregistré portant le même nom les remplace.

<details>
<summary>Tous les paramètres</summary>

| Paramètre             | Défaut      | Rôle                                                                  |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `type`                | `countdown` | `countdown`, `interval` ou `stopwatch`                                |
| `duration`            | `30`        | Secondes (compte à rebours ; pour les intervalles, le travail de chaque tour) |
| `work`                | —           | Intervalle : secondes de travail par tour (remplace `duration`)       |
| `rest`                | `0`         | Intervalle : secondes de repos après le travail de chaque tour        |
| `rounds`              | `1`         | Tours (intervalle)                                                    |
| `sound`               | `true`      | Bip quand le temps est écoulé                                         |
| `autoStart`           | `false`     | Démarre dès l'ouverture de la note                                    |
| `showControls`        | `true`      | Affiche démarrer, pause et réinitialiser                              |
| `preset`              | —           | Démarre d'un préréglage (enregistré, `Tabata` ou `EMOM`) ; les paramètres le remplacent |
| `exercise`, `workout` | —           | Redémarre le minuteur quand vous enregistrez une série de cet exercice ou de cet entraînement |
| `superset`            | `false`     | Export canvas uniquement : dessine cet exercice et le suivant comme un superset |

</details>

## Séance guidée

Un bloc `workout-session` en haut d'une note d'entraînement (commande **Insérer une séance guidée**) vous guide exercice par exercice : la série en cours, la cible, ce que vous avez fait la fois précédente, un bouton **Enregistrer la série** et le minuteur de repos, qui démarre quand vous enregistrez une série.

![Une séance guidée sur téléphone : série 3 sur 4 du squat avec le repos en cours à la fois sur la séance et sur le bloc de séries, le formulaire ouvert par Enregistrer la série, puis l'exercice suivant avec son minuteur de repos en cours](assets/session.png)

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

Le plan, c'est la note elle-même : chaque bloc `workout-log` ou `workout-sets` avec un `exercise` est une étape, dans l'ordre d'apparition, avec ses `sets`, `targetReps` et `targetWeight`. Le repos vient du `rest` du bloc `workout-sets`, sinon du bloc `workout-timer` de la même section `##` (le préréglage par défaut s'il n'y en a pas). La séance et le bloc de séries partagent un seul compte à rebours. La séance compte les séries enregistrées aujourd'hui dans cet entraînement, donc elle reprend là où vous en étiez quand vous rouvrez la note. Un exercice sans `sets` reste en cours jusqu'à ce que vous enregistriez une série d'un exercice suivant ; **Précédent** et **Suivant** se déplacent librement.

## Durée de l'entraînement

Un bloc `workout-duration` estime la durée d'une note d'entraînement : le repos de ses minuteurs, plus le temps de chaque série, à côté de la durée réelle de votre dernière séance.

<img src="assets/duration.png" width="420" alt="Carte de durée estimée avec le temps de repos, le temps des séries et la dernière séance">

```workout-duration
workout: Workouts/Push Day.md
```

`workout` peut être un chemin dans le coffre, un chemin relatif à cette note, ou simplement le nom de la note ; omettez-le pour estimer la note actuelle. Les secondes par répétition et par série viennent des [Paramètres](#paramètres).

## Types d'exercices

Une page d'exercice est une note de votre dossier d'exercices. Son frontmatter indique ce que le formulaire d'enregistrement doit demander et quels muscles l'exercice travaille. **Créer une page d'exercice** en crée une pour vous.

```yaml
---
exercise_type: strength
tags:
  - chest
  - triceps
---
```

| `exercise_type`      | Le formulaire demande                        | Aussi acceptés                                               |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `strength` (défaut)  | répétitions, poids                           | `bodyweight`, `weights`                                      |
| `timed`              | durée                                        | `duration`, `time`, `timer`, `interval`, `hold`, `isometric` |
| `distance`           | distance, durée (facultative)                | `running`, `run`                                             |
| `cardio`             | durée, distance et fréquence cardiaque (facultatives) | —                                                   |
| `custom`             | uniquement les champs listés sous `parameters` | —                                                          |

Le yoga fonctionne de la même façon : chaque posture est un exercice `timed`, donc le formulaire demande seulement combien de temps vous l'avez tenue. Les notes d'exemple incluent un flow de yoga du matin avec une séance guidée.

![Un flow de yoga sur téléphone : la séance guidée sur Chien tête en bas, le formulaire qui ne demande que la durée du maintien, et la carte de séries avec le premier maintien enregistré](assets/yoga.png)

Pour un sport qui enregistre autre chose (une cotation d'escalade, des tentatives, si vous l'avez réussie), créez votre propre type dans **Paramètres → Types d'exercices** : donnez-lui un nom et choisissez ses champs, parmi les champs intégrés comme les répétitions et le poids, ou de nouveaux champs (nombre, texte ou oui/non). Il apparaît ensuite dans la liste des types lorsque vous créez un exercice, qui écrit `exercise_type: <votre type>` dans la page. Les types intégrés ne peuvent pas être modifiés, mais **Dupliquer** en crée un à partir de l'un d'eux. Supprimer un type ne fait que l'arrêter d'être proposé : les exercices qui l'utilisent gardent leurs champs et leurs séries enregistrées.

`type:` fonctionne comme `exercise_type:`. Vous pouvez aussi ajouter des champs à un seul exercice sous `parameters`, par exemple des tours pour la corde à sauter :

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

Si vous changez le type d'un exercice après l'avoir enregistré, **Convertir un exercice** transfère les séries existantes et vous permet de choisir dans quel nouveau champ va chaque ancien champ.

## Vos données

Chaque série est une ligne de `workout_logs.csv`, que vous pouvez donc ouvrir dans un tableur, sauvegarder ou synchroniser comme n'importe quel autre fichier.

```csv
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2025-01-17T10:30:00.000Z,Bench Press,8,100,800,[[Push Day]],Push Day,1737138600000,,standard
```

<details>
<summary>Colonnes et édition manuelle</summary>

| Colonne                    | Signification                        |
| -------------------------- | ------------------------------------ |
| `date`                     | Moment où la série a été enregistrée (ISO 8601) |
| `exercise`, `workout`      | Nom de l'exercice et de l'entraînement |
| `reps`, `weight`, `volume` | Le volume est répétitions × poids    |
| `origine`                  | Lien vers la note depuis laquelle elle a été enregistrée |
| `timestamp`                | Identifiant unique de la ligne (millisecondes) |
| `notes`, `protocol`        | Texte libre et technique d'entraînement |

Les types d'exercices qui ont leurs propres champs (`duration`, `distance`, `heartRate`, ou vos `parameters`) ajoutent des colonnes à la fin. La dernière colonne, `weightUnit`, vaut `kg` ou `lb` : c'est l'unité du `weight` et du `volume` de cette ligne. Une valeur vide signifie l'unité des paramètres.

Si vous modifiez le fichier à la main, conservez la ligne d'en-tête, et entourez de guillemets doubles toute valeur contenant une virgule, un guillemet ou un saut de ligne. Les notes qui commencent par `=`, `+`, `-` ou `@` sont enregistrées avec une `'` au début pour que les tableurs ne les exécutent pas comme des formules ; le plugin la masque à nouveau.

</details>

Tout reste dans votre coffre. Le plugin n'écrit dans le presse-papiers que lorsque vous cliquez sur un badge de copie (un tag musculaire du tableau de bord), et ne le lit jamais.

### Dataview et Templater

Le plugin expose `WorkoutPlannerAPI` (aussi `window.WorkoutPlannerAPI`) une fois chargé.

```dataviewjs
const s = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
dv.paragraph(`Best: ${s.prWeight} × ${s.prReps} on ${s.prDate}`);
```

<details>
<summary>Référence de l'API et autres exemples</summary>

| Méthode                      | Renvoie                                                                                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getWorkoutLogs(filter?)`    | Séries, chacune avec `date`, `exercise`, `reps`, `weight`, `volume`, `workout`, `notes`, `timestamp`, `protocol`. `weight` et `volume` sont dans l'unité des paramètres ; `enteredWeight` et `enteredUnit` sont ce qui a été saisi                    |
| `getExerciseStats(exercise)` | `estimatedOneRepMax`, `totalVolume`, `maxWeight`, `prWeight`, `prReps`, `prDate`, `totalSets`, `averageWeight`, `averageReps`, `lastWorkoutDate`, `trend`                                                                                             |
| `getExercises(filter?)`      | Noms d'exercices, triés : les noms de fichiers de vos pages d'exercices (sous-dossiers inclus), ou les noms de votre journal si vous n'avez aucune page d'exercice. `{ tag: "chest" }` garde les exercices dont la page porte ce tag, donc la liste est vide sans pages d'exercices. |

`getWorkoutLogs` accepte `exercise` (partiel, insensible à la casse), `workout`, `dateRange: { start, end }`, `protocol` et `exactMatch`.

Squats récents, avec Dataview :

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

Dans un modèle [Templater](https://github.com/SilentVoid13/Templater), pour démarrer une note avec vos derniers chiffres :

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

## Paramètres

Définissez les dossiers du CSV et des exercices, l'unité de poids par défaut, le pas de poids des boutons **+/−**, les préréglages de minuteur, vos propres protocoles (nom, libellé court et couleur), et les secondes par répétition et par série utilisées par l'estimation de durée. **Tout exécuter**, sous Options avancées, lance toutes les tâches de maintenance après une mise à jour.

Changer l'unité de poids ne modifie pas les anciennes séries : chacune conserve l'unité dans laquelle elle a été enregistrée.

<details>
<summary>Toutes les commandes</summary>

Ouvrez la palette de commandes (`Ctrl/Cmd + P`) et tapez le nom.

| Commande                                                    | Ce qu'elle fait                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Créer un journal d'entraînement                             | Enregistrer une série                                              |
| Commencer la visite                                         | Suivre la visite guidée                                            |
| Créer des notes d'exemple                                   | Ajouter des exercices, entraînements, journaux et un tableau de bord d'exemple |
| Ouvrir le guide de démarrage                                | Ouvrir le guide dans les exemples                                  |
| Insérer un graphique / un tableau / un minuteur / un tableau de bord / une durée d'entraînement | Insérer un bloc via un formulaire                |
| Créer une page d'exercice                                   | Nouvelle page d'exercice avec son type et ses tags                 |
| Créer une section d'exercice                                | Ajouter un titre, un minuteur et un tableau pour un exercice dans la note actuelle |
| Ajouter un bloc d'exercice                                  | Insérer un bloc d'exercice, avec autocomplétion du nom             |
| Convertir un exercice                                       | Déplacer les séries d'un exercice vers un autre type d'exercice    |
| Gérer les tags musculaires                                  | Modifier `muscle-tags.csv`                                         |
| Générer la référence des tags                               | Créer une note listant chaque tag musculaire                       |
| Vérifier les noms d'exercices                               | Repérer le même exercice enregistré sous différentes orthographes  |
| Exporter l'entraînement vers un canvas                      | Disposer l'entraînement actuel sur un canvas Obsidian              |
| Créer un fichier de journal CSV                             | Créer un journal vide                                              |
| Importer depuis Strong ou Hevy                              | Ajouter les séries d'un export CSV de Strong ou Hevy au journal    |
| Migrer les types d'exercices, Ajouter les ID manquants aux blocs de code | Maintenance après une mise à jour depuis d'anciennes versions |

</details>

## Dépannage

- **Conflit avec Workout Block (`workout-block`).** Les deux plugins enregistrent des blocs de code `workout-log` et utilisent `workout_logs.csv` comme nom de fichier de journal par défaut. Désactivez l'un des deux plugins avant d'utiliser l'autre.

- **Un tableau ou un graphique est vide.** Vérifiez le nom de l'exercice et le `dateRange` (les graphiques affichent par défaut les 30 derniers jours). Avec `exactMatch: true`, le nom doit correspondre exactement.
- **Un exercice manque dans la carte thermique.** Sa page doit avoir des `tags` musculaires et se trouver dans le dossier des exercices. Les exercices au poids du corps et chronométrés n'apparaissent que sous **Séries** ou **Répétitions**.
- **Le formulaire demande répétitions et poids pour une planche.** Mettez `exercise_type: timed` dans la page de l'exercice.
- **Le minuteur ne fait aucun son sur mon téléphone.** Appuyez une fois sur **Démarrer** ; les téléphones bloquent le son tant que vous n'avez pas touché la page.

## Installation

### Depuis les plugins de la communauté

1. Ouvrez **Paramètres → Plugins de la communauté**
2. Recherchez **Workout Planner**
3. Sélectionnez **Installer**, puis **Activer**

### Manuelle

1. Téléchargez `main.js`, `manifest.json` et `styles.css` depuis la [dernière version](https://github.com/SpatariuRares/obsidian-workout-plugin/releases/latest)
2. Créez le dossier `votre-coffre/.obsidian/plugins/workout-planner/`
3. Copiez les fichiers téléchargés dans ce dossier
4. Activez le plugin dans **Paramètres → Plugins de la communauté**

## Soutien

Workout Planner est gratuit et open source. S'il vous aide dans votre entraînement, vous pouvez [m'offrir un café](https://buymeacoffee.com/spatariurares). Vous avez trouvé un bug ou il manque quelque chose ? Ouvrez un [ticket](https://github.com/SpatariuRares/obsidian-workout-plugin/issues).

Toutes les langues sauf l'anglais sont traduites automatiquement, donc certaines formulations peuvent sonner bizarrement. Si la vôtre vous semble étrange, les corrections sont les bienvenues.

## Crédits

Les graphiques utilisent [Chart.js](https://github.com/chartjs/Chart.js) (MIT). Workout Planner est publié sous la [licence MIT](LICENSE).
