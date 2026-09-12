import { describe, expect, it } from "vitest";
import { Emily, Heidi, Herbert, TestObject } from "@form/test_data";
import { type RelationshipObject, toResourceIdentifier } from "@jsonapi/model";
import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";

describe("getValue", () => {
  it("should get attrib value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getValue("id")).toBe("1");
    expect(accessor.getValue("name")).toBe("Willy");
    expect(accessor.getValue("components.tires")).toBe("GripTop");
    expect(accessor.getValue("races[1]")).toBe("DeathRace 3000");
  });

  it("should get relationship value", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getValue("driver")).toEqual({
      data: toResourceIdentifier(Herbert),
    } satisfies RelationshipObject);
    expect(accessor.getValue("driver.id")).toBe("2");
    expect(accessor.getValue("passengers[0].type")).toBe("human");
  });

  it("should return undefined on ambiguous or not existing relationship attribute", () => {
    const accessor = new ResourceObjectAccessor(TestObject);

    expect(accessor.getValue("passengers.name")).toBeUndefined();
    expect(accessor.getValue("passengers[1].name")).toBeUndefined();
    expect(accessor.getValue("passengers[zero].name")).toBeUndefined();
    expect(accessor.getValue("not-existing.name")).toBeUndefined();
  });
});

describe("setValue", () => {
  it("should set attrib value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("type", "fancy-car");
    expect(testObject.type).toBe("fancy-car");

    accessor.setValue("name", "Herbie");
    expect(testObject.attributes.name).toBe("Herbie");

    accessor.setValue("components.tires", "FlopDrop");
    expect(testObject.attributes.components.tires).toBe("FlopDrop");

    accessor.setValue("new.attrib", "brand-new");
    // @ts-expect-error too dynamic for the ide
    expect(testObject.attributes["new"]).toEqual({ attrib: "brand-new" });
  });

  it("should set relationship value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("driver.id", "3");

    expect(testObject.relationships.driver.data.id).toBe("3");
  });

  it("should set attribute array value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("races[1]", "UnicornRace");

    expect(testObject.attributes["races"]).toEqual([
      "SpeedRace",
      "UnicornRace",
    ]);
  });

  it("should set ResourceObject as new relationship", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("passenger", Heidi);

    // @ts-expect-error too dynamic for the ide
    expect(testObject.relationships!["passenger"]).toEqual({
      data: toResourceIdentifier(Heidi),
    } satisfies RelationshipObject);
  });

  it("should set ResourceObject[] as new relationships", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("passengers", [Heidi, Emily]);

    expect(testObject.relationships!["passengers"]).toEqual({
      data: [toResourceIdentifier(Heidi), toResourceIdentifier(Emily)],
    } satisfies RelationshipObject);
  });

  it("should set ResourceObject updating relationship", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("driver", Emily);

    expect(testObject.relationships!["driver"]).toEqual({
      data: toResourceIdentifier(Emily),
    } satisfies RelationshipObject);
  });

  it("should remove attrib value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("type", null);
    expect(testObject.type).toBeNull();

    accessor.setValue("name", null);
    expect(testObject.attributes.name).toBeNull();

    accessor.setValue("races[0]", null);
    expect(testObject.attributes.races).toEqual([null, "DeathRace 3000"]);

    accessor.setValue("components.tires", null);
    expect(testObject.attributes.components.tires).toBeNull();
  });

  it("should remove relationship value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("driver.id", null);

    expect(testObject.relationships.driver.data.id).toBeNull();
  });

  it("should set relationship to NULL", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setValue("driver", null);
    expect(testObject.relationships.driver).toEqual({ data: null });

    accessor.setValue("passengers", null);
    expect(testObject.relationships.passengers).toEqual({ data: null });
  });
});

describe("getLink", () => {
  it("should return link", () => {
    const accessor = new ResourceObjectAccessor(TestObject);
    expect(accessor.getLink("self")).toBe("https://willy.gone-wild.test");
    expect(accessor.getLink("object")).toEqual({
      href: "https://willy.gone-wild.test",
    });
    expect(accessor.getLink("non-existing")).toBeUndefined();
  });
});

describe("getMetaValue", () => {
  it("should return value from meta", () => {
    const accessor = new ResourceObjectAccessor(TestObject);
    expect(accessor.getMetaValue("direct")).toBe("foundDirect");
    expect(accessor.getMetaValue("nested.value")).toBe("foundNested");
    expect(accessor.getMetaValue("objects[1]")).toEqual({ name: "Object 2" });
  });
});

describe("setMetaValue", () => {
  it("should return value from meta", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);
    accessor.setMetaValue("direct", "changed");
    accessor.setMetaValue("nested.value", "changed");
    accessor.setMetaValue("objects[1].name", "changed");

    expect(testObject.meta!.direct).toBe("changed");
    expect(testObject.meta!.nested.value).toBe("changed");
    expect(testObject.meta!.objects[1]!.name).toBe("changed");
  });
  it("should remove value", () => {
    const testObject = structuredClone(TestObject);
    const accessor = new ResourceObjectAccessor(testObject);

    accessor.setMetaValue("direct", null);
    expect(testObject.meta.direct).toBeNull();

    accessor.setMetaValue("nested.value", null);
    expect(testObject.meta.nested).not.toBeNull();
    expect(testObject.meta.nested.value).toBeNull();

    accessor.setMetaValue("nested", null);
    expect(testObject.meta.nested).toBeNull();

    accessor.setMetaValue("objects[1]", null);
    expect(testObject.meta.objects).not.toBeNull();
    expect(testObject.meta.objects).toEqual([
      { name: "Object 1" },
      null,
      { name: "Object 3" },
    ]);
  });
});
