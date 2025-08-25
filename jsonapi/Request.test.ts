import { describe, expect, it } from "vitest";
import { FetchOpts, Page } from "./";
import { extractFetchOpts, extractFilter, extractPage } from "./Request.ts";
import { ObjectLike } from "./model/";

describe("extractFilter", () => {
  it("should return undefined on empty query", async () => {
    const filter = extractFilter("");

    expect(filter).toEqual(undefined);
  });

  it("should return undefined on query without filter", async () => {
    const filter = extractFilter("test=true&another=false");

    expect(filter).toEqual(undefined);
  });

  it("should return filter fields on valid query", async () => {
    const expectedFilter = {
      fieldA: "1",
      fieldB: "2",
    } satisfies ObjectLike;

    const filter = extractFilter("filter[fieldA]=1&filter[fieldB]=2");

    expect(filter).toEqual(expectedFilter);
  });

  it("should return decoded filter fields on valid query with encoded uri", async () => {
    const expectedFilter = {
      fieldA: "C&A",
    } satisfies ObjectLike;

    const filter = extractFilter("filter[fieldA]=C%26A");

    expect(filter).toEqual(expectedFilter);
  });
});

describe("extractPage", () => {
  it("should return undefined on empty query", async () => {
    const expectedPage = undefined;

    const page = extractPage("");

    expect(page).toEqual(expectedPage);
  });

  it("should page with limit on query with limit", async () => {
    const expectedPage = {
      limit: 5,
      offset: undefined,
    } satisfies Page;

    const page = extractPage("page[limit]=5");

    expect(page).toEqual(expectedPage);
  });

  it("should page with offset on query with offset", async () => {
    const expectedPage = {
      limit: undefined,
      offset: 1,
    } satisfies Page;

    const page = extractPage("page[offset]=1");

    expect(page).toEqual(expectedPage);
  });
});

const defaultOps = {
  filter: undefined,
  includes: undefined,
  page: undefined,
  sort: undefined,
} satisfies FetchOpts;

describe("extractFetchOpts", () => {
  it("should return default page on empty opts", async () => {
    const expectedOpts = defaultOps;

    const opts = extractFetchOpts("");

    expect(opts).toEqual(expectedOpts);
  });

  it("should return page on opts with page", async () => {
    const expectedPage = { offset: 1, limit: 2 } satisfies Page;
    const expectedOpts = { ...defaultOps, page: expectedPage };

    const opts = extractFetchOpts("", { page: expectedPage });

    expect(opts).toEqual(expectedOpts);
  });

  it("should return filter on opts with filter", async () => {
    const expectedFilter = { a: "B" };
    const expectedOpts = { ...defaultOps, filter: expectedFilter };

    const opts = extractFetchOpts("", { filter: expectedFilter });

    expect(opts).toEqual(expectedOpts);
  });

  it("should return sort on opts with sort", async () => {
    const expectedSort = "-fieldA";
    const expectedOpts = { ...defaultOps, sort: expectedSort };

    const opts = extractFetchOpts("", { sort: expectedSort });

    expect(opts).toEqual(expectedOpts);
  });

  it("should return includes on opts with includes", async () => {
    const expectedIncludes = ["fieldA"];
    const expectedOpts = { ...defaultOps, includes: expectedIncludes };

    const opts = extractFetchOpts("", { includes: expectedIncludes });

    expect(opts).toEqual(expectedOpts);
  });
});
