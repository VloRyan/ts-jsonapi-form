import { describe, expect, it } from "vitest";
import { getValue, removeField, splitPath } from "./Value.ts";

describe("getValue", () => {
  it("first level", () => {
    const obj = { field: "test" };
    const actual = getValue(obj, "field");
    expect(actual).toBe("test");
  });
  it("nested", () => {
    const obj = { field: "?", nested: { field: "test" } };
    const actual = getValue(obj, "nested.field");
    expect(actual).toBe("test");
  });
  it("indexed nested", () => {
    const obj = {
      name: "test",
      nested: [{ field: "1" }, { field: "2" }, { field: "3" }],
    };
    const actual = getValue(obj, "nested[1].field");
    expect(actual).toBe("2");
  });
  it("map", () => {
    const obj = {
      values: new Map<string, string>([["key1", "value1"]]),
    };
    const actual = getValue(obj, "values[key1]");
    expect(actual).toBe("value1");
  });
  it("string key", () => {
    const obj = {
      values: new Map<string, string>([["string.key", "value1"]]),
    };
    const actual = getValue(obj, `values."string.key"`);
    expect(actual).toBe("value1");
  });
});

describe("removeField", () => {
  it("first level", () => {
    const obj = { field: "test" };
    removeField(obj, "field");
    expect(obj).toStrictEqual({});
  });
  it("nested", () => {
    const obj = { field: "?", nested: { field: "test" } };
    removeField(obj, "nested.field");
    expect(obj).toStrictEqual({ field: "?", nested: {} });
  });
  it("indexed nested", () => {
    const obj = {
      name: "test",
      nested: [{ field: "1" }, { field: "2" }, { field: "3" }],
    };
    removeField(obj, "nested[1]");
    expect(obj).toStrictEqual({
      name: "test",
      nested: [{ field: "1" }, { field: "3" }],
    });
  });
});

describe("splitPath", () => {
  it("one", (context) => {
    const expected = ["one"];
    const actual = splitPath(context.task.name);
    expect(actual).toStrictEqual(expected);
  });
  it("one.two", (context) => {
    const expected = ["one", "two"];
    const actual = splitPath(context.task.name);
    expect(actual).toStrictEqual(expected);
  });
  it('one."two.three"', (context) => {
    const expected = ["one", "two.three"];
    const actual = splitPath(context.task.name);
    expect(actual).toStrictEqual(expected);
  });
});
