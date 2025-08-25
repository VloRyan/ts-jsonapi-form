import { createResource, updateResource } from "../jsonapi/";
import {
  createDocument,
  isResourceObject,
  isSameId,
  ObjectLike,
  RelationshipObject,
  RelationshipsObject,
  ResourceIdentifierObject,
  ResourceObject,
  SingleResourceDoc,
  Value,
} from "../jsonapi/model/";
import { getValue, removeField, setValue } from "./Value.ts";

import { SingleObjectForm } from "./ObjectForm.ts";
import { FormEvent } from "react";

export interface DocumentFormProps {
  document: SingleResourceDoc | null;
  name?: string;
  /** id of the form */
  id?: string;
  onChange?: (object: ResourceObject | null, path: string) => void;
  onSubmit?: (object: ResourceObject) => void;
  onSubmitSuccess?: (object: ResourceObject) => void;
  onSubmitError?: (error: Error) => void;
  apiUrl?: string;
}

export class DocumentForm extends SingleObjectForm<ResourceObject> {
  doc: SingleResourceDoc | null;
  private readonly onSubmitSuccess?: (object: ResourceObject) => void;
  private readonly onSubmitError?: (error: Error) => void;
  private readonly apiUrl?: string;

  constructor(props: DocumentFormProps) {
    super({
      ...props,
      object: null,
    });
    this.doc = props.document;
    this.onSubmitSuccess = props.onSubmitSuccess;
    this.onSubmitError = props.onSubmitError;
    this.apiUrl = props.apiUrl;
  }
  isEmpty() {
    return this.doc == null;
  }

  getValue(path: string): unknown {
    if (!this.doc?.data) {
      return null;
    }
    if (isBaseAttribute(path)) {
      return this.doc.data[path];
    }

    const attrib = this.findAttribute(path);
    if (attrib) {
      let attribPath = path.substring(attrib.path.length);
      if (attribPath.length === 0) {
        return attrib.value;
      } else if (attribPath[0] === ".") {
        attribPath = attribPath.substring(1);
      }
      return getValue(attrib.value, attribPath);
    }

    const match = this.findRelationshipId(path);
    if (match && match.ids.length > 0) {
      if (match.isArray) {
        const includes: ResourceObject[] = [];
        for (const relId of match.ids) {
          const incIndex = this.findIncludeIndex(relId);
          if (incIndex != -1) {
            includes.push(this.doc.included![incIndex]);
          }
        }
        return includes;
      } else {
        const relId = match.ids[0];
        let attribPath = path.substring(match.path.length);
        if (attribPath[0] === ".") {
          attribPath = attribPath.substring(1);
        }
        if (isBaseAttribute(attribPath)) {
          return relId[attribPath];
        }
        const incIndex = this.findIncludeIndex(relId);
        if (incIndex != -1) {
          const include = this.doc.included![incIndex];
          if (attribPath.length === 0) {
            return include;
          }
          return getValue(include.attributes, attribPath);
        } else {
          return relId;
        }
      }
    }
    return undefined;
  }

  setValue = (path: string, value: Value | ResourceObject[]) => {
    if (!this.doc?.data) {
      return;
    }
    if (isBaseAttribute(path)) {
      this.doc.data[path] = value ? (value as string) : "";
      this.fireChanged(path);
      return;
    }

    if (
      value &&
      (isResourceObject(value as ObjectLike) ||
        (Array.isArray(value) && isResourceObject(value[0] as ObjectLike)))
    ) {
      this.setResourceObjectValue(path, value as unknown as ResourceObject);
      return;
    }

    let attribPath = "";
    for (const key in this.doc.data.attributes) {
      if (path.startsWith(key)) {
        attribPath = path.substring(key.length);
        if (attribPath.length === 0) {
          this.doc.data.attributes[key] = value as Value;
          this.fireChanged(path);
          return;
        } else if (attribPath[0] === ".") {
          attribPath = attribPath.substring(1);
        }
        setValue(this.doc.data.attributes[key], attribPath, value);
        this.fireChanged(path);
        return;
      }
    }

    for (const key in this.doc.data.relationships) {
      if (path.startsWith(key)) {
        const relationship = this.doc.data.relationships[key];
        if (!relationship.data) {
          continue;
        }
        const identifier = relationship.data as ResourceIdentifierObject;
        attribPath = path.substring(key.length + 1);
        if (isBaseAttribute(attribPath)) {
          identifier[attribPath] = value ? (value as string) : "";
          this.fireChanged(path);
          return;
        }
        if (this.doc?.included) {
          for (const include of this.doc!.included) {
            if (
              include.type !== identifier.type ||
              include.id !== identifier.id ||
              include.lid !== identifier.lid
            ) {
              continue;
            }
            setValue(include.attributes, attribPath, value);
            this.fireChanged(path);
            return;
          }
        }
      }
    }
    if (!this.doc.data.attributes) {
      this.doc.data.attributes = {};
    }
    setValue(this.doc.data.attributes, path, value);
    this.fireChanged(path);
  };

  removeValue = (path: string) => {
    if (!this.doc?.data) {
      return;
    }

    let attribPath = "";
    if (isBaseAttribute(path)) {
      this.doc.data[path] = "";
      this.fireChanged(path);
      return;
    } else {
      for (const key in this.doc.data.attributes) {
        if (path.startsWith(key)) {
          attribPath = path.substring(key.length);
          if (attribPath.length === 0) {
            delete this.doc.data.attributes[key];
            this.fireChanged(path);
            return;
          } else if (attribPath[0] === ".") {
            attribPath = attribPath.substring(1);
          }
          removeField(this.doc.data.attributes[key], attribPath);
          this.fireChanged(path);
          return;
        }
      }
    }

    const rel = this.findRelationship(path);
    if (rel) {
      attribPath = path.substring(rel.path.length);
      if (attribPath[0] === ".") {
        attribPath = attribPath.substring(1);
      }
      if (Array.isArray(rel.object.data)) {
        if (attribPath.startsWith("[")) {
          const closingBracket = attribPath.indexOf("]");
          const elemIdx = +attribPath.substring(1, closingBracket);
          attribPath = attribPath.substring(closingBracket + 1);
          if (elemIdx >= rel.object.data.length) {
            return undefined;
          }
          const identifier = rel.object.data[
            elemIdx
          ] as unknown as ResourceIdentifierObject;
          if (attribPath.length == 0) {
            rel.object.data.splice(elemIdx, 1);
            this.removeIncludeIfNotBelongsToOther(identifier);
          } else {
            if (isBaseAttribute(attribPath)) {
              identifier[attribPath] = "";
            } else {
              const incIndex = this.findIncludeIndex(identifier);
              if (incIndex != -1) {
                removeField(
                  this.doc.included![incIndex].attributes,
                  attribPath,
                );
              }
            }
          }
        } else if (attribPath.length == 0) {
          for (let i = 0; i < rel.object.data.length; i++) {
            const identifier = rel.object.data[i];
            rel.object.data.splice(i, 1);
            this.removeIncludeIfNotBelongsToOther(identifier);
          }
          this.doc.data.relationships![rel.path].data = null;
        }
        this.fireChanged(path);
      } else {
        const identifier = rel.object
          .data as unknown as ResourceIdentifierObject;
        if (isBaseAttribute(attribPath)) {
          identifier[attribPath] = "";
        }
        if (attribPath.length === 0) {
          this.removeIncludeIfNotBelongsToOther(identifier);
          this.doc.data.relationships![rel.path].data = null;
        } else {
          const incIndex = this.findIncludeIndex(identifier);
          if (incIndex != -1) {
            removeField(this.doc.included![incIndex].attributes, attribPath);
          }
        }
        this.fireChanged(path);
      }
    }
  };

  handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!this.doc?.data) {
      return;
    }
    if (this.onSubmit && this.doc.data) {
      this.onSubmit(this.doc.data);
    } else {
      this.submitResource();
    }
  };

  getLink(path: string): unknown {
    if (!this.doc?.data?.links) {
      return;
    }
    return getValue(this.doc.data.links, path);
  }

  private findAttribute(
    path: string,
  ): { value: Value; path: string } | undefined {
    if (!this.doc?.data?.attributes) {
      return undefined;
    }
    for (const key in this.doc.data.attributes) {
      if (path.startsWith(key)) {
        return { value: this.doc.data.attributes[key], path: key };
      }
    }
    return undefined;
  }
  private removeIncludeIfNotBelongsToOther(id: ResourceIdentifierObject) {
    if (!this.doc) {
      return;
    }
    let refCount = 0;
    for (const key in this.doc.data.relationships) {
      const otherRel = this.doc.data.relationships[key];
      if (!otherRel.data) {
        continue;
      }
      if (Array.isArray(otherRel.data)) {
        for (const otherIdentifier of otherRel.data) {
          if (isSameId(otherIdentifier, id)) {
            refCount++;
            if (refCount > 1) {
              break;
            }
          }
        }
      } else {
        const otherIdentifier = otherRel.data as ResourceIdentifierObject;
        if (isSameId(otherIdentifier, id)) {
          refCount++;
          if (refCount > 1) {
            break;
          }
        }
      }
    }
    if (refCount < 2) {
      this.doc!.included = this.doc!.included?.filter(
        (inc) => inc.type !== id.type || inc.id !== id.id || inc.lid !== id.lid,
      );
    }
  }

  private setResourceObjectValue = (
    path: string,
    value: ResourceObject | ResourceObject[],
  ) => {
    if (!this.doc?.data) {
      return;
    }
    const rel = this.findRelationship(path);
    if (Array.isArray(value)) {
      const ids = value.map(
        (item) =>
          ({
            id: item.id,
            type: item.type,
            lid: item.lid,
          }) satisfies ResourceIdentifierObject,
      );
      if (rel) {
        rel.object.data = ids;
      } else {
        if (!this.doc.data.relationships) {
          this.doc.data.relationships = {} satisfies RelationshipsObject;
        }
        this.doc.data.relationships[path] = {
          data: ids,
        };
      }
      if (!this.doc?.included) {
        this.doc.included = value;
      } else {
        for (const obj of value) {
          const includeIndex = this.findIncludeIndex(obj);
          if (includeIndex != -1) {
            this.doc.included[includeIndex] = obj;
          } else {
            this.doc!.included.push(obj);
          }
        }
      }
    } else {
      if (rel && rel.object.data) {
        const identifier = rel.object.data as ResourceIdentifierObject;
        identifier.id = value.id;
        identifier.type = value.type;
        identifier.lid = value.lid;
      } else {
        if (!this.doc.data.relationships) {
          this.doc.data.relationships = {} satisfies RelationshipsObject;
        }
        this.doc.data.relationships[path] = {
          data: {
            id: value.id,
            type: value.type,
            lid: value.lid,
          },
        } satisfies RelationshipObject;
      }
      if (!this.doc?.included) {
        this.doc.included = [];
        this.doc.included.push(value);
      } else {
        const includeIndex = this.findIncludeIndex(value);
        if (includeIndex != -1) {
          this.doc!.included[includeIndex] = value;
        } else {
          this.doc!.included.push(value);
        }
      }
    }
    this.fireChanged(path);
  };

  private findRelationship(
    path: string,
  ): { object: RelationshipObject; path: string } | undefined {
    if (!this.doc?.data?.relationships) {
      return undefined;
    }
    for (const key in this.doc.data.relationships) {
      const relationship = this.doc.data.relationships[key];
      if (path.startsWith(key)) {
        return {
          object: relationship as unknown as RelationshipObject,
          path: key,
        };
      }
    }
    return undefined;
  }

  private findRelationshipId(path: string): RelationshipMatch | undefined {
    if (!this.doc?.data?.relationships) {
      return undefined;
    }
    for (const key in this.doc.data.relationships) {
      const relationship = this.doc.data.relationships[key];
      if (path.startsWith(key)) {
        let subPath = path.substring(key.length);
        if (subPath[0] === ".") {
          subPath = subPath.substring(1);
        }
        if (Array.isArray(relationship.data)) {
          if (subPath.startsWith("[")) {
            const closingBracket = subPath.indexOf("]");
            const elemIdx = +subPath.substring(1, closingBracket);
            subPath = subPath.substring(closingBracket + 1);
            if (elemIdx >= relationship.data.length) {
              return undefined;
            }
            return {
              ids: [relationship.data[elemIdx]],
              path: key + `[${elemIdx}]`,
              isArray: false,
            };
          } else if (subPath.length == 0) {
            const result = {
              ids: [] as ResourceIdentifierObject[],
              path: key,
              isArray: true,
            } satisfies RelationshipMatch;
            for (const id of relationship.data) {
              result.ids.push(id);
            }
            return result;
          } else {
            return undefined;
          }
        } else {
          return {
            ids: [relationship.data as unknown as ResourceIdentifierObject],
            path: key,
            isArray: false,
          };
        }
      }
    }
    return undefined;
  }

  private findIncludeIndex(id: ResourceIdentifierObject) {
    if (!this.doc?.included) {
      return -1;
    }
    if (!id) {
      return -1;
    }
    for (let i = 0; i < this.doc.included.length; i++) {
      if (isSameId(this.doc.included[i], id)) {
        return i;
      }
    }
    return -1;
  }

  private submitResource = () => {
    if (!this.doc?.data) {
      return;
    }
    const saveDoc = createDocument(this.doc.data, this.doc.included);
    const endpoint = this.apiUrl
      ? this.apiUrl
      : (this.doc.data.links!.self as string);

    (this.doc.data.id == "" || this.doc.data.id == undefined
      ? createResource(endpoint, saveDoc)
      : updateResource(endpoint, saveDoc)
    ).then(
      (value) => {
        if (this.onSubmitSuccess) {
          const doc = value as SingleResourceDoc;
          const newData = doc.data;
          this.onSubmitSuccess(newData);
        }
      },
      (error) => {
        if (this.onSubmitError !== undefined) {
          this.onSubmitError(error);
        }
      },
    );
  };
}
function isBaseAttribute(name: string) {
  return name == "id" || name == "type" || name == "lid";
}

interface RelationshipMatch {
  ids: ResourceIdentifierObject[];
  path: string;
  isArray: boolean;
}
