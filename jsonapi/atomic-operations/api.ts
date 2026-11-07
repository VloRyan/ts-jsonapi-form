import type {
  AtomicOperationsDocument,
  AtomicResultsDocument,
} from "@jsonapi/atomic-operations/model";

import { newInvalidServerResponseError } from "@jsonapi/api";
import { ApiError } from "@jsonapi/model";
import { StatusCodes } from "http-status-codes";
import { JSONAPI_MEDIA_TYPE } from "@jsonapi/model/Request";

export const JSONAPI_ATOMIC_MEDIA_TYPE =
  'application/vnd.api+json;ext="https://jsonapi.org/ext/atomic"';

export async function postOperations(
  url: string,
  doc: AtomicOperationsDocument,
) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": JSONAPI_ATOMIC_MEDIA_TYPE,
    },
    body: JSON.stringify(doc),
  });
  if (resp.status == StatusCodes.NO_CONTENT) {
    return null;
  }
  if (!resp.headers.get("Content-Type")?.startsWith(JSONAPI_MEDIA_TYPE)) {
    throw newInvalidServerResponseError(resp);
  }
  const resultsDoc = (await resp.json()) as AtomicResultsDocument;
  if (resultsDoc["atomic:results"] && resultsDoc.errors) {
    throw newResultsAndErrorsError(resp);
  }
  if (!resp.ok) {
    if (resultsDoc.errors != null) {
      throw new ApiError(resultsDoc.errors);
    }
    throw new Error(resp.statusText);
  }
  return resultsDoc;
}

export function newResultsAndErrorsError(response: Response) {
  return new ApiError([
    {
      title: `Server returned results and errors`,
      status: response.status.toString(),
    },
  ]);
}
