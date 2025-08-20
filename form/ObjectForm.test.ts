import { describe, expect, it } from "vitest";
import { FormControlElement, SingleObjectForm } from "./ObjectForm.ts";
import { ResourceObject } from "../jsonapi/model";
import { ChangeEvent } from "react";

interface TestObject {
  name?: string;
  nested?: {
    fieldA: string;
  };
  array?: string[];
}

const obj = {
  id: "1",
  type: "car",
  name: "Willy",
  components: { tires: "GripTop" },
  races: ["SpeedRace", "DeathRace 3000"],
  wins: 88,
  dateOfConstruction: Date.parse("1985-02-01T08:36:55"),
  driver: {
    id: "2",
    type: "human",
    name: "Herbert",
    titles: ["Sir", "King"],
    skills: { drift: "average" },
  },
};

describe("getValue", () => {
  it("should get direct value", () => {
    const form = new SingleObjectForm({ object: obj });

    expect(form.getValue("id")).toBe("1");
    expect(form.getValue("name")).toBe("Willy");
  });
  it("should get nested value", () => {
    const form = new SingleObjectForm({ object: obj });

    expect(form.getValue("components.tires")).toBe("GripTop");
  });

  it("should get array value", () => {
    const form = new SingleObjectForm({ object: obj });

    expect(form.getValue("races[1]")).toBe("DeathRace 3000");
  });

  it("should get nested array value", () => {
    const form = new SingleObjectForm({ object: obj });

    expect(form.getValue("driver.titles[1]")).toBe("King");
  });
});

describe("setValue", () => {
  it("should set direct value", () => {
    const testObject = structuredClone(obj);
    const form = new SingleObjectForm({
      object: testObject,
    });

    form.setValue("type", "fancy-car");
    expect(testObject.type).toBe("fancy-car");

    form.setValue("name", "Herbie");
    expect(testObject.name).toBe("Herbie");
  });

  it("should set nested value", () => {
    const testObject = structuredClone(obj);
    const form = new SingleObjectForm({
      object: testObject,
    });

    form.setValue("components.tires", "FlopDrop");
    expect(testObject.components.tires).toBe("FlopDrop");

    form.setValue("driver.skills.drift", "pro");
    expect(testObject.driver.skills).toEqual({ drift: "pro" });
  });

  it("should set array value", () => {
    const testObject = structuredClone(obj);
    const form = new SingleObjectForm<TestObject>({ object: testObject });

    form.setValue("races[1]", "UnicornRace");

    expect(testObject.races).toEqual(["SpeedRace", "UnicornRace"]);
  });

  it("should fire onChange", () => {
    const testObject = structuredClone(obj);
    let changedPath = "";
    const form = new SingleObjectForm({
      object: testObject,
      onChange: (_newState: ResourceObject | null, path: string) => {
        changedPath = path;
      },
    });

    form.setValue("name", "Herbie");
    expect(changedPath).toBe("name");

    form.setValue("driver.id", "2");
    expect(changedPath).toBe("driver.id");

    form.setValue("driver.name", "Gunther");
    expect(changedPath).toBe("driver.name");

    form.setValue("driver.skills.drift", "pro");
    expect(changedPath).toBe("driver.skills.drift");
  });
});

describe("removeValue", () => {
  it("should remove direct value", () => {
    const testObject = structuredClone(obj);
    const form = new SingleObjectForm({
      object: testObject,
    });

    form.removeValue("type");
    expect(testObject.type).toBe(undefined);

    form.removeValue("name");
    expect(testObject.name).toBe(undefined);
  });

  it("should remove nested value", () => {
    const testObject = structuredClone(obj);
    const form = new SingleObjectForm({ object: testObject });

    form.removeValue("components.tires");
    expect(testObject.components.tires).toBe(undefined);

    form.removeValue("driver.skills.drift");
    expect(testObject.driver.skills).toEqual({});
  });

  it("should fire onChange", () => {
    const testObject = structuredClone(obj);
    let changedPath = "";
    const form = new SingleObjectForm({
      object: testObject,
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

const dummyObject = {
  text: "This is a text",
  number: 47,
  date: Date.parse("1985-02-01T08:36:55"),
  bool: true,
};

describe("handleChange", () => {
  it("setValue from text value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });
    const newValue = "Another value";

    form.handleChange({
      currentTarget: { type: "text", name: "text", value: newValue },
    } as unknown as ChangeEvent<FormControlElement>);

    expect(testObject.text).toBe(newValue);
  });

  it("setValue from number value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });
    const newValue = 88;

    form.handleChange({
      currentTarget: {
        type: "number",
        name: "number",
        valueAsNumber: newValue,
      },
    } as unknown as ChangeEvent<FormControlElement>);

    expect(testObject.number).toBe(newValue);
  });

  it("setValue from date value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });
    const newValue = Date.parse("2025-01-01T12:01:00Z");

    form.handleChange({
      currentTarget: {
        type: "date",
        name: "date",
        valueAsDate: newValue,
      },
    } as unknown as ChangeEvent<FormControlElement>);

    expect(testObject.date).toBe(newValue);
  });

  it("setValue from check value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });
    const newValue = false;

    form.handleChange({
      currentTarget: {
        type: "checkbox",
        name: "bool",
        checked: newValue,
      },
    } as unknown as ChangeEvent<FormControlElement>);

    expect(testObject.bool).toBe(newValue);
  });
});
