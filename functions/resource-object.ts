import type {
  AnyObject,
  ResourceIdentifierObject,
  ResourceObject,
} from "@jsonapi/model";

export const BaseMembers: string[] = ["id", "type", "lid"];

export function isBaseMember(name: string) {
  return BaseMembers.includes(name);
}

export function isResourceObject(obj: AnyObject) {
  return (
    obj &&
    obj["type"] !== undefined &&
    (obj["id"] !== undefined || obj["lid"] !== undefined)
  );
}

export function isSameId(
  a: ResourceObject | ResourceIdentifierObject,
  b: ResourceObject | ResourceIdentifierObject,
) {
  return a.type === b.type && a.id === b.id && a.lid === b.lid;
}

export function toResourceIdentifier(
  obj: ResourceObject,
): ResourceIdentifierObject {
  return { id: obj.id, type: obj.type, lid: obj.lid };
}
