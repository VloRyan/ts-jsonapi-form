import { ObjectLike, Value } from "./model/";
import { FetchOpts, Page } from "./JsonApi.ts";

export const extractFilter = (search: string) => {
  if (!search) {
    return undefined;
  }
  const filter: ObjectLike = {};
  search
    .split("&")
    .filter((value) => value.startsWith("filter["))
    .forEach((value) => {
      const parts = value.split("=");
      const name = parts[0].substring("filter[".length, parts[0].length - 1);
      const nodes = name.split(".");
      let currentObject = filter;
      const nodeValue = parseValue(decodeURIComponent(parts[1]));
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (i < nodes.length - 1) {
          if (currentObject[node] === undefined) {
            currentObject[node] = {};
          }
          currentObject = currentObject[node] as ObjectLike;
        } else {
          currentObject[node] = nodeValue;
        }
      }
    });
  return Object.keys(filter).length === 0 ? undefined : filter;
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
  const opts = {
    page: extractPage(search),
    filter: extractFilter(search),
    sort: urlParams.get("sort"),
    includes: init?.includes,
  } as FetchOpts;
  if (opts.page === undefined) {
    opts.page = init?.page;
  }
  if (opts.filter === undefined) {
    opts.filter = init?.filter;
  }
  if (opts.sort === null) {
    opts.sort = init?.sort;
  }
  return opts;
};
function parseValue(value: string): Value {
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
  }
  const num = Number(value);
  if (!isNaN(num)) {
    return num;
  }
  return value;
}
