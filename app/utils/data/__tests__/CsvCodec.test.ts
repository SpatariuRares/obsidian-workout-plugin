import {
  parseCsv,
  stringifyCsvRow,
  stringifyCsvValue,
  protectFormula,
  unprotectFormula,
} from "@app/utils/data/CsvCodec";

describe("CsvCodec.parseCsv", () => {
  it("splits plain rows and fields", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("keeps commas and escaped quotes inside quoted fields", () => {
    expect(parseCsv('x,"a, ""b"" c",y')).toEqual([
      ["x", 'a, "b" c', "y"],
    ]);
  });

  it("keeps newlines inside quoted fields in a single row", () => {
    expect(parseCsv('id,notes\n1,"line one\nline two"\n2,ok')).toEqual([
      ["id", "notes"],
      ["1", "line one\nline two"],
      ["2", "ok"],
    ]);
  });

  it("handles CRLF line endings without leaking \\r into values", () => {
    expect(parseCsv('a,b\r\n1,"x\r\ny"\r\n2,3\r\n')).toEqual([
      ["a", "b"],
      ["1", "x\r\ny"],
      ["2", "3"],
    ]);
  });

  it("skips blank lines but keeps rows of empty fields", () => {
    expect(parseCsv("a,b\n\n  \n,\n1,2\n")).toEqual([
      ["a", "b"],
      ["", ""],
      ["1", "2"],
    ]);
  });

  it("keeps empty and trailing empty fields", () => {
    expect(parseCsv("val1,,val3,")).toEqual([["val1", "", "val3", ""]]);
  });

  it("returns no rows for empty content", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("CsvCodec.stringify", () => {
  it("quotes only values that need it", () => {
    expect(stringifyCsvValue("plain")).toBe("plain");
    expect(stringifyCsvValue("a,b")).toBe('"a,b"');
    expect(stringifyCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(stringifyCsvValue("two\nlines")).toBe('"two\nlines"');
    expect(stringifyCsvValue("cr\rhere")).toBe('"cr\rhere"');
  });

  it("round-trips any row through parseCsv", () => {
    const row = ["a,b", 'q"q', "multi\nline", "", "plain"];
    expect(parseCsv(stringifyCsvRow(row))).toEqual([row]);
  });
});

describe("CsvCodec formula protection", () => {
  it.each(["=SUM(A1)", "+1", "-5 felt heavy", "@cmd"])(
    "prefixes %s and restores it on read",
    (value) => {
      const stored = protectFormula(value);
      expect(stored).toBe(`'${value}`);
      expect(unprotectFormula(stored)).toBe(value);
    },
  );

  it("leaves safe values and ordinary apostrophes alone", () => {
    expect(protectFormula("Bench")).toBe("Bench");
    expect(unprotectFormula("'tis fine")).toBe("'tis fine");
  });
});
