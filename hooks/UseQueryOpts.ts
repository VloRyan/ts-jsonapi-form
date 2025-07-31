import { usePage } from "./UsePage.ts";
import { useFilter } from "./UseFilter.ts";
import { FetchOpts } from "../jsonapi/JsonApi.ts";

export const useQueryOpts = (init?: FetchOpts) => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    page: init?.page ? init.page : usePage(),
    filter: init?.filter ? init.filter : useFilter(),
    sort: urlParams.get("sort") ?? init?.sort,
    includes: init?.includes,
  } as FetchOpts;
};
