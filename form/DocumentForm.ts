import { createResource, updateResource } from "@jsonapi/api";
import {
  type SingleResourceDoc,
  type AnyObject,
  type ResourceLinkage,
} from "@jsonapi/model";

import { SingleResourceDocumentAccessor } from "@form/SingleResourceDocumentAccessor";
import { SingleObjectForm } from "@form/ObjectForm";
import { getValue, PathElement, splitPath } from "@functions/object";
import { createDocument } from "@functions/document";
import { isBaseMember, isResourceObject } from "@functions/resource-object";
import { ResourceObjectAccessor } from "@form/ResourceObjectAccessor";
import type { RelationshipObjectAccessor } from "@form/RelationshipObjectAccessor";

export interface DocumentFormProps {
  document: SingleResourceDoc | null;
  name?: string;
  /** id of the form */
  id?: string;
  onSubmit?: (object: SingleResourceDoc) => void;
  onSubmitSuccess?: (object: SingleResourceDoc | null) => void;
  onSubmitError?: (error: Error) => void;
  apiUrl?: string;
}

export class DocumentForm extends SingleObjectForm<SingleResourceDoc> {
  private readonly onSubmitSuccess:
    ((object: SingleResourceDoc | null) => void) | undefined;
  private readonly onSubmitError?: ((error: Error) => void) | undefined;
  private readonly apiUrl: string;
  private readonly document: SingleResourceDocumentAccessor | null = null;

  constructor(props: DocumentFormProps) {
    super({
      ...props,
      object: props.document,
    });
    this.onSubmitSuccess = props.onSubmitSuccess;
    this.onSubmitError = props.onSubmitError;
    this.apiUrl = props.apiUrl ?? "";
    if (this.object) {
      this.document = new SingleResourceDocumentAccessor(this.object);
    }
  }

  override isEmpty() {
    return this.object == null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getValue(path: string): any {
    if (!this.document) {
      return undefined;
    }
    const pathElements = splitPath(path);
    const linkage = this.document
      .getData()
      .getField([pathElements[0]!], "relationship") as
      ResourceLinkage | undefined;
    if (linkage) {
      if (pathElements.length == 1) {
        return Array.isArray(linkage)
          ? linkage.map((e) => this.document?.findInclude(e) ?? e)
          : (this.document?.findInclude(linkage) ?? linkage);
      }
      if (Array.isArray(linkage)) {
        return undefined;
      }
      const resolved = this.document.findInclude(linkage);
      return resolved
        ? new ResourceObjectAccessor(resolved).getAttribute(
            pathElements.toSpliced(0, 1),
          )
        : getValue(linkage, pathElements.toSpliced(0, 1));
    }

    return this.document.getData().getAttribute(pathElements);
  }

  override setValue = (
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) => {
    if (!this.document) {
      return;
    }
    const pathElements = splitPath(path);
    if (pathElements.length == 0) {
      return;
    }
    const existingRelationship = this.document
      .getData()
      .getRelationship(pathElements[0]!.name);
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
        this.document.getData().setField(pathElements, value, "relationship");
        if (value == null && pathElements.length == 1 && prevLinkage) {
          if (Array.isArray(prevLinkage)) {
            prevLinkage.forEach((l) => this.document?.removeOrphanInclude(l));
          } else {
            this.document?.removeOrphanInclude(prevLinkage);
          }
        }
      } else if (existingRelationship) {
        this.setIncludeAttribute(existingRelationship, pathElements, value);
      }

      if (value && this.isResourceLinkage(value)) {
        if (Array.isArray(value)) {
          value.forEach((v) => this.document!.addOrUpdateInclude(v));
        } else {
          this.document.addOrUpdateInclude(value);
        }
      }
      return;
    }
    this.document.getData().setAttribute(pathElements, value);
  };

  public getDocument(): SingleResourceDocumentAccessor | null {
    return this.document;
  }

  override handleSubmit = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.submit().then(
      (value) => {
        if (this.onSubmitSuccess) {
          this.onSubmitSuccess(value);
        }
      },
      (error) => {
        if (this.onSubmitError !== undefined) {
          this.onSubmitError(error);
        }
      },
    );
  };

  override submit = () => {
    if (!this.object?.data) {
      return new Promise<SingleResourceDoc | null>(() => {});
    }
    if (this.onSubmit) {
      this.onSubmit(this.object);
    }
    return this.submitResource();
  };

  getResourceId() {
    return this.document?.getData().getId();
  }

  hasResourceId() {
    return (
      this.document?.getData().getId() !== undefined &&
      this.document?.getData().getId()!.length > 0
    );
  }

  private setIncludeAttribute(
    relationship: RelationshipObjectAccessor,
    pathElements: PathElement[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) {
    const linkage = relationship.getLinkage(pathElements[0]!.index);
    if (linkage != undefined && !Array.isArray(linkage)) {
      const include = this.document!.findInclude(linkage);
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

  private submitResource = async (): Promise<SingleResourceDoc | null> => {
    if (!this.object?.data) {
      return new Promise<SingleResourceDoc | null>(() => {});
    }
    const saveDoc = createDocument(this.object.data, this.object.included);
    const endpoint = this.apiUrl
      ? this.apiUrl
      : (this.object.data.links!["self"] as string);

    const value = await ((this.hasResourceId() ?? false)
      ? updateResource(endpoint, saveDoc)
      : createResource(endpoint, saveDoc));
    if (value) {
      return value as SingleResourceDoc;
    }
    return new Promise<SingleResourceDoc | null>(() => {});
  };
}
