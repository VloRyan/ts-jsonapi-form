import {
  getValue,
  PathElement,
  setValue,
  splitPath,
  traversePath,
} from "@functions/object";
import {
  type AnyObject,
  type AttributeValue,
  type RelationshipObject,
  type ResourceLinkage,
  type ResourceObject,
} from "@jsonapi/model";
import {
  isBaseMember,
  isResourceObject,
  toResourceIdentifier,
} from "@functions/resource-object";
import { RelationshipObjectAccessor } from "@form/RelationshipObjectAccessor";
import { DocumentObjectAccessor } from "@form/DocumentObjectAccessor";

export type FieldType = "attribute" | "relationship";

export class ResourceObjectAccessor extends DocumentObjectAccessor<ResourceObject> {
  public getId() {
    return this.object?.id;
  }

  public getLid() {
    return this.object?.lid;
  }

  public getType() {
    return this.object?.type;
  }

  public getAttribute(path: string | PathElement[]): AttributeValue {
    if (!this.object) {
      return undefined;
    }
    const pathElements = typeof path == "string" ? splitPath(path) : path;

    if (pathElements.length == 1 && isBaseMember(pathElements[0]!.name)) {
      return getValue(this.object, pathElements[0]!.name);
    }

    const traversedPath = traversePath(this.object.attributes, pathElements);
    if (traversedPath.length - 1 == pathElements.length) {
      return traversedPath[traversedPath.length - 1]!.value;
    }
    return undefined;
  }

  public setAttribute = (
    path: string | PathElement[],
    value: Exclude<AttributeValue, undefined>,
  ) => {
    if (!this.object) {
      return;
    }
    const pathElements = typeof path == "string" ? splitPath(path) : path;
    setValue(
      pathElements.length == 1 && isBaseMember(pathElements[0]!.name)
        ? this.object
        : this.object.attributes,
      pathElements,
      value,
    );
  };

  public getRelationship(name: string): RelationshipObjectAccessor | undefined {
    if (!this.object?.relationships) {
      return undefined;
    }
    const relationship = this.object.relationships[name];
    if (!relationship) {
      return undefined;
    }
    return new RelationshipObjectAccessor(relationship);
  }

  public setRelationship(name: string, relationship: RelationshipObject) {
    if (!this.object) {
      return;
    }
    const nameElements = splitPath(name);
    if (nameElements.length > 1 || nameElements[0]!.index !== undefined) {
      return;
    }
    if (!this.object.relationships) {
      this.object.relationships = {};
    }
    this.object.relationships[name] = relationship;
  }

  public getField(
    path: string | PathElement[],
    source: FieldType | undefined = undefined,
  ): AttributeValue | ResourceLinkage {
    if (!this.object) {
      return;
    }
    const pathElements = typeof path == "string" ? splitPath(path) : path;
    if (
      this.object.relationships &&
      pathElements.length < 3 &&
      ["relationship", undefined].includes(source)
    ) {
      const relationship = this.object.relationships[pathElements[0]!.name];
      if (relationship) {
        const linkage =
          pathElements[0]!.index != undefined
            ? Array.isArray(relationship.data)
              ? relationship.data[pathElements[0]!.index]
              : undefined
            : relationship.data;
        if (!linkage) {
          return undefined;
        }
        return pathElements.length == 1
          ? linkage
          : getValue(linkage, pathElements.toSpliced(0, 1));
      }
    }
    if (["attribute", undefined].includes(source)) {
      return this.getAttribute(pathElements);
    }
    return undefined;
  }
  public setField(
    path: string | PathElement[],
    value:
      Exclude<AttributeValue, undefined> | ResourceObject | ResourceObject[],
    destination: FieldType | undefined = undefined,
  ) {
    if (!this.object) {
      return;
    }
    const pathElements = typeof path == "string" ? splitPath(path) : path;
    if (["relationship", undefined].includes(destination)) {
      const handled = this.setRelationshipField(pathElements, value);
      if (handled) {
        return;
      }
    }
    if (["attribute", undefined].includes(destination)) {
      this.setAttribute(
        pathElements,
        value as Exclude<AttributeValue, undefined>,
      );
    }
  }

  private setRelationshipField(
    pathElements: PathElement[],
    value:
      Exclude<AttributeValue, undefined> | ResourceObject | ResourceObject[],
  ): boolean {
    const existingRelationship =
      this.object!.relationships && pathElements[0]!.index === undefined
        ? this.object!.relationships[pathElements[0]!.name]
        : undefined;
    if (existingRelationship) {
      if (pathElements.length == 1) {
        if (value !== null) {
          if (
            isResourceObject(value as unknown as AnyObject) ||
            (Array.isArray(value) &&
              isResourceObject(value[0] as unknown as AnyObject))
          ) {
            existingRelationship.data = Array.isArray(value)
              ? value.map((v) =>
                  toResourceIdentifier(v as unknown as ResourceObject),
                )
              : toResourceIdentifier(value as unknown as ResourceObject);
          }
        } else {
          existingRelationship.data = null;
        }
        // reset
        delete existingRelationship.links;
        delete existingRelationship.meta;
      } else if (
        pathElements.length == 2 &&
        isBaseMember(pathElements[1]!.name)
      ) {
        const linkage =
          pathElements[1]!.index != undefined
            ? Array.isArray(existingRelationship.data)
              ? existingRelationship.data[pathElements[1]!.index]
              : undefined
            : existingRelationship.data;
        if (linkage) {
          setValue(linkage, pathElements[1]!.name, value);
        }
      }
      return true;
    }
    if (
      isResourceObject(value as unknown as AnyObject) ||
      (Array.isArray(value) &&
        isResourceObject(value[0] as unknown as AnyObject))
    ) {
      if (pathElements.length == 1 && pathElements[0]!.index === undefined) {
        if (!this.object!.relationships) {
          this.object!.relationships = {};
        }
        const linkage = Array.isArray(value)
          ? value.map((v) =>
              toResourceIdentifier(v as unknown as ResourceObject),
            )
          : toResourceIdentifier(value as unknown as ResourceObject);
        this.object!.relationships[pathElements[0]!.name] = { data: linkage };
      }
      return true;
    }
    return false;
  }
}
