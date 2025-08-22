import { Links, LinksObject } from "./Links.ts";
import { MetaObject, ObjectLike, Value } from "./Types.ts";

export interface ResourceIdentifierObject {
  id: string;
  type: string;
  lid?: string;
}

export type ResourceLinkage =
  | null
  | never[]
  | ResourceIdentifierObject
  | ResourceIdentifierObject[];

export interface RelationshipObject {
  data: ResourceLinkage;
  meta?: MetaObject;
  links?: Links;
}

export interface RelationshipsObject {
  [k: string]: RelationshipObject;
}

export interface ResourceObject {
  id: string;
  type: string;
  lid?: string;
  attributes?: AttributesObject;
  relationships?: RelationshipsObject;
  links?: LinksObject;
  meta?: MetaObject;
}

export function isResourceObject(obj: ObjectLike) {
  return (
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

export type AttributesObject<
  ATTRS extends { [k: string]: Value } = { [k: string]: Value },
> = { [K in keyof ATTRS]: ATTRS[K] };
