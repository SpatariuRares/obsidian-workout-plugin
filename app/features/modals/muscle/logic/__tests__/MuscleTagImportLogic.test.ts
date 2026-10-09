import { MuscleTagImportLogic } from "@app/features/modals/muscle/logic/MuscleTagImportLogic";
import { t } from "@app/i18n";

const parse = (content: string) =>
  MuscleTagImportLogic.parseImportFileContent(content);

describe("MuscleTagImportLogic.parseImportFileContent", () => {
  describe("format detection", () => {
    it("should be invalid when the content is empty", () => {
      const result = parse("");
      expect(result.isValidFormat).toBe(false);
      expect(result.validTags.size).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it("should be invalid when the content is only blank lines", () => {
      expect(parse("\n\n\r\n").isValidFormat).toBe(false);
    });

    it("should be invalid when the tag column is missing", () => {
      const result = parse("name,muscleGroup\nbench,chest");
      expect(result.isValidFormat).toBe(false);
      expect(result.validTags.size).toBe(0);
    });

    it("should be invalid when the muscle group column is missing", () => {
      expect(parse("tag,other\npetto,chest").isValidFormat).toBe(
        false,
      );
    });

    it("should be invalid when header substrings match but no column is exactly tag/group", () => {
      const result = parse("tags,groups\npetto,chest");
      expect(result.isValidFormat).toBe(false);
      expect(result.validTags.size).toBe(0);
    });

    it.each(["muscleGroup", "muscle_group", "group", "MuscleGroup", "GROUP"])(
      "should accept the %s header",
      (header) => {
        const result = parse(`tag,${header}\npetto,chest`);
        expect(result.isValidFormat).toBe(true);
        expect(result.validTags.get("petto")).toBe("chest");
      },
    );

    it("should accept the columns in any order and with extra columns", () => {
      const result = parse(
        "extra,group,tag\nfoo,back,dorso\nbar,chest,petto",
      );
      expect(result.isValidFormat).toBe(true);
      expect(Object.fromEntries(result.validTags)).toEqual({
        dorso: "back",
        petto: "chest",
      });
    });

    it("should trim whitespace around header names", () => {
      const result = parse(" tag , group \npetto,chest");
      expect(result.isValidFormat).toBe(true);
      expect(result.validTags.get("petto")).toBe("chest");
    });

    it("should accept a header-only file as a valid empty import", () => {
      const result = parse("tag,muscleGroup");
      expect(result.isValidFormat).toBe(true);
      expect(result.validTags.size).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });

  describe("row parsing", () => {
    it("should parse CRLF line endings", () => {
      const result = parse(
        "tag,muscleGroup\r\npetto,chest\r\ndorso,back\r\n",
      );
      expect(result.isValidFormat).toBe(true);
      expect(result.validTags.size).toBe(2);
      expect(result.validTags.get("dorso")).toBe("back");
    });

    it("should handle quoted values containing commas", () => {
      const result = parse(
        'tag,muscleGroup\n"press, panca",chest\n"a ""b"" c",back',
      );
      expect(result.validTags.get("press, panca")).toBe("chest");
      expect(result.validTags.get('a "b" c')).toBe("back");
    });

    it("should normalize tags and groups to lowercase with collapsed whitespace", () => {
      const result = parse("tag,muscleGroup\n  Petto   Alto ,  CHEST  ");
      expect(result.validTags.get("petto alto")).toBe("chest");
    });

    it("should skip rows with too few columns", () => {
      const result = parse("tag,muscleGroup\nonlytag\npetto,chest");
      expect(result.validTags.size).toBe(1);
      expect(result.errors).toEqual([]);
    });

    it("should skip rows with an empty tag or empty group", () => {
      const result = parse(
        "tag,muscleGroup\n,chest\npetto,\n   ,  \ndorso,back",
      );
      expect([...result.validTags.keys()]).toEqual(["dorso"]);
      expect(result.errors).toEqual([]);
    });

    it("should let a later duplicate tag override an earlier one", () => {
      const result = parse(
        "tag,muscleGroup\npetto,chest\npetto,back",
      );
      expect(result.validTags.size).toBe(1);
      expect(result.validTags.get("petto")).toBe("back");
    });

    it("should skip blank lines between rows", () => {
      const result = parse("tag,muscleGroup\n\npetto,chest\n\n");
      expect(result.validTags.size).toBe(1);
    });
  });

  describe("unknown muscle groups", () => {
    it("should report an error and exclude the tag when the group is not canonical", () => {
      const result = parse(
        "tag,muscleGroup\npetto,chest\nfoo,notamuscle",
      );
      expect(result.isValidFormat).toBe(true);
      expect(result.validTags.has("foo")).toBe(false);
      expect(result.validTags.get("petto")).toBe("chest");
      expect(result.errors).toEqual([
        t("modal.notices.muscleTagImportInvalidGroup", {
          tag: "foo",
          group: "notamuscle",
        }),
      ]);
    });

    it("should report one error per invalid row", () => {
      const result = parse("tag,muscleGroup\na,x\nb,y\nc,chest");
      expect(result.errors).toHaveLength(2);
      expect(result.validTags.size).toBe(1);
    });

    it("should report the normalized tag and group in the error", () => {
      const result = parse("tag,muscleGroup\n  FOO  ,  Bar  ");
      expect(result.errors).toEqual([
        t("modal.notices.muscleTagImportInvalidGroup", {
          tag: "foo",
          group: "bar",
        }),
      ]);
    });
  });
});
