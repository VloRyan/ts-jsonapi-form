import type { ImplementationInfo, MetaObject } from "./Types";
import type { Links, PaginationLinks } from "./Links";
import type { ErrorObject } from "./Error";
import type { ResourceObject } from "./Objects";

export interface Document<T extends PrimaryData = PrimaryData> {
  jsonapi: ImplementationInfo | undefined;
  links: Links | PaginationLinks | undefined;
  meta: MetaObject | undefined;
  errors: Errors | undefined;
  data: T | undefined;
  included: Included | undefined;
}

export interface DocWithData<T extends PrimaryData = PrimaryData>
  extends Document {
  data: T;
  included: Included | undefined;
}

export type SingleResourceDoc = DocWithData<ResourceObject>;
export type CollectionResourceDoc = DocWithData<Array<ResourceObject>>;

export type Included = ResourceObject[];

export type PrimaryData = ResourceObject | Array<ResourceObject> | null;

export type Errors = ErrorObject[];

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
