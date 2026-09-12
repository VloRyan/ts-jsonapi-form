import { beforeEach, describe, expect, it, vi } from "vitest";
import { SingleObjectForm } from "@form/ObjectForm";

interface TestObject {
  name?: string;
  nested?: {
    fieldA: string;
  };
  array?: string[];
}

const obj = {
  id: "1",
  lid: undefined,
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
});

const dummyObject = {
  text: "This is a text",
  number: 47,
  date: "1985-02-01",
  dateTime: "1985-02-01T08:36:55Z",
  bool: true,
};

describe("handleChange", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "Europe/Berlin"); // UTC+01:00
  });

  it("GIVEN text value THEN set text value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });
    const newValue = "Another value";

    form.handleChange({
      type: "text",
      name: "text",
      value: newValue,
    } as unknown as HTMLInputElement);

    expect(testObject.text).toBe(newValue);
  });

  it("GIVEN number value THEN set number value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });
    const newValue = 88;

    form.handleChange({
      type: "number",
      name: "number",
      valueAsNumber: newValue,
    } as unknown as HTMLInputElement);

    expect(testObject.number).toBe(newValue);
  });

  it("GIVEN date value THEN set iso date string", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });

    form.handleChange({
      type: "date",
      name: "date",
      value: "2025-01-01",
    } as unknown as HTMLInputElement);

    expect(testObject.date).toEqual("2025-01-01T00:00:00Z");
  });

  it("GIVEN empty date value THEN remove value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });

    form.handleChange({
      type: "date",
      name: "date",
      value: "",
    } as unknown as HTMLInputElement);

    expect(testObject.date).toBeNull();
  });

  it("GIVEN datetime-local value THEN set iso date string", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });

    form.handleChange({
      type: "datetime-local",
      name: "dateTime",
      value: "2025-01-01T02:30", // in UTC+01:00
    } as unknown as HTMLInputElement);

    expect(testObject.dateTime).toEqual("2025-01-01T01:30:00Z");
  });

  it("GIVEN checkbox value THEN set bool value", () => {
    const testObject = structuredClone(dummyObject);
    const form = new SingleObjectForm({
      object: testObject,
    });
    const newValue = false;

    form.handleChange({
      type: "checkbox",
      name: "bool",
      checked: newValue,
    } as unknown as HTMLInputElement);

    expect(testObject.bool).toBe(newValue);
  });
});
