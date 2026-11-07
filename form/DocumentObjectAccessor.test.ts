import { describe, expect, it } from "vitest";
import { TestObject } from "@form/test_data";
import type { LinkObject, ResourceObject } from "@jsonapi/model";
import { DocumentObjectAccessor } from "@form/DocumentObjectAccessor";

describe("getLink", () => {
  it("should return link as string", () => {
    const accessor = new DocumentObjectAccessor<ResourceObject>(TestObject);
    expect(accessor.getLink("self")).toBe("https://willy.gone-wild.test");
  });

  it("should return link as LinkObject", () => {
    const accessor = new DocumentObjectAccessor<ResourceObject>(TestObject);
    expect(accessor.getLink("object")).toEqual({
      href: "https://willy.gone-wild.test",
    } as LinkObject);
  });

  it("should return undefined on non-exiting path", () => {
    const accessor = new DocumentObjectAccessor<ResourceObject>(TestObject);
    expect(accessor.getLink("non-existing")).toBeUndefined();
  });
});

describe("getMeta", () => {
  it("should get meta value", () => {
    const accessor = new DocumentObjectAccessor<ResourceObject>(TestObject);

    expect(accessor.getMeta("direct")).toBe("foundDirect");
    expect(accessor.getMeta("nested.value")).toBe("foundNested");
    expect(accessor.getMeta("objects[1].name")).toBe("Object 2");
  });
});

describe("setLink", () => {
  it("should add link", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new DocumentObjectAccessor<ResourceObject>(testObject);
    accessor.setLink("new", "https://new.link.net");

    expect(testObject.links).toEqual({
      ...TestObject.links,
      new: "https://new.link.net",
    });
  });

  it("should update link", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new DocumentObjectAccessor<ResourceObject>(testObject);
    accessor.setLink("self", "https://jochen.wills.wissen");

    expect(testObject.links).toEqual({
      ...TestObject.links,
      self: "https://jochen.wills.wissen",
    });
  });
});

describe("setMeta", () => {
  it("should add value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new DocumentObjectAccessor<ResourceObject>(testObject);
    accessor.setMeta("new", "value");

    expect(testObject.meta).toEqual({
      ...TestObject.meta,
      new: "value",
    });
  });
  it("should update value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new DocumentObjectAccessor<ResourceObject>(testObject);
    accessor.setMeta("direct", "another value");

    expect(testObject.meta).toEqual({
      ...TestObject.meta,
      direct: "another value",
    });
  });
});

describe("isNull", () => {
  it("should be true on null", () => {
    expect(
      new DocumentObjectAccessor<ResourceObject>(null).isNull(),
    ).toBeTruthy();
  });
  it("should be false on non-null", () => {
    expect(
      new DocumentObjectAccessor<ResourceObject>(TestObject).isNull(),
    ).toBeFalsy();
  });
});
