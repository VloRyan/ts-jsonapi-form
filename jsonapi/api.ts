import {
  ApiError,
  type Document as APIDocument,
  type ErrorObject,
} from "@jsonapi/model";
import { StatusCodes } from "http-status-codes";
import { type FetchOpts, JSONAPI_MEDIA_TYPE } from "@jsonapi/model/Request";

async function callApi(method: string, url: string, body?: APIDocument) {
  return fetch(url, {
    method: method,
    headers: {
      "Content-Type": JSONAPI_MEDIA_TYPE,
    },
    body: body ? JSON.stringify(body) : null,
  }).then(async (resp) => {
    if (resp.status == StatusCodes.NO_CONTENT) {
      return null;
    }
    if (!resp.headers.get("Content-Type")?.startsWith(JSONAPI_MEDIA_TYPE)) {
      throw newInvalidServerResponseError(resp);
    }
    const doc = (await resp.json()) as APIDocument;
    if (doc.data && doc.errors) {
      throw newDataAndErrorsError(resp);
    }
    if (!resp.ok) {
      if (!doc.errors) {
        throw newInvalidServerResponseError(resp);
      }
      throw new ApiError(doc.errors);
    }
    return doc;
  });
}

export async function fetchResource(url: string, opts?: FetchOpts) {
  return await callApi("GET", url + buildQueryString(opts));
}

export async function deleteResource(url: string, opts?: FetchOpts) {
  return callApi("DELETE", url + buildQueryString(opts));
}

export async function createResource(url: string, body: APIDocument) {
  return callApi("POST", url, body);
}

export async function updateResource(url: string, body: APIDocument) {
  return callApi("PATCH", url, body);
}

export function buildQueryString(opts?: FetchOpts) {
  const query: string[] = [];
  if (opts != undefined) {
    pushObject(query, opts.page, "page");
    pushObject(query, opts.filter, "filter");
    if (opts.includes != undefined) {
      pushObject(query, opts.includes.join(","), "include");
    }
    if (opts.sort != undefined) {
      pushObject(query, opts.sort, "sort");
    }
  }
  return query.length > 0 ? "?" + query.join("&") : "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pushObject(arr: Array<string>, obj: any, name: string) {
  if (obj == undefined || obj === "") {
    return;
  }
  if (typeof obj === "string" || obj instanceof String) {
    arr.push(name + "=" + encodeURIComponent(obj as string));
    return;
  }
  for (const key in obj) {
    const v = obj[key];
    if (v == undefined) {
      continue;
    }
    arr.push(name + "[" + key + "]=" + encodeURIComponent(v));
  }
}

export function newInvalidServerResponseError(response: Response) {
  const headers = JSON.stringify(response.headers.entries());
  const apiError: ErrorObject = {
    title: `Invalid server response: ${response.status} - ${response.statusText}`,
    status: response.status.toString(),
  };
  if (headers) {
    apiError.detail = `Headers: ${headers}`;
  }
  return new ApiError([apiError]);
}

export function newDataAndErrorsError(response: Response) {
  return new ApiError([
    {
      title: `Server returned data and errors`,
      status: response.status.toString(),
    },
  ]);
}
