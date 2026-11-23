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
    addQueryParam(query, "page", opts.page);
    addQueryParam(query, "filter", opts.filter);
    addQueryParam(query, `fields`, opts.fields);
    addQueryParam(query, "include", opts.includes);
    addQueryParam(query, "sort", opts.sort);
  }
  return query.length > 0 ? "?" + query.join("&") : "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addQueryParam(params: Array<string>, name: string, v: any) {
  if (v === undefined || v === "") {
    return;
  }
  switch (typeof v) {
    case "string":
    case "boolean":
    case "number":
      params.push(`${name}=${encodeURIComponent(v)}`);
      return;
    case "object":
      if (isArrayOfStrings(v)) {
        params.push(`${name}=${v.map((e) => encodeURIComponent(e)).join(",")}`);
        return;
      }
      if (name.endsWith("]")) {
        // no sub members
        return;
      }
      for (const key in v) {
        addQueryParam(params, `${name}[${key}]`, v[key]);
      }
      break;
  }
}

function isArrayOfStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
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
