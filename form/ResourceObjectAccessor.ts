import { getValue, setValue } from "@functions/object";
import {
  isResourceObject,
  type ObjectLike,
  type RelationshipObject,
  type ResourceIdentifierObject,
  type ResourceObject,
  toResourceIdentifier,
  type Value,
} from "@jsonapi/model";

export class ResourceObjectAccessor {
  private readonly object: ResourceObject | null;

  constructor(object: ResourceObject | null) {
    this.object = object;
  }

  public isNull() {
    return this.object == null;
  }

  /**
   * Resolve the path to get the value from the attributes or relationships.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getValue(path: string): any | undefined {
    const attribValue = this.getAttributeValue(path);
    if (attribValue !== undefined) {
      return attribValue;
    }
    const parts = path.split(".");
    const lastPart = parts[parts.length - 1]!;
    if (this.isBaseAttribute(lastPart) && parts.length > 1) {
      const relId = this.getRelationshipResourceIdentifier(
        parts.toSpliced(parts.length - 1, 1).join("."),
      );
      if (!relId) {
        return undefined;
      }
      return getValue(relId, lastPart);
    }
    const relationship = this.getRelationship(path);
    return relationship ? relationship : undefined;
  }

  public setValue = (path: string, value: Value | ResourceObject[]) => {
    if (!this.object) {
      return;
    }
    if (
      value &&
      (isResourceObject(value as ObjectLike) ||
        (Array.isArray(value) && isResourceObject(value[0] as ObjectLike)))
    ) {
      const relation = {
        data: Array.isArray(value)
          ? (value as ResourceObject[]).map((r) => toResourceIdentifier(r))
          : toResourceIdentifier(value as unknown as ResourceObject),
      } satisfies RelationshipObject;
      this.setRelationship(path, relation);
      return;
    }

    const parts = path.split(".");
    const lastPart = parts[parts.length - 1]!;
    if (this.isBaseAttribute(lastPart)) {
      const relId = this.getRelationshipResourceIdentifier(
        parts.toSpliced(parts.length - 1, 1).join("."),
      );
      if (relId) {
        setValue(relId, lastPart, value);
        return;
      }
    }
    const relationship = this.getRelationship(path);
    if (relationship) {
      relationship.data = null;
    }

    this.setAttributeValue(path, value);
  };

  public getLink(path: string): unknown {
    if (!this.object?.links) {
      return;
    }
    return getValue(this.object.links, path);
  }

  public getId() {
    return this.object?.id;
  }

  public hasId() {
    const id = this.getId();
    return id != undefined && id !== "";
  }

  public getMetaValue(path: string): unknown {
    if (!this.object) {
      return null;
    }
    return getValue(this.object.meta, path);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public setMetaValue(path: string, value: any): unknown {
    if (!this.object) {
      return null;
    }
    return setValue(this.object.meta, path, value);
  }

  public getRelationship(path: string): RelationshipObject | null {
    if (!this.object?.relationships) {
      return null;
    }
    if (!Object.keys(this.object.relationships).includes(path)) {
      return null;
    }
    return this.object.relationships[path]!;
  }

  public getRelationshipResourceIdentifier(
    path: string,
  ): ResourceIdentifierObject | null {
    if (!this.object?.relationships) {
      return null;
    }
    let arrIndex = -1;
    const arrStart = path.lastIndexOf("[");
    if (arrStart > -1) {
      arrIndex = +path.substring(arrStart + 1, path.lastIndexOf("]"));
      path = path.substring(0, arrStart);
    }
    const relationship = this.getRelationship(path);
    if (!relationship) {
      return null;
    }
    if (Array.isArray(relationship.data)) {
      const relationships = relationship.data as ResourceIdentifierObject[];
      if (arrIndex == -1) {
        return null;
      }
      if (relationships.length < arrIndex) {
        return null;
      }
      return relationships[arrIndex]!;
    }

    return relationship.data;
  }

  public setRelationship(
    path: string,
    relationship: RelationshipObject,
    onChanged?: (path: string) => void,
  ) {
    if (!this.object) {
      return;
    }
    if (!this.object.relationships) {
      this.object.relationships = {};
    }
    this.object.relationships[path] = relationship;
    if (onChanged) {
      onChanged(path);
    }
  }

  public filterRelationships(
    filter: (path: string, relationship: RelationshipObject) => boolean,
  ): { relationship: RelationshipObject; path: string }[] {
    const result: { path: string; relationship: RelationshipObject }[] = [];
    if (!this.object?.relationships) {
      return [];
    }

    for (const path of Object.keys(this.object.relationships)) {
      const relationship = this.object.relationships[path]!;
      if (filter(path, relationship)) {
        result.push({ path: path, relationship: relationship });
      }
    }
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getAttributeValue(path: string): any | undefined {
    if (!this.object) {
      return null;
    }
    if (this.isBaseAttribute(path)) {
      return getValue(this.object, path);
    }
    return getValue(this.object.attributes, path);
  }

  private setAttributeValue = (
    path: string,
    value: Value | ResourceObject[],
  ): boolean => {
    if (!this.object) {
      return false;
    }
    if (this.isBaseAttribute(path)) {
      setValue(this.object, path, value);
    } else {
      if (!this.object.attributes) {
        this.object.attributes = {};
      }
      setValue(this.object.attributes, path, value);
    }
    return true;
  };

  private isBaseAttribute(name: string) {
    return name == "id" || name == "type" || name == "lid";
  }
}
