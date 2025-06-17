import { describe, expect, it, beforeEach } from "vitest";
import { vi } from "vitest";
import { usePage } from "./UsePage";
import { Page } from "../jsonapi/JsonApi";

describe("usePage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return default page on empty query", async () => {
    const expectedPage = {
      limit: 25,
      offset: 0,
    } satisfies Page;
    vi.stubGlobal("location", {});
    const page = usePage();
    expect(page).toEqual(expectedPage);
  });

  it("should page with limit on query with limit", async () => {
    const expectedPage = {
      limit: 5,
      offset: 0,
    } satisfies Page;
    vi.stubGlobal("location", { search: "page[limit]=5" });
    const page = usePage();
    expect(page).toEqual(expectedPage);
  });

  it("should page with offset on query with offset", async () => {
    const expectedPage = {
      limit: 25,
      offset: 1,
    } satisfies Page;
    vi.stubGlobal("location", { search: "page[offset]=1" });
    const page = usePage();
    expect(page).toEqual(expectedPage);
  });
});
