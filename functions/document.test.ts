import { describe, expect, it } from "vitest";
import type {
  Included,
  ResourceIdentifierObject,
  ResourceObject,
} from "@jsonapi/model";
import { findInclude } from "@functions/document";

describe("findInclude", () => {
  it("should return include by id and type", async () => {
    const id = {
      id: "4711",
      lid: undefined,
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = {
      id: "4711",
      lid: undefined,
      type: "testType",
    };
    const includes: Included = [
      { id: "4711", lid: undefined, type: "other" },
      { id: "4712", lid: undefined, type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });

  it("should return include by lid and type", async () => {
    const id = {
      id: "",
      lid: "4711",
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = { id: "", lid: "4711", type: "testType" };
    const includes: Included = [
      { id: "4711", lid: "4711", type: "other" },
      { id: "", lid: "4712", type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });
});

describe("findIncludes", () => {
  it("should return include by id and type", async () => {
    const id = {
      id: "4711",
      lid: undefined,
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = {
      id: "4711",
      lid: undefined,
      type: "testType",
    };
    const includes: Included = [
      { id: "4711", lid: undefined, type: "other" },
      { id: "4712", lid: undefined, type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });

  it("should return include by lid and type", async () => {
    const id = {
      id: "",
      lid: "4711",
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = { id: "", lid: "4711", type: "testType" };
    const includes: Included = [
      { id: "4711", lid: "4711", type: "other" },
      { id: "", lid: "4712", type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });
});
