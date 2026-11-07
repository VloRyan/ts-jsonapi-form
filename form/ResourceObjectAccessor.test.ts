import { describe, expect, it } from "vitest";
import { Emily, Heidi, TestObject } from "@form/test_data";
import { type RelationshipObject } from "@jsonapi/model";
import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";
import { toResourceIdentifier } from "@functions/resource-object";
import { RelationshipObjectAccessor } from "@form/RelationshipObjectAccessor";

describe("getAttribute", () => {
  it("should get value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getAttribute("id")).toBe("1");
    expect(accessor.getAttribute("name")).toBe("Willy");
    expect(accessor.getAttribute("components.tires")).toBe("GripTop");
    expect(accessor.getAttribute("races[1]")).toBe("DeathRace 3000");
  });
});

describe("getRelationship", () => {
  it("should get RelationshipsObject", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getRelationship("driver")).toEqual(
      new RelationshipObjectAccessor(TestObject.relationships.driver),
    );
    expect(accessor.getRelationship("passengers")).toEqual(
      new RelationshipObjectAccessor(TestObject.relationships.passengers),
    );
  });

  it("should return undefined on ambiguous or not existing relationship attribute", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getRelationship("passengers.name")).toBeUndefined();
    expect(accessor.getRelationship("passengers[1].name")).toBeUndefined();
    expect(accessor.getRelationship("passengers[zero].name")).toBeUndefined();
    expect(accessor.getRelationship("not-existing.name")).toBeUndefined();
  });
});

describe("getField", () => {
  it("should get attribute value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getField("id")).toBe("1");
    expect(accessor.getField("name")).toBe("Willy");
    expect(accessor.getField("components.tires")).toBe("GripTop");
    expect(accessor.getField("races[1]")).toBe("DeathRace 3000");
  });

  it("should get relationship value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getField("passengers")).toEqual(
      TestObject.relationships.passengers.data,
    );
    expect(accessor.getField("passengers[0]")).toEqual(
      TestObject.relationships.passengers.data[0],
    );
    expect(accessor.getField("driver.id")).toBe("2");
    expect(accessor.getField("passengers[0].type")).toBe("human");
  });
});

describe("getId", () => {
  it("should get value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);
    expect(accessor.getId()).toBe("1");
  });
});

describe("getType", () => {
  it("should get value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);
    expect(accessor.getType()).toBe("car");
  });
});

describe("getLid", () => {
  it("should get value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);
    expect(accessor.getLid()).toBe("4711");
  });
});

describe("setAttribute", () => {
  it("should set attrib value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setAttribute("type", "fancy-car");
    expect(testObject.type).toBe("fancy-car");

    accessor.setAttribute("name", "Herbie");
    expect(testObject.attributes.name).toBe("Herbie");

    accessor.setAttribute("components.tires", "FlopDrop");
    expect(testObject.attributes.components.tires).toBe("FlopDrop");

    accessor.setAttribute("new.attrib", "brand-new");
    // @ts-expect-error too dynamic for the ide
    expect(testObject.attributes["new"]).toEqual({ attrib: "brand-new" });
  });

  it("should set attribute array value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setAttribute("races[1]", "UnicornRace");

    expect(testObject.attributes["races"]).toEqual([
      "SpeedRace",
      "UnicornRace",
    ]);
  });

  it("should remove attrib value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setAttribute("type", null);
    expect(testObject.type).toBeNull();

    accessor.setAttribute("name", null);
    expect(testObject.attributes.name).toBeNull();

    accessor.setAttribute("races[0]", null);
    expect(testObject.attributes.races).toEqual([null, "DeathRace 3000"]);

    accessor.setAttribute("components.tires", null);
    expect(testObject.attributes.components.tires).toBeNull();
  });
});

describe("setRelationship", () => {
  it("should set relationship", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setRelationship("passengers", {
      data: toResourceIdentifier(Heidi),
    });

    expect(testObject.relationships!.passengers).toEqual({
      data: toResourceIdentifier(Heidi),
    } satisfies RelationshipObject);
  });

  it("should set ResourceObject[] as new relationships", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setRelationship("passengers", {
      data: [toResourceIdentifier(Heidi), toResourceIdentifier(Emily)],
    });

    expect(testObject.relationships!.passengers).toEqual({
      data: [toResourceIdentifier(Heidi), toResourceIdentifier(Emily)],
    } satisfies RelationshipObject);
  });

  it("should set ResourceObject updating relationship", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setRelationship("driver", { data: toResourceIdentifier(Emily) });

    expect(testObject.relationships!.driver).toEqual({
      data: toResourceIdentifier(Emily),
    } satisfies RelationshipObject);
  });

  it("should set relationship to NULL", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setRelationship("driver", { data: null });
    expect(testObject.relationships.driver).toEqual({ data: null });

    accessor.setRelationship("passengers", { data: null });
    expect(testObject.relationships.passengers).toEqual({ data: null });
  });

  it("should do nothing on invalid path", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setRelationship("driver.leg", { data: null });
    accessor.setRelationship("passengers[0]", { data: null });

    expect(testObject.relationships).toEqual(TestObject.relationships);
  });
});

describe("setField", () => {
  it("should set relationship value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setField("driver.id", "3");

    expect(testObject.relationships.driver.data.id).toBe("3");
  });

  it("should set ResourceObject as new relationship", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setField("passengers", Heidi);

    expect(testObject.relationships!.passengers).toEqual({
      data: toResourceIdentifier(Heidi),
    } satisfies RelationshipObject);
  });

  it("should set ResourceObject[] as new relationships", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setField("passengers", [Heidi, Emily]);

    expect(testObject.relationships!.passengers).toEqual({
      data: [toResourceIdentifier(Heidi), toResourceIdentifier(Emily)],
    } satisfies RelationshipObject);
  });

  it("should set ResourceObject updating relationship", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setField("driver", Emily);

    expect(testObject.relationships!.driver).toEqual({
      data: toResourceIdentifier(Emily),
    });
  });

  it("should remove relationship value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setField("driver.id", null);

    expect(testObject.relationships.driver.data.id).toBeNull();
  });

  it("should set relationship to NULL", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setField("driver", null);
    expect(testObject.relationships!.driver).toEqual({
      data: null,
    });

    accessor.setField("passengers", null);
    expect(testObject.relationships.passengers).toEqual({ data: null });
  });
});
