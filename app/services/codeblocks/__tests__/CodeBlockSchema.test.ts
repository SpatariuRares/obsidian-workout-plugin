import { changedParams } from "@app/services/codeblocks/CodeBlockSchema";
import { tableBlock } from "@app/features/tables/tableBlock";
import { t } from "@app/i18n";

function body(...lines: string[]): string {
  return lines.join("\n");
}

describe("CodeBlockSchema (workout-log schema)", () => {
  describe("parse", () => {
    it("reads each parameter as its declared type", () => {
      const { params, errors } = tableBlock.parse(
        body(
          "exercise: 21",
          "limit: 10",
          "exactMatch: true",
          "sortBy: volume",
          'columns: [date, "reps", weight]',
          "targetWeight: 82.5",
        ),
      );

      expect(errors).toEqual([]);
      expect(params).toEqual({
        exercise: "21",
        limit: 10,
        exactMatch: true,
        sortBy: "volume",
        columns: ["date", "reps", "weight"],
        targetWeight: 82.5,
      });
    });

    it("returns only what the block says, not the defaults", () => {
      expect(tableBlock.parse("exercise: Squat").params).toEqual({
        exercise: "Squat",
      });
      expect(tableBlock.defaults).toMatchObject({
        limit: 50,
        sortBy: "date",
        sortOrder: "desc",
        showAddButton: true,
      });
    });

    it("skips comments, blank lines, unknown keys and lines without a key", () => {
      const { params, errors } = tableBlock.parse(
        body("# my table", "", "exercise: Bench: close grip", "colour: red", "just text"),
      );

      expect(params).toEqual({ exercise: "Bench: close grip" });
      expect(errors).toEqual([]);
    });

    it("strips one pair of quotes and keeps the last value of a repeated key", () => {
      expect(
        tableBlock.parse(body("exercise: 'Squat'", 'exercise: "Front squat"'))
          .params.exercise,
      ).toBe("Front squat");
    });

    it("accepts a list without brackets", () => {
      expect(tableBlock.parse("columns: date, reps").params.columns).toEqual([
        "date",
        "reps",
      ]);
    });

    it("reports values that don't fit and leaves them out", () => {
      const { params, errors } = tableBlock.parse(
        body(
          "limit: lots",
          "dateRange: -1",
          "exactMatch: yes",
          "sortOrder: up",
          "limit: 5000",
          "exercise: Squat",
        ),
      );

      expect(params).toEqual({ exercise: "Squat" });
      expect(errors).toEqual([
        t("codeBlocks.validation.notANumber", { key: "limit", value: "lots" }),
        t("codeBlocks.validation.tooSmall", { key: "dateRange", min: "0", value: "-1" }),
        t("codeBlocks.validation.notABoolean", { key: "exactMatch", value: "yes" }),
        t("codeBlocks.validation.notOneOf", {
          key: "sortOrder",
          value: "up",
          allowed: "asc, desc",
        }),
        t("codeBlocks.validation.outOfRange", {
          key: "limit",
          min: "1",
          max: "1000",
          value: "5000",
        }),
      ]);
    });
  });

  describe("serialize", () => {
    it("writes a fenced block in schema order, skipping unset parameters", () => {
      expect(
        tableBlock.serialize({
          limit: 12,
          exercise: "Squat",
          id: "abc",
          columns: ["date", "reps"],
          dateRange: undefined,
        }),
      ).toBe(
        body(
          "```workout-log",
          "id: abc",
          "exercise: Squat",
          "limit: 12",
          "columns: [date, reps]",
          "```",
        ),
      );
    });

    it("reads back what it wrote", () => {
      const params = {
        id: "abc",
        exercise: "Squat",
        limit: 12,
        showAddButton: false,
        columns: ["date", "reps"],
      };
      const block = tableBlock.serialize(params).split("\n").slice(1, -1);

      expect(tableBlock.parse(block.join("\n")).params).toEqual(params);
    });
  });

  describe("patch", () => {
    const source = body(
      "id: abc",
      "# keep this comment",
      "exercise: Squat",
      "  limit: 12",
      "sortBy: volume",
      "columns: [date, reps]",
      "showProtocol: false",
      "",
    );

    it("rewrites only the changed lines and keeps everything else as typed", () => {
      expect(
        tableBlock.patch(source, { limit: 20, exercise: "Front squat" }),
      ).toBe(
        body(
          "id: abc",
          "# keep this comment",
          "exercise: Front squat",
          "  limit: 20",
          "sortBy: volume",
          "columns: [date, reps]",
          "showProtocol: false",
          "",
        ),
      );
    });

    it("appends new keys and removes keys set to undefined", () => {
      expect(
        tableBlock.patch(source, { targetWeight: 100, sortBy: undefined }),
      ).toBe(
        body(
          "id: abc",
          "# keep this comment",
          "exercise: Squat",
          "  limit: 12",
          "columns: [date, reps]",
          "showProtocol: false",
          "targetWeight: 100",
          "",
        ),
      );
    });

    it("fills an empty body", () => {
      expect(tableBlock.patch("", { limit: 5 })).toBe("limit: 5");
    });

    it("collapses a repeated key into one line", () => {
      expect(
        tableBlock.patch(body("limit: 5", "exercise: Squat", "limit: 8"), {
          limit: 10,
        }),
      ).toBe(body("exercise: Squat", "limit: 10"));
    });

    it("ignores keys the schema doesn't know", () => {
      const changes = { colour: "red" } as unknown as Parameters<
        typeof tableBlock.patch
      >[1];
      expect(tableBlock.patch("exercise: Squat", changes)).toBe(
        "exercise: Squat",
      );
    });
  });

  describe("changedParams", () => {
    it("returns the parameters that differ, unset ones as undefined", () => {
      expect(
        changedParams(
          { limit: 12, exercise: "Squat", columns: ["date"], dateRange: 7 },
          { limit: 12, exercise: "Bench", columns: ["date"], dateRange: undefined },
        ),
      ).toEqual({ exercise: "Bench", dateRange: undefined });
    });
  });
});
