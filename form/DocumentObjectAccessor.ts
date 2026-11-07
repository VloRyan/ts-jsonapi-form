import type { AttributeValue, DocumentObject, Link } from "@jsonapi/model";
import { getValue, setValue } from "@functions";

export class DocumentObjectAccessor<T extends DocumentObject> {
  protected readonly object: T | null;

  constructor(object: T | null) {
    this.object = object;
  }

  public isNull() {
    return this.object == null;
  }

  public getLink(path: string): Link | undefined {
    if (!this.object?.links) {
      return;
    }
    return getValue(this.object.links, path);
  }

  public setLink(path: string, link: Link) {
    if (!this.object) {
      return;
    }
    if (!this.object.links) {
      this.object.links = {};
    }
    this.object.links[path] = link;
  }

  public getMeta(path: string): AttributeValue {
    if (!this.object?.meta) {
      return;
    }
    return getValue(this.object.meta, path);
  }

  public setMeta(path: string, value: AttributeValue) {
    if (!this.object) {
      return;
    }
    if (!this.object.meta) {
      this.object.meta = {};
    }
    setValue(this.object.meta, path, value);
  }
}
