import type { AnyObject } from "@jsonapi/model";
import type { PathElement } from "@functions/object";

export class FieldAccessor {
  public readonly parentObject: AnyObject;
  public readonly pathElement: PathElement;

  constructor(parentObject: AnyObject, element: PathElement) {
    this.parentObject = parentObject;
    this.pathElement = element;
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  get(): any | undefined {
    if (!this.parentObject) {
      return undefined;
    }
    const field = this.parentObject[this.pathElement.name];
    if (Array.isArray(field)) {
      if (
        this.pathElement.index === undefined ||
        field.length <= this.pathElement.index!
      ) {
        return undefined;
      }
      return field[this.pathElement.index!];
    }
    return field;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  set(newValue: any) {
    if (!this.parentObject) {
      return;
    }
    if (this.pathElement.index !== undefined) {
      const container = this.parentObject[this.pathElement.name];
      if (
        !Array.isArray(container) ||
        container.length <= this.pathElement.index!
      ) {
        return;
      }
      container[this.pathElement.index!] = newValue;
    } else {
      this.parentObject[this.pathElement.name] = newValue;
    }
  }
}
