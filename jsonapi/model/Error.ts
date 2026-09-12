import type { LinksObject, MetaObject } from "@jsonapi/model";

export interface ErrorObject {
  id?: number | string;
  links?: LinksObject;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  meta?: MetaObject;
}
