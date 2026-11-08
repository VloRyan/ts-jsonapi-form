import { describe, expect, it } from "vitest";

import { doc, DuftHaus, Emily, Heidi, Herbert } from "@form/test_data";
import { SingleResourceDocumentAccessor } from "@form/SingleResourceDocumentAccessor";
import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";
import type { RelationshipObject, ResourceObject } from "@jsonapi/model";
import { isSameId, toResourceIdentifier } from "@functions/resource-object";

describe("getData", () => {
  it("should return data", () => {
    const accessor = new SingleResourceDocumentAccessor(doc);

    // direct comparison fails due to lambdas
    expect(JSON.stringify(accessor.getData())).toEqual(
      JSON.stringify(new ResourceObjectAccessor(doc.data)),
    );
  });
});

describe("setData", () => {
  it("should update data", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    const newData = {
      id: "new id",
      type: "plain",
    } satisfies ResourceObject;

    accessor.setData(newData);

    expect(accessor.getData().getId()).toBe("new id");
    expect(accessor.getData().getType()).toBe("plain");
  });
});

describe("getResourceObjectField", () => {
  it("should get attrib value", () => {
    const accessor = new SingleResourceDocumentAccessor(doc);

    expect(accessor.getResourceObjectField("id")).toBe("1");
    expect(accessor.getResourceObjectField("name")).toBe("Willy");
    expect(accessor.getResourceObjectField("components.tires")).toBe("GripTop");
    expect(accessor.getResourceObjectField("races[1]")).toBe("DeathRace 3000");
  });

  it("should get relationship value", () => {
    const accessor = new SingleResourceDocumentAccessor(doc);

    expect(accessor.getResourceObjectField("driver.id")).toBe("2");
  });

  it("should get included value", () => {
    const accessor = new SingleResourceDocumentAccessor(doc);

    expect(accessor.getResourceObjectField("driver.name")).toBe("Herbert");
    expect(accessor.getResourceObjectField("driver.skills.drift")).toBe(
      "average",
    );
    expect(accessor.getResourceObjectField("driver.titles[1]")).toBe("King");
    expect(accessor.getResourceObjectField("driver")).toEqual(Herbert);
    expect(accessor.getResourceObjectField("passengers")).toEqual([Heidi]);
    expect(accessor.getResourceObjectField("passengers[0]")).toEqual(Heidi);
  });

  it("should return undefined on ambiguous or not existing relationship attribute", () => {
    const accessor = new SingleResourceDocumentAccessor(doc);

    expect(
      accessor.getResourceObjectField("passengers[1].name"),
    ).toBeUndefined();
    expect(
      accessor.getResourceObjectField("not-existing.name"),
    ).toBeUndefined();
  });
});

describe("setResourceObjectField", () => {
  it("should set attrib value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("type", "fancy-car");
    expect(document.data.type).toBe("fancy-car");

    accessor.setResourceObjectField("name", "Herbie");
    expect(document.data.attributes.name).toBe("Herbie");

    accessor.setResourceObjectField("components.tires", "FlopDrop");
    expect(document.data.attributes.components.tires).toBe("FlopDrop");

    accessor.setResourceObjectField("new.attrib", "brand-new");
    // @ts-expect-error too dynamic for the ide
    expect(document.data.attributes["new"]).toEqual({ attrib: "brand-new" });
  });

  it("should set relationship value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("driver.id", "3");

    expect(document.data.relationships.driver.data.id).toBe("3");
  });

  it("should set included value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("driver.name", "Gunther");
    expect(document.included[0]?.attributes!["name"]).toBe("Gunther");

    accessor.setResourceObjectField("driver.skills.drift", "pro");
    expect(document.included[0]?.attributes!["skills"]).toEqual({
      drift: "pro",
    });
  });

  it("should set attribute array value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("races[1]", "UnicornRace");

    expect(document.data.attributes["races"]).toEqual([
      "SpeedRace",
      "UnicornRace",
    ]);
  });

  it("should set included array value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("driver.titles[1]", "Master");

    expect(document.included[0]?.attributes!["titles"]).toEqual([
      "Sir",
      "Master",
    ]);
  });

  it("should set ResourceObject as new include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("passengers", Heidi);

    expect(document.data.relationships!["passengers"]).toEqual({
      data: toResourceIdentifier(Heidi),
    } satisfies RelationshipObject);
    expect(document.included[2]).toEqual(Heidi);
  });

  it("should set ResourceObject[] as new include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("passengers", [Heidi, Emily]);

    expect(document.data.relationships!["passengers"]).toEqual({
      data: [toResourceIdentifier(Heidi), toResourceIdentifier(Emily)],
    } satisfies RelationshipObject);
    expect(document.included[2]).toEqual(Heidi);
    expect(document.included[3]).toEqual(Emily);
  });

  it("should set ResourceObject updating relationship and include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("driver", Emily);

    expect(document.data.relationships!["driver"]).toEqual({
      data: toResourceIdentifier(Emily),
    } satisfies RelationshipObject);
    expect(document.included[0]).toEqual(Herbert);
    expect(document.included[3]).toEqual(Emily);
  });

  it("should remove attrib value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("type", null);
    expect(document.data.type).toBeNull();

    accessor.setResourceObjectField("name", null);
    expect(document.data.attributes.name).toBeNull();

    accessor.setResourceObjectField("races[0]", null);
    expect(document.data.attributes.races).toEqual([null, "DeathRace 3000"]);

    accessor.setResourceObjectField("components.tires", null);
    expect(document.data.attributes.components.tires).toBeNull();
  });

  it("should remove relationship value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("driver.id", null);

    expect(document.data.relationships.driver.data.id).toBeNull();
  });

  it("should remove included value", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("driver.name", null);
    expect(document.included[0]?.attributes!["name"]).toBeNull();

    accessor.setResourceObjectField("driver.skills.drift", null);
    expect(document.included[0]?.attributes!["skills"]).toEqual({
      drift: null,
    });

    accessor.setResourceObjectField("passengers[0].name", null);
    expect(document.included[2]?.attributes!["name"]).toBeNull();
  });

  it("should set relationship to NULL and remove included", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.setResourceObjectField("driver", null);
    expect(document.data.relationships.driver).toEqual({ data: null });
    expect(document.included).toEqual([DuftHaus, Heidi]);

    accessor.setResourceObjectField("passengers", null);
    expect(document.data.relationships.passengers).toEqual({ data: null });
    expect(document.included).toEqual([DuftHaus]);
  });
});

describe("addOrUpdateInclude", () => {
  it("should add include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    const newInclude = {
      id: "new id",
      type: "plain",
    } satisfies ResourceObject;

    accessor.addOrUpdateInclude(newInclude);

    expect(accessor.getIncludes()).toEqual([...doc.included, newInclude]);
  });

  it("should update include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    const modifiedInclude = {
      ...Herbert,
      attributes: {
        name: "Jochen",
      },
    } satisfies ResourceObject;

    accessor.addOrUpdateInclude(modifiedInclude);

    expect(accessor.getIncludes()?.sort()).toEqual([
      modifiedInclude,
      ...doc.included.filter((e) => !isSameId(e, Herbert)),
    ]);
  });
});

describe("removeIncludeIfNotBelongsToOther", () => {
  it("should remove unreferenced include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    document!.data!.relationships!.driver!.data.id = "unset";

    accessor.removeOrphanInclude(doc!.data!.relationships!.driver!.data);

    expect(accessor.getIncludes()).toEqual(
      doc.included.filter((e) => !isSameId(e, Herbert)),
    );
  });

  it("should do nothing if include is still referenced", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.removeOrphanInclude(toResourceIdentifier(Heidi));

    expect(accessor.getIncludes()).toEqual(doc.included);
  });

  it("should do nothing if include is not found", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.removeOrphanInclude({ id: "invalid", type: "human" });

    expect(accessor.getIncludes()).toEqual(doc.included);
  });
});
