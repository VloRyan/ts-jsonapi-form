import { fetchResource } from "@jsonapi";
import { assert, beforeEach, describe, expect, it } from "vitest";
import "vitest-fetch-mock";
import { JSONAPI_MEDIA_TYPE, type ApiError } from "@jsonapi/model";
import {
  JSONAPI_ATOMIC_MEDIA_TYPE,
  postOperations,
} from "@jsonapi/atomic-operations/api";
import type { AtomicOperationsDocument } from "@jsonapi/atomic-operations/model";

describe("postOperations", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return document", async () => {
    const expectedResults = [
      {
        data: {
          links: {
            self: "http://example.com/blogPosts/13",
          },
          type: "articles",
          id: "13",
          attributes: {
            title: "JSON API paints my bikeshed!",
          },
        },
      },
    ];
    fetchMock.mockResponseOnce(
      JSON.stringify({
        "atomic:results": expectedResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": JSONAPI_ATOMIC_MEDIA_TYPE },
      },
    );

    const resp = await postOperations("http://test/operations", {
      "atomic:operations": [
        {
          op: "add",
          href: "/blogPosts",
          data: {
            type: "articles",
            attributes: {
              title: "JSON API paints my bikeshed!",
            },
          },
        },
      ],
    } satisfies AtomicOperationsDocument);

    assert(resp != null);
    expect(resp.errors).toBeUndefined();
    expect(resp["atomic:results"]).toBeDefined();
    expect(resp["atomic:results"]).toEqual(expectedResults);
  });

  it("should return error document", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        errors: [{ title: "Ooops", detail: "error occurred" }],
      }),
      {
        status: 500,
        headers: { "Content-Type": JSONAPI_MEDIA_TYPE },
      },
    );

    let err: ApiError | undefined;
    try {
      await fetchResource("http://error");
    } catch (error) {
      err = error as ApiError;
    }
    assert(err != null && err.errors.length === 1);
    expect(err.errors[0]!.title).toContain("Ooops");
    expect(err.errors[0]!.detail).toContain("error occurred");

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0]![0]).toEqual("http://error");
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
    expect(err.errors[0]!.title).toContain("Invalid server response");

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0]![0]).toEqual("http://unknown");
  });

  it("should return null", async () => {
    fetchMock.mockResponseOnce({
      status: 204,
    });

    const resp = await fetchResource("http://unknown");

    expect(resp).toBeNull();

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0]![0]).toEqual("http://unknown");
  });
});
