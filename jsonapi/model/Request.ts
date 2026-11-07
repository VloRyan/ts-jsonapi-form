import type { ObjectLike } from "@jsonapi/model/Types";

export const JSONAPI_MEDIA_TYPE = "application/vnd.api+json";

export interface FetchOpts {
  page: Page | undefined;
  filter: ObjectLike | undefined;
  includes: string[] | undefined;
  sort: string | undefined;
}

export const EmptyFetchOpts: FetchOpts = {
  page: undefined,
  filter: undefined,
  includes: undefined,
  sort: undefined,
};

export interface Page {
  limit: number | undefined;
  offset: number | undefined;
}
