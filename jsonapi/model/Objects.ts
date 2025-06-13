import { Links, LinksObject } from "./Links.ts";
import { MetaObject, Value } from "./Types.ts";

export interface ResourceIdentifierObject {
  id: string;
  lid?: string;
  type: string;
}

export type ResourceLinkage =
  | null
  | never[]
  | ResourceIdentifierObject
  | ResourceIdentifierObject[];

export interface RelationshipObject {
  meta: MetaObject;
  data: ResourceLinkage;
  links: Links;
}

export interface RelationshipsObject {
  [k: string]: RelationshipObject;
}

export interface ResourceObject {
  id: string;
  lid?: string;
  type: string;
  attributes?: AttributesObject;
  relationships?: RelationshipsObject;
  links?: LinksObject;
  meta: MetaObject;
}

export type AttributesObject<
  ATTRS extends { [k: string]: Value } = { [k: string]: Value },
> = { [K in keyof ATTRS]: ATTRS[K] };
