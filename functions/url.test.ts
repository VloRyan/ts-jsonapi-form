import { describe, expect, it } from "vitest";
import { joinPath, toQueryString } from "./";
import { ResourceObject, ObjectLike } from "../jsonapi/model";

describe("joinPath", () => {
  it("should leave trailing slash if present", () => {
    const baseWithout = "path";
    const baseWith = "/path";

    expect(joinPath(baseWithout)).toBe("path");
    expect(joinPath(baseWith)).toBe("/path");
  });
  it("should add slashes to elements if not present", () => {
    const base = "/path";
    const elements = ["elem1", "/elem2"];

    expect(joinPath(base, ...elements)).toBe("/path/elem1/elem2");
  });
  it("should remove trailing slashes", () => {
    const base = "/path/";
    const elements = ["elem1/", "elem2/"];

    expect(joinPath(base, ...elements)).toBe("/path/elem1/elem2");
  });
  it("should leave protocol", () => {
    const base = "http://path/";
    const elements = ["elem1/", "elem2/"];

    expect(joinPath(base, ...elements)).toBe("http://path/elem1/elem2");
  });
});

describe("toQueryString", () => {
  it("primitive", () => {
    const obj = { name: "Peters" } satisfies ObjectLike;

    expect(toQueryString(obj as unknown as ObjectLike, "family")).toBe(
      "family[name]=Peters",
    );
  });

  it("plan object", () => {
    const obj = {
      name: "John Doe",
      age: 20,
      living: false,
      omit: null,
      omit2: undefined as unknown as ObjectLike,
      kids: true,
    } satisfies ObjectLike;

    expect(toQueryString(obj as unknown as ObjectLike)).toBe(
      "filter[name]=John%20Doe&filter[age]=20&filter[living]=false&filter[kids]=true",
    );
  });

  it("with ResourceObject", () => {
    const obj = {
      obj: {
        id: "1",
        type: "object",
        lid: undefined,
      } satisfies ResourceObject,
    } satisfies ObjectLike;

    expect(toQueryString(obj as unknown as ObjectLike)).toBe("filter[obj]=1");
  });

  it("with nested obj", () => {
    const obj = {
      nested: { name: "Peter" },
    } satisfies ObjectLike;

    expect(toQueryString(obj as unknown as ObjectLike)).toBe(
      "filter[nested.name]=Peter",
    );
  });

  it("with array", () => {
    const obj = {
      arr: ["one", "two", "three"],
    } satisfies ObjectLike;

    expect(toQueryString(obj as unknown as ObjectLike)).toBe(
      "filter[arr]=one,two,three",
    );
  });
});
