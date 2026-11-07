import { describe, expect, it } from "vitest";
import { Emily, Heidi, TestObject } from "@form/test_data";
import { toResourceIdentifier } from "@functions/resource-object";
import { RelationshipObjectAccessor } from "@form/RelationshipObjectAccessor";
import type { ResourceIdentifierObject } from "@jsonapi/model";

describe("getLinkage", () => {
  it("should get single linkage", () => {
    const accessor = new RelationshipObjectAccessor(
      TestObject.relationships.driver,
    );

    expect(accessor.getLinkage()).toEqual(TestObject.relationships.driver.data);
  });

  it("should get array linkage", () => {
    const accessor = new RelationshipObjectAccessor(
      TestObject.relationships.passengers,
    );

    expect(accessor.getLinkage()).toEqual(
      TestObject.relationships.passengers.data,
    );
    expect(accessor.getLinkage(0)).toEqual(
      TestObject.relationships.passengers.data[0],
    );
  });

  it("should return undefined on invalid access", () => {
    const singleLinkageAccessor = new RelationshipObjectAccessor(
      TestObject.relationships.driver,
    );
    const arrayLinkageAccessor = new RelationshipObjectAccessor(
      TestObject.relationships.passengers,
    );

    expect(singleLinkageAccessor.getLinkage(0)).toBeUndefined();
    expect(arrayLinkageAccessor.getLinkage(4711)).toBeUndefined();
  });
});

describe("forEach", () => {
  it("should loop single linkage", () => {
    const accessor = new RelationshipObjectAccessor(
      TestObject.relationships.driver,
    );
    const loopedElements: ResourceIdentifierObject[] = [];
    accessor.forEach((identifier) => loopedElements.push(identifier));

    expect(loopedElements).toEqual([TestObject.relationships.driver.data]);
  });

  it("should loop array linkage", () => {
    const accessor = new RelationshipObjectAccessor(
      TestObject.relationships.passengers,
    );
    const loopedElements: ResourceIdentifierObject[] = [];
    accessor.forEach((identifier) => loopedElements.push(identifier));

    expect(loopedElements).toEqual(TestObject.relationships.passengers.data);
  });
});

describe("setLinkage", () => {
  it("should set single linkage", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new RelationshipObjectAccessor(
      testObject.relationships.driver,
    );

    accessor.setLinkage(toResourceIdentifier(Heidi));

    expect(testObject.relationships.driver.data).toEqual(
      toResourceIdentifier(Heidi),
    );
  });

  it("should set array linkage", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new RelationshipObjectAccessor(
      testObject.relationships.passengers,
    );

    accessor.setLinkage([
      toResourceIdentifier(Heidi),
      toResourceIdentifier(Emily),
    ]);

    expect(testObject.relationships.passengers.data).toEqual([
      toResourceIdentifier(Heidi),
      toResourceIdentifier(Emily),
    ]);
  });
});
