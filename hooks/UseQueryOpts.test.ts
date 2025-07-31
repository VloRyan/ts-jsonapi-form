import { beforeEach, describe, expect, it, vi } from "vitest";
import { FetchOpts, Page } from "../jsonapi/JsonApi.ts";
import { useQueryOpts } from "./UseQueryOpts.ts";
const defaultOps = {
  filter: {},
  includes: undefined,
  page: {
    limit: 25,
    offset: 0,
  },
  sort: undefined,
} satisfies FetchOpts;

describe("useQueryOpts", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("location", {});
  });

  it("should return default page on empty opts", async () => {
    const expectedOpts = defaultOps;

    const opts = useQueryOpts();

    expect(opts).toEqual(expectedOpts);
  });

  it("should return page on opts with page", async () => {
    const expectedPage = { offset: 1, limit: 2 } satisfies Page;
    const expectedOpts = { ...defaultOps, page: expectedPage };
    vi.stubGlobal("location", {});

    const opts = useQueryOpts({ page: expectedPage });

    expect(opts).toEqual(expectedOpts);
  });

  it("should return filter on opts with filter", async () => {
    const expectedFilter = { a: "B" };
    const expectedOpts = { ...defaultOps, filter: expectedFilter };

    const opts = useQueryOpts({ filter: expectedFilter });

    expect(opts).toEqual(expectedOpts);
  });

  it("should return sort on opts with sort", async () => {
    const expectedSort = "-fieldA";
    const expectedOpts = { ...defaultOps, sort: expectedSort };

    const opts = useQueryOpts({ sort: expectedSort });

    expect(opts).toEqual(expectedOpts);
  });

  it("should return includes on opts with includes", async () => {
    const expectedIncludes = ["fieldA"];
    const expectedOpts = { ...defaultOps, includes: expectedIncludes };

    const opts = useQueryOpts({ includes: expectedIncludes });

    expect(opts).toEqual(expectedOpts);
  });
});
