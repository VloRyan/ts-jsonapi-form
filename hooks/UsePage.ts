import { Page } from "../jsonapi/JsonApi";

export const usePage = () => {
  const searchString = window.location.search;
  return extractPage(searchString);
};

function extractPage(searchString: string): Page {
  const urlParams = new URLSearchParams(searchString);
  return {
    limit: +(urlParams.has("page[limit]")
      ? (urlParams.get("page[limit]") as string)
      : "25"),
    offset: +(urlParams.has("page[offset]")
      ? (urlParams.get("page[offset]") as string)
      : "0"),
  } satisfies Page;
}
