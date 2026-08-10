import type {
  Included,
  LinkObject,
  ResourceIdentifierObject,
  ResourceObject,
  SingleResourceDoc,
} from "../jsonapi/model";

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

const obj = {
  id: "1",
  lid: undefined,
  type: "car",
  attributes: {
    name: "Willy",
    components: { tires: "GripTop" },
    races: ["SpeedRace", "DeathRace 3000"],
  },
  relationships: {
    driver: {
      data: { id: "2", lid: undefined, type: "human" },
    },
    passengers: {
      data: [
        {
          id: Heidi.id,
          lid: undefined,
          type: Heidi.type,
        } satisfies ResourceIdentifierObject,
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

export const DuftHaus = {
  id: "4711",
  lid: undefined,
  type: "building",
  attributes: { name: "Dufthaus 4711", yearOfConstruction: 1792 },
} satisfies ResourceObject;
const included: Included = [Herbert, DuftHaus, Heidi] satisfies Included;

export const doc = {
  data: obj,
  included: included,
  jsonapi: undefined,
  links: undefined,
  meta: undefined,
  errors: undefined,
} satisfies SingleResourceDoc;
