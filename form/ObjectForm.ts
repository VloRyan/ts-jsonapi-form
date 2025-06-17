import { getValue, removeField, setValue } from "./Value.ts";
import {
  RelationshipObject,
  ResourceIdentifierObject,
} from "../jsonapi/model/Objects.ts";
import { ObjectLike } from "../jsonapi/model/Types.ts";
import { FormControlElement } from "./ResourceObjectForm.ts";

import React, { ChangeEvent, Dispatch, FormEvent, useState } from "react";

export type settableValue =
  | string
  | number
  | boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Map<any, any>
  | RelationshipObject
  | ResourceIdentifierObject
  | ObjectLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | any[]
  | Date
  | null;

export interface ObjectForm {
  readonly object: unknown | null;
  id: string | undefined;

  useValue<T>(path: string): T | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue(path: string): any;

  setValue(path: string, value: settableValue): void;

  removeValue(path: string): void;

  handleChange(event: ChangeEvent<FormControlElement>): void;

  handleSubmit(e: FormEvent): void;

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
  id?: string;
  onChange?: (object: T | null) => void;
  onSubmit?: (object: T) => void;
}

export class SingleObjectForm<T> implements ObjectForm {
  object: T | null;
  id: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected hooks: Map<string, [any, Dispatch<any>][]>;
  protected readonly onChange?: (object: T | null) => void;
  protected readonly onSubmit?: (object: T) => void;

  constructor(props: SingleObjectFormProps<T>) {
    this.id = props.id;
    this.object = props.object;
    this.onChange = props.onChange;
    this.onSubmit = props.onSubmit;
    this.hooks = new Map();
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

  useValue<T>(path: string) {
    let states = this.hooks.get(path);
    if (!states) {
      states = [];
    }
    const state = useState(this.getValue(path));
    states.push(state);
    this.hooks.set(path, states);
    return state[0] as T;
  }

  getValue(path: string): unknown {
    return getValue(this.object, path);
  }

  setValue(path: string, value: settableValue): void {
    const newState = { ...this.object } as T;
    setValue(newState, path, value);
    const states = this.hooks.get(path);
    if (states) {
      for (const state of states) {
        state[1](newState);
      }
    }
    if (this.onChange) {
      this.onChange(newState);
    }
    this.object = newState;
  }

  removeValue = (path: string) => {
    const newState = { ...this.object } as T;
    removeField(newState, path);
    const states = this.hooks.get(path);
    if (states) {
      for (const state of states) {
        state[1](newState);
      }
    }
    if (this.onChange) {
      this.onChange(newState);
    }
    this.object = newState;
  };

  handleChange = (event: ChangeEvent<FormControlElement>) => {
    const target = event.currentTarget as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    if (target.type == "select-one" && !value) {
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
}
