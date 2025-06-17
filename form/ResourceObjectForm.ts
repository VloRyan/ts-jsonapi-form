import { createResource, updateResource } from "../jsonapi/JsonApi.ts";
import {
  AttributesObject,
  RelationshipsObject,
  ResourceObject,
} from "../jsonapi/model/Objects.ts";
import {
  createDocument,
  SingleResourceDoc,
} from "../jsonapi/model/Document.ts";
import { getValue, removeField, setValue } from "./Value.ts";

import {
  settableValue,
  SingleObjectForm,
  SingleObjectFormProps,
} from "./ObjectForm.ts";
import { FormEvent } from "react";

export type FormControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export interface ResourceObjectFormProps
  extends SingleObjectFormProps<ResourceObject> {
  onSubmitSuccess?: (object: ResourceObject) => void;
  onSubmitError?: (error: Error) => void;
  submitUrlPrefix?: string;
}

export class ResourceObjectForm extends SingleObjectForm<ResourceObject> {
  private readonly onSubmitSuccess?: (object: ResourceObject) => void;
  private readonly onSubmitError?: (error: Error) => void;
  private readonly submitUrlPrefix?: string;

  constructor(props: ResourceObjectFormProps) {
    super(props);
    this.onSubmitSuccess = props.onSubmitSuccess;
    this.onSubmitError = props.onSubmitError;
    this.submitUrlPrefix = props.submitUrlPrefix;
  }

  setObject(newObject: ResourceObject | null) {
    if (this.onChange) {
      this.onChange(newObject);
    }
    this.object = newObject;
  }

  getValue(path: string): unknown {
    if (
      path != "type" &&
      path != "id" &&
      !path.startsWith("attributes.") &&
      !path.startsWith("relationships.") &&
      !path.startsWith("includes.")
    ) {
      path = "attributes." + path;
    }
    return getValue(this.object, path);
  }

  setValue = (path: string, value: settableValue) => {
    if (!this.object) {
      return;
    }
    let objPath = path;
    if (
      path !== "id" &&
      path !== "type" &&
      !path.startsWith("attributes.") &&
      !path.startsWith("relationships.") &&
      !path.startsWith("includes.")
    ) {
      objPath = "attributes." + path;
    }
    if (
      path.startsWith("attributes.") &&
      this.object.attributes === undefined
    ) {
      this.object.attributes = {} satisfies AttributesObject;
    }
    if (
      path.startsWith("relationships.") &&
      this.object.relationships === undefined
    ) {
      this.object.relationships = {} satisfies RelationshipsObject;
    }
    setValue(this.object, objPath, value);
    const states = this.hooks.get(path);
    if (states) {
      for (const state of states) {
        state[1](value);
      }
    }
    if (this.onChange) {
      this.onChange(this.object);
    }
  };

  removeValue = (path: string) => {
    if (!this.object) {
      return;
    }
    let objPath = path;
    if (
      path !== "id" &&
      path !== "type" &&
      !path.startsWith("attributes.") &&
      !path.startsWith("relationships.") &&
      !path.startsWith("includes.")
    ) {
      objPath = "attributes." + path;
    }

    if (
      objPath.startsWith("attributes") &&
      this.object.attributes === undefined
    ) {
      this.object.attributes = {} satisfies AttributesObject;
    }
    if (
      objPath.startsWith("relationships") &&
      this.object.relationships === undefined
    ) {
      this.object.relationships = {} satisfies RelationshipsObject;
    }
    removeField(this.object, objPath);
    const states = this.hooks.get(path);
    if (states) {
      for (const state of states) {
        state[1](getValue(this.object, path));
      }
    }
    if (this.onChange) {
      this.onChange(this.object);
    }
  };

  handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!this.object) {
      return;
    }
    if (this.onSubmit && this.object) {
      this.onSubmit(this.object);
    } else {
      this.submitResource();
    }
  };

  private submitResource = () => {
    if (!this.object) {
      return;
    }
    const saveDoc = createDocument(this.object);
    const endpoint = this.submitUrlPrefix
      ? ((this.submitUrlPrefix + this.object!.links!.self) as string)
      : (this.object!.links!.self as string);

    (this.object.id == "" || this.object.id == undefined
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
