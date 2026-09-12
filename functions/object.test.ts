import { describe, expect, it } from "vitest";
import { getValue, setValue, splitPath } from "@functions/object";

describe("getValue", () => {
  it("should return value on first level", () => {
    const obj = { field: "test" };
    const actual = getValue(obj, "field");
    expect(actual).toBe("test");
  });
  it("should return nested value", () => {
    const obj = { field: "?", nested: { field: "test" } };
    const actual = getValue(obj, "nested.field");
    expect(actual).toBe("test");
  });
  it("should return nested indexed value", () => {
    const obj = {
      name: "test",
      nested: [{ field: "1" }, { field: "2" }, { field: "3" }],
    };
    const actual = getValue(obj, "nested[1].field");
    expect(actual).toBe("2");
  });
  it("should return map element value", () => {
    const obj = {
      values: new Map<string, string>([["key1", "value1"]]),
    };
    const actual = getValue(obj, "values[key1]");
    expect(actual).toBe("value1");
  });
  it("should return map(string key) element value", () => {
    const obj = {
      values: new Map<string, string>([["string.key", "value1"]]),
    };
    const actual = getValue(obj, `values[string.key]`);
    expect(actual).toBe("value1");
  });
});

describe("setValue", () => {
  it("should add new field", () => {
    const obj = {};
    setValue(obj, "field", true);
    // @ts-expect-error too dynamic for the ide
    expect(obj.field).toBeTruthy();
  });
  it("should add new nested field", () => {
    const obj = {};
    setValue(obj, "nested.field", true);
    // @ts-expect-error too dynamic for the ide
    expect(obj.nested.field).toBeTruthy();
  });
  it("should throw error on adding new nested array field", () => {
    const obj = {};

    expect(() => setValue(obj, "nested[1].field", true)).toThrow(
      Error("cannot create new array field"),
    );
  });
  it("should change field value", () => {
    const obj = { field: false };
    setValue(obj, "field", true);
    expect(obj.field).toBeTruthy();
  });
  it("should change array value", () => {
    const obj = { arr: [false, false] };
    setValue(obj, "arr[1]", true);
    expect(obj).toEqual({ arr: [false, true] });
  });
  it("should change nested array value", () => {
    const obj = { nested: [{ field: false }, { field: false }] };
    setValue(obj, "nested[1].field", true);
    expect(obj).toEqual({ nested: [{ field: false }, { field: true }] });
  });
  it("should change map value", () => {
    const obj = {
      values: new Map<string, boolean>([["key1", false]]),
    };
    setValue(obj, "values[key1]", true);
    expect(obj.values.get("key1")).toBeTruthy();
  });
  it("should change map(string key) value", () => {
    const obj = {
      values: new Map<string, boolean>([["string.key", false]]),
    };
    setValue(obj, `values[string.key]`, true);
    expect(obj.values.get("string.key")).toBeTruthy();
  });
  it("should throw error on change array element on non-array", () => {
    const obj = { notAnArray: "Hello!" };
    expect(() => setValue(obj, "notAnArray[1]", true)).toThrow(
      "unknown element container",
    );
  });
});

describe("splitPath", () => {
  it("should split path with single level", () => {
    const actual = splitPath("base");
    expect(actual).toEqual([{ name: "base" }]);
  });
  it("should split path with multiple levels", () => {
    const actual = splitPath("base.nested");
    expect(actual).toEqual([{ name: "base" }, { name: "nested" }]);
  });
  it("should split path with identifier", () => {
    const actual = splitPath("base[nested.id]");
    expect(actual).toEqual([{ name: "base", identifier: "nested.id" }]);
  });
});
