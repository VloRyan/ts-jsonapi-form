import {
  buildQueryString,
  FetchOpts,
  fetchResource,
  findInclude,
  MEDIA_TYPE,
} from "./JsonApi.ts";
import { assert, beforeEach, describe, expect, it, test } from "vitest";
import "vitest-fetch-mock";
import {
  ApiError,
  Included,
  ResourceIdentifierObject,
  ResourceObject,
  SingleResourceDoc,
} from "./model/";

describe("fetchResource", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return document", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: { id: 1, type: "test" },
      }),
      {
        status: 200,
        headers: { "Content-Type": MEDIA_TYPE },
      },
    );

    const resp = await fetchResource("http://test");

    assert(resp != null);
    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect((resp as SingleResourceDoc).data.id).eq(1);
    expect((resp as SingleResourceDoc).data.type).eq("test");

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual("http://test");
  });

  it("should return error document", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        errors: [{ title: "Ooops", detail: "error occurred" }],
      }),
      {
        status: 500,
        headers: { "Content-Type": MEDIA_TYPE },
      },
    );

    let err: ApiError | undefined;
    try {
      await fetchResource("http://error");
    } catch (error) {
      err = error as ApiError;
    }
    assert(err != null && err.errors.length === 1);
    expect(err.errors[0].title).toContain("Ooops");
    expect(err.errors[0].detail).toContain("error occurred");

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual("http://error");
  });

  it("should throw error", async () => {
    fetchMock.mockResponseOnce("", {
      status: 404,
    });
    let err: ApiError | undefined;
    try {
      await fetchResource("http://unknown");
    } catch (error) {
      err = error as ApiError;
    }
    assert(err != null && err.errors.length === 1);
    expect(err.errors[0].title).toContain("Invalid server response");

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual("http://unknown");
  });

  it("should return null", async () => {
    fetchMock.mockResponseOnce("", {
      status: 204,
    });

    const resp = await fetchResource("http://unknown");

    expect(resp).toBeNull();

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual("http://unknown");
  });
});

test.each([
  [{} satisfies FetchOpts, ""],
  [
    {
      filter: { name: "test" },
      page: { offset: 1, limit: 10 },
      includes: ["success"],
    } satisfies FetchOpts,
    "?page[offset]=1&page[limit]=10&filter[name]=test&include=success",
  ],
])("buildQueryString(%o) -> %s", (opts, expected) => {
  const got = buildQueryString(opts);

  expect(got).toBe(expected);
});

describe("findInclude", () => {
  it("should return include by id and type", async () => {
    const id = {
      id: "4711",
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = { id: "4711", type: "testType" };
    const includes: Included = [
      { id: "4711", type: "other" },
      { id: "4712", type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });

  it("should return include by lid and type", async () => {
    const id = {
      id: "",
      lid: "4711",
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = { id: "", lid: "4711", type: "testType" };
    const includes: Included = [
      { id: "4711", lid: "4711", type: "other" },
      { id: "", lid: "4712", type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });
});

describe("findIncludes", () => {
  it("should return include by id and type", async () => {
    const id = {
      id: "4711",
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = { id: "4711", type: "testType" };
    const includes: Included = [
      { id: "4711", type: "other" },
      { id: "4712", type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });

  it("should return include by lid and type", async () => {
    const id = {
      id: "",
      lid: "4711",
      type: "testType",
    } satisfies ResourceIdentifierObject;
    const expected: ResourceObject = { id: "", lid: "4711", type: "testType" };
    const includes: Included = [
      { id: "4711", lid: "4711", type: "other" },
      { id: "", lid: "4712", type: "testType" },
      expected,
    ];

    expect(findInclude(id, includes)).toBe(expected);
  });
});
