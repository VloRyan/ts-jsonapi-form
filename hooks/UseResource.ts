import { fetchResource, opts } from "../jsonapi/JsonApi.ts";
import {
  CollectionResourceDoc,
  SingleResourceDoc,
} from "../jsonapi/model/Document.ts";
import { useQuery } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/query-core";

export interface QueryOpts {
  staleTime?: number;
  retry?: boolean | number;
}

export const useResource = (
  url: string,
  opts?: opts,
  queryOpts?: QueryOpts,
) => {
  const queryKey: QueryKey = [url, opts];

  const { data, isLoading, error } = useQuery({
    ...queryOpts,
    queryKey: queryKey,
    queryFn: async () => fetchResource(url, opts),
  });
  if (!data) {
    return { doc: null, isLoading, error, queryKey };
  }
  const doc = data as SingleResourceDoc;
  return { doc, isLoading, error, queryKey };
};

export function useResources(url: string, opts?: opts, queryOpts?: QueryOpts) {
  const queryKey = [url, opts];

  const { data, isLoading, error } = useQuery({
    ...queryOpts,
    queryKey: queryKey,
    queryFn: async () => fetchResource(url, opts),
  });
  if (!data) {
    return { doc: null, isLoading, error, queryKey };
  }
  const doc = data as CollectionResourceDoc;
  return { doc, isLoading, error, queryKey };
}
