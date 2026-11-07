import {
  type DocWithData,
  type Included,
  type ResourceIdentifierObject,
  type ResourceObject,
} from "@jsonapi/model";
import { isSameId } from "@functions/resource-object";

export function findInclude(id: ResourceIdentifierObject, includes: Included) {
  for (const obj of includes) {
    if (isSameId(obj, id)) {
      return obj;
    }
  }
  return null;
}

export function createDocument(
  data: ResourceObject | ResourceObject[],
  included?: Included,
) {
  return {
    data: data,
    included: included,
    jsonapi: undefined,
    links: undefined,
    meta: undefined,
    errors: undefined,
  } satisfies DocWithData;
}
