import { usePage } from "./UsePage.ts";
import { useFilter } from "./UseFilter.ts";
import { opts } from "../jsonapi/JsonApi.ts";
import { useSearch } from "wouter";

export const useQueryOpts = (init?: opts) => {
  const page = usePage();
  const filter = useFilter();
  const urlParams = new URLSearchParams(useSearch());
  return {
    page: page ?? init?.page,
    filter: filter ?? init?.filter,
    sort: urlParams.get("sort") ?? init?.sort,
    includes: init?.includes,
  } as opts;
};
