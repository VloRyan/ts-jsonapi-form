import {
  buildQueryString,
  fetchResource,
  MEDIA_TYPE,
  opts,
} from "./JsonApi.ts";
import { assert, beforeEach, describe, expect, it, test } from "vitest";
import "vitest-fetch-mock";
import { SingleResourceDoc } from "./model/Document.ts";
import { ApiError } from "./model/ApiError.ts";

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
  [{} satisfies opts, ""],
  [
    {
      filter: { name: "test" },
      page: { offset: 1, limit: 10 },
      includes: ["success"],
    } satisfies opts,
    "?page[offset]=1&page[limit]=10&filter[name]=test&include=success",
  ],
])("buildQueryString(%o) -> %s", (opts, expected) => {
  const got = buildQueryString(opts);

  expect(got).toBe(expected);
});
