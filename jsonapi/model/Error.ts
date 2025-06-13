import { MetaObject } from "./Types.ts";
import { Links } from "./Links.ts";

export interface ErrorObject {
  id?: number | string;
  links?: Links;
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
