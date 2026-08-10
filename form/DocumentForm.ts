import { createResource, updateResource } from "../jsonapi/";
import {
  createDocument,
  type ResourceObject,
  type SingleResourceDoc,
  type Value,
} from "../jsonapi/model/";

import { SingleObjectForm } from "./ObjectForm";
import { SingleResourceDocumentAccessor } from "./SingleResourceDocumentAccessor";

export interface DocumentFormProps {
  document: SingleResourceDoc | null;
  name?: string;
  /** id of the form */
  id?: string;
  onChange?: (object: SingleResourceDoc | null, path: string) => void;
  onSubmit?: (object: SingleResourceDoc) => void;
  onSubmitSuccess?: (object: SingleResourceDoc | null) => void;
  onSubmitError?: (error: Error) => void;
  apiUrl?: string;
}

export class DocumentForm extends SingleObjectForm<SingleResourceDoc> {
  //doc: SingleResourceDoc | null;
  private readonly onSubmitSuccess:
    | ((object: SingleResourceDoc | null) => void)
    | undefined;
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

  override getValue(path: string): unknown {
    if (!this.document) {
      return null;
    }
    return this.document.getObjectValue(path);
  }

  override setValue = (path: string, value: Value | ResourceObject[]) => {
    if (!this.document) {
      return;
    }
    this.document.setObjectValue(path, value, () => this.fireChanged(path));
  };

  override removeValue = (path: string) => {
    if (!this.document) {
      return;
    }
    this.document.removeObjectValue(path, () => this.fireChanged(path));
  };

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
    return this.document?.getResourceId();
  }

  hasResourceId() {
    return this.document?.hasResourceId();
  }

  private submitResource = async (): Promise<SingleResourceDoc | null> => {
    if (!this.object?.data) {
      return new Promise<SingleResourceDoc | null>(() => {});
    }
    const saveDoc = createDocument(this.object.data, this.object.included);
    const endpoint = this.apiUrl
      ? this.apiUrl
      : (this.object.data.links!["self"] as string);

    const value = await (this.document?.hasResourceId() ?? false
      ? updateResource(endpoint, saveDoc)
      : createResource(endpoint, saveDoc));
    if (value) {
      return value as SingleResourceDoc;
    }
    return new Promise<SingleResourceDoc | null>(() => {});
  };
}
