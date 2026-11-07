import { describe, expect, it } from "vitest";

import { doc, Heidi, Herbert } from "@form/test_data";
import { SingleResourceDocumentAccessor } from "@form/SingleResourceDocumentAccessor";
import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";
import type { ResourceObject } from "@jsonapi/model";
import { isSameId, toResourceIdentifier } from "@functions/resource-object";

describe("getData", () => {
  it("should return data", () => {
    const accessor = new SingleResourceDocumentAccessor(doc);

    // direct comparison fails due to lambdas
    expect(JSON.stringify(accessor.getData())).toEqual(
      JSON.stringify(new ResourceObjectAccessor(doc.data)),
    );
  });
});

describe("setData", () => {
  it("should update data", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    const newData = {
      id: "new id",
      type: "plain",
    } satisfies ResourceObject;

    accessor.setData(newData);

    expect(accessor.getData().getId()).toBe("new id");
    expect(accessor.getData().getType()).toBe("plain");
  });
});

describe("addOrUpdateInclude", () => {
  it("should add include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    const newInclude = {
      id: "new id",
      type: "plain",
    } satisfies ResourceObject;

    accessor.addOrUpdateInclude(newInclude);

    expect(accessor.getIncludes()).toEqual([...doc.included, newInclude]);
  });

  it("should update include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    const modifiedInclude = {
      ...Herbert,
      attributes: {
        name: "Jochen",
      },
    } satisfies ResourceObject;

    accessor.addOrUpdateInclude(modifiedInclude);

    expect(accessor.getIncludes()?.sort()).toEqual([
      modifiedInclude,
      ...doc.included.filter((e) => !isSameId(e, Herbert)),
    ]);
  });
});

describe("removeIncludeIfNotBelongsToOther", () => {
  it("should remove unreferenced include", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);
    document!.data!.relationships!.driver!.data.id = "unset";

    accessor.removeOrphanInclude(doc!.data!.relationships!.driver!.data);

    expect(accessor.getIncludes()).toEqual(
      doc.included.filter((e) => !isSameId(e, Herbert)),
    );
  });

  it("should do nothing if include is still referenced", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.removeOrphanInclude(toResourceIdentifier(Heidi));

    expect(accessor.getIncludes()).toEqual(doc.included);
  });

  it("should do nothing if include is not found", () => {
    const document = structuredClone(doc);
    const accessor = new SingleResourceDocumentAccessor(document);

    accessor.removeOrphanInclude({ id: "invalid", type: "human" });

    expect(accessor.getIncludes()).toEqual(doc.included);
  });
});
