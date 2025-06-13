import { Link } from "./Types.ts";

export interface Links {
  self?: Link;
  related?: Link;
}

export type LinksObject<
  ATTRS extends { [k: string]: Link } = { [k: string]: Link },
> = { [K in keyof ATTRS]: ATTRS[K] };

export interface PaginationLinks {
  first?: Link | null;
  last?: Link | null;
  prev?: Link | null;
  next?: Link | null;
}
