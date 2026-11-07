import { describe, expect, it } from "vitest";

import { type RelationshipObject } from "@jsonapi/model";
import { doc, DuftHaus, Emily, Heidi, Herbert } from "@form/test_data";
import { DocumentForm } from "@form/DocumentForm";
import { toResourceIdentifier } from "@functions/resource-object";

describe("getValue", () => {
  it("should get attrib value", () => {
    const form = new DocumentForm({ document: doc });

    expect(form.getValue("id")).toBe("1");
    expect(form.getValue("name")).toBe("Willy");
    expect(form.getValue("components.tires")).toBe("GripTop");
    expect(form.getValue("races[1]")).toBe("DeathRace 3000");
  });

  it("should get relationship value", () => {
    const form = new DocumentForm({ document: doc });

    expect(form.getValue("driver.id")).toBe("2");
  });

  it("should get included value", () => {
    const form = new DocumentForm({ document: doc });

    expect(form.getValue("driver.name")).toBe("Herbert");
    expect(form.getValue("driver.skills.drift")).toBe("average");
    expect(form.getValue("driver.titles[1]")).toBe("King");
    expect(form.getValue("driver")).toEqual(Herbert);
    expect(form.getValue("passengers")).toEqual([Heidi]);
    expect(form.getValue("passengers[0]")).toEqual(Heidi);
  });

  it("should return undefined on ambiguous or not existing relationship attribute", () => {
    const form = new DocumentForm({ document: doc });

    expect(form.getValue("passengers[1].name")).toBeUndefined();
    expect(form.getValue("not-existing.name")).toBeUndefined();
  });
});

describe("setValue", () => {
  it("should set attrib value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("type", "fancy-car");
    expect(testDoc.data.type).toBe("fancy-car");

    form.setValue("name", "Herbie");
    expect(testDoc.data.attributes.name).toBe("Herbie");

    form.setValue("components.tires", "FlopDrop");
    expect(testDoc.data.attributes.components.tires).toBe("FlopDrop");

    form.setValue("new.attrib", "brand-new");
    // @ts-expect-error too dynamic for the ide
    expect(testDoc.data.attributes["new"]).toEqual({ attrib: "brand-new" });
  });

  it("should set relationship value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("driver.id", "3");

    expect(testDoc.data.relationships.driver.data.id).toBe("3");
  });

  it("should set included value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("driver.name", "Gunther");
    expect(testDoc.included[0]?.attributes!["name"]).toBe("Gunther");

    form.setValue("driver.skills.drift", "pro");
    expect(testDoc.included[0]?.attributes!["skills"]).toEqual({
      drift: "pro",
    });
  });

  it("should set attribute array value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("races[1]", "UnicornRace");

    expect(testDoc.data.attributes["races"]).toEqual([
      "SpeedRace",
      "UnicornRace",
    ]);
  });

  it("should set included array value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("driver.titles[1]", "Master");

    expect(testDoc.included[0]?.attributes!["titles"]).toEqual([
      "Sir",
      "Master",
    ]);
  });

  it("should set ResourceObject as new include", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("passengers", Heidi);

    expect(testDoc.data.relationships!["passengers"]).toEqual({
      data: toResourceIdentifier(Heidi),
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
  });

  it("should set ResourceObject[] as new include", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("passengers", [Heidi, Emily]);

    expect(testDoc.data.relationships!["passengers"]).toEqual({
      data: [toResourceIdentifier(Heidi), toResourceIdentifier(Emily)],
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should set ResourceObject updating relationship and include", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("driver", Emily);

    expect(testDoc.data.relationships!["driver"]).toEqual({
      data: toResourceIdentifier(Emily),
    } satisfies RelationshipObject);
    expect(testDoc.included[0]).toEqual(Herbert);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should remove attrib value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("type", null);
    expect(testDoc.data.type).toBeNull();

    form.setValue("name", null);
    expect(testDoc.data.attributes.name).toBeNull();

    form.setValue("races[0]", null);
    expect(testDoc.data.attributes.races).toEqual([null, "DeathRace 3000"]);

    form.setValue("components.tires", null);
    expect(testDoc.data.attributes.components.tires).toBeNull();
  });

  it("should remove relationship value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("driver.id", null);

    expect(testDoc.data.relationships.driver.data.id).toBeNull();
  });

  it("should remove included value", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("driver.name", null);
    expect(testDoc.included[0]?.attributes!["name"]).toBeNull();

    form.setValue("driver.skills.drift", null);
    expect(testDoc.included[0]?.attributes!["skills"]).toEqual({ drift: null });

    form.setValue("passengers[0].name", null);
    expect(testDoc.included[2]?.attributes!["name"]).toBeNull();
  });

  it("should set relationship to NULL and remove included", () => {
    const testDoc = structuredClone(doc);
    const form = new DocumentForm({
      document: testDoc,
    });

    form.setValue("driver", null);
    expect(testDoc.data.relationships.driver).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus, Heidi]);

    form.setValue("passengers", null);
    expect(testDoc.data.relationships.passengers).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus]);
  });
});
