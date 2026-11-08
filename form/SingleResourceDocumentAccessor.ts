import {
  type AnyObject,
  type ResourceIdentifierObject,
  type ResourceLinkage,
  type ResourceObject,
  type SingleResourceDoc,
} from "@jsonapi/model";

import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";
import {
  isBaseMember,
  isResourceObject,
  isSameId,
} from "@functions/resource-object";
import { DocumentObjectAccessor } from "@form/DocumentObjectAccessor";
import { RelationshipObjectAccessor } from "@form/RelationshipObjectAccessor";
import { getValue, PathElement, splitPath } from "@functions";

export class SingleResourceDocumentAccessor extends DocumentObjectAccessor<SingleResourceDoc> {
  private readonly document: SingleResourceDoc;
  private dataAccessor: ResourceObjectAccessor;

  constructor(document: SingleResourceDoc) {
    super(document);
    this.document = document;
    this.dataAccessor = new ResourceObjectAccessor(document.data);
  }

  public getData(): ResourceObjectAccessor {
    return this.dataAccessor;
  }

  public setData(data: ResourceObject) {
    if (!this.document) {
      return;
    }
    this.document.data = data;
    this.dataAccessor = new ResourceObjectAccessor(this.document.data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getResourceObjectField(path: string): any {
    if (this.dataAccessor.isNull()) {
      return undefined;
    }
    const pathElements = splitPath(path);
    const linkage = this.dataAccessor.getField(
      [pathElements[0]!],
      "relationship",
    ) as ResourceLinkage | undefined;
    if (linkage) {
      if (pathElements.length == 1) {
        return Array.isArray(linkage)
          ? linkage.map((e) => this.findInclude(e) ?? e)
          : (this.findInclude(linkage) ?? linkage);
      }
      if (Array.isArray(linkage)) {
        return undefined;
      }
      const resolved = this.findInclude(linkage);
      return resolved
        ? new ResourceObjectAccessor(resolved).getAttribute(
            pathElements.toSpliced(0, 1),
          )
        : getValue(linkage, pathElements.toSpliced(0, 1));
    }

    return this.dataAccessor.getAttribute(pathElements);
  }

  public setResourceObjectField = (
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) => {
    if (this.dataAccessor.isNull()) {
      return;
    }
    const pathElements = splitPath(path);
    if (pathElements.length == 0) {
      return;
    }
    const existingRelationship = this.dataAccessor.getRelationship(
      pathElements[0]!.name,
    );
    const isRelationshipUpdate =
      existingRelationship || this.isResourceLinkage(value);
    if (isRelationshipUpdate) {
      if (existingRelationship == undefined && pathElements.length > 1) {
        throw Error("can not create nested relationship");
      }
      if (
        (pathElements.length == 1 && pathElements[0]!.index === undefined) ||
        (pathElements.length == 2 && isBaseMember(pathElements[1]!.name))
      ) {
        const prevLinkage =
          existingRelationship && !existingRelationship.isNull()
            ? existingRelationship.getLinkage()
            : undefined;
        this.dataAccessor.setField(pathElements, value, "relationship");
        if (value == null && pathElements.length == 1 && prevLinkage) {
          if (Array.isArray(prevLinkage)) {
            prevLinkage.forEach((l) => this.removeOrphanInclude(l));
          } else {
            this.removeOrphanInclude(prevLinkage);
          }
        }
      } else if (existingRelationship) {
        this.setIncludeAttribute(existingRelationship, pathElements, value);
      }

      if (value && this.isResourceLinkage(value)) {
        if (Array.isArray(value)) {
          value.forEach((v) => this.addOrUpdateInclude(v));
        } else {
          this.addOrUpdateInclude(value);
        }
      }
      return;
    }
    this.dataAccessor.setAttribute(pathElements, value);
  };

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

  private setIncludeAttribute(
    relationship: RelationshipObjectAccessor,
    pathElements: PathElement[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) {
    const linkage = relationship.getLinkage(pathElements[0]!.index);
    if (linkage != undefined && !Array.isArray(linkage)) {
      const include = this.findInclude(linkage);
      if (include) {
        new ResourceObjectAccessor(include).setAttribute(
          pathElements.toSpliced(0, 1),
          value,
        );
      }
    }
  }

  private isResourceLinkage(obj: AnyObject) {
    if (!obj) {
      return false;
    }
    return (
      (Array.isArray(obj) && isResourceObject(obj[0])) || isResourceObject(obj)
    );
  }
}
