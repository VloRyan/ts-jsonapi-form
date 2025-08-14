import { describe, expect, it } from "vitest";
import { ResourceObjectForm } from "./ResourceObjectForm.ts";
import {
  Included,
  LinkObject,
  RelationshipObject,
  ResourceIdentifierObject,
  ResourceObject,
  SingleResourceDoc,
} from "../jsonapi/model";

const Herbert = {
  id: "2",
  type: "human",
  attributes: {
    name: "Herbert",
    skills: { drift: "average" },
    titles: ["Sir", "King"],
  },
} satisfies ResourceObject;

const Heidi = {
  id: "4",
  type: "human",
  attributes: { name: "Heidi" },
} satisfies ResourceObject;

const Emily = {
  id: "5",
  type: "human",
  attributes: { name: "Emily" },
} satisfies ResourceObject;

const obj = {
  id: "1",
  type: "car",
  attributes: {
    name: "Willy",
    components: { tires: "GripTop" },
    races: ["SpeedRace", "DeathRace 3000"],
  },
  relationships: {
    driver: {
      data: { id: "2", type: "human" },
    },
    passengers: {
      data: [
        { id: Heidi.id, type: Heidi.type } satisfies ResourceIdentifierObject,
      ],
    },
  },
  links: {
    self: "https://willy.gone-wild.test",
    object: {
      href: "https://willy.gone-wild.test",
    } satisfies LinkObject,
  },
} satisfies ResourceObject;

const DuftHaus = {
  id: "4711",
  type: "building",
  attributes: { name: "Dufthaus 4711", yearOfConstruction: 1792 },
} satisfies ResourceObject;
const included: Included = [Herbert, DuftHaus, Heidi] satisfies Included;

const doc = {
  data: obj,
  included: included,
} satisfies SingleResourceDoc;

describe("getValue", () => {
  it("should get attrib value", () => {
    const form = new ResourceObjectForm({ document: doc });

    expect(form.getValue("id")).toBe("1");
    expect(form.getValue("name")).toBe("Willy");
    expect(form.getValue("components.tires")).toBe("GripTop");
    expect(form.getValue("races[1]")).toBe("DeathRace 3000");
  });

  it("should get relationship value", () => {
    const form = new ResourceObjectForm({ document: doc });

    expect(form.getValue("driver.id")).toBe("2");
  });

  it("should get included value", () => {
    const form = new ResourceObjectForm({ document: doc });

    expect(form.getValue("driver.name")).toBe("Herbert");
    expect(form.getValue("driver.skills.drift")).toBe("average");
    expect(form.getValue("driver.titles[1]")).toBe("King");
    expect(form.getValue("driver")).toEqual(Herbert);
    expect(form.getValue("passengers")).toEqual([Heidi]);
    expect(form.getValue("passengers[0]")).toEqual(Heidi);
  });

  it("should return undefined on ambiguous or not existing relationship attribute", () => {
    const form = new ResourceObjectForm({ document: doc });

    expect(form.getValue("passengers.name")).toBeUndefined();
    expect(form.getValue("passengers[1].name")).toBeUndefined();
    expect(form.getValue("passengers[zero].name")).toBeUndefined();
    expect(form.getValue("not-existing.name")).toBeUndefined();
  });
});

describe("setValue", () => {
  it("should set attrib value", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
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
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.setValue("driver.id", "3");

    expect(testDoc.data.relationships.driver.data.id).toBe("3");
  });

  it("should set included value", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.setValue("driver.name", "Gunther");
    expect(testDoc.included[0].attributes!["name"]).toBe("Gunther");

    form.setValue("driver.skills.drift", "pro");
    expect(testDoc.included[0].attributes!["skills"]).toEqual({ drift: "pro" });
  });

  it("should set attribute array value", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
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
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.setValue("driver.titles[1]", "Master");

    expect(testDoc.included[0].attributes!["titles"]).toEqual([
      "Sir",
      "Master",
    ]);
  });

  it("should set ResourceObject as new include", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.setValue("passenger", Heidi);

    // @ts-expect-error too dynamic for the ide
    expect(testDoc.data.relationships!["passenger"]).toEqual({
      data: { id: Heidi.id, type: Heidi.type },
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
  });

  it("should set ResourceObject[] as new include", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.setValue("passengers", [Heidi, Emily]);

    expect(testDoc.data.relationships!["passengers"]).toEqual({
      data: [
        { id: Heidi.id, type: Heidi.type },
        { id: Emily.id, type: Emily.type },
      ],
    } satisfies RelationshipObject);
    expect(testDoc.included[2]).toEqual(Heidi);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should set ResourceObject updating relationship and include", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.setValue("driver", Emily);

    expect(testDoc.data.relationships!["driver"]).toEqual({
      data: { id: Emily.id, type: Emily.type },
    } satisfies RelationshipObject);
    expect(testDoc.included[0]).toEqual(Herbert);
    expect(testDoc.included[3]).toEqual(Emily);
  });

  it("should fire onChange", () => {
    let changedPath = "";
    const testDoc = structuredClone(doc);
    testDoc.data.relationships.driver.data.id = "3"; // change to rechange
    const form = new ResourceObjectForm({
      document: testDoc,
      onChange: (_newState: ResourceObject | null, path: string) => {
        changedPath = path;
      },
    });

    form.setValue("name", "Herbie");
    expect(changedPath).toBe("name");

    form.setValue("driver.id", "2"); // rechange to original
    expect(changedPath).toBe("driver.id");

    form.setValue("driver.name", "Gunther");
    expect(changedPath).toBe("driver.name");

    form.setValue("driver.skills.drift", "pro");
    expect(changedPath).toBe("driver.skills.drift");
  });
});

describe("removeValue", () => {
  it("should remove attrib value", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.removeValue("type");
    expect(testDoc.data.type).toBe("");

    form.removeValue("name");
    expect(testDoc.data.attributes.name).toBe(undefined);

    form.removeValue("races[0]");
    expect(testDoc.data.attributes.races).toEqual(["DeathRace 3000"]);

    form.removeValue("components.tires");
    expect(testDoc.data.attributes.components.tires).toBe(undefined);
  });

  it("should remove relationship value", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.removeValue("driver.id");

    expect(testDoc.data.relationships.driver.data.id).toBe("");
  });

  it("should remove included value", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.removeValue("driver.name");
    expect(testDoc.included[0].attributes!["name"]).toBe(undefined);

    form.removeValue("driver.skills.drift");
    expect(testDoc.included[0].attributes!["skills"]).toEqual({});

    form.removeValue("passengers[0].name");
    expect(testDoc.included[2].attributes!["name"]).toBeUndefined();

    form.removeValue("passengers[0]");
    expect(testDoc.data.relationships.passengers).toEqual({ data: [] });
    expect(testDoc.included[2]).toBeUndefined();
  });

  it("should set relationship to NULL and remove included", () => {
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
    });

    form.removeValue("driver");
    expect(testDoc.data.relationships.driver).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus, Heidi]);

    form.removeValue("passengers");
    expect(testDoc.data.relationships.passengers).toEqual({ data: null });
    expect(testDoc.included).toEqual([DuftHaus]);
  });

  it("should fire onChange", () => {
    let changedPath = "";
    const testDoc = structuredClone(doc);
    const form = new ResourceObjectForm({
      document: testDoc,
      onChange: (_newState: ResourceObject | null, path: string) => {
        changedPath = path;
      },
    });

    form.removeValue("name");
    expect(changedPath).toBe("name");

    form.removeValue("driver.name");
    expect(changedPath).toBe("driver.name");

    form.removeValue("driver.skills.drift");
    expect(changedPath).toBe("driver.skills.drift");

    form.removeValue("driver.id"); // remove after other tests
    expect(changedPath).toBe("driver.id");
  });
});

describe("getLink", () => {
  it("should return link", () => {
    const form = new ResourceObjectForm({
      document: doc,
    });
    expect(form.getLink("self")).toBe("https://willy.gone-wild.test");
    expect(form.getLink("object")).toEqual({
      href: "https://willy.gone-wild.test",
    });
    expect(form.getLink("non-existing")).toBeUndefined();
  });
});
