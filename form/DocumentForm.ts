import { createResource, updateResource } from "@jsonapi/api";
import { type SingleResourceDoc } from "@jsonapi/model";

import { SingleResourceDocumentAccessor } from "@form/SingleResourceDocumentAccessor";
import { SingleObjectForm } from "@form/ObjectForm";
import { createDocument } from "@functions/document";

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
    return this.document.getResourceObjectField(path);
  }

  override setValue = (
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) => {
    if (!this.document) {
      return;
    }
    this.document.setResourceObjectField(path, value);
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

  private submitResource = async (): Promise<SingleResourceDoc | null> => {
    if (!this.object?.data) {
      return new Promise<SingleResourceDoc | null>(() => {});
    }
    const saveDoc = createDocument(this.object.data, this.object.included);
    const endpoint = this.apiUrl
      ? this.apiUrl
      : (this.object.data.links!["self"] as string);

    const value = await ((this.getDocument()?.getData().getId() ?? false)
      ? updateResource(endpoint, saveDoc)
      : createResource(endpoint, saveDoc));
    if (value) {
      return value as SingleResourceDoc;
    }
    return new Promise<SingleResourceDoc | null>(() => {});
  };
}
