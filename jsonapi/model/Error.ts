import type { MetaObject } from "./Types";
import type { LinksObject } from "./Links";

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
