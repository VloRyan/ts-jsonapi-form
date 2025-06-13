import { useSearch } from "wouter";
import { extractPage } from "../functions/page.ts";

export const usePage = () => {
  const searchString = useSearch();
  return extractPage(searchString);
};
