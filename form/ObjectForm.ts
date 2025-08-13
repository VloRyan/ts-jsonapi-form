import { getValue, removeField, setValue } from "./Value.ts";
import { ObjectLike } from "../jsonapi/model/";

import React, { ChangeEvent, FormEvent } from "react";

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
  | null;

export interface ObjectForm {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue(path: string): any;

  setValue(path: string, value: settableValue): void;

  removeValue(path: string): void;

  handleChange(event: ChangeEvent<FormControlElement>): void;

  handleSubmit(e: FormEvent): void;
  withOffset(offset: string): ObjectForm;
  isEmpty(): boolean;

  setup(): {
    id: string | undefined;
    method: string;
    onSubmit: (e: FormEvent) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
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

export class SingleObjectForm<T> implements ObjectForm {
  object: T | null;
  id: string | undefined;
  protected readonly onChange?: (object: T | null, path: string) => void;
  protected readonly onSubmit?: (object: T) => void;

  constructor(props: SingleObjectFormProps<T>) {
    this.id = props.id;
    this.object = props.object;
    this.onChange = props.onChange;
    this.onSubmit = props.onSubmit;
  }

  setup(): {
    id: string | undefined;
    method: string;
    onSubmit: (e: FormEvent) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
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

  handleChange = (event: ChangeEvent<FormControlElement>) => {
    const target = event.currentTarget as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    if (target.type == "date" && !value) {
      this.removeValue(name);
      return;
    }
    this.setValue(name, value);
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
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
    }
  };

  withOffset(offset: string): ObjectForm {
    return new OffsetForm({ form: this, offset: offset });
  }

  protected fireChanged(path: string) {
    if (this.onChange) {
      this.onChange(this.object, path);
    }
  }
}

export interface OffsetFormProps {
  form: ObjectForm;
  offset: string;
  id?: string;
}

export class OffsetForm implements ObjectForm {
  private readonly form: ObjectForm;
  private readonly offset: string;
  private readonly id: string | undefined;

  constructor(props: OffsetFormProps) {
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

  handleChange = (event: React.ChangeEvent<FormControlElement>): void => {
    if (!this.form) {
      return;
    }
    const target = event.currentTarget as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    if (target.type == "date" && !value) {
      this.form.removeValue(this.offset + name);
      return;
    }
    this.form.setValue(this.offset + name, value);
  };

  handleSubmit = (e: React.FormEvent): void => {
    if (!this.form) {
      return;
    }
    this.form.handleSubmit(e);
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

  setup = (): {
    id: string | undefined;
    method: string;
    onSubmit: (e: React.FormEvent) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
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
  withOffset = (offset: string): ObjectForm => {
    return new OffsetForm({ form: this, offset: this.offset + offset });
  };
}
