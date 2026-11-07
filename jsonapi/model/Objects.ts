import type { LinksObject, MetaObject, AttributeValue } from "@jsonapi/model";

export interface ResourceIdentifierObject {
  id?: string | undefined;
  type: string;
  lid?: string | undefined;
  meta?: MetaObject | undefined;
}
export type ResourceLinkage =
  ResourceIdentifierObject | ResourceIdentifierObject[] | null;

export interface DocumentObject {
  meta?: MetaObject | undefined;
  links?: LinksObject | undefined;
}

export interface RelationshipObject extends DocumentObject {
  data: ResourceLinkage;
}

export interface RelationshipsObject {
  [k: string]: RelationshipObject;
}

export interface ResourceObject
  extends ResourceIdentifierObject, DocumentObject {
  attributes?: AttributesObject;
  relationships?: RelationshipsObject;
}

export type AttributesObject<
  ATTRS extends { [k: string]: AttributeValue } = {
    [k: string]: AttributeValue;
  },
> = { [K in keyof ATTRS]: ATTRS[K] };
