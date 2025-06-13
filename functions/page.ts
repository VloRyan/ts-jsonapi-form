import { page } from "../jsonapi/JsonApi.ts";

export function extractPage(searchString: string): page {
  const urlParams = new URLSearchParams(searchString);
  return {
    limit: +getSearchParamOrDefault(urlParams, "page[limit]", "25"),
    offset: +getSearchParamOrDefault(urlParams, "page[offset]", "0"),
  } satisfies page;
}

function getSearchParam(search: URLSearchParams, name: string): string | null {
  return search.get(name);
}
function getSearchParamOrDefault(
  search: URLSearchParams,
  name: string,
  def: string,
): string {
  const value = getSearchParam(search, name);
  if (!value) {
    return def;
  }
  return value;
}
