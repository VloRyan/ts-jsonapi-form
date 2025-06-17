import { ObjectLike } from "../jsonapi/model/Types.ts";

export const useFilter = () => {
  const search = window.location.search;
  const filter: ObjectLike = {};
  if (!search) {
    return filter;
  }
  search
    .split("&")
    .filter((value) => value.startsWith("filter["))
    .forEach((value) => {
      const parts = value.split("=");
      const name = parts[0].substring("filter[".length, parts[0].length - 1);
      filter[name] = parts[1];
    });
  return filter;
};
