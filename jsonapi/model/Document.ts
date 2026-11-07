import type {
  AnyObject,
  DocumentObject,
  ErrorObject,
  ImplementationInfo,
  ResourceObject,
} from "@jsonapi/model";

export interface Document<T extends PrimaryData = PrimaryData>
  extends AnyObject, DocumentObject {
  jsonapi: ImplementationInfo | undefined;
  errors: Errors | undefined;
  data: T | undefined;
  included: Included | undefined;
}

export interface DocWithData<
  T extends PrimaryData = PrimaryData,
> extends Document {
  data: T;
}
export interface DocWithErrors extends Document<null> {
  errors: Errors | undefined;
}

export type SingleResourceDoc = DocWithData<ResourceObject>;
export type CollectionResourceDoc = DocWithData<Array<ResourceObject>>;

export type Included = ResourceObject[];

export type PrimaryData = ResourceObject | Array<ResourceObject> | null;

export type Errors = ErrorObject[];
