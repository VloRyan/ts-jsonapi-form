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
  return obj["id"] !== undefined && obj["type"] !== undefined;
}

export type AttributesObject<
  ATTRS extends { [k: string]: Value } = { [k: string]: Value },
> = { [K in keyof ATTRS]: ATTRS[K] };
