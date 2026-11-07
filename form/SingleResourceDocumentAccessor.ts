import {
  type ResourceIdentifierObject,
  type ResourceObject,
  type SingleResourceDoc,
} from "@jsonapi/model";

import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";
import { isSameId } from "@functions/resource-object";
import { DocumentObjectAccessor } from "@form/DocumentObjectAccessor";
import { RelationshipObjectAccessor } from "@form/RelationshipObjectAccessor";

export class SingleResourceDocumentAccessor extends DocumentObjectAccessor<SingleResourceDoc> {
  private readonly document: SingleResourceDoc;
  private objectAccessor: ResourceObjectAccessor;

  constructor(document: SingleResourceDoc) {
    super(document);
    this.document = document;
    this.objectAccessor = new ResourceObjectAccessor(document.data);
  }

  public getData(): ResourceObjectAccessor {
    return this.objectAccessor;
  }

  public setData(data: ResourceObject) {
    if (!this.document) {
      return;
    }
    this.document.data = data;
    this.objectAccessor = new ResourceObjectAccessor(this.document.data);
  }

  public getIncludes() {
    if (!this.document) {
      return undefined;
    }
    return this.document.included;
  }

  public addOrUpdateInclude(value: ResourceObject) {
    let found = false;
    for (let i = 0; i < (this.document.included?.length ?? 0); i++) {
      if (isSameId(this.document.included![i]!, value)) {
        found = true;
        this.document.included![i] = value;
        break;
      }
    }
    if (!found) {
      if (!this.document.included) {
        this.document.included = [];
      }
      this.document.included.push(value);
    }
  }

  public removeOrphanInclude(id: ResourceIdentifierObject) {
    if (!this.document) {
      return;
    }
    for (const name in this.document.data.relationships) {
      const relationship = this.document.data.relationships[name];
      if (!relationship || !relationship!.data) {
        continue;
      }
      const accessor = new RelationshipObjectAccessor(relationship);
      let referenceFound = false;
      accessor.forEach((identifier) => {
        if (isSameId(identifier, id)) {
          referenceFound = true;
          return;
        }
      });
      if (referenceFound) {
        return;
      }
    }
    this.document!.included = this.document!.included!.filter(
      (inc) => !isSameId(inc, id),
    )!;
  }

  public findInclude(id: ResourceIdentifierObject) {
    if (!this.document?.included || !id) {
      return null;
    }
    for (const include of this.document.included) {
      if (isSameId(include, id)) {
        return include;
      }
    }
    return null;
  }
}
