import { getValue, removeField, setValue } from "./Value";
import { ObjectLike } from "../jsonapi/model/";

export type FormControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export type settableValue =
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
  setValue(path: string, value: settableValue): void;
  removeValue(path: string): void;
  onChangePath(exp: RegExp, callback: () => void | null): void;
  handleChangeEvent(event: Event): void;
  handleChange(element: HTMLInputElement): void;
  handleSubmit(e: Event): void;
  submit(): Promise<T | null>;
  withOffset(offset: string): ObjectForm<T>;
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
  onChange?: (object: T | null, path: string) => void;
  onSubmit?: (object: T) => void;
}

export interface ChangePathHandler {
  expression: RegExp;
  callback: () => void;
}

export class SingleObjectForm<T> implements ObjectForm<T> {
  object: T | null;
  id: string | undefined;
  protected readonly onChange:
    | ((object: T | null, path: string) => void)
    | undefined;
  protected readonly onSubmit: ((object: T) => void) | undefined;
  protected onChangePathHandler: ChangePathHandler[];

  constructor(props: SingleObjectFormProps<T>) {
    this.id = props.id;
    this.object = props.object;
    this.onChange = props.onChange;
    this.onSubmit = props.onSubmit;
    this.onChangePathHandler = [] satisfies ChangePathHandler[];
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

  setValue(path: string, value: settableValue): void {
    if (!this.object) {
      return;
    }
    setValue(this.object, path, value);
    this.fireChanged(path);
  }

  removeValue = (path: string) => {
    if (!this.object) {
      return;
    }
    removeField(this.object, path);
    this.fireChanged(path);
  };

  onChangePath = (exp: RegExp, callback: () => void | null) => {
    if (callback !== null) {
      this.onChangePathHandler = this.onChangePathHandler.filter(
        (handler) => handler.expression.source !== exp.source,
      );
      this.onChangePathHandler.push({ expression: exp, callback });
    } else {
      this.onChangePathHandler = this.onChangePathHandler.filter(
        (handler) => handler.expression.source !== exp.source,
      );
    }
  };

  handleChangeEvent = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.handleChange(target);
  };

  handleChange = (element: HTMLInputElement) => {
    const name = element.name;
    let value: settableValue;
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
    if (value === null || value === undefined) {
      this.removeValue(name);
    } else {
      this.setValue(name, value);
    }
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

  withOffset(offset: string): ObjectForm<T> {
    return new OffsetForm<T>({ form: this, offset: offset });
  }

  protected fireChanged(path: string) {
    if (this.onChange) {
      this.onChange(this.object, path);
    }
    this.onChangePathHandler.forEach((handler) => {
      if (handler.expression.test(path)) {
        handler.callback();
      }
    });
  }
}

export interface OffsetFormProps<T> {
  form: ObjectForm<T>;
  offset: string;
  id?: string;
}

export class OffsetForm<T> implements ObjectForm<T> {
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
    if (element.type == "date" && !value) {
      this.form.removeValue(this.offset + name);
      return;
    }
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

  removeValue = (path: string): void => {
    if (!this.form) {
      return;
    }
    this.form.removeValue(this.offset + path);
  };

  setValue = (path: string, value: settableValue): void => {
    if (!this.form) {
      return;
    }
    this.form.setValue(this.offset + path, value);
  };
  onChangePath(exp: RegExp, callback: () => void) {
    this.form.onChangePath(exp, callback);
  }

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
  withOffset = (offset: string): ObjectForm<T> => {
    return new OffsetForm({ form: this, offset: this.offset + offset });
  };
}
