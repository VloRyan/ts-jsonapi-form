import {
  MetaObject,
  Links,
  PaginationLinks,
  Errors,
  PrimaryData,
  ResourceIdentifierObject,
} from "../../model";

export type OperationType = "add" | "update" | "remove";

export interface AtomicOperationsDocument {
  "atomic:operations"?: Operation[];
  "atomic:results"?: Result[];
  links?: Links | PaginationLinks;
  meta?: MetaObject;
  errors?: Errors;
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
