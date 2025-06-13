import { Errors } from "./Document.ts";

export class ApiError extends Error {
  errors: Errors;

  constructor(errors: Errors) {
    super("");
    this.errors = errors;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
