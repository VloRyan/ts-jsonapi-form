import type {
  DocumentObject,
  Errors,
  ImplementationInfo,
  MetaObject,
  PrimaryData,
  ResourceIdentifierObject,
} from "@jsonapi/model";

export type OperationType = "add" | "update" | "remove";

export interface AtomicOperationsDocument extends DocumentObject {
  "atomic:operations": Operation[];
  jsonapi?: ImplementationInfo | undefined;
}

export interface AtomicResultsDocument extends DocumentObject {
  "atomic:results"?: Result[];
  jsonapi?: ImplementationInfo | undefined;
  errors?: Errors | undefined;
}

export interface Operation {
  op?: OperationType;
  ref?: ResourceIdentifierObject;
  href?: string;
  data?: PrimaryData;
  meta?: MetaObject;
}

export interface Result {
  data?: PrimaryData;
  meta?: MetaObject;
}
