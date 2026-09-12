import {
  isResourceObject,
  isSameId,
  type ObjectLike,
  type RelationshipObject,
  type ResourceIdentifierObject,
  type ResourceLinkage,
  type ResourceObject,
  type SingleResourceDoc,
  toResourceIdentifier,
  type Value,
} from "@jsonapi/model";
import { getValue, setValue } from "@functions/object";
import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";

interface ResolvedRelationship {
  remainingPath: string;
  relationship: RelationshipObject;
  index?: number;
}

export class SingleResourceDocumentAccessor {
  private readonly document: SingleResourceDoc;
  private readonly objectAccessor: ResourceObjectAccessor;

  constructor(document: SingleResourceDoc) {
    this.document = document;
    this.objectAccessor = new ResourceObjectAccessor(document.data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getObjectValue(path: string): any | undefined {
    if (this.objectAccessor.isNull()) {
      return undefined;
    }
    const match = this.resolveRelationshipForPath(path);
    if (match) {
      if (!match.relationship.data) {
        return undefined;
      }
      if (Array.isArray(match.relationship.data)) {
        if (match.index !== undefined) {
          const relId =
            match.relationship.data.length > match.index
              ? match.relationship.data[match.index]!
              : undefined;
          if (!relId) {
            return undefined;
          }
          const include = this.findInclude(relId);
          if (match.remainingPath.length == 0) {
            return include ? include : relId;
          }
          return include
            ? new ResourceObjectAccessor(include).getValue(match.remainingPath)
            : relId;
        } else {
          if (match.remainingPath.length != 0) {
            return undefined;
          }
          return match.relationship.data.map((relId) => {
            const include = this.findInclude(relId);
            return include ? include : relId;
          });
        }
      } else {
        if (match.index) {
          return undefined;
        }
        const relId = match.relationship.data;
        const include = this.findInclude(relId);
        if (match.remainingPath.length == 0) {
          return include ? include : relId;
        }
        return include
          ? new ResourceObjectAccessor(include).getValue(match.remainingPath)
          : relId;
      }
    }
    return this.objectAccessor.getValue(path);
  }

  public setObjectValue = (path: string, value: Value | ResourceObject[]) => {
    if (this.objectAccessor.isNull()) {
      return undefined;
    }
    if (
      isResourceObject(value as unknown as ObjectLike) ||
      (Array.isArray(value) &&
        isResourceObject(value[0] as unknown as ObjectLike))
    ) {
      const linkage: ResourceLinkage = Array.isArray(value)
        ? value.map((v) => toResourceIdentifier(v as ResourceObject))
        : toResourceIdentifier(value as unknown as ResourceObject);
      const match = this.resolveRelationshipForPath(path);
      if (match) {
        match.relationship.data = linkage;
      } else {
        this.objectAccessor.setRelationship(path, { data: linkage });
      }
      if (Array.isArray(value)) {
        value.forEach((v) => this.addOrUpdateInclude(v as ResourceObject));
      } else {
        this.addOrUpdateInclude(value as unknown as ResourceObject);
      }
      return;
    }

    const match = this.resolveRelationshipForPath(path);
    if (match) {
      if (!match.relationship.data) {
        return;
      }
      if (match.remainingPath.length == 0 && value === null) {
        this.getResourceIdentifier(match.relationship).forEach((relId) =>
          this.removeIncludeIfNotBelongsToOther(relId),
        );
        match.relationship.data = null;
        return;
      }

      const relId =
        match.index !== undefined
          ? Array.isArray(match.relationship.data) &&
            match.relationship.data.length > match.index
            ? match.relationship.data[match.index]!
            : undefined
          : !Array.isArray(match.relationship.data)
            ? (match.relationship.data as ResourceIdentifierObject)
            : undefined;
      if (!relId) {
        return;
      }

      if (this.isBaseAttribute(match.remainingPath)) {
        setValue(relId, match.remainingPath, value);
      } else {
        const include = this.findInclude(relId);
        if (!include) {
          return;
        }
        new ResourceObjectAccessor(include).setValue(
          match.remainingPath,
          value,
        );
      }
      return;
    }
    this.objectAccessor.setValue(path, value);
  };

  public getLink(path: string): unknown {
    if (!this.document?.data?.links) {
      return;
    }
    return getValue(this.document.data.links, path);
  }

  public getResourceId() {
    return this.document?.data.id;
  }

  public hasResourceId() {
    const id = this.getResourceId();
    return id != undefined && id !== "";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getObjectMetaValue(path: string): any | undefined {
    return new ResourceObjectAccessor(this.document.data).getMetaValue(path);
  }

  public setObjectMetaValue(path: string, value: Value) {
    new ResourceObjectAccessor(this.document.data).setMetaValue(path, value);
  }

  private resolveRelationshipForPath(
    path: string,
  ): ResolvedRelationship | null {
    const matches = this.objectAccessor.filterRelationships((relPath) =>
      path.startsWith(relPath),
    );
    if (matches.length != 1 || !matches[0]!.relationship) {
      return null;
    }
    let remainingPath = path.substring(matches[0]!.path.length);
    if (remainingPath.charAt(0) == "[") {
      const identifierClose = remainingPath.indexOf("]");
      if (identifierClose == -1) {
        return null;
      }
      const identifier = remainingPath.substring(1, identifierClose);
      const index = Number.parseInt(identifier, 10);
      if (Number.isNaN(index)) {
        return null;
      }
      remainingPath = remainingPath.substring(identifierClose + 1);
      if (remainingPath.charAt(0) == ".") {
        remainingPath = remainingPath.substring(1);
      }
      return {
        remainingPath,
        relationship: matches[0]!.relationship,
        index,
      };
    }
    if (remainingPath.charAt(0) == ".") {
      remainingPath = remainingPath.substring(1);
    }
    return {
      remainingPath,
      relationship: matches[0]!.relationship,
    };
  }

  private addOrUpdateInclude(value: ResourceObject) {
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

  private getResourceIdentifier(relationship: RelationshipObject) {
    return Array.isArray(relationship.data)
      ? (relationship.data as ResourceIdentifierObject[])
      : [relationship.data as ResourceIdentifierObject];
  }

  private removeIncludeIfNotBelongsToOther(id: ResourceIdentifierObject) {
    if (!this.document) {
      return;
    }
    let refCount = 0;
    for (const key in this.document.data.relationships) {
      const otherRel = this.document.data.relationships[key];
      if (!otherRel!.data) {
        continue;
      }
      if (Array.isArray(otherRel!.data)) {
        for (const otherIdentifier of otherRel!.data) {
          if (isSameId(otherIdentifier, id)) {
            refCount++;
            if (refCount > 1) {
              break;
            }
          }
        }
      } else {
        const otherIdentifier = otherRel!.data as ResourceIdentifierObject;
        if (isSameId(otherIdentifier, id)) {
          refCount++;
          if (refCount > 1) {
            break;
          }
        }
      }
    }
    if (refCount < 2) {
      this.document!.included = this.document!.included!.filter(
        (inc) => inc.type !== id.type || inc.id !== id.id || inc.lid !== id.lid,
      )!;
    }
  }

  private findInclude(id: ResourceIdentifierObject) {
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

  private isBaseAttribute(name: string) {
    return name == "id" || name == "type" || name == "lid";
  }
}
