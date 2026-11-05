import { t } from "@app/i18n";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import {
  ExerciseTypeCatalog,
  builtInFields,
  exerciseTypeIdFromName,
  exerciseTypeProblem,
  exercisesOfType,
  fieldKeyFromLabel,
  retireExerciseType,
  upsertExerciseType,
} from "@app/services/exercise/ExerciseTypeCatalog";

const climbing = (extra: Partial<CustomExerciseType> = {}): CustomExerciseType => ({
  id: "climbing",
  name: "Climbing",
  parameters: [
    { key: "grade", label: "Grade", type: "string", required: true },
    { key: "attempts", label: "Attempts", type: "number", required: false },
  ],
  ...extra,
});

describe("ExerciseTypeCatalog", () => {
  it("resolves built-in types, their aliases and any spelling", () => {
    const catalog = new ExerciseTypeCatalog();
    expect(catalog.resolve("Strength")?.id).toBe("strength");
    expect(catalog.resolve("run")?.id).toBe("distance");
    expect(catalog.resolve("strength")?.builtIn).toBe(true);
    expect(catalog.resolve("")).toBeUndefined();
    expect(catalog.resolve("climbing")).toBeUndefined();
  });

  it("resolves the user's types by id or by name", () => {
    const catalog = new ExerciseTypeCatalog([climbing({ id: "rock_climbing", name: "Rock climbing" })]);
    expect(catalog.resolve("rock_climbing")?.parameters.map((p) => p.key)).toEqual(["grade", "attempts"]);
    expect(catalog.resolve("Rock  Climbing")?.id).toBe("rock_climbing");
    expect(catalog.resolve("rock_climbing")?.builtIn).toBe(false);
  });

  it("keeps resolving a deleted type, but no longer offers it", () => {
    const catalog = new ExerciseTypeCatalog([climbing({ retired: true })]);
    expect(catalog.resolve("climbing")?.retired).toBe(true);
    expect(catalog.mine()).toEqual([]);
    expect(catalog.pickable().map((type) => type.id)).toEqual(["strength", "timed", "distance", "cardio"]);
  });

  it("offers the built-in types without Custom, then the user's", () => {
    const ids = new ExerciseTypeCatalog([climbing()]).pickable().map((type) => type.id);
    expect(ids).toEqual(["strength", "timed", "distance", "cardio", "climbing"]);
  });
});

describe("builtInFields", () => {
  it("lists each field of the built-in types once", () => {
    expect(builtInFields().map((f) => f.key)).toEqual(["reps", "weight", "duration", "distance", "heartRate"]);
  });
});

describe("fieldKeyFromLabel", () => {
  it("makes a plain key from the label", () => {
    expect(fieldKeyFromLabel("Max grade", [])).toBe("max_grade");
    expect(fieldKeyFromLabel("Difficoltà", [])).toBe("difficolta");
  });

  it("never gives a key in use, reserved or of a built-in field", () => {
    expect(fieldKeyFromLabel("Grade", ["grade"])).toBe("grade_2");
    expect(fieldKeyFromLabel("Date", [])).toBe("date_2");
    expect(fieldKeyFromLabel("Reps", [])).toBe("reps_2");
  });

  it("always starts with a letter", () => {
    expect(fieldKeyFromLabel("4x4", [])).toBe("field_4x4");
    expect(fieldKeyFromLabel("", [])).toBe("field");
  });
});

describe("exerciseTypeIdFromName", () => {
  it("makes a plain id", () => {
    expect(exerciseTypeIdFromName("Rock climbing")).toBe("rock_climbing");
  });
});

describe("exerciseTypeProblem", () => {
  it("accepts a named type with named fields", () => {
    expect(exerciseTypeProblem(climbing(), [], null)).toBeNull();
  });

  it("needs a name, a field and a name for every field", () => {
    expect(exerciseTypeProblem(climbing({ name: " " }), [], null)).toBe(t("settings.exerciseTypes.nameRequired"));
    expect(exerciseTypeProblem(climbing({ parameters: [] }), [], null)).toBe(
      t("settings.exerciseTypes.fieldsRequired"),
    );
    const unnamed = climbing({ parameters: [{ key: "field", label: "", type: "number", required: false }] });
    expect(exerciseTypeProblem(unnamed, [], null)).toBe(t("settings.exerciseTypes.fieldLabelRequired"));
  });

  it("refuses two fields with one name", () => {
    const twice = climbing({
      parameters: [
        { key: "grade", label: "Grade", type: "string", required: false },
        { key: "grade_2", label: "grade", type: "string", required: false },
      ],
    });
    expect(exerciseTypeProblem(twice, [], null)).toBe(
      t("settings.exerciseTypes.fieldLabelExists", { field: "grade" }),
    );
  });

  it("refuses the name of another type, a built-in one or an alias", () => {
    const exists = t("settings.exerciseTypes.nameExists");
    expect(exerciseTypeProblem(climbing(), [climbing()], null)).toBe(exists);
    expect(exerciseTypeProblem(climbing({ id: "strength", name: "Strength" }), [], null)).toBe(exists);
    expect(exerciseTypeProblem(climbing({ id: "run", name: "Run" }), [], null)).toBe(exists);
  });

  it("lets a type keep its own name, and a deleted type's name be used again", () => {
    expect(exerciseTypeProblem(climbing(), [climbing()], "climbing")).toBeNull();
    expect(exerciseTypeProblem(climbing(), [climbing({ retired: true })], null)).toBeNull();
  });
});

describe("upsertExerciseType and retireExerciseType", () => {
  it("adds a new type, replaces an edited one", () => {
    const list: CustomExerciseType[] = [];
    upsertExerciseType(list, climbing(), null);
    upsertExerciseType(list, climbing({ name: " Bouldering " }), "climbing");
    expect(list).toEqual([{ ...climbing(), name: "Bouldering" }]);
  });

  it("keeps a deleted type for its pages and brings it back when made again", () => {
    const list = [climbing()];
    retireExerciseType(list, "climbing");
    expect(list[0].retired).toBe(true);
    upsertExerciseType(list, climbing(), null);
    expect(list).toHaveLength(1);
    expect(list[0].retired).toBeUndefined();
  });
});

describe("exercisesOfType", () => {
  it("names the pages whose type is it, however they write it", () => {
    const pages = [
      { names: ["Lead"], type: "climbing" },
      { names: ["boulder", "Bouldering"], type: "Climbing" },
      { names: ["Bench Press"], type: "strength" },
      { names: ["Plank"] },
    ];
    expect(exercisesOfType(pages, [climbing()], "climbing")).toEqual(["Lead", "Bouldering"]);
  });
});
