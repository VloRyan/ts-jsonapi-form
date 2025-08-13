import { AtomicOperationsDocument } from "./model/Document.ts";

import {
  InvalidServerResponseError,
  MEDIA_TYPE as JSON_API_MEDIA_TYPE,
} from "../";
import { ApiError } from "../model/";
import { StatusCodes } from "http-status-codes";

const MEDIA_TYPE =
  'application/vnd.api+json;ext="https://jsonapi.org/ext/atomic"';

export async function postOperations(
  url: string,
  doc: AtomicOperationsDocument,
) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": MEDIA_TYPE,
    },
    body: JSON.stringify(doc),
  });
  if (resp.status == StatusCodes.NO_CONTENT) {
    return null;
  }
  if (!resp.headers.get("content-type")?.startsWith(JSON_API_MEDIA_TYPE)) {
    throw InvalidServerResponseError(resp);
  }
  if (!resp.ok) {
    const errorDoc = (await resp.json()) as AtomicOperationsDocument;
    if (errorDoc.errors != null) {
      throw new ApiError(errorDoc.errors);
    }
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as Promise<AtomicOperationsDocument>;
}
