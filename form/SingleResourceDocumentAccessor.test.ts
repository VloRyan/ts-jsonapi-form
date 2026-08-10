import { describe, expect, it } from "vitest";
import { SingleResourceDocumentAccessor } from "./SingleResourceDocumentAccessor";
import type { RelationshipObject } from "../jsonapi/model";
import { doc, DuftHaus, Emily, Heidi, Herbert } from "./test_data";

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
      data: { id: Heidi.id, lid: undefined, type: Heidi.type },
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
  });

  it("should set ResourceObject[] as new include", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("passengers", [Heidi, Emily]);

    expect(testDoc.data.relationships!["passengers"]).toEqual({
      data: [
        { id: Heidi.id, lid: undefined, type: Heidi.type },
        { id: Emily.id, lid: undefined, type: Emily.type },
      ],
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should set ResourceObject updating relationship and include", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.setObjectValue("driver", Emily);

    expect(testDoc.data.relationships!["driver"]).toEqual({
      data: { id: Emily.id, lid: undefined, type: Emily.type },
    } satisfies RelationshipObject);
    expect(testDoc.included[0]).toEqual(Herbert);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should fire onChange", () => {
    let changedPath = "";
    const testDoc = structuredClone(doc);
    testDoc.data.relationships.driver.data.id = "3"; // change to rechange
    const document = new SingleResourceDocumentAccessor(testDoc);
    const onChange = (path: string) => {
      changedPath = path;
    };

    document.setObjectValue("name", "Herbie", onChange);
    expect(changedPath).toBe("name");

    document.setObjectValue("driver.id", "2", onChange); // rechange to original
    expect(changedPath).toBe("driver.id");

    document.setObjectValue("driver.name", "Gunther", onChange);
    expect(changedPath).toBe("driver.name");

    document.setObjectValue("driver.skills.drift", "pro", onChange);
    expect(changedPath).toBe("driver.skills.drift");
  });
});

describe("removeObjectValue", () => {
  it("should remove attrib value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.removeObjectValue("type");
    expect(testDoc.data.type).toBe("");

    document.removeObjectValue("name");
    expect(testDoc.data.attributes.name).toBe(undefined);

    document.removeObjectValue("races[0]");
    expect(testDoc.data.attributes.races).toEqual(["DeathRace 3000"]);

    document.removeObjectValue("components.tires");
    expect(testDoc.data.attributes.components.tires).toBe(undefined);
  });

  it("should remove relationship value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.removeObjectValue("driver.id");

    expect(testDoc.data.relationships.driver.data.id).toBe("");
  });

  it("should remove included value", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.removeObjectValue("driver.name");
    expect(testDoc.included[0]?.attributes!["name"]).toBe(undefined);

    document.removeObjectValue("driver.skills.drift");
    expect(testDoc.included[0]?.attributes!["skills"]).toEqual({});

    document.removeObjectValue("passengers[0].name");
    expect(testDoc.included[2]?.attributes!["name"]).toBeUndefined();

    document.removeObjectValue("passengers[0]");
    expect(testDoc.data.relationships.passengers).toEqual({ data: [] });
    expect(testDoc.included[2]).toBeUndefined();
  });

  it("should set relationship to NULL and remove included", () => {
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);

    document.removeObjectValue("driver");
    expect(testDoc.data.relationships.driver).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus, Heidi]);

    document.removeObjectValue("passengers");
    expect(testDoc.data.relationships.passengers).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus]);
  });

  it("should fire onChange", () => {
    let changedPath = "";
    const testDoc = structuredClone(doc);
    const document = new SingleResourceDocumentAccessor(testDoc);
    const onChange = (path: string) => {
      changedPath = path;
    };

    document.removeObjectValue("name", onChange);
    expect(changedPath).toBe("name");

    document.removeObjectValue("driver.name", onChange);
    expect(changedPath).toBe("driver.name");

    document.removeObjectValue("driver.skills.drift", onChange);
    expect(changedPath).toBe("driver.skills.drift");

    document.removeObjectValue("driver.id", onChange); // remove after other tests
    expect(changedPath).toBe("driver.id");
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
