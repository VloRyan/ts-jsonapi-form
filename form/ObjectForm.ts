import { getValue, setValue } from "@functions/object";
import type { ObjectLike } from "@jsonapi/model";

export type FormControlElement =
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type SetableValue =
  | string
  | number
  | boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Map<any, any>
  | ObjectLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | any[]
  | Date
  | undefined
  | null;

export interface ObjectForm<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue(path: string): any;
  setValue(path: string, value: SetableValue): void;
  handleChangeEvent(event: Event): void;
  handleChange(element: HTMLInputElement): void;
  handleSubmit(e: Event): void;
  submit(): Promise<T | null>;
  withPathOffset(offset: string): ObjectForm<T>;
  isEmpty(): boolean;

  setup(): {
    id: string | undefined;
    method: string;
    onSubmit: (e: Event) => void;
    onKeyDown: (e: KeyboardEvent) => void;
  };
}

export interface SingleObjectFormProps<T> {
  object: T | null;
  name?: string;
  /** id of the form */
  id?: string;
  onSubmit?: (object: T) => void;
}

export class SingleObjectForm<T> implements ObjectForm<T> {
  object: T | null;
  id: string | undefined;
  protected readonly onSubmit: ((object: T) => void) | undefined;

  constructor(props: SingleObjectFormProps<T>) {
    this.id = props.id;
    this.object = props.object;
    this.onSubmit = props.onSubmit;
  }

  setup(): {
    id: string | undefined;
    method: string;
    onSubmit: (e: Event) => void;
    onKeyDown: (e: KeyboardEvent) => void;
  } {
    return {
      id: this.id,
      method: "post",
      onSubmit: this.handleSubmit,
      onKeyDown: this.handleKeyDown,
    };
  }
  isEmpty() {
    return this.object == null;
  }

  getValue(path: string): unknown {
    return getValue(this.object, path);
  }

  setValue(path: string, value: SetableValue): void {
    if (!this.object) {
      return;
    }
    setValue(this.object, path, value);
  }

  handleChangeEvent = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.handleChange(target);
  };

  handleChange = (element: HTMLInputElement) => {
    const name = element.name;
    let value: SetableValue;
    switch (element.type) {
      case "number":
        value = element.value !== "" ? element.valueAsNumber : null;
        break;
      case "checkbox":
        value = element.checked;
        break;
      case "date":
      case "datetime-local": {
        if (element.value) {
          const d = new Date(element.value);
          value = d.toISOString().slice(0, 19) + "Z";
        } else {
          value = null;
        }
        break;
      }
      default:
        value = element.value;
    }
    this.setValue(name, value);
  };

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  handleSubmit = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.submit().then();
  };

  submit = (): Promise<T | null> => {
    if (this.onSubmit && this.object) {
      this.onSubmit(this.object);
    }
    return new Promise<T | null>(() => {});
  };

  withPathOffset(offset: string): ObjectForm<T> {
    return new PathOffsetForm<T>({ form: this, offset: offset });
  }
}

export interface OffsetFormProps<T> {
  form: ObjectForm<T>;
  offset: string;
  id?: string;
}

export class PathOffsetForm<T> implements ObjectForm<T> {
  private readonly form: ObjectForm<T>;
  private readonly offset: string;
  private readonly id: string | undefined;

  constructor(props: OffsetFormProps<T>) {
    if (!props.form) {
      throw new Error("invalid form");
    }
    this.id = props.id ? props.id : props.offset + "_" + props.form.setup().id;
    this.offset = props.offset;
    this.form = props.form;
  }
  isEmpty() {
    return this.form.isEmpty();
  }
  getValue(path: string) {
    if (!this.form) {
      return undefined;
    }
    return this.form.getValue(this.offset + path);
  }

  handleChangeEvent = (event: Event): void => {
    if (!this.form) {
      return;
    }
    const target = event.target as HTMLInputElement;
    this.handleChange(target);
  };

  handleChange = (element: HTMLInputElement): void => {
    const value = element.type === "checkbox" ? element.checked : element.value;
    const name = element.name;
    this.form.setValue(this.offset + name, value);
  };

  handleSubmit = (e: Event): void => {
    if (!this.form) {
      return;
    }
    this.form.handleSubmit(e);
  };

  submit = () => {
    if (!this.form) {
      return new Promise<T | null>(() => {});
    }
    return this.form.submit();
  };

  setValue = (path: string, value: SetableValue): void => {
    if (!this.form) {
      return;
    }
    this.form.setValue(this.offset + path, value);
  };

  setup = (): {
    id: string | undefined;
    method: string;
    onSubmit: (e: Event) => void;
    onKeyDown: (e: KeyboardEvent) => void;
  } => {
    if (!this.form) {
      return {
        id: "",
        method: "post",
        onSubmit: () => {},
        onKeyDown: () => {},
      };
    }
    return {
      ...this.form.setup(),
      id: this.id,
    };
  };
  withPathOffset = (offset: string): ObjectForm<T> => {
    return new PathOffsetForm({ form: this, offset: this.offset + offset });
  };
}
