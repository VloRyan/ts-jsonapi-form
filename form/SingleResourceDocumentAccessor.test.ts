import { describe, expect, it } from "vitest";

import { type RelationshipObject, toResourceIdentifier } from "@jsonapi/model";
import { doc, DuftHaus, Emily, Heidi, Herbert } from "@form/test_data";
import { SingleResourceDocumentAccessor } from "@form/SingleResourceDocumentAccessor";

describe("getObjectValue", () => {
  it("should get attrib value", () => {
    const document = new SingleResourceDocumentAccessor(doc);

    expect(document.getObjectValue("id")).toBe("1");
    expect(document.getObjectValue("name")).toBe("Willy");
    expect(document.getObjectValue("components.tires")).toBe("GripTop");
    expect(document.getObjectValue("races[1]")).toBe("DeathRace 3000");
  });

  it("should get relationship value", () => {
    const document = new SingleResourceDocumentAccessor(doc);

    expect(document.getObjectValue("driver.id")).toBe("2");
  });

  it("should get included value", () => {
    const document = new SingleResourceDocumentAccessor(doc);

    expect(document.getObjectValue("driver.name")).toBe("Herbert");
    expect(document.getObjectValue("driver.skills.drift")).toBe("average");
    expect(document.getObjectValue("driver.titles[1]")).toBe("King");
    expect(document.getObjectValue("driver")).toEqual(Herbert);
    expect(document.getObjectValue("passengers")).toEqual([Heidi]);
    expect(document.getObjectValue("passengers[0]")).toEqual(Heidi);
  });

  it("should return undefined on ambiguous or not existing relationship attribute", () => {
    const document = new SingleResourceDocumentAccessor(doc);

    expect(document.getObjectValue("passengers.name")).toBeUndefined();
    expect(document.getObjectValue("passengers[1].name")).toBeUndefined();
    expect(document.getObjectValue("passengers[zero].name")).toBeUndefined();
    expect(document.getObjectValue("not-existing.name")).toBeUndefined();
  });
});

describe("setObjectValue", () => {
  it("should set attrib value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("type", "fancy-car");
    expect(testDoc.data.type).toBe("fancy-car");

    document.setObjectValue("name", "Herbie");
    expect(testDoc.data.attributes.name).toBe("Herbie");

    document.setObjectValue("components.tires", "FlopDrop");
    expect(testDoc.data.attributes.components.tires).toBe("FlopDrop");

    document.setObjectValue("new.attrib", "brand-new");
    // @ts-expect-error too dynamic for the ide
    expect(testDoc.data.attributes["new"]).toEqual({ attrib: "brand-new" });
  });

  it("should set relationship value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver.id", "3");

    expect(testDoc.data.relationships.driver.data.id).toBe("3");
  });

  it("should set included value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver.name", "Gunther");
    expect(testDoc.included[0]?.attributes!["name"]).toBe("Gunther");

    document.setObjectValue("driver.skills.drift", "pro");
    expect(testDoc.included[0]?.attributes!["skills"]).toEqual({
      drift: "pro",
    });
  });

  it("should set attribute array value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("races[1]", "UnicornRace");

    expect(testDoc.data.attributes["races"]).toEqual([
      "SpeedRace",
      "UnicornRace",
    ]);
  });

  it("should set included array value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver.titles[1]", "Master");

    expect(testDoc.included[0]?.attributes!["titles"]).toEqual([
      "Sir",
      "Master",
    ]);
  });

  it("should set ResourceObject as new include", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("passenger", Heidi);

    // @ts-expect-error too dynamic for the ide
    expect(testDoc.data.relationships!["passenger"]).toEqual({
      data: toResourceIdentifier(Heidi),
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
  });

  it("should set ResourceObject[] as new include", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("passengers", [Heidi, Emily]);

    expect(testDoc.data.relationships!["passengers"]).toEqual({
      data: [toResourceIdentifier(Heidi), toResourceIdentifier(Emily)],
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should set ResourceObject updating relationship and include", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver", Emily);

    expect(testDoc.data.relationships!["driver"]).toEqual({
      data: toResourceIdentifier(Emily),
    } satisfies RelationshipObject);
    expect(testDoc.included[0]).toEqual(Herbert);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should set attrib value to null", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("type", null);
    expect(testDoc.data.type).toBeNull();

    document.setObjectValue("name", null);
    expect(testDoc.data.attributes.name).toBeNull();

    document.setObjectValue("races[0]", null);
    expect(testDoc.data.attributes.races).toEqual([null, "DeathRace 3000"]);

    document.setObjectValue("components.tires", null);
    expect(testDoc.data.attributes.components.tires).toBeNull();
  });

  it("should set relationship value to null", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver.id", null);

    expect(testDoc.data.relationships.driver.data.id).toBeNull();
  });

  it("should set included value to null", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver.name", null);
    expect(testDoc.included[0]?.attributes!["name"]).toBeNull();

    document.setObjectValue("driver.skills.drift", null);
    expect(testDoc.included[0]?.attributes!["skills"]).toEqual({ drift: null });

    document.setObjectValue("passengers[0].name", null);
    expect(testDoc.included[2]?.attributes!["name"]).toBeNull();
  });

  it("should set relationship to null and remove include", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver", null);
    expect(testDoc.data.relationships.driver).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus, Heidi]);

    document.setObjectValue("passengers", null);
    expect(testDoc.data.relationships.passengers).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus]);
  });
});

describe("getLink", () => {
  it("should return link", () => {
    const document = new SingleResourceDocumentAccessor(doc);
    expect(document.getLink("self")).toBe("https://willy.gone-wild.test");
    expect(document.getLink("object")).toEqual({
      href: "https://willy.gone-wild.test",
    });
    expect(document.getLink("non-existing")).toBeUndefined();
  });
});
