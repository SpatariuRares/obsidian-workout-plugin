import { withoutUndefined } from "@app/utils/ObjectUtils";

describe("withoutUndefined", () => {
  it("drops keys whose value is undefined and keeps every other value", () => {
    expect(
      withoutUndefined({ a: 1, b: undefined, c: null, d: 0, e: "", f: false }),
    ).toEqual({ a: 1, c: null, d: 0, e: "", f: false });
    expect(Object.keys(withoutUndefined({ a: undefined }))).toEqual([]);
  });
});
