import { Document as APIDocument, Included } from "./model/Document.ts";
import { ApiError } from "./model/ApiError.ts";
import { StatusCodes } from "http-status-codes";
import { ResourceIdentifierObject, ResourceObject } from "./model/Objects.ts";
import { ObjectLike } from "./model/Types.ts";

export const MEDIA_TYPE = "application/vnd.api+json";

export interface FetchOpts {
  page?: Page;
  filter?: object;
  includes?: string[];
  sort?: string;
}

export interface Page {
  limit: number | undefined;
  offset: number | undefined;
}

async function callApi(method: string, url: string, body?: APIDocument) {
  return fetch(url, {
    method: method,
    headers: {
      "Content-Type": MEDIA_TYPE,
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (resp) => {
    if (resp.status == StatusCodes.NO_CONTENT) {
      return null;
    }
    if (!resp.headers.get("content-type")?.startsWith(MEDIA_TYPE)) {
      throw InvalidServerResponseError(resp);
    }
    const doc = (await resp.json()) as APIDocument;
    if (!resp.ok) {
      if (!doc.errors) {
        throw new Error(
          "Unknown server error: " + resp.status + " - " + resp.statusText,
        );
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
    arr.push(name + "=" + obj);
    return;
  }
  for (const key in obj) {
    const v = obj[key];
    if (!v) {
      continue;
    }
    arr.push(name + "[" + key + "]=" + v);
  }
}

export function InvalidServerResponseError(response: Response) {
  return new ApiError([
    {
      title:
        "Invalid server response: [" +
        response.status +
        "] - " +
        response.statusText,
      detail: "Header: " + JSON.stringify(response.headers.entries()),
    },
  ]);
}

export function findInclude(id: ResourceIdentifierObject, includes: Included) {
  for (const obj of includes) {
    if (obj.id === id.id && obj.type === id.type) {
      return obj;
    }
  }
  return null;
}

export function findIncludes(
  ids: ResourceIdentifierObject[],
  includes: Included,
) {
  const result: ResourceObject[] = [];
  for (const obj of includes) {
    for (const id of ids) {
      if (obj.id === id.id && obj.type === id.type) {
        result.push(obj);
      }
    }
  }
  return result;
}

export function toParamFamily(name: string, o: ObjectLike): string {
  let params = "";
  for (const k in o) {
    if (params.length > 0) {
      params += "&";
    }
    params += `${name}[` + k + "]=" + o[k];
  }
  return params;
}
