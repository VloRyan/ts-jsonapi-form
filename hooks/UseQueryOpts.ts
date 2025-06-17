import { usePage } from "./UsePage.ts";
import { useFilter } from "./UseFilter.ts";
import { FetchOpts } from "../jsonapi/JsonApi.ts";

export const useQueryOpts = (init?: FetchOpts) => {
  const page = usePage();
  const filter = useFilter();
  const urlParams = new URLSearchParams(window.location.search);
  return {
    page: page ?? init?.page,
    filter: filter ?? init?.filter,
    sort: urlParams.get("sort") ?? init?.sort,
    includes: init?.includes,
  } as FetchOpts;
};
