import type {
  AttributeValue,
  Link,
  RelationshipObject,
  ResourceIdentifierObject,
  ResourceLinkage,
} from "@jsonapi/model";
import { getValue, setValue } from "@functions";
import { DocumentObjectAccessor } from "@form/DocumentObjectAccessor";

export class RelationshipObjectAccessor extends DocumentObjectAccessor<RelationshipObject> {
  public isArrayLinkage() {
    return Array.isArray(this.object?.data);
  }

  public getLinkage(
    index: number | undefined = undefined,
  ): ResourceLinkage | undefined {
    if (this.object == null || this.object.data == null) {
      return undefined;
    }
    if (this.isArrayLinkage()) {
      const linkage = this.object.data as ResourceIdentifierObject[];
      return index != undefined ? linkage[index] : linkage;
    } else {
      const linkage = this.object.data as ResourceIdentifierObject;
      return index == undefined ? linkage : undefined;
    }
  }

  public forEach(fn: (identifier: ResourceIdentifierObject) => void) {
    if (this.object == null || this.object.data == null) {
      return;
    }
    if (this.isArrayLinkage()) {
      const linkage = this.object.data as ResourceIdentifierObject[];
      linkage.forEach((l) => fn(l));
    } else {
      const linkage = this.object.data as ResourceIdentifierObject;
      fn(linkage);
    }
  }

  public setLinkage(linkage: ResourceLinkage) {
    if (this.object == null) {
      return undefined;
    }
    this.object.data = linkage;
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
