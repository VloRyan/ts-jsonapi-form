import {
  type Included,
  type LinkObject,
  type ResourceObject,
  type SingleResourceDoc,
} from "@jsonapi/model";
import { toResourceIdentifier } from "@functions/resource-object";

export const Herbert = {
  id: "2",
  lid: undefined,
  type: "human",
  attributes: {
    name: "Herbert",
    skills: { drift: "average" },
    titles: ["Sir", "King"],
  },
} satisfies ResourceObject;

export const Heidi = {
  id: "4",
  lid: undefined,
  type: "human",
  attributes: { name: "Heidi" },
} satisfies ResourceObject;

export const Emily = {
  id: "5",
  lid: undefined,
  type: "human",
  attributes: { name: "Emily" },
} satisfies ResourceObject;

export const DuftHaus = {
  id: "4711",
  lid: undefined,
  type: "building",
  attributes: { name: "Dufthaus 4711", yearOfConstruction: 1792 },
} satisfies ResourceObject;
const included: Included = [Herbert, DuftHaus, Heidi] satisfies Included;

export const TestObject = {
  id: "1",
  lid: "4711",
  type: "car",
  attributes: {
    name: "Willy",
    components: { tires: "GripTop" },
    races: ["SpeedRace", "DeathRace 3000"],
  },
  relationships: {
    driver: {
      data: toResourceIdentifier(Herbert),
      links: { self: "https://herbert.wills.wissen" },
      meta: {
        created: "2026-11-07",
      },
    },
    passengers: {
      data: [toResourceIdentifier(Heidi)],
      links: {
        object: {
          href: "https://willy.gone-wild.test",
        } satisfies LinkObject,
      },
    },
    "nested.relationship": {
      data: toResourceIdentifier(DuftHaus),
    },
  },
  links: {
    self: "https://willy.gone-wild.test",
    object: {
      href: "https://willy.gone-wild.test",
    } satisfies LinkObject,
  },
  meta: {
    direct: "foundDirect",
    nested: {
      value: "foundNested",
    },
    objects: [{ name: "Object 1" }, { name: "Object 2" }, { name: "Object 3" }],
  },
} satisfies ResourceObject;

export const doc = {
  data: TestObject,
  included: included,
  jsonapi: undefined,
  links: undefined,
  meta: undefined,
  errors: undefined,
} satisfies SingleResourceDoc;
