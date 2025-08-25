import { describe, expect, it } from "vitest";
import {
  isResourceObject,
  isSameId,
  ResourceIdentifierObject,
  ResourceObject,
} from "./Objects.ts";
import { ObjectLike } from "./Types.ts";

describe("isResourceObject", () => {
  it("should return true on ResourceObject", async () => {
    const objWithId: ResourceObject = { id: "1", type: "object" };
    const objWithLid = { lid: "1", type: "object" };

    expect(isResourceObject(objWithId as unknown as ObjectLike)).toBe(true);
    expect(isResourceObject(objWithLid as unknown as ObjectLike)).toBe(true);
  });

  it("should return true on ResourceIdentifierObject", async () => {
    const obj: ResourceIdentifierObject = { id: "1", type: "object" };

    expect(isResourceObject(obj as unknown as ObjectLike)).toBe(true);
  });

  it("should return false on any other object", async () => {
    expect(isResourceObject({ type: "object" } as unknown as ObjectLike)).toBe(
      false,
    );
    expect(isResourceObject({ id: "1" } as unknown as ObjectLike)).toBe(false);
    expect(isResourceObject({ lid: "2" } as unknown as ObjectLike)).toBe(false);
    expect(isResourceObject({} as unknown as ObjectLike)).toBe(false);
  });
});

describe("isSameId", () => {
  it("should return true on same by id", async () => {
    const a: ResourceIdentifierObject = { id: "1", type: "object" };
    const b: ResourceIdentifierObject = { id: "1", type: "object" };

    expect(isSameId(a, b)).toBe(true);
  });

  it("should return true on same by lid", async () => {
    const a: ResourceIdentifierObject = { id: "", lid: "1", type: "object" };
    const b: ResourceIdentifierObject = { id: "", lid: "1", type: "object" };

    expect(isSameId(a, b)).toBe(true);
  });

  it("should return false on different ids", async () => {
    expect(
      isSameId({ id: "1", type: "object" }, { id: "2", type: "object" }),
    ).toBe(false);
    expect(
      isSameId({ id: "1", type: "object" }, { id: "1", type: "other" }),
    ).toBe(false);
    expect(
      isSameId(
        { id: "1", lid: "1", type: "object" },
        { id: "1", lid: "2", type: "object" },
      ),
    ).toBe(false);
  });
});
