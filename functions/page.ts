import type { Document } from "../jsonapi/model/";

export interface PageMetaData {
  limit: number;
  offset: number;
  sort: string;
  total: number;
}
export function extractPaginationMetaData(doc: Document | null) {
  if (!doc || !doc.meta) {
    return undefined;
  }
  return {
    limit: doc.meta["page[limit]"] as number,
    offset: doc.meta["page[offset]"] as number,
    sort: doc.meta["page[sort]"] as string,
    total: doc.meta["page[total]"] as number,
  } satisfies PageMetaData;
}
