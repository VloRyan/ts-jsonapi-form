import { ObjectLike } from "./model/";
import { FetchOpts, Page } from "./JsonApi.ts";

export const extractFilter = (search: string) => {
  const filter: ObjectLike = {};
  if (!search) {
    return filter;
  }
  search
    .split("&")
    .filter((value) => value.startsWith("filter["))
    .forEach((value) => {
      const parts = value.split("=");
      const name = parts[0].substring("filter[".length, parts[0].length - 1);
      filter[name] = parts[1];
    });
  return filter;
};

export function extractPage(search: string): Page | undefined {
  const urlParams = new URLSearchParams(search);
  const page = {
    limit: urlParams.has("page[limit]")
      ? +(urlParams.get("page[limit]") as string)
      : undefined,
    offset: urlParams.has("page[offset]")
      ? +(urlParams.get("page[offset]") as string)
      : undefined,
  } satisfies Page;
  if (!page.limit && !page.offset) {
    return undefined;
  }
  return page;
}

export const extractFetchOpts = (search: string, init?: FetchOpts) => {
  const urlParams = new URLSearchParams(search);
  return {
    page: init?.page ? init.page : extractPage(search),
    filter: init?.filter ? init.filter : extractFilter(search),
    sort: urlParams.get("sort") ?? init?.sort,
    includes: init?.includes,
  } as FetchOpts;
};
