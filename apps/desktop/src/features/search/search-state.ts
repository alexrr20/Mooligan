export type CatalogSearchState = {
  grid?: true;
  hideArtSeries?: true;
  query?: string;
  uniqueCards?: true;
};

export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearchState {
  const query = typeof search.query === "string" ? search.query.trim().slice(0, 100) : "";

  return {
    ...(search.grid === true && { grid: true as const }),
    ...(search.hideArtSeries === true && { hideArtSeries: true as const }),
    ...(query && { query }),
    ...(search.uniqueCards === true && { uniqueCards: true as const }),
  };
}
