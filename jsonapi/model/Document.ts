import { ImplementationInfo, MetaObject } from "./Types.ts";
import { Links, PaginationLinks } from "./Links.ts";
import { ErrorObject } from "./Error.ts";
import { ResourceObject } from "./Objects.ts";

export interface Document<T extends PrimaryData = PrimaryData> {
  jsonapi?: ImplementationInfo;
  links: Links | PaginationLinks;
  meta: MetaObject;
  errors: Errors;
  data: T;
  included?: Included;
}

export interface DocWithData<T extends PrimaryData = PrimaryData>
  extends Document {
  data: T;
  included?: Included;
}

export type SingleResourceDoc = DocWithData<ResourceObject>;
export type CollectionResourceDoc = DocWithData<Array<ResourceObject>>;

export type Included = ResourceObject[];

export type PrimaryData = ResourceObject | Array<ResourceObject>;

export type Errors = ErrorObject[];

export function createDocument(data: ResourceObject | ResourceObject[]) {
  const doc: Document = {
    data: data,
    errors: [],
    links: {},
    meta: {},
  };
  return doc;
}
